const prisma = require('../prisma');

const VALID_CATEGORIES = ['WATCHLIST', 'FAVORITE', 'WATCHED', 'WATCHING', 'DROPPED'];

function normalizeCategory(value) {
    if (!value) return undefined;
    const v = String(value).toUpperCase();
    return VALID_CATEGORIES.includes(v) ? v : undefined;
}

exports.getLibrary = async (req, res) => {
    try {
        // Optional `?category=WATCHLIST|FAVORITE|WATCHED` filter. Without
        // it we return everything, sorted newest first.
        //
        // Resilience: when the `category` column doesn't exist yet (the
        // migration hasn't been deployed), Prisma raises P2022 on the
        // filter or on the SELECT. We retry without the column so the
        // page still loads.
        const category = normalizeCategory(req.query.category);
        try {
            const library = await prisma.libraryItem.findMany({
                where: {
                    userId: req.user.id,
                    ...(category ? { category } : {}),
                },
                orderBy: { addedAt: 'desc' },
            });
            return res.json(library);
        } catch (error) {
            if (error?.code === 'P2022') {
                console.warn('libraryItem.category column missing, falling back to legacy query');
                const library = await prisma.$queryRaw`
                    SELECT id, "userId", "tmdbId", "type", "name", "poster", "addedAt"
                    FROM "LibraryItem"
                    WHERE "userId" = ${req.user.id}
                    ORDER BY "addedAt" DESC
                `;
                return res.json(library);
            }
            throw error;
        }
    } catch (error) {
        console.error('Get library error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addToLibrary = async (req, res) => {
    try {
        const { tmdbId, type, name, poster } = req.body;
        const category = normalizeCategory(req.body.category) || 'WATCHLIST';

        const newItem = await prisma.libraryItem.create({
            data: {
                userId: req.user.id,
                tmdbId: String(tmdbId),
                type,
                name,
                poster,
                category,
            },
        });

        res.status(201).json(newItem);
    } catch (error) {
        // Unique constraint violation (P2002): the user already has this
        // item in some category. Move it to the new one instead of erroring.
        if (error.code === 'P2002') {
            const { tmdbId } = req.body;
            const category = normalizeCategory(req.body.category) || 'WATCHLIST';
            const updated = await prisma.libraryItem.updateMany({
                where: { userId: req.user.id, tmdbId: String(tmdbId) },
                data: { category },
            });
            if (updated.count > 0) {
                const item = await prisma.libraryItem.findFirst({
                    where: { userId: req.user.id, tmdbId: String(tmdbId) },
                });
                return res.status(200).json(item);
            }
            return res.status(400).json({ message: 'Item already in library' });
        }
        console.error('Add to library error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateLibraryItem = async (req, res) => {
    try {
        const { tmdbId } = req.params;
        const category = normalizeCategory(req.body.category);
        if (!category) {
            return res.status(400).json({ message: 'Invalid category' });
        }
        const result = await prisma.libraryItem.updateMany({
            where: { userId: req.user.id, tmdbId: String(tmdbId) },
            data: { category },
        });
        if (result.count === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        const item = await prisma.libraryItem.findFirst({
            where: { userId: req.user.id, tmdbId: String(tmdbId) },
        });
        res.json(item);
    } catch (error) {
        console.error('Update library item error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.removeFromLibrary = async (req, res) => {
    try {
        const { tmdbId } = req.params;

        const result = await prisma.libraryItem.deleteMany({
            where: {
                userId: req.user.id,
                tmdbId: String(tmdbId),
            },
        });

        if (result.count === 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        res.json({ message: 'Item removed' });
    } catch (error) {
        console.error('Remove from library error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

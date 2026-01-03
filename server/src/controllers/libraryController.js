const prisma = require('../prisma');

exports.getLibrary = async (req, res) => {
    try {
        const library = await prisma.libraryItem.findMany({
            where: { userId: req.user.id },
            orderBy: { addedAt: 'desc' }
        });
        res.json(library);
    } catch (error) {
        console.error('Get library error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.addToLibrary = async (req, res) => {
    try {
        const { tmdbId, type, name, poster } = req.body;

        // Check if customized ID format (e.g. tmdb:123) or raw ID
        // We treat tmdbId as string unique identifier provided by frontend

        const newItem = await prisma.libraryItem.create({
            data: {
                userId: req.user.id,
                tmdbId: String(tmdbId),
                type,
                name,
                poster
            }
        });

        res.status(201).json(newItem);
    } catch (error) {
        // Unique constraint violation (P2002)
        if (error.code === 'P2002') {
            return res.status(400).json({ message: 'Item already in library' });
        }
        console.error('Add to library error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.removeFromLibrary = async (req, res) => {
    try {
        const { tmdbId } = req.params;

        // We must use deleteMany because we are deleting by (userId, tmdbId) composite,
        // or we could use the unique constraint but deleteMany is safe if we filter by userId.
        // Actually, since we don't have primary key 'id' in the route params (we have tmdbId),
        // and we want to ensure we only delete THIS user's item:

        // Using deleteMany is simplest/related to how we find it.
        const result = await prisma.libraryItem.deleteMany({
            where: {
                userId: req.user.id,
                tmdbId: String(tmdbId)
            }
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

const prisma = require('../prisma');
const logger = require('../utils/logger');

/**
 * GET /api/featured
 * Public — returns the currently active featured row (if any).
 *
 * "Active" means isActive=true AND now is between startsAt and endsAt
 * (endsAt may be null = no end). When multiple rows match we prefer
 * the most recently created one so admins can simply add a new entry
 * to override.
 */
exports.getActiveFeatured = async (_req, res) => {
    try {
        const now = new Date();
        const item = await prisma.featuredContent.findFirst({
            where: {
                isActive: true,
                startsAt: { lte: now },
                OR: [
                    { endsAt: null },
                    { endsAt: { gte: now } },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(item);
    } catch (error) {
        logger.error('getActiveFeatured error', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch featured content' });
    }
};

/** GET /api/admin/featured — list all entries for the admin editor. */
exports.adminListFeatured = async (_req, res) => {
    try {
        const items = await prisma.featuredContent.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(items);
    } catch (error) {
        logger.error('adminListFeatured error', { error: error.message });
        res.status(500).json({ error: 'Failed to list featured content' });
    }
};

/** POST /api/admin/featured */
exports.adminCreateFeatured = async (req, res) => {
    try {
        const {
            tmdbId, mediaType, title, description, banner, poster, badge,
            startsAt, endsAt, isActive,
        } = req.body;
        if (!tmdbId || !mediaType || !title) {
            return res.status(400).json({ error: 'tmdbId, mediaType, and title are required' });
        }
        const item = await prisma.featuredContent.create({
            data: {
                tmdbId: String(tmdbId),
                mediaType,
                title,
                description,
                banner,
                poster,
                badge,
                startsAt: startsAt ? new Date(startsAt) : new Date(),
                endsAt: endsAt ? new Date(endsAt) : null,
                isActive: isActive !== false,
            },
        });
        res.status(201).json(item);
    } catch (error) {
        logger.error('adminCreateFeatured error', { error: error.message });
        res.status(500).json({ error: 'Failed to create featured content' });
    }
};

/** PUT /api/admin/featured/:id */
exports.adminUpdateFeatured = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!id) return res.status(400).json({ error: 'Invalid id' });

        const { startsAt, endsAt, ...rest } = req.body;
        const data = { ...rest };
        if (startsAt !== undefined) data.startsAt = startsAt ? new Date(startsAt) : null;
        if (endsAt !== undefined) data.endsAt = endsAt ? new Date(endsAt) : null;

        const item = await prisma.featuredContent.update({ where: { id }, data });
        res.json(item);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Not found' });
        }
        logger.error('adminUpdateFeatured error', { error: error.message });
        res.status(500).json({ error: 'Failed to update featured content' });
    }
};

/** DELETE /api/admin/featured/:id */
exports.adminDeleteFeatured = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!id) return res.status(400).json({ error: 'Invalid id' });
        await prisma.featuredContent.delete({ where: { id } });
        res.json({ message: 'Deleted' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Not found' });
        }
        logger.error('adminDeleteFeatured error', { error: error.message });
        res.status(500).json({ error: 'Failed to delete featured content' });
    }
};

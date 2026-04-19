const prisma = require('../prisma');
const logger = require('../utils/logger');

exports.upload = async (req, res) => {
    try {
        const { tmdbId, mediaType, seasonNumber, episodeNumber, language, fileName, content } = req.body;

        if (!tmdbId || !language || !fileName || !content) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const subtitle = await prisma.customSubtitle.create({
            data: {
                userId: req.user.id,
                tmdbId: String(tmdbId),
                mediaType: mediaType || 'movie',
                seasonNumber: seasonNumber || null,
                episodeNumber: episodeNumber || null,
                language,
                fileName,
                content,
                status: 'PENDING',
            },
        });

        res.status(201).json({ id: subtitle.id, status: subtitle.status });
    } catch (error) {
        logger.error('Upload custom subtitle error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to upload subtitle' });
    }
};

exports.getApproved = async (req, res) => {
    try {
        const { tmdbId, seasonNumber, episodeNumber } = req.query;

        if (!tmdbId) {
            return res.status(400).json({ error: 'tmdbId required' });
        }

        const where = {
            tmdbId: String(tmdbId),
            status: 'APPROVED',
        };

        if (seasonNumber) where.seasonNumber = parseInt(seasonNumber);
        if (episodeNumber) where.episodeNumber = parseInt(episodeNumber);

        const subtitles = await prisma.customSubtitle.findMany({
            where,
            select: {
                id: true,
                language: true,
                fileName: true,
                content: true,
                user: { select: { name: true } },
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(subtitles);
    } catch (error) {
        logger.error('Get approved subtitles error', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch subtitles' });
    }
};

exports.adminGetAll = async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        const where = {};
        if (status) where.status = status;

        const [subtitles, total] = await Promise.all([
            prisma.customSubtitle.findMany({
                where,
                include: {
                    user: { select: { name: true, email: true } },
                },
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset),
            }),
            prisma.customSubtitle.count({ where }),
        ]);

        res.json({ subtitles, total });
    } catch (error) {
        logger.error('Admin get subtitles error', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch subtitles' });
    }
};

exports.adminUpdateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const subtitle = await prisma.customSubtitle.update({
            where: { id: parseInt(id) },
            data: { status },
        });

        await prisma.adminAction.create({
            data: {
                adminId: req.user.id,
                adminEmail: req.user.email,
                action: `SUBTITLE_${status}`,
                targetId: subtitle.id,
                targetType: 'CUSTOM_SUBTITLE',
                description: `${status} subtitle "${subtitle.fileName}" for tmdbId ${subtitle.tmdbId}`,
            },
        });

        res.json(subtitle);
    } catch (error) {
        logger.error('Admin update subtitle status error', { error: error.message });
        res.status(500).json({ error: 'Failed to update subtitle status' });
    }
};

exports.adminDelete = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.customSubtitle.delete({ where: { id: parseInt(id) } });
        res.json({ message: 'Deleted' });
    } catch (error) {
        logger.error('Admin delete subtitle error', { error: error.message });
        res.status(500).json({ error: 'Failed to delete subtitle' });
    }
};

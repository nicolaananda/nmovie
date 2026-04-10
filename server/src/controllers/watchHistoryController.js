const prisma = require('../prisma');
const logger = require('../utils/logger');

// Get watch history
exports.getWatchHistory = async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;

        const history = await prisma.watchHistory.findMany({
            where: { userId: req.user.id },
            orderBy: { lastWatchedAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });

        const total = await prisma.watchHistory.count({
            where: { userId: req.user.id },
        });

        res.json({ history, total });
    } catch (error) {
        logger.error('Get watch history error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to fetch watch history' });
    }
};

// Get continue watching (incomplete items)
exports.getContinueWatching = async (req, res) => {
    try {
        const continueWatching = await prisma.watchHistory.findMany({
            where: {
                userId: req.user.id,
                completed: false,
                progress: { gt: 0 },
            },
            orderBy: { lastWatchedAt: 'desc' },
            take: 20,
        });

        res.json(continueWatching);
    } catch (error) {
        logger.error('Get continue watching error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to fetch continue watching' });
    }
};

// Update watch progress
exports.updateWatchProgress = async (req, res) => {
    try {
        const { tmdbId, type, name, poster, seasonNumber, episodeNumber, progress, duration } = req.body;

        const completed = duration ? (progress / duration) >= 0.9 : false;

        const watchHistory = await prisma.watchHistory.upsert({
            where: {
                userId_tmdbId_seasonNumber_episodeNumber: {
                    userId: req.user.id,
                    tmdbId,
                    seasonNumber: seasonNumber || null,
                    episodeNumber: episodeNumber || null,
                },
            },
            update: {
                progress,
                duration,
                completed,
                lastWatchedAt: new Date(),
            },
            create: {
                userId: req.user.id,
                tmdbId,
                type,
                name,
                poster,
                seasonNumber,
                episodeNumber,
                progress,
                duration,
                completed,
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                type: completed ? 'WATCH_COMPLETE' : 'WATCH_START',
                description: `${completed ? 'Completed' : 'Watched'} ${type}: ${name}`,
                metadata: JSON.stringify({ tmdbId, seasonNumber, episodeNumber }),
                ipAddress: req.ip,
            },
        });

        res.json(watchHistory);
    } catch (error) {
        logger.error('Update watch progress error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to update watch progress' });
    }
};

// Get watch progress for specific content
exports.getWatchProgress = async (req, res) => {
    try {
        const { tmdbId } = req.params;
        const { seasonNumber, episodeNumber } = req.query;

        const progress = await prisma.watchHistory.findUnique({
            where: {
                userId_tmdbId_seasonNumber_episodeNumber: {
                    userId: req.user.id,
                    tmdbId,
                    seasonNumber: seasonNumber ? parseInt(seasonNumber) : null,
                    episodeNumber: episodeNumber ? parseInt(episodeNumber) : null,
                },
            },
        });

        res.json(progress || { progress: 0, completed: false });
    } catch (error) {
        logger.error('Get watch progress error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to fetch watch progress' });
    }
};

// Clear watch history
exports.clearWatchHistory = async (req, res) => {
    try {
        await prisma.watchHistory.deleteMany({
            where: { userId: req.user.id },
        });

        res.json({ message: 'Watch history cleared' });
    } catch (error) {
        logger.error('Clear watch history error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to clear watch history' });
    }
};

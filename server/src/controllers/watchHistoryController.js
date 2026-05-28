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
        const sn = seasonNumber != null ? seasonNumber : 0;
        const en = episodeNumber != null ? episodeNumber : 0;

        const existing = await prisma.watchHistory.findFirst({
            where: {
                userId: req.user.id,
                tmdbId,
                seasonNumber: sn,
                episodeNumber: en,
            },
        });

        let watchHistory;
        if (existing) {
            watchHistory = await prisma.watchHistory.update({
                where: { id: existing.id },
                data: {
                    progress,
                    duration,
                    completed,
                    lastWatchedAt: new Date(),
                },
            });
        } else {
            watchHistory = await prisma.watchHistory.create({
                data: {
                    userId: req.user.id,
                    tmdbId,
                    type,
                    name,
                    poster,
                    seasonNumber: sn,
                    episodeNumber: en,
                    progress,
                    duration,
                    completed,
                },
            });
        }

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

        const sn = seasonNumber ? parseInt(seasonNumber) : 0;
        const en = episodeNumber ? parseInt(episodeNumber) : 0;

        const progress = await prisma.watchHistory.findFirst({
            where: {
                userId: req.user.id,
                tmdbId,
                seasonNumber: sn,
                episodeNumber: en,
            },
        });

        res.json(progress || { progress: 0, completed: false });
    } catch (error) {
        logger.error('Get watch progress error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to fetch watch progress' });
    }
};

// Get all per-episode progress for one series.
// Used by the series detail page to render watched / in-progress markers
// next to each episode in the list.
exports.getSeriesProgress = async (req, res) => {
    try {
        const { tmdbId } = req.params;

        const rows = await prisma.watchHistory.findMany({
            where: {
                userId: req.user.id,
                tmdbId,
            },
            select: {
                seasonNumber: true,
                episodeNumber: true,
                progress: true,
                duration: true,
                completed: true,
                lastWatchedAt: true,
            },
        });

        // Return as a map keyed by "sXeY" so the frontend can do an O(1) lookup.
        const map = {};
        for (const r of rows) {
            if (!r.seasonNumber || !r.episodeNumber) continue;
            map[`s${r.seasonNumber}e${r.episodeNumber}`] = {
                progress: r.progress,
                duration: r.duration,
                completed: r.completed,
                lastWatchedAt: r.lastWatchedAt,
            };
        }

        res.json(map);
    } catch (error) {
        logger.error('Get series progress error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to fetch series progress' });
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

// Remove a single watch history entry by id (must belong to the user).
exports.removeWatchHistoryEntry = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (!id) return res.status(400).json({ error: 'Invalid id' });

        const existing = await prisma.watchHistory.findUnique({ where: { id } });
        if (!existing || existing.userId !== req.user.id) {
            return res.status(404).json({ error: 'Not found' });
        }

        await prisma.watchHistory.delete({ where: { id } });
        res.json({ message: 'Removed' });
    } catch (error) {
        logger.error('Remove watch history entry error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to remove watch history entry' });
    }
};

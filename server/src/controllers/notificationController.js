const prisma = require('../prisma');
const logger = require('../utils/logger');

// Get user notifications
exports.getNotifications = async (req, res) => {
    try {
        const { limit = 20, offset = 0, unreadOnly = false } = req.query;

        const where = { userId: req.user.id };
        if (unreadOnly === 'true') {
            where.isRead = false;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: req.user.id, isRead: false },
        });

        res.json({ notifications, unreadCount });
    } catch (error) {
        logger.error('Get notifications error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.notification.update({
            where: {
                id: parseInt(id),
                userId: req.user.id,
            },
            data: { isRead: true },
        });

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        logger.error('Mark notification as read error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to mark notification as read' });
    }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId: req.user.id,
                isRead: false,
            },
            data: { isRead: true },
        });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        logger.error('Mark all as read error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.notification.delete({
            where: {
                id: parseInt(id),
                userId: req.user.id,
            },
        });

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        logger.error('Delete notification error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};

// Create notification (internal use)
exports.createNotification = async (userId, type, title, message) => {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
            },
        });
    } catch (error) {
        logger.error('Create notification error', { error: error.message, userId });
    }
};

const prisma = require('../prisma');
const logger = require('../utils/logger');
const { createNotification } = require('./notificationController');

// Get dashboard analytics
exports.getAnalytics = async (req, res) => {
    try {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            pendingUsers,
            activeSubscriptions,
            expiredSubscriptions,
            totalWatchTime,
            recentActivity,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { status: 'PENDING' } }),
            prisma.user.count({
                where: {
                    status: 'APPROVED',
                    subscriptionEndsAt: { gte: now },
                },
            }),
            prisma.user.count({
                where: {
                    status: 'APPROVED',
                    subscriptionEndsAt: { lt: now },
                },
            }),
            prisma.watchHistory.aggregate({
                _sum: { progress: true },
            }),
            prisma.activityLog.count({
                where: { createdAt: { gte: thirtyDaysAgo } },
            }),
        ]);

        // Most watched content
        const mostWatched = await prisma.watchHistory.groupBy({
            by: ['tmdbId', 'name', 'type'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });

        res.json({
            totalUsers,
            pendingUsers,
            activeSubscriptions,
            expiredSubscriptions,
            totalWatchTimeHours: Math.round((totalWatchTime._sum.progress || 0) / 3600),
            recentActivity,
            mostWatched,
        });
    } catch (error) {
        logger.error('Get analytics error', { error: error.message, adminId: req.user.id });
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
};

// Get all users with filters
exports.getUsers = async (req, res) => {
    try {
        const { status, role, search, limit = 50, offset = 0 } = req.query;

        const where = {};
        if (status) where.status = status;
        if (role) where.role = role;
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    status: true,
                    subscriptionEndsAt: true,
                    subscriptionPlan: true,
                    lastLoginAt: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset),
            }),
            prisma.user.count({ where }),
        ]);

        res.json({ users, total });
    } catch (error) {
        logger.error('Get users error', { error: error.message, adminId: req.user.id });
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
    const { id } = req.params;
    const { status, durationMonths } = req.body;

    try {
        let updateData = { status };

        if (status === 'APPROVED' && durationMonths) {
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));
            updateData.subscriptionEndsAt = endDate;
        }

        if (req.body.subscriptionEndsAt) {
            updateData.subscriptionEndsAt = new Date(req.body.subscriptionEndsAt);
        }

        const user = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: { id: true, email: true, status: true, subscriptionEndsAt: true },
        });

        // Create notification
        if (status === 'APPROVED') {
            await createNotification(
                user.id,
                'APPROVAL',
                'Account Approved',
                `Your account has been approved! Your subscription is valid until ${user.subscriptionEndsAt?.toLocaleDateString()}.`
            );
        } else if (status === 'REJECTED') {
            await createNotification(
                user.id,
                'APPROVAL',
                'Account Status Update',
                'Your account registration has been reviewed. Please contact support for more information.'
            );
        }

        // Log admin action
        await prisma.adminAction.create({
            data: {
                adminId: req.user.id,
                adminEmail: req.user.email,
                action: 'UPDATE_USER_STATUS',
                targetId: user.id,
                targetType: 'USER',
                description: `Updated user ${user.email} status to ${status}`,
                metadata: JSON.stringify({ status, durationMonths }),
            },
        });

        res.json(user);
    } catch (error) {
        logger.error('Update user status error', { error: error.message, adminId: req.user.id });
        res.status(500).json({ error: 'Failed to update user status' });
    }
};

// Bulk approve users
exports.bulkApproveUsers = async (req, res) => {
    try {
        const { userIds, durationMonths } = req.body;

        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + parseInt(durationMonths));

        await prisma.user.updateMany({
            where: { id: { in: userIds.map(id => parseInt(id)) } },
            data: {
                status: 'APPROVED',
                subscriptionEndsAt: endDate,
            },
        });

        // Create notifications for all users
        for (const userId of userIds) {
            await createNotification(
                parseInt(userId),
                'APPROVAL',
                'Account Approved',
                `Your account has been approved! Your subscription is valid until ${endDate.toLocaleDateString()}.`
            );
        }

        // Log admin action
        await prisma.adminAction.create({
            data: {
                adminId: req.user.id,
                adminEmail: req.user.email,
                action: 'BULK_APPROVE_USERS',
                description: `Bulk approved ${userIds.length} users`,
                metadata: JSON.stringify({ userIds, durationMonths }),
            },
        });

        res.json({ message: `${userIds.length} users approved successfully` });
    } catch (error) {
        logger.error('Bulk approve error', { error: error.message, adminId: req.user.id });
        res.status(500).json({ error: 'Failed to bulk approve users' });
    }
};

// Delete user
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: { email: true },
        });

        await prisma.user.delete({ where: { id: parseInt(id) } });

        // Log admin action
        await prisma.adminAction.create({
            data: {
                adminId: req.user.id,
                adminEmail: req.user.email,
                action: 'DELETE_USER',
                targetId: parseInt(id),
                targetType: 'USER',
                description: `Deleted user ${user.email}`,
            },
        });

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error('Delete user error', { error: error.message, adminId: req.user.id });
        res.status(500).json({ error: 'Failed to delete user' });
    }
};

// Get activity logs
exports.getActivityLogs = async (req, res) => {
    try {
        const { userId, type, limit = 100, offset = 0 } = req.query;

        const where = {};
        if (userId) where.userId = parseInt(userId);
        if (type) where.type = type;

        const [logs, total] = await Promise.all([
            prisma.activityLog.findMany({
                where,
                include: {
                    user: {
                        select: { email: true, name: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset),
            }),
            prisma.activityLog.count({ where }),
        ]);

        res.json({ logs, total });
    } catch (error) {
        logger.error('Get activity logs error', { error: error.message, adminId: req.user.id });
        res.status(500).json({ error: 'Failed to fetch activity logs' });
    }
};

// Get admin actions
exports.getAdminActions = async (req, res) => {
    try {
        const { limit = 100, offset = 0 } = req.query;

        const [actions, total] = await Promise.all([
            prisma.adminAction.findMany({
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset),
            }),
            prisma.adminAction.count(),
        ]);

        res.json({ actions, total });
    } catch (error) {
        logger.error('Get admin actions error', { error: error.message, adminId: req.user.id });
        res.status(500).json({ error: 'Failed to fetch admin actions' });
    }
};

// Get user details with full info
exports.getUserDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            include: {
                subscriptionPlan: true,
                library: { take: 10, orderBy: { addedAt: 'desc' } },
                watchHistory: { take: 10, orderBy: { lastWatchedAt: 'desc' } },
                activityLogs: { take: 20, orderBy: { createdAt: 'desc' } },
                devices: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        logger.error('Get user details error', { error: error.message, adminId: req.user.id });
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};


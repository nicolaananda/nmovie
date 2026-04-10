const prisma = require('../prisma');
const logger = require('../utils/logger');

// Get user profile
exports.getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
                subscriptionEndsAt: true,
                subscriptionPlan: true,
                lastLoginAt: true,
                createdAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        logger.error('Get profile error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
    try {
        const { name } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: { name },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                status: true,
            },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                type: 'PROFILE_UPDATE',
                description: 'Updated profile information',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            },
        });

        res.json(user);
    } catch (error) {
        logger.error('Update profile error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const bcrypt = require('bcryptjs');

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword },
        });

        // Log activity
        await prisma.activityLog.create({
            data: {
                userId: req.user.id,
                type: 'PASSWORD_CHANGE',
                description: 'Changed password',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            },
        });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        logger.error('Change password error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to change password' });
    }
};

// Get user devices
exports.getDevices = async (req, res) => {
    try {
        const devices = await prisma.userDevice.findMany({
            where: { userId: req.user.id },
            orderBy: { lastUsedAt: 'desc' },
        });

        res.json(devices);
    } catch (error) {
        logger.error('Get devices error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to fetch devices' });
    }
};

// Remove device
exports.removeDevice = async (req, res) => {
    try {
        const { deviceId } = req.params;

        await prisma.userDevice.delete({
            where: {
                deviceId,
                userId: req.user.id,
            },
        });

        res.json({ message: 'Device removed successfully' });
    } catch (error) {
        logger.error('Remove device error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Failed to remove device' });
    }
};

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const logger = require('../utils/logger');
const { createNotification } = require('./notificationController');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await prisma.user.findUnique({
            where: { email },
        });

        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // First user is Admin
        const userCount = await prisma.user.count();
        const role = userCount === 0 ? 'ADMIN' : 'USER';
        const status = role === 'ADMIN' ? 'APPROVED' : 'PENDING';

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                status,
            },
        });

        if (user) {
            // Create welcome notification
            await createNotification(
                user.id,
                'SYSTEM',
                'Welcome to Nuvio!',
                status === 'PENDING'
                    ? 'Your account is pending approval. You will be notified once approved.'
                    : 'Welcome! Your account is ready to use.'
            );

            // Log activity
            await prisma.activityLog.create({
                data: {
                    userId: user.id,
                    type: 'LOGIN',
                    description: 'Account created',
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });

            logger.info('User registered', { userId: user.id, email: user.email });

            res.status(201).json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                token: generateToken(user.id),
            });
        } else {
            res.status(400).json({ error: 'Invalid user data' });
        }
    } catch (error) {
        logger.error('Register error', { error: error.message });
        res.status(500).json({ error: 'Server error' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (user && (await bcrypt.compare(password, user.password))) {
            // Update last login
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    lastLoginAt: new Date(),
                    lastLoginIp: req.ip,
                },
            });

            // Log activity
            await prisma.activityLog.create({
                data: {
                    userId: user.id,
                    type: 'LOGIN',
                    description: 'User logged in',
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });

            logger.info('User logged in', { userId: user.id, email: user.email });

            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                subscriptionEndsAt: user.subscriptionEndsAt,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        logger.error('Login error', { error: error.message });
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getMe = async (req, res) => {
    res.json(req.user);
};

exports.updateMe = async (req, res) => {
    const { name } = req.body;
    try {
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: { name },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                status: true,
            },
        });
        res.json(updatedUser);
    } catch (error) {
        logger.error('Update profile error', { error: error.message, userId: req.user.id });
        res.status(500).json({ error: 'Server error' });
    }
};

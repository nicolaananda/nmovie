const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, status: true, name: true, subscriptionEndsAt: true }
        });

        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }

        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Not authorized, token failed' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        next();
    } else {
        res.status(403).json({ error: 'Not authorized as admin' });
    }
};

const approved = (req, res, next) => {
    if (req.user && req.user.status === 'APPROVED') {
        next();
    } else {
        res.status(403).json({ error: 'Account pending approval or rejected' });
    }
};

const checkSubscription = (req, res, next) => {
    // Admins bypass subscription check
    if (req.user && req.user.role === 'ADMIN') {
        return next();
    }

    // Check if subscription exists and is active
    if (!req.user.subscriptionEndsAt || new Date(req.user.subscriptionEndsAt) < new Date()) {
        return res.status(403).json({ error: 'Subscription expired or inactive' });
    }

    next();
};

module.exports = { protect, admin, approved, checkSubscription };

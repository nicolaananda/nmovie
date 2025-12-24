const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

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
        console.error('Register error:', error);
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
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                token: generateToken(user.id),
            });
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Login error:', error);
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
            }
        });
        res.json(updatedUser);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

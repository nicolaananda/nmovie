const bcrypt = require('bcryptjs');
const crypto = require('crypto');
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
    // Sanitize inputs
    const rawName = (req.body.name || '').toString().trim();
    const rawEmail = (req.body.email || '').toString().trim();
    const rawPassword = (req.body.password || '').toString().trim();

    try {
        // Basic validations
        if (!rawName || rawName.length < 2) {
            return res.status(400).json({ error: 'Name must be at least 2 characters' });
        }
        if (!/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(rawEmail)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        if (!rawPassword || rawPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const email = rawEmail;
        const name = rawName;
        const password = rawPassword;

        const userExists = await prisma.user.findUnique({
            where: { email },
        });

        if (userExists) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userCount = await prisma.user.count();
        const isFirstUser = userCount === 0;
        const role = isFirstUser ? 'ADMIN' : 'USER';

        // Trial policy:
        //  - First user becomes ADMIN, no trial expiry.
        //  - Otherwise, give a `TRIAL_DAYS` (default 30) approved trial.
        //    Donation-supported model: we approve up front and let admins
        //    manually revoke if needed.
        //
        // We deliberately do NOT auto-attach a SubscriptionPlan record
        // here. Plans are admin-managed paid/donor tiers; setting one on
        // a free trial would mislead reporting. Admins attach a plan
        // when a donation is received via the supporter flow.
        const trialDays = parseInt(process.env.TRIAL_DAYS || '30');
        const autoApprove = (process.env.AUTO_APPROVE_TRIAL || 'true') !== 'false';

        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + trialDays);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role,
                status: isFirstUser || autoApprove ? 'APPROVED' : 'PENDING',
                subscriptionEndsAt: isFirstUser ? null : trialEnd,
            },
        });

        if (user) {
            await createNotification(
                user.id,
                'SYSTEM',
                'Welcome to N-Movie!',
                isFirstUser
                    ? 'Welcome! Your admin account is ready.'
                    : autoApprove
                        ? `Welcome! You have a ${trialDays}-day trial. If you enjoy the app, consider supporting us via donation.`
                        : 'Your account is awaiting admin approval.',
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
                subscriptionEndsAt: user.subscriptionEndsAt,
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

// Forgot Password — manual admin handoff (no SMTP).
//
// We don't run an email server. Instead, when a user submits their email
// here we generate a reset token and notify all admins so they can:
//   1. See the request in their dashboard.
//   2. Verify the user's identity through whatever channel they use
//      (chat, the registered email, etc.).
//   3. Manually share the reset link with the user.
//
// Response is uniform regardless of whether the email exists, to avoid
// leaking which addresses are registered.
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken: token, resetTokenExpiry: expiry },
      });

      // Notify every admin so the request shows up in their bell + dashboard.
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });
      await Promise.all(
        admins.map((a) =>
          createNotification(
            a.id,
            'SYSTEM',
            'Password reset requested',
            `User ${user.email} requested a password reset. Open admin → users → ${user.id} to share the reset link.`,
          ),
        ),
      );

      logger.info('Password reset requested (manual handoff)', {
        userId: user.id,
        email: user.email,
      });
    }
    res.json({
      message:
        'Password reset request received. Please contact the admin if you do not get a response soon.',
    });
  } catch (error) {
    logger.error('Forgot password error', { error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Invalid token' });
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await prisma.user.findFirst({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null },
    });
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
};

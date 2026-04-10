const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { apiLimiter, authLimiter, scraperLimiter } = require('./middleware/rateLimiter');
const scraperRoutes = require('./routes/scraperRoutes');
const subtitleRoutes = require('./routes/subtitleRoutes');

const app = express();

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:4173',
        'https://ghzm.us',
        'http://ghzm.us',
        'https://www.ghzm.us',
        'http://www.ghzm.us',
        'https://be-mov.nicola.id',
        'http://be-mov.nicola.id',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent'),
    });
    next();
});

// Apply rate limiting
app.use('/api/', apiLimiter);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/scrapers', scraperLimiter, scraperRoutes);
app.use('/api/subtitles', subtitleRoutes);
app.use('/api/auth', authLimiter, require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/library', require('./routes/libraryRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/watch-history', require('./routes/watchHistoryRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        error: err.message,
        stack: err.stack,
        path: req.path,
    });
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
});

module.exports = app;

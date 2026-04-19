const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { apiLimiter, authLimiter, scraperLimiter } = require('./middleware/rateLimiter');
const scraperRoutes = require('./routes/scraperRoutes');
const subtitleRoutes = require('./routes/subtitleRoutes');

const app = express();

// Trust proxy (Nginx/Docker reverse proxy)
app.set('trust proxy', 1);

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'http://localhost:7781',
        'https://ghzm.us',
        'https://www.ghzm.us',
        'https://api.ghzm.us',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200,
};

// Handle preflight OPTIONS for all routes
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: '2mb' }));

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
app.use('/api/custom-subtitles', require('./routes/customSubtitleRoutes'));

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

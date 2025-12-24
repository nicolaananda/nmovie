const express = require('express');
const cors = require('cors');
const scraperRoutes = require('./routes/scraperRoutes');
const subtitleRoutes = require('./routes/subtitleRoutes');

const app = express();

// CORS configuration
const corsOptions = {
    origin: [
        'http://localhost:3000',           // Local development
        'http://localhost:4173',           // Vite default
        'https://ghzm.us',                 // Production domain
        'http://ghzm.us',                  // Production domain (non-SSL)
        'https://www.ghzm.us',             // Production domain with www
        'http://www.ghzm.us',              // Production domain with www (non-SSL)
        'https://be-mov.nicola.id',        // Backend domain
        'http://be-mov.nicola.id',         // Backend domain (non-SSL)
    ],
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/scrapers', scraperRoutes);
app.use('/api/subtitles', subtitleRoutes);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/proxy', require('./routes/proxyRoutes'));

module.exports = app;

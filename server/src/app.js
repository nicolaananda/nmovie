const express = require('express');
const cors = require('cors');
const scraperRoutes = require('./routes/scraperRoutes');
const subtitleRoutes = require('./routes/subtitleRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/scrapers', scraperRoutes);
app.use('/api/subtitles', subtitleRoutes);
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

module.exports = app;

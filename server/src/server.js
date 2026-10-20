require('dotenv').config();
const app = require('./app');
const prisma = require('./prisma');

const PORT = process.env.PORT || 7001;

async function start() {
    try {
        // Test DB connection
        await prisma.$connect();
        console.log('✅ Connected to database');
        require('./episodeNotifications').startEpisodeChecks();

        app.listen(PORT, () => {
            console.log(`🚀 Nuvio Server running on http://localhost:${PORT}`);
            console.log(`📡 Ready to execute scrapers`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

start();

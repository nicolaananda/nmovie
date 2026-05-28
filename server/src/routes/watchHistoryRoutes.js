const router = require('express').Router();
const {
    getWatchHistory,
    getContinueWatching,
    updateWatchProgress,
    getWatchProgress,
    getSeriesProgress,
    clearWatchHistory,
    removeWatchHistoryEntry,
} = require('../controllers/watchHistoryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getWatchHistory);
router.get('/continue', getContinueWatching);
router.post('/progress', updateWatchProgress);
router.get('/progress/:tmdbId', getWatchProgress);
router.get('/series/:tmdbId/episodes', getSeriesProgress);
router.delete('/', clearWatchHistory);
router.delete('/:id', removeWatchHistoryEntry);

module.exports = router;

const router = require('express').Router();
const {
    getWatchHistory,
    getContinueWatching,
    updateWatchProgress,
    getWatchProgress,
    clearWatchHistory,
} = require('../controllers/watchHistoryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getWatchHistory);
router.get('/continue', getContinueWatching);
router.post('/progress', updateWatchProgress);
router.get('/progress/:tmdbId', getWatchProgress);
router.delete('/', clearWatchHistory);

module.exports = router;

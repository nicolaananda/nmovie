const router = require('express').Router();
const controller = require('../controllers/scraperController');
const { protect, approved } = require('../middleware/authMiddleware');

router.post('/', protect, approved, controller.getSubtitles);
router.get('/proxy', protect, approved, controller.getSubtitleProxy);

module.exports = router;

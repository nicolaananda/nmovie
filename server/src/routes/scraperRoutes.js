const router = require('express').Router();
const controller = require('../controllers/scraperController');
const { protect, approved, checkSubscription } = require('../middleware/authMiddleware');

router.post('/streams', protect, approved, checkSubscription, controller.getStreams);

module.exports = router;

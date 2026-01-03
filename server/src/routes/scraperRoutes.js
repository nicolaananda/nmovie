const router = require('express').Router();
const controller = require('../controllers/scraperController');
const { protect, checkSubscription } = require('../middleware/authMiddleware');

router.post('/streams', controller.getStreams);

module.exports = router;

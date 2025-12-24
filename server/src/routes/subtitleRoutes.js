const router = require('express').Router();
const controller = require('../controllers/scraperController');

router.post('/', controller.getSubtitles);
router.get('/proxy', controller.getSubtitleProxy);

module.exports = router;

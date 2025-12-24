const router = require('express').Router();
const controller = require('../controllers/scraperController');

router.post('/streams', controller.getStreams);

module.exports = router;

const router = require('express').Router();
const {
    getActiveFeatured,
} = require('../controllers/featuredController');

// Public route — anyone can see the current featured content.
router.get('/', getActiveFeatured);

module.exports = router;

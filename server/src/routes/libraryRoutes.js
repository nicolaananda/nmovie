const express = require('express');
const router = express.Router();
const libraryController = require('../controllers/libraryController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All library routes are protected

router.get('/', libraryController.getLibrary);
router.post('/', libraryController.addToLibrary);
router.delete('/:tmdbId', libraryController.removeFromLibrary);

module.exports = router;

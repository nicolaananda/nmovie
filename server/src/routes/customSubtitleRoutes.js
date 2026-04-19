const router = require('express').Router();
const { upload, getApproved, adminGetAll, adminUpdateStatus, adminDelete } = require('../controllers/customSubtitleController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', upload);
router.get('/approved', getApproved);

router.get('/admin', admin, adminGetAll);
router.put('/admin/:id/status', admin, adminUpdateStatus);
router.delete('/admin/:id', admin, adminDelete);

module.exports = router;

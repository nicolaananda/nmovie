const router = require('express').Router();
const {
    getAnalytics,
    getUsers,
    updateUserStatus,
    bulkApproveUsers,
    deleteUser,
    getActivityLogs,
    getAdminActions,
    getUserDetails,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/status', updateUserStatus);
router.post('/users/bulk-approve', bulkApproveUsers);
router.delete('/users/:id', deleteUser);
router.get('/activity-logs', getActivityLogs);
router.get('/admin-actions', getAdminActions);

module.exports = router;

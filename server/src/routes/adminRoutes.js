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
    updateUserRole,
    getSubscriptionPlans,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.post('/users/bulk-approve', bulkApproveUsers);
router.delete('/users/:id', deleteUser);
router.get('/activity-logs', getActivityLogs);
router.get('/admin-actions', getAdminActions);
router.post('/bulk-notify', require('../controllers/adminController').bulkNotify);

// Subscription plans
router.get('/subscription-plans', getSubscriptionPlans);
router.post('/subscription-plans', createSubscriptionPlan);
router.put('/subscription-plans/:id', updateSubscriptionPlan);
router.delete('/subscription-plans/:id', deleteSubscriptionPlan);

module.exports = router;

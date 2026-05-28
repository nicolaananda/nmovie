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
    setUserSupporter,
    generatePasswordResetLink,
} = require('../controllers/adminController');
const {
    adminListFeatured,
    adminCreateFeatured,
    adminUpdateFeatured,
    adminDeleteFeatured,
} = require('../controllers/featuredController');
const { protect, admin } = require('../middleware/authMiddleware');

router.use(protect);
router.use(admin);

router.get('/analytics', getAnalytics);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/supporter', setUserSupporter);
router.post('/users/:id/password-reset-link', generatePasswordResetLink);
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

// Featured / hero banner editor
router.get('/featured', adminListFeatured);
router.post('/featured', adminCreateFeatured);
router.put('/featured/:id', adminUpdateFeatured);
router.delete('/featured/:id', adminDeleteFeatured);

module.exports = router;

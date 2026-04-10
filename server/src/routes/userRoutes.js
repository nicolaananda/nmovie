const router = require('express').Router();
const {
    getProfile,
    updateProfile,
    changePassword,
    getDevices,
    removeDevice,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.get('/devices', getDevices);
router.delete('/devices/:deviceId', removeDevice);

module.exports = router;

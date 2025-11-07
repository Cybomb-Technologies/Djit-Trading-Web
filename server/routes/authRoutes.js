const express = require('express');
const { register, login, getMe, googleAuth, forgotPassword, verifyResetCode, resetPassword } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);
router.get('/me', auth, getMe);
// Add to authRoutes.js
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

module.exports = router;
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, forgotPassword, resetPassword, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', resetPassword);

// GET /api/auth/me
router.get('/me', authMiddleware, getMe);

module.exports = router;

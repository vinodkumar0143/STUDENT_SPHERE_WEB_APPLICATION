const express = require('express');
const router = express.Router();
const { createOrUpdateProfile, getProfile } = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// @route   POST /api/profile
// @desc    Create or update user profile with image supported
// @access  Private (Protects against missing Tokens)
// authMiddleware must run FIRST to attach req.user, then upload processes multiparts using req.user mappings
router.post('/', authMiddleware, upload.single('profileImage'), createOrUpdateProfile);

// @route   GET /api/profile
// @desc    Get current user profile
// @access  Private
router.get('/', authMiddleware, getProfile);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const profileController = require('../controllers/profileController');

// PATCH /api/profile — update own profile (auth required)
router.patch(
  '/',
  authMiddleware,
  [
    body('display_name').optional().trim().isLength({ min: 2, max: 30 }).withMessage('Display name must be 2–30 characters'),
    body('avatar_seed').optional().trim().notEmpty().withMessage('Avatar seed cannot be empty'),
    body('show_real_name').optional().isBoolean().withMessage('show_real_name must be boolean'),
  ],
  validate,
  profileController.updateProfile
);

// GET /api/profile/xp-history — own XP history
router.get('/xp-history', authMiddleware, profileController.getXpHistory);

// GET /api/profile/:displayName — public profile
router.get('/:displayName', profileController.getPublicProfile);

module.exports = router;

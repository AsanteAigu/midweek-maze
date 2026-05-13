const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const validate = require('../middleware/validate');
const authMiddleware = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/authController');

const VALID_LEVELS = [100, 200, 300, 400];
const VALID_COURSES = [
  'computer_engineering',
  'agriculture_engineering',
  'biomedical_engineering',
  'material_engineering',
  'food_processing',
];

// POST /api/auth/register
router.post(
  '/register',
  authLimiter,
  [
    body('student_id').trim().notEmpty().withMessage('Student ID is required'),
    body('first_name').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2–50 characters'),
    body('last_name').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2–50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('level').isInt().custom((v) => VALID_LEVELS.includes(parseInt(v))).withMessage('Level must be 100, 200, 300, or 400'),
    body('course').isIn(VALID_COURSES).withMessage('Invalid course selected'),
    body('display_name').trim().isLength({ min: 2, max: 30 }).withMessage('Display name must be 2–30 characters'),
    body('show_real_name').optional().isBoolean().withMessage('show_real_name must be boolean'),
    body('avatar_seed').trim().notEmpty().withMessage('Avatar seed is required'),
  ],
  validate,
  authController.register
);

// POST /api/auth/login
router.post(
  '/login',
  authLimiter,
  [
    body('display_name').trim().isLength({ min: 2, max: 30 }).withMessage('Custom name is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.login
);

// GET /api/auth/me
router.get('/me', authMiddleware, authController.getMe);

// POST /api/auth/logout
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const validate = require('../middleware/validate');
const { submissionLimiter } = require('../middleware/rateLimiter');
const submissionController = require('../controllers/submissionController');

// POST /api/submit — rate limited, auth required
router.post(
  '/',
  authMiddleware,
  submissionLimiter,
  [
    body('challenge_id').trim().notEmpty().withMessage('Challenge ID is required'),
    body('answer').trim().notEmpty().withMessage('Answer cannot be empty')
      .isLength({ max: 2000 }).withMessage('Answer cannot exceed 2000 characters'),
  ],
  validate,
  submissionController.submit
);

// GET /api/submit/me — student's own submissions
router.get('/me', authMiddleware, submissionController.getMySubmissions);

module.exports = router;

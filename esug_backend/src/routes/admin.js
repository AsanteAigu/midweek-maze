const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const validate = require('../middleware/validate');
const adminController = require('../controllers/adminController');

// Multer config — store in memory, limit 10MB for images
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPG, PNG, GIF, WebP)'), false);
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Challenge validation
// ─────────────────────────────────────────────────────────────────────────────
const challengeValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('challenge_type').isIn(['quiz', 'puzzle', 'problem']).withMessage('Type must be quiz, puzzle, or problem'),
  body('answer_mode').optional().isIn(['text', 'multiple_choice']).withMessage('Answer mode must be text or multiple_choice'),
  body('question_type').optional().isIn([
    'text', 'multiple_choice', 'true_false', 'fill_blank',
    'ordering', 'image_mcq', 'image_guess', 'image_only_mcq',
  ]).withMessage('Invalid question type'),
  body('answer_options').optional().isArray().withMessage('Answer options must be a list'),
  body('answer_options.*').optional().trim().isLength({ min: 1, max: 200 }).withMessage('Each answer option must be 1–200 characters'),
  body('answer_options').custom((options, { req }) => {
    if (req.body.answer_mode !== 'multiple_choice') return true;
    const cleanOptions = Array.isArray(options) ? options.map((option) => String(option).trim()).filter(Boolean) : [];
    if (cleanOptions.length < 2) {
      throw new Error('Multiple choice challenges need at least two answer options');
    }
    if (!cleanOptions.includes(String(req.body.answer_key || '').trim())) {
      throw new Error('Answer key must match one of the answer options');
    }
    return true;
  }),
  body('week_number').isInt({ min: 1 }).withMessage('Week number must be a positive integer'),
  body('opens_at').isISO8601().withMessage('opens_at must be a valid ISO date'),
  body('closes_at').isISO8601().withMessage('closes_at must be a valid ISO date'),
  body('xp_reward').optional().isInt({ min: 1 }).withMessage('XP reward must be a positive integer'),
  body('partial_xp').optional().isInt({ min: 0 }).withMessage('Partial XP must be zero or more'),
  // answer_key is optional when using the new has_questions model
  body('answer_key').optional().trim(),
];

// ─────────────────────────────────────────────────────────────────────────────
// Question validation
// ─────────────────────────────────────────────────────────────────────────────
const questionValidation = [
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced', 'general'])
    .withMessage('difficulty must be beginner, intermediate, advanced, or general'),
  body('question_type').isIn([
    'text', 'multiple_choice', 'true_false', 'fill_blank',
    'ordering', 'image_mcq', 'image_guess', 'image_only_mcq',
  ]).withMessage('Invalid question type'),
  body('question_text').trim().notEmpty().withMessage('question_text is required'),
  body('answer_key').trim().notEmpty().withMessage('answer_key is required'),
  body('options').optional().isArray().withMessage('options must be an array'),
  body('xp_value').optional().isInt({ min: 1 }).withMessage('xp_value must be a positive integer'),
  body('sort_order').optional().isInt({ min: 0 }),
];

const questionUpdateValidation = [
  body('difficulty').optional().isIn(['beginner', 'intermediate', 'advanced', 'general']),
  body('question_type').optional().isIn([
    'text', 'multiple_choice', 'true_false', 'fill_blank',
    'ordering', 'image_mcq', 'image_guess', 'image_only_mcq',
  ]),
  body('question_text').optional().trim().notEmpty(),
  body('answer_key').optional().trim().notEmpty(),
  body('options').optional().isArray(),
  body('xp_value').optional().isInt({ min: 1 }),
  body('sort_order').optional().isInt({ min: 0 }),
];

// ─────────────────────────────────────────────────────────────────────────────
// CHALLENGE routes
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/admin/challenges
router.post('/challenges', adminAuth, challengeValidation, validate, adminController.createChallenge);

// GET /api/admin/challenges
router.get('/challenges', adminAuth, adminController.listChallenges);

// GET /api/admin/challenges/:id
router.get('/challenges/:id', adminAuth, adminController.getChallenge);

// PATCH /api/admin/challenges/:id
router.patch('/challenges/:id', adminAuth, adminController.updateChallenge);

// POST /api/admin/challenges/:id/image
router.post('/challenges/:id/image', adminAuth, upload.single('image'), adminController.uploadImage);

// DELETE /api/admin/challenges/:id/image
router.delete('/challenges/:id/image', adminAuth, adminController.deleteImage);

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION routes (sub-questions)
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/admin/challenges/:id/questions — add a sub-question to a challenge
router.post('/challenges/:id/questions', adminAuth, questionValidation, validate, adminController.createQuestion);

// PATCH /api/admin/questions/:questionId — update a question
router.patch('/questions/:questionId', adminAuth, questionUpdateValidation, validate, adminController.updateQuestion);

// DELETE /api/admin/questions/:questionId — delete a question
router.delete('/questions/:questionId', adminAuth, adminController.deleteQuestion);

// POST /api/admin/questions/:questionId/image — upload image for a question
router.post('/questions/:questionId/image', adminAuth, upload.single('image'), adminController.uploadQuestionImage);

// ─────────────────────────────────────────────────────────────────────────────
// MISC routes
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/admin/score/:challengeId
router.post('/score/:challengeId', adminAuth, adminController.manualScore);

// GET /api/admin/stats
router.get('/stats', adminAuth, adminController.getStats);

// GET /api/admin/submissions/:challengeId
router.get('/submissions/:challengeId', adminAuth, adminController.getChallengeSubmissions);

module.exports = router;

const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const challengeController = require('../controllers/challengeController');

// GET /api/challenge/active — all currently live challenges + submissions map
router.get('/active', authMiddleware, challengeController.getActiveChallenges);

// GET /api/challenge/current — single active challenge (legacy, used by challenge page fallback)
router.get('/current', authMiddleware, challengeController.getCurrentChallenge);

// GET /api/challenge/all — all challenges (admin/authenticated)
router.get('/all', authMiddleware, challengeController.getAllChallenges);

// GET /api/challenge/:id — single challenge by ID
router.get('/:id', authMiddleware, challengeController.getChallengeById);

module.exports = router;

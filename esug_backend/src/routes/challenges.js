const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const challengeController = require('../controllers/challengeController');

// GET /api/challenge/current — requires auth
router.get('/current', authMiddleware, challengeController.getCurrentChallenge);

// GET /api/challenge/all — admin or authenticated
router.get('/all', authMiddleware, challengeController.getAllChallenges);

module.exports = router;

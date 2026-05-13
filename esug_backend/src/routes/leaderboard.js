const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

// GET /api/leaderboard/alltime — public
router.get('/alltime', leaderboardController.getAllTime);

// GET /api/leaderboard/weekly — public
router.get('/weekly', leaderboardController.getWeekly);

module.exports = router;

const rateLimit = require('express-rate-limit');

// General limiter — all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many requests — please try again later', code: 429 },
});

// Submission limiter — 5 per minute per IP
const submissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many submissions — please wait before trying again', code: 429 },
});

// Auth limiter — prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: true, message: 'Too many login attempts — please wait 15 minutes', code: 429 },
});

module.exports = { generalLimiter, submissionLimiter, authLimiter };

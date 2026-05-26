require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { generalLimiter } = require('./src/middleware/rateLimiter');

const authRoutes = require('./src/routes/auth');
const challengeRoutes = require('./src/routes/challenges');
const submissionRoutes = require('./src/routes/submissions');
const leaderboardRoutes = require('./src/routes/leaderboard');
const profileRoutes = require('./src/routes/profile');
const adminRoutes = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use(helmet());

// CORS — frontend only
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// General rate limit
app.use(generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Interactive game static files — served at /games/:slug/
// These are built Vite apps from interactive_games/{slug}/dist/
// X-Frame-Options and CSP removed so the student frontend can embed them in iframes
app.use('/games', (req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  next();
});
app.use('/games/:slug', (req, res, next) => {
  const { slug } = req.params;
  if (!/^[a-z0-9-]+$/.test(slug)) return res.status(404).end();
  const distDir = path.join(__dirname, '..', 'interactive_games', slug, 'dist');
  return express.static(distDir)(req, res, next);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/challenge', challengeRoutes);
app.use('/api/submit', submissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: true, message, code: status });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Route not found', code: 404 });
});

// Start scheduler after server starts
app.listen(PORT, () => {
  console.log(`[SERVER] ESUG Quiz API running on port ${PORT}`);
  console.log(`[SERVER] Environment: ${process.env.NODE_ENV}`);
  // Start scheduler
  require('./src/config/scheduler');
});

module.exports = app;

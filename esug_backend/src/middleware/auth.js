const { createClient } = require('@supabase/supabase-js');

// Per-request client that validates the student's JWT token
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: true, message: 'No authentication token provided', code: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Create a user-scoped Supabase client to verify the token
    const userSupabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error } = await userSupabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: true, message: 'Invalid or expired token', code: 401 });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    console.error('[AUTH] Token verification failed:', err.message);
    return res.status(401).json({ error: true, message: 'Authentication failed', code: 401 });
  }
}

module.exports = authMiddleware;

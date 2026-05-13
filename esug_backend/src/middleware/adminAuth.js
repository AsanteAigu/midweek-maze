function adminAuth(req, res, next) {
  const adminSecret = req.headers['x-admin-secret'];

  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: true, message: 'Forbidden — admin access required', code: 403 });
  }

  next();
}

module.exports = adminAuth;

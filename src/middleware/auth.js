const jwt = require('jsonwebtoken');

// Verify JWT token
const verifyToken = (req, res, next) => {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1]; // Bearer <token>

  if (!token)
    return res.status(401).json({ error: 'Token manquant' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Token invalide ou expiré' });
  }
};

// Role guard — usage: requireRole('admin', 'superviseur')
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'Accès refusé' });
  next();
};

module.exports = { verifyToken, requireRole };
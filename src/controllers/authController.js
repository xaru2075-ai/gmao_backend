const pool   = require('../config/db');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

// POST /api/auth/register
const register = async (req, res) => {
  const { nom, email, mot_de_passe, role } = req.body;

  if (!nom || !email || !mot_de_passe || !role)
    return res.status(400).json({ error: 'Tous les champs sont requis' });

  try {
    const hash = await bcrypt.hash(mot_de_passe, 10);
    const result = await pool.query(
      `INSERT INTO utilisateurs (nom, email, mot_de_passe, role)
       VALUES ($1, $2, $3, $4) RETURNING id, nom, email, role`,
      [nom, email, hash, role]
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Email déjà utilisé' });
    res.status(500).json({ error: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe)
    return res.status(400).json({ error: 'Email et mot de passe requis' });

  try {
    const result = await pool.query(
      'SELECT * FROM utilisateurs WHERE email = $1', [email]
    );

    const user = result.rows[0];
    if (!user)
      return res.status(401).json({ error: 'Identifiants incorrects' });

    const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valid)
      return res.status(401).json({ error: 'Identifiants incorrects' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: { id: user.id, nom: user.nom, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login };
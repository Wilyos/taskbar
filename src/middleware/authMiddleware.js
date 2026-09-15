const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'taskbar-secret-key-2026-railway';

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'No autorizado. Debes iniciar sesión para modificar o crear tareas.' 
    });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ 
      error: 'Formato de token inválido. Se espera Bearer <token>' 
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ 
      error: 'Sesión expirada o token inválido. Por favor inicia sesión nuevamente.' 
    });
  }
}

module.exports = { requireAuth, JWT_SECRET };

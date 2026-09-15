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

function requireActiveUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Debes iniciar sesión.' });
  }

  // El administrador siempre tiene permisos completos
  if (req.user.role === 'admin') {
    return next();
  }

  // Verificar si la cuenta ha sido activada
  if (!req.user.is_active) {
    return res.status(403).json({ 
      error: 'Tu cuenta aún no ha sido activada por el administrador. Solo puedes visualizar el tablero hasta que sea aprobada.' 
    });
  }

  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requieren permisos de administrador.' 
    });
  }
  next();
}

module.exports = { requireAuth, requireActiveUser, requireAdmin, JWT_SECRET };

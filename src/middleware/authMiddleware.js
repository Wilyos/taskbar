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

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ 
      error: 'Sesión expirada o token inválido. Por favor inicia sesión nuevamente.' 
    });
  }

  refreshUserFromDb(decoded)
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: 'La cuenta ya no existe. Inicia sesión nuevamente.' });
      }
      req.user = user;
      next();
    })
    .catch(() => res.status(500).json({ error: 'Error al validar la sesión.' }));
}

// Lee rol/área/estado actuales desde la BD para que los cambios (ej. ascender a admin)
// apliquen de inmediato sin esperar a que expire el token.
async function refreshUserFromDb(decoded) {
  const userModel = require('../models/userModel');
  const fresh = await userModel.findById(decoded.id);
  if (!fresh) return null;
  return {
    id: fresh.id,
    username: fresh.username,
    name: fresh.name,
    email: fresh.email || null,
    role: fresh.role,
    area: fresh.area,
    is_active: !!fresh.is_active
  };
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

function attachUserIfExists(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    req.user = null;
    return next();
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    let decoded = null;
    try {
      decoded = jwt.verify(parts[1], JWT_SECRET);
    } catch (err) {
      decoded = null;
    }
    if (!decoded) {
      req.user = null;
      return next();
    }
    return refreshUserFromDb(decoded)
      .then((user) => { req.user = user; next(); })
      .catch(() => { req.user = null; next(); });
  }
  req.user = null;
  next();
}

module.exports = { requireAuth, requireActiveUser, requireAdmin, attachUserIfExists, JWT_SECRET };

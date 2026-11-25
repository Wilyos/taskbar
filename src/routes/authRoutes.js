const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { requireAuth, JWT_SECRET } = require('../middleware/authMiddleware');
const { sendPasswordResetEmail } = require('../services/emailService');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, area, email } = req.body;

    if (!username || !password || !name || !email) {
      return res.status(400).json({ error: 'Usuario, correo electrónico, contraseña y nombre son obligatorios.' });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Por favor ingresa un correo electrónico válido.' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'El usuario debe tener al menos 3 caracteres.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const existing = await userModel.findByUsername(username);
    if (existing) {
      return res.status(400).json({ error: 'Este nombre de usuario ya está registrado.' });
    }

    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Este correo electrónico ya está registrado.' });
    }

    const safeArea = ['desarrollo', 'diseno'].includes(area) ? area : 'desarrollo';

    // Nuevos usuarios se crean con is_active: false (pendiente de aprobación de wilyos)
    const newUser = await userModel.create({
      username,
      password,
      name,
      role: 'user',
      area: safeArea,
      email,
      is_active: false
    });

    const userPayload = {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      area: newUser.area,
      is_active: newUser.is_active
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      message: 'Cuenta registrada. Está pendiente de activación por el administrador.',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error interno al registrar usuario.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Por favor ingresa usuario y contraseña.' });
    }

    const user = await userModel.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const isValid = await userModel.comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const userPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email || null,
      role: user.role,
      area: user.area || (user.role === 'admin' ? 'todas' : 'desarrollo'),
      is_active: !!user.is_active
    };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: userPayload
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error interno al iniciar sesión.' });
  }
});

// PATCH /api/auth/email - Actualizar correo del usuario autenticado
router.patch('/email', requireAuth, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Por favor ingresa un correo electrónico válido.' });
    }

    const updatedUser = await userModel.setEmail(req.user.id, email);
    res.json({
      message: 'Correo electrónico actualizado correctamente.',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar correo:', error);
    res.status(400).json({ error: error.message || 'Error al actualizar correo.' });
  }
});

// POST /api/auth/forgot-password - Solicitar recuperación de contraseña por correo
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ error: 'Por favor ingresa un correo electrónico válido.' });
    }

    const user = await userModel.findByEmail(email);
    if (user) {
      const rawToken = crypto.randomBytes(16).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutos

      await userModel.setResetToken(user.id, tokenHash, expiresAt);

      const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
      const resetUrl = `${baseUrl}/?resetToken=${rawToken}`;

      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        token: rawToken
      });
    }

    res.json({
      message: 'Si el correo está registrado, recibirás un enlace y código para restablecer tu contraseña.'
    });
  } catch (error) {
    console.error('Error al enviar correo de recuperación:', error);
    res.status(500).json({ error: 'No se pudo enviar el correo de recuperación. Verifica la configuración SMTP.' });
  }
});

// POST /api/auth/reset-password - Restablecer contraseña con token válido
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !token.trim()) {
      return res.status(400).json({ error: 'El código o enlace de recuperación es obligatorio.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const user = await userModel.findByValidResetToken(tokenHash);

    if (!user) {
      return res.status(400).json({ error: 'El código o enlace de recuperación es inválido o ha expirado.' });
    }

    await userModel.updatePasswordAndClearReset(user.id, password);

    res.json({
      message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión.'
    });
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ error: 'Error interno al restablecer la contraseña.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error interno al obtener perfil.' });
  }
});

module.exports = router;

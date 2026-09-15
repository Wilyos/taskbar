const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// Todas las rutas de administración de usuarios requieren ser Admin (wilyos)
router.use(requireAuth, requireAdmin);

// GET /api/users - Listar todos los usuarios
router.get('/', async (req, res) => {
  try {
    const users = await userModel.getAll();
    res.json(users);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al listar usuarios.' });
  }
});

// PATCH /api/users/:id/status - Activar o desactivar un usuario
router.patch('/:id/status', async (req, res) => {
  try {
    const { is_active } = req.body;
    if (is_active === undefined) {
      return res.status(400).json({ error: 'El campo is_active es obligatorio.' });
    }

    const updatedUser = await userModel.setActiveStatus(req.params.id, !!is_active);
    if (!updatedUser) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    res.json({
      message: `Usuario ${updatedUser.username} ${updatedUser.is_active ? 'activado' : 'desactivado'} exitosamente.`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al cambiar estado del usuario:', error);
    res.status(400).json({ error: error.message || 'Error al cambiar estado del usuario.' });
  }
});

module.exports = router;

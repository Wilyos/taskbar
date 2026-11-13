const express = require('express');
const router = express.Router();
const taskModel = require('../models/taskModel');
const userModel = require('../models/userModel');
const { requireAuth, requireActiveUser, attachUserIfExists } = require('../middleware/authMiddleware');

// Función auxiliar para determinar el área a consultar
function resolveEffectiveArea(req) {
  // Si el usuario regular está logueado, forzar siempre su área asignada
  if (req.user && req.user.role === 'user') {
    return req.user.area || 'desarrollo';
  }
  // Si es admin o visitante sin autenticar, tomar query param o 'desarrollo' por defecto
  return req.query.area || 'desarrollo';
}

// Función auxiliar para determinar el usuario/tablero a consultar
function resolveEffectiveUserId(req) {
  if (req.query.board === 'mine') {
    return req.user ? req.user.id : -1;
  }
  if (req.query.user_id && req.query.user_id !== 'all') {
    return req.query.user_id;
  }
  return 'all';
}

// GET /api/tasks/owners - Listar usuarios activos disponibles para filtrar o asignar tareas
router.get('/owners', attachUserIfExists, async (req, res) => {
  try {
    const area = resolveEffectiveArea(req);
    const owners = await userModel.getActiveBasic(area);
    res.json(owners);
  } catch (err) {
    console.error('Error al obtener propietarios de tareas:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// GET /api/tasks/stats (Soporta query ?area=...&board=...&user_id=... y restricción por rol)
router.get('/stats', attachUserIfExists, async (req, res) => {
  try {
    const area = resolveEffectiveArea(req);
    const userId = resolveEffectiveUserId(req);
    const stats = await taskModel.getStats(area, userId);
    res.json(stats);
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// GET /api/tasks/categories (Soporta query ?area=...&board=...&user_id=... y restricción por rol)
router.get('/categories', attachUserIfExists, async (req, res) => {
  try {
    const area = resolveEffectiveArea(req);
    const userId = resolveEffectiveUserId(req);
    const categories = await taskModel.getCategories(area, userId);
    res.json(categories);
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// GET /api/tasks (Soporta query ?area=...&board=...&user_id=... y restricción por rol)
router.get('/', attachUserIfExists, async (req, res) => {
  try {
    const { search, status, priority, category } = req.query;
    const area = resolveEffectiveArea(req);
    const userId = resolveEffectiveUserId(req);
    const tasks = await taskModel.getAll({ area, userId, search, status, priority, category });
    res.json(tasks);
  } catch (err) {
    console.error('Error al listar tareas:', err);
    res.status(500).json({ error: 'Error al listar tareas' });
  }
});

// GET /api/tasks/:id
router.get('/:id', attachUserIfExists, async (req, res) => {
  try {
    const task = await taskModel.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    if (req.user && req.user.role === 'user' && task.area !== req.user.area) {
      return res.status(403).json({ error: 'No tienes permiso para ver tareas de otra área.' });
    }

    res.json(task);
  } catch (err) {
    console.error('Error al obtener tarea:', err);
    res.status(500).json({ error: 'Error al obtener tarea' });
  }
});

// POST /api/tasks (PROTEGIDO: Requiere estar logueado y cuenta activada)
router.post('/', requireAuth, requireActiveUser, async (req, res) => {
  try {
    const { title, description, status, priority, category, area, user_id, due_date } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'El título de la tarea es obligatorio' });
    }

    // Un usuario común solo puede crear tareas en su propia área y asociadas a su cuenta
    const assignedArea = req.user.role === 'admin' 
      ? (area && area !== 'all' ? area : 'desarrollo') 
      : (req.user.area || 'desarrollo');

    const assignedUserId = req.user.role === 'admin'
      ? (user_id !== undefined ? (user_id || null) : req.user.id)
      : req.user.id;

    const newTask = await taskModel.create({
      title,
      description,
      status,
      priority,
      category,
      area: assignedArea,
      user_id: assignedUserId,
      due_date
    });

    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error al crear tarea:', err);
    res.status(500).json({ error: 'Error al crear la tarea' });
  }
});

// PUT /api/tasks/:id (PROTEGIDO: Requiere estar logueado y cuenta activada)
router.put('/:id', requireAuth, requireActiveUser, async (req, res) => {
  try {
    const task = await taskModel.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // Un usuario común solo puede editar sus propias tareas dentro de su área
    if (req.user.role === 'user') {
      if (task.area !== req.user.area) {
        return res.status(403).json({ error: 'No tienes permiso para modificar tareas de otra área.' });
      }
      if (task.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Solo puedes modificar tus propias tareas.' });
      }
      delete req.body.area; // Prevenir cambio de área
      delete req.body.user_id; // Prevenir cambio de propietario
    }

    const updated = await taskModel.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error('Error al actualizar tarea:', err);
    res.status(500).json({ error: 'Error al actualizar la tarea' });
  }
});

// PATCH /api/tasks/:id/status (PROTEGIDO: Requiere estar logueado y cuenta activada)
router.patch('/:id/status', requireAuth, requireActiveUser, async (req, res) => {
  try {
    const { status, position = 0 } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'El estado es obligatorio' });
    }

    const task = await taskModel.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    if (req.user.role === 'user') {
      if (task.area !== req.user.area) {
        return res.status(403).json({ error: 'No tienes permiso para modificar tareas de otra área.' });
      }
      if (task.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Solo puedes mover tus propias tareas.' });
      }
    }

    const updated = await taskModel.updatePositionAndStatus(req.params.id, { status, position });
    res.json(updated);
  } catch (err) {
    console.error('Error al actualizar estado/posición:', err);
    res.status(500).json({ error: 'Error al cambiar estado de la tarea' });
  }
});

// DELETE /api/tasks/:id (PROTEGIDO: Requiere estar logueado y cuenta activada)
router.delete('/:id', requireAuth, requireActiveUser, async (req, res) => {
  try {
    const task = await taskModel.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    if (req.user.role === 'user') {
      if (task.area !== req.user.area) {
        return res.status(403).json({ error: 'No tienes permiso para eliminar tareas de otra área.' });
      }
      if (task.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Solo puedes eliminar tus propias tareas.' });
      }
    }

    const success = await taskModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json({ message: 'Tarea eliminada exitosamente' });
  } catch (err) {
    console.error('Error al eliminar tarea:', err);
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
});

module.exports = router;

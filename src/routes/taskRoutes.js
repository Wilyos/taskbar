const express = require('express');
const router = express.Router();
const taskModel = require('../models/taskModel');
const { requireAuth, requireActiveUser } = require('../middleware/authMiddleware');

// GET /api/tasks/stats (Público para vista general)
router.get('/stats', async (req, res) => {
  try {
    const stats = await taskModel.getStats();
    res.json(stats);
  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// GET /api/tasks/categories (Público)
router.get('/categories', async (req, res) => {
  try {
    const categories = await taskModel.getCategories();
    res.json(categories);
  } catch (err) {
    console.error('Error al obtener categorías:', err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// GET /api/tasks (Público para visualización)
router.get('/', async (req, res) => {
  try {
    const { search, status, priority, category } = req.query;
    const tasks = await taskModel.getAll({ search, status, priority, category });
    res.json(tasks);
  } catch (err) {
    console.error('Error al listar tareas:', err);
    res.status(500).json({ error: 'Error al listar tareas' });
  }
});

// GET /api/tasks/:id (Público)
router.get('/:id', async (req, res) => {
  try {
    const task = await taskModel.getById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    res.json(task);
  } catch (err) {
    console.error('Error al obtener tarea:', err);
    res.status(500).json({ error: 'Error al obtener tarea' });
  }
});

// POST /api/tasks (PROTEGIDO: Requiere estar logueado y cuenta activada por wilyos)
router.post('/', requireAuth, requireActiveUser, async (req, res) => {
  try {
    const { title, description, status, priority, category, due_date } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'El título de la tarea es obligatorio' });
    }

    const newTask = await taskModel.create({
      title,
      description,
      status,
      priority,
      category,
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

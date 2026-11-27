const express = require('express');
const router = express.Router();
const operationModel = require('../models/operationModel');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

const { VALID_STATUSES } = operationModel;

// GET /api/operations/stats (Público / general)
router.get('/stats', async (req, res) => {
  try {
    const stats = await operationModel.getStats();
    res.json(stats);
  } catch (err) {
    console.error('Error al obtener estadísticas de operaciones:', err);
    res.status(500).json({ error: 'Error al obtener estadísticas de producción' });
  }
});

// GET /api/operations (Público / general)
router.get('/', async (req, res) => {
  try {
    const { search, status, priority } = req.query;
    const operations = await operationModel.getAll({ search, status, priority });
    res.json(operations);
  } catch (err) {
    console.error('Error al listar operaciones:', err);
    res.status(500).json({ error: 'Error al listar órdenes de operación' });
  }
});

// GET /api/operations/:id (Público / general)
router.get('/:id', async (req, res) => {
  try {
    const op = await operationModel.getById(req.params.id);
    if (!op) {
      return res.status(404).json({ error: 'Orden de operación no encontrada' });
    }
    res.json(op);
  } catch (err) {
    console.error('Error al obtener orden de operación:', err);
    res.status(500).json({ error: 'Error al obtener la orden de operación' });
  }
});

// POST /api/operations (SOLO ADMIN)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { op_number, title, client, description, status, priority, due_date } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'El título de la orden es obligatorio' });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Estado de proceso inválido' });
    }

    const newOp = await operationModel.create({
      op_number,
      title,
      client,
      description,
      status,
      priority,
      due_date,
      created_by: req.user.id
    });

    res.status(201).json(newOp);
  } catch (err) {
    console.error('Error al crear orden de operación:', err);
    res.status(500).json({ error: 'Error al crear la orden de operación' });
  }
});

// PUT /api/operations/:id (SOLO ADMIN)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const existing = await operationModel.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Orden de operación no encontrada' });
    }

    if (req.body.status !== undefined && !VALID_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ error: 'Estado de proceso inválido' });
    }
    if (req.body.title !== undefined && !String(req.body.title).trim()) {
      return res.status(400).json({ error: 'El título de la orden es obligatorio' });
    }

    const updated = await operationModel.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    console.error('Error al actualizar orden de operación:', err);
    res.status(500).json({ error: 'Error al actualizar la orden de operación' });
  }
});

// PATCH /api/operations/:id/status (SOLO ADMIN)
router.patch('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, position = 0 } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'El estado del proceso es obligatorio y debe ser válido' });
    }

    const existing = await operationModel.getById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Orden de operación no encontrada' });
    }

    const updated = await operationModel.updatePositionAndStatus(req.params.id, { status, position });
    res.json(updated);
  } catch (err) {
    console.error('Error al actualizar estado de orden:', err);
    res.status(500).json({ error: 'Error al cambiar estado de la orden de operación' });
  }
});

// DELETE /api/operations/:id (SOLO ADMIN)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const success = await operationModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Orden de operación no encontrada' });
    }
    res.json({ message: 'Orden eliminada exitosamente' });
  } catch (err) {
    console.error('Error al eliminar orden de operación:', err);
    res.status(500).json({ error: 'Error al eliminar la orden de operación' });
  }
});

module.exports = router;

const { db } = require('../db');

const VALID_STATUSES = ['op', 'diseno', 'impresion', 'acabados', 'empacado_finalizado'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const isPg = () => db.client && db.client.config && db.client.config.client === 'pg';

const operationModel = {
  VALID_STATUSES,
  VALID_PRIORITIES,

  async getAll({ search, status, priority } = {}) {
    let query = db('operations')
      .leftJoin('users', 'operations.created_by', 'users.id')
      .select(
        'operations.*',
        'users.name as creator_name',
        'users.username as creator_username'
      );

    if (status && status !== 'all') {
      query = query.where('operations.status', status);
    }

    if (priority && priority !== 'all') {
      query = query.where('operations.priority', priority);
    }

    if (search && search.trim() !== '') {
      const s = `%${search.trim()}%`;
      const likeOp = isPg() ? 'ilike' : 'like';
      query = query.where((builder) => {
        builder
          .where('operations.op_number', likeOp, s)
          .orWhere('operations.title', likeOp, s)
          .orWhere('operations.client', likeOp, s)
          .orWhere('operations.description', likeOp, s);
      });
    }

    return await query.orderBy('operations.position', 'asc').orderBy('operations.created_at', 'desc');
  },

  async getById(id) {
    return await db('operations')
      .leftJoin('users', 'operations.created_by', 'users.id')
      .select(
        'operations.*',
        'users.name as creator_name',
        'users.username as creator_username'
      )
      .where('operations.id', id)
      .first();
  },

  async create(data) {
    const {
      op_number = null,
      title,
      client = null,
      description = null,
      status = 'op',
      priority = 'medium',
      due_date = null,
      created_by = null
    } = data;

    const safeStatus = VALID_STATUSES.includes(status) ? status : 'op';
    const safePriority = VALID_PRIORITIES.includes(priority) ? priority : 'medium';

    const lastOp = await db('operations')
      .where({ status: safeStatus })
      .orderBy('position', 'desc')
      .first();
    const position = lastOp ? lastOp.position + 1 : 0;

    const insertPayload = {
      op_number: op_number && op_number.trim() ? op_number.trim() : null,
      title: title.trim(),
      client: client && client.trim() ? client.trim() : null,
      description: description && description.trim() ? description.trim() : null,
      status: safeStatus,
      priority: safePriority,
      due_date: due_date || null,
      position,
      created_by: created_by ? Number(created_by) : null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const insertQuery = db('operations').insert(insertPayload);
    const result = isPg() ? await insertQuery.returning('id') : await insertQuery;
    const first = Array.isArray(result) ? result[0] : result;
    const insertedId = typeof first === 'object' && first !== null ? first.id : first;
    return await this.getById(insertedId);
  },

  async update(id, data) {
    const { op_number, title, client, description, status, priority, due_date, position } = data;
    const updates = {
      updated_at: new Date()
    };

    if (op_number !== undefined) updates.op_number = op_number && op_number.trim() ? op_number.trim() : null;
    if (title !== undefined) updates.title = title.trim();
    if (client !== undefined) updates.client = client && client.trim() ? client.trim() : null;
    if (description !== undefined) updates.description = description && description.trim() ? description.trim() : null;
    if (status !== undefined && VALID_STATUSES.includes(status)) updates.status = status;
    if (priority !== undefined && VALID_PRIORITIES.includes(priority)) updates.priority = priority;
    if (due_date !== undefined) updates.due_date = due_date || null;
    if (position !== undefined) updates.position = Number(position);

    await db('operations').where({ id }).update(updates);
    return await this.getById(id);
  },

  async updatePositionAndStatus(id, { status, position }) {
    await db('operations').where({ id }).update({
      status,
      position: Number(position),
      updated_at: new Date()
    });
    return await this.getById(id);
  },

  async delete(id) {
    const deletedCount = await db('operations').where({ id }).del();
    return deletedCount > 0;
  },

  async getStats() {
    const allOps = await db('operations').select('status', 'priority');
    const total = allOps.length;
    const op = allOps.filter(o => o.status === 'op').length;
    const diseno = allOps.filter(o => o.status === 'diseno').length;
    const impresion = allOps.filter(o => o.status === 'impresion').length;
    const acabados = allOps.filter(o => o.status === 'acabados').length;
    const empacado_finalizado = allOps.filter(o => o.status === 'empacado_finalizado').length;
    const completion_rate = total > 0 ? Math.round((empacado_finalizado / total) * 100) : 0;

    return {
      total,
      op,
      diseno,
      impresion,
      acabados,
      empacado_finalizado,
      completed: empacado_finalizado,
      completion_rate
    };
  }
};

module.exports = operationModel;

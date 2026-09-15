const { db } = require('../db');

const taskModel = {
  async getAll({ search, status, priority, category } = {}) {
    let query = db('tasks').select('*');

    if (status && status !== 'all') {
      query = query.where('status', status);
    }

    if (priority && priority !== 'all') {
      query = query.where('priority', priority);
    }

    if (category && category !== 'all') {
      query = query.where('category', category);
    }

    if (search && search.trim() !== '') {
      const s = `%${search.trim()}%`;
      query = query.where((builder) => {
        builder.where('title', 'like', s).orWhere('description', 'like', s);
      });
    }

    return await query.orderBy('position', 'asc').orderBy('created_at', 'desc');
  },

  async getById(id) {
    return await db('tasks').where({ id }).first();
  },

  async create(data) {
    const { title, description, status = 'todo', priority = 'medium', category = 'General', due_date } = data;
    
    // Obtener la posición más alta para la columna
    const lastTask = await db('tasks').where({ status }).orderBy('position', 'desc').first();
    const position = lastTask ? lastTask.position + 1 : 0;

    const [id] = await db('tasks').insert({
      title: title.trim(),
      description: description ? description.trim() : null,
      status,
      priority,
      category: category.trim() || 'General',
      due_date: due_date || null,
      position,
      created_at: new Date(),
      updated_at: new Date()
    });

    // En postgres o sqlite, aseguramos retornar la tarea creada
    const insertedId = typeof id === 'object' && id !== null ? id.id : id;
    return await this.getById(insertedId || id);
  },

  async update(id, data) {
    const { title, description, status, priority, category, due_date, position } = data;
    const updates = {
      updated_at: new Date()
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (category !== undefined) updates.category = category.trim() || 'General';
    if (due_date !== undefined) updates.due_date = due_date || null;
    if (position !== undefined) updates.position = position;

    await db('tasks').where({ id }).update(updates);
    return await this.getById(id);
  },

  async updatePositionAndStatus(id, { status, position }) {
    await db('tasks').where({ id }).update({
      status,
      position: Number(position),
      updated_at: new Date()
    });
    return await this.getById(id);
  },

  async delete(id) {
    const deletedCount = await db('tasks').where({ id }).del();
    return deletedCount > 0;
  },

  async getStats() {
    const allTasks = await db('tasks').select('status', 'priority');
    const total = allTasks.length;
    const todo = allTasks.filter(t => t.status === 'todo').length;
    const in_progress = allTasks.filter(t => t.status === 'in_progress').length;
    const completed = allTasks.filter(t => t.status === 'completed').length;
    const high_priority = allTasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length;
    const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      todo,
      in_progress,
      completed,
      high_priority,
      completion_rate
    };
  },

  async getCategories() {
    const categories = await db('tasks').distinct('category').pluck('category');
    return categories.filter(Boolean);
  }
};

module.exports = taskModel;

const { db } = require('../db');

function applyTaskFilters(query, { area, userId, status, priority, category, search } = {}, tablePrefix = 'tasks.') {
  if (area && area !== 'all' && area !== 'todas') {
    query = query.where(`${tablePrefix}area`, area);
  }

  if (userId !== undefined && userId !== null && userId !== 'all') {
    if (userId === 'unassigned') {
      query = query.whereNull(`${tablePrefix}user_id`);
    } else {
      query = query.where(`${tablePrefix}user_id`, Number(userId));
    }
  }

  if (status && status !== 'all') {
    query = query.where(`${tablePrefix}status`, status);
  }

  if (priority && priority !== 'all') {
    query = query.where(`${tablePrefix}priority`, priority);
  }

  if (category && category !== 'all') {
    query = query.where(`${tablePrefix}category`, category);
  }

  if (search && search.trim() !== '') {
    const s = `%${search.trim()}%`;
    query = query.where((builder) => {
      builder.where(`${tablePrefix}title`, 'like', s).orWhere(`${tablePrefix}description`, 'like', s);
    });
  }

  return query;
}

const taskModel = {
  async getAll({ area, userId, search, status, priority, category } = {}) {
    let query = db('tasks')
      .leftJoin('users', 'tasks.user_id', 'users.id')
      .select(
        'tasks.*',
        'users.name as user_name',
        'users.username as user_username'
      );

    query = applyTaskFilters(query, { area, userId, status, priority, category, search }, 'tasks.');

    return await query.orderBy('tasks.position', 'asc').orderBy('tasks.created_at', 'desc');
  },

  async getById(id) {
    return await db('tasks')
      .leftJoin('users', 'tasks.user_id', 'users.id')
      .select(
        'tasks.*',
        'users.name as user_name',
        'users.username as user_username'
      )
      .where('tasks.id', id)
      .first();
  },

  async create(data) {
    const { title, description, status = 'todo', priority = 'medium', category = 'General', area = 'desarrollo', user_id = null, due_date } = data;
    
    // Obtener la posición más alta para la columna dentro del área
    const lastTask = await db('tasks')
      .where({ status, area })
      .orderBy('position', 'desc')
      .first();
    const position = lastTask ? lastTask.position + 1 : 0;

    const [id] = await db('tasks').insert({
      title: title.trim(),
      description: description ? description.trim() : null,
      status,
      priority,
      category: category.trim() || 'General',
      area: area.trim() || 'desarrollo',
      user_id: user_id ? Number(user_id) : null,
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
    const { title, description, status, priority, category, area, user_id, due_date, position } = data;
    const updates = {
      updated_at: new Date()
    };

    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description ? description.trim() : null;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (category !== undefined) updates.category = category.trim() || 'General';
    if (area !== undefined) updates.area = area;
    if (user_id !== undefined) updates.user_id = user_id ? Number(user_id) : null;
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

  async getStats(area, userId) {
    let query = db('tasks').select('status', 'priority');
    query = applyTaskFilters(query, { area, userId }, '');
    const allTasks = await query;
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

  async getCategories(area, userId) {
    let query = db('tasks');
    query = applyTaskFilters(query, { area, userId }, '');
    const categories = await query.distinct('category').pluck('category');
    return categories.filter(Boolean);
  }
};

module.exports = taskModel;

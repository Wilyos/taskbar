// Cliente API para comunicarse con el servidor Express
const API_BASE = '/api/tasks';

export const api = {
  async getTasks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}${query}`);
    if (!res.ok) throw new Error('Error al cargar las tareas');
    return await res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Error al cargar estadísticas');
    return await res.json();
  },

  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    if (!res.ok) throw new Error('Error al cargar categorías');
    return await res.json();
  },

  async createTask(taskData) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al crear la tarea');
    }
    return await res.json();
  },

  async updateTask(id, taskData) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al actualizar la tarea');
    }
    return await res.json();
  },

  async updateStatusAndPosition(id, status, position = 0) {
    const res = await fetch(`${API_BASE}/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, position })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al cambiar estado de la tarea');
    }
    return await res.json();
  },

  async deleteTask(id) {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al eliminar la tarea');
    }
    return await res.json();
  }
};

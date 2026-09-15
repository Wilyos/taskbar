// Cliente API con soporte de Autenticación y JWT
const API_BASE = '/api';

export const auth = {
  getToken() {
    return localStorage.getItem('taskbar_token');
  },
  setToken(token) {
    localStorage.setItem('taskbar_token', token);
  },
  clearToken() {
    localStorage.removeItem('taskbar_token');
    localStorage.removeItem('taskbar_user');
  },
  getUser() {
    const u = localStorage.getItem('taskbar_user');
    return u ? JSON.parse(u) : null;
  },
  setUser(user) {
    localStorage.setItem('taskbar_user', JSON.stringify(user));
  },
  isAuthenticated() {
    return !!this.getToken();
  }
};

function getHeaders(customHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders
  };
  const token = auth.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Autenticación
  async login(credentials) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión');
    auth.setToken(data.token);
    auth.setUser(data.user);
    return data;
  },

  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al registrar usuario');
    auth.setToken(data.token);
    auth.setUser(data.user);
    return data;
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      auth.clearToken();
      throw new Error('Sesión no válida');
    }
    return await res.json();
  },

  // Tareas
  async getTasks(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.priority && filters.priority !== 'all') params.append('priority', filters.priority);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/tasks${query}`);
    if (!res.ok) throw new Error('Error al cargar las tareas');
    return await res.json();
  },

  async getStats() {
    const res = await fetch(`${API_BASE}/tasks/stats`);
    if (!res.ok) throw new Error('Error al cargar estadísticas');
    return await res.json();
  },

  async getCategories() {
    const res = await fetch(`${API_BASE}/tasks/categories`);
    if (!res.ok) throw new Error('Error al cargar categorías');
    return await res.json();
  },

  async createTask(taskData) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(taskData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear la tarea');
    return data;
  },

  async updateTask(id, taskData) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(taskData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar la tarea');
    return data;
  },

  async updateStatusAndPosition(id, status, position = 0) {
    const res = await fetch(`${API_BASE}/tasks/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ status, position })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al cambiar estado de la tarea');
    return data;
  },

  async deleteTask(id) {
    const res = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar la tarea');
    return data;
  }
};

import { api } from './api.js';
import { initKanbanDnD } from './kanban.js';

// Estado de la Aplicación
const state = {
  tasks: [],
  stats: null,
  activeView: localStorage.getItem('taskbar_view') || 'kanban', // 'kanban' | 'list'
  theme: localStorage.getItem('taskbar_theme') || 'dark',
  filters: {
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all'
  },
  editingTaskId: null
};

// Elementos DOM
const elements = {
  // Views
  kanbanView: document.getElementById('kanbanView'),
  listView: document.getElementById('listView'),
  btnViewKanban: document.getElementById('btnViewKanban'),
  btnViewList: document.getElementById('btnViewList'),

  // Columns Kanban
  colTodoList: document.getElementById('colTodoList'),
  colProgressList: document.getElementById('colProgressList'),
  colDoneList: document.getElementById('colDoneList'),
  colTodoCount: document.getElementById('colTodoCount'),
  colProgressCount: document.getElementById('colProgressCount'),
  colDoneCount: document.getElementById('colDoneCount'),

  // List View Container
  taskListItems: document.getElementById('taskListItems'),

  // Stats
  statTotal: document.getElementById('statTotal'),
  statDone: document.getElementById('statDone'),
  statProgressFill: document.getElementById('statProgressFill'),
  statPercentage: document.getElementById('statPercentage'),

  // Filters & Search
  searchInput: document.getElementById('searchInput'),
  filterPriority: document.getElementById('filterPriority'),
  filterCategory: document.getElementById('filterCategory'),

  // Theme & Actions
  btnThemeToggle: document.getElementById('btnThemeToggle'),
  btnNewTask: document.getElementById('btnNewTask'),

  // Modal
  taskModal: document.getElementById('taskModal'),
  taskForm: document.getElementById('taskForm'),
  modalTitle: document.getElementById('modalTitle'),
  btnCloseModal: document.getElementById('btnCloseModal'),
  btnCancelModal: document.getElementById('btnCancelModal'),
  inputTitle: document.getElementById('taskTitle'),
  inputDesc: document.getElementById('taskDesc'),
  selectStatus: document.getElementById('taskStatus'),
  selectPriority: document.getElementById('taskPriority'),
  inputCategory: document.getElementById('taskCategory'),
  inputDueDate: document.getElementById('taskDueDate'),

  // Toasts
  toastContainer: document.getElementById('toastContainer')
};

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(state.theme);
  switchView(state.activeView);
  setupEventListeners();

  initKanbanDnD({
    onTaskMoved: handleTaskMoved
  });

  await loadData();
});

// Carga de Datos
async function loadData() {
  try {
    const [tasks, stats, categories] = await Promise.all([
      api.getTasks(state.filters),
      api.getStats(),
      api.getCategories()
    ]);

    state.tasks = tasks;
    state.stats = stats;

    renderStats();
    renderCategories(categories);
    renderCurrentView();
  } catch (error) {
    showToast(error.message || 'Error al cargar datos', 'error');
  }
}

// Renderizado según la vista activa
function renderCurrentView() {
  if (state.activeView === 'kanban') {
    renderKanban();
  } else {
    renderList();
  }
}

// Renderizar Vista Kanban
function renderKanban() {
  const todoTasks = state.tasks.filter(t => t.status === 'todo');
  const progressTasks = state.tasks.filter(t => t.status === 'in_progress');
  const doneTasks = state.tasks.filter(t => t.status === 'completed');

  elements.colTodoCount.textContent = todoTasks.length;
  elements.colProgressCount.textContent = progressTasks.length;
  elements.colDoneCount.textContent = doneTasks.length;

  elements.colTodoList.innerHTML = renderCardsList(todoTasks);
  elements.colProgressList.innerHTML = renderCardsList(progressTasks);
  elements.colDoneList.innerHTML = renderCardsList(doneTasks);
}

function renderCardsList(tasks) {
  if (tasks.length === 0) {
    return `<div class="empty-state" style="padding: 1.5rem 0.5rem; font-size: 0.8rem;">Sin tareas aquí</div>`;
  }

  return tasks.map(task => `
    <div class="kanban-card" draggable="true" data-id="${task.id}" data-status="${task.status}">
      <div class="card-top-row">
        <div class="card-tags">
          <span class="badge badge-priority-${task.priority}">
            ${formatPriority(task.priority)}
          </span>
          <span class="badge badge-category">${escapeHtml(task.category || 'General')}</span>
        </div>
      </div>
      
      <div class="card-title">${escapeHtml(task.title)}</div>
      ${task.description ? `<div class="card-desc">${escapeHtml(task.description)}</div>` : ''}

      <div class="card-bottom-row">
        ${renderDueDateBadge(task.due_date)}
        <div class="card-actions">
          <button class="btn-card-action" onclick="window.app.openEditModal(${task.id})" title="Editar">✏️</button>
          <button class="btn-card-action danger" onclick="window.app.deleteTask(${task.id})" title="Eliminar">🗑️</button>
        </div>
      </div>
    </div>
  `).join('');
}

// Renderizar Vista Lista Clásica
function renderList() {
  if (state.tasks.length === 0) {
    elements.taskListItems.innerHTML = `
      <div class="empty-state">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>No se encontraron tareas con los filtros actuales</p>
      </div>
    `;
    return;
  }

  elements.taskListItems.innerHTML = state.tasks.map(task => {
    const isCompleted = task.status === 'completed';
    return `
      <div class="list-item-card ${isCompleted ? 'completed-task' : ''}">
        <div class="task-main-col">
          <input 
            type="checkbox" 
            class="custom-checkbox" 
            ${isCompleted ? 'checked' : ''} 
            onchange="window.app.toggleTaskStatus(${task.id}, this.checked)"
            title="Marcar como ${isCompleted ? 'pendiente' : 'completada'}"
          />
          <div class="task-info">
            <span class="task-title">${escapeHtml(task.title)}</span>
            ${task.description ? `<span class="task-desc">${escapeHtml(task.description)}</span>` : ''}
          </div>
        </div>

        <div class="task-meta-col">
          <span class="badge badge-priority-${task.priority}">
            ${formatPriority(task.priority)}
          </span>
          <span class="badge badge-category">📁 ${escapeHtml(task.category || 'General')}</span>
          ${renderDueDateBadge(task.due_date)}
        </div>

        <div class="task-actions-col">
          <button class="btn-icon" onclick="window.app.openEditModal(${task.id})" title="Editar tarea">✏️</button>
          <button class="btn-icon" onclick="window.app.deleteTask(${task.id})" title="Eliminar tarea" style="color: var(--priority-urgent);">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

// Renderizar Barra de Estadísticas
function renderStats() {
  if (!state.stats) return;
  const { total, completed, completion_rate } = state.stats;

  elements.statTotal.textContent = total;
  elements.statDone.textContent = completed;
  elements.statPercentage.textContent = `${completion_rate}%`;
  elements.statProgressFill.style.width = `${completion_rate}%`;
}

// Renderizar Categorías en Selector de Filtro
function renderCategories(categories) {
  const current = state.filters.category;
  elements.filterCategory.innerHTML = `<option value="all">Todas las Categorías</option>`;
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    if (cat === current) opt.selected = true;
    elements.filterCategory.appendChild(opt);
  });
}

// Helper: Formato de Fechas y Vencimiento
function renderDueDateBadge(dateStr) {
  if (!dateStr) return '';
  const due = new Date(dateStr + 'T23:59:59');
  const now = new Date();
  
  const isOverdue = due < now;
  const isToday = due.toDateString() === now.toDateString();

  let className = 'badge-due-date';
  let label = dateStr;

  if (isToday) {
    className += ' is-today';
    label = 'Hoy';
  } else if (isOverdue) {
    className += ' is-overdue';
    label = `Vencida (${dateStr})`;
  }

  return `
    <span class="${className}">
      📅 ${label}
    </span>
  `;
}

function formatPriority(p) {
  const map = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta',
    urgent: 'Urgente'
  };
  return map[p] || p;
}

// Arrastrar y Soltar: Mover tarea entre columnas
async function handleTaskMoved({ id, targetStatus, position }) {
  const taskId = parseInt(id, 10);
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  const oldStatus = task.status;
  // Actualización optimista
  task.status = targetStatus;
  task.position = position;
  renderCurrentView();

  try {
    await api.updateStatusAndPosition(taskId, targetStatus, position);
    state.stats = await api.getStats();
    renderStats();
    if (oldStatus !== targetStatus) {
      showToast(`Tarea movida a "${formatStatus(targetStatus)}"`, 'success');
    }
  } catch (error) {
    showToast('Error al mover la tarea', 'error');
    await loadData();
  }
}

function formatStatus(status) {
  const map = {
    todo: 'Por Hacer',
    in_progress: 'En Progreso',
    completed: 'Completada'
  };
  return map[status] || status;
}

// Checkbox de estado en Lista
async function toggleTaskStatus(id, isChecked) {
  const newStatus = isChecked ? 'completed' : 'todo';
  try {
    await api.updateStatusAndPosition(id, newStatus, 0);
    await loadData();
    showToast(isChecked ? '¡Tarea completada! 🎉' : 'Tarea marcada como pendiente', 'success');
  } catch (error) {
    showToast('Error al cambiar el estado de la tarea', 'error');
  }
}

// Modal de Creación / Edición
function openCreateModal(defaultStatus = 'todo') {
  state.editingTaskId = null;
  elements.modalTitle.textContent = 'Nueva Tarea';
  elements.taskForm.reset();
  elements.selectStatus.value = defaultStatus;
  elements.selectPriority.value = 'medium';
  elements.inputCategory.value = 'General';
  elements.taskModal.classList.add('is-open');
  elements.inputTitle.focus();
}

function openEditModal(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  state.editingTaskId = id;
  elements.modalTitle.textContent = 'Editar Tarea';
  elements.inputTitle.value = task.title || '';
  elements.inputDesc.value = task.description || '';
  elements.selectStatus.value = task.status || 'todo';
  elements.selectPriority.value = task.priority || 'medium';
  elements.inputCategory.value = task.category || 'General';
  elements.inputDueDate.value = task.due_date || '';

  elements.taskModal.classList.add('is-open');
  elements.inputTitle.focus();
}

function closeModal() {
  elements.taskModal.classList.remove('is-open');
  state.editingTaskId = null;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  const title = elements.inputTitle.value.trim();
  if (!title) {
    showToast('El título no puede estar vacío', 'error');
    return;
  }

  const payload = {
    title,
    description: elements.inputDesc.value.trim(),
    status: elements.selectStatus.value,
    priority: elements.selectPriority.value,
    category: elements.inputCategory.value.trim() || 'General',
    due_date: elements.inputDueDate.value || null
  };

  try {
    if (state.editingTaskId) {
      await api.updateTask(state.editingTaskId, payload);
      showToast('Tarea actualizada correctamente', 'success');
    } else {
      await api.createTask(payload);
      showToast('Tarea creada exitosamente', 'success');
    }
    closeModal();
    await loadData();
  } catch (error) {
    showToast(error.message || 'Error al guardar la tarea', 'error');
  }
}

async function deleteTask(id) {
  if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
  try {
    await api.deleteTask(id);
    showToast('Tarea eliminada', 'success');
    await loadData();
  } catch (error) {
    showToast('Error al eliminar la tarea', 'error');
  }
}

// Cambio de Vista (Kanban / Lista)
function switchView(viewName) {
  state.activeView = viewName;
  localStorage.setItem('taskbar_view', viewName);

  if (viewName === 'kanban') {
    elements.kanbanView.style.display = 'grid';
    elements.listView.style.display = 'none';
    elements.btnViewKanban.classList.add('active');
    elements.btnViewList.classList.remove('active');
  } else {
    elements.kanbanView.style.display = 'none';
    elements.listView.style.display = 'block';
    elements.btnViewKanban.classList.remove('active');
    elements.btnViewList.classList.add('active');
  }
  renderCurrentView();
}

// Tema Claro / Oscuro
function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem('taskbar_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
  elements.btnThemeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function toggleTheme() {
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

// Toast Notifier
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
    <span>${escapeHtml(message)}</span>
  `;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// Escapar HTML para prevenir XSS
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}

// Event Listeners
function setupEventListeners() {
  // Cambio de vistas
  elements.btnViewKanban.addEventListener('click', () => switchView('kanban'));
  elements.btnViewList.addEventListener('click', () => switchView('list'));

  // Cambio de tema
  elements.btnThemeToggle.addEventListener('click', toggleTheme);

  // Nueva tarea
  elements.btnNewTask.addEventListener('click', () => openCreateModal('todo'));

  // Botones rápidos de agregar en columnas
  document.querySelectorAll('.btn-add-quick').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const col = e.target.closest('.kanban-column');
      openCreateModal(col ? col.dataset.status : 'todo');
    });
  });

  // Modal
  elements.btnCloseModal.addEventListener('click', closeModal);
  elements.btnCancelModal.addEventListener('click', closeModal);
  elements.taskModal.addEventListener('click', (e) => {
    if (e.target === elements.taskModal) closeModal();
  });
  elements.taskForm.addEventListener('submit', handleFormSubmit);

  // Filtros
  let searchTimeout;
  elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.search = e.target.value;
      loadData();
    }, 250);
  });

  elements.filterPriority.addEventListener('change', (e) => {
    state.filters.priority = e.target.value;
    loadData();
  });

  elements.filterCategory.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    loadData();
  });

  // Teclas rápidas
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && elements.taskModal.classList.contains('is-open')) {
      closeModal();
    }
  });
}

// Exponer funciones globales para callbacks inline
window.app = {
  openEditModal,
  deleteTask,
  toggleTaskStatus
};

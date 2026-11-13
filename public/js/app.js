import { api, auth } from './api.js';
import { initKanbanDnD } from './kanban.js';

// Estado de la Aplicación
const state = {
  tasks: [],
  stats: null,
  owners: [],
  currentUser: auth.getUser(),
  currentBoard: localStorage.getItem('taskbar_board') || 'mine',
  currentArea: localStorage.getItem('taskbar_area') || 'desarrollo',
  activeView: localStorage.getItem('taskbar_view') || 'kanban',
  theme: localStorage.getItem('taskbar_theme') || 'dark',
  filters: {
    search: '',
    status: 'all',
    priority: 'all',
    category: 'all',
    user_id: 'all'
  },
  editingTaskId: null
};

// Elementos DOM
const elements = {
  // Navigation & Switcher de Tableros / Áreas
  areaNavContainer: document.getElementById('areaNavContainer'),
  boardSwitcherWrap: document.getElementById('boardSwitcherWrap'),
  tabBoardMine: document.getElementById('tabBoardMine'),
  tabBoardGeneral: document.getElementById('tabBoardGeneral'),
  badgeCountMine: document.getElementById('badgeCountMine'),
  badgeCountGeneral: document.getElementById('badgeCountGeneral'),
  areaSwitcherWrap: document.getElementById('areaSwitcherWrap'),
  tabAreaAll: document.getElementById('tabAreaAll'),
  tabAreaDev: document.getElementById('tabAreaDev'),
  tabAreaDesign: document.getElementById('tabAreaDesign'),
  badgeCountDev: document.getElementById('badgeCountDev'),
  badgeCountDesign: document.getElementById('badgeCountDesign'),
  userAreaBadge: document.getElementById('userAreaBadge'),
  userAreaBadgeIcon: document.getElementById('userAreaBadgeIcon'),
  userAreaBadgeText: document.getElementById('userAreaBadgeText'),

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
  filterUser: document.getElementById('filterUser'),
  filterPriority: document.getElementById('filterPriority'),
  filterCategory: document.getElementById('filterCategory'),

  // Theme & Actions
  btnThemeToggle: document.getElementById('btnThemeToggle'),
  btnNewTask: document.getElementById('btnNewTask'),
  userAuthSection: document.getElementById('userAuthSection'),
  btnAdminUsers: document.getElementById('btnAdminUsers'),

  // Modal Tarea
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
  taskArea: document.getElementById('taskArea'),
  groupTaskArea: document.getElementById('groupTaskArea'),
  inputDueDate: document.getElementById('taskDueDate'),
  groupTaskOwner: document.getElementById('groupTaskOwner'),
  taskOwner: document.getElementById('taskOwner'),

  // Modal Autenticación
  authModal: document.getElementById('authModal'),
  btnCloseAuthModal: document.getElementById('btnCloseAuthModal'),
  btnCancelAuthModal: document.getElementById('btnCancelAuthModal'),
  btnCancelRegModal: document.getElementById('btnCancelRegModal'),
  tabBtnLogin: document.getElementById('tabBtnLogin'),
  tabBtnRegister: document.getElementById('tabBtnRegister'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  loginUsername: document.getElementById('loginUsername'),
  loginPassword: document.getElementById('loginPassword'),
  regName: document.getElementById('regName'),
  regUsername: document.getElementById('regUsername'),
  regArea: document.getElementById('regArea'),
  regPassword: document.getElementById('regPassword'),

  // Modal Usuarios (Admin)
  usersModal: document.getElementById('usersModal'),
  btnCloseUsersModal: document.getElementById('btnCloseUsersModal'),
  btnFinishUsersModal: document.getElementById('btnFinishUsersModal'),
  btnRefreshUsers: document.getElementById('btnRefreshUsers'),
  usersListContainer: document.getElementById('usersListContainer'),

  // Toasts
  toastContainer: document.getElementById('toastContainer')
};

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
  applyTheme(state.theme);
  switchView(state.activeView);
  renderAuthSection();
  setupEventListeners();

  initKanbanDnD({
    onTaskMoved: handleTaskMoved
  });

  // Validar sesión si hay token guardado
  if (auth.isAuthenticated()) {
    try {
      const res = await api.getMe();
      state.currentUser = res.user;
      auth.setUser(res.user);
      renderAuthSection();
    } catch (e) {
      auth.clearToken();
      state.currentUser = null;
      renderAuthSection();
    }
  }

  await loadData();
});

// Renderizar Sección de Usuario en el Header y Visibilidad de Áreas
function renderAuthSection() {
  const isAuth = auth.isAuthenticated() && state.currentUser;
  const isAdmin = isAuth && state.currentUser.role === 'admin';
  const isRegularUser = isAuth && state.currentUser.role === 'user';
  const isActive = isAuth && (isAdmin || state.currentUser.is_active);

  // Control de Tablero (Personal vs General)
  if (isAuth) {
    if (elements.tabBoardMine) elements.tabBoardMine.style.display = 'inline-flex';
    const savedBoard = localStorage.getItem('taskbar_board');
    state.currentBoard = (savedBoard === 'mine' || savedBoard === 'general') ? savedBoard : 'mine';
  } else {
    if (elements.tabBoardMine) elements.tabBoardMine.style.display = 'none';
    state.currentBoard = 'general';
  }

  // Control de Área: usuario regular vs admin / visitante
  if (isRegularUser) {
    state.currentArea = state.currentUser.area || 'desarrollo';
    if (elements.areaSwitcherWrap) elements.areaSwitcherWrap.style.display = 'none';
    if (elements.userAreaBadge) {
      elements.userAreaBadge.style.display = 'inline-flex';
      const isDesign = state.currentArea === 'diseno';
      elements.userAreaBadge.className = isDesign ? 'user-area-badge is-design' : 'user-area-badge';
      if (elements.userAreaBadgeIcon) elements.userAreaBadgeIcon.textContent = isDesign ? '🎨' : '💻';
      if (elements.userAreaBadgeText) {
        elements.userAreaBadgeText.textContent = isDesign ? 'Diseño Gráfico & UI' : 'Desarrollo Web';
      }
    }
  } else {
    // Admin o Visitante público
    if (elements.areaSwitcherWrap) elements.areaSwitcherWrap.style.display = 'flex';
    if (elements.userAreaBadge) elements.userAreaBadge.style.display = 'none';
  }

  updateBoardUI();
  updateAreaUI();

  // Mostrar u ocultar botón de gestión de usuarios para admin
  if (elements.btnAdminUsers) {
    elements.btnAdminUsers.style.display = isAdmin ? 'inline-flex' : 'none';
  }

  if (isAuth) {
    elements.userAuthSection.innerHTML = `
      <div class="user-profile-badge" title="${isActive ? 'Cuenta Activa con permisos' : 'Cuenta Pendiente de Activación'}">
        <span class="user-avatar-dot" style="${!isActive ? 'background: var(--status-progress); box-shadow: 0 0 6px var(--status-progress);' : ''}"></span>
        <span>${escapeHtml(state.currentUser.name || state.currentUser.username)}</span>
        ${!isActive ? '<span style="font-size: 0.68rem; color: var(--status-progress); font-weight: 700;">(Pendiente)</span>' : ''}
        ${isAdmin ? '<span style="font-size: 0.68rem; color: var(--primary); font-weight: 700;">👑 Admin</span>' : ''}
        <button class="btn-logout" id="btnLogout" title="Cerrar sesión">Salir</button>
      </div>
    `;
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
      btnLogout.addEventListener('click', handleLogout);
    }
  } else {
    elements.userAuthSection.innerHTML = `
      <button class="btn btn-secondary" id="btnLoginHeader" style="padding: 0.45rem 0.85rem; font-size: 0.82rem;">
        🔐 Iniciar Sesión
      </button>
    `;
    const btnLoginHeader = document.getElementById('btnLoginHeader');
    if (btnLoginHeader) {
      btnLoginHeader.addEventListener('click', () => openAuthModal('login'));
    }
  }
}

// Actualizar visualmente la pestaña de tablero activo
function updateBoardUI() {
  const isMine = state.currentBoard === 'mine' && auth.isAuthenticated() && state.currentUser;
  if (elements.tabBoardMine && elements.tabBoardGeneral) {
    elements.tabBoardMine.classList.toggle('active', !!isMine);
    elements.tabBoardMine.setAttribute('aria-selected', isMine ? 'true' : 'false');
    elements.tabBoardGeneral.classList.toggle('active', !isMine);
    elements.tabBoardGeneral.setAttribute('aria-selected', !isMine ? 'true' : 'false');
  }
  if (elements.filterUser) {
    elements.filterUser.style.display = isMine ? 'none' : 'inline-block';
  }
}

// Conmutar tablero (Mi Tablero / Tablero General)
async function switchBoard(board) {
  if (board === 'mine' && (!auth.isAuthenticated() || !state.currentUser)) {
    openAuthModal('login');
    return;
  }
  state.currentBoard = board;
  localStorage.setItem('taskbar_board', board);
  if (board === 'mine') {
    state.filters.user_id = 'all';
    if (elements.filterUser) elements.filterUser.value = 'all';
  }
  updateBoardUI();
  await loadData();
}

// Actualizar visualmente la pestaña de área activa
function updateAreaUI() {
  if (elements.tabAreaAll) {
    const isAll = state.currentArea === 'all';
    elements.tabAreaAll.classList.toggle('active', isAll);
    elements.tabAreaAll.setAttribute('aria-selected', isAll ? 'true' : 'false');
  }
  if (elements.tabAreaDev && elements.tabAreaDesign) {
    const isDev = state.currentArea === 'desarrollo';
    const isDesign = state.currentArea === 'diseno';
    elements.tabAreaDev.classList.toggle('active', isDev);
    elements.tabAreaDev.setAttribute('aria-selected', isDev ? 'true' : 'false');
    elements.tabAreaDesign.classList.toggle('active', isDesign);
    elements.tabAreaDesign.setAttribute('aria-selected', isDesign ? 'true' : 'false');
  }
}

// Conmutar área (Solo Admin o Visitante)
async function switchArea(area) {
  if (state.currentUser && state.currentUser.role === 'user') {
    state.currentArea = state.currentUser.area || 'desarrollo';
    updateAreaUI();
    return;
  }

  state.currentArea = area;
  localStorage.setItem('taskbar_area', area);
  updateAreaUI();
  await loadData();
}

function getEffectiveBoardAndUser() {
  const isAuth = auth.isAuthenticated() && state.currentUser;
  const board = (isAuth && state.currentBoard === 'mine') ? 'mine' : 'general';
  const userId = board === 'mine' ? 'all' : state.filters.user_id;
  return { board, userId };
}

// Carga de Datos
async function loadData() {
  try {
    if (state.currentUser && state.currentUser.role === 'user') {
      state.currentArea = state.currentUser.area || 'desarrollo';
    }

    const { board, userId } = getEffectiveBoardAndUser();
    const filters = {
      ...state.filters,
      area: state.currentArea,
      board,
      user_id: userId
    };

    const [tasks, stats, categories, owners] = await Promise.all([
      api.getTasks(filters),
      api.getStats(state.currentArea, board, userId),
      api.getCategories(state.currentArea, board, userId),
      api.getTaskOwners(state.currentArea)
    ]);

    state.tasks = tasks;
    state.stats = stats;
    state.owners = owners || [];

    renderStats();
    renderCategories(categories);
    renderUserFilter(state.owners);
    renderCurrentView();

    // Actualizar conteos en pestañas de área y tablero
    updateAreaCounters();
  } catch (error) {
    showToast(error.message || 'Error al cargar datos', 'error');
  }
}

async function updateAreaCounters() {
  try {
    const isAuth = auth.isAuthenticated() && state.currentUser;
    const isAdminOrGuest = !state.currentUser || state.currentUser.role === 'admin';
    const { board, userId } = getEffectiveBoardAndUser();

    if (isAdminOrGuest && elements.badgeCountDev && elements.badgeCountDesign) {
      const [devStats, designStats] = await Promise.all([
        api.getStats('desarrollo', board, userId),
        api.getStats('diseno', board, userId)
      ]);
      elements.badgeCountDev.textContent = devStats.total || 0;
      elements.badgeCountDesign.textContent = designStats.total || 0;
    }

    if (elements.badgeCountGeneral) {
      const generalStats = await api.getStats(state.currentArea, 'general', 'all');
      elements.badgeCountGeneral.textContent = generalStats.total || 0;
    }

    if (isAuth && elements.badgeCountMine) {
      const mineStats = await api.getStats(state.currentArea, 'mine', 'all');
      elements.badgeCountMine.textContent = mineStats.total || 0;
    }
  } catch (e) {
    // No interrumpir si falla el contador secundario
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

function canModifyTask(task) {
  if (!state.currentUser) return false;
  if (state.currentUser.role === 'admin') return true;
  if (!state.currentUser.is_active) return false;
  return task.user_id === state.currentUser.id;
}

function renderUserBadge(task) {
  if (!task.user_id) {
    return `<span class="badge badge-user badge-user-unassigned" title="Tarea general sin usuario asignado">👤 General</span>`;
  }
  const isMe = state.currentUser && task.user_id === state.currentUser.id;
  const label = task.user_name || task.user_username || 'Usuario';
  return `<span class="badge badge-user ${isMe ? 'badge-user-me' : ''}" title="Pertenece a ${escapeHtml(label)} (@${escapeHtml(task.user_username || '')})">👤 ${escapeHtml(label)}</span>`;
}

function renderCardsList(tasks) {
  if (tasks.length === 0) {
    return `<div class="empty-state" style="padding: 1.5rem 0.5rem; font-size: 0.8rem;">Sin tareas en este estado</div>`;
  }

  return tasks.map(task => {
    const isDesign = task.area === 'diseno';
    const isEditable = !state.currentUser || canModifyTask(task);
    const isDraggable = !state.currentUser || canModifyTask(task);
    return `
    <div class="kanban-card" draggable="${isDraggable ? 'true' : 'false'}" data-id="${task.id}" data-status="${task.status}">
      <div class="card-top-row">
        <div class="card-tags">
          ${renderUserBadge(task)}
          <span class="badge ${isDesign ? 'badge-area-design' : 'badge-area-dev'}">
            ${isDesign ? '🎨 Diseño' : '💻 Dev'}
          </span>
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
        ${isEditable ? `
        <div class="card-actions">
          <button class="btn-card-action" onclick="window.app.openEditModal(${task.id})" title="Editar">✏️</button>
          <button class="btn-card-action danger" onclick="window.app.deleteTask(${task.id})" title="Eliminar">🗑️</button>
        </div>
        ` : ''}
      </div>
    </div>
  `;
  }).join('');
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
    const isDesign = task.area === 'diseno';
    const isEditable = !state.currentUser || canModifyTask(task);
    return `
      <div class="list-item-card ${isCompleted ? 'completed-task' : ''}">
        <div class="task-main-col">
          <input 
            type="checkbox" 
            class="custom-checkbox" 
            ${isCompleted ? 'checked' : ''} 
            ${!isEditable ? 'disabled' : ''}
            onchange="window.app.toggleTaskStatus(${task.id}, this)"
            title="${isEditable ? `Marcar como ${isCompleted ? 'pendiente' : 'completada'}` : 'Solo el propietario puede modificar esta tarea'}"
          />
          <div class="task-info">
            <span class="task-title">${escapeHtml(task.title)}</span>
            ${task.description ? `<span class="task-desc">${escapeHtml(task.description)}</span>` : ''}
          </div>
        </div>

        <div class="task-meta-col">
          ${renderUserBadge(task)}
          <span class="badge ${isDesign ? 'badge-area-design' : 'badge-area-dev'}">
            ${isDesign ? '🎨 Diseño' : '💻 Dev'}
          </span>
          <span class="badge badge-priority-${task.priority}">
            ${formatPriority(task.priority)}
          </span>
          <span class="badge badge-category">📁 ${escapeHtml(task.category || 'General')}</span>
          ${renderDueDateBadge(task.due_date)}
        </div>

        <div class="task-actions-col">
          ${isEditable ? `
            <button class="btn-icon" onclick="window.app.openEditModal(${task.id})" title="Editar tarea">✏️</button>
            <button class="btn-icon" onclick="window.app.deleteTask(${task.id})" title="Eliminar tarea" style="color: var(--priority-urgent);">🗑️</button>
          ` : ''}
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

// Renderizar Usuarios en Selector de Filtro (Tablero General)
function renderUserFilter(owners) {
  if (!elements.filterUser) return;
  const current = state.filters.user_id;
  elements.filterUser.innerHTML = `<option value="all">Todos los Usuarios</option>`;
  owners.forEach(u => {
    const opt = document.createElement('option');
    opt.value = String(u.id);
    opt.textContent = `👤 ${u.name} (@${u.username})`;
    if (String(u.id) === String(current)) opt.selected = true;
    elements.filterUser.appendChild(opt);
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

// Control de Permisos de Autenticación y Cuenta Activa
function ensureCanModify(actionMessage = 'modificar tareas') {
  if (!auth.isAuthenticated()) {
    showToast(`Debes iniciar sesión para ${actionMessage}`, 'error');
    openAuthModal('login');
    return false;
  }

  if (!auth.isActive()) {
    showToast(`⚠️ Tu cuenta aún no ha sido activada por el administrador. Solo puedes visualizar el tablero.`, 'error');
    return false;
  }

  return true;
}

// Arrastrar y Soltar: Mover tarea entre columnas
async function handleTaskMoved({ id, targetStatus, position }) {
  if (!ensureCanModify('mover tareas en el tablero')) {
    renderCurrentView(); // Revertir visualmente
    return;
  }

  const taskId = parseInt(id, 10);
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  if (!canModifyTask(task)) {
    showToast('Solo puedes mover tus propias tareas.', 'error');
    renderCurrentView();
    return;
  }

  const oldStatus = task.status;
  task.status = targetStatus;
  task.position = position;
  renderCurrentView();

  try {
    await api.updateStatusAndPosition(taskId, targetStatus, position);
    const { board, userId } = getEffectiveBoardAndUser();
    state.stats = await api.getStats(state.currentArea, board, userId);
    renderStats();
    if (oldStatus !== targetStatus) {
      showToast(`Tarea movida a "${formatStatus(targetStatus)}"`, 'success');
    }
  } catch (error) {
    showToast(error.message || 'Error al mover la tarea', 'error');
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
async function toggleTaskStatus(id, checkboxElem) {
  const isChecked = checkboxElem.checked;
  if (!ensureCanModify('cambiar el estado de la tarea')) {
    checkboxElem.checked = !isChecked; // Revertir
    return;
  }

  const newStatus = isChecked ? 'completed' : 'todo';
  try {
    await api.updateStatusAndPosition(id, newStatus, 0);
    await loadData();
    showToast(isChecked ? '¡Tarea completada! ⚡' : 'Tarea marcada como pendiente', 'success');
  } catch (error) {
    checkboxElem.checked = !isChecked;
    showToast(error.message || 'Error al cambiar estado', 'error');
  }
}

function populateOwnerSelect(selectedUserId) {
  if (!elements.groupTaskOwner || !elements.taskOwner) return;
  const isAdmin = auth.isAdmin();
  elements.groupTaskOwner.style.display = isAdmin ? 'block' : 'none';
  if (!isAdmin) return;

  elements.taskOwner.innerHTML = `<option value="">🌐 Sin asignar (General)</option>`;
  state.owners.forEach(u => {
    const opt = document.createElement('option');
    opt.value = String(u.id);
    opt.textContent = `👤 ${u.name} (@${u.username})`;
    if (selectedUserId && String(u.id) === String(selectedUserId)) {
      opt.selected = true;
    }
    elements.taskOwner.appendChild(opt);
  });
}

// Modal de Creación / Edición
function openCreateModal(defaultStatus = 'todo') {
  if (!ensureCanModify('crear nuevas tareas')) return;

  const isRegularUser = state.currentUser && state.currentUser.role === 'user';

  state.editingTaskId = null;
  elements.modalTitle.textContent = 'Nueva Tarea';
  elements.taskForm.reset();
  elements.selectStatus.value = defaultStatus;
  elements.selectPriority.value = 'medium';
  elements.inputCategory.value = 'General';

  if (elements.taskArea) {
    const defaultArea = state.currentArea === 'all' ? 'desarrollo' : state.currentArea;
    elements.taskArea.value = defaultArea;
    // Si es usuario regular, no puede cambiar el área
    elements.taskArea.disabled = isRegularUser;
  }

  populateOwnerSelect(state.currentUser ? state.currentUser.id : null);

  elements.taskModal.classList.add('is-open');
  elements.inputTitle.focus();
}

function openEditModal(id) {
  if (!ensureCanModify('editar tareas')) return;

  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  if (!canModifyTask(task)) {
    showToast('Solo puedes editar tus propias tareas.', 'error');
    return;
  }

  const isRegularUser = state.currentUser && state.currentUser.role === 'user';

  state.editingTaskId = id;
  elements.modalTitle.textContent = 'Editar Tarea';
  elements.inputTitle.value = task.title || '';
  elements.inputDesc.value = task.description || '';
  elements.selectStatus.value = task.status || 'todo';
  elements.selectPriority.value = task.priority || 'medium';
  elements.inputCategory.value = task.category || 'General';
  elements.inputDueDate.value = task.due_date || '';

  if (elements.taskArea) {
    const fallbackArea = state.currentArea === 'all' ? 'desarrollo' : state.currentArea;
    elements.taskArea.value = task.area || fallbackArea;
    elements.taskArea.disabled = isRegularUser;
  }

  populateOwnerSelect(task.user_id || null);

  elements.taskModal.classList.add('is-open');
  elements.inputTitle.focus();
}

function closeModal() {
  elements.taskModal.classList.remove('is-open');
  state.editingTaskId = null;
}

async function handleFormSubmit(e) {
  e.preventDefault();
  if (!ensureCanModify('guardar tareas')) return;

  const title = elements.inputTitle.value.trim();
  if (!title) {
    showToast('El título no puede estar vacío', 'error');
    return;
  }

  const selectedArea = elements.taskArea && !elements.taskArea.disabled 
    ? elements.taskArea.value 
    : (state.currentArea === 'all' ? 'desarrollo' : state.currentArea);

  const payload = {
    title,
    description: elements.inputDesc.value.trim(),
    status: elements.selectStatus.value,
    priority: elements.selectPriority.value,
    category: elements.inputCategory.value.trim() || 'General',
    area: selectedArea,
    due_date: elements.inputDueDate.value || null
  };

  if (auth.isAdmin() && elements.taskOwner) {
    payload.user_id = elements.taskOwner.value ? Number(elements.taskOwner.value) : null;
  }

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
  if (!ensureCanModify('eliminar tareas')) return;
  if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;
  try {
    await api.deleteTask(id);
    showToast('Tarea eliminada', 'success');
    await loadData();
  } catch (error) {
    showToast(error.message || 'Error al eliminar la tarea', 'error');
  }
}

// Modal de Autenticación (Login / Registro)
function openAuthModal(tab = 'login') {
  elements.authModal.classList.add('is-open');
  switchAuthTab(tab);
}

function closeAuthModal() {
  elements.authModal.classList.remove('is-open');
}

function switchAuthTab(tab) {
  if (tab === 'login') {
    elements.tabBtnLogin.classList.add('active');
    elements.tabBtnRegister.classList.remove('active');
    elements.loginForm.style.display = 'block';
    elements.registerForm.style.display = 'none';
    elements.loginUsername.focus();
  } else {
    elements.tabBtnLogin.classList.remove('active');
    elements.tabBtnRegister.classList.add('active');
    elements.loginForm.style.display = 'none';
    elements.registerForm.style.display = 'block';
    elements.regName.focus();
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const username = elements.loginUsername.value.trim();
  const password = elements.loginPassword.value;

  try {
    const data = await api.login({ username, password });
    state.currentUser = data.user;
    renderAuthSection();
    closeAuthModal();

    if (data.user.role === 'admin') {
      showToast(`¡Bienvenido Administrador Maestro, ${data.user.name}! 👑`, 'success');
    } else if (!data.user.is_active) {
      showToast(`Bienvenido ${data.user.name}. Tu cuenta está pendiente de activación por el administrador.`, 'info');
    } else {
      showToast(`¡Bienvenido de nuevo, ${data.user.name}! ⚡`, 'success');
    }
    await loadData();
  } catch (error) {
    showToast(error.message || 'Error al iniciar sesión', 'error');
  }
}

async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = elements.regName.value.trim();
  const username = elements.regUsername.value.trim();
  const password = elements.regPassword.value;
  const area = elements.regArea ? elements.regArea.value : 'desarrollo';

  try {
    const data = await api.register({ name, username, password, area });
    state.currentUser = data.user;
    state.currentArea = data.user.area || 'desarrollo';
    renderAuthSection();
    closeAuthModal();
    showToast(`Cuenta creada con éxito. Queda pendiente de activación por el administrador.`, 'info');
    await loadData();
  } catch (error) {
    showToast(error.message || 'Error al registrar la cuenta', 'error');
  }
}

function handleLogout() {
  auth.clearToken();
  state.currentUser = null;
  renderAuthSection();
  loadData();
  showToast('Sesión cerrada correctamente', 'info');
}

// Modal de Gestión de Usuarios (Exclusivo wilyos / Admin)
async function openUsersModal() {
  if (!auth.isAdmin()) return;
  elements.usersModal.classList.add('is-open');
  await loadAndRenderUsers();
}

function closeUsersModal() {
  elements.usersModal.classList.remove('is-open');
}

async function loadAndRenderUsers() {
  try {
    elements.usersListContainer.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 1rem;">Cargando usuarios...</div>';
    const users = await api.getUsers();

    if (users.length === 0) {
      elements.usersListContainer.innerHTML = '<div style="color: var(--text-dim); text-align: center;">No hay usuarios registrados.</div>';
      return;
    }

    elements.usersListContainer.innerHTML = users.map(u => {
      const isMasterAdmin = u.username === 'wilyos';
      const isActive = u.role === 'admin' || u.is_active;

      return `
        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; padding: 0.85rem 1rem; background: var(--bg-card); border: 1px solid var(--border-card); border-radius: var(--radius-md); gap: 0.75rem;">
          <div style="display: flex; flex-direction: column; gap: 0.2rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
              <strong style="color: var(--text-primary); font-size: 0.9rem;">${escapeHtml(u.name)}</strong>
              <code style="color: var(--text-dim); font-size: 0.75rem;">@${escapeHtml(u.username)}</code>
              ${isMasterAdmin ? '<span class="badge" style="background: rgba(0,255,136,0.15); color: var(--primary); border: 1px solid rgba(0,255,136,0.4);">👑 Master Admin</span>' : ''}
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-top: 0.2rem; flex-wrap: wrap;">
              <span style="font-size: 0.72rem; color: var(--text-dim);">Registrado: ${new Date(u.created_at).toLocaleDateString()}</span>
              
              <!-- Selector de Área por Usuario -->
              <div style="display: inline-flex; align-items: center; gap: 0.35rem;">
                <span style="font-size: 0.72rem; color: var(--text-secondary); font-weight: 600;">Área:</span>
                <select class="form-select" style="padding: 0.2rem 0.45rem; font-size: 0.75rem; height: auto; border-radius: var(--radius-sm);" onchange="window.app.changeUserArea(${u.id}, this.value)" ${isMasterAdmin ? 'disabled' : ''}>
                  <option value="desarrollo" ${u.area === 'desarrollo' ? 'selected' : ''}>💻 Desarrollo Web</option>
                  <option value="diseno" ${u.area === 'diseno' ? 'selected' : ''}>🎨 Diseño</option>
                  ${isMasterAdmin ? '<option value="todas" selected>👑 Acceso Total</option>' : ''}
                </select>
              </div>
            </div>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem;">
            ${isActive ? `
              <span class="badge" style="background: var(--status-done-bg); color: var(--primary); border: 1px solid rgba(0,255,136,0.3);">
                ✔ Activa
              </span>
            ` : `
              <span class="badge" style="background: var(--status-progress-bg); color: var(--status-progress); border: 1px solid rgba(250,204,21,0.3);">
                ⏳ Pendiente
              </span>
            `}

            ${isMasterAdmin ? `
              <button class="btn btn-secondary" disabled style="opacity: 0.6; padding: 0.35rem 0.7rem; font-size: 0.75rem;">Protegido</button>
            ` : isActive ? `
              <button class="btn btn-secondary" onclick="window.app.toggleUserStatus(${u.id}, false)" style="color: var(--priority-urgent); border-color: rgba(244,63,94,0.3); padding: 0.35rem 0.75rem; font-size: 0.75rem;">
                Desactivar
              </button>
            ` : `
              <button class="btn btn-primary" onclick="window.app.toggleUserStatus(${u.id}, true)" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;">
                ⚡ Activar Cuenta
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    elements.usersListContainer.innerHTML = `<div style="color: var(--priority-urgent);">${escapeHtml(error.message)}</div>`;
  }
}

async function toggleUserStatus(id, newStatus) {
  try {
    await api.setUserStatus(id, newStatus);
    showToast(`Estado de usuario actualizado correctamente`, 'success');
    await loadAndRenderUsers();
  } catch (error) {
    showToast(error.message || 'Error al actualizar usuario', 'error');
  }
}

async function changeUserArea(id, newArea) {
  try {
    await api.setUserArea(id, newArea);
    showToast(`Área de trabajo del usuario actualizada exitosamente`, 'success');
    await loadAndRenderUsers();
  } catch (error) {
    showToast(error.message || 'Error al actualizar área del usuario', 'error');
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
    <span>${type === 'success' ? '⚡' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
    <span>${escapeHtml(message)}</span>
  `;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, 3500);
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
  // Conmutador de Tableros (Mi Tablero / Tablero General)
  if (elements.tabBoardMine) {
    elements.tabBoardMine.addEventListener('click', () => switchBoard('mine'));
  }
  if (elements.tabBoardGeneral) {
    elements.tabBoardGeneral.addEventListener('click', () => switchBoard('general'));
  }

  // Conmutador de Áreas (Tabs)
  if (elements.tabAreaAll) {
    elements.tabAreaAll.addEventListener('click', () => switchArea('all'));
  }
  if (elements.tabAreaDev) {
    elements.tabAreaDev.addEventListener('click', () => switchArea('desarrollo'));
  }
  if (elements.tabAreaDesign) {
    elements.tabAreaDesign.addEventListener('click', () => switchArea('diseno'));
  }

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

  // Modal Tarea
  elements.btnCloseModal.addEventListener('click', closeModal);
  elements.btnCancelModal.addEventListener('click', closeModal);
  elements.taskModal.addEventListener('click', (e) => {
    if (e.target === elements.taskModal) closeModal();
  });
  elements.taskForm.addEventListener('submit', handleFormSubmit);

  // Modal Autenticación
  elements.tabBtnLogin.addEventListener('click', () => switchAuthTab('login'));
  elements.tabBtnRegister.addEventListener('click', () => switchAuthTab('register'));
  elements.btnCloseAuthModal.addEventListener('click', closeAuthModal);
  elements.btnCancelAuthModal.addEventListener('click', closeAuthModal);
  elements.btnCancelRegModal.addEventListener('click', closeAuthModal);
  elements.authModal.addEventListener('click', (e) => {
    if (e.target === elements.authModal) closeAuthModal();
  });
  elements.loginForm.addEventListener('submit', handleLoginSubmit);
  elements.registerForm.addEventListener('submit', handleRegisterSubmit);

  // Modal Usuarios (Admin)
  if (elements.btnAdminUsers) {
    elements.btnAdminUsers.addEventListener('click', openUsersModal);
  }
  if (elements.btnCloseUsersModal) {
    elements.btnCloseUsersModal.addEventListener('click', closeUsersModal);
  }
  if (elements.btnFinishUsersModal) {
    elements.btnFinishUsersModal.addEventListener('click', closeUsersModal);
  }
  if (elements.btnRefreshUsers) {
    elements.btnRefreshUsers.addEventListener('click', loadAndRenderUsers);
  }
  if (elements.usersModal) {
    elements.usersModal.addEventListener('click', (e) => {
      if (e.target === elements.usersModal) closeUsersModal();
    });
  }

  // Filtros
  let searchTimeout;
  elements.searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.filters.search = e.target.value;
      loadData();
    }, 250);
  });

  if (elements.filterUser) {
    elements.filterUser.addEventListener('change', (e) => {
      state.filters.user_id = e.target.value;
      loadData();
    });
  }

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
    if (e.key === 'Escape') {
      if (elements.taskModal.classList.contains('is-open')) closeModal();
      if (elements.authModal.classList.contains('is-open')) closeAuthModal();
      if (elements.usersModal.classList.contains('is-open')) closeUsersModal();
    }
  });
}

// Exponer funciones globales para callbacks inline
window.app = {
  openEditModal,
  deleteTask,
  toggleTaskStatus,
  toggleUserStatus,
  changeUserArea
};

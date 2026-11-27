import { api, auth } from './api.js';
import { initKanbanDnD } from './kanban.js';

const OP_STAGES = [
  { key: 'op', label: 'OP (Orden de Operación)', short: 'OP', icon: '📋' },
  { key: 'diseno', label: 'Diseño', short: 'Diseño', icon: '🎨' },
  { key: 'impresion', label: 'Impresión', short: 'Impresión', icon: '🖨️' },
  { key: 'acabados', label: 'Acabados', short: 'Acabados', icon: '✂️' },
  { key: 'empacado_finalizado', label: 'Empacado y Finalizado', short: 'Empacado y Finalizado', icon: '📦' }
];

// Estado de la Aplicación
const state = {
  tasks: [],
  operations: [],
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
  editingTaskId: null,
  editingOpId: null
};

// Elementos DOM
const elements = {
  appContainer: document.querySelector('.app-container'),

  // Navigation & Switcher de Tableros / Áreas
  areaNavContainer: document.getElementById('areaNavContainer'),
  boardSwitcherWrap: document.getElementById('boardSwitcherWrap'),
  tabBoardMine: document.getElementById('tabBoardMine'),
  tabBoardGeneral: document.getElementById('tabBoardGeneral'),
  tabBoardOps: document.getElementById('tabBoardOps'),
  badgeCountMine: document.getElementById('badgeCountMine'),
  badgeCountGeneral: document.getElementById('badgeCountGeneral'),
  badgeCountOps: document.getElementById('badgeCountOps'),
  areaSwitcherWrap: document.getElementById('areaSwitcherWrap'),
  tabAreaAll: document.getElementById('tabAreaAll'),
  tabAreaDev: document.getElementById('tabAreaDev'),
  tabAreaDesign: document.getElementById('tabAreaDesign'),
  badgeCountDev: document.getElementById('badgeCountDev'),
  badgeCountDesign: document.getElementById('badgeCountDesign'),
  userAreaBadge: document.getElementById('userAreaBadge'),
  userAreaBadgeIcon: document.getElementById('userAreaBadgeIcon'),
  userAreaBadgeText: document.getElementById('userAreaBadgeText'),
  opsModeBadge: document.getElementById('opsModeBadge'),
  opsModeBadgeIcon: document.getElementById('opsModeBadgeIcon'),
  opsModeBadgeText: document.getElementById('opsModeBadgeText'),

  // Views
  kanbanView: document.getElementById('kanbanView'),
  opsKanbanView: document.getElementById('opsKanbanView'),
  listView: document.getElementById('listView'),
  btnViewKanban: document.getElementById('btnViewKanban'),
  btnViewList: document.getElementById('btnViewList'),

  // Columns Kanban Tareas
  colTodoList: document.getElementById('colTodoList'),
  colProgressList: document.getElementById('colProgressList'),
  colDoneList: document.getElementById('colDoneList'),
  colTodoCount: document.getElementById('colTodoCount'),
  colProgressCount: document.getElementById('colProgressCount'),
  colDoneCount: document.getElementById('colDoneCount'),

  // Columns Kanban Producción / OP
  colOpList: document.getElementById('colOpList'),
  colOpDisenoList: document.getElementById('colOpDisenoList'),
  colOpImpresionList: document.getElementById('colOpImpresionList'),
  colOpAcabadosList: document.getElementById('colOpAcabadosList'),
  colOpDoneList: document.getElementById('colOpDoneList'),
  colOpCount: document.getElementById('colOpCount'),
  colOpDisenoCount: document.getElementById('colOpDisenoCount'),
  colOpImpresionCount: document.getElementById('colOpImpresionCount'),
  colOpAcabadosCount: document.getElementById('colOpAcabadosCount'),
  colOpDoneCount: document.getElementById('colOpDoneCount'),

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
  btnNewOp: document.getElementById('btnNewOp'),
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

  // Modal Producción / OP
  opModal: document.getElementById('opModal'),
  opForm: document.getElementById('opForm'),
  opModalTitle: document.getElementById('opModalTitle'),
  btnCloseOpModal: document.getElementById('btnCloseOpModal'),
  btnCancelOpModal: document.getElementById('btnCancelOpModal'),
  opNumber: document.getElementById('opNumber'),
  opClient: document.getElementById('opClient'),
  opTitle: document.getElementById('opTitle'),
  opDesc: document.getElementById('opDesc'),
  opStatus: document.getElementById('opStatus'),
  opPriority: document.getElementById('opPriority'),
  opDueDate: document.getElementById('opDueDate'),

  // Modal Autenticación
  authModal: document.getElementById('authModal'),
  authModalTitle: document.getElementById('authModalTitle'),
  authModalTabs: document.getElementById('authModalTabs'),
  btnCloseAuthModal: document.getElementById('btnCloseAuthModal'),
  btnCancelAuthModal: document.getElementById('btnCancelAuthModal'),
  btnCancelRegModal: document.getElementById('btnCancelRegModal'),
  btnCancelForgotModal: document.getElementById('btnCancelForgotModal'),
  btnCancelResetModal: document.getElementById('btnCancelResetModal'),
  tabBtnLogin: document.getElementById('tabBtnLogin'),
  tabBtnRegister: document.getElementById('tabBtnRegister'),
  loginForm: document.getElementById('loginForm'),
  registerForm: document.getElementById('registerForm'),
  forgotForm: document.getElementById('forgotForm'),
  resetForm: document.getElementById('resetForm'),
  loginUsername: document.getElementById('loginUsername'),
  loginPassword: document.getElementById('loginPassword'),
  regName: document.getElementById('regName'),
  regUsername: document.getElementById('regUsername'),
  regEmail: document.getElementById('regEmail'),
  regArea: document.getElementById('regArea'),
  regPassword: document.getElementById('regPassword'),
  btnShowForgot: document.getElementById('btnShowForgot'),
  forgotEmail: document.getElementById('forgotEmail'),
  btnBackToLogin: document.getElementById('btnBackToLogin'),
  btnGoToResetWithCode: document.getElementById('btnGoToResetWithCode'),
  btnBackToForgot: document.getElementById('btnBackToForgot'),
  resetTokenInput: document.getElementById('resetTokenInput'),
  resetNewPassword: document.getElementById('resetNewPassword'),
  resetConfirmPassword: document.getElementById('resetConfirmPassword'),

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
    container: elements.kanbanView,
    onTaskMoved: handleTaskMoved
  });

  initKanbanDnD({
    container: elements.opsKanbanView,
    onTaskMoved: handleOpMoved
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

  // Si viene un token de recuperación en la URL (?resetToken=...), abrir modal de restablecimiento
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('resetToken');
  if (resetToken) {
    window.history.replaceState({}, document.title, window.location.pathname);
    openAuthModal('reset');
    if (elements.resetTokenInput) {
      elements.resetTokenInput.value = resetToken;
    }
    if (elements.resetNewPassword) {
      elements.resetNewPassword.focus();
    }
  }
});

// Renderizar Sección de Usuario en el Header y Visibilidad de Áreas
function renderAuthSection() {
  const isAuth = auth.isAuthenticated() && state.currentUser;
  const isAdmin = isAuth && state.currentUser.role === 'admin';
  const isRegularUser = isAuth && state.currentUser.role === 'user';
  const isActive = isAuth && (isAdmin || state.currentUser.is_active);

  // Control de Tablero (Personal vs General vs Producción / OP)
  const savedBoard = localStorage.getItem('taskbar_board');
  if (isAuth) {
    if (elements.tabBoardMine) elements.tabBoardMine.style.display = 'inline-flex';
    state.currentBoard = (savedBoard === 'mine' || savedBoard === 'general' || savedBoard === 'operations') ? savedBoard : 'mine';
  } else {
    if (elements.tabBoardMine) elements.tabBoardMine.style.display = 'none';
    state.currentBoard = (savedBoard === 'operations') ? 'operations' : 'general';
  }

  // Control de Área: usuario regular vs admin / visitante (actualiza el valor y los badges; updateBoardUI gestiona visibilidad)
  if (isRegularUser) {
    state.currentArea = state.currentUser.area || 'desarrollo';
    if (elements.userAreaBadge) {
      const isDesign = state.currentArea === 'diseno';
      elements.userAreaBadge.className = isDesign ? 'user-area-badge is-design' : 'user-area-badge';
      if (elements.userAreaBadgeIcon) elements.userAreaBadgeIcon.textContent = isDesign ? '🎨' : '💻';
      if (elements.userAreaBadgeText) {
        elements.userAreaBadgeText.textContent = isDesign ? 'Diseño Gráfico & UI' : 'Desarrollo Web';
      }
    }
  }

  updateBoardUI();
  updateAreaUI();

  // Mostrar u ocultar botón de gestión de usuarios para admin
  if (elements.btnAdminUsers) {
    elements.btnAdminUsers.style.display = isAdmin ? 'inline-flex' : 'none';
  }

  if (isAuth) {
    const hasEmail = Boolean(state.currentUser.email);
    elements.userAuthSection.innerHTML = `
      <div class="user-profile-badge" title="${isActive ? 'Cuenta Activa con permisos' : 'Cuenta Pendiente de Activación'}">
        <span class="user-avatar-dot" style="${!isActive ? 'background: var(--status-progress); box-shadow: 0 0 6px var(--status-progress);' : ''}"></span>
        <span>${escapeHtml(state.currentUser.name || state.currentUser.username)}</span>
        ${!isActive ? '<span style="font-size: 0.68rem; color: var(--status-progress); font-weight: 700;">(Pendiente)</span>' : ''}
        ${isAdmin ? '<span style="font-size: 0.68rem; color: var(--primary); font-weight: 700;">👑 Admin</span>' : ''}
        ${!hasEmail ? '<button class="btn-logout" id="btnAddMyEmail" title="Agregar correo para recuperar contraseña" style="color: var(--priority-medium);">✉️ Correo</button>' : ''}
        <button class="btn-logout" id="btnLogout" title="Cerrar sesión">Salir</button>
      </div>
    `;
    const btnAddMyEmail = document.getElementById('btnAddMyEmail');
    if (btnAddMyEmail) {
      btnAddMyEmail.addEventListener('click', promptUpdateMyEmail);
    }
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

// Actualizar visualmente la pestaña de tablero activo y controles de Producción / OP
function updateBoardUI() {
  const isAuth = auth.isAuthenticated() && state.currentUser;
  const isAdmin = isAuth && state.currentUser.role === 'admin';
  const isRegularUser = isAuth && state.currentUser.role === 'user';
  const isOps = state.currentBoard === 'operations';
  const isMine = !isOps && state.currentBoard === 'mine' && isAuth;
  const isGeneral = !isOps && !isMine;

  if (elements.tabBoardMine) {
    elements.tabBoardMine.classList.toggle('active', !!isMine);
    elements.tabBoardMine.setAttribute('aria-selected', isMine ? 'true' : 'false');
  }
  if (elements.tabBoardGeneral) {
    elements.tabBoardGeneral.classList.toggle('active', isGeneral);
    elements.tabBoardGeneral.setAttribute('aria-selected', isGeneral ? 'true' : 'false');
  }
  if (elements.tabBoardOps) {
    elements.tabBoardOps.classList.toggle('active', isOps);
    elements.tabBoardOps.setAttribute('aria-selected', isOps ? 'true' : 'false');
  }

  if (elements.appContainer) {
    elements.appContainer.classList.toggle('is-ops-mode', isOps);
  }

  if (isOps) {
    if (elements.areaSwitcherWrap) elements.areaSwitcherWrap.style.display = 'none';
    if (elements.userAreaBadge) elements.userAreaBadge.style.display = 'none';
    if (elements.filterUser) elements.filterUser.style.display = 'none';
    if (elements.filterCategory) elements.filterCategory.style.display = 'none';
    if (elements.btnNewTask) elements.btnNewTask.style.display = 'none';
    if (elements.btnNewOp) elements.btnNewOp.style.display = isAdmin ? 'inline-flex' : 'none';

    if (elements.opsModeBadge) {
      elements.opsModeBadge.style.display = 'inline-flex';
      elements.opsModeBadge.className = isAdmin ? 'ops-mode-badge is-admin' : 'ops-mode-badge';
      if (elements.opsModeBadgeIcon) elements.opsModeBadgeIcon.textContent = isAdmin ? '👑' : '👁️';
      if (elements.opsModeBadgeText) {
        elements.opsModeBadgeText.textContent = isAdmin
          ? 'Modo Admin: puedes crear, editar y mover procesos'
          : 'Panel General (Solo lectura — modificable solo por administradores)';
      }
    }

    document.querySelectorAll('.btn-add-op-quick').forEach(btn => {
      btn.style.display = isAdmin ? 'flex' : 'none';
    });

    if (elements.searchInput) {
      elements.searchInput.placeholder = 'Buscar por #OP, título, cliente o descripción...';
    }
  } else {
    if (elements.opsModeBadge) elements.opsModeBadge.style.display = 'none';
    if (elements.btnNewOp) elements.btnNewOp.style.display = 'none';
    if (elements.btnNewTask) elements.btnNewTask.style.display = 'inline-flex';
    if (elements.filterCategory) elements.filterCategory.style.display = 'inline-block';
    if (elements.filterUser) elements.filterUser.style.display = isMine ? 'none' : 'inline-block';

    if (isRegularUser) {
      if (elements.areaSwitcherWrap) elements.areaSwitcherWrap.style.display = 'none';
      if (elements.userAreaBadge) elements.userAreaBadge.style.display = 'inline-flex';
    } else {
      if (elements.areaSwitcherWrap) elements.areaSwitcherWrap.style.display = 'flex';
      if (elements.userAreaBadge) elements.userAreaBadge.style.display = 'none';
    }

    if (elements.searchInput) {
      elements.searchInput.placeholder = 'Buscar por título o descripción...';
    }
  }

  applyActiveViewVisibility();
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
    if (state.currentBoard === 'operations') {
      const [ops, stats] = await Promise.all([
        api.getOperations({
          search: state.filters.search,
          priority: state.filters.priority
        }),
        api.getOperationStats()
      ]);

      state.operations = ops;
      state.stats = stats;

      renderStats();
      renderCurrentView();
      updateAreaCounters();
      return;
    }

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
    const effectiveBoard = board === 'operations' ? 'general' : board;

    if (isAdminOrGuest && elements.badgeCountDev && elements.badgeCountDesign) {
      const [devStats, designStats] = await Promise.all([
        api.getStats('desarrollo', effectiveBoard, userId),
        api.getStats('diseno', effectiveBoard, userId)
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

    if (elements.badgeCountOps) {
      const opsStats = await api.getOperationStats();
      elements.badgeCountOps.textContent = opsStats.total || 0;
    }
  } catch (e) {
    // No interrumpir si falla el contador secundario
  }
}

// Renderizado según la vista activa
function renderCurrentView() {
  if (state.currentBoard === 'operations') {
    if (state.activeView === 'kanban') {
      renderOpsKanban();
    } else {
      renderOpsList();
    }
    return;
  }

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

// ============================================================================
// Panel de Producción / Órdenes de Operación (OP) - Solo modificable por Admin
// ============================================================================

function getOpStageMeta(stageKey) {
  return OP_STAGES.find(s => s.key === stageKey) || OP_STAGES[0];
}

function ensureAdminForOps(actionMessage = 'modificar órdenes de producción') {
  if (!auth.isAuthenticated()) {
    showToast(`Debes iniciar sesión como administrador para ${actionMessage}`, 'error');
    openAuthModal('login');
    return false;
  }
  if (!auth.isAdmin()) {
    showToast('Solo los administradores pueden modificar el panel de Producción / OP.', 'error');
    return false;
  }
  return true;
}

function renderOpsKanban() {
  const groups = {
    op: [],
    diseno: [],
    impresion: [],
    acabados: [],
    empacado_finalizado: []
  };

  state.operations.forEach(item => {
    const key = groups[item.status] ? item.status : 'op';
    groups[key].push(item);
  });

  if (elements.colOpCount) elements.colOpCount.textContent = groups.op.length;
  if (elements.colOpDisenoCount) elements.colOpDisenoCount.textContent = groups.diseno.length;
  if (elements.colOpImpresionCount) elements.colOpImpresionCount.textContent = groups.impresion.length;
  if (elements.colOpAcabadosCount) elements.colOpAcabadosCount.textContent = groups.acabados.length;
  if (elements.colOpDoneCount) elements.colOpDoneCount.textContent = groups.empacado_finalizado.length;

  if (elements.colOpList) elements.colOpList.innerHTML = renderOpCardsList(groups.op);
  if (elements.colOpDisenoList) elements.colOpDisenoList.innerHTML = renderOpCardsList(groups.diseno);
  if (elements.colOpImpresionList) elements.colOpImpresionList.innerHTML = renderOpCardsList(groups.impresion);
  if (elements.colOpAcabadosList) elements.colOpAcabadosList.innerHTML = renderOpCardsList(groups.acabados);
  if (elements.colOpDoneList) elements.colOpDoneList.innerHTML = renderOpCardsList(groups.empacado_finalizado);
}

function renderOpCardsList(ops) {
  if (ops.length === 0) {
    return `<div class="empty-state" style="padding: 1.5rem 0.5rem; font-size: 0.8rem;">Sin órdenes en esta etapa</div>`;
  }

  const isAdmin = auth.isAdmin();

  return ops.map(op => {
    const stageIdx = OP_STAGES.findIndex(s => s.key === op.status);
    const hasPrev = stageIdx > 0;
    const hasNext = stageIdx >= 0 && stageIdx < OP_STAGES.length - 1;

    return `
      <div class="kanban-card" draggable="${isAdmin ? 'true' : 'false'}" data-id="${op.id}" data-status="${op.status}">
        <div class="card-top-row">
          <div class="card-tags">
            ${op.op_number ? `<span class="badge badge-op-number">${escapeHtml(op.op_number)}</span>` : ''}
            <span class="badge badge-priority-${op.priority}">${formatPriority(op.priority)}</span>
            ${op.client ? `<span class="badge badge-op-client">🏢 ${escapeHtml(op.client)}</span>` : ''}
          </div>
        </div>

        <div class="card-title">${escapeHtml(op.title)}</div>
        ${op.description ? `<div class="card-desc">${escapeHtml(op.description)}</div>` : ''}

        <div class="card-bottom-row">
          ${renderDueDateBadge(op.due_date)}
          ${isAdmin ? `
            <div class="card-actions">
              ${hasPrev ? `<button class="btn-card-action" onclick="window.app.moveOpStep(${op.id}, -1)" title="Retroceder etapa">◀</button>` : ''}
              ${hasNext ? `<button class="btn-card-action" onclick="window.app.moveOpStep(${op.id}, 1)" title="Avanzar etapa">▶</button>` : ''}
              <button class="btn-card-action" onclick="window.app.openEditOpModal(${op.id})" title="Editar OP">✏️</button>
              <button class="btn-card-action danger" onclick="window.app.deleteOp(${op.id})" title="Eliminar OP">🗑️</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderOpsList() {
  if (state.operations.length === 0) {
    elements.taskListItems.innerHTML = `
      <div class="empty-state">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p>No hay órdenes de operación registradas con los filtros actuales</p>
      </div>
    `;
    return;
  }

  const isAdmin = auth.isAdmin();

  elements.taskListItems.innerHTML = state.operations.map(op => {
    const isCompleted = op.status === 'empacado_finalizado';
    const stageMeta = getOpStageMeta(op.status);
    return `
      <div class="list-item-card ${isCompleted ? 'completed-task' : ''}">
        <div class="task-main-col">
          <div class="task-info">
            <span class="task-title">
              ${op.op_number ? `<code style="margin-right: 0.4rem; color: var(--primary);">${escapeHtml(op.op_number)}</code>` : ''}
              ${escapeHtml(op.title)}
            </span>
            ${op.description ? `<span class="task-desc">${escapeHtml(op.description)}</span>` : ''}
          </div>
        </div>

        <div class="task-meta-col">
          <span class="badge badge-op-stage-${op.status}">${stageMeta.icon} ${stageMeta.short}</span>
          ${op.client ? `<span class="badge badge-op-client">🏢 ${escapeHtml(op.client)}</span>` : ''}
          <span class="badge badge-priority-${op.priority}">${formatPriority(op.priority)}</span>
          ${renderDueDateBadge(op.due_date)}
        </div>

        <div class="task-actions-col">
          ${isAdmin ? `
            <select class="form-select" style="padding: 0.25rem 0.45rem; font-size: 0.75rem; height: auto; width: auto;" onchange="window.app.changeOpStatusInline(${op.id}, this.value)" title="Cambiar proceso">
              ${OP_STAGES.map(s => `<option value="${s.key}" ${s.key === op.status ? 'selected' : ''}>${s.icon} ${s.short}</option>`).join('')}
            </select>
            <button class="btn-icon" onclick="window.app.openEditOpModal(${op.id})" title="Editar OP">✏️</button>
            <button class="btn-icon" onclick="window.app.deleteOp(${op.id})" title="Eliminar OP" style="color: var(--priority-urgent);">🗑️</button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function openCreateOpModal(defaultStatus = 'op') {
  if (!ensureAdminForOps('crear órdenes de operación')) return;

  state.editingOpId = null;
  if (elements.opModalTitle) elements.opModalTitle.textContent = 'Nueva Orden de Operación (OP)';
  if (elements.opForm) elements.opForm.reset();
  if (elements.opStatus) elements.opStatus.value = defaultStatus || 'op';
  if (elements.opPriority) elements.opPriority.value = 'medium';
  if (elements.opModal) elements.opModal.classList.add('is-open');
  if (elements.opNumber) elements.opNumber.focus();
}

function openEditOpModal(id) {
  if (!ensureAdminForOps('editar órdenes de operación')) return;

  const op = state.operations.find(o => o.id === id);
  if (!op) return;

  state.editingOpId = id;
  if (elements.opModalTitle) elements.opModalTitle.textContent = 'Editar Orden de Operación';
  if (elements.opNumber) elements.opNumber.value = op.op_number || '';
  if (elements.opClient) elements.opClient.value = op.client || '';
  if (elements.opTitle) elements.opTitle.value = op.title || '';
  if (elements.opDesc) elements.opDesc.value = op.description || '';
  if (elements.opStatus) elements.opStatus.value = op.status || 'op';
  if (elements.opPriority) elements.opPriority.value = op.priority || 'medium';
  if (elements.opDueDate) elements.opDueDate.value = op.due_date || '';

  if (elements.opModal) elements.opModal.classList.add('is-open');
  if (elements.opTitle) elements.opTitle.focus();
}

function closeOpModal() {
  if (elements.opModal) elements.opModal.classList.remove('is-open');
  state.editingOpId = null;
}

async function handleOpFormSubmit(e) {
  e.preventDefault();
  if (!ensureAdminForOps('guardar órdenes de operación')) return;

  const title = elements.opTitle.value.trim();
  if (!title) {
    showToast('La descripción breve del trabajo es obligatoria', 'error');
    return;
  }

  const payload = {
    op_number: elements.opNumber ? elements.opNumber.value.trim() : null,
    client: elements.opClient ? elements.opClient.value.trim() : null,
    title,
    description: elements.opDesc ? elements.opDesc.value.trim() : null,
    status: elements.opStatus ? elements.opStatus.value : 'op',
    priority: elements.opPriority ? elements.opPriority.value : 'medium',
    due_date: elements.opDueDate && elements.opDueDate.value ? elements.opDueDate.value : null
  };

  try {
    if (state.editingOpId) {
      await api.updateOperation(state.editingOpId, payload);
      showToast('Orden actualizada correctamente', 'success');
    } else {
      await api.createOperation(payload);
      showToast('Orden creada exitosamente', 'success');
    }
    closeOpModal();
    await loadData();
  } catch (error) {
    showToast(error.message || 'Error al guardar la orden', 'error');
  }
}

async function handleOpMoved({ id, targetStatus, position }) {
  if (!ensureAdminForOps('mover procesos en el tablero')) {
    renderCurrentView();
    return;
  }

  const opId = parseInt(id, 10);
  const op = state.operations.find(o => o.id === opId);
  if (!op) return;

  const oldStatus = op.status;
  op.status = targetStatus;
  op.position = position;
  renderCurrentView();

  try {
    await api.updateOperationStatus(opId, targetStatus, position);
    state.stats = await api.getOperationStats();
    renderStats();
    if (oldStatus !== targetStatus) {
      const stageMeta = getOpStageMeta(targetStatus);
      showToast(`Orden movida a "${stageMeta.short}"`, 'success');
    }
  } catch (error) {
    showToast(error.message || 'Error al mover la orden', 'error');
    await loadData();
  }
}

async function moveOpStep(id, direction) {
  if (!ensureAdminForOps('mover procesos')) return;
  const op = state.operations.find(o => o.id === id);
  if (!op) return;

  const currentIdx = OP_STAGES.findIndex(s => s.key === op.status);
  const nextIdx = currentIdx + direction;
  if (nextIdx < 0 || nextIdx >= OP_STAGES.length) return;

  const nextStage = OP_STAGES[nextIdx];
  try {
    await api.updateOperationStatus(id, nextStage.key, 0);
    showToast(`Orden movida a "${nextStage.short}"`, 'success');
    await loadData();
  } catch (error) {
    showToast(error.message || 'Error al cambiar proceso', 'error');
  }
}

async function changeOpStatusInline(id, newStatus) {
  if (!ensureAdminForOps('cambiar el proceso')) {
    renderCurrentView();
    return;
  }
  try {
    await api.updateOperationStatus(id, newStatus, 0);
    const stageMeta = getOpStageMeta(newStatus);
    showToast(`Orden movida a "${stageMeta.short}"`, 'success');
    await loadData();
  } catch (error) {
    showToast(error.message || 'Error al cambiar proceso', 'error');
    await loadData();
  }
}

async function deleteOp(id) {
  if (!ensureAdminForOps('eliminar órdenes de operación')) return;
  if (!confirm('¿Estás seguro de eliminar esta orden de operación?')) return;
  try {
    await api.deleteOperation(id);
    showToast('Orden eliminada', 'success');
    await loadData();
  } catch (error) {
    showToast(error.message || 'Error al eliminar la orden', 'error');
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
  elements.loginForm.style.display = 'none';
  elements.registerForm.style.display = 'none';
  if (elements.forgotForm) elements.forgotForm.style.display = 'none';
  if (elements.resetForm) elements.resetForm.style.display = 'none';

  const showMainTabs = tab === 'login' || tab === 'register';
  if (elements.authModalTabs) {
    elements.authModalTabs.style.display = showMainTabs ? 'flex' : 'none';
  }

  if (tab === 'login') {
    if (elements.authModalTitle) elements.authModalTitle.textContent = 'Acceso de Usuario';
    elements.tabBtnLogin.classList.add('active');
    elements.tabBtnRegister.classList.remove('active');
    elements.loginForm.style.display = 'block';
    elements.loginUsername.focus();
  } else if (tab === 'register') {
    if (elements.authModalTitle) elements.authModalTitle.textContent = 'Acceso de Usuario';
    elements.tabBtnLogin.classList.remove('active');
    elements.tabBtnRegister.classList.add('active');
    elements.registerForm.style.display = 'block';
    elements.regName.focus();
  } else if (tab === 'forgot') {
    if (elements.authModalTitle) elements.authModalTitle.textContent = 'Recuperar Contraseña';
    if (elements.forgotForm) {
      elements.forgotForm.style.display = 'block';
      elements.forgotEmail.focus();
    }
  } else if (tab === 'reset') {
    if (elements.authModalTitle) elements.authModalTitle.textContent = 'Restablecer Contraseña';
    if (elements.resetForm) {
      elements.resetForm.style.display = 'block';
      elements.resetTokenInput.focus();
    }
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
  const email = elements.regEmail ? elements.regEmail.value.trim() : '';
  const password = elements.regPassword.value;
  const area = elements.regArea ? elements.regArea.value : 'desarrollo';

  try {
    const data = await api.register({ name, username, email, password, area });
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

async function handleForgotSubmit(e) {
  e.preventDefault();
  const email = elements.forgotEmail.value.trim();
  if (!email) {
    showToast('Ingresa tu correo electrónico', 'error');
    return;
  }

  try {
    const data = await api.forgotPassword(email);
    showToast(data.message, 'success');
    switchAuthTab('reset');
  } catch (error) {
    showToast(error.message || 'Error al enviar correo de recuperación', 'error');
  }
}

async function handleResetSubmit(e) {
  e.preventDefault();
  const token = elements.resetTokenInput.value.trim();
  const password = elements.resetNewPassword.value;
  const confirmPassword = elements.resetConfirmPassword.value;

  if (!token) {
    showToast('Ingresa el código de recuperación', 'error');
    return;
  }
  if (password.length < 6) {
    showToast('La contraseña debe tener al menos 6 caracteres', 'error');
    return;
  }
  if (password !== confirmPassword) {
    showToast('Las contraseñas no coinciden', 'error');
    return;
  }

  try {
    const data = await api.resetPassword(token, password);
    showToast(data.message, 'success');
    elements.resetForm.reset();
    switchAuthTab('login');
  } catch (error) {
    showToast(error.message || 'Error al restablecer la contraseña', 'error');
  }
}

async function promptUpdateMyEmail() {
  const email = prompt('Ingresa tu correo electrónico para habilitar la recuperación de contraseña:', state.currentUser?.email || '');
  if (!email || !email.trim()) return;
  try {
    const res = await api.updateMyEmail(email.trim());
    state.currentUser = res.user;
    renderAuthSection();
    showToast('Correo electrónico guardado correctamente', 'success');
  } catch (error) {
    showToast(error.message || 'Error al guardar correo', 'error');
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
              <span style="font-size: 0.72rem; color: ${u.email ? 'var(--text-secondary)' : 'var(--priority-medium)'};">
                ✉️ ${u.email ? escapeHtml(u.email) : 'Sin correo'}
              </span>
              <button type="button" class="btn btn-secondary" onclick="window.app.promptSetUserEmail(${u.id}, '${escapeHtml(u.email || '')}')" style="padding: 0.15rem 0.45rem; font-size: 0.7rem;" title="Asignar o cambiar correo">
                ✏️ Correo
              </button>
              
              <!-- Selector de Rol (Administrador / Desarrollo Web / Diseño) -->
              <div style="display: inline-flex; align-items: center; gap: 0.35rem;">
                <span style="font-size: 0.72rem; color: var(--text-secondary); font-weight: 600;">Rol:</span>
                <select class="form-select" style="padding: 0.2rem 0.45rem; font-size: 0.75rem; height: auto; border-radius: var(--radius-sm);" onchange="window.app.changeUserRole(${u.id}, this.value)" ${isMasterAdmin ? 'disabled' : ''}>
                  <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>👑 Administrador (ve todo)</option>
                  <option value="desarrollo" ${u.role !== 'admin' && u.area !== 'diseno' ? 'selected' : ''}>💻 Desarrollo Web</option>
                  <option value="diseno" ${u.role !== 'admin' && u.area === 'diseno' ? 'selected' : ''}>🎨 Diseño</option>
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

async function changeUserRole(id, newRole) {
  const labels = {
    admin: 'Administrador (podrá ver y gestionar ambas áreas y usuarios)',
    desarrollo: 'Desarrollo Web (solo verá el área de Desarrollo Web)',
    diseno: 'Diseño (solo verá el área de Diseño)'
  };
  if (!confirm(`¿Asignar el rol de ${labels[newRole] || newRole}?`)) {
    await loadAndRenderUsers();
    return;
  }
  try {
    await api.setUserRole(id, newRole);
    showToast('Rol del usuario actualizado correctamente', 'success');
    await loadAndRenderUsers();
  } catch (error) {
    showToast(error.message || 'Error al actualizar rol del usuario', 'error');
    await loadAndRenderUsers();
  }
}

async function promptSetUserEmail(id, currentEmail = '') {
  const email = prompt('Ingresa el correo electrónico para este usuario:', currentEmail);
  if (email === null) return;
  const trimmed = email.trim();
  if (!trimmed) {
    showToast('El correo no puede estar vacío', 'error');
    return;
  }
  try {
    await api.setUserEmail(id, trimmed);
    showToast('Correo del usuario actualizado correctamente', 'success');
    await loadAndRenderUsers();
  } catch (error) {
    showToast(error.message || 'Error al actualizar correo del usuario', 'error');
  }
}

function applyActiveViewVisibility() {
  const isOps = state.currentBoard === 'operations';
  const isKanban = state.activeView === 'kanban';

  if (elements.kanbanView) {
    elements.kanbanView.style.display = !isOps && isKanban ? 'grid' : 'none';
  }
  if (elements.opsKanbanView) {
    elements.opsKanbanView.style.display = isOps && isKanban ? 'grid' : 'none';
  }
  if (elements.listView) {
    elements.listView.style.display = isKanban ? 'none' : 'block';
  }
}

// Cambio de Vista (Kanban / Lista)
function switchView(viewName) {
  state.activeView = viewName;
  localStorage.setItem('taskbar_view', viewName);

  if (viewName === 'kanban') {
    elements.btnViewKanban.classList.add('active');
    elements.btnViewList.classList.remove('active');
  } else {
    elements.btnViewKanban.classList.remove('active');
    elements.btnViewList.classList.add('active');
  }
  applyActiveViewVisibility();
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
  // Conmutador de Tableros (Mi Tablero / Tablero General / Producción OP)
  if (elements.tabBoardMine) {
    elements.tabBoardMine.addEventListener('click', () => switchBoard('mine'));
  }
  if (elements.tabBoardGeneral) {
    elements.tabBoardGeneral.addEventListener('click', () => switchBoard('general'));
  }
  if (elements.tabBoardOps) {
    elements.tabBoardOps.addEventListener('click', () => switchBoard('operations'));
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

  // Nueva tarea y Nueva OP
  elements.btnNewTask.addEventListener('click', () => openCreateModal('todo'));
  if (elements.btnNewOp) {
    elements.btnNewOp.addEventListener('click', () => openCreateOpModal('op'));
  }

  // Botones rápidos de agregar en columnas (tareas vs operaciones)
  document.querySelectorAll('.btn-add-quick').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const col = e.target.closest('.kanban-column');
      const status = col ? col.dataset.status : null;
      if (btn.classList.contains('btn-add-op-quick')) {
        openCreateOpModal(status || 'op');
      } else {
        openCreateModal(status || 'todo');
      }
    });
  });

  // Modal Tarea
  elements.btnCloseModal.addEventListener('click', closeModal);
  elements.btnCancelModal.addEventListener('click', closeModal);
  elements.taskModal.addEventListener('click', (e) => {
    if (e.target === elements.taskModal) closeModal();
  });
  elements.taskForm.addEventListener('submit', handleFormSubmit);

  // Modal Producción / OP
  if (elements.btnCloseOpModal) elements.btnCloseOpModal.addEventListener('click', closeOpModal);
  if (elements.btnCancelOpModal) elements.btnCancelOpModal.addEventListener('click', closeOpModal);
  if (elements.opModal) {
    elements.opModal.addEventListener('click', (e) => {
      if (e.target === elements.opModal) closeOpModal();
    });
  }
  if (elements.opForm) elements.opForm.addEventListener('submit', handleOpFormSubmit);

  // Modal Autenticación
  elements.tabBtnLogin.addEventListener('click', () => switchAuthTab('login'));
  elements.tabBtnRegister.addEventListener('click', () => switchAuthTab('register'));
  elements.btnCloseAuthModal.addEventListener('click', closeAuthModal);
  elements.btnCancelAuthModal.addEventListener('click', closeAuthModal);
  elements.btnCancelRegModal.addEventListener('click', closeAuthModal);
  if (elements.btnCancelForgotModal) elements.btnCancelForgotModal.addEventListener('click', closeAuthModal);
  if (elements.btnCancelResetModal) elements.btnCancelResetModal.addEventListener('click', closeAuthModal);
  if (elements.btnShowForgot) elements.btnShowForgot.addEventListener('click', () => switchAuthTab('forgot'));
  if (elements.btnBackToLogin) elements.btnBackToLogin.addEventListener('click', () => switchAuthTab('login'));
  if (elements.btnGoToResetWithCode) elements.btnGoToResetWithCode.addEventListener('click', () => switchAuthTab('reset'));
  if (elements.btnBackToForgot) elements.btnBackToForgot.addEventListener('click', () => switchAuthTab('forgot'));
  // El modal de autenticación solo se cierra con la X o los botones Cancelar
  elements.loginForm.addEventListener('submit', handleLoginSubmit);
  elements.registerForm.addEventListener('submit', handleRegisterSubmit);
  if (elements.forgotForm) elements.forgotForm.addEventListener('submit', handleForgotSubmit);
  if (elements.resetForm) elements.resetForm.addEventListener('submit', handleResetSubmit);

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
      if (elements.opModal && elements.opModal.classList.contains('is-open')) closeOpModal();
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
  changeUserArea,
  changeUserRole,
  promptSetUserEmail,
  openEditOpModal,
  deleteOp,
  moveOpStep,
  changeOpStatusInline
};

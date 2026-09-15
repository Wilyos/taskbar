// Lógica interactiva de Arrastrar y Soltar (Drag & Drop) para Kanban
export function initKanbanDnD({ onTaskMoved }) {
  let draggedCard = null;
  let draggedTaskId = null;
  let sourceStatus = null;

  // Delegación de eventos para dragstart y dragend en las tarjetas
  document.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.kanban-card');
    if (!card) return;

    draggedCard = card;
    draggedTaskId = card.dataset.id;
    sourceStatus = card.dataset.status;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedTaskId);

    // Retrasar ligera opacidad para no distorsionar el ghost image nativo
    setTimeout(() => {
      card.classList.add('dragging');
    }, 0);
  });

  document.addEventListener('dragend', (e) => {
    const card = e.target.closest('.kanban-card');
    if (card) {
      card.classList.remove('dragging');
    }
    draggedCard = null;
    draggedTaskId = null;
    sourceStatus = null;

    document.querySelectorAll('.kanban-column').forEach(col => {
      col.classList.remove('drag-over');
    });
    removeDropIndicator();
  });

  // Configuración de zonas de caída (columnas)
  const columns = document.querySelectorAll('.kanban-column');

  columns.forEach((column) => {
    const targetStatus = column.dataset.status;
    const cardsList = column.querySelector('.column-cards-list');

    column.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      column.classList.add('drag-over');

      // Calcular inserción visual
      const afterElement = getDragAfterElement(cardsList, e.clientY);
      updateDropIndicator(cardsList, afterElement);
    });

    column.addEventListener('dragleave', (e) => {
      // Verificar si realmente salimos de la columna o entramos a un hijo
      if (!column.contains(e.relatedTarget)) {
        column.classList.remove('drag-over');
        removeDropIndicator();
      }
    });

    column.addEventListener('drop', async (e) => {
      e.preventDefault();
      column.classList.remove('drag-over');
      removeDropIndicator();

      if (!draggedTaskId) return;

      const afterElement = getDragAfterElement(cardsList, e.clientY);
      const cards = [...cardsList.querySelectorAll('.kanban-card:not(.dragging)')];
      let newPosition = 0;

      if (afterElement == null) {
        newPosition = cards.length;
      } else {
        newPosition = cards.indexOf(afterElement);
      }

      if (onTaskMoved) {
        onTaskMoved({
          id: draggedTaskId,
          targetStatus,
          position: newPosition
        });
      }
    });
  });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.kanban-card:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  function updateDropIndicator(container, afterElement) {
    let indicator = document.querySelector('.drop-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'drop-indicator';
    }

    if (afterElement == null) {
      container.appendChild(indicator);
    } else {
      container.insertBefore(indicator, afterElement);
    }
  }

  function removeDropIndicator() {
    const indicator = document.querySelector('.drop-indicator');
    if (indicator) indicator.remove();
  }
}

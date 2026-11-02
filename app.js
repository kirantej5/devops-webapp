const STORAGE_KEY = 'orbit-tasks-v1';

const seedTasks = [
  { id: '1', title: 'Finalize the product launch brief', project: 'Product', priority: 'high', due: 'Today', status: 'active' },
  { id: '2', title: 'Review onboarding flow with the team', project: 'Product', priority: 'medium', due: 'Tomorrow', status: 'active' },
  { id: '3', title: 'Prepare next week social calendar', project: 'Marketing', priority: 'low', due: 'Nov 05', status: 'active' },
  { id: '4', title: 'Set up analytics events', project: 'Operations', priority: 'medium', due: 'Nov 06', status: 'completed' },
  { id: '5', title: 'Send the weekly project update', project: 'Marketing', priority: 'high', due: 'Nov 01', status: 'completed' }
];

const state = { filter: 'all', search: '', priority: 'all', editingId: null };
let tasks = loadTasks();

const elements = {
  taskList: document.querySelector('#task-list'),
  emptyState: document.querySelector('#empty-state'),
  modal: document.querySelector('#modal-backdrop'),
  form: document.querySelector('#task-form'),
  toast: document.querySelector('#toast'),
  title: document.querySelector('#task-title'),
  project: document.querySelector('#task-project'),
  priority: document.querySelector('#task-priority'),
  due: document.querySelector('#task-due'),
  id: document.querySelector('#task-id')
};

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : seedTasks;
  } catch {
    return seedTasks;
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
}

function visibleTasks() {
  return tasks.filter(task => {
    const matchesFilter = state.filter === 'all' || task.status === state.filter;
    const haystack = `${task.title} ${task.project}`.toLowerCase();
    const matchesSearch = haystack.includes(state.search.toLowerCase());
    const matchesPriority = state.priority === 'all' || task.priority === state.priority;
    return matchesFilter && matchesSearch && matchesPriority;
  });
}

function formatDue(due) {
  if (!due) return 'No due date';
  if (/^\d{4}-\d{2}-\d{2}$/.test(due)) return new Date(`${due}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return due;
}

function render() {
  const completed = tasks.filter(task => task.status === 'completed').length;
  const active = tasks.length - completed;
  const percentage = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  document.querySelector('#all-count').textContent = tasks.length;
  document.querySelector('#active-count').textContent = active;
  document.querySelector('#completed-count').textContent = completed;
  document.querySelector('#total-stat').textContent = tasks.length;
  document.querySelector('#active-stat').textContent = active;
  document.querySelector('#completed-stat').textContent = completed;
  document.querySelector('#focus-stat').textContent = `${percentage}%`;
  document.querySelector('#focus-percent').textContent = `${percentage}%`;
  document.querySelector('#focus-progress').style.width = `${percentage}%`;
  document.querySelectorAll('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.filter === state.filter));

  const filtered = visibleTasks();
  elements.taskList.innerHTML = filtered.map(task => `
    <article class="task-row ${task.status === 'completed' ? 'is-complete' : ''}" data-id="${escapeHtml(task.id)}">
      <button class="task-check ${task.status === 'completed' ? 'checked' : ''}" data-action="toggle" aria-label="Mark ${escapeHtml(task.title)} ${task.status === 'completed' ? 'active' : 'complete'}">${task.status === 'completed' ? '✓' : ''}</button>
      <div class="task-main"><h3>${escapeHtml(task.title)}</h3><div class="task-meta"><span class="project-dot ${escapeHtml(task.project.toLowerCase())}"></span>${escapeHtml(task.project)}<span class="meta-separator">•</span><span class="calendar-icon">◷</span>${escapeHtml(formatDue(task.due))}</div></div>
      <span class="priority ${escapeHtml(task.priority)}">${escapeHtml(task.priority)} <i></i></span>
      <div class="task-actions"><button data-action="edit" aria-label="Edit task">Edit</button><button data-action="delete" aria-label="Delete task">Delete</button></div>
    </article>`).join('');
  elements.emptyState.classList.toggle('hidden', filtered.length !== 0);
  elements.taskList.classList.toggle('hidden', filtered.length === 0);
}

function openModal(task = null) {
  state.editingId = task?.id || null;
  document.querySelector('#modal-title').textContent = task ? 'Edit task' : 'Create a new task';
  elements.id.value = task?.id || '';
  elements.title.value = task?.title || '';
  elements.project.value = task?.project || 'Product';
  elements.priority.value = task?.priority || 'medium';
  elements.due.value = /^\d{4}-\d{2}-\d{2}$/.test(task?.due || '') ? task.due : '';
  elements.modal.classList.remove('hidden');
  elements.title.focus();
}

function closeModal() {
  elements.modal.classList.add('hidden');
  elements.form.reset();
  state.editingId = null;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.remove('hidden');
  window.setTimeout(() => elements.toast.classList.add('hidden'), 2200);
}

document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => { state.filter = button.dataset.filter; render(); }));
document.querySelector('#search-input').addEventListener('input', event => { state.search = event.target.value; render(); });
document.querySelector('#priority-filter').addEventListener('change', event => { state.priority = event.target.value; render(); });
document.querySelector('#clear-filters').addEventListener('click', () => { state.filter = 'all'; state.search = ''; state.priority = 'all'; document.querySelector('#search-input').value = ''; document.querySelector('#priority-filter').value = 'all'; render(); });
document.querySelector('#open-modal').addEventListener('click', () => openModal());
document.querySelector('#empty-action').addEventListener('click', () => openModal());
document.querySelector('#close-modal').addEventListener('click', closeModal);
document.querySelector('#cancel-modal').addEventListener('click', closeModal);
elements.modal.addEventListener('click', event => { if (event.target === elements.modal) closeModal(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape' && !elements.modal.classList.contains('hidden')) closeModal(); });

elements.form.addEventListener('submit', event => {
  event.preventDefault();
  const task = { id: elements.id.value || crypto.randomUUID(), title: elements.title.value.trim(), project: elements.project.value, priority: elements.priority.value, due: elements.due.value || 'No due date', status: 'active' };
  if (!task.title) return;
  const existingIndex = tasks.findIndex(item => item.id === task.id);
  if (existingIndex >= 0) task.status = tasks[existingIndex].status;
  if (existingIndex >= 0) tasks[existingIndex] = task; else tasks.unshift(task);
  saveTasks();
  closeModal();
  render();
  showToast(existingIndex >= 0 ? 'Task updated' : 'Task created');
});

elements.taskList.addEventListener('click', event => {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const row = button.closest('[data-id]');
  const task = tasks.find(item => item.id === row.dataset.id);
  if (!task) return;
  if (button.dataset.action === 'toggle') task.status = task.status === 'completed' ? 'active' : 'completed';
  if (button.dataset.action === 'edit') openModal(task);
  if (button.dataset.action === 'delete') { tasks = tasks.filter(item => item.id !== task.id); showToast('Task deleted'); }
  saveTasks();
  render();
});

document.querySelector('#mobile-menu').addEventListener('click', () => document.querySelector('#sidebar').classList.toggle('open'));
render();

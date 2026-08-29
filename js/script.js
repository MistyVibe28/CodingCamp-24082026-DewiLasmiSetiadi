/* =============================================
   Life Dashboard — script.js
   Challenges implemented:
     ✅ Light / Dark mode
     ✅ Custom name in greeting
     ✅ Change Pomodoro time (custom duration)
     ✅ Prevent duplicate tasks
     ✅ Sort tasks
   MVP features:
     ✅ Real-time clock + date
     ✅ Greeting based on time of day
     ✅ Focus Timer (start / pause / reset)
     ✅ To-Do List (add / edit / complete / delete + localStorage)
     ✅ Quick Links (add / remove + localStorage)
   ============================================= */

'use strict';

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const $ = (id) => document.getElementById(id);
const CIRCUMFERENCE = 2 * Math.PI * 52; // matches r="52" in SVG

function showToast(msg) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ─────────────────────────────────────────────
   1. THEME  (Light / Dark mode)  ← Challenge ①
───────────────────────────────────────────── */
const themeToggleBtn = $('theme-toggle');
const themeIcon      = $('theme-icon');
const html           = document.documentElement;

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  localStorage.setItem('ld-theme', theme);
  if (theme === 'dark') {
    themeIcon.className = 'fa-solid fa-moon';
    themeToggleBtn.title = 'Ganti ke Light Mode';
  } else {
    themeIcon.className = 'fa-solid fa-sun';
    themeToggleBtn.title = 'Ganti ke Dark Mode';
  }
}

// Load saved theme (default: dark)
applyTheme(localStorage.getItem('ld-theme') || 'dark');

themeToggleBtn.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ─────────────────────────────────────────────
   2. CUSTOM NAME  ← Challenge ②
───────────────────────────────────────────── */
const nameModal     = $('name-modal');
const nameInput     = $('name-input');
const saveNameBtn   = $('save-name');
const changeNameBtn = $('change-name-btn');

function getStoredName() {
  return localStorage.getItem('ld-username') || '';
}

function saveName(name) {
  const trimmed = name.trim();
  if (trimmed) {
    localStorage.setItem('ld-username', trimmed);
  }
  return trimmed;
}

function openNameModal() {
  nameInput.value = getStoredName();
  nameModal.classList.remove('hidden');
  // Small delay so animation triggers after display
  requestAnimationFrame(() => nameInput.focus());
}

function closeNameModal() {
  nameModal.classList.add('hidden');
}

saveNameBtn.addEventListener('click', () => {
  const name = saveName(nameInput.value);
  if (!name) { showToast('⚠️ Masukkan namamu dulu!'); return; }
  closeNameModal();
  updateGreeting();
});

nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveNameBtn.click();
});

changeNameBtn.addEventListener('click', openNameModal);

// Show modal on first visit
if (!getStoredName()) openNameModal();

/* ─────────────────────────────────────────────
   3. REAL-TIME CLOCK & GREETING
───────────────────────────────────────────── */
$('year').textContent = new Date().getFullYear();

function updateGreeting() {
  const now  = new Date();
  const hour = now.getHours();
  const name = getStoredName();
  const salutation = name ? `, ${name}!` : '!';

  let emoji, word;
  if      (hour >= 5  && hour < 12) { emoji = '☀️';  word = 'Selamat Pagi';  }
  else if (hour >= 12 && hour < 15) { emoji = '🌤️'; word = 'Selamat Siang'; }
  else if (hour >= 15 && hour < 18) { emoji = '🌇';  word = 'Selamat Sore';  }
  else                               { emoji = '🌙';  word = 'Selamat Malam'; }

  $('greeting').textContent = `${emoji} ${word}${salutation}`;
}

function updateClock() {
  const now = new Date();
  const hh  = String(now.getHours()).padStart(2, '0');
  const mm  = String(now.getMinutes()).padStart(2, '0');
  const ss  = String(now.getSeconds()).padStart(2, '0');
  $('clock').textContent = `${hh}:${mm}:${ss}`;

  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  $('date-display').textContent = now.toLocaleDateString('id-ID', opts);

  // Refresh greeting text every minute (handles midnight crossover, etc.)
  if (ss === '00') updateGreeting();
}

updateGreeting();
updateClock();
setInterval(updateClock, 1000);

/* ─────────────────────────────────────────────
   4. FOCUS TIMER  (with custom duration ← Challenge ③)
───────────────────────────────────────────── */
const timerDisplayEl  = $('timer-display');
const ringProgress    = $('ring-progress');
const startBtn        = $('start-timer');
const pauseBtn        = $('pause-timer');
const resetBtn        = $('reset-timer');
const sessionCountEl  = $('session-count');
const modeBtns        = document.querySelectorAll('.mode-btn');
const customDurationEl= $('custom-duration');
const customMinutesEl = $('custom-minutes');
const setCustomBtn    = $('set-custom');

let timerInterval    = null;
let totalSeconds     = 25 * 60;
let remainingSeconds = totalSeconds;
let isRunning        = false;
let sessionCount     = 0;

function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateRing() {
  const pct    = remainingSeconds / totalSeconds;
  const offset = CIRCUMFERENCE * (1 - pct);
  ringProgress.style.strokeDashoffset = offset;
}

function renderTimer() {
  timerDisplayEl.textContent = formatTime(remainingSeconds);
  updateRing();
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  timerDisplayEl.classList.add('running');
  ringProgress.classList.add('running');

  timerInterval = setInterval(() => {
    if (remainingSeconds <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      timerDisplayEl.classList.remove('running');
      ringProgress.classList.remove('running');
      sessionCount++;
      sessionCountEl.textContent = sessionCount;
      playBeep();
      showToast('⏰ Waktu habis! Sesi selesai.');
      renderTimer();
      return;
    }
    remainingSeconds--;
    renderTimer();
  }, 1000);
}

function pauseTimer() {
  if (!isRunning) return;
  clearInterval(timerInterval);
  isRunning = false;
  timerDisplayEl.classList.remove('running');
  ringProgress.classList.remove('running');
}

function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  timerDisplayEl.classList.remove('running');
  ringProgress.classList.remove('running');
  remainingSeconds = totalSeconds;
  renderTimer();
}

function setTimerDuration(minutes) {
  totalSeconds     = minutes * 60;
  remainingSeconds = totalSeconds;
  pauseTimer();
  renderTimer();
}

/** Web Audio API beep */
function playBeep() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.0);
  } catch (_) { /* silently ignore */ }
}

// Timer button events
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Mode tab events
modeBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    modeBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    if (btn.dataset.minutes === 'custom') {
      customDurationEl.hidden = false;
      customMinutesEl.focus();
    } else {
      customDurationEl.hidden = true;
      setTimerDuration(parseInt(btn.dataset.minutes, 10));
    }
  });
});

// Custom duration set
setCustomBtn.addEventListener('click', () => {
  const val = parseInt(customMinutesEl.value, 10);
  if (!val || val < 1 || val > 120) {
    showToast('⚠️ Masukkan durasi antara 1–120 menit.');
    return;
  }
  setTimerDuration(val);
  showToast(`✅ Timer diset ke ${val} menit.`);
});

customMinutesEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') setCustomBtn.click();
});

// Initial render
renderTimer();

/* ─────────────────────────────────────────────
   5. TO-DO LIST
      MVP  : add, edit (inline), complete, delete, localStorage
      Ch ④ : prevent duplicate tasks
      Ch ⑤ : sort tasks
───────────────────────────────────────────── */
const todoInput    = $('todo-input');
const addTodoBtn   = $('add-todo');
const todoListEl   = $('todo-list');
const todoCountEl  = $('todo-count');
const clearDoneBtn = $('clear-completed');
const filterBtns   = document.querySelectorAll('.filter-btn');
const sortSelect   = $('sort-select');

let todos        = JSON.parse(localStorage.getItem('ld-todos')) || [];
let activeFilter = 'all';
let activeSort   = 'newest';

function saveTodos() {
  localStorage.setItem('ld-todos', JSON.stringify(todos));
}

/* ── Sort logic ── */
function getSortedTodos(list) {
  const copy = [...list];
  switch (activeSort) {
    case 'newest':  return copy.sort((a, b) => b.id - a.id);
    case 'oldest':  return copy.sort((a, b) => a.id - b.id);
    case 'az':      return copy.sort((a, b) => a.text.localeCompare(b.text, 'id'));
    case 'za':      return copy.sort((a, b) => b.text.localeCompare(a.text, 'id'));
    case 'active':  return copy.sort((a, b) => Number(a.done) - Number(b.done));
    case 'done':    return copy.sort((a, b) => Number(b.done) - Number(a.done));
    default:        return copy;
  }
}

/* ── Filter + sort ── */
function getVisibleTodos() {
  let filtered = todos;
  if (activeFilter === 'active')    filtered = todos.filter((t) => !t.done);
  if (activeFilter === 'completed') filtered = todos.filter((t) =>  t.done);
  return getSortedTodos(filtered);
}

/* ── Render ── */
function renderTodos() {
  const visible = getVisibleTodos();
  todoListEl.innerHTML = '';

  if (visible.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-msg';
    li.textContent = 'Tidak ada tugas di sini.';
    todoListEl.appendChild(li);
  } else {
    visible.forEach((todo) => buildTodoItem(todo));
  }

  const remaining = todos.filter((t) => !t.done).length;
  todoCountEl.textContent = `${remaining} tugas tersisa`;
}

function buildTodoItem(todo) {
  const li = document.createElement('li');
  li.className = `todo-item${todo.done ? ' completed' : ''}`;
  li.dataset.id = todo.id;

  /* Checkbox */
  const cb = document.createElement('input');
  cb.type    = 'checkbox';
  cb.checked = todo.done;
  cb.setAttribute('aria-label', 'Tandai selesai');
  cb.addEventListener('change', () => toggleTodo(todo.id));

  /* Text span */
  const span = document.createElement('span');
  span.className   = 'todo-text';
  span.textContent = todo.text;

  /* Action buttons */
  const actions = document.createElement('div');
  actions.className = 'todo-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn-ghost';
  editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>';
  editBtn.setAttribute('aria-label', 'Edit tugas');
  editBtn.addEventListener('click', () => startEdit(todo.id, li, span));

  const delBtn = document.createElement('button');
  delBtn.className = 'btn-ghost';
  delBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
  delBtn.setAttribute('aria-label', 'Hapus tugas');
  delBtn.addEventListener('click', () => deleteTodo(todo.id));

  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  li.appendChild(cb);
  li.appendChild(span);
  li.appendChild(actions);
  todoListEl.appendChild(li);
}

/* ── Inline edit ── */
function startEdit(id, li, span) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;

  // Replace span with input
  const input = document.createElement('input');
  input.type      = 'text';
  input.className = 'todo-edit-input';
  input.value     = todo.text;
  input.maxLength = 100;
  li.replaceChild(input, span);
  input.focus();
  input.select();

  function commitEdit() {
    const newText = input.value.trim();
    if (!newText) {
      showToast('⚠️ Teks tugas tidak boleh kosong.');
      input.focus();
      return;
    }
    // Prevent duplicate on edit (ignore self)
    const duplicate = todos.some(
      (t) => t.id !== id && t.text.toLowerCase() === newText.toLowerCase()
    );
    if (duplicate) {
      showToast('⚠️ Tugas serupa sudah ada!');
      input.focus();
      return;
    }
    todo.text = newText;
    saveTodos();
    renderTodos();
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  commitEdit();
    if (e.key === 'Escape') renderTodos(); // cancel
  });
  input.addEventListener('blur', commitEdit);
}

/* ── Add ── */
function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;

  // Prevent duplicate  ← Challenge ④
  const duplicate = todos.some(
    (t) => t.text.toLowerCase() === text.toLowerCase()
  );
  if (duplicate) {
    showToast('⚠️ Tugas ini sudah ada dalam daftar!');
    todoInput.select();
    return;
  }

  todos.unshift({ id: Date.now(), text, done: false });
  saveTodos();
  renderTodos();
  todoInput.value = '';
  todoInput.focus();
}

function toggleTodo(id) {
  todos = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  saveTodos();
  renderTodos();
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
  renderTodos();
}

function clearCompleted() {
  todos = todos.filter((t) => !t.done);
  saveTodos();
  renderTodos();
}

// Events
addTodoBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });
clearDoneBtn.addEventListener('click', clearCompleted);

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderTodos();
  });
});

// Sort  ← Challenge ⑤
sortSelect.addEventListener('change', () => {
  activeSort = sortSelect.value;
  renderTodos();
});

renderTodos();

/* ─────────────────────────────────────────────
   6. QUICK LINKS
───────────────────────────────────────────── */
const linkNameInput = $('link-name');
const linkUrlInput  = $('link-url');
const addLinkBtn    = $('add-link');
const linksGrid     = $('links-grid');

function defaultLinks() {
  return [
    { id: 1, name: 'Google',   url: 'https://google.com'    },
    { id: 2, name: 'YouTube',  url: 'https://youtube.com'   },
    { id: 3, name: 'GitHub',   url: 'https://github.com'    },
    { id: 4, name: 'RevoU',    url: 'https://revou.co'      },
  ];
}

// Load from localStorage; seed defaults only once
let links = JSON.parse(localStorage.getItem('ld-links'));
if (!links) {
  links = defaultLinks();
  localStorage.setItem('ld-links', JSON.stringify(links));
}

function saveLinks() {
  localStorage.setItem('ld-links', JSON.stringify(links));
}

function faviconUrl(url) {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?sz=64&domain=${hostname}`;
  } catch (_) {
    return '';
  }
}

function renderLinks() {
  linksGrid.innerHTML = '';

  if (links.length === 0) {
    linksGrid.innerHTML = '<p class="empty-msg">Belum ada link tersimpan.</p>';
    return;
  }

  links.forEach((link) => {
    const a = document.createElement('a');
    a.className  = 'link-item';
    a.href       = link.url;
    a.target     = '_blank';
    a.rel        = 'noopener noreferrer';
    a.setAttribute('aria-label', link.name);

    // Favicon img with emoji fallback
    const fav = faviconUrl(link.url);
    if (fav) {
      const img = document.createElement('img');
      img.src       = fav;
      img.alt       = link.name;
      img.className = 'link-icon';
      img.width     = 28;
      img.height    = 28;
      img.addEventListener('error', () => {
        const fb = document.createElement('span');
        fb.className   = 'link-icon-fallback';
        fb.textContent = '🔗';
        img.replaceWith(fb);
      });
      a.appendChild(img);
    } else {
      const fb = document.createElement('span');
      fb.className   = 'link-icon-fallback';
      fb.textContent = '🔗';
      a.appendChild(fb);
    }

    const nameSpan = document.createElement('span');
    nameSpan.textContent = link.name;
    a.appendChild(nameSpan);

    // Remove button
    const rmBtn = document.createElement('button');
    rmBtn.className = 'remove-link';
    rmBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
    rmBtn.setAttribute('aria-label', `Hapus ${link.name}`);
    rmBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      removeLink(link.id);
    });
    a.appendChild(rmBtn);

    linksGrid.appendChild(a);
  });
}

function addLink() {
  const name = linkNameInput.value.trim();
  let   url  = linkUrlInput.value.trim();

  if (!name || !url) {
    showToast('⚠️ Isi nama dan URL terlebih dahulu.');
    return;
  }

  // Auto-prepend https:// if missing
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  try { new URL(url); } catch (_) {
    showToast('⚠️ URL tidak valid. Contoh: https://example.com');
    return;
  }

  links.push({ id: Date.now(), name, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
}

function removeLink(id) {
  links = links.filter((l) => l.id !== id);
  saveLinks();
  renderLinks();
}

addLinkBtn.addEventListener('click', addLink);
linkUrlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });

renderLinks();

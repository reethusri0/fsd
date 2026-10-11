/**
 * LearnZone Ultra — Shared Core & Command Palette Architecture
 * Centralized data management, session handling, theme engine,
 * interactive command palette, modals, toasts, and shell renderer.
 */

// 1. DATA ENCODING & SECURITY HELPERS
function safeObfuscate(str) {
  try {
    return btoa(encodeURIComponent(str));
  } catch {
    return str;
  }
}

function sanitize(str) {
  if (typeof str !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 2. CENTRAL DATA ACCESS LAYER (DB)
const DB = {
  USERS_KEY:       'lzu_users',
  SESSION_KEY:     'lzu_session',
  ASSIGNMENTS_KEY: 'lzu_assignments',
  QUERIES_KEY:     'lzu_queries',
  THEME_KEY:       'lzu_theme',

  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(this.USERS_KEY)) || [];
    } catch { return []; }
  },

  saveUsers(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },

  findUser(email) {
    if (!email) return null;
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  },

  registerUser({ firstName, lastName, age, dob, email, phone, password }) {
    const users = this.getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'email', msg: 'An account with this email already exists.' };
    }
    const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    users.push({
      id, firstName, lastName, age: parseInt(age) || 0, dob, email, phone,
      passwordHash: safeObfuscate(password),
      createdAt: new Date().toISOString()
    });
    this.saveUsers(users);
    return { ok: true };
  },

  loginUser(email, password) {
    const user = this.findUser(email);
    if (!user || user.passwordHash !== safeObfuscate(password)) {
      return { ok: false, msg: 'Invalid email or password. Please verify credentials.' };
    }
    return { ok: true, user };
  },

  getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(this.SESSION_KEY));
    } catch { return null; }
  },

  setSession(user) {
    const session = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      initials: ((user.firstName[0] || 'U') + (user.lastName[0] || '')).toUpperCase()
    };
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    return session;
  },

  clearSession() {
    sessionStorage.removeItem(this.SESSION_KEY);
  },

  getAssignments(userEmail) {
    const key = this.ASSIGNMENTS_KEY + '_' + (userEmail || 'guest');
    try {
      const stored = JSON.parse(localStorage.getItem(key));
      if (stored && Array.isArray(stored)) return stored;
    } catch {}

    const defaults = [
      {
        id: 'asg_1',
        title: 'Neural Network Architectures & PyTorch Optimization',
        subject: 'Machine Learning',
        description: 'Implement backpropagation and convolutional layers for vision benchmarks.',
        dueDate: futureDateISO(3),
        status: 'pending',
        priority: 'high',
        createdAt: new Date().toISOString()
      },
      {
        id: 'asg_2',
        title: 'Distributed Systems & Consensus Mechanisms (Raft)',
        subject: 'Computer Systems',
        description: 'Build a leader-election cluster with heartbeat failure detection in Go.',
        dueDate: futureDateISO(7),
        status: 'pending',
        priority: 'medium',
        createdAt: new Date().toISOString()
      },
      {
        id: 'asg_3',
        title: 'Full-Stack GraphQL & Real-Time Subscriptions',
        subject: 'Web Architecture',
        description: 'Complete schema stitching and Apollo client state caching layer.',
        dueDate: pastDateISO(2),
        status: 'submitted',
        priority: 'low',
        createdAt: new Date().toISOString()
      },
      {
        id: 'asg_4',
        title: 'Relational Database Indexing & B-Tree Algorithms',
        subject: 'Databases',
        description: 'Benchmark composite indices against query execution plans under high concurrency.',
        dueDate: pastDateISO(4),
        status: 'overdue',
        priority: 'high',
        createdAt: new Date().toISOString()
      }
    ];
    this.saveAssignments(userEmail, defaults);
    return defaults;
  },

  saveAssignments(userEmail, assignments) {
    const key = this.ASSIGNMENTS_KEY + '_' + (userEmail || 'guest');
    localStorage.setItem(key, JSON.stringify(assignments));
  },

  submitAssignment(userEmail, id) {
    const assignments = this.getAssignments(userEmail);
    const item = assignments.find(a => a.id === id);
    if (!item) return false;
    item.status = 'submitted';
    item.submittedAt = new Date().toISOString();
    this.saveAssignments(userEmail, assignments);
    return true;
  },

  getQueries() {
    try {
      const q = JSON.parse(localStorage.getItem(this.QUERIES_KEY));
      if (q && Array.isArray(q)) return q;
    } catch {}

    const seed = [
      {
        id: 'qry_1',
        title: 'How does vector quantization improve transformer attention latency?',
        body: 'Investigating KV-cache compression methods for 7B parameters. Has anyone benchmarked throughput differences on Apple Silicon vs CUDA?',
        authorEmail: 'faculty@learnzone.edu',
        authorName: 'Dr. Evelyn Vance',
        tag: 'Machine Learning',
        createdAt: pastDateISO(1)
      },
      {
        id: 'qry_2',
        title: 'Handling distributed transaction deadlocks in microservices architectures',
        body: 'Comparing two-phase commit (2PC) with the Saga pattern for inventory debit workflows. What are the best recovery compensation patterns?',
        authorEmail: 'alex.rivera@mit.edu',
        authorName: 'Alex Rivera',
        tag: 'System Design',
        createdAt: pastDateISO(2)
      }
    ];
    this.saveQueries(seed);
    return seed;
  },

  saveQueries(queries) {
    localStorage.setItem(this.QUERIES_KEY, JSON.stringify(queries));
  },

  addQuery({ title, body, authorEmail, authorName, tag = 'General' }) {
    const queries = this.getQueries();
    const newQ = {
      id: 'qry_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      title: sanitize(title),
      body: sanitize(body),
      tag: sanitize(tag),
      authorEmail, authorName,
      createdAt: new Date().toISOString()
    };
    queries.unshift(newQ);
    this.saveQueries(queries);
    return newQ;
  },

  deleteQuery(id, userEmail) {
    const queries = this.getQueries();
    const idx = queries.findIndex(q => q.id === id && q.authorEmail === userEmail);
    if (idx === -1) return false;
    queries.splice(idx, 1);
    this.saveQueries(queries);
    return true;
  }
};

// 3. DATE & FORMATTING UTILITIES
function futureDateISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function pastDateISO(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function relativeTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

function daysFromToday(isoDate) {
  if (!isoDate) return 0;
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target - now) / 86400000);
}

function dueLabel(isoDate) {
  const d = daysFromToday(isoDate);
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'Due today';
  if (d === 1) return 'Due tomorrow';
  return `Due in ${d} days`;
}

// 4. VALIDATION HELPERS
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(String(phone).trim());
}

// 5. THEME ENGINE
const Theme = {
  init() {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(DB.THEME_KEY);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  toggle() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(DB.THEME_KEY, isDark ? 'dark' : 'light');
    return isDark;
  },

  isDark() {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  }
};

if (typeof window !== 'undefined') {
  Theme.init();
}

// 6. TOAST NOTIFICATION ENGINE
const Toast = {
  _getContainer() {
    let c = document.getElementById('ultra-toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'ultra-toast-container';
      c.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:12px;pointer-events:none;';
      document.body.appendChild(c);
    }
    return c;
  },

  show({ title, msg = '', type = 'info', duration = 4000 }) {
    if (typeof document === 'undefined') return;
    const container = this._getContainer();
    const toast = document.createElement('div');
    toast.style.cssText = 'pointer-events:auto;min-width:320px;max-width:420px;padding:16px 20px;border-radius:14px;background:var(--color-surface);border:1px solid var(--color-border);box-shadow:var(--shadow-elevated);display:flex;align-items:flex-start;gap:14px;animation:ultraFadeInUp 300ms var(--ease-spring);';

    const colors = {
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      info: '#6366F1'
    };
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-triangle-exclamation',
      warning: 'fa-circle-exclamation',
      info: 'fa-sparkles'
    };

    toast.innerHTML = `
      <div style="color:${colors[type] || colors.info};font-size:1.25rem;margin-top:2px;">
        <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
      </div>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:0.9rem;color:var(--color-text);">${sanitize(title)}</div>
        ${msg ? `<div style="font-size:0.8rem;color:var(--color-text-secondary);margin-top:2px;">${sanitize(msg)}</div>` : ''}
      </div>
      <button style="background:none;border:none;color:var(--color-text-muted);cursor:pointer;font-size:0.9rem;" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, duration);
  },

  success(title, msg) { this.show({ title, msg, type: 'success' }); },
  error(title, msg)   { this.show({ title, msg, type: 'error' }); },
  info(title, msg)    { this.show({ title, msg, type: 'info' }); },
  warning(title, msg) { this.show({ title, msg, type: 'warning' }); }
};

// 7. CONFIRMATION MODAL
function confirmModal({ title = 'Confirm Action', body = 'Are you sure you want to proceed?', confirmText = 'Confirm', dangerMode = false }) {
  return new Promise(resolve => {
    const backdrop = document.createElement('div');
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.6);backdrop-filter:blur(8px);z-index:999;display:flex;align-items:center;justify-content:center;padding:16px;animation:ultraFadeInUp 200ms ease;';

    backdrop.innerHTML = `
      <div style="background:var(--color-surface);border:1px solid var(--color-border);border-radius:24px;box-shadow:var(--shadow-elevated);width:100%;max-width:440px;padding:28px;text-align:left;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:40px;height:40px;border-radius:12px;background:${dangerMode ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)'};color:${dangerMode ? '#EF4444' : '#6366F1'};display:flex;align-items:center;justify-content:center;font-size:1.15rem;">
            <i class="fas ${dangerMode ? 'fa-exclamation-triangle' : 'fa-circle-question'}"></i>
          </div>
          <h3 style="font-size:1.2rem;font-weight:700;color:var(--color-text);">${sanitize(title)}</h3>
        </div>
        <p style="color:var(--color-text-secondary);font-size:0.9rem;line-height:1.5;margin-bottom:24px;">${sanitize(body)}</p>
        <div style="display:flex;justify-content:flex-end;gap:12px;">
          <button id="modal-cancel-btn" class="btn-ultra btn-ultra-secondary" style="padding:8px 18px;font-size:0.85rem;">Cancel</button>
          <button id="modal-confirm-btn" class="btn-ultra ${dangerMode ? 'btn-ultra-primary' : 'btn-ultra-primary'}" style="${dangerMode ? 'background:#EF4444;' : ''}padding:8px 18px;font-size:0.85rem;">${sanitize(confirmText)}</button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = (val) => {
      backdrop.remove();
      resolve(val);
    };

    backdrop.querySelector('#modal-cancel-btn').addEventListener('click', () => close(false));
    backdrop.querySelector('#modal-confirm-btn').addEventListener('click', () => close(true));
    backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(false); });
  });
}

// 8. AUTH GUARDS
function requireAuth() {
  const session = DB.getSession();
  if (!session) {
    if (typeof window !== 'undefined') {
      window.location.href = 'login.html';
    }
    return null;
  }
  return session;
}

function redirectIfAuthed() {
  if (typeof window !== 'undefined' && DB.getSession()) {
    window.location.href = 'home.html';
  }
}

// 9. COMMAND PALETTE LOGIC
function initCommandPalette() {
  let overlay = document.getElementById('commandPaletteOverlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'commandPaletteOverlay';
    overlay.className = 'command-overlay';
    overlay.innerHTML = `
      <div class="command-box">
        <div class="command-search-header">
          <i class="fas fa-search" style="color:var(--color-text-muted);"></i>
          <input type="text" id="cmdInput" placeholder="Navigate anywhere or search tasks (ESC to exit)..." autocomplete="off" />
        </div>
        <div class="command-list" id="cmdList">
          <div class="command-item" data-href="home.html"><i class="fas fa-home"></i> <span>Home Overview</span> <span class="kbd-shortcut">G H</span></div>
          <div class="command-item" data-href="dashboard.html"><i class="fas fa-chart-pie"></i> <span>Learning Analytics & KPIs</span> <span class="kbd-shortcut">G D</span></div>
          <div class="command-item" data-href="performance.html"><i class="fas fa-chart-line"></i> <span>Performance & Grades</span> <span class="kbd-shortcut">G P</span></div>
          <div class="command-item" data-href="assignments.html"><i class="fas fa-tasks"></i> <span>Course Assignments</span> <span class="kbd-shortcut">G A</span></div>
          <div class="command-item" data-href="queries.html"><i class="fas fa-comments"></i> <span>Academic Discussions</span> <span class="kbd-shortcut">G Q</span></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#cmdInput');
    const items = overlay.querySelectorAll('.command-item');

    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      items.forEach(it => {
        const txt = it.textContent.toLowerCase();
        it.style.display = txt.includes(q) ? 'flex' : 'none';
      });
    });

    items.forEach(it => {
      it.addEventListener('click', () => {
        const href = it.getAttribute('data-href');
        if (href) window.location.href = href;
      });
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  }

  // Global Keyboard Listener for CMD+K or CTRL+K
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const open = overlay.classList.toggle('open');
      if (open) {
        setTimeout(() => overlay.querySelector('#cmdInput').focus(), 50);
      }
    }
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      overlay.classList.remove('open');
    }
  });
}

// 10. SIGNATURE SHELL RENDERER
function renderShell(session, activePage) {
  const navItems = [
    { href: 'home.html',        icon: 'fa-compass',      label: 'Overview' },
    { href: 'dashboard.html',   icon: 'fa-chart-pie',    label: 'Dashboard' },
    { href: 'performance.html', icon: 'fa-chart-line',   label: 'Performance' },
    { href: 'assignments.html', icon: 'fa-tasks',        label: 'Assignments' },
    { href: 'queries.html',     icon: 'fa-comments',     label: 'Discussions' }
  ];

  const sidebarEl = document.getElementById('appSidebar');
  const topbarEl  = document.getElementById('appTopbar');

  if (sidebarEl) {
    sidebarEl.innerHTML = `
      <div class="sidebar-header">
        <a href="home.html" class="ultra-brand">
          <div class="brand-icon-wrap">
            <i class="fas fa-cube" style="color:#FFF;"></i>
          </div>
          <div>
            <span class="brand-text">LearnZone</span>
            <span class="brand-badge">ULTRA</span>
          </div>
        </a>
      </div>

      <div class="sidebar-profile">
        <div class="avatar-ring">
          <div class="avatar-inner">${session.initials}</div>
        </div>
        <div class="profile-meta">
          <div class="profile-name">${sanitize(session.firstName + ' ' + session.lastName)}</div>
          <div class="profile-subtitle">
            <span class="status-dot"></span> Active Student
          </div>
        </div>
      </div>

      <nav class="sidebar-nav" role="navigation" aria-label="Main navigation">
        <div class="nav-section-label">Academic Portal</div>
        ${navItems.map(item => `
          <a href="${item.href}" class="nav-pill ${activePage === item.href ? 'active' : ''}">
            <i class="fas ${item.icon}"></i>
            <span>${item.label}</span>
          </a>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <button class="btn-sidebar-logout" id="sidebarLogout">
          <i class="fas fa-arrow-right-from-bracket"></i>
          <span>Sign Out</span>
        </button>
      </div>
    `;

    document.getElementById('sidebarLogout').addEventListener('click', async () => {
      const ok = await confirmModal({
        title: 'Sign Out Confirmation',
        body: 'Are you sure you want to exit your active student session?',
        confirmText: 'Sign Out'
      });
      if (ok) {
        DB.clearSession();
        window.location.href = 'login.html';
      }
    });
  }

  if (topbarEl) {
    const titles = {
      'home.html':        { title: 'Academic Hub', subtitle: `Welcome back, ${session.firstName}` },
      'dashboard.html':   { title: 'Intelligence Dashboard', subtitle: 'Real-time telemetry and milestones' },
      'performance.html': { title: 'Academic Analytics', subtitle: 'Grade distribution and mastery curves' },
      'assignments.html': { title: 'Coursework Operations', subtitle: 'Deliverables and deadline pipeline' },
      'queries.html':     { title: 'Research & Discussions', subtitle: 'Peer collaboration forum' }
    };
    const meta = titles[activePage] || { title: 'LearnZone', subtitle: '' };

    topbarEl.innerHTML = `
      <div class="topbar-left">
        <button class="mobile-nav-toggle" id="mobileNavToggle" aria-label="Toggle navigation">
          <i class="fas fa-bars"></i>
        </button>
        <div>
          <h1 class="topbar-title">${meta.title}</h1>
          <div class="topbar-subtitle">${meta.subtitle}</div>
        </div>
      </div>

      <div class="topbar-actions">
        <button class="command-palette-trigger" id="cmdTriggerBtn">
          <i class="fas fa-search"></i>
          <span>Search or jump...</span>
          <span class="kbd-shortcut">⌘K</span>
        </button>

        <button class="action-icon-btn" id="themeToggleBtn" aria-label="Toggle visual theme">
          <i class="fas ${Theme.isDark() ? 'fa-sun' : 'fa-moon'}"></i>
        </button>

        <button class="action-icon-btn" id="notifBtn" aria-label="Notifications">
          <i class="fas fa-bell"></i>
          <span class="badge-counter">2</span>
        </button>
      </div>
    `;

    // Hook events
    document.getElementById('themeToggleBtn').addEventListener('click', () => {
      Theme.toggle();
      const icon = document.querySelector('#themeToggleBtn i');
      if (icon) icon.className = `fas ${Theme.isDark() ? 'fa-sun' : 'fa-moon'}`;
      Toast.info('Theme Toggled', `Switched to ${Theme.isDark() ? 'Midnight Obsidian' : 'Luminous Editorial'} mode.`);
    });

    document.getElementById('cmdTriggerBtn')?.addEventListener('click', () => {
      const ov = document.getElementById('commandPaletteOverlay');
      if (ov) {
        ov.classList.add('open');
        setTimeout(() => ov.querySelector('#cmdInput').focus(), 50);
      }
    });

    document.getElementById('notifBtn')?.addEventListener('click', () => {
      Toast.info('Recent Notifications', '1 assignment due in 3 days; 1 peer responded to your discussion.');
    });

    // Mobile drawer toggle
    const toggle = document.getElementById('mobileNavToggle');
    const sidebar = document.getElementById('appSidebar');
    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'sidebar-backdrop';
      document.body.appendChild(backdrop);
    }

    toggle?.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      backdrop.classList.toggle('active');
    });

    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    });
  }

  initCommandPalette();
}

// 11. NODE.JS EXPORTS FOR AUTOMATED TESTING
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DB,
    Theme,
    Toast,
    confirmModal,
    requireAuth,
    redirectIfAuthed,
    renderShell,
    isValidEmail,
    isValidPhone,
    futureDateISO,
    pastDateISO,
    formatDate,
    relativeTime,
    daysFromToday,
    dueLabel,
    sanitize
  };
}

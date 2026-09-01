/**
 * app.js — 纯 HTML 公共布局、主题切换、导航管理
 */
const App = (() => {
  const NAV_ITEMS = [
    { label: '首页', icon: 'home', href: './index.html', id: 'home' },
    { label: '文章', icon: 'text_snippet', href: './articles.html', id: 'articles' },
    { label: '归档', icon: 'archive', href: './archive.html', id: 'archive' },
    { label: '关于', icon: 'person', href: './about.html', id: 'about' },
  ];

  const BOTTOM_NAV_ITEMS = [
    { label: '首页', icon: 'home', href: './index.html', id: 'home' },
    { label: '文章', icon: 'text_snippet', href: './articles.html', id: 'articles' },
    { label: '关于', icon: 'person', href: './about.html', id: 'about' },
  ];

  function getTheme() {
    return localStorage.getItem('theme') || 'auto';
  }

  function applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      html.setAttribute('data-theme', 'light');
    } else {
      html.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
  }

  function getThemeIcon() {
    const t = getTheme();
    if (t === 'dark') return 'dark_mode';
    if (t === 'light') return 'light_mode';
    return 'brightness_auto';
  }

  function cycleTheme() {
    const t = getTheme();
    applyTheme(t === 'auto' ? 'light' : t === 'light' ? 'dark' : 'auto');
    const btn = document.getElementById('theme-btn');
    if (btn) {
      const icon = btn.querySelector('.material-symbols-rounded');
      if (icon) icon.textContent = getThemeIcon();
    }
  }

  function init(config) {
    const { activeNav, title } = config;
    const pageTitle = title || ({ home:'首页', articles:'文章', archive:'归档', about:'关于', admin:'管理后台' }[activeNav] || '元子鹅の网站');

    applyTheme(getTheme());

    const app = document.getElementById('app');
    if (!app) return null;

    // Desktop nav items
    const navItemsHtml = NAV_ITEMS.map(item =>
      `<a class="nav-rail-item ${item.id === activeNav ? 'active' : ''}" href="${item.href}">
        <span class="material-symbols-rounded">${item.icon}</span>${item.label}
      </a>`
    ).join('');

    // Mobile drawer items
    const drawerItemsHtml = NAV_ITEMS.map(item =>
      `<a class="nav-rail-item ${item.id === activeNav ? 'active' : ''}" href="${item.href}">
        <span class="material-symbols-rounded">${item.icon}</span>${item.label}
      </a>`
    ).join('');

    // Bottom nav items
    const bottomNavHtml = BOTTOM_NAV_ITEMS.map(item =>
      `<a class="bottom-nav-item ${item.id === activeNav ? 'active' : ''}" href="${item.href}">
        <div class="nav-indicator"></div>
        <span class="material-symbols-rounded">${item.icon}</span>
        <span>${item.label}</span>
      </a>`
    ).join('');

    app.innerHTML = `
      <!-- Top App Bar -->
      <header class="top-bar" id="top-bar">
        <button class="top-bar-leading" id="menu-btn" aria-label="菜单">
          <span class="material-symbols-rounded">menu</span>
        </button>
        <span class="top-bar-title">${pageTitle}</span>
        <div class="top-bar-actions">
          <button class="btn-icon" id="theme-btn" aria-label="切换主题">
            <span class="material-symbols-rounded">${getThemeIcon()}</span>
          </button>
        </div>
      </header>

      <!-- Desktop Navigation Rail -->
      <nav class="nav-rail" id="nav-rail">
        <ul class="nav-rail-list">
          ${navItemsHtml}
          <li class="nav-rail-divider"></li>
          <a class="nav-rail-item" href="./admin.html">
            <span class="material-symbols-rounded">admin_panel_settings</span>管理
          </a>
        </ul>
      </nav>

      <!-- Mobile Drawer Overlay -->
      <div class="nav-drawer-overlay" id="drawer-overlay"></div>

      <!-- Mobile Navigation Drawer -->
      <nav class="nav-drawer" id="nav-drawer">
        <div class="nav-drawer-header">元子鹅の网站</div>
        ${drawerItemsHtml}
        <div class="nav-rail-divider"></div>
        <a class="nav-rail-item" href="./admin.html">
          <span class="material-symbols-rounded">admin_panel_settings</span>管理
        </a>
      </nav>

      <!-- Main Content -->
      <main class="main-content" id="main-content"></main>

      <!-- Bottom Navigation -->
      <nav class="bottom-nav" id="bottom-nav">
        ${bottomNavHtml}
      </nav>
    `;

    // Bind events
    const menuBtn = document.getElementById('menu-btn');
    const drawer = document.getElementById('nav-drawer');
    const overlay = document.getElementById('drawer-overlay');
    const themeBtn = document.getElementById('theme-btn');
    const topBar = document.getElementById('top-bar');

    function openDrawer() {
      drawer.classList.add('open');
      overlay.classList.add('open');
    }
    function closeDrawer() {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
    }

    menuBtn.addEventListener('click', () => {
      drawer.classList.contains('open') ? closeDrawer() : openDrawer();
    });
    overlay.addEventListener('click', closeDrawer);
    themeBtn.addEventListener('click', cycleTheme);

    // Top bar scroll effect
    window.addEventListener('scroll', () => {
      topBar.classList.toggle('scrolled', window.scrollY > 4);
    }, { passive: true });

    // Auto-patch text-field label backgrounds on DOM changes
    const mainContent = document.getElementById('main-content');
    new MutationObserver(() => patchTextFieldLabels(mainContent))
      .observe(mainContent, { childList: true, subtree: true });

    return mainContent;
  }

  // --- Utilities ---
  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  }

  function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  function stripHtml(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    return d.textContent || '';
  }

  let _articleIndex = null;
  async function loadArticleIndex() {
    if (_articleIndex) return _articleIndex;
    try {
      const r = await fetch('./Articles/index.json');
      if (!r.ok) return [];
      _articleIndex = await r.json();
      return _articleIndex;
    } catch { return []; }
  }

  async function loadArticleContent(id) {
    try {
      const r = await fetch(`./Articles/${id}/content.html`);
      if (!r.ok) return null;
      return await r.text();
    } catch { return null; }
  }

  function getArticleId() {
    return new URLSearchParams(window.location.search).get('id');
  }

  function showSnackbar(msg, isError = false) {
    const old = document.querySelector('.snackbar');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'snackbar' + (isError ? ' error' : '');
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3000);
  }

  /** 自动修正 text-field label 背景色，使其匹配所在容器的实际背景 */
  function patchTextFieldLabels(root) {
    (root || document).querySelectorAll('.text-field label').forEach(label => {
      let el = label.parentElement;
      while (el && el !== document.body) {
        const bg = getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          label.style.backgroundColor = bg;
          return;
        }
        el = el.parentElement;
      }
      label.style.backgroundColor = '';
    });
  }

  return { init, getTheme, applyTheme, loadArticleIndex, loadArticleContent, getArticleId, formatDate, escapeHtml, stripHtml, showSnackbar, patchTextFieldLabels };
})();

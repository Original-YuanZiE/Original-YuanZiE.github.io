/* ===== Theme Manager ===== */

const Theme = (() => {
  const STORAGE_KEY = 'theme';
  const THEMES = ['auto', 'light', 'dark'];
  const ICONS = {
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 3v9l4 4"/></svg>',
    light: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    dark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  };
  const LABELS = { auto: '自动', light: '浅色', dark: '深色' };

  function get() {
    return localStorage.getItem(STORAGE_KEY) || 'auto';
  }

  function set(theme) {
    localStorage.setItem(STORAGE_KEY, theme);
    apply(theme);
    updateButton(theme);
  }

  function apply(theme) {
    let effective;
    if (theme === 'auto') {
      effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effective = theme;
    }
    document.documentElement.setAttribute('data-theme', effective);
  }

  function updateButton(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.innerHTML = ICONS[theme] + '<span>' + LABELS[theme] + '</span>';
    btn.setAttribute('aria-label', '主题: ' + LABELS[theme]);
  }

  function cycle() {
    const current = get();
    const idx = THEMES.indexOf(current);
    set(THEMES[(idx + 1) % THEMES.length]);
  }

  function init() {
    const theme = get();
    apply(theme);
    updateButton(theme);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (get() === 'auto') apply('auto');
    });
  }

  return { init, cycle, get, set };
})();

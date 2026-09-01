/* ===== Sidebar Controller ===== */

const Sidebar = (() => {
  let isOpen = window.innerWidth >= 1024;

  function toggle() {
    isOpen ? close() : open();
  }

  function open() {
    const sidebar = document.querySelector('.sidebar');
    const app = document.querySelector('.app');
    if (!sidebar) return;

    isOpen = true;
    sidebar.classList.add('open');
    if (app) app.classList.add('sidebar-open');
    if (window.innerWidth < 1024) {
      document.body.style.overflow = 'hidden';
      // Delayed listener so the opening click doesn't immediately close it
      setTimeout(() => document.addEventListener('click', onOutsideClick, true), 0);
    }
  }

  function close() {
    const sidebar = document.querySelector('.sidebar');
    const app = document.querySelector('.app');
    if (!sidebar) return;

    isOpen = false;
    sidebar.classList.remove('open');
    if (app) app.classList.remove('sidebar-open');
    document.body.style.overflow = '';
    document.removeEventListener('click', onOutsideClick, true);
  }

  function onOutsideClick(e) {
    const sidebar = document.querySelector('.sidebar');
    const hamburger = document.getElementById('hamburger');
    if (!sidebar) return;
    // If click is outside sidebar and not on hamburger, close
    if (!sidebar.contains(e.target) && (!hamburger || !hamburger.contains(e.target))) {
      close();
    }
  }

  function updateActiveNav(hash) {
    const path = hash || location.hash.slice(1) || '/';
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('data-route');
      if (!href) return;
      const active = href === '/' ? path === '/' : path.startsWith(href);
      item.classList.toggle('active', active);
    });
  }

  function initScrollEffect() {
    const topBar = document.getElementById('top-bar');
    if (!topBar) return;

    function checkScroll() {
      if (window.scrollY > 20) {
        topBar.classList.add('scrolled');
      } else {
        topBar.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
  }

  function init() {
    const hamburger = document.getElementById('hamburger');
    const sidebar = document.querySelector('.sidebar');
    const app = document.querySelector('.app');

    if (window.innerWidth >= 1024 && sidebar) {
      sidebar.classList.add('open');
      if (app) app.classList.add('sidebar-open');
    }

    if (hamburger) hamburger.addEventListener('click', toggle);

    window.addEventListener('hashchange', () => {
      updateActiveNav();
      if (window.innerWidth < 1024 && isOpen) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });

    window.addEventListener('resize', () => {
      const sidebar = document.querySelector('.sidebar');
      const app = document.querySelector('.app');
      if (!sidebar) return;
      if (window.innerWidth >= 1024) {
        sidebar.classList.add('open');
        if (app) app.classList.add('sidebar-open');
        isOpen = true;
        document.body.style.overflow = '';
        document.removeEventListener('click', onOutsideClick, true);
      }
    });

    updateActiveNav();
    initScrollEffect();
  }

  return { init, toggle, open, close, updateActiveNav };
})();

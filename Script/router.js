/* ===== Hash Router ===== */

const Router = (() => {
  const routes = [];

  function add(pattern, handler) {
    // Convert :param to named capture groups
    const regex = new RegExp(
      '^' + pattern.replace(/:[a-zA-Z]+/g, '([^/]+)') + '$'
    );
    routes.push({ pattern, regex, handler });
  }

  function navigate(hash) {
    location.hash = hash;
  }

  function resolve() {
    const path = location.hash.slice(1) || '/';

    for (const route of routes) {
      const match = path.match(route.regex);
      if (match) {
        const params = match.slice(1);
        route.handler(...params);
        return;
      }
    }

    // 404 fallback — go home
    navigate('/');
  }

  function init() {
    window.addEventListener('hashchange', resolve);
    // Initial route
    resolve();
  }

  return { add, navigate, init };
})();

// ── Hash-based Router ────────────────────────────────────────────────
const routes = {};
let currentCleanup = null;

export function route(path, handler) {
  routes[path] = handler;
}

export function navigate(path) {
  window.location.hash = path;
}

export function startRouter() {
  const resolve = () => {
    const hash = window.location.hash.slice(1) || '/';
    const app = document.getElementById('app');

    // Run cleanup for previous page if any
    if (currentCleanup && typeof currentCleanup === 'function') {
      currentCleanup();
      currentCleanup = null;
    }

    // Re-trigger fade animation
    app.style.animation = 'none';
    app.offsetHeight; // force reflow
    app.style.animation = '';

    const handler = routes[hash] || routes['/'];
    if (handler) {
      currentCleanup = handler(app);
    }
  };

  window.addEventListener('hashchange', resolve);
  resolve();
}

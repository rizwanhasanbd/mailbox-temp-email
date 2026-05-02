/* ===== Theme Manager =====
 * Dark mode is the default on first visit.
 * User preference is persisted in localStorage.
 * Runs immediately (before DOMContentLoaded) to avoid theme flash.
 */
(function () {
  const STORAGE_KEY = 'mailbox_theme';
  const DEFAULT_THEME = 'dark';

  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
    } catch (_) {
      return DEFAULT_THEME;
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
  }

  // Apply immediately to prevent flash of wrong theme
  applyTheme(getSavedTheme());

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  function bind() {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggleTheme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  // Expose for debugging / external triggers
  window.Theme = { apply: applyTheme, toggle: toggleTheme };
})();

// Audia shared header component behavior.

(function () {
  const NAV_BOXES_KEY = 'audia_nav_boxes';
  const navColors = ['#D97757', '#E8956E', '#F2B08D', '#A85A3F', '#FFFFFF'];
  const resizeTimers = new WeakMap();

  const icons = {
    dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 15.5A7 7 0 0 1 8.5 6a7 7 0 1 0 9.5 9.5Z"/></svg>',
    light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/></svg>',
  };

  // ── Nav Boxes ──────────────────────────────────────────────────────────
  function buildNavBoxes(boxesEl) {
    if (!boxesEl) return;
    boxesEl.innerHTML = '';
    const isSmall = window.matchMedia('(max-width: 820px)').matches;
    const cols = isSmall ? 16 : 32;
    const rows = 6;
    boxesEl.style.setProperty('--nav-box-cols', cols);
    for (let i = 0; i < rows * cols; i++) {
      const cell = document.createElement('span');
      cell.className = 'nav-box-cell';
      cell.addEventListener('mouseenter', () => {
        const color = navColors[Math.floor(Math.random() * navColors.length)];
        cell.style.backgroundColor = color;
        cell.style.borderColor = color;
        window.setTimeout(() => {
          cell.style.backgroundColor = '';
          cell.style.borderColor = '';
        }, 650);
      });
      boxesEl.appendChild(cell);
    }
  }

  function isNavBoxesOn() {
    const stored = localStorage.getItem(NAV_BOXES_KEY);
    return stored === null ? true : stored === 'true';
  }

  function applyNavBoxes(active) {
    const nav = document.querySelector('.nav');
    if (!nav) return;
    nav.classList.toggle('has-boxes', active);
    localStorage.setItem(NAV_BOXES_KEY, String(active));
    document.querySelectorAll('[data-dev-nav-boxes]').forEach(btn => {
      btn.classList.toggle('primary', active);
    });
  }

  window.audiaNavBoxes = { apply: applyNavBoxes, isOn: isNavBoxesOn };

  // ── Hamburger / Mobile Drawer ──────────────────────────────────────────
  function initMobileMenu() {
    const hamburger = document.getElementById('nav-hamburger');
    const drawer = document.getElementById('nav-mobile-drawer');
    if (!hamburger || !drawer) return;

    function openMenu() {
      drawer.classList.add('open');
      drawer.setAttribute('aria-hidden', 'false');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onEscape);
      document.addEventListener('click', onOutsideClick, true);
    }

    function closeMenu() {
      drawer.classList.remove('open');
      drawer.setAttribute('aria-hidden', 'true');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onEscape);
      document.removeEventListener('click', onOutsideClick, true);
    }

    function onEscape(e) { if (e.key === 'Escape') closeMenu(); }

    function onOutsideClick(e) {
      const nav = document.getElementById('site-nav');
      if (!nav?.contains(e.target) && !drawer.contains(e.target)) closeMenu();
    }

    hamburger.addEventListener('click', () => {
      if (drawer.classList.contains('open')) closeMenu(); else openMenu();
    });

    // Close drawer on link click
    drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  }

  // ── Theme buttons ──────────────────────────────────────────────────────
  function normalizeThemeButtons() {
    document.querySelectorAll('.theme-btn[data-theme]').forEach((button) => {
      const theme = button.dataset.theme;
      if (!icons[theme]) return;
      button.innerHTML = icons[theme];
      button.setAttribute('aria-label', theme === 'light' ? 'Tema claro' : 'Tema escuro');
      button.setAttribute('type', 'button');
    });
  }

  function normalizeLogo() {
    document.querySelectorAll('.nav-logo').forEach((logo) => {
      logo.setAttribute('aria-label', logo.getAttribute('aria-label') || 'Audia - inicio');
    });
  }

  function initHeader() {
    document.body.classList.toggle('has-site-header', Boolean(document.querySelector('.nav')));
    normalizeLogo();
    normalizeThemeButtons();

    const boxesEl = document.querySelector('.nav-boxes');
    buildNavBoxes(boxesEl);
    applyNavBoxes(isNavBoxesOn());

    window.addEventListener('resize', () => {
      if (!boxesEl) return;
      window.clearTimeout(resizeTimers.get(boxesEl));
      const t = window.setTimeout(() => buildNavBoxes(boxesEl), 200);
      resizeTimers.set(boxesEl, t);
    });

    initMobileMenu();

    if (window.audiaTheme?.apply) {
      window.audiaTheme.apply(window.audiaTheme.current() || 'dark');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
  } else {
    initHeader();
  }
})();

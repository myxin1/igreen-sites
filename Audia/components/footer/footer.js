(function () {
  const footerColors = ['#D97757', '#E8956E', '#F2B08D', '#A85A3F', '#FFFFFF'];
  const resizeTimers = new WeakMap();

  function getAssetPrefix() {
    const path = window.location.pathname.replace(/\\/g, '/');
    return path.includes('/roadmap/') ? '../' : '';
  }

  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light' ||
      document.body.classList.contains('light-theme');
  }

  function syncFooterLogos() {
    const prefix = getAssetPrefix();
    const logo = isLightTheme()
      ? 'Logo/Audia 2 - fundo branco.png'
      : 'Logo/Audia 1 - fundo preto.png';

    document.querySelectorAll('[data-audia-footer-logo], #footer-logo-img').forEach(img => {
      img.src = prefix + logo;
    });
  }

  function buildFooterBoxes(footerBoxes) {
    if (!footerBoxes) return;
    footerBoxes.innerHTML = '';

    const isSmall = window.matchMedia('(max-width: 640px)').matches;
    const cols = isSmall ? 12 : 24;
    const rows = isSmall ? 9 : 15;

    footerBoxes.style.setProperty('--footer-box-cols', cols);

    for (let i = 0; i < rows * cols; i += 1) {
      const cell = document.createElement('span');
      cell.className = 'footer-box-cell';
      cell.addEventListener('mouseenter', () => {
        const color = footerColors[Math.floor(Math.random() * footerColors.length)];
        cell.style.backgroundColor = color;
        cell.style.borderColor = color;
        window.setTimeout(() => {
          cell.style.backgroundColor = '';
          cell.style.borderColor = '';
        }, 650);
      });
      footerBoxes.appendChild(cell);
    }
  }

  function initFooter(footer) {
    const boxes = footer.querySelector('.footer-boxes');
    buildFooterBoxes(boxes);
  }

  function init() {
    document.querySelectorAll('.site-footer').forEach(initFooter);
    syncFooterLogos();

    window.addEventListener('resize', () => {
      document.querySelectorAll('.footer-boxes').forEach(boxes => {
        window.clearTimeout(resizeTimers.get(boxes));
        const timer = window.setTimeout(() => buildFooterBoxes(boxes), 180);
        resizeTimers.set(boxes, timer);
      });
    });

    const observer = new MutationObserver(syncFooterLogos);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

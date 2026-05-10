// Audia — Sistema de tema global (dark / light)
// Incluir em TODAS as páginas antes do </body>

(function () {
  const LOGOS = {
    dark:  'Logo/Audia 1 - fundo preto.png',    // site preto → logo fundo preto
    light: 'Logo/Audia 2 - fundo branco.png',   // site branco → logo fundo branco
  };

  function logoSrc(theme, base) {
    const path = LOGOS[theme];
    // Ajusta o caminho relativo conforme a profundidade da página
    if (base) return base + path;
    return path;
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('audia_theme', theme);

    // Atualiza botões do switcher (se existirem na página)
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });

    // Descobre profundidade pelo <html data-base>
    const base = document.documentElement.dataset.base || '';

    // Troca logos por id
    ['hero-logo-img', 'nav-logo-img', 'footer-logo-img', 'home-brand-logo'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.src = logoSrc(theme, base);
    });
  }

  // Aplica tema salvo imediatamente (evita flash)
  const saved = localStorage.getItem('audia_theme') || 'dark';
  applyTheme(saved);

  // Expõe para que os botões de toggle possam chamar
  window.audiaTheme = { apply: applyTheme, current: () => document.documentElement.getAttribute('data-theme') };

  // Bind automático quando o DOM estiver pronto
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => window.audiaTheme.apply(btn.dataset.theme));
    });
  });
})();

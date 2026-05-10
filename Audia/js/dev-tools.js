// Audia DEV Tools — visual placeholders and copy helpers

(function () {
  const STORAGE_KEY = 'audia_dev_tools';

  const FONTS = [
    {
      id: 'sistema',
      label: 'Sistema',
      sub: 'SF Pro · Segoe UI · padrão do OS',
      stack: `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif`,
      googleUrl: null,
    },
    {
      id: 'inter',
      label: 'Inter',
      sub: 'Geométrica · moderna · SaaS',
      stack: `'Inter', sans-serif`,
      googleUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
    },
    {
      id: 'nunito',
      label: 'Nunito',
      sub: 'Arredondada · wellness · acolhedora',
      stack: `'Nunito', sans-serif`,
      googleUrl: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap',
    },
    {
      id: 'lora',
      label: 'Lora',
      sub: 'Serifada · premium · editorial',
      stack: `'Lora', Georgia, serif`,
      googleUrl: 'https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap',
    },
    {
      id: 'dmserif',
      label: 'DM Serif Display',
      sub: 'Serifada alta · luxo · contraste',
      stack: `'DM Serif Display', Georgia, serif`,
      googleUrl: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap',
    },
    {
      id: 'outfit',
      label: 'Outfit',
      sub: 'Geométrica · amigável · legível',
      stack: `'Outfit', sans-serif`,
      googleUrl: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&display=swap',
    },
    {
      id: 'syne',
      label: 'Syne',
      sub: 'Display · bold · futurista',
      stack: `'Syne', sans-serif`,
      googleUrl: 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap',
    },
    {
      id: 'plusjakarta',
      label: 'Plus Jakarta Sans',
      sub: 'Humanista · moderna · refinada',
      stack: `'Plus Jakarta Sans', sans-serif`,
      googleUrl: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
    },
  ];

  const FONT_STORAGE_KEY = 'audia_dev_font';
  const HERO_VARIANT_KEY = 'audia_hero_variant';
  const AUTH_VARIANT_KEY = 'audia_auth_variant';

  function applyFont(fontId) {
    const font = FONTS.find(f => f.id === fontId) || FONTS[0];
    // Load Google Font if needed
    if (font.googleUrl && !document.getElementById(`gfont-${fontId}`)) {
      const link = document.createElement('link');
      link.id = `gfont-${fontId}`;
      link.rel = 'stylesheet';
      link.href = font.googleUrl;
      document.head.appendChild(link);
    }
    // Override --font on both :root elements
    document.documentElement.style.setProperty('--font', font.stack);
    document.querySelectorAll('button, input').forEach(el => {
      el.style.fontFamily = font.stack;
    });
    localStorage.setItem(FONT_STORAGE_KEY, fontId);
    // Update button states in panel
    document.querySelectorAll('[data-dev-font]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.devFont === fontId);
    });
  }

  // Apply saved font on boot
  const savedFont = localStorage.getItem(FONT_STORAGE_KEY);
  if (savedFont && savedFont !== 'sistema') applyFont(savedFont);

  const PAGES = [
    { name: 'Inicio do App', path: 'app.html#tab-home', description: 'Tela inicial do app e menu principal de estados mentais' },
    { name: 'Score / Progresso', path: 'app.html#tab-progress', description: 'Aba aberta ao clicar no score do topo' },
    { name: 'Landing', path: 'index.html', description: 'Página comercial e apresentação do Audia' },
    { name: 'App', path: 'app.html', description: 'Assistente mental, sessões, player e progresso' },
    { name: 'Roadmap', path: 'roadmap/index.html', description: 'Painel estratégico de fases, tarefas e previsão' },
    { name: 'Arquitetura', path: 'ARCHITECTURE.md', description: 'Mapa técnico da estrutura do projeto' },
  ];

  const MOBILE_PREVIEW_KEY = 'audia_dev_mobile';

  const DEFAULT_STATE = {
    panelOpen: false,
    placeholdersEnabled: false,
    hiddenPlaceholders: [],
    placeholderPositions: {},
  };

  const state = loadState();
  let panel;
  let toastTimer;
  let scanTimer;
  let dragState = null;

  function loadState() {
    try {
      return { ...DEFAULT_STATE, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
    } catch (_) {
      return { ...DEFAULT_STATE };
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function isMobilePreview() {
    return localStorage.getItem(MOBILE_PREVIEW_KEY) === 'true';
  }

  function applyMobilePreview(active) {
    document.documentElement.classList.toggle('dev-mobile-preview', active);
    localStorage.setItem(MOBILE_PREVIEW_KEY, String(active));
    const btn = document.querySelector('[data-dev-mobile-toggle]');
    if (btn) btn.classList.toggle('primary', active);
  }

  function boot() {
    buildLauncher();
    buildPanel();
    bindDelegatedPlaceholderActions();
    observeDomChanges();

    if (state.panelOpen) openPanel();
    if (state.placeholdersEnabled) addAllPlaceholders(false);
    if (isMobilePreview()) applyMobilePreview(true);
  }

  function buildLauncher() {
    const existing = document.getElementById('dev-launcher');
    const launcher = existing || document.createElement('button');
    launcher.id = 'dev-launcher';
    launcher.type = 'button';
    launcher.className = existing ? `${existing.className} dev-launcher`.trim() : 'dev-launcher dev-floating-launcher';
    launcher.textContent = 'DEV';
    launcher.setAttribute('aria-label', 'Abrir ferramentas DEV');
    launcher.addEventListener('click', togglePanel);

    if (!existing) document.body.appendChild(launcher);
  }

  function buildPanel() {
    panel = document.createElement('div');
    panel.className = 'dev-panel';
    panel.id = 'dev-panel';
    const activeFont = localStorage.getItem(FONT_STORAGE_KEY) || 'sistema';
    const activeFontLabel = FONTS.find(f => f.id === activeFont)?.label || 'Sistema';
    const activeHeroVariant = localStorage.getItem(HERO_VARIANT_KEY) || localStorage.getItem('audia_header_variant') || 'original';
    const isAuthPage = Boolean(document.querySelector('.auth-page'));
    const activeAuthVariant = localStorage.getItem(AUTH_VARIANT_KEY) || 'site';
    const mobileActive = isMobilePreview();

    panel.innerHTML = `
      <div class="dev-panel-title">
        <div>
          <strong>DEV Audia</strong><br>
          <span>Fontes, páginas e placeholders</span>
        </div>
        <button type="button" class="dev-close" data-dev-close aria-label="Fechar">×</button>
      </div>

      <div class="dev-group">
        <button type="button" class="dev-dropdown-toggle" data-dev-toggle="pages">
          <span>📄 Páginas <small>(${PAGES.length})</small></span>
          <span class="dev-chevron">▾</span>
        </button>
        <div class="dev-dropdown-body" id="dev-drop-pages">
          <div class="dev-page-list">
            ${PAGES.map(page => `
              <a class="dev-page-link" href="${page.path}">
                <strong>${page.name}</strong>
                <span>${page.path}</span>
                <small>${page.description}</small>
              </a>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="dev-group">
        <button type="button" class="dev-dropdown-toggle" data-dev-toggle="fonts">
          <span>🔤 Tipografia <small>— ${activeFontLabel}</small></span>
          <span class="dev-chevron">▾</span>
        </button>
        <div class="dev-dropdown-body" id="dev-drop-fonts">
          <div class="dev-font-list">
            ${FONTS.map(f => `
              <button type="button" class="dev-font-btn ${activeFont === f.id ? 'active' : ''}" data-dev-font="${f.id}">
                <span class="dev-font-preview" style="font-family:${f.stack}">Aa</span>
                <span class="dev-font-info">
                  <strong>${f.label}</strong>
                  <small>${f.sub}</small>
                </span>
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="dev-group">
        <div class="dev-label">Hero Home</div>
        <div class="dev-action-grid">
          <button type="button" class="dev-action ${activeHeroVariant === 'cybercore'  ? 'primary' : ''}" data-dev-hero-variant="cybercore">Cybercore</button>
          <button type="button" class="dev-action ${activeHeroVariant === 'beams'      ? 'primary' : ''}" data-dev-hero-variant="beams">Beams</button>
          <button type="button" class="dev-action ${activeHeroVariant === 'sparkles'   ? 'primary' : ''}" data-dev-hero-variant="sparkles">Sparkles</button>
          <button type="button" class="dev-action ${activeHeroVariant === 'original'   ? 'primary' : ''}" data-dev-hero-variant="original">Original</button>
        </div>
        <p class="dev-note">Cybercore: grade laranja. Beams: feixes diagonais (canvas). Sparkles: partículas cintilantes. Original: sem efeito.</p>
      </div>

      <div class="dev-group">
        <div class="dev-label">Hero</div>
        <div class="dev-action-grid">
          <button type="button" class="dev-action ${(localStorage.getItem('audia_hero_boxes') ?? 'true') !== 'false' ? 'primary' : ''}" data-dev-hero-boxes>Grid Boxes</button>
        </div>
        <p class="dev-note">Grid decorativo animado no fundo do hero (mesmo efeito do footer).</p>
      </div>

      ${isAuthPage ? `
      <div class="dev-group">
        <div class="dev-label">Auth</div>
        <div class="dev-action-grid">
          <button type="button" class="dev-action ${activeAuthVariant === 'site' ? 'primary' : ''}" data-dev-auth-variant="site">Site</button>
          <button type="button" class="dev-action ${activeAuthVariant === 'studio' ? 'primary' : ''}" data-dev-auth-variant="studio">Studio</button>
        </div>
        <p class="dev-note">Site: visual alinhado com a landing do Audia. Studio: variante anterior.</p>
      </div>
      ` : ''}

      <div class="dev-group">
        <div class="dev-label">Viewport</div>
        <div class="dev-action-grid">
          <button type="button" class="dev-action ${mobileActive ? 'primary' : ''}" data-dev-mobile-toggle>📱 Mobile 390px</button>
          <button type="button" class="dev-action" data-dev-mobile-off>🖥️ Desktop</button>
        </div>
        <p class="dev-note">Mobile centra o conteúdo em 390px com barra indicadora.</p>
      </div>

      <div class="dev-group">
        <div class="dev-label">Placeholders</div>
        <div class="dev-action-grid">
          <button type="button" class="dev-action primary" data-dev-add-placeholders>Add todos</button>
          <button type="button" class="dev-action" data-dev-remove-placeholders>Remover todos</button>
        </div>
        <p class="dev-note">Cada placeholder tem Copiar e Excluir. Add todos restaura os marcadores.</p>
      </div>
    `;
    document.body.appendChild(panel);

    panel.querySelector('[data-dev-close]').addEventListener('click', closePanel);
    panel.querySelector('[data-dev-add-placeholders]').addEventListener('click', () => addAllPlaceholders(true));
    panel.querySelector('[data-dev-remove-placeholders]').addEventListener('click', removeAllPlaceholders);
    panel.querySelector('[data-dev-mobile-toggle]').addEventListener('click', () => {
      const next = !isMobilePreview();
      applyMobilePreview(next);
      showToast(next ? 'Mobile 390px ativo' : 'Voltou ao desktop');
    });
    panel.querySelector('[data-dev-mobile-off]').addEventListener('click', () => {
      applyMobilePreview(false);
      showToast('Voltou ao desktop');
    });

    // Dropdown toggles
    panel.querySelectorAll('[data-dev-toggle]').forEach(toggle => {
      const bodyId = 'dev-drop-' + toggle.dataset.devToggle;
      const body = panel.querySelector('#' + bodyId);
      toggle.addEventListener('click', () => {
        const open = body.classList.toggle('open');
        toggle.querySelector('.dev-chevron').textContent = open ? '▴' : '▾';
      });
    });

    // Font buttons
    panel.querySelectorAll('[data-dev-font]').forEach(btn => {
      btn.addEventListener('click', () => {
        applyFont(btn.dataset.devFont);
        // Update dropdown subtitle
        const font = FONTS.find(f => f.id === btn.dataset.devFont);
        const toggle = panel.querySelector('[data-dev-toggle="fonts"] span:first-child small');
        if (toggle && font) toggle.textContent = `— ${font.label}`;
      });
    });

    panel.querySelectorAll('[data-dev-hero-variant]').forEach(btn => {
      btn.addEventListener('click', () => {
        applyHeroVariant(btn.dataset.devHeroVariant);
      });
    });

    panel.querySelectorAll('[data-dev-hero-boxes]').forEach(btn => {
      btn.addEventListener('click', () => {
        const next = !window.audiaHeroBoxes?.isOn();
        window.audiaHeroBoxes?.apply(next);
        showToast(next ? 'Hero boxes ativo' : 'Hero boxes desativado');
      });
    });

    refreshHeroButtons();
    panel.querySelectorAll('[data-dev-auth-variant]').forEach(btn => {
      btn.addEventListener('click', () => {
        applyAuthVariant(btn.dataset.devAuthVariant);
      });
    });

    refreshAuthButtons();
  }

  const HERO_VARIANT_LABELS = { cybercore: 'Hero Cybercore aplicado', beams: 'Hero Beams aplicado', sparkles: 'Hero Sparkles aplicado', original: 'Hero original restaurado' };

  function applyHeroVariant(variant) {
    const validVariants = ['cybercore', 'beams', 'sparkles', 'original'];
    const nextVariant = validVariants.includes(variant) ? variant : 'original';
    localStorage.setItem(HERO_VARIANT_KEY, nextVariant);
    localStorage.removeItem('audia_header_variant');
    window.audiaHero?.apply?.(nextVariant);
    refreshHeroButtons();
    showToast(HERO_VARIANT_LABELS[nextVariant] || 'Hero atualizado');
  }

  function refreshHeroButtons() {
    const current = localStorage.getItem(HERO_VARIANT_KEY) || 'original';
    document.querySelectorAll('[data-dev-hero-variant]').forEach(btn => {
      btn.classList.toggle('primary', btn.dataset.devHeroVariant === current);
    });
  }

  function applyAuthVariant(variant) {
    const validVariants = ['site', 'studio'];
    const nextVariant = validVariants.includes(variant) ? variant : 'site';
    localStorage.setItem(AUTH_VARIANT_KEY, nextVariant);
    window.audiaAuthView?.apply?.(nextVariant);
    refreshAuthButtons();
    showToast(nextVariant === 'site' ? 'Auth Site aplicado' : 'Auth Studio aplicado');
  }

  function refreshAuthButtons() {
    const current = window.audiaAuthView?.current?.() || localStorage.getItem(AUTH_VARIANT_KEY) || 'site';
    document.querySelectorAll('[data-dev-auth-variant]').forEach(btn => {
      btn.classList.toggle('primary', btn.dataset.devAuthVariant === current);
    });
  }

  function togglePanel() {
    if (panel?.classList.contains('open')) closePanel();
    else openPanel();
  }

  function openPanel() {
    panel?.classList.add('open');
    state.panelOpen = true;
    saveState();
  }

  function closePanel() {
    panel?.classList.remove('open');
    state.panelOpen = false;
    saveState();
  }

  function getTargets() {
    const selectors = [
      ['Header', 'nav'],
      ['Header: conteúdo', '.nav-inner'],
      ['Header: logo', '.nav-logo'],
      ['Header: links', '.nav-links'],
      ['Header: ações', '.nav-actions'],
      ['Hero', '#hero'],
      ['Hero: logo', '.hero-logo-mark'],
      ['Hero: badge', '.hero-badge'],
      ['Hero: título', '.hero-title'],
      ['Hero: subtítulo', '.hero-sub'],
      ['Hero: CTAs', '.hero-ctas'],
      ['Hero: métricas', '.hero-stats'],
      ['Seção', 'section'],
      ['Seção: cabeçalho', '.section-header'],
      ['Grid: benefícios', '.benefits-grid'],
      ['Card: benefício', '.benefit-card'],
      ['Grid: categorias', '.silo-grid'],
      ['Card: categoria', '.silo-card'],
      ['Fluxo: passos', '.steps'],
      ['Card: passo', '.step'],
      ['Grid: sessões', '.sessions-showcase'],
      ['Card: sessão landing', '.showcase-card'],
      ['Tabela ciência', '.freq-table'],
      ['Bloco CTA', '.cta-block'],
      ['Rodapé', 'footer'],
      ['Rodapé: background boxes', '.footer-boxes'],
      ['Rodapé: links', '.footer-links'],
      ['Splash Screen', '#splash'],
      ['Splash: marca', '.splash-logo'],
      ['Onboarding', '#onboarding'],
      ['App Shell', '#app'],
      ['App: header de navegacao', '#tab-bar'],
      ['App: botao voltar', '.app-back-button'],
      ['Inicio: topo e metricas', '.home-brand'],
      ['Inicio: metricas do topo', '.home-brand-metrics'],
      ['Tela Início', '#tab-home'],
      ['Início: estados mentais', '.state-grid'],
      ['Início: card estado', '.state-card'],
      ['Início: plano inteligente', '.smart-plan'],
      ['Início: dados da recomendação', '.smart-metrics'],
      ['Início: carrossel', '.h-scroll'],
      ['App: card sessão', '.session-card'],
      ['App: grid categorias', '.category-grid'],
      ['App: card categoria', '.category-card'],
      ['Tela Explorar', '#tab-explore'],
      ['Explorar: categoria', '.explore-cat-section'],
      ['Explorar: lista sessões', '.explore-sessions'],
      ['App: item sessão', '.session-list-item'],
      ['Tela Progresso', '#tab-progress'],
      ['Progresso: painel', '.progress-dashboard'],
      ['Progresso: score', '.score-ring'],
      ['Progresso: métricas', '.progress-metrics'],
      ['Progresso: conquistas', '.achievement-grid'],
      ['Progresso: item conquista', '.achievement-card'],
      ['Progresso: evolução recente', '.recent-list'],
      ['Tela Favoritos', '#tab-favorites'],
      ['Favoritos: lista', '.favorites-list'],
      ['Tela Ajustes', '#tab-profile'],
      ['Perfil: favoritos', '.profile-favorites-list'],
      ['Ajustes: premium', '.premium-banner'],
      ['Ajustes: seção', '.settings-section'],
      ['Ajustes: card', '.settings-card'],
      ['Ajustes: linha', '.settings-row'],
      ['Player', '#player'],
      ['Player: conteúdo', '.player-inner'],
      ['Player: arte', '.player-artwork'],
      ['Player: informações', '.player-info'],
      ['Player: favorito', '.player-favorite-action'],
      ['Player: progresso', '.player-progress'],
      ['Player: controles', '.player-controls'],
      ['Player: volume', '.player-volume'],
      ['Player: equalizador', '.player-eq'],
      ['Player: timer', '.timer-section'],
      ['Modal', '.modal-sheet'],
    ];

    return selectors.flatMap(([label, selector]) =>
      Array.from(document.querySelectorAll(selector))
        .filter(el => shouldAddPlaceholderTo(el))
        .map((el, index) => ({
          el,
          label: labelFor(el, label, index),
          key: keyFor(el, selector, index),
          selector: selectorFor(el),
        })),
    );
  }

  function shouldAddPlaceholderTo(el) {
    if (!el || el.closest('.dev-panel') || el.closest('.dev-placeholder')) return false;
    if (el.id === 'dev-launcher' || el.id === 'dev-panel') return false;
    if (['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'HTML', 'HEAD'].includes(el.tagName)) return false;
    return true;
  }

  function labelFor(el, baseLabel, index) {
    const id = el.id ? `#${el.id}` : '';
    const aria = el.getAttribute('aria-labelledby');
    const title = aria ? document.getElementById(aria)?.textContent?.trim() : '';
    return title ? `${baseLabel}: ${title}` : `${baseLabel}${id ? ` ${id}` : ` ${index + 1}`}`;
  }

  function keyFor(el, selector, index) {
    if (el.id) return `id:${el.id}`;
    const sectionTitle = el.querySelector?.('h1,h2,h3')?.textContent?.trim()?.slice(0, 60);
    if (sectionTitle) return `title:${sectionTitle}`;
    return `${selector}:${index}`;
  }

  function selectorFor(el) {
    if (el.id) return `#${el.id}`;
    const classes = Array.from(el.classList || []).filter(c => !c.startsWith('dev-'));
    if (classes.length) return `${el.tagName.toLowerCase()}.${classes.slice(0, 2).join('.')}`;
    return el.tagName.toLowerCase();
  }

  function addAllPlaceholders(resetHidden) {
    if (resetHidden) state.hiddenPlaceholders = [];
    state.placeholdersEnabled = true;
    saveState();
    scanAndAddPlaceholders();
    showToast('Placeholders adicionados');
  }

  function removeAllPlaceholders() {
    state.placeholdersEnabled = false;
    saveState();
    document.querySelectorAll('.dev-placeholder').forEach(node => node.remove());
    showToast('Placeholders removidos');
  }

  function scanAndAddPlaceholders() {
    if (!state.placeholdersEnabled) return;

    getTargets().forEach(target => {
      if (state.hiddenPlaceholders.includes(target.key)) return;
      if (document.querySelector(`.dev-placeholder[data-dev-key="${cssEscape(target.key)}"]`)) return;

      const placeholder = document.createElement('div');
      placeholder.className = 'dev-placeholder';
      placeholder.dataset.devKey = target.key;
      placeholder.dataset.devSelector = target.selector;
      placeholder.dataset.devLabel = target.label;
      placeholder.dataset.devPlacement = shouldPlaceBefore(target.el) ? 'before' : 'inside';
      placeholder.innerHTML = `
        <div class="dev-placeholder-header">
          <button type="button" class="dev-move-handle" data-dev-move title="Mover placeholder" aria-label="Mover placeholder">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2v20M12 2l-3 3M12 2l3 3M12 22l-3-3M12 22l3-3M2 12h20M2 12l3-3M2 12l3 3M22 12l-3-3M22 12l-3 3"/>
            </svg>
          </button>
          <div class="dev-placeholder-text">
            <div class="dev-placeholder-title">${escapeHtml(target.label)}</div>
            <div class="dev-placeholder-meta">${escapeHtml(target.selector)}</div>
          </div>
          <div class="dev-placeholder-actions">
            <button type="button" data-dev-reset-position title="Voltar ao lugar original" aria-label="De volta">↺</button>
            <button type="button" data-dev-copy title="Copiar bloco" aria-label="Copiar">⧉</button>
            <button type="button" data-dev-delete title="Excluir placeholder" aria-label="Excluir">×</button>
          </div>
        </div>
      `;

      if (shouldPlaceBefore(target.el) && target.el.parentElement) {
        target.el.parentElement.insertBefore(placeholder, target.el);
      } else {
        target.el.insertBefore(placeholder, target.el.firstChild);
      }

      applySavedPosition(placeholder);
    });
  }

  function shouldPlaceBefore(el) {
    return ['A', 'BUTTON', 'IMG', 'INPUT', 'SELECT', 'TEXTAREA', 'VIDEO', 'CANVAS'].includes(el.tagName);
  }

  function bindDelegatedPlaceholderActions() {
    document.addEventListener('click', event => {
      const copyButton = event.target.closest('[data-dev-copy]');
      const deleteButton = event.target.closest('[data-dev-delete]');
      const resetButton = event.target.closest('[data-dev-reset-position]');
      if (!copyButton && !deleteButton && !resetButton) return;

      const placeholder = event.target.closest('.dev-placeholder');
      if (!placeholder) return;

      if (copyButton) copyPlaceholder(placeholder);
      if (deleteButton) deletePlaceholder(placeholder);
      if (resetButton) resetPlaceholderPosition(placeholder);
    });

    document.addEventListener('pointerdown', event => {
      const handle = event.target.closest('[data-dev-move]');
      if (!handle) return;
      const placeholder = handle.closest('.dev-placeholder');
      if (!placeholder) return;
      startDraggingPlaceholder(event, placeholder);
    });

    document.addEventListener('pointermove', event => {
      if (!dragState) return;
      const { placeholder, offsetX, offsetY } = dragState;
      const width = placeholder.offsetWidth;
      const height = placeholder.offsetHeight;
      const left = clamp(event.clientX - offsetX, 8, window.innerWidth - width - 8);
      const top = clamp(event.clientY - offsetY, 8, window.innerHeight - height - 8);

      setPlaceholderPosition(placeholder, left, top);
    });

    document.addEventListener('pointerup', () => {
      if (!dragState) return;
      const { placeholder, key } = dragState;
      const rect = placeholder.getBoundingClientRect();
      state.placeholderPositions[key] = {
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
      };
      saveState();
      placeholder.classList.remove('is-dragging');
      dragState = null;
      showToast('Posição salva');
    });
  }

  function startDraggingPlaceholder(event, placeholder) {
    const rect = placeholder.getBoundingClientRect();
    const computed = window.getComputedStyle(placeholder);
    const width = rect.width || parseFloat(computed.width) || 240;

    setPlaceholderPosition(placeholder, rect.left, rect.top, width);

    dragState = {
      placeholder,
      key: placeholder.dataset.devKey,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };

    placeholder.classList.add('is-movable', 'is-dragging');
    event.preventDefault();
  }

  function applySavedPosition(placeholder) {
    const position = state.placeholderPositions[placeholder.dataset.devKey];
    if (!position) return;
    setPlaceholderPosition(placeholder, position.left, position.top, position.width);
    placeholder.classList.add('is-movable');
  }

  function setPlaceholderPosition(placeholder, left, top, width = placeholder.offsetWidth) {
    placeholder.style.position = 'fixed';
    placeholder.style.left = `${left}px`;
    placeholder.style.top = `${top}px`;
    placeholder.style.right = 'auto';
    placeholder.style.bottom = 'auto';
    placeholder.style.margin = '0';
    placeholder.style.zIndex = '1050';
    placeholder.style.width = `${Math.min(Math.max(width, 180), 420)}px`;
  }

  function resetPlaceholderPosition(placeholder) {
    const key = placeholder.dataset.devKey;
    delete state.placeholderPositions[key];
    saveState();
    placeholder.style.position = '';
    placeholder.style.left = '';
    placeholder.style.top = '';
    placeholder.style.right = '';
    placeholder.style.bottom = '';
    placeholder.style.margin = '';
    placeholder.style.width = '';
    placeholder.style.zIndex = '';
    placeholder.classList.remove('is-movable', 'is-dragging');
    showToast('Voltou ao lugar original');
  }

  function copyPlaceholder(placeholder) {
    const text = placeholder.dataset.devLabel || placeholder.dataset.devKey || '';
    copyText(text)
      .then(() => showToast('Nome copiado!'))
      .catch(() => showToast('Erro ao copiar'));
  }

  function deletePlaceholder(placeholder) {
    const key = placeholder.dataset.devKey;
    if (key && !state.hiddenPlaceholders.includes(key)) {
      state.hiddenPlaceholders.push(key);
      saveState();
    }
    placeholder.remove();
    showToast('Placeholder excluído');
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch (_) {
      // clipboard API falhou (file://, permissão negada) — usa fallback
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const ok = document.execCommand('copy');
    textarea.remove();
    if (!ok) throw new Error('execCommand copy failed');
  }

  function observeDomChanges() {
    const observer = new MutationObserver(() => {
      clearTimeout(scanTimer);
      scanTimer = setTimeout(scanAndAddPlaceholders, 120);
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function showToast(message) {
    let toast = document.getElementById('dev-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'dev-toast';
      toast.className = 'dev-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 1800);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function cssEscape(value) {
    if (window.CSS?.escape) return CSS.escape(value);
    return String(value).replace(/"/g, '\\"');
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), Math.max(min, max));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

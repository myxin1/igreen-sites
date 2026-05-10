// Audia — Main Application Controller

class AudiaApp {
  constructor() {
    this.currentMood = null;
    this.currentSession = null;
    this.currentTab = 'home';
    this.timerDuration = 30; // minutos
    this.isPaused = false;
    this.activeCheckin = null;
  }

  // ── BOOT ──────────────────────────────────────────────────────────────
  init() {
    const launch = this.getLaunchParams();

    // Splash → onboarding ou app
    setTimeout(() => {
      const shouldDeepLink = Boolean(launch.category || launch.tab);

      if (Storage.isOnboarded()) {
        const prefs = Storage.getPreferences();
        this.currentMood = launch.mood || prefs.mood;
        this.showScreen('app');
        this.openInitialView(launch);
      } else if (shouldDeepLink) {
        const prefs = Storage.getPreferences();
        this.currentMood = launch.mood || prefs.mood;
        this.showScreen('app');
        this.openInitialView(launch);
      } else {
        this.showScreen('onboarding');
        this.renderOnboarding();
      }
    }, 1800);

    this.bindGlobalEvents();
    this.renderTabBar();
  }

  getLaunchParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      category: params.get('category'),
      mood: params.get('mood'),
      tab: this.getHashTab(),
    };
  }

  openInitialView(launch = {}) {
    const tabs = ['home', 'explore', 'progress', 'favorites', 'profile'];
    const categoryExists = CATEGORIES.some(cat => cat.id === launch.category);

    if (tabs.includes(launch.tab)) {
      this.switchTab(launch.tab);
      return;
    }

    if (categoryExists) {
      this.switchTab('explore');
      setTimeout(() => {
        document.getElementById(`cat-section-${launch.category}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 150);
      return;
    }

    this.switchTab('home');
  }

  getHashTab() {
    const hash = window.location.hash.replace('#', '');
    if (!hash.startsWith('tab-')) return '';
    return hash.replace('tab-', '');
  }

  bindGlobalEvents() {
    window.addEventListener('hashchange', () => {
      const tab = this.getHashTab();
      if (!tab || !document.getElementById('app')?.classList.contains('active')) return;
      if (['home', 'explore', 'progress', 'favorites', 'profile'].includes(tab)) {
        this.switchTab(tab);
      }
    });
  }

  // ── SCREEN TRANSITIONS ────────────────────────────────────────────────
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if (target) {
      // Força reflow para animação disparar corretamente
      void target.offsetWidth;
      target.classList.add('active');
    }
  }

  // ── ONBOARDING ────────────────────────────────────────────────────────
  renderOnboarding() {
    const container = document.getElementById('onboarding-content');
    const moods = MENTAL_STATES;

    container.innerHTML = `
      <div class="onboarding-header">
        <div class="onboarding-icon">${this._lineIcon('audio')}</div>
        <h1 class="onboarding-title">Bem-vindo ao Audia</h1>
        <p class="onboarding-subtitle">Controle sua mente em minutos com sessões guiadas e frequências inteligentes</p>
      </div>
      <p class="mood-question">Como você está se sentindo agora?</p>
      <div class="mood-grid">
        ${moods.map(m => `
          <button class="mood-card" data-mood="${m.id}">
            <span class="mood-card-icon">${this._iconForState(m.id)}</span>
            <span class="mood-card-label">${m.label}</span>
          </button>
        `).join('')}
      </div>
      <button class="btn-primary" id="onboarding-cta" disabled>Começar →</button>
      <button class="btn-ghost" id="onboarding-skip">Pular e explorar</button>
    `;

    // Bind
    container.querySelectorAll('.mood-card').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.mood-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.currentMood = card.dataset.mood;
        document.getElementById('onboarding-cta').disabled = false;
      });
    });

    document.getElementById('onboarding-cta').addEventListener('click', () => {
      this.finishOnboarding();
    });
    document.getElementById('onboarding-skip').addEventListener('click', () => {
      this.finishOnboarding(true);
    });
  }

  finishOnboarding(skip = false) {
    if (!skip && this.currentMood) {
      Storage.savePreferences({ mood: this.currentMood });
    }
    Storage.setOnboarded();
    this.showScreen('app');
    this.renderHome();
  }

  // ── TAB BAR ───────────────────────────────────────────────────────────
  renderTabBar() {
    const tabs = [
      { id: 'home',      label: 'Início',   icon: this._iconHome() },
      { id: 'explore',   label: 'Explorar', icon: this._iconExplore() },
      { id: 'progress',  label: 'Progresso', icon: this._iconProgress() },
      { id: 'favorites', label: 'Salvos',   icon: this._iconHeart() },
      { id: 'profile',   label: 'Ajustes',   icon: this._iconProfile() },
    ];

    const bar = document.getElementById('tab-bar');
    bar.innerHTML = tabs.map(t => `
      <button class="tab-btn ${t.id === 'home' ? 'active' : ''}" data-tab="${t.id}">
        ${t.icon}
        <span>${t.label}</span>
      </button>
    `).join('');

    bar.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    this.syncTabHash(tabId);
    document.querySelectorAll('.tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tabId)
    );
    document.querySelectorAll('.tab-content').forEach(t =>
      t.classList.toggle('active', t.id === `tab-${tabId}`)
    );

    switch (tabId) {
      case 'home':      this.renderHome(); break;
      case 'explore':   this.renderExplore(); break;
      case 'progress':  this.renderProgress(); break;
      case 'favorites': this.renderFavorites(); break;
      case 'profile':   this.renderProfile(); break;
    }
  }

  bindTabLinks(scope = document) {
    scope.querySelectorAll('[data-goto]').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.goto));
    });
  }

  renderBackToHome() {
    return `
      <button class="app-back-button" type="button" data-goto="home" aria-label="Voltar para o inicio">
        ${this._lineIcon('arrow-left')}
        <span>Voltar ao inicio</span>
      </button>
    `;
  }

  renderBackToSite() {
    return `
      <a class="app-back-button" href="index.html" aria-label="Voltar para o site Audia">
        ${this._lineIcon('arrow-left')}
        <span>Voltar ao site</span>
      </a>
    `;
  }

  renderEqPresetChips(activePreset = 'balanced', context = 'player') {
    return audioEngine.getEqPresets().map(preset => `
      <button class="eq-chip ${preset.id === activePreset ? 'active' : ''}" type="button" data-eq-preset="${preset.id}" data-eq-context="${context}">
        <span>${preset.label}</span>
        <small>${preset.hint}</small>
      </button>
    `).join('');
  }

  bindEqPresetButtons(scope = document) {
    scope.querySelectorAll('[data-eq-preset]').forEach(button => {
      button.addEventListener('click', () => {
        const preset = button.dataset.eqPreset;
        audioEngine.setEqPreset(preset);
        Storage.savePreferences({ eqPreset: preset });

        const context = button.dataset.eqContext;
        scope.querySelectorAll(`[data-eq-context="${context}"]`).forEach(item => {
          item.classList.toggle('active', item.dataset.eqPreset === preset);
        });

        this.showToast('Equalizador atualizado');
      });
    });
  }

  syncTabHash(tabId) {
    if (!window.history?.replaceState) return;
    const appScreen = document.getElementById('app');
    if (!appScreen?.classList.contains('active')) return;

    const url = new URL(window.location.href);
    url.hash = `tab-${tabId}`;
    window.history.replaceState(null, '', url);
  }

  // ── HOME ──────────────────────────────────────────────────────────────
  renderHome() {
    const container = document.getElementById('tab-home');
    const mood = this.currentMood;
    const plan = Recommendation.getSmartPlan(mood);
    const summary = Storage.getProgressSummary();
    const insight = Recommendation.getDailyInsight();
    const recommended = mood ? Recommendation.getForMood(mood) : Recommendation.getFeatured().slice(0, 4);
    const featured = Recommendation.getFeatured().slice(0, 10);

    container.innerHTML = `
      <div class="home-header fade-in">
        ${this.renderBackToSite()}
        <div class="home-brand">
          <img id="home-brand-logo" src="Logo/Audia 1 - fundo preto.png" alt="Audia">
          <div class="home-brand-copy">
            <div class="home-brand-name">Audia</div>
            <div class="home-brand-sub">Pare de lutar contra sua mente. Ajuste ela</div>
          </div>
          <div class="home-brand-metrics" aria-label="Resumo do progresso">
            <button class="home-brand-metric" data-goto="progress">
              <span>${summary.dailyScore}</span>
              Score mental
            </button>
            <button class="home-brand-metric" data-goto="progress">
              <span>${summary.streak}</span>
              Dias seguidos
            </button>
            <button class="home-brand-metric" data-goto="progress">
              <span>${summary.minutesToday}</span>
              Min hoje
            </button>
          </div>
        </div>
        <p class="home-greeting">Assistente mental inteligente</p>
        <h1 class="home-title">Como você está se sentindo agora?</h1>
        <p class="home-insight">${insight}</p>
      </div>

      <div class="section">
        <div class="state-grid" id="state-grid">
          ${MENTAL_STATES.map(state => `
            <button class="state-card ${state.id === mood ? 'selected' : ''}" data-mood="${state.id}">
              <span class="state-icon">${this._iconForState(state.id)}</span>
              <span class="state-label">${state.label}</span>
              <span class="state-desc">${state.idealDuration} min · ${state.idealFrequency}</span>
            </button>
          `).join('')}
        </div>
      </div>

      ${plan ? `
      <div class="section">
        <div class="smart-plan">
          <div>
            <div class="smart-kicker">Recomendação inteligente</div>
            <h2 class="smart-title">${plan.session.name}</h2>
            <div class="smart-metrics">
              <span>${plan.duration} min</span>
              <span>${plan.frequency}</span>
              <span>${plan.session.soundLabel || 'Som continuo'}</span>
            </div>
            <p class="smart-reason">${plan.reason}</p>
            <button class="btn-primary" id="start-smart-session">Iniciar agora</button>
          </div>
        </div>
      </div>` : ''}

      ${recommended.length ? `
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">${mood ? 'Sessões ideais para agora' : 'Protocolos rápidos'}</h2>
        </div>
        <div class="h-scroll stagger" id="recommended-list"></div>
      </div>` : ''}

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Experiências guiadas</h2>
          <button class="section-link" data-goto="explore">Ver todas</button>
        </div>
        <div class="h-scroll stagger" id="featured-list"></div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Categorias</h2>
        </div>
        <div class="category-grid stagger" id="category-grid"></div>
      </div>
    `;

    // Populate recommended
    if (recommended.length) {
      const recList = document.getElementById('recommended-list');
      recommended.forEach(s => {
        recList.appendChild(this.createSessionCard(s));
      });
    }

    // Populate featured
    const featList = document.getElementById('featured-list');
    featured.forEach(s => featList.appendChild(this.createSessionCard(s)));

    // Populate categories
    const catGrid = document.getElementById('category-grid');
    CATEGORIES.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.style.background = cat.gradient;
      card.innerHTML = `
        <div class="category-card-icon">${this._iconForCategory(cat.id)}</div>
        <div class="category-card-name">${cat.name}</div>
        <div class="category-card-freq">${cat.freqRange}</div>
      `;
      card.addEventListener('click', () => {
        this.switchTab('explore');
        setTimeout(() => {
          const el = document.getElementById(`cat-section-${cat.id}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      });
      catGrid.appendChild(card);
    });

    document.querySelectorAll('.state-card').forEach(card => {
      card.addEventListener('click', () => {
        this.currentMood = card.dataset.mood;
        Storage.savePreferences({ mood: this.currentMood });
        this.renderHome();
      });
    });

    document.getElementById('start-smart-session')?.addEventListener('click', () => {
      if (plan?.session) this.openPlayer(plan.session);
    });

    // Sync logo with current theme after render
    window.audiaTheme?.apply(window.audiaTheme.current());

    this.bindTabLinks(container);
  }

  // ── EXPLORE ───────────────────────────────────────────────────────────
  renderExplore() {
    const container = document.getElementById('tab-explore');
    container.innerHTML = `
      <div class="explore-header fade-in">
        ${this.renderBackToHome()}
        <h1 class="explore-title">Explorar</h1>
        <p class="explore-subtitle">Todas as frequências e sessões</p>
      </div>
      <div class="explore-categories stagger" id="explore-cats"></div>
    `;

    this.bindTabLinks(container);

    const catsEl = document.getElementById('explore-cats');
    CATEGORIES.forEach(cat => {
      const sessions = Recommendation.getByCategory(cat.id);
      const section = document.createElement('div');
      section.className = 'explore-cat-section';
      section.id = `cat-section-${cat.id}`;
      section.innerHTML = `
        <div class="explore-cat-header">
          <div class="explore-cat-icon">${this._iconForCategory(cat.id)}</div>
          <div>
            <div class="explore-cat-name">${cat.name}</div>
            <div class="explore-cat-freq">${cat.freqRange}</div>
          </div>
        </div>
        <div class="explore-sessions" id="explore-sessions-${cat.id}"></div>
      `;
      const list = section.querySelector(`#explore-sessions-${cat.id}`);
      sessions.forEach(s => list.appendChild(this.createSessionListItem(s)));
      catsEl.appendChild(section);
    });
  }

  // ── PROGRESS ─────────────────────────────────────────────────────────
  renderProgress() {
    const container = document.getElementById('tab-progress');
    const summary = Storage.getProgressSummary();
    const unlocked = summary.achievements.filter(a => a.unlocked);
    const locked = summary.achievements.filter(a => !a.unlocked);

    container.innerHTML = `
      <div class="progress-header fade-in">
        ${this.renderBackToHome()}
        <p class="home-greeting">Resultado visível</p>
        <h1 class="progress-title">Seu score mental é ${summary.dailyScore}</h1>
        <p class="progress-subtitle">${Recommendation.getDailyInsight()}</p>
      </div>

      <div class="progress-dashboard">
        <div class="score-ring">
          <div class="score-ring-value">${summary.dailyScore}</div>
          <div class="score-ring-label">score diário</div>
        </div>
        <div class="progress-metrics">
          <div class="metric-card">
            <span>${summary.streak}</span>
            <p>dias seguidos</p>
          </div>
          <div class="metric-card">
            <span>${summary.minutesToday}</span>
            <p>minutos hoje</p>
          </div>
          <div class="metric-card">
            <span>${summary.averageReliefPercent}%</span>
            <p>alívio médio</p>
          </div>
          <div class="metric-card">
            <span>${summary.estimatedSleepMinutes ? `${summary.estimatedSleepMinutes}m` : '--'}</span>
            <p>até relaxar</p>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Conquistas</h2>
        </div>
        <div class="achievement-grid">
          ${[...unlocked, ...locked].map(item => `
            <div class="achievement-card ${item.unlocked ? 'unlocked' : ''}">
              <div class="achievement-icon">${item.unlocked ? this._lineIcon('check') : this._lineIcon('lock')}</div>
              <div>
                <div class="achievement-title">${item.title}</div>
                <div class="achievement-desc">${item.description}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Evolução recente</h2>
        </div>
        ${summary.recent.length ? `
          <div class="recent-list">
            ${summary.recent.slice(0, 6).map(item => this.renderProgressRow(item)).join('')}
          </div>
        ` : `
          <div class="favorites-empty compact">
            <div class="favorites-empty-icon">${this._lineIcon('audio')}</div>
            <p class="favorites-empty-text">Complete uma sessão para criar seu primeiro progresso.</p>
          </div>
        `}
      </div>
    `;
    this.bindTabLinks(container);
  }

  // ── FAVORITES ─────────────────────────────────────────────────────────
  renderFavorites() {
    const container = document.getElementById('tab-favorites');
    const favIds = Storage.getFavorites();
    const favSessions = favIds
      .map(id => SESSIONS.find(s => s.id === id))
      .filter(Boolean);

    container.innerHTML = `
      <div class="favorites-header fade-in">
        ${this.renderBackToHome()}
        <h1 class="favorites-title">Salvos</h1>
      </div>
      ${favSessions.length === 0 ? `
        <div class="favorites-empty">
          <div class="favorites-empty-icon">${this._lineIcon('audio')}</div>
          <p class="favorites-empty-text">Nenhuma sessão salva ainda</p>
          <p style="font-size:13px;color:var(--text-dim)">Toque no coração durante uma sessão para salvar</p>
        </div>
      ` : `
        <div class="favorites-list stagger" id="fav-list"></div>
      `}
    `;
    this.bindTabLinks(container);

    if (favSessions.length > 0) {
      const list = document.getElementById('fav-list');
      favSessions.forEach(s => list.appendChild(this.createSessionListItem(s, true)));
    }
  }

  // ── PROFILE ───────────────────────────────────────────────────────────
  renderProfile() {
    const container = document.getElementById('tab-profile');
    const prefs = Storage.getPreferences();
    const isPremium = Storage.isPremium();
    const history = Storage.getHistory();
    const profileFavorites = Storage.getFavorites()
      .map(id => SESSIONS.find(session => session.id === id))
      .filter(Boolean)
      .slice(0, 4);
    const activeEq = prefs.eqPreset || 'balanced';

    container.innerHTML = `
      <div class="profile-header fade-in">
        ${this.renderBackToHome()}
        <div class="profile-avatar">${this._lineIcon('headphones')}</div>
        <div class="profile-name">Ouvinte Audia</div>
        <div class="profile-plan">${isPremium ? 'Premium' : 'Gratuito'}</div>
      </div>

      ${!isPremium ? `
      <div class="premium-banner" id="upgrade-btn">
        <div class="premium-banner-title">Audia Premium</div>
        <div class="premium-banner-sub">Protocolos completos, IA personalizada, offline e sem anúncios</div>
        <div class="premium-banner-btn">R$ 29/mês</div>
      </div>` : ''}

      <div class="settings-section">
        <div class="settings-label">Favoritos do perfil</div>
        ${profileFavorites.length ? `
          <div class="profile-favorites-list">
            ${profileFavorites.map(session => `
              <button class="profile-favorite-card" type="button" data-profile-session="${session.id}">
                <span class="profile-favorite-icon">${this._iconForSession(session)}</span>
                <span class="profile-favorite-copy">
                  <strong>${session.name}</strong>
                  <small>${session.duration} min · ${session.frequencyLabel || 'Frequência guiada'}</small>
                </span>
                <span class="profile-favorite-play">${this._lineIcon('play')}</span>
              </button>
            `).join('')}
          </div>
        ` : `
          <div class="profile-favorites-empty">
            Salve uma sessão no player para ela aparecer aqui no seu perfil.
          </div>
        `}
      </div>

      <div class="settings-section">
        <div class="settings-label">Estatísticas</div>
        <div class="settings-card">
          <div class="settings-row" style="cursor:default">
            <div class="settings-row-icon">${this._lineIcon('audio')}</div>
            <div class="settings-row-info">
              <div class="settings-row-name">Sessões reproduzidas</div>
            </div>
            <div class="settings-row-value">${history.length}</div>
          </div>
          <div class="settings-row" style="cursor:default">
            <div class="settings-row-icon">${this._lineIcon('heart')}</div>
            <div class="settings-row-info">
              <div class="settings-row-name">Sessões salvas</div>
            </div>
            <div class="settings-row-value">${Storage.getFavorites().length}</div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-label">Áudio</div>
        <div class="settings-card">
          <div class="audio-preference-block">
            <div class="audio-setting-heading">
              <span>Volume padrão</span>
              <strong id="vol-setting-value">${Math.round((prefs.volume || 0.7) * 100)}%</strong>
            </div>
            <div class="volume-slider-wrap profile-volume">
              <span class="vol-icon">${this._lineIcon('volume-low')}</span>
              <input type="range" id="vol-setting" min="0" max="1" step="0.05" value="${prefs.volume || 0.7}">
              <span class="vol-icon">${this._lineIcon('volume-high')}</span>
            </div>
            <div class="audio-setting-heading eq-heading">
              <span>Equalizador padrão</span>
              <strong>${audioEngine.getEqPresets().find(p => p.id === activeEq)?.label || 'Equilibrado'}</strong>
            </div>
            <div class="eq-chip-grid profile-eq">
              ${this.renderEqPresetChips(activeEq, 'profile')}
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-label">Aparência</div>
        <div class="settings-card">
          <div class="settings-row" style="cursor:default">
            <div class="settings-row-icon">${this._lineIcon('focus')}</div>
            <div class="settings-row-info">
              <div class="settings-row-name">Tema</div>
              <div class="settings-row-sub">Escolha o visual do app</div>
            </div>
            <div class="theme-switcher-app" role="group" aria-label="Tema">
              <button class="theme-app-btn ${window.audiaTheme?.current() !== 'light' ? 'active' : ''}" data-set-theme="dark" aria-label="Tema escuro">${this._lineIcon('moon')}</button>
              <button class="theme-app-btn ${window.audiaTheme?.current() === 'light' ? 'active' : ''}" data-set-theme="light" aria-label="Tema claro">${this._lineIcon('sun')}</button>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <div class="settings-label">Preferências</div>
        <div class="settings-card">
          <div class="settings-row" id="change-mood-setting">
            <div class="settings-row-icon">${this._lineIcon('focus')}</div>
            <div class="settings-row-info">
              <div class="settings-row-name">Meu objetivo atual</div>
              <div class="settings-row-sub">${this._moodLabel(prefs.mood)}</div>
            </div>
            <div class="settings-row-arrow">›</div>
          </div>
          <div class="settings-row" id="clear-history-row">
            <div class="settings-row-icon">${this._lineIcon('trash')}</div>
            <div class="settings-row-info">
              <div class="settings-row-name">Limpar histórico</div>
            </div>
            <div class="settings-row-arrow">›</div>
          </div>
        </div>
      </div>

      <div style="padding: 0 24px; margin-bottom: 24px;">
        <p style="font-size:12px;color:var(--text-dim);text-align:center;line-height:1.6">
          As frequências no Audia são baseadas em pesquisas de neurociência.<br>
          Não substituem tratamento médico ou psicológico profissional.
        </p>
      </div>
    `;
    this.bindTabLinks(container);

    document.getElementById('vol-setting')?.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      audioEngine.setVolume(vol);
      Storage.savePreferences({ volume: vol });
      const valueEl = document.getElementById('vol-setting-value');
      if (valueEl) valueEl.textContent = `${Math.round(vol * 100)}%`;
    });
    this.bindEqPresetButtons(container);

    container.querySelectorAll('[data-profile-session]').forEach(button => {
      button.addEventListener('click', () => {
        const session = SESSIONS.find(item => item.id === button.dataset.profileSession);
        if (session) this.openPlayer(session);
      });
    });

    document.querySelectorAll('[data-set-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.setTheme;
        window.audiaTheme?.apply(theme);
        document.querySelectorAll('[data-set-theme]').forEach(b =>
          b.classList.toggle('active', b.dataset.setTheme === theme)
        );
      });
    });

    document.getElementById('change-mood-setting')?.addEventListener('click', () => {
      this.showMoodPicker();
    });

    document.getElementById('clear-history-row')?.addEventListener('click', () => {
      localStorage.removeItem(Storage.KEYS.HISTORY);
      this.showToast('Histórico apagado');
      this.renderProfile();
    });

    document.getElementById('upgrade-btn')?.addEventListener('click', () => {
      this.showPremiumModal();
    });
  }

  // ── PLAYER ────────────────────────────────────────────────────────────
  openPlayer(session) {
    this.currentSession = session;
    const prefs = Storage.getPreferences();
    this.timerDuration = session.duration || prefs.timer || 30;
    this.isPaused = false;
    this.activeCheckin = this.prepareSessionCheckin(session);

    const isFav = Storage.isFavorite(session.id);
    const cat = CATEGORIES.find(c => c.id === session.category);
    const activeEq = prefs.eqPreset || 'balanced';

    document.getElementById('player').innerHTML = `
      <div class="player-inner">
        <div class="player-topbar">
          <button class="player-close" id="player-close" title="Voltar ao app" aria-label="Voltar ao app">${this._lineIcon('close')}</button>
          <span style="font-size:13px;font-weight:600;color:var(--text-muted)">Reproduzindo</span>
          <button class="player-fav-btn ${isFav ? 'active' : ''}" id="player-fav" title="Adicionar aos favoritos" aria-label="Adicionar aos favoritos">${this._heartIcon(isFav)}</button>
        </div>

        <div class="player-artwork fade-in" style="background:${cat?.gradient || 'var(--card)'}">
          <span class="player-artwork-emoji">${this._iconForSession(session)}</span>
        </div>

        <div class="player-waves paused" id="player-waves">
          ${Array.from({length:7}, (_,i) => `<div class="wave-bar" style="animation-delay:${i*0.05}s"></div>`).join('')}
        </div>

        <div class="player-info fade-in">
          <div class="player-name">${session.name}</div>
          <div class="player-desc">${session.description}</div>
          <div class="player-category">${this._iconForCategory(cat?.id)} ${cat?.name}</div>
          <button class="player-favorite-action ${isFav ? 'active' : ''}" id="player-fav-action" type="button">
            ${this._heartIcon(isFav)}
            <span>${isFav ? 'Salvo nos favoritos' : 'Adicionar aos favoritos'}</span>
          </button>
        </div>

        <div class="player-progress">
          <div class="progress-bar-track" id="progress-track">
            <div class="progress-bar-fill" id="progress-fill" style="width:0%"></div>
          </div>
          <div class="progress-times">
            <span id="time-elapsed">00:00</span>
            <span id="time-total">${audioEngine.formatTime(this.timerDuration * 60)}</span>
          </div>
        </div>

        <div class="player-controls">
          <button class="ctrl-btn" id="ctrl-restart" title="Reiniciar">${this._lineIcon('restart')}</button>
          <button class="ctrl-play-btn" id="ctrl-play">${this._lineIcon('play')}</button>
          <button class="ctrl-btn" id="ctrl-stop" title="Parar">${this._lineIcon('stop')}</button>
        </div>

        <div class="player-audio-panel">
          <div class="player-volume">
            <div class="player-volume-head">
              <span>Volume</span>
              <strong id="player-vol-value">${Math.round((prefs.volume || 0.7) * 100)}%</strong>
            </div>
            <div class="volume-slider-wrap player-volume-slider">
              <span class="vol-icon">${this._lineIcon('volume-low')}</span>
              <input type="range" id="player-vol" min="0" max="1" step="0.05" value="${prefs.volume || 0.7}">
              <span class="vol-icon">${this._lineIcon('volume-high')}</span>
            </div>
          </div>

          <div class="player-eq">
            <div class="player-volume-head">
              <span>Equalizador</span>
              <strong>Presets</strong>
            </div>
            <div class="eq-chip-grid">
              ${this.renderEqPresetChips(activeEq, 'player')}
            </div>
          </div>
        </div>

        <div class="timer-section">
          <div class="timer-label">Duração</div>
          <div class="timer-chips">
            ${[5, 10, 20, 30, 60].map(m => `
              <button class="timer-chip ${m === this.timerDuration ? 'active' : ''}" data-min="${m}">
                ${m} min
              </button>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.showScreen('player');
    this.bindPlayerEvents();
    this.startPlayback();
  }

  bindPlayerEvents() {
    document.getElementById('player-close').addEventListener('click', async () => {
      await audioEngine.stop(false);
      this.showScreen('app');
      if (this.currentTab === 'profile') this.renderProfile();
      if (this.currentTab === 'favorites') this.renderFavorites();
    });

    const togglePlayerFavorite = () => {
      const added = Storage.toggleFavorite(this.currentSession.id);
      this.updatePlayerFavoriteState(added);
      this.showToast(added ? 'Salvo nos favoritos' : 'Removido dos favoritos');
    };

    document.getElementById('player-fav').addEventListener('click', togglePlayerFavorite);
    document.getElementById('player-fav-action').addEventListener('click', togglePlayerFavorite);

    document.getElementById('ctrl-play').addEventListener('click', () => {
      this.togglePlayPause();
    });

    document.getElementById('ctrl-stop').addEventListener('click', async () => {
      await audioEngine.stop(false);
      document.getElementById('player-waves').classList.add('paused');
      document.getElementById('ctrl-play').innerHTML = this._lineIcon('play');
      document.getElementById('progress-fill').style.width = '0%';
      document.getElementById('time-elapsed').textContent = '00:00';
      this.isPaused = false;
    });

    document.getElementById('ctrl-restart').addEventListener('click', () => {
      audioEngine.stop(false).then(() => this.startPlayback());
    });

    document.getElementById('player-vol').addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      audioEngine.setVolume(vol);
      Storage.savePreferences({ volume: vol });
      const valueEl = document.getElementById('player-vol-value');
      if (valueEl) valueEl.textContent = `${Math.round(vol * 100)}%`;
    });
    this.bindEqPresetButtons(document.getElementById('player'));

    document.querySelectorAll('.timer-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.timer-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.timerDuration = parseInt(chip.dataset.min);
        document.getElementById('time-total').textContent =
          audioEngine.formatTime(this.timerDuration * 60);
        if (audioEngine.isPlaying) {
          audioEngine.stop(false).then(() => this.startPlayback());
        }
      });
    });
  }

  updatePlayerFavoriteState(isFav) {
    const icon = this._heartIcon(isFav);
    const favButton = document.getElementById('player-fav');
    const favAction = document.getElementById('player-fav-action');

    if (favButton) {
      favButton.innerHTML = icon;
      favButton.classList.toggle('active', isFav);
    }

    if (favAction) {
      favAction.innerHTML = `${icon}<span>${isFav ? 'Salvo nos favoritos' : 'Adicionar aos favoritos'}</span>`;
      favAction.classList.toggle('active', isFav);
    }
  }

  async startPlayback() {
    if (!this.currentSession) return;

    Storage.addToHistory(this.currentSession.id);
    const prefs = Storage.getPreferences();
    audioEngine.setVolume(prefs.volume || 0.7);
    audioEngine.setEqPreset(prefs.eqPreset || 'balanced');

    document.getElementById('player-waves')?.classList.remove('paused');
    document.getElementById('ctrl-play').innerHTML = this._lineIcon('pause');

    await audioEngine.play(
      this.currentSession.audioConfig,
      this.timerDuration,
      (elapsed, total) => {
        const pct = (elapsed / total) * 100;
        const fillEl = document.getElementById('progress-fill');
        const elapsedEl = document.getElementById('time-elapsed');
        if (fillEl) fillEl.style.width = `${pct}%`;
        if (elapsedEl) elapsedEl.textContent = audioEngine.formatTime(elapsed);
      },
      () => {
        // Sessão terminou
        document.getElementById('player-waves')?.classList.add('paused');
        document.getElementById('ctrl-play').innerHTML = this._lineIcon('play');
        const result = this.completeCurrentSession();
        this.showResultModal(result);
      }
    );
  }

  async togglePlayPause() {
    if (!audioEngine.isPlaying && !this.isPaused) {
      await this.startPlayback();
      return;
    }

    if (this.isPaused) {
      await audioEngine.resume();
      this.isPaused = false;
      document.getElementById('player-waves')?.classList.remove('paused');
      document.getElementById('ctrl-play').innerHTML = this._lineIcon('pause');
    } else {
      await audioEngine.pause();
      this.isPaused = true;
      document.getElementById('player-waves')?.classList.add('paused');
      document.getElementById('ctrl-play').innerHTML = this._lineIcon('play');
    }
  }

  prepareSessionCheckin(session) {
    const baselineByMetric = {
      anxiety: 5,
      sleep: 4,
      focus: 4,
      energy: 4,
      clarity: 5,
    };
    const before = baselineByMetric[session.metric] || 4;
    const after = Math.max(1, before - (session.expectedImpact || 1));

    return {
      sessionId: session.id,
      state: this.currentMood,
      metric: session.metric || 'clarity',
      before,
      after,
      duration: this.timerDuration,
    };
  }

  completeCurrentSession() {
    if (!this.activeCheckin && this.currentSession) {
      this.activeCheckin = this.prepareSessionCheckin(this.currentSession);
    }

    const result = Storage.addCheckin(this.activeCheckin);
    this.activeCheckin = null;
    return result;
  }

  showResultModal(result) {
    if (!result) return;

    const session = SESSIONS.find(s => s.id === result.sessionId);
    const metric = OUTCOME_METRICS[result.metric] || OUTCOME_METRICS.clarity;
    const relief = Math.max(0, result.before - result.after);
    const percent = result.before ? Math.round((relief / result.before) * 100) : 0;
    const summary = Storage.getProgressSummary();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-title">Sessão concluída</div>
        <div class="modal-sub">${session?.name || 'Protocolo Audia'} · ${result.duration} min</div>
        <div class="result-card">
          <div class="result-number">${percent}%</div>
          <div>
            <div class="result-title">${relief > 0 ? `${metric.label} melhorou` : 'Progresso registrado'}</div>
            <div class="result-desc">Score mental de hoje: ${summary.dailyScore}. Sequência atual: ${summary.streak} dia(s).</div>
          </div>
        </div>
        <div class="result-scale-label">Como você está agora?</div>
        <div class="result-scale">
          ${[1, 2, 3, 4, 5].map(v => `
            <button class="result-scale-btn ${v === result.after ? 'selected' : ''}" data-after="${v}">${v}</button>
          `).join('')}
        </div>
        <button class="btn-primary" id="result-progress">Ver progresso</button>
        <button class="btn-ghost" id="result-close">Continuar</button>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    overlay.querySelectorAll('.result-scale-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.querySelectorAll('.result-scale-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        const updated = Storage.updateLastCheckin({ after: parseInt(btn.dataset.after) });
        const updatedRelief = Math.max(0, updated.before - updated.after);
        this.showToast(updatedRelief > 0 ? `Você melhorou ${Math.round((updatedRelief / updated.before) * 100)}%` : 'Check-in atualizado');
      });
    });

    document.getElementById('result-progress').addEventListener('click', () => {
      overlay.classList.remove('open');
      setTimeout(() => {
        overlay.remove();
        this.showScreen('app');
        this.switchTab('progress');
      }, 300);
    });

    document.getElementById('result-close').addEventListener('click', () => {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
    });
  }

  // ── MOOD PICKER MODAL ─────────────────────────────────────────────────
  showMoodPicker() {
    const moods = MENTAL_STATES;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-title">Como você está se sentindo?</div>
        <div class="modal-sub">O Audia escolhe a sessão, frequência e duração ideais</div>
        <div class="mood-grid">
          ${moods.map(m => `
            <button class="mood-card ${m.id === this.currentMood ? 'selected' : ''}" data-mood="${m.id}">
              <span class="mood-card-icon">${this._iconForState(m.id)}</span>
              <span class="mood-card-label">${m.label}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    overlay.querySelectorAll('.mood-card').forEach(card => {
      card.addEventListener('click', () => {
        this.currentMood = card.dataset.mood;
        Storage.savePreferences({ mood: this.currentMood });
        overlay.classList.remove('open');
        setTimeout(() => {
          overlay.remove();
          if (this.currentTab === 'home') this.renderHome();
          else if (this.currentTab === 'profile') this.renderProfile();
        }, 300);
      });
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
        setTimeout(() => overlay.remove(), 300);
      }
    });
  }

  // ── PREMIUM MODAL ─────────────────────────────────────────────────────
  showPremiumModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <div class="modal-title">Audia Premium</div>
        <div class="modal-sub">R$ 29/mês para transformar o Audia em um protocolo mental completo</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:24px">
          ${['Todas as sessões e frequências', 'IA personalizada por histórico', 'Modo offline',
             'Sem anúncios', 'Protocolos avançados de ansiedade, sono e alta performance'].map(f =>
            `<div style="font-size:14px;color:var(--text-muted)">${f}</div>`
          ).join('')}
        </div>
        <button class="btn-primary" id="premium-activate">Ativar Premium (demonstração)</button>
        <button class="btn-ghost" id="premium-cancel">Agora não</button>
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    document.getElementById('premium-activate').addEventListener('click', () => {
      Storage.setPremium(true);
      overlay.classList.remove('open');
      setTimeout(() => {
        overlay.remove();
        this.showToast('Premium ativado. Obrigado!');
        this.renderProfile();
      }, 300);
    });

    document.getElementById('premium-cancel').addEventListener('click', () => {
      overlay.classList.remove('open');
      setTimeout(() => overlay.remove(), 300);
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
        setTimeout(() => overlay.remove(), 300);
      }
    });
  }

  // ── CARD BUILDERS ─────────────────────────────────────────────────────
  createSessionCard(session) {
    const card = document.createElement('div');
    card.className = 'session-card';
    card.innerHTML = `
      ${session.premium && !Storage.isPremium() ? '<div class="premium-badge">PREMIUM</div>' : ''}
      <div class="session-card-header">
        <div class="session-card-icon">${this._iconForSession(session)}</div>
        <div class="session-card-name">${session.name}</div>
        <div class="session-card-goal">${session.objective || 'Sessão guiada para resultado rápido.'}</div>
        <div class="session-card-desc">${session.frequencyLabel || ''} · ${session.soundLabel || 'Audio continuo'}</div>
      </div>
      <div class="session-card-footer">
        <span class="session-card-duration">${session.duration} min</span>
        <div class="session-card-play">
          <svg width="12" height="14" viewBox="0 0 12 14" fill="white">
            <path d="M11.5 7L0.5 13.5V0.5L11.5 7Z"/>
          </svg>
        </div>
      </div>
    `;
    card.addEventListener('click', () => {
      if (session.premium && !Storage.isPremium()) {
        this.showPremiumModal();
      } else {
        this.openPlayer(session);
      }
    });
    return card;
  }

  createSessionListItem(session, showFavBtn = false) {
    const isFav = Storage.isFavorite(session.id);
    const cat = CATEGORIES.find(c => c.id === session.category);
    const item = document.createElement('div');
    item.className = 'session-list-item';
    item.innerHTML = `
      <div class="session-list-icon">${this._iconForSession(session)}</div>
      <div class="session-list-info">
        <div class="session-list-name">${session.name}</div>
        <div class="session-list-meta">
          <span>${cat?.name || ''}</span>
          <span class="session-list-dot"></span>
          <span>${session.duration} min</span>
          <span class="session-list-dot"></span>
          <span>${session.frequencyLabel || 'Frequência guiada'}</span>
          ${session.premium && !Storage.isPremium() ? '<span class="session-list-dot"></span><span style="color:var(--accent);font-weight:700">PREMIUM</span>' : ''}
        </div>
      </div>
      ${showFavBtn ? `<button class="session-list-fav" data-session="${session.id}">${this._heartIcon(isFav)}</button>` : ''}
      <div class="session-list-play">
        <svg width="11" height="13" viewBox="0 0 12 14" fill="white">
          <path d="M11.5 7L0.5 13.5V0.5L11.5 7Z"/>
        </svg>
      </div>
    `;

    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('session-list-fav') || e.target.closest('.session-list-fav')) return;
      if (session.premium && !Storage.isPremium()) {
        this.showPremiumModal();
      } else {
        this.openPlayer(session);
      }
    });

    item.querySelector('.session-list-fav')?.addEventListener('click', () => {
      const added = Storage.toggleFavorite(session.id);
      item.querySelector('.session-list-fav').innerHTML = this._heartIcon(added);
      this.showToast(added ? 'Salvo nos favoritos' : 'Removido');
      if (showFavBtn && !added) {
        item.style.opacity = '0'; item.style.transform = 'translateX(-16px)';
        item.style.transition = 'all 0.3s ease';
        setTimeout(() => { item.remove(); this.renderFavorites(); }, 300);
      }
    });

    return item;
  }

  // ── TOAST ─────────────────────────────────────────────────────────────
  showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast'; toast.id = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ── HELPERS ───────────────────────────────────────────────────────────
  renderProgressRow(item) {
    const session = SESSIONS.find(s => s.id === item.sessionId);
    const metric = OUTCOME_METRICS[item.metric] || OUTCOME_METRICS.clarity;
    const relief = Math.max(0, item.before - item.after);
    const date = new Date(item.ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    return `
      <div class="recent-item">
        <div class="recent-icon">${session ? this._iconForSession(session) : this._lineIcon('audio')}</div>
        <div class="recent-info">
          <div class="recent-title">${session?.name || 'Sessão Audia'}</div>
          <div class="recent-meta">${date} · ${item.duration} min · ${metric.label}</div>
        </div>
        <div class="recent-result">-${relief}</div>
      </div>
    `;
  }

  _iconForState(stateId) {
    const map = {
      ansioso: 'breath',
      cansado: 'moon',
      distraido: 'focus',
      'sem-energia': 'bolt',
      'pensando-demais': 'spark',
    };
    return this._lineIcon(map[stateId] || 'audio');
  }

  _iconForCategory(categoryId) {
    const map = {
      sleep:       'moon',
      relax:       'wave',
      focus:       'focus',
      clarity:     'spark',
      energy:      'bolt',
      meditation:  'om',
      creative:    'palette',
      performance: 'trophy',
    };
    return this._lineIcon(map[categoryId] || 'audio');
  }

  _iconForSession(session) {
    return this._lineIcon({
      sleep:       'moon',
      relax:       'wave',
      focus:       'focus',
      clarity:     'spark',
      energy:      'bolt',
      meditation:  'om',
      creative:    'palette',
      performance: 'trophy',
    }[session?.category] || 'audio');
  }

  _heartIcon(filled = false) {
    return this._lineIcon(filled ? 'heart-filled' : 'heart');
  }

  _lineIcon(name) {
    const icons = {
      audio: '<path d="M6 9v6"/><path d="M10 6v12"/><path d="M14 8v8"/><path d="M18 11v2"/>',
      breath: '<path d="M4 9c2-2 5-2 7 0s5 2 7 0"/><path d="M4 15c2-2 5-2 7 0s5 2 7 0"/><path d="M12 5v14"/>',
      moon: '<path d="M18 15.5A7 7 0 0 1 8.5 6a7 7 0 1 0 9.5 9.5Z"/>',
      sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.93 4.93l1.41 1.41"/><path d="M17.66 17.66l1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.93 19.07l1.41-1.41"/><path d="M17.66 6.34l1.41-1.41"/>',
      focus: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',
      bolt: '<path d="M13 2 5 13h6l-1 9 9-13h-6l1-7Z"/>',
      spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/>',
      wave: '<path d="M3 13c2.2-3 4.8-3 7 0s4.8 3 7 0 3.5-3 4-3"/><path d="M3 18c2.2-2 4.8-2 7 0s4.8 2 7 0"/>',
      om: '<circle cx="12" cy="12" r="9"/><path d="M8 11c0-2 1.5-3.5 3.5-3.5S15 9 15 11c0 1.5-.8 2.8-2 3.5"/><path d="M9 15c0 1.5 1.5 2.5 3 2.5s3-1 3-2.5"/><path d="M15 9.5c1.5 0 2.5 1 2.5 2.5S16.5 14 15 14"/>',
      palette: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none"/><path d="M9 10c0 3 1 5 3 6"/>',
      trophy: '<path d="M7 4h10v6a5 5 0 0 1-10 0V4Z"/><path d="M7 7H4a2 2 0 0 0 0 4h3"/><path d="M17 7h3a2 2 0 0 0 0 4h-3"/><path d="M12 15v4"/><path d="M9 19h6"/>',
      check: '<path d="m5 12 4 4L19 6"/>',
      lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
      headphones: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M4 14h3v6H4z"/><path d="M17 14h3v6h-3z"/>',
      heart: '<path d="M20.5 8.5a5 5 0 0 0-8.5-3.4 5 5 0 0 0-8.5 3.4c0 5 8.5 10.5 8.5 10.5s8.5-5.5 8.5-10.5Z"/>',
      'heart-filled': '<path d="M20.5 8.5a5 5 0 0 0-8.5-3.4 5 5 0 0 0-8.5 3.4c0 5 8.5 10.5 8.5 10.5s8.5-5.5 8.5-10.5Z" fill="currentColor"/>',
      'volume-low': '<path d="M5 9v6h4l5 4V5L9 9H5Z"/><path d="M17 10c.8 1.1.8 2.9 0 4"/>',
      'volume-high': '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M16 8c1.6 2.1 1.6 5.9 0 8"/><path d="M19 6c2.7 3.5 2.7 8.5 0 12"/>',
      trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M7 7l1 14h8l1-14"/><path d="M10 11v6"/><path d="M14 11v6"/>',
      close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
      'arrow-left': '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
      restart: '<path d="M5 12a7 7 0 1 0 2-5"/><path d="M5 5v5h5"/>',
      play: '<path d="M8 5v14l11-7-11-7Z" fill="currentColor" stroke="none"/>',
      pause: '<path d="M8 5v14"/><path d="M16 5v14"/>',
      stop: '<rect x="7" y="7" width="10" height="10" rx="1" fill="currentColor" stroke="none"/>',
    };

    return `<svg class="mini-icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.audio}</svg>`;
  }

  _moodLabel(mood) {
    const state = MENTAL_STATES.find(s => s.id === mood);
    if (state) return state.label;
    return {
      calmar: 'Mais calmo',
      dormir: 'Dormir melhor',
      focar: 'Focar mais',
      ansiedade: 'Reduzir ansiedade',
      energia: 'Ter mais energia',
    }[mood] || 'Não definido';
  }

  _iconHome() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M4.5 10.5 12 4l7.5 6.5"/>
      <path d="M6.5 10v8.5h11V10"/>
      <path d="M10 18.5v-5h4v5"/>
    </svg>`;
  }
  _iconExplore() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5"/>
      <path d="m14.8 9.2-2 5.6-3.6 1 2-5.6 3.6-1Z"/>
      <path d="M12 3.5v2"/>
      <path d="M12 18.5v2"/>
    </svg>`;
  }
  _iconProgress() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M12 4a8 8 0 1 1-7.5 10.7"/>
      <path d="M12 4v8l5.5 3.2"/>
      <path d="M4.5 8.2A8 8 0 0 1 8.1 5"/>
    </svg>`;
  }
  _iconHeart() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5v14l-6.5-3.7L5.5 20V6A1.5 1.5 0 0 1 7 4.5Z"/>
      <path d="M9 8h6"/>
    </svg>`;
  }
  _iconProfile() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M5 7h8"/>
      <path d="M17 7h2"/>
      <path d="M5 17h2"/>
      <path d="M11 17h8"/>
      <circle cx="15" cy="7" r="2"/>
      <circle cx="9" cy="17" r="2"/>
    </svg>`;
  }
}

// ── BOOT ────────────────────────────────────────────────────────────────
const app = new AudiaApp();
document.addEventListener('DOMContentLoaded', () => app.init());

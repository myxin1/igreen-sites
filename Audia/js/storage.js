// Audia — LocalStorage Manager

const Storage = {
  KEYS: {
    FAVORITES: 'audia_favorites',
    PREFERENCES: 'audia_preferences',
    HISTORY:    'audia_history',
    ONBOARDED:  'audia_onboarded',
    PREMIUM:    'audia_premium',
    CHECKINS:   'audia_checkins',
    STREAK:     'audia_streak',
  },

  // ── FAVORITES ──────────────────────────────────────────────────────────
  getFavorites() {
    return JSON.parse(localStorage.getItem(this.KEYS.FAVORITES) || '[]');
  },

  toggleFavorite(sessionId) {
    const favs = this.getFavorites();
    const idx = favs.indexOf(sessionId);
    if (idx === -1) {
      favs.push(sessionId);
    } else {
      favs.splice(idx, 1);
    }
    localStorage.setItem(this.KEYS.FAVORITES, JSON.stringify(favs));
    return idx === -1; // true = added
  },

  isFavorite(sessionId) {
    return this.getFavorites().includes(sessionId);
  },

  // ── PREFERENCES ────────────────────────────────────────────────────────
  getPreferences() {
    return JSON.parse(localStorage.getItem(this.KEYS.PREFERENCES) || JSON.stringify({
      mood: null,
      volume: 0.7,
      eqPreset: 'balanced',
      timer: 30,
      theme: 'dark',
    }));
  },

  savePreferences(prefs) {
    const current = this.getPreferences();
    localStorage.setItem(this.KEYS.PREFERENCES, JSON.stringify({ ...current, ...prefs }));
  },

  // ── HISTORY ────────────────────────────────────────────────────────────
  addToHistory(sessionId) {
    const history = JSON.parse(localStorage.getItem(this.KEYS.HISTORY) || '[]');
    history.unshift({ id: sessionId, ts: Date.now() });
    // Mantém os últimos 50
    if (history.length > 50) history.pop();
    localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));
  },

  getHistory() {
    return JSON.parse(localStorage.getItem(this.KEYS.HISTORY) || '[]');
  },

  getPlayCounts() {
    const history = this.getHistory();
    const counts = {};
    history.forEach(({ id }) => {
      counts[id] = (counts[id] || 0) + 1;
    });
    return counts;
  },

  // ── PROGRESS / RETENTION ─────────────────────────────────────────────
  getTodayKey(ts = Date.now()) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },

  getCheckins() {
    return JSON.parse(localStorage.getItem(this.KEYS.CHECKINS) || '[]');
  },

  addCheckin(entry) {
    const checkins = this.getCheckins();
    const ts = Date.now();
    const normalized = {
      id: `chk_${ts}`,
      ts,
      date: this.getTodayKey(ts),
      sessionId: entry.sessionId,
      state: entry.state || null,
      metric: entry.metric || 'clarity',
      before: Number(entry.before || 4),
      after: Number(entry.after || 2),
      duration: Number(entry.duration || 0),
    };

    checkins.unshift(normalized);
    if (checkins.length > 200) checkins.pop();
    localStorage.setItem(this.KEYS.CHECKINS, JSON.stringify(checkins));
    this.updateStreak(normalized.date);
    return normalized;
  },

  updateLastCheckin(patch) {
    const checkins = this.getCheckins();
    if (!checkins.length) return null;
    checkins[0] = { ...checkins[0], ...patch };
    localStorage.setItem(this.KEYS.CHECKINS, JSON.stringify(checkins));
    return checkins[0];
  },

  updateStreak(today = this.getTodayKey()) {
    const current = JSON.parse(localStorage.getItem(this.KEYS.STREAK) || '{"count":0,"lastDate":null}');
    if (current.lastDate === today) return current;

    const yesterday = new Date(`${today}T00:00:00`);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = this.getTodayKey(yesterday.getTime());

    const next = {
      count: current.lastDate === yesterdayKey ? current.count + 1 : 1,
      lastDate: today,
    };

    localStorage.setItem(this.KEYS.STREAK, JSON.stringify(next));
    return next;
  },

  getStreak() {
    const today = this.getTodayKey();
    const current = JSON.parse(localStorage.getItem(this.KEYS.STREAK) || '{"count":0,"lastDate":null}');
    return current.lastDate === today ? current.count : 0;
  },

  getProgressSummary() {
    const checkins = this.getCheckins();
    const today = this.getTodayKey();
    const todayItems = checkins.filter(c => c.date === today);
    const recent = checkins.slice(0, 20);

    const reliefItems = recent.filter(c => Number.isFinite(c.before) && Number.isFinite(c.after));
    const relief = reliefItems.reduce((sum, c) => sum + Math.max(0, c.before - c.after), 0);
    const averageRelief = reliefItems.length ? relief / reliefItems.length : 0;
    const averageReliefPercent = Math.round((averageRelief / 5) * 100);

    const focusMinutesToday = todayItems
      .filter(c => c.metric === 'focus')
      .reduce((sum, c) => sum + c.duration, 0);

    const sleepSessions = recent.filter(c => c.metric === 'sleep');
    const estimatedSleepMinutes = sleepSessions.length
      ? Math.max(4, Math.round(18 - (sleepSessions.reduce((sum, c) => sum + Math.max(0, c.before - c.after), 0) / sleepSessions.length) * 3))
      : null;

    const streak = this.getStreak();
    const dailyScore = Math.min(100, Math.round(
      45 +
      todayItems.length * 10 +
      Math.min(25, relief * 4) +
      Math.min(15, streak * 3)
    ));

    return {
      totalSessions: checkins.length,
      sessionsToday: todayItems.length,
      minutesToday: todayItems.reduce((sum, c) => sum + c.duration, 0),
      focusMinutesToday,
      estimatedSleepMinutes,
      averageRelief,
      averageReliefPercent,
      dailyScore,
      streak,
      recent,
      achievements: this.getAchievements({ checkins, todayItems, streak, averageRelief, focusMinutesToday }),
    };
  },

  getAchievements({ checkins, todayItems, streak, averageRelief, focusMinutesToday }) {
    return [
      {
        id: 'first-session',
        title: 'Primeiro controle',
        description: 'Completou sua primeira sessão guiada.',
        unlocked: checkins.length >= 1,
      },
      {
        id: 'quick-reset',
        title: 'Reset rápido',
        description: 'Fez uma sessão de 3 minutos.',
        unlocked: checkins.some(c => c.duration <= 3),
      },
      {
        id: 'focus-window',
        title: 'Janela de foco',
        description: 'Acumulou 10 minutos de foco em um dia.',
        unlocked: focusMinutesToday >= 10,
      },
      {
        id: 'five-streak',
        title: '5 dias seguidos',
        description: 'Criou uma sequência de 5 dias.',
        unlocked: streak >= 5,
      },
      {
        id: 'lighter-mind',
        title: 'Mente mais leve',
        description: 'Reduziu sua carga mental media nas sessoes recentes.',
        unlocked: averageRelief >= 1,
      },
      {
        id: 'three-today',
        title: 'Dia blindado',
        description: 'Completou 3 sessoes no mesmo dia.',
        unlocked: todayItems.length >= 3,
      },
    ];
  },

  // ── ONBOARDING ─────────────────────────────────────────────────────────
  isOnboarded() {
    return localStorage.getItem(this.KEYS.ONBOARDED) === 'true';
  },

  setOnboarded() {
    localStorage.setItem(this.KEYS.ONBOARDED, 'true');
  },

  // ── PREMIUM ────────────────────────────────────────────────────────────
  isPremium() {
    return localStorage.getItem(this.KEYS.PREMIUM) === 'true';
  },

  setPremium(val) {
    localStorage.setItem(this.KEYS.PREMIUM, val ? 'true' : 'false');
  },
};

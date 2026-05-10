// Audia — Sistema de Recomendação Baseado em Humor e Histórico

const Recommendation = {
  getState(stateId) {
    return MENTAL_STATES.find(s => s.id === stateId) || null;
  },

  getSmartPlan(stateId) {
    const state = this.getState(stateId);
    const recommendations = this.getForMood(stateId);
    const session =
      recommendations.find(s => s.id === state?.idealSession) ||
      recommendations[0] ||
      this.getFeatured()[0];

    if (!session) return null;

    return {
      state,
      session,
      frequency: session.frequencyLabel || state?.idealFrequency || 'Frequência guiada',
      duration: session.duration || state?.idealDuration || 5,
      reason: state
        ? `Detectei ${state.label.toLowerCase()}. O melhor primeiro passo é ${state.intent}.`
        : 'Escolhi uma sessão curta para você sentir resultado rápido.',
    };
  },

  // Retorna sessões recomendadas para um humor específico
  getForMood(mood) {
    const ids = MOOD_MAP[mood] || [];
    const counts = Storage.getPlayCounts();
    const isPremium = Storage.isPremium();

    return ids
      .map(id => SESSIONS.find(s => s.id === id))
      .filter(Boolean)
      .filter(s => isPremium || !s.premium)
      .sort((a, b) => {
        // Prioriza sessões nunca tocadas (descoberta), depois as mais ouvidas
        const ca = counts[a.id] || 0;
        const cb = counts[b.id] || 0;
        if (ca === 0 && cb > 0) return -1;
        if (cb === 0 && ca > 0) return 1;
        return cb - ca;
      })
      .slice(0, 4);
  },

  // Recomendações baseadas apenas no histórico de uso (colaborativo simples)
  getPersonalized() {
    const counts = Storage.getPlayCounts();
    const isPremium = Storage.isPremium();

    if (Object.keys(counts).length === 0) {
      // Sem histórico: retorna sessões em destaque
      return SESSIONS.filter(s => s.featured && (isPremium || !s.premium)).slice(0, 4);
    }

    // Descobre categorias favoritas
    const catCounts = {};
    SESSIONS.forEach(s => {
      if (counts[s.id]) {
        catCounts[s.category] = (catCounts[s.category] || 0) + counts[s.id];
      }
    });

    const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

    return SESSIONS
      .filter(s => s.category === topCat && (isPremium || !s.premium))
      .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
      .slice(0, 4);
  },

  // Retorna sessões de uma categoria
  getByCategory(categoryId) {
    return SESSIONS
      .filter(s => s.category === categoryId)
      .sort((a, b) => Number(a.premium) - Number(b.premium) || a.duration - b.duration);
  },

  // Retorna todas as sessões em destaque
  getFeatured() {
    const isPremium = Storage.isPremium();
    return SESSIONS
      .filter(s => s.featured && (isPremium || !s.premium))
      .sort((a, b) => a.duration - b.duration);
  },

  // Sessões premium (para exibir na paywall)
  getPremiumSessions() {
    return SESSIONS.filter(s => s.premium);
  },

  getDailyInsight() {
    const summary = Storage.getProgressSummary();

    if (summary.streak >= 5) {
      return `Você completou ${summary.streak} dias seguidos. Seu hábito já está ganhando tração.`;
    }

    if (summary.focusMinutesToday >= 10) {
      return `Você acumulou ${summary.focusMinutesToday} minutos de foco hoje. Boa janela mental.`;
    }

    if (summary.averageRelief > 0) {
      return `Você reduziu sua carga mental média em ${summary.averageReliefPercent}% nas sessões recentes.`;
    }

    return 'Escolha como você está agora. O Audia recomenda uma ação simples para os próximos minutos.';
  },
};

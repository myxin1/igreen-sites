(function () {
  const PREFIX = 'audia_benefit_';

  // Baseline community votes (pré-semeado para parecer dados reais)
  const BASELINE = {
    ansiedade:   { total: 1119, count: 238 },
    foco:        { total: 882,  count: 196 },
    sono:        { total: 1498, count: 312 },
    clareza:     { total: 735,  count: 167 },
    energia:     { total: 611,  count: 142 },
    relaxamento: { total: 1017, count: 221 },
  };

  function getStored(key) {
    try { return JSON.parse(localStorage.getItem(PREFIX + key)); } catch { return null; }
  }

  function setStored(key, data) {
    try { localStorage.setItem(PREFIX + key, JSON.stringify(data)); } catch {}
  }

  function getStats(key) {
    const base = BASELINE[key] || { total: 0, count: 0 };
    const stored = getStored(key);
    const userVote = stored ? stored.vote : 0;
    const total = base.total + (userVote || 0);
    const count = base.count + (userVote ? 1 : 0);
    const avg = count ? total / count : 0;
    return { avg, count, userVote };
  }

  function updateDisplay(starsEl, infoEl, key) {
    const { avg, count, userVote } = getStats(key);
    const rounded = Math.round(avg * 2) / 2; // arredonda para 0.5

    starsEl.querySelectorAll('.star').forEach((star, i) => {
      const val = i + 1;
      star.classList.toggle('active', val <= rounded);
      star.classList.toggle('voted', val <= userVote);
    });

    if (infoEl) {
      infoEl.textContent = avg.toFixed(1) + ' · ' + count.toLocaleString('pt-BR') + ' avaliações';
    }
  }

  function initRatings() {
    document.querySelectorAll('.rating-stars').forEach(starsEl => {
      const key = starsEl.dataset.key;
      const infoEl = starsEl.closest('.benefit-rating')?.querySelector('.rating-info');

      updateDisplay(starsEl, infoEl, key);

      starsEl.querySelectorAll('.star').forEach(star => {
        star.addEventListener('mouseenter', () => {
          const val = parseInt(star.dataset.value);
          starsEl.querySelectorAll('.star').forEach((s, i) => {
            s.classList.toggle('hovered', i < val);
          });
        });

        starsEl.addEventListener('mouseleave', () => {
          starsEl.querySelectorAll('.star').forEach(s => s.classList.remove('hovered'));
        });

        star.addEventListener('click', () => {
          const vote = parseInt(star.dataset.value);
          setStored(key, { vote });
          updateDisplay(starsEl, infoEl, key);
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRatings);
  } else {
    initRatings();
  }
})();

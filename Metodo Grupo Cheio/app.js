/* =========================================================
   Método Grupo Cheio — Quiz de diagnóstico
   Fluxo: intro → q1 → q2 → q3 → diagnóstico + oferta → checkout
   ========================================================= */
(function () {
  'use strict';

  var CONFIG = {
    // >>> Troque pelo link de checkout da Kiwify <<<
    checkoutUrl: 'COLOCAR_LINK_DE_CHECKOUT_DA_KIWIFY',
    storageKey: 'mgc_quiz_v1',
    autoAdvanceMs: 380,
    debug: /[?&]debug=1/.test(location.search)
  };

  // Respostas que indicam uma base sólida em cada pergunta
  var STRONG = { q1: ['A'], q2: ['C'], q3: ['B'] };
  var RECOMMENDED = { q2: 'C', q3: 'B' };
  var QUESTION_EVENT = { q1: 'QuizQuestion1', q2: 'QuizQuestion2', q3: 'QuizQuestion3' };
  var STEP_NUMBER = { q1: 1, q2: 2, q3: 3 };

  var LEVELS = {
    low: {
      label: 'Nível: decisões no achismo',
      title: 'Você provavelmente está tomando algumas decisões sem uma estrutura clara de análise.'
    },
    mid: {
      label: 'Nível: análise intermediária',
      title: 'Você já olha para os números, mas ainda falta um processo claro para transformar dados em decisões.'
    },
    high: {
      label: 'Nível: boa base de análise',
      title: 'Você já tem uma boa base. O próximo passo é ter um processo consistente para escalar sem perder o controle.'
    }
  };

  var SCORECARD = [
    { q: 'q1', label: 'Leitura rápida das métricas' },
    { q: 'q2', label: 'Decisão de escala' },
    { q: 'q3', label: 'Processos e automações' }
  ];

  var state = { answers: {}, completed: false };

  /* ---------- Utilidades ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function save() {
    try { sessionStorage.setItem(CONFIG.storageKey, JSON.stringify(state)); } catch (e) { /* storage indisponível */ }
  }

  /* ---------- Tracking (Meta Pixel + dataLayer) ---------- */
  function track(eventName, params) {
    params = params || {};
    try {
      if (typeof window.fbq === 'function') window.fbq('trackCustom', eventName, params);
    } catch (e) { /* pixel bloqueado */ }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, params));
    if (CONFIG.debug) console.log('[track]', eventName, params);
  }

  /* ---------- Navegação ---------- */
  var progress = $('#progress');
  var progressText = $('#progressText');
  var progressFill = $('#progressFill');
  var progressBar = $('#progressBar');

  function show(name) {
    $all('[data-screen]').forEach(function (el) {
      el.hidden = el.getAttribute('data-screen') !== name;
    });

    var step = STEP_NUMBER[name];
    progress.hidden = !step;
    if (step) {
      progressText.textContent = 'Pergunta ' + step + ' de 3';
      progressFill.style.width = (step / 3 * 100) + '%';
      progressBar.setAttribute('aria-valuenow', String(step));
    }

    window.scrollTo(0, 0);
    var heading = $('[data-screen="' + name + '"] h1, [data-screen="' + name + '"] h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }

  /* ---------- Respostas ---------- */
  function answer(question, value, button) {
    if (state.answers[question]) return; // já respondida
    state.answers[question] = value;
    save();

    var group = button.parentNode;
    button.classList.add('is-selected');
    track(QUESTION_EVENT[question], { answer: value });

    if (question === 'q1') {
      $all('.option', group).forEach(function (b) { b.disabled = true; });
      setTimeout(function () { show('q2'); }, CONFIG.autoAdvanceMs);
      return;
    }

    // q2 e q3: trava as opções, destaca a recomendada e mostra o feedback
    group.classList.add('is-locked');
    $all('.option', group).forEach(function (b) {
      b.disabled = true;
      if (b.getAttribute('data-value') === RECOMMENDED[question]) b.classList.add('is-recommended');
    });
    var feedback = $('[data-feedback="' + question + '"]');
    feedback.hidden = false;
    setTimeout(function () {
      feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 60);
  }

  /* ---------- Diagnóstico ---------- */
  function renderResult() {
    var strongCount = 0;
    var list = $('#scorecard');
    list.innerHTML = '';

    SCORECARD.forEach(function (item) {
      var isStrong = STRONG[item.q].indexOf(state.answers[item.q]) !== -1;
      if (isStrong) strongCount++;
      var li = document.createElement('li');
      var label = document.createElement('span');
      label.textContent = item.label;
      var pill = document.createElement('span');
      pill.className = 'pill ' + (isStrong ? 'pill--ok' : 'pill--warn');
      pill.textContent = isStrong ? 'No caminho certo' : 'Precisa de estrutura';
      li.appendChild(label);
      li.appendChild(pill);
      list.appendChild(li);
    });

    var level = strongCount <= 1 ? 'low' : strongCount === 2 ? 'mid' : 'high';
    $('#levelLabel').textContent = LEVELS[level].label;
    $('#diagnosisTitle').textContent = LEVELS[level].title;
    return level;
  }

  /* ---------- Checkout ---------- */
  // Repassa UTMs / src da URL atual para o checkout (atribuição na Kiwify)
  function buildCheckoutUrl() {
    var base = CONFIG.checkoutUrl;
    try {
      var url = new URL(base, location.href);
      new URLSearchParams(location.search).forEach(function (v, k) {
        if (/^(utm_|src$|sck$|fbclid$)/.test(k) && !url.searchParams.has(k)) url.searchParams.set(k, v);
      });
      return url.toString();
    } catch (e) {
      return base;
    }
  }

  /* ---------- Eventos ---------- */
  document.addEventListener('click', function (e) {
    var option = e.target.closest('.option');
    if (option && !option.disabled) {
      var question = option.parentNode.getAttribute('data-question');
      answer(question, option.getAttribute('data-value'), option);
      return;
    }

    var action = e.target.closest('[data-action]');
    if (!action) return;

    switch (action.getAttribute('data-action')) {
      case 'start':
        track('QuizStart');
        show('q1');
        break;
      case 'next':
        show(action.getAttribute('data-to'));
        break;
      case 'finish':
        var level = renderResult();
        state.completed = true;
        save();
        track('QuizComplete', { level: level, q1: state.answers.q1, q2: state.answers.q2, q3: state.answers.q3 });
        show('result');
        break;
    }
  });

  var checkoutBtn = $('#checkoutBtn');
  checkoutBtn.href = buildCheckoutUrl();
  checkoutBtn.addEventListener('click', function () {
    track('CheckoutClick', { value: 47, currency: 'BRL' });
    try {
      if (typeof window.fbq === 'function') window.fbq('track', 'InitiateCheckout', { value: 47, currency: 'BRL' });
    } catch (err) { /* pixel bloqueado */ }
  });

  // Exposto para debug / integrações futuras
  window.MGCQuiz = { getAnswers: function () { return Object.assign({}, state.answers); } };
})();

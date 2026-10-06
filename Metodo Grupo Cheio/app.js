/* =========================================================
   Método Grupo Cheio — Quiz de diagnóstico
   Fluxo: intro → q1 → q2 → q3 → diagnóstico + oferta → checkout
   ========================================================= */
(function () {
  'use strict';

  var CONFIG = {
    // >>> Troque pelo link de checkout da Kiwify <<<
    checkoutUrl: 'https://pay.kiwify.com.br/zegKnpy',
    price: 5.90,
    storageKey: 'mgc_quiz_v1',
    deadlineKey: 'mgc_offer_deadline',
    offerMinutes: 30,
    urgentMinutes: 5,
    debug: /[?&]debug=1/.test(location.search)
  };

  // Respostas que indicam uma base sólida em cada pergunta
  var STRONG = { q1: ['C'], q2: ['C'], q3: ['B'] };
  var RECOMMENDED = { q1: 'C', q2: 'C', q3: 'B' };
  var PREVIOUS = { q1: 'intro', q2: 'q1', q3: 'q2', result: 'q3' };
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

  var current = 'intro';

  // Cada tela vira uma entrada no histórico, para o "voltar" do celular
  // voltar uma pergunta em vez de sair da página.
  function go(name) {
    try { history.pushState({ screen: name }, ''); } catch (e) { /* history indisponível */ }
    show(name);
  }

  function goBack() {
    if (history.state && history.state.screen && history.state.screen !== 'intro') history.back();
    else show(PREVIOUS[current] || 'intro');
  }

  window.addEventListener('popstate', function (e) {
    show((e.state && e.state.screen) || 'intro');
  });

  function show(name) {
    current = name;
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

    // Trava as opções, destaca a recomendada e mostra o feedback
    group.classList.add('is-locked');
    $all('.option', group).forEach(function (b) {
      b.disabled = true;
      if (b.getAttribute('data-value') === RECOMMENDED[question]) b.classList.add('is-recommended');
    });
    var feedback = $('[data-feedback="' + question + '"]');
    feedback.hidden = false;

    // Na q1 a "resposta" é a própria tabela ganhando a formatação condicional
    var table = question === 'q1' ? $('#cfTable') : null;
    if (table) table.classList.add('is-formatted');

    setTimeout(function () {
      if (table) table.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else feedback.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

  /* ---------- Timer da oferta ----------
     O prazo começa quando o diagnóstico é exibido e fica salvo no navegador:
     recarregar a página não reinicia a contagem. Ao zerar, a oferta sai da página. */
  var deadline = null;
  var timerId = null;
  var offerExpired = false;

  function getDeadline() {
    var saved = null;
    try { saved = parseInt(localStorage.getItem(CONFIG.deadlineKey), 10); } catch (e) { /* storage indisponível */ }
    if (saved > 0) return saved;
    var fresh = Date.now() + CONFIG.offerMinutes * 60 * 1000;
    try { localStorage.setItem(CONFIG.deadlineKey, String(fresh)); } catch (e) { /* storage indisponível */ }
    return fresh;
  }

  function formatClock(ms) {
    var total = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
  }

  function expireOffer() {
    offerExpired = true;
    clearInterval(timerId);
    $('#offerBuy').hidden = true;
    $('#offerExpired').hidden = false;
    $('#offerTimer').hidden = true;
    track('OfferExpired');
  }

  function tick() {
    var left = deadline - Date.now();
    $all('[data-clock]').forEach(function (el) { el.textContent = formatClock(left); });
    $('#offerTimer').classList.toggle('is-urgent', left <= CONFIG.urgentMinutes * 60 * 1000);
    if (left <= 0) expireOffer();
  }

  function startTimer() {
    if (timerId || offerExpired) return;
    deadline = getDeadline();
    tick();
    if (!offerExpired) timerId = setInterval(tick, 1000);
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
        if (!state.started) { state.started = true; track('QuizStart'); }
        go('q1');
        break;
      case 'next':
        go(action.getAttribute('data-to'));
        break;
      case 'back':
        goBack();
        break;
      case 'finish':
        if (!state.completed) {
          var level = renderResult();
          state.completed = true;
          save();
          track('QuizComplete', { level: level, q1: state.answers.q1, q2: state.answers.q2, q3: state.answers.q3 });
        }
        go('result');
        startTimer();
        break;
    }
  });

  try { history.replaceState({ screen: 'intro' }, ''); } catch (e) { /* history indisponível */ }

  var checkoutBtn = $('#checkoutBtn');
  checkoutBtn.href = buildCheckoutUrl();
  checkoutBtn.addEventListener('click', function (e) {
    if (offerExpired) { e.preventDefault(); return; }
    track('CheckoutClick', { value: CONFIG.price, currency: 'BRL' });
    try {
      if (typeof window.fbq === 'function') window.fbq('track', 'InitiateCheckout', { value: CONFIG.price, currency: 'BRL' });
    } catch (err) { /* pixel bloqueado */ }
  });

  // Exposto para debug / integrações futuras
  window.MGCQuiz = { getAnswers: function () { return Object.assign({}, state.answers); } };
})();

/* =========================================================
   Painel do Instagram — Método Grupo Cheio
   Fala só com /api/* (mesma origem). Nenhuma chave fica no navegador.
   ========================================================= */
(function () {
  'use strict';

  var SITE = location.origin;
  var QUIZ = SITE + '/';

  function quizLink(campaign) {
    return QUIZ + '?utm_source=instagram&utm_medium=dm&utm_campaign=' + campaign;
  }

  var GATE_DEFAULTS = {
    gateMessage: 'Pra liberar o link, me segue aqui no perfil e toca no botão abaixo 👇',
    gateButton: 'Já sigo',
    gateNotFollowing: 'Ainda não encontrei seu follow 😅 Me segue e toca em "Já sigo" de novo que eu te mando o link.'
  };

  var TEMPLATES = {
    comment: {
      trigger: 'comment',
      name: 'Comentário GRUPO',
      keywords: ['GRUPO'],
      alsoMatchInDms: true,
      dmMessage: 'Oi! 👋 Aqui está o teste rápido pra descobrir se você está analisando suas campanhas do jeito certo. Leva menos de 1 minuto:',
      buttonTitle: 'Fazer o teste',
      buttonUrl: quizLink('comentario'),
      commentReplies: ['Te mandei no Direct! 📩', 'Enviado! Confere seu Direct 👀', 'Pronto, chegou no seu Direct ✅']
    },
    story: {
      trigger: 'story_reply',
      name: 'Story GRUPO',
      keywords: ['GRUPO'],
      dmMessage: 'Oi! 👋 Como prometido no story, aqui está o teste rápido pra você ver se está escalando suas campanhas do jeito certo:',
      buttonTitle: 'Fazer o teste',
      buttonUrl: quizLink('story')
    },
    direct: {
      trigger: 'comment',
      name: 'Palavra no Direct TESTE',
      keywords: ['TESTE'],
      alsoMatchInDms: true,
      dmMessage: 'Aqui está! 👇 Responda 3 perguntas rápidas e veja se você está decidindo suas campanhas com base em dados:',
      buttonTitle: 'Fazer o teste',
      buttonUrl: quizLink('direct')
    }
  };

  var ICE_SUGGESTIONS = [
    { question: 'Como funciona o Método Grupo Cheio?', answer: 'É um material prático que mostra como criar, analisar, otimizar e escalar campanhas pra encher grupos de achadinhos no WhatsApp. Comece pelo teste rápido 👇', buttonTitle: 'Fazer o teste', buttonUrl: quizLink('icebreaker') },
    { question: 'Quero fazer o teste das campanhas', answer: 'Bora! São só 3 perguntas e leva menos de 1 minuto 👇', buttonTitle: 'Fazer o teste', buttonUrl: quizLink('icebreaker') },
    { question: 'Serve pra quem está começando?', answer: 'Serve sim! O método vai do funil completo até a escala, com um plano de ação no final. Faça o teste pra ver em que ponto você está 👇', buttonTitle: 'Fazer o teste', buttonUrl: quizLink('icebreaker') },
    { question: 'Quanto custa o método?', answer: 'O valor e a condição atual aparecem no final do teste rápido 👇', buttonTitle: 'Ver condição', buttonUrl: quizLink('icebreaker') }
  ];

  var state = { items: [], status: null, editing: null };

  /* ---------- Utilidades ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var toastTimer;
  function toast(msg, isError) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.toggle('is-error', Boolean(isError));
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, isError ? 6000 : 3000);
  }

  function api(path, opts) {
    opts = opts || {};
    var init = { method: opts.method || 'GET', credentials: 'same-origin', headers: { 'X-MGC-Admin': '1' } };
    if (opts.body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    return fetch(path, init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.status === 401 && path !== '/api/login') {
          showLogin();
          throw new Error(data.error || 'Sessão expirada.');
        }
        if (!res.ok) {
          var err = new Error(data.error || ('Erro ' + res.status));
          err.detail = data.detail;
          throw err;
        }
        return data;
      });
    });
  }

  function errorText(err) {
    return err.message + (err.detail ? ' — ' + err.detail : '');
  }

  function formatDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  /* ---------- Login ---------- */
  function showLogin() {
    $('#appView').hidden = true;
    $('#loginView').hidden = false;
    var input = $('#loginForm [name=password]');
    if (input) input.focus();
  }

  function showApp() {
    $('#loginView').hidden = true;
    $('#appView').hidden = false;
    loadAll();
  }

  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('button[type=submit]', e.target);
    var errEl = $('#loginError');
    btn.disabled = true;
    errEl.hidden = true;
    api('/api/login', { method: 'POST', body: { password: e.target.password.value } })
      .then(function () { e.target.reset(); showApp(); })
      .catch(function (err) { errEl.textContent = err.message; errEl.hidden = false; })
      .then(function () { btn.disabled = false; });
  });

  $('#logoutBtn').addEventListener('click', function () {
    api('/api/login', { method: 'DELETE' }).catch(function () {}).then(showLogin);
  });

  /* ---------- Status ---------- */
  function renderStatus() {
    var s = state.status;
    var el = $('#status');
    if (!s) { el.innerHTML = '<span class="muted">Verificando conexão…</span>'; return; }
    var ok = s.zernio && s.account && !s.error;
    var text;
    if (!s.zernio) text = 'Zernio não configurado (falta ZERNIO_API_KEY na Vercel)';
    else if (s.error) text = 'Erro ao falar com o Zernio: ' + s.error;
    else if (!s.account) text = 'A conta @' + s.username + ' não está conectada no Zernio';
    else text = '@' + (s.account.username || s.username) + ' conectada no Zernio';
    el.innerHTML = '<span class="status__dot' + (ok ? '' : ' is-bad') + '">' + esc(text) + '</span>';
    renderIceWarning();
  }

  // Aviso na aba de perguntas prontas quando o webhook não está ativo.
  function renderIceWarning() {
    var s = state.status;
    var el = $('#iceWarning');
    if (!s || !s.account || s.webhook) { el.innerHTML = ''; return; }
    el.innerHTML = s.webhookSecret
      ? '<div class="banner"><span>As perguntas aparecem, mas ainda não são respondidas.</span>' +
        '<button class="btn btn--dark btn--sm" type="button" id="hookBtn">Ativar respostas</button></div>'
      : '<div class="banner banner--bad">Falta configurar ZERNIO_WEBHOOK_SECRET na Vercel para responder as perguntas.</div>';
    var hookBtn = $('#hookBtn');
    if (hookBtn) {
      hookBtn.addEventListener('click', function () {
        hookBtn.disabled = true;
        api('/api/status', { method: 'POST' })
          .then(function () { toast('Respostas das perguntas prontas ativadas.'); return loadStatus(); })
          .catch(function (err) { toast(errorText(err), true); hookBtn.disabled = false; });
      });
    }
  }

  function loadStatus() {
    return api('/api/status').then(function (s) { state.status = s; renderStatus(); return s; });
  }

  /* ---------- Abas ---------- */
  // Cada aba de automação filtra a mesma lista vinda do Zernio.
  // No Zernio a "palavra no Direct" é uma automação de comentário com
  // alsoMatchInDms; por isso ela aparece nas abas Comentários e Direct.
  var TABS = {
    comentarios: {
      title: 'Comentário → DM',
      desc: 'Quem comentar a palavra em qualquer post ou reel recebe o link no Direct.',
      template: 'comment',
      filter: function (a) { return a.trigger !== 'story_reply'; },
      empty: 'Nenhuma automação de comentário ainda.'
    },
    stories: {
      title: 'Resposta de story → DM',
      desc: 'Quem responder seus stories com a palavra recebe o link no Direct.',
      template: 'story',
      filter: function (a) { return a.trigger === 'story_reply'; },
      empty: 'Nenhuma automação de story ainda.'
    },
    direct: {
      title: 'Palavra no Direct → resposta',
      desc: 'Quem mandar a palavra no seu Direct recebe a resposta na hora. Essas palavras também valem para comentários.',
      template: 'direct',
      filter: function (a) { return a.trigger !== 'story_reply' && a.alsoMatchInDms; },
      empty: 'Nenhuma palavra no Direct ainda.'
    }
  };
  var currentTab = 'comentarios';

  function selectTab(name) {
    if (name !== 'perguntas' && !TABS[name]) name = 'comentarios';
    currentTab = name;
    $all('[data-tab]').forEach(function (t) {
      t.setAttribute('aria-selected', String(t.getAttribute('data-tab') === name));
    });
    var isIce = name === 'perguntas';
    $('#icePanel').hidden = !isIce;
    $('#automationPanel').hidden = isIce;
    if (!isIce) {
      $('#panelTitle').textContent = TABS[name].title;
      $('#panelDesc').textContent = TABS[name].desc;
      renderAutomations();
    }
    try { history.replaceState(null, '', '#' + name); } catch (e) { /* sem history */ }
  }

  $('.tabs').addEventListener('click', function (e) {
    var t = e.target.closest('[data-tab]');
    if (t) selectTab(t.getAttribute('data-tab'));
  });

  function renderCounts() {
    Object.keys(TABS).forEach(function (k) {
      var n = state.items.filter(TABS[k].filter).length;
      $('[data-count="' + k + '"]').textContent = n ? String(n) : '';
    });
  }

  /* ---------- Automações ---------- */
  function renderAutomations() {
    renderCounts();
    if (currentTab === 'perguntas') return;
    var tab = TABS[currentTab];
    var el = $('#automations');
    var items = state.items.filter(tab.filter);
    if (!items.length) {
      el.innerHTML =
        '<div class="empty"><p><strong>' + esc(tab.empty) + '</strong></p>' +
        '<p class="muted">Comece pelo modelo pronto e só ajuste o texto.</p>' +
        '<button class="btn btn--dark btn--sm" type="button" data-new="' + tab.template + '">Usar modelo pronto</button></div>';
      return;
    }
    el.innerHTML = items.map(function (a) {
      var kws = a.keywords.length
        ? a.keywords.map(function (k) { return '<span class="tag tag--kw">' + esc(k) + '</span>'; }).join('')
        : '<span class="tag tag--kw">qualquer texto</span>';
      var note = '';
      if (currentTab === 'comentarios' && a.alsoMatchInDms) note = 'Também responde no Direct';
      if (currentTab === 'direct') note = 'Também responde comentários';
      return '<article class="card' + (a.isActive ? '' : ' is-off') + '" data-id="' + esc(a.id) + '">' +
        '<div class="card__top">' +
          '<span class="card__name">' + esc(a.name) + '</span>' +
          '<label class="switch" title="Ligar ou desligar"><input type="checkbox" data-toggle ' + (a.isActive ? 'checked' : '') + ' aria-label="Automação ligada"><span></span></label>' +
        '</div>' +
        '<div class="tags">' +
          kws +
          (a.followOnly ? '<span class="tag tag--dm">Só seguidores</span>' : '') +
        '</div>' +
        '<div class="stats">' +
          '<span><b>' + a.stats.triggered + '</b> disparos</span>' +
          '<span><b>' + a.stats.dmsSent + '</b> DMs enviadas</span>' +
          '<span><b>' + a.stats.clicks + '</b> cliques</span>' +
          (a.stats.dmsFailed ? '<span class="is-bad"><b>' + a.stats.dmsFailed + '</b> falhas</span>' : '') +
        '</div>' +
        (note ? '<div class="card__note">' + note + '</div>' : '') +
        '<div class="card__actions">' +
          '<button class="link" type="button" data-edit>Editar</button>' +
          '<button class="link" type="button" data-logs>Histórico</button>' +
          '<button class="link link--danger" type="button" data-delete>Excluir</button>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function loadAutomations() {
    $('#automations').innerHTML = '<p class="muted">Carregando…</p>';
    return api('/api/automations')
      .then(function (data) { state.items = data.items || []; renderAutomations(); })
      .catch(function (err) { $('#automations').innerHTML = '<p class="form-error">' + esc(errorText(err)) + '</p>'; });
  }

  function findItem(el) {
    var card = el.closest('[data-id]');
    var id = card && card.getAttribute('data-id');
    return state.items.filter(function (a) { return a.id === id; })[0];
  }

  $('#automations').addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('[data-new]')) return openEditor(null, t.closest('[data-new]').getAttribute('data-new'));
    var item = findItem(t);
    if (!item) return;
    if (t.closest('[data-edit]')) openEditor(item);
    else if (t.closest('[data-logs]')) openLogs(item);
    else if (t.closest('[data-delete]')) removeItem(item);
  });

  $('#automations').addEventListener('change', function (e) {
    if (!e.target.matches('[data-toggle]')) return;
    var item = findItem(e.target);
    var on = e.target.checked;
    e.target.disabled = true;
    api('/api/automations?id=' + encodeURIComponent(item.id), { method: 'PATCH', body: { isActive: on } })
      .then(function () {
        item.isActive = on;
        renderAutomations();
        toast(on ? 'Automação ligada.' : 'Automação desligada.');
      })
      .catch(function (err) { e.target.checked = !on; e.target.disabled = false; toast(errorText(err), true); });
  });

  function removeItem(item) {
    if (!confirm('Excluir "' + item.name + '"? Isso apaga a automação no Zernio.')) return;
    api('/api/automations?id=' + encodeURIComponent(item.id), { method: 'DELETE' })
      .then(function () {
        state.items = state.items.filter(function (a) { return a.id !== item.id; });
        renderAutomations();
        toast('Automação excluída.');
      })
      .catch(function (err) { toast(errorText(err), true); });
  }

  /* ---------- Editor ---------- */
  var editor = $('#editor');
  var form = $('#editorForm');

  function fillForm(data) {
    var d = Object.assign({
      trigger: 'comment', name: '', keywords: [], typoTolerance: false, alsoMatchInDms: false,
      dmMessage: '', buttonTitle: 'Fazer o teste', buttonUrl: quizLink('instagram'), commentReplies: [],
      dmDelaySeconds: 0, followOnly: false, isActive: true
    }, GATE_DEFAULTS, data || {});
    if (!d.gateMessage) d.gateMessage = GATE_DEFAULTS.gateMessage;
    if (!d.gateButton) d.gateButton = GATE_DEFAULTS.gateButton;
    if (!d.gateNotFollowing) d.gateNotFollowing = GATE_DEFAULTS.gateNotFollowing;

    $all('[name=trigger]', form).forEach(function (r) { r.checked = r.value === d.trigger; });
    form.elements.namedItem('name').value = d.name;
    form.keywords.value = d.keywords.join(', ');
    form.typoTolerance.checked = d.typoTolerance;
    form.alsoMatchInDms.checked = d.alsoMatchInDms;
    form.dmMessage.value = d.dmMessage;
    form.buttonTitle.value = d.buttonTitle;
    form.buttonUrl.value = d.buttonUrl;
    form.commentReplies.value = d.commentReplies.join('\n');
    var delay = String(d.dmDelaySeconds || 0);
    if (!$('option[value="' + delay + '"]', form.dmDelaySeconds)) {
      var opt = document.createElement('option');
      opt.value = delay;
      opt.textContent = 'Depois de ' + delay + ' s';
      form.dmDelaySeconds.appendChild(opt);
    }
    form.dmDelaySeconds.value = delay;
    form.followOnly.checked = d.followOnly;
    form.gateMessage.value = d.gateMessage;
    form.gateButton.value = d.gateButton;
    form.gateNotFollowing.value = d.gateNotFollowing;
    form.isActive.checked = d.isActive;
    syncForm();
  }

  function readForm() {
    return {
      trigger: ($('[name=trigger]:checked', form) || {}).value || 'comment',
      name: form.elements.namedItem('name').value,
      keywords: form.keywords.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean),
      typoTolerance: form.typoTolerance.checked,
      alsoMatchInDms: form.alsoMatchInDms.checked,
      dmMessage: form.dmMessage.value,
      buttonTitle: form.buttonTitle.value,
      buttonUrl: form.buttonUrl.value,
      commentReplies: form.commentReplies.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean),
      dmDelaySeconds: Number(form.dmDelaySeconds.value),
      followOnly: form.followOnly.checked,
      gateMessage: form.gateMessage.value,
      gateButton: form.gateButton.value,
      gateNotFollowing: form.gateNotFollowing.value,
      isActive: form.isActive.checked
    };
  }

  // Mostra/esconde campos conforme o gatilho e atualiza contadores/dicas.
  function syncForm() {
    var trigger = ($('[name=trigger]:checked', form) || {}).value;
    var isComment = trigger === 'comment';
    $all('[data-only=comment]', form).forEach(function (el) { el.hidden = !isComment; });
    $('#gateFields').hidden = !form.followOnly.checked;
    $('#rulesLegend').textContent = (isComment ? '4' : '3') + '. Regras';

    var hasKw = form.keywords.value.trim().length > 0;
    $('#keywordsHint').textContent = hasKw
      ? 'Dispara quando a palavra aparece sozinha no texto (não no meio de outra palavra).'
      : (isComment ? 'Vazio = responde QUALQUER comentário.' : 'Vazio = responde QUALQUER resposta aos seus stories.');

    var limit = form.buttonUrl.value.trim() ? 640 : 1000;
    var len = form.dmMessage.value.length;
    var counter = $('[data-counter=dmMessage]', form);
    counter.textContent = len + '/' + limit;
    counter.classList.toggle('is-over', len > limit);
  }

  form.addEventListener('input', syncForm);
  form.addEventListener('change', syncForm);

  $('#templates').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-template]');
    if (btn) fillForm(TEMPLATES[btn.getAttribute('data-template')]);
  });

  function openEditor(item, templateKey) {
    state.editing = item || null;
    $('#editorTitle').textContent = item ? 'Editar automação' : 'Nova automação';
    $('#templates').hidden = Boolean(item);
    $all('[name=trigger]', form).forEach(function (r) { r.disabled = Boolean(item); });
    $('#editorError').hidden = true;
    fillForm(item || TEMPLATES[templateKey || 'comment']);
    editor.showModal();
  }

  $('#newBtn').addEventListener('click', function () {
    openEditor(null, (TABS[currentTab] || TABS.comentarios).template);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var data = readForm();
    var btn = $('#saveBtn');
    var errEl = $('#editorError');
    errEl.hidden = true;
    btn.disabled = true;
    var req = state.editing
      ? api('/api/automations?id=' + encodeURIComponent(state.editing.id), { method: 'PATCH', body: data })
      : api('/api/automations', { method: 'POST', body: data });
    req
      .then(function () {
        editor.close();
        toast(state.editing ? 'Automação salva.' : 'Automação criada.');
        return loadAutomations();
      })
      .catch(function (err) {
        errEl.textContent = errorText(err);
        errEl.hidden = false;
        errEl.scrollIntoView({ block: 'nearest' });
      })
      .then(function () { btn.disabled = false; });
  });

  /* ---------- Histórico ---------- */
  var LOG_STATUS = {
    sent: ['pill--ok', 'Enviada'],
    failed: ['pill--bad', 'Falhou'],
    skipped: ['', 'Ignorada'],
    pending: ['pill--warn', 'Agendada'],
    gated: ['pill--warn', 'Esperando seguir']
  };
  var LOG_SOURCE = { comment: 'Comentário', story_reply: 'Story', dm: 'Direct' };

  function openLogs(item) {
    var dlg = $('#logs');
    var body = $('#logsBody');
    $('#logsTitle').textContent = 'Histórico · ' + item.name;
    body.innerHTML = '<p class="muted">Carregando…</p>';
    dlg.showModal();
    api('/api/automations?id=' + encodeURIComponent(item.id) + '&logs=1')
      .then(function (data) {
        var html = '';
        if (!data.logs.length) html += '<p class="muted">Nenhum envio ainda.</p>';
        html += data.logs.map(function (l) {
          var st = LOG_STATUS[l.status] || ['', l.status];
          return '<div class="log"><div class="log__top">' +
            '<span class="tag">' + esc(LOG_SOURCE[l.source] || l.source) + '</span>' +
            '<span class="pill ' + st[0] + '">' + esc(st[1]) + '</span>' +
            (l.name ? '<strong>' + esc(l.name) + '</strong>' : '') +
            '<span class="log__time">' + esc(formatDate(l.at)) + '</span></div>' +
            (l.text ? '<div class="log__text">“' + esc(l.text) + '”</div>' : '') +
            (l.error ? '<div class="log__err">' + esc(l.error) + '</div>' : '') +
            '</div>';
        }).join('');
        if (data.misses && data.misses.total) {
          html += '<div class="misses"><strong>' + data.misses.total + ' comentário(s) não bateram com nenhuma palavra</strong>' +
            (data.misses.days ? ' nos últimos ' + data.misses.days + ' dias' : '') + '.' +
            (data.misses.samples.length
              ? '<ul>' + data.misses.samples.map(function (m) { return '<li>“' + esc(m.commentText) + '”</li>'; }).join('') + '</ul>'
              : '') +
            '</div>';
        }
        body.innerHTML = html;
      })
      .catch(function (err) { body.innerHTML = '<p class="form-error">' + esc(errorText(err)) + '</p>'; });
  }

  $all('dialog [data-close]').forEach(function (b) {
    b.addEventListener('click', function () { b.closest('dialog').close(); });
  });

  /* ---------- Perguntas prontas ---------- */
  var iceForm = $('#iceForm');
  var iceHasUnmanaged = false;

  function emptyIce() {
    return { question: '', answer: '', buttonTitle: 'Fazer o teste', buttonUrl: quizLink('icebreaker') };
  }

  // Mostra só as perguntas preenchidas + botão para adicionar (até 4).
  function renderIce(items) {
    var rows = items.slice(0, 4);
    if (!rows.length) rows.push(emptyIce());
    var html = '';
    if (iceHasUnmanaged) {
      html += '<p class="note">Algumas perguntas foram criadas fora deste painel e não têm resposta guardada aqui. Preencha a resposta e salve para o painel responder.</p>';
    }
    html += rows.map(function (r, i) {
      return '<div class="ice__item" data-ice="' + i + '">' +
        '<div class="ice__head"><span class="ice__num">Pergunta ' + (i + 1) + '</span>' +
        '<button class="link link--danger" type="button" data-ice-remove>Tirar</button></div>' +
        '<label class="field"><span>Pergunta <small>até 80 caracteres</small></span><input data-k="question" maxlength="80" value="' + esc(r.question) + '"></label>' +
        '<label class="field"><span>Resposta automática</span><textarea data-k="answer" rows="2">' + esc(r.answer) + '</textarea></label>' +
        '<div class="row">' +
          '<label class="field field--sm"><span>Texto do botão</span><input data-k="buttonTitle" maxlength="20" value="' + esc(r.buttonTitle) + '"></label>' +
          '<label class="field"><span>Link do botão <small>opcional</small></span><input data-k="buttonUrl" type="url" placeholder="https://" value="' + esc(r.buttonUrl) + '"></label>' +
        '</div>' +
      '</div>';
    }).join('');
    if (rows.length < 4) {
      html += '<button class="btn btn--add" type="button" id="iceAdd">+ Adicionar pergunta (' + rows.length + '/4)</button>';
    }
    html += '<div class="ice__actions">' +
      '<button class="btn btn--ghost btn--sm" type="button" id="iceSuggest">Preencher com sugestões</button>' +
      '<span>' +
        '<button class="btn btn--danger btn--sm" type="button" id="iceClear">Remover todas</button> ' +
        '<button class="btn btn--gold btn--sm" type="submit">Publicar perguntas</button>' +
      '</span></div>';
    iceForm.innerHTML = html;
  }

  // Contador da aba: só perguntas já publicadas no Instagram.
  function setIceCount(items) {
    var n = (items || []).filter(function (i) { return String(i.question || "").trim(); }).length;
    $('[data-count="perguntas"]').textContent = n ? n + "/4" : "";
  }

  function readIce() {
    return $all('[data-ice]', iceForm).map(function (row) {
      var o = {};
      $all('[data-k]', row).forEach(function (f) { o[f.getAttribute('data-k')] = f.value; });
      return o;
    }).filter(function (o) { return o.question.trim(); });
  }

  function loadIce() {
    iceForm.innerHTML = '<p class="muted">Carregando…</p>';
    return api('/api/ice-breakers')
      .then(function (data) {
        iceHasUnmanaged = (data.items || []).some(function (i) { return !i.managed; });
        setIceCount(data.items);
        renderIce(data.items || []);
      })
      .catch(function (err) { iceForm.innerHTML = '<p class="form-error">' + esc(errorText(err)) + '</p>'; });
  }

  // Lê todas as linhas (inclusive vazias) para re-renderizar sem perder o que foi digitado.
  function readIceRows() {
    return $all('[data-ice]', iceForm).map(function (row) {
      var o = {};
      $all('[data-k]', row).forEach(function (f) { o[f.getAttribute('data-k')] = f.value; });
      return o;
    });
  }

  iceForm.addEventListener('click', function (e) {
    if (e.target.id === 'iceAdd') {
      var rows = readIceRows();
      rows.push(emptyIce());
      renderIce(rows);
      var last = $all('[data-ice]', iceForm).pop();
      $('[data-k=question]', last).focus();
      return;
    }
    if (e.target.closest('[data-ice-remove]')) {
      var idx = Number(e.target.closest('[data-ice]').getAttribute('data-ice'));
      var all = readIceRows();
      all.splice(idx, 1);
      renderIce(all);
      toast('Pergunta tirada. Clique em Publicar para salvar.');
      return;
    }
    if (e.target.id === 'iceSuggest') {
      var current = readIce();
      if (current.length && !confirm('Substituir as perguntas atuais pelas sugestões?')) return;
      iceHasUnmanaged = false;
      renderIce(ICE_SUGGESTIONS);
      toast('Sugestões preenchidas. Revise e clique em Publicar.');
    }
    if (e.target.id === 'iceClear') {
      if (!confirm('Remover todas as perguntas prontas do Direct?')) return;
      api('/api/ice-breakers', { method: 'DELETE' })
        .then(function () { iceHasUnmanaged = false; setIceCount([]); renderIce([]); toast('Perguntas removidas.'); })
        .catch(function (err) { toast(errorText(err), true); });
    }
  });

  iceForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = $('button[type=submit]', iceForm);
    btn.disabled = true;
    api('/api/ice-breakers', { method: 'PUT', body: { items: readIce() } })
      .then(function (data) {
        iceHasUnmanaged = false;
        setIceCount(data.items);
        renderIce(data.items || []);
        var s = state.status;
        toast(s && !s.webhook ? 'Perguntas publicadas. Clique em "Ativar respostas" para elas serem respondidas.' : 'Perguntas publicadas no seu Direct.');
      })
      .catch(function (err) { toast(errorText(err), true); btn.disabled = false; });
  });

  /* ---------- Início ---------- */
  function loadAll() {
    selectTab((location.hash || "").slice(1));
    renderStatus();
    loadStatus()
      .then(function (s) {
        if (s.zernio && s.account) {
          loadAutomations();
          loadIce();
        } else {
          $('#automations').innerHTML = '<p class="muted">Conecte o Zernio para gerenciar as automações.</p>';
          iceForm.innerHTML = '';
        }
      })
      .catch(function (err) { toast(errorText(err), true); });
  }

  api('/api/login')
    .then(function (data) { if (data.authed) showApp(); else showLogin(); })
    .catch(function () { showLogin(); });
})();

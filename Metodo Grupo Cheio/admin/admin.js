/* =========================================================
   Painel do Instagram â€” MÃ©todo Grupo Cheio
   Fala sÃ³ com /api/* (mesma origem). Nenhuma chave fica no navegador.
   ========================================================= */
(function () {
  'use strict';

  var SITE = location.origin;
  var QUIZ = SITE + '/';

  function quizLink(campaign) {
    return QUIZ + '?utm_source=instagram&utm_medium=dm&utm_campaign=' + campaign;
  }

  var GATE_DEFAULTS = {
    gateMessage: 'Pra liberar o link, me segue aqui no perfil e toca no botÃ£o abaixo ðŸ‘‡',
    gateButton: 'JÃ¡ sigo',
    gateNotFollowing: 'Ainda nÃ£o encontrei seu follow ðŸ˜… Me segue e toca em "JÃ¡ sigo" de novo que eu te mando o link.'
  };

  var TEMPLATES = {
    comment: {
      trigger: 'comment',
      name: 'ComentÃ¡rio GRUPO',
      keywords: ['GRUPO'],
      alsoMatchInDms: true,
      dmMessage: 'Oi! ðŸ‘‹ Aqui estÃ¡ o teste rÃ¡pido pra descobrir se vocÃª estÃ¡ analisando suas campanhas do jeito certo. Leva menos de 1 minuto:',
      buttonTitle: 'Fazer o teste',
      buttonUrl: quizLink('comentario'),
      commentReplies: ['Te mandei no Direct! ðŸ“©', 'Enviado! Confere seu Direct ðŸ‘€', 'Pronto, chegou no seu Direct âœ…']
    },
    story: {
      trigger: 'story_reply',
      name: 'Story GRUPO',
      keywords: ['GRUPO'],
      dmMessage: 'Oi! ðŸ‘‹ Como prometido no story, aqui estÃ¡ o teste rÃ¡pido pra vocÃª ver se estÃ¡ escalando suas campanhas do jeito certo:',
      buttonTitle: 'Fazer o teste',
      buttonUrl: quizLink('story')
    },
    direct: {
      trigger: 'comment',
      name: 'Palavra no Direct TESTE',
      keywords: ['TESTE'],
      alsoMatchInDms: true,
      dmMessage: 'Aqui estÃ¡! ðŸ‘‡ Responda 3 perguntas rÃ¡pidas e veja se vocÃª estÃ¡ decidindo suas campanhas com base em dados:',
      buttonTitle: 'Fazer o teste',
      buttonUrl: quizLink('direct')
    }
  };

  var ICE_SUGGESTIONS = [
    { question: 'Como funciona o MÃ©todo Grupo Cheio?', answer: 'Ã‰ um material prÃ¡tico que mostra como criar, analisar, otimizar e escalar campanhas pra encher grupos de achadinhos no WhatsApp. Comece pelo teste rÃ¡pido ðŸ‘‡', buttonTitle: 'Fazer o teste', buttonUrl: quizLink('icebreaker') },
    { question: 'Quero fazer o teste das campanhas', answer: 'Bora! SÃ£o sÃ³ 3 perguntas e leva menos de 1 minuto ðŸ‘‡', buttonTitle: 'Fazer o teste', buttonUrl: quizLink('icebreaker') },
    { question: 'Serve pra quem estÃ¡ comeÃ§ando?', answer: 'Serve sim! O mÃ©todo vai do funil completo atÃ© a escala, com um plano de aÃ§Ã£o no final. FaÃ§a o teste pra ver em que ponto vocÃª estÃ¡ ðŸ‘‡', buttonTitle: 'Fazer o teste', buttonUrl: quizLink('icebreaker') },
    { question: 'Quanto custa o mÃ©todo?', answer: 'O valor e a condiÃ§Ã£o atual aparecem no final do teste rÃ¡pido ðŸ‘‡', buttonTitle: 'Ver condiÃ§Ã£o', buttonUrl: quizLink('icebreaker') }
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
          throw new Error(data.error || 'SessÃ£o expirada.');
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
    return err.message + (err.detail ? ' â€” ' + err.detail : '');
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
    if (!s) { el.innerHTML = '<span class="pill">Verificando conexÃ£oâ€¦</span>'; return; }
    var html = [];
    html.push(s.zernio
      ? '<span class="pill pill--ok">âœ“ Zernio conectado</span>'
      : '<span class="pill pill--bad">âœ• Falta ZERNIO_API_KEY na Vercel</span>');
    if (s.zernio) {
      html.push(s.account
        ? '<span class="pill pill--ok">âœ“ @' + esc(s.account.username || s.username) + '</span>'
        : '<span class="pill pill--bad">âœ• @' + esc(s.username) + ' nÃ£o conectado no Zernio</span>');
    }
    if (s.zernio && s.account) {
      if (s.webhook) html.push('<span class="pill pill--ok">âœ“ Respostas das perguntas prontas ativas</span>');
      else if (!s.webhookSecret) html.push('<span class="pill pill--warn">Perguntas prontas: falta ZERNIO_WEBHOOK_SECRET</span>');
      else html.push('<span class="pill pill--warn">Perguntas prontas sem resposta <button type="button" id="hookBtn">Ativar</button></span>');
    }
    if (s.error) html.push('<span class="pill pill--bad">' + esc(s.error) + '</span>');
    el.innerHTML = html.join('');

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

  /* ---------- AutomaÃ§Ãµes ---------- */
  function triggerLabel(a) {
    return a.trigger === 'story_reply' ? 'Story' : 'ComentÃ¡rio';
  }

  function renderAutomations() {
    var el = $('#automations');
    if (!state.items.length) {
      el.innerHTML =
        '<div class="empty"><p><strong>Nenhuma automaÃ§Ã£o ainda.</strong></p>' +
        '<p class="muted">Comece por um modelo pronto e ajuste o texto:</p>' +
        '<div class="templates">' +
        '<button class="chip" type="button" data-new="comment">ComentÃ¡rio GRUPO</button>' +
        '<button class="chip" type="button" data-new="story">Story GRUPO</button>' +
        '<button class="chip" type="button" data-new="direct">Palavra no Direct</button>' +
        '</div></div>';
      return;
    }
    el.innerHTML = state.items.map(function (a) {
      var kws = a.keywords.length
        ? a.keywords.map(function (k) { return '<span class="tag tag--kw">' + esc(k) + '</span>'; }).join('')
        : '<span class="tag tag--kw">qualquer texto</span>';
      return '<article class="card' + (a.isActive ? '' : ' is-off') + '" data-id="' + esc(a.id) + '">' +
        '<div class="card__top">' +
          '<span class="card__name">' + esc(a.name) + '</span>' +
          '<label class="switch" title="Ligar/desligar"><input type="checkbox" data-toggle ' + (a.isActive ? 'checked' : '') + ' aria-label="AutomaÃ§Ã£o ligada"><span></span></label>' +
        '</div>' +
        '<div class="tags">' +
          '<span class="tag tag--trigger">' + triggerLabel(a) + '</span>' +
          (a.alsoMatchInDms ? '<span class="tag tag--dm">+ Direct</span>' : '') +
          (a.followOnly ? '<span class="tag">SÃ³ seguidores</span>' : '') +
          kws +
        '</div>' +
        '<div class="stats">' +
          '<div class="stat"><b>' + a.stats.triggered + '</b><span>Disparos</span></div>' +
          '<div class="stat"><b>' + a.stats.dmsSent + '</b><span>DMs</span></div>' +
          '<div class="stat"><b>' + a.stats.dmsFailed + '</b><span>Falhas</span></div>' +
          '<div class="stat"><b>' + a.stats.clicks + '</b><span>Cliques</span></div>' +
        '</div>' +
        '<div class="card__actions">' +
          '<button class="link" type="button" data-edit>Editar</button>' +
          '<button class="link" type="button" data-logs>HistÃ³rico</button>' +
          '<button class="link link--danger" type="button" data-delete>Excluir</button>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function loadAutomations() {
    $('#automations').innerHTML = '<p class="muted">Carregandoâ€¦</p>';
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
        toast(on ? 'AutomaÃ§Ã£o ligada.' : 'AutomaÃ§Ã£o desligada.');
      })
      .catch(function (err) { e.target.checked = !on; e.target.disabled = false; toast(errorText(err), true); });
  });

  function removeItem(item) {
    if (!confirm('Excluir "' + item.name + '"? Isso apaga a automaÃ§Ã£o no Zernio.')) return;
    api('/api/automations?id=' + encodeURIComponent(item.id), { method: 'DELETE' })
      .then(function () {
        state.items = state.items.filter(function (a) { return a.id !== item.id; });
        renderAutomations();
        toast('AutomaÃ§Ã£o excluÃ­da.');
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

    var hasKw = form.keywords.value.trim().length > 0;
    $('#keywordsHint').textContent = hasKw
      ? 'Dispara quando a palavra aparece sozinha no texto (nÃ£o no meio de outra palavra).'
      : (isComment ? 'Vazio = responde QUALQUER comentÃ¡rio.' : 'Vazio = responde QUALQUER resposta aos seus stories.');

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
    $('#editorTitle').textContent = item ? 'Editar automaÃ§Ã£o' : 'Nova automaÃ§Ã£o';
    $('#templates').hidden = Boolean(item);
    $all('[name=trigger]', form).forEach(function (r) { r.disabled = Boolean(item); });
    $('#editorError').hidden = true;
    fillForm(item || TEMPLATES[templateKey || 'comment']);
    editor.showModal();
  }

  $('#newBtn').addEventListener('click', function () { openEditor(null); });

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
        toast(state.editing ? 'AutomaÃ§Ã£o salva.' : 'AutomaÃ§Ã£o criada.');
        return loadAutomations();
      })
      .catch(function (err) {
        errEl.textContent = errorText(err);
        errEl.hidden = false;
        errEl.scrollIntoView({ block: 'nearest' });
      })
      .then(function () { btn.disabled = false; });
  });

  /* ---------- HistÃ³rico ---------- */
  var LOG_STATUS = {
    sent: ['pill--ok', 'Enviada'],
    failed: ['pill--bad', 'Falhou'],
    skipped: ['', 'Ignorada'],
    pending: ['pill--warn', 'Agendada'],
    gated: ['pill--warn', 'Esperando seguir']
  };
  var LOG_SOURCE = { comment: 'ComentÃ¡rio', story_reply: 'Story', dm: 'Direct' };

  function openLogs(item) {
    var dlg = $('#logs');
    var body = $('#logsBody');
    $('#logsTitle').textContent = 'HistÃ³rico Â· ' + item.name;
    body.innerHTML = '<p class="muted">Carregandoâ€¦</p>';
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
            (l.text ? '<div class="log__text">â€œ' + esc(l.text) + 'â€</div>' : '') +
            (l.error ? '<div class="log__err">' + esc(l.error) + '</div>' : '') +
            '</div>';
        }).join('');
        if (data.misses && data.misses.total) {
          html += '<div class="misses"><strong>' + data.misses.total + ' comentÃ¡rio(s) nÃ£o bateram com nenhuma palavra</strong>' +
            (data.misses.days ? ' nos Ãºltimos ' + data.misses.days + ' dias' : '') + '.' +
            (data.misses.samples.length
              ? '<ul>' + data.misses.samples.map(function (m) { return '<li>â€œ' + esc(m.commentText) + 'â€</li>'; }).join('') + '</ul>'
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

  function renderIce(items) {
    var rows = items.slice(0, 4);
    while (rows.length < 4) rows.push({ question: '', answer: '', buttonTitle: '', buttonUrl: '' });
    var html = '';
    if (iceHasUnmanaged) {
      html += '<p class="note">Algumas perguntas foram criadas fora deste painel e nÃ£o tÃªm resposta guardada aqui. Preencha a resposta e salve para o painel responder.</p>';
    }
    html += rows.map(function (r, i) {
      return '<div class="ice__item" data-ice="' + i + '">' +
        '<span class="ice__num">Pergunta ' + (i + 1) + '</span>' +
        '<label class="field"><span>Pergunta <small>atÃ© 80 caracteres</small></span><input data-k="question" maxlength="80" value="' + esc(r.question) + '"></label>' +
        '<label class="field"><span>Resposta automÃ¡tica</span><textarea data-k="answer" rows="2">' + esc(r.answer) + '</textarea></label>' +
        '<div class="row">' +
          '<label class="field field--sm"><span>Texto do botÃ£o</span><input data-k="buttonTitle" maxlength="20" value="' + esc(r.buttonTitle) + '"></label>' +
          '<label class="field"><span>Link do botÃ£o <small>opcional</small></span><input data-k="buttonUrl" type="url" placeholder="https://" value="' + esc(r.buttonUrl) + '"></label>' +
        '</div>' +
      '</div>';
    }).join('');
    html += '<div class="ice__actions">' +
      '<button class="btn btn--ghost btn--sm" type="button" id="iceSuggest">Preencher com sugestÃµes</button>' +
      '<span>' +
        '<button class="btn btn--danger btn--sm" type="button" id="iceClear">Remover todas</button> ' +
        '<button class="btn btn--gold btn--sm" type="submit">Publicar perguntas</button>' +
      '</span></div>';
    iceForm.innerHTML = html;
  }

  function readIce() {
    return $all('[data-ice]', iceForm).map(function (row) {
      var o = {};
      $all('[data-k]', row).forEach(function (f) { o[f.getAttribute('data-k')] = f.value; });
      return o;
    }).filter(function (o) { return o.question.trim(); });
  }

  function loadIce() {
    iceForm.innerHTML = '<p class="muted">Carregandoâ€¦</p>';
    return api('/api/ice-breakers')
      .then(function (data) {
        iceHasUnmanaged = (data.items || []).some(function (i) { return !i.managed; });
        renderIce(data.items || []);
      })
      .catch(function (err) { iceForm.innerHTML = '<p class="form-error">' + esc(errorText(err)) + '</p>'; });
  }

  iceForm.addEventListener('click', function (e) {
    if (e.target.id === 'iceSuggest') {
      var current = readIce();
      if (current.length && !confirm('Substituir as perguntas atuais pelas sugestÃµes?')) return;
      iceHasUnmanaged = false;
      renderIce(ICE_SUGGESTIONS);
      toast('SugestÃµes preenchidas. Revise e clique em Publicar.');
    }
    if (e.target.id === 'iceClear') {
      if (!confirm('Remover todas as perguntas prontas do Direct?')) return;
      api('/api/ice-breakers', { method: 'DELETE' })
        .then(function () { iceHasUnmanaged = false; renderIce([]); toast('Perguntas removidas.'); })
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
        renderIce(data.items || []);
        var s = state.status;
        toast(s && !s.webhook ? 'Perguntas publicadas. Clique em "Ativar" no topo para elas serem respondidas.' : 'Perguntas publicadas.');
      })
      .catch(function (err) { toast(errorText(err), true); btn.disabled = false; });
  });

  /* ---------- InÃ­cio ---------- */
  function loadAll() {
    renderStatus();
    loadStatus()
      .then(function (s) {
        if (s.zernio && s.account) {
          loadAutomations();
          loadIce();
        } else {
          $('#automations').innerHTML = '<p class="muted">Conecte o Zernio para gerenciar as automaÃ§Ãµes.</p>';
          iceForm.innerHTML = '';
        }
      })
      .catch(function (err) { toast(errorText(err), true); });
  }

  api('/api/login')
    .then(function (data) { if (data.authed) showApp(); else showLogin(); })
    .catch(function () { showLogin(); });
})();

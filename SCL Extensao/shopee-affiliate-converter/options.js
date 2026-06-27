// options.js — Configurações

(function () {
  'use strict';

  // ─── Tema ────────────────────────────────────────────────────
  chrome.storage.local.get('theme', function (r) {
    applyTheme(r.theme || 'dark');
  });

  document.getElementById('btn-theme').addEventListener('click', function () {
    var isDark = !document.documentElement.classList.contains('light');
    var next   = isDark ? 'light' : 'dark';
    applyTheme(next);
    chrome.storage.local.set({ theme: next });
  });

  function applyTheme(theme) {
    document.documentElement.classList.toggle('light', theme === 'light');
  }

  // ─── Navegação por abas ──────────────────────────────────────
  document.getElementById('tab-btn-diagnostics').addEventListener('click', function () {
    window.location.href = 'settings-diagnostics.html';
  });

  var tabBtns   = document.querySelectorAll('.tab-btn:not(#tab-btn-diagnostics)');
  var tabPanels = document.querySelectorAll('.tab-panel');

  tabBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = this.getAttribute('data-tab');

      tabBtns.forEach(function (b)   { b.classList.remove('active'); });
      tabPanels.forEach(function (p) { p.classList.remove('active'); });

      this.classList.add('active');
      document.getElementById(target).classList.add('active');

      if (target === 'tab-stats')   loadStats();
      if (target === 'tab-history') loadHistory();
    });
  });

  // ─── Init ────────────────────────────────────────────────────
  init();

  async function init() {
    var r = await chrome.storage.local.get(['affiliateId', 'userName', 'clipboardDetector']);

    if (r.affiliateId) {
      document.getElementById('opt-affiliate-id').value = r.affiliateId;
      document.getElementById('header-user-id').textContent = r.affiliateId;
    }
    if (r.userName) {
      document.getElementById('opt-name').value = r.userName;
    }
    document.getElementById('toggle-clipboard').checked = r.clipboardDetector !== false;
    loadStats();
  }

  // ─── Perfil ──────────────────────────────────────────────────
  document.getElementById('btn-save-profile').addEventListener('click', saveProfile);

  document.getElementById('toggle-clipboard').addEventListener('change', function () {
    chrome.storage.local.set({ clipboardDetector: this.checked });
  });

  async function saveProfile() {
    var affiliateId = document.getElementById('opt-affiliate-id').value.trim();
    var name        = document.getElementById('opt-name').value.trim();
    var toast       = document.getElementById('profile-toast');

    if (!affiliateId) {
      flashToast(toast, '❌ Affiliate ID é obrigatório.', 'err');
      return;
    }
    if (!isValidAffiliateId(affiliateId)) {
      flashToast(toast, '❌ ID muito curto (mín. 3 caracteres).', 'err');
      return;
    }

    await chrome.storage.local.set({ affiliateId: affiliateId, userName: name || 'Afiliado' });
    document.getElementById('header-user-id').textContent = affiliateId;
    flashToast(toast, '✅ Salvo!', 'ok');
  }

  // ─── Estatísticas ─────────────────────────────────────────────
  async function loadStats() {
    var res = await msg('GET_STATS');
    if (!res || !res.success) return;
    var s = res.stats;
    set('s-today', s.today);
    set('s-week',  s.week);
    set('s-month', s.month);
    set('s-total', s.total);
    renderChart();
  }

  async function renderChart() {
    var container = document.getElementById('chart-container');
    var r   = await chrome.storage.local.get('stats');
    var byDate = (r.stats || {}).byDate || {};

    var days = [];
    for (var i = 13; i >= 0; i--) {
      var d = new Date();
      d.setDate(d.getDate() - i);
      var key = d.toISOString().split('T')[0];
      days.push({ key: key, label: (d.getMonth()+1) + '/' + d.getDate(), count: byDate[key] || 0 });
    }

    var max = Math.max.apply(null, days.map(function(d){ return d.count; }));
    if (max === 0) {
      container.innerHTML = '<div class="empty-state">Nenhuma conversão nos últimos 14 dias.</div>';
      return;
    }

    container.innerHTML = '';
    days.forEach(function (day) {
      var h = Math.round((day.count / max) * 64) + 4;
      var wrap = document.createElement('div');
      wrap.className = 'chart-bar-wrap';
      wrap.title = day.key + ': ' + day.count + ' conversão(ões)';
      wrap.innerHTML =
        '<div class="chart-bar" style="height:' + h + 'px"></div>' +
        '<div class="chart-lbl">' + esc(day.label) + '</div>';
      container.appendChild(wrap);
    });
  }

  document.getElementById('btn-reset-stats').addEventListener('click', async function () {
    if (!confirm('Zerar todas as estatísticas? Esta ação não pode ser desfeita.')) return;
    await msg('RESET_STATS');
    loadStats();
  });

  // ─── Histórico ────────────────────────────────────────────────
  var allHistory    = [];
  var currentFilter = 'all';

  var STATUS_CFG = {
    converted:         { badge: 'badge-converted', label: '✅ Convertido'   },
    already_affiliate: { badge: 'badge-already',   label: '⚠️ Já afiliado'  },
    not_shopee:        { badge: 'badge-failed',     label: '❌ Não Shopee'   },
    no_affiliate_id:   { badge: 'badge-failed',     label: '❌ Sem ID'       },
    conversion_failed: { badge: 'badge-failed',     label: '❌ Falha'        },
    id_not_found:      { badge: 'badge-failed',     label: '❌ ID não encontrado' },
    unchanged:         { badge: 'badge-already',    label: '⚠️ Sem mudança'  },
  };

  var FAIL_STATUSES = ['not_shopee','no_affiliate_id','conversion_failed','id_not_found','unchanged'];

  async function loadHistory() {
    var res = await msg('GET_HISTORY', { limit: 50 });
    if (!res || !res.success) return;
    allHistory = res.history || [];
    applyFilters();
  }

  function applyFilters() {
    var q = (document.getElementById('history-search').value || '').toLowerCase();

    var filtered = allHistory.filter(function (item) {
      if (currentFilter === 'converted'        && item.status !== 'converted')        return false;
      if (currentFilter === 'already_affiliate' && item.status !== 'already_affiliate') return false;
      if (currentFilter === 'failed' && FAIL_STATUSES.indexOf(item.status) === -1)    return false;

      if (q) {
        var orig = (item.original    || '').toLowerCase();
        var aff  = (item.affiliate   || '').toLowerCase();
        var aid  = (item.affiliateId || '').toLowerCase();
        if (!orig.includes(q) && !aff.includes(q) && !aid.includes(q)) return false;
      }
      return true;
    });

    renderHistory(filtered);
  }

  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      currentFilter = this.getAttribute('data-filter');
      applyFilters();
    });
  });

  function renderHistory(items) {
    var container = document.getElementById('history-table');
    if (!items.length) {
      container.innerHTML = '<div class="empty-state">Nenhuma conversão no histórico.</div>';
      return;
    }

    var html =
      '<div class="history-row hdr">' +
        '<div>Status</div>' +
        '<div class="cell-url">Link Original</div>' +
        '<div class="cell-url">Link Afiliado</div>' +
        '<div class="cell-meta-hdr">ID / Data</div>' +
        '<div>Ações</div>' +
      '</div>';

    items.forEach(function (item) {
      var cfg    = STATUS_CFG[item.status] || STATUS_CFG.conversion_failed;
      var oLabel = esc(formatUrlForDisplay(item.original,  32) || '—');
      var aLabel = item.affiliate ? esc(formatUrlForDisplay(item.affiliate, 32)) : '—';
      var date   = new Date(item.date).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });

      html +=
        '<div class="history-row" data-id="' + esc(item.id) + '">' +
          '<div class="cell-status">' +
            '<span class="status-badge ' + cfg.badge + '">' + cfg.label + '</span>' +
          '</div>' +
          '<div class="cell-url" title="' + esc(item.original) + '">' + oLabel + '</div>' +
          '<div class="cell-url" title="' + esc(item.affiliate || '') + '">' + aLabel + '</div>' +
          '<div class="cell-meta">' +
            '<span class="meta-id">' + esc(item.affiliateId || '—') + '</span>' +
            '<span class="meta-date">' + esc(date) + '</span>' +
          '</div>' +
          '<div class="cell-actions">' +
            (item.affiliate
              ? '<button class="tbl-btn copy-btn" data-url="' + esc(item.affiliate) + '" title="Copiar link afiliado">' +
                  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
                '</button>' +
                '<button class="tbl-btn open-btn" data-url="' + esc(item.affiliate) + '" title="Abrir link afiliado">' +
                  '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
                '</button>'
              : '') +
            '<button class="tbl-btn del del-btn" data-id="' + esc(item.id) + '" title="Excluir">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>';
    });

    container.innerHTML = html;

    container.querySelectorAll('.copy-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        navigator.clipboard.writeText(this.getAttribute('data-url')).catch(function(){});
      });
    });

    container.querySelectorAll('.open-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        chrome.tabs.create({ url: this.getAttribute('data-url') });
      });
    });

    container.querySelectorAll('.del-btn').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        var id = this.getAttribute('data-id');
        await msg('DELETE_HISTORY_ITEM', { id: id });
        allHistory = allHistory.filter(function (i) { return i.id !== id; });
        applyFilters();
      });
    });
  }

  document.getElementById('history-search').addEventListener('input', function () {
    applyFilters();
  });

  document.getElementById('btn-clear-history').addEventListener('click', async function () {
    if (!confirm('Limpar todo o histórico?')) return;
    await msg('CLEAR_HISTORY');
    allHistory    = [];
    currentFilter = 'all';
    document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
    document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
    renderHistory([]);
  });

  // ─── Exportar / Importar ──────────────────────────────────────
  document.getElementById('btn-export').addEventListener('click', async function () {
    var res = await msg('EXPORT_DATA');
    if (!res || !res.success) return;
    var blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = 'shopee-affiliate-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('btn-import').addEventListener('click', function () {
    document.getElementById('file-import').click();
  });

  document.getElementById('file-import').addEventListener('change', async function () {
    var file  = this.files[0];
    var toast = document.getElementById('import-toast');
    if (!file) return;
    try {
      var payload = JSON.parse(await file.text());
      var res     = await msg('IMPORT_DATA', { payload: payload });
      if (res && res.success) {
        flashToast(toast, '✅ Dados importados!', 'ok');
        init();
      } else {
        flashToast(toast, '❌ Formato inválido.', 'err');
      }
    } catch (e) {
      flashToast(toast, '❌ Erro ao ler o arquivo.', 'err');
    }
    this.value = '';
  });

  // ─── Apagar tudo ──────────────────────────────────────────────
  document.getElementById('btn-reset-all').addEventListener('click', async function () {
    if (!confirm('ATENÇÃO: Apaga Affiliate ID, histórico e estatísticas. Continuar?')) return;
    await chrome.storage.local.clear();
    alert('Dados apagados. Feche esta aba e reabra a extensão.');
  });

  // ─── Helpers ──────────────────────────────────────────────────
  function msg(type, data) {
    return chrome.runtime.sendMessage({ type: type, data: data || {} }).catch(function () { return null; });
  }

  function set(id, val) {
    var el = document.getElementById(id);
    if (el) el.textContent = (val !== undefined && val !== null) ? val : '—';
  }

  function flashToast(el, text, cls) {
    el.textContent = text;
    el.className   = 'inline-toast ' + cls;
    setTimeout(function () { el.textContent = ''; el.className = 'inline-toast'; }, 4000);
  }

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

})();

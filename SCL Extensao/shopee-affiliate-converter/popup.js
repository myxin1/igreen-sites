// popup.js — v3.0

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var on = function (id, evt, fn) { var el = $(id); if (el) el.addEventListener(evt, fn); };
  var AFFILIATE_CODE_PREFIX = 'an_';

  function setBadge(id, ok) {
    var el = $(id);
    if (!el) return;
    el.textContent = ok ? '✓ presente' : '✗ ausente';
    el.className   = 'rp-badge ' + (ok ? 'badge-ok' : 'badge-err');
  }

  // ─── Status UI ───────────────────────────────────────────────
  var STATUS_UI = {
    converted:         { icon: '✅', label: 'Convertido com sucesso', cls: 'status-green',  dot: 'dot-green'  },
    already_affiliate: { icon: '⚠️', label: 'Link já era afiliado',   cls: 'status-yellow', dot: 'dot-yellow' },
    not_shopee:        { icon: '⬜', label: 'Não é da Shopee',        cls: 'status-gray',   dot: 'dot-gray'   },
    no_affiliate_id:   { icon: '❌', label: 'Affiliate ID ausente',   cls: 'status-red',    dot: 'dot-red'    },
    conversion_failed: { icon: '❌', label: 'Falha na conversão',     cls: 'status-red',    dot: 'dot-red'    },
    id_not_found:      { icon: '❌', label: 'ID não encontrado',      cls: 'status-red',    dot: 'dot-red'    },
    unchanged:         { icon: '⚠️', label: 'Link não alterado',      cls: 'status-yellow', dot: 'dot-yellow' },
  };

  // ─── State ───────────────────────────────────────────────────
  var currentTabUrl     = '';
  var lastConvertedLink = null;
  var lastOriginalLink  = null;

  // ─── Init ────────────────────────────────────────────────────
  init();

  async function init() {
    var r = await chrome.storage.local.get(['affiliateId', 'userName']);
    if (!r.affiliateId) {
      show('onboarding');
      var inp = $('inp-affiliate-id');
      if (inp) inp.focus();
    } else {
      setText('disp-name', r.userName || 'Afiliado');
      setText('disp-id',   r.affiliateId);
      show('main');
      await Promise.all([loadTab(), loadHistory()]);
    }
  }

  function show(screen) {
    var ob = $('screen-onboarding');
    var mb = $('screen-main');
    if (ob) ob.classList.toggle('hidden', screen !== 'onboarding');
    if (mb) mb.classList.toggle('hidden', screen !== 'main');
  }

  function setText(id, val) {
    var el = $(id);
    if (el) el.textContent = val;
  }

  // ─── Onboarding ──────────────────────────────────────────────
  on('btn-save-config', 'click', saveConfig);
  on('inp-affiliate-id', 'keydown', function (e) {
    if (e.key === 'Enter') saveConfig();
  });

  async function saveConfig() {
    var inp  = $('inp-affiliate-id');
    var inpN = $('inp-name');
    if (!inp) return;
    var id   = inp.value.trim();
    var name = inpN ? inpN.value.trim() : '';
    if (!id) { pulse(inp); return; }
    if (!isValidAffiliateId(id)) { pulse(inp); return; }
    await chrome.storage.local.set({ affiliateId: id, userName: name || 'Afiliado', clipboardDetector: true });
    setText('disp-name', name || 'Afiliado');
    setText('disp-id', id);
    show('main');
    await Promise.all([loadTab(), loadHistory()]);
  }

  function pulse(el) {
    if (!el) return;
    el.style.borderColor = 'var(--accent)';
    el.focus();
    setTimeout(function () { el.style.borderColor = ''; }, 1500);
  }

  // ─── Tab atual ───────────────────────────────────────────────
  async function loadTab() {
    try {
      var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) return;
      currentTabUrl = tabs[0].url || '';
      var isShopee = isShopeeUrl(currentTabUrl);
      var alertEl  = $('alert-not-shopee');
      var btnConv  = $('btn-convert');
      if (alertEl) alertEl.classList.toggle('hidden', isShopee);
      if (btnConv) btnConv.disabled = !isShopee;
    } catch (e) {
      var alertEl = $('alert-not-shopee');
      var btnConv = $('btn-convert');
      if (alertEl) alertEl.classList.remove('hidden');
      if (btnConv) btnConv.disabled = true;
    }
  }

  // ─── Converter ───────────────────────────────────────────────
  on('btn-convert', 'click', doConvert);

  async function doConvert() {
    if (!currentTabUrl || !isShopeeUrl(currentTabUrl)) return;
    var r = await chrome.storage.local.get('affiliateId');
    if (!r.affiliateId) return;

    var converted  = convertShopeeLink(currentTabUrl, r.affiliateId);
    var validation = validateConvertedLink(currentTabUrl, converted, r.affiliateId);

    lastOriginalLink  = currentTabUrl;
    lastConvertedLink = converted;

    if (converted && validation.affiliateIdFound) {
      await writeClipboard(converted);
    }

    try {
      await chrome.runtime.sendMessage({
        type: 'SAVE_CONVERSION',
        data: {
          original:    currentTabUrl,
          affiliate:   converted,
          status:      validation.status,
          affiliateId: r.affiliateId,
          message:     validation.message,
        },
      });
    } catch (e) {}

    showResultPanel(validation, r.affiliateId, currentTabUrl, converted);
    await loadHistory();
  }

  // ─── Painel de Resultado ─────────────────────────────────────
  function showResultPanel(validation, affiliateId, originalUrl, convertedUrl) {
    var panel = $('result-panel');
    if (!panel) return;

    var ui = STATUS_UI[validation.status] || STATUS_UI.conversion_failed;

    var statusBar = $('result-status-bar');
    if (statusBar) {
      statusBar.className = 'result-status ' + ui.cls;
      setText('result-status-icon', ui.icon);
      setText('result-status-text', ui.label);
    }
    panel.className = 'result-panel ' + ui.cls;

    var beforeEl = $('cmp-before');
    var afterEl  = $('cmp-after');
    if (beforeEl) beforeEl.textContent = formatUrlForDisplay(originalUrl, 55) || '—';
    if (afterEl) {
      if (convertedUrl && validation.affiliateIdFound) {
        afterEl.innerHTML = renderUrlWithHighlight(convertedUrl, affiliateId);
      } else if (convertedUrl) {
        afterEl.textContent = formatUrlForDisplay(convertedUrl, 55);
      } else {
        afterEl.textContent = '— (não convertido)';
      }
    }

    // ID row
    setText('result-af-id',   affiliateId || '—');
    setText('result-af-code', validation.affiliateCode || (AFFILIATE_CODE_PREFIX + (affiliateId || '—')));

    // Substituiu row (outro afiliado → usuário)
    var replaceRow = $('result-replace-row');
    if (replaceRow) {
      if (validation.oldAffiliateId && validation.oldAffiliateId !== affiliateId) {
        setText('result-old-id', validation.oldAffiliateId);
        setText('result-new-id', affiliateId);
        replaceRow.classList.remove('hidden');
      } else {
        replaceRow.classList.add('hidden');
      }
    }

    // mmp_pid
    setText('result-mmp-pid', validation.affiliateCode || '—');
    setBadge('badge-mmp-pid', validation.mmpPidOk);

    // utm_source
    setText('result-utm-src', validation.affiliateCode || '—');
    setBadge('badge-utm-src', validation.utmSourceOk);

    // utm_medium
    setText('result-utm-med', 'affiliates');
    setBadge('badge-utm-med', validation.utmMediumOk);

    // af_id warning (não deve existir)
    var rowAfWarn = $('row-af-warn');
    if (rowAfWarn) rowAfWarn.classList.toggle('hidden', !validation.afIdPresent);

    var msgEl   = $('result-message');
    var btnCopy = $('btn-result-copy');
    var btnOpen = $('btn-result-open');

    if (msgEl)   msgEl.textContent = validation.message;
    if (btnCopy) btnCopy.disabled  = !convertedUrl;
    if (btnOpen) btnOpen.disabled  = !convertedUrl;

    panel.classList.remove('hidden');
  }

  on('btn-result-close',    'click', function () {
    var p = $('result-panel'); if (p) p.classList.add('hidden');
  });
  on('btn-result-copy', 'click', function () {
    if (lastConvertedLink) writeClipboard(lastConvertedLink);
  });
  on('btn-result-open', 'click', function () {
    if (lastConvertedLink) chrome.tabs.create({ url: lastConvertedLink });
  });
  on('btn-result-copy-orig', 'click', function () {
    if (lastOriginalLink) writeClipboard(lastOriginalLink);
  });

  // ─── Histórico recente ────────────────────────────────────────
  async function loadHistory() {
    try {
      var res = await chrome.runtime.sendMessage({ type: 'GET_HISTORY', data: { limit: 7 } });
      if (!res || !res.success) return;
      renderHistory(res.history || []);
    } catch (e) {}
  }

  function renderHistory(items) {
    var list = $('history-list');
    if (!list) return;
    if (!items.length) {
      list.innerHTML = '<div class="empty">Nenhuma conversão ainda.</div>';
      return;
    }
    list.innerHTML = '';
    items.forEach(function (item) {
      var ui  = STATUS_UI[item.status] || STATUS_UI.converted;
      var div = document.createElement('div');
      div.className = 'history-item';

      var copyBtnHTML = item.affiliate
        ? '<button class="hist-btn hist-copy" title="Copiar link afiliado">' +
            '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
          '</button>' +
          '<button class="hist-btn hist-open" title="Abrir link afiliado">' +
            '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>' +
          '</button>'
        : '';

      div.innerHTML =
        '<div class="history-status-dot ' + ui.dot + '"></div>' +
        '<span class="history-url" title="' + esc(item.original) + '">' +
          esc(formatUrlForDisplay(item.original, 34)) +
        '</span>' +
        copyBtnHTML +
        '<button class="hist-btn hist-del" title="Excluir">' +
          '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>' +
        '</button>';

      if (item.affiliate) {
        div.querySelector('.hist-copy').addEventListener('click', function () {
          writeClipboard(item.affiliate);
        });
        div.querySelector('.hist-open').addEventListener('click', function () {
          chrome.tabs.create({ url: item.affiliate });
        });
      }
      div.querySelector('.hist-del').addEventListener('click', async function () {
        try {
          await chrome.runtime.sendMessage({ type: 'DELETE_HISTORY_ITEM', data: { id: item.id } });
        } catch (e) {}
        await loadHistory();
      });

      list.appendChild(div);
    });
  }

  // Limpar todos os recentes
  on('btn-clear-recent', 'click', async function () {
    if (!confirm('Limpar todo o histórico de recentes?')) return;
    try {
      await chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' });
    } catch (e) {}
    renderHistory([]);
  });

  // ─── Footer ──────────────────────────────────────────────────
  function openOptions() {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
  }
  on('btn-settings',        'click', openOptions);
  on('btn-footer-settings', 'click', openOptions);
  on('btn-open-options',    'click', openOptions);

  on('btn-reset-config', 'click', async function () {
    if (!confirm('Resetar configurações? Seu Affiliate ID e nome serão apagados.')) return;
    await chrome.storage.local.remove(['affiliateId', 'userName']);
    var panel = $('result-panel');
    if (panel) panel.classList.add('hidden');
    show('onboarding');
    var inp = $('inp-affiliate-id');
    if (inp) { inp.value = ''; inp.focus(); }
    var inpN = $('inp-name');
    if (inpN) inpN.value = '';
  });

  // ─── Clipboard ───────────────────────────────────────────────
  async function writeClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      } catch (e2) { return false; }
    }
  }

  // ─── Helpers ─────────────────────────────────────────────────
  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();

// background.js — Service Worker (Manifest V3)
// Gerencia: context menus, notificações, histórico, estatísticas

'use strict';

importScripts('./lib/shopee-affiliate-formatter.js');

// ─── Estado interno ─────────────────────────────────────────────
// Mapa de notificações pendentes do detector de clipboard
var pendingClipboard = new Map();
var contextMenuSetupInProgress = false;
var contextMenuSetupQueued = false;

// ─── Instalação / Atualização ───────────────────────────────────
chrome.runtime.onInstalled.addListener(function (details) {
  createContextMenus();
  initStorage();
});

// Service workers são descartados e re-iniciados pelo Chrome;
// precisamos recriar o context menu ao iniciar
chrome.runtime.onStartup.addListener(function () {
  createContextMenus();
});

function initStorage() {
  chrome.storage.local.get(['stats', 'history', 'clipboardDetector'], function (result) {
    var updates = {};
    if (!result.stats) updates.stats = { total: 0, byDate: {} };
    if (!result.history) updates.history = [];
    if (result.clipboardDetector === undefined) updates.clipboardDetector = true;
    if (Object.keys(updates).length > 0) {
      chrome.storage.local.set(updates);
    }
  });
}

// ─── Context Menus ──────────────────────────────────────────────
function createContextMenus() {
  if (contextMenuSetupInProgress) {
    contextMenuSetupQueued = true;
    return;
  }

  contextMenuSetupInProgress = true;
  chrome.contextMenus.removeAll(function () {
    var items = [
      {
        id: 'convert-link',
        title: '🛒 Converter Link Afiliado Shopee',
        contexts: ['link'],
      },
      {
        id: 'convert-page',
        title: '🛒 Converter Esta Página (Shopee)',
        contexts: ['page'],
      },
      {
        id: 'convert-selection',
        title: '🛒 Converter URL Selecionada',
        contexts: ['selection'],
      },
    ];

    var remaining = items.length;
    function finishOne() {
      void chrome.runtime.lastError;
      remaining -= 1;
      if (remaining > 0) return;

      contextMenuSetupInProgress = false;
      if (contextMenuSetupQueued) {
        contextMenuSetupQueued = false;
        createContextMenus();
      }
    }

    items.forEach(function (item) {
      chrome.contextMenus.create(item, finishOne);
    });
  });
}

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  var targetUrl = '';

  if (info.menuItemId === 'convert-link') {
    targetUrl = info.linkUrl || '';
  } else if (info.menuItemId === 'convert-page') {
    targetUrl = info.pageUrl || '';
  } else if (info.menuItemId === 'convert-selection') {
    // Tenta extrair URL de texto selecionado
    var sel = (info.selectionText || '').trim();
    var match = sel.match(/https?:\/\/\S+/);
    targetUrl = match ? match[0] : '';
  }

  if (targetUrl) {
    handleConversion(targetUrl, tab, true);
  }
});

// ─── Mensagens do popup / content script ────────────────────────
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  processMessage(message, sender, sendResponse);
  return true; // mantém canal aberto para resposta assíncrona
});

function processMessage(message, sender, sendResponse) {
  var type = message.type;
  var data = message.data || {};

  if (type === 'CONVERT_URL') {
    handleConversion(data.url, null, false).then(sendResponse);

  } else if (type === 'SHOPEE_URL_COPIED') {
    handleCopiedShopeeUrl(data.url).then(function () {
      sendResponse({ success: true });
    });

  } else if (type === 'GET_STATS') {
    computeStats().then(function (stats) {
      sendResponse({ success: true, stats: stats });
    });

  } else if (type === 'GET_HISTORY') {
    fetchHistory(data.limit || 50).then(function (history) {
      sendResponse({ success: true, history: history });
    });

  } else if (type === 'SAVE_CONVERSION') {
    // Salvar com validação completa (chamado pelo popup diretamente)
    appendHistory({
      original:    data.original    || '',
      affiliate:   data.affiliate   || null,
      status:      data.status      || 'conversion_failed',
      affiliateId: data.affiliateId || '',
      message:     data.message     || '',
    }).then(function () { return incrementStats(data.status === 'converted' || data.status === 'already_affiliate'); })
      .then(function () { sendResponse({ success: true }); });

  } else if (type === 'CLEAR_HISTORY') {
    chrome.storage.local.set({ history: [] }, function () {
      sendResponse({ success: true });
    });

  } else if (type === 'DELETE_HISTORY_ITEM') {
    removeHistoryItem(data.id).then(function () {
      sendResponse({ success: true });
    });

  } else if (type === 'RESET_STATS') {
    chrome.storage.local.set({ stats: { total: 0, byDate: {} } }, function () {
      sendResponse({ success: true });
    });

  } else if (type === 'EXPORT_DATA') {
    exportAllData().then(function (data) {
      sendResponse({ success: true, data: data });
    });

  } else if (type === 'IMPORT_DATA') {
    importAllData(data.payload).then(function (result) {
      sendResponse(result);
    });

  } else {
    sendResponse({ success: false, error: 'UNKNOWN_TYPE' });
  }
}

// ─── Conversão ──────────────────────────────────────────────────
function handleConversion(url, tab, showNotification) {
  return new Promise(function (resolve) {
    chrome.storage.local.get(['affiliateId'], function (result) {
      var affiliateId = result.affiliateId;

      if (!affiliateId) {
        if (showNotification) {
          showNotif('cfg-required', 'Shopee Affiliate Converter',
            '⚙️ Configure seu Affiliate ID na extensão primeiro.');
        }
        return resolve({ success: false, error: 'NO_CONFIG' });
      }

      if (!isShopeeUrl(url)) {
        if (showNotification) {
          showNotif('not-shopee', 'Shopee Affiliate Converter',
            '❌ Este link não pertence à Shopee.');
        }
        return resolve({ success: false, error: 'NOT_SHOPEE' });
      }

      var affiliateLink = convertShopeeLink(url, affiliateId);
      if (!affiliateLink) {
        return resolve({ success: false, error: 'CONVERSION_FAILED' });
      }

      // Copiar para clipboard via scripting API (requer tab ativo)
      var copyPromise = Promise.resolve();
      if (tab && tab.id) {
        copyPromise = chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: function (text) {
            return navigator.clipboard.writeText(text).catch(function () {
              // Fallback silencioso se clipboard API não estiver disponível
            });
          },
          args: [affiliateLink],
        }).catch(function (e) {
          // Páginas como chrome:// não permitem injeção
          console.warn('[ShopeeAff] clipboard inject failed:', e.message);
        });
      }

      copyPromise.then(function () {
        return Promise.all([
          appendHistory({ original: url, affiliate: affiliateLink }),
          incrementStats(),
        ]);
      }).then(function () {
        if (showNotification) {
          var msg = affiliateLink.length > 80
            ? affiliateLink.substring(0, 77) + '…'
            : affiliateLink;
          showNotif('ok-' + Date.now(), '✅ Link Afiliado Copiado!', msg);
        }
        resolve({ success: true, affiliateLink: affiliateLink });
      });
    });
  });
}

// ─── Detector de Clipboard ───────────────────────────────────────
function handleCopiedShopeeUrl(url) {
  return new Promise(function (resolve) {
    chrome.storage.local.get(['affiliateId', 'clipboardDetector'], function (result) {
      if (!result.affiliateId) return resolve();
      if (result.clipboardDetector === false) return resolve();
      if (!isShopeeUrl(url)) return resolve();

      var notifId = 'clip-' + Date.now();
      pendingClipboard.set(notifId, url);

      chrome.notifications.create(notifId, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title: '🛒 Link Shopee Detectado',
        message: 'Deseja converter para link afiliado?',
        buttons: [
          { title: '✅ Converter Agora' },
          { title: '✗ Ignorar' },
        ],
        requireInteraction: false,
        priority: 0,
      });

      // Limpar referência após 30 s
      setTimeout(function () {
        pendingClipboard.delete(notifId);
      }, 30000);

      resolve();
    });
  });
}

chrome.notifications.onButtonClicked.addListener(function (notifId, btnIndex) {
  if (!pendingClipboard.has(notifId)) return;

  var url = pendingClipboard.get(notifId);
  pendingClipboard.delete(notifId);
  chrome.notifications.clear(notifId);

  if (btnIndex !== 0) return; // "Ignorar"

  chrome.storage.local.get(['affiliateId'], function (result) {
    if (!result.affiliateId) return;
    var affiliateLink = convertShopeeLink(url, result.affiliateId);
    if (!affiliateLink) return;

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      var copyPromise = Promise.resolve();
      if (tabs[0] && tabs[0].id) {
        copyPromise = chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: function (text) {
            return navigator.clipboard.writeText(text).catch(function () {});
          },
          args: [affiliateLink],
        }).catch(function () {});
      }

      copyPromise.then(function () {
        return Promise.all([
          appendHistory({ original: url, affiliate: affiliateLink }),
          incrementStats(),
        ]);
      }).then(function () {
        var msg = affiliateLink.length > 80
          ? affiliateLink.substring(0, 77) + '…'
          : affiliateLink;
        showNotif('clip-done-' + Date.now(), '✅ Link Afiliado Copiado!', msg);
      });
    });
  });
});

// ─── Histórico ──────────────────────────────────────────────────
function appendHistory(item) {
  return new Promise(function (resolve) {
    chrome.storage.local.get('history', function (result) {
      var history = result.history || [];
      history.unshift({
        id:          Date.now().toString(),
        original:    item.original    || '',
        affiliate:   item.affiliate   || null,
        date:        new Date().toISOString(),
        status:      item.status      || 'converted',
        affiliateId: item.affiliateId || '',
        message:     item.message     || '',
      });
      if (history.length > 50) history = history.slice(0, 50);
      chrome.storage.local.set({ history: history }, resolve);
    });
  });
}

function fetchHistory(limit) {
  return new Promise(function (resolve) {
    chrome.storage.local.get('history', function (result) {
      var h = result.history || [];
      resolve(limit ? h.slice(0, limit) : h);
    });
  });
}

function removeHistoryItem(id) {
  return new Promise(function (resolve) {
    chrome.storage.local.get('history', function (result) {
      var history = (result.history || []).filter(function (item) {
        return item.id !== id;
      });
      chrome.storage.local.set({ history: history }, resolve);
    });
  });
}

// ─── Estatísticas ────────────────────────────────────────────────
// onlyIfSuccess: só conta se foi realmente uma conversão válida
function incrementStats(onlyIfSuccess) {
  if (onlyIfSuccess === false) return Promise.resolve();
  return new Promise(function (resolve) {
    chrome.storage.local.get('stats', function (result) {
      var stats = result.stats || { total: 0, byDate: {} };
      var today = new Date().toISOString().split('T')[0];

      stats.total = (stats.total || 0) + 1;
      stats.byDate[today] = (stats.byDate[today] || 0) + 1;

      // Remove datas com mais de 31 dias para economizar espaço
      var cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 31);
      var cutoffStr = cutoff.toISOString().split('T')[0];
      Object.keys(stats.byDate).forEach(function (date) {
        if (date < cutoffStr) delete stats.byDate[date];
      });

      chrome.storage.local.set({ stats: stats }, resolve);
    });
  });
}

function computeStats() {
  return new Promise(function (resolve) {
    chrome.storage.local.get('stats', function (result) {
      var stats = result.stats || { total: 0, byDate: {} };
      var today = new Date().toISOString().split('T')[0];

      var sevenAgo = new Date();
      sevenAgo.setDate(sevenAgo.getDate() - 7);
      var thirtyAgo = new Date();
      thirtyAgo.setDate(thirtyAgo.getDate() - 30);

      var todayCount = stats.byDate[today] || 0;
      var weekCount = 0;
      var monthCount = 0;

      Object.entries(stats.byDate).forEach(function (entry) {
        var d = new Date(entry[0]);
        if (d >= sevenAgo) weekCount += entry[1];
        if (d >= thirtyAgo) monthCount += entry[1];
      });

      resolve({
        total: stats.total || 0,
        today: todayCount,
        week: weekCount,
        month: monthCount,
      });
    });
  });
}

// ─── Exportar / Importar ─────────────────────────────────────────
function exportAllData() {
  return new Promise(function (resolve) {
    chrome.storage.local.get(null, function (result) {
      resolve({
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        affiliateId: result.affiliateId || '',
        userName: result.userName || '',
        clipboardDetector: result.clipboardDetector !== false,
        stats: result.stats || { total: 0, byDate: {} },
        history: result.history || [],
      });
    });
  });
}

function importAllData(payload) {
  return new Promise(function (resolve) {
    if (!payload || !payload.version) {
      return resolve({ success: false, error: 'INVALID_FORMAT' });
    }
    var updates = {};
    if (payload.affiliateId) updates.affiliateId = payload.affiliateId;
    if (payload.userName) updates.userName = payload.userName;
    if (typeof payload.clipboardDetector === 'boolean') {
      updates.clipboardDetector = payload.clipboardDetector;
    }
    if (payload.stats) updates.stats = payload.stats;
    if (Array.isArray(payload.history)) updates.history = payload.history;

    chrome.storage.local.set(updates, function () {
      resolve({ success: true });
    });
  });
}

// ─── Notificações ────────────────────────────────────────────────
function showNotif(id, title, message) {
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    title: title,
    message: message,
    priority: 0,
  });
}

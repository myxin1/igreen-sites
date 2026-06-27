// diagnosticEngine.js — Motor de diagnóstico de compatibilidade Shopee Afiliados
// Depende de: comparisonUtils.js (window.ComparisonUtils)
// Requer ambiente Chrome (chrome.storage.local).

/* eslint-disable no-var */
(function () {
  'use strict';

  var HISTORY_KEY = 'diagnosticHistory';
  var HISTORY_MAX = 20;

  // Executa o diagnóstico completo comparando as duas URLs.
  // affiliateId: valor salvo na storage (sem ou com prefixo 'an_').
  function runDiagnosis(officialUrl, extensionUrl, affiliateId) {
    var offParams = ComparisonUtils.parseAllParams(officialUrl);
    var extParams = ComparisonUtils.parseAllParams(extensionUrl);

    var expectedCode = null;
    if (affiliateId) {
      var affiliateIdText = String(affiliateId).trim();
      expectedCode = affiliateIdText.indexOf('an_') === 0 ? affiliateIdText : ('an_' + affiliateIdText);
    }

    var rows          = ComparisonUtils.compareParams(offParams, extParams, expectedCode);
    var compatibility = ComparisonUtils.computeCompatibility(rows);
    var level         = ComparisonUtils.compatibilityLevel(compatibility);
    var summary       = ComparisonUtils.generateSummary(rows);
    var productName   = ComparisonUtils.extractProductName(officialUrl);

    return {
      timestamp:     Date.now(),
      officialUrl:   officialUrl  || '',
      extensionUrl:  extensionUrl || '',
      affiliateId:   affiliateId  || '',
      productName:   productName,
      rows:          rows,
      compatibility: compatibility,
      level:         level,
      summary:       summary,
    };
  }

  // Persiste o resultado no histórico (máximo HISTORY_MAX entradas, mais recente primeiro).
  function saveDiagnosticToHistory(result, callback) {
    chrome.storage.local.get(HISTORY_KEY, function (data) {
      var history = data[HISTORY_KEY] || [];

      var entry = {
        id:            'diag_' + result.timestamp + '_' + Math.random().toString(36).slice(2, 7),
        timestamp:     result.timestamp,
        productName:   result.productName,
        compatibility: result.compatibility,
        level:         result.level,
        officialUrl:   result.officialUrl,
        extensionUrl:  result.extensionUrl,
        affiliateId:   result.affiliateId,
        rows:          result.rows,
        summary:       result.summary,
      };

      history.unshift(entry);
      if (history.length > HISTORY_MAX) history = history.slice(0, HISTORY_MAX);

      var store = {};
      store[HISTORY_KEY] = history;
      chrome.storage.local.set(store, function () {
        if (callback) callback(entry);
      });
    });
  }

  // Lê o histórico completo de diagnósticos.
  function getDiagnosticHistory(callback) {
    chrome.storage.local.get(HISTORY_KEY, function (data) {
      callback(data[HISTORY_KEY] || []);
    });
  }

  // Remove todos os diagnósticos do histórico.
  function clearDiagnosticHistory(callback) {
    var store = {};
    store[HISTORY_KEY] = [];
    chrome.storage.local.set(store, function () {
      if (callback) callback();
    });
  }

  // Obtém o último link convertido do histórico de conversões regulares.
  function getLastConvertedLink(callback) {
    chrome.storage.local.get('history', function (data) {
      var history = data['history'] || [];
      var link = '';
      for (var i = 0; i < history.length; i++) {
        if (history[i].status === 'converted' && history[i].affiliate) {
          link = history[i].affiliate;
          break;
        }
      }
      callback(link);
    });
  }

  // ─── Exportação ───────────────────────────────────────────────────
  var api = {
    runDiagnosis:            runDiagnosis,
    saveDiagnosticToHistory: saveDiagnosticToHistory,
    getDiagnosticHistory:    getDiagnosticHistory,
    clearDiagnosticHistory:  clearDiagnosticHistory,
    getLastConvertedLink:    getLastConvertedLink,
  };

  if (typeof window  !== 'undefined') window.DiagnosticEngine   = api;
  if (typeof module  !== 'undefined' && module.exports) module.exports = api;
})();

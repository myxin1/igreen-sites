// settings-diagnostics.js — Controller da página de diagnóstico de compatibilidade

/* eslint-disable no-var */
(function () {
  'use strict';

  var currentResult = null;

  // ─── Tema ────────────────────────────────────────────────────────
  chrome.storage.local.get('theme', function (r) {
    applyTheme(r.theme || 'dark');
  });
  document.getElementById('btn-theme').addEventListener('click', function () {
    var isLight = document.documentElement.classList.contains('light');
    var next    = isLight ? 'dark' : 'light';
    applyTheme(next);
    chrome.storage.local.set({ theme: next });
  });
  function applyTheme(t) {
    document.documentElement.classList.toggle('light', t === 'light');
  }

  // ─── Navegação de retorno ─────────────────────────────────────────
  document.getElementById('btn-back').addEventListener('click', function () {
    window.location.href = 'options.html';
  });

  // ─── Init ────────────────────────────────────────────────────────
  chrome.storage.local.get(['affiliateId'], function (r) {
    if (r.affiliateId) {
      document.getElementById('header-user-id').textContent = r.affiliateId;
    }
  });

  // Auto-preenche o campo da extensão com o último link convertido
  DiagnosticEngine.getLastConvertedLink(function (link) {
    var hint = document.getElementById('ext-url-hint');
    if (link) {
      document.getElementById('ext-url').value = link;
      hint.textContent = 'Preenchido com o último link convertido pela extensão.';
    } else {
      hint.textContent = 'Nenhum link convertido encontrado. Cole manualmente.';
    }
  });

  loadHistory();

  // ─── Comparar Links ───────────────────────────────────────────────
  document.getElementById('btn-compare').addEventListener('click', function () {
    var officialUrl  = (document.getElementById('off-url').value  || '').trim();
    var extensionUrl = (document.getElementById('ext-url').value  || '').trim();
    var toast        = document.getElementById('compare-toast');

    if (!officialUrl) {
      flashToast(toast, '❌ Cole o link oficial da Shopee.', 'err');
      document.getElementById('off-url').focus();
      return;
    }
    if (!extensionUrl) {
      flashToast(toast, '❌ Cole o link da extensão.', 'err');
      document.getElementById('ext-url').focus();
      return;
    }

    chrome.storage.local.get('affiliateId', function (r) {
      currentResult = DiagnosticEngine.runDiagnosis(officialUrl, extensionUrl, r.affiliateId || '');

      DiagnosticEngine.saveDiagnosticToHistory(currentResult, function () {
        loadHistory();
      });

      renderResult(currentResult);
      var panel = document.getElementById('results-panel');
      panel.classList.remove('hidden');
      setTimeout(function () {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    });
  });

  // ─── Limpar comparação ────────────────────────────────────────────
  document.getElementById('btn-clear-comparison').addEventListener('click', function () {
    document.getElementById('off-url').value = '';
    document.getElementById('ext-url').value = '';
    document.getElementById('results-panel').classList.add('hidden');
    currentResult = null;
    document.getElementById('ext-url-hint').textContent = 'Cole o link gerado pela extensão.';
  });

  // ─── Copiar resultado ─────────────────────────────────────────────
  document.getElementById('btn-copy-result').addEventListener('click', function () {
    if (!currentResult) return;
    var text  = formatResultAsText(currentResult);
    var toast = document.getElementById('action-toast');
    navigator.clipboard.writeText(text).then(function () {
      flashToast(toast, '✅ Resultado copiado!', 'ok');
    }).catch(function () {
      flashToast(toast, '❌ Falha ao copiar.', 'err');
    });
  });

  // ─── Exportar JSON ────────────────────────────────────────────────
  document.getElementById('btn-export-diag').addEventListener('click', function () {
    if (!currentResult) return;
    var json = JSON.stringify(currentResult, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = 'diagnostico-shopee-' + new Date(currentResult.timestamp).toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  // ─── Renderizar resultado ─────────────────────────────────────────
  function renderResult(result) {
    var pct   = result.compatibility;
    var level = result.level;

    var levelLabels = {
      high:    '🟢 Alta compatibilidade',
      partial: '🟡 Compatibilidade parcial',
      low:     '🔴 Baixa compatibilidade',
    };

    // Compatibilidade geral
    var pctEl  = document.getElementById('compat-pct');
    var barEl  = document.getElementById('compat-bar');
    var lblEl  = document.getElementById('compat-label');

    pctEl.textContent = pct + '%';
    pctEl.className   = 'compat-pct level-' + level;
    barEl.style.width = pct + '%';
    barEl.className   = 'compat-bar-fill level-' + level;
    lblEl.textContent = labelOf(levelLabels, level);
    lblEl.className   = 'compat-level-label level-' + level;

    // Tabela de parâmetros
    renderParamRows(result.rows);

    // Resumo
    document.getElementById('diag-summary').textContent = result.summary;
  }

  function renderParamRows(rows) {
    var tbody = document.getElementById('param-tbody');
    tbody.innerHTML = '';

    rows.forEach(function (row) {
      var el = document.createElement('div');
      el.className = 'param-row' + (row.isIdRow ? ' row-id' : '');

      var statusBadge = buildStatusBadge(row.status, row.dynamic);
      var offCell     = buildValueCell(row.official);
      var extCell     = buildValueCell(row.extension);

      var idExtra = '';
      if (row.isIdRow && row.expected) {
        idExtra = '<div class="param-expected">Esperado: <code>' + esc(row.expected) + '</code></div>';
      }

      var dynamicTag = row.dynamic
        ? '<span class="tag-dynamic">dinâmico</span>'
        : '';

      el.innerHTML =
        '<div>' +
          '<span class="param-key">' + esc(row.label) + '</span>' + dynamicTag + idExtra +
        '</div>' +
        '<div>' + offCell + '</div>' +
        '<div>' + extCell + '</div>' +
        '<div>' + statusBadge + '</div>';

      tbody.appendChild(el);
    });
  }

  function buildValueCell(val) {
    if (val === null || val === undefined) {
      return '<span class="val-absent">—</span>';
    }
    var display = String(val);
    if (display.length > 22) display = display.slice(0, 19) + '…';
    return '<code class="val-code">' + esc(display) + '</code>';
  }

  var STATUS_MAP = {
    ok:              { cls: 'ps-ok',              text: '✅ OK'          },
    missing:         { cls: 'ps-missing',         text: '❌ Ausente'     },
    missing_dynamic: { cls: 'ps-missing_dynamic', text: '⚠️ Ausente'     },
    mismatch:        { cls: 'ps-mismatch',        text: '❌ Divergente'  },
    extra:           { cls: 'ps-extra',           text: 'ℹ️ Extra'       },
    absent_both:     { cls: 'ps-absent_both',     text: '— N/A'         },
  };

  function buildStatusBadge(status) {
    var cfg = STATUS_MAP[status] || { cls: 'ps-absent_both', text: status };
    return '<span class="ps-badge ' + cfg.cls + '">' + cfg.text + '</span>';
  }

  // ─── Histórico ────────────────────────────────────────────────────
  function loadHistory() {
    DiagnosticEngine.getDiagnosticHistory(function (history) {
      renderHistory(history);
    });
  }

  function renderHistory(history) {
    var container = document.getElementById('history-list');

    if (!history.length) {
      container.innerHTML =
        '<div class="empty-state" style="border:1px solid var(--border);border-top:none;' +
        'border-radius:0 0 var(--r-sm) var(--r-sm);">' +
        'Nenhum diagnóstico realizado ainda.</div>';
      return;
    }

    var html = '';
    history.forEach(function (entry) {
      var date = new Date(entry.timestamp).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });

      var levelEmoji = entry.level === 'high' ? '🟢' : (entry.level === 'partial' ? '🟡' : '🔴');
      var levelCls   = 'level-' + entry.level;

      html +=
        '<div class="diag-hist-row">' +
          '<div class="hist-date-cell">' + esc(date) + '</div>' +
          '<div class="hist-product-cell" title="' + esc(entry.officialUrl) + '">' +
            esc(entry.productName) +
          '</div>' +
          '<div class="hist-compat-cell ' + levelCls + '">' +
            levelEmoji + ' ' + entry.compatibility + '%' +
          '</div>' +
          '<div>' +
            '<button class="tbl-btn del hist-del-btn" data-id="' + esc(entry.id) + '" title="Excluir">' +
              '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">' +
              '<polyline points="3 6 5 6 21 6"/>' +
              '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>' +
              '</svg>' +
            '</button>' +
          '</div>' +
        '</div>';
    });

    container.innerHTML = html;

    container.querySelectorAll('.hist-del-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = this.getAttribute('data-id');
        DiagnosticEngine.getDiagnosticHistory(function (hist) {
          var updated = hist.filter(function (e) { return e.id !== id; });
          var store   = {};
          store['diagnosticHistory'] = updated;
          chrome.storage.local.set(store, function () {
            renderHistory(updated);
          });
        });
      });
    });
  }

  document.getElementById('btn-clear-history').addEventListener('click', function () {
    if (!confirm('Apagar todo o histórico de diagnósticos?')) return;
    DiagnosticEngine.clearDiagnosticHistory(function () {
      renderHistory([]);
    });
  });

  // ─── Formatar resultado como texto simples ────────────────────────
  function formatResultAsText(result) {
    var lines = [];
    var date  = new Date(result.timestamp).toLocaleString('pt-BR');

    lines.push('=== DIAGNÓSTICO DE COMPATIBILIDADE — SHOPEE AFILIADOS ===');
    lines.push('Data:           ' + date);
    lines.push('Produto:        ' + result.productName);
    lines.push('Compatibilidade: ' + result.compatibility + '%');
    lines.push('');
    lines.push('PARÂMETROS:');
    lines.push('────────────────────────────────────────────');

    result.rows.forEach(function (row) {
      var cfg     = STATUS_MAP[row.status] || STATUS_MAP['absent_both'];
      var offVal  = row.official  !== null ? row.official  : '—';
      var extVal  = row.extension !== null ? row.extension : '—';

      if (row.isIdRow) {
        lines.push(cfg.text + '  ' + row.label);
        lines.push('  Esperado: ' + (row.expected || '—'));
        lines.push('  Oficial:  ' + offVal);
        lines.push('  Extensão: ' + extVal);
      } else {
        var line = cfg.text + '  ' + row.label;
        if (row.official !== null || row.extension !== null) {
          line += '   (Oficial: ' + offVal + ' / Extensão: ' + extVal + ')';
        }
        lines.push(line);
      }
    });

    lines.push('');
    lines.push('RESUMO:');
    lines.push('────────────────────────────────────────────');
    lines.push(result.summary);
    lines.push('');
    lines.push('⚠️  AVISO: Compatibilidade alta não garante rastreamento da comissão.');
    lines.push('    O funcionamento final depende do sistema da Shopee.');

    return lines.join('\n');
  }

  // ─── Helpers ─────────────────────────────────────────────────────
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

  function labelOf(obj, key) {
    return obj.hasOwnProperty(key) ? obj[key] : key;
  }

})();

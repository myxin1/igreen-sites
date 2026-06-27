// comparisonUtils.js — Utilitários puros de comparação de URLs Shopee Afiliados
// Sem efeitos colaterais, sem Chrome API, sem DOM. Compatível com Node.js para testes.

/* eslint-disable no-var */
(function () {
  'use strict';

  // Parâmetros rastreados na comparação.
  // Core (weight 32): determinam a maioria do score.
  // Dynamic (weight 1): gerados pelos servidores da Shopee — ausência é esperada na extensão.
  var DIAG_PARAMS = [
    { key: 'mmp_pid',      label: 'mmp_pid',      weight: 32, dynamic: false },
    { key: 'utm_source',   label: 'utm_source',   weight: 32, dynamic: false },
    { key: 'utm_medium',   label: 'utm_medium',   weight: 32, dynamic: false },
    { key: 'uls_trackid',  label: 'uls_trackid',  weight:  1, dynamic: true  },
    { key: 'utm_campaign', label: 'utm_campaign', weight:  1, dynamic: true  },
    { key: 'utm_term',     label: 'utm_term',     weight:  1, dynamic: true  },
    { key: 'gads_t_sig',   label: 'gads_t_sig',   weight:  1, dynamic: true  },
  ];

  // Extrai todos os query params de uma URL em um objeto {key: value}.
  function parseAllParams(url) {
    if (!url) return {};
    try {
      var result = {};
      new URL(url).searchParams.forEach(function (val, key) {
        result[key] = val;
      });
      return result;
    } catch (e) {
      return {};
    }
  }

  // Extrai o código de afiliado do objeto de params (mmp_pid tem precedência).
  function extractAffiliateCode(params) {
    return params['mmp_pid'] || params['af_id'] || null;
  }

  // Determina o status de um par (officialVal, extensionVal).
  function _calcStatus(offVal, extVal, isDynamic) {
    var oPresent = offVal !== null && offVal !== undefined;
    var ePresent = extVal !== null && extVal !== undefined;
    if (oPresent && ePresent)  return offVal === extVal ? 'ok' : 'mismatch';
    if (oPresent && !ePresent) return isDynamic ? 'missing_dynamic' : 'missing';
    if (!oPresent && ePresent) return 'extra';
    return 'absent_both';
  }

  // Compara dois conjuntos de params e retorna um array de rows para exibição.
  // Row 0: resumo do affiliate_id (weight 0, displayOnly).
  // Rows 1–7: parâmetros DIAG_PARAMS com seus pesos.
  function compareParams(officialParams, extensionParams, expectedCode) {
    var offCode = extractAffiliateCode(officialParams);
    var extCode = extractAffiliateCode(extensionParams);
    var expected = expectedCode || null;

    var affStatus = 'mismatch';
    if (!offCode && !extCode) {
      affStatus = 'absent_both';
    } else if (offCode && !extCode) {
      affStatus = 'missing';
    } else if (offCode && extCode && offCode === extCode) {
      affStatus = (!expected || offCode === expected) ? 'ok' : 'mismatch';
    }

    var rows = [{
      key:        'affiliate_id',
      label:      'ID do Afiliado',
      expected:   expected,
      official:   offCode,
      extension:  extCode,
      weight:     0,
      dynamic:    false,
      isIdRow:    true,
      status:     affStatus,
    }];

    DIAG_PARAMS.forEach(function (def) {
      var oV = officialParams.hasOwnProperty(def.key)  ? officialParams[def.key]  : null;
      var eV = extensionParams.hasOwnProperty(def.key) ? extensionParams[def.key] : null;
      rows.push({
        key:      def.key,
        label:    def.label,
        expected: null,
        official: oV,
        extension: eV,
        weight:   def.weight,
        dynamic:  def.dynamic,
        isIdRow:  false,
        status:   _calcStatus(oV, eV, def.dynamic),
      });
    });

    return rows;
  }

  // Calcula a porcentagem de compatibilidade.
  // Params com status 'absent_both' são excluídos do cálculo — ambos concordam na ausência.
  // Params com status 'ok' rendem seu peso total; qualquer outro status rende 0.
  function computeCompatibility(rows) {
    var total  = 0;
    var earned = 0;
    rows.forEach(function (row) {
      if (!row.weight) return;
      if (row.status === 'absent_both') return; // nem oficial nem extensão tem — não penaliza
      total += row.weight;
      if (row.status === 'ok') earned += row.weight;
    });
    return total ? Math.round((earned / total) * 100) : 0;
  }

  // Classifica o nível de compatibilidade para exibição.
  function compatibilityLevel(pct) {
    if (pct >= 90) return 'high';
    if (pct >= 60) return 'partial';
    return 'low';
  }

  // Gera o parágrafo de resumo automático do diagnóstico.
  function generateSummary(rows) {
    var affRow  = null;
    var mmpRow  = null;
    var srcRow  = null;
    var medRow  = null;
    var dynMiss = [];

    rows.forEach(function (r) {
      if (r.key === 'affiliate_id') affRow = r;
      if (r.key === 'mmp_pid')      mmpRow = r;
      if (r.key === 'utm_source')   srcRow = r;
      if (r.key === 'utm_medium')   medRow = r;
      if (r.dynamic && (r.status === 'missing_dynamic' || r.status === 'missing')) {
        dynMiss.push(r);
      }
    });

    var parts = [];

    if (affRow) {
      if (affRow.status === 'ok') {
        parts.push('O ID do afiliado foi aplicado corretamente.');
      } else if (affRow.status === 'mismatch') {
        parts.push('O ID do afiliado difere entre os links — verifique o Affiliate ID configurado na extensão.');
      } else if (affRow.status === 'missing') {
        parts.push('O ID do afiliado não foi encontrado no link gerado pela extensão.');
      } else {
        parts.push('Nenhum ID de afiliado foi detectado em ambos os links.');
      }
    }

    var coreOk = [mmpRow, srcRow, medRow].filter(function (r) {
      return r && r.status === 'ok';
    }).length;

    if (coreOk === 3) {
      parts.push('Os parâmetros principais da Shopee Afiliados estão presentes.');
    } else if (coreOk > 0) {
      parts.push(
        coreOk + ' de 3 parâmetros principais corretos. ' +
        'Verifique os itens marcados com ❌ na tabela acima.'
      );
    } else {
      parts.push(
        'Os parâmetros principais da Shopee Afiliados não foram encontrados no link da extensão. ' +
        'Confirme que o Affiliate ID está configurado e que o link é da Shopee.'
      );
    }

    if (dynMiss.length > 0) {
      parts.push(
        'Alguns parâmetros dinâmicos encontrados no link oficial não foram gerados pela extensão. ' +
        'Isso pode ser normal, pois esses valores costumam ser criados pelos servidores da Shopee.'
      );
    }

    return parts.join('\n\n');
  }

  // Extrai um nome de produto legível da URL (para o histórico de diagnósticos).
  function extractProductName(url) {
    if (!url) return '—';
    try {
      var pathname = new URL(url).pathname;
      var segments = pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        var seg = segments[segments.length - 1];
        seg = seg.replace(/-i\.\d+\.\d+$/, '').replace(/-/g, ' ').trim();
        if (seg.length > 0) {
          return seg.length > 45 ? seg.slice(0, 42) + '…' : seg;
        }
      }
      return new URL(url).hostname;
    } catch (e) {
      return '—';
    }
  }

  // ─── Exportação ───────────────────────────────────────────────────
  var api = {
    DIAG_PARAMS:          DIAG_PARAMS,
    parseAllParams:       parseAllParams,
    extractAffiliateCode: extractAffiliateCode,
    compareParams:        compareParams,
    computeCompatibility: computeCompatibility,
    compatibilityLevel:   compatibilityLevel,
    generateSummary:      generateSummary,
    extractProductName:   extractProductName,
  };

  if (typeof window  !== 'undefined') window.ComparisonUtils    = api;
  if (typeof module  !== 'undefined' && module.exports) module.exports = api;
})();

// ============================================================
// SHOPEE AFFILIATE FORMATTER — Utilitários Completos v2.0.0
// ============================================================
//
// Padrão oficial Shopee Afiliados:
//   mmp_pid=an_ID  |  utm_source=an_ID  |  utm_medium=affiliates
//
// GUIA DE MANUTENÇÃO:
//   Se a Shopee mudar o prefixo   → altere AFFILIATE_CODE_PREFIX
//   Se adicionar domínios novos   → altere SHOPEE_DOMAINS
//   Se adicionar redes com redirect → altere REDIRECT_WRAPPERS
// ============================================================

/* eslint-disable no-var */

// ─── Configuração ──────────────────────────────────────────────

var AFFILIATE_CODE_PREFIX = 'an_';   // Shopee Afiliados: prefixo obrigatório

var SHOPEE_DOMAINS = [
  'shopee.com.br',
  'shopee.com',
  's.shopee.com.br',
  'affiliate.shopee.com.br',
  'br.shp.ee',
  'shope.ee',
];

var SHORT_LINK_DOMAINS = ['shope.ee', 'br.shp.ee', 's.shopee.com.br'];

// Parâmetros que DETECTAM um link de afiliado existente (qualquer → "já afiliado")
var AFFILIATE_DETECT_PARAMS = [
  'af_id', 'aff_id', 'smtt', 'smttsrc', 'smtttype', 'mmp_pid',
];

// Todos os parâmetros a remover antes de inserir os do usuário
var PARAMS_TO_CLEAN = [
  // Afiliado legado / interno Shopee
  'af_id', 'aff_id', 'smtt', 'smttsrc', 'smtttype',
  // MMP / rastreamento Shopee
  'mmp_pid', 'uls_trackid', 'gads_t_sig',
  // Rastreamento social e UTM
  'fbclid', 'gclid', '_ga', '_gid',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
];

// Redes sociais / redirecionadores que embrulham links Shopee
var REDIRECT_WRAPPERS = [
  { host: 'l.instagram.com',    param: 'u' },
  { host: 'l.facebook.com',     param: 'u' },
  { host: 'out.instagram.com',  param: 'u' },
  { host: 'lm.facebook.com',    param: 'u' },
  { host: 'www.instagram.com',  param: 'u' },
];

// ─── Status Codes ──────────────────────────────────────────────
var CONVERT_STATUS = {
  CONVERTED:         'converted',
  ALREADY_AFFILIATE: 'already_affiliate',
  NOT_SHOPEE:        'not_shopee',
  NO_AFFILIATE_ID:   'no_affiliate_id',
  CONVERSION_FAILED: 'conversion_failed',
  ID_NOT_FOUND:      'id_not_found',
  UNCHANGED:         'unchanged',
};

// ─── unwrapRedirectUrl ─────────────────────────────────────────
function unwrapRedirectUrl(url) {
  if (!url) return url;
  try {
    var u       = new URL(url);
    var wrapper = REDIRECT_WRAPPERS.find(function (w) {
      return u.hostname === w.host || u.hostname === 'www.' + w.host;
    });
    if (!wrapper) return url;
    var inner = u.searchParams.get(wrapper.param);
    return inner || url;
  } catch (e) {
    return url;
  }
}

// ─── detectShopeeDomain ────────────────────────────────────────
function detectShopeeDomain(url) {
  if (!url) return null;
  try {
    var hostname = new URL(url).hostname.toLowerCase();
    return SHOPEE_DOMAINS.find(function (d) {
      return hostname === d || hostname.endsWith('.' + d);
    }) || null;
  } catch (e) {
    return null;
  }
}

// ─── isShopeeUrl ───────────────────────────────────────────────
function isShopeeUrl(url) {
  if (!url) return false;
  if (detectShopeeDomain(url)) return true;
  var inner = unwrapRedirectUrl(url);
  return inner !== url && detectShopeeDomain(inner) !== null;
}

// ─── isAlreadyAffiliateLink ────────────────────────────────────
function isAlreadyAffiliateLink(url) {
  if (!url) return false;
  try {
    var params = new URL(url).searchParams;
    if (AFFILIATE_DETECT_PARAMS.some(function (p) { return params.has(p); })) return true;
    var mmp = params.get('mmp_pid');
    return mmp !== null && mmp.startsWith(AFFILIATE_CODE_PREFIX);
  } catch (e) {
    return false;
  }
}

// ─── extractOldAffiliateId ─────────────────────────────────────
// Retorna o ID bruto (sem prefixo 'an_') do afiliado que já estava no link.
function extractOldAffiliateId(url) {
  if (!url) return null;
  try {
    var params = new URL(url).searchParams;
    var mmp = params.get('mmp_pid');
    if (mmp && mmp.startsWith(AFFILIATE_CODE_PREFIX)) {
      return mmp.slice(AFFILIATE_CODE_PREFIX.length);
    }
    return params.get('af_id') || null;
  } catch (e) {
    return null;
  }
}

// ─── extractAffiliateParams (compat) ──────────────────────────
function extractAffiliateParams(url) {
  if (!url) return {};
  try {
    var params = new URL(url).searchParams;
    var found  = {};
    AFFILIATE_DETECT_PARAMS.forEach(function (p) {
      if (params.has(p)) found[p] = params.get(p);
    });
    return found;
  } catch (e) {
    return {};
  }
}

// ─── normalizeShopeeUrl ────────────────────────────────────────
function normalizeShopeeUrl(url) {
  if (!url) return '';
  try {
    var u = new URL(url);
    PARAMS_TO_CLEAN.forEach(function (p) { u.searchParams.delete(p); });
    u.hash = '';
    return u.toString();
  } catch (e) {
    return url;
  }
}

// ─── convertShopeeLink ─────────────────────────────────────────
// Padrão de saída oficial:
//   mmp_pid=an_<affiliateId>
//   utm_source=an_<affiliateId>
//   utm_medium=affiliates
function convertShopeeLink(url, affiliateId) {
  if (!url || !affiliateId) return null;

  var effectiveUrl = unwrapRedirectUrl(url);
  if (!isShopeeUrl(effectiveUrl)) return null;

  try {
    var u             = new URL(effectiveUrl);
    var affiliateCode = AFFILIATE_CODE_PREFIX + affiliateId;

    // 1. Remover todos os parâmetros de rastreamento / afiliado anteriores
    PARAMS_TO_CLEAN.forEach(function (p) { u.searchParams.delete(p); });

    // 2. Inserir parâmetros oficiais Shopee Afiliados
    u.searchParams.set('mmp_pid',    affiliateCode);
    u.searchParams.set('utm_source', affiliateCode);
    u.searchParams.set('utm_medium', 'affiliates');

    return u.toString();
  } catch (e) {
    return null;
  }
}

// ─── validateConvertedLink ─────────────────────────────────────
function validateConvertedLink(originalUrl, convertedUrl, affiliateId) {
  var result = {
    isValid:             false,
    status:              CONVERT_STATUS.CONVERSION_FAILED,
    message:             '',
    originalUrl:         originalUrl  || '',
    convertedUrl:        convertedUrl || null,
    affiliateIdFound:    false,   // true quando todos os 3 params estão corretos
    shopeeDomainValid:   false,
    domainDetected:      null,
    isShortLink:         false,
    wasAlreadyAffiliate: false,
    wasWrapped:          false,
    oldAffiliateId:      null,    // ID bruto de outro afiliado encontrado no original
    affiliateCode:       null,    // 'an_<affiliateId>' esperado
    mmpPidOk:            false,
    utmSourceOk:         false,
    utmMediumOk:         false,
    afIdPresent:         false,   // true se af_id ainda sobrou no link (erro)
  };

  var effectiveUrl = unwrapRedirectUrl(originalUrl);
  if (effectiveUrl !== originalUrl) result.wasWrapped = true;

  // 1. Não é Shopee
  var domain = detectShopeeDomain(effectiveUrl);
  if (!domain) {
    result.status  = CONVERT_STATUS.NOT_SHOPEE;
    result.message = 'O link não pertence a um domínio Shopee reconhecido.';
    return result;
  }
  result.shopeeDomainValid = true;
  result.domainDetected    = domain;
  result.isShortLink       = SHORT_LINK_DOMAINS.indexOf(domain) !== -1;

  // 2. Affiliate ID não configurado
  if (!affiliateId) {
    result.status  = CONVERT_STATUS.NO_AFFILIATE_ID;
    result.message = 'Nenhum Affiliate ID configurado na extensão.';
    return result;
  }

  var expectedCode = AFFILIATE_CODE_PREFIX + affiliateId;
  result.affiliateCode = expectedCode;

  // 3. Link original já tinha parâmetros de afiliado
  if (isAlreadyAffiliateLink(effectiveUrl)) {
    result.wasAlreadyAffiliate = true;
    result.oldAffiliateId      = extractOldAffiliateId(effectiveUrl);

    // Verificar se o original já estava no padrão correto do usuário
    try {
      var origP = new URL(effectiveUrl).searchParams;
      if (origP.get('mmp_pid')    === expectedCode &&
          origP.get('utm_source') === expectedCode &&
          origP.get('utm_medium') === 'affiliates') {
        result.affiliateIdFound = true;
        result.mmpPidOk         = true;
        result.utmSourceOk      = true;
        result.utmMediumOk      = true;
        result.convertedUrl     = convertedUrl || originalUrl;
        result.status           = CONVERT_STATUS.ALREADY_AFFILIATE;
        result.isValid          = true;
        result.message          = 'O link já continha seu código de afiliado Shopee.';
        return result;
      }
    } catch (e) {}
    // ID era de outro afiliado → continua para confirmar a substituição
  }

  // 4. Conversão falhou (convertShopeeLink retornou null)
  if (!convertedUrl) {
    result.status  = CONVERT_STATUS.CONVERSION_FAILED;
    result.message = 'Não foi possível converter o link. Formato não suportado.';
    return result;
  }

  // 5. Validar parâmetros no link convertido
  try {
    var cu = new URL(convertedUrl);
    result.mmpPidOk    = cu.searchParams.get('mmp_pid')    === expectedCode;
    result.utmSourceOk = cu.searchParams.get('utm_source') === expectedCode;
    result.utmMediumOk = cu.searchParams.get('utm_medium') === 'affiliates';
    result.afIdPresent = cu.searchParams.has('af_id');

    result.affiliateIdFound =
      result.mmpPidOk && result.utmSourceOk && result.utmMediumOk && !result.afIdPresent;

    if (!result.affiliateIdFound) {
      result.status  = CONVERT_STATUS.ID_NOT_FOUND;
      result.message = 'Falha: o link não está no padrão esperado da Shopee Afiliados.';
      return result;
    }
  } catch (e) {
    result.status  = CONVERT_STATUS.CONVERSION_FAILED;
    result.message = 'O link convertido tem formato inválido.';
    return result;
  }

  // 6. Sucesso
  result.isValid = true;
  result.status  = CONVERT_STATUS.CONVERTED;
  result.message = result.wasAlreadyAffiliate
    ? 'Código de afiliado substituído com sucesso pelo padrão oficial Shopee.'
    : (result.wasWrapped
      ? 'Link Shopee extraído do redirect e convertido com padrão oficial.'
      : 'Link convertido com sucesso para o padrão oficial da Shopee Afiliados.');
  return result;
}

// ─── Helpers ───────────────────────────────────────────────────

function isValidAffiliateId(id) {
  return typeof id === 'string' && id.trim().length >= 3;
}

function formatUrlForDisplay(url, maxLen) {
  if (!url) return '';
  maxLen = maxLen || 50;
  var display = url.replace(/^https?:\/\//, '').replace(/\?.*$/, '');
  return display.length > maxLen ? display.substring(0, maxLen - 1) + '…' : display;
}

function renderUrlWithHighlight(url, affiliateId) {
  if (!url) return '<span class="hl-none">—</span>';
  try {
    var u            = new URL(url);
    var base         = u.origin + u.pathname;
    if (base.length > 52) base = base.substring(0, 49) + '…';
    var expectedCode = AFFILIATE_CODE_PREFIX + affiliateId;

    var parts   = [];
    var isFirst = true;
    u.searchParams.forEach(function (val, key) {
      var sep = isFirst ? '?' : '&';
      isFirst = false;
      if ((key === 'mmp_pid' || key === 'utm_source') && val === expectedCode) {
        parts.push(
          '<span class="hl-sep">' + sep + '</span>' +
          '<span class="hl-key">' + _esc(key) + '=</span>' +
          '<span class="hl-val">' + _esc(val) + '</span>'
        );
      } else if (key === 'utm_medium' && val === 'affiliates') {
        parts.push(
          '<span class="hl-sep">' + sep + '</span>' +
          '<span class="hl-key">utm_medium=</span>' +
          '<span class="hl-val">affiliates</span>'
        );
      } else {
        parts.push(
          '<span class="hl-other">' + sep + _esc(key) + '=' + _esc(val) + '</span>'
        );
      }
    });

    return '<span class="hl-base">' + _esc(base) + '</span>' + parts.join('');
  } catch (e) {
    var safe = String(url).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return safe.length > 70 ? safe.substring(0, 67) + '…' : safe;
  }
}

function _esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── Compatibilidade Node.js ───────────────────────────────────
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AFFILIATE_CODE_PREFIX:  AFFILIATE_CODE_PREFIX,
    SHOPEE_DOMAINS:         SHOPEE_DOMAINS,
    CONVERT_STATUS:         CONVERT_STATUS,
    AFFILIATE_DETECT_PARAMS: AFFILIATE_DETECT_PARAMS,
    PARAMS_TO_CLEAN:        PARAMS_TO_CLEAN,
    REDIRECT_WRAPPERS:      REDIRECT_WRAPPERS,
    unwrapRedirectUrl:      unwrapRedirectUrl,
    detectShopeeDomain:     detectShopeeDomain,
    isShopeeUrl:            isShopeeUrl,
    isAlreadyAffiliateLink: isAlreadyAffiliateLink,
    extractOldAffiliateId:  extractOldAffiliateId,
    extractAffiliateParams: extractAffiliateParams,
    normalizeShopeeUrl:     normalizeShopeeUrl,
    convertShopeeLink:      convertShopeeLink,
    validateConvertedLink:  validateConvertedLink,
    isValidAffiliateId:     isValidAffiliateId,
    formatUrlForDisplay:    formatUrlForDisplay,
    renderUrlWithHighlight: renderUrlWithHighlight,
  };
}

// ============================================================
// SHOPEE AFFILIATE CONVERTER — MÓDULO PRINCIPAL
// Versão: 1.0.0
//
// GUIA DE MANUTENÇÃO FUTURA:
// ─────────────────────────────────────────────────────────
// Se a Shopee mudar o formato dos links de afiliado:
//   1. Altere AFFILIATE_PARAM se mudarem o nome do parâmetro
//   2. Altere convertShopeeLink() se mudarem a estrutura da URL
//   3. Adicione novos domínios em SHOPEE_DOMAINS se necessário
//
// Esta é a ÚNICA fonte de verdade para conversão de links.
// Todo o restante do projeto chama convertShopeeLink().
// ============================================================

/* eslint-disable no-var */

// ─── Configuração ──────────────────────────────────────────────

// Parâmetro de afiliado (altere aqui se a Shopee mudar)
var AFFILIATE_PARAM = 'af_id';

// Domínios reconhecidos como Shopee — lista configurável
var SHOPEE_DOMAINS = [
  'shopee.com.br',
  'shopee.com',
  'br.shp.ee',
  's.shopee.com.br',
  'affiliate.shopee.com.br',
  'shope.ee',
  // Adicione futuros domínios aqui
];

// Parâmetros de rastreamento a remover antes de inserir o afiliado
var PARAMS_TO_CLEAN = [
  'af_id',
  'aff_id',
  'smtt',
  'smttsrc',
  'smtttype',
  'fbclid',
  'gclid',
  '_ga',
];

// ─── Funções Públicas ──────────────────────────────────────────

/**
 * Verifica se uma URL pertence à Shopee.
 * @param {string} url
 * @returns {boolean}
 */
function isShopeeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    var hostname = new URL(url).hostname.toLowerCase();
    return SHOPEE_DOMAINS.some(function (domain) {
      return hostname === domain || hostname.endsWith('.' + domain);
    });
  } catch (e) {
    return false;
  }
}

/**
 * Converte uma URL da Shopee em link de afiliado.
 *
 * PONTO CENTRAL DE MANUTENÇÃO — altere apenas aqui quando a Shopee
 * mudar o formato dos links.
 *
 * @param {string} url - URL original da Shopee
 * @param {string} affiliateId - Seu ID de afiliado Shopee
 * @returns {string|null} URL convertida ou null em caso de erro
 */
function convertShopeeLink(url, affiliateId) {
  if (!url || !affiliateId) return null;
  if (!isShopeeUrl(url)) return null;

  try {
    var urlObj = new URL(url);

    // Remove parâmetros de rastreamento existentes
    PARAMS_TO_CLEAN.forEach(function (param) {
      urlObj.searchParams.delete(param);
    });

    // Insere o ID de afiliado
    // Se a Shopee mudar o parâmetro, altere AFFILIATE_PARAM acima
    urlObj.searchParams.set(AFFILIATE_PARAM, affiliateId);

    return urlObj.toString();
  } catch (e) {
    return null;
  }
}

/**
 * Remove parâmetros de afiliado de uma URL (útil para comparações).
 * @param {string} url
 * @returns {string}
 */
function stripAffiliateParams(url) {
  if (!url) return url;
  try {
    var urlObj = new URL(url);
    PARAMS_TO_CLEAN.forEach(function (param) {
      urlObj.searchParams.delete(param);
    });
    return urlObj.toString();
  } catch (e) {
    return url;
  }
}

/**
 * Extrai IDs de loja e produto de uma URL da Shopee.
 * Padrão: /nome-do-produto-i.{shopId}.{itemId}
 * Para uso futuro: integração com API, conversão em massa, etc.
 * @param {string} url
 * @returns {{shopId: string, itemId: string}|null}
 */
function extractShopeeProductInfo(url) {
  if (!url) return null;
  try {
    var pathname = new URL(url).pathname;
    var match = pathname.match(/-i\.(\d+)\.(\d+)/);
    if (match) return { shopId: match[1], itemId: match[2] };
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Valida se um Affiliate ID tem formato mínimo aceitável.
 * @param {string} id
 * @returns {boolean}
 */
function isValidAffiliateId(id) {
  return typeof id === 'string' && id.trim().length >= 3;
}

/**
 * Formata uma URL para exibição encurtada.
 * @param {string} url
 * @param {number} [maxLen=50]
 * @returns {string}
 */
function formatUrlForDisplay(url, maxLen) {
  if (!url) return '';
  maxLen = maxLen || 50;
  var display = url.replace(/^https?:\/\//, '').replace(/\?.*$/, '');
  return display.length > maxLen ? display.substring(0, maxLen - 1) + '…' : display;
}

// ─── Compatibilidade com módulos Node.js (para testes futuros) ──
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AFFILIATE_PARAM: AFFILIATE_PARAM,
    SHOPEE_DOMAINS: SHOPEE_DOMAINS,
    PARAMS_TO_CLEAN: PARAMS_TO_CLEAN,
    isShopeeUrl: isShopeeUrl,
    convertShopeeLink: convertShopeeLink,
    stripAffiliateParams: stripAffiliateParams,
    extractShopeeProductInfo: extractShopeeProductInfo,
    isValidAffiliateId: isValidAffiliateId,
    formatUrlForDisplay: formatUrlForDisplay,
  };
}

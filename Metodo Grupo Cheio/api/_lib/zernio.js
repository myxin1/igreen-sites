// Cliente mínimo da API do Zernio (https://docs.zernio.com), conferido no
// OpenAPI em 2026-10-05. A chave (ZERNIO_API_KEY) fica só no servidor.
//
// O que roda no próprio Zernio (sem banco aqui):
// - comment-automations trigger "comment": comentário com palavra → DM
//   (+ resposta pública opcional; alsoMatchInDms = a mesma palavra no Direct);
// - comment-automations trigger "story_reply": resposta de story → DM;
// - instagram-ice-breakers: perguntas prontas no primeiro Direct. O toque
//   chega pelo webhook message.received e é respondido em api/webhook.js.

const { createHmac, timingSafeEqual } = require('node:crypto');

const BASE = (process.env.ZERNIO_API_BASE || 'https://zernio.com/api/v1').replace(/\/$/, '');

class ZernioError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.name = 'ZernioError';
    this.status = status;
    this.detail = detail;
  }
}

function isConfigured() {
  return Boolean(process.env.ZERNIO_API_KEY);
}

async function zernio(path, { method = 'GET', body, idempotencyKey } = {}) {
  const key = (process.env.ZERNIO_API_KEY || '').trim();
  if (!key) throw new ZernioError('Zernio não configurado (ZERNIO_API_KEY ausente).', 503, '');
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const text = await res.text();
  if (!res.ok) {
    // Nunca inclui a chave: só status e um trecho do corpo.
    throw new ZernioError(`Zernio respondeu ${res.status}`, res.status, text.slice(0, 300));
  }
  return text ? JSON.parse(text) : {};
}

function str(v) {
  return typeof v === 'string' && v ? v : null;
}

// ---------------------------------------------------------------------
// Conta do Instagram: ZERNIO_ACCOUNT_ID fixa uma; senão procura pelo @
// em ZERNIO_IG_USERNAME (padrão martinksmkt). Nunca cai em "a primeira
// conta", para não responder pela conta errada.
// ---------------------------------------------------------------------

function wantedUsername() {
  return String(process.env.ZERNIO_IG_USERNAME || 'martinksmkt').trim().replace(/^@/, '').toLowerCase();
}

async function getAccount() {
  const data = await zernio('/accounts');
  const list = Array.isArray(data) ? data : data.accounts || data.data || [];
  const accounts = list.map((raw) => {
    const profile = raw.profileId;
    return {
      id: str(raw._id) || str(raw.id) || str(raw.accountId) || '',
      profileId: str(profile) || (profile && typeof profile === 'object' ? str(profile._id) : null),
      platform: (str(raw.platform) || '').toLowerCase(),
      username: str(raw.username) || str(raw.displayName) || str(raw.name),
    };
  });
  const byId = (process.env.ZERNIO_ACCOUNT_ID || '').trim();
  if (byId) return accounts.find((a) => a.id === byId) || null;
  const user = wantedUsername();
  return accounts.find((a) => a.platform === 'instagram' && String(a.username || '').replace(/^@/, '').toLowerCase() === user) || null;
}

async function requireAccount() {
  const account = await getAccount();
  if (!account) {
    throw new ZernioError(`A conta @${wantedUsername()} não está conectada no Zernio.`, 404, '');
  }
  return account;
}

// ---------------------------------------------------------------------
// Comment automations (comentário, story e palavra no Direct)
// ---------------------------------------------------------------------

async function listAutomations(account) {
  const q = account.profileId ? `?profileId=${encodeURIComponent(account.profileId)}` : '';
  const data = await zernio(`/comment-automations${q}`);
  return (data.automations || data.data || []).filter((a) => a.accountId === account.id);
}

async function getAutomation(id) {
  const data = await zernio(`/comment-automations/${encodeURIComponent(id)}`);
  return data.automation || data.data || data;
}

// Garante que a automação é desta conta antes de editar/apagar.
async function getOwnedAutomation(account, id) {
  const automation = await getAutomation(id);
  if (!automation || automation.accountId !== account.id) {
    throw new ZernioError('Automação não encontrada nesta conta.', 404, '');
  }
  return automation;
}

async function createAutomation(account, fields) {
  const data = await zernio('/comment-automations', {
    method: 'POST',
    body: { profileId: account.profileId, accountId: account.id, ...fields },
  });
  return data.automation || data.data || data;
}

async function updateAutomation(id, fields) {
  const data = await zernio(`/comment-automations/${encodeURIComponent(id)}`, { method: 'PATCH', body: fields });
  return data.automation || data.data || data;
}

async function deleteAutomation(id) {
  await zernio(`/comment-automations/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

async function listLogs(id, limit = 50) {
  return zernio(`/comment-automations/${encodeURIComponent(id)}/logs?limit=${limit}`);
}

// ---------------------------------------------------------------------
// Ice breakers (até 4 perguntas, 80 caracteres cada)
// ---------------------------------------------------------------------

async function getIceBreakers(accountId) {
  try {
    const data = await zernio(`/accounts/${encodeURIComponent(accountId)}/instagram-ice-breakers`);
    const raw = data.data || data.ice_breakers || [];
    // A Meta devolve [{ call_to_actions: [{question, payload}], locale }];
    // aceita também a lista já achatada.
    return raw.flatMap((item) => (Array.isArray(item.call_to_actions) ? item.call_to_actions : [item]));
  } catch (err) {
    if (err instanceof ZernioError && err.status === 404) return [];
    throw err;
  }
}

async function setIceBreakers(accountId, items) {
  await zernio(`/accounts/${encodeURIComponent(accountId)}/instagram-ice-breakers`, {
    method: 'PUT',
    body: { ice_breakers: items },
  });
}

async function deleteIceBreakers(accountId) {
  try {
    await zernio(`/accounts/${encodeURIComponent(accountId)}/instagram-ice-breakers`, { method: 'DELETE' });
  } catch (err) {
    if (!(err instanceof ZernioError && err.status === 404)) throw err;
  }
}

// ---------------------------------------------------------------------
// Inbox e webhooks
// ---------------------------------------------------------------------

async function sendMessage({ conversationId, accountId, message, buttons, idempotencyKey }) {
  return zernio(`/inbox/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    idempotencyKey,
    body: { accountId, message, ...(buttons && buttons.length ? { buttons } : {}) },
  });
}

async function listWebhooks() {
  const data = await zernio('/webhooks/settings');
  return Array.isArray(data) ? data : data.webhooks || data.data || [];
}

async function registerWebhook({ url, secret, accountId }) {
  await zernio('/webhooks/settings', {
    method: 'POST',
    body: {
      name: 'Método Grupo Cheio — Instagram',
      url,
      events: ['message.received'],
      secret,
      accountIds: [accountId],
    },
  });
}

// X-Zernio-Signature = hex(HMAC-SHA256(corpo cru, ZERNIO_WEBHOOK_SECRET)).
function verifySignature(rawBody, signature) {
  const secret = (process.env.ZERNIO_WEBHOOK_SECRET || '').trim();
  if (!secret || !signature) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(rawBody).digest('hex'));
  const got = Buffer.from(String(signature).trim().toLowerCase());
  return got.length === expected.length && timingSafeEqual(got, expected);
}

module.exports = {
  ZernioError,
  isConfigured,
  wantedUsername,
  getAccount,
  requireAccount,
  listAutomations,
  getOwnedAutomation,
  createAutomation,
  updateAutomation,
  deleteAutomation,
  listLogs,
  getIceBreakers,
  setIceBreakers,
  deleteIceBreakers,
  sendMessage,
  listWebhooks,
  registerWebhook,
  verifySignature,
};

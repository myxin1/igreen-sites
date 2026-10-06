const { send, readRaw } = require('./_lib/http');
const z = require('./_lib/zernio');
const { decodeIce, ICE_PREFIX } = require('./_lib/model');

// Webhook do Zernio (message.received), registrado pelo painel.
// Só responde o toque numa pergunta pronta; comentário, story e palavra no
// Direct já são respondidos pelo próprio Zernio.
// Aceita apenas chamadas assinadas com ZERNIO_WEBHOOK_SECRET.

function obj(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
}
function s(v) {
  return typeof v === 'string' && v ? v : typeof v === 'number' ? String(v) : null;
}

// Procura um payload nosso em qualquer ponto do metadata/postback.
function findPayload(value, depth = 0) {
  if (depth > 4 || value === null || value === undefined) return null;
  if (typeof value === 'string') return value.startsWith(ICE_PREFIX) ? value : null;
  if (typeof value !== 'object') return null;
  for (const v of Object.values(value)) {
    const found = findPayload(v, depth + 1);
    if (found) return found;
  }
  return null;
}

function normalize(t) {
  return String(t || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function parse(payload) {
  const data = obj(payload.data);
  const message = obj(payload.message || data.message);
  const conversation = obj(payload.conversation || data.conversation);
  const account = obj(payload.account || data.account);
  const metadata = obj(payload.metadata || data.metadata || message.metadata);
  const direction = (s(message.direction) || '').toLowerCase();
  return {
    eventId: s(payload.id) || s(payload.eventId),
    conversationId: s(message.conversationId) || s(conversation.id) || s(conversation._id),
    accountId: s(account.accountId) || s(account.id) || s(account._id) || s(message.accountId),
    platform: (s(message.platform) || s(account.platform) || s(conversation.platform) || '').toLowerCase(),
    text: s(message.text) || s(message.content) || s(message.message) || '',
    outgoing: direction === 'outgoing' || direction === 'outbound' || message.isEcho === true || message.fromMe === true,
    isIceBreakerTap: metadata.iceBreaker !== undefined && metadata.iceBreaker !== null,
    payload: [metadata, message.postback, message.quickReply].map((v) => findPayload(v)).find(Boolean) || null,
  };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Método não permitido.' });

  const raw = await readRaw(req);
  const signature = req.headers['x-zernio-signature'] || req.headers['x-late-signature'];
  if (!z.verifySignature(raw, signature)) return send(res, 401, { error: 'Assinatura inválida.' });

  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return send(res, 400, { error: 'JSON inválido.' });
  }
  if (!body.id && req.headers['x-zernio-event-id']) body.id = req.headers['x-zernio-event-id'];
  if (body.event !== 'message.received') return send(res, 200, { ok: true, ignored: body.event || 'sem evento' });

  try {
    const msg = parse(body);
    if (msg.outgoing || (msg.platform && msg.platform !== 'instagram') || !msg.conversationId || !msg.accountId) {
      return send(res, 200, { ok: true, handled: false });
    }
    if (process.env.ZERNIO_ACCOUNT_ID && msg.accountId !== process.env.ZERNIO_ACCOUNT_ID) {
      return send(res, 200, { ok: true, handled: false, reason: 'outra conta' });
    }

    let answer = decodeIce(msg.payload);

    // Sem payload: se a pessoa tocou numa pergunta (ou digitou igual a uma),
    // procura a resposta nas perguntas publicadas.
    if (!answer && (msg.isIceBreakerTap || (msg.text && msg.text.length <= 80))) {
      const typed = normalize(msg.text);
      if (typed) {
        const items = await z.getIceBreakers(msg.accountId);
        const hit = items.find((i) => normalize(i.question) === typed);
        answer = hit ? decodeIce(hit.payload) : null;
      }
    }
    if (!answer) return send(res, 200, { ok: true, handled: false });

    await z.sendMessage({
      conversationId: msg.conversationId,
      accountId: msg.accountId,
      message: answer.a,
      buttons: answer.u ? [{ type: 'url', title: answer.t || 'Acessar', url: answer.u }] : undefined,
      idempotencyKey: `mgc-ice:${msg.eventId || `${msg.conversationId}:${Date.now()}`}`,
    });
    return send(res, 200, { ok: true, handled: true });
  } catch (err) {
    console.warn('[webhook] falhou:', err && err.message, err && err.detail ? err.detail : '');
    // 200 para o Zernio não reenviar em loop.
    return send(res, 200, { ok: false });
  }
};

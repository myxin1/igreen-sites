// Tradução entre o formulário do painel e os campos do Zernio, com
// validação. Só os campos listados aqui chegam ao Zernio.

const { HttpError } = require('./http');

const TRIGGERS = ['comment', 'story_reply'];

function text(v, max, label, { required = false } = {}) {
  const s = typeof v === 'string' ? v.trim() : '';
  if (required && !s) throw new HttpError(400, `Preencha: ${label}.`);
  if (s.length > max) throw new HttpError(400, `${label}: máximo de ${max} caracteres.`);
  return s;
}

function list(v, maxItems, maxLen, label) {
  const arr = (Array.isArray(v) ? v : [])
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);
  if (arr.length > maxItems) throw new HttpError(400, `${label}: no máximo ${maxItems}.`);
  arr.forEach((s) => {
    if (s.length > maxLen) throw new HttpError(400, `${label}: cada item com no máximo ${maxLen} caracteres.`);
  });
  return arr;
}

function httpsUrl(v, label) {
  const s = typeof v === 'string' ? v.trim() : '';
  if (!s) return '';
  let u;
  try {
    u = new URL(s);
  } catch {
    throw new HttpError(400, `${label}: link inválido.`);
  }
  if (u.protocol !== 'https:') throw new HttpError(400, `${label}: o link precisa começar com https://`);
  return u.toString();
}

function button(input, label) {
  const url = httpsUrl(input.buttonUrl, label);
  if (!url) return [];
  const title = text(input.buttonTitle, 20, 'Texto do botão') || 'Acessar';
  return [{ type: 'url', title, url }];
}

// Formulário → campos do Zernio. Em edição, o gatilho não muda.
function toZernio(input, trigger, { isCreate }) {
  if (!TRIGGERS.includes(trigger)) throw new HttpError(400, 'Gatilho inválido.');
  const isComment = trigger === 'comment';

  const keywords = list(input.keywords, 20, 60, 'Palavras-chave');
  const buttons = button(input, 'Link do botão');
  const dmMessage = text(input.dmMessage, buttons.length ? 640 : 1000, 'Mensagem da DM', { required: true });
  const delay = Math.max(0, Math.min(86400, Math.round(Number(input.dmDelaySeconds) || 0)));

  const fields = {
    name: text(input.name, 80, 'Nome', { required: true }),
    keywords,
    matchMode: 'word',
    typoTolerance: Boolean(input.typoTolerance),
    dmMessage,
    buttons,
    linkTracking: true,
    dmDelaySeconds: delay,
    isActive: input.isActive !== false,
  };

  if (isComment) {
    const replies = list(input.commentReplies, 6, 300, 'Respostas públicas');
    fields.commentReply = replies[0] || '';
    fields.commentReplyVariations = replies.slice(1);
    const alsoDm = Boolean(input.alsoMatchInDms);
    if (alsoDm && !keywords.length) {
      throw new HttpError(400, 'Para responder no Direct, cadastre pelo menos uma palavra-chave.');
    }
    fields.alsoMatchInDms = alsoDm;
  }

  if (input.followOnly) {
    fields.audience = { followerStatus: 'follower', whenUnknown: 'verify' };
    const gate = {
      message: text(input.gateMessage, 640, 'Mensagem para seguir'),
      buttonLabel: text(input.gateButton, 20, 'Botão de confirmação'),
      notFollowingMessage: text(input.gateNotFollowing, 1000, 'Mensagem para quem não segue'),
    };
    Object.keys(gate).forEach((k) => {
      if (!gate[k]) delete gate[k];
    });
    fields.followGate = gate;
  } else if (!isCreate) {
    fields.audience = { followerStatus: 'any', whenUnknown: 'send' }; // limpa a regra
  }

  if (isCreate) fields.trigger = trigger;
  return fields;
}

// Zernio → formato do painel.
function fromZernio(a) {
  const btn = (a.buttons || []).find((b) => b.type === 'url') || {};
  const audience = a.audience || {};
  const gate = a.followGate || {};
  const stats = a.stats || {};
  return {
    id: a.id || a._id,
    name: a.name || '',
    trigger: a.trigger || 'comment',
    keywords: a.keywords || [],
    typoTolerance: Boolean(a.typoTolerance),
    alsoMatchInDms: Boolean(a.alsoMatchInDms),
    dmMessage: a.dmMessage || '',
    buttonTitle: btn.title || '',
    buttonUrl: btn.url || '',
    commentReplies: [a.commentReply, ...(a.commentReplyVariations || [])].filter(Boolean),
    dmDelaySeconds: a.dmDelaySeconds || 0,
    followOnly: audience.followerStatus === 'follower',
    gateMessage: gate.message || '',
    gateButton: gate.buttonLabel || '',
    gateNotFollowing: gate.notFollowingMessage || '',
    isActive: a.isActive !== false,
    stats: {
      triggered: stats.triggered || 0,
      dmsSent: stats.dmsSent || 0,
      dmsFailed: stats.dmsFailed || 0,
      clicks: stats.uniqueClicks || stats.linkClicks || 0,
    },
    createdAt: a.createdAt || null,
  };
}

// ---------------------------------------------------------------------
// Perguntas prontas: a resposta vai codificada no próprio payload do botão
// ("MGC1:" + base64url do JSON). Quando a pessoa toca, a Meta devolve esse
// payload no webhook e respondemos sem precisar de banco.
// ---------------------------------------------------------------------

const ICE_PREFIX = 'MGC1:';
const MAX_PAYLOAD = 1000; // limite de payload de postback da Meta

function encodeIce(item) {
  const payload = ICE_PREFIX + Buffer.from(JSON.stringify(item), 'utf8').toString('base64url');
  if (payload.length > MAX_PAYLOAD) {
    throw new HttpError(400, 'Resposta muito longa para uma pergunta pronta. Encurte o texto.');
  }
  return payload;
}

function decodeIce(payload) {
  if (typeof payload !== 'string' || !payload.startsWith(ICE_PREFIX)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload.slice(ICE_PREFIX.length), 'base64url').toString('utf8'));
    return data && typeof data.a === 'string' ? data : null;
  } catch {
    return null;
  }
}

function iceToZernio(items) {
  const clean = (Array.isArray(items) ? items : []).filter((i) => i && String(i.question || '').trim());
  if (clean.length > 4) throw new HttpError(400, 'No máximo 4 perguntas prontas.');
  return clean.map((i, n) => {
    const question = text(i.question, 80, `Pergunta ${n + 1}`, { required: true });
    const btn = button(i, `Link da pergunta ${n + 1}`);
    const answer = text(i.answer, btn.length ? 640 : 1000, `Resposta da pergunta ${n + 1}`, { required: true });
    const data = { a: answer };
    if (btn.length) {
      data.t = btn[0].title;
      data.u = btn[0].url;
    }
    return { question, payload: encodeIce(data) };
  });
}

function iceFromZernio(items) {
  return items.map((i) => {
    const data = decodeIce(i.payload) || {};
    return {
      question: i.question || '',
      answer: data.a || '',
      buttonTitle: data.t || '',
      buttonUrl: data.u || '',
      managed: Boolean(data.a), // false = criada fora do painel
    };
  });
}

module.exports = { TRIGGERS, toZernio, fromZernio, iceToZernio, iceFromZernio, decodeIce, ICE_PREFIX };

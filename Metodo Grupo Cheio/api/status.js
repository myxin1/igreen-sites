const { send, handler, publicBaseUrl, HttpError } = require('./_lib/http');
const { requireAdmin } = require('./_lib/auth');
const z = require('./_lib/zernio');

// GET: situação da integração. POST: registra o webhook das perguntas prontas.
module.exports = handler(async (req, res) => {
  requireAdmin(req);
  const webhookUrl = `${publicBaseUrl(req)}/api/webhook`;
  const hasSecret = Boolean(process.env.ZERNIO_WEBHOOK_SECRET);

  if (req.method === 'POST') {
    if (!hasSecret) throw new HttpError(503, 'Falta configurar ZERNIO_WEBHOOK_SECRET na Vercel.');
    const account = await z.requireAccount();
    const existing = (await z.listWebhooks()).find((w) => w.url === webhookUrl);
    if (!existing) await z.registerWebhook({ url: webhookUrl, secret: process.env.ZERNIO_WEBHOOK_SECRET, accountId: account.id });
    return send(res, 200, { ok: true });
  }

  if (req.method !== 'GET') throw new HttpError(405, 'Método não permitido.');

  const status = {
    zernio: z.isConfigured(),
    webhookSecret: hasSecret,
    username: z.wantedUsername(),
    account: null,
    webhook: false,
    error: null,
  };
  if (status.zernio) {
    try {
      const account = await z.getAccount();
      status.account = account ? { id: account.id, username: account.username } : null;
      const hooks = await z.listWebhooks();
      status.webhook = hooks.some((w) => w.url === webhookUrl && w.isActive !== false);
    } catch (err) {
      status.error = err.message;
    }
  }
  return send(res, 200, status);
});

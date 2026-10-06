const { send, readJson, handler, HttpError } = require('./_lib/http');
const { requireAdmin } = require('./_lib/auth');
const z = require('./_lib/zernio');
const { toZernio, fromZernio, TRIGGERS } = require('./_lib/model');

// Automações de comentário / story / palavra no Direct (rodam no Zernio).
//   GET                     lista as da conta
//   GET    ?id=..&logs=1    histórico de envios
//   POST                    cria
//   PATCH  ?id=..           edita (ou só { isActive } para ligar/desligar)
//   DELETE ?id=..           apaga
module.exports = handler(async (req, res) => {
  requireAdmin(req);
  const url = new URL(req.url, 'http://x');
  const id = url.searchParams.get('id');
  const account = await z.requireAccount();

  if (req.method === 'GET' && id && url.searchParams.get('logs')) {
    await z.getOwnedAutomation(account, id);
    const data = await z.listLogs(id, 50);
    const logs = (data.logs || []).map((l) => ({
      at: l.createdAt || null,
      source: l.source || 'comment',
      status: l.status,
      name: l.commenterName || null,
      text: l.commentText || null,
      error: l.error || null,
      replyStatus: l.commentReplyStatus || null,
      gate: l.audienceOutcome || null,
    }));
    const misses = data.misses
      ? { total: data.misses.total || 0, days: data.misses.retentionDays || null, samples: (data.misses.samples || []).slice(0, 5) }
      : null;
    return send(res, 200, { logs, misses });
  }

  if (req.method === 'GET') {
    const items = (await z.listAutomations(account)).map(fromZernio);
    items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return send(res, 200, { items });
  }

  if (req.method === 'POST') {
    const input = await readJson(req);
    const trigger = TRIGGERS.includes(input.trigger) ? input.trigger : 'comment';
    const created = await z.createAutomation(account, toZernio(input, trigger, { isCreate: true }));
    return send(res, 201, { item: fromZernio(created) });
  }

  if (!id) throw new HttpError(400, 'Informe o id.');
  const current = await z.getOwnedAutomation(account, id);

  if (req.method === 'PATCH') {
    const input = await readJson(req);
    const onlyToggle = Object.keys(input).length === 1 && typeof input.isActive === 'boolean';
    const fields = onlyToggle ? { isActive: input.isActive } : toZernio(input, current.trigger || 'comment', { isCreate: false });
    const updated = await z.updateAutomation(id, fields);
    return send(res, 200, { item: fromZernio({ ...current, ...fields, ...updated }) });
  }

  if (req.method === 'DELETE') {
    await z.deleteAutomation(id);
    return send(res, 200, { ok: true });
  }

  throw new HttpError(405, 'Método não permitido.');
});

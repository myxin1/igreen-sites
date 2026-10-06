const { send, readJson, handler, HttpError } = require('./_lib/http');
const { requireAdmin } = require('./_lib/auth');
const z = require('./_lib/zernio');
const { iceToZernio, iceFromZernio } = require('./_lib/model');

// Perguntas prontas do Direct.
//   GET     lista    PUT { items: [...] } publica    DELETE remove todas
module.exports = handler(async (req, res) => {
  requireAdmin(req);
  const account = await z.requireAccount();

  if (req.method === 'GET') {
    return send(res, 200, { items: iceFromZernio(await z.getIceBreakers(account.id)) });
  }

  if (req.method === 'PUT') {
    const { items } = await readJson(req);
    const payload = iceToZernio(items);
    if (!payload.length) {
      await z.deleteIceBreakers(account.id);
      return send(res, 200, { items: [] });
    }
    await z.setIceBreakers(account.id, payload);
    return send(res, 200, { items: iceFromZernio(payload) });
  }

  if (req.method === 'DELETE') {
    await z.deleteIceBreakers(account.id);
    return send(res, 200, { items: [] });
  }

  throw new HttpError(405, 'Método não permitido.');
});

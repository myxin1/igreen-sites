const { send, readJson, handler, HttpError } = require('./_lib/http');
const { checkPassword, startSession, endSession, isAuthed } = require('./_lib/auth');

// GET: diz se a sessão é válida. POST: entra. DELETE: sai.
module.exports = handler(async (req, res) => {
  if (req.method === 'GET') return send(res, 200, { authed: isAuthed(req) });

  if (req.method === 'DELETE') {
    endSession(res);
    return send(res, 200, { ok: true });
  }

  if (req.method !== 'POST') throw new HttpError(405, 'Método não permitido.');
  const { password } = await readJson(req);
  if (!checkPassword(password)) {
    // Atraso fixo para encarecer tentativas de força bruta.
    await new Promise((r) => setTimeout(r, 800));
    throw new HttpError(401, 'Senha incorreta.');
  }
  startSession(res);
  return send(res, 200, { ok: true });
});

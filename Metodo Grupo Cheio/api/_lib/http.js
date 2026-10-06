// Helpers HTTP das funções serverless (Vercel, Node).
// Lemos o corpo cru do stream (e não req.body) para o webhook conseguir
// validar a assinatura HMAC sobre os bytes exatos que chegaram.

const MAX_BODY = 1_000_000;

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

function readRaw(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > MAX_BODY) {
        reject(new Error('Corpo muito grande.'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const raw = await readRaw(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'JSON inválido.');
  }
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Envolve um handler: erros conhecidos viram JSON com o status certo e
// nada de stack/chave vaza para o navegador.
function handler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      const isZernio = err && err.name === 'ZernioError';
      let status = 500;
      if (err instanceof HttpError) status = err.status;
      else if (isZernio) {
        // 401/403 do Zernio = chave inválida, não sessão do painel: vira 502.
        status = [400, 404, 409, 422, 429, 503].includes(err.status) ? err.status : 502;
      }
      const message = err instanceof HttpError || isZernio ? err.message : 'Erro interno.';
      if (!(err instanceof HttpError)) console.warn('[admin]', err && err.message, err && err.detail ? err.detail : '');
      send(res, status, { error: message, detail: err && err.detail ? String(err.detail).slice(0, 300) : undefined });
    }
  };
}

function publicBaseUrl(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

module.exports = { send, readRaw, readJson, HttpError, handler, publicBaseUrl };

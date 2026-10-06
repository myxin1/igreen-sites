// Login do painel: uma senha (ADMIN_PASSWORD) e um cookie de sessão
// HttpOnly assinado com HMAC. Sem banco de dados.
// Trocar ADMIN_PASSWORD derruba todas as sessões abertas.

const { createHmac, timingSafeEqual } = require('node:crypto');
const { HttpError } = require('./http');

const COOKIE = 'mgc_admin';
const MAX_AGE = 7 * 24 * 3600; // 7 dias

function secret() {
  const s = process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD;
  if (!s) throw new HttpError(503, 'Painel sem senha configurada (ADMIN_PASSWORD).');
  return `mgc-session:${s}`;
}

function sign(value) {
  return createHmac('sha256', secret()).update(value).digest('hex');
}

function safeEqual(a, b) {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  return A.length === B.length && timingSafeEqual(A, B);
}

function parseCookies(header) {
  const out = {};
  String(header || '')
    .split(';')
    .forEach((part) => {
      const i = part.indexOf('=');
      if (i <= 0) return;
      try {
        out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        /* cookie malformado: ignora */
      }
    });
  return out;
}

function checkPassword(password) {
  const real = (process.env.ADMIN_PASSWORD || '').trim();
  if (!real) throw new HttpError(503, 'Painel sem senha configurada (ADMIN_PASSWORD).');
  // Compara hashes de tamanho fixo para não vazar o tamanho da senha.
  const h = (v) => createHmac('sha256', 'mgc-pw').update(String(v || '')).digest();
  return timingSafeEqual(h(password), h(real));
}

function isAuthed(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE];
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || !safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Date.now();
}

function startSession(res) {
  const exp = String(Date.now() + MAX_AGE * 1000);
  res.setHeader('Set-Cookie', `${COOKIE}=${exp}.${sign(exp)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`);
}

function endSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}

// Toda rota do painel passa por aqui. Escritas exigem o header
// X-MGC-Admin: um site de fora não consegue enviá-lo sem preflight (CORS),
// o que bloqueia CSRF além do SameSite=Strict.
function requireAdmin(req) {
  if (!isAuthed(req)) throw new HttpError(401, 'Sessão expirada. Entre de novo.');
  if (req.method !== 'GET' && req.headers['x-mgc-admin'] !== '1') {
    throw new HttpError(403, 'Requisição recusada.');
  }
}

module.exports = { checkPassword, isAuthed, startSession, endSession, requireAdmin };

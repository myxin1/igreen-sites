import crypto from "node:crypto";

export type DemoUser = {
  id: string;
  name: string;
  username: string;
  role: "owner" | "tester";
  passwordSalt: string;
  passwordHash: string;
};

export type PublicSession = Pick<DemoUser, "id" | "name" | "username" | "role">;

export const sessionCookieName = "fastpost_session";

export const demoUsers: DemoUser[] = [
  {
    id: "user-daniel",
    name: "Daniel",
    username: "Daniel",
    role: "owner",
    passwordSalt: "fastpost-daniel-v1",
    passwordHash: "e5258cdc7cf8f5f104bdf18296c6b8760729c0757380aa73dbbff3614d62e323"
  },
  {
    id: "user-teste",
    name: "Usuario de Testes",
    username: "Teste",
    role: "tester",
    passwordSalt: "fastpost-teste-v1",
    passwordHash: "f2814c6f13dfd8ae87ed7a06a0df5ac5d99ebfefed2b09ea859dfe5dd98045af"
  }
];

export function authenticateUser(input: { username: string; password: string }): PublicSession | null {
  const user = demoUsers.find((item) => item.username.toLowerCase() === input.username.trim().toLowerCase());

  if (!user || !verifyPassword(input.password, user.passwordSalt, user.passwordHash)) {
    return null;
  }

  return publicSessionFor(user);
}

export function publicSessionFor(user: DemoUser): PublicSession {
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role
  };
}

export function createSessionToken(session: PublicSession) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signature = sign(payload);

  return `${payload}.${signature}`;
}

export function parseSessionToken(token?: string): PublicSession | null {
  if (!token) {
    return null;
  }

  const [payload, signature] = token.split(".");

  if (!payload || !signature || !safeEqual(signature, sign(payload))) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PublicSession;
    const knownUser = demoUsers.find((user) => user.id === parsed.id && user.username === parsed.username);

    return knownUser ? publicSessionFor(knownUser) : null;
  } catch {
    return null;
  }
}

function verifyPassword(password: string, salt: string, expectedHash: string) {
  const actualHash = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");

  return safeEqual(actualHash, expectedHash);
}

function sign(payload: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

function getSessionSecret() {
  return process.env.FASTPOST_SESSION_SECRET ?? "fastpost-local-development-secret";
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

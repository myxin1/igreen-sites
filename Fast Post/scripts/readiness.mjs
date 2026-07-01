const required = [
  "FASTPOST_SESSION_SECRET",
  "DATABASE_URL",
  "REDIS_URL",
  "FASTPOST_PUBLIC_BASE_URL",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_BASE_URL",
  "ZERNIO_API_KEY",
  "ZERNIO_WEBHOOK_SECRET"
];

const optional = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM", "SMTP_SECURE"];

function configured(name) {
  return Boolean(process.env[name] && process.env[name].trim());
}

const rows = required.map((name) => ({ name, required: true, configured: configured(name) }));
const optionalRows = optional.map((name) => ({ name, required: false, configured: configured(name) }));
const missing = rows.filter((row) => !row.configured);

console.log("FastPost production readiness");
console.log("");

for (const row of [...rows, ...optionalRows]) {
  const marker = row.configured ? "OK " : row.required ? "MISS" : "SKIP";
  console.log(`${marker} ${row.name}`);
}

console.log("");
console.log(`Webhook URL: ${webhookUrl()}`);
console.log(`R2 cleanup fallback: ${process.env.REDIS_URL ? "Redis + local file fallback" : "local file only"}`);

if (missing.length) {
  console.error("");
  console.error(`Missing required settings: ${missing.map((row) => row.name).join(", ")}`);
  process.exit(1);
}

console.log("");
console.log("Production readiness checks passed.");

function webhookUrl() {
  const appUrl = process.env.FASTPOST_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://127.0.0.1:3000";
  return new URL("/api/webhooks/zernio", appUrl.endsWith("/") ? appUrl : `${appUrl}/`).toString();
}

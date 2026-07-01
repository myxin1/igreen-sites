import { NextResponse } from "next/server";
import { hasConfiguredValue, readLocalSettings } from "@/lib/local-settings";

const requiredForLocal = [
  "FASTPOST_SESSION_SECRET",
  "ZERNIO_API_KEY"
] as const;

const requiredForProduction = [
  "DATABASE_URL",
  "REDIS_URL",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_BASE_URL",
  "ZERNIO_WEBHOOK_SECRET"
] as const;

export async function GET() {
  const settings = readLocalSettings();
  const local = requiredForLocal.map((name) => ({
    name,
    configured: name === "ZERNIO_API_KEY"
      ? Boolean(settings.zernio.globalApiKey || process.env.ZERNIO_API_KEY || Object.values(settings.zernio.profileApiKeys).some(Boolean))
      : hasConfiguredValue(name, settings)
  }));
  const production = requiredForProduction.map((name) => ({
    name,
    configured: hasConfiguredValue(name, settings)
  }));
  const appUrl = process.env.FASTPOST_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || "http://127.0.0.1:3000";
  const webhookUrl = new URL("/api/webhooks/zernio", ensureTrailingSlash(appUrl)).toString();
  const r2Ready = production
    .filter((item) => item.name.startsWith("R2_"))
    .every((item) => item.configured);
  const zernioReady = local.find((item) => item.name === "ZERNIO_API_KEY")?.configured ?? false;
  const webhookSigned = production.find((item) => item.name === "ZERNIO_WEBHOOK_SECRET")?.configured ?? false;
  const productionReady = production.every((item) => item.configured) && zernioReady;

  return NextResponse.json({
    ok: true,
    data: {
      appUrl,
      nodeEnv: process.env.NODE_ENV ?? "development",
      local,
      production,
      readiness: {
        r2Ready,
        zernioReady,
        webhookSigned,
        productionReady
      },
      healthPath: "/api/health",
      zernioAccountsPath: "/api/zernio/accounts",
      webhookUrl,
      cleanup: {
        webhookEvent: "post.published",
        primaryStorageKeySource: "data.storageKey",
        fallbackStorageKeySource: hasConfiguredValue("REDIS_URL", settings) ? "Redis" : "data/zernio-media-map.json",
        fallbackRetentionDays: 14
      }
    }
  });
}

function ensureTrailingSlash(value: string) {
  return value.endsWith("/") ? value : `${value}/`;
}

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

  return NextResponse.json({
    ok: true,
    data: {
      appUrl: process.env.NEXTAUTH_URL ?? "http://127.0.0.1:3000",
      nodeEnv: process.env.NODE_ENV ?? "development",
      local,
      production,
      healthPath: "/api/health",
      zernioAccountsPath: "/api/zernio/accounts"
    }
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  configurableEnvNames,
  publicLocalSettings,
  readLocalSettings,
  writeLocalSettings
} from "@/lib/local-settings";

const envSchema = z.record(z.string(), z.string().max(2000));
const settingsSchema = z.object({
  env: envSchema,
  zernio: z.object({
    mode: z.enum(["global", "profiles"]),
    globalApiKey: z.string().max(2000),
    profileApiKeys: z.record(z.string(), z.string().max(2000))
  }),
  notifications: z.object({
    enabled: z.boolean(),
    email: z.string().max(320),
    onPostSuccess: z.boolean(),
    onAccountDisconnected: z.boolean()
  })
});

export async function GET() {
  return NextResponse.json({
    ok: true,
    data: publicLocalSettings(readLocalSettings())
  });
}

export async function POST(request: Request) {
  const parsed = settingsSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Configuração inválida." }, { status: 400 });
  }

  const current = readLocalSettings();
  const allowedEnv = Object.fromEntries(
    (configurableEnvNames as readonly string[]).map((name) => [
      name,
      parsed.data.env[name] || current.env[name] || ""
    ])
  );
  const profileApiKeys = Object.fromEntries(
    Object.entries(parsed.data.zernio.profileApiKeys).map(([profileId, apiKey]) => [
      profileId,
      apiKey || current.zernio.profileApiKeys[profileId] || ""
    ])
  );

  writeLocalSettings({
    env: allowedEnv,
    zernio: {
      mode: parsed.data.zernio.mode,
      globalApiKey: parsed.data.zernio.globalApiKey || current.zernio.globalApiKey || "",
      profileApiKeys
    },
    notifications: parsed.data.notifications
  });

  return NextResponse.json({
    ok: true,
    data: publicLocalSettings(readLocalSettings())
  });
}

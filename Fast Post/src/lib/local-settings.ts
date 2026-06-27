import fs from "node:fs";
import path from "node:path";

export type ZernioApiMode = "global" | "profiles";

export type LocalSettings = {
  env: Record<string, string>;
  zernio: {
    mode: ZernioApiMode;
    globalApiKey: string;
    profileApiKeys: Record<string, string>;
  };
  notifications: {
    enabled: boolean;
    email: string;
    onPostSuccess: boolean;
    onAccountDisconnected: boolean;
  };
};

export type PublicLocalSettings = {
  env: Record<string, boolean>;
  zernio: {
    mode: ZernioApiMode;
    hasGlobalApiKey: boolean;
    profileApiKeys: Record<string, boolean>;
  };
  notifications: LocalSettings["notifications"];
};

const settingsPath = path.join(process.cwd(), "data", "local-settings.json");

export const configurableEnvNames = [
  "FASTPOST_SESSION_SECRET",
  "DATABASE_URL",
  "REDIS_URL",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_PUBLIC_BASE_URL",
  "ZERNIO_WEBHOOK_SECRET",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM",
  "SMTP_SECURE"
] as const;

export function getConfiguredValue(name: string, settings = readLocalSettings()) {
  return settings.env[name] || process.env[name] || "";
}

export const defaultLocalSettings: LocalSettings = {
  env: {},
  zernio: {
    mode: "global",
    globalApiKey: "",
    profileApiKeys: {}
  },
  notifications: {
    enabled: false,
    email: "",
    onPostSuccess: true,
    onAccountDisconnected: true
  }
};

export function readLocalSettings(): LocalSettings {
  if (!fs.existsSync(settingsPath)) {
    return defaultLocalSettings;
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(settingsPath, "utf8")) as Partial<LocalSettings>;

    return normalizeLocalSettings(parsed);
  } catch {
    return defaultLocalSettings;
  }
}

export function writeLocalSettings(settings: LocalSettings) {
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(normalizeLocalSettings(settings), null, 2));
}

export function publicLocalSettings(settings: LocalSettings): PublicLocalSettings {
  return {
    env: Object.fromEntries(
      configurableEnvNames.map((name) => [name, Boolean(settings.env[name] || process.env[name])])
    ),
    zernio: {
      mode: settings.zernio.mode,
      hasGlobalApiKey: Boolean(settings.zernio.globalApiKey || process.env.ZERNIO_API_KEY),
      profileApiKeys: Object.fromEntries(
        Object.entries(settings.zernio.profileApiKeys).map(([profileId, apiKey]) => [profileId, Boolean(apiKey)])
      )
    },
    notifications: settings.notifications
  };
}

export function resolveZernioApiKey(settings: LocalSettings, profileId?: string) {
  if (settings.zernio.mode === "profiles") {
    return (profileId ? settings.zernio.profileApiKeys[profileId] : "") || process.env.ZERNIO_API_KEY || "";
  }

  return settings.zernio.globalApiKey || process.env.ZERNIO_API_KEY || "";
}

export function hasConfiguredValue(name: string, settings = readLocalSettings()) {
  return Boolean(getConfiguredValue(name, settings));
}

function normalizeLocalSettings(settings: Partial<LocalSettings>): LocalSettings {
  return {
    env: settings.env ?? {},
    zernio: {
      mode: settings.zernio?.mode === "profiles" ? "profiles" : "global",
      globalApiKey: settings.zernio?.globalApiKey ?? "",
      profileApiKeys: settings.zernio?.profileApiKeys ?? {}
    },
    notifications: {
      enabled: settings.notifications?.enabled ?? false,
      email: settings.notifications?.email ?? "",
      onPostSuccess: settings.notifications?.onPostSuccess ?? true,
      onAccountDisconnected: settings.notifications?.onAccountDisconnected ?? true
    }
  };
}

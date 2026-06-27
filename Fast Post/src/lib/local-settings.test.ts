import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultLocalSettings,
  getConfiguredValue,
  hasConfiguredValue,
  publicLocalSettings,
  resolveZernioApiKey,
  type LocalSettings
} from "@/lib/local-settings";

const baseSettings: LocalSettings = {
  ...defaultLocalSettings,
  env: {},
  zernio: {
    mode: "global",
    globalApiKey: "global-key",
    profileApiKeys: {
      "profile-a": "profile-a-key"
    }
  }
};

describe("local settings", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the global Zernio API key when mode is global", () => {
    expect(resolveZernioApiKey(baseSettings, "profile-a")).toBe("global-key");
  });

  it("uses a profile-specific Zernio API key when mode is profiles", () => {
    expect(
      resolveZernioApiKey(
        {
          ...baseSettings,
          zernio: {
            ...baseSettings.zernio,
            mode: "profiles"
          }
        },
        "profile-a"
      )
    ).toBe("profile-a-key");
  });

  it("returns empty when profile mode has no matching key and no env fallback", () => {
    expect(
      resolveZernioApiKey(
        {
          ...defaultLocalSettings,
          env: {},
          zernio: {
            mode: "profiles",
            globalApiKey: "",
            profileApiKeys: {}
          }
        },
        "missing"
      )
    ).toBe("");
  });

  it("falls back to environment values when local values are empty", () => {
    vi.stubEnv("ZERNIO_API_KEY", "env-zernio-key");
    vi.stubEnv("SMTP_HOST", "smtp.example.com");

    expect(resolveZernioApiKey(defaultLocalSettings, "missing")).toBe("env-zernio-key");
    expect(getConfiguredValue("SMTP_HOST", defaultLocalSettings)).toBe("smtp.example.com");
    expect(hasConfiguredValue("SMTP_HOST", defaultLocalSettings)).toBe(true);
  });

  it("prefers local values over environment values", () => {
    vi.stubEnv("SMTP_HOST", "smtp.env.example.com");

    expect(getConfiguredValue("SMTP_HOST", { ...defaultLocalSettings, env: { SMTP_HOST: "smtp.local.example.com" } })).toBe(
      "smtp.local.example.com"
    );
  });

  it("returns public settings without exposing stored secret values", () => {
    vi.stubEnv("ZERNIO_API_KEY", "env-zernio-key");

    expect(
      publicLocalSettings({
        ...baseSettings,
        env: {
          DATABASE_URL: "postgres://user:pass@example.com/db"
        },
        notifications: {
          enabled: true,
          email: "ops@example.com",
          onPostSuccess: false,
          onAccountDisconnected: true
        }
      })
    ).toMatchObject({
      env: {
        DATABASE_URL: true,
        REDIS_URL: false
      },
      zernio: {
        mode: "global",
        hasGlobalApiKey: true,
        profileApiKeys: {
          "profile-a": true
        }
      },
      notifications: {
        enabled: true,
        email: "ops@example.com",
        onPostSuccess: false,
        onAccountDisconnected: true
      }
    });
  });
});

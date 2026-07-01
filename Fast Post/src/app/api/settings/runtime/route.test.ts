import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const originalEnv = { ...process.env };

const mocks = vi.hoisted(() => ({
  readLocalSettings: vi.fn()
}));

vi.mock("@/lib/local-settings", async () => {
  const actual = await vi.importActual<typeof import("@/lib/local-settings")>("@/lib/local-settings");

  return {
    ...actual,
    readLocalSettings: mocks.readLocalSettings
  };
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.clearAllMocks();
});

describe("GET /api/settings/runtime", () => {
  it("returns readiness flags and webhook URL without exposing secrets", async () => {
    process.env.FASTPOST_PUBLIC_BASE_URL = "https://fastpost.example";
    process.env.DATABASE_URL = "postgres://secret";
    process.env.REDIS_URL = "redis://secret";
    process.env.R2_ACCOUNT_ID = "account";
    process.env.R2_ACCESS_KEY_ID = "access";
    process.env.R2_SECRET_ACCESS_KEY = "secret";
    process.env.R2_BUCKET = "bucket";
    process.env.R2_PUBLIC_BASE_URL = "https://media.example";
    process.env.ZERNIO_API_KEY = "sk_secret";
    process.env.ZERNIO_WEBHOOK_SECRET = "whsec_secret";
    mocks.readLocalSettings.mockReturnValue({
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
    });

    const response = await GET();
    const payload = await response.json();

    expect(payload).toMatchObject({
      ok: true,
      data: {
        appUrl: "https://fastpost.example",
        webhookUrl: "https://fastpost.example/api/webhooks/zernio",
        readiness: {
          r2Ready: true,
          zernioReady: true,
          webhookSigned: true,
          productionReady: true
        },
        cleanup: {
          webhookEvent: "post.published",
          fallbackRetentionDays: 14
        }
      }
    });
    expect(JSON.stringify(payload)).not.toContain("sk_secret");
    expect(JSON.stringify(payload)).not.toContain("whsec_secret");
  });
});

import { describe, expect, it } from "vitest";
import { isR2Configured } from "./r2-storage";
import type { LocalSettings } from "./local-settings";

const baseSettings: LocalSettings = {
  env: {
    R2_ACCOUNT_ID: "account",
    R2_ACCESS_KEY_ID: "access",
    R2_SECRET_ACCESS_KEY: "secret",
    R2_BUCKET: "bucket",
    R2_PUBLIC_BASE_URL: "https://media.example.com"
  },
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

describe("R2 storage config", () => {
  it("requires credentials, bucket, and public base URL", () => {
    expect(isR2Configured(baseSettings)).toBe(true);
    expect(
      isR2Configured({
        ...baseSettings,
        env: {
          ...baseSettings.env,
          R2_PUBLIC_BASE_URL: ""
        }
      })
    ).toBe(false);
  });
});

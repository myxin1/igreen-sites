import crypto from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  deleteFromR2: vi.fn(),
  forgetZernioStorageKey: vi.fn(),
  isR2Configured: vi.fn(),
  readLocalSettings: vi.fn(),
  readZernioStorageKey: vi.fn(),
  sendEmailNotification: vi.fn()
}));

vi.mock("@/lib/r2-storage", () => ({
  deleteFromR2: mocks.deleteFromR2,
  isR2Configured: mocks.isR2Configured
}));

vi.mock("@/lib/local-settings", () => ({
  readLocalSettings: mocks.readLocalSettings
}));

vi.mock("@/lib/email-notifications", () => ({
  sendEmailNotification: mocks.sendEmailNotification
}));

vi.mock("@/lib/zernio-media-map", () => ({
  forgetZernioStorageKey: mocks.forgetZernioStorageKey,
  readZernioStorageKey: mocks.readZernioStorageKey
}));

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.ZERNIO_WEBHOOK_SECRET;
});

describe("POST /api/webhooks/zernio", () => {
  it("rejects invalid webhook signatures when a secret is configured", async () => {
    process.env.ZERNIO_WEBHOOK_SECRET = "webhook-secret";

    const response = await POST(
      new Request("http://localhost/api/webhooks/zernio", {
        method: "POST",
        headers: {
          "x-zernio-signature": "sha256=invalid"
        },
        body: JSON.stringify({
          event: "post.published",
          externalId: "zernio-post-one"
        })
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "Invalid webhook signature"
    });
  });

  it("accepts valid webhook signatures", async () => {
    process.env.ZERNIO_WEBHOOK_SECRET = "webhook-secret";
    mocks.isR2Configured.mockReturnValue(true);
    mocks.readLocalSettings.mockReturnValue({
      notifications: {
        enabled: false,
        email: "",
        onPostSuccess: true,
        onAccountDisconnected: true
      }
    });
    const body = JSON.stringify({
      event: "post.published",
      externalId: "zernio-post-signed",
      data: {
        storageKey: "uploads/signed.mp4"
      }
    });
    const signature = crypto.createHmac("sha256", "webhook-secret").update(body).digest("hex");

    const response = await POST(
      new Request("http://localhost/api/webhooks/zernio", {
        method: "POST",
        headers: {
          "x-zernio-signature": `sha256=${signature}`
        },
        body
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      cleanup: "deleted"
    });
    expect(mocks.deleteFromR2).toHaveBeenCalledWith("uploads/signed.mp4");
  });

  it("deletes R2 media when a published webhook includes a storage key", async () => {
    mocks.isR2Configured.mockReturnValue(true);
    mocks.readLocalSettings.mockReturnValue({
      notifications: {
        enabled: false,
        email: "",
        onPostSuccess: true,
        onAccountDisconnected: true
      }
    });

    const response = await POST(
      new Request("http://localhost/api/webhooks/zernio", {
        method: "POST",
        body: JSON.stringify({
          event: "post.published",
          externalId: "zernio-post-one",
          publishedUrl: "https://social.example/post",
          data: {
            storageKey: "uploads/video-one.mp4",
            profileName: "Receitas",
            provider: "instagram"
          }
        })
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      cleanup: "deleted"
    });
    expect(mocks.deleteFromR2).toHaveBeenCalledWith("uploads/video-one.mp4");
    expect(mocks.forgetZernioStorageKey).toHaveBeenCalledWith("zernio-post-one");
    expect(mocks.sendEmailNotification).toHaveBeenCalledOnce();
  });

  it("uses the stored R2 key when the webhook does not include metadata", async () => {
    mocks.isR2Configured.mockReturnValue(true);
    mocks.readZernioStorageKey.mockReturnValue("uploads/from-map.mp4");
    mocks.readLocalSettings.mockReturnValue({
      notifications: {
        enabled: false,
        email: "",
        onPostSuccess: true,
        onAccountDisconnected: true
      }
    });

    const response = await POST(
      new Request("http://localhost/api/webhooks/zernio", {
        method: "POST",
        body: JSON.stringify({
          event: "post.published",
          externalId: "zernio-post-from-map",
          data: {
            profileName: "Receitas"
          }
        })
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      cleanup: "deleted"
    });
    expect(mocks.readZernioStorageKey).toHaveBeenCalledWith("zernio-post-from-map");
    expect(mocks.deleteFromR2).toHaveBeenCalledWith("uploads/from-map.mp4");
    expect(mocks.forgetZernioStorageKey).toHaveBeenCalledWith("zernio-post-from-map");
  });

  it("skips cleanup when no storage key is present", async () => {
    mocks.isR2Configured.mockReturnValue(true);
    mocks.readZernioStorageKey.mockReturnValue(undefined);
    mocks.readLocalSettings.mockReturnValue({
      notifications: {
        enabled: false,
        email: "",
        onPostSuccess: true,
        onAccountDisconnected: true
      }
    });

    const response = await POST(
      new Request("http://localhost/api/webhooks/zernio", {
        method: "POST",
        body: JSON.stringify({
          event: "post.published",
          externalId: "zernio-post-two",
          data: {
            profileName: "Receitas"
          }
        })
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      cleanup: "skipped"
    });
    expect(mocks.deleteFromR2).not.toHaveBeenCalled();
  });
});

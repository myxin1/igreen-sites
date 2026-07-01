import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mocks = vi.hoisted(() => ({
  deleteFromR2: vi.fn(),
  isR2Configured: vi.fn(),
  readLocalSettings: vi.fn(),
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

afterEach(() => {
  vi.clearAllMocks();
  delete process.env.ZERNIO_WEBHOOK_SECRET;
});

describe("POST /api/webhooks/zernio", () => {
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
    expect(mocks.sendEmailNotification).toHaveBeenCalledOnce();
  });

  it("skips cleanup when no storage key is present", async () => {
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

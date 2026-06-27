import { describe, expect, it, vi } from "vitest";
import { shouldSendNotification, sendEmailNotification } from "@/lib/email-notifications";

describe("email notifications", () => {
  it("requires notifications to be enabled and a recipient email", () => {
    expect(shouldSendNotification({ enabled: true, email: "daniel@example.com" })).toBe(true);
    expect(shouldSendNotification({ enabled: false, email: "daniel@example.com" })).toBe(false);
    expect(shouldSendNotification({ enabled: true, email: "" })).toBe(false);
    expect(shouldSendNotification({ enabled: true, email: "invalid" })).toBe(false);
  });

  it("uses dry-run mode when SMTP is not configured", async () => {
    const result = await sendEmailNotification({
      settings: {
        enabled: true,
        email: "daniel@example.com",
        onPostSuccess: true,
        onAccountDisconnected: true
      },
      event: {
        type: "post_success",
        profileName: "Receitas Low Carb",
        message: "Post publicado com sucesso"
      }
    });

    expect(result).toEqual({
      ok: true,
      dryRun: true,
      reason: "SMTP is not configured"
    });
  });

  it("does not send disabled event types", async () => {
    const transport = {
      sendMail: vi.fn()
    };

    const result = await sendEmailNotification({
      settings: {
        enabled: true,
        email: "daniel@example.com",
        onPostSuccess: false,
        onAccountDisconnected: true
      },
      event: {
        type: "post_success",
        profileName: "Receitas Low Carb",
        message: "Post publicado com sucesso"
      },
      transport
    });

    expect(result.ok).toBe(false);
    expect(transport.sendMail).not.toHaveBeenCalled();
  });

  it("sends post success notifications through the provided transport", async () => {
    const transport = {
      sendMail: vi.fn()
    };

    const result = await sendEmailNotification({
      settings: {
        enabled: true,
        email: "daniel@example.com",
        onPostSuccess: true,
        onAccountDisconnected: true
      },
      event: {
        type: "post_success",
        profileName: "Receitas <Low Carb>",
        message: "Post publicado <com sucesso>",
        provider: "Instagram",
        postTitle: "104.mp4",
        publishedUrl: "https://example.com/post?a=1&b=2"
      },
      transport
    });

    expect(result).toEqual({ ok: true, dryRun: false });
    expect(transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "daniel@example.com",
        subject: "FastPost: post publicado em Receitas <Low Carb>",
        text: "Post publicado <com sucesso>\nPerfil: Receitas <Low Carb>\nRede: Instagram\nPost: 104.mp4\nURL: https://example.com/post?a=1&b=2",
        html: expect.stringContaining("Receitas &lt;Low Carb&gt;")
      })
    );
  });

  it("sends account disconnected notifications and escapes provider details", async () => {
    const transport = {
      sendMail: vi.fn()
    };

    const result = await sendEmailNotification({
      settings: {
        enabled: true,
        email: "ops@example.com",
        onPostSuccess: true,
        onAccountDisconnected: true
      },
      event: {
        type: "account_disconnected",
        profileName: "Perfil Principal",
        message: "Reconecte a conta",
        provider: "instagram<script>"
      },
      transport
    });

    expect(result.ok).toBe(true);
    expect(transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "FastPost: conta desconectada em Perfil Principal",
        html: expect.stringContaining("instagram&lt;script&gt;")
      })
    );
  });

  it("does not send account disconnected notifications when that event type is disabled", async () => {
    const transport = {
      sendMail: vi.fn()
    };

    const result = await sendEmailNotification({
      settings: {
        enabled: true,
        email: "ops@example.com",
        onPostSuccess: true,
        onAccountDisconnected: false
      },
      event: {
        type: "account_disconnected",
        profileName: "Perfil Principal",
        message: "Reconecte a conta"
      },
      transport
    });

    expect(result).toEqual({ ok: false, reason: "Account disconnected notifications are disabled" });
    expect(transport.sendMail).not.toHaveBeenCalled();
  });
});

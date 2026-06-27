import nodemailer from "nodemailer";
import { getConfiguredValue, readLocalSettings, type LocalSettings } from "@/lib/local-settings";

export type NotificationSettings = LocalSettings["notifications"];

export type NotificationEvent =
  | {
      type: "post_success";
      profileName: string;
      message: string;
      postTitle?: string;
      publishedUrl?: string;
      provider?: string;
    }
  | {
      type: "account_disconnected";
      profileName: string;
      message: string;
      provider?: string;
    };

type MailTransport = {
  sendMail: (message: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  }) => Promise<unknown> | unknown;
};

export function shouldSendNotification(settings: Pick<NotificationSettings, "enabled" | "email">) {
  return settings.enabled && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email);
}

export async function sendEmailNotification(input: {
  settings: NotificationSettings;
  event: NotificationEvent;
  transport?: MailTransport;
}) {
  if (!shouldSendNotification(input.settings)) {
    return { ok: false, reason: "Notifications are disabled or email is invalid" };
  }

  if (input.event.type === "post_success" && !input.settings.onPostSuccess) {
    return { ok: false, reason: "Post success notifications are disabled" };
  }

  if (input.event.type === "account_disconnected" && !input.settings.onAccountDisconnected) {
    return { ok: false, reason: "Account disconnected notifications are disabled" };
  }

  const transport = input.transport ?? createSmtpTransport();

  if (!transport) {
    return { ok: true, dryRun: true, reason: "SMTP is not configured" };
  }

  await transport.sendMail({
    from: getConfiguredValue("SMTP_FROM") || getConfiguredValue("SMTP_USER") || "FastPost <fastpost@localhost>",
    to: input.settings.email,
    subject: subjectFor(input.event),
    text: textFor(input.event),
    html: htmlFor(input.event)
  });

  return { ok: true, dryRun: false };
}

function createSmtpTransport(): MailTransport | null {
  const settings = readLocalSettings();
  const host = getConfiguredValue("SMTP_HOST", settings);
  const user = getConfiguredValue("SMTP_USER", settings);
  const pass = getConfiguredValue("SMTP_PASS", settings);

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(getConfiguredValue("SMTP_PORT", settings) || 587),
    secure: getConfiguredValue("SMTP_SECURE", settings) === "true",
    auth: {
      user,
      pass
    }
  });
}

function subjectFor(event: NotificationEvent) {
  if (event.type === "post_success") {
    return `FastPost: post publicado em ${event.profileName}`;
  }

  return `FastPost: conta desconectada em ${event.profileName}`;
}

function textFor(event: NotificationEvent) {
  const rows = [event.message, `Perfil: ${event.profileName}`];

  if (event.type === "post_success") {
    if (event.provider) {
      rows.push(`Rede: ${event.provider}`);
    }

    if (event.postTitle) {
      rows.push(`Post: ${event.postTitle}`);
    }

    if (event.publishedUrl) {
      rows.push(`URL: ${event.publishedUrl}`);
    }
  }

  return rows.join("\n");
}

function htmlFor(event: NotificationEvent) {
  const rows = [
    `<p>${escapeHtml(event.message)}</p>`,
    `<p><strong>Perfil:</strong> ${escapeHtml(event.profileName)}</p>`
  ];

  if (event.type === "post_success") {
    if (event.provider) {
      rows.push(`<p><strong>Rede:</strong> ${escapeHtml(event.provider)}</p>`);
    }

    if (event.postTitle) {
      rows.push(`<p><strong>Post:</strong> ${escapeHtml(event.postTitle)}</p>`);
    }

    if (event.publishedUrl) {
      rows.push(`<p><strong>URL:</strong> <a href="${escapeHtml(event.publishedUrl)}">${escapeHtml(event.publishedUrl)}</a></p>`);
    }
  }

  if (event.type === "account_disconnected" && event.provider) {
    rows.push(`<p><strong>Rede:</strong> ${escapeHtml(event.provider)}</p>`);
  }

  return `<div>${rows.join("")}</div>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

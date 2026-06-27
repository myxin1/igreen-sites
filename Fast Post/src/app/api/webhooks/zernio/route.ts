import { NextResponse } from "next/server";
import { zernioWebhookSchema } from "@/lib/api/schemas";
import { sendEmailNotification } from "@/lib/email-notifications";
import { readLocalSettings } from "@/lib/local-settings";

export async function POST(request: Request) {
  const signature = request.headers.get("x-zernio-signature");

  if (process.env.ZERNIO_WEBHOOK_SECRET && !signature) {
    return NextResponse.json({ ok: false, error: "Missing webhook signature" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = zernioWebhookSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const settings = readLocalSettings();

  if (parsed.data.event === "post.published") {
    await sendEmailNotification({
      settings: settings.notifications,
      event: {
        type: "post_success",
        profileName: String(parsed.data.data?.profileName ?? "FastPost"),
        provider: String(parsed.data.data?.provider ?? parsed.data.data?.platform ?? ""),
        postTitle: String(parsed.data.data?.filename ?? parsed.data.data?.postTitle ?? parsed.data.externalId ?? ""),
        message: "Post publicado com sucesso.",
        publishedUrl: parsed.data.publishedUrl
      }
    });
  }

  if (parsed.data.event === "account.expired") {
    await sendEmailNotification({
      settings: settings.notifications,
      event: {
        type: "account_disconnected",
        profileName: String(parsed.data.data?.profileName ?? "FastPost"),
        provider: String(parsed.data.data?.provider ?? ""),
        message: "Uma conta social desconectou ou expirou no perfil."
      }
    });
  }

  return NextResponse.json({
    ok: true,
    processed: true,
    event: parsed.data.event,
    externalId: parsed.data.externalId ?? null
  });
}

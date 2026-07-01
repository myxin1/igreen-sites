import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { zernioWebhookSchema } from "@/lib/api/schemas";
import { sendEmailNotification } from "@/lib/email-notifications";
import { readLocalSettings } from "@/lib/local-settings";
import { deleteFromR2, isR2Configured } from "@/lib/r2-storage";
import { forgetZernioStorageKey, readZernioStorageKeyAsync } from "@/lib/zernio-media-map";

export async function POST(request: Request) {
  const signature = request.headers.get("x-zernio-signature");
  const body = await request.text();
  const webhookSecret = process.env.ZERNIO_WEBHOOK_SECRET;

  if (webhookSecret && !signature) {
    return NextResponse.json({ ok: false, error: "Missing webhook signature" }, { status: 401 });
  }

  if (webhookSecret && !verifyWebhookSignature(body, signature, webhookSecret)) {
    return NextResponse.json({ ok: false, error: "Invalid webhook signature" }, { status: 401 });
  }

  let json: unknown;

  try {
    json = JSON.parse(body);
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalido." }, { status: 400 });
  }

  const parsed = zernioWebhookSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const settings = readLocalSettings();
  let cleanup: "deleted" | "skipped" | "failed" = "skipped";
  let cleanupMessage: string | undefined;

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

    const cleanupResult = await cleanupWebhookMedia({
      storageKey: parsed.data.data?.storageKey,
      zernioPostId: parsed.data.externalId ?? parsed.data.postId
    });
    cleanup = cleanupResult.status;
    cleanupMessage = cleanupResult.message;
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
    externalId: parsed.data.externalId ?? null,
    cleanup,
    cleanupMessage
  });
}

async function cleanupWebhookMedia(input: { storageKey: unknown; zernioPostId: string | undefined }) {
  const storageKey = typeof input.storageKey === "string" ? input.storageKey : await readZernioStorageKeyAsync(input.zernioPostId);

  if (typeof storageKey !== "string" || storageKey.trim().length === 0) {
    return { status: "skipped" as const };
  }

  if (!isR2Configured()) {
    return { status: "skipped" as const };
  }

  try {
    await deleteFromR2(storageKey);
    forgetZernioStorageKey(input.zernioPostId);

    return { status: "deleted" as const };
  } catch (error) {
    return {
      status: "failed" as const,
      message: error instanceof Error ? error.message : "Nao foi possivel excluir a midia do R2."
    };
  }
}

function verifyWebhookSignature(body: string, signature: string | null, secret: string) {
  if (!signature) {
    return false;
  }

  const actual = signature.replace(/^(sha256|v1)=/, "");
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");

  if (!/^[a-f0-9]{64}$/i.test(actual)) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
}

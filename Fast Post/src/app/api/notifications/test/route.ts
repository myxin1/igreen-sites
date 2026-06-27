import { NextResponse } from "next/server";
import { sendEmailNotification } from "@/lib/email-notifications";
import { readLocalSettings } from "@/lib/local-settings";

export async function POST() {
  const settings = readLocalSettings();
  const result = await sendEmailNotification({
    settings: settings.notifications,
    event: {
      type: "post_success",
      profileName: "Teste FastPost",
      message: "Esta é uma notificação de teste do FastPost.",
      publishedUrl: "http://127.0.0.1:3000"
    }
  });

  return NextResponse.json({ ok: result.ok, data: result });
}

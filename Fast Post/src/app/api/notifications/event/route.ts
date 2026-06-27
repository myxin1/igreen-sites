import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmailNotification } from "@/lib/email-notifications";
import { readLocalSettings } from "@/lib/local-settings";

const eventSchema = z.object({
  type: z.enum(["post_success", "account_disconnected"]),
  profileName: z.string().min(1),
  message: z.string().min(1),
  postTitle: z.string().optional(),
  publishedUrl: z.string().url().optional(),
  provider: z.string().optional()
});

export async function POST(request: Request) {
  const parsed = eventSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Evento inválido." }, { status: 400 });
  }

  const result = await sendEmailNotification({
    settings: readLocalSettings().notifications,
    event: parsed.data
  });

  return NextResponse.json({ ok: result.ok, data: result });
}

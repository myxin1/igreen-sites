import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { parseSessionToken, sessionCookieName } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const session = parseSessionToken(cookieStore.get(sessionCookieName)?.value);

  return NextResponse.json({ ok: true, data: session });
}

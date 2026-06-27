import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser, createSessionToken, sessionCookieName } from "@/lib/auth";

const loginSchema = z.object({
  username: z.string().min(1).max(80),
  password: z.string().min(1).max(200)
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Credenciais invalidas." }, { status: 400 });
  }

  const session = authenticateUser(parsed.data);

  if (!session) {
    return NextResponse.json({ ok: false, error: "Usuario ou senha incorretos." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, createSessionToken(session), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });

  return NextResponse.json({ ok: true, data: session });
}

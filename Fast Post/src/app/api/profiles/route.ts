import { NextResponse } from "next/server";
import { profiles } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json({ ok: true, data: profiles });
}

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json(
    {
      ok: true,
      data: {
        id: `profile-${Date.now()}`,
        ...body,
        active: true
      }
    },
    { status: 201 }
  );
}

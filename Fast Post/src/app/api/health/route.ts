import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "fastpost",
    checkedAt: new Date().toISOString()
  });
}

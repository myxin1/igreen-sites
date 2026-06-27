import { NextResponse } from "next/server";
import { profiles } from "@/lib/demo-data";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const profile = profiles.find((item) => item.id === id);

  if (!profile) {
    return NextResponse.json({ ok: false, error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    data: {
      ...profile,
      id: `clone-${Date.now()}`,
      name: `${profile.name} 2`
    }
  });
}

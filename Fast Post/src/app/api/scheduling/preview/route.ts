import { NextResponse } from "next/server";
import { SchedulingEngine } from "@/lib/scheduling-engine";
import { schedulingRequestSchema } from "@/lib/api/schemas";

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = schedulingRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten() }, { status: 400 });
  }

  const preview = new SchedulingEngine().preview(parsed.data);

  return NextResponse.json({ ok: true, data: preview });
}

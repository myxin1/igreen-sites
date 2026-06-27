import { NextResponse } from "next/server";
import { SchedulingEngine } from "@/lib/scheduling-engine";
import { schedulingRequestSchema } from "@/lib/api/schemas";

export async function POST(request: Request) {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalido." }, { status: 400 });
  }

  const parsed = schedulingRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: firstValidationError(parsed.error.flatten()) ?? "Dados de agendamento invalidos.",
        errors: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  try {
    const preview = new SchedulingEngine().preview(parsed.data);

    return NextResponse.json({
      ok: true,
      data: {
        ...preview,
        queueJobs: preview.posts.map((post, index) => ({
          id: `queued-${index + 1}`,
          mediaId: post.mediaId,
          scheduledAt: post.scheduledAt,
          status: "scheduled"
        }))
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Nao foi possivel montar o agendamento."
      },
      { status: 400 }
    );
  }
}

function firstValidationError(errors: { formErrors: string[]; fieldErrors: Record<string, string[] | undefined> }) {
  return errors.formErrors[0] ?? Object.values(errors.fieldErrors).flat()[0];
}

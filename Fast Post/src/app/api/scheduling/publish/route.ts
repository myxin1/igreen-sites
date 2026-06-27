import { NextResponse } from "next/server";
import { publishPostSchema } from "@/lib/api/schemas";
import { readLocalSettings, resolveZernioApiKey } from "@/lib/local-settings";
import { deleteFromR2, isR2Configured } from "@/lib/r2-storage";
import { ZernioService } from "@/lib/zernio.service";

type PublishResult = {
  id: string;
  filename: string;
  status: "published" | "scheduled" | "failed";
  zernioPostId?: string;
  publishedUrl?: string;
  errorMessage?: string;
  cleanup?: "deleted" | "skipped" | "failed";
  cleanupMessage?: string;
};

export async function POST(request: Request) {
  let json: unknown;

  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON invalido." }, { status: 400 });
  }

  const parsed = publishPostSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Dados de publicacao invalidos. Informe uma URL publica para cada midia.",
        errors: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  const apiKey = resolveZernioApiKey(readLocalSettings(), parsed.data.profileId);

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Configure uma API da Zernio global ou direcionada para este perfil em Configuracoes."
      },
      { status: 503 }
    );
  }

  const zernio = new ZernioService(apiKey);
  const now = Date.now();
  const results: PublishResult[] = [];

  for (const post of parsed.data.posts) {
    try {
      const response = await zernio.createPost({
        caption: post.caption,
        mediaUrl: post.mediaUrl,
        scheduledAt: post.scheduledAt,
        destinations: post.destinations
      });
      const external = normalizeZernioPostResponse(response);
      const status = new Date(post.scheduledAt).getTime() <= now ? "published" : "scheduled";
      const cleanup = await cleanupPublishedMedia(post.storageKey, status);

      results.push({
        id: post.id,
        filename: post.filename,
        status,
        zernioPostId: external.id,
        publishedUrl: external.url,
        cleanup: cleanup.status,
        cleanupMessage: cleanup.message
      });
    } catch (error) {
      results.push({
        id: post.id,
        filename: post.filename,
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Falha ao publicar na Zernio."
      });
    }
  }

  const failed = results.filter((result) => result.status === "failed");

  return NextResponse.json(
    {
      ok: failed.length === 0,
      data: { results },
      error: failed.length ? `${failed.length} post(s) falharam na Zernio.` : undefined
    },
    { status: failed.length === results.length ? 502 : failed.length ? 207 : 200 }
  );
}

async function cleanupPublishedMedia(storageKey: string | undefined, status: PublishResult["status"]) {
  if (status !== "published" || !storageKey) {
    return { status: "skipped" as const };
  }

  if (!isR2Configured()) {
    return { status: "skipped" as const };
  }

  try {
    await deleteFromR2(storageKey);

    return { status: "deleted" as const };
  } catch (error) {
    return {
      status: "failed" as const,
      message: error instanceof Error ? error.message : "Nao foi possivel excluir a midia do R2."
    };
  }
}

function normalizeZernioPostResponse(response: unknown) {
  if (!response || typeof response !== "object") {
    return {};
  }

  const record = response as Record<string, unknown>;
  const post = (record.post && typeof record.post === "object" ? record.post : record) as Record<string, unknown>;

  return {
    id: text(post.id) || text(post._id) || text(post.postId),
    url: text(post.publishedUrl) || text(post.url) || text(post.permalink)
  };
}

function text(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

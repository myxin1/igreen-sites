import { NextResponse } from "next/server";
import { readLocalSettings, resolveZernioApiKey } from "@/lib/local-settings";
import { ZernioService } from "@/lib/zernio.service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const profileId = url.searchParams.get("profileId") ?? undefined;
  const apiKey = resolveZernioApiKey(readLocalSettings(), profileId);

  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Configure uma API da Zernio global ou direcionada para este perfil em Configurações."
      },
      { status: 503 }
    );
  }

  try {
    const result = await new ZernioService(apiKey).listAccounts();

    return NextResponse.json({ ok: true, data: result.accounts ?? [] });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Falha ao listar contas na Zernio."
      },
      { status: 502 }
    );
  }
}

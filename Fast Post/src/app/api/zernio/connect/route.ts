import { NextResponse } from "next/server";
import { z } from "zod";
import { readLocalSettings, resolveZernioApiKey } from "@/lib/local-settings";
import { ZernioService } from "@/lib/zernio.service";

const connectSchema = z.object({
  localProfileId: z.string().min(1),
  profileName: z.string().min(1).max(120),
  zernioProfileId: z.string().optional(),
  platform: z.enum(["instagram", "facebook", "tiktok"])
});

export async function POST(request: Request) {
  const parsed = connectSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Dados invalidos." }, { status: 400 });
  }

  const apiKey = resolveZernioApiKey(readLocalSettings(), parsed.data.localProfileId);

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
    const zernio = new ZernioService(apiKey);
    const zernioProfileId =
      parsed.data.zernioProfileId ??
      (await createZernioProfileForLocalProfile(zernio, parsed.data.profileName, parsed.data.localProfileId));

    const result = await zernio.getConnectUrl({
      platform: parsed.data.platform,
      profileId: zernioProfileId
    });
    const authUrl = result.authUrl ?? result.auth_url;

    if (!authUrl) {
      return NextResponse.json({ ok: false, error: "A Zernio nao retornou URL de conexao." }, { status: 502 });
    }

    return NextResponse.json({ ok: true, data: { authUrl, zernioProfileId } });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Falha ao conectar na Zernio."
      },
      { status: 502 }
    );
  }
}

async function createZernioProfileForLocalProfile(zernio: ZernioService, profileName: string, localProfileId: string) {
  try {
    return (
      await zernio.createProfile({
        name: profileName,
        description: "Profile criado pelo FastPost"
      })
    ).profile._id;
  } catch (error) {
    if (!isDuplicateZernioProfileError(error)) {
      throw error;
    }

    const uniqueName = `${profileName.slice(0, 86)} - FastPost ${localProfileId.slice(-8)}`;

    return (
      await zernio.createProfile({
        name: uniqueName,
        description: `Profile criado pelo FastPost para ${profileName}`
      })
    ).profile._id;
  }
}

function isDuplicateZernioProfileError(error: unknown) {
  return error instanceof Error && error.message.includes("A profile with this name already exists");
}

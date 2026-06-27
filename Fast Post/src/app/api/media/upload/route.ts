import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isR2Configured, uploadToR2 } from "@/lib/r2-storage";

const maxUploadBytes = 500 * 1024 * 1024;
const allowedMimeTypes = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export async function POST(request: Request) {
  let form: FormData;

  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Upload invalido." }, { status: 400 });
  }

  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Envie um arquivo no campo file." }, { status: 400 });
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json({ ok: false, error: "Formato de midia nao aceito." }, { status: 415 });
  }

  if (file.size <= 0 || file.size > maxUploadBytes) {
    return NextResponse.json({ ok: false, error: "Arquivo vazio ou acima de 500MB." }, { status: 413 });
  }

  const safeName = safeFilename(file.name);
  const storageKey = `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  if (isR2Configured()) {
    const r2 = await uploadToR2({
      key: `uploads/${storageKey}`,
      body: bytes,
      contentType: file.type
    });

    return NextResponse.json({
      ok: true,
      data: {
        filename: safeName,
        mimeType: file.type,
        size: file.size,
        storageKey: r2.storageKey,
        publicPath: `/${r2.storageKey}`,
        publicUrl: r2.publicUrl,
        storageProvider: "r2",
        externallyReachable: true
      }
    });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const uploadPath = path.join(uploadDir, storageKey);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(uploadPath, bytes);

  const publicPath = `/uploads/${storageKey}`;
  const publicBaseUrl = process.env.FASTPOST_PUBLIC_BASE_URL || new URL(request.url).origin;
  const publicUrl = new URL(publicPath, publicBaseUrl).toString();
  const localhost = publicUrl.includes("localhost") || publicUrl.includes("127.0.0.1");

  return NextResponse.json({
    ok: true,
    data: {
      filename: safeName,
      mimeType: file.type,
      size: file.size,
      storageKey,
      publicPath,
      publicUrl,
      storageProvider: "local",
      externallyReachable: !localhost,
      warning: localhost
        ? "Arquivo salvo no FastPost local. Para a Zernio publicar, use uma URL publica do app ou exponha o localhost por tunnel."
        : undefined
    }
  });
}

function safeFilename(value: string) {
  const parsed = path.parse(value);
  const name = parsed.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const ext = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, "");

  return `${name || "media"}${ext}`;
}

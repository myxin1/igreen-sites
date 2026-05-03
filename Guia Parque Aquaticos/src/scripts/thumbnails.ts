import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import OpenAI from "openai";
import { THUMBNAIL_DEFINITIONS, THUMBNAIL_OUTPUT_DIR } from "../branding/thumbnails.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

async function main(): Promise<void> {
  if (!env.openaiApiKey) {
    throw new Error("Missing required environment variable: OPENAI_API_KEY");
  }

  const client = new OpenAI({ apiKey: env.openaiApiKey });
  const outputDir = resolve(process.cwd(), THUMBNAIL_OUTPUT_DIR);
  await mkdir(outputDir, { recursive: true });

  const manifest: Array<{ key: string; filename: string; prompt: string }> = [];

  for (const definition of THUMBNAIL_DEFINITIONS) {
    logger.info(`Gerando thumbnail ${definition.key} com OpenAI Images API.`);

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: definition.prompt,
      size: "1536x1024",
      quality: "high",
      output_format: "png",
    });

    const imageBase64 = response.data?.[0]?.b64_json;
    if (!imageBase64) {
      throw new Error(`A API nao retornou imagem para ${definition.key}.`);
    }

    const filePath = resolve(outputDir, definition.filename);
    await writeFile(filePath, Buffer.from(imageBase64, "base64"));
    manifest.push({ key: definition.key, filename: definition.filename, prompt: definition.prompt });
    logger.info(`Thumbnail salva em ${filePath}.`);
  }

  await writeFile(
    resolve(outputDir, "thumbnail-manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        model: "gpt-image-1",
        size: "1536x1024",
        total: manifest.length,
        assets: manifest,
      },
      null,
      2,
    ),
    "utf8",
  );

  logger.info(`${manifest.length} thumbnails geradas. Manifesto em ${resolve(outputDir, "thumbnail-manifest.json")}.`);
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

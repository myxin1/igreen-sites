import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import OpenAI from "openai";
import { LOGO_DEFINITIONS, LOGO_OUTPUT_DIR } from "../branding/logo.js";
import { env } from "../config/env.js";
import { updateRoadmapTask } from "../roadmap/service.js";
import { logger } from "../utils/logger.js";

async function main(): Promise<void> {
  if (!env.openaiApiKey) {
    throw new Error("Missing required environment variable: OPENAI_API_KEY");
  }

  const client = new OpenAI({ apiKey: env.openaiApiKey });
  const outputDir = resolve(process.cwd(), LOGO_OUTPUT_DIR);
  await mkdir(outputDir, { recursive: true });

  const manifest: Array<{ key: string; filename: string; prompt: string }> = [];

  for (const definition of LOGO_DEFINITIONS) {
    logger.info(`Gerando logo ${definition.key} com OpenAI Images API.`);

    const response = await client.images.generate({
      model: "gpt-image-1",
      prompt: definition.prompt,
      size: definition.size,
      quality: "high",
      background: "transparent",
      output_format: "png",
    });

    const imageBase64 = response.data?.[0]?.b64_json;
    if (!imageBase64) {
      throw new Error(`A API nao retornou imagem para ${definition.key}.`);
    }

    const filePath = resolve(outputDir, definition.filename);
    await writeFile(filePath, Buffer.from(imageBase64, "base64"));
    manifest.push({
      key: definition.key,
      filename: definition.filename,
      prompt: definition.prompt,
    });
    logger.info(`Logo salva em ${filePath}.`);
  }

  await writeFile(
    resolve(outputDir, "logo-manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        model: "gpt-image-1",
        assets: manifest,
      },
      null,
      2,
    ),
    "utf8",
  );

  await updateRoadmapTask("logo do site", true);
  logger.info(`Manifesto salvo em ${resolve(outputDir, "logo-manifest.json")}.`);
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import OpenAI from "openai";
import { LOGO_OUTPUT_DIR } from "../branding/logo.js";
import { THUMBNAIL_DEFINITIONS, THUMBNAIL_OUTPUT_DIR } from "../branding/thumbnails.js";
import { env } from "../config/env.js";
import { buildHomePageContent } from "../content/home-page.js";
import { logger } from "../utils/logger.js";
import {
  findMediaBySlug,
  setSiteLogo,
  setStaticFrontPage,
  uploadMedia,
  type WPMedia,
} from "../wordpress/media.js";
import { WordPressClient } from "../wordpress/client.js";
import { runSetupAudit } from "../wordpress/plugin-checker.js";
import { upsertPage } from "../wordpress/pages.js";

async function ensureLogoUploaded(): Promise<WPMedia | null> {
  const existing = await findMediaBySlug("logo-primary");
  if (existing) {
    logger.info(`Logo ja existe no WordPress (ID ${existing.id}).`);
    return existing;
  }

  if (env.dryRun) {
    logger.info("[DRY RUN] Pularia upload da logo.");
    return null;
  }

  const logoPath = resolve(process.cwd(), LOGO_OUTPUT_DIR, "logo-primary.png");
  logger.info(`Fazendo upload da logo de ${logoPath}.`);
  return uploadMedia(logoPath, "Guia Parques Aquaticos - Logo", "Guia Parques Aquaticos logo", "logo-primary");
}

async function generateThumbnail(
  client: OpenAI,
  def: (typeof THUMBNAIL_DEFINITIONS)[number],
  outputDir: string,
): Promise<string> {
  logger.info(`Gerando thumbnail "${def.key}" via OpenAI.`);

  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt: def.prompt,
    size: "1024x1024",
    quality: "high",
    output_format: "png",
  });

  const imageBase64 = response.data?.[0]?.b64_json;
  if (!imageBase64) {
    throw new Error(`OpenAI nao retornou imagem para ${def.key}.`);
  }

  const filePath = resolve(outputDir, def.filename);
  await writeFile(filePath, Buffer.from(imageBase64, "base64"));
  logger.info(`Thumbnail salva em ${filePath}.`);
  return filePath;
}

async function ensureThumbnailUploaded(
  openai: OpenAI,
  def: (typeof THUMBNAIL_DEFINITIONS)[number],
  outputDir: string,
): Promise<WPMedia | null> {
  const existing = await findMediaBySlug(def.slug);
  if (existing) {
    logger.info(`Thumbnail "${def.key}" ja existe no WordPress (ID ${existing.id}).`);
    return existing;
  }

  if (env.dryRun) {
    logger.info(`[DRY RUN] Pularia geracao e upload de thumbnail "${def.key}".`);
    return null;
  }

  const filePath = await generateThumbnail(openai, def, outputDir);
  logger.info(`Fazendo upload da thumbnail "${def.key}".`);
  return uploadMedia(filePath, def.key, def.altText, def.slug);
}

async function main(): Promise<void> {
  const client = new WordPressClient();
  const summary = await runSetupAudit(client);
  const publishContext = {
    rankMathWritableFields: summary.rankMathWritableFields,
    flowsWritableFields: summary.flowsWritableFields,
  };

  // 1. Upload logo e setar no site
  const logoMedia = await ensureLogoUploaded();
  if (logoMedia && !env.dryRun) {
    await setSiteLogo(logoMedia.id);
  }

  // 2. Gerar e fazer upload das thumbnails
  if (!env.openaiApiKey) {
    logger.warn("OPENAI_API_KEY nao configurada. Thumbnails serao puladas e a home usara placeholders.");
  }

  const openai = env.openaiApiKey ? new OpenAI({ apiKey: env.openaiApiKey }) : null;
  const thumbDir = resolve(process.cwd(), THUMBNAIL_OUTPUT_DIR);

  if (openai && !env.dryRun) {
    await mkdir(thumbDir, { recursive: true });
  }

  const imageMap = new Map<string, string>();

  for (const def of THUMBNAIL_DEFINITIONS) {
    if (!openai) {
      break;
    }

    const media = await ensureThumbnailUploaded(openai, def, thumbDir);
    if (media) {
      imageMap.set(def.key, media.source_url);
    }
  }

  // 3. Publicar a homepage
  const homeContent = buildHomePageContent(imageMap);
  const homePage = await upsertPage(
    client,
    {
      title: "Inicio",
      slug: "inicio",
      excerpt:
        "Guia completo de parques aquaticos no Brasil com informacoes sobre ingressos, precos e pacotes.",
      content: homeContent,
      metaTitle: "Guia Parques Aquaticos - Ingressos, Precos e Dicas",
      metaDescription:
        "Descubra os melhores parques aquaticos do Brasil. Precos, ingressos, pacotes e dicas para visitar a Aldeia das Aguas Park Resort e outros parques.",
      focusKeyword: "parques aquaticos",
      schemaType: "WebPage",
    },
    publishContext,
  );

  logger.info(`Pagina inicial publicada (ID ${homePage.id}).`);

  // 4. Definir como front page estatica
  if (!env.dryRun) {
    await setStaticFrontPage(homePage.id);
    logger.info("Home configurada como pagina inicial estatica do WordPress.");
  }
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

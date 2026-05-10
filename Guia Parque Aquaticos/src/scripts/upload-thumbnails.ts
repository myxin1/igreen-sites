import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { THUMBNAIL_DEFINITIONS, THUMBNAIL_OUTPUT_DIR } from "../branding/thumbnails.js";
import { env } from "../config/env.js";
import { SILO_PAGES } from "../content/silo.js";
import { logger } from "../utils/logger.js";
import { findMediaBySlug, setFeaturedImage, uploadMedia } from "../wordpress/media.js";
import { WordPressClient } from "../wordpress/client.js";

async function getPostIdBySlug(slug: string): Promise<number | null> {
  const response = await fetch(
    `${env.wordpressUrl}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&per_page=1`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.wordpressUsername}:${env.wordpressAppPassword}`).toString("base64")}`,
      },
    },
  );
  if (!response.ok) return null;
  const posts = (await response.json()) as Array<{ id: number }>;
  return posts[0]?.id ?? null;
}

async function main(): Promise<void> {
  const thumbnailMap = new Map(THUMBNAIL_DEFINITIONS.map((t) => [t.key, t]));
  let uploaded = 0;
  let skipped = 0;
  let missing = 0;

  for (const page of SILO_PAGES) {
    const thumbDef = thumbnailMap.get(page.key);
    if (!thumbDef) continue;

    const localPath = resolve(process.cwd(), THUMBNAIL_OUTPUT_DIR, thumbDef.filename);
    if (!existsSync(localPath)) {
      logger.warn(`Thumbnail nao encontrada: ${thumbDef.filename} — execute npm run thumbnails.`);
      missing++;
      continue;
    }

    const postId = await getPostIdBySlug(page.slug);
    if (!postId) {
      logger.warn(`Post nao encontrado no WordPress: ${page.slug} — execute npm run publish primeiro.`);
      skipped++;
      continue;
    }

    let media = await findMediaBySlug(thumbDef.slug);
    if (!media) {
      media = await uploadMedia(localPath, thumbDef.altText, thumbDef.altText, thumbDef.slug);
      logger.info(`Upload: ${thumbDef.filename} -> media ID ${media.id}.`);
      uploaded++;
    } else {
      logger.info(`Media ja existe: ${thumbDef.slug} (ID ${media.id}).`);
    }

    await setFeaturedImage(postId, media.id);
    logger.info(`Featured image definida: post "${page.slug}" -> media ${media.id}.`);
  }

  logger.info(`Concluido. Uploads: ${uploaded} | Ja existiam: ${skipped} | Sem arquivo local: ${missing}.`);
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

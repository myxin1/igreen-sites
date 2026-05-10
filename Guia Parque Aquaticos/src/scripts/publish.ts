import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { THUMBNAIL_DEFINITIONS, THUMBNAIL_OUTPUT_DIR } from "../branding/thumbnails.js";
import { env } from "../config/env.js";
import { PAGE_PARENT, SILO_PAGES, renderPage } from "../content/silo.js";
import { updateRoadmapTasks } from "../roadmap/service.js";
import { build42FlowsSchemas } from "../seo/schema.js";
import { logger } from "../utils/logger.js";
import { ensureCategory } from "../wordpress/categories.js";
import { WordPressClient } from "../wordpress/client.js";
import { findMediaBySlug, setFeaturedImage, uploadMedia } from "../wordpress/media.js";
import { runSetupAudit } from "../wordpress/plugin-checker.js";
import { retirePostBySlug, upsertPost } from "../wordpress/posts.js";
import { ensureInstitutionalPagesAndNavigation } from "../wordpress/site-shell.js";

async function main(): Promise<void> {
  const client = new WordPressClient();
  const summary = await runSetupAudit(client);
  const aldeiaCategory = await ensureCategory(client, "Aldeia das Aguas", "aldeia-das-aguas");
  const guidesCategory = await ensureCategory(client, "Parques Aquaticos", "parques-aquaticos");

  const thumbnailMap = new Map(THUMBNAIL_DEFINITIONS.map((t) => [t.key, t]));

  for (const page of SILO_PAGES) {
    const rendered = renderPage(page);
    const categories =
      page.key === PAGE_PARENT.key || PAGE_PARENT.children?.includes(page.key)
        ? [aldeiaCategory.id]
        : [guidesCategory.id];

    if (page.key !== page.slug) {
      const retired = await retirePostBySlug(client, page.key);
      if (retired) {
        logger.info(`Post legado aposentado: ${page.key} (ID ${retired.id}).`);
      }
    }

    const published = await upsertPost(
      client,
      {
        title: page.title,
        slug: page.slug,
        excerpt: rendered.excerpt,
        content: rendered.contentHtml,
        categories,
        metaTitle: rendered.metaTitle,
        metaDescription: rendered.metaDescription,
        focusKeyword: rendered.focusKeyword,
        schemaType: rendered.schemaType,
        deliveredBy42Flows: summary.flowsWritableFields.delivered && summary.flowsWritableFields.schemas,
        flowsSchemas: build42FlowsSchemas(rendered),
      },
      {
        rankMathWritableFields: summary.rankMathWritableFields,
        flowsWritableFields: summary.flowsWritableFields,
      },
    );

    // Upload and assign featured image if thumbnail exists locally
    const thumbDef = thumbnailMap.get(page.key);
    if (thumbDef) {
      const localPath = resolve(process.cwd(), THUMBNAIL_OUTPUT_DIR, thumbDef.filename);
      if (existsSync(localPath)) {
        let media = await findMediaBySlug(thumbDef.slug);
        if (!media) {
          media = await uploadMedia(localPath, thumbDef.altText, thumbDef.altText, thumbDef.slug);
          logger.info(`Thumbnail enviada ao WordPress: ${thumbDef.filename} (ID ${media.id}).`);
        }
        await setFeaturedImage(published.id, media.id);
      } else {
        logger.warn(`Thumbnail nao encontrada localmente: ${localPath}. Execute npm run thumbnails primeiro.`);
      }
    }

    logger.info(`Post processado: ${page.slug} (ID ${published.id}).`);
  }

  await ensureInstitutionalPagesAndNavigation(client, {
    rankMathWritableFields: summary.rankMathWritableFields,
    flowsWritableFields: summary.flowsWritableFields,
  });

  if (!env.dryRun) {
    await updateRoadmapTasks({
      "criacao pagina pai": true,
      "criacao paginas filhas": true,
      "interlinking SEO": true,
      "insercao afiliado": true,
      "menus header e rodape": true,
      "institucional em pages": true,
      "widget sidebar do silo": true,
      "ajustes home e sidebar": true,
      "busca no header": true,
      "refino editorial dos artigos": true,
    });
  }
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

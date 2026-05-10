import { SILO_GROUPS, buildHubPageContent } from "../content/hub-pages.js";
import { buildHubPageSchemas } from "../seo/schema.js";
import { logger } from "../utils/logger.js";
import { WordPressClient } from "../wordpress/client.js";
import { runSetupAudit } from "../wordpress/plugin-checker.js";
import { upsertPage } from "../wordpress/pages.js";

async function main(): Promise<void> {
  const client = new WordPressClient();
  const summary = await runSetupAudit(client);
  const publishContext = {
    rankMathWritableFields: summary.rankMathWritableFields,
    flowsWritableFields: summary.flowsWritableFields,
  };

  for (const group of SILO_GROUPS) {
    const content = buildHubPageContent(group);

    const page = await upsertPage(
      client,
      {
        title: group.name,
        slug: group.slug,
        excerpt: group.intro,
        content,
        metaTitle: group.metaTitle,
        metaDescription: group.metaDescription,
        focusKeyword: group.keyword,
        schemaType: "WebPage",
        deliveredBy42Flows: summary.flowsWritableFields.delivered && summary.flowsWritableFields.schemas,
        flowsSchemas: buildHubPageSchemas(group),
      },
      publishContext,
    );

    logger.info(`Hub publicado: ${group.slug} (ID ${page.id}).`);
  }

  logger.info("Todos os hub pages publicados.");
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

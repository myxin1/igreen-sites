import { PAGE_PARENT, renderAllPages } from "../content/silo.js";
import { env } from "../config/env.js";
import { updateRoadmapTasks } from "../roadmap/service.js";
import { build42FlowsSchemas } from "../seo/schema.js";
import { logger } from "../utils/logger.js";
import { ensureCategory } from "../wordpress/categories.js";
import { WordPressClient } from "../wordpress/client.js";
import { runSetupAudit } from "../wordpress/plugin-checker.js";
import { upsertPost } from "../wordpress/posts.js";

async function pageContainsSchema(path: string, marker: string): Promise<boolean> {
  const response = await fetch(`${env.wordpressUrl}${path}`);
  if (!response.ok) {
    return false;
  }

  const html = await response.text();
  return html.includes(marker);
}

async function main(): Promise<void> {
  const client = new WordPressClient();
  const summary = await runSetupAudit(client);
  const aldeiaCategory = await ensureCategory(client, "Aldeia das Aguas", "aldeia-das-aguas");
  const guidesCategory = await ensureCategory(client, "Parques Aquaticos", "parques-aquaticos");

  if (!summary.rankMathMetaWritable) {
    if (
      summary.rankMathWritableFields.title &&
      summary.rankMathWritableFields.description &&
      summary.rankMathWritableFields.focusKeyword
    ) {
      logger.warn(
        "Os campos principais do Rank Math estao prontos via REST, mas o schema type ainda nao esta exposto. Vou aplicar title, description e focus keyword mesmo assim.",
      );
    } else {
      logger.warn(
        "Os campos do Rank Math ainda nao estao expostos o suficiente via REST. Instale o plugin em wordpress-bridge/rank-math-rest-bridge.php e rode novamente.",
      );
      await updateRoadmapTasks({
        "configuracao rankmath": false,
        "validacao SEO": false,
      });
      return;
    }
  }

  for (const page of renderAllPages()) {
    const categories =
      page.definition.key === PAGE_PARENT.key ||
      PAGE_PARENT.children?.includes(page.definition.key)
        ? [aldeiaCategory.id]
        : [guidesCategory.id];
    await upsertPost(
      client,
      {
        title: page.definition.title,
        slug: page.definition.slug,
        excerpt: page.excerpt,
        content: page.contentHtml,
        categories,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        focusKeyword: page.focusKeyword,
        schemaType: page.schemaType,
        deliveredBy42Flows: summary.flowsWritableFields.delivered && summary.flowsWritableFields.schemas,
        flowsSchemas: build42FlowsSchemas(page),
      },
      {
        rankMathWritableFields: summary.rankMathWritableFields,
        flowsWritableFields: summary.flowsWritableFields,
      },
    );
    logger.info(`SEO reaplicado para ${page.definition.slug}.`);
  }

  const articleValidated = await pageContainsSchema("/aldeia-das-aguas/", "\"@type\":\"Article\"");
  const faqValidated = await pageContainsSchema("/preco/", "\"@type\":\"FAQPage\"");
  const seoValidated =
    summary.rankMathMetaWritable &&
    (summary.rankMathWritableFields.schemaType || summary.schemaAutomationWritable) &&
    articleValidated &&
    faqValidated;

  logger.info(`Validacao Article no front-end: ${articleValidated}`);
  logger.info(`Validacao FAQPage no front-end: ${faqValidated}`);

  if (!env.dryRun) {
    await updateRoadmapTasks({
      "configuracao rankmath":
        summary.rankMathMetaWritable &&
        (summary.rankMathWritableFields.schemaType || summary.schemaAutomationWritable),
      "validacao SEO": seoValidated,
    });
  }
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

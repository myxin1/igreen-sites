import { PAGE_PARENT, renderPage, SILO_PAGES } from "../content/silo.js";
import { updateRoadmapTasks } from "../roadmap/service.js";
import { build42FlowsSchemas } from "../seo/schema.js";
import { logger } from "../utils/logger.js";
import { ensureCategory } from "../wordpress/categories.js";
import { WordPressClient } from "../wordpress/client.js";
import { upsertPost } from "../wordpress/posts.js";
import { runSetupAudit } from "../wordpress/plugin-checker.js";
import { ensureInstitutionalPagesAndNavigation } from "../wordpress/site-shell.js";
import type { WordPressPageRecord } from "../wordpress/types.js";

const PAGE_SLUGS_TO_RETIRE = [
  "aldeia-das-aguas",
  "preco",
  "ingresso",
  "desconto",
  "day-use",
  "pacote",
  "hotel",
  "onde-ficar",
  "airbnb",
  "onde-fica",
  "como-chegar",
  "endereco",
  "telefone",
  "vale-a-pena",
  "dicas",
  "melhor-dia",
  "parques-aquaticos-rj",
  "melhores-parques-aquaticos-brasil",
  "o-que-fazer-barra-do-pirai",
  "contato",
];

async function findPageBySlug(
  client: WordPressClient,
  slug: string,
): Promise<WordPressPageRecord | null> {
  const pages = await client.request<WordPressPageRecord[]>("wp/v2/pages", {
    query: { slug, context: "edit", per_page: 100, status: "publish,draft,private,pending" },
  });
  return pages[0] ?? null;
}

async function retirePage(client: WordPressClient, slug: string): Promise<void> {
  const page = await findPageBySlug(client, slug);
  if (!page) {
    return;
  }

  const legacySlug = `legacy-${slug}-${page.id}`;
  await client.request(`wp/v2/pages/${page.id}`, {
    method: "POST",
    body: {
      status: "draft",
      slug: legacySlug,
    },
    expectedStatus: [200],
  });
  logger.info(`Pagina ${slug} aposentada como rascunho (${legacySlug}).`);
}

async function main(): Promise<void> {
  const client = new WordPressClient();
  const summary = await runSetupAudit(client);

  const aldeiaCategory = await ensureCategory(client, "Aldeia das Aguas", "aldeia-das-aguas");
  const guidesCategory = await ensureCategory(client, "Parques Aquaticos", "parques-aquaticos");
  for (const slug of PAGE_SLUGS_TO_RETIRE) {
    await retirePage(client, slug);
  }

  for (const definition of SILO_PAGES) {
    const rendered = renderPage(definition);
    const categories =
      definition.key === PAGE_PARENT.key || PAGE_PARENT.children?.includes(definition.key)
        ? [aldeiaCategory.id]
        : [guidesCategory.id];

    const post = await upsertPost(
      client,
      {
        title: definition.title,
        slug: definition.slug,
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

    logger.info(`Post processado: ${definition.slug} (ID ${post.id}).`);
  }
  await ensureInstitutionalPagesAndNavigation(client, {
    rankMathWritableFields: summary.rankMathWritableFields,
    flowsWritableFields: summary.flowsWritableFields,
  });

  await updateRoadmapTasks({
    "migracao pages para posts": true,
    "categorias do silo": true,
    "menus header e rodape": true,
    "institucional em pages": true,
    "widget sidebar do silo": true,
  });
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

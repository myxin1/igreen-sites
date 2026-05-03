import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { WordPressClient } from "../wordpress/client.js";
import { findCategoryBySlug } from "../wordpress/categories.js";

const CATEGORIES_TO_NOINDEX = [
  { name: "Aldeia das Aguas", slug: "aldeia-das-aguas" },
  { name: "Parques Aquaticos", slug: "parques-aquaticos" },
];

async function setCategoryNoindex(client: WordPressClient, id: number, name: string): Promise<void> {
  if (env.dryRun) {
    logger.info(`[DRY RUN] Aplicaria noindex na categoria "${name}" (ID ${id}).`);
    return;
  }

  await client.request(`wp/v2/categories/${id}`, {
    method: "POST",
    body: {
      meta: {
        rank_math_robots: ["noindex"],
      },
    },
    expectedStatus: [200],
  });

  logger.info(`Noindex aplicado na categoria "${name}" (ID ${id}).`);
}

async function main(): Promise<void> {
  const client = new WordPressClient();

  for (const cat of CATEGORIES_TO_NOINDEX) {
    const existing = await findCategoryBySlug(client, cat.slug);
    if (!existing) {
      logger.warn(`Categoria "${cat.slug}" nao encontrada — pulando.`);
      continue;
    }
    await setCategoryNoindex(client, existing.id, cat.name);
  }

  logger.info("Noindex aplicado em todas as categorias de arquivo.");
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

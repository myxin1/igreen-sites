import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { WordPressClient } from "./client.js";

export interface WordPressCategory {
  id: number;
  slug: string;
  name: string;
  parent: number;
}

export async function findCategoryBySlug(
  client: WordPressClient,
  slug: string,
): Promise<WordPressCategory | null> {
  const categories = await client.request<WordPressCategory[]>("wp/v2/categories", {
    query: {
      slug,
      per_page: 50,
    },
  });

  return categories[0] ?? null;
}

export async function ensureCategory(
  client: WordPressClient,
  name: string,
  slug: string,
  parent = 0,
): Promise<WordPressCategory> {
  const existing = await findCategoryBySlug(client, slug);
  if (existing) {
    return existing;
  }

  if (env.dryRun) {
    logger.info(`[DRY RUN] Criaria categoria ${slug}.`);
    return { id: 0, slug, name, parent };
  }

  return client.request<WordPressCategory>("wp/v2/categories", {
    method: "POST",
    body: {
      name,
      slug,
      parent,
    },
    expectedStatus: [201],
  });
}

import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import type { WordPressPageRecord } from "./types.js";
import { WordPressClient } from "./client.js";

export interface PostPublishContext {
  rankMathWritableFields: {
    title: boolean;
    description: boolean;
    focusKeyword: boolean;
    schemaType: boolean;
  };
  flowsWritableFields?: {
    delivered: boolean;
    schemas: boolean;
  };
}

export interface PostPayload {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  categories?: number[];
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  schemaType?: string;
  deliveredBy42Flows?: boolean;
  flowsSchemas?: unknown[];
}

export async function findPostBySlug(
  client: WordPressClient,
  slug: string,
): Promise<WordPressPageRecord | null> {
  const posts = await client.request<WordPressPageRecord[]>("wp/v2/posts", {
    query: {
      slug,
      context: "edit",
      per_page: 50,
      status: "publish,draft,future,pending,private",
    },
  });

  return posts[0] ?? null;
}

export async function retirePostBySlug(
  client: WordPressClient,
  slug: string,
): Promise<WordPressPageRecord | null> {
  const existing = await findPostBySlug(client, slug);
  if (!existing) {
    return null;
  }

  if (env.dryRun) {
    logger.info(`[DRY RUN] Aposentaria post legado ${slug}.`);
    return existing;
  }

  return client.request<WordPressPageRecord>(`wp/v2/posts/${existing.id}`, {
    method: "POST",
    body: {
      status: "draft",
      slug: `legacy-${slug}-${existing.id}`,
    },
    expectedStatus: [200],
  });
}

export async function upsertPost(
  client: WordPressClient,
  payload: PostPayload,
  publishContext: PostPublishContext,
): Promise<WordPressPageRecord> {
  const existing = await findPostBySlug(client, payload.slug);

  const body: Record<string, unknown> = {
    title: payload.title,
    slug: payload.slug,
    status: "publish",
    excerpt: payload.excerpt,
    content: payload.content,
    categories: payload.categories ?? [],
  };

  const meta: Record<string, unknown> = {};
  if (publishContext.rankMathWritableFields.title) {
    meta.rank_math_title = payload.metaTitle;
  }
  if (publishContext.rankMathWritableFields.description) {
    meta.rank_math_description = payload.metaDescription;
  }
  if (publishContext.rankMathWritableFields.focusKeyword) {
    meta.rank_math_focus_keyword = payload.focusKeyword;
  }
  if (publishContext.rankMathWritableFields.schemaType && payload.schemaType) {
    meta.rank_math_schema_type = payload.schemaType;
  }
  if (publishContext.flowsWritableFields?.delivered && payload.deliveredBy42Flows) {
    meta._42flows_delivered = "1";
  }
  if (publishContext.flowsWritableFields?.schemas && payload.flowsSchemas?.length) {
    meta._42flows_schemas = JSON.stringify(payload.flowsSchemas);
  }

  if (Object.keys(meta).length > 0) {
    body.meta = meta;
  }

  if (env.dryRun) {
    logger.info(`[DRY RUN] ${existing ? "Atualizaria" : "Criaria"} post ${payload.slug}.`);
    return (
      existing ?? {
        id: 0,
        slug: payload.slug,
        status: "draft",
        parent: 0,
        title: { rendered: payload.title },
        content: { rendered: payload.content },
      }
    );
  }

  if (existing) {
    return client.request<WordPressPageRecord>(`wp/v2/posts/${existing.id}`, {
      method: "POST",
      body,
      expectedStatus: [200],
    });
  }

  return client.request<WordPressPageRecord>("wp/v2/posts", {
    method: "POST",
    body,
    expectedStatus: [201],
  });
}

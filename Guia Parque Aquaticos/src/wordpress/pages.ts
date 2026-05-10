import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import type { WordPressPageRecord } from "./types.js";
import { WordPressClient } from "./client.js";

export interface PublishContext {
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

export interface PublishedPageMap {
  byKey: Map<string, WordPressPageRecord>;
}

export interface PagePayload {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  parent?: number;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  schemaType?: string;
  deliveredBy42Flows?: boolean;
  flowsSchemas?: unknown[];
}

export async function findPageBySlug(
  client: WordPressClient,
  slug: string,
): Promise<WordPressPageRecord | null> {
  const pages = await client.request<WordPressPageRecord[]>("wp/v2/pages", {
    query: {
      slug,
      context: "edit",
      per_page: 50,
      status: "publish,draft,future,pending,private",
    },
  });

  return pages[0] ?? null;
}

export async function upsertPage(
  client: WordPressClient,
  payload: PagePayload,
  publishContext: PublishContext,
): Promise<WordPressPageRecord> {
  const existing = await findPageBySlug(client, payload.slug);

  const body: Record<string, unknown> = {
    title: payload.title,
    slug: payload.slug,
    status: "publish",
    parent: payload.parent ?? 0,
    excerpt: payload.excerpt,
    content: payload.content,
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
    logger.info(
      `[DRY RUN] ${existing ? "Atualizaria" : "Criaria"} pagina ${payload.slug} com parent ${payload.parent ?? 0}.`,
    );

    return (
      existing ?? {
        id: 0,
        slug: payload.slug,
        status: "draft",
        parent: payload.parent ?? 0,
        title: { rendered: payload.title },
        content: { rendered: payload.content },
      }
    );
  }

  if (existing) {
    return client.request<WordPressPageRecord>(`wp/v2/pages/${existing.id}`, {
      method: "POST",
      body,
      expectedStatus: [200],
    });
  }

  return client.request<WordPressPageRecord>("wp/v2/pages", {
    method: "POST",
    body,
    expectedStatus: [201],
  });
}

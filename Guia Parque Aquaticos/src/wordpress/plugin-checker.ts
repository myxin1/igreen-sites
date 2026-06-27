import { OPTIONAL_PLUGINS, REQUIRED_PLUGINS, REQUIRED_THEME } from "../config/site.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import type { ApiRoot, WordPressPlugin, WordPressTheme } from "./types.js";
import { WordPressClient } from "./client.js";

export interface SetupSummary {
  restReady: boolean;
  applicationPasswordsAvailable: boolean;
  pluginsEndpointAvailable: boolean;
  themesEndpointAvailable: boolean;
  rankMathMetaWritable: boolean;
  schemaAutomationWritable: boolean;
  rankMathWritableFields: {
    title: boolean;
    description: boolean;
    focusKeyword: boolean;
    schemaType: boolean;
  };
  flowsWritableFields: {
    delivered: boolean;
    schemas: boolean;
  };
  plugins: Array<{ name: string; slug: string; status: string }>;
  themeMessage: string;
  contactForm7RestRoute: boolean;
}

const RANK_MATH_META_KEYS = {
  title: "rank_math_title",
  description: "rank_math_description",
  focusKeyword: "rank_math_focus_keyword",
  schemaType: "rank_math_schema_type",
} as const;

const FLOWS_META_KEYS = {
  delivered: "_42flows_delivered",
  schemas: "_42flows_schemas",
} as const;

function pluginFileFromSlug(slug: string): string {
  return `${slug}/${slug}`;
}

function getRankMathFieldSupport(input: unknown) {
  const serialized = JSON.stringify(input);
  return {
    title: serialized.includes(RANK_MATH_META_KEYS.title),
    description: serialized.includes(RANK_MATH_META_KEYS.description),
    focusKeyword: serialized.includes(RANK_MATH_META_KEYS.focusKeyword),
    schemaType: serialized.includes(RANK_MATH_META_KEYS.schemaType),
  };
}

function get42FlowsFieldSupport(input: unknown) {
  const serialized = JSON.stringify(input);
  return {
    delivered: serialized.includes(FLOWS_META_KEYS.delivered),
    schemas: serialized.includes(FLOWS_META_KEYS.schemas),
  };
}

function readRenderedText(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }

  if (input && typeof input === "object" && "rendered" in input) {
    const rendered = (input as { rendered?: unknown }).rendered;
    if (typeof rendered === "string") {
      return rendered.replace(/<[^>]+>/g, "").trim();
    }
  }

  return String(input);
}

async function readRankMathFieldSupport(client: WordPressClient) {
  const schema = await client.request<Record<string, unknown>>("wp/v2/posts", {
    method: "OPTIONS",
    expectedStatus: [200],
  });

  return getRankMathFieldSupport(schema);
}

async function read42FlowsFieldSupport(client: WordPressClient) {
  const schema = await client.request<Record<string, unknown>>("wp/v2/posts", {
    method: "OPTIONS",
    expectedStatus: [200],
  });

  return get42FlowsFieldSupport(schema);
}

export async function runSetupAudit(client: WordPressClient): Promise<SetupSummary> {
  logger.info(`Setup running in ${env.dryRun ? "DRY RUN" : "LIVE"} mode.`);

  const root = await client.request<ApiRoot>("/", { expectedStatus: [200] });
  const restReady = Boolean(root.routes);
  const applicationPasswordsAvailable = Boolean(
    root.authentication?.["application-passwords"],
  );
  const pluginsEndpointAvailable = Boolean(root.routes?.["/wp/v2/plugins"]);
  const themesEndpointAvailable = Boolean(root.routes?.["/wp/v2/themes"]);
  const contactForm7RestRoute = Boolean(
    root.routes?.["/contact-form-7/v1/contact-forms"] ||
      root.routes?.["/contact-form-7/v1/contact-forms/(?P<id>[\\d]+)"],
  );

  const plugins: Array<{ name: string; slug: string; status: string }> = [];

  if (pluginsEndpointAvailable) {
    const currentPlugins =
      (await client.maybeRequest<WordPressPlugin[]>("wp/v2/plugins", {
        query: { context: "edit" },
        expectedStatus: [200],
      })) ?? [];

    for (const required of REQUIRED_PLUGINS) {
      const plugin =
        currentPlugins.find((item) => item.plugin.startsWith(pluginFileFromSlug(required.slug))) ??
        currentPlugins.find((item) => item.plugin.startsWith(required.slug));

      if (!plugin) {
        if (env.dryRun) {
          logger.info(`[DRY RUN] Instalaria plugin ${required.name} (${required.slug}).`);
          plugins.push({ name: required.name, slug: required.slug, status: "missing" });
          continue;
        }

        const installed = await client.maybeRequest<WordPressPlugin>("wp/v2/plugins", {
          method: "POST",
          body: { slug: required.slug, status: "active" },
          expectedStatus: [201],
        });

        plugins.push({
          name: required.name,
          slug: required.slug,
          status: installed?.status ?? "missing",
        });
        continue;
      }

      if (plugin.status !== "active" && !env.dryRun) {
        const activated = await client.maybeRequest<WordPressPlugin>(
          `wp/v2/plugins/${encodeURIComponent(plugin.plugin.replace(/\.php$/, ""))}`,
          {
            method: "POST",
            body: { status: "active" },
            expectedStatus: [200],
          },
        );

        plugins.push({
          name: required.name,
          slug: required.slug,
          status: activated?.status ?? plugin.status,
        });
        continue;
      }

      plugins.push({
        name: required.name,
        slug: required.slug,
        status: plugin.status,
      });
    }

    const rankMathPlugin = plugins.find((plugin) => plugin.slug === "seo-by-rank-math");
    const bridgeInstalled = currentPlugins.some(
      (item) => item.plugin.startsWith(`${OPTIONAL_PLUGINS.rankMathRestBridge.slug}/`) ||
        item.plugin.startsWith(OPTIONAL_PLUGINS.rankMathRestBridge.slug),
    );

    if (rankMathPlugin?.status === "active" && !bridgeInstalled) {
      const currentSupport = await readRankMathFieldSupport(client);
      const coreFieldsReady =
        currentSupport.title && currentSupport.description && currentSupport.focusKeyword;

      if (!coreFieldsReady) {
        if (env.dryRun) {
          logger.info(
            `[DRY RUN] Instalaria plugin auxiliar ${OPTIONAL_PLUGINS.rankMathRestBridge.name} (${OPTIONAL_PLUGINS.rankMathRestBridge.slug}).`,
          );
        } else {
          await client.maybeRequest<WordPressPlugin>("wp/v2/plugins", {
            method: "POST",
            body: {
              slug: OPTIONAL_PLUGINS.rankMathRestBridge.slug,
              status: "active",
            },
            expectedStatus: [201],
          });
        }
      }
    }
  } else {
    for (const required of REQUIRED_PLUGINS) {
      plugins.push({ name: required.name, slug: required.slug, status: "manual-check" });
    }
  }

  let rankMathWritableFields = await readRankMathFieldSupport(client);
  let flowsWritableFields = await read42FlowsFieldSupport(client);

  if (
    !rankMathWritableFields.schemaType &&
    !(flowsWritableFields.delivered && flowsWritableFields.schemas) &&
    root.routes?.["/42flows/v1/install-companion"]
  ) {
    if (env.dryRun) {
      logger.info("[DRY RUN] Instalaria o companion plugin do 42flows para habilitar schema renderizado.");
    } else {
      await client.maybeRequest("42flows/v1/install-companion", {
        method: "POST",
        body: {},
        expectedStatus: [200],
      });
      rankMathWritableFields = await readRankMathFieldSupport(client);
      flowsWritableFields = await read42FlowsFieldSupport(client);
    }
  }

  let themeMessage = "Nao foi possivel verificar o tema pela REST API.";
  if (themesEndpointAvailable) {
    const themes = await client.maybeRequest<WordPressTheme[]>("wp/v2/themes", {
      query: { status: "active" },
      expectedStatus: [200],
    });
    const activeTheme = themes?.[0];
    if (!activeTheme) {
      themeMessage = "Nenhum tema ativo retornado pela API (ou sem permissao).";
    } else if (activeTheme.stylesheet === REQUIRED_THEME) {
      themeMessage = `Tema ativo confirmado: ${readRenderedText(activeTheme.name)} (${activeTheme.stylesheet}).`;
    } else {
      themeMessage = `Tema ativo encontrado: ${readRenderedText(activeTheme.name)} (${activeTheme.stylesheet}). Instale/ative GeneratePress manualmente.`;
    }
  }

  const rankMathMetaWritable =
    rankMathWritableFields.title &&
    rankMathWritableFields.description &&
    rankMathWritableFields.focusKeyword;
  const schemaAutomationWritable =
    rankMathWritableFields.schemaType ||
    (flowsWritableFields.delivered && flowsWritableFields.schemas);

  return {
    restReady,
    applicationPasswordsAvailable,
    pluginsEndpointAvailable,
    themesEndpointAvailable,
    rankMathMetaWritable,
    schemaAutomationWritable,
    rankMathWritableFields,
    flowsWritableFields,
    plugins,
    themeMessage,
    contactForm7RestRoute,
  };
}

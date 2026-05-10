import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { basename, extname, resolve } from "node:path";
import { ABOUT_POST, CONTACT_POST, PRIVACY_POST, TERMS_POST } from "../content/institutional.js";
import {
  HEADER_SEARCH_MARKER,
  HOME_SHOWCASE_MARKER,
  SIDEBAR_AFFILIATE_BANNER_MARKER,
  SILO_SIDEBAR_MARKER,
  buildAffiliateBannerWidgetContent,
  buildHeaderSearchBlockContent,
  buildSiloSidebarBlockContent,
} from "../content/silo/sidebar.js";
import { env } from "../config/env.js";
import { buildInstitutionalArticleSchema } from "../seo/schema.js";
import { logger } from "../utils/logger.js";
import { WordPressClient } from "./client.js";
import { ensureContactForm } from "./contact-form.js";
import { findMediaBySlug, uploadMedia } from "./media.js";
import {
  appendBlockWidget,
  assignMenuLocations,
  clearMenu,
  createPageMenuItem,
  createPostMenuItem,
  deleteWidget,
  ensureBlockWidget,
  ensureMenu,
  listSidebars,
  listWidgets,
  removeBlockWidgetsByText,
} from "./menus.js";
import { findPageBySlug, type PublishContext, upsertPage } from "./pages.js";
import { findPostBySlug } from "./posts.js";

const HEADER_ITEMS = [
  { slug: "aldeia-das-aguas", title: "Aldeia das Águas", object: "post" as const },
  { slug: "contato", title: "Contato", object: "page" as const },
  { slug: "sobre", title: "Sobre", object: "page" as const },
] as const;

const FOOTER_ITEMS = [
  {
    slug: "politica-de-privacidade",
    title: "Política de Privacidade",
    object: "page" as const,
  },
  { slug: "termos-de-uso", title: "Termos de Uso", object: "page" as const },
  { slug: "contato", title: "Contato", object: "page" as const },
] as const;

const INSTITUTIONAL_POST_SLUGS = ["sobre", "contato", "politica-de-privacidade", "termos-de-uso"];
const SILO_SIDEBAR_TARGET = "sidebar-1";
const HOME_SHOWCASE_TARGET = "header";
const HEADER_SEARCH_TARGET = "header";
const SIDEBAR_BANNER_DIRS = [
  resolve(process.cwd(), "output"),
  resolve(process.cwd(), "output", "branding"),
];
const SIDEBAR_BANNER_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function pickFooterSidebar(sidebars: Awaited<ReturnType<typeof listSidebars>>): string | null {
  return (
    sidebars.find((sidebar) => sidebar.id === "footer-1")?.id ??
    sidebars.find((sidebar) => sidebar.id === "footer-bar")?.id ??
    sidebars.find((sidebar) => sidebar.id.startsWith("footer-"))?.id ??
    null
  );
}

async function retireInstitutionalPosts(client: WordPressClient): Promise<void> {
  for (const slug of INSTITUTIONAL_POST_SLUGS) {
    const post = await findPostBySlug(client, slug);
    if (!post) {
      continue;
    }

    if (env.dryRun) {
      logger.info(`[DRY RUN] Aposentaria o post institucional ${slug} para criar a page equivalente.`);
      continue;
    }

    await client.request(`wp/v2/posts/${post.id}`, {
      method: "POST",
      body: {
        status: "draft",
        slug: `legacy-post-${slug}-${post.id}`,
      },
      expectedStatus: [200],
    });
    logger.info(`Post institucional ${slug} aposentado para liberar a URL em pages.`);
  }
}

async function findMenuObjectId(
  client: WordPressClient,
  slug: string,
  object: "post" | "page",
): Promise<number> {
  if (object === "post") {
    const post = await findPostBySlug(client, slug);
    if (!post) {
      throw new Error(`Nao foi possivel localizar o post ${slug} para o menu.`);
    }
    return post.id;
  }

  const page = await findPageBySlug(client, slug);
  if (!page) {
    throw new Error(`Nao foi possivel localizar a page ${slug} para o menu.`);
  }

  return page.id;
}

async function purgeSidebarWidgets(
  client: WordPressClient,
  sidebar: string,
  keepMarkers: string[],
): Promise<void> {
  const widgets = await listWidgets(client, sidebar);
  const toDelete = widgets.filter((widget) => {
    if (widget.id_base !== "block") return true;
    const content = widget.instance?.raw?.content;
    if (typeof content !== "string") return true;
    return !keepMarkers.some((m) => content.includes(m));
  });
  for (const widget of toDelete) {
    if (!env.dryRun) {
      await deleteWidget(client, widget.id);
    }
    logger.info(`Widget removido de ${sidebar}: ${widget.id} (${widget.id_base}).`);
  }
}

function collectSidebarBannerPaths(): string[] {
  const matches = new Set<string>();
  const preferredMatches = new Set<string>();

  for (const directory of SIDEBAR_BANNER_DIRS) {
    if (!existsSync(directory)) {
      continue;
    }

    for (const entry of readdirSync(directory)) {
      const extension = extname(entry).toLowerCase();
      const name = basename(entry, extension).toLowerCase();
      const isPreferredBanner = /^img[\s_-]*3$/.test(name);
      const isLegacyBanner = name === "ingressos";
      const filePath = resolve(directory, entry);

      if (!SIDEBAR_BANNER_EXTENSIONS.has(extension)) {
        continue;
      }

      if (isPreferredBanner) {
        preferredMatches.add(filePath);
      }

      if (isLegacyBanner) {
        matches.add(filePath);
      }
    }
  }

  if (preferredMatches.size > 0) {
    return [...preferredMatches].sort((left, right) => left.localeCompare(right));
  }

  return [...matches].sort((left, right) => left.localeCompare(right));
}

function sidebarBannerSlug(filePath: string): string {
  const extension = extname(filePath);
  const fileSlug = basename(filePath, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const contentHash = createHash("sha1").update(readFileSync(filePath)).digest("hex").slice(0, 10);
  return `sidebar-banner-aldeia-${fileSlug}-${contentHash}`;
}

async function ensureSidebarBannerUrls(): Promise<string[]> {
  const bannerPaths = collectSidebarBannerPaths();
  if (bannerPaths.length === 0) {
    logger.warn(`Nenhuma imagem de banner elegivel encontrada em ${SIDEBAR_BANNER_DIRS.join(" ou ")}.`);
    return [];
  }

  const uploadedUrls: string[] = [];

  for (const bannerPath of bannerPaths) {
    const slug = sidebarBannerSlug(bannerPath);
    const existing = await findMediaBySlug(slug);
    if (existing) {
      uploadedUrls.push(existing.source_url);
      continue;
    }

    if (env.dryRun) {
      logger.info(`[DRY RUN] Enviaria o banner lateral ${bannerPath}.`);
      continue;
    }

    const uploaded = await uploadMedia(
      bannerPath,
      "Banner lateral de ingressos da Aldeia das Águas",
      "Banner lateral de ingressos da Aldeia das Águas",
      slug,
    );
    logger.info(`Banner lateral enviado ao WordPress (ID ${uploaded.id}) a partir de ${basename(bannerPath)}.`);
    uploadedUrls.push(uploaded.source_url);
  }

  if (uploadedUrls.length > 0) {
    logger.info(`${uploadedUrls.length} banner lateral fixo pronto para o widget final.`);
  }

  return uploadedUrls;
}

export async function ensureInstitutionalPagesAndNavigation(
  client: WordPressClient,
  publishContext: PublishContext,
): Promise<void> {
  await retireInstitutionalPosts(client);

  const shortcode = (await ensureContactForm(client)) ?? `[contact-form-7 id="8" title="Contact form 1"]`;
  const institutionalPages = [ABOUT_POST, PRIVACY_POST, TERMS_POST, CONTACT_POST(shortcode)];

  for (const item of institutionalPages) {
    const page = await upsertPage(
      client,
      {
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        content: item.content,
        metaTitle: item.metaTitle,
        metaDescription: item.metaDescription,
        focusKeyword: item.focusKeyword,
        schemaType: "Article",
        deliveredBy42Flows:
          publishContext.flowsWritableFields?.delivered &&
          publishContext.flowsWritableFields?.schemas,
        flowsSchemas: buildInstitutionalArticleSchema({
          title: item.metaTitle,
          description: item.metaDescription,
          slug: item.slug,
          keyword: item.focusKeyword,
        }),
      },
      publishContext,
    );

    logger.info(`Pagina institucional processada: ${item.slug} (ID ${page.id}).`);
  }

  const headerMenu = await ensureMenu(client, "HEADER", "header");
  const footerMenu = await ensureMenu(client, "RODAPE", "rodape");

  await clearMenu(client, headerMenu.id);
  await clearMenu(client, footerMenu.id);

  for (const [index, item] of HEADER_ITEMS.entries()) {
    const objectId = await findMenuObjectId(client, item.slug, item.object);
    if (item.object === "post") {
      await createPostMenuItem(client, headerMenu.id, objectId, item.title, index + 1);
    } else {
      await createPageMenuItem(client, headerMenu.id, objectId, item.title, index + 1);
    }
  }

  for (const [index, item] of FOOTER_ITEMS.entries()) {
    const objectId = await findMenuObjectId(client, item.slug, item.object);
    await createPageMenuItem(client, footerMenu.id, objectId, item.title, index + 1);
  }

  await assignMenuLocations(client, headerMenu.id, ["primary"]);

  const sidebars = await listSidebars(client);
  const footerSidebar = pickFooterSidebar(sidebars);
  if (!footerSidebar) {
    logger.warn("Nenhuma area de footer compativel foi encontrada para publicar o menu RODAPE.");
  } else {
    const footerWidgets = await listWidgets(client, footerSidebar);
    for (const widget of footerWidgets) {
      if (widget.id_base === "nav_menu") {
        await deleteWidget(client, widget.id);
      }
    }
    logger.info(`Widgets duplicados de menu removidos de ${footerSidebar}; footer estilizado permanece como fonte unica.`);
  }

  const sidebarExists = sidebars.some((sidebar) => sidebar.id === SILO_SIDEBAR_TARGET);
  if (!sidebarExists) {
    logger.warn(`Sidebar ${SILO_SIDEBAR_TARGET} nao encontrada para publicar o widget do silo.`);
    return;
  }

  await purgeSidebarWidgets(client, SILO_SIDEBAR_TARGET, [
    SILO_SIDEBAR_MARKER,
    SIDEBAR_AFFILIATE_BANNER_MARKER,
  ]);

  await ensureBlockWidget(
    client,
    SILO_SIDEBAR_TARGET,
    buildSiloSidebarBlockContent(),
    SILO_SIDEBAR_MARKER,
  );
  logger.info(`Widget do silo publicado em ${SILO_SIDEBAR_TARGET}.`);

  const sidebarBannerUrls = await ensureSidebarBannerUrls();
  const activeBannerUrl = sidebarBannerUrls.at(0);
  if (activeBannerUrl) {
    await appendBlockWidget(
      client,
      SILO_SIDEBAR_TARGET,
      buildAffiliateBannerWidgetContent([activeBannerUrl]),
      SIDEBAR_AFFILIATE_BANNER_MARKER,
    );
    logger.info(`Banner publicado em ${SILO_SIDEBAR_TARGET}: ${activeBannerUrl}`);
  }

  const homeShowcaseExists = sidebars.some((sidebar) => sidebar.id === HOME_SHOWCASE_TARGET);
  if (!homeShowcaseExists) {
    logger.warn(
      `Area ${HOME_SHOWCASE_TARGET} nao encontrada para remover o destaque temporario da home.`,
    );
    return;
  }

  await removeBlockWidgetsByText(client, HOME_SHOWCASE_TARGET, [HOME_SHOWCASE_MARKER]);
  logger.info(`Destaque temporario da home removido de ${HOME_SHOWCASE_TARGET}.`);

  const headerSearchExists = sidebars.some((sidebar) => sidebar.id === HEADER_SEARCH_TARGET);
  if (!headerSearchExists) {
    logger.warn(
      `Area ${HEADER_SEARCH_TARGET} nao encontrada para publicar a busca no cabecalho.`,
    );
    return;
  }

  await removeBlockWidgetsByText(client, HEADER_SEARCH_TARGET, ["<!-- wp:search"]);
  await ensureBlockWidget(
    client,
    HEADER_SEARCH_TARGET,
    buildHeaderSearchBlockContent(),
    HEADER_SEARCH_MARKER,
  );
  logger.info(`Busca publicada em ${HEADER_SEARCH_TARGET}.`);
}

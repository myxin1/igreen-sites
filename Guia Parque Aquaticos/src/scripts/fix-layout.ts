import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { WordPressClient } from "../wordpress/client.js";
import {
  assignMenuLocations,
  ensureBlockWidget,
  ensureMenu,
  listSidebars,
  listWidgets,
  deleteWidget,
} from "../wordpress/menus.js";

const LOGO_CSS_MARKER = "gpq-logo-fix";
const FOOTER_CARD_MARKER = "gpq-footer-card";

const CURRENT_YEAR = new Date().getFullYear();
const SITE_DOMAIN = "guiaparquesaquaticos.com";

function logoFixBlock(): string {
  return [
    "<!-- wp:html -->",
    `<style>
/* gpq-logo-fix */

/* Logo */
.site-logo img,
.custom-logo,
.custom-logo-link img {
  max-height: 80px !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain;
}

/* Oculta nome/tagline do site ao lado da logo — seletores GeneratePress */
#masthead .site-branding .site-title,
#masthead .site-branding .site-description,
#masthead .site-branding-text,
.site-header .site-branding-text,
header .site-branding-text,
.site-branding .site-title,
.site-branding .site-description,
.site-title,
.site-description {
  display: none !important;
  visibility: hidden !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
}

/* Oculta "Built with GeneratePress" */
.site-info,
#colophon .site-info,
.powered-by {
  display: none !important;
}

/* Separador acima do footer */
.site-footer,
#colophon {
  border-top: 2px solid #cfe5df;
  padding-top: 28px !important;
}

@media (max-width: 768px) {
  .custom-logo,
  .custom-logo-link img {
    max-height: 56px !important;
  }
}
</style>`,
    "<!-- /wp:html -->",
  ].join("\n");
}

function footerNavBlock(): string {
  const navItems = [
    { href: "/politica-de-privacidade/", label: "Politica de Privacidade" },
    { href: "/termos-de-uso/", label: "Termos de Uso" },
    { href: "/contato/", label: "Contato" },
    { href: "/sobre/", label: "Sobre" },
  ];

  const listItems = navItems
    .map((item) => `<li><a href="${item.href}">${item.label}</a></li>`)
    .join("");

  return [
    "<!-- wp:html -->",
    `<style>
/* gpq-footer-card */
.gpq-footer-nav {
  background: linear-gradient(180deg, #f7fcfb 0%, #eef7f5 100%);
  border: 1px solid #cfe5df;
  border-radius: 18px;
  padding: 20px 24px;
  box-shadow: 0 10px 26px rgba(16,68,60,.08);
  text-align: center;
}
.gpq-footer-nav ul {
  list-style: none;
  padding: 0;
  margin: 0 0 14px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0;
}
.gpq-footer-nav li {
  display: flex;
  align-items: center;
}
.gpq-footer-nav li + li::before {
  content: "★";
  color: #ff8a00;
  font-size: 10px;
  margin: 0 10px;
  flex-shrink: 0;
  line-height: 1;
}
.gpq-footer-nav a {
  color: #14574d;
  font-size: .875rem;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: color .2s ease;
}
.gpq-footer-nav a:hover {
  color: #0f4f46;
  text-decoration: underline;
}
.gpq-footer-copy {
  font-size: .8rem;
  color: #7a9e98;
  margin: 0;
  line-height: 1.5;
}
@media (max-width: 520px) {
  .gpq-footer-nav ul {
    flex-direction: column;
    gap: 10px;
  }
  .gpq-footer-nav li + li::before {
    display: none;
  }
}
</style>
<div class="gpq-footer-nav">
  <ul>${listItems}</ul>
  <p class="gpq-footer-copy">&copy; ${CURRENT_YEAR} ${SITE_DOMAIN}</p>
</div>`,
    "<!-- /wp:html -->",
  ].join("\n");
}

async function fixHeader(client: WordPressClient): Promise<void> {
  const headerMenu = await ensureMenu(client, "HEADER", "header");
  await assignMenuLocations(client, headerMenu.id, ["primary"]);
  logger.info(`Menu HEADER reassigned to primary (ID ${headerMenu.id}).`);

  const sidebars = await listSidebars(client);
  if (!sidebars.some((s) => s.id === "header")) {
    logger.warn("Area 'header' nao encontrada. Pulando CSS do logo.");
    return;
  }

  await ensureBlockWidget(client, "header", logoFixBlock(), LOGO_CSS_MARKER);
  logger.info("CSS de logo injetado na area header.");
}

async function fixFooter(client: WordPressClient): Promise<void> {
  const sidebars = await listSidebars(client);
  const footerId =
    sidebars.find((s) => s.id === "footer-1")?.id ??
    sidebars.find((s) => s.id === "footer-bar")?.id ??
    sidebars.find((s) => s.id.startsWith("footer-"))?.id;

  if (!footerId) {
    logger.warn("Nenhuma area de footer encontrada.");
    return;
  }

  if (!env.dryRun) {
    const existing = await listWidgets(client, footerId);
    for (const widget of existing) {
      await deleteWidget(client, widget.id);
    }
    await client.request(`wp/v2/sidebars/${footerId}`, {
      method: "POST",
      body: { widgets: [] },
      expectedStatus: [200],
    });
  } else {
    logger.info(`[DRY RUN] Limparia widgets de ${footerId}.`);
  }

  await ensureBlockWidget(client, footerId, footerNavBlock(), FOOTER_CARD_MARKER);
  logger.info(`Footer nav publicado em ${footerId}.`);
}

async function main(): Promise<void> {
  const client = new WordPressClient();
  await fixHeader(client);
  await fixFooter(client);
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

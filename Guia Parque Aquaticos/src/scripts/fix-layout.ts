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

/**
 * CSS global injetado no header via widget — serve como tentativa.
 * O CSS real e definitivo fica no footer widget (que sabemos que renderiza).
 */
function logoFixBlock(): string {
  return [
    "<!-- wp:html -->",
    `<style>/* gpq-logo-fix */</style>`,
    "<!-- /wp:html -->",
  ].join("\n");
}

/**
 * Footer widget: contém TODO o CSS global + o nav card.
 * O widget footer-1 renderiza <style> corretamente.
 */
function footerNavBlock(): string {
  const navItems = [
    { href: "/politica-de-privacidade/", label: "Politica de Privacidade" },
    { href: "/termos-de-uso/", label: "Termos de Uso" },
    { href: "/contato/", label: "Contato" },
    { href: "/sobre/", label: "Sobre" },
  ];

  const listItems = navItems
    .map((item, i) =>
      (i > 0 ? `<li class="gpq-sep" aria-hidden="true">★</li>` : "") +
      `<li><a href="${item.href}">${item.label}</a></li>`,
    )
    .join("");

  return [
    "<!-- wp:html -->",
    `<style>
/* gpq-footer-card — CSS global + footer */

/* ── Ocultar nome/tagline do site ao lado da logo ── */
.site-title,
.site-title a,
p.site-title,
h1.site-title,
.site-description,
.site-branding-text,
.site-branding-text *,
#masthead .site-branding-text,
#masthead .site-title,
#masthead .site-description,
header .site-branding-text {
  display: none !important;
  visibility: hidden !important;
  width: 0 !important;
  height: 0 !important;
  overflow: hidden !important;
  opacity: 0 !important;
}

/* ── Logo maior ── */
.site-logo img,
.custom-logo,
.custom-logo-link img {
  max-height: 100px !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain;
}
@media (max-width: 768px) {
  .custom-logo,
  .custom-logo-link img {
    max-height: 60px !important;
  }
}

/* ── Ocultar "Built with GeneratePress" ── */
.site-info,
#colophon .site-info,
.site-info-text,
.powered-by {
  display: none !important;
}

/* ── Linha separadora acima do footer ── */
.site-footer,
#colophon {
  border-top: 2px solid #cfe5df !important;
  padding-top: 28px !important;
}

/* ── Força footer-widget-1 a ocupar 100% da largura ── */
.footer-widget-1 {
  width: 100% !important;
  max-width: 100% !important;
  flex: 0 0 100% !important;
}
.footer-widget-2,
.footer-widget-3,
.footer-widget-4 {
  display: none !important;
}

/* ── Footer nav card ── */
.gpq-footer-nav {
  background: linear-gradient(180deg, #f7fcfb 0%, #eef7f5 100%);
  border: 1px solid #cfe5df;
  border-radius: 18px;
  padding: 16px 24px;
  box-shadow: 0 10px 26px rgba(16,68,60,.08);
  width: 100%;
  box-sizing: border-box;
  margin: 0 auto;
}
.gpq-footer-nav ul {
  list-style: none !important;
  padding: 0 !important;
  margin: 0 0 10px !important;
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 0 !important;
}
.gpq-footer-nav li {
  display: flex !important;
  align-items: center !important;
  white-space: nowrap;
  margin: 0 !important;
  padding: 0 !important;
}
.gpq-footer-nav .gpq-sep {
  color: #ff8a00;
  font-size: 10px;
  padding: 0 10px;
  line-height: 1;
}
.gpq-footer-nav a {
  color: #14574d !important;
  font-size: .875rem;
  font-weight: 600;
  text-decoration: none !important;
  transition: color .2s ease;
}
.gpq-footer-nav a:hover {
  color: #0f4f46 !important;
  text-decoration: underline !important;
}
.gpq-footer-copy {
  font-size: .78rem;
  color: #7a9e98;
  margin: 0;
  line-height: 1.5;
  text-align: center;
}
@media (max-width: 520px) {
  .gpq-footer-nav .gpq-sep { display: none !important; }
  .gpq-footer-nav ul { gap: 8px !important; }
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
  if (sidebars.some((s) => s.id === "header")) {
    await ensureBlockWidget(client, "header", logoFixBlock(), LOGO_CSS_MARKER);
    logger.info("Widget placeholder injetado na area header.");
  }
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
  logger.info(`Footer nav publicado em ${footerId} com CSS global embutido.`);
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

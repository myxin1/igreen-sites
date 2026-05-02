import { AFFILIATE_URL } from "../config/site.js";
import { COMMERCIAL_CHILD_PAGES } from "../content/silo/definitions/children-commercial.js";
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

function logoFixBlock(): string {
  return [
    "<!-- wp:html -->",
    `<style>
/* gpq-logo-fix */
.site-logo img,
.custom-logo,
.custom-logo-link img {
  max-height: 58px !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain;
}
@media (max-width: 768px) {
  .custom-logo,
  .custom-logo-link img {
    max-height: 40px !important;
  }
}
</style>`,
    "<!-- /wp:html -->",
  ].join("\n");
}

function footerCardBlock(): string {
  const quickLinks = [
    ...COMMERCIAL_CHILD_PAGES.map((p) => `<li><a href="/${p.slug}/">${p.title}</a></li>`),
    `<li><a href="/aldeia-das-aguas/">Aldeia das Aguas</a></li>`,
  ].join("");

  return [
    "<!-- wp:html -->",
    `<style>
/* gpq-footer-card */
.gpq-footer-card {
  background: linear-gradient(180deg, #f7fcfb 0%, #eef7f5 100%);
  border: 1px solid #cfe5df;
  border-radius: 18px;
  padding: 28px 24px;
  box-shadow: 0 10px 26px rgba(16,68,60,.08);
}
.gpq-footer-card__brand {
  font-size: 1.1rem;
  font-weight: 700;
  color: #0f4f46;
  margin: 0 0 4px;
}
.gpq-footer-card__tagline {
  font-size: .875rem;
  color: #47635d;
  line-height: 1.6;
  margin: 0 0 20px;
}
.gpq-footer-card__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 20px;
  list-style: none;
  padding: 0;
}
.gpq-footer-card__links a {
  display: inline-block;
  background: #fff;
  border: 1px solid #cfe5df;
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #14574d;
  text-decoration: none;
  transition: background .2s ease, transform .2s ease;
}
.gpq-footer-card__links a:hover {
  background: #dff3ee;
  color: #0f4f46;
  text-decoration: none;
  transform: translateY(-1px);
}
.gpq-footer-card__cta {
  display: inline-block;
  background: linear-gradient(135deg, #ff8a00 0%, #ff5a2a 100%);
  color: #fff !important;
  font-weight: 700;
  text-decoration: none !important;
  padding: 12px 22px;
  border-radius: 12px;
  font-size: .9rem;
  box-shadow: 0 6px 18px rgba(255,90,42,.26);
  transition: transform .2s ease;
}
.gpq-footer-card__cta:hover {
  transform: translateY(-2px);
}
.gpq-footer-card__meta {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #cfe5df;
  font-size: 12px;
  color: #5b7b75;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
}
.gpq-footer-card__meta a {
  color: #5b7b75;
  text-decoration: none;
}
.gpq-footer-card__meta a:hover {
  color: #0f4f46;
  text-decoration: underline;
}
</style>
<div class="gpq-footer-card">
  <p class="gpq-footer-card__brand">Guia Parques Aquaticos</p>
  <p class="gpq-footer-card__tagline">Seu guia completo para os melhores parques aquaticos do Brasil. Ingressos, precos e dicas atualizados.</p>
  <ul class="gpq-footer-card__links">${quickLinks}</ul>
  <a class="gpq-footer-card__cta" href="${AFFILIATE_URL}" rel="nofollow sponsored" target="_blank">Ver ingressos e promocoes &rarr;</a>
  <div class="gpq-footer-card__meta">
    <a href="/sobre/">Sobre</a>
    <a href="/contato/">Contato</a>
    <a href="/politica-de-privacidade/">Politica de Privacidade</a>
    <a href="/termos-de-uso/">Termos de Uso</a>
  </div>
</div>`,
    "<!-- /wp:html -->",
  ].join("\n");
}

async function fixHeader(client: WordPressClient): Promise<void> {
  // Re-atribui menu ao slot primary
  const headerMenu = await ensureMenu(client, "HEADER", "header");
  await assignMenuLocations(client, headerMenu.id, ["primary"]);
  logger.info(`Menu HEADER reassigned to primary (ID ${headerMenu.id}).`);

  // Injeta CSS do logo na area header
  const sidebars = await listSidebars(client);
  const hasHeader = sidebars.some((s) => s.id === "header");
  if (!hasHeader) {
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
    // Remove todos os widgets existentes do footer
    const existing = await listWidgets(client, footerId);
    for (const widget of existing) {
      await deleteWidget(client, widget.id);
    }
    // Zera a lista da sidebar
    await client.request(`wp/v2/sidebars/${footerId}`, {
      method: "POST",
      body: { widgets: [] },
      expectedStatus: [200],
    });
  } else {
    logger.info(`[DRY RUN] Limparia widgets de ${footerId}.`);
  }

  await ensureBlockWidget(client, footerId, footerCardBlock(), FOOTER_CARD_MARKER);
  logger.info(`Footer card publicado em ${footerId}.`);
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

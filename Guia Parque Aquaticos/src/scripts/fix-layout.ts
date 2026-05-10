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
const SITE_TITLE = "Guia Parques Aquáticos";
const SITE_TAGLINE = "Guias editoriais para planejar visitas a parques aquáticos no Brasil.";

/**
 * CSS placeholder injected into the header widget area.
 * The effective global CSS lives in the footer widget, which we know renders.
 */
function logoFixBlock(): string {
  return [
    "<!-- wp:html -->",
    `<style>/* gpq-logo-fix */</style>`,
    "<!-- /wp:html -->",
  ].join("\n");
}

/**
 * Footer widget containing the global CSS plus the footer card.
 */
function footerNavBlock(): string {
  const navItems = [
    { href: "/politica-de-privacidade/", label: "Política de Privacidade" },
    { href: "/termos-de-uso/", label: "Termos de Uso" },
    { href: "/contato/", label: "Contato" },
    { href: "/sobre/", label: "Sobre" },
  ];

  const listItems = navItems
    .map((item, index) =>
      (index > 0 ? `<li class="gpq-sep" aria-hidden="true">&#9733;</li>` : "") +
      `<li><a href="${item.href}">${item.label}</a></li>`,
    )
    .join("");

  return [
    "<!-- wp:html -->",
    `<style>
/* gpq-footer-card: global CSS + footer */

@import url("https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&display=swap");

/* Hide site title/tagline near the logo */
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

.entry-title,
.entry-title a,
.inside-article > header h1,
.page-header h1 {
  font-family: "Merriweather", Georgia, serif !important;
  color: #0f4f46 !important;
  font-weight: 900 !important;
  letter-spacing: -0.02em !important;
  line-height: 1.18 !important;
}

/* Larger logo */
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

/* Hide GeneratePress credit */
.site-info,
#colophon .site-info,
.site-info-text,
.powered-by {
  display: none !important;
}

/* Divider above footer */
.site-footer,
#colophon {
  border-top: 2px solid #cfe5df !important;
  padding-top: 28px !important;
}

/* Force footer widget 1 to use full width */
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

/* Footer nav card */
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

/* Native comments */
.comments-area {
  margin-top: 56px !important;
  padding: 30px !important;
  background:
    radial-gradient(circle at top right, rgba(255, 183, 77, .14), transparent 34%),
    linear-gradient(180deg, #f7fcfb 0%, #edf7f4 100%);
  border: 1px solid #cfe5df !important;
  border-radius: 28px !important;
  box-shadow: 0 16px 36px rgba(16,68,60,.08);
  box-sizing: border-box;
}
.comments-area .comments-title,
.comments-area .comment-reply-title,
.comments-area .comment-reply-title a {
  font-family: "Merriweather", Georgia, serif !important;
  color: #0f4f46 !important;
  font-weight: 900 !important;
  letter-spacing: -0.02em !important;
  line-height: 1.2 !important;
}
.comments-area .comments-title,
.comments-area .comment-reply-title {
  margin: 0 0 18px !important;
}
.comments-area .comment-notes,
.comments-area .logged-in-as,
.comments-area .comment-awaiting-moderation,
.comments-area .comment-metadata,
.comments-area .comment-form-cookies-consent,
.comments-area .comment-form label {
  color: #567c75 !important;
}
.comments-area .comment-notes,
.comments-area .logged-in-as {
  font-size: .95rem;
  line-height: 1.7;
  margin-bottom: 12px !important;
}
.comments-area .gpq-comment-intro {
  margin: 0 0 18px !important;
  color: #3e6962 !important;
  font-size: .98rem;
  line-height: 1.75;
}
.comments-area .comment-form {
  display: grid;
  gap: 18px;
  margin-top: 10px;
}
.comments-area .comment-form p {
  margin: 0 !important;
}
.comments-area .comment-form label {
  display: block;
  margin-bottom: 8px;
  font-size: .78rem;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.comments-area .comment-form-comment,
.comments-area .comment-notes,
.comments-area .logged-in-as,
.comments-area .comment-form-cookies-consent,
.comments-area .form-submit {
  grid-column: 1 / -1;
}
.comments-area .comment-form-url {
  display: none !important;
}
.comments-area input[type="text"],
.comments-area input[type="email"],
.comments-area input[type="url"],
.comments-area textarea {
  width: 100% !important;
  border: 1px solid #c6ded7 !important;
  border-radius: 16px !important;
  background: #ffffff !important;
  color: #103e37 !important;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
  padding: 14px 16px !important;
  font-size: 1rem !important;
  line-height: 1.6 !important;
  transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
  box-sizing: border-box;
}
.comments-area textarea {
  min-height: 180px;
  resize: vertical;
}
.comments-area input[type="text"]:focus,
.comments-area input[type="email"]:focus,
.comments-area input[type="url"]:focus,
.comments-area textarea:focus {
  outline: none !important;
  border-color: #0f7969 !important;
  box-shadow: 0 0 0 4px rgba(15,121,105,.12) !important;
  transform: translateY(-1px);
}
.comments-area .comment-form-cookies-consent {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(255,255,255,.72);
  border: 1px solid #d8ebe4;
  border-radius: 16px;
  padding: 14px 16px;
}
.comments-area .comment-form-cookies-consent input {
  margin-top: 4px;
}
.comments-area .comment-form-cookies-consent label {
  margin: 0;
  text-transform: none;
  letter-spacing: 0;
  font-size: .92rem;
  font-weight: 600;
  line-height: 1.6;
}
.comments-area .form-submit {
  margin-top: 6px !important;
}
.comments-area .form-submit .submit,
.comments-area .reply a,
.comments-area #cancel-comment-reply-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0 !important;
  border-radius: 999px !important;
  text-decoration: none !important;
  font-weight: 800 !important;
  transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
}
.comments-area .form-submit .submit {
  min-width: 240px;
  padding: 15px 22px !important;
  background: linear-gradient(135deg, #ff9a1f 0%, #ff6a1f 100%) !important;
  color: #ffffff !important;
  box-shadow: 0 12px 28px rgba(255,106,31,.26);
}
.comments-area .form-submit .submit:hover,
.comments-area .reply a:hover,
.comments-area #cancel-comment-reply-link:hover {
  transform: translateY(-2px);
  filter: brightness(1.02);
}
.comments-area .comment-list,
.comments-area .children {
  list-style: none !important;
  margin: 28px 0 0 !important;
  padding: 0 !important;
}
.comments-area .comment-list > li {
  margin: 0 0 18px !important;
}
.comments-area .children {
  margin-top: 18px !important;
  margin-left: 26px !important;
  padding-left: 18px !important;
  border-left: 2px solid #d8ebe4;
}
.comments-area .comment-body {
  background: rgba(255,255,255,.9);
  border: 1px solid #d8ebe4;
  border-radius: 22px;
  padding: 20px 22px;
  box-shadow: 0 8px 24px rgba(16,68,60,.05);
}
.comments-area .comment-author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.comments-area .comment-author .avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid #edf7f4;
  box-shadow: 0 4px 14px rgba(16,68,60,.10);
}
.comments-area .comment-author .fn,
.comments-area .comment-author .fn a {
  color: #0f4f46 !important;
  font-style: normal !important;
  font-weight: 800 !important;
  text-decoration: none !important;
}
.comments-area .comment-metadata {
  margin-bottom: 14px;
  font-size: .82rem;
}
.comments-area .comment-metadata a {
  color: #6a8f89 !important;
  text-decoration: none !important;
}
.comments-area .comment-content {
  color: #214d46;
  line-height: 1.8;
}
.comments-area .reply {
  margin-top: 16px;
}
.comments-area .reply a,
.comments-area #cancel-comment-reply-link {
  padding: 10px 16px;
  background: #e8f4f0;
  color: #0f5b50 !important;
  box-shadow: 0 6px 18px rgba(15,79,70,.08);
}
.comments-area #cancel-comment-reply-link {
  margin-left: 12px;
}
.comments-area .comment-awaiting-moderation {
  display: inline-block;
  margin: 12px 0 0;
  padding: 8px 12px;
  background: #fff1db;
  border: 1px solid #ffd6a1;
  border-radius: 999px;
  font-size: .84rem;
  font-weight: 700;
}
@media (min-width: 720px) {
  .comments-area .comment-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 768px) {
  .comments-area {
    margin-top: 40px !important;
    padding: 22px 18px !important;
    border-radius: 22px !important;
  }
  .comments-area .children {
    margin-left: 14px !important;
    padding-left: 12px !important;
  }
  .comments-area .form-submit .submit {
    width: 100%;
    min-width: 0;
  }
}

/* Back to top button */
#gpq-top {
  position: fixed;
  bottom: 28px;
  right: 24px;
  width: 46px;
  height: 46px;
  background: linear-gradient(135deg, #0f4f46 0%, #1c6a5f 100%);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 4px 18px rgba(15,79,70,.32);
  opacity: 0;
  transform: translateY(14px);
  transition: opacity .3s ease, transform .3s ease, background .25s ease, box-shadow .25s ease;
  z-index: 9999;
  border: 2px solid rgba(255,255,255,.18);
  user-select: none;
  text-decoration: none;
}
#gpq-top.gpq-top--on {
  opacity: 1;
  transform: translateY(0);
}
#gpq-top:hover {
  background: linear-gradient(135deg, #ff8a00 0%, #ff5a2a 100%);
  box-shadow: 0 8px 24px rgba(255,90,42,.36);
  transform: translateY(-3px);
  color: #fff;
  text-decoration: none;
}
@media (max-width: 600px) {
  #gpq-top { bottom: 18px; right: 16px; width: 40px; height: 40px; font-size: 17px; }
}
</style>
<div class="gpq-footer-nav">
  <ul>${listItems}</ul>
  <p class="gpq-footer-copy">&copy; ${CURRENT_YEAR} ${SITE_DOMAIN}</p>
</div>
<div id="gpq-top" role="button" aria-label="Voltar ao topo" title="Voltar ao topo">&#8593;</div>
<script>
(function(){
  var btn = document.getElementById('gpq-top');
  if (!btn) return;
  window.addEventListener('scroll', function(){
    btn.classList[window.scrollY > 320 ? 'add' : 'remove']('gpq-top--on');
  }, { passive: true });
  btn.addEventListener('click', function(){
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
</script>
<script>
(function() {
  var applyCommentCopy = function() {
    var comments = document.getElementById('comments');
    if (!comments) return;

    var title = comments.querySelector('#reply-title');
    if (title) {
      var titleText = title.childNodes[0];
      if (titleText && titleText.nodeType === Node.TEXT_NODE) {
        titleText.textContent = 'Compartilhe sua experi\\u00eancia ';
      } else {
        title.insertBefore(document.createTextNode('Compartilhe sua experi\\u00eancia '), title.firstChild);
      }
    }

    var intro = comments.querySelector('.gpq-comment-intro');
    if (!intro && title) {
      intro = document.createElement('p');
      intro.className = 'gpq-comment-intro';
      intro.textContent = 'Se voc\\u00ea j\\u00e1 visitou esse destino, deixe uma dica r\\u00e1pida para ajudar quem est\\u00e1 planejando a viagem.';
      title.insertAdjacentElement('afterend', intro);
    }

    var submit = comments.querySelector('#submit');
    if (submit) {
      submit.value = 'Enviar coment\\u00e1rio';
    }

    var cancelReply = comments.querySelector('#cancel-comment-reply-link');
    if (cancelReply) {
      cancelReply.textContent = 'Fechar resposta';
    }

    var cookieLabel = comments.querySelector('label[for=\"wp-comment-cookies-consent\"]');
    if (cookieLabel) {
      cookieLabel.textContent = 'Salvar meus dados para comentar novamente com mais rapidez.';
    }

    var commentField = comments.querySelector('#comment');
    if (commentField && !commentField.getAttribute('placeholder')) {
      commentField.setAttribute('placeholder', 'Escreva aqui sua dica, d\\u00favida ou opini\\u00e3o...');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyCommentCopy, { once: true });
  } else {
    applyCommentCopy();
  }
})();
</script>`,
    "<!-- /wp:html -->",
  ].join("\n");
}

async function fixSiteIdentity(client: WordPressClient): Promise<void> {
  await client.request("wp/v2/settings", {
    method: "POST",
    body: {
      title: SITE_TITLE,
      description: SITE_TAGLINE,
    },
    expectedStatus: [200],
  });
  logger.info(`Identidade do site atualizada para "${SITE_TITLE}".`);
}

async function fixHeader(client: WordPressClient): Promise<void> {
  const headerMenu = await ensureMenu(client, "HEADER", "header");
  await assignMenuLocations(client, headerMenu.id, ["primary"]);
  logger.info(`Menu HEADER reassigned to primary (ID ${headerMenu.id}).`);

  const sidebars = await listSidebars(client);
  if (sidebars.some((sidebar) => sidebar.id === "header")) {
    await ensureBlockWidget(client, "header", logoFixBlock(), LOGO_CSS_MARKER);
    logger.info("Widget placeholder injected into the header area.");
  }
}

async function fixDiscussionDefaults(client: WordPressClient): Promise<void> {
  await client.request("wp/v2/settings", {
    method: "POST",
    body: {
      default_comment_status: "open",
      default_ping_status: "closed",
    },
    expectedStatus: [200],
  });
  logger.info("Native comments kept open; pingbacks and trackbacks closed by default.");
}

async function fixFooter(client: WordPressClient): Promise<void> {
  const sidebars = await listSidebars(client);
  const footerId =
    sidebars.find((sidebar) => sidebar.id === "footer-1")?.id ??
    sidebars.find((sidebar) => sidebar.id === "footer-bar")?.id ??
    sidebars.find((sidebar) => sidebar.id.startsWith("footer-"))?.id;

  if (!footerId) {
    logger.warn("No footer widget area found.");
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
    logger.info(`[DRY RUN] Would clear widgets from ${footerId}.`);
  }

  await ensureBlockWidget(client, footerId, footerNavBlock(), FOOTER_CARD_MARKER);
  logger.info(`Footer nav published to ${footerId} with embedded global CSS.`);
}

async function main(): Promise<void> {
  const client = new WordPressClient();
  await fixSiteIdentity(client);
  await fixHeader(client);
  await fixDiscussionDefaults(client);
  await fixFooter(client);
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});


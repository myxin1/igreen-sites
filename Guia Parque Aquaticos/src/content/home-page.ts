import { AFFILIATE_URL } from "../config/site.js";
import { SILO_GROUPS } from "./silo/definitions/groups.js";
import { PAGE_PARENT } from "./silo/index.js";
import type { SiloPageDefinition } from "./types.js";

const SILO_ICONS: Record<string, string> = {
  compra: "🎟",
  hospedagem: "🏨",
  planejamento: "🗺",
};

function u(slug: string): string {
  return `/${slug}/`;
}

function imgCard(page: SiloPageDefinition, imageUrl: string | undefined, tag: string): string {
  const media = imageUrl
    ? `<div class="gpq-img-card__media"><img src="${imageUrl}" alt="${page.title}" loading="lazy"></div>`
    : `<div class="gpq-img-card__media gpq-img-card__media--ph"></div>`;

  return (
    `<a class="gpq-img-card" href="${u(page.slug)}">` +
    media +
    `<div class="gpq-img-card__body">` +
    `<span class="gpq-img-card__tag">${tag}</span>` +
    `<strong class="gpq-img-card__title">${page.title}</strong>` +
    `<span class="gpq-img-card__cta">Ver guia &rarr;</span>` +
    `</div></a>`
  );
}

function css(): string {
  return `<!-- wp:html -->
<style>
.gpq-hero {
  background: radial-gradient(circle at top left, rgba(255,138,0,.18), transparent 32%),
              linear-gradient(135deg, #0f4f46 0%, #1c6a5f 100%);
  color: #fff;
  border-radius: 24px;
  padding: 56px 48px;
  margin: 0 0 48px;
  box-shadow: 0 24px 48px rgba(15,79,70,.18);
}
.gpq-hero__chip {
  display: inline-block;
  background: rgba(255,255,255,.16);
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 16px;
}
.gpq-hero h1 { color: #fff; font-size: 2rem; margin: 0 0 12px; line-height: 1.2; }
.gpq-hero p { color: rgba(255,255,255,.88); font-size: 1.05rem; max-width: 560px; margin: 0 0 28px; line-height: 1.7; }
.gpq-hero__cta {
  display: inline-block;
  background: linear-gradient(135deg, #ff8a00 0%, #ff5a2a 100%);
  color: #fff;
  text-decoration: none;
  font-weight: 700;
  padding: 16px 28px;
  border-radius: 12px;
  font-size: 1rem;
  box-shadow: 0 8px 22px rgba(255,90,42,.28);
  transition: transform .2s ease, box-shadow .2s ease;
}
.gpq-hero__cta:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(255,90,42,.36); color: #fff; text-decoration: none; }

.gpq-section { margin: 0 0 52px; }
.gpq-section__h {
  font-size: 1.35rem;
  color: #0f4f46;
  margin: 0 0 24px;
  padding-bottom: 12px;
  border-bottom: 3px solid #cfe5df;
}

.gpq-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.gpq-grid--wide { grid-template-columns: repeat(2, 1fr); }

.gpq-img-card {
  display: flex;
  flex-direction: column;
  text-decoration: none;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #cfe5df;
  box-shadow: 0 8px 22px rgba(16,68,60,.08);
  transition: transform .22s ease, box-shadow .22s ease;
  background: #fff;
  color: inherit;
}
.gpq-img-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 18px 36px rgba(16,68,60,.14);
  color: inherit;
  text-decoration: none;
}
.gpq-img-card__media { aspect-ratio: 16/9; overflow: hidden; }
.gpq-img-card__media img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .3s ease; }
.gpq-img-card:hover .gpq-img-card__media img { transform: scale(1.04); }
.gpq-img-card__media--ph {
  background: linear-gradient(135deg, #0f4f46 0%, #1c6a5f 100%);
  min-height: 140px;
}
.gpq-img-card__body { padding: 16px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
.gpq-img-card__tag { font-size: 11px; font-weight: 700; color: #ff8a00; text-transform: uppercase; letter-spacing: .06em; }
.gpq-img-card__title { font-size: .95rem; font-weight: 700; color: #0f4f46; line-height: 1.4; display: block; }
.gpq-img-card__cta { font-size: 13px; font-weight: 700; color: #14574d; margin-top: auto; padding-top: 10px; }

.gpq-info-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; list-style: none; margin: 0; padding: 0; }
.gpq-info-list a { display: block; padding: 14px 16px; background: #f7fcfb; border: 1px solid #cfe5df; border-radius: 12px; color: #14574d; font-weight: 600; font-size: .9rem; text-decoration: none; transition: background .2s ease, transform .2s ease; }
.gpq-info-list a:hover { background: #eef7f5; transform: translateY(-2px); text-decoration: none; color: #0f4f46; }
.gpq-info-list a::before { content: "\\2192 "; color: #ff8a00; font-weight: 700; }

.gpq-cta-bar {
  background: #0f4f46;
  border-radius: 20px;
  padding: 36px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  margin: 0 0 48px;
}
.gpq-cta-bar__text { color: rgba(255,255,255,.9); font-size: 1rem; margin: 0; max-width: 520px; line-height: 1.6; }
.gpq-cta-bar__text strong { color: #fff; font-size: 1.15rem; display: block; margin-bottom: 6px; }
.gpq-cta-bar__btn {
  display: inline-block;
  background: linear-gradient(135deg, #ff8a00 0%, #ff5a2a 100%);
  color: #fff;
  font-weight: 700;
  text-decoration: none;
  padding: 16px 28px;
  border-radius: 12px;
  font-size: 1rem;
  white-space: nowrap;
  box-shadow: 0 8px 22px rgba(255,90,42,.28);
  transition: transform .2s ease;
}
.gpq-cta-bar__btn:hover { transform: translateY(-2px); color: #fff; text-decoration: none; }

@media (max-width: 768px) {
  .gpq-grid,
  .gpq-grid--wide { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .gpq-hero { padding: 36px 24px; }
  .gpq-hero h1 { font-size: 1.5rem; }
  .gpq-hero__cta {
    display: block;
    width: 100%;
    text-align: center;
    box-sizing: border-box;
  }
  .gpq-cta-bar {
    flex-direction: column;
    align-items: stretch;
  }
  .gpq-cta-bar__btn {
    width: 100%;
    text-align: center;
    box-sizing: border-box;
    white-space: normal;
  }
  .gpq-info-list { grid-template-columns: 1fr; }
}
</style>
<!-- /wp:html -->`;
}

function hero(): string {
  return `<!-- wp:html -->
<div class="gpq-hero">
  <span class="gpq-hero__chip">Guia oficial</span>
  <h1>Guia Parques Aquáticos</h1>
  <p>Tudo sobre ingressos, preços, pacotes e dicas para os melhores parques aquáticos do Brasil. Planeje sua visita com informações atualizadas.</p>
  <a class="gpq-hero__cta" href="${u(PAGE_PARENT.slug)}">Ver Aldeia das Águas &rarr;</a>
</div>
<!-- /wp:html -->`;
}

function pillarCard(imageMap: Map<string, string>): string {
  return `<!-- wp:html -->
<div class="gpq-section">
  <h2 class="gpq-section__h">Destaque Principal</h2>
  <div class="gpq-grid gpq-grid--wide">
    ${imgCard(PAGE_PARENT, imageMap.get(PAGE_PARENT.key), "Guia principal")}
  </div>
</div>
<!-- /wp:html -->`;
}

function siloSection(): string {
  const cards = SILO_GROUPS.map((g) => {
    const icon = SILO_ICONS[g.key] ?? "";
    return (
      `<a class="gpq-silo-card" href="/${g.slug}/">` +
      `<span class="gpq-silo-card__icon">${icon}</span>` +
      `<strong class="gpq-silo-card__name">${g.name}</strong>` +
      `<p class="gpq-silo-card__intro">${g.intro}</p>` +
      `<span class="gpq-silo-card__cta">Ver guias &rarr;</span>` +
      `</a>`
    );
  }).join("");

  return `<!-- wp:html -->
<style>
.gpq-silo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 0 0 52px; }
.gpq-silo-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 24px 20px;
  border-radius: 18px;
  border: 1px solid #cfe5df;
  background: #f7fcfb;
  text-decoration: none;
  color: inherit;
  transition: transform .2s ease, box-shadow .2s ease;
  box-shadow: 0 6px 18px rgba(16,68,60,.07);
}
.gpq-silo-card:hover { transform: translateY(-3px); box-shadow: 0 14px 28px rgba(16,68,60,.13); text-decoration: none; color: inherit; }
.gpq-silo-card__icon { font-size: 1.6rem; }
.gpq-silo-card__name { font-size: 1rem; font-weight: 700; color: #0f4f46; display: block; }
.gpq-silo-card__intro { font-size: .88rem; color: #3a6560; line-height: 1.6; margin: 0; flex: 1; }
.gpq-silo-card__cta { font-size: .85rem; font-weight: 700; color: #ff8a00; margin-top: auto; }
@media (max-width: 768px) { .gpq-silo-grid { grid-template-columns: 1fr; } }
</style>
<div class="gpq-section">
  <h2 class="gpq-section__h">Guias por Categoria</h2>
  <div class="gpq-silo-grid">${cards}</div>
</div>
<!-- /wp:html -->`;
}

function affiliateCta(): string {
  return `<!-- wp:html -->
<div class="gpq-cta-bar">
  <p class="gpq-cta-bar__text">
    <strong>Compre seu ingresso com segurança</strong>
    Acesse o site oficial para ver o preço atualizado, disponibilidade e promoções da Aldeia das Águas Park Resort.
  </p>
  <a class="gpq-cta-bar__btn" href="${AFFILIATE_URL}" rel="nofollow sponsored" target="_blank">Ver ingressos e promoções &rarr;</a>
</div>
<!-- /wp:html -->`;
}

export function buildHomePageContent(imageMap: Map<string, string>): string {
  return [
    "<!-- wp:group -->",
    '<div class="wp-block-group">',
    css(),
    hero(),
    pillarCard(imageMap),
    siloSection(),
    affiliateCta(),
    "</div>",
    "<!-- /wp:group -->",
  ].join("\n");
}


import { AFFILIATE_URL } from "../../config/site.js";
import { PAGE_PARENT } from "./definitions/pillar.js";
import { TOP_FUNNEL_PAGES, findSiloPage } from "./index.js";

export const SILO_SIDEBAR_HEADING = "Links da Aldeia das Aguas";
const HOME_HEADING = "Destinos em Destaque";
const CLUSTER_HEADING = "Planeje Sua Visita";
export const HOME_SHOWCASE_MARKER = "gpq-home-showcase";
export const SILO_SIDEBAR_MARKER = "gpq-sidebar-cluster";
export const HEADER_SEARCH_MARKER = "gpq-header-search";

function item(url: string, label: string): string {
  return `<li><a href="${url}">${label}</a></li>`;
}

function urlFor(slug: string): string {
  return `/${slug}/`;
}

function listBlock(title: string, items: string[]): string {
  return [
    '<div class="gpq-sidebar-list-group">',
    '<!-- wp:heading {"level":3} -->',
    `<h3>${title}</h3>`,
    "<!-- /wp:heading -->",
    "<!-- wp:list -->",
    `<ul>${items.join("")}</ul>`,
    "<!-- /wp:list -->",
    "</div>",
  ].join("");
}

function styleBlock(): string {
  return [
    "<!-- wp:html -->",
    `<style>
      .gpq-sidebar-home,
      .gpq-sidebar-cluster {
        display: none;
      }

      .gpq-sidebar-card {
        background: linear-gradient(180deg, #f7fcfb 0%, #eef7f5 100%);
        border: 1px solid #cfe5df;
        border-radius: 18px;
        padding: 24px 20px 22px;
        box-shadow: 0 10px 26px rgba(16, 68, 60, 0.08);
      }

      .gpq-sidebar-card h2,
      .gpq-sidebar-card h3 {
        margin-top: 0;
      }

      .gpq-sidebar-card h2 {
        color: #0f4f46;
      }

      .gpq-sidebar-card h3 {
        color: #1f6a5f;
        font-size: 1rem;
        margin-top: 18px;
      }

      .gpq-sidebar-card p,
      .gpq-sidebar-card li {
        color: #21433d;
      }

      .gpq-sidebar-card p {
        line-height: 1.75;
      }

      .gpq-sidebar-card ul {
        list-style: none;
        padding-left: 0;
        margin-left: 0;
        margin-top: 14px;
        margin-bottom: 0;
      }

      .gpq-sidebar-card li {
        position: relative;
        padding-left: 20px;
        margin-bottom: 12px;
      }

      .gpq-sidebar-card li::before {
        content: "★";
        position: absolute;
        left: 0;
        top: 1px;
        color: #ff8a00;
        font-size: 12px;
      }

      body.home .gpq-sidebar-home,
      body.blog .gpq-sidebar-home {
        display: block;
      }

      body.single-post .gpq-sidebar-cluster,
      body.archive .gpq-sidebar-cluster,
      body.category .gpq-sidebar-cluster {
        display: block;
      }

      .gpq-sidebar-copy {
        margin: 0 0 30px;
      }

      .gpq-sidebar-copy p {
        margin-bottom: 0;
      }

      .gpq-sidebar-ctas {
        margin: 0 0 28px;
      }

      .gpq-sidebar-ctas .wp-block-buttons {
        margin-bottom: 22px;
      }

      .gpq-sidebar-ctas .wp-block-button__link {
        width: 100%;
        text-align: center;
        border-radius: 12px;
        font-weight: 700;
        padding: 16px 18px;
        transition:
          transform 0.2s ease,
          box-shadow 0.2s ease,
          opacity 0.2s ease;
      }

      .gpq-sidebar-ctas .wp-block-buttons:nth-child(1) .wp-block-button__link,
      .gpq-sidebar-ctas .wp-block-buttons:nth-child(2) .wp-block-button__link {
        background: linear-gradient(135deg, #ff8a00 0%, #ff5a2a 100%);
        color: #ffffff;
      }

      .gpq-sidebar-ctas .wp-block-buttons:nth-child(1) .wp-block-button__link {
        animation: gpqPulse 2.8s ease-in-out infinite;
      }

      .gpq-sidebar-ctas .wp-block-buttons:nth-child(3) .wp-block-button__link,
      .gpq-sidebar-ctas .wp-block-buttons:nth-child(4) .wp-block-button__link {
        background: #ffffff;
        color: #14574d;
        border: 1px solid #b9d6cf;
      }

      .gpq-sidebar-ctas .wp-block-button__link:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 22px rgba(20, 87, 77, 0.16);
      }

      .gpq-sidebar-chip {
        display: inline-block;
        background: #dff3ee;
        color: #14574d;
        border-radius: 999px;
        padding: 6px 10px;
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 10px;
      }

      .gpq-sidebar-note {
        font-size: 13px;
        color: #47635d;
        line-height: 1.75;
        margin: 0 0 26px;
      }

      .gpq-sidebar-list-group + .gpq-sidebar-list-group {
        margin-top: 24px;
      }

      @keyframes gpqPulse {
        0%,
        100% {
          transform: scale(1);
          box-shadow: 0 0 0 rgba(255, 138, 0, 0);
        }
        50% {
          transform: scale(1.02);
          box-shadow: 0 10px 24px rgba(255, 90, 42, 0.22);
        }
      }
    </style>`,
    "<!-- /wp:html -->",
  ].join("");
}

function buttonsBlock(): string {
  return [
    '<div class="gpq-sidebar-ctas">',
    '<!-- wp:buttons {"layout":{"type":"flex","orientation":"vertical"},"style":{"spacing":{"blockGap":"18px"}}} -->',
    '<div class="wp-block-buttons is-vertical">',
    '<!-- wp:button {"width":100} -->',
    `<div class="wp-block-button has-custom-width wp-block-button__width-100"><a class="wp-block-button__link wp-element-button" href="${AFFILIATE_URL}" rel="nofollow sponsored" target="_blank">Ver ingressos e promocoes</a></div>`,
    '<!-- /wp:button -->',
    '<!-- wp:button {"width":100} -->',
    `<div class="wp-block-button has-custom-width wp-block-button__width-100"><a class="wp-block-button__link wp-element-button" href="${AFFILIATE_URL}" rel="nofollow sponsored" target="_blank">Ver preco atualizado</a></div>`,
    '<!-- /wp:button -->',
    '<!-- wp:button {"width":100} -->',
    `<div class="wp-block-button has-custom-width wp-block-button__width-100"><a class="wp-block-button__link wp-element-button" href="${urlFor(findSiloPage("hotel").slug)}">Ver opcoes de hospedagem</a></div>`,
    '<!-- /wp:button -->',
    '<!-- wp:button {"width":100} -->',
    `<div class="wp-block-button has-custom-width wp-block-button__width-100"><a class="wp-block-button__link wp-element-button" href="${urlFor(findSiloPage("pacote").slug)}">Comparar pacotes</a></div>`,
    '<!-- /wp:button -->',
    "</div>",
    "<!-- /wp:buttons -->",
    "</div>",
  ].join("");
}

function homeSection(): string {
  const headItems = [PAGE_PARENT, ...TOP_FUNNEL_PAGES].map((page) =>
    item(urlFor(page.slug), page.title),
  );

  return [
    '<div class="gpq-sidebar-home gpq-sidebar-card">',
    '<!-- wp:html -->',
    '<div class="gpq-sidebar-chip">Guia principal</div>',
    '<!-- /wp:html -->',
    '<!-- wp:heading {"level":2} -->',
    `<h2>${HOME_HEADING}</h2>`,
    "<!-- /wp:heading -->",
    '<!-- wp:paragraph -->',
    "<p>Comece pelos principais guias editoriais do site e avance para a pagina que faz mais sentido para a sua pesquisa.</p>",
    "<!-- /wp:paragraph -->",
    "<!-- wp:list -->",
    `<ul>${headItems.join("")}</ul>`,
    "<!-- /wp:list -->",
    '<!-- wp:html -->',
    '<p class="gpq-sidebar-note">Esses links funcionam como portas de entrada para os principais grupos de conteudo do projeto.</p>',
    '<!-- /wp:html -->',
    "</div>",
  ].join("");
}

function clusterSection(): string {
  const commercialKeys = ["preco", "ingresso", "desconto", "day-use", "pacote"];
  const lodgingKeys = ["hotel", "onde-ficar", "airbnb"];
  const infoKeys = [
    "onde-fica",
    "como-chegar",
    "endereco",
    "telefone",
    "horario",
    "atracoes",
    "vale-a-pena",
    "dicas",
    "melhor-dia",
    "familia",
    "opiniao",
  ];

  const commercialItems = commercialKeys.map((key) => {
    const page = findSiloPage(key);
    return item(urlFor(page.slug), page.title);
  });
  const lodgingItems = lodgingKeys.map((key) => {
    const page = findSiloPage(key);
    return item(urlFor(page.slug), page.title);
  });
  const infoItems = infoKeys.map((key) => {
    const page = findSiloPage(key);
    return item(urlFor(page.slug), page.title);
  });

  return [
    '<div class="gpq-sidebar-cluster gpq-sidebar-card">',
    '<!-- wp:html -->',
    '<div class="gpq-sidebar-chip">Oferta e planejamento</div>',
    '<!-- /wp:html -->',
    '<!-- wp:heading {"level":2} -->',
    `<h2>${CLUSTER_HEADING}</h2>`,
    "<!-- /wp:heading -->",
    '<!-- wp:html -->',
    `<div class="gpq-sidebar-copy"><p>Use este painel para navegar pelos guias da <a href="${urlFor(PAGE_PARENT.slug)}">${PAGE_PARENT.title}</a> e ir direto para ingresso, preco, pacote e hospedagem.</p></div>`,
    '<!-- /wp:html -->',
    buttonsBlock(),
    '<!-- wp:html -->',
    '<p class="gpq-sidebar-note">Os links abaixo ajudam o usuario a comparar opcoes e continuar dentro do mesmo tema de viagem.</p>',
    '<!-- /wp:html -->',
    listBlock("Compra e Promocoes", commercialItems),
    listBlock("Hospedagem", lodgingItems),
    listBlock("Planejamento da Visita", infoItems),
    "</div>",
  ].join("");
}

export function buildSiloSidebarBlockContent(): string {
  return [
    "<!-- wp:group -->",
    '<div class="wp-block-group">',
    styleBlock(),
    homeSection(),
    clusterSection(),
    "</div>",
    "<!-- /wp:group -->",
  ].join("");
}

export function buildHeaderSearchBlockContent(): string {
  return [
    "<!-- wp:group -->",
    `<div class="wp-block-group ${HEADER_SEARCH_MARKER}">`,
    "<!-- wp:html -->",
    `<style>
      .${HEADER_SEARCH_MARKER} {
        margin: 0;
      }

      .${HEADER_SEARCH_MARKER} .wp-block-search__inside-wrapper {
        border: 1px solid #c7ddd7;
        border-radius: 999px;
        background: #ffffff;
        padding: 6px;
        box-shadow: 0 12px 28px rgba(15, 79, 70, 0.08);
      }

      .${HEADER_SEARCH_MARKER} .wp-block-search__input {
        border: 0;
        background: transparent;
        padding: 12px 16px;
        color: #174d44;
      }

      .${HEADER_SEARCH_MARKER} .wp-block-search__input::placeholder {
        color: #5b7b75;
      }

      .${HEADER_SEARCH_MARKER} .wp-block-search__button {
        border: 0;
        border-radius: 999px;
        background: linear-gradient(135deg, #0f4f46 0%, #1c6a5f 100%);
        color: #ffffff;
        padding: 12px 18px;
        font-weight: 700;
      }
    </style>`,
    "<!-- /wp:html -->",
    '<!-- wp:search {"label":"Buscar no site","showLabel":false,"placeholder":"Buscar parques, ingressos e dicas...","buttonText":"Buscar","buttonPosition":"button-inside","buttonUseIcon":true} /-->',
    "</div>",
    "<!-- /wp:group -->",
  ].join("");
}

export function buildHomeShowcaseBlockContent(): string {
  const headCards = [PAGE_PARENT, ...TOP_FUNNEL_PAGES]
    .map(
      (page) => `
        <a class="gpq-home-card" href="${urlFor(page.slug)}">
          <span class="gpq-home-card__eyebrow">Guia principal</span>
          <strong>${page.title}</strong>
          <span class="gpq-home-card__cta">Abrir guia</span>
        </a>`,
    )
    .join("");

  return [
    "<!-- wp:group -->",
    `<div class="wp-block-group ${HOME_SHOWCASE_MARKER}">`,
    "<!-- wp:html -->",
    `<style>
      .${HOME_SHOWCASE_MARKER} {
        display: none;
        margin: 0 0 28px;
        padding: 28px 24px;
        border-radius: 24px;
        background:
          radial-gradient(circle at top left, rgba(255, 138, 0, 0.18), transparent 32%),
          linear-gradient(135deg, #0f4f46 0%, #1c6a5f 100%);
        color: #ffffff;
        box-shadow: 0 20px 40px rgba(15, 79, 70, 0.18);
      }

      body.home .${HOME_SHOWCASE_MARKER},
      body.blog .${HOME_SHOWCASE_MARKER} {
        display: block;
      }

      .${HOME_SHOWCASE_MARKER} .gpq-home-showcase__eyebrow {
        display: inline-block;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.16);
        font-size: 12px;
        font-weight: 700;
        margin-bottom: 12px;
      }

      .${HOME_SHOWCASE_MARKER} h2 {
        color: #ffffff;
        margin: 0 0 8px;
      }

      .${HOME_SHOWCASE_MARKER} p {
        color: rgba(255, 255, 255, 0.9);
      }

      .${HOME_SHOWCASE_MARKER} .gpq-home-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-top: 18px;
      }

      .${HOME_SHOWCASE_MARKER} .gpq-home-card {
        display: flex;
        flex-direction: column;
        gap: 10px;
        text-decoration: none;
        background: rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 18px;
        padding: 18px;
        color: #ffffff;
        transition:
          transform 0.22s ease,
          background 0.22s ease,
          box-shadow 0.22s ease;
      }

      .${HOME_SHOWCASE_MARKER} .gpq-home-card:hover {
        transform: translateY(-3px);
        background: rgba(255, 255, 255, 0.16);
        box-shadow: 0 16px 30px rgba(6, 34, 30, 0.22);
      }

      .${HOME_SHOWCASE_MARKER} .gpq-home-card__eyebrow {
        font-size: 12px;
        font-weight: 700;
        color: #ffd9b0;
      }

      .${HOME_SHOWCASE_MARKER} .gpq-home-card__cta {
        font-size: 13px;
        font-weight: 700;
        color: #ffffff;
      }
    </style>`,
    `<div class="gpq-home-showcase__eyebrow">Comece por aqui</div>
     <h2>Guias principais do site</h2>
     <p>Escolha o guia que faz mais sentido para sua pesquisa e siga para os conteudos comerciais e informativos relacionados.</p>
     <div class="gpq-home-grid">${headCards}</div>`,
    "<!-- /wp:html -->",
    "</div>",
    "<!-- /wp:group -->",
  ].join("");
}

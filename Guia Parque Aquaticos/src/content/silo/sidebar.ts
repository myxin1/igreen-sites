import { AFFILIATE_URL } from "../../config/site.js";
import { SILO_GROUPS } from "./definitions/groups.js";
import { PAGE_PARENT } from "./definitions/pillar.js";
import { TOP_FUNNEL_PAGES } from "./definitions/top-funnel.js";
import { findSiloPage } from "./registry.js";
import { articleLinkTargets, hubLinkTargets, permalinkForGroup, permalinkForPage } from "./linking.js";

export const SILO_SIDEBAR_HEADING = "Links da Aldeia das Aguas";
const HOME_HEADING = "Guias Principais";
export const HOME_SHOWCASE_MARKER = "gpq-home-showcase";
export const SILO_SIDEBAR_MARKER = "gpq-sidebar-cluster";
export const SIDEBAR_AFFILIATE_BANNER_MARKER = "gpq-affiliate-banner";
export const HEADER_SEARCH_MARKER = "gpq-header-search";

interface SidebarView {
  chip: string;
  heading: string;
  intro: string;
  key: string;
  links: Array<{ href: string; label: string }>;
  path: string;
}

function listItem(url: string, label: string): string {
  return `<li><a href="${url}">${label}</a></li>`;
}

function listBlock(items: Array<{ href: string; label: string }>): string {
  return [
    "<!-- wp:list -->",
    `<ul>${items.map((item) => listItem(item.href, item.label)).join("")}</ul>`,
    "<!-- /wp:list -->",
  ].join("");
}

function styleBlock(): string {
  return [
    "<!-- wp:html -->",
    `<style>
      .gpq-sidebar-card {
        background: linear-gradient(180deg, #f7fcfb 0%, #eef7f5 100%);
        border: 1px solid #cfe5df;
        border-radius: 18px;
        padding: 24px 20px 22px;
        box-shadow: 0 10px 26px rgba(16, 68, 60, 0.08);
      }

      .gpq-sidebar-card h2 {
        color: #0f4f46;
        margin-top: 0;
        margin-bottom: 12px;
        font-size: 1rem;
        line-height: 1.55;
      }

      .gpq-sidebar-card p,
      .gpq-sidebar-card li {
        color: #21433d;
        line-height: 1.75;
      }

      .gpq-sidebar-card ul {
        list-style: none;
        padding-left: 0;
        margin: 16px 0 0;
      }

      .gpq-sidebar-card li {
        position: relative;
        padding-left: 20px;
        margin-bottom: 12px;
      }

      .gpq-sidebar-card li::before {
        content: "";
        position: absolute;
        left: 0;
        top: 9px;
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #ff8a00;
      }

      .gpq-sidebar-card a {
        color: #0f6a5c;
        font-weight: 700;
        text-decoration: underline;
        text-decoration-color: #a8d9cf;
        text-underline-offset: 3px;
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
    </style>`,
    "<!-- /wp:html -->",
  ].join("");
}

function viewMap(views: SidebarView[]): Record<string, string> {
  return Object.fromEntries(views.map((view) => [view.path, view.key]));
}

function viewsByKey(views: SidebarView[]): Record<string, SidebarView> {
  return Object.fromEntries(views.map((view) => [view.key, view]));
}

function behaviorScriptBlock(views: SidebarView[]): string {
  const serializedMap = JSON.stringify(viewMap(views));
  const serializedViews = JSON.stringify(viewsByKey(views));

  return [
    "<!-- wp:html -->",
    `<script>
      (function () {
        const applyView = function () {
          const root = document.querySelector(".gpq-sidebar-root");
          if (!root) return;

          const normalizePath = function (value) {
            if (!value || value === "/") return "/";
            const clean = value.split("?")[0].split("#")[0];
            return clean.endsWith("/") ? clean : clean + "/";
          };

          const map = ${serializedMap};
          const views = ${serializedViews};
          const path = normalizePath(window.location.pathname);
          const activeKey = map[path];

          if (!activeKey) {
            root.remove();
            return;
          }

          const view = views[activeKey];
          if (!view) {
            root.remove();
            return;
          }

          const linksHtml = view.links
            .map(function (item) {
              return '<li><a href="' + item.href + '">' + item.label + "</a></li>";
            })
            .join("");

          root.innerHTML =
            '<div class="gpq-sidebar-card">' +
            '<div class="gpq-sidebar-chip">' + view.chip + "</div>" +
            "<h2>" + view.heading + "</h2>" +
            "<p>" + view.intro + "</p>" +
            "<ul>" + linksHtml + "</ul>" +
            "</div>";
        };

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", applyView, { once: true });
        } else {
          applyView();
        }
      })();
    </script>`,
    "<!-- /wp:html -->",
  ].join("");
}

function homeView(): SidebarView {
  const siloLinks = [
    { href: `/${PAGE_PARENT.slug}/`, label: PAGE_PARENT.title },
    ...SILO_GROUPS.map((g) => ({ href: permalinkForGroup(g), label: g.name })),
  ];

  return {
    chip: "Navegue pelo site",
    key: "home",
    path: "/",
    heading: "Guias da Aldeia das Águas",
    intro: "Escolha uma das categorias abaixo para encontrar o que precisa sobre o resort.",
    links: siloLinks,
  };
}

function pageView(page: typeof PAGE_PARENT | (typeof TOP_FUNNEL_PAGES)[number] | ReturnType<typeof findSiloPage>): SidebarView {
  return {
    chip: page.key === PAGE_PARENT.key ? "Guia principal" : "Links deste artigo",
    key: page.key,
    path: permalinkForPage(page),
    heading: "Links citados neste artigo",
    intro:
      page.type === "top-funnel"
        ? "Esta sidebar repete apenas os links internos usados no artigo, todos ligados a esta mesma comparacao regional."
        : "Esta sidebar repete apenas os links internos usados no artigo, todos ligados a este mesmo tema.",
    links: articleLinkTargets(page).map((target) => ({
      href: target.href,
      label: target.label,
    })),
  };
}

function groupView(group: (typeof SILO_GROUPS)[number]): SidebarView {
  return {
    chip: "Categoria",
    key: group.key,
    path: permalinkForGroup(group),
    heading: group.name,
    intro: "Esta sidebar mostra somente os guias que a pagina da categoria cita para continuar a leitura.",
    links: hubLinkTargets(group).map((target) => ({
      href: target.href,
      label: target.label,
    })),
  };
}

function allViews(): SidebarView[] {
  const groupArticleViews = SILO_GROUPS.flatMap((group) =>
    group.children.map((child) => pageView(findSiloPage(child.key))),
  );

  return [
    homeView(),
    pageView(PAGE_PARENT),
    ...SILO_GROUPS.map(groupView),
    ...groupArticleViews,
    ...TOP_FUNNEL_PAGES.map(pageView),
  ];
}

export function buildSiloSidebarBlockContent(): string {
  const views = allViews();

  return [
    "<!-- wp:group -->",
    `<div class="wp-block-group ${SILO_SIDEBAR_MARKER} gpq-sidebar-root">`,
    styleBlock(),
    behaviorScriptBlock(views),
    "</div>",
    "<!-- /wp:group -->",
  ].join("");
}

export function buildAffiliateBannerWidgetContent(urls: string[]): string {
  const initial = urls[0];

  return [
    "<!-- wp:group -->",
    `<div class="wp-block-group ${SIDEBAR_AFFILIATE_BANNER_MARKER}">`,
    "<!-- wp:html -->",
    `<style>
      .${SIDEBAR_AFFILIATE_BANNER_MARKER} {
        margin: 0;
        padding: 0;
      }
      .${SIDEBAR_AFFILIATE_BANNER_MARKER}__divider {
        border: 0;
        border-top: 1px solid #cfe5df;
        margin: 0 0 28px;
      }
      .${SIDEBAR_AFFILIATE_BANNER_MARKER}__link {
        display: block;
        border-radius: 22px;
        overflow: hidden;
        box-shadow: 0 18px 36px rgba(6,34,30,.20);
        transition: transform .24s ease, box-shadow .24s ease;
      }
      .${SIDEBAR_AFFILIATE_BANNER_MARKER}__link:hover {
        transform: translateY(-3px);
        box-shadow: 0 26px 44px rgba(6,34,30,.28);
      }
      .${SIDEBAR_AFFILIATE_BANNER_MARKER}__img {
        width: 100%;
        height: auto;
        display: block;
        margin: 0;
        transition: transform .24s ease, filter .24s ease;
      }
      .${SIDEBAR_AFFILIATE_BANNER_MARKER}__link:hover .${SIDEBAR_AFFILIATE_BANNER_MARKER}__img {
        transform: scale(1.02);
        filter: saturate(1.04);
      }
    </style>
    <hr class="${SIDEBAR_AFFILIATE_BANNER_MARKER}__divider" />
    <a class="${SIDEBAR_AFFILIATE_BANNER_MARKER}__link" href="${AFFILIATE_URL}" rel="nofollow sponsored" target="_blank">
      <img class="${SIDEBAR_AFFILIATE_BANNER_MARKER}__img" src="${initial}" alt="Ingressos Aldeia das Aguas" loading="lazy" />
    </a>`,
    "<!-- /wp:html -->",
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
        <a class="gpq-home-card" href="${permalinkForPage(page)}">
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
     <p>Escolha o guia que faz mais sentido para sua pesquisa e siga apenas pela trilha relacionada.</p>
     <div class="gpq-home-grid">${headCards}</div>`,
    "<!-- /wp:html -->",
    "</div>",
    "<!-- /wp:group -->",
  ].join("");
}

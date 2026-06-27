export const SITE_NAME = "Guia Parques Aquáticos";
export const SITE_DOMAIN = "guiaparquesaquaticos.com";
export const AFFILIATE_URL = "https://guiaparquesaquaticos.com/aldeia-das-aguas-go";
export { PAGE_PARENT, SILO_PAGES, TOP_FUNNEL_PAGES } from "../content/silo/index.js";

export const REQUIRED_PLUGINS = [
  { slug: "seo-by-rank-math", name: "Rank Math SEO" },
  { slug: "google-site-kit", name: "Site Kit by Google" },
  { slug: "contact-form-7", name: "Contact Form 7" },
];

export const OPTIONAL_PLUGINS = {
  rankMathRestBridge: { slug: "42flows-seo-meta", name: "42flows SEO Meta" },
};

export const REQUIRED_THEME = "generatepress";

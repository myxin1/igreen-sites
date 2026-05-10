import { env } from "../config/env.js";
import { SITE_NAME } from "../config/site.js";
import { findGroupByChildKey, type SiloGroup } from "../content/silo/definitions/groups.js";
import { PAGE_PARENT } from "../content/silo/definitions/pillar.js";
import type { FaqItem, RenderedPage } from "../content/types.js";

interface ThingSchema {
  [key: string]: unknown;
}

function permalinkForSlug(slug: string): string {
  return `${env.wordpressUrl}/${slug.replace(/^\/+|\/+$/g, "")}/`;
}

function rootUrl(): string {
  return `${env.wordpressUrl.replace(/\/+$/g, "")}/`;
}

function articleSchema(input: {
  title: string;
  description: string;
  slug: string;
  keyword: string;
}): ThingSchema {
  const url = permalinkForSlug(input.slug);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    keywords: [input.keyword],
    mainEntityOfPage: url,
    url,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: env.wordpressUrl,
    },
  };
}

function faqSchema(slug: string, items: FaqItem[]): ThingSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    url: permalinkForSlug(slug),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function breadcrumbSchema(items: Array<{ name: string; url: string }>): ThingSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function breadcrumbItemsForPage(page: RenderedPage): Array<{ name: string; url: string }> {
  const items = [{ name: SITE_NAME, url: rootUrl() }];
  const definition = page.definition;
  const pageUrl = permalinkForSlug(definition.slug);
  const group = findGroupByChildKey(definition.key);

  if (definition.key === PAGE_PARENT.key) {
    items.push({ name: definition.title, url: pageUrl });
    return items;
  }

  if (group) {
    items.push({ name: PAGE_PARENT.title, url: permalinkForSlug(PAGE_PARENT.slug) });
    items.push({ name: group.name, url: permalinkForSlug(group.slug) });
    items.push({ name: definition.title, url: pageUrl });
    return items;
  }

  items.push({ name: definition.title, url: pageUrl });
  return items;
}

function hubCollectionSchema(group: SiloGroup): ThingSchema {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: group.metaTitle,
    description: group.metaDescription,
    url: permalinkForSlug(group.slug),
    isPartOf: {
      "@type": "WebPage",
      name: PAGE_PARENT.title,
      url: permalinkForSlug(PAGE_PARENT.slug),
    },
    about: group.children.map((child) => ({
      "@type": "Thing",
      name: child.description,
    })),
  };
}

export function build42FlowsSchemas(page: RenderedPage): ThingSchema[] {
  const schemas: ThingSchema[] = [
    articleSchema({
      title: page.metaTitle,
      description: page.metaDescription,
      slug: page.definition.slug,
      keyword: page.focusKeyword,
    }),
    breadcrumbSchema(breadcrumbItemsForPage(page)),
  ];

  if (page.schemaType === "FAQ") {
    schemas.push(faqSchema(page.definition.slug, page.faqItems));
  }

  return schemas;
}

export function buildHubPageSchemas(group: SiloGroup): ThingSchema[] {
  return [
    hubCollectionSchema(group),
    breadcrumbSchema([
      { name: SITE_NAME, url: rootUrl() },
      { name: PAGE_PARENT.title, url: permalinkForSlug(PAGE_PARENT.slug) },
      { name: group.name, url: permalinkForSlug(group.slug) },
    ]),
  ];
}

export function buildInstitutionalArticleSchema(input: {
  title: string;
  description: string;
  slug: string;
  keyword: string;
}): ThingSchema[] {
  return [articleSchema(input)];
}

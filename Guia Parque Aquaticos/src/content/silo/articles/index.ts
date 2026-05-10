export interface ArticleContent {
  key: string;
  body: string;
}

import { PILLAR_ARTICLE } from "./pillar.js";
import { COMMERCIAL_ARTICLES } from "./commercial.js";
import { LODGING_ARTICLES } from "./lodging.js";
import { INFORMATIONAL_ARTICLES } from "./informational.js";
import { SEO_ARTICLES } from "./seo.js";
import { TOP_FUNNEL_ARTICLES } from "./top-funnel.js";

const ALL_ARTICLES: ArticleContent[] = [
  PILLAR_ARTICLE,
  ...COMMERCIAL_ARTICLES,
  ...LODGING_ARTICLES,
  ...INFORMATIONAL_ARTICLES,
  ...SEO_ARTICLES,
  ...TOP_FUNNEL_ARTICLES,
];

const ARTICLE_MAP = new Map<string, ArticleContent>(
  ALL_ARTICLES.map((a) => [a.key, a]),
);

export function findArticle(key: string): ArticleContent | undefined {
  return ARTICLE_MAP.get(key);
}

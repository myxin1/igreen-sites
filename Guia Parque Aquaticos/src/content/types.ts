export type PageKind =
  | "pillar"
  | "commercial"
  | "lodging"
  | "informational"
  | "seo"
  | "top-funnel";

export interface SiloPageDefinition {
  key: string;
  title: string;
  slug: string;
  keyword: string;
  secondaryKeywords?: string[];
  type: PageKind;
  schemaType: "Article" | "FAQ";
  children?: string[];
  siblings: string[];
  commercialTargets: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface RenderedPage {
  definition: SiloPageDefinition;
  contentHtml: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  schemaType: "Article" | "FAQ";
  faqItems: FaqItem[];
}

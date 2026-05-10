import type { SiloPageDefinition } from "../types.js";
import { COMMERCIAL_CHILD_PAGES } from "./definitions/children-commercial.js";
import { INFORMATIONAL_CHILD_PAGES } from "./definitions/children-informational.js";
import { LODGING_CHILD_PAGES } from "./definitions/children-lodging.js";
import { SEO_CHILD_PAGES } from "./definitions/children-seo.js";
import { PAGE_PARENT } from "./definitions/pillar.js";
import { TOP_FUNNEL_PAGES } from "./definitions/top-funnel.js";

export const CHILD_PAGES: SiloPageDefinition[] = [
  ...COMMERCIAL_CHILD_PAGES,
  ...LODGING_CHILD_PAGES,
  ...INFORMATIONAL_CHILD_PAGES,
  ...SEO_CHILD_PAGES,
];

export const SILO_PAGES: SiloPageDefinition[] = [
  PAGE_PARENT,
  ...CHILD_PAGES,
  ...TOP_FUNNEL_PAGES,
];

export function findSiloPage(key: string): SiloPageDefinition {
  const page = SILO_PAGES.find((item) => item.key === key);
  if (!page) {
    throw new Error(`Unknown page key: ${key}`);
  }

  return page;
}

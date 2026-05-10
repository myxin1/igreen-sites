import type { SiloPageDefinition } from "../../types.js";
import { COMMERCIAL_CHILD_PAGES } from "./children-commercial.js";
import { INFORMATIONAL_CHILD_PAGES } from "./children-informational.js";
import { LODGING_CHILD_PAGES } from "./children-lodging.js";
import { SEO_CHILD_PAGES } from "./children-seo.js";

const CHILD_KEYS = [
  ...COMMERCIAL_CHILD_PAGES,
  ...LODGING_CHILD_PAGES,
  ...INFORMATIONAL_CHILD_PAGES,
  ...SEO_CHILD_PAGES,
].map((page) => page.key);

export const PAGE_PARENT: SiloPageDefinition = {
  key: "aldeia-das-aguas",
  title: "Aldeia das \u00c1guas Park Resort",
  slug: "aldeia-das-aguas",
  keyword: "aldeia das aguas",
  secondaryKeywords: ["aldeia das aguas park resort", "parque aquatico aldeia das aguas"],
  type: "pillar",
  schemaType: "Article",
  children: CHILD_KEYS,
  siblings: [],
  commercialTargets: ["preco", "ingresso", "desconto", "day-use", "pacote"],
};

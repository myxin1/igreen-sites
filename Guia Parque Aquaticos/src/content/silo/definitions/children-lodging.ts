import type { SiloPageDefinition } from "../../types.js";

export const LODGING_CHILD_PAGES: SiloPageDefinition[] = [
  {
    key: "hotel",
    title: "Hotel da Aldeia das \u00c1guas",
    slug: "hotel-aldeia-das-aguas",
    keyword: "aldeia das aguas hotel",
    type: "lodging",
    schemaType: "FAQ",
    siblings: ["onde-ficar", "airbnb"],
    commercialTargets: ["pacote", "ingresso"],
  },
  {
    key: "onde-ficar",
    title: "Onde Ficar Perto da Aldeia das \u00c1guas",
    slug: "onde-ficar-perto-da-aldeia-das-aguas",
    keyword: "onde ficar perto da aldeia das aguas",
    type: "lodging",
    schemaType: "FAQ",
    siblings: ["hotel", "airbnb"],
    commercialTargets: ["hotel", "pacote"],
  },
  {
    key: "airbnb",
    title: "Airbnb Perto da Aldeia das \u00c1guas",
    slug: "airbnb-aldeia-das-aguas",
    keyword: "airbnb aldeia das aguas",
    type: "lodging",
    schemaType: "FAQ",
    siblings: ["hotel", "onde-ficar"],
    commercialTargets: ["hotel", "pacote"],
  },
];

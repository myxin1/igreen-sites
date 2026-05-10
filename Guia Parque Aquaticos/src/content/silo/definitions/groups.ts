export interface SiloGroupChild {
  key: string;
  description: string;
}

export interface SiloGroup {
  key: string;
  name: string;
  slug: string;
  keyword: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  children: SiloGroupChild[];
  siblingGroupKeys: string[];
}

export const SILO_GROUPS: SiloGroup[] = [
  {
    key: "compra",
    name: "Compra e Precos",
    slug: "aldeia-das-aguas-compra",
    keyword: "comprar ingresso aldeia das aguas",
    metaTitle: "Ingressos e Precos Aldeia das Aguas: Guia de Compra",
    metaDescription:
      "Tudo sobre como comprar ingresso, precos, descontos, day use e pacotes da Aldeia das Aguas. Compare opcoes e escolha a melhor para sua visita.",
    intro:
      "Neste guia voce encontra tudo sobre compra de ingressos, precos, descontos e pacotes da Aldeia das Aguas Park Resort. Compare cada opcao antes de decidir.",
    children: [
      { key: "preco",    description: "Como o preco varia por temporada e perfil. Tabela comparativa." },
      { key: "ingresso", description: "Tipos de ingresso, politica para criancas e como comprar online." },
      { key: "desconto", description: "Como pagar menos: antecipacao, baixa temporada e promocoes." },
      { key: "day-use",  description: "Horario, o que inclui e quando vale mais que o pacote." },
      { key: "pacote",   description: "O que inclui hotel + ingresso e quando compensa reservar." },
    ],
    siblingGroupKeys: ["hospedagem", "planejamento"],
  },
  {
    key: "hospedagem",
    name: "Hospedagem",
    slug: "aldeia-das-aguas-hospedagem",
    keyword: "hospedagem aldeia das aguas",
    metaTitle: "Hospedagem Aldeia das Aguas: Hotel, Airbnb e Onde Ficar",
    metaDescription:
      "Compare opcoes de hospedagem para visitar a Aldeia das Aguas: hotel integrado ao resort, pousadas em Barra do Pirai e Airbnb para grupos.",
    intro:
      "Compare as opcoes de hospedagem para a sua visita a Aldeia das Aguas: o hotel integrado ao resort, pousadas proximas e alternativas de Airbnb.",
    children: [
      { key: "hotel",      description: "Hotel dentro do resort: diarias, o que inclui e quando vale." },
      { key: "onde-ficar", description: "Compare hotel no resort, pousadas e Airbnb em Barra do Pirai." },
      { key: "airbnb",     description: "Melhores Airbnbs proximos. Ideal para grupos e estadias longas." },
    ],
    siblingGroupKeys: ["compra", "planejamento"],
  },
  {
    key: "planejamento",
    name: "Planejamento da Visita",
    slug: "aldeia-das-aguas-planejamento",
    keyword: "como planejar visita aldeia das aguas",
    metaTitle: "Planejar Visita Aldeia das Aguas: Dicas, Horarios e Rotas",
    metaDescription:
      "Guia completo para planejar sua visita a Aldeia das Aguas: horario, como chegar, endereco, atracoes, dicas, melhor dia e o que levar.",
    intro:
      "Tudo o que voce precisa saber para planejar a visita a Aldeia das Aguas: quando ir, como chegar, o que levar e o que esperar de cada atracao.",
    children: [
      { key: "onde-fica",  description: "Localizacao em Barra do Pirai (RJ), a ~100 km do Rio." },
      { key: "como-chegar",description: "Rotas de carro, onibus e GPS. Vindo de SP, RJ e regiao." },
      { key: "endereco",   description: "Endereco completo e como usar o GPS para chegar." },
      { key: "telefone",   description: "Canais de contato para reservas e duvidas." },
      { key: "atracoes",   description: "Tobogans, piscina de ondas, rio lento e area infantil." },
      { key: "horario",    description: "Funcionamento por temporada, feriados e dias da semana." },
      { key: "kilimanjaro",description: "O toboga mais alto do mundo: 49,9m, 60 graus e ~100 km/h." },
      { key: "vale-a-pena",description: "Analise real: pontos positivos, negativos e para quem vai." },
      { key: "dicas",      description: "O que levar, melhor horario de entrada e como evitar filas." },
      { key: "melhor-dia", description: "Menor movimento, menor preco e filas menores nas atracoes." },
      { key: "familia",    description: "Area infantil, restricoes de altura e o que levar com criancas." },
      { key: "opiniao",    description: "Opiniao real: estrutura, gastronomia e pontos fracos." },
    ],
    siblingGroupKeys: ["compra", "hospedagem"],
  },
];

export function findGroup(key: string): SiloGroup | undefined {
  return SILO_GROUPS.find((g) => g.key === key);
}

export function findGroupByChildKey(childKey: string): SiloGroup | undefined {
  return SILO_GROUPS.find((group) => group.children.some((child) => child.key === childKey));
}

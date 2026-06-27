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
    name: "Compra e Preços",
    slug: "aldeia-das-aguas-compra",
    keyword: "comprar ingresso aldeia das aguas",
    metaTitle: "Ingressos e Preços Aldeia das Águas: Guia de Compra",
    metaDescription:
      "Tudo sobre como comprar ingresso, preços, descontos, day use e pacotes da Aldeia das Águas. Compare opções e escolha a melhor para sua visita.",
    intro:
      "Neste guia você encontra tudo sobre compra de ingressos, preços, descontos e pacotes da Aldeia das Águas Park Resort. Compare cada opção antes de decidir.",
    children: [
      { key: "preco",    description: "Como o preço varia por temporada e perfil. Tabela comparativa." },
      { key: "ingresso", description: "Tipos de ingresso, política para crianças e como comprar online." },
      { key: "desconto", description: "Como pagar menos: antecipação, baixa temporada e promoções." },
      { key: "day-use",  description: "Horário, o que inclui e quando vale mais que o pacote." },
      { key: "pacote",   description: "O que inclui hotel + ingresso e quando compensa reservar." },
    ],
    siblingGroupKeys: ["hospedagem", "planejamento"],
  },
  {
    key: "hospedagem",
    name: "Hospedagem",
    slug: "aldeia-das-aguas-hospedagem",
    keyword: "hospedagem aldeia das aguas",
    metaTitle: "Hospedagem Aldeia das Águas: Hotel, Airbnb e Onde Ficar",
    metaDescription:
      "Compare opções de hospedagem para visitar a Aldeia das Águas: hotel integrado ao resort, pousadas em Barra do Piraí e Airbnb para grupos.",
    intro:
      "Compare as opções de hospedagem para a sua visita à Aldeia das Águas: o hotel integrado ao resort, pousadas próximas e alternativas de Airbnb.",
    children: [
      { key: "hotel",      description: "Hotel dentro do resort: diárias, o que inclui e quando vale." },
      { key: "onde-ficar", description: "Compare hotel no resort, pousadas e Airbnb em Barra do Piraí." },
      { key: "airbnb",     description: "Melhores Airbnbs próximos. Ideal para grupos e estadias longas." },
    ],
    siblingGroupKeys: ["compra", "planejamento"],
  },
  {
    key: "planejamento",
    name: "Planejamento da Visita",
    slug: "aldeia-das-aguas-planejamento",
    keyword: "como planejar visita aldeia das aguas",
    metaTitle: "Planejar Visita Aldeia das Águas: Dicas, Horários e Rotas",
    metaDescription:
      "Guia completo para planejar sua visita à Aldeia das Águas: horário, como chegar, endereço, atrações, dicas, melhor dia e o que levar.",
    intro:
      "Tudo o que você precisa saber para planejar a visita à Aldeia das Águas: quando ir, como chegar, o que levar e o que esperar de cada atração.",
    children: [
      { key: "onde-fica",  description: "Localização em Barra do Piraí (RJ), a ~100 km do Rio." },
      { key: "como-chegar",description: "Rotas de carro, ônibus e GPS. Vindo de SP, RJ e região." },
      { key: "endereco",   description: "Endereço completo e como usar o GPS para chegar." },
      { key: "telefone",   description: "Canais de contato para reservas e dúvidas." },
      { key: "atracoes",   description: "Tobogãs, piscina de ondas, rio lento e área infantil." },
      { key: "horario",    description: "Funcionamento por temporada, feriados e dias da semana." },
      { key: "kilimanjaro",description: "O tobogã mais alto do mundo: 49,9m, 60 graus e ~100 km/h." },
      { key: "vale-a-pena",description: "Análise real: pontos positivos, negativos e para quem vai." },
      { key: "dicas",      description: "O que levar, melhor horário de entrada e como evitar filas." },
      { key: "melhor-dia", description: "Menor movimento, menor preço e filas menores nas atrações." },
      { key: "familia",    description: "Área infantil, restrições de altura e o que levar com crianças." },
      { key: "opiniao",    description: "Opinião real: estrutura, gastronomia e pontos fracos." },
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

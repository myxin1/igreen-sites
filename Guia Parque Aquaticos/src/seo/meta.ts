import { SITE_NAME } from "../config/site.js";
import { trimToLength } from "../utils/text.js";

const META_TITLE_MAP: Record<string, string> = {
  // Pillar
  "aldeia das aguas":
    "Aldeia das Águas Park Resort: Guia Completo 2026",
  // Commercial
  "aldeia das aguas preco":
    "Preço Aldeia das Águas: Tabela e Tipos de Ingresso",
  "ingresso aldeia das aguas":
    "Ingresso Aldeia das Águas: Como Comprar e Quanto Custa",
  "aldeia das aguas desconto":
    "Desconto Aldeia das Águas: Como Pagar Menos na Visita",
  "day use aldeia das aguas":
    "Day Use Aldeia das Águas: Preço e O Que Inclui",
  "pacote aldeia das aguas":
    "Pacote Aldeia das Águas: O Que Inclui e Como Reservar",
  // Lodging
  "aldeia das aguas hotel":
    "Hotel Aldeia das Águas: Diárias, Pacotes e Dicas",
  "onde ficar perto da aldeia das aguas":
    "Onde Ficar Perto da Aldeia das Águas: Guia 2026",
  "airbnb aldeia das aguas":
    "Airbnb Perto da Aldeia das Águas: Melhores Opções",
  // Informational
  "aldeia das aguas onde fica":
    "Onde Fica a Aldeia das Águas? Localização Completa",
  "como chegar na aldeia das aguas":
    "Como Chegar na Aldeia das Águas: Rotas e Dicas",
  "aldeia das aguas endereco":
    "Endereço Aldeia das Águas: Localização e Como Chegar",
  "aldeia das aguas telefone":
    "Telefone Aldeia das Águas: Contato e Reservas",
  "atracoes da aldeia das aguas":
    "Atrações da Aldeia das Águas: O Que Tem no Parque",
  "aldeia das aguas horario de funcionamento":
    "Horário Aldeia das Águas: Funcionamento e Calendário",
  "kilimanjaro aldeia das aguas":
    "Kilimanjaro Aldeia das Águas: O Tobogã Mais Alto do Mundo",
  // SEO/Review
  "aldeia das aguas vale a pena":
    "Aldeia das Águas Vale a Pena? Análise Completa",
  "dicas aldeia das aguas":
    "Dicas Aldeia das Águas: Tudo para Aproveitar Mais",
  "melhor dia para ir aldeia das aguas":
    "Melhor Dia para Visitar a Aldeia das Águas",
  "aldeia das aguas com criancas":
    "Aldeia das Águas com Crianças: Guia Completo",
  "aldeia das aguas opiniao":
    "Aldeia das Águas: Opinião Real e Avaliação Completa",
  // Top-funnel
  "parques aquaticos RJ":
    "Parques Aquáticos RJ: Melhores do Rio de Janeiro",
  "melhores parques aquaticos do Brasil":
    "Melhores Parques Aquáticos do Brasil por Região",
  "o que fazer em Barra do Pirai":
    "O Que Fazer em Barra do Piraí: Guia de Atrações",
  "parques aquaticos SP":
    "Parques Aquáticos SP: Melhores de São Paulo 2026",
  "parques aquaticos Santa Catarina":
    "Parques Aquáticos Santa Catarina: Guia Completo",
  "parques aquaticos nordeste":
    "Parques Aquáticos Nordeste: Beach Park e Mais",
};

const META_DESCRIPTION_MAP: Record<string, string> = {
  // Pillar
  "aldeia das aguas":
    "Guia completo sobre a Aldeia das Águas Park Resort em Barra do Piraí (RJ). Preços, ingressos, atrações, hospedagem e dicas para planejar sua visita.",
  // Commercial
  "aldeia das aguas preco":
    "Veja como o preço da Aldeia das Águas varia por temporada e perfil. Tabela comparativa, tipos de ingresso e como economizar na compra.",
  "ingresso aldeia das aguas":
    "Tudo sobre o ingresso da Aldeia das Águas: tipos, valores, política para crianças e como comprar online com mais vantagem.",
  "aldeia das aguas desconto":
    "Descubra como conseguir desconto na Aldeia das Águas: compra antecipada, dias de baixa temporada e melhores épocas para economizar.",
  "day use aldeia das aguas":
    "Como funciona o day use na Aldeia das Águas: horário, o que está incluso, preço e quando é mais vantajoso que o pacote com hotel.",
  "pacote aldeia das aguas":
    "Pacotes na Aldeia das Águas combinam hotel, ingresso e café da manhã. Veja o que inclui, como reservar e quando compensa mais que o day use.",
  // Lodging
  "aldeia das aguas hotel":
    "Hotel integrado ao parque aquático da Aldeia das Águas. Veja como funciona a hospedagem, o que a diária inclui e quando vale pernoitar no resort.",
  "onde ficar perto da aldeia das aguas":
    "Compare opções de hospedagem próximas à Aldeia das Águas: hotel no resort, pousadas em Barra do Piraí e Airbnb para grupos.",
  "airbnb aldeia das aguas":
    "Encontre Airbnbs próximos à Aldeia das Águas em Barra do Piraí. Ideal para grupos ou quem busca mais espaço e custo menor por pessoa.",
  // Informational
  "aldeia das aguas onde fica":
    "A Aldeia das Águas fica em Barra do Piraí, RJ, a ~100 km do Rio. Veja distâncias de SP e RJ, como chegar e mapa interativo.",
  "como chegar na aldeia das aguas":
    "Como chegar na Aldeia das Águas de carro, ônibus ou GPS. Rotas de SP, RJ, estacionamento e melhores horários de saída.",
  "aldeia das aguas endereco":
    "Veja o endereço completo da Aldeia das Águas Park Resort em Barra do Piraí, RJ, e como usar o GPS para chegar sem errar.",
  "aldeia das aguas telefone":
    "Canais de contato da Aldeia das Águas Park Resort: como ligar, WhatsApp, email e site oficial para reservas e dúvidas.",
  "atracoes da aldeia das aguas":
    "Descubra as atrações da Aldeia das Águas: toboáguas radicais, piscina de ondas, rio lento, área infantil e mais. Guia completo.",
  "aldeia das aguas horario de funcionamento":
    "Horário de funcionamento da Aldeia das Águas por temporada, dias da semana e feriados. Saiba quando o parque abre e fecha.",
  "kilimanjaro aldeia das aguas":
    "O Kilimanjaro da Aldeia das Águas tem 49,9 m, 60 graus de inclinação e ~100 km/h. Requisitos de altura e peso, dicas para a fila e o que esperar da descida.",
  // SEO/Review
  "aldeia das aguas vale a pena":
    "A Aldeia das Águas vale a pena? Análise real com pontos positivos, negativos, para quem é indicada e a melhor época para visitar.",
  "dicas aldeia das aguas":
    "As melhores dicas para visitar a Aldeia das Águas: o que levar, melhor horário de entrada, como evitar filas e planejar o dia.",
  "melhor dia para ir aldeia das aguas":
    "Descubra qual o melhor dia para visitar a Aldeia das Águas: menor movimento, preço mais baixo e filas menores nas atrações.",
  "aldeia das aguas com criancas":
    "Guia completo para levar crianças à Aldeia das Águas: área infantil, restrições de altura, dicas práticas e o que levar.",
  "aldeia das aguas opiniao":
    "Opinião real sobre a Aldeia das Águas Park Resort: estrutura, gastronomia, atrações, pontos fracos e quando a visita compensa.",
  // Top-funnel
  "parques aquaticos RJ":
    "Os melhores parques aquáticos do Rio de Janeiro, incluindo a Aldeia das Águas em Barra do Piraí. Guia por região e perfil.",
  "melhores parques aquaticos do Brasil":
    "Guia com os melhores parques aquáticos do Brasil: Beach Park (CE), Thermas dos Laranjais (SP), Aldeia das Águas (RJ) e mais.",
  "o que fazer em Barra do Pirai":
    "O que fazer em Barra do Piraí, RJ: a Aldeia das Águas é a principal atração, com roteiro para um dia ou fim de semana.",
  "parques aquaticos SP":
    "Os melhores parques aquáticos de São Paulo: Thermas dos Laranjais, Acqua World e opções próximas à capital paulista.",
  "parques aquaticos Santa Catarina":
    "Os melhores parques aquáticos de Santa Catarina, com Beto Carrero World em Penha. Guia por região, dicas e planejamento.",
  "parques aquaticos nordeste":
    "Guia dos melhores parques aquáticos do Nordeste: Beach Park em Aquiraz (CE), épocas ideais e dicas para a viagem.",
};

export function buildMetaTitle(keyword: string): string {
  const custom = META_TITLE_MAP[keyword];
  if (custom) return custom;
  const titleCased = keyword
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return trimToLength(`${titleCased} | ${SITE_NAME}`, 60);
}

export function buildMetaDescription(keyword: string, _angle: string): string {
  const custom = META_DESCRIPTION_MAP[keyword];
  if (custom) return custom;
  return trimToLength(
    `Guia completo sobre ${keyword}. Dicas, preços, ingressos, hospedagem e como planejar sua visita com segurança.`,
    155,
  );
}

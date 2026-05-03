import { SITE_NAME } from "../config/site.js";
import { trimToLength } from "../utils/text.js";

const META_TITLE_MAP: Record<string, string> = {
  // Pillar
  "aldeia das aguas":
    "Aldeia das Aguas Park Resort: Guia Completo 2026",
  // Commercial
  "aldeia das aguas preco":
    "Preco Aldeia das Aguas: Tabela e Tipos de Ingresso",
  "ingresso aldeia das aguas":
    "Ingresso Aldeia das Aguas: Como Comprar e Quanto Custa",
  "aldeia das aguas desconto":
    "Desconto Aldeia das Aguas: Como Pagar Menos na Visita",
  "day use aldeia das aguas":
    "Day Use Aldeia das Aguas: Preco e O Que Inclui",
  "pacote aldeia das aguas":
    "Pacote Aldeia das Aguas: O Que Inclui e Como Reservar",
  // Lodging
  "aldeia das aguas hotel":
    "Hotel Aldeia das Aguas: Diarias, Pacotes e Dicas",
  "onde ficar perto da aldeia das aguas":
    "Onde Ficar Perto da Aldeia das Aguas: Guia 2026",
  "airbnb aldeia das aguas":
    "Airbnb Perto da Aldeia das Aguas: Melhores Opcoes",
  // Informational
  "aldeia das aguas onde fica":
    "Onde Fica a Aldeia das Aguas? Localizacao Completa",
  "como chegar na aldeia das aguas":
    "Como Chegar na Aldeia das Aguas: Rotas e Dicas",
  "aldeia das aguas endereco":
    "Endereco Aldeia das Aguas: Localizacao e Como Chegar",
  "aldeia das aguas telefone":
    "Telefone Aldeia das Aguas: Contato e Reservas",
  "atracoes da aldeia das aguas":
    "Atracoes da Aldeia das Aguas: O Que Tem no Parque",
  "aldeia das aguas horario de funcionamento":
    "Horario Aldeia das Aguas: Funcionamento e Calendario",
  // SEO/Review
  "aldeia das aguas vale a pena":
    "Aldeia das Aguas Vale a Pena? Analise Completa",
  "dicas aldeia das aguas":
    "Dicas Aldeia das Aguas: Tudo para Aproveitar Mais",
  "melhor dia para ir aldeia das aguas":
    "Melhor Dia para Visitar a Aldeia das Aguas",
  "aldeia das aguas com criancas":
    "Aldeia das Aguas com Criancas: Guia Completo",
  "aldeia das aguas opiniao":
    "Aldeia das Aguas: Opiniao Real e Avaliacao Completa",
  // Top-funnel
  "parques aquaticos RJ":
    "Parques Aquaticos RJ: Melhores do Rio de Janeiro",
  "melhores parques aquaticos do Brasil":
    "Melhores Parques Aquaticos do Brasil por Regiao",
  "o que fazer em Barra do Pirai":
    "O Que Fazer em Barra do Pirai: Guia de Atracoes",
  "parques aquaticos SP":
    "Parques Aquaticos SP: Melhores de Sao Paulo 2026",
  "parques aquaticos Santa Catarina":
    "Parques Aquaticos Santa Catarina: Guia Completo",
  "parques aquaticos nordeste":
    "Parques Aquaticos Nordeste: Beach Park e Mais",
};

const META_DESCRIPTION_MAP: Record<string, string> = {
  // Pillar
  "aldeia das aguas":
    "Guia completo sobre a Aldeia das Aguas Park Resort em Barra do Pirai (RJ). Precos, ingressos, atracoes, hospedagem e dicas para planejar sua visita.",
  // Commercial
  "aldeia das aguas preco":
    "Veja como o preco da Aldeia das Aguas varia por temporada e perfil. Tabela comparativa, tipos de ingresso e como economizar na compra.",
  "ingresso aldeia das aguas":
    "Tudo sobre o ingresso da Aldeia das Aguas: tipos, valores, politica para criancas e como comprar online com mais vantagem.",
  "aldeia das aguas desconto":
    "Descubra como conseguir desconto na Aldeia das Aguas: compra antecipada, dias de baixa temporada e melhores epocas para economizar.",
  "day use aldeia das aguas":
    "Como funciona o day use na Aldeia das Aguas: horario, o que esta incluso, preco e quando e mais vantajoso que o pacote com hotel.",
  "pacote aldeia das aguas":
    "Pacotes na Aldeia das Aguas combinam hotel, ingresso e cafe da manha. Veja o que inclui, como reservar e quando compensa mais que o day use.",
  // Lodging
  "aldeia das aguas hotel":
    "Hotel integrado ao parque aquatico da Aldeia das Aguas. Veja como funciona a hospedagem, o que a diaria inclui e quando vale pernoitar no resort.",
  "onde ficar perto da aldeia das aguas":
    "Compare opcoes de hospedagem proximas a Aldeia das Aguas: hotel no resort, pousadas em Barra do Pirai e Airbnb para grupos.",
  "airbnb aldeia das aguas":
    "Encontre Airbnbs proximos a Aldeia das Aguas em Barra do Pirai. Ideal para grupos ou quem busca mais espaco e custo menor por pessoa.",
  // Informational
  "aldeia das aguas onde fica":
    "A Aldeia das Aguas fica em Barra do Pirai, RJ, a ~100 km do Rio. Veja distancias de SP e RJ, como chegar e mapa interativo.",
  "como chegar na aldeia das aguas":
    "Como chegar na Aldeia das Aguas de carro, onibus ou GPS. Rotas de SP, RJ, estacionamento e melhores horarios de saida.",
  "aldeia das aguas endereco":
    "Veja o endereco completo da Aldeia das Aguas Park Resort em Barra do Pirai, RJ, e como usar o GPS para chegar sem errar.",
  "aldeia das aguas telefone":
    "Canais de contato da Aldeia das Aguas Park Resort: como ligar, WhatsApp, email e site oficial para reservas e duvidas.",
  "atracoes da aldeia das aguas":
    "Descubra as atracoes da Aldeia das Aguas: tobogans radicais, piscina de ondas, rio lento, area infantil e mais. Guia completo.",
  "aldeia das aguas horario de funcionamento":
    "Horario de funcionamento da Aldeia das Aguas por temporada, dias da semana e feriados. Saiba quando o parque abre e fecha.",
  // SEO/Review
  "aldeia das aguas vale a pena":
    "A Aldeia das Aguas vale a pena? Analise real com pontos positivos, negativos, para quem e indicada e a melhor epoca para visitar.",
  "dicas aldeia das aguas":
    "As melhores dicas para visitar a Aldeia das Aguas: o que levar, melhor horario de entrada, como evitar filas e planejar o dia.",
  "melhor dia para ir aldeia das aguas":
    "Descubra qual o melhor dia para visitar a Aldeia das Aguas: menor movimento, preco mais baixo e filas menores nas atracoes.",
  "aldeia das aguas com criancas":
    "Guia completo para levar criancas a Aldeia das Aguas: area infantil, restricoes de altura, dicas praticas e o que levar.",
  "aldeia das aguas opiniao":
    "Opiniao real sobre a Aldeia das Aguas Park Resort: estrutura, gastronomia, atracoes, pontos fracos e quando a visita compensa.",
  // Top-funnel
  "parques aquaticos RJ":
    "Os melhores parques aquaticos do Rio de Janeiro, incluindo a Aldeia das Aguas em Barra do Pirai. Guia por regiao e perfil.",
  "melhores parques aquaticos do Brasil":
    "Guia com os melhores parques aquaticos do Brasil: Beach Park (CE), Thermas dos Laranjais (SP), Aldeia das Aguas (RJ) e mais.",
  "o que fazer em Barra do Pirai":
    "O que fazer em Barra do Pirai, RJ: a Aldeia das Aguas e a principal atracao, com roteiro para um dia ou fim de semana.",
  "parques aquaticos SP":
    "Os melhores parques aquaticos de Sao Paulo: Thermas dos Laranjais, Acqua World e opcoes proximas a capital paulista.",
  "parques aquaticos Santa Catarina":
    "Os melhores parques aquaticos de Santa Catarina, com Beto Carrero World em Penha. Guia por regiao, dicas e planejamento.",
  "parques aquaticos nordeste":
    "Guia dos melhores parques aquaticos do Nordeste: Beach Park em Aquiraz (CE), epocas ideais e dicas para a viagem.",
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
    `Guia completo sobre ${keyword}. Dicas, precos, ingressos, hospedagem e como planejar sua visita com seguranca.`,
    155,
  );
}

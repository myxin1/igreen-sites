import { AFFILIATE_URL } from "../../config/site.js";
import { buildMetaDescription, buildMetaTitle } from "../../seo/meta.js";
import { escapeHtml, trimToLength } from "../../utils/text.js";
import type { FaqItem, RenderedPage, SiloPageDefinition } from "../types.js";
import { findArticle } from "./articles/index.js";
import { htmlBlock, htmlToBlocks } from "./blocks.js";
import { buildSimpleArticle } from "./copy.js";
import { articleLinkTargets } from "./linking.js";
import { SILO_PAGES } from "./registry.js";

// Styles for isolated wp:html components (FAQ, CTA, map cards)
const H2_STYLE =
  "font-family:Georgia,'Times New Roman',serif;color:#0f4f46;font-size:30px;line-height:1.3;margin:0 0 14px;";
const P_STYLE = "margin:0 0 18px;color:#21433d;font-size:18px;line-height:1.85;";
const FAQ_CARD_STYLE =
  "margin:32px 0 0;padding:24px 22px;border:1px solid #d7ebe5;border-radius:18px;background:#f7fcfb;";
const CTA_STYLE =
  "margin:26px 0 0;padding:24px 22px;border:1px solid #cfe5df;border-radius:20px;background:linear-gradient(135deg,#f4fbf8 0%,#e8f5f1 100%);box-shadow:0 16px 34px rgba(15,79,70,.08);";
const CTA_BUTTON_STYLE =
  "display:inline-block;padding:14px 20px;border-radius:12px;background:linear-gradient(135deg,#ff8a00 0%,#ff5a2a 100%);color:#1f0a00;text-decoration:none;font-weight:800;box-shadow:0 10px 24px rgba(255,90,42,.22);";

function topicName(page: SiloPageDefinition): string {
  return page.title;
}

function wordCount(html: string): number {
  return html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
}

function reinforcementSection(page: SiloPageDefinition): string {
  const targets = articleLinkTargets(page);
  const labelList = targets.map((target) => target.label).join(", ");

  return [
    `<h2>Como usar este conteúdo no planejamento</h2>`,
    `<p>${escapeHtml(
      `Depois de entender ${topicName(page)}, vale resumir a sua própria situação: quem vai, qual é a data provável e o que ainda precisa ser confirmado. Esse filtro simples ajuda a usar melhor as informações do artigo e evita abrir páginas que não respondem à sua dúvida de agora.`,
    )}</p>`,
    `<p>${escapeHtml(
      labelList
        ? `Se ainda faltar segurança para decidir, compare somente ${labelList}. Esses links foram escolhidos porque continuam a mesma linha de raciocínio e ajudam a aprofundar o tema sem desviar para outro assunto cedo demais.`
        : `Se ainda faltar segurança para decidir, vale reler os pontos principais do artigo e manter a comparação dentro deste mesmo assunto. A ideia é sair da página com uma próxima ação clara, e não com mais ruído.`,
    )}</p>`,
  ].join("");
}

function mapSection(page: SiloPageDefinition): string {
  const maps: Partial<Record<string, { title: string; query: string; intro: string; label: string }>> = {
    "onde-fica": {
      title: "Localização da Aldeia das Águas",
      query: "Aldeia das Aguas Park Resort Barra do Pirai RJ",
      intro: "Clique no botão abaixo para ver a localização exata do resort no Google Maps antes de planejar a rota.",
      label: "Ver no Google Maps",
    },
    "como-chegar": {
      title: "Rota para a Aldeia das Águas",
      query: "Aldeia das Aguas Park Resort Barra do Pirai RJ",
      intro: "Use o link abaixo para abrir a rota no Google Maps diretamente no seu celular ou computador.",
      label: "Abrir rota no Google Maps",
    },
    endereco: {
      title: "Endereço no mapa",
      query: "Aldeia das Aguas Park Resort Barra do Pirai RJ",
      intro: "Confirme o ponto exato do resort antes de iniciar o GPS — evita erros comuns de navegação.",
      label: "Confirmar endereço no Maps",
    },
    "o-que-fazer-barra-do-pirai": {
      title: "Mapa de Barra do Piraí",
      query: "Barra do Pirai RJ",
      intro: "Veja onde fica a cidade e explore a região no mapa antes de montar o roteiro.",
      label: "Ver Barra do Piraí no Maps",
    },
  };

  const map = maps[page.key];
  if (!map) return "";

  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(map.query)}`;
  const html = [
    `<div style="${FAQ_CARD_STYLE}">`,
    `<h2 style="${H2_STYLE}">${escapeHtml(map.title)}</h2>`,
    `<p style="${P_STYLE}">${escapeHtml(map.intro)}</p>`,
    `<a href="${url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:10px;padding:13px 20px;background:#0f4f46;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:.9rem;box-shadow:0 6px 16px rgba(15,79,70,.22);">`,
    `<span>&#128205;</span>`,
    `<span>${escapeHtml(map.label)}</span>`,
    `</a>`,
    `<p style="margin:12px 0 0;font-size:13px;color:#5b7b75;">Endere&ccedil;o: Avenida Aldeia das &Aacute;guas, s/n &mdash; Barra do Pira&iacute;, RJ &mdash; CEP 27145-616</p>`,
    `</div>`,
  ].join("");

  return htmlBlock(html);
}

const FAQ_MAP: Partial<Record<string, FaqItem[]>> = {
  "aldeia-das-aguas": [
    {
      question: "Aldeia das Águas funciona melhor para bate-volta ou fim de semana?",
      answer:
        "Os dois formatos podem funcionar, mas a resposta muda conforme a distância, o perfil do grupo e a necessidade de descanso. Quem vem de longe costuma aproveitar melhor com mais planejamento.",
    },
    {
      question: "Vale olhar compra, hospedagem e planejamento ao mesmo tempo?",
      answer:
        "Não. A leitura fica melhor quando cada etapa é resolvida no artigo certo. Essa separação deixa a decisão mais simples e reduz a sensação de bagunça.",
    },
    {
      question: "Qual o primeiro passo depois deste guia principal?",
      answer:
        "Começar pelo assunto que mais pesa na sua decisão: ingresso e preço, hospedagem ou planejamento da visita. Assim a leitura fica mais curta e objetiva.",
    },
  ],
  preco: [
    {
      question: "O preço da Aldeia das Águas muda bastante?",
      answer:
        "Sim. Data, demanda e antecedência pesam bastante. Por isso o melhor valor quase sempre depende do contexto da visita, e não de um único número solto.",
    },
    {
      question: "Preço menor sempre significa melhor compra?",
      answer:
        "Não. Um valor baixo em uma data ruim pode gerar mais fila, menos conforto e pior aproveitamento do parque. O custo-benefício precisa ser lido junto com o restante da experiência.",
    },
    {
      question: "Quando vale continuar nesta mesma categoria?",
      answer:
        "Quando a dúvida ainda é comercial. Se você ainda está comparando ingresso, desconto, day use ou pacote, continuar dentro desta categoria faz mais sentido do que saltar para outro tema.",
    },
  ],
  ingresso: [
    {
      question: "Comprar ingresso antes costuma valer a pena?",
      answer:
        "Na maioria dos casos, sim. A compra antecipada melhora a previsibilidade, ajuda a comparar formatos e reduz a chance de resolver tudo em cima da hora.",
    },
    {
      question: "Ingresso e pacote respondem à mesma necessidade?",
      answer:
        "Não. O ingresso costuma atender melhor quem vai por um dia, enquanto o pacote faz mais sentido quando a viagem inclui hospedagem e mais organização.",
    },
    {
      question: "O que revisar antes de fechar a compra?",
      answer:
        "Canal de compra, data escolhida, política de alteração e tudo o que realmente está incluso. Essa checagem evita frustração depois do pagamento.",
    },
  ],
  desconto: [
    {
      question: "Onde costuma aparecer desconto na Aldeia das Águas?",
      answer:
        "Na maioria dos casos, o ganho real aparece em data melhor escolhida, compra com antecedência e comparação inteligente entre formatos — e não em cupom milagroso.",
    },
    {
      question: "Desconto sempre significa melhor negócio?",
      answer:
        "Não. Um valor menor em uma data ruim ou em um formato que não combina com a sua viagem pode gerar uma experiência pior e uma falsa sensação de economia.",
    },
    {
      question: "Como economizar sem errar na compra?",
      answer:
        "Vale cruzar data, movimento esperado, antecedência e tipo de visita. Esse filtro ajuda a diferenciar promoção real de oferta que só parece vantajosa no primeiro olhar.",
    },
  ],
  "day-use": [
    {
      question: "Quando o day use da Aldeia das Águas costuma valer mais?",
      answer:
        "O day use costuma valer mais para quem mora mais perto, consegue sair cedo e quer curtir o parque sem transformar a viagem em hospedagem.",
    },
    {
      question: "Day use funciona bem para qualquer perfil?",
      answer:
        "Não. Quando há estrada longa, crianças pequenas ou grupo mais cansado, a economia aparente pode perder força diante do desgaste do bate-volta.",
    },
    {
      question: "Como saber se o day use combina com a sua viagem?",
      answer:
        "Vale medir a distância, o horário de saída, a energia do grupo e se existe vontade real de dormir na região. Essa conta costuma mostrar rápido se o formato encaixa ou não.",
    },
  ],
  pacote: [
    {
      question: "Quando o pacote da Aldeia das Águas costuma valer mais?",
      answer:
        "O pacote costuma valer mais quando a viagem inclui hospedagem, estrada mais longa ou necessidade de deixar a organização mais simples para o grupo.",
    },
    {
      question: "Pacote é sempre melhor do que comprar separado?",
      answer:
        "Não. Ele faz mais sentido quando reduz etapas e combina com a forma como você vai usar parque e hospedagem. Em alguns casos, comprar separado ainda pode funcionar melhor.",
    },
    {
      question: "O que conferir antes de fechar um pacote?",
      answer:
        "Vale revisar quantos dias de parque entram na oferta, qual hospedagem está incluída, se há extras relevantes e quais são as regras de reserva ou alteração.",
    },
  ],
  hotel: [
    {
      question: "Quando o hotel da Aldeia das Águas costuma compensar mais?",
      answer:
        "O hotel costuma compensar mais para famílias com crianças, casais em fim de semana e visitantes que vêm de longe e querem reduzir deslocamento e cansaço.",
    },
    {
      question: "Vale comparar o hotel com hospedagens externas?",
      answer:
        "Sim. A comparação mais justa não olha só a diária, mas também o tempo de trajeto, a praticidade para chegar ao parque e a energia do grupo ao longo da viagem.",
    },
    {
      question: "Dormir no complexo muda muito a experiência?",
      answer:
        "Para muitos perfis, sim. Estar no próprio destino pode deixar a viagem mais leve, especialmente quando há crianças, estrada longa ou vontade de aproveitar com menos correria.",
    },
  ],
  "onde-ficar": [
    {
      question: "Como escolher onde ficar perto da Aldeia das Águas?",
      answer:
        "O mais útil é decidir primeiro se a prioridade da viagem é praticidade, economia, espaço ou autonomia. A partir disso, a comparação entre hotel interno e opções externas fica bem mais clara.",
    },
    {
      question: "Vale ficar dentro do resort ou buscar hospedagem externa?",
      answer:
        "Depende do seu perfil. Ficar dentro do resort costuma ganhar em conveniência, enquanto hospedagens externas podem equilibrar melhor o custo para alguns grupos.",
    },
    {
      question: "O que mais pesa nessa escolha?",
      answer:
        "Tempo de deslocamento, tamanho do grupo, rotina da viagem e relação entre diária e praticidade total costumam pesar mais do que a foto da acomodação isolada.",
    },
  ],
  airbnb: [
    {
      question: "Quando um Airbnb perto da Aldeia das Águas costuma valer mais?",
      answer:
        "O Airbnb costuma valer mais para grupos maiores, estadias mais longas ou viagens em que cozinha, espaço e divisão de custos fazem diferença real.",
    },
    {
      question: "Airbnb é melhor do que hotel para qualquer grupo?",
      answer:
        "Não. Ele ganha em autonomia, mas pode perder em praticidade quando a distância ao parque, a rotina com crianças ou a correria da viagem pesam mais.",
    },
    {
      question: "O que comparar antes de reservar um Airbnb?",
      answer:
        "Vale revisar a distância até o parque, a estrutura da casa, a possibilidade de dividir custos e quanto a logística extra vai pesar no seu roteiro.",
    },
  ],
  atracoes: [
    {
      question: "Como explorar as atrações da Aldeia das Águas sem se perder?",
      answer:
        "O melhor caminho é separar o parque por tipo de experiência: áreas mais tranquilas, espaços para crianças e atrações que pedem mais disposição. Isso ajuda a montar um roteiro mais coerente.",
    },
    {
      question: "Vale montar a ordem das atrações antes da visita?",
      answer:
        "Sim. Pensar na ordem antes de chegar ajuda a reduzir fila, cansaço e idas desnecessárias de um lado ao outro do parque.",
    },
    {
      question: "As mesmas atrações funcionam bem para qualquer grupo?",
      answer:
        "Não. Famílias com crianças, grupos que querem descanso e pessoas que gostam de adrenalina usam o parque de formas bem diferentes.",
    },
  ],
  "vale-a-pena": [
    {
      question: "Afinal, a Aldeia das Águas vale a pena?",
      answer:
        "Para muitos perfis, sim. O parque tende a valer mais a pena quando a expectativa combina com a estrutura, a data escolhida ajuda a experiência e o custo faz sentido para o tipo de passeio desejado.",
    },
    {
      question: "Para quem a Aldeia das Águas costuma funcionar melhor?",
      answer:
        "Costuma funcionar melhor para famílias, casais e grupos que querem um parque amplo, com possibilidade de passar o dia inteiro ou combinar a visita com hospedagem.",
    },
    {
      question: "O que mais muda essa percepção de custo-benefício?",
      answer:
        "Data, lotação, perfil do grupo, distância da viagem e expectativa realista sobre o parque costumam pesar mais do que uma opinião isolada.",
    },
  ],
  dicas: [
    {
      question: "Quais dicas realmente fazem diferença na Aldeia das Águas?",
      answer:
        "As que melhoram fila, ritmo, conforto e organização do grupo. Em geral, chegar cedo, planejar pausas e escolher bem as primeiras áreas costumam fazer bastante diferença.",
    },
    {
      question: "Vale planejar refeição e descanso antes da visita?",
      answer:
        "Sim. Isso ajuda a evitar correria, irritação e cansaço acumulado, especialmente em dias mais quentes ou viagens com crianças.",
    },
    {
      question: "Dicas simples costumam resolver mais do que listas longas?",
      answer:
        "Na maioria dos casos, sim. Orientações práticas e aplicáveis costumam melhorar mais a experiência do que uma lista grande de pontos pouco relevantes.",
    },
  ],
  "melhor-dia": [
    {
      question: "Qual costuma ser o melhor dia para ir à Aldeia das Águas?",
      answer:
        "Em geral, dias úteis fora de feriados e picos de temporada tendem a oferecer uma experiência mais confortável, com menos fila e melhor percepção de custo-benefício.",
    },
    {
      question: "Fim de semana e feriado sempre pioram a experiência?",
      answer:
        "Nem sempre, mas costumam aumentar o movimento e reduzir a sensação de tranquilidade. Para quem tem flexibilidade, escolher datas mais leves costuma ajudar bastante.",
    },
    {
      question: "A escolha do dia muda mesmo o aproveitamento?",
      answer:
        "Sim. Muda fila, conforto, ritmo do grupo e até a forma como o visitante percebe o valor que pagou pela experiência.",
    },
  ],
  familia: [
    {
      question: "A Aldeia das Águas funciona bem para crianças?",
      answer:
        "Sim, especialmente quando a família monta um roteiro mais leve e respeita o ritmo das crianças. O parque tende a render melhor com pausas, ordem de atrações e expectativa ajustada.",
    },
    {
      question: "O que mais ajuda em uma visita com crianças?",
      answer:
        "Escolher áreas adequadas para a idade, intercalar descanso com brincadeira e evitar correria excessiva costuma fazer mais diferença do que tentar ver tudo.",
    },
    {
      question: "Vale planejar o dia com antecedência quando há crianças?",
      answer:
        "Vale muito. Isso ajuda a reduzir cansaço, evitar excesso de fila e deixar o passeio mais confortável para toda a família.",
    },
  ],
  "parques-aquaticos-rj": [
    {
      question: "Como comparar parques aquáticos no RJ sem cair em lista genérica?",
      answer:
        "O melhor caminho é cruzar distância, perfil do público e tipo de passeio. Isso produz uma comparação muito mais útil do que um ranking vazio.",
    },
    {
      question: "Vale comparar parques de um dia com destinos de fim de semana?",
      answer:
        "Pode valer, desde que você ajuste o critério. O que serve para um bate-volta raramente resolve da mesma forma uma viagem maior.",
    },
    {
      question: "Quais links vale abrir depois desta comparação?",
      answer:
        "Vale abrir apenas os guias que continuam a comparação entre parques parecidos. Assim você aprofunda a escolha sem sair cedo demais para página de compra ou reserva.",
    },
  ],
  telefone: [
    {
      question: "Qual é o telefone principal da Aldeia das Águas?",
      answer:
        "Na verificação feita em 10 de maio de 2026 no site oficial, a Secretaria do Parque aparecia como (24) 3025-8180 e o WhatsApp como (24) 99986-9620.",
    },
    {
      question: "Qual número usar para falar sobre o hotel?",
      answer:
        "Para hospedagem, a página oficial informava a Central de Reservas do Hotel Quartzo no número (24) 99870-4944.",
    },
    {
      question: "Existe outro canal de atendimento?",
      answer:
        "Sim. O escritório de Volta Redonda aparecia com o número (24) 3025-8185 na página oficial de contato da Aldeia das Águas.",
    },
  ],
};

function defaultFaq(page: SiloPageDefinition): FaqItem[] {
  const topic = topicName(page);

  return [
    {
      question: `${topic} resolve qual dúvida principal?`,
      answer:
        "Esta página resolve a pergunta central deste tema e ajuda a avançar com mais segurança antes de abrir outros assuntos da viagem.",
    },
    {
      question: `Quando vale abrir outro artigo além de ${topic}?`,
      answer:
        "Quando a sua dúvida mudar de assunto. Se você ainda estiver comparando a mesma decisão, vale continuar apenas pelos links relacionados desta página.",
    },
    {
      question: `O que conferir antes de decidir sobre ${topic}?`,
      answer:
        "Vale revisar somente os pontos que mudam o seu caso real, como data, distância, perfil do grupo, formato da compra ou necessidade de hospedagem.",
    },
  ];
}

function faqForPage(page: SiloPageDefinition): FaqItem[] {
  return FAQ_MAP[page.key] ?? defaultFaq(page);
}

function faqBlock(page: SiloPageDefinition, items: FaqItem[]): string {
  const accordions = items
    .map(
      (item) =>
        `<details style="padding:4px 0 0;border:1px solid #cfe5df;border-radius:14px;background:#ffffff;margin-bottom:12px;overflow:hidden;">` +
        `<summary style="list-style:none;cursor:pointer;padding:16px 18px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#0f4f46;">${escapeHtml(item.question)}</summary>` +
        `<div style="padding:0 18px 18px 18px;"><p style="${P_STYLE};margin-bottom:0;">${escapeHtml(item.answer)}</p></div>` +
        `</details>`,
    )
    .join("");

  const html = [
    `<div style="${FAQ_CARD_STYLE}">`,
    `<h2 style="${H2_STYLE}">Perguntas frequentes sobre ${escapeHtml(topicName(page))}</h2>`,
    accordions,
    `</div>`,
  ].join("");

  return htmlBlock(html);
}

function ctaBlock(page: SiloPageDefinition): string {
  const html = [
    `<div style="${CTA_STYLE}">`,
    `<h2 style="${H2_STYLE}">Pronto para ver a oferta atual?</h2>`,
    `<p style="${P_STYLE}">Se ${escapeHtml(topicName(page))} ja faz sentido para o seu plano, confira o link de afiliado antes de fechar a compra. Assim voce sai desta leitura com uma proxima acao objetiva.</p>`,
    `<a href="${AFFILIATE_URL}" rel="nofollow sponsored" target="_blank" style="${CTA_BUTTON_STYLE}">Ver ingresso e promocao</a>`,
    `</div>`,
  ].join("");

  return htmlBlock(html);
}

export function renderPage(page: SiloPageDefinition): RenderedPage {
  const faq = faqForPage(page);

  // Convert article body HTML to native Gutenberg blocks
  const rawBody = findArticle(page.key)?.body ?? buildSimpleArticle(page);
  let articleBlocks = htmlToBlocks(rawBody);

  // Pad to minimum word count by appending a reinforcement section
  while (wordCount(articleBlocks) < 420) {
    articleBlocks = `${articleBlocks}\n\n${htmlToBlocks(reinforcementSection(page))}`;
  }

  // Compose: native article blocks + isolated wp:html for complex components
  const mapHtml = mapSection(page);
  const parts = [
    articleBlocks,
    ...(mapHtml ? [mapHtml] : []),
    faqBlock(page, faq),
    ctaBlock(page),
  ];

  const contentHtml = parts.join("\n\n");

  return {
    definition: page,
    contentHtml,
    excerpt: trimToLength(
      `Guia simples sobre ${topicName(page)} com foco na intencao de busca, FAQ no final e caminho direto para a proxima decisao.`,
      155,
    ),
    metaTitle: buildMetaTitle(page.keyword),
    metaDescription: buildMetaDescription(page.keyword, `Guia simples sobre ${topicName(page)}`),
    focusKeyword: page.keyword,
    schemaType: page.schemaType,
    faqItems: faq,
  };
}

export function renderAllPages(): RenderedPage[] {
  return SILO_PAGES.map(renderPage);
}

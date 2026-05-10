import { AFFILIATE_URL } from "../../config/site.js";
import { buildMetaDescription, buildMetaTitle } from "../../seo/meta.js";
import { escapeHtml, trimToLength } from "../../utils/text.js";
import type { FaqItem, RenderedPage, SiloPageDefinition } from "../types.js";
import { buildSimpleArticle } from "./copy.js";
import { articleLinkTargets } from "./linking.js";
import { SILO_PAGES } from "./registry.js";

const WRAPPER_STYLE =
  "font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#21433d;font-size:18px;line-height:1.85;";
const H2_STYLE =
  "font-family:Georgia,'Times New Roman',serif;color:#0f4f46;font-size:30px;line-height:1.3;margin:36px 0 14px;";
const H3_STYLE =
  "font-family:Georgia,'Times New Roman',serif;color:#1f6a5f;font-size:23px;line-height:1.35;margin:26px 0 10px;";
const P_STYLE = "margin:0 0 18px;color:#21433d;";
const UL_STYLE = "margin:18px 0 24px;padding-left:22px;";
const LI_STYLE = "margin-bottom:12px;color:#21433d;";
const LINK_STYLE =
  "color:#0f6a5c;font-weight:700;text-decoration:underline;text-decoration-color:#a8d9cf;text-underline-offset:3px;";
const STRONG_STYLE = "color:#0a3f38;";
const FAQ_CARD_STYLE =
  "margin:32px 0 0;padding:24px 22px;border:1px solid #d7ebe5;border-radius:18px;background:#f7fcfb;";
const CTA_STYLE =
  "margin:26px 0 0;padding:24px 22px;border:1px solid #cfe5df;border-radius:20px;background:linear-gradient(135deg,#f4fbf8 0%,#e8f5f1 100%);box-shadow:0 16px 34px rgba(15,79,70,.08);";
const CTA_BUTTON_STYLE =
  "display:inline-block;padding:14px 20px;border-radius:12px;background:linear-gradient(135deg,#ff8a00 0%,#ff5a2a 100%);color:#ffffff;text-decoration:none;font-weight:700;box-shadow:0 10px 24px rgba(255,90,42,.22);";

function topicName(page: SiloPageDefinition): string {
  return page.title;
}

function decorateArticleBody(html: string): string {
  return html
    .trim()
    .replace(/<h2>/g, `<h2 style="${H2_STYLE}">`)
    .replace(/<h3>/g, `<h3 style="${H3_STYLE}">`)
    .replace(/<p>/g, `<p style="${P_STYLE}">`)
    .replace(/<ul>/g, `<ul style="${UL_STYLE}">`)
    .replace(/<li>/g, `<li style="${LI_STYLE}">`)
    .replace(/<strong>/g, `<strong style="${STRONG_STYLE}">`)
    .replace(/<a /g, `<a style="${LINK_STYLE}" `);
}

function wordCount(html: string): number {
  return html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
}

function reinforcementSection(page: SiloPageDefinition): string {
  const targets = articleLinkTargets(page);
  const labelList = targets.map((target) => target.label).join(", ");

  return [
    `<h2>Como usar este conteudo no planejamento</h2>`,
    `<p>${escapeHtml(
      `Depois de entender ${topicName(page)}, vale resumir a sua propria situacao: quem vai, qual e a data provavel e o que ainda precisa ser confirmado. Esse filtro simples ajuda a usar melhor as informacoes do artigo e evita abrir paginas que nao respondem a sua duvida de agora.`,
    )}</p>`,
    `<p>${escapeHtml(
      labelList
        ? `Se ainda faltar seguranca para decidir, compare somente ${labelList}. Esses links foram escolhidos porque continuam a mesma linha de raciocinio e ajudam a aprofundar o tema sem desviar para outro assunto cedo demais.`
        : `Se ainda faltar seguranca para decidir, vale reler os pontos principais do artigo e manter a comparacao dentro deste mesmo assunto. A ideia e sair da pagina com uma proxima acao clara, e nao com mais ruido.`,
    )}</p>`,
  ].join("");
}

function mapSection(page: SiloPageDefinition): string {
  const embeds: Partial<Record<string, { title: string; query: string; intro: string }>> = {
    "onde-fica": {
      title: "Mapa da Aldeia das Aguas",
      query: "Aldeia das Aguas Park Resort Barra do Pirai RJ",
      intro: "Se a sua duvida principal e localizacao, este mapa ajuda a visualizar a regiao do parque e o contexto da viagem antes de sair de casa.",
    },
    "como-chegar": {
      title: "Rota para chegar na Aldeia das Aguas",
      query: "Aldeia das Aguas Park Resort Barra do Pirai RJ",
      intro: "Use este mapa como apoio para conferir o trajeto e validar se o roteiro faz sentido para bate-volta ou para uma viagem com hospedagem.",
    },
    endereco: {
      title: "Endereco da Aldeia das Aguas no mapa",
      query: "Aldeia das Aguas Park Resort Barra do Pirai RJ",
      intro: "Quando a busca e por endereco, o mapa ajuda a confirmar o ponto correto e evita erro de navegação na hora de iniciar o GPS.",
    },
    "o-que-fazer-barra-do-pirai": {
      title: "Mapa de Barra do Pirai",
      query: "Barra do Pirai RJ",
      intro: "Neste caso, o mapa ajuda a entender onde a cidade fica e como a Aldeia das Aguas entra no roteiro da regiao.",
    },
  };

  const embed = embeds[page.key];
  if (!embed) return "";

  const src = `https://www.google.com/maps?q=${encodeURIComponent(embed.query)}&output=embed`;
  return [
    `<div style="${FAQ_CARD_STYLE}">`,
    `<h2 style="${H2_STYLE};margin-top:0;">${escapeHtml(embed.title)}</h2>`,
    `<p style="${P_STYLE}">${escapeHtml(embed.intro)}</p>`,
    `<div style="overflow:hidden;border-radius:16px;border:1px solid #cfe5df;background:#ffffff;">`,
    `<iframe title="${escapeHtml(embed.title)}" src="${src}" width="100%" height="360" style="border:0;display:block;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`,
    `</div>`,
    `</div>`,
  ].join("");
}

const FAQ_MAP: Partial<Record<string, FaqItem[]>> = {
  "aldeia-das-aguas": [
    {
      question: "Aldeia das Aguas funciona melhor para bate-volta ou fim de semana?",
      answer:
        "Os dois formatos podem funcionar, mas a resposta muda conforme distancia, perfil do grupo e necessidade de descanso. Quem vem de longe costuma aproveitar melhor com mais planejamento.",
    },
    {
      question: "Vale olhar compra, hospedagem e planejamento ao mesmo tempo?",
      answer:
        "Nao. A leitura fica melhor quando cada etapa e resolvida no artigo certo. Essa separacao deixa a decisao mais simples e reduz a sensacao de bagunca.",
    },
    {
      question: "Qual o primeiro passo depois deste guia principal?",
      answer:
        "Comecar pelo assunto que mais pesa na sua decisao: ingresso e preco, hospedagem ou planejamento da visita. Assim a leitura fica mais curta e objetiva.",
    },
  ],
  preco: [
    {
      question: "O preco da Aldeia das Aguas muda bastante?",
      answer:
        "Sim. Data, demanda e antecedencia pesam bastante. Por isso o melhor valor quase sempre depende do contexto da visita, e nao de um unico numero solto.",
    },
    {
      question: "Preco menor sempre significa melhor compra?",
      answer:
        "Nao. Um valor baixo em uma data ruim pode gerar mais fila, menos conforto e pior aproveitamento do parque. O custo-beneficio precisa ser lido junto com o restante da experiencia.",
    },
    {
      question: "Quando vale continuar nesta mesma categoria?",
      answer:
        "Quando a duvida ainda e comercial. Se voce ainda esta comparando ingresso, desconto, day use ou pacote, continuar dentro desta categoria faz mais sentido do que saltar para outro tema.",
    },
  ],
  ingresso: [
    {
      question: "Comprar ingresso antes costuma valer a pena?",
      answer:
        "Na maioria dos casos, sim. A compra antecipada melhora previsibilidade, ajuda a comparar formatos e reduz a chance de resolver tudo em cima da hora.",
    },
    {
      question: "Ingresso e pacote respondem a mesma necessidade?",
      answer:
        "Nao. O ingresso costuma atender melhor quem vai por um dia, enquanto o pacote faz mais sentido quando a viagem inclui hospedagem e mais organizacao.",
    },
    {
      question: "O que revisar antes de fechar a compra?",
      answer:
        "Canal de compra, data escolhida, politica de alteracao e tudo o que realmente esta incluso. Essa checagem evita frustracao depois do pagamento.",
    },
  ],
  desconto: [
    {
      question: "Onde costuma aparecer desconto na Aldeia das Aguas?",
      answer:
        "Na maioria dos casos, o ganho real aparece em data melhor escolhida, compra com antecedencia e comparacao inteligente entre formatos, e nao em cupom milagroso.",
    },
    {
      question: "Desconto sempre significa melhor negocio?",
      answer:
        "Nao. Um valor menor em uma data ruim ou em um formato que nao combina com a sua viagem pode gerar uma experiencia pior e uma falsa sensacao de economia.",
    },
    {
      question: "Como economizar sem errar na compra?",
      answer:
        "Vale cruzar data, movimento esperado, antecedencia e tipo de visita. Esse filtro ajuda a diferenciar promocao real de oferta que so parece vantajosa no primeiro olhar.",
    },
  ],
  "day-use": [
    {
      question: "Quando o day use da Aldeia das Aguas costuma valer mais?",
      answer:
        "O day use costuma valer mais para quem mora mais perto, consegue sair cedo e quer curtir o parque sem transformar a viagem em hospedagem.",
    },
    {
      question: "Day use funciona bem para qualquer perfil?",
      answer:
        "Nao. Quando ha estrada longa, criancas pequenas ou grupo mais cansado, a economia aparente pode perder forca diante do desgaste do bate-volta.",
    },
    {
      question: "Como saber se o day use combina com a sua viagem?",
      answer:
        "Vale medir distancia, horario de saida, energia do grupo e se existe vontade real de dormir na regiao. Essa conta costuma mostrar rapido se o formato encaixa ou nao.",
    },
  ],
  pacote: [
    {
      question: "Quando o pacote da Aldeia das Aguas costuma valer mais?",
      answer:
        "O pacote costuma valer mais quando a viagem inclui hospedagem, estrada mais longa ou necessidade de deixar a organizacao mais simples para o grupo.",
    },
    {
      question: "Pacote e sempre melhor do que comprar separado?",
      answer:
        "Nao. Ele faz mais sentido quando reduz etapas e combina com a forma como voce vai usar parque e hospedagem. Em alguns casos, comprar separado ainda pode funcionar melhor.",
    },
    {
      question: "O que conferir antes de fechar um pacote?",
      answer:
        "Vale revisar quantos dias de parque entram na oferta, qual hospedagem esta incluida, se ha extras relevantes e quais sao as regras de reserva ou alteracao.",
    },
  ],
  hotel: [
    {
      question: "Quando o hotel da Aldeia das Aguas costuma compensar mais?",
      answer:
        "O hotel costuma compensar mais para familias com criancas, casais em fim de semana e visitantes que vem de longe e querem reduzir deslocamento e cansaco.",
    },
    {
      question: "Vale comparar o hotel com hospedagens externas?",
      answer:
        "Sim. A comparacao mais justa nao olha so a diaria, mas tambem tempo de trajeto, praticidade para chegar ao parque e energia do grupo ao longo da viagem.",
    },
    {
      question: "Dormir no complexo muda muito a experiencia?",
      answer:
        "Para muitos perfis, sim. Estar no proprio destino pode deixar a viagem mais leve, especialmente quando ha criancas, estrada longa ou vontade de aproveitar com menos correria.",
    },
  ],
  "onde-ficar": [
    {
      question: "Como escolher onde ficar perto da Aldeia das Aguas?",
      answer:
        "O mais util e decidir primeiro se a prioridade da viagem e praticidade, economia, espaco ou autonomia. A partir disso, a comparacao entre hotel interno e opcoes externas fica bem mais clara.",
    },
    {
      question: "Vale ficar dentro do resort ou buscar hospedagem externa?",
      answer:
        "Depende do seu perfil. Ficar dentro do resort costuma ganhar em conveniencia, enquanto hospedagens externas podem equilibrar melhor o custo para alguns grupos.",
    },
    {
      question: "O que mais pesa nessa escolha?",
      answer:
        "Tempo de deslocamento, tamanho do grupo, rotina da viagem e relacao entre diaria e praticidade total costumam pesar mais do que a foto da acomodacao isolada.",
    },
  ],
  airbnb: [
    {
      question: "Quando um Airbnb perto da Aldeia das Aguas costuma valer mais?",
      answer:
        "O Airbnb costuma valer mais para grupos maiores, estadias mais longas ou viagens em que cozinha, espaco e divisao de custos fazem diferenca real.",
    },
    {
      question: "Airbnb e melhor do que hotel para qualquer grupo?",
      answer:
        "Nao. Ele ganha em autonomia, mas pode perder em praticidade quando a distancia ao parque, a rotina com criancas ou a correria da viagem pesam mais.",
    },
    {
      question: "O que comparar antes de reservar um Airbnb?",
      answer:
        "Vale revisar distancia ate o parque, estrutura da casa, possibilidade de dividir custos e quanto a logistica extra vai pesar no seu roteiro.",
    },
  ],
  atracoes: [
    {
      question: "Como olhar as atracoes da Aldeia das Aguas sem se perder?",
      answer:
        "O melhor caminho e separar o parque por tipo de experiencia: areas mais tranquilas, espacos para criancas e atracoes que pedem mais disposicao. Isso ajuda a montar um roteiro mais coerente.",
    },
    {
      question: "Vale montar a ordem das atracoes antes da visita?",
      answer:
        "Sim. Pensar na ordem antes de chegar ajuda a reduzir fila, cansaco e idas desnecessarias de um lado ao outro do parque.",
    },
    {
      question: "As mesmas atracoes funcionam bem para qualquer grupo?",
      answer:
        "Nao. Familias com criancas, grupos que querem descanso e pessoas que gostam de adrenalina usam o parque de formas bem diferentes.",
    },
  ],
  "vale-a-pena": [
    {
      question: "Afinal, a Aldeia das Aguas vale a pena?",
      answer:
        "Para muitos perfis, sim. O parque tende a valer mais a pena quando a expectativa combina com a estrutura, a data escolhida ajuda a experiencia e o custo faz sentido para o tipo de passeio desejado.",
    },
    {
      question: "Para quem a Aldeia das Aguas costuma funcionar melhor?",
      answer:
        "Costuma funcionar melhor para familias, casais e grupos que querem um parque amplo, com possibilidade de passar o dia inteiro ou combinar a visita com hospedagem.",
    },
    {
      question: "O que mais muda essa percepcao de custo-beneficio?",
      answer:
        "Data, lotacao, perfil do grupo, distancia da viagem e expectativa realista sobre o parque costumam pesar mais do que uma opiniao isolada.",
    },
  ],
  dicas: [
    {
      question: "Quais dicas realmente fazem diferenca na Aldeia das Aguas?",
      answer:
        "As que melhoram fila, ritmo, conforto e organizacao do grupo. Em geral, chegar cedo, planejar pausas e escolher bem as primeiras areas costumam fazer bastante diferenca.",
    },
    {
      question: "Vale planejar refeicao e descanso antes da visita?",
      answer:
        "Sim. Isso ajuda a evitar correria, irritacao e cansaco acumulado, especialmente em dias mais quentes ou viagens com criancas.",
    },
    {
      question: "Dicas simples costumam resolver mais do que listas longas?",
      answer:
        "Na maioria dos casos, sim. Orientacoes praticas e aplicaveis costumam melhorar mais a experiencia do que uma lista grande de pontos pouco relevantes.",
    },
  ],
  "melhor-dia": [
    {
      question: "Qual costuma ser o melhor dia para ir a Aldeia das Aguas?",
      answer:
        "Em geral, dias uteis fora de feriados e picos de temporada tendem a oferecer uma experiencia mais confortavel, com menos fila e melhor percepcao de custo-beneficio.",
    },
    {
      question: "Fim de semana e feriado sempre pioram a experiencia?",
      answer:
        "Nem sempre, mas costumam aumentar movimento e reduzir a sensacao de tranquilidade. Para quem tem flexibilidade, escolher datas mais leves costuma ajudar bastante.",
    },
    {
      question: "A escolha do dia muda mesmo o aproveitamento?",
      answer:
        "Sim. Muda fila, conforto, ritmo do grupo e ate a forma como o visitante percebe o valor que pagou pela experiencia.",
    },
  ],
  familia: [
    {
      question: "A Aldeia das Aguas funciona bem para criancas?",
      answer:
        "Sim, especialmente quando a familia monta um roteiro mais leve e respeita o ritmo das criancas. O parque tende a render melhor com pausas, ordem de atracoes e expectativa ajustada.",
    },
    {
      question: "O que mais ajuda em uma visita com criancas?",
      answer:
        "Escolher areas adequadas para a idade, intercalar descanso com brincadeira e evitar correria excessiva costuma fazer mais diferenca do que tentar ver tudo.",
    },
    {
      question: "Vale planejar o dia com antecedencia quando ha criancas?",
      answer:
        "Vale muito. Isso ajuda a reduzir cansaco, evitar excesso de fila e deixar o passeio mais confortavel para toda a familia.",
    },
  ],
  "parques-aquaticos-rj": [
    {
      question: "Como comparar parques aquaticos no RJ sem cair em lista generica?",
      answer:
        "O melhor caminho e cruzar distancia, perfil do publico e tipo de passeio. Isso produz uma comparacao muito mais util do que um ranking vazio.",
    },
    {
      question: "Vale comparar parques de um dia com destinos de fim de semana?",
      answer:
        "Pode valer, desde que voce ajuste o criterio. O que serve para um bate-volta raramente resolve da mesma forma uma viagem maior.",
    },
    {
      question: "Quais links vale abrir depois desta comparacao?",
      answer:
        "Vale abrir apenas os guias que continuam a comparacao entre parques parecidos. Assim voce aprofunda a escolha sem sair cedo demais para pagina de compra ou reserva.",
    },
  ],
  telefone: [
    {
      question: "Qual e o telefone principal da Aldeia das Aguas?",
      answer:
        "Na verificacao feita em 10 de maio de 2026 no site oficial, a Secretaria do Parque aparecia como (24) 3025-8180 e o WhatsApp como (24) 99986-9620.",
    },
    {
      question: "Qual numero usar para falar do hotel?",
      answer:
        "Para hospedagem, a pagina oficial informava a Central de Reservas do Hotel Quartzo no numero (24) 99870-4944.",
    },
    {
      question: "Existe outro contato de atendimento?",
      answer:
        "Sim. O escritorio de Volta Redonda aparecia com o numero (24) 3025-8185 na pagina oficial de contato do Aldeia das Aguas.",
    },
  ],
};

function defaultFaq(page: SiloPageDefinition): FaqItem[] {
  const topic = topicName(page);

  return [
    {
      question: `${topic} resolve qual duvida principal?`,
      answer:
        "Esta pagina resolve a pergunta central deste tema e ajuda a avancar com mais seguranca antes de abrir outros assuntos da viagem.",
    },
    {
      question: `Quando vale abrir outro artigo alem de ${topic}?`,
      answer:
        "Quando a sua duvida mudar de assunto. Se voce ainda estiver comparando a mesma decisao, vale continuar apenas pelos links relacionados desta pagina.",
    },
    {
      question: `O que conferir antes de decidir sobre ${topic}?`,
      answer:
        "Vale revisar somente os pontos que mudam o seu caso real, como data, distancia, perfil do grupo, formato da compra ou necessidade de hospedagem.",
    },
  ];
}

function faqForPage(page: SiloPageDefinition): FaqItem[] {
  return FAQ_MAP[page.key] ?? defaultFaq(page);
}

function faqMarkup(page: SiloPageDefinition, items: FaqItem[]): string {
  const blocks = items
    .map(
      (item) =>
        `<details style="padding:4px 0 0;border:1px solid #cfe5df;border-radius:14px;background:#ffffff;margin-bottom:12px;overflow:hidden;">` +
        `<summary style="list-style:none;cursor:pointer;padding:16px 18px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#0f4f46;">${escapeHtml(item.question)}</summary>` +
        `<div style="padding:0 18px 18px 18px;"><p style="${P_STYLE};margin-bottom:0;">${escapeHtml(item.answer)}</p></div>` +
        `</details>`,
    )
    .join("");

  return [
    `<div style="${FAQ_CARD_STYLE}">`,
    `<h2 style="${H2_STYLE};margin-top:0;">Perguntas frequentes sobre ${escapeHtml(topicName(page))}</h2>`,
    blocks,
    `</div>`,
  ].join("");
}

function finalCta(page: SiloPageDefinition): string {
  return [
    `<div style="${CTA_STYLE}">`,
    `<h2 style="${H2_STYLE};margin-top:0;">Pronto para ver a oferta atual?</h2>`,
    `<p style="${P_STYLE}">Se ${escapeHtml(topicName(page))} ja faz sentido para o seu plano, confira o link de afiliado antes de fechar a compra. Assim voce sai desta leitura com uma proxima acao objetiva.</p>`,
    `<a href="${AFFILIATE_URL}" rel="nofollow sponsored" target="_blank" style="${CTA_BUTTON_STYLE}">Ver ingresso e promocao</a>`,
    `</div>`,
  ].join("");
}

export function renderPage(page: SiloPageDefinition): RenderedPage {
  const faq = faqForPage(page);

  let articleBody = decorateArticleBody(buildSimpleArticle(page));
  while (wordCount(articleBody) < 420) {
    articleBody = `${articleBody}${decorateArticleBody(reinforcementSection(page))}`;
  }

  const contentHtml = [
    `<div style="${WRAPPER_STYLE}">`,
    articleBody,
    mapSection(page),
    faqMarkup(page, faq),
    finalCta(page),
    `</div>`,
  ].join("");

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

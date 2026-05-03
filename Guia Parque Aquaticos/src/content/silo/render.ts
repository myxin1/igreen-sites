import { AFFILIATE_URL, SITE_NAME } from "../../config/site.js";
import { buildMetaDescription, buildMetaTitle } from "../../seo/meta.js";
import { escapeHtml, normalizeKeyword, trimToLength } from "../../utils/text.js";
import type { FaqItem, RenderedPage, SiloPageDefinition } from "../types.js";
import { PAGE_PARENT } from "./definitions/pillar.js";
import { findSiloPage, SILO_PAGES } from "./registry.js";

// ─── CTA configs ─────────────────────────────────────────────────────────────

const CTA_CONFIGS = [
  {
    label: "Ver ingressos e promocoes",
    eyebrow: "Compra rapida",
    message:
      "Se a sua data de visita ja esta definida, vale comparar as opcoes atualizadas antes de seguir na leitura.",
  },
  {
    label: "Ver preco atualizado",
    eyebrow: "Comparar valores",
    message:
      "Use este atalho para checar valores e promocoes antes de combinar ingresso, pacote ou hospedagem.",
  },
  {
    label: "Garantir ingresso",
    eyebrow: "Pronto para decidir",
    message:
      "Quando a viagem sai da pesquisa e entra no planejamento real, um clique a menos faz bastante diferenca.",
  },
  {
    label: "Ver promocoes disponiveis",
    eyebrow: "Fechar planejamento",
    message:
      "Depois de comparar opcoes e entender a visita, este e o melhor momento para conferir as ofertas atuais.",
  },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function permalinkFor(page: SiloPageDefinition): string {
  return `/${page.slug}/`;
}

function linkMarkup(page: SiloPageDefinition, anchor?: string): string {
  return `<a href="${permalinkFor(page)}">${escapeHtml(anchor ?? page.keyword)}</a>`;
}

function typeLabel(type: SiloPageDefinition["type"]): string {
  const labels: Record<SiloPageDefinition["type"], string> = {
    pillar: "Guia Completo",
    commercial: "Comercial",
    lodging: "Hospedagem",
    informational: "Informativo",
    seo: "Dicas & Reviews",
    "top-funnel": "Guia Regional",
  };
  return labels[type];
}

// ─── CSS ─────────────────────────────────────────────────────────────────────

function articleStyleBlock(): string {
  return `<style>
    @import url("https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap");

    /* ── Base ── */
    .gpq-article {
      font-family: "Source Sans 3", system-ui, sans-serif;
      color: #213a35;
      font-size: 1.12rem;
      line-height: 1.85;
    }
    .gpq-article h1,
    .gpq-article h2,
    .gpq-article h3 {
      font-family: "Merriweather", Georgia, serif;
      color: #0f4f46;
      line-height: 1.22;
      letter-spacing: -0.02em;
    }
    .gpq-article h1 { font-size: clamp(2.2rem, 4vw, 3.1rem); margin-bottom: 22px; }
    .gpq-article h2 { font-size: clamp(1.45rem, 2.8vw, 1.9rem); margin: 44px 0 16px; }
    .gpq-article h3 { font-size: 1.15rem; margin: 28px 0 10px; }
    .gpq-article p  { margin: 0 0 18px; }
    .gpq-article strong { color: #0a3f38; font-weight: 700; }

    /* ── Links naturais no texto ── */
    .gpq-article a {
      color: #0f6a5c;
      font-weight: 600;
      text-decoration: underline;
      text-decoration-color: #a8d9cf;
      text-underline-offset: 3px;
      transition: color .18s ease, text-decoration-color .18s ease;
    }
    .gpq-article a:hover {
      color: #ff8a00;
      text-decoration-color: #ff8a00;
    }

    /* ── Listas ── */
    .gpq-article ul {
      list-style: none;
      padding-left: 0;
      margin: 18px 0 28px;
    }
    .gpq-article li {
      position: relative;
      padding-left: 26px;
      margin-bottom: 12px;
    }
    .gpq-article li::before {
      content: "★";
      position: absolute;
      left: 0;
      top: 3px;
      color: #ff8a00;
      font-size: 11px;
    }

    /* ── Lead box ── */
    .gpq-article-lead {
      margin: 26px 0 34px;
      padding: 18px 22px;
      border-left: 4px solid #ff8a00;
      border-radius: 0 16px 16px 0;
      background: linear-gradient(180deg, #fffaf3 0%, #fff2df 100%);
      box-shadow: 0 10px 26px rgba(255, 138, 0, 0.08);
    }
    .gpq-article-lead p:last-child { margin-bottom: 0; }

    /* ── CTA box ── */
    .gpq-article-cta {
      margin: 36px 0;
      padding: 24px;
      border-radius: 20px;
      background:
        radial-gradient(circle at top left, rgba(255, 138, 0, 0.14), transparent 32%),
        linear-gradient(135deg, #f4fbf8 0%, #e8f5f1 100%);
      border: 1px solid #cfe5df;
      box-shadow: 0 16px 34px rgba(15, 79, 70, 0.08);
    }
    .gpq-article-cta__eyebrow {
      display: inline-block;
      margin-bottom: 10px;
      padding: 5px 13px;
      border-radius: 999px;
      background: #dff3ee;
      color: #14574d;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .gpq-article-cta__message { margin-bottom: 18px; }
    .gpq-article-cta__buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
    }
    .gpq-article-cta__button,
    .gpq-article-cta__secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 12px 22px;
      border-radius: 999px;
      font-weight: 700;
      font-size: .92rem;
      text-decoration: none !important;
      transition: transform .18s ease, box-shadow .18s ease;
    }
    .gpq-article-cta__button {
      background: linear-gradient(135deg, #ff8a00 0%, #ff5a2a 100%);
      color: #ffffff !important;
      box-shadow: 0 12px 26px rgba(255, 90, 42, 0.22);
      animation: gpqCtaPulse 3s ease-in-out infinite;
    }
    .gpq-article-cta__secondary {
      background: #ffffff;
      color: #14574d !important;
      border: 1.5px solid #bfdad3;
    }
    .gpq-article-cta__button:hover {
      transform: translateY(-2px);
      box-shadow: 0 18px 32px rgba(255, 90, 42, 0.30);
      animation: none;
    }
    .gpq-article-cta__secondary:hover {
      transform: translateY(-2px);
      border-color: #0f4f46;
      box-shadow: 0 8px 18px rgba(15, 79, 70, 0.12);
    }
    @keyframes gpqCtaPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 12px 26px rgba(255,90,42,.22); }
      50%       { transform: scale(1.015); box-shadow: 0 16px 32px rgba(255,90,42,.30); }
    }

    /* ── Related articles cards ── */
    .gpq-related-block {
      margin: 32px 0 38px;
      padding: 22px 22px 20px;
      background: linear-gradient(180deg, #f7fcfb 0%, #eef7f5 100%);
      border: 1px solid #cfe5df;
      border-radius: 18px;
      box-shadow: 0 10px 26px rgba(16, 68, 60, 0.08);
    }
    .gpq-related-block__heading {
      font-family: "Merriweather", Georgia, serif;
      color: #0f4f46;
      font-size: .95rem;
      margin: 0 0 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .gpq-related-block__heading::before {
      content: "★";
      color: #ff8a00;
      font-size: 11px;
      flex-shrink: 0;
    }
    .gpq-related-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 10px;
    }
    .gpq-related-card {
      display: flex;
      flex-direction: column;
      gap: 5px;
      padding: 14px 16px;
      background: #ffffff;
      border: 1px solid #cfe5df;
      border-radius: 12px;
      text-decoration: none !important;
      transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
    }
    .gpq-related-card:hover {
      border-color: #0f4f46;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(16, 68, 60, 0.10);
    }
    .gpq-related-card__eyebrow {
      font-size: .68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: #ff8a00;
    }
    .gpq-related-card__title {
      font-size: .85rem;
      font-weight: 700;
      color: #0f4f46;
      line-height: 1.35;
    }
    .gpq-related-card__cta {
      font-size: .75rem;
      color: #1f6a5f;
      font-weight: 600;
      margin-top: 2px;
    }

    /* ── See-also pills ── */
    .gpq-see-also {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin: -6px 0 28px;
      padding: 14px 16px;
      background: #f0f9f7;
      border-radius: 12px;
      border: 1px solid #d8eeea;
    }
    .gpq-see-also__label {
      font-size: .78rem;
      font-weight: 700;
      color: #47635d;
      text-transform: uppercase;
      letter-spacing: .04em;
      flex-shrink: 0;
    }
    .gpq-see-also__pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 13px;
      background: #ffffff;
      border: 1px solid #bfdad3;
      border-radius: 999px;
      color: #0f4f46 !important;
      font-size: .82rem;
      font-weight: 700;
      text-decoration: none !important;
      transition: all .18s ease;
    }
    .gpq-see-also__pill::before {
      content: "→";
      font-size: .75em;
      color: #ff8a00;
    }
    .gpq-see-also__pill:hover {
      background: #0f4f46;
      color: #ffffff !important;
      border-color: #0f4f46;
    }
    .gpq-see-also__pill:hover::before { color: #ffd9b0; }

    /* ── FAQ items ── */
    .gpq-faq-list { margin: 20px 0 30px; }
    .gpq-faq-item {
      position: relative;
      padding: 16px 18px 16px 44px;
      background: #ffffff;
      border: 1px solid #cfe5df;
      border-radius: 14px;
      margin-bottom: 12px;
      transition: border-color .2s ease, box-shadow .2s ease;
    }
    .gpq-faq-item:hover {
      border-color: #0f4f46;
      box-shadow: 0 6px 16px rgba(16, 68, 60, 0.08);
    }
    .gpq-faq-item::before {
      content: "★";
      position: absolute;
      left: 16px;
      top: 18px;
      color: #ff8a00;
      font-size: 11px;
    }
    .gpq-faq-item__q {
      font-family: "Merriweather", Georgia, serif;
      font-weight: 700;
      color: #0f4f46;
      margin: 0 0 8px;
      font-size: .93rem;
      line-height: 1.4;
    }
    .gpq-faq-item__a {
      color: #21433d;
      margin: 0;
      font-size: .9rem;
      line-height: 1.75;
    }

    /* ── Responsive ── */
    @media (max-width: 640px) {
      .gpq-article { font-size: 1.04rem; }
      .gpq-article-cta { padding: 18px; }
      .gpq-article-cta__buttons { flex-direction: column; }
      .gpq-article-cta__button,
      .gpq-article-cta__secondary { width: 100%; }
      .gpq-related-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 380px) {
      .gpq-related-grid { grid-template-columns: 1fr; }
    }
  </style>`;
}

// ─── CTA block ───────────────────────────────────────────────────────────────

function internalCtaTargets(page: SiloPageDefinition): Array<{ href: string; label: string }> {
  const relatedKeys = new Set<string>();
  if (page.key !== PAGE_PARENT.key) relatedKeys.add(PAGE_PARENT.key);
  for (const key of page.commercialTargets) {
    if (key !== page.key) relatedKeys.add(key);
  }
  return Array.from(relatedKeys)
    .slice(0, 2)
    .map((key) => {
      const target = key === PAGE_PARENT.key ? PAGE_PARENT : findSiloPage(key);
      const label =
        key === PAGE_PARENT.key ? "Abrir guia completo" : `Ver ${normalizeKeyword(target.keyword)}`;
      return { href: permalinkFor(target), label };
    });
}

function affiliateCta(page: SiloPageDefinition, index: number): string {
  const config = CTA_CONFIGS[index % CTA_CONFIGS.length];
  const secondaryButtons = internalCtaTargets(page)
    .map(
      (item) =>
        `<a class="gpq-article-cta__secondary" href="${item.href}">${escapeHtml(item.label)}</a>`,
    )
    .join("");

  return [
    '<div class="gpq-article-cta">',
    `<span class="gpq-article-cta__eyebrow">${escapeHtml(config.eyebrow)}</span>`,
    `<p class="gpq-article-cta__message"><strong>${escapeHtml(page.keyword)}</strong> fica mais facil de decidir quando voce compara compra, visita e hospedagem no momento certo. ${escapeHtml(config.message)}</p>`,
    '<div class="gpq-article-cta__buttons">',
    `<a class="gpq-article-cta__button" href="${AFFILIATE_URL}" rel="nofollow sponsored" target="_blank">${escapeHtml(config.label)}</a>`,
    secondaryButtons,
    "</div>",
    "</div>",
  ].join("");
}

// ─── Related cards block ──────────────────────────────────────────────────────

function relatedCardsBlock(pages: SiloPageDefinition[], heading = "Artigos relacionados"): string {
  const cards = pages
    .map(
      (p) =>
        `<a class="gpq-related-card" href="${permalinkFor(p)}">` +
        `<span class="gpq-related-card__eyebrow">${escapeHtml(typeLabel(p.type))}</span>` +
        `<span class="gpq-related-card__title">${escapeHtml(p.keyword)}</span>` +
        `<span class="gpq-related-card__cta">Ler artigo →</span>` +
        `</a>`,
    )
    .join("");

  return [
    '<div class="gpq-related-block">',
    `<h3 class="gpq-related-block__heading">${escapeHtml(heading)}</h3>`,
    `<div class="gpq-related-grid">${cards}</div>`,
    "</div>",
  ].join("");
}

function hubCardsForParent(): string {
  const children = (PAGE_PARENT.children ?? []).map((key) => findSiloPage(key));
  return relatedCardsBlock(children, "Todos os guias sobre Aldeia das Aguas");
}

function siblingCardsBlock(page: SiloPageDefinition): string {
  const pages = page.siblings.map((key) => findSiloPage(key));
  if (pages.length === 0) return "";
  return relatedCardsBlock(pages, "Guias relacionados");
}

// ─── See-also pills ───────────────────────────────────────────────────────────

function seeAlsoPills(page: SiloPageDefinition): string {
  const keys = [...page.siblings, ...page.commercialTargets]
    .filter((k, i, arr) => arr.indexOf(k) === i && k !== page.key)
    .slice(0, 5);

  if (keys.length === 0) return "";

  const pills = keys
    .map((key) => {
      const target = key === PAGE_PARENT.key ? PAGE_PARENT : findSiloPage(key);
      return `<a class="gpq-see-also__pill" href="${permalinkFor(target)}">${escapeHtml(target.keyword)}</a>`;
    })
    .join("");

  return [
    '<div class="gpq-see-also">',
    '<span class="gpq-see-also__label">Veja tambem</span>',
    pills,
    "</div>",
  ].join("");
}

// ─── Per-page FAQs (PAA-style) ────────────────────────────────────────────────

const FAQ_MAP: Partial<Record<string, FaqItem[]>> = {
  "preco": [
    { question: "Quanto custa o ingresso da Aldeia das Aguas?", answer: "O preco varia conforme data, perfil do visitante (adulto, crianca, idoso) e tipo de acesso escolhido. Para valores atualizados e promocoes em vigor, consulte o canal oficial antes de fechar a compra." },
    { question: "A Aldeia das Aguas tem desconto para criancas?", answer: "Sim. Criancas abaixo de determinada altura ou faixa etaria costumam ter condicoes especiais ou entrada gratuita. Confirme as regras vigentes no momento da visita pois podem mudar por temporada." },
    { question: "Vale a pena comprar ingresso online com antecedencia?", answer: "Em geral sim. A compra online garante melhor preco, evita filas na bilheteria e permite planejar melhor a visita. Verifique a politica de cancelamento antes de finalizar." },
  ],
  "ingresso": [
    { question: "Como comprar ingresso para a Aldeia das Aguas?", answer: "O ingresso pode ser adquirido online pelo site oficial ou por parceiros credenciados. A compra antecipada costuma garantir melhores precos e dispensa fila na entrada." },
    { question: "O ingresso day use inclui todas as atracoes do parque?", answer: "O day use geralmente da acesso ao parque aquatico, piscinas e areas de lazer. Verifique quais atracoes e servicos estao inclusos no tipo de ingresso escolhido antes de comprar." },
    { question: "Criancas pagam ingresso na Aldeia das Aguas?", answer: "Criancas abaixo de certa altura ou idade normalmente pagam meia ou tem entrada gratuita. As regras podem variar por temporada, entao confirme no momento da compra." },
  ],
  "desconto": [
    { question: "Como conseguir desconto na Aldeia das Aguas?", answer: "Descontos costumam ser aplicados em compras antecipadas online, pacotes combinados ou em datas especificas. Verifique promocoes ativas antes de comprar para nao pagar mais caro." },
    { question: "Tem cupom de desconto para a Aldeia das Aguas?", answer: "Cupons e promocoes sao divulgados periodicamente. Acompanhe os canais oficiais e plataformas parceiras para nao perder ofertas validas." },
    { question: "Qual o dia mais barato para visitar a Aldeia das Aguas?", answer: "Em geral, dias de semana fora de feriado e fora da temporada alta tendem a ter precos mais acessiveis e menos movimento. Planejar para essas janelas pode gerar economia real." },
  ],
  "day-use": [
    { question: "O que inclui o day use da Aldeia das Aguas?", answer: "O day use costuma incluir acesso ao parque aquatico, piscinas e areas de lazer. Alguns formatos incluem almoco ou credito em alimentacao. Confirme o que esta incluso antes de comprar." },
    { question: "Qual o horario do day use na Aldeia das Aguas?", answer: "O horario padrao costuma ser das 9h ou 10h ate o fim da tarde. Consulte a grade de funcionamento vigente para nao ter surpresa ao chegar." },
    { question: "Day use e melhor do que apenas o ingresso do parque?", answer: "Depende do perfil da visita. O day use pode incluir refeicoes e acesso a mais areas, o que compensa para grupos e familias que ficam o dia todo." },
  ],
  "pacote": [
    { question: "O que inclui o pacote da Aldeia das Aguas?", answer: "Os pacotes variam conforme o operador, mas costumam incluir hospedagem no resort, ingressos e em alguns casos refeicoes. E a melhor opcao para quem vem de longe e quer pernoitar." },
    { question: "Vale a pena comprar pacote com hotel na Aldeia das Aguas?", answer: "Para quem vem de outra cidade, o pacote com hotel costuma compensar. A hospedagem no resort elimina deslocamento, permite chegar mais cedo e garante melhor experiencia no parque." },
    { question: "Qual pacote e mais em conta para a Aldeia das Aguas?", answer: "O custo varia conforme temporada, numero de noites e tipo de acomodacao. Compare opcoes em diferentes datas antes de fechar para encontrar a melhor relacao custo-beneficio." },
  ],
  "hotel": [
    { question: "Qual e o hotel da Aldeia das Aguas Park Resort?", answer: "A Aldeia das Aguas possui hospedagem propria integrada ao parque. Ficar no hotel do resort garante acesso facilitado ao parque, sem deslocamento extra apos as atividades." },
    { question: "A hospedagem na Aldeia das Aguas inclui o ingresso para o parque?", answer: "Em muitos pacotes a diaria inclui o ingresso ou condicao especial para os hospedes. Confirme o que esta incluso no momento da reserva pois as condicoes variam." },
    { question: "Quanto custa a diaria no hotel da Aldeia das Aguas?", answer: "As tarifas variam bastante por temporada, tipo de quarto e antecedencia da reserva. Para valores atualizados, consulte o site oficial ou plataformas de reserva credenciadas." },
  ],
  "onde-ficar": [
    { question: "Onde ficar perto da Aldeia das Aguas?", answer: "Alem da hospedagem no proprio resort, existem hoteis e pousadas em Barra do Pirai e regiao. A escolha entre ficar no resort ou fora depende do orcamento e do roteiro da viagem." },
    { question: "Tem hotel dentro do parque da Aldeia das Aguas?", answer: "Sim, o resort tem estrutura de hospedagem propria. Ficar dentro do parque facilita o acesso as atracoes e pode incluir beneficios como check-in antecipado e ingresso." },
    { question: "Vale mais a pena hotel ou Airbnb perto da Aldeia das Aguas?", answer: "Hotel dentro do resort oferece conforto e praticidade. Airbnb pode ser vantajoso para grupos grandes ou estadias longas. Avalie conforme o perfil da viagem." },
  ],
  "airbnb": [
    { question: "Tem Airbnb perto da Aldeia das Aguas?", answer: "Sim, existem opcoes de Airbnb em Barra do Pirai e arredores. E uma alternativa para grupos, familias ou quem prefere mais espaco e privacidade em relacao ao hotel." },
    { question: "Airbnb ou hotel: qual e melhor perto da Aldeia das Aguas?", answer: "Depende do perfil da viagem. O hotel do resort oferece mais praticidade e pode incluir ingresso. Airbnb costuma sair mais em conta para grupos maiores em estadias mais longas." },
    { question: "Como encontrar Airbnb em Barra do Pirai?", answer: "Busque diretamente no app do Airbnb usando 'Barra do Pirai' ou 'Aldeia das Aguas' como referencia de localizacao. Filtre por numero de hospedes e datas para melhores resultados." },
  ],
  "onde-fica": [
    { question: "Em qual cidade fica a Aldeia das Aguas?", answer: "A Aldeia das Aguas Park Resort fica em Barra do Pirai, no interior do estado do Rio de Janeiro, a cerca de 100 km da capital." },
    { question: "A Aldeia das Aguas fica perto do Rio de Janeiro?", answer: "Sim. Barra do Pirai fica a aproximadamente 100 km do Rio de Janeiro, o que torna a Aldeia das Aguas acessivel para visitantes da capital em cerca de 1h30 de carro." },
    { question: "Quantos km de Sao Paulo fica a Aldeia das Aguas?", answer: "A distancia de Sao Paulo ate Barra do Pirai e de aproximadamente 400 km, com um percurso de cerca de 4h a 5h de carro pela Rodovia Presidente Dutra (BR-116)." },
  ],
  "como-chegar": [
    { question: "Como ir de carro ate a Aldeia das Aguas?", answer: "A rota mais comum e pela Rodovia Presidente Dutra (BR-116), saindo do Rio ou de Sao Paulo. Use um aplicativo de navegacao com o destino 'Aldeia das Aguas Park Resort, Barra do Pirai' para a rota mais atualizada." },
    { question: "Tem onibus para a Aldeia das Aguas?", answer: "Existem opcoes de onibus para Barra do Pirai a partir de algumas cidades. A partir da rodoviaria local, e preciso usar taxi ou transporte por aplicativo ate o resort." },
    { question: "Quanto tempo leva de Sao Paulo ate a Aldeia das Aguas?", answer: "O trajeto de carro de Sao Paulo dura em media 4h a 5h dependendo do horario e do trecho da Dutra. Evite fins de semana e vesperas de feriado para fugir do transito." },
  ],
  "endereco": [
    { question: "Qual o endereco exato da Aldeia das Aguas Park Resort?", answer: "O resort fica em Barra do Pirai, RJ. Para o endereco completo e como chegar, consulte o Google Maps buscando por 'Aldeia das Aguas Park Resort' para ter a localizacao precisa." },
    { question: "Tem estacionamento na Aldeia das Aguas?", answer: "Sim, o resort conta com estacionamento para visitantes. Confirme capacidade e eventuais taxas diretamente com o resort antes de chegar." },
    { question: "Como encontrar a Aldeia das Aguas no Google Maps?", answer: "Busque por 'Aldeia das Aguas Park Resort' no Google Maps. O ponto e bem sinalizando e o aplicativo oferece rotas completas desde qualquer origem." },
  ],
  "telefone": [
    { question: "Qual e o telefone da Aldeia das Aguas Park Resort?", answer: "Para o telefone e canais de contato atualizados, acesse o site oficial do resort ou a pagina de contato. Os numeros podem mudar, entao evite fontes desatualizadas." },
    { question: "A Aldeia das Aguas tem WhatsApp para contato?", answer: "Muitos resorts disponibilizam WhatsApp para reservas e informacoes. Consulte o site oficial para verificar os canais de atendimento disponivel no momento." },
    { question: "Como entrar em contato com a central de reservas?", answer: "O contato mais eficiente costuma ser pelo site oficial ou por plataformas credenciadas de reserva. Procure o canal de reservas para tirar duvidas sobre disponibilidade e pacotes." },
  ],
  "atracoes": [
    { question: "Quais sao as principais atracoes da Aldeia das Aguas?", answer: "A Aldeia das Aguas oferece um parque aquatico com tobogans, rio lento, piscinas de ondas e areas de lazer. Tambem possui estrutura de resort com hospedagem, gastronomia e atividades para toda a familia." },
    { question: "Tem tobogas e atracoes radicais na Aldeia das Aguas?", answer: "Sim, o parque conta com tobogans de diferentes niveis de adrenalina, atendendo tanto quem busca emocao quanto familias com criancas menores que preferem atracoes mais tranquilas." },
    { question: "Quais atracoes a Aldeia das Aguas tem para criancas pequenas?", answer: "Ha areas dedicadas a criancas com piscinas rasas, mini tobogas e atividades supervisionadas. E um destino adaptado para familias com criancas de diversas idades." },
  ],
  "horario": [
    { question: "Qual o horario de funcionamento da Aldeia das Aguas?", answer: "O parque costuma funcionar das 9h ou 10h ate as 17h ou 18h, mas os horarios podem variar por temporada, feriados e eventos especiais. Sempre confirme no site oficial antes da visita." },
    { question: "A Aldeia das Aguas funciona o ano todo?", answer: "O funcionamento pode ser reduzido ou suspenso fora da temporada alta (verao e feriados). Verifique o calendario de operacao antes de planejar a visita em meses de baixa temporada." },
    { question: "A Aldeia das Aguas abre mais cedo nos feriados?", answer: "Em feriados e alta temporada o parque costuma ter horario estendido e maior movimento. Chegar cedo ajuda a aproveitar as atracoes sem fila logo na abertura." },
  ],
  "vale-a-pena": [
    { question: "Aldeia das Aguas vale a pena?", answer: "Para familias e casais que buscam um resort completo com parque aquatico, a Aldeia das Aguas e considerada um bom destino no interior do RJ. A experiencia depende muito da expectativa, do periodo escolhido e do tipo de visita." },
    { question: "O parque e bom para criancas de todas as idades?", answer: "Sim, o resort tem atracoes para diferentes faixas etarias. Criancas pequenas tem areas adaptadas, e adolescentes podem aproveitar tobogans e piscinas de ondas." },
    { question: "O ingresso da Aldeia das Aguas compensa o preco?", answer: "O custo-beneficio depende do pacote escolhido e do uso das instalacoes. Quem aproveita o dia inteiro no parque, refeicoes e hospedagem tende a avaliar a experiencia como positiva." },
  ],
  "dicas": [
    { question: "Pode levar comida de fora para a Aldeia das Aguas?", answer: "Em geral, resorts nao permitem entrada de alimentos externos por questoes de seguranca alimentar e operacao das areas de gastronomia. Confirme a politica vigente antes de ir." },
    { question: "O que levar para aproveitar melhor o parque?", answer: "Leve protetor solar, roupa de banho extra, toalha, sandalias com tira, agua e snacks caso sejam permitidos. Reserve ingresso com antecedencia para evitar filas." },
    { question: "Qual o melhor roteiro para um dia na Aldeia das Aguas?", answer: "Comece pelas atracoes radicais de manha quando as filas sao menores. Almoce em horario alternado para evitar filas nos restaurantes. Reserve a tarde para as piscinas e rio lento." },
  ],
  "melhor-dia": [
    { question: "Qual o melhor dia da semana para visitar a Aldeia das Aguas?", answer: "Dias de semana fora de feriado costumam ser os menos movimentados. Se precisar ir no fim de semana, chegue assim que o parque abrir para pegar as atracoes antes das filas maiores." },
    { question: "Como evitar fila na Aldeia das Aguas?", answer: "Chegar na abertura, visitar em dias de semana fora de temporada alta e comprar ingresso online sao as formas mais eficazes de reduzir tempo de espera nas atracoes." },
    { question: "O parque fica muito cheio nos feriados?", answer: "Feriados prolongados e verao sao periodos de pico. A experiencia pode ser comprometida pela lotacao. Se possivel, prefira visitar durante a semana ou em meses de baixa temporada." },
  ],
  "familia": [
    { question: "Aldeia das Aguas e bom para criancas pequenas?", answer: "Sim. O resort tem areas dedicadas com piscinas rasas, mini atracoes e estrutura segura para criancas de diferentes idades. E um destino adequado para familias com bebes e criancas pequenas." },
    { question: "Qual a faixa etaria das atracoes na Aldeia das Aguas?", answer: "Ha atracoes para todas as idades: tobogans radicais para adolescentes e adultos, areas de splash para criancas pequenas e piscinas de ondas para toda a familia." },
    { question: "Tem servico de guarda-volumes ou salva-vidas no parque?", answer: "Resorts de grande porte como a Aldeia das Aguas costumam ter salva-vidas nas atracoes aquaticas e servico de apoio. Confirme a disponibilidade ao chegar no parque." },
  ],
  "opiniao": [
    { question: "O que os visitantes falam da Aldeia das Aguas?", answer: "Em geral, as avaliacoes destacam a estrutura completa do resort, as atracoes do parque aquatico e o atendimento. Pontos negativos costumam ser o preco dos servicos internos e o movimento nos feriados." },
    { question: "A gastronomia da Aldeia das Aguas e boa?", answer: "A maioria das avaliacoes considera a gastronomia razoavel para um resort. Os precos costumam ser mais altos que fora do parque, o que e esperado nesse tipo de estrutura." },
    { question: "O parque e bem conservado e limpo?", answer: "A manutencao e limpeza figuram entre os pontos positivos nas avaliacoes mais recentes. Como em qualquer resort de grande movimento, a experiencia pode variar conforme o dia e a ocupacao." },
  ],
  "parques-aquaticos-rj": [
    { question: "Quais os melhores parques aquaticos do Rio de Janeiro?", answer: "O Rio de Janeiro tem opcoes como a Aldeia das Aguas em Barra do Pirai e outros complexos de lazer no estado. A Aldeia das Aguas se destaca pela estrutura de resort integrado ao parque aquatico." },
    { question: "Qual o maior parque aquatico do RJ?", answer: "A Aldeia das Aguas Park Resort e um dos maiores e mais completos do estado do Rio de Janeiro, combinando parque aquatico com hotel, gastronomia e estrutura de lazer." },
    { question: "Parques aquaticos no RJ: vale a pena ir no verao?", answer: "Sim, mas o movimento e bem maior. Para aproveitar melhor as atracoes sem fila, prefira semanas fora de feriado ou visitas na baixa temporada." },
  ],
  "melhores-parques-aquaticos-brasil": [
    { question: "Qual e o maior parque aquatico do Brasil?", answer: "O Brasil tem varios parques aquaticos de grande porte. No Sudeste, a Aldeia das Aguas (RJ) e o Hot Park (GO) estao entre os mais conhecidos. No Sul, o Beto Carrero World (SC) tambem tem area aquatica expressiva." },
    { question: "Quais parques aquaticos sao recomendados para familia no Brasil?", answer: "Para familias, os parques com melhor estrutura incluem Aldeia das Aguas (RJ), Hot Park (GO), Beach Park (CE) e Thermas dos Laranjais (SP), cada um com atracoes para diferentes idades." },
    { question: "Vale a pena visitar parque aquatico fora do verao?", answer: "Depende do parque. Alguns funcionam o ano todo com temperatura controlada ou infraestrutura coberta. Outros reduzem o funcionamento na baixa temporada. Confirme antes de planejar." },
  ],
  "o-que-fazer-barra-do-pirai": [
    { question: "O que fazer em Barra do Pirai em um dia?", answer: "A principal atracao de Barra do Pirai e a Aldeia das Aguas Park Resort. A cidade tambem oferece gastronomia local, natureza e pontos historicos para quem quer explorar alem do parque." },
    { question: "Qual o principal atrativo turistico de Barra do Pirai?", answer: "A Aldeia das Aguas Park Resort e o principal atrativo da cidade, responsavel por grande parte do fluxo turistico da regiao ao longo do ano." },
    { question: "Tem hotel bom em Barra do Pirai fora do resort?", answer: "Existem pousadas e hoteis em Barra do Pirai para diferentes orcamentos. Para conforto maximo e proximidade com o parque, a hospedagem no proprio resort costuma ser a melhor opcao." },
  ],
  "parques-aquaticos-sp": [
    { question: "Quais os melhores parques aquaticos de Sao Paulo?", answer: "Sao Paulo e entorno tem opcoes como o Thermas dos Laranjais em Olimpia, o Acqua World em Americana e complexos menores no interior. Para um resort completo no Sudeste, vale considerar tambem a Aldeia das Aguas no RJ." },
    { question: "Qual o maior parque aquatico de SP?", answer: "O Thermas dos Laranjais em Olimpia e considerado um dos maiores parques aquaticos do estado de Sao Paulo e do Brasil, com piscinas termais e dezenas de atracoes." },
    { question: "Vale a pena sair de SP para ir a um parque aquatico?", answer: "Sim. Cidades como Olimpia (SP) ou Barra do Pirai (RJ) estao a algumas horas de Sao Paulo e oferecem resorts completos que compensam a viagem, especialmente para fins de semana prolongados." },
  ],
  "parques-aquaticos-sc": [
    { question: "Quais os melhores parques aquaticos de Santa Catarina?", answer: "Santa Catarina tem o complexo aquatico do Beto Carrero World em Penha como principal atracao. O estado tambem conta com parques menores no litoral e no Vale do Itajai." },
    { question: "O Beto Carrero World tem parque aquatico?", answer: "Sim, o Beto Carrero World em Penha, SC, inclui area aquatica dentro do complexo de parque tematico, com atracoes para criancas e adultos." },
    { question: "Qual a melhor epoca para visitar parques aquaticos em SC?", answer: "O verao austral (dezembro a fevereiro) e a epoca ideal pelo clima quente. Fora da temporada o movimento diminui muito e alguns parques podem funcionar em horario reduzido." },
  ],
  "parques-aquaticos-nordeste": [
    { question: "Quais os melhores parques aquaticos do Nordeste?", answer: "O Nordeste tem o Beach Park em Aquiraz (CE) como principal referencia, alem de outros complexos em Fortaleza, Recife e Salvador. A regiao se beneficia do clima quente o ano todo." },
    { question: "O Beach Park fica em Fortaleza?", answer: "O Beach Park fica em Aquiraz, a cerca de 23 km de Fortaleza, no Ceara. E considerado o maior parque aquatico da America Latina e um dos mais visitados do pais." },
    { question: "Vale visitar parque aquatico no Nordeste fora do verao?", answer: "Sim. O clima quente do Nordeste permite aproveitar parques aquaticos o ano todo. Fora do verao o movimento e menor e os precos costumam ser mais acessiveis." },
  ],
};

function pillarFaq(): FaqItem[] {
  return [
    { question: "O que e a Aldeia das Aguas Park Resort?", answer: "A Aldeia das Aguas e um resort com parque aquatico localizado em Barra do Pirai, RJ. Combina hotel, piscinas, tobogans, gastronomia e areas de lazer em um complexo integrado para familias e casais." },
    { question: "Quais as principais atracoes da Aldeia das Aguas?", answer: "O parque conta com tobogans radicais, rio lento, piscinas de ondas, area infantil e estrutura de resort. Ha opcoes para criancas pequenas e adultos que buscam mais adrenalina." },
    { question: "Como funciona a visita a Aldeia das Aguas: day use ou hospedagem?", answer: "E possivel visitar como day use, pagando apenas o ingresso para o dia, ou se hospedar no resort por uma ou mais noites. Pacotes com hospedagem costumam incluir o acesso ao parque." },
  ];
}

function defaultFaq(page: SiloPageDefinition): FaqItem[] {
  const q = normalizeKeyword(page.keyword);
  return [
    { question: `${q} vale a pena para familias?`, answer: "Para familias, a melhor avaliacao costuma vir quando a visita e planejada com antecedencia, com foco em ingressos, hospedagem e deslocamento para reduzir filas e custos surpresa." },
    { question: `Como encontrar ${q} com melhor custo-beneficio?`, answer: "Compare datas, verifique lotacao prevista e confirme condicoes de compra antes de fechar. Combinar ingresso com hospedagem costuma gerar vantagem para quem vem de longe." },
    { question: `${q} muda conforme a epoca do ano?`, answer: "Pode mudar. Por isso o ideal e acompanhar as paginas de preco, ingresso e pacote antes de decidir a data da visita." },
  ];
}

function faqForPage(page: SiloPageDefinition): FaqItem[] {
  if (page.type === "pillar") return pillarFaq();
  return FAQ_MAP[page.key] ?? defaultFaq(page);
}

function faqItemsMarkup(items: FaqItem[]): string {
  const itemsHtml = items
    .map(
      (item) =>
        `<div class="gpq-faq-item">` +
        `<p class="gpq-faq-item__q">${escapeHtml(item.question)}</p>` +
        `<p class="gpq-faq-item__a">${escapeHtml(item.answer)}</p>` +
        `</div>`,
    )
    .join("");
  return `<div class="gpq-faq-list">${itemsHtml}</div>`;
}

// ─── Content blocks ───────────────────────────────────────────────────────────

function leadBox(page: SiloPageDefinition): string {
  return [
    '<div class="gpq-article-lead">',
    `<p><strong>Resumo pratico:</strong> este guia ajuda voce a entender <strong>${escapeHtml(page.keyword)}</strong>, comparar caminhos de compra e seguir para a melhor proxima acao sem perder tempo com informacao solta.</p>`,
    "</div>",
  ].join("");
}

function introParagraphs(page: SiloPageDefinition): string[] {
  if (page.type === "pillar") {
    return [
      "Este guia foi pensado como o ponto de partida para quem quer entender o parque, planejar a visita e encontrar caminhos claros para ingresso, preco, desconto, hospedagem e day use.",
      "A proposta e ajudar o visitante a sair da pesquisa solta e entrar em uma jornada orientada, com links internos bem posicionados, contexto editorial e proximos passos objetivos.",
      "Se a ideia e visitar o parque com mais previsibilidade, vale olhar as paginas de compra e planejamento antes de definir a data. Isso reduz atrito, evita informacao fragmentada e deixa a decisao mais segura.",
    ];
  }
  if (page.type === "top-funnel") {
    return [
      `Quem pesquisa por ${page.keyword} costuma estar no inicio da jornada: ainda comparando destinos, avaliando distancia, custo e estrutura antes de escolher para onde ir.`,
      "Por isso este guia organiza as principais referencias do tema, conecta destinos comparaveis e aponta caminhos para quem ja quer aprofundar a pesquisa ou partir para a compra.",
      `Se a Aldeia das Aguas estiver no seu radar, navegue pelo guia completo do resort para comparar ingressos, pacotes e hospedagem com informacoes mais detalhadas.`,
    ];
  }
  return [
    `Quem busca por ${page.keyword} normalmente esta em um momento de decisao ou refinamento da viagem. Por isso este conteudo foi estruturado para responder o que realmente pesa na escolha: custo, logistica e proximo passo mais indicado.`,
    "Em vez de repetir informacoes genericas, o texto organiza a leitura em blocos objetivos, com links para paginas relacionadas e para o guia principal que concentra a visao completa sobre o destino.",
    "Ao longo do artigo voce tambem encontra CTAs posicionados nos momentos certos, sem quebrar a fluidez da leitura nem comprometer a confianca do conteudo.",
  ];
}

function sectionParagraphs(page: SiloPageDefinition): Array<{ heading: string; paragraphs: string[] }> {
  const parentLink = linkMarkup(PAGE_PARENT, "guia principal da Aldeia das Aguas");
  const siblings = page.siblings
    .slice(0, 3)
    .map((key) => linkMarkup(findSiloPage(key)))
    .join(", ");
  const commercialLinks = page.commercialTargets
    .slice(0, 3)
    .map((key) => linkMarkup(findSiloPage(key)))
    .join(", ");

  const common = [
    {
      heading: `Como entender ${page.keyword} no contexto da viagem`,
      paragraphs: [
        `A melhor forma de analisar ${escapeHtml(page.keyword)} e encaixar o tema dentro de um planejamento maior. Em muitos casos, o erro do visitante e decidir cedo demais sem comparar data, perfil do grupo, tempo de permanencia e opcoes complementares. O ${parentLink} ajuda justamente a montar essa visao ampla antes da compra.`,
        `Dentro deste conjunto de guias, esta pagina conversa diretamente com ${siblings || parentLink}. Isso facilita a progressao natural entre conteudos, aumenta o numero de paginas relevantes por sessao e reforca sinais tematicos para o Google.`,
        `Outro ponto importante e usar as paginas comerciais certas para destravar a pesquisa. O leitor encontra aqui caminhos diretos para ${commercialLinks}, que encurtam a distancia entre descoberta e conversao.`,
      ],
    },
    {
      heading: `O que observar antes de decidir sobre ${page.keyword}`,
      paragraphs: [
        "Nem sempre a melhor decisao e a mais barata em termos absolutos. O visitante precisa considerar deslocamento, conforto, probabilidade de fila, janela de compra, perfil das criancas ou do grupo e necessidade de hospedagem.",
        "Tambem vale observar que conteudos rasos tendem a perder relevancia em buscas competitivas. Por isso cada pagina deste guia combina intencao de busca, profundidade editorial, FAQ e links internos com destino claro.",
        `Para manter a coerencia editorial, esta pagina se ancora no ${parentLink}. Assim, mesmo uma URL de apoio continua reforcando a relevancia da Aldeia das Aguas dentro do site.`,
      ],
    },
  ];

  if (page.type === "commercial" || page.type === "lodging") {
    common.push(
      {
        heading: `Como usar ${page.keyword} para economizar tempo e dinheiro`,
        paragraphs: [
          `Em paginas mais comerciais, a prioridade e responder a pergunta pratica que move o clique. Quem chega aqui quer saber como agir: qual pagina consultar primeiro, como comparar promocoes e em que momento vale cruzar a decisao com ${commercialLinks}.`,
          "Uma boa estrategia de afiliacao nao tenta forcar a conversao logo na primeira linha. Ela contextualiza o beneficio, reduz a incerteza e apresenta um CTA quando a decisao fica madura.",
          `Se o objetivo for fechar a viagem completa, combine esta leitura com o ${parentLink} e com as paginas relacionadas. Essa navegacao paralela tende a elevar a confianca do usuario antes da compra.`,
        ],
      },
      {
        heading: "Melhor combinacao entre compra, ingresso e hospedagem",
        paragraphs: [
          "Em destinos de lazer, a conversao quase nunca depende de uma unica informacao. Um ingresso parece vantajoso quando a data esta definida, um pacote faz mais sentido quando existe pernoite, e hospedagem ganha valor quando encurta deslocamento.",
          `Por isso a ligacao entre ${commercialLinks} nao e decorativa. Ela existe para criar uma malha de paginas com funcao comercial complementar.`,
          "Essa sequencia costuma ajudar quem quer sair da pesquisa e chegar a uma decisao mais segura e informada.",
        ],
      },
    );
  }

  if (page.type === "informational" || page.type === "seo" || page.type === "top-funnel") {
    common.push(
      {
        heading: "Como transformar pesquisa informativa em planejamento real",
        paragraphs: [
          "Muitas buscas com cara informativa estao a um ou dois cliques de uma busca comercial. A pessoa ainda nao quer comprar, mas ja quer reduzir incerteza.",
          `E o motivo de paginas informativas sempre apontarem para destinos comerciais como ${commercialLinks}. O objetivo nao e interromper a leitura, e sim oferecer o proximo passo certo quando o visitante estiver pronto.`,
          `Para manter a coerencia editorial, esta pagina tambem se ancora no ${parentLink}, reforcando a relevancia da Aldeia das Aguas dentro do conjunto.`,
        ],
      },
      {
        heading: "Autoridade tematica e experiencia de navegacao",
        paragraphs: [
          `${SITE_NAME} foi pensado para construir autoridade em torno de parques aquaticos e usar a Aldeia das Aguas como prioridade editorial. Isso exige consistencia entre titulo, H1, subtitulos, FAQ, slug e links internos.`,
          "Na pratica, cada pagina faz duas coisas ao mesmo tempo: responde bem a uma pergunta especifica e reforca a relevancia do conjunto tematico.",
          `Se o visitante quiser ir direto para uma etapa mais comercial, os atalhos principais sao ${commercialLinks}. Para a visao completa, o melhor caminho continua sendo o ${parentLink}.`,
        ],
      },
    );
  }

  return common;
}

function extraDepthSection(page: SiloPageDefinition): string {
  const parentLink = linkMarkup(PAGE_PARENT, "pagina principal da Aldeia das Aguas");
  const commercialLinks = page.commercialTargets
    .slice(0, 3)
    .map((key) => linkMarkup(findSiloPage(key)))
    .join(", ");

  return [
    `<h2>${escapeHtml(`Planejamento avancado para ${page.keyword}`)}</h2>`,
    `<p>Quando um conteudo precisa competir por buscas relevantes, ele nao pode depender apenas de uma introducao bem escrita. E importante aprofundar a leitura com contexto pratico, comparacoes e proximo passo editorial. Para ${escapeHtml(page.keyword)}, isso significa conectar a pesquisa com a jornada mais ampla da viagem, reduzindo duvidas sobre compra, deslocamento, melhor dia e escolha do formato ideal de visita.</p>`,
    `<p>Esse aprofundamento tambem ajuda no SEO. Quanto mais clara for a relacao entre a intencao desta URL e os demais guias do site, maior a chance de o Google entender o papel da pagina dentro do tema.</p>`,
    `<p>O visitante que chega aqui pode seguir dois caminhos. O primeiro e continuar a leitura ate esclarecer todas as duvidas. O segundo e usar desde ja ${commercialLinks} para aproximar a pesquisa da conversao.</p>`,
    `<p>Para uma visao mais completa, acesse a ${parentLink} e use os atalhos ${commercialLinks}.</p>`,
  ].join("");
}

function wordCount(html: string): number {
  return html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
}

// ─── Main render ──────────────────────────────────────────────────────────────

export function renderPage(page: SiloPageDefinition): RenderedPage {
  const intro = introParagraphs(page)
    .map((p) => `<p>${p}</p>`)
    .join("");

  const sections = sectionParagraphs(page)
    .map(
      (section) =>
        `<h2>${escapeHtml(section.heading)}</h2>` +
        section.paragraphs.map((p) => `<p>${p}</p>`).join(""),
    )
    .join("");

  const faq = faqForPage(page);

  const pageHub =
    page.type === "pillar" ? hubCardsForParent() : siblingCardsBlock(page);

  let articleBody = [
    `<h1>${escapeHtml(page.keyword)}</h1>`,
    leadBox(page),
    intro,
    affiliateCta(page, 0),
    pageHub,
    sections,
    seeAlsoPills(page),
    affiliateCta(page, 1),
    `<h2>${escapeHtml(`Perguntas frequentes sobre ${page.keyword}`)}</h2>`,
    faqItemsMarkup(faq),
    affiliateCta(page, 2),
    `<h2>Conclusao</h2><p>${escapeHtml(`Se voce quer tomar uma decisao melhor sobre ${page.keyword}, use os links internos deste guia para aprofundar a pesquisa e cruzar informacoes comerciais com contexto real de viagem. A combinacao entre conteudo editorial, interlinking e CTA de afiliado foi desenhada para ajudar o usuario a avancar com mais seguranca.`)}</p>`,
    affiliateCta(page, 3),
  ].join("");

  while (wordCount(articleBody) < 1200) {
    articleBody = `${articleBody}${extraDepthSection(page)}`;
  }

  const contentHtml = `${articleStyleBlock()}<div class="gpq-article">${articleBody}</div>`;

  const angle =
    page.type === "commercial" || page.type === "lodging"
      ? `Entenda ${page.keyword}`
      : `Guia sobre ${page.keyword}`;

  return {
    definition: page,
    contentHtml,
    excerpt: trimToLength(
      `${angle} com dicas praticas, comparacoes, FAQ e links para compra, preco e hospedagem.`,
      155,
    ),
    metaTitle: buildMetaTitle(page.keyword),
    metaDescription: buildMetaDescription(page.keyword, angle),
    focusKeyword: page.keyword,
    schemaType: page.schemaType,
    faqItems: faq,
  };
}

export function renderAllPages(): RenderedPage[] {
  return SILO_PAGES.map(renderPage);
}

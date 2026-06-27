/**
 * Enriquece posts do WordPress com mapa, telefone, preço e horário.
 * Insere os blocos imediatamente antes da seção FAQ de cada artigo.
 *
 * Run: npm run enrich
 */

import { logger } from "../utils/logger.js";
import { WordPressClient } from "../wordpress/client.js";
import { findPostBySlug } from "../wordpress/posts.js";

// ── Shared constants ──────────────────────────────────────────────────────────

const H2 = "font-family:Georgia,'Times New Roman',serif;color:#0f4f46;font-size:30px;line-height:1.3;margin:0 0 14px;";
const P = "margin:0 0 18px;color:#21433d;font-size:18px;line-height:1.85;";
const CARD = "margin:32px 0 0;padding:24px 22px;border:1px solid #d7ebe5;border-radius:18px;background:#f7fcfb;";
const LI = "margin-bottom:10px;color:#21433d;";
const UL = "margin:16px 0 0;padding-left:22px;font-size:18px;line-height:1.85;list-style:none;padding-left:0;";
const NOTE = "margin:14px 0 0;font-size:13px;color:#5b7b75;";
const BTN = "display:inline-flex;align-items:center;gap:10px;padding:13px 20px;background:#0f4f46;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:.9rem;box-shadow:0 6px 16px rgba(15,79,70,.22);";

const MAPS_URL = "https://www.google.com/maps/search/?api=1&query=Aldeia+das+Aguas+Park+Resort+Barra+do+Pirai+RJ";

function html(inner: string): string {
  return `<!-- wp:html -->\n${inner}\n<!-- /wp:html -->`;
}

// ── Block builders ────────────────────────────────────────────────────────────

function mapBlock(title: string, intro: string): string {
  return html(`<div style="${CARD}">
  <h2 style="${H2}">${title}</h2>
  <p style="${P}">${intro}</p>
  <a href="${MAPS_URL}" target="_blank" rel="noopener" style="${BTN}">
    <span>&#128205;</span><span>Ver no Google Maps</span>
  </a>
  <p style="${NOTE}">Endere&ccedil;o: Avenida Aldeia das &Aacute;guas, s/n &mdash; Barra do Pira&iacute;, RJ &mdash; CEP 27145-616</p>
</div>`);
}

function contactBlock(title: string, intro: string): string {
  return html(`<div style="${CARD}">
  <h2 style="${H2}">${title}</h2>
  <p style="${P}">${intro}</p>
  <ul style="${UL}">
    <li style="${LI}"><strong>Secretaria do Parque:</strong> (24) 3025-8180</li>
    <li style="${LI}"><strong>WhatsApp:</strong> (24) 99986-9620</li>
    <li style="${LI}"><strong>Central de Reservas (Hotel):</strong> (24) 99870-4944</li>
  </ul>
  <p style="${NOTE}">Contatos verificados em maio de 2026 no site oficial. Confirme antes de ligar.</p>
</div>`);
}

function hoursBlock(title: string, intro: string, items: string[]): string {
  const lis = items.map(i => `<li style="${LI}">${i}</li>`).join("\n    ");
  return html(`<div style="${CARD}">
  <h2 style="${H2}">${title}</h2>
  <p style="${P}">${intro}</p>
  <ul style="${UL}">
    ${lis}
  </ul>
  <p style="${NOTE}">Horários sujeitos a alteração por temporada e feriados. Confirme no site oficial antes da visita.</p>
</div>`);
}

function priceBlock(title: string, intro: string, items: string[], note: string): string {
  const lis = items.map(i => `<li style="${LI}">${i}</li>`).join("\n    ");
  return html(`<div style="${CARD}">
  <h2 style="${H2}">${title}</h2>
  <p style="${P}">${intro}</p>
  <ul style="${UL}">
    ${lis}
  </ul>
  <p style="${NOTE}">${note}</p>
</div>`);
}

// ── Enrichment definitions per slug ──────────────────────────────────────────

interface Enrichment {
  slug: string;
  blocks: string[];
}

const ENRICHMENTS: Enrichment[] = [
  {
    slug: "day-use-aldeia-das-aguas",
    blocks: [
      mapBlock(
        "Onde fica a Aldeia das Águas",
        "O resort está em Barra do Piraí, a cerca de 100 km do Rio de Janeiro pela Rodovia Presidente Dutra. Confirme o ponto no GPS antes de sair — o acesso fica bem sinalizado na rodovia.",
      ),
      hoursBlock(
        "Horário do day use por temporada",
        "O parque não opera em horário fixo o ano todo. Abaixo o padrão histórico — confirme sempre para a data exata da sua visita.",
        [
          "<strong>Alta temporada (dezembro, janeiro, julho):</strong> abertura às 9h–10h, encerramento às 17h–18h, funcionamento diário",
          "<strong>Fins de semana e feriados nacionais:</strong> operação regular na maioria dos períodos — confirmar horário específico",
          "<strong>Dias úteis fora de férias:</strong> funcionamento restrito ou encerrado — verificar antes de viajar",
          "<strong>Meses de manutenção (abril–junho):</strong> o parque pode operar parcialmente — confirmar com antecedência",
        ],
      ),
      priceBlock(
        "Quanto custa o day use",
        "O valor muda conforme data, dia da semana e canal de compra. Comprar pelo site oficial com antecedência quase sempre sai mais barato do que a bilheteria no dia.",
        [
          "<strong>Dia útil em baixa temporada:</strong> valor mais acessível do calendário",
          "<strong>Fim de semana e feriado:</strong> valor mais alto — demanda maior, menos espaço para negociar",
          "<strong>Online antecipado vs. bilheteria:</strong> online costuma ser de 10% a 20% mais barato, dependendo da data",
          "<strong>Gratuidade:</strong> crianças até certa altura entram sem pagar — verificar limite atual no site oficial",
          "<strong>Idosos (60+):</strong> condições especiais possíveis em alguns períodos — confirmar antes",
        ],
        "Valores variam diariamente. Confira o preço exato no site oficial ou via WhatsApp do resort antes de comprar.",
      ),
      contactBlock(
        "Contato para confirmar e comprar",
        "Use os canais abaixo para confirmar horário, disponibilidade e preço para a data da sua visita. O WhatsApp costuma ter resposta mais rápida do que o telefone fixo.",
      ),
    ],
  },
  {
    slug: "aldeia-das-aguas-preco",
    blocks: [
      contactBlock(
        "Como confirmar o preço antes de comprar",
        "O preço exato só aparece no momento da compra no site oficial. Se quiser confirmar antes de abrir o carrinho, os canais abaixo respondem com valores para a data que você informar.",
      ),
      mapBlock(
        "Onde fica a Aldeia das Águas",
        "Antes de fechar a compra, vale confirmar também a distância até o resort — o preço do day use muda dependendo de onde você parte.",
      ),
    ],
  },
  {
    slug: "ingresso-aldeia-das-aguas",
    blocks: [
      hoursBlock(
        "Horário de funcionamento para compra e acesso",
        "O horário do parque define até que horas o ingresso funciona. Quem chega próximo do encerramento aproveita menos — confirme o horário exato antes de comprar.",
        [
          "<strong>Alta temporada (dezembro, janeiro, julho):</strong> funcionamento diário, geralmente das 9h às 17h–18h",
          "<strong>Fins de semana regulares:</strong> operação padrão — confirmar horário específico",
          "<strong>Dias úteis fora de alta temporada:</strong> pode não funcionar — verificar antes de comprar",
        ],
      ),
      contactBlock(
        "Confirmar disponibilidade e comprar",
        "Antes de finalizar a compra do ingresso, confirme que o parque funciona na data escolhida. Use os canais abaixo para checar horário e disponibilidade.",
      ),
      mapBlock(
        "Localização do resort",
        "O ingresso dá acesso ao parque em Barra do Piraí (RJ). Confirme o endereço no GPS antes de viajar.",
      ),
    ],
  },
  {
    slug: "pacote-aldeia-das-aguas",
    blocks: [
      hoursBlock(
        "Check-in, check-out e acesso ao parque",
        "O horário de chegada e saída do hotel é diferente do horário de abertura do parque. Planejar a chegada certa evita perder horas de parque no primeiro dia.",
        [
          "<strong>Check-in:</strong> geralmente a partir das 14h — confirmar com o resort no momento da reserva",
          "<strong>Check-out:</strong> geralmente até as 12h — verificar se há acesso ao parque após a saída",
          "<strong>Acesso ao parque:</strong> incluso durante os dias de hospedagem — confirmar quantos dias de parque entram no pacote",
          "<strong>Abertura do parque:</strong> geralmente 9h–10h na alta temporada — verificar para a data específica",
        ],
      ),
      contactBlock(
        "Reservar o pacote e tirar dúvidas",
        "A Central de Reservas é o canal mais direto para fechar o pacote, confirmar disponibilidade e entender exatamente o que está incluso na diária escolhida.",
      ),
      mapBlock(
        "Localização do resort",
        "O pacote inclui hospedagem e acesso ao parque dentro do mesmo complexo em Barra do Piraí (RJ), a cerca de 100 km do Rio de Janeiro.",
      ),
    ],
  },
  {
    slug: "hotel-aldeia-das-aguas",
    blocks: [
      hoursBlock(
        "Check-in, check-out e acesso ao parque",
        "Os horários de entrada e saída do hotel definem quanto tempo o hóspede tem de parque disponível. Vale alinhar isso na reserva.",
        [
          "<strong>Check-in:</strong> a partir das 14h na maioria dos casos — confirmar com o resort",
          "<strong>Check-out:</strong> até as 12h — perguntar se é possível usar o parque após a saída",
          "<strong>Café da manhã:</strong> incluso ou não dependendo do pacote escolhido — verificar no momento da reserva",
          "<strong>Estacionamento:</strong> geralmente incluso para hóspedes — confirmar na reserva",
        ],
      ),
      contactBlock(
        "Reservar o hotel",
        "Para confirmar disponibilidade, tipo de acomodação e condições do pacote, a Central de Reservas é o canal mais direto.",
      ),
      mapBlock(
        "Onde fica o hotel dentro do resort",
        "O hotel está integrado ao complexo da Aldeia das Águas em Barra do Piraí (RJ). Hóspedes acessam o parque a pé, sem precisar de carro.",
      ),
    ],
  },
  {
    slug: "onde-ficar-perto-da-aldeia-das-aguas",
    blocks: [
      mapBlock(
        "Mapa da região — Barra do Piraí e arredores",
        "O resort fica em Barra do Piraí (RJ), com pousadas e opções de Airbnb distribuídas pela cidade e nos municípios vizinhos do Vale do Paraíba.",
      ),
      contactBlock(
        "Contato do hotel do resort",
        "Se a escolha for o hotel integrado ao resort, a Central de Reservas é o canal direto para confirmar disponibilidade e fechar a reserva.",
      ),
    ],
  },
  {
    slug: "airbnb-aldeia-das-aguas",
    blocks: [
      mapBlock(
        "Onde ficam os Airbnbs mais indicados",
        "A maioria das opções relevantes fica na própria Barra do Piraí ou nos municípios vizinhos do Vale do Paraíba. Use o mapa para entender a distância real até o resort antes de reservar.",
      ),
    ],
  },
  {
    slug: "atracoes-da-aldeia-das-aguas",
    blocks: [
      priceBlock(
        "Preço das atrações",
        "O acesso a todas as atrações do parque está incluído no ingresso do day use ou no pacote de hospedagem — não há cobrança extra por atração individual dentro do parque.",
        [
          "<strong>Tobogãs, piscinas e rio lento:</strong> incluídos no ingresso",
          "<strong>Kilimanjaro:</strong> incluído no ingresso — sem fila VIP paga",
          "<strong>Área infantil:</strong> incluída — sem restrição extra",
          "<strong>Armários e guarda-volumes:</strong> cobrados separadamente — confirmar valor na entrada",
          "<strong>Alimentação:</strong> não incluída no ingresso — preço de resort dentro do parque",
        ],
        "O ingresso dá acesso ao parque inteiro. Verifique o valor atual no site oficial antes da visita.",
      ),
      mapBlock(
        "Como chegar às atrações",
        "Todas as atrações ficam dentro do complexo da Aldeia das Águas em Barra do Piraí (RJ). O parque é percorrido a pé após entrar pelo portão principal.",
      ),
      contactBlock(
        "Confirmar funcionamento das atrações",
        "Algumas atrações podem estar em manutenção na data da sua visita. Para confirmar o que estará aberto, entre em contato antes de sair.",
      ),
    ],
  },
  {
    slug: "aldeia-das-aguas-horario-de-funcionamento",
    blocks: [
      contactBlock(
        "Confirmar horário para a data exata",
        "O horário do parque muda por temporada e pode variar em feriados e períodos de manutenção. A forma mais segura de confirmar é falar diretamente com o resort antes de planejar a viagem.",
      ),
      mapBlock(
        "Localização do parque",
        "A Aldeia das Águas fica em Barra do Piraí (RJ), a cerca de 100 km do Rio de Janeiro. Planejar a saída com base no horário de abertura é essencial para aproveitar o dia inteiro.",
      ),
    ],
  },
  {
    slug: "kilimanjaro-aldeia-das-aguas",
    blocks: [
      priceBlock(
        "Quanto custa usar o Kilimanjaro",
        "O Kilimanjaro está incluído no ingresso padrão do parque — não há cobrança extra pela atração. O custo que vale calcular é o do ingresso do day use em si, que varia por data e canal de compra.",
        [
          "<strong>Acesso ao Kilimanjaro:</strong> incluído no ingresso do parque — sem custo adicional",
          "<strong>Altura mínima:</strong> geralmente 1,40m–1,50m — verificar regra atual na entrada da atração",
          "<strong>Peso máximo:</strong> existe limitação de segurança — confirmar no resort",
          "<strong>Proibido para:</strong> gestantes, cardíacos e pessoas com problemas de coluna",
        ],
        "Regras de acesso ao Kilimanjaro podem mudar. Confirme as restrições atuais no site oficial antes de criar expectativa.",
      ),
      mapBlock(
        "Como chegar ao Kilimanjaro",
        "O Kilimanjaro fica dentro do complexo da Aldeia das Águas em Barra do Piraí (RJ). Após entrar no parque, é a atração mais visível — a estrutura se destaca pela altura.",
      ),
      contactBlock(
        "Confirmar funcionamento antes de ir",
        "Em alguns dias o Kilimanjaro pode estar em manutenção ou fechado temporariamente. Confirme com o resort antes de viajar especificamente para essa atração.",
      ),
    ],
  },
  {
    slug: "aldeia-das-aguas-com-criancas",
    blocks: [
      priceBlock(
        "Preço para visita com crianças",
        "Crianças até certa altura entram sem pagar — o critério é a estatura, não a idade. Isso pode representar economia significativa para famílias com crianças pequenas.",
        [
          "<strong>Gratuidade:</strong> crianças até a altura definida pelo resort entram grátis — verificar o limite atual no site oficial",
          "<strong>Crianças acima da altura de gratuidade:</strong> pagam ingresso integral ou meia conforme a política vigente",
          "<strong>Compra antecipada:</strong> recomendada para garantir acesso — parque pode fechar para novos visitantes em dias cheios",
          "<strong>Armários:</strong> cobrado à parte — útil para guardar pertences da família durante o dia",
        ],
        "Confira a altura exata para gratuidade no site oficial antes de comprar — a regra pode ser atualizada por temporada.",
      ),
      mapBlock(
        "Como chegar com crianças",
        "O resort fica em Barra do Piraí (RJ), a cerca de 100 km do Rio de Janeiro pela Rodovia Presidente Dutra. Planejar o horário de saída com margem é especialmente importante quando se viaja com crianças.",
      ),
      contactBlock(
        "Confirmar condições para crianças",
        "Antes de viajar, confirme a altura para gratuidade e quais atrações têm restrição de acesso para crianças. O resort esclarece essas informações pelo WhatsApp.",
      ),
    ],
  },
  {
    slug: "aldeia-das-aguas",
    blocks: [
      mapBlock(
        "Onde fica a Aldeia das Águas",
        "O resort está em Barra do Piraí, no interior do Rio de Janeiro, a cerca de 100 km da capital pela Rodovia Presidente Dutra. Acesso fácil tanto para quem vem do Rio quanto de São Paulo.",
      ),
      contactBlock(
        "Contato do resort",
        "Para confirmar horário, preços ou fazer reservas, os canais abaixo são os mais diretos. O WhatsApp costuma ter resposta mais rápida.",
      ),
    ],
  },
];

// ── Core: insert blocks before FAQ section ────────────────────────────────────

function insertBeforeFaq(content: string, blocks: string[]): string {
  const FAQ_MARKER = "Perguntas frequentes sobre";
  const WP_HTML_OPEN = "<!-- wp:html -->";

  const faqPos = content.indexOf(FAQ_MARKER);
  if (faqPos === -1) {
    // No FAQ found — append at end
    return content + "\n\n" + blocks.join("\n\n");
  }

  const insertPos = content.lastIndexOf(WP_HTML_OPEN, faqPos);
  if (insertPos === -1) {
    return content + "\n\n" + blocks.join("\n\n");
  }

  return (
    content.slice(0, insertPos) +
    blocks.join("\n\n") +
    "\n\n" +
    content.slice(insertPos)
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const client = new WordPressClient();
  let enriched = 0;
  let skipped = 0;

  logger.info(`Enriquecendo ${ENRICHMENTS.length} posts no WordPress...`);

  for (const enrichment of ENRICHMENTS) {
    const post = await findPostBySlug(client, enrichment.slug);
    if (!post) {
      logger.warn(`Post nao encontrado: ${enrichment.slug}`);
      skipped++;
      continue;
    }

    const currentContent: string = (post as unknown as { content: { raw?: string; rendered: string } }).content.raw
      ?? (post as unknown as { content: { rendered: string } }).content.rendered;

    const enrichedContent = insertBeforeFaq(currentContent, enrichment.blocks);

    await client.request(`wp/v2/posts/${post.id}`, {
      method: "POST",
      body: { content: enrichedContent },
      expectedStatus: [200],
    });

    logger.info(`[OK] ${enrichment.slug} (ID ${post.id}) — ${enrichment.blocks.length} bloco(s) inserido(s)`);
    enriched++;
  }

  logger.info(`\nResultado: ${enriched} posts enriquecidos, ${skipped} ignorados.`);
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

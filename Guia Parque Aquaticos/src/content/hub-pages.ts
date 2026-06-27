import { escapeHtml } from "../utils/text.js";
import { SILO_GROUPS, type SiloGroup } from "./silo/definitions/groups.js";
import { findSiloPage } from "./silo/registry.js";

const WRAPPER =
  "font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#21433d;font-size:18px;line-height:1.85;";
const CARD =
  "margin:28px 0;padding:24px 22px;border:1px solid #cfe5df;border-radius:18px;background:linear-gradient(180deg,#f7fcfb 0%,#eef7f5 100%);box-shadow:0 10px 26px rgba(16,68,60,.08);";
const H2 =
  "font-family:Georgia,'Times New Roman',serif;color:#0f4f46;font-size:30px;line-height:1.3;margin:0 0 14px;";
const H3 =
  "font-family:Georgia,'Times New Roman',serif;color:#1f6a5f;font-size:21px;line-height:1.35;margin:22px 0 10px;";
const P = "margin:0 0 18px;color:#21433d;";
const UL = "margin:10px 0 18px;padding-left:20px;";
const LI = "margin-bottom:10px;color:#21433d;";
const STRONG = "color:#0a3f38;";
const CHILD_CARD =
  "display:block;padding:18px 20px;border:1px solid #cfe5df;border-radius:14px;background:#ffffff;text-decoration:none;box-shadow:0 8px 20px rgba(16,68,60,.08);";
const SPLIT_GRID =
  "display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin:18px 0;";
const INFO_CARD =
  "padding:20px 18px;border:1px solid #cfe5df;border-radius:14px;background:#ffffff;box-shadow:0 6px 16px rgba(16,68,60,.07);";
const TABLE =
  "width:100%;border-collapse:collapse;font-size:16px;margin:14px 0 0;";
const TH =
  "text-align:left;padding:10px 14px;background:#e4f3ef;color:#0f4f46;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:.05em;";
const TD =
  "padding:10px 14px;border-top:1px solid #daeee8;color:#21433d;vertical-align:top;";
const TAG =
  "display:inline-block;background:#dff3ee;color:#14574d;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;margin-bottom:10px;";
const BADGE_GREEN =
  "display:inline-block;background:#d4f5e3;color:#0d6b3e;border-radius:999px;padding:2px 8px;font-size:12px;font-weight:700;";
const BADGE_ORANGE =
  "display:inline-block;background:#fde8cc;color:#a05000;border-radius:999px;padding:2px 8px;font-size:12px;font-weight:700;";

function introSection(group: SiloGroup): string {
  return [
    `<div style="${CARD}">`,
    `<h2 style="${H2}">${escapeHtml(group.name)}</h2>`,
    `<p style="${P}">${escapeHtml(group.intro)}</p>`,
    `<p style="${P}">Escolha abaixo apenas o guia que responde à sua dúvida nesta etapa. A ideia desta página é organizar melhor a leitura, sem empilhar links demais.</p>`,
    `</div>`,
  ].join("");
}

function childrenGrid(group: SiloGroup): string {
  const cards = group.children
    .map((child) => {
      const page = findSiloPage(child.key);
      return [
        `<a href="/${page.slug}/" style="${CHILD_CARD}">`,
        `<strong style="display:block;color:#0f4f46;font-size:17px;line-height:1.4;margin-bottom:6px;">${escapeHtml(page.title)}</strong>`,
        `<span style="display:block;color:#47635d;font-size:14px;line-height:1.5;">${escapeHtml(child.description)}</span>`,
        `</a>`,
      ].join("");
    })
    .join("");

  return [
    `<div style="${CARD}">`,
    `<h2 style="${H2}">Guias desta categoria</h2>`,
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;">${cards}</div>`,
    `</div>`,
  ].join("");
}

function hospedagemRichContent(): string {
  const mapsUrl = "https://www.google.com/maps/search/?api=1&query=Aldeia+das+Aguas+Park+Resort+Barra+do+Pirai+RJ";
  const mapsNearbyUrl = "https://www.google.com/maps/search/?api=1&query=hoteis+perto+da+Aldeia+das+Aguas+Park+Resort+Barra+do+Pirai+RJ";

  const mapCard = [
    `<div style="${CARD}">`,
    `<h2 style="${H2}">Localização do resort e entorno</h2>`,
    `<p style="${P}">A Aldeia das Águas Park Resort fica em Barra do Piraí, no interior do Rio de Janeiro, com acesso direto pela Rodovia Presidente Dutra. Use os links abaixo para visualizar o resort e explorar hospedagens próximas.</p>`,
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:18px 0;">`,
    `<a href="${mapsUrl}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;padding:16px 18px;background:#ffffff;border:1px solid #cfe5df;border-radius:14px;text-decoration:none;color:#0f4f46;font-weight:700;font-size:.93rem;box-shadow:0 4px 12px rgba(16,68,60,.07);">`,
    `<span style="font-size:1.5rem;">📍</span>`,
    `<span>Ver resort no Google Maps</span>`,
    `</a>`,
    `<a href="${mapsNearbyUrl}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:12px;padding:16px 18px;background:#ffffff;border:1px solid #cfe5df;border-radius:14px;text-decoration:none;color:#0f4f46;font-weight:700;font-size:.93rem;box-shadow:0 4px 12px rgba(16,68,60,.07);">`,
    `<span style="font-size:1.5rem;">🏨</span>`,
    `<span>Hotéis próximos no mapa</span>`,
    `</a>`,
    `</div>`,
    `<p style="margin:14px 0 0;font-size:14px;color:#5b7b75;background:#f0faf7;border-radius:10px;padding:12px 14px;border-left:3px solid #1c6a5f;">`,
    `<strong style="color:#0f4f46;">Endereço:</strong> Avenida Aldeia das Águas, s/n — Barra do Piraí, RJ — CEP 27145-616`,
    `</p>`,
    `</div>`,
  ].join("");

  const checkinCard = [
    `<div style="${CARD}">`,
    `<h2 style="${H2}">Check-in, check-out e política de reserva</h2>`,
    `<p style="${P}">As informações abaixo refletem o padrão habitual do resort. Confirme sempre no momento da reserva, pois as políticas podem variar por tipo de acomodação e temporada.</p>`,
    `<table style="${TABLE}">`,
    `<thead><tr>`,
    `<th style="${TH}">Informação</th>`,
    `<th style="${TH}">Detalhe</th>`,
    `</tr></thead>`,
    `<tbody>`,
    `<tr><td style="${TD}"><strong style="${STRONG}">Check-in</strong></td><td style="${TD}">A partir das 15h — apresentação de documento com foto</td></tr>`,
    `<tr><td style="${TD}"><strong style="${STRONG}">Check-out</strong></td><td style="${TD}">Até 12h — saída além desse horário pode gerar cobrança extra</td></tr>`,
    `<tr><td style="${TD}"><strong style="${STRONG}">Early check-in</strong></td><td style="${TD}">Sujeito à disponibilidade — confirmar com antecedência</td></tr>`,
    `<tr><td style="${TD}"><strong style="${STRONG}">Late check-out</strong></td><td style="${TD}">Pode ser solicitado — taxa adicional dependendo do horário</td></tr>`,
    `<tr><td style="${TD}"><strong style="${STRONG}">Cancelamento</strong></td><td style="${TD}">Política varia por temporada — verificar no momento da reserva</td></tr>`,
    `<tr><td style="${TD}"><strong style="${STRONG}">Formas de pagamento</strong></td><td style="${TD}">Cartão de crédito, débito e Pix — confirmar parcelamento disponível</td></tr>`,
    `<tr><td style="${TD}"><strong style="${STRONG}">Pets</strong></td><td style="${TD}">Verificar política de animais no resort antes de reservar</td></tr>`,
    `</tbody>`,
    `</table>`,
    `</div>`,
  ].join("");

  const resortVsExternal = [
    `<div style="${CARD}">`,
    `<h2 style="${H2}">Hotel no resort versus hospedagem externa</h2>`,
    `<p style="${P}">A comparação mais útil não é apenas de preço de diária — é de custo e praticidade totais. Cada opção serve bem um perfil diferente.</p>`,
    `<div style="${SPLIT_GRID}">`,

    // Card hotel do resort
    `<div style="${INFO_CARD}">`,
    `<div style="${TAG}">Hotel do Resort</div>`,
    `<h3 style="${H3};margin-top:0;">Aldeia das Águas Park Resort</h3>`,
    `<ul style="${UL}">`,
    `<li style="${LI}"><strong style="${STRONG}">Acesso ao parque:</strong> incluído na diária — caminhada até as atrações</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Check-in:</strong> 15h &nbsp;<span style="${BADGE_GREEN}">no resort</span></li>`,
    `<li style="${LI}"><strong style="${STRONG}">Check-out:</strong> 12h</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Estrutura:</strong> chalés, bangalôs e quartos de hotel — varia por categoria</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Café da manhã:</strong> pode estar incluso dependendo do pacote</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Estacionamento:</strong> geralmente incluso para hóspedes</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Ideal para:</strong> famílias com crianças, casais, quem vem de longe</li>`,
    `</ul>`,
    `</div>`,

    // Card externo
    `<div style="${INFO_CARD}">`,
    `<div style="${TAG}">Hospedagem externa</div>`,
    `<h3 style="${H3};margin-top:0;">Pousadas, hotéis e Airbnb</h3>`,
    `<ul style="${UL}">`,
    `<li style="${LI}"><strong style="${STRONG}">Distância:</strong> de poucos km (Barra do Piraí) a ~30 km (Volta Redonda)</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Check-in médio:</strong> 14h a 15h — varia por propriedade</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Check-out médio:</strong> 11h a 12h — varia por propriedade</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Transporte:</strong> necessário — carro próprio ou táxi/app até o resort</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Custo por pessoa:</strong> pode ser menor em grupos grandes</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Airbnb:</strong> cozinha própria, mais espaço — ideal para 5+ pessoas</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Ideal para:</strong> grupos grandes, viajantes econômicos com carro</li>`,
    `</ul>`,
    `</div>`,

    `</div>`, // fecha split grid
    `</div>`,
  ].join("");

  const nearbyRef = [
    `<div style="${CARD}">`,
    `<h2 style="${H2}">Referências de hospedagem na região</h2>`,
    `<p style="${P}">As opções abaixo ficam próximas da Aldeia das Águas e costumam atender visitantes do resort. Confirme disponibilidade e distância exata antes de reservar.</p>`,

    `<h3 style="${H3}">Barra do Piraí — cidade do resort</h3>`,
    `<p style="${P}">A cidade que sedia o resort tem pousadas e pequenos hotéis a poucos quilômetros do complexo. É a opção mais próxima para quem não vai se hospedar dentro do resort.</p>`,
    `<ul style="${UL}">`,
    `<li style="${LI}"><strong style="${STRONG}">Distância até o resort:</strong> 3 a 10 km dependendo do estabelecimento</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Perfil:</strong> pousadas simples e hotéis locais — custo mais acessível</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Transporte:</strong> carro próprio ou táxi — cerca de 5 a 15 minutos</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Como buscar:</strong> pesquise "pousadas Barra do Piraí" no Google ou Booking.com</li>`,
    `</ul>`,

    `<h3 style="${H3}">Volta Redonda — ~30 km</h3>`,
    `<p style="${P}">Cidade maior com infraestrutura mais completa de hotéis — boa opção para quem quer mais opções de restaurante e serviços além da hospedagem.</p>`,
    `<ul style="${UL}">`,
    `<li style="${LI}"><strong style="${STRONG}">Distância até o resort:</strong> aproximadamente 30 km pela BR-393 ou Dutra</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Tempo de viagem:</strong> em torno de 30 a 40 minutos dependendo do trânsito</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Perfil:</strong> hotéis de rede e opções de negócios — estrutura mais completa</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Vantagem:</strong> mais opções de restaurante e conveniência urbana</li>`,
    `</ul>`,

    `<h3 style="${H3}">Airbnb na região do Vale do Paraíba</h3>`,
    `<p style="${P}">Para grupos de 5 ou mais pessoas, aluguéis por temporada na região costumam diluir bastante o custo por pessoa. Casas com cozinha e área externa são opções populares para fins de semana no Vale.</p>`,
    `<ul style="${UL}">`,
    `<li style="${LI}"><strong style="${STRONG}">Onde buscar:</strong> filtre por "Barra do Piraí" ou "Vale do Paraíba RJ" no Airbnb</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Filtro importante:</strong> verificar distância em km até a Aldeia das Águas Park Resort</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Custo:</strong> <span style="${BADGE_GREEN}">menor por pessoa</span> em grupos — dividir entre 5 ou mais muda o cálculo</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Cuidado:</strong> transportar o grupo até o resort diariamente aumenta o custo final</li>`,
    `</ul>`,

    `</div>`,
  ].join("");

  const practicalTips = [
    `<div style="${CARD}">`,
    `<h2 style="${H2}">O que confirmar antes de reservar</h2>`,
    `<p style="${P}">Independente da opção de hospedagem escolhida, esses pontos fazem diferença no dia da visita e evitam surpresas:</p>`,
    `<ul style="${UL}">`,
    `<li style="${LI}"><strong style="${STRONG}">Acesso ao parque incluído?</strong> No hotel do resort, geralmente sim. Em hospedagem externa, o ingresso precisa ser comprado separadamente.</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Estacionamento:</strong> gratuito para hóspedes dentro do resort. Hospedagem externa precisa considerar estacionamento pago no parque.</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Café da manhã:</strong> confirmar se está incluso ou é cobrado à parte — muda o cálculo de custo total.</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Política de cancelamento:</strong> em alta temporada, muitas hospedagens têm cancelamento não reembolsável — leia com atenção antes de pagar.</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Número de hóspedes:</strong> confirmar limite por acomodação — especialmente em Airbnb, ultrapassar o limite pode gerar cobrança extra.</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Berço ou cama extra:</strong> para famílias com bebê — confirmar disponibilidade e custo adicional.</li>`,
    `<li style="${LI}"><strong style="${STRONG}">Acessibilidade:</strong> se houver pessoa com mobilidade reduzida, confirmar estrutura antes de reservar.</li>`,
    `</ul>`,
    `<p style="${P}"><strong style="${STRONG}">Dica de canal de reserva:</strong> site oficial do resort para o hotel interno; Booking.com, Airbnb ou contato direto para hospedagens externas. <span style="${BADGE_ORANGE}">Evite intermediários não verificados</span> — especialmente para reservas em feriados.</p>`,
    `</div>`,
  ].join("");

  return [mapCard, checkinCard, resortVsExternal, nearbyRef, practicalTips].join("");
}

function hospedagemExtraBlocks(): string[] {
  const raw = hospedagemRichContent();
  // Split each top-level <div style="..."> card into its own wp:html block
  const cardPattern = /(<div style="[^"]*margin:[^"]*">[\s\S]*?(?=<div style="[^"]*margin:|$))/g;
  const cards: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = cardPattern.exec(raw)) !== null) {
    const chunk = match[1].trim();
    if (chunk) cards.push(`<!-- wp:html -->\n${chunk}\n<!-- /wp:html -->`);
  }
  // Fallback: if regex found nothing meaningful, emit the whole thing as one block
  if (cards.length === 0) {
    return [`<!-- wp:html -->\n${raw}\n<!-- /wp:html -->`];
  }
  return cards;
}

export function buildHubPageContent(group: SiloGroup): string {
  const blocks: string[] = [];

  // 1. Intro card — isolated wp:html block
  blocks.push(`<!-- wp:html -->\n${introSection(group)}\n<!-- /wp:html -->`);

  // 2. Extra rich content for hospedagem — one wp:html block per card section
  if (group.key === "hospedagem") {
    blocks.push(...hospedagemExtraBlocks());
  }

  // 3. Children grid — isolated wp:html block
  blocks.push(`<!-- wp:html -->\n${childrenGrid(group)}\n<!-- /wp:html -->`);

  return blocks.join("\n\n");
}

export { SILO_GROUPS };

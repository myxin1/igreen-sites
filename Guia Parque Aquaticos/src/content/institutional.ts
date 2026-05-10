import { AFFILIATE_URL } from "../config/site.js";

export interface InstitutionalPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
}

const WRAPPER_STYLE =
  "font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#21433d;font-size:18px;line-height:1.85;";
const CARD_STYLE =
  "margin:28px 0;padding:24px 22px;border:1px solid #cfe5df;border-radius:18px;background:linear-gradient(180deg,#f7fcfb 0%,#eef7f5 100%);box-shadow:0 10px 26px rgba(16,68,60,.08);";
const CTA_STYLE =
  "margin:30px 0;padding:24px 22px;border:1px solid #cfe5df;border-radius:20px;background:radial-gradient(circle at top left, rgba(255,138,0,.12), transparent 34%), linear-gradient(135deg,#f4fbf8 0%,#e8f5f1 100%);box-shadow:0 16px 34px rgba(15,79,70,.08);";
const HERO_STYLE =
  "margin:0 0 36px;padding:40px 36px;border-radius:22px;background:radial-gradient(circle at top left,rgba(255,138,0,.14),transparent 34%),linear-gradient(135deg,#0f4f46 0%,#1c6a5f 100%);box-shadow:0 24px 48px rgba(15,79,70,.18);";
const CHIP_STYLE =
  "display:inline-block;background:#dff3ee;color:#14574d;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 12px;";
const HERO_CHIP_STYLE =
  "display:inline-block;background:rgba(255,255,255,.16);border-radius:999px;padding:6px 14px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin:0 0 14px;color:#fff;";
const H1_STYLE =
  "font-family:Georgia,'Times New Roman',serif;color:#fff;font-size:32px;line-height:1.25;margin:0 0 14px;";
const H2_STYLE =
  "font-family:Georgia,'Times New Roman',serif;color:#0f4f46;font-size:30px;line-height:1.3;margin:38px 0 14px;";
const P_STYLE = "margin:0 0 18px;color:#21433d;";
const UL_STYLE = "margin:18px 0 24px;padding-left:22px;";
const LI_STYLE = "margin-bottom:12px;color:#21433d;";
const LINK_STYLE =
  "color:#0f6a5c;font-weight:700;text-decoration:underline;text-decoration-color:#a8d9cf;text-underline-offset:3px;";
const STRONG_STYLE = "color:#0a3f38;";
const PRIMARY_BUTTON_STYLE =
  "display:inline-block;padding:14px 20px;border-radius:12px;background:linear-gradient(135deg,#ff8a00 0%,#ff5a2a 100%);color:#ffffff;text-decoration:none;font-weight:700;box-shadow:0 10px 24px rgba(255,90,42,.22);";
const SECONDARY_BUTTON_STYLE =
  "display:inline-block;padding:14px 20px;border-radius:12px;background:#ffffff;color:#14574d;text-decoration:none;font-weight:700;border:1px solid #b9d6cf;";
const NOTICE_STYLE =
  "margin:28px 0;padding:18px 20px;border-left:4px solid #14574d;border-radius:0 14px 14px 0;background:#eef7f5;color:#21433d;font-size:16px;line-height:1.7;";

function wrap(inner: string): string {
  return `<div style="${WRAPPER_STYLE}">${inner}</div>`;
}

function hero(eyebrow: string, title: string, description: string, buttons: string[] = []): string {
  return [
    `<div style="${HERO_STYLE}">`,
    `<span style="${HERO_CHIP_STYLE}">${eyebrow}</span>`,
    `<h1 style="${H1_STYLE}">${title}</h1>`,
    `<p style="color:rgba(255,255,255,.88);font-size:1.05rem;line-height:1.75;margin:0${buttons.length ? " 0 24px" : ""};max-width:620px;">${description}</p>`,
    buttons.length
      ? `<div style="display:flex;flex-wrap:wrap;gap:12px;">${buttons.join("")}</div>`
      : "",
    `</div>`,
  ].join("");
}

function card(eyebrow: string, title: string, body: string): string {
  return [
    `<div style="${CARD_STYLE}">`,
    `<span style="${CHIP_STYLE}">${eyebrow}</span>`,
    `<h2 style="${H2_STYLE}">${title}</h2>`,
    body,
    `</div>`,
  ].join("");
}

function ctaCard(eyebrow: string, title: string, copy: string, buttons: string[]): string {
  return [
    `<div style="${CTA_STYLE}">`,
    `<span style="${CHIP_STYLE}">${eyebrow}</span>`,
    `<h2 style="${H2_STYLE}">${title}</h2>`,
    `<p style="${P_STYLE}">${copy}</p>`,
    buttonsRow(buttons),
    `</div>`,
  ].join("");
}

function notice(copy: string): string {
  return `<div style="${NOTICE_STYLE}">${copy}</div>`;
}

function link(href: string, label: string): string {
  return `<a href="${href}" style="${LINK_STYLE}">${label}</a>`;
}

function button(label: string, href: string, kind: "primary" | "secondary" = "primary"): string {
  const style = kind === "primary" ? PRIMARY_BUTTON_STYLE : SECONDARY_BUTTON_STYLE;
  return `<a href="${href}" style="${style}">${label}</a>`;
}

function buttonsRow(buttons: string[]): string {
  return `<div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:16px;">${buttons.join("")}</div>`;
}

function bulletList(items: string[]): string {
  return `<ul style="${UL_STYLE}">${items
    .map((item) => `<li style="${LI_STYLE}">${item}</li>`)
    .join("")}</ul>`;
}

function faqAccordion(items: Array<{ question: string; answer: string }>): string {
  return items
    .map(
      (item) =>
        `<details style="padding:4px 0 0;border:1px solid #cfe5df;border-radius:14px;background:#ffffff;box-shadow:0 8px 18px rgba(15,79,70,.08);margin-bottom:12px;overflow:hidden;">` +
        `<summary style="list-style:none;cursor:pointer;padding:16px 18px;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#0f4f46;">${item.question}</summary>` +
        `<div style="padding:0 18px 18px 18px;"><p style="${P_STYLE};margin-bottom:0;">${item.answer}</p></div>` +
        `</details>`,
    )
    .join("");
}

function faqSection(title: string, items: Array<{ question: string; answer: string }>): string {
  return [
    `<div style="${CARD_STYLE}">`,
    `<span style="${CHIP_STYLE}">Perguntas frequentes</span>`,
    `<h2 style="${H2_STYLE}">${title}</h2>`,
    faqAccordion(items),
    `</div>`,
  ].join("");
}

function contactFormShell(shortcode: string): string {
  return [
    `<style>
      .gpq-contact-form-shell .wpcf7 {
        margin: 0;
      }
      .gpq-contact-form-shell .wpcf7 form {
        display: grid;
        gap: 18px;
        margin-top: 8px;
      }
      .gpq-contact-form-shell .wpcf7 p {
        margin: 0;
      }
      .gpq-contact-form-shell .wpcf7 label {
        display: block;
        color: #0f4f46;
        font-size: .84rem;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .gpq-contact-form-shell .wpcf7-form-control-wrap {
        display: block;
        margin-top: 8px;
      }
      .gpq-contact-form-shell--hydrated .wpcf7 label {
        font-size: 0;
        letter-spacing: 0;
      }
      .gpq-contact-form-shell--hydrated .wpcf7 label[data-gpq-label]::before {
        content: attr(data-gpq-label);
        display: block;
        color: #0f4f46;
        font-size: .84rem;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .gpq-contact-form-shell--hydrated .wpcf7 label .wpcf7-form-control-wrap {
        font-size: 1rem;
      }
      .gpq-contact-form-shell .wpcf7 input[type="text"],
      .gpq-contact-form-shell .wpcf7 input[type="email"],
      .gpq-contact-form-shell .wpcf7 textarea {
        width: 100%;
        border: 1px solid #c6ded7;
        border-radius: 16px;
        background: #ffffff;
        color: #103e37;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
        padding: 14px 16px;
        font-size: 1rem;
        line-height: 1.6;
        transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
        box-sizing: border-box;
        margin-top: 8px;
      }
      .gpq-contact-form-shell .wpcf7 textarea {
        min-height: 190px;
        resize: vertical;
      }
      .gpq-contact-form-shell .wpcf7 input[type="text"]:focus,
      .gpq-contact-form-shell .wpcf7 input[type="email"]:focus,
      .gpq-contact-form-shell .wpcf7 textarea:focus {
        outline: none;
        border-color: #0f7969;
        box-shadow: 0 0 0 4px rgba(15,121,105,.12);
        transform: translateY(-1px);
      }
      .gpq-contact-form-shell .wpcf7 input[type="submit"] {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 240px;
        padding: 15px 22px;
        border: 0;
        border-radius: 999px;
        background: linear-gradient(135deg, #ff9a1f 0%, #ff6a1f 100%);
        color: #ffffff;
        font-size: 1rem;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 12px 28px rgba(255,106,31,.26);
        transition: transform .2s ease, box-shadow .2s ease, filter .2s ease;
      }
      .gpq-contact-form-shell .wpcf7 input[type="submit"]:hover {
        transform: translateY(-2px);
        filter: brightness(1.02);
      }
      .gpq-contact-form-shell .wpcf7 .wpcf7-spinner {
        margin: 12px 0 0 12px;
      }
      .gpq-contact-form-shell .wpcf7 .screen-reader-response,
      .gpq-contact-form-shell .wpcf7 .wpcf7-response-output {
        margin: 0;
        border-radius: 14px;
      }
      @media (max-width: 640px) {
        .gpq-contact-form-shell .wpcf7 input[type="submit"] {
          width: 100%;
          min-width: 0;
        }
      }
    </style>`,
    `<div class="gpq-contact-form-shell">${shortcode}</div>`,
    `<script>
      (function () {
        function applyContactFormCopy() {
          var root = document.querySelector('.gpq-contact-form-shell');
          if (!root) return;

          var fields = [
            {
              name: 'your-name',
              label: 'Seu nome',
              placeholder: 'Como voc\\u00ea gostaria de ser chamado?'
            },
            {
              name: 'your-email',
              label: 'Seu e-mail',
              placeholder: 'voce@exemplo.com'
            },
            {
              name: 'your-subject',
              label: 'Assunto',
              placeholder: 'Ex.: corre\\u00e7\\u00e3o editorial, sugest\\u00e3o de pauta, parceria'
            },
            {
              name: 'your-message',
              label: 'Sua mensagem',
              placeholder: 'Conte com o m\\u00e1ximo de contexto poss\\u00edvel para acelerar a resposta.'
            }
          ];

          fields.forEach(function (config) {
            var wrap = root.querySelector('[data-name=\"' + config.name + '\"]');
            if (!wrap) return;

            var label = wrap.closest('label');
            if (label) {
              label.setAttribute('data-gpq-label', config.label);
            }

            var field = wrap.querySelector('input, textarea');
            if (field && config.placeholder) {
              field.setAttribute('placeholder', config.placeholder);
            }
          });

          var submit = root.querySelector('input[type=\"submit\"]');
          if (submit) {
            submit.value = 'Enviar mensagem';
          }

          root.classList.add('gpq-contact-form-shell--hydrated');
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', applyContactFormCopy, { once: true });
        } else {
          applyContactFormCopy();
        }
      })();
    </script>`,
  ].join("");
}

const aboutContent = wrap(
  [
    hero(
      "Quem somos",
      "Guia Parques Aquáticos",
      "Um portal editorial independente criado para reduzir dúvidas, encurtar a pesquisa e ajudar o visitante a planejar melhor a ida a parques aquáticos no Brasil.",
      [button("Ver guia principal", "/aldeia-das-aguas/"), button("Falar com a equipe", "/contato/", "secondary")],
    ),
    card(
      "Visão geral",
      "O que você encontra aqui",
      [
        `<p style="${P_STYLE}">O Guia Parques Aquáticos organiza a pesquisa em blocos práticos: compra, hospedagem, planejamento e comparativos regionais. A proposta é a mesma dos posts principais: menos texto solto e mais apoio para decisão.</p>`,
        `<p style="${P_STYLE}">Hoje o foco editorial está na ${link("/aldeia-das-aguas/", "Aldeia das Águas Park Resort")}, com expansão gradual para outros destinos e guias regionais do Brasil.</p>`,
      ].join(""),
    ),
    ctaCard(
      "Guia rápido",
      "Como usamos o mesmo conceito dos posts",
      "As páginas institucionais agora seguem a mesma lógica editorial dos artigos: contexto claro, blocos curtos, próximos passos e respostas objetivas para o leitor sair com menos fricção.",
      [button("Explorar o silo da Aldeia", "/aldeia-das-aguas/"), button("Ver ingressos", AFFILIATE_URL, "secondary")],
    ),
    card(
      "Método editorial",
      "Como produzimos os guias",
      [
        `<p style="${P_STYLE}">Cada conteúdo parte da pergunta real do visitante. Em vez de tentar cobrir tudo de uma vez, separamos a jornada em páginas específicas para facilitar comparação, compra e planejamento.</p>`,
        bulletList([
          `<strong style="${STRONG_STYLE}">Preço e ingresso:</strong> como comparar formatos de compra, datas e antecedência`,
          `<strong style="${STRONG_STYLE}">Hospedagem:</strong> quando hotel, pousada ou Airbnb fazem mais sentido`,
          `<strong style="${STRONG_STYLE}">Planejamento:</strong> como chegar, horário, atrações e melhor dia para visitar`,
          `<strong style="${STRONG_STYLE}">Comparação regional:</strong> guias para decidir entre parques e destinos`,
        ]),
        `<p style="${P_STYLE}">Quando algum dado pode variar com frequência, deixamos isso explícito e orientamos o leitor a confirmar no canal oficial antes de comprar ou viajar.</p>`,
      ].join(""),
    ),
    card(
      "Cobertura atual",
      "Onde o site aprofunda mais",
      [
        `<p style="${P_STYLE}">A ${link("/aldeia-das-aguas/", "Aldeia das Águas")} é o centro do site hoje. Ao redor dela, publicamos guias complementares para compra, hospedagem, atrações e comparativos regionais.</p>`,
        bulletList([
          `${link("/aldeia-das-aguas-preco/", "Preço")} e ${link("/ingresso-aldeia-das-aguas/", "ingresso")} para a etapa comercial`,
          `${link("/hotel-aldeia-das-aguas/", "Hotel")}, ${link("/onde-ficar-aldeia-das-aguas/", "onde ficar")} e ${link("/airbnb-aldeia-das-aguas/", "Airbnb")} para hospedagem`,
          `${link("/atracoes-aldeia-das-aguas/", "Atrações")}, ${link("/melhor-dia-aldeia-das-aguas/", "melhor dia")} e ${link("/dicas-aldeia-das-aguas/", "dicas")} para planejamento`,
          `${link("/parques-aquaticos-rj/", "Parques aquáticos no RJ")} e ${link("/melhores-parques-aquaticos-brasil/", "melhores parques aquáticos do Brasil")} para comparação de destino`,
        ]),
      ].join(""),
    ),
    notice(
      `<strong style="${STRONG_STYLE}">Transparência editorial:</strong> alguns links publicados são links de afiliado. Quando uma compra acontece por meio deles, podemos receber uma comissão sem custo adicional para o leitor. Isso não altera o critério editorial do site.`,
    ),
    faqSection("Perguntas frequentes sobre o site", [
      {
        question: "O Guia Parques Aquáticos vende ingresso diretamente?",
        answer:
          "Não. O site funciona como guia editorial e pode encaminhar o leitor para parceiros ou canais com link de afiliado quando fizer sentido.",
      },
      {
        question: "O foco do site é só a Aldeia das Águas?",
        answer:
          "Neste momento ela é o principal polo de cobertura, mas o projeto já inclui guias regionais e pode ampliar a cobertura para outros parques.",
      },
      {
        question: "Como reportar uma informação desatualizada?",
        answer:
          "A forma mais direta é usar a página de contato. Correções editoriais entram na fila de revisão com prioridade.",
      },
    ]),
  ].join(""),
);

function buildContactContent(shortcode: string): string {
  return wrap(
    [
      hero(
        "Contato",
        "Fale com a equipe",
        "Use esta página para correções editoriais, sugestões de pauta, dúvidas sobre o site e pedidos ligados à privacidade. O retorno costuma acontecer em até 48 horas úteis.",
      ),
      card(
        "Canal correto",
        "Quando vale usar este formulário",
        [
          `<p style="${P_STYLE}">Esta página existe para assuntos editoriais e operacionais do site. Para dúvidas sobre reserva, cancelamento, ingresso ou atendimento ao visitante, o caminho correto continua sendo o canal oficial do parque ou resort.</p>`,
          bulletList([
            `<strong style="${STRONG_STYLE}">Correção de conteúdo:</strong> preço, horário, rota, política ou informação desatualizada`,
            `<strong style="${STRONG_STYLE}">Sugestão editorial:</strong> tema, parque, atração ou dúvida recorrente que mereça um guia novo`,
            `<strong style="${STRONG_STYLE}">Privacidade:</strong> solicitações ligadas a dados enviados pelo usuário`,
            `<strong style="${STRONG_STYLE}">Parceria editorial:</strong> propostas coerentes com o escopo do site`,
          ]),
        ].join(""),
      ),
      ctaCard(
        "Antes de enviar",
        "Veja se a resposta já está publicada",
        "Muitas dúvidas práticas sobre visita, ingresso, horário e atrações já estão organizadas dentro do guia principal da Aldeia das Águas. Vale checar antes para ganhar tempo.",
        [button("Abrir guia principal", "/aldeia-das-aguas/"), button("Ver horário", "/aldeia-das-aguas-horario/", "secondary")],
      ),
      card(
        "Formulário",
        "Envie sua mensagem",
        contactFormShell(shortcode),
      ),
      card(
        "Checklist",
        "Como mandar uma solicitação que ajuda mais",
        [
          bulletList([
            `Inclua a <strong style="${STRONG_STYLE}">URL exata</strong> da página quando estiver reportando um erro`,
            `Se a mudança for de preço, horário ou regra, diga <strong style="${STRONG_STYLE}">qual informação mudou</strong>`,
            `Se existir fonte oficial, informe o <strong style="${STRONG_STYLE}">canal usado na confirmação</strong>`,
            `Para mensagens gerais, descreva a dúvida com o máximo de contexto prático possível`,
          ]),
          `<p style="${P_STYLE}">Esse formato acelera a revisão e ajuda a equipe a responder de forma mais útil.</p>`,
        ].join(""),
      ),
      faqSection("Perguntas frequentes sobre contato", [
        {
          question: "Posso tirar dúvida sobre reserva ou ingresso por aqui?",
          answer:
            "Não é o melhor canal. Para esse tipo de assunto, o ideal é falar com o parque, resort ou parceiro responsável pela venda final.",
        },
        {
          question: "Quanto tempo leva para responder?",
          answer:
            "Em geral, a equipe responde em até 48 horas úteis, com prioridade para correções editoriais e pedidos ligados à privacidade.",
        },
        {
          question: "Vocês aceitam sugestão de novos temas?",
          answer:
            "Sim. Sugestões de pauta ajudam bastante, principalmente quando apontam uma dúvida recorrente que ainda não tem guia próprio.",
        },
      ]),
    ].join(""),
  );
}

const privacyContent = wrap(
  [
    hero(
      "Privacidade",
      "Política de Privacidade",
      "Esta política resume como o site trata dados técnicos, cookies, formulário de contato e links de afiliado, com foco em clareza e leitura objetiva.",
    ),
    card(
      "Resumo rápido",
      "Como esta política deve ser lida",
      [
        `<p style="${P_STYLE}">Assim como os posts do site, esta página foi organizada para facilitar a decisão. Em vez de texto jurídico longo sem direção, a leitura foi separada por blocos: coleta, cookies, terceiros, afiliação e direitos do usuário.</p>`,
      ].join(""),
    ),
    card(
      "Coleta",
      "Quais dados podem ser tratados",
      [
        `<p style="${P_STYLE}">O site pode registrar dados técnicos básicos e anônimos, como páginas acessadas, origem do acesso, tipo de navegador e tempo de sessão, sempre com o objetivo de entender o uso e melhorar a navegação.</p>`,
        `<p style="${P_STYLE}">Informações pessoais identificáveis só entram em cena quando o próprio usuário envia dados de forma voluntária, como no formulário de contato.</p>`,
      ].join(""),
    ),
    card(
      "Cookies",
      "Como os cookies entram nessa experiência",
      [
        `<p style="${P_STYLE}">Cookies podem ser usados para funcionamento técnico, medição agregada e análise de desempenho. O usuário pode limitar ou desativar cookies nas configurações do navegador, sabendo que algumas funções podem perder conveniência.</p>`,
      ].join(""),
    ),
    card(
      "Ferramentas externas",
      "Serviços de terceiros usados pelo site",
      [
        bulletList([
          `<strong style="${STRONG_STYLE}">Google Analytics:</strong> leitura agregada de comportamento e desempenho`,
          `<strong style="${STRONG_STYLE}">Google Search Console:</strong> acompanhamento de visibilidade orgânica`,
          `<strong style="${STRONG_STYLE}">Contact Form 7:</strong> envio e processamento do formulário de contato`,
          `<strong style="${STRONG_STYLE}">Plugins de cache e SEO:</strong> desempenho, indexação e estabilidade do site`,
        ]),
        `<p style="${P_STYLE}">Cada fornecedor trata dados segundo a própria política. Quando isso importar para o usuário, vale consultar também a documentação oficial do provedor.</p>`,
      ].join(""),
    ),
    notice(
      `<strong style="${STRONG_STYLE}">Afiliação:</strong> alguns links podem gerar comissão para o site, sem custo adicional para o usuário. Isso não altera a independência editorial do conteúdo.`,
    ),
    faqSection("Perguntas frequentes sobre privacidade", [
      {
        question: "O site coleta meus dados pessoais automaticamente?",
        answer:
          "Não de forma identificável. Dados pessoais só aparecem quando o usuário envia informações voluntariamente, como no formulário de contato.",
      },
      {
        question: "Posso pedir exclusão de dados enviados por formulário?",
        answer:
          "Sim. O caminho recomendado é usar a página de contato e informar o pedido com o máximo de contexto possível.",
      },
      {
        question: "Links de afiliado significam publicidade disfarçada?",
        answer:
          "Não. Eles são identificados como monetização, mas o critério editorial do site continua independente.",
      },
    ]),
  ].join(""),
);

const termsContent = wrap(
  [
    hero(
      "Termos de uso",
      "Regras para uso do site",
      "Esta página traduz o que o leitor precisa saber antes de usar o conteúdo como apoio para planejar uma visita, comprar ingresso ou comparar opções de viagem.",
    ),
    card(
      "Leitura prática",
      "Como interpretar estes termos",
      [
        `<p style="${P_STYLE}">Os termos seguem o mesmo conceito dos posts: organização por decisão. Em vez de um bloco único, a leitura foi dividida em finalidade, responsabilidade do usuário, afiliação e propriedade intelectual.</p>`,
      ].join(""),
    ),
    card(
      "Finalidade",
      "Para que serve este site",
      [
        `<p style="${P_STYLE}">O Guia Parques Aquáticos publica conteúdo informativo e editorial sobre parques aquáticos, resorts, hospedagem e planejamento de viagem no Brasil. O objetivo é ajudar o visitante a tomar decisões melhores antes da compra e antes do deslocamento.</p>`,
        `<p style="${P_STYLE}">Como preço, horário, atrações e políticas podem mudar, o site não garante que todos os dados permaneçam idênticos no instante da leitura.</p>`,
      ].join(""),
    ),
    ctaCard(
      "Checklist",
      "O que sempre vale confirmar antes da compra",
      "Se a visita sair da etapa de pesquisa e entrar na etapa de decisão, a checagem final precisa acontecer no fornecedor oficial.",
      [
        button("Ver guia principal", "/aldeia-das-aguas/"),
        button("Ir para contato", "/contato/", "secondary"),
      ],
    ),
    card(
      "Responsabilidade",
      "O que cabe ao usuário confirmar",
      [
        bulletList([
          `Preços e disponibilidade de ingresso`,
          `Horários de funcionamento conforme data e temporada`,
          `Políticas de cancelamento, remarcar ou reembolso`,
          `Restrições de idade, altura ou saúde para atrações específicas`,
          `Condições de hospedagem, pacote e regras do parceiro final`,
        ]),
        `<p style="${P_STYLE}">O conteúdo do site ajuda na decisão, mas não substitui a validação final no canal oficial do parque, resort ou vendedor responsável.</p>`,
      ].join(""),
    ),
    card(
      "Monetização",
      "Afiliação e independência editorial",
      [
        `<p style="${P_STYLE}">Alguns links podem ser monetizados por programas de afiliação. Quando uma compra ou ação qualificada acontece por esses links, o site pode receber uma comissão sem custo adicional para o usuário.</p>`,
        `<p style="${P_STYLE}">Essa relação comercial não representa endosso irrestrito nem substitui a análise editorial. O objetivo continua sendo organizar a informação de forma útil para o leitor.</p>`,
      ].join(""),
    ),
    card(
      "Conteúdo",
      "Propriedade intelectual",
      [
        `<p style="${P_STYLE}">Os textos, a estrutura editorial e a organização do conteúdo pertencem ao site. Reprodução parcial ou integral sem autorização expressa não é permitida.</p>`,
      ].join(""),
    ),
    faqSection("Perguntas frequentes sobre os termos", [
      {
        question: "Posso usar o site como única fonte antes de comprar?",
        answer:
          "Não é o ideal. O site serve como guia de apoio, mas a validação final deve acontecer no canal oficial do fornecedor.",
      },
      {
        question: "Os links de afiliado aumentam o preço para o usuário?",
        answer:
          "Não. A comissão, quando existe, não adiciona custo extra para o leitor.",
      },
      {
        question: "Como tirar dúvida sobre estes termos?",
        answer:
          "A página de contato é o canal indicado para isso, inclusive para pedidos ligados à privacidade e ao uso de dados.",
      },
    ]),
  ].join(""),
);

export const ABOUT_POST: InstitutionalPost = {
  title: "Sobre",
  slug: "sobre",
  excerpt:
    "Entenda a proposta editorial do Guia Parques Aquáticos, como os guias são organizados e como funciona nossa transparência com links de afiliado.",
  metaTitle: "Sobre o Guia Parques Aquáticos: Proposta e Editorial",
  metaDescription:
    "Conheça o Guia Parques Aquáticos, o foco atual da cobertura e como o site organiza seus guias sobre a Aldeia das Águas e outros destinos.",
  focusKeyword: "sobre guia parques aquaticos",
  content: aboutContent,
};

export const CONTACT_POST = (shortcode: string): InstitutionalPost => ({
  title: "Contato",
  slug: "contato",
  excerpt:
    "Fale com a equipe do Guia Parques Aquáticos para correções editoriais, sugestões de conteúdo, privacidade ou parcerias editoriais.",
  metaTitle: "Contato | Guia Parques Aquáticos",
  metaDescription:
    "Entre em contato com a equipe do Guia Parques Aquáticos para correções, sugestões de pauta, dúvidas sobre o site e solicitações ligadas à privacidade.",
  focusKeyword: "contato guia parques aquaticos",
  content: buildContactContent(shortcode),
});

export const PRIVACY_POST: InstitutionalPost = {
  title: "Política de Privacidade",
  slug: "politica-de-privacidade",
  excerpt:
    "Entenda como o Guia Parques Aquáticos trata cookies, analytics, formulário de contato e links de afiliado.",
  metaTitle: "Política de Privacidade | Guia Parques Aquáticos",
  metaDescription:
    "Saiba como o Guia Parques Aquáticos trata dados, cookies, ferramentas de terceiros e links de afiliado de forma clara e objetiva.",
  focusKeyword: "politica de privacidade guia parques aquaticos",
  content: privacyContent,
};

export const TERMS_POST: InstitutionalPost = {
  title: "Termos de Uso",
  slug: "termos-de-uso",
  excerpt:
    "Leia as regras gerais de uso, responsabilidade do usuário, independência editorial e afiliação do Guia Parques Aquáticos.",
  metaTitle: "Termos de Uso | Guia Parques Aquáticos",
  metaDescription:
    "Leia os termos de uso do Guia Parques Aquáticos: finalidade do conteúdo, responsabilidade do usuário e política de afiliação.",
  focusKeyword: "termos de uso guia parques aquaticos",
  content: termsContent,
};

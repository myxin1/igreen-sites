export interface InstitutionalPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
}

const SITE_NAME = "Guia Parques Aquaticos";

export const ABOUT_POST: InstitutionalPost = {
  title: "Sobre",
  slug: "sobre",
  excerpt:
    "Entenda a proposta do Guia Parques Aquaticos e como o site organiza guias sobre parques, ingressos e hospedagem.",
  metaTitle: "Sobre o Guia Parques Aquaticos: Proposta e Equipe",
  metaDescription:
    "Conheca o Guia Parques Aquaticos: quem somos, como produzimos os guias e por que nossas recomendacoes sobre a Aldeia das Aguas sao confiáveis.",
  focusKeyword: "sobre guia parques aquaticos",
  content: `<h1>Sobre o Guia Parques Aquaticos</h1>
<p>O ${SITE_NAME} e um portal editorial independente criado por pessoas que viajam para parques aquaticos e querem ajudar outros visitantes a planejar melhor. Nos pesquisamos, comparamos e organizamos informacoes sobre ingressos, precos, hospedagem e planejamento de visita para que voce chegue preparado.</p>
<h2>O que fazemos</h2>
<p>Produzimos guias detalhados com foco em decisao pratica: quanto custa, como comprar, quando ir, onde ficar e o que esperar. Cada artigo e revisado para garantir que as informacoes sejam uteis e atualizadas.</p>
<p>Hoje, o principal conjunto de guias esta concentrado na <a href="/aldeia-das-aguas/">Aldeia das Aguas Park Resort</a> em Barra do Pirai (RJ), cobrindo preco, ingresso, desconto, day use, hospedagem, localizacao e planejamento da visita. Tambem publicamos comparativos regionais de parques aquaticos no Brasil.</p>
<h2>Transparencia editorial</h2>
<p>Alguns links publicados podem ser links de afiliado, o que significa que podemos receber uma comissao quando voce compra por meio deles, sem custo adicional para voce. Isso nao influencia nossa avaliacao dos destinos — priorizamos sempre a utilidade da informacao para o visitante.</p>
<p>Quando informacoes como precos ou horarios podem ter mudado, indicamos isso e recomendamos confirmar diretamente no canal oficial antes de concluir qualquer compra ou planejamento.</p>
<h2>Fale com a gente</h2>
<p>Tem duvida, encontrou informacao desatualizada ou quer sugerir um tema? Use nossa pagina de <a href="/contato/">contato</a>. Para entender nossas regras de uso e privacidade, consulte a <a href="/politica-de-privacidade/">politica de privacidade</a> e os <a href="/termos-de-uso/">termos de uso</a>.</p>`,
};

export const PRIVACY_POST: InstitutionalPost = {
  title: "Politica de Privacidade",
  slug: "politica-de-privacidade",
  excerpt:
    "Leia como o Guia Parques Aquaticos trata dados, cookies, analytics e links de afiliado.",
  metaTitle: "Politica de Privacidade | Guia Parques Aquaticos",
  metaDescription:
    "Entenda como tratamos dados, cookies, analytics e links de afiliado no Guia Parques Aquaticos.",
  focusKeyword: "politica de privacidade guia parques aquaticos",
  content: `<h1>Politica de Privacidade</h1>
<p>Esta politica descreve como o Guia Parques Aquaticos coleta, utiliza e protege informacoes dos visitantes.</p>
<h2>Coleta de dados</h2>
<p>Podemos coletar dados tecnicos basicos, como endereco IP, navegador, paginas acessadas e origem do acesso, especialmente por meio de ferramentas de analytics e plugins integrados ao WordPress.</p>
<h2>Cookies</h2>
<p>O site pode usar cookies para melhorar a experiencia de navegacao, medir desempenho e entender o comportamento agregado dos usuarios.</p>
<h2>Links de afiliado</h2>
<p>Alguns links publicados podem gerar comissao quando uma compra ou acao qualificada acontece. Isso nao altera o preco pago pelo usuario, mas influencia nossa monetizacao editorial.</p>
<h2>Ferramentas de terceiros</h2>
<p>O site pode utilizar ferramentas como Google Analytics, Google Search Console, plugins de cache, SEO e formulários de contato. Cada ferramenta pode aplicar suas proprias regras de tratamento de dados.</p>
<h2>Contato</h2>
<p>Se voce quiser solicitar informacoes sobre privacidade, utilize nosso canal em <a href="/contato/">contato</a>.</p>`,
};

export const TERMS_POST: InstitutionalPost = {
  title: "Termos de Uso",
  slug: "termos-de-uso",
  excerpt:
    "Consulte as regras gerais de uso, responsabilidade editorial e uso de links comerciais do Guia Parques Aquaticos.",
  metaTitle: "Termos de Uso | Guia Parques Aquaticos",
  metaDescription:
    "Leia os termos de uso do Guia Parques Aquaticos, incluindo responsabilidade editorial, conteudo informativo e links comerciais.",
  focusKeyword: "termos de uso guia parques aquaticos",
  content: `<h1>Termos de Uso</h1>
<p>Ao acessar o Guia Parques Aquaticos, voce concorda com estes termos gerais de uso.</p>
<h2>Finalidade do conteudo</h2>
<p>O site publica conteudo informativo e comercial com foco em parques aquaticos, hospedagem, planejamento de viagem e ofertas relacionadas. As informacoes podem mudar ao longo do tempo.</p>
<h2>Responsabilidade do usuario</h2>
<p>Antes de concluir qualquer compra, reserva ou deslocamento, o usuario deve confirmar detalhes diretamente com o fornecedor final, incluindo disponibilidade, regras, horario, precos e politicas de cancelamento.</p>
<h2>Afiliacao e publicidade</h2>
<p>Alguns links podem ser monetizados por programas de afiliados. Sempre que isso acontecer, o site pode receber comissao por indicacoes qualificadas.</p>
<h2>Limitacao</h2>
<p>O conteudo e oferecido como referencia editorial. Nao garantimos que informacoes sensiveis permaneçam inalteradas entre a leitura e a acao do usuario.</p>
<h2>Contato</h2>
<p>Se houver qualquer duvida, use nossa pagina de <a href="/contato/">contato</a>.</p>`,
};

export const CONTACT_POST = (shortcode: string): InstitutionalPost => ({
  title: "Contato",
  slug: "contato",
  excerpt:
    "Fale com a equipe do Guia Parques Aquaticos para parcerias, duvidas editoriais e contato geral.",
  metaTitle: "Contato | Guia Parques Aquaticos",
  metaDescription:
    "Entre em contato com a equipe do Guia Parques Aquaticos por meio do formulario oficial do site.",
  focusKeyword: "contato guia parques aquaticos",
  content: `<h1>Contato</h1><p>Use o formulario abaixo para falar com a equipe do Guia Parques Aquaticos.</p>${shortcode}`,
});

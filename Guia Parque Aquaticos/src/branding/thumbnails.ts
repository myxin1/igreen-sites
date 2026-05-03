export interface ThumbnailDefinition {
  key: string;
  filename: string;
  slug: string;
  altText: string;
  prompt: string;
}

export const THUMBNAIL_OUTPUT_DIR = "output/thumbnails";

const STYLE_SUFFIX =
  "Style: vibrant editorial travel photography, bright tropical mood, sharp focus. " +
  "Color palette: deep teal water, turquoise pools, warm golden sunlight, lush green. " +
  "Square 1:1 composition, cinematic framing. " +
  "No text, no watermarks, no logos. Photo-realistic, no illustration.";

export const THUMBNAIL_DEFINITIONS: ThumbnailDefinition[] = [
  {
    key: "aldeia-das-aguas",
    filename: "thumb-aldeia-das-aguas.png",
    slug: "thumb-aldeia-das-aguas",
    altText: "Aldeia das Aguas Park Resort - piscinas e tobogans no parque aquatico de Barra do Pirai RJ",
    prompt: `Wide aerial view of a luxury water park resort in tropical Brazil with pools, colorful water slides, palm trees and lush green vegetation. ${STYLE_SUFFIX}`,
  },
  {
    key: "parques-aquaticos-rj",
    filename: "thumb-parques-aquaticos-rj.png",
    slug: "thumb-parques-aquaticos-rj",
    altText: "Parques aquaticos no Rio de Janeiro - guia dos melhores parques aquaticos RJ",
    prompt: `Aerial photo of a large water park surrounded by tropical Atlantic forest in Rio de Janeiro state, Brazil, distant hills in the background, families enjoying pools and slides. ${STYLE_SUFFIX}`,
  },
  {
    key: "melhores-parques-aquaticos-brasil",
    filename: "thumb-melhores-parques.png",
    slug: "thumb-melhores-parques",
    altText: "Melhores parques aquaticos do Brasil - ranking e guia completo atualizado",
    prompt: `Vibrant overhead shot of interconnected pools and water slides at a premier Brazilian water park resort, clear blue water, families playing, summer atmosphere. ${STYLE_SUFFIX}`,
  },
  {
    key: "o-que-fazer-barra-do-pirai",
    filename: "thumb-barra-do-pirai.png",
    slug: "thumb-barra-do-pirai",
    altText: "O que fazer em Barra do Pirai RJ - turismo e atracoes da cidade",
    prompt: `Scenic panoramic view of the charming city of Barra do Pirai in Rio de Janeiro state Brazil, colonial architecture, Paraiba do Sul river, green hills in the background, sunny day. ${STYLE_SUFFIX}`,
  },
  {
    key: "preco",
    filename: "thumb-preco.png",
    slug: "thumb-preco-aldeia",
    altText: "Aldeia das Aguas preco de ingresso - tabela de valores e quanto custa",
    prompt: `Close-up of colorful water park admission wristbands and tickets on white surface, blurred pool and slides in background, warm sunlight. ${STYLE_SUFFIX}`,
  },
  {
    key: "ingresso",
    filename: "thumb-ingresso.png",
    slug: "thumb-ingresso-aldeia",
    altText: "Ingresso Aldeia das Aguas - como comprar e preco atualizado",
    prompt: `Smiling Brazilian family arriving at the entrance gates of a vibrant water park resort, holding tickets at the turnstile, colorful park signage and pool in background. ${STYLE_SUFFIX}`,
  },
  {
    key: "desconto",
    filename: "thumb-desconto.png",
    slug: "thumb-desconto-aldeia",
    altText: "Aldeia das Aguas desconto - cupons e promocoes para economizar na visita",
    prompt: `Smartphone showing a discount coupon app for a Brazilian water park, bright pool and slides visible in the blurred background, cheerful mood. ${STYLE_SUFFIX}`,
  },
  {
    key: "day-use",
    filename: "thumb-day-use.png",
    slug: "thumb-day-use-aldeia",
    altText: "Day use Aldeia das Aguas - passe diario com acesso as piscinas e tobogans",
    prompt: `Happy Brazilian family splashing in a crystal-clear tropical resort pool, water slides and palm trees in background, bright midday summer sun. ${STYLE_SUFFIX}`,
  },
  {
    key: "pacote",
    filename: "thumb-pacote.png",
    slug: "thumb-pacote-aldeia",
    altText: "Pacote Aldeia das Aguas - hospedagem e parque aquatico com tudo incluso",
    prompt: `Elegant resort hotel room at a Brazilian water park resort with large windows overlooking a tropical pool, family-friendly, warm natural light. ${STYLE_SUFFIX}`,
  },
  // Lodging
  {
    key: "hotel",
    filename: "thumb-hotel.png",
    slug: "thumb-hotel-aldeia",
    altText: "Hotel Aldeia das Aguas - hospedagem no resort com parque aquatico",
    prompt: `Aerial view of a luxury tropical resort hotel with swimming pools, water slides and bungalows surrounded by Atlantic forest in Brazil, sunset light. ${STYLE_SUFFIX}`,
  },
  {
    key: "onde-ficar",
    filename: "thumb-onde-ficar.png",
    slug: "thumb-onde-ficar-aldeia",
    altText: "Onde ficar em Aldeia das Aguas - melhores opcoes de hospedagem",
    prompt: `Comfortable Brazilian resort accommodation with tropical garden view, hammock, pool visible through large glass doors, relaxed vacation atmosphere. ${STYLE_SUFFIX}`,
  },
  {
    key: "airbnb",
    filename: "thumb-airbnb.png",
    slug: "thumb-airbnb-aldeia",
    altText: "Airbnb Aldeia das Aguas - casas e apartamentos proximos ao parque",
    prompt: `Charming vacation rental house with private pool near a tropical water park in Brazil, modern interior, lush garden, sunny day. ${STYLE_SUFFIX}`,
  },
  // Informational
  {
    key: "onde-fica",
    filename: "thumb-onde-fica.png",
    slug: "thumb-onde-fica-aldeia",
    altText: "Onde fica Aldeia das Aguas - localizacao do parque em Barra do Pirai RJ",
    prompt: `Scenic map view of the Brazilian inland region of Rio de Janeiro state showing Barra do Pirai city beside the Paraiba do Sul river, green hills, aerial perspective. ${STYLE_SUFFIX}`,
  },
  {
    key: "como-chegar",
    filename: "thumb-como-chegar.png",
    slug: "thumb-como-chegar-aldeia",
    altText: "Como chegar na Aldeia das Aguas - guia de rotas e transporte",
    prompt: `Car driving on a scenic Brazilian highway surrounded by green tropical hills leading toward a resort, bright clear day, open road perspective. ${STYLE_SUFFIX}`,
  },
  {
    key: "endereco",
    filename: "thumb-endereco.png",
    slug: "thumb-endereco-aldeia",
    altText: "Endereco Aldeia das Aguas - rua e como encontrar o parque",
    prompt: `Entrance gate of a Brazilian water park resort with welcoming tropical landscaping, palm trees and clear blue sky, warm golden hour light. ${STYLE_SUFFIX}`,
  },
  {
    key: "telefone",
    filename: "thumb-telefone.png",
    slug: "thumb-telefone-aldeia",
    altText: "Telefone Aldeia das Aguas - contatos e como falar com o parque",
    prompt: `Person holding a smartphone near a tropical pool, making a reservation call, blurred water park background with colorful slides. ${STYLE_SUFFIX}`,
  },
  {
    key: "atracoes",
    filename: "thumb-atracoes.png",
    slug: "thumb-atracoes-aldeia",
    altText: "Atracoes da Aldeia das Aguas - tobogans piscinas e atividades do parque",
    prompt: `Vibrant collage perspective of water park attractions: tall twisting colorful slides, wave pool with people, lazy river, tropical palms and bright blue sky. ${STYLE_SUFFIX}`,
  },
  {
    key: "horario",
    filename: "thumb-horario.png",
    slug: "thumb-horario-aldeia",
    altText: "Aldeia das Aguas horario de funcionamento - dias e horas de abertura",
    prompt: `Water park entrance clock showing opening time, bright morning light over tropical pools and slides, families arriving for a fun day. ${STYLE_SUFFIX}`,
  },
  // SEO cluster
  {
    key: "vale-a-pena",
    filename: "thumb-vale-a-pena.png",
    slug: "thumb-vale-a-pena-aldeia",
    altText: "Aldeia das Aguas vale a pena - review honesto e opiniao de visitantes",
    prompt: `Happy Brazilian family on a water slide at a tropical resort, genuine smiles and joy, capturing a memorable vacation moment, dynamic action shot. ${STYLE_SUFFIX}`,
  },
  {
    key: "dicas",
    filename: "thumb-dicas.png",
    slug: "thumb-dicas-aldeia",
    altText: "Dicas Aldeia das Aguas - o que levar e como aproveitar melhor o parque",
    prompt: `Top-view flat-lay of beach bag essentials: sunscreen, sunglasses, flip-flops, towel, and snacks next to a tropical pool, vacation planning mood. ${STYLE_SUFFIX}`,
  },
  {
    key: "melhor-dia",
    filename: "thumb-melhor-dia.png",
    slug: "thumb-melhor-dia-aldeia",
    altText: "Melhor dia para ir na Aldeia das Aguas - quando visitar com menos fila",
    prompt: `Quiet morning at a tropical Brazilian water park, calm pools, very few visitors, early golden sunlight filtering through palm trees, peaceful atmosphere. ${STYLE_SUFFIX}`,
  },
  {
    key: "familia",
    filename: "thumb-familia.png",
    slug: "thumb-familia-aldeia",
    altText: "Aldeia das Aguas com criancas - parque aquatico ideal para a familia",
    prompt: `Brazilian family with children having fun at a water park, kids on small slides and splash pads, parents watching and smiling, tropical setting. ${STYLE_SUFFIX}`,
  },
  {
    key: "opiniao",
    filename: "thumb-opiniao.png",
    slug: "thumb-opiniao-aldeia",
    altText: "Aldeia das Aguas opiniao - avaliacao e review completo do parque",
    prompt: `Person writing a review on a smartphone at a tropical resort, pool and water slides visible in background, satisfied expression, reviewing a great experience. ${STYLE_SUFFIX}`,
  },
  // Top-funnel new
  {
    key: "parques-aquaticos-sp",
    filename: "thumb-parques-sp.png",
    slug: "thumb-parques-aquaticos-sp",
    altText: "Parques aquaticos SP - melhores parques aquaticos de Sao Paulo",
    prompt: `Aerial view of a large modern water park in Sao Paulo state Brazil, themed zones, tall slides, wave pools and thousands of visitors enjoying a hot summer day. ${STYLE_SUFFIX}`,
  },
  {
    key: "parques-aquaticos-sc",
    filename: "thumb-parques-sc.png",
    slug: "thumb-parques-aquaticos-sc",
    altText: "Parques aquaticos Santa Catarina - melhores parques de SC",
    prompt: `Beautiful coastal water park in Santa Catarina southern Brazil, scenic backdrop of Atlantic forest and blue sky, vibrant pools and slides, summer crowds. ${STYLE_SUFFIX}`,
  },
  {
    key: "parques-aquaticos-nordeste",
    filename: "thumb-parques-nordeste.png",
    slug: "thumb-parques-aquaticos-nordeste",
    altText: "Parques aquaticos nordeste - melhores parques aquaticos do nordeste brasileiro",
    prompt: `Vibrant water park under the blazing northeastern Brazil sun, turquoise pools against white sand dunes or arid tropical landscape, festive colorful atmosphere. ${STYLE_SUFFIX}`,
  },
];

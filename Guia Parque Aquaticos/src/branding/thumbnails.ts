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
];

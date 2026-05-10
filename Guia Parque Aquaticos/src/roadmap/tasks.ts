export const ROADMAP_TASKS = [
  "conexao wordpress",
  "instalacao plugins",
  "criacao pagina pai",
  "criacao paginas filhas",
  "interlinking SEO",
  "insercao afiliado",
  "configuracao rankmath",
  "validacao SEO",
  "migracao pages para posts",
  "categorias do silo",
  "menus header e rodape",
  "institucional em pages",
  "widget sidebar do silo",
  "ajustes home e sidebar",
  "busca no header",
  "refino editorial dos artigos",
  "logo do site",
] as const;

export type RoadmapTask = (typeof ROADMAP_TASKS)[number];

export interface WordPressRendered {
  rendered: string;
}

export interface WordPressPageRecord {
  id: number;
  slug: string;
  status: string;
  parent: number;
  link?: string;
  categories?: number[];
  title: WordPressRendered;
  content?: WordPressRendered;
  meta?: Record<string, unknown>;
}

export interface WordPressPlugin {
  plugin: string;
  name: string;
  status: "active" | "inactive";
}

export interface WordPressTheme {
  stylesheet: string;
  name: string;
  status?: "active" | "inactive";
}

export interface ContactFormRecord {
  id: number;
  title?: string;
  shortcode?: string;
}

export interface ApiRoot {
  routes?: Record<string, unknown>;
  authentication?: Record<string, unknown>;
}

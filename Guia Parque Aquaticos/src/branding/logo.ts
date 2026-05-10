import { SITE_NAME } from "../config/site.js";

export interface LogoDefinition {
  key: string;
  filename: string;
  size: "1024x1024" | "1536x1024";
  prompt: string;
}

export const LOGO_OUTPUT_DIR = "output/branding";

export const LOGO_DEFINITIONS: LogoDefinition[] = [
  {
    key: "primary",
    filename: "logo-primary.png",
    size: "1536x1024",
    prompt: [
      "Use case: logo-brand",
      "Asset type: website primary logo",
      `Primary request: create a premium, clean, tourism-focused logo for the Brazilian website "${SITE_NAME}"`,
      'Text (verbatim): "Guia Parques Aquaticos"',
      "Style/medium: flat vector-like brand mark, crisp edges, modern editorial travel identity",
      "Subject: a refined combination of wave, sun, water splash, and subtle park leisure cue such as a float ring",
      "Composition/framing: horizontal logo lockup with icon on the left and text on the right",
      "Lighting/mood: bright, fresh, trustworthy, family-friendly but not childish",
      "Color palette: deep teal, aqua, warm sun-gold, small coral accent",
      "Constraints: transparent background, no mockup, no paper texture, no 3D bevel, no watermark, no extra words, legible typography",
      "Avoid: gradients that look cheap, mascots, cartoon faces, clutter, long shadows, beach-only vibes",
    ].join("\n"),
  },
  {
    key: "icon",
    filename: "logo-icon.png",
    size: "1024x1024",
    prompt: [
      "Use case: logo-brand",
      "Asset type: website favicon and social avatar icon",
      `Primary request: create a standalone icon that matches the brand identity of "${SITE_NAME}"`,
      "Style/medium: flat vector-like symbol with crisp edges and simple geometry",
      "Subject: a circular mark that combines wave, sun, and splash in a memorable way",
      "Composition/framing: centered icon with generous padding",
      "Lighting/mood: clean, modern, editorial, energetic",
      "Color palette: deep teal, aqua, warm sun-gold",
      "Constraints: transparent background, no text, no watermark, no mockup, no drop shadow",
      "Avoid: mascots, photo realism, extra scenery, heavy outlines, noisy details",
    ].join("\n"),
  },
];

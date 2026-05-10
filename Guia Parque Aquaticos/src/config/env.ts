import { config as loadEnv } from "dotenv";

loadEnv();

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export const env = {
  wordpressUrl: requireEnv("WORDPRESS_URL").replace(/\/+$/, ""),
  wordpressUsername: requireEnv("WORDPRESS_USERNAME"),
  wordpressAppPassword: requireEnv("WORDPRESS_APP_PASSWORD"),
  openaiApiKey: process.env.OPENAI_API_KEY?.trim() ?? "",
  dryRun: parseBoolean(process.env.DRY_RUN, true),
};

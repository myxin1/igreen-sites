import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

type Query = Record<string, string | number | boolean | undefined>;

export interface RequestOptions {
  method?: "GET" | "POST" | "DELETE" | "OPTIONS";
  query?: Query;
  body?: unknown;
  expectedStatus?: number[];
}

function toQueryString(query?: Query): string {
  if (!query) {
    return "";
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }

    params.set(key, String(value));
  }

  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export class WordPressClient {
  private readonly authHeader: string;

  constructor() {
    this.authHeader = `Basic ${Buffer.from(
      `${env.wordpressUsername}:${env.wordpressAppPassword}`,
    ).toString("base64")}`;
  }

  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = `${env.wordpressUrl}/wp-json/${path.replace(/^\/+/, "")}${toQueryString(options.query)}`;
    const response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });

    const expectedStatus = options.expectedStatus ?? [200];
    if (!expectedStatus.includes(response.status)) {
      const errorBody = await response.text();
      throw new Error(
        `WordPress request failed (${response.status}) for ${path}: ${errorBody}`,
      );
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return (await response.text()) as T;
    }

    return (await response.json()) as T;
  }

  async maybeRequest<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
    try {
      return await this.request<T>(path, options);
    } catch (error) {
      logger.warn(
        `Request skipped for ${path}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }
}

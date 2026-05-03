import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export interface WPMedia {
  id: number;
  source_url: string;
  slug: string;
  alt_text: string;
}

function authHeader(): string {
  return `Basic ${Buffer.from(`${env.wordpressUsername}:${env.wordpressAppPassword}`).toString("base64")}`;
}

export async function uploadMedia(
  filePath: string,
  title: string,
  altText: string,
  mediaSlug?: string,
): Promise<WPMedia> {
  const fileBuffer = await readFile(filePath);
  const filename = basename(filePath);
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";

  const form = new FormData();
  form.append("file", new Blob([fileBuffer], { type: mimeType }), filename);
  form.append("title", title);
  form.append("alt_text", altText);
  if (mediaSlug) {
    form.append("slug", mediaSlug);
  }

  const response = await fetch(`${env.wordpressUrl}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
    body: form,
  });

  if (response.status !== 201) {
    const body = await response.text();
    throw new Error(`Upload de media falhou (${response.status}): ${body}`);
  }

  return (await response.json()) as WPMedia;
}

export async function findMediaBySlug(slug: string): Promise<WPMedia | null> {
  const response = await fetch(
    `${env.wordpressUrl}/wp-json/wp/v2/media?slug=${encodeURIComponent(slug)}&per_page=1`,
    { headers: { Authorization: authHeader() } },
  );

  if (!response.ok) {
    return null;
  }

  const items = (await response.json()) as WPMedia[];
  return items[0] ?? null;
}

export async function setSiteLogo(mediaId: number): Promise<void> {
  const response = await fetch(`${env.wordpressUrl}/wp-json/wp/v2/settings`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ site_logo: mediaId }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.warn(`Nao foi possivel definir logo via settings (${response.status}): ${body}`);
    return;
  }

  logger.info(`Logo do site configurada com media ID ${mediaId}.`);
}

export async function setFeaturedImage(postId: number, mediaId: number): Promise<void> {
  const response = await fetch(`${env.wordpressUrl}/wp-json/wp/v2/posts/${postId}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ featured_media: mediaId }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.warn(`Nao foi possivel definir featured image para post ${postId} (${response.status}): ${body}`);
    return;
  }

  logger.info(`Featured image ${mediaId} definida para post ${postId}.`);
}

export async function setStaticFrontPage(pageId: number): Promise<void> {
  const response = await fetch(`${env.wordpressUrl}/wp-json/wp/v2/settings`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ show_on_front: "page", page_on_front: pageId }),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.warn(`Nao foi possivel configurar front page (${response.status}): ${body}`);
    return;
  }

  logger.info(`Front page estatica configurada (ID ${pageId}).`);
}

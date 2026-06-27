import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export function uniqueFilename(originalName: string) {
  const ext = path.extname(originalName);
  return `${uuidv4()}${ext}`;
}

export function sanitizeFilename(name: string) {
  return name.replace(/[^a-z0-9.\-\_]/gi, "_");
}

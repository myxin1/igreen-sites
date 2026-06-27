import path from "path";

export const PORT = process.env.PORT || "4000";
export const STORAGE_PATH = process.env.STORAGE_PATH || path.resolve(process.cwd(), "storage");
export const REDIS_HOST = process.env.REDIS_HOST || "127.0.0.1";
export const REDIS_PORT = Number(process.env.REDIS_PORT || 6379);

export const FFMPEG_PATH = process.env.FFMPEG_PATH || "ffmpeg";
export const FFPROBE_PATH = process.env.FFPROBE_PATH || "ffprobe";

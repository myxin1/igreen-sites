import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { STORAGE_PATH, FFMPEG_PATH, FFPROBE_PATH } from "../config";
import type { Placeholder, SourceVideo, Template } from "@prisma/client";

ffmpeg.setFfmpegPath(FFMPEG_PATH);
ffmpeg.setFfprobePath(FFPROBE_PATH);

ensureFolder(path.join(STORAGE_PATH, 'renders'));

function ensureFolder(p: string) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

type TemplateWithPlaceholders = Template & { placeholders?: Placeholder[] };

interface RenderArgs {
  template: TemplateWithPlaceholders;
  sourceVideo: SourceVideo;
  durationMode?: 'template' | 'source';
}

export async function renderVideo(args: RenderArgs): Promise<string> {
  const { template, sourceVideo } = args;
  const outName = uuidv4() + '.mp4';
  const outPath = path.join(STORAGE_PATH, 'renders', outName);

  return new Promise((resolve, reject) => {
    const placeholder = (template.placeholders && template.placeholders[0]) || { x: 0, y: 0, width: template.outputWidth, height: template.outputHeight };

    const cropW = Math.round(placeholder.width);
    const cropH = Math.round(placeholder.height);
    const x = Math.round(placeholder.x);
    const y = Math.round(placeholder.y);

    // Build filter_complex: scale source to cover placeholder area (object-fit: cover)
    // We will scale maintaining aspect then crop center
    const filters: string[] = [];
    // [1:v] is source
    filters.push(`[1:v]scale=w=${cropW}:h=-1, crop=${cropW}:${cropH}, setsar=1 [sv];`);
    // overlay onto template [0:v]
    filters.push(`[0:v][sv]overlay=${x}:${y} [outv]`);

    ffmpeg()
      .input(template.videoPath)
      .input(sourceVideo.filePath)
      .complexFilter(filters.join(' '), ['outv'])
      .outputOptions([
        '-map [outv]',
        args.durationMode === 'template' ? '-shortest' : null,
        '-map 0:a?',
        '-c:v libx264',
        '-preset veryfast',
        '-crf 23',
        '-c:a aac',
        '-pix_fmt yuv420p'
      ].filter(Boolean) as string[])
      .on('start', (cmd: string) => console.log('FFMPEG START:', cmd))
      .on('error', (err: Error) => {
        console.error('FFMPEG ERROR', err.message);
        reject(err);
      })
      .on('end', () => {
        resolve(outPath);
      })
      .save(outPath);
  });
}

export async function generatePreview(template: any): Promise<string> {
  ensureFolder(path.join(STORAGE_PATH, 'previews'));
  const outName = uuidv4() + '.png';
  const outPath = path.join(STORAGE_PATH, 'previews', outName);

  // Use ffmpeg to extract a single frame from template video and render elements as overlays
  return new Promise((resolve, reject) => {
    ffmpeg(template.videoPath)
      .screenshots({ timestamps: ['50%'], filename: outName, folder: path.join(STORAGE_PATH, 'previews') })
      .on('end', () => resolve(outPath))
      .on('error', (err) => reject(err));
  });
}

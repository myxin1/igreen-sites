import archiver from "archiver";
import fs from "fs";
import path from "path";
import prisma from "../prisma";
import { STORAGE_PATH } from "../config";
import { v4 as uuidv4 } from "uuid";

export async function createZipForBatch(batchId: string): Promise<string> {
  const outDir = path.join(STORAGE_PATH, 'zips');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${batchId}-${uuidv4()}.zip`);
  const output = fs.createWriteStream(outPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise(async (resolve, reject) => {
    output.on('close', () => resolve(outPath));
    archive.on('error', err => reject(err));
    archive.pipe(output);

    const renders = await prisma.renderJob.findMany({ where: { batchId, status: 'completed' } });
    for (const r of renders) {
      if (r.outputPath && fs.existsSync(r.outputPath)) {
        archive.file(r.outputPath, { name: path.basename(r.outputPath) });
      }
    }

    archive.finalize();
  });
}

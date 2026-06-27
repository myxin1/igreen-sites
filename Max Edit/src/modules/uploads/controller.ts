import { Request, Response, NextFunction } from "express";
import prisma from "../../prisma";
import fs from "fs/promises";

export const uploadVideos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batchId = req.params.id;
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) return res.status(400).json({ error: "No files" });
    const batch = await prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) return res.status(404).json({ error: "Batch not found" });

    const created = [];
    for (const f of files) {
      const record = await prisma.sourceVideo.create({ data: {
        batchId,
        filePath: f.path,
        originalFilename: f.originalname,
        mimeType: f.mimetype,
        size: f.size
      }});
      created.push(record);
    }

    res.status(201).json({ created });
  } catch (err) { next(err); }
};

export const listVideos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batchId = req.params.id;
    const list = await prisma.sourceVideo.findMany({ where: { batchId } });
    res.json(list);
  } catch (err) { next(err); }
};

export const deleteVideo = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const v = await prisma.sourceVideo.findUnique({ where: { id } });
    if (!v) return res.status(404).json({ error: "Not found" });
    if (v.filePath) {
      try {
        await fs.unlink(v.filePath);
      } catch {
        // The database record is still removed if the file was already gone.
      }
    }
    await prisma.sourceVideo.delete({ where: { id } });
    res.status(204).send();
  } catch (err) { next(err); }
};

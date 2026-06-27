import { Request, Response, NextFunction } from "express";
import prisma from "../../prisma";
import { generatePreview } from "../../services/ffmpeg.service";

export const previewTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const tpl = await prisma.template.findUnique({ where: { id }, include: { elements: true, placeholders: true } });
    if (!tpl) return res.status(404).json({ error: 'Not found' });
    const pathImage = await generatePreview(tpl as any);
    res.sendFile(pathImage);
  } catch (err) { next(err); }
};

import { Request, Response, NextFunction } from "express";
import prisma from "../../prisma";
import { getRenderQueue } from "../../queues/render.queue";
import { createZipForBatch } from "../../services/zip.service";

export const startRender = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batchId = req.params.id;
    const { templateId } = req.body;
    const batch = await prisma.batch.findUnique({ where: { id: batchId }, include: { sourceVideos: true } });
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    if (!templateId) return res.status(400).json({ error: "templateId is required" });

    const template = await prisma.template.findUnique({ where: { id: templateId } });
    if (!template) return res.status(404).json({ error: "Template not found" });
    if (batch.sourceVideos.length === 0) return res.status(400).json({ error: "Batch has no source videos" });

    const renderQueue = getRenderQueue();
    const createdJobs = [];
    for (const src of batch.sourceVideos) {
      const jobRec = await prisma.renderJob.create({ data: {
        batchId,
        sourceVideoId: src.id,
        templateId,
        status: 'pending'
      }});

      await renderQueue.add("render-video", { renderJobId: jobRec.id });
      createdJobs.push(jobRec);
    }

    await prisma.batch.update({ where: { id: batchId }, data: { status: "processing" } });
    res.json({ created: createdJobs.length });
  } catch (err) { next(err); }
};

export const batchProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batchId = req.params.id;
    const jobs = await prisma.renderJob.findMany({ where: { batchId } });
    const summary = jobs.reduce<Record<string, number>>((acc, j) => {
      acc[j.status] = (acc[j.status] || 0) + 1;
      return acc;
    }, {});
    res.json({ total: jobs.length, summary, jobs });
  } catch (err) { next(err); }
};

export const downloadRender = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const r = await prisma.renderJob.findUnique({ where: { id } });
    if (!r || !r.outputPath) return res.status(404).json({ error: 'Not available' });
    res.download(r.outputPath);
  } catch (err) { next(err); }
};

export const downloadBatchZip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const batchId = req.params.id;
    const zipPath = await createZipForBatch(batchId);
    res.download(zipPath);
  } catch (err) { next(err); }
};

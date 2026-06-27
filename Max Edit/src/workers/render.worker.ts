import { Worker } from "bullmq";
import { renderVideo } from "../services/ffmpeg.service";
import prisma from "../prisma";
import { redisConnection } from "../queues/render.queue";

const worker = new Worker("render", async job => {
  const { renderJobId } = job.data as { renderJobId: string };
  const dbJob = await prisma.renderJob.findUnique({ where: { id: renderJobId } });
  if (!dbJob) throw new Error("Render job not found");

  await prisma.renderJob.update({ where: { id: renderJobId }, data: { status: "processing" } });

  try {
    const source = await prisma.sourceVideo.findUnique({ where: { id: dbJob.sourceVideoId } });
    const template = await prisma.template.findUnique({ where: { id: dbJob.templateId }, include: { placeholders: true, elements: true } });
    if (!source || !template) throw new Error("Source or template missing");

    const output = await renderVideo({ template, sourceVideo: source });

    await prisma.renderJob.update({ where: { id: renderJobId }, data: { status: "completed", outputPath: output, progress: 100 } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.renderJob.update({ where: { id: renderJobId }, data: { status: "failed", errorMessage: message } });
    throw err;
  }
}, { connection: redisConnection });

worker.on("completed", job => console.log("Job completed", job.id));
worker.on("failed", (job, err) => console.error("Job failed", job?.id, err));

export default worker;

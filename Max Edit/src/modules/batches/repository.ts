import prisma from "../../prisma";

export const createBatch = (data: any) => prisma.batch.create({ data });
export const listBatches = () => prisma.batch.findMany({ include: { sourceVideos: true, renderJobs: true } });
export const getBatch = (id: string) => prisma.batch.findUnique({ where: { id }, include: { sourceVideos: true, renderJobs: true } });

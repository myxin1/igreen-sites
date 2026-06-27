import prisma from "../../prisma";

export const createPlaceholder = (templateId: string, data: any) => {
  return prisma.placeholder.create({ data: { ...data, templateId } });
};

export const updatePlaceholder = (id: string, data: any) => prisma.placeholder.update({ where: { id }, data });
export const getByTemplate = (templateId: string) => prisma.placeholder.findMany({ where: { templateId } });

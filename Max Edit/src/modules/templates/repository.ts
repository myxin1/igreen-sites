import prisma from "../../prisma";

export const createTemplate = (data: any) => {
  return prisma.template.create({ data });
};

export const getTemplates = () => prisma.template.findMany();
export const getTemplateById = (id: string) => prisma.template.findUnique({ where: { id }, include: { placeholders: true, elements: true } });
export const updateTemplate = (id: string, data: any) => prisma.template.update({ where: { id }, data });
export const deleteTemplate = (id: string) => prisma.template.delete({ where: { id } });

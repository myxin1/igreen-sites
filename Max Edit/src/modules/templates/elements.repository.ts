import prisma from "../../prisma";

export const createElement = (templateId: string, data: any) => prisma.element.create({ data: { ...data, templateId } });
export const listElements = (templateId: string) => prisma.element.findMany({ where: { templateId }, orderBy: { zIndex: 'asc' } });
export const updateElement = (id: string, data: any) => prisma.element.update({ where: { id }, data });
export const deleteElement = (id: string) => prisma.element.delete({ where: { id } });

import * as repo from "./repository";
import { ensureDir, uniqueFilename } from "../../utils/file";
import path from "path";
import { STORAGE_PATH } from "../../config";
import fs from "fs";

const templatesPath = path.join(STORAGE_PATH, "templates");
ensureDir(templatesPath);

export const createTemplateService = async (data: any, file?: Express.Multer.File) => {
  if (file) {
    const filename = uniqueFilename(file.originalname);
    const dest = path.join(templatesPath, filename);
    fs.copyFileSync(file.path, dest);
    data.videoPath = dest;
  }
  data.outputWidth = data.outputWidth || 1080;
  data.outputHeight = data.outputHeight || 1920;
  data.durationMode = data.durationMode || "source";
  return repo.createTemplate(data);
};

export const listTemplates = () => repo.getTemplates();
export const getTemplate = (id: string) => repo.getTemplateById(id);
export const patchTemplate = (id: string, data: any) => repo.updateTemplate(id, data);
export const removeTemplate = async (id: string) => {
  const tpl = await repo.getTemplateById(id);
  if (tpl && tpl.videoPath && fs.existsSync(tpl.videoPath)) fs.unlinkSync(tpl.videoPath);
  return repo.deleteTemplate(id);
};

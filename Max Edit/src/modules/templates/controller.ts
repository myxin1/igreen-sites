import { Request, Response, NextFunction } from "express";
import * as service from "./service";

import { createTemplateSchema } from "../../validators/template.validator";

export const createTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Template video file is required" });
    }

    const data = createTemplateSchema.parse({
      ...req.body,
      outputWidth: req.body.outputWidth ? Number(req.body.outputWidth) : undefined,
      outputHeight: req.body.outputHeight ? Number(req.body.outputHeight) : undefined,
      durationMode: req.body.durationMode
    });
    const tpl = await service.createTemplateService(data, req.file as Express.Multer.File);
    res.status(201).json(tpl);
  } catch (err) {
    next(err);
  }
};

export const uploadTemplateFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required" });
    }

    res.json({ uploaded: true, file: req.file });
  } catch (err) { next(err); }
};

export const listTemplates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await service.listTemplates();
    res.json(list);
  } catch (err) { next(err); }
};

export const getTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tpl = await service.getTemplate(req.params.id);
    if (!tpl) return res.status(404).json({ error: "Not found" });
    res.json(tpl);
  } catch (err) { next(err); }
};

export const patchTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tpl = await service.patchTemplate(req.params.id, req.body);
    res.json(tpl);
  } catch (err) { next(err); }
};

export const deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.removeTemplate(req.params.id);
    res.status(204).send();
  } catch (err) { next(err); }
};

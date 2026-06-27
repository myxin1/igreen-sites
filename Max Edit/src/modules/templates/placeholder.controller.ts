import { Request, Response, NextFunction } from "express";
import * as repo from "./placeholder.repository";

export const createPlaceholder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const tplId = req.params.id;
    const ph = await repo.createPlaceholder(tplId, data);
    res.status(201).json(ph);
  } catch (err) { next(err); }
};

export const patchPlaceholder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.body.id;
    const updated = await repo.updatePlaceholder(id, req.body);
    res.json(updated);
  } catch (err) { next(err); }
};

export const getPlaceholders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tplId = req.params.id;
    const list = await repo.getByTemplate(tplId);
    res.json(list);
  } catch (err) { next(err); }
};

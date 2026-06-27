import { Request, Response, NextFunction } from "express";
import * as repo from "./elements.repository";

export const createElement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tplId = req.params.id;
    const el = await repo.createElement(tplId, req.body);
    res.status(201).json(el);
  } catch (err) { next(err); }
};

export const listElements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tplId = req.params.id;
    const list = await repo.listElements(tplId);
    res.json(list);
  } catch (err) { next(err); }
};

export const patchElement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const elId = req.params.elementId;
    const updated = await repo.updateElement(elId, req.body);
    res.json(updated);
  } catch (err) { next(err); }
};

export const deleteElement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const elId = req.params.elementId;
    await repo.deleteElement(elId);
    res.status(204).send();
  } catch (err) { next(err); }
};

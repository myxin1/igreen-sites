import { Request, Response, NextFunction } from "express";
import * as repo from "./repository";

import { createBatchSchema } from "../../validators/batch.validator";

export const createBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createBatchSchema.parse(req.body);
    const batch = await repo.createBatch(data);
    res.status(201).json(batch);
  } catch (err) { next(err); }
};

export const listBatches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const list = await repo.listBatches();
    res.json(list);
  } catch (err) { next(err); }
};

export const getBatch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const batch = await repo.getBatch(id);
    if (!batch) return res.status(404).json({ error: "Not found" });
    res.json(batch);
  } catch (err) { next(err); }
};

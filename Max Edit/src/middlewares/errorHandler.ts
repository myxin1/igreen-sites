import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation error", details: err.flatten() });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof Error) {
    const status = "status" in err && typeof err.status === "number" ? err.status : 500;
    return res.status(status).json({ error: err.message || "Internal Server Error" });
  }

  return res.status(500).json({ error: "Internal Server Error" });
}

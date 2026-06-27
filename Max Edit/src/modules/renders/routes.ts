import { Router } from "express";
import { startRender, batchProgress, downloadRender, downloadBatchZip } from "./controller";

const router = Router();
router.post("/:id/render", startRender);
router.get("/:id/progress", batchProgress);
router.get("/:id/download", downloadRender);
router.get("/batch/:id/download-zip", downloadBatchZip);

export default router;

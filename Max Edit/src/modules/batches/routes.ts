import { Router } from "express";
import { createBatch, listBatches, getBatch } from "./controller";
import { uploadVideos, listVideos } from "../uploads/controller";
import { startRender, batchProgress } from "../renders/controller";
import { downloadBatchZip } from "../renders/controller";
import { videoUpload } from "../../middlewares/upload";

const router = Router();
router.post("/", createBatch);
router.get("/", listBatches);
router.get("/:id", getBatch);
router.post("/:id/videos", videoUpload.array("videos", 1000), uploadVideos);
router.get("/:id/videos", listVideos);
router.post("/:id/render", startRender);
router.get("/:id/progress", batchProgress);
router.get("/:id/download-zip", downloadBatchZip);

export default router;

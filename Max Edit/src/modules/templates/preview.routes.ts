import { Router } from "express";
import { previewTemplate } from "./preview.controller";

const router = Router({ mergeParams: true });
router.post("/preview", previewTemplate);

export default router;

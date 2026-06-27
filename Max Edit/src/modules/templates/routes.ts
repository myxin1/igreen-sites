import { Router } from "express";
import { createTemplate, uploadTemplateFile, listTemplates, getTemplate, patchTemplate, deleteTemplate } from "./controller";
import placeholderRoutes from "./placeholder.routes";
import elementRoutes from "./elements.routes";
import { previewTemplate } from "./preview.controller";
import { templateUpload } from "../../middlewares/upload";

const router = Router();

router.post("/", templateUpload.single("video"), createTemplate);
router.post("/upload", templateUpload.single("file"), uploadTemplateFile);
router.get("/", listTemplates);
router.get("/:id", getTemplate);
router.patch("/:id", patchTemplate);
router.delete("/:id", deleteTemplate);

router.use("/:id/placeholder", placeholderRoutes);
router.use("/:id/elements", elementRoutes);
router.post("/:id/preview", previewTemplate);

export default router;

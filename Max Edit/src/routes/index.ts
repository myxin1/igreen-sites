import { Router } from "express";
import templatesRouter from "../modules/templates/routes";
import batchesRouter from "../modules/batches/routes";
import renderRouter from "../modules/renders/routes";
import videosRouter from "../modules/videos/routes";

const router = Router();
router.use("/templates", templatesRouter);
router.use("/batches", batchesRouter);
router.use("/renders", renderRouter);
router.use("/videos", videosRouter);

export default router;

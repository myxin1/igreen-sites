import { Router } from "express";
import { deleteVideo } from "../uploads/controller";

const router = Router();
router.delete("/:id", deleteVideo);
export default router;

import { Router } from "express";
import { uploadVideos, listVideos, deleteVideo } from "./controller";
import { videoUpload } from "../../middlewares/upload";

const router = Router();

router.post("/:id/videos", videoUpload.array("videos", 1000), uploadVideos);
router.get("/:id/videos", listVideos);
router.delete("/:id", deleteVideo);

export default router;

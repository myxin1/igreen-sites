import { Router } from "express";
import { createPlaceholder, patchPlaceholder, getPlaceholders } from "./placeholder.controller";

const router = Router({ mergeParams: true });
router.post("/", createPlaceholder);
router.patch("/", patchPlaceholder);
router.get("/", getPlaceholders);

export default router;

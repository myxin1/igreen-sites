import { Router } from "express";
import { createElement, listElements, patchElement, deleteElement } from "./elements.controller";

const router = Router({ mergeParams: true });
router.post("/", createElement);
router.get("/", listElements);
router.patch(":elementId", patchElement);
router.delete(":elementId", deleteElement);

export default router;

import multer from "multer";
import path from "path";
import { STORAGE_PATH } from "../config";
import { ensureDir, uniqueFilename } from "../utils/file";

const uploadPath = path.join(STORAGE_PATH, "uploads");
ensureDir(uploadPath);

const videoTypes = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm"
]);

const templateTypes = new Set([
  ...videoTypes,
  "image/png",
  "image/jpeg"
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (_req, file, cb) => cb(null, uniqueFilename(file.originalname))
});

export const templateUpload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!templateTypes.has(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  }
});

export const videoUpload = multer({
  storage,
  limits: { fileSize: 1024 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!videoTypes.has(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }
    cb(null, true);
  }
});

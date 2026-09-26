import { Router } from "express";

import { protect } from "../middleware/authMiddleware";
import multer from "multer";
import { uploadImage } from "../controllers/uploadController";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = Router();

router.post("/", protect, upload.single("image"), uploadImage);

export default router;

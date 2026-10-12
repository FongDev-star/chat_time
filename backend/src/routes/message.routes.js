import express from "express";
import { protectRoute, attachUser } from "../middleware/auth.middleware.js";
import { handleUpload } from "../middleware/upload.middleware.js";
import { sendMessage, uploadMedia } from "../controllers/message.controller.js";

const router = express.Router();

router.use(protectRoute, attachUser);

router.post("/upload", handleUpload, uploadMedia);
router.post("/", sendMessage);

export default router;
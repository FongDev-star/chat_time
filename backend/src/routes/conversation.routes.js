import express from "express";
import { protectRoute, attachUser } from "../middleware/auth.middleware.js";
import {
  createOrGetConversation,
  getMyConversations,
  getMessages,
  markAsRead,
} from "../controllers/conversation.controller.js";

const router = express.Router();

router.use(protectRoute, attachUser);

router.get("/", getMyConversations);
router.post("/", createOrGetConversation);
router.get("/:id/messages", getMessages);
router.patch("/:id/read", markAsRead);

export default router;
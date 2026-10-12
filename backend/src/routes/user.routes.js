import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMe, searchUsers } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", protectRoute, getMe);
router.get("/search", protectRoute, searchUsers);

export default router;
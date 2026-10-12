import { getAuth } from "@clerk/express";
import { User } from "../models/user.model.js";

export const protectRoute = (req, res, next) => {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.clerkId = userId;
  next();
};

export const attachUser = async (req, res, next) => {
  try {
    const user = await User.findOne({ clerkId: req.clerkId });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found. Call /api/users/me first." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("attachUser error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
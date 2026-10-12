import { clerkClient } from "@clerk/express";
import { User } from "../models/user.model.js";

export const getMe = async (req, res) => {
  try {
    const clerkId = req.clerkId;

    // Existing user: update lastSeen and return
    let user = await User.findOneAndUpdate(
      { clerkId },
      { lastSeen: new Date() },
      { returnDocument: "after" }
    );

    // First login: fetch details from Clerk and create the user
    if (!user) {
      const clerkUser = await clerkClient.users.getUser(clerkId);

      const email = clerkUser.emailAddresses.find(
        (e) => e.id === clerkUser.primaryEmailAddressId
      )?.emailAddress;

      const fullName = [clerkUser.firstName, clerkUser.lastName]
        .filter(Boolean)
        .join(" ");

      // upsert avoids duplicate users if two requests arrive at once
      user = await User.findOneAndUpdate(
        { clerkId },
        {
          $setOnInsert: {
            clerkId,
            email: email || `${clerkId}@no-email.local`,
            username: clerkUser.username || "",
            fullName,
            imageUrl: clerkUser.imageUrl || "",
          },
          $set: { lastSeen: new Date() },
        },
        { returnDocument: "after", upsert: true }
      );
    }

    res.json(user);
  } catch (error) {
    console.error("getMe error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (q.length < 2) {
      return res.json([]);
    }

    // Escape special characters so the search text is treated as plain text
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(safe, "i");

    const users = await User.find({
      clerkId: { $ne: req.clerkId },
      $or: [
        { fullName: regex },
        { username: regex },
        { email: q.toLowerCase() },
      ],
    })
      .select("fullName username imageUrl")
      .limit(10);

    res.json(users);
  } catch (error) {
    console.error("searchUsers error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
import mongoose from "mongoose";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { emitToUser } from "../socket/socket.js";
import cloudinary from "../config/cloudinary.js";

const MAX_LENGTH = 500;

export const sendMessage = async (req, res) => {
  try {
    const { conversationId, text, mediaUrl, mediaType } = req.body;
    const trimmed = (text || "").trim();
    const hasMedia = typeof mediaUrl === "string" && mediaUrl.length > 0;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }
    if (hasMedia) {
      if (!["image", "video"].includes(mediaType)) {
        return res.status(400).json({ message: "Invalid media type" });
      }
      // Only accept files that were uploaded to our own Cloudinary account
      const allowedPrefix = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`;
      if (!mediaUrl.startsWith(allowedPrefix)) {
        return res.status(400).json({ message: "Invalid media url" });
      }
    }
    if (!trimmed && !hasMedia) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }
    if (trimmed.length > MAX_LENGTH) {
      return res
        .status(400)
        .json({ message: `Message is too long (max ${MAX_LENGTH} characters)` });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      text: trimmed,
      mediaUrl: hasMedia ? mediaUrl : "",
      mediaType: hasMedia ? mediaType : undefined,
    });

    // Add 1 unread for everyone except the sender
    conversation.participants.forEach((pid) => {
      if (pid.toString() === req.user._id.toString()) return;
      const entry = conversation.unread.find(
        (u) => u.user.toString() === pid.toString()
      );
      if (entry) entry.count += 1;
      else conversation.unread.push({ user: pid, count: 1 });
    });

    // The sidebar preview shows the caption, or "Photo" / "Video" when there is none
    conversation.lastMessage =
      trimmed || (mediaType === "image" ? "Photo" : "Video");
    await conversation.save();

    // Push the message live to the other participant(s).
    // The conversation is sent too, so a brand-new chat can appear in their sidebar.
    await conversation.populate(
      "participants",
      "fullName username imageUrl lastSeen"
    );
    conversation.participants.forEach((p) => {
      if (p._id.toString() !== req.user._id.toString()) {
        emitToUser(p._id.toString(), "newMessage", { message, conversation });
      }
    });

    res.status(201).json(message);
  } catch (error) {
    console.error("sendMessage error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const MAX_IMAGE_MB = 10;
const MAX_VIDEO_MB = 50;

export const uploadMedia = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const isImage = file.mimetype.startsWith("image/");
    const maxMb = isImage ? MAX_IMAGE_MB : MAX_VIDEO_MB;
    if (file.size > maxMb * 1024 * 1024) {
      return res.status(400).json({
        message: `${isImage ? "Photos" : "Videos"} can be up to ${maxMb} MB`,
      });
    }

    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "chattime", resource_type: isImage ? "image" : "video" },
          (error, uploaded) => (error ? reject(error) : resolve(uploaded))
        )
        .end(file.buffer);
    });

    res.status(201).json({
      mediaUrl: result.secure_url,
      mediaType: isImage ? "image" : "video",
    });
  } catch (error) {
    console.error("uploadMedia error:", error.message || error);
    res.status(500).json({ message: "Upload failed" });
  }
};
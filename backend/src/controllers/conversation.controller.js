import mongoose from "mongoose";
import { Conversation } from "../models/conversation.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";

const PUBLIC_FIELDS = "fullName username imageUrl lastSeen";

export const createOrGetConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot chat with yourself" });
    }

    const other = await User.findById(userId);
    if (!other) {
      return res.status(404).json({ message: "User not found" });
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, other._id], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, other._id],
      });
    }

    await conversation.populate("participants", PUBLIC_FIELDS);
    res.json(conversation);
  } catch (error) {
    console.error("createOrGetConversation error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", PUBLIC_FIELDS)
      .sort({ updatedAt: -1 });

    res.json(conversations);
  } catch (error) {
    console.error("getMyConversations error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    const conversation = await Conversation.findOne({
      _id: id,
      participants: req.user._id,
    });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .limit(200);

    res.json(messages);
  } catch (error) {
    console.error("getMessages error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid conversation id" });
    }

    // timestamps: false so reading a chat does not change updatedAt
    // (the sidebar is sorted by updatedAt)
    await Conversation.updateOne(
      { _id: id, participants: req.user._id, "unread.user": req.user._id },
      { $set: { "unread.$.count": 0 } },
      { timestamps: false }
    );

    res.json({ ok: true });
  } catch (error) {
    console.error("markAsRead error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
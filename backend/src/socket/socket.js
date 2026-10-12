import { Server } from "socket.io";
import { verifyToken } from "@clerk/backend";
import { User } from "../models/user.model.js";

let io;

// MongoDB user id -> number of open connections (a user can have several tabs)
const onlineUsers = new Map();

const broadcastOnlineUsers = () => {
  io.emit("onlineUsers", [...onlineUsers.keys()]);
};

export const emitToUser = (userId, event, payload) => {
  if (io) io.to(userId).emit(event, payload);
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL, credentials: true },
  });

  // Only signed-in users may connect
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));

      const result = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      const payload = result?.data ?? result;
      if (!payload?.sub) return next(new Error("Unauthorized"));

      const user = await User.findOne({ clerkId: payload.sub });
      if (!user) return next(new Error("User not found"));

      socket.userId = user._id.toString();
      next();
    } catch (error) {
      console.error("Socket auth error:", error.message);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`Socket connected: ${userId}`);

    // Personal room: emitting to this id reaches all of the user's tabs
    socket.join(userId);

    onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1);
    broadcastOnlineUsers();

    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${userId}`);

      const count = (onlineUsers.get(userId) || 1) - 1;
      if (count <= 0) {
        onlineUsers.delete(userId);
        try {
          await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
        } catch (error) {
          console.error("lastSeen update error:", error.message);
        }
      } else {
        onlineUsers.set(userId, count);
      }
      broadcastOnlineUsers();
    });
  });
};
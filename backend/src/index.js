import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { connectDB } from "./config/db.js";
import { initSocket } from "./socket/socket.js";
import "./models/user.model.js";
import userRoutes from "./routes/user.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5001;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(clerkMiddleware());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

const server = http.createServer(app);
initSocket(server);

connectDB().then(() => {
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

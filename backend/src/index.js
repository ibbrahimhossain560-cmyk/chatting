import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import adminRoutes from "./routes/admin.route.js";
import { app, server } from "./lib/socket.js";

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to DB first
connectDB();

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" 
      ? ["https://chatting-pro.onrender.com", process.env.CLIENT_URL].filter(Boolean)
      : ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:5176"],
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);

if (process.env.NODE_ENV === "production") {
  // In production on Render, frontend is built at root/frontend/dist
  const frontendPath = path.join(__dirname, "../../frontend/dist");
  
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
});

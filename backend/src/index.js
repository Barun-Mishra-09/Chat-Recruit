import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes from "./routes/group.route.js";
import statusRoutes from "./routes/status.route.js";

import connectDB from "./lib/db.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import multer from "multer"; // for handling file uploads
import { app, server } from "./lib/socket.js";

import fs from "fs";
import path from "path";

dotenv.config(); // ✅ Load .env FIRST

// ✅ Ensure 'uploads' folder exists before any multer/file operations
const uploadsPath = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
  console.log("✅ 'uploads' folder created.");
}

const PORT = process.env.PORT || 8000;

// middlewares
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5143"],
    credentials: true,
  })
);

// Multer setup (this is optional here if you’re using it only in separate routes)
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "uploads/");
//   },
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

const storage = multer.memoryStorage(); // Store file in memory buffer

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Optional direct upload test route
app.post("/upload", upload.single("file"), (req, res) => {
  res.send("File uploaded successfully!");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/status", statusRoutes);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port: ${PORT}`);
  connectDB();
});

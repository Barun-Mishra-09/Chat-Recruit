import express from "express";
import protectedRoute from "../middlewares/protectedRoute.js";
import {
  getMessages,
  getUsersForSidebar,
  sendMessages,
} from "../controllers/message.controller.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

// Get users for sidebar
router.get("/otherUsers", protectedRoute, getUsersForSidebar);
// Get messages between two users
router.get("/:id", protectedRoute, getMessages);
// Send a message (with optional file upload)
router.post(
  "/sendMessage/:id",
  protectedRoute,
  upload.single("media"),
  sendMessages
);

export default router;

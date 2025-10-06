import express from "express";
import protectedRoute from "../middlewares/protectedRoute.js";
import upload from "../middlewares/multer.js";
import {
  uploadStatus,
  getStatuses,
  markStatusSeen,
  deleteStatus,
  getMyStatuses,
} from "../controllers/status.controller.js";

const router = express.Router();

router.post("/upload", protectedRoute, upload.single("file"), uploadStatus);
router.get("/all", protectedRoute, getStatuses);
router.get("/mine", protectedRoute, getMyStatuses);
router.put("/seen/:statusId", protectedRoute, markStatusSeen);
router.delete("/:statusId", protectedRoute, deleteStatus);

export default router;

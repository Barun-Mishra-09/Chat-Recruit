import { Status } from "../models/status.model.js";
import { User } from "../models/user.model.js";
import cloudinary from "../lib/cloudinary.js";
import fs from "fs/promises"; // use promise-based fs
import { stat } from "fs";

export const uploadStatus = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json({ message: "No file uploaded", success: false });
    }

    // Convert buffer to base64 data URI for Cloudinary
    const fileType = file.mimetype;
    const fileBuffer = file.buffer;
    const base64 = `data:${fileType};base64,${fileBuffer.toString("base64")}`;

    // Upload to Cloudinary with error handling
    let result;
    try {
      result = await cloudinary.uploader.upload(base64, {
        resource_type: "auto", // supports image/video
        folder: "status",
      });
    } catch (cloudErr) {
      console.error("Cloudinary upload error:", cloudErr);
      return res
        .status(500)
        .json({ message: "Cloudinary upload failed", success: false });
    }

    // No need to delete local file as we're using memory storage

    // Create status in DB
    const newStatus = await Status.create({
      user: req.user._id,
      mediaUrl: result.secure_url,
      mediaType: result.resource_type === "video" ? "video" : "image",
      caption: req.body.caption || "",
    });

    res.status(201).json({
      message: "Status uploaded",
      status: newStatus,
      success: true,
    });
  } catch (error) {
    console.error("Upload status error:", error);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

// Get statuses visible to user
export const getStatuses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("following");

    const visibleUserIds = [...user.following, req.user._id];

    const statuses = await Status.find({
      user: { $in: visibleUserIds },
      expiredAt: { $gt: new Date() },
    })
      .populate("user", "fullName profilePic")
      .sort({ createdAt: -1 });

    res.status(200).json({ statuses, success: true });
  } catch (error) {
    console.error("Get statuses error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch statuses", success: false });
  }
};

// Mark status as seen
export const markStatusSeen = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user._id;

    const status = await Status.findById(statusId);
    if (!status) {
      return res
        .status(404)
        .json({ message: "Status not found", success: false });
    }

    // check if the user is the owner of the status
    if (status.user.toString() === userId.toString()) {
      return res.status(200).json({
        message: "Owner  view ignored",
        success: true,
      });
    }

    // check if user already exists in seenBy
    const alreadySeen = status.seenBy.find(
      (entry) => entry._id.toString() === userId.toString()
    );

    if (!alreadySeen) {
      // Fetch user's name from the database
      const user = await User.findById(userId).select("fullName");

      status.seenBy.push({
        _id: userId,
        fullName: user.fullName,
        seenAt: new Date(),
      });

      await status.save();
    }

    res.status(200).json({ message: "Marked as seen", success: true });
  } catch (error) {
    console.error("Mark seen error:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Delete your own status
export const deleteStatus = async (req, res) => {
  try {
    const { statusId } = req.params;

    const deleted = await Status.findOneAndDelete({
      _id: statusId,
      user: req.user._id,
    });

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Status not found", success: false });
    }

    res.status(200).json({ message: "Status deleted", success: true });
  } catch (error) {
    console.error("Delete status error:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

// Get statuses uploaded by the current user
export const getMyStatuses = async (req, res) => {
  try {
    const statuses = await Status.find({
      user: req.user._id,
      expiredAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    res.status(200).json({ statuses, success: true });
  } catch (error) {
    console.error("Get my statuses error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch your statuses", success: false });
  }
};

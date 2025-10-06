// controllers/group.controller.js

import mongoose from "mongoose";
import { Group } from "../models/group.model.js";
import { User } from "../models/user.model.js";

// --- Create Group ---
export const createGroup = async (req, res) => {
  try {
    const { groupName, members } = req.body;
    console.log("createGroup req.body:", req.body);

    if (!groupName || !Array.isArray(members) || members.length < 2) {
      return res.status(400).json({
        message: "Group name and at least 2 members are required",
        success: false,
      });
    }

    // Validate all member IDs
    const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
    if (!members.every(isValidObjectId)) {
      return res.status(400).json({
        message: "Invalid member IDs",
        success: false,
      });
    }

    // Check if all member users exist
    const usersExist = await User.find({ _id: { $in: members } });
    if (usersExist.length !== members.length) {
      return res.status(400).json({
        message: "Some members do not exist",
        success: false,
      });
    }

    // Create group
    const newGroup = await Group.create({
      fullName: groupName,
      isGroup: true,
      members,
    });

    return res.status(201).json({
      group: newGroup,
      success: true,
    });
  } catch (error) {
    console.error("Create group error:", error);
    res.status(500).json({
      message: "Internal Server Error",
      success: false,
    });
  }
};

// --- Get Groups By User ---
export const getGroupByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const authenticatedUserId = req.user?._id || req.id;

    console.log(
      "getGroupByUser userId:",
      userId,
      "authenticatedUserId:",
      authenticatedUserId
    );

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
        success: false,
      });
    }

    if (!authenticatedUserId || authenticatedUserId.toString() !== userId) {
      return res.status(403).json({
        message: "Forbidden: You can only access your own groups",
        success: false,
      });
    }

    // Find groups where the user is a member
    const userIdObj = new mongoose.Types.ObjectId(userId);
    const groups = await Group.find({
      members: userIdObj,
      isGroup: true,
    }).populate("members", "_id fullName email");

    console.log("Found groups:", groups);

    return res.status(200).json({
      groups,
      success: true,
    });
  } catch (error) {
    console.error("Get groups error:", error);
    return res.status(500).json({
      message: "Failed to fetch groups",
      success: false,
    });
  }
};

// --- Get Groups for Logged-in User ---
export const getMyGroups = async (req, res) => {
  try {
    const authenticatedUserId = req.user?._id || req.id;

    console.log("getMyGroups authenticatedUserId:", authenticatedUserId);

    if (!authenticatedUserId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(authenticatedUserId)) {
      return res.status(400).json({
        message: "Invalid user ID",
        success: false,
      });
    }

    // Convert to ObjectId for proper query matching
    const userObjectId = new mongoose.Types.ObjectId(authenticatedUserId);
    console.log("Searching for groups with user ObjectId:", userObjectId);
    console.log("User ID string:", authenticatedUserId);

    // Find groups where the authenticated user is a member
    const groups = await Group.find({
      members: userObjectId,
      isGroup: true,
    }).populate({
      path: "members",
      select: "fullName email profilePic",
    });

    console.log("Found my groups:", groups);
    console.log("Total groups found:", groups.length);

    // Get all groups for debugging
    const allGroups = await Group.find({ isGroup: true });
    console.log("All groups in database:", allGroups.length);

    // Log each group's members for debugging
    if (allGroups.length > 0) {
      console.log("Groups in database:");
      allGroups.forEach((group, index) => {
        console.log(`Group ${index + 1}: ${group.fullName}`);
        console.log(`  ID: ${group._id}`);
        console.log(`  Members: ${group.members.map((m) => m.toString())}`);
        console.log(
          `  User ID in members: ${group.members.some(
            (m) => m.toString() === authenticatedUserId
          )}`
        );
      });
    }

    return res.status(200).json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error("Error in getMyGroups:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

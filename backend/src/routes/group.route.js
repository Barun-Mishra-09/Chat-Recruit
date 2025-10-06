import express from "express";

import protectedRoute from "../middlewares/protectedRoute.js";
import {
  createGroup,
  getGroupByUser,
  getMyGroups,
} from "../controllers/group.controller.js";

const router = express.Router();

router.post("/createGroup", protectedRoute, createGroup);
// for getting groups for logged-in user
router.get("/my-groups", protectedRoute, getMyGroups);
// for getting groups for a user
router.get("/:userId", protectedRoute, getGroupByUser);

export default router;

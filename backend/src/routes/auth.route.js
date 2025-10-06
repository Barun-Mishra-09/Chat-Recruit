import express from "express";
import {
  checkAuth,
  follow,
  Login,
  Logout,
  Register,
  unFollow,
  updateProfile,
} from "../controllers/auth.controller.js";

import protectedRoute from "../middlewares/protectedRoute.js";

const router = express.Router();

router.post("/register", Register);
router.post("/login", Login);
router.get("/logout", Logout);
router.put("/update-profile", protectedRoute, updateProfile);
// for checking auth function
router.get("/check", protectedRoute, checkAuth);
// follow
router.post("/follow/:id", protectedRoute, follow);
// unFollow
router.post("/unfollow/:id", protectedRoute, unFollow);

export default router;

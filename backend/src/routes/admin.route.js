import express from "express";
import {
  verifyAdmin,
  getAllUsers,
  deleteUser,
  updateUserBadge,
  togglePremium,
  resetUserPassword,
  findUser,
  updateUsername,
  toggleBan,
  getDashboardStats,
} from "../controllers/admin.controller.js";

const router = express.Router();

// Admin verification
router.post("/verify", verifyAdmin);

// Dashboard stats
router.get("/stats", getDashboardStats);

// User management
router.get("/users", getAllUsers);
router.delete("/users/:userId", deleteUser);
router.put("/users/:userId/badge", updateUserBadge);
router.put("/users/:userId/premium", togglePremium);
router.put("/users/:userId/password", resetUserPassword);
router.put("/users/:userId/username", updateUsername);
router.put("/users/:userId/ban", toggleBan);

// Find user by username/email
router.post("/find-user", findUser);

export default router;

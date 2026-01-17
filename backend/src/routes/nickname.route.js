import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getNickname,
  getAllNicknames,
  setNickname,
  removeNickname,
  getConversationNicknames,
} from "../controllers/nickname.controller.js";

const router = express.Router();

// Get all nicknames for the current user
router.get("/", protectRoute, getAllNicknames);

// Get conversation nicknames (both users)
router.get("/conversation/:userId", protectRoute, getConversationNicknames);

// Get nickname for a specific user
router.get("/:userId", protectRoute, getNickname);

// Set or update nickname for a user
router.post("/:userId", protectRoute, setNickname);

// Remove nickname for a user
router.delete("/:userId", protectRoute, removeNickname);

export default router;

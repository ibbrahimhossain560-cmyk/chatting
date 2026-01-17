import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  getMessages, 
  getUsersForSidebar, 
  sendMessage,
  deleteMessage,
  addReaction,
  toggleStarMessage,
  forwardMessage 
} from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);

router.post("/send/:id", protectRoute, sendMessage);
router.delete("/:messageId", protectRoute, deleteMessage);
router.post("/:messageId/reaction", protectRoute, addReaction);
router.post("/:messageId/star", protectRoute, toggleStarMessage);
router.post("/:messageId/forward", protectRoute, forwardMessage);

export default router;

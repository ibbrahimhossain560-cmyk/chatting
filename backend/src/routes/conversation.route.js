import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getConversations,
  getArchivedConversations,
  archiveConversation,
  unarchiveConversation,
  deleteConversation,
  restoreConversation,
  pinConversation,
  unpinConversation,
  muteConversation,
  unmuteConversation,
} from "../controllers/conversation.controller.js";

const router = express.Router();

// Get all conversations
router.get("/", protectRoute, getConversations);

// Get archived conversations
router.get("/archived", protectRoute, getArchivedConversations);

// Archive/unarchive
router.post("/:conversationId/archive", protectRoute, archiveConversation);
router.post("/:conversationId/unarchive", protectRoute, unarchiveConversation);

// Delete/restore (soft delete)
router.delete("/:conversationId", protectRoute, deleteConversation);
router.post("/:conversationId/restore", protectRoute, restoreConversation);

// Pin/unpin
router.post("/:conversationId/pin", protectRoute, pinConversation);
router.post("/:conversationId/unpin", protectRoute, unpinConversation);

// Mute/unmute
router.post("/:conversationId/mute", protectRoute, muteConversation);
router.post("/:conversationId/unmute", protectRoute, unmuteConversation);

export default router;

import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Get all conversations for the current user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const { includeArchived } = req.query;

    let query = {
      participants: userId,
      deletedBy: { $ne: userId }, // Don't show deleted conversations
    };

    // By default, don't show archived unless specifically requested
    if (includeArchived !== "true") {
      query.archivedBy = { $ne: userId };
    }

    const conversations = await Conversation.find(query)
      .populate("participants", "fullName profilePic")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    // Format conversations for frontend
    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );
      
      return {
        _id: conv._id,
        user: otherParticipant,
        lastMessage: conv.lastMessage,
        isArchived: conv.archivedBy.includes(userId),
        isPinned: conv.pinnedBy.includes(userId),
        isMuted: conv.mutedBy.some((m) => m.userId?.toString() === userId.toString()),
        updatedAt: conv.updatedAt,
      };
    });

    res.status(200).json(formattedConversations);
  } catch (error) {
    console.error("Error in getConversations:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get archived conversations
export const getArchivedConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
      archivedBy: userId,
      deletedBy: { $ne: userId },
    })
      .populate("participants", "fullName profilePic")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    const formattedConversations = conversations.map((conv) => {
      const otherParticipant = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );
      
      return {
        _id: conv._id,
        user: otherParticipant,
        lastMessage: conv.lastMessage,
        isArchived: true,
        isPinned: conv.pinnedBy.includes(userId),
        isMuted: conv.mutedBy.some((m) => m.userId?.toString() === userId.toString()),
        updatedAt: conv.updatedAt,
      };
    });

    res.status(200).json(formattedConversations);
  } catch (error) {
    console.error("Error in getArchivedConversations:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Archive a conversation
export const archiveConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    // If conversationId is a user ID, find/create the conversation
    let conversation;
    
    // Try to find by conversation ID first
    conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      // Try to find by other user ID
      conversation = await Conversation.findOne({
        participants: { $all: [userId, conversationId] },
      });
    }

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.getOrCreate(userId, conversationId);
    }

    // Check if user is a participant
    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Add user to archivedBy if not already there
    if (!conversation.archivedBy.includes(userId)) {
      conversation.archivedBy.push(userId);
      await conversation.save();
    }

    res.status(200).json({ message: "Conversation archived", conversationId: conversation._id });
  } catch (error) {
    console.error("Error in archiveConversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Unarchive a conversation
export const unarchiveConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    let conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      conversation = await Conversation.findOne({
        participants: { $all: [userId, conversationId] },
      });
    }

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Remove user from archivedBy
    conversation.archivedBy = conversation.archivedBy.filter(
      (id) => id.toString() !== userId.toString()
    );
    await conversation.save();

    res.status(200).json({ message: "Conversation unarchived", conversationId: conversation._id });
  } catch (error) {
    console.error("Error in unarchiveConversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete (hide) a conversation - soft delete
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    let conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      conversation = await Conversation.findOne({
        participants: { $all: [userId, conversationId] },
      });
    }

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Add user to deletedBy if not already there
    if (!conversation.deletedBy.includes(userId)) {
      conversation.deletedBy.push(userId);
      await conversation.save();
    }

    res.status(200).json({ message: "Conversation deleted", conversationId: conversation._id });
  } catch (error) {
    console.error("Error in deleteConversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Restore a deleted conversation
export const restoreConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Remove user from deletedBy
    conversation.deletedBy = conversation.deletedBy.filter(
      (id) => id.toString() !== userId.toString()
    );
    await conversation.save();

    res.status(200).json({ message: "Conversation restored", conversationId: conversation._id });
  } catch (error) {
    console.error("Error in restoreConversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Pin a conversation
export const pinConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    let conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      conversation = await Conversation.findOne({
        participants: { $all: [userId, conversationId] },
      });
    }

    if (!conversation) {
      conversation = await Conversation.getOrCreate(userId, conversationId);
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!conversation.pinnedBy.includes(userId)) {
      conversation.pinnedBy.push(userId);
      await conversation.save();
    }

    res.status(200).json({ message: "Conversation pinned", conversationId: conversation._id });
  } catch (error) {
    console.error("Error in pinConversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Unpin a conversation
export const unpinConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    let conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      conversation = await Conversation.findOne({
        participants: { $all: [userId, conversationId] },
      });
    }

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    conversation.pinnedBy = conversation.pinnedBy.filter(
      (id) => id.toString() !== userId.toString()
    );
    await conversation.save();

    res.status(200).json({ message: "Conversation unpinned", conversationId: conversation._id });
  } catch (error) {
    console.error("Error in unpinConversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Mute a conversation
export const muteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;
    const { duration } = req.body; // Duration in hours, null for indefinite

    let conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      conversation = await Conversation.findOne({
        participants: { $all: [userId, conversationId] },
      });
    }

    if (!conversation) {
      conversation = await Conversation.getOrCreate(userId, conversationId);
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Remove existing mute entry if any
    conversation.mutedBy = conversation.mutedBy.filter(
      (m) => m.userId?.toString() !== userId.toString()
    );

    // Add new mute entry
    const mutedUntil = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;
    conversation.mutedBy.push({ userId, mutedUntil });
    await conversation.save();

    res.status(200).json({ 
      message: "Conversation muted", 
      conversationId: conversation._id,
      mutedUntil 
    });
  } catch (error) {
    console.error("Error in muteConversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Unmute a conversation
export const unmuteConversation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { conversationId } = req.params;

    let conversation = await Conversation.findById(conversationId);
    
    if (!conversation) {
      conversation = await Conversation.findOne({
        participants: { $all: [userId, conversationId] },
      });
    }

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.some((p) => p.toString() === userId.toString())) {
      return res.status(403).json({ message: "Not authorized" });
    }

    conversation.mutedBy = conversation.mutedBy.filter(
      (m) => m.userId?.toString() !== userId.toString()
    );
    await conversation.save();

    res.status(200).json({ message: "Conversation unmuted", conversationId: conversation._id });
  } catch (error) {
    console.error("Error in unmuteConversation:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

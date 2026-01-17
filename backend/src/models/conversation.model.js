import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    // The two participants
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }],
    // Last message for preview
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    // Archive status per user
    archivedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // Deleted/hidden status per user (soft delete)
    deletedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // Muted status per user
    mutedBy: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      mutedUntil: {
        type: Date,
        default: null, // null means muted indefinitely
      },
    }],
    // Pinned status per user
    pinnedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  { timestamps: true }
);

// Compound index for fast lookups
conversationSchema.index({ participants: 1 });

// Helper to get or create conversation
conversationSchema.statics.getOrCreate = async function(user1Id, user2Id) {
  let conversation = await this.findOne({
    participants: { $all: [user1Id, user2Id] },
  });
  
  if (!conversation) {
    conversation = await this.create({
      participants: [user1Id, user2Id],
    });
  }
  
  return conversation;
};

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;

import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  emoji: {
    type: String,
    required: true,
  },
}, { _id: false });

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    // Voice message support
    audio: {
      type: String,
    },
    audioDuration: {
      type: Number,
    },
    // Reply to another message
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    // Message reactions
    reactions: [reactionSchema],
    // Read status
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    // Deleted status (soft delete)
    deletedForSender: {
      type: Boolean,
      default: false,
    },
    deletedForEveryone: {
      type: Boolean,
      default: false,
    },
    // Forwarded message
    isForwarded: {
      type: Boolean,
      default: false,
    },
    // Edited message
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    // Starred/pinned
    starred: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    // Message type for special handling
    messageType: {
      type: String,
      enum: ["text", "image", "audio", "file", "sticker", "gif", "location", "nickname_change", "system"],
      default: "text",
    },
    // File attachment support
    file: {
      url: String,
      name: String,
      size: Number,
      type: String,
    },
  },
  { timestamps: true }
);

// Index for faster queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;

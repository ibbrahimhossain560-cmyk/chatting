import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 20,
      match: [/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"],
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    // Badge system
    badge: {
      type: String,
      default: null,
    },
    badgeType: {
      type: String,
      enum: ["none", "premium", "vip", "verified", "moderator", "admin", "founder", "developer", "partner", "star", "diamond", "crown"],
      default: "none",
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumExpiresAt: {
      type: Date,
      default: null,
    },
    // Username change tracking
    lastUsernameChange: {
      type: Date,
      default: null,
    },
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for faster queries
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });

const User = mongoose.model("User", userSchema);

export default User;

import mongoose from "mongoose";

const nicknameSchema = new mongoose.Schema(
  {
    // The user who set the nickname
    setBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The user the nickname is for
    forUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // The nickname
    nickname: {
      type: String,
      maxlength: 50,
      trim: true,
    },
  },
  { timestamps: true }
);

// Compound index to ensure unique nickname per user pair
nicknameSchema.index({ setBy: 1, forUser: 1 }, { unique: true });

const Nickname = mongoose.model("Nickname", nicknameSchema);

export default Nickname;

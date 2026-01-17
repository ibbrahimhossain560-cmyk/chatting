import Nickname from "../models/nickname.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Get nickname for a user
export const getNickname = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const nickname = await Nickname.findOne({
      setBy: myId,
      forUser: userId,
    });

    res.status(200).json({ nickname: nickname?.nickname || null });
  } catch (error) {
    console.error("Error in getNickname:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get all nicknames set by the user
export const getAllNicknames = async (req, res) => {
  try {
    const myId = req.user._id;

    const nicknames = await Nickname.find({ setBy: myId })
      .populate("forUser", "fullName profilePic username");

    // Also get nicknames others have set for me
    const nicknamesForMe = await Nickname.find({ forUser: myId })
      .populate("setBy", "fullName profilePic username");

    res.status(200).json({
      nicknamesISet: nicknames,
      nicknamesForMe: nicknamesForMe,
    });
  } catch (error) {
    console.error("Error in getAllNicknames:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Set or update nickname for a user
export const setNickname = async (req, res) => {
  try {
    const { userId } = req.params;
    const { nickname } = req.body;
    const myId = req.user._id;

    if (!nickname || !nickname.trim()) {
      return res.status(400).json({ error: "Nickname is required" });
    }

    const trimmedNickname = nickname.trim();

    if (trimmedNickname.length > 50) {
      return res.status(400).json({ error: "Nickname must be 50 characters or less" });
    }

    // Check if nickname already exists
    const existingNickname = await Nickname.findOne({
      setBy: myId,
      forUser: userId,
    });

    const isUpdate = !!existingNickname;
    const oldNickname = existingNickname?.nickname;

    // Upsert the nickname
    const result = await Nickname.findOneAndUpdate(
      { setBy: myId, forUser: userId },
      { nickname: trimmedNickname },
      { upsert: true, new: true }
    );

    // Create a system message to show in chat
    const systemMessage = new Message({
      senderId: myId,
      receiverId: userId,
      text: isUpdate 
        ? `changed their nickname to "${trimmedNickname}"`
        : `set their nickname to "${trimmedNickname}"`,
      messageType: "nickname_change",
    });
    await systemMessage.save();

    // Notify the other user via socket
    const receiverSocketId = getReceiverSocketId(userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("nicknameChanged", {
        setBy: myId,
        forUser: userId,
        nickname: trimmedNickname,
        oldNickname,
        isUpdate,
      });
      io.to(receiverSocketId).emit("newMessage", systemMessage);
    }

    res.status(200).json({
      success: true,
      nickname: result.nickname,
      message: isUpdate ? "Nickname updated" : "Nickname set",
    });
  } catch (error) {
    console.error("Error in setNickname:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Remove nickname for a user
export const removeNickname = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    const existingNickname = await Nickname.findOne({
      setBy: myId,
      forUser: userId,
    });

    if (!existingNickname) {
      return res.status(404).json({ error: "No nickname found" });
    }

    const oldNickname = existingNickname.nickname;

    await Nickname.findOneAndDelete({
      setBy: myId,
      forUser: userId,
    });

    // Create a system message
    const systemMessage = new Message({
      senderId: myId,
      receiverId: userId,
      text: `removed their nickname "${oldNickname}"`,
      messageType: "nickname_change",
    });
    await systemMessage.save();

    // Notify the other user
    const receiverSocketId = getReceiverSocketId(userId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("nicknameRemoved", {
        setBy: myId,
        forUser: userId,
        oldNickname,
      });
      io.to(receiverSocketId).emit("newMessage", systemMessage);
    }

    res.status(200).json({
      success: true,
      message: "Nickname removed",
    });
  } catch (error) {
    console.error("Error in removeNickname:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get nicknames for a conversation (both users' nicknames)
export const getConversationNicknames = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user._id;

    // Get nickname I set for the other user
    const myNicknameForThem = await Nickname.findOne({
      setBy: myId,
      forUser: userId,
    });

    // Get nickname they set for me
    const theirNicknameForMe = await Nickname.findOne({
      setBy: userId,
      forUser: myId,
    });

    // Get nickname I set for myself (for this conversation)
    const myNicknameForMyself = await Nickname.findOne({
      setBy: myId,
      forUser: myId,
    });

    // Get nickname they set for themselves
    const theirNicknameForThemself = await Nickname.findOne({
      setBy: userId,
      forUser: userId,
    });

    res.status(200).json({
      myNicknameForThem: myNicknameForThem?.nickname || null,
      theirNicknameForMe: theirNicknameForMe?.nickname || null,
      myNicknameForMyself: myNicknameForMyself?.nickname || null,
      theirNicknameForThemself: theirNicknameForThemself?.nickname || null,
    });
  } catch (error) {
    console.error("Error in getConversationNicknames:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

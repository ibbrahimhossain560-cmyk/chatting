import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId, deletedForSender: { $ne: true } },
        { senderId: userToChatId, receiverId: myId },
      ],
      deletedForEveryone: { $ne: true },
    })
      .populate("replyTo", "text image senderId")
      .sort({ createdAt: 1 }); // Sort by timestamp ascending

    // Mark messages as read
    await Message.updateMany(
      { senderId: userToChatId, receiverId: myId, read: false },
      { read: true, readAt: new Date() }
    );

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image, audio, audioDuration, replyTo, isForwarded, messageType } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    let audioUrl;
    if (audio) {
      // Upload audio to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(audio, {
        resource_type: "video", // Cloudinary uses 'video' for audio files
        folder: "voice_messages",
      });
      audioUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      audio: audioUrl,
      audioDuration,
      replyTo,
      isForwarded: isForwarded || false,
      messageType: messageType || (audio ? "audio" : image ? "image" : "text"),
    });

    await newMessage.save();

    // Populate replyTo if exists
    if (replyTo) {
      await newMessage.populate("replyTo", "text image senderId");
    }

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Check if user is the sender (only sender can delete for everyone)
    if (deleteForEveryone && message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only sender can delete for everyone" });
    }

    if (deleteForEveryone) {
      message.deletedForEveryone = true;
      message.text = "This message was deleted";
      message.image = null;
      message.audio = null;
    } else {
      message.deletedForSender = true;
    }

    await message.save();

    // Notify receiver if deleted for everyone
    if (deleteForEveryone) {
      const receiverSocketId = getReceiverSocketId(message.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", { messageId, deletedForEveryone: true });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.log("Error in deleteMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add reaction to message
export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId.toString()
    );

    // Add new reaction
    if (emoji) {
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    // Notify both users
    const otherUserId = message.senderId.toString() === userId.toString() 
      ? message.receiverId 
      : message.senderId;
    
    const otherSocketId = getReceiverSocketId(otherUserId);
    if (otherSocketId) {
      io.to(otherSocketId).emit("messageReaction", { 
        messageId, 
        reactions: message.reactions 
      });
    }

    res.status(200).json(message.reactions);
  } catch (error) {
    console.log("Error in addReaction controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Star/unstar message
export const toggleStarMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const starIndex = message.starred.indexOf(userId);
    if (starIndex > -1) {
      message.starred.splice(starIndex, 1);
    } else {
      message.starred.push(userId);
    }

    await message.save();

    res.status(200).json({ starred: message.starred.includes(userId) });
  } catch (error) {
    console.log("Error in toggleStarMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Edit message
export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Only sender can edit their message
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only sender can edit their message" });
    }

    // Can only edit text messages
    if (!message.text) {
      return res.status(400).json({ error: "Can only edit text messages" });
    }

    message.text = text;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    // Notify receiver about the edit
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", { 
        messageId, 
        text: message.text, 
        isEdited: true,
        editedAt: message.editedAt 
      });
    }

    res.status(200).json({ success: true, message });
  } catch (error) {
    console.log("Error in editMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Forward message
export const forwardMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { receiverIds } = req.body; // Array of user IDs to forward to
    const senderId = req.user._id;

    const originalMessage = await Message.findById(messageId);
    if (!originalMessage) {
      return res.status(404).json({ error: "Message not found" });
    }

    const forwardedMessages = [];

    for (const receiverId of receiverIds) {
      const newMessage = new Message({
        senderId,
        receiverId,
        text: originalMessage.text,
        image: originalMessage.image,
        audio: originalMessage.audio,
        audioDuration: originalMessage.audioDuration,
        isForwarded: true,
        messageType: originalMessage.messageType,
      });

      await newMessage.save();
      forwardedMessages.push(newMessage);

      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
    }

    res.status(201).json(forwardedMessages);
  } catch (error) {
    console.log("Error in forwardMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

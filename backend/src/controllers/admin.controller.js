import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import bcrypt from "bcryptjs";

// Verify admin password
export const verifyAdmin = async (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return res.status(500).json({ message: "Admin password not configured" });
    }

    if (password !== adminPassword) {
      return res.status(401).json({ message: "Invalid admin password" });
    }

    res.status(200).json({ message: "Admin verified", isAdmin: true });
  } catch (error) {
    console.log("Error in verifyAdmin:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    console.log("Error in getAllUsers:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Delete user's messages
    await Message.deleteMany({
      $or: [{ senderId: userId }, { receiverId: userId }],
    });

    // Delete user
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error in deleteUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update user badge
export const updateUserBadge = async (req, res) => {
  try {
    const { userId } = req.params;
    const { badge, badgeType } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { badge, badgeType },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in updateUserBadge:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Toggle premium status
export const togglePremium = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isPremium, premiumDays } = req.body;

    let premiumExpiresAt = null;
    if (isPremium && premiumDays) {
      premiumExpiresAt = new Date(Date.now() + premiumDays * 24 * 60 * 60 * 1000);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isPremium, premiumExpiresAt },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in togglePremium:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Reset user password
export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const user = await User.findByIdAndUpdate(
      userId,
      { password: hashedPassword },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Password reset successfully", user });
  } catch (error) {
    console.log("Error in resetUserPassword:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Find user by username or email (for password reset lookup)
export const findUser = async (req, res) => {
  try {
    const { query } = req.body;

    const user = await User.findOne({
      $or: [
        { username: { $regex: new RegExp(`^${query}$`, 'i') } },
        { email: { $regex: new RegExp(`^${query}$`, 'i') } },
      ],
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in findUser:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update username (admin)
export const updateUsername = async (req, res) => {
  try {
    const { userId } = req.params;
    const { username } = req.body;

    // Validate username
    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({ message: "Username must be 3-20 characters" });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
    }

    // Check if username is taken
    const existingUser = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') },
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { username, lastUsernameChange: new Date() },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in updateUsername:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Ban/Unban user
export const toggleBan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBanned, banReason } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned, banReason: isBanned ? banReason : null },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in toggleBan:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const premiumUsers = await User.countDocuments({ isPremium: true });
    const bannedUsers = await User.countDocuments({ isBanned: true });
    const totalMessages = await Message.countDocuments();
    
    // Users joined in last 7 days
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers = await User.countDocuments({ createdAt: { $gte: lastWeek } });

    res.status(200).json({
      totalUsers,
      premiumUsers,
      bannedUsers,
      totalMessages,
      newUsers,
    });
  } catch (error) {
    console.log("Error in getDashboardStats:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

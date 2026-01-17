import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password, username } = req.body;
  try {
    if (!fullName || !email || !password || !username) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate username
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ message: "Username must be 3-20 characters" });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if email exists
    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ message: "Email already exists" });

    // Check if username exists
    const usernameExists = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });
    if (usernameExists) return res.status(400).json({ message: "Username already taken" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      username: username.toLowerCase(),
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        username: newUser.username,
        profilePic: newUser.profilePic,
        badge: newUser.badge,
        badgeType: newUser.badgeType,
        isPremium: newUser.isPremium,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Allow login with email or username
    const user = await User.findOne({
      $or: [
        { email: email },
        { username: { $regex: new RegExp(`^${email}$`, 'i') } }
      ]
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: `Account banned: ${user.banReason || "Contact admin"}` });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      profilePic: user.profilePic,
      badge: user.badge,
      badgeType: user.badgeType,
      isPremium: user.isPremium,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { profilePic, username, fullName } = req.body;
    const userId = req.user._id;

    const updateData = {};

    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = uploadResponse.secure_url;
    }

    if (fullName) {
      updateData.fullName = fullName;
    }

    // Handle username update (once per month for regular users)
    if (username) {
      // Validate username
      if (username.length < 3 || username.length > 20) {
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

      // Check if user can change username (once per month)
      const user = await User.findById(userId);
      if (user.lastUsernameChange) {
        const daysSinceLastChange = (Date.now() - new Date(user.lastUsernameChange).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastChange < 30) {
          const daysLeft = Math.ceil(30 - daysSinceLastChange);
          return res.status(400).json({ message: `You can change your username in ${daysLeft} days` });
        }
      }

      updateData.username = username.toLowerCase();
      updateData.lastUsernameChange = new Date();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No data to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Check username availability
export const checkUsername = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || username.length < 3) {
      return res.status(400).json({ available: false, message: "Username too short" });
    }

    const existingUser = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    });

    res.status(200).json({ 
      available: !existingUser,
      message: existingUser ? "Username taken" : "Username available"
    });
  } catch (error) {
    console.log("Error in checkUsername:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

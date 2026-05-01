const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// ======================= REGISTER =======================
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const emailLower = email.toLowerCase().trim();
    const existingUser = await User.findOne({ where: { email: emailLower } });

    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name: name.trim(),
      email: emailLower,
      password: hashedPassword,
    });

    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
    });
  } catch (error) {
    console.error("Register error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ======================= LOGIN =======================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const emailLower = email.toLowerCase().trim();
    const user = await User.findOne({ where: { email: emailLower } });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ======================= GET PROFILE =======================
exports.getProfile = async (req, res) => {
  try {
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ======================= UPDATE PROFILE =======================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;

    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, message: "Name and email are required" });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if new email already exists for another user
    const emailExists = await User.findOne({
      where: { email: emailLower },
    });

    if (emailExists && emailExists.id !== userId) {
      return res
        .status(400)
        .json({ success: false, message: "Email already taken" });
    }

    await User.update(
      { name: name.trim(), email: emailLower },
      { where: { id: userId } }
    );

    return res.json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: err.message,
    });
  }
};

// ======================= CHANGE PASSWORD =======================
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const user = await User.findByPk(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Old password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await User.update({ password: hashed }, { where: { id: userId } });

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: err.message,
    });
  }
};

// ======================= DELETE ACCOUNT =======================
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    await User.destroy({ where: { id: userId } });

    return res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete account",
      error: err.message,
    });
  }
};

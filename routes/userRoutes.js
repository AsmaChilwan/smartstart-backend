const express = require("express");
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// -------------------- AUTH --------------------
router.post("/register", registerUser);
router.post("/login", loginUser);

// -------------------- PROFILE --------------------
router.get("/profile", protect, getProfile);            // Get profile
router.put("/profile/update", protect, updateProfile);   // Update profile

// -------------------- PASSWORD --------------------
router.put("/change-password", protect, changePassword); // Change password

// -------------------- DELETE ACCOUNT --------------------
router.delete("/delete", protect, deleteAccount);

module.exports = router;

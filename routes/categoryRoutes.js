const express = require("express");
const {
  addCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// ⭐ All category routes are protected
router.post("/add", protect, addCategory);
router.get("/all", protect, getCategories);
router.put("/update/:id", protect, updateCategory);
router.delete("/delete/:id", protect, deleteCategory);

module.exports = router;

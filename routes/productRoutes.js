const express = require("express");
const router = express.Router();

const {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  searchProducts,
  getTopProducts,
} = require("../controllers/productController");

// ✅ Simple, correct import for auth middleware
const protect = require("../middleware/authMiddleware");

// ⭐ Protected Product Routes
router.post("/add", protect, addProduct);
router.get("/all", protect, getProducts);
router.put("/update/:id", protect, updateProduct);
router.delete("/delete/:id", protect, deleteProduct);
router.get("/search", protect, searchProducts);
router.get("/top", protect, getTopProducts);

module.exports = router;

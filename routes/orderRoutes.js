const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  addOrder,
  getAllOrders,
  editOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderSummary,
  getSalesByProduct,
  searchOrders,
} = require("../controllers/orderController");

/* ============================================================
   ORDER ROUTES
============================================================ */

// ➕ Create Order
router.post("/add", protect, addOrder);

// 📋 Get All Orders
router.get("/all", protect, getAllOrders);

// ✏️ Edit Order
router.put("/edit/:id", protect, editOrder);

// 🔄 Update Status
router.put("/status/:id", protect, updateOrderStatus);

// 🚫 Cancel Order
router.put("/cancel/:id", protect, cancelOrder);


// 📊 Dashboard Summary
router.get("/summary", protect, getOrderSummary);

// 📈 Sales by Product (Report Page)
router.get("/sales-by-product", protect, getSalesByProduct);

// 🔍 Search Orders
router.get("/search", protect, searchOrders);

module.exports = router;

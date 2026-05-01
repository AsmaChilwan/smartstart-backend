const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  getFinanceSummary,
  getMonthlyTrends,
  getSalesByProduct
} = require("../controllers/reportController");

// ROUTES
router.get("/finance-summary", protect, getFinanceSummary);
router.get("/monthly-trends", protect, getMonthlyTrends);
router.get("/sales-by-product", protect, getSalesByProduct);

module.exports = router;

const { Op } = require("sequelize");
const sequelize = require("../config/db");
const Order = require("../models/orderModel");
const Expense = require("../models/expenseModel");
const OrderItem = require("../models/orderItemModel");
const Product = require("../models/productModel");

/* ============================================================
   📊 FINANCIAL SUMMARY  (Updated Partial Logic)
============================================================ */
exports.getFinanceSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const orders = await Order.findAll({
      where: { userId, status: { [Op.ne]: "cancelled" } },
    });

    const expenses = await Expense.findAll({ where: { userId } });

    let totalRevenue = 0;

    orders.forEach((order) => {
      // ⭐ NEW LOGIC: Count revenue based ONLY on payment status
      if (order.paymentStatus === "Paid") {
        totalRevenue += order.totalPrice;
      } else if (order.paymentStatus === "Partial") {
        totalRevenue += order.totalPrice * 0.5;
      }
      // unpaid = 0 (no need to add)
    });
  

    const totalExpenses = expenses.reduce(
      (sum, e) => sum + (e.amount || 0),
      0
    );

    const profit = totalRevenue - totalExpenses;

    return res.json({
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalExpenses: Number(totalExpenses.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      status: profit >= 0 ? "Profit" : "Loss",
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to load finance summary",
      error: err.message,
    });
  }
};

/* ============================================================
   📈 MONTHLY TRENDS (FINAL CLEAN VERSION)
============================================================ */
/* ============================================================
   📈 MONTHLY TRENDS (Updated Partial Logic)
============================================================ */
exports.getMonthlyTrends = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Monthly revenue from orders
    const [orderRows] = await sequelize.query(
      `
      SELECT 
        YEAR(o.createdAt) AS yr,
        MONTH(o.createdAt) AS mth,
        SUM(
          CASE 
            WHEN o.status = 'cancelled' THEN 0
            WHEN o.paymentStatus = 'Paid' THEN o.totalPrice
            WHEN o.paymentStatus = 'Partial' THEN o.totalPrice * 0.5
            ELSE 0
          END
        ) AS revenue
      FROM orders o
      WHERE o.userId = :userId
      GROUP BY YEAR(o.createdAt), MONTH(o.createdAt)
      ORDER BY YEAR(o.createdAt), MONTH(o.createdAt);
      `,
      { replacements: { userId } }
    );

    // 2️⃣ Monthly expenses
    const [expenseRows] = await sequelize.query(
      `
      SELECT
        YEAR(e.date) AS yr,
        MONTH(e.date) AS mth,
        SUM(e.amount) AS totalExpenses
      FROM expenses e
      WHERE e.userId = :userId
      GROUP BY YEAR(e.date), MONTH(e.date)
      ORDER BY YEAR(e.date), MONTH(e.date);
      `,
      { replacements: { userId } }
    );

    // 3️⃣ Merge by year & month
    const map = {};

    orderRows.forEach((r) => {
      const key = `${r.yr}-${String(r.mth).padStart(2, "0")}`;
      if (!map[key]) {
        map[key] = {
          yr: r.yr,
          mth: r.mth,
          revenue: 0,
          expenses: 0,
        };
      }
      map[key].revenue = Number(r.revenue || 0);
    });

    expenseRows.forEach((e) => {
      const key = `${e.yr}-${String(e.mth).padStart(2, "0")}`;
      if (!map[key]) {
        map[key] = {
          yr: e.yr,
          mth: e.mth,
          revenue: 0,
          expenses: 0,
        };
      }
      map[key].expenses = Number(e.totalExpenses || 0);
    });

    // 4️⃣ Convert map → sorted array
    const monthlyTrends = Object.values(map)
      .sort((a, b) => {
        if (a.yr !== b.yr) return a.yr - b.yr;
        return a.mth - b.mth;
      })
      .map((item) => {
        const formattedMonth = new Date(item.yr, item.mth - 1).toLocaleString(
          "en-US",
          { month: "short", year: "numeric" }
        );

        return {
          month: formattedMonth,
          revenue: Number(item.revenue),
          expenses: Number(item.expenses),
          profit: Number(item.revenue - item.expenses),
        };
      });

    return res.json({ monthlyTrends });
  } catch (err) {
    console.error("Monthly Trends Error:", err);
    res.status(500).json({
      message: "Failed to get monthly trends",
      error: err.message,
    });
  }
};
/* ============================================================
   📊 SALES BY PRODUCT
============================================================ */
exports.getSalesByProduct = async (req, res) => {
  try {
    const userId = req.user.id;

    const sales = await OrderItem.findAll({
      include: [
        {
          model: Order,
          where: { userId, status: { [Op.ne]: "cancelled" } },
          attributes: [],
        },
        {
          model: Product,
          attributes: ["name", "price"],
        },
      ],
    });

    const totals = {};

    sales.forEach((item) => {
      const name = item.Product?.name || "Unknown";

      if (!totals[name]) {
        totals[name] = {
          productName: name,
          totalQuantity: 0,
          totalRevenue: 0,
        };
      }

      totals[name].totalQuantity += item.quantity;
      totals[name].totalRevenue += item.subtotal;
    });

    return res.json({ sales: Object.values(totals) });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to get sales by product",
      error: err.message,
    });
  }
};

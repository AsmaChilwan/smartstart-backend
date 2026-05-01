// backend/controllers/expenseController.js
const Expense = require("../models/expenseModel");
const { Op } = require("sequelize");

/* ============================================================
   ➕ ADD EXPENSE (user-specific)
============================================================ */
exports.addExpense = async (req, res) => {
  try {
    const { title, amount, category, date, note } = req.body;

    if (!title || !amount || !date) {
      return res.status(400).json({
        message: "❌ title, amount, and date are required",
      });
    }

    const expense = await Expense.create({
      title,
      amount,
      category,
      date,
      note,
      userId: req.user.id,   // ⭐ link expense to logged-in user
    });

    res.status(201).json({
      message: "✅ Expense added successfully",
      expense,
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to add expense",
      error: error.message,
    });
  }
};

/* ============================================================
   📋 GET ALL EXPENSES (user-specific)
============================================================ */
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { userId: req.user.id },   // ⭐ only this user's expenses
      order: [["date", "DESC"]],
    });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to load expenses",
      error: error.message,
    });
  }
};

/* ============================================================
   ✏️ UPDATE EXPENSE (user-specific)
============================================================ */
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findOne({
      where: { id, userId: req.user.id },  // ⭐ make sure it belongs to user
    });

    if (!expense) {
      return res.status(404).json({ message: "⚠️ Expense not found" });
    }

    const { title, amount, category, date, note } = req.body;

    await expense.update({
      title: title ?? expense.title,
      amount: amount ?? expense.amount,
      category: category ?? expense.category,
      date: date ?? expense.date,
      note: note ?? expense.note,
    });

    res.json({
      message: "✅ Expense updated",
      expense,
    });
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to update expense",
      error: error.message,
    });
  }
};

/* ============================================================
   ❌ DELETE EXPENSE (user-specific)
============================================================ */
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Expense.destroy({
      where: { id, userId: req.user.id },   // ⭐ only delete own expense
    });

    if (!deleted) {
      return res.status(404).json({ message: "⚠️ Expense not found" });
    }

    res.json({ message: "🗑️ Expense deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "❌ Failed to delete expense",
      error: error.message,
    });
  }
};

/* ============================================================
   📊 EXPENSE SUMMARY (user-specific)
============================================================ */
exports.getExpenseSummary = async (req, res) => {
  try {
    const expenses = await Expense.findAll({
      where: { userId: req.user.id },
    });

    const categoryTotals = {};

    expenses.forEach((exp) => {
      const category = exp.category || "Uncategorized";
      const amount = Number(exp.amount) || 0;

      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }

      categoryTotals[category] += amount;
    });

    return res.json({
      categoryTotals,  // ⭐ EXACTLY what frontend expects
    });

  } catch (error) {
    return res.status(500).json({
      message: "❌ Failed to get expense summary",
      error: error.message,
    });
  }
};

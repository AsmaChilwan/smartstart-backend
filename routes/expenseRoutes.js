// backend/routes/expenseRoutes.js
const express = require('express');
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  addExpense,
  getAllExpenses,
  updateExpense,
  deleteExpense,
  getExpenseSummary
} = require('../controllers/expenseController');

// ⭐ Protect ALL routes → user must be logged in

router.post('/add', protect, addExpense);
router.get('/all', protect, getAllExpenses);
router.put('/update/:id', protect, updateExpense);
router.delete('/delete/:id', protect, deleteExpense);
router.get('/summary', protect, getExpenseSummary);

module.exports = router;

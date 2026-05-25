const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
const Budget = require('../models/Budget');
const MoneyLent = require('../models/MoneyLent');
const MoneyBorrowed = require('../models/MoneyBorrowed');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary data
// @access  Private
router.get('/summary', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    // Get current month start and end dates
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Get total salary (current month)
    const monthSalaries = await Salary.find({
      user: req.user._id,
      date: { $gte: monthStart, $lte: monthEnd }
    });
    const totalSalary = monthSalaries.reduce((sum, salary) => sum + salary.amount, 0);

    // Get total expenses (current month)
    const monthExpenses = await Expense.find({
      user: req.user._id,
      date: { $gte: monthStart, $lte: monthEnd }
    });
    const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Calculate savings
    const savings = totalSalary - totalExpenses;
    const savingsRate = totalSalary > 0 ? ((savings / totalSalary) * 100).toFixed(2) : 0;

    // Get current month budget
    const budget = await Budget.findOne({
      user: req.user._id,
      month: currentMonth,
      year: currentYear,
      category: 'Overall'
    });

    const budgetAmount = budget ? budget.amount : 0;
    const budgetUsed = budgetAmount > 0 ? ((totalExpenses / budgetAmount) * 100).toFixed(2) : 0;
    const budgetRemaining = budgetAmount - totalExpenses;

    // Get category-wise expenses (current month)
    const categoryExpenses = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: monthStart, $lte: monthEnd }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Calculate overall balance (all-time)
    const allSalaries = await Salary.find({ user: req.user._id });
    const allTimeSalary = allSalaries.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const allExpenses = await Expense.find({ user: req.user._id });
    const allTimeExpenses = allExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    const allMoneyLent = await MoneyLent.find({ user: req.user._id });
    const totalLentOutstanding = allMoneyLent.reduce((sum, l) => {
      return sum + (Number(l.amountRemaining) || 0);
    }, 0);

    const allMoneyBorrowed = await MoneyBorrowed.find({ user: req.user._id });
    const totalBorrowedOutstanding = allMoneyBorrowed.reduce((sum, b) => {
      return sum + (Number(b.amountRemaining) || 0);
    }, 0);

    const balance = Number(allTimeSalary) - Number(allTimeExpenses) - Number(totalLentOutstanding) + Number(totalBorrowedOutstanding);

    res.json({
      balance,
      allTimeSalary,
      allTimeExpenses,
      totalLentOutstanding,
      totalBorrowedOutstanding,
      totalSalary,
      totalExpenses,
      savings,
      savingsRate: parseFloat(savingsRate),
      budgetAmount,
      budgetUsed: parseFloat(budgetUsed),
      budgetRemaining,
      categoryExpenses,
      month: currentMonth,
      year: currentYear
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/monthly-trend
// @desc    Get monthly trend data (last 6 months)
// @access  Private
router.get('/monthly-trend', async (req, res) => {
  try {
    const months = [];
    const currentDate = new Date();

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      // Get expenses for this month
      const expenses = await Expense.find({
        user: req.user._id,
        date: { $gte: monthStart, $lte: monthEnd }
      });
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      // Get salary for this month
      const salaries = await Salary.find({
        user: req.user._id,
        date: { $gte: monthStart, $lte: monthEnd }
      });
      const totalSalary = salaries.reduce((sum, sal) => sum + sal.amount, 0);

      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        expenses: totalExpenses,
        salary: totalSalary,
        savings: totalSalary - totalExpenses
      });
    }

    res.json(months);
  } catch (error) {
    console.error('Get monthly trend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recent-transactions
// @desc    Get recent transactions (expenses and salary)
// @access  Private
router.get('/recent-transactions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent expenses
    const expenses = await Expense.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    // Get recent salary entries
    const salaries = await Salary.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(limit)
      .lean();

    // Combine and format
    const expensesFormatted = expenses.map(exp => ({
      ...exp,
      type: 'expense',
      transactionType: exp.category
    }));

    const salariesFormatted = salaries.map(sal => ({
      ...sal,
      type: 'income',
      transactionType: sal.type
    }));

    // Merge and sort by date
    const allTransactions = [...expensesFormatted, ...salariesFormatted]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);

    res.json(allTransactions);
  } catch (error) {
    console.error('Get recent transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

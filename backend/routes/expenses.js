const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');
const generateNotifications = require('../utils/generateNotifications');

// All routes are protected
router.use(protect);

// @route   GET /api/expenses
// @desc    Get all expenses for logged in user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;
    
    let filter = { user: req.user._id };
    
    // Add date filter if provided
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // Add category filter if provided
    if (category && category !== 'All') {
      filter.category = category;
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/expenses/:id
// @desc    Get single expense
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    res.json(expense);
  } catch (error) {
    console.error('Get expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body;

    if (!title || amount === undefined || amount === null || !category) {
      return res.status(400).json({ message: 'Please provide title, amount, and category' });
    }

    if (isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const expense = await Expense.create({
      user: req.user._id,
      title,
      amount,
      category,
      description,
      date: date || Date.now()
    });

    res.status(201).json(expense);
    // Generate notifications after adding expense
    generateNotifications(req.user._id).catch(() => {});
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    let expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    const { title, amount, category, description, date } = req.body;

    expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { title, amount, category, description, date },
      { new: true, runValidators: true }
    );

    res.json(expense);
    // Generate notifications after updating expense
    generateNotifications(req.user._id).catch(() => {});
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, user: req.user._id });

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
    // Generate notifications after deleting expense
    generateNotifications(req.user._id).catch(() => {});
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/expenses/import-csv
// @desc    Import expenses from CSV data
// @access  Private
router.post('/import-csv', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: 'No data provided' });
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (!row.title || !row.amount || isNaN(Number(row.amount)) || Number(row.amount) <= 0) {
          errors.push({ row: i + 1, message: 'Missing title or invalid amount' });
          continue;
        }
        const expense = await Expense.create({
          user: req.user._id,
          title: row.title.trim(),
          amount: Number(row.amount),
          category: row.category || 'Other',
          description: row.description || '',
          date: row.date ? new Date(row.date) : new Date()
        });
        created.push(expense);
      } catch (err) {
        errors.push({ row: i + 1, message: err.message });
      }
    }

    res.status(201).json({ imported: created.length, errors: errors.length, errorDetails: errors });
  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

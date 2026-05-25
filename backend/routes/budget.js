const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');
const { protect } = require('../middleware/auth');
const generateNotifications = require('../utils/generateNotifications');

// All routes are protected
router.use(protect);

// @route   GET /api/budget
// @desc    Get budgets for logged in user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let filter = { user: req.user._id };
    
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    const budgets = await Budget.find(filter).sort({ year: -1, month: -1 });
    res.json(budgets);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/budget
// @desc    Create or update budget
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { month, year, amount, category } = req.body;

    if (!month || !year || !amount) {
      return res.status(400).json({ message: 'Please provide month, year, and amount' });
    }

    // Check if budget already exists
    const existingBudget = await Budget.findOne({
      user: req.user._id,
      month,
      year,
      category: category || 'Overall'
    });

    if (existingBudget) {
      // Update existing budget
      existingBudget.amount = amount;
      await existingBudget.save();
      generateNotifications(req.user._id).catch(() => {});
      return res.json(existingBudget);
    }

    // Create new budget
    const budget = await Budget.create({
      user: req.user._id,
      month,
      year,
      amount,
      category: category || 'Overall'
    });

    res.status(201).json(budget);
    generateNotifications(req.user._id).catch(() => {});
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/budget/:id
// @desc    Update budget
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    let budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    const { amount } = req.body;

    budget = await Budget.findByIdAndUpdate(
      req.params.id,
      { amount },
      { new: true, runValidators: true }
    );

    res.json(budget);
    generateNotifications(req.user._id).catch(() => {});
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/budget/:id
// @desc    Delete budget
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const budget = await Budget.findOne({ _id: req.params.id, user: req.user._id });

    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    await Budget.findByIdAndDelete(req.params.id);
    res.json({ message: 'Budget deleted successfully' });
    generateNotifications(req.user._id).catch(() => {});
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

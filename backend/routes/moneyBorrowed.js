const express = require('express');
const router = express.Router();
const MoneyBorrowed = require('../models/MoneyBorrowed');
const { protect } = require('../middleware/auth');

// @route   GET /api/money-borrowed
// @desc    Get all money borrowed records
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Auto-cleanup: Delete fully paid records older than 2 days
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    await MoneyBorrowed.deleteMany({
      user: req.user._id,
      isFullyPaid: true,
      paidOffDate: { $lte: twoDaysAgo }
    });

    // Get all remaining records
    const moneyBorrowedRecords = await MoneyBorrowed.find({ user: req.user._id })
      .sort({ date: -1 });

    res.json(moneyBorrowedRecords);
  } catch (error) {
    console.error('Get money borrowed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/money-borrowed
// @desc    Add a new money borrowed record
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { borrowedFrom, date, totalAmount } = req.body;

    // Validation
    if (!borrowedFrom || !totalAmount) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (totalAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const moneyBorrowed = await MoneyBorrowed.create({
      user: req.user._id,
      borrowedFrom,
      date: date || Date.now(),
      totalAmount,
      amountPaid: 0,
      amountRemaining: totalAmount
    });

    res.status(201).json(moneyBorrowed);
  } catch (error) {
    console.error('Add money borrowed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/money-borrowed/:id/payment
// @desc    Record a payment (you paying back)
// @access  Private
router.put('/:id/payment', protect, async (req, res) => {
  try {
    const { amount, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Please provide a valid payment amount' });
    }

    const moneyBorrowed = await MoneyBorrowed.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!moneyBorrowed) {
      return res.status(404).json({ message: 'Money borrowed record not found' });
    }

    // Check if payment exceeds remaining amount
    if (amount > moneyBorrowed.amountRemaining) {
      return res.status(400).json({ 
        message: `Payment amount cannot exceed remaining amount` 
      });
    }

    // Add to payment history
    moneyBorrowed.paymentHistory.push({
      amount,
      date: new Date(),
      note: note || ''
    });

    // Update amount paid
    moneyBorrowed.amountPaid += amount;

    // Save (pre-save hook will update remaining and isFullyPaid)
    await moneyBorrowed.save();

    res.json(moneyBorrowed);
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/money-borrowed/:id
// @desc    Delete a money borrowed record
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const moneyBorrowed = await MoneyBorrowed.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!moneyBorrowed) {
      return res.status(404).json({ message: 'Money borrowed record not found' });
    }

    await moneyBorrowed.deleteOne();
    res.json({ message: 'Money borrowed record deleted' });
  } catch (error) {
    console.error('Delete money borrowed error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/money-borrowed/stats
// @desc    Get money borrowed statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const records = await MoneyBorrowed.find({ user: req.user._id });
    
    const totalBorrowed = records.reduce((sum, record) => sum + record.totalAmount, 0);
    const totalPaidBack = records.reduce((sum, record) => sum + record.amountPaid, 0);
    const totalPending = records.reduce((sum, record) => sum + record.amountRemaining, 0);
    const activeDebts = records.filter(record => !record.isFullyPaid).length;

    res.json({
      totalBorrowed,
      totalPaidBack,
      totalPending,
      activeDebts
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

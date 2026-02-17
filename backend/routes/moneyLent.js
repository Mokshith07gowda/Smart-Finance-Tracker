const express = require('express');
const router = express.Router();
const MoneyLent = require('../models/MoneyLent');
const { protect } = require('../middleware/auth');

// @route   GET /api/money-lent
// @desc    Get all money lent records
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Auto-cleanup: Delete fully paid records older than 2 days
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    
    await MoneyLent.deleteMany({
      user: req.user._id,
      isFullyPaid: true,
      paidOffDate: { $lte: twoDaysAgo }
    });

    // Get all remaining records
    const moneyLentRecords = await MoneyLent.find({ user: req.user._id })
      .sort({ date: -1 });

    res.json(moneyLentRecords);
  } catch (error) {
    console.error('Get money lent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/money-lent
// @desc    Add a new money lent record
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { lentTo, date, totalAmount } = req.body;

    // Validation
    if (!lentTo || !totalAmount) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (totalAmount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const moneyLent = await MoneyLent.create({
      user: req.user._id,
      lentTo,
      date: date || Date.now(),
      totalAmount,
      amountPaid: 0,
      amountRemaining: totalAmount
    });

    res.status(201).json(moneyLent);
  } catch (error) {
    console.error('Add money lent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/money-lent/:id/payment
// @desc    Record a payment
// @access  Private
router.put('/:id/payment', protect, async (req, res) => {
  try {
    const { amount, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Please provide a valid payment amount' });
    }

    const moneyLent = await MoneyLent.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!moneyLent) {
      return res.status(404).json({ message: 'Money lent record not found' });
    }

    // Check if payment exceeds remaining amount
    if (amount > moneyLent.amountRemaining) {
      return res.status(400).json({ 
        message: `Payment amount (₹${amount}) cannot exceed remaining amount (₹${moneyLent.amountRemaining})` 
      });
    }

    // Add to payment history
    moneyLent.paymentHistory.push({
      amount,
      date: new Date(),
      note: note || ''
    });

    // Update amount paid
    moneyLent.amountPaid += amount;

    // Save (pre-save hook will update remaining and isFullyPaid)
    await moneyLent.save();

    res.json(moneyLent);
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/money-lent/:id
// @desc    Delete a money lent record
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const moneyLent = await MoneyLent.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!moneyLent) {
      return res.status(404).json({ message: 'Money lent record not found' });
    }

    await moneyLent.deleteOne();
    res.json({ message: 'Money lent record deleted' });
  } catch (error) {
    console.error('Delete money lent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/money-lent/stats
// @desc    Get money lent statistics
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const records = await MoneyLent.find({ user: req.user._id });
    
    const totalLent = records.reduce((sum, record) => sum + record.totalAmount, 0);
    const totalReceived = records.reduce((sum, record) => sum + record.amountPaid, 0);
    const totalPending = records.reduce((sum, record) => sum + record.amountRemaining, 0);
    const activeLoans = records.filter(record => !record.isFullyPaid).length;

    res.json({
      totalLent,
      totalReceived,
      totalPending,
      activeLoans
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

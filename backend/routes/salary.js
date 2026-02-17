const express = require('express');
const router = express.Router();
const Salary = require('../models/Salary');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// @route   GET /api/salary
// @desc    Get all salary entries for logged in user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    let filter = { user: req.user._id };
    
    // Add date filter if provided
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // Add type filter if provided
    if (type && type !== 'All') {
      filter.type = type;
    }

    const salaries = await Salary.find(filter).sort({ date: -1 });
    res.json(salaries);
  } catch (error) {
    console.error('Get salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/salary/:id
// @desc    Get single salary entry
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const salary = await Salary.findOne({ _id: req.params.id, user: req.user._id });
    
    if (!salary) {
      return res.status(404).json({ message: 'Salary entry not found' });
    }
    
    res.json(salary);
  } catch (error) {
    console.error('Get salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/salary
// @desc    Create new salary entry
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { title, amount, type, description, date } = req.body;

    if (!title || !amount || !type) {
      return res.status(400).json({ message: 'Please provide title, amount, and type' });
    }

    const salary = await Salary.create({
      user: req.user._id,
      title,
      amount,
      type,
      description,
      date: date || Date.now()
    });

    res.status(201).json(salary);
  } catch (error) {
    console.error('Create salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/salary/:id
// @desc    Update salary entry
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    let salary = await Salary.findOne({ _id: req.params.id, user: req.user._id });

    if (!salary) {
      return res.status(404).json({ message: 'Salary entry not found' });
    }

    const { title, amount, type, description, date } = req.body;

    salary = await Salary.findByIdAndUpdate(
      req.params.id,
      { title, amount, type, description, date },
      { new: true, runValidators: true }
    );

    res.json(salary);
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/salary/:id
// @desc    Delete salary entry
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const salary = await Salary.findOne({ _id: req.params.id, user: req.user._id });

    if (!salary) {
      return res.status(404).json({ message: 'Salary entry not found' });
    }

    await Salary.findByIdAndDelete(req.params.id);
    res.json({ message: 'Salary entry deleted successfully' });
  } catch (error) {
    console.error('Delete salary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

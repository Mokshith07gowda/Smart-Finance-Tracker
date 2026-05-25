const express = require('express');
const router = express.Router();
const RecurringExpense = require('../models/RecurringExpense');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const items = await RecurringExpense.find({ user: req.user._id }).sort({ nextDueDate: 1 });
    res.json(items);
  } catch (error) {
    console.error('Get recurring expenses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, amount, category, frequency, dayOfMonth, description } = req.body;
    if (!title || !amount || !category) {
      return res.status(400).json({ message: 'Please provide title, amount, and category' });
    }
    const now = new Date();
    let nextDue = new Date(now.getFullYear(), now.getMonth(), dayOfMonth || 1);
    if (nextDue <= now) {
      if (frequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
      else if (frequency === 'quarterly') nextDue.setMonth(nextDue.getMonth() + 3);
      else if (frequency === 'yearly') nextDue.setFullYear(nextDue.getFullYear() + 1);
      else nextDue.setMonth(nextDue.getMonth() + 1);
    }
    const item = await RecurringExpense.create({ user: req.user._id, title, amount, category, frequency: frequency || 'monthly', dayOfMonth: dayOfMonth || 1, description, nextDueDate: nextDue });
    res.status(201).json(item);
  } catch (error) {
    console.error('Create recurring expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const item = await RecurringExpense.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ message: 'Not found' });
    const { title, amount, category, frequency, dayOfMonth, description, isActive } = req.body;
    const updated = await RecurringExpense.findByIdAndUpdate(req.params.id, { title, amount, category, frequency, dayOfMonth, description, isActive }, { new: true, runValidators: true });
    res.json(updated);
  } catch (error) {
    console.error('Update recurring expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const item = await RecurringExpense.findOne({ _id: req.params.id, user: req.user._id });
    if (!item) return res.status(404).json({ message: 'Not found' });
    await RecurringExpense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('Delete recurring expense error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process due recurring expenses — auto-create expense entries
router.post('/process-due', async (req, res) => {
  try {
    const now = new Date();
    const dueItems = await RecurringExpense.find({ user: req.user._id, isActive: true, nextDueDate: { $lte: now } });
    const created = [];
    for (const item of dueItems) {
      const expense = await Expense.create({
        user: req.user._id,
        title: `${item.title} (Recurring)`,
        amount: item.amount,
        category: item.category,
        description: item.description || `Auto-added recurring ${item.frequency} expense`,
        date: item.nextDueDate,
        isRecurring: true
      });
      created.push(expense);
      // Advance next due date
      const next = new Date(item.nextDueDate);
      if (item.frequency === 'weekly') next.setDate(next.getDate() + 7);
      else if (item.frequency === 'quarterly') next.setMonth(next.getMonth() + 3);
      else if (item.frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
      else next.setMonth(next.getMonth() + 1);
      item.nextDueDate = next;
      item.lastProcessedDate = now;
      await item.save();
    }
    res.json({ processed: created.length, expenses: created });
  } catch (error) {
    console.error('Process recurring error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

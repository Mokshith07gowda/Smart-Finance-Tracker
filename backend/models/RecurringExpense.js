const mongoose = require('mongoose');

const recurringExpenseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: 0
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31,
    default: 1
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  lastProcessedDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

recurringExpenseSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('RecurringExpense', recurringExpenseSchema);

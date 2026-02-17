const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
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
  type: {
    type: String,
    required: [true, 'Please provide a type'],
    enum: ['Monthly Salary', 'Bonus', 'Freelance', 'Investment', 'Other Income']
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
salarySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Salary', salarySchema);

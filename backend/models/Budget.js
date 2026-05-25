const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please provide a budget amount'],
    min: 0
  },
  category: {
    type: String,
    default: 'Overall',
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure unique budget per user, month, year, and category
budgetSchema.index({ user: 1, month: 1, year: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);

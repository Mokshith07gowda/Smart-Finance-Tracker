const mongoose = require('mongoose');

const moneyLentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lentTo: {
    type: String,
    required: [true, 'Please provide the name of the person'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please provide the date'],
    default: Date.now
  },
  totalAmount: {
    type: Number,
    required: [true, 'Please provide the total amount lent'],
    min: [0, 'Amount cannot be negative']
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: [0, 'Amount paid cannot be negative']
  },
  amountRemaining: {
    type: Number,
    default: function() {
      return this.totalAmount;
    }
  },
  paymentHistory: [{
    amount: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  isFullyPaid: {
    type: Boolean,
    default: false
  },
  paidOffDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Update amountRemaining before saving
moneyLentSchema.pre('save', function(next) {
  this.amountRemaining = this.totalAmount - this.amountPaid;
  
  // Check if fully paid
  if (this.amountRemaining <= 0) {
    this.isFullyPaid = true;
    if (!this.paidOffDate) {
      this.paidOffDate = new Date();
    }
  } else {
    this.isFullyPaid = false;
    this.paidOffDate = undefined;
  }
  
  next();
});

module.exports = mongoose.model('MoneyLent', moneyLentSchema);

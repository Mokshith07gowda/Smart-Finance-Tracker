const mongoose = require('mongoose');

const splitParticipantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
});

const splitBillSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  paidBy: {
    type: String,
    required: true,
    trim: true
  },
  splitType: {
    type: String,
    enum: ['equally', 'unequally'],
    required: true
  },
  participants: [splitParticipantSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SplitBill', splitBillSchema);

const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  trigger: {
    type: { type: String, enum: ['budget_threshold', 'spending_limit', 'savings_below', 'category_limit', 'unusual_spending', 'recurring_due', 'goal_behind'], required: true },
    category: { type: String },
    threshold: { type: Number },
    operator: { type: String, enum: ['>', '<', '>=', '<=', '=='], default: '>' }
  },
  action: {
    type: { type: String, enum: ['notify', 'flag', 'suggest_reduction', 'auto_save'], required: true },
    message: { type: String },
    severity: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' }
  },
  lastTriggered: { type: Date },
  triggerCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Rule', ruleSchema);

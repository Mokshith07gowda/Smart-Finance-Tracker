const express = require('express');
const router = express.Router();
const Rule = require('../models/Rule');
const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET /api/rules
router.get('/', async (req, res) => {
  try {
    const rules = await Rule.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/rules
router.post('/', async (req, res) => {
  try {
    const rule = await Rule.create({ ...req.body, user: req.user._id });
    res.status(201).json(rule);
  } catch (err) {
    console.error('Create rule error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/rules/:id
router.put('/:id', async (req, res) => {
  try {
    const rule = await Rule.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!rule) return res.status(404).json({ message: 'Rule not found' });
    res.json(rule);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/rules/:id
router.delete('/:id', async (req, res) => {
  try {
    await Rule.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/rules/evaluate — evaluate all active rules
router.post('/evaluate', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [rules, expenses, salaries, budgets, goals] = await Promise.all([
      Rule.find({ user: userId, isActive: true }),
      Expense.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Salary.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Budget.find({ user: userId, month: now.getMonth() + 1, year: now.getFullYear() }),
      Goal.find({ user: userId, isCompleted: false })
    ]);

    const totalIncome = salaries.reduce((s, e) => s + e.amount, 0);
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
    const savings = totalIncome - totalExpense;
    const catSpend = {};
    expenses.forEach(e => { catSpend[e.category] = (catSpend[e.category] || 0) + e.amount; });
    const budgetMap = {};
    budgets.forEach(b => { budgetMap[b.category] = b.amount; });

    const triggered = [];

    for (const rule of rules) {
      let shouldTrigger = false;
      let contextMsg = '';

      switch (rule.trigger.type) {
        case 'budget_threshold': {
          const cat = rule.trigger.category || 'Overall';
          const budget = budgetMap[cat] || 0;
          const spent = cat === 'Overall' ? totalExpense : (catSpend[cat] || 0);
          const pct = budget > 0 ? (spent / budget) * 100 : 0;
          shouldTrigger = compare(pct, rule.trigger.operator, rule.trigger.threshold);
          contextMsg = `${cat} budget is ${Math.round(pct)}% used.`;
          break;
        }
        case 'spending_limit': {
          const cat = rule.trigger.category;
          const spent = cat ? (catSpend[cat] || 0) : totalExpense;
          shouldTrigger = compare(spent, rule.trigger.operator, rule.trigger.threshold);
          contextMsg = `${cat || 'Total'} spending: ₹${Math.round(spent)}.`;
          break;
        }
        case 'savings_below': {
          shouldTrigger = compare(savings, rule.trigger.operator, rule.trigger.threshold);
          contextMsg = `Current savings: ₹${Math.round(savings)}.`;
          break;
        }
        case 'category_limit': {
          const cat = rule.trigger.category;
          const spent = catSpend[cat] || 0;
          shouldTrigger = compare(spent, rule.trigger.operator, rule.trigger.threshold);
          contextMsg = `${cat} spending: ₹${Math.round(spent)}.`;
          break;
        }
        case 'goal_behind': {
          for (const g of goals) {
            const monthsLeft = Math.max(1, Math.ceil((new Date(g.targetDate) - now) / (1000 * 60 * 60 * 24 * 30)));
            const needed = (g.targetAmount - g.savedAmount) / monthsLeft;
            if (needed > savings * (rule.trigger.threshold / 100 || 0.5)) {
              shouldTrigger = true;
              contextMsg = `Goal "${g.title}" needs ₹${Math.round(needed)}/mo but savings are ₹${Math.round(savings)}.`;
              break;
            }
          }
          break;
        }
      }

      if (shouldTrigger) {
        // Avoid repeated triggers within 12 hours
        if (rule.lastTriggered && (now - rule.lastTriggered) < 12 * 60 * 60 * 1000) continue;

        await Rule.findByIdAndUpdate(rule._id, { lastTriggered: now, $inc: { triggerCount: 1 } });

        const message = rule.action.message ? `${rule.action.message} ${contextMsg}` : contextMsg;
        await Notification.create({
          user: userId,
          type: 'rule_triggered',
          title: `Rule: ${rule.name}`,
          message,
          icon: rule.action.severity === 'critical' ? '🚨' : rule.action.severity === 'warning' ? '⚠️' : 'ℹ️',
          priority: rule.action.severity === 'critical' ? 'critical' : rule.action.severity === 'warning' ? 'high' : 'medium'
        });

        triggered.push({ ruleId: rule._id, name: rule.name, context: contextMsg });
      }
    }

    res.json({ evaluated: rules.length, triggered: triggered.length, details: triggered });
  } catch (err) {
    console.error('Evaluate rules error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

function compare(value, operator, threshold) {
  switch (operator) {
    case '>': return value > threshold;
    case '<': return value < threshold;
    case '>=': return value >= threshold;
    case '<=': return value <= threshold;
    case '==': return value === threshold;
    default: return value > threshold;
  }
}

module.exports = router;

const Notification = require('../models/Notification');
const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const RecurringExpense = require('../models/RecurringExpense');

/**
 * Generate smart notifications for a user.
 * Only creates notifications that don't already exist in the last 24 hours (by type+title).
 * Called after expense/budget/salary/goal mutations — NOT on page refresh.
 */
async function generateNotifications(userId) {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const [expenses, salaries, budgets, goals, recurring] = await Promise.all([
      Expense.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Salary.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Budget.find({ user: userId, month: now.getMonth() + 1, year: now.getFullYear() }),
      Goal.find({ user: userId, isCompleted: false }),
      RecurringExpense.find({ user: userId, isActive: true })
    ]);

    const totalIncome = salaries.reduce((s, e) => s + e.amount, 0);
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
    const catSpend = {};
    expenses.forEach(e => { catSpend[e.category] = (catSpend[e.category] || 0) + e.amount; });

    const generated = [];

    // 1. Budget alerts — only when over 85% or exceeded
    budgets.forEach(b => {
      const spent = b.category === 'Overall' ? totalExpense : (catSpend[b.category] || 0);
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      if (pct >= 100) {
        generated.push({ type: 'budget_alert', title: `Budget Exceeded: ${b.category}`, message: `Your ${b.category} budget has been exceeded by ₹${Math.round(spent - b.amount)}.`, icon: '🚨', priority: 'critical', actionUrl: '/budget' });
      } else if (pct >= 85) {
        generated.push({ type: 'budget_alert', title: `Budget Warning: ${b.category}`, message: `${b.category} budget is ${Math.round(pct)}% used. Only ₹${Math.round(b.amount - spent)} remaining.`, icon: '⚠️', priority: 'high', actionUrl: '/budget' });
      }
    });

    // 2. Spending anomaly — today way above daily average
    const dailyAvg = dayOfMonth > 0 ? totalExpense / dayOfMonth : 0;
    const todayExpenses = expenses.filter(e => new Date(e.date).getDate() === dayOfMonth);
    const todayTotal = todayExpenses.reduce((s, e) => s + e.amount, 0);
    if (todayTotal > dailyAvg * 2.5 && dailyAvg > 0) {
      generated.push({ type: 'anomaly', title: 'Unusual Spending Detected', message: `Today's spending (₹${Math.round(todayTotal)}) is ${Math.round(todayTotal / dailyAvg)}x your daily average.`, icon: '🔍', priority: 'high', actionUrl: '/expenses' });
    }

    // 3. Low balance risk
    const remaining = totalIncome - totalExpense;
    const predictedSpend = dailyAvg * (daysInMonth - dayOfMonth);
    if (remaining > 0 && remaining < predictedSpend && dayOfMonth < daysInMonth - 5) {
      generated.push({ type: 'spending_alert', title: 'Low Balance Risk', message: `At current rate, you may run short ₹${Math.round(predictedSpend - remaining)} before month-end.`, icon: '💸', priority: 'high', actionUrl: '/dashboard' });
    }

    // 4. Recurring expense reminders
    recurring.forEach(r => {
      const daysUntilDue = Math.ceil((new Date(r.nextDueDate) - now) / (1000 * 60 * 60 * 24));
      if (daysUntilDue >= 0 && daysUntilDue <= 3) {
        generated.push({ type: 'subscription_reminder', title: `Upcoming: ${r.title}`, message: `${r.title} (₹${Math.round(r.amount)}) is due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day(s)`}.`, icon: '📅', priority: 'medium', actionUrl: '/recurring-expenses' });
      }
    });

    // 5. Goal progress
    const savings = totalIncome - totalExpense;
    goals.forEach(g => {
      const pct = g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0;
      const monthsLeft = Math.max(1, Math.ceil((new Date(g.targetDate) - now) / (1000 * 60 * 60 * 24 * 30)));
      const monthlyNeeded = (g.targetAmount - g.savedAmount) / monthsLeft;
      if (pct >= 90 && !g.isCompleted) {
        generated.push({ type: 'goal_progress', title: `Goal Almost Complete: ${g.title}`, message: `"${g.title}" is ${Math.round(pct)}% complete. Just ₹${Math.round(g.targetAmount - g.savedAmount)} to go!`, icon: '🎯', priority: 'medium', actionUrl: '/goals' });
      } else if (monthlyNeeded > savings * 0.5 && monthsLeft <= 3) {
        generated.push({ type: 'goal_progress', title: `Goal At Risk: ${g.title}`, message: `"${g.title}" needs ₹${Math.round(monthlyNeeded)}/month but savings are ₹${Math.round(savings)}.`, icon: '⏰', priority: 'high', actionUrl: '/goals' });
      }
    });

    // Deduplicate: don't create if same type+title exists in last 24 hours
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentNotifs = await Notification.find({ user: userId, createdAt: { $gte: twentyFourHoursAgo } });
    const recentKeys = new Set(recentNotifs.map(n => `${n.type}::${n.title}`));

    const toCreate = generated.filter(n => !recentKeys.has(`${n.type}::${n.title}`));
    if (toCreate.length > 0) {
      await Notification.insertMany(toCreate.map(n => ({ ...n, user: userId })));
    }

    return { generated: toCreate.length, total: generated.length };
  } catch (err) {
    console.error('Generate notifications error:', err);
    return { generated: 0, total: 0, error: err.message };
  }
}

module.exports = generateNotifications;

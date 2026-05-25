const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
const Budget = require('../models/Budget');
const MoneyLent = require('../models/MoneyLent');
const MoneyBorrowed = require('../models/MoneyBorrowed');
const Goal = require('../models/Goal');
const RecurringExpense = require('../models/RecurringExpense');
const { protect } = require('../middleware/auth');

router.use(protect);

// ─── Keyword → Category mapping for auto-categorization ───
const CATEGORY_KEYWORDS = {
  Food: ['swiggy','zomato','uber eats','restaurant','cafe','pizza','burger','biryani','food','grocery','groceries','supermarket','bigbasket','blinkit','zepto','instamart','dunzo','dominos','mcdonalds','kfc','starbucks','chai','tea','coffee','bakery','milk','bread','snack','lunch','dinner','breakfast','canteen','mess','tiffin','dine','eat'],
  Travel: ['uber','ola','rapido','metro','bus','train','flight','petrol','diesel','fuel','toll','parking','auto','cab','taxi','lyft','irctc','redbus','makemytrip','goibibo','cleartrip','airlines','airport','ticket','commute','gas'],
  Bills: ['electricity','water','gas bill','internet','wifi','broadband','phone','recharge','jio','airtel','vi','bsnl','postpaid','prepaid','dth','tata sky','maintenance','society','rent','emi','loan','insurance','premium','tax','gst'],
  Entertainment: ['netflix','prime','hotstar','spotify','youtube','movie','cinema','pvr','inox','game','gaming','playstation','xbox','steam','concert','event','show','theatre','disney','zee5','sonyliv','jiocinema','apple tv','hbo','subscription'],
  Healthcare: ['hospital','doctor','medicine','pharmacy','medical','health','gym','fitness','yoga','lab','test','scan','dental','eye','clinic','apollo','medplus','1mg','pharmeasy','netmeds','consultation','therapy'],
  Shopping: ['amazon','flipkart','myntra','ajio','meesho','nykaa','clothes','shoes','electronics','gadget','phone','laptop','headphone','watch','jewellery','furniture','home','decor','ikea','croma','reliance digital','shopping','mall','market','purchase','buy'],
  Education: ['course','book','udemy','coursera','class','tuition','school','college','university','exam','fee','certification','training','workshop','tutorial','skillshare','unacademy','byju','chegg','library','stationery','notebook','pen'],
  Savings: ['investment','mutual fund','sip','stock','share','deposit','fd','rd','ppf','nps','gold','crypto','bitcoin','zerodha','groww','upstox','kuvera','savings','lumpsum'],
  Utilities: ['repair','plumber','electrician','carpenter','laundry','dry clean','ironing','maid','cook','cleaning','pest control','painting','service','appliance','ac service']
};

function autoCategorize(title) {
  const lower = (title || '').toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  return null;
}

// ─── GET /api/smart/suggest-category ───
router.get('/suggest-category', (req, res) => {
  const { title } = req.query;
  const suggested = autoCategorize(title);
  res.json({ suggested: suggested || 'Other' });
});

// ─── GET /api/smart/financial-health ───
router.get('/financial-health', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Fetch all data
    const [monthExpenses, monthSalaries, budgets, allExpenses3m, allSalaries3m, lent, borrowed, goals] = await Promise.all([
      Expense.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Salary.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Budget.find({ user: userId, month: now.getMonth() + 1, year: now.getFullYear() }),
      Expense.find({ user: userId, date: { $gte: new Date(now.getFullYear(), now.getMonth() - 2, 1), $lte: monthEnd } }),
      Salary.find({ user: userId, date: { $gte: new Date(now.getFullYear(), now.getMonth() - 2, 1), $lte: monthEnd } }),
      MoneyLent.find({ user: userId }),
      MoneyBorrowed.find({ user: userId }),
      Goal.find({ user: userId, isCompleted: false })
    ]);

    const totalIncome = monthSalaries.reduce((s, e) => s + e.amount, 0);
    const totalExpense = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    const totalDebt = borrowed.reduce((s, b) => s + (b.amountRemaining || 0), 0);
    const debtRatio = totalIncome > 0 ? (totalDebt / (totalIncome * 12)) * 100 : 0;

    // Budget discipline: how many category budgets are NOT exceeded
    let budgetScore = 100;
    const categoryBudgets = budgets.filter(b => b.category !== 'Overall');
    if (categoryBudgets.length > 0) {
      const catExpenseMap = {};
      monthExpenses.forEach(e => { catExpenseMap[e.category] = (catExpenseMap[e.category] || 0) + e.amount; });
      let exceeded = 0;
      categoryBudgets.forEach(b => {
        if ((catExpenseMap[b.category] || 0) > b.amount) exceeded++;
      });
      budgetScore = Math.round(((categoryBudgets.length - exceeded) / categoryBudgets.length) * 100);
    }

    // Spending consistency (lower std deviation = better)
    const dailySpend = {};
    monthExpenses.forEach(e => {
      const day = new Date(e.date).getDate();
      dailySpend[day] = (dailySpend[day] || 0) + e.amount;
    });
    const dailyValues = Object.values(dailySpend);
    const avgDaily = dailyValues.length > 0 ? dailyValues.reduce((a, b) => a + b, 0) / dailyValues.length : 0;
    const variance = dailyValues.length > 0 ? dailyValues.reduce((s, v) => s + Math.pow(v - avgDaily, 2), 0) / dailyValues.length : 0;
    const stdDev = Math.sqrt(variance);
    const consistencyScore = avgDaily > 0 ? Math.max(0, 100 - (stdDev / avgDaily) * 50) : 100;

    // Overspending frequency (last 3 months)
    const overallBudgets3m = await Budget.find({ user: userId, category: 'Overall', year: { $gte: now.getFullYear() - 1 } });
    let overSpendMonths = 0;
    const monthMap = {};
    allExpenses3m.forEach(e => {
      const key = `${new Date(e.date).getMonth() + 1}-${new Date(e.date).getFullYear()}`;
      monthMap[key] = (monthMap[key] || 0) + e.amount;
    });
    overallBudgets3m.forEach(b => {
      const key = `${b.month}-${b.year}`;
      if (monthMap[key] && monthMap[key] > b.amount) overSpendMonths++;
    });
    const overspendScore = overallBudgets3m.length > 0 ? Math.max(0, 100 - (overSpendMonths / overallBudgets3m.length) * 100) : 80;

    // Calculate weighted score
    const score = Math.round(
      (Math.min(100, Math.max(0, savingsRate * 2)) * 0.30) +  // savings 30%
      (budgetScore * 0.25) +                                    // budget discipline 25%
      (Math.min(100, consistencyScore) * 0.15) +                // consistency 15%
      (Math.max(0, 100 - debtRatio) * 0.15) +                  // debt 15%
      (overspendScore * 0.15)                                   // overspend history 15%
    );

    // Generate improvement suggestions
    const suggestions = [];
    if (savingsRate < 20) suggestions.push({ text: `Your savings rate is ${savingsRate.toFixed(0)}%. Aim for at least 20% of income.`, impact: '+8 points', type: 'savings' });
    if (budgetScore < 80) suggestions.push({ text: 'Some category budgets are exceeded. Reduce non-essential spending.', impact: '+6 points', type: 'budget' });
    if (debtRatio > 40) suggestions.push({ text: `Debt is ${debtRatio.toFixed(0)}% of annual income. Focus on reducing borrowings.`, impact: '+5 points', type: 'debt' });

    // Find biggest expense category for specific suggestion
    const catTotals = {};
    monthExpenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && totalIncome > 0) {
      const [topCat, topAmt] = sorted[0];
      const pct = ((topAmt / totalIncome) * 100).toFixed(0);
      if (pct > 30) suggestions.push({ text: `Reducing ${topCat} expenses (${pct}% of income) can improve your score by 5-8 points.`, impact: '+5 points', type: 'category' });
    }

    res.json({
      score: Math.min(100, Math.max(0, score)),
      breakdown: {
        savingsScore: Math.round(Math.min(100, Math.max(0, savingsRate * 2))),
        budgetScore,
        consistencyScore: Math.round(consistencyScore),
        debtScore: Math.round(Math.max(0, 100 - debtRatio)),
        overspendScore: Math.round(overspendScore)
      },
      savingsRate: Math.round(savingsRate),
      debtRatio: Math.round(debtRatio),
      suggestions
    });
  } catch (error) {
    console.error('Financial health error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/smart/predictions ───
router.get('/predictions', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [monthExpenses, budgets, monthSalaries] = await Promise.all([
      Expense.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Budget.find({ user: userId, month: now.getMonth() + 1, year: now.getFullYear() }),
      Salary.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } })
    ]);

    const totalSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = monthSalaries.reduce((s, e) => s + e.amount, 0);
    const dailyAvg = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
    const predictedTotal = dailyAvg * daysInMonth;
    const daysRemaining = daysInMonth - dayOfMonth;
    const predictedRemaining = dailyAvg * daysRemaining;

    // Category-wise predictions
    const catSpend = {};
    monthExpenses.forEach(e => { catSpend[e.category] = (catSpend[e.category] || 0) + e.amount; });
    const catPredictions = [];
    const budgetMap = {};
    budgets.forEach(b => { budgetMap[b.category] = b.amount; });

    for (const [cat, spent] of Object.entries(catSpend)) {
      const catDailyAvg = spent / dayOfMonth;
      const catPredicted = catDailyAvg * daysInMonth;
      const budget = budgetMap[cat] || 0;
      catPredictions.push({
        category: cat,
        spent,
        dailyAvg: Math.round(catDailyAvg),
        predictedTotal: Math.round(catPredicted),
        budget,
        willExceed: budget > 0 && catPredicted > budget,
        excessAmount: budget > 0 ? Math.round(catPredicted - budget) : 0,
        percentUsed: budget > 0 ? Math.round((spent / budget) * 100) : 0
      });
    }

    // Spending velocity (trend: increasing or decreasing?)
    const firstHalf = monthExpenses.filter(e => new Date(e.date).getDate() <= Math.floor(dayOfMonth / 2));
    const secondHalf = monthExpenses.filter(e => new Date(e.date).getDate() > Math.floor(dayOfMonth / 2));
    const firstHalfTotal = firstHalf.reduce((s, e) => s + e.amount, 0);
    const secondHalfTotal = secondHalf.reduce((s, e) => s + e.amount, 0);
    const halfDays = Math.floor(dayOfMonth / 2) || 1;
    const secondHalfDays = dayOfMonth - halfDays || 1;
    const velocity = secondHalfDays > 0 && halfDays > 0
      ? ((secondHalfTotal / secondHalfDays) - (firstHalfTotal / halfDays)) / (firstHalfTotal / halfDays || 1) * 100
      : 0;

    // Overall budget prediction
    const overallBudget = budgetMap['Overall'] || 0;

    // Predicted balance at end of month
    const predictedBalance = totalIncome - predictedTotal;

    res.json({
      dayOfMonth,
      daysInMonth,
      daysRemaining,
      totalSpent: Math.round(totalSpent),
      dailyAvg: Math.round(dailyAvg),
      predictedTotal: Math.round(predictedTotal),
      predictedRemaining: Math.round(predictedRemaining),
      predictedBalance: Math.round(predictedBalance),
      totalIncome: Math.round(totalIncome),
      overallBudget: Math.round(overallBudget),
      willExceedOverall: overallBudget > 0 && predictedTotal > overallBudget,
      overallExcess: overallBudget > 0 ? Math.round(predictedTotal - overallBudget) : 0,
      spendingVelocity: Math.round(velocity),
      velocityTrend: velocity > 10 ? 'increasing' : velocity < -10 ? 'decreasing' : 'stable',
      categoryPredictions: catPredictions.sort((a, b) => b.spent - a.spent)
    });
  } catch (error) {
    console.error('Predictions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/smart/insights ───
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    const [currentExpenses, prevExpenses, threeMonthExpenses, currentSalaries, prevSalaries] = await Promise.all([
      Expense.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Expense.find({ user: userId, date: { $gte: prevMonthStart, $lte: prevMonthEnd } }),
      Expense.find({ user: userId, date: { $gte: threeMonthsAgo, $lte: monthEnd } }),
      Salary.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Salary.find({ user: userId, date: { $gte: prevMonthStart, $lte: prevMonthEnd } })
    ]);

    const insights = [];
    const currentTotal = currentExpenses.reduce((s, e) => s + e.amount, 0);
    const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
    const currentIncome = currentSalaries.reduce((s, e) => s + e.amount, 0);
    const prevIncome = prevSalaries.reduce((s, e) => s + e.amount, 0);

    // 1. Month-over-month spending change
    if (prevTotal > 0) {
      const change = ((currentTotal - prevTotal) / prevTotal * 100).toFixed(0);
      if (change > 15) {
        insights.push({ type: 'warning', icon: '📈', text: `Spending is up ${change}% compared to last month.`, priority: 'high' });
      } else if (change < -10) {
        insights.push({ type: 'positive', icon: '🎉', text: `Great! Spending dropped ${Math.abs(change)}% compared to last month.`, priority: 'medium' });
      }
    }

    // 2. Weekend vs weekday spending
    let weekendSpend = 0, weekdaySpend = 0, weekendDays = 0, weekdayDays = 0;
    currentExpenses.forEach(e => {
      const day = new Date(e.date).getDay();
      if (day === 0 || day === 6) { weekendSpend += e.amount; } else { weekdaySpend += e.amount; }
    });
    // Count weekday/weekend days passed this month
    for (let d = 1; d <= now.getDate(); d++) {
      const dt = new Date(now.getFullYear(), now.getMonth(), d);
      if (dt.getDay() === 0 || dt.getDay() === 6) weekendDays++; else weekdayDays++;
    }
    const avgWeekend = weekendDays > 0 ? weekendSpend / weekendDays : 0;
    const avgWeekday = weekdayDays > 0 ? weekdaySpend / weekdayDays : 0;
    if (avgWeekend > avgWeekday * 1.3 && avgWeekday > 0) {
      const pct = Math.round(((avgWeekend - avgWeekday) / avgWeekday) * 100);
      insights.push({ type: 'info', icon: '📊', text: `You spend ${pct}% more on weekends than weekdays.`, priority: 'medium' });
    }

    // 3. Category trends (3-month increasing)
    const catByMonth = {};
    threeMonthExpenses.forEach(e => {
      const mKey = `${new Date(e.date).getFullYear()}-${new Date(e.date).getMonth()}`;
      if (!catByMonth[e.category]) catByMonth[e.category] = {};
      catByMonth[e.category][mKey] = (catByMonth[e.category][mKey] || 0) + e.amount;
    });
    for (const [cat, months] of Object.entries(catByMonth)) {
      const vals = Object.values(months);
      if (vals.length >= 3 && vals[vals.length - 1] > vals[vals.length - 2] && vals[vals.length - 2] > vals[vals.length - 3]) {
        insights.push({ type: 'warning', icon: '⚠️', text: `${cat} expenses have increased for 3 consecutive months.`, priority: 'high' });
      }
    }

    // 4. Biggest category this month
    const catTotals = {};
    currentExpenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    if (sortedCats.length > 0 && currentIncome > 0) {
      const [topCat, topAmt] = sortedCats[0];
      const pct = Math.round((topAmt / currentIncome) * 100);
      insights.push({ type: 'info', icon: '💰', text: `${topCat} is your biggest expense this month (${pct}% of income).`, priority: 'medium' });
    }

    // 5. Savings vs expenses comparison
    if (currentIncome > 0) {
      const expenseRatio = (currentTotal / currentIncome * 100).toFixed(0);
      if (expenseRatio > 90) {
        insights.push({ type: 'danger', icon: '🚨', text: `You've spent ${expenseRatio}% of your income this month. Almost nothing saved!`, priority: 'high' });
      } else if (expenseRatio < 50) {
        insights.push({ type: 'positive', icon: '⭐', text: `Excellent! You've only spent ${expenseRatio}% of income. Great savings discipline!`, priority: 'low' });
      }
    }

    // 6. Income change
    if (prevIncome > 0 && currentIncome > 0) {
      const incomeChange = ((currentIncome - prevIncome) / prevIncome * 100).toFixed(0);
      if (incomeChange > 10) {
        insights.push({ type: 'positive', icon: '📈', text: `Income increased by ${incomeChange}% this month. Consider boosting savings!`, priority: 'medium' });
      } else if (incomeChange < -10) {
        insights.push({ type: 'warning', icon: '📉', text: `Income dropped ${Math.abs(incomeChange)}% this month. Watch your spending.`, priority: 'high' });
      }
    }

    // 7. Top spending day pattern
    const daySpend = {};
    currentExpenses.forEach(e => {
      const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(e.date).getDay()];
      daySpend[dayName] = (daySpend[dayName] || 0) + e.amount;
    });
    const sortedDays = Object.entries(daySpend).sort((a, b) => b[1] - a[1]);
    if (sortedDays.length > 0) {
      insights.push({ type: 'info', icon: '📅', text: `You spend the most on ${sortedDays[0][0]}s.`, priority: 'low' });
    }

    // 8. Average transaction size trend
    if (currentExpenses.length > 5) {
      const avgTx = currentTotal / currentExpenses.length;
      const prevAvgTx = prevExpenses.length > 0 ? prevTotal / prevExpenses.length : 0;
      if (prevAvgTx > 0 && avgTx > prevAvgTx * 1.25) {
        insights.push({ type: 'info', icon: '💳', text: `Your average transaction size increased by ${Math.round((avgTx - prevAvgTx) / prevAvgTx * 100)}% this month.`, priority: 'medium' });
      }
    }

    res.json({ insights: insights.sort((a, b) => { const p = { high: 0, medium: 1, low: 2 }; return (p[a.priority] || 2) - (p[b.priority] || 2); }) });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/smart/budget-alerts ───
router.get('/budget-alerts', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [expenses, budgets] = await Promise.all([
      Expense.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Budget.find({ user: userId, month: now.getMonth() + 1, year: now.getFullYear() })
    ]);

    const catSpend = {};
    expenses.forEach(e => { catSpend[e.category] = (catSpend[e.category] || 0) + e.amount; });
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

    const alerts = [];
    const dayProgress = dayOfMonth / daysInMonth;

    budgets.forEach(b => {
      const spent = b.category === 'Overall' ? totalExpense : (catSpend[b.category] || 0);
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      const remaining = b.amount - spent;
      const label = b.category === 'Overall' ? 'Overall budget' : `${b.category} budget`;

      if (pct >= 100) {
        const excess = Math.round(spent - b.amount);
        alerts.push({
          type: 'danger',
          icon: '🚨',
          category: b.category,
          text: `${label} exceeded by ₹${excess}!`,
          detail: `Spent: ₹${Math.round(spent)} / Budget: ₹${Math.round(b.amount)}`,
          pct: Math.round(pct),
          priority: 'critical'
        });
      } else if (pct >= 80) {
        alerts.push({
          type: 'warning',
          icon: '⚠️',
          category: b.category,
          text: `${label} is ${Math.round(pct)}% used. Only ₹${Math.round(remaining)} left.`,
          detail: `Reduce spending to stay within budget.`,
          pct: Math.round(pct),
          priority: 'high'
        });
      } else if (pct >= 50 && dayProgress < 0.5) {
        alerts.push({
          type: 'caution',
          icon: '⏳',
          category: b.category,
          text: `${label} is already ${Math.round(pct)}% used in the first half of the month.`,
          detail: `At this rate, you may exceed the budget.`,
          pct: Math.round(pct),
          priority: 'medium'
        });
      }
    });

    // Savings suggestion for underused budgets
    budgets.forEach(b => {
      if (b.category === 'Overall') return;
      const spent = catSpend[b.category] || 0;
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0;
      if (dayProgress > 0.75 && pct < 40 && b.amount > 0) {
        const unused = Math.round(b.amount - spent);
        alerts.push({
          type: 'savings',
          icon: '💡',
          category: b.category,
          text: `₹${unused} unused in ${b.category} budget. Consider moving to savings?`,
          detail: `Only ${Math.round(pct)}% used with ${daysInMonth - dayOfMonth} days left.`,
          pct: Math.round(pct),
          priority: 'low'
        });
      }
    });

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3));

    res.json({ alerts });
  } catch (error) {
    console.error('Budget alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/smart/category-budgets ───
router.get('/category-budgets', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    const [expenses, budgets] = await Promise.all([
      Expense.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Budget.find({ user: userId, month: now.getMonth() + 1, year: now.getFullYear() })
    ]);

    const catSpend = {};
    const catCount = {};
    expenses.forEach(e => {
      catSpend[e.category] = (catSpend[e.category] || 0) + e.amount;
      catCount[e.category] = (catCount[e.category] || 0) + 1;
    });

    const budgetMap = {};
    budgets.forEach(b => { budgetMap[b.category] = b; });

    // Merge all categories (budgeted + spent)
    const allCats = new Set([...Object.keys(catSpend), ...budgets.map(b => b.category)]);
    const result = [];

    allCats.forEach(cat => {
      const budget = budgetMap[cat];
      const spent = catSpend[cat] || 0;
      const allocated = budget ? budget.amount : 0;
      const remaining = allocated - spent;
      const pctUsed = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
      const dailyAvg = dayOfMonth > 0 ? spent / dayOfMonth : 0;
      const predictedTotal = dailyAvg * daysInMonth;
      const txCount = catCount[cat] || 0;

      result.push({
        category: cat,
        allocated: Math.round(allocated),
        spent: Math.round(spent),
        remaining: Math.round(remaining),
        pctUsed,
        dailyAvg: Math.round(dailyAvg),
        predictedTotal: Math.round(predictedTotal),
        willExceed: allocated > 0 && predictedTotal > allocated,
        txCount,
        hasBudget: allocated > 0,
        status: allocated === 0 ? 'no-budget' : pctUsed >= 100 ? 'exceeded' : pctUsed >= 80 ? 'warning' : pctUsed >= 50 ? 'caution' : 'good'
      });
    });

    result.sort((a, b) => b.spent - a.spent);

    res.json({ categoryBudgets: result });
  } catch (error) {
    console.error('Category budgets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/smart/salary-tracker ───
router.get('/salary-tracker', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

    // Detect salary cycle (find most common salary day)
    const allSalaries = await Salary.find({ user: userId, type: 'Monthly Salary' }).sort({ date: -1 }).limit(12);
    let salaryCycleDay = 1;
    if (allSalaries.length >= 2) {
      const days = allSalaries.map(s => new Date(s.date).getDate());
      const freq = {};
      days.forEach(d => { freq[d] = (freq[d] || 0) + 1; });
      salaryCycleDay = parseInt(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]);
    }

    // Next salary date
    let nextSalaryDate = new Date(now.getFullYear(), now.getMonth(), salaryCycleDay);
    if (nextSalaryDate <= now) {
      nextSalaryDate = new Date(now.getFullYear(), now.getMonth() + 1, salaryCycleDay);
    }
    const daysUntilSalary = Math.ceil((nextSalaryDate - now) / (1000 * 60 * 60 * 24));

    // Current month data
    const [monthSalaries, monthExpenses] = await Promise.all([
      Salary.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Expense.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } })
    ]);

    const totalIncome = monthSalaries.reduce((s, e) => s + e.amount, 0);
    const totalExpense = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const remaining = totalIncome - totalExpense;
    const dailyAvgExpense = now.getDate() > 0 ? totalExpense / now.getDate() : 0;
    const expectedRemainingAtSalary = remaining - (dailyAvgExpense * daysUntilSalary);

    // Income sources breakdown
    const incomeSources = {};
    monthSalaries.forEach(s => {
      incomeSources[s.type] = (incomeSources[s.type] || 0) + s.amount;
    });

    res.json({
      totalIncome: Math.round(totalIncome),
      totalExpense: Math.round(totalExpense),
      remaining: Math.round(remaining),
      salaryCycleDay,
      nextSalaryDate: nextSalaryDate.toISOString(),
      daysUntilSalary,
      dailyAvgExpense: Math.round(dailyAvgExpense),
      expectedRemainingAtSalary: Math.round(expectedRemainingAtSalary),
      incomeSources: Object.entries(incomeSources).map(([type, amount]) => ({ type, amount: Math.round(amount) })),
      daysInMonth
    });
  } catch (error) {
    console.error('Salary tracker error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── POST /api/smart/ai-chat ───
router.post('/ai-chat', async (req, res) => {
  try {
    const userId = req.user._id;
    const { question } = req.body;
    if (!question) return res.status(400).json({ message: 'Please provide a question' });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [expenses, salaries, budgets, lent, borrowed, goals] = await Promise.all([
      Expense.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Salary.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Budget.find({ user: userId, month: now.getMonth() + 1, year: now.getFullYear() }),
      MoneyLent.find({ user: userId }),
      MoneyBorrowed.find({ user: userId }),
      Goal.find({ user: userId, isCompleted: false })
    ]);

    const totalIncome = salaries.reduce((s, e) => s + e.amount, 0);
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
    const savings = totalIncome - totalExpense;
    const catTotals = {};
    expenses.forEach(e => { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
    const lentOutstanding = lent.reduce((s, l) => s + (l.amountRemaining || 0), 0);
    const borrowedOutstanding = borrowed.reduce((s, b) => s + (b.amountRemaining || 0), 0);

    const q = question.toLowerCase();
    let answer = '';

    if (q.includes('where') && (q.includes('money go') || q.includes('money went') || q.includes('spent'))) {
      answer = `This month you spent ₹${Math.round(totalExpense)} across ${Object.keys(catTotals).length} categories.\n\n`;
      answer += '**Top spending categories:**\n';
      sortedCats.slice(0, 5).forEach(([cat, amt]) => {
        answer += `• ${cat}: ₹${Math.round(amt)} (${Math.round(amt / totalExpense * 100)}%)\n`;
      });
      if (totalIncome > 0) answer += `\nYou've used ${Math.round(totalExpense / totalIncome * 100)}% of your income.`;
    } else if (q.includes('save') && (q.includes('how') || q.includes('can'))) {
      const targetMatch = q.match(/₹?\s*(\d+[,\d]*)/);
      const target = targetMatch ? parseInt(targetMatch[1].replace(/,/g, '')) : 5000;
      answer = `To save ₹${target} this month, here are suggestions:\n\n`;
      sortedCats.forEach(([cat, amt]) => {
        const reduction = Math.round(amt * 0.2);
        if (reduction >= target * 0.1) {
          answer += `• Reduce ${cat} by 20% → Save ₹${reduction}\n`;
        }
      });
      answer += `\nCurrent savings: ₹${Math.round(savings)} (${totalIncome > 0 ? Math.round(savings / totalIncome * 100) : 0}% of income)`;
    } else if (q.includes('afford') || q.includes('can i buy')) {
      const amountMatch = q.match(/₹?\s*(\d+[,\d]*)/);
      const purchaseAmt = amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : 0;
      if (purchaseAmt > 0) {
        const canAfford = savings >= purchaseAmt;
        answer = canAfford
          ? `Yes, you can afford ₹${purchaseAmt}! Current surplus: ₹${Math.round(savings)}. After purchase: ₹${Math.round(savings - purchaseAmt)} remaining.`
          : `Currently tight. Surplus: ₹${Math.round(savings)}. You need ₹${Math.round(purchaseAmt - savings)} more. Consider spreading it over ${Math.ceil(purchaseAmt / (totalIncome * 0.1 || 1))} months.`;
      } else {
        answer = 'Please specify the amount, e.g., "Can I afford ₹20,000?"';
      }
    } else if (q.includes('waste') || q.includes('unnecessary') || q.includes('most money')) {
      answer = '**Highest spending categories this month:**\n\n';
      sortedCats.slice(0, 3).forEach(([cat, amt], i) => {
        const pct = totalIncome > 0 ? Math.round(amt / totalIncome * 100) : 0;
        answer += `${i + 1}. ${cat}: ₹${Math.round(amt)} (${pct}% of income)\n`;
      });
      if (sortedCats.length > 0) {
        answer += `\n💡 Reducing ${sortedCats[0][0]} by 15% would save ₹${Math.round(sortedCats[0][1] * 0.15)} this month.`;
      }
    } else if (q.includes('summary') || q.includes('overview') || q.includes('status')) {
      answer = `**Monthly Financial Summary:**\n\n`;
      answer += `💰 Income: ₹${Math.round(totalIncome)}\n`;
      answer += `💸 Expenses: ₹${Math.round(totalExpense)}\n`;
      answer += `💵 Savings: ₹${Math.round(savings)} (${totalIncome > 0 ? Math.round(savings / totalIncome * 100) : 0}%)\n`;
      answer += `📊 Categories: ${Object.keys(catTotals).length}\n`;
      answer += `🤝 Lent Outstanding: ₹${Math.round(lentOutstanding)}\n`;
      answer += `📝 Borrowed Outstanding: ₹${Math.round(borrowedOutstanding)}\n`;
      if (goals.length > 0) answer += `🎯 Active Goals: ${goals.length}\n`;
    } else if (q.includes('goal') || q.includes('target')) {
      if (goals.length > 0) {
        answer = '**Your Financial Goals:**\n\n';
        goals.forEach(g => {
          const pct = Math.round((g.savedAmount / g.targetAmount) * 100);
          const remaining = g.targetAmount - g.savedAmount;
          const monthsLeft = Math.max(1, Math.ceil((new Date(g.targetDate) - now) / (1000 * 60 * 60 * 24 * 30)));
          answer += `• ${g.title}: ₹${Math.round(g.savedAmount)}/₹${Math.round(g.targetAmount)} (${pct}%) — Need ₹${Math.round(remaining / monthsLeft)}/month\n`;
        });
      } else {
        answer = 'You don\'t have any financial goals set yet. Create one in the Goals section!';
      }
    } else {
      answer = `Here's a quick overview:\n\n`;
      answer += `💰 Income: ₹${Math.round(totalIncome)} | 💸 Spent: ₹${Math.round(totalExpense)} | 💵 Saved: ₹${Math.round(savings)}\n\n`;
      answer += 'You can ask me:\n• "Where did my money go?"\n• "How can I save ₹5000?"\n• "Can I afford ₹20,000?"\n• "Which category wastes the most?"\n• "Give me a summary"';
    }

    res.json({ question, answer });
  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/smart/safe-spending ───
router.get('/safe-spending', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysRemaining = daysInMonth - now.getDate();

    const [expenses, salaries, recurring] = await Promise.all([
      Expense.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      Salary.find({ user: userId, date: { $gte: monthStart, $lte: monthEnd } }),
      RecurringExpense.find({ user: userId, isActive: true })
    ]);

    const totalIncome = salaries.reduce((s, e) => s + e.amount, 0);
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const remaining = totalIncome - totalSpent;

    // Upcoming recurring expenses this month
    const upcomingRecurring = recurring.filter(r => {
      const due = new Date(r.nextDueDate);
      return due >= now && due <= monthEnd;
    }).reduce((s, r) => s + r.amount, 0);

    const trueAvailable = Math.max(0, remaining - upcomingRecurring);
    const safeDailyLimit = daysRemaining > 0 ? Math.round(trueAvailable / daysRemaining) : 0;
    const safeWeeklyLimit = Math.round(safeDailyLimit * 7);

    // Risk level
    let riskLevel = 'safe';
    if (safeDailyLimit <= 0) riskLevel = 'critical';
    else if (remaining < totalIncome * 0.1) riskLevel = 'high';
    else if (remaining < totalIncome * 0.25) riskLevel = 'medium';

    res.json({
      totalIncome: Math.round(totalIncome),
      totalSpent: Math.round(totalSpent),
      remaining: Math.round(remaining),
      upcomingRecurring: Math.round(upcomingRecurring),
      availableAfterRecurring: Math.round(trueAvailable),
      safeDailyLimit,
      safeWeeklyLimit,
      daysRemaining,
      riskLevel,
      message: riskLevel === 'critical' ? 'No safe spending room. Avoid non-essential purchases.' :
               riskLevel === 'high' ? `Very tight. Limit daily spending to ₹${safeDailyLimit}.` :
               riskLevel === 'medium' ? `Be cautious. Safe limit: ₹${safeDailyLimit}/day.` :
               `You can safely spend ₹${safeDailyLimit}/day.`
    });
  } catch (error) {
    console.error('Safe spending error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/smart/spending-heatmap ───
router.get('/spending-heatmap', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const expenses = await Expense.find({
      user: userId,
      date: { $gte: sixMonthsAgo, $lte: now }
    });

    // Build heatmap: dayOfWeek × hourOfDay
    const dayHourMap = {};
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let d = 0; d < 7; d++) {
      dayHourMap[dayNames[d]] = {};
      for (let h = 0; h < 24; h++) { dayHourMap[dayNames[d]][h] = 0; }
    }

    expenses.forEach(e => {
      const dt = new Date(e.date);
      const day = dayNames[dt.getDay()];
      const hour = dt.getHours();
      dayHourMap[day][hour] += e.amount;
    });

    // Daily totals for calendar heatmap
    const dailyTotals = {};
    expenses.forEach(e => {
      const key = new Date(e.date).toISOString().split('T')[0];
      dailyTotals[key] = (dailyTotals[key] || 0) + e.amount;
    });

    // Category by month
    const catMonthly = {};
    expenses.forEach(e => {
      const mKey = `${new Date(e.date).getFullYear()}-${String(new Date(e.date).getMonth() + 1).padStart(2, '0')}`;
      if (!catMonthly[e.category]) catMonthly[e.category] = {};
      catMonthly[e.category][mKey] = (catMonthly[e.category][mKey] || 0) + e.amount;
    });

    res.json({ dayHourMap, dailyTotals, catMonthly });
  } catch (error) {
    console.error('Heatmap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/smart/deep-analytics ───
router.get('/deep-analytics', async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [yearExpenses, yearSalaries, sixMonthExpenses, budgets, goals, recurring] = await Promise.all([
      Expense.find({ user: userId, date: { $gte: yearStart } }),
      Salary.find({ user: userId, date: { $gte: yearStart } }),
      Expense.find({ user: userId, date: { $gte: sixMonthsAgo } }),
      Budget.find({ user: userId, month: now.getMonth() + 1, year: now.getFullYear() }),
      Goal.find({ user: userId }),
      RecurringExpense.find({ user: userId, isActive: true })
    ]);

    // Monthly totals
    const monthlyData = {};
    for (let m = 0; m < 12; m++) {
      const key = `${now.getFullYear()}-${String(m + 1).padStart(2, '0')}`;
      monthlyData[key] = { income: 0, expense: 0, savings: 0 };
    }
    yearExpenses.forEach(e => {
      const key = `${new Date(e.date).getFullYear()}-${String(new Date(e.date).getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) monthlyData[key].expense += e.amount;
    });
    yearSalaries.forEach(s => {
      const key = `${new Date(s.date).getFullYear()}-${String(new Date(s.date).getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[key]) monthlyData[key].income += s.amount;
    });
    Object.keys(monthlyData).forEach(k => {
      monthlyData[k].savings = monthlyData[k].income - monthlyData[k].expense;
    });

    // Category totals (year)
    const categoryTotals = {};
    yearExpenses.forEach(e => { categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount; });

    // Budget vs actual
    const budgetVsActual = [];
    const monthExpenses = yearExpenses.filter(e => new Date(e.date) >= monthStart && new Date(e.date) <= monthEnd);
    const catSpend = {};
    monthExpenses.forEach(e => { catSpend[e.category] = (catSpend[e.category] || 0) + e.amount; });
    budgets.forEach(b => {
      const spent = b.category === 'Overall' ? monthExpenses.reduce((s, e) => s + e.amount, 0) : (catSpend[b.category] || 0);
      budgetVsActual.push({ category: b.category, budget: Math.round(b.amount), actual: Math.round(spent), percentage: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0 });
    });

    // Savings rate trend
    const savingsRateTrend = Object.entries(monthlyData).map(([k, v]) => ({
      month: k,
      rate: v.income > 0 ? Math.round((v.savings / v.income) * 100) : 0
    }));

    // Top merchants (expense titles)
    const merchantTotals = {};
    yearExpenses.forEach(e => { merchantTotals[e.title] = (merchantTotals[e.title] || 0) + e.amount; });
    const topMerchants = Object.entries(merchantTotals).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, amount]) => ({ name, amount: Math.round(amount) }));

    // Transaction frequency
    const txByDay = {};
    yearExpenses.forEach(e => {
      const dayName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(e.date).getDay()];
      txByDay[dayName] = (txByDay[dayName] || 0) + 1;
    });

    // Expense size distribution
    const sizeDistribution = { small: 0, medium: 0, large: 0, veryLarge: 0 };
    yearExpenses.forEach(e => {
      if (e.amount < 500) sizeDistribution.small++;
      else if (e.amount < 2000) sizeDistribution.medium++;
      else if (e.amount < 10000) sizeDistribution.large++;
      else sizeDistribution.veryLarge++;
    });

    // Annual recurring cost
    const annualRecurring = recurring.reduce((s, r) => {
      if (r.frequency === 'monthly') return s + r.amount * 12;
      if (r.frequency === 'weekly') return s + r.amount * 52;
      if (r.frequency === 'quarterly') return s + r.amount * 4;
      if (r.frequency === 'yearly') return s + r.amount;
      return s;
    }, 0);

    // Year totals
    const yearIncome = yearSalaries.reduce((s, e) => s + e.amount, 0);
    const yearExpense = yearExpenses.reduce((s, e) => s + e.amount, 0);

    res.json({
      monthlyData,
      categoryTotals,
      budgetVsActual,
      savingsRateTrend,
      topMerchants,
      transactionsByDay: txByDay,
      sizeDistribution,
      annualRecurring: Math.round(annualRecurring),
      yearIncome: Math.round(yearIncome),
      yearExpense: Math.round(yearExpense),
      yearSavings: Math.round(yearIncome - yearExpense),
      totalTransactions: yearExpenses.length,
      avgTransaction: yearExpenses.length > 0 ? Math.round(yearExpense / yearExpenses.length) : 0,
      goalsCompleted: goals.filter(g => g.isCompleted).length,
      goalsActive: goals.filter(g => !g.isCompleted).length
    });
  } catch (error) {
    console.error('Deep analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/smart/anomalies ─── Spending anomaly detection
router.get('/anomalies', async (req, res) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const expenses = await Expense.find({ user: req.user.id, date: { $gte: sixMonthsAgo } }).sort({ date: -1 });

    if (expenses.length < 5) return res.json({ anomalies: [], message: 'Not enough data' });

    // Group by category and compute stats
    const catMap = {};
    expenses.forEach(e => {
      if (!catMap[e.category]) catMap[e.category] = [];
      catMap[e.category].push(e.amount);
    });

    const anomalies = [];
    // Detect per-category anomalies using Z-score
    for (const [cat, amounts] of Object.entries(catMap)) {
      if (amounts.length < 3) continue;
      const mean = amounts.reduce((s, a) => s + a, 0) / amounts.length;
      const std = Math.sqrt(amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length) || 1;
      
      // Check recent transactions
      const recentExpenses = expenses.filter(e => e.category === cat).slice(0, 3);
      recentExpenses.forEach(e => {
        const zScore = (e.amount - mean) / std;
        if (zScore > 1.8) {
          anomalies.push({
            type: 'high_amount',
            severity: zScore > 3 ? 'critical' : zScore > 2.5 ? 'high' : 'medium',
            category: cat,
            title: e.title,
            amount: Math.round(e.amount),
            average: Math.round(mean),
            deviation: Math.round((zScore) * 100) / 100,
            date: e.date,
            message: `${e.title} (${formatCurrency(e.amount)}) is ${Math.round((e.amount / mean - 1) * 100)}% above your average ${cat} expense of ${formatCurrency(mean)}`
          });
        }
      });
    }

    // Detect spending velocity spikes (week-over-week)
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const thisWeek = expenses.filter(e => e.date >= thisWeekStart).reduce((s, e) => s + e.amount, 0);
    const lastWeek = expenses.filter(e => e.date >= lastWeekStart && e.date < thisWeekStart).reduce((s, e) => s + e.amount, 0);

    if (lastWeek > 0 && thisWeek > lastWeek * 1.5) {
      anomalies.push({
        type: 'velocity_spike',
        severity: thisWeek > lastWeek * 2 ? 'high' : 'medium',
        message: `Spending this week (${formatCurrency(thisWeek)}) is ${Math.round((thisWeek / lastWeek - 1) * 100)}% higher than last week (${formatCurrency(lastWeek)})`,
        thisWeek: Math.round(thisWeek),
        lastWeek: Math.round(lastWeek)
      });
    }

    // Weekend vs weekday pattern
    const weekendSpend = expenses.filter(e => [0, 6].includes(new Date(e.date).getDay()));
    const weekdaySpend = expenses.filter(e => ![0, 6].includes(new Date(e.date).getDay()));
    const avgWeekend = weekendSpend.length > 0 ? weekendSpend.reduce((s, e) => s + e.amount, 0) / weekendSpend.length : 0;
    const avgWeekday = weekdaySpend.length > 0 ? weekdaySpend.reduce((s, e) => s + e.amount, 0) / weekdaySpend.length : 0;

    let weekendPattern = null;
    if (avgWeekday > 0 && avgWeekend > avgWeekday * 1.3) {
      weekendPattern = {
        type: 'weekend_pattern',
        severity: 'info',
        message: `You spend ${Math.round((avgWeekend / avgWeekday - 1) * 100)}% more on weekends (avg ${formatCurrency(avgWeekend)}) vs weekdays (avg ${formatCurrency(avgWeekday)})`,
        avgWeekend: Math.round(avgWeekend),
        avgWeekday: Math.round(avgWeekday)
      };
    }

    anomalies.sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, info: 3 };
      return (sev[a.severity] || 3) - (sev[b.severity] || 3);
    });

    res.json({ anomalies: anomalies.slice(0, 10), weekendPattern, totalAnalyzed: expenses.length });
  } catch (error) {
    console.error('Anomaly detection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

function formatCurrency(amt) { return '₹' + Math.round(amt).toLocaleString('en-IN'); }

// ─── GET /api/smart/spending-velocity ───
router.get('/spending-velocity', async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const expenses = await Expense.find({ user: req.user.id, date: { $gte: monthStart } }).sort({ date: 1 });

    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);

    // Daily spending array
    const dailySpending = Array(dayOfMonth).fill(0);
    expenses.forEach(e => {
      const d = new Date(e.date).getDate() - 1;
      if (d >= 0 && d < dayOfMonth) dailySpending[d] += e.amount;
    });

    // Rolling 7-day average
    const rolling7 = [];
    for (let i = 0; i < dailySpending.length; i++) {
      const window = dailySpending.slice(Math.max(0, i - 6), i + 1);
      rolling7.push(Math.round(window.reduce((s, v) => s + v, 0) / window.length));
    }

    // Acceleration (is spending speeding up or slowing down?)
    let acceleration = 'stable';
    if (rolling7.length >= 7) {
      const recent = rolling7.slice(-3).reduce((s, v) => s + v, 0) / 3;
      const earlier = rolling7.slice(-7, -3).reduce((s, v) => s + v, 0) / Math.min(4, rolling7.slice(-7, -3).length || 1);
      if (recent > earlier * 1.2) acceleration = 'accelerating';
      else if (recent < earlier * 0.8) acceleration = 'decelerating';
    }

    // Projected month-end
    const dailyAvg = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
    const projected = dailyAvg * daysInMonth;

    res.json({
      dailySpending: dailySpending.map(Math.round),
      rolling7DayAvg: rolling7,
      acceleration,
      totalSpent: Math.round(totalSpent),
      dailyAvg: Math.round(dailyAvg),
      projected: Math.round(projected),
      daysElapsed: dayOfMonth,
      daysRemaining: daysInMonth - dayOfMonth,
      transactionCount: expenses.length
    });
  } catch (error) {
    console.error('Spending velocity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/smart/habit-score ─── Financial habit scoring
router.get('/habit-score', async (req, res) => {
  try {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);

    const [expenses, salaries, budgets, goals, recurring] = await Promise.all([
      Expense.find({ user: req.user.id, date: { $gte: sixMonthsAgo } }),
      Salary.find({ user: req.user.id, date: { $gte: sixMonthsAgo } }),
      Budget.find({ user: req.user.id }),
      Goal.find({ user: req.user.id }),
      RecurringExpense.find({ user: req.user.id })
    ]);

    const totalIncome = salaries.reduce((s, sal) => s + sal.amount, 0);
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
    const savingsRatio = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

    // 1. Budget adherence score (0-25)
    let budgetScore = 0;
    if (budgets.length > 0) {
      const recentBudgets = budgets.filter(b => {
        const bDate = new Date(b.year, b.month - 1);
        return bDate >= threeMonthsAgo;
      });
      if (recentBudgets.length > 0) {
        let underBudget = 0;
        recentBudgets.forEach(b => {
          const catExpenses = b.category === 'Overall'
            ? expenses.filter(e => new Date(e.date).getMonth() === b.month - 1 && new Date(e.date).getFullYear() === b.year)
            : expenses.filter(e => e.category === b.category && new Date(e.date).getMonth() === b.month - 1 && new Date(e.date).getFullYear() === b.year);
          const spent = catExpenses.reduce((s, e) => s + e.amount, 0);
          if (spent <= b.amount) underBudget++;
        });
        budgetScore = Math.round((underBudget / recentBudgets.length) * 25);
      }
    } else {
      budgetScore = 5; // small penalty for not using budgets
    }

    // 2. Savings consistency score (0-25)
    const monthlyData = {};
    salaries.forEach(s => {
      const key = `${new Date(s.date).getFullYear()}-${new Date(s.date).getMonth()}`;
      monthlyData[key] = (monthlyData[key] || { income: 0, expense: 0 });
      monthlyData[key].income += s.amount;
    });
    expenses.forEach(e => {
      const key = `${new Date(e.date).getFullYear()}-${new Date(e.date).getMonth()}`;
      monthlyData[key] = (monthlyData[key] || { income: 0, expense: 0 });
      monthlyData[key].expense += e.amount;
    });
    const monthlyRates = Object.values(monthlyData).map(m => m.income > 0 ? ((m.income - m.expense) / m.income) * 100 : 0);
    const positiveSavingsMonths = monthlyRates.filter(r => r > 0).length;
    const savingsScore = monthlyRates.length > 0 ? Math.round((positiveSavingsMonths / monthlyRates.length) * 25) : 0;

    // 3. Goal progress score (0-25)
    let goalScore = 0;
    if (goals.length > 0) {
      const avgProgress = goals.reduce((s, g) => s + Math.min((g.savedAmount / g.targetAmount) * 100, 100), 0) / goals.length;
      goalScore = Math.round((avgProgress / 100) * 25);
    } else {
      goalScore = 5; // small penalty for no goals
    }

    // 4. Spending stability score (0-25)
    const monthlyExpenses = Object.values(monthlyData).map(m => m.expense);
    let stabilityScore = 15;
    if (monthlyExpenses.length >= 2) {
      const mean = monthlyExpenses.reduce((s, v) => s + v, 0) / monthlyExpenses.length;
      const cv = mean > 0 ? (Math.sqrt(monthlyExpenses.reduce((s, v) => s + (v - mean) ** 2, 0) / monthlyExpenses.length) / mean) * 100 : 0;
      stabilityScore = cv < 10 ? 25 : cv < 20 ? 20 : cv < 35 ? 15 : cv < 50 ? 10 : 5;
    }

    const totalScore = Math.min(100, budgetScore + savingsScore + goalScore + stabilityScore);
    const grade = totalScore >= 85 ? 'A+' : totalScore >= 75 ? 'A' : totalScore >= 65 ? 'B+' : totalScore >= 55 ? 'B' : totalScore >= 45 ? 'C' : totalScore >= 35 ? 'D' : 'F';

    // Generate habits/tips
    const habits = [];
    if (savingsRatio < 20) habits.push({ icon: '💰', text: 'Aim to save at least 20% of income. Currently at ' + Math.round(savingsRatio) + '%', impact: 'high' });
    if (budgetScore < 15) habits.push({ icon: '📊', text: 'Improve budget adherence — you exceeded budgets frequently', impact: 'high' });
    if (goals.length === 0) habits.push({ icon: '🎯', text: 'Set financial goals to stay motivated and track progress', impact: 'medium' });
    if (recurring.length > 5) habits.push({ icon: '🔄', text: `You have ${recurring.length} recurring expenses — review for optimization`, impact: 'medium' });
    if (positiveSavingsMonths < monthlyRates.length * 0.5) habits.push({ icon: '⚠️', text: 'Less than half your months had positive savings — focus on consistency', impact: 'high' });
    if (totalScore >= 75) habits.push({ icon: '🌟', text: 'Great financial discipline! Keep maintaining these habits', impact: 'positive' });

    res.json({
      score: totalScore,
      grade,
      breakdown: { budgetAdherence: budgetScore, savingsConsistency: savingsScore, goalProgress: goalScore, spendingStability: stabilityScore },
      savingsRatio: Math.round(savingsRatio * 10) / 10,
      habits,
      monthsAnalyzed: Object.keys(monthlyData).length
    });
  } catch (error) {
    console.error('Habit score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/smart/subscription-intelligence ───
router.get('/subscription-intelligence', async (req, res) => {
  try {
    const recurring = await RecurringExpense.find({ user: req.user.id });
    const now = new Date();

    const subscriptions = recurring.map(r => {
      const monthlyAmount = r.frequency === 'daily' ? r.amount * 30
        : r.frequency === 'weekly' ? r.amount * 4.33
        : r.frequency === 'monthly' ? r.amount
        : r.frequency === 'quarterly' ? r.amount / 3
        : r.amount / 12;

      const annualCost = monthlyAmount * 12;
      const nextDue = r.nextDueDate;
      const daysUntilDue = nextDue ? Math.ceil((new Date(nextDue) - now) / (1000 * 60 * 60 * 24)) : null;
      const isUpcoming = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7;

      // Check if last processed was long ago (potentially unused)
      const lastProcessed = r.lastProcessedDate;
      const daysSinceProcessed = lastProcessed ? Math.ceil((now - new Date(lastProcessed)) / (1000 * 60 * 60 * 24)) : null;
      const possiblyUnused = !r.isActive || (daysSinceProcessed && daysSinceProcessed > 60);

      return {
        id: r._id,
        title: r.title,
        category: r.category,
        amount: r.amount,
        frequency: r.frequency,
        monthlyEquivalent: Math.round(monthlyAmount),
        annualCost: Math.round(annualCost),
        nextDueDate: nextDue,
        daysUntilDue,
        isUpcoming,
        isActive: r.isActive,
        possiblyUnused
      };
    });

    const totalMonthly = subscriptions.filter(s => s.isActive).reduce((sum, s) => sum + s.monthlyEquivalent, 0);
    const totalAnnual = totalMonthly * 12;
    const upcomingThisWeek = subscriptions.filter(s => s.isUpcoming);
    const potentialSavings = subscriptions.filter(s => s.possiblyUnused).reduce((sum, s) => sum + s.monthlyEquivalent, 0);

    // Category breakdown
    const categoryBreakdown = {};
    subscriptions.filter(s => s.isActive).forEach(s => {
      categoryBreakdown[s.category] = (categoryBreakdown[s.category] || 0) + s.monthlyEquivalent;
    });

    const insights = [];
    if (totalAnnual > 0) insights.push({ icon: '💳', text: `Total subscription cost: ${formatCurrency(totalAnnual)}/year (${formatCurrency(totalMonthly)}/month)` });
    if (potentialSavings > 0) insights.push({ icon: '💡', text: `Potentially unused subscriptions could save ${formatCurrency(potentialSavings)}/month` });
    if (upcomingThisWeek.length > 0) insights.push({ icon: '📅', text: `${upcomingThisWeek.length} subscription(s) due this week` });

    subscriptions.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent);

    res.json({
      subscriptions,
      totalMonthly,
      totalAnnual,
      upcomingThisWeek,
      potentialSavings,
      categoryBreakdown,
      insights,
      count: subscriptions.length,
      activeCount: subscriptions.filter(s => s.isActive).length
    });
  } catch (error) {
    console.error('Subscription intelligence error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

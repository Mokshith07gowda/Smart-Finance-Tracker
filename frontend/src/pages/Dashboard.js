import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLocation } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPieChart, FiActivity, FiAlertTriangle, FiCalendar, FiTarget, FiZap, FiMessageCircle, FiSend, FiChevronDown, FiChevronUp, FiAward } from 'react-icons/fi';
import { MdAccountBalanceWallet } from 'react-icons/md';
import { CurrencyContext } from '../context/CurrencyContext';
import { LanguageContext } from '../context/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const card = 'bg-white dark:bg-slate-800 rounded-lg p-5 shadow border border-slate-100 dark:border-slate-700 animate-fade-in';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [insights, setInsights] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [categoryBudgets, setCategoryBudgets] = useState([]);
  const [salaryTracker, setSalaryTracker] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showAllInsights, setShowAllInsights] = useState(false);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [safeSending, setSafeSpending] = useState(null);
  const [anomalies, setAnomalies] = useState(null);
  const [habitScore, setHabitScore] = useState(null);
  const [velocity, setVelocity] = useState(null);
  const { formatCurrency, country, countryCode } = useContext(CurrencyContext);
  const { t } = useContext(LanguageContext);
  const location = useLocation();

  useEffect(() => { fetchAll(); }, [location.pathname]); // eslint-disable-line
  useEffect(() => { if (summary) fetchAll(); }, [countryCode]); // eslint-disable-line
  useEffect(() => {
    const h = () => fetchAll();
    window.addEventListener('focus', h);
    return () => window.removeEventListener('focus', h);
  }, []); // eslint-disable-line

  const fetchAll = async () => {
    try {
      const [sumRes, trendRes, txRes, hRes, pRes, iRes, aRes, cbRes, sRes, ssRes, anRes, hsRes, velRes] = await Promise.all([
        axios.get('/api/dashboard/summary'),
        axios.get('/api/dashboard/monthly-trend'),
        axios.get('/api/dashboard/recent-transactions?limit=8'),
        axios.get('/api/smart/financial-health').catch(() => ({ data: null })),
        axios.get('/api/smart/predictions').catch(() => ({ data: null })),
        axios.get('/api/smart/insights').catch(() => ({ data: { insights: [] } })),
        axios.get('/api/smart/budget-alerts').catch(() => ({ data: { alerts: [] } })),
        axios.get('/api/smart/category-budgets').catch(() => ({ data: { categoryBudgets: [] } })),
        axios.get('/api/smart/salary-tracker').catch(() => ({ data: null })),
        axios.get('/api/smart/safe-spending').catch(() => ({ data: null })),
        axios.get('/api/smart/anomalies').catch(() => ({ data: null })),
        axios.get('/api/smart/habit-score').catch(() => ({ data: null })),
        axios.get('/api/smart/spending-velocity').catch(() => ({ data: null })),
      ]);
      setSummary(sumRes.data);
      setMonthlyTrend(trendRes.data);
      setRecentTransactions(txRes.data);
      setHealthScore(hRes.data);
      setPredictions(pRes.data);
      setInsights(iRes.data?.insights || []);
      setBudgetAlerts(aRes.data?.alerts || []);
      setCategoryBudgets(cbRes.data?.categoryBudgets || []);
      setSalaryTracker(sRes.data);
      setSafeSpending(ssRes.data);
      setAnomalies(anRes.data);
      setHabitScore(hsRes.data);
      setVelocity(velRes.data);
    } catch (e) { toast.error('Failed to fetch dashboard data'); }
    finally { setLoading(false); }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const q = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', text: q }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await axios.post('/api/smart/ai-chat', { question: q });
      setChatMessages(prev => [...prev, { role: 'ai', text: res.data.answer }]);
    } catch { setChatMessages(prev => [...prev, { role: 'ai', text: 'Sorry, something went wrong.' }]); }
    finally { setChatLoading(false); }
  };

  const trendChartData = {
    labels: monthlyTrend.map(m => m.month),
    datasets: [
      { label: 'Income', data: monthlyTrend.map(m => m.salary), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', tension: 0.4 },
      { label: 'Expenses', data: monthlyTrend.map(m => m.expenses), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', tension: 0.4 },
      { label: 'Savings', data: monthlyTrend.map(m => m.savings), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', tension: 0.4 }
    ],
  };
  const categoryChartData = summary ? {
    labels: summary.categoryExpenses.map(c => c._id),
    datasets: [{ data: summary.categoryExpenses.map(c => c.total), backgroundColor: ['#10b981','#3b82f6','#ef4444','#8b5cf6','#ec4899','#f59e0b','#06b6d4','#6b7280'], borderWidth: 0 }],
  } : null;
  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } } } };

  if (loading) return (
    <div className="container mt-10">
      <div className="mb-6"><div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" /><div className="h-4 w-72 bg-slate-100 dark:bg-slate-800 rounded mt-2 animate-pulse" /></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">{[1,2,3].map(i => <div key={i} className="h-52 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}</div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">{[1,2].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}</div>
    </div>
  );

  const scoreColor = (s) => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';
  const scoreLabel = (s) => s >= 75 ? 'Excellent' : s >= 50 ? 'Good' : s >= 30 ? 'Needs Work' : 'Poor';
  const alertBg = { danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800', warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800', caution: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800', savings: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' };
  const statusColor = { exceeded: '#ef4444', warning: '#f59e0b', caution: '#eab308', good: '#10b981', 'no-budget': '#94a3b8' };

  return (
    <div className="container mt-10 mb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('dash_title')}</h1>
        <p className="text-slate-500 text-sm mt-1">{t('dash_this_month')}</p>
      </div>

      {summary && (
        <>
          {/* ── ROW 1: Balance + Health Score + Salary Tracker ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            {/* Balance Card */}
            <div className={`${card} border-l-[3px] border-l-primary lg:col-span-1 max-md:p-4`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-md bg-primary-light text-primary flex items-center justify-center"><MdAccountBalanceWallet size={24} /></div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Balance</h4>
                  <div className={`text-2xl font-bold tracking-tight ${summary.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(summary.balance)}</div>
                </div>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[11px] font-medium text-slate-500 mb-3">
                <span>{country.flag}</span><span className="text-slate-800 dark:text-slate-200 font-semibold">{country.name}</span><span className="text-slate-400">({country.currency})</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: 'Income', v: `+${formatCurrency(summary.allTimeSalary)}`, c: 'text-emerald-600' },
                  { l: 'Expenses', v: `-${formatCurrency(summary.allTimeExpenses)}`, c: 'text-red-500' },
                  { l: 'Lent Out', v: `-${formatCurrency(summary.totalLentOutstanding)}`, c: 'text-violet-600' },
                  { l: 'Borrowed', v: `+${formatCurrency(summary.totalBorrowedOutstanding)}`, c: 'text-pink-600' },
                ].map((x, i) => (
                  <div key={i} className="p-2 rounded bg-slate-50 dark:bg-slate-700/50">
                    <span className="text-[10px] font-medium text-slate-500 uppercase">{x.l}</span>
                    <div className={`text-xs font-bold ${x.c}`}>{x.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Health Score */}
            {healthScore && (
              <div className={card}>
                <div className="flex items-center gap-2 mb-3">
                  <FiActivity size={18} className="text-primary" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Financial Health</h3>
                </div>
                <div className="flex items-center gap-5 mb-4">
                  <div className="relative w-24 h-24 shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" className="dark:stroke-slate-700" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={scoreColor(healthScore.score)} strokeWidth="3" strokeDasharray={`${healthScore.score}, 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold" style={{ color: scoreColor(healthScore.score) }}>{healthScore.score}</span>
                      <span className="text-[9px] font-semibold text-slate-500">{scoreLabel(healthScore.score)}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[
                      { l: 'Savings', v: healthScore.breakdown.savingsScore },
                      { l: 'Budget', v: healthScore.breakdown.budgetScore },
                      { l: 'Consistency', v: healthScore.breakdown.consistencyScore },
                      { l: 'Debt', v: healthScore.breakdown.debtScore },
                    ].map((b, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-[10px] font-medium text-slate-500 mb-0.5"><span>{b.l}</span><span>{b.v}%</span></div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${b.v}%`, backgroundColor: scoreColor(b.v) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {healthScore.suggestions.length > 0 && (
                  <div className="space-y-1.5">
                    {healthScore.suggestions.slice(0, 2).map((s, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded bg-slate-50 dark:bg-slate-700/50">
                        <FiTarget size={12} className="text-primary mt-0.5 shrink-0" />
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{s.text} <span className="text-emerald-500 font-bold">{s.impact}</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Salary Tracker */}
            {salaryTracker && (
              <div className={card}>
                <div className="flex items-center gap-2 mb-3">
                  <FiCalendar size={18} className="text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Salary & Cash Flow</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Income</span>
                    <div className="text-lg font-bold text-emerald-600">{formatCurrency(salaryTracker.totalIncome)}</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20">
                    <span className="text-[10px] font-bold text-red-500 uppercase">Spent</span>
                    <div className="text-lg font-bold text-red-500">{formatCurrency(salaryTracker.totalExpense)}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-700/50">
                    <span className="text-[11px] text-slate-500">Remaining</span>
                    <span className={`text-sm font-bold ${salaryTracker.remaining >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(salaryTracker.remaining)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-700/50">
                    <span className="text-[11px] text-slate-500">Next salary in</span>
                    <span className="text-sm font-bold text-primary">{salaryTracker.daysUntilSalary} days</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-700/50">
                    <span className="text-[11px] text-slate-500">Expected at salary</span>
                    <span className={`text-sm font-bold ${salaryTracker.expectedRemainingAtSalary >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(salaryTracker.expectedRemainingAtSalary)}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded bg-slate-50 dark:bg-slate-700/50">
                    <span className="text-[11px] text-slate-500">Daily avg expense</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatCurrency(salaryTracker.dailyAvgExpense)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── ROW 2: Summary Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-in">
            {[
              { icon: <FiTrendingUp size={20} />, title: 'Income', value: formatCurrency(summary.totalSalary), sub: 'This month', bc: '#10b981', bg: 'rgba(16,185,129,0.1)' },
              { icon: <FiTrendingDown size={20} />, title: 'Expenses', value: formatCurrency(summary.totalExpenses), sub: 'This month', bc: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
              { icon: <FiDollarSign size={20} />, title: 'Savings', value: formatCurrency(summary.savings), sub: `Rate: ${summary.savingsRate}%`, bc: '#6366f1', bg: 'rgba(99,102,241,0.1)', vc: summary.savings >= 0 ? '#10b981' : '#ef4444' },
              { icon: <FiPieChart size={20} />, title: 'Budget', value: summary.budgetAmount > 0 ? `${summary.budgetUsed}%` : 'N/A', sub: summary.budgetAmount > 0 ? (summary.budgetRemaining >= 0 ? `${formatCurrency(summary.budgetRemaining)} left` : `${formatCurrency(Math.abs(summary.budgetRemaining))} over`) : 'Not set', bc: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            ].map((c, i) => (
              <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow border border-slate-100 dark:border-slate-700 hover:-translate-y-0.5 hover:shadow-lg transition-all" style={{ borderLeft: `3px solid ${c.bc}` }}>
                <div className="w-9 h-9 rounded-md flex items-center justify-center mb-2" style={{ backgroundColor: c.bg, color: c.bc }}>{c.icon}</div>
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{c.title}</h4>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight" style={c.vc ? { color: c.vc } : {}}>{c.value}</div>
                <p className="text-[11px] text-slate-500 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Safe Spending Widget ── */}
          {safeSending && (
            <div className={`${card} mb-6 border-l-[3px] ${safeSending.riskLevel === 'critical' ? 'border-l-red-500' : safeSending.riskLevel === 'high' ? 'border-l-amber-500' : safeSending.riskLevel === 'medium' ? 'border-l-yellow-500' : 'border-l-emerald-500'}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${safeSending.riskLevel === 'critical' || safeSending.riskLevel === 'high' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                  <FiDollarSign size={16} className={safeSending.riskLevel === 'critical' || safeSending.riskLevel === 'high' ? 'text-red-500' : 'text-emerald-600'} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Safe Spending Limit</h3>
                  <p className="text-[10px] text-slate-500">{safeSending.message}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-center">
                  <span className="text-[10px] text-slate-500 font-medium">Daily Limit</span>
                  <div className={`text-lg font-bold ${safeSending.safeDailyLimit > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(safeSending.safeDailyLimit)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-center">
                  <span className="text-[10px] text-slate-500 font-medium">Weekly Limit</span>
                  <div className="text-lg font-bold text-primary">{formatCurrency(safeSending.safeWeeklyLimit)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-center">
                  <span className="text-[10px] text-slate-500 font-medium">Upcoming Bills</span>
                  <div className="text-lg font-bold text-amber-600">{formatCurrency(safeSending.upcomingRecurring)}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-center">
                  <span className="text-[10px] text-slate-500 font-medium">Available</span>
                  <div className={`text-lg font-bold ${safeSending.availableAfterRecurring > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(safeSending.availableAfterRecurring)}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Spending Velocity ── */}
          {velocity && velocity.dailySpending && velocity.dailySpending.length > 2 && (
            <div className={`${card} mb-6`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FiActivity size={18} className="text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Spending Velocity</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${velocity.acceleration === 'accelerating' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : velocity.acceleration === 'decelerating' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>
                    {velocity.acceleration === 'accelerating' ? '↑ Accelerating' : velocity.acceleration === 'decelerating' ? '↓ Slowing' : '→ Stable'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatCurrency(velocity.dailyAvg)}/day</div>
                  <div className="text-[10px] text-slate-500">Projected: {formatCurrency(velocity.projected)}</div>
                </div>
              </div>
              <div className="flex items-end gap-[2px] h-16">
                {velocity.dailySpending.map((v, i) => {
                  const max = Math.max(...velocity.dailySpending, 1);
                  const pct = (v / max) * 100;
                  return (
                    <div key={i} className="flex-1 min-w-[3px] rounded-t transition-all hover:opacity-80" style={{ height: `${Math.max(pct, 4)}%`, backgroundColor: v > velocity.dailyAvg * 1.5 ? '#ef4444' : v > velocity.dailyAvg ? '#f59e0b' : '#6366f1', opacity: 0.8 }} title={`Day ${i+1}: ${formatCurrency(v)}`} />
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[9px] text-slate-400">
                <span>Day 1</span>
                <span>Day {velocity.daysElapsed}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-center">
                  <span className="text-[9px] text-slate-500">Total Spent</span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatCurrency(velocity.totalSpent)}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-center">
                  <span className="text-[9px] text-slate-500">Transactions</span>
                  <div className="text-xs font-bold text-primary">{velocity.transactionCount}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 text-center">
                  <span className="text-[9px] text-slate-500">Days Left</span>
                  <div className="text-xs font-bold text-amber-600">{velocity.daysRemaining}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── ROW 3: Predictions + Budget Alerts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Predictions */}
            {predictions && (
              <div className={card}>
                <div className="flex items-center gap-2 mb-3">
                  <FiZap size={18} className="text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Spending Predictions</h3>
                  <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${predictions.velocityTrend === 'increasing' ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : predictions.velocityTrend === 'decreasing' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>
                    {predictions.velocityTrend === 'increasing' ? '↑ Accelerating' : predictions.velocityTrend === 'decreasing' ? '↓ Slowing' : '→ Stable'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50 text-center">
                    <span className="text-[10px] text-slate-500 font-medium">Spent</span>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatCurrency(predictions.totalSpent)}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50 text-center">
                    <span className="text-[10px] text-slate-500 font-medium">Predicted</span>
                    <div className={`text-sm font-bold ${predictions.willExceedOverall ? 'text-red-500' : 'text-slate-800 dark:text-slate-100'}`}>{formatCurrency(predictions.predictedTotal)}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50 text-center">
                    <span className="text-[10px] text-slate-500 font-medium">Daily Avg</span>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{formatCurrency(predictions.dailyAvg)}</div>
                  </div>
                </div>
                {predictions.willExceedOverall && predictions.overallBudget > 0 && (
                  <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-3">
                    <p className="text-[11px] text-red-600 font-semibold">⚠️ At your current rate, you may exceed your budget by {formatCurrency(predictions.overallExcess)} this month.</p>
                  </div>
                )}
                <div className="flex justify-between items-center p-2 rounded bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800">
                  <span className="text-[11px] text-indigo-600 font-medium">Predicted balance at month end</span>
                  <span className={`text-sm font-bold ${predictions.predictedBalance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(predictions.predictedBalance)}</span>
                </div>
                {predictions.categoryPredictions.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Category Forecast</p>
                    {predictions.categoryPredictions.slice(0, 4).map((cp, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        <span className="w-16 font-medium text-slate-600 dark:text-slate-300 truncate">{cp.category}</span>
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(cp.percentUsed, 100)}%`, backgroundColor: cp.willExceed ? '#ef4444' : cp.percentUsed > 80 ? '#f59e0b' : '#10b981' }} />
                        </div>
                        <span className="text-slate-500 w-8 text-right">{cp.percentUsed}%</span>
                        {cp.willExceed && <span className="text-red-500 text-[9px] font-bold">!</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Budget Alerts */}
            <div className={card}>
              <div className="flex items-center gap-2 mb-3">
                <FiAlertTriangle size={18} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Smart Alerts</h3>
                {budgetAlerts.length > 0 && <span className="ml-auto text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full">{budgetAlerts.length}</span>}
              </div>
              {budgetAlerts.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <FiAlertTriangle size={28} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No alerts right now. You're on track! 🎉</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(showAllAlerts ? budgetAlerts : budgetAlerts.slice(0, 4)).map((a, i) => (
                    <div key={i} className={`p-2.5 rounded-lg border ${alertBg[a.type] || 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700'}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-sm">{a.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">{a.text}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{a.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {budgetAlerts.length > 4 && (
                    <button onClick={() => setShowAllAlerts(!showAllAlerts)} className="w-full text-center text-[11px] font-semibold text-primary bg-transparent border-none cursor-pointer py-1 flex items-center justify-center gap-1">
                      {showAllAlerts ? <><FiChevronUp size={12} /> Show less</> : <><FiChevronDown size={12} /> Show all {budgetAlerts.length} alerts</>}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── ROW 4: AI Insights + Category Budgets ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* AI Insights */}
            <div className={card}>
              <div className="flex items-center gap-2 mb-3">
                <FiZap size={18} className="text-purple-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Insights</h3>
              </div>
              {insights.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Add more transactions to unlock AI insights!</p>
              ) : (
                <div className="space-y-2">
                  {(showAllInsights ? insights : insights.slice(0, 4)).map((ins, i) => (
                    <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg ${ins.type === 'positive' ? 'bg-emerald-50 dark:bg-emerald-900/15' : ins.type === 'warning' || ins.type === 'danger' ? 'bg-red-50 dark:bg-red-900/15' : 'bg-slate-50 dark:bg-slate-700/40'}`}>
                      <span className="text-base shrink-0">{ins.icon}</span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">{ins.text}</p>
                    </div>
                  ))}
                  {insights.length > 4 && (
                    <button onClick={() => setShowAllInsights(!showAllInsights)} className="w-full text-center text-[11px] font-semibold text-primary bg-transparent border-none cursor-pointer py-1 flex items-center justify-center gap-1">
                      {showAllInsights ? <><FiChevronUp size={12} /> Show less</> : <><FiChevronDown size={12} /> Show all {insights.length} insights</>}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Category Budget Breakdown */}
            <div className={card}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Category Budget Breakdown</h3>
              {categoryBudgets.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No category data yet</p>
              ) : (
                <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {categoryBudgets.map((cb, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor[cb.status] }} />
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{cb.category}</span>
                          <span className="text-[9px] text-slate-400">({cb.txCount} txns)</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{formatCurrency(cb.spent)}{cb.hasBudget ? ` / ${formatCurrency(cb.allocated)}` : ''}</span>
                      </div>
                      {cb.hasBudget && (
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(cb.pctUsed, 100)}%`, backgroundColor: statusColor[cb.status] }} />
                        </div>
                      )}
                      {cb.willExceed && <p className="text-[9px] text-red-500 font-medium mt-0.5">⚠ Predicted to exceed by {formatCurrency(cb.predictedTotal - cb.allocated)}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── ROW 5: Budget Progress Bar ── */}
          {summary.budgetAmount > 0 && (
            <div className={`${card} mb-6`}>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Overall Monthly Budget</h3>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(summary.budgetUsed, 100)}%`, backgroundColor: summary.budgetUsed > 100 ? '#ef4444' : summary.budgetUsed > 80 ? '#f59e0b' : '#10b981' }} />
              </div>
              <div className="flex justify-between text-xs font-medium text-slate-500">
                <span>{formatCurrency(summary.totalExpenses)} spent</span>
                <span>{formatCurrency(summary.budgetAmount)} budget</span>
              </div>
            </div>
          )}

          {/* ── ROW 5.5: Anomalies + Habit Score ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* Anomaly Detection */}
            {anomalies && anomalies.anomalies && anomalies.anomalies.length > 0 && (
              <div className={card}>
                <div className="flex items-center gap-2 mb-3">
                  <FiAlertTriangle size={18} className="text-red-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Spending Anomalies</h3>
                  <span className="ml-auto text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded-full">{anomalies.anomalies.length}</span>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                  {anomalies.anomalies.slice(0, 5).map((a, i) => (
                    <div key={i} className={`p-2.5 rounded-lg border ${a.severity === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : a.severity === 'high' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-sm shrink-0">{a.severity === 'critical' ? '🚨' : a.severity === 'high' ? '⚠️' : '📊'}</span>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300">{a.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {anomalies.weekendPattern && (
                  <div className="mt-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p className="text-[11px] text-blue-700 dark:text-blue-300">📅 {anomalies.weekendPattern.message}</p>
                  </div>
                )}
              </div>
            )}

            {/* Financial Habit Score */}
            {habitScore && (
              <div className={card}>
                <div className="flex items-center gap-2 mb-3">
                  <FiAward size={18} className="text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Financial Habits</h3>
                  <span className={`ml-auto text-sm font-bold px-2.5 py-0.5 rounded-full ${habitScore.score >= 75 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : habitScore.score >= 50 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                    {habitScore.grade} ({habitScore.score}/100)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {[
                    { l: 'Budget', v: habitScore.breakdown.budgetAdherence, max: 25 },
                    { l: 'Savings', v: habitScore.breakdown.savingsConsistency, max: 25 },
                    { l: 'Goals', v: habitScore.breakdown.goalProgress, max: 25 },
                    { l: 'Stability', v: habitScore.breakdown.spendingStability, max: 25 },
                  ].map((item, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-medium text-slate-500">{item.l}</span>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{item.v}/{item.max}</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(item.v / item.max) * 100}%`, backgroundColor: (item.v / item.max) >= 0.7 ? '#10b981' : (item.v / item.max) >= 0.4 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                    </div>
                  ))}
                </div>
                {habitScore.habits && habitScore.habits.length > 0 && (
                  <div className="space-y-1.5">
                    {habitScore.habits.slice(0, 3).map((h, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5">
                        <span className="text-sm shrink-0">{h.icon}</span>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300">{h.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── ROW 6: Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            <div className={card}>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">6 Month Trend</h3>
              <div className="relative h-[260px] max-md:h-[200px]"><Line data={trendChartData} options={chartOpts} /></div>
            </div>
            {summary.categoryExpenses.length > 0 && (
              <div className={card}>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Expenses by Category</h3>
                <div className="relative h-[260px] max-md:h-[200px]"><Doughnut data={categoryChartData} options={chartOpts} /></div>
              </div>
            )}
          </div>

          {/* ── ROW 7: AI Chat + Recent Transactions ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
            {/* AI Chat */}
            <div className={card}>
              <div className="flex items-center gap-2 mb-3">
                <FiMessageCircle size={18} className="text-primary" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Finance Assistant</h3>
              </div>
              <div className="h-[280px] overflow-y-auto mb-3 space-y-2 pr-1">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <FiMessageCircle size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="text-xs text-slate-400 mb-3">Ask me anything about your finances!</p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {['Where did my money go?', 'How can I save ₹5000?', 'Can I afford ₹20000?', 'Give me a summary'].map((q, i) => (
                        <button key={i} onClick={() => { setChatInput(q); }} className="text-[10px] px-2.5 py-1.5 rounded-full bg-primary-light text-primary font-medium border-none cursor-pointer hover:bg-primary-medium transition-all">{q}</button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-2.5 rounded-xl text-[12px] leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start"><div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-xs text-slate-500">Analyzing your finances...</div></div>
                )}
              </div>
              <div className="flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} placeholder="Ask about your finances..." className="flex-1 py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light" />
                <button onClick={sendChat} disabled={chatLoading} className="px-3 py-2 rounded-lg bg-primary text-white border-none cursor-pointer hover:bg-primary-hover transition-all disabled:opacity-50"><FiSend size={16} /></button>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className={card}>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent Transactions</h3>
              <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
                {recentTransactions.length === 0 ? (
                  <p className="text-slate-500 text-center text-sm py-6">No transactions yet</p>
                ) : (
                  recentTransactions.map((tx, i) => (
                    <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-md bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: tx.type === 'income' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: tx.type === 'income' ? '#10b981' : '#ef4444' }}>
                        {tx.type === 'income' ? '+' : '-'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{tx.title}</h4>
                        <p className="text-[10px] text-slate-500">{tx.transactionType}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className={`text-xs font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}</div>
                        <p className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

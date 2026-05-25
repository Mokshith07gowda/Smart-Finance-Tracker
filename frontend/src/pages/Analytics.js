import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FiTrendingUp, FiTrendingDown, FiDollarSign, FiPieChart, FiBarChart2, FiCalendar, FiShield, FiDownload, FiGrid } from 'react-icons/fi';
import { CurrencyContext } from '../context/CurrencyContext';
import { LanguageContext } from '../context/LanguageContext';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const card = 'bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 transition-all';
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [heatmap, setHeatmap] = useState(null);
  const { formatCurrency } = useContext(CurrencyContext);
  const { t } = useContext(LanguageContext);

  const fetchHeatmap = useCallback(async () => {
    try {
      const res = await axios.get('/api/smart/heatmap');
      setHeatmap(res.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/smart/deep-analytics');
        setData(res.data);
      } catch { toast.error('Failed to load analytics'); }
      finally { setLoading(false); }
    };
    fetchData();
    fetchHeatmap();
  }, [fetchHeatmap]);

  if (loading) return (
    <div className="container mt-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1,2,3,4].map(i => <div key={i} className={`${card} h-24 animate-pulse bg-slate-100 dark:bg-slate-700`} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1,2,3,4].map(i => <div key={i} className={`${card} h-72 animate-pulse bg-slate-100 dark:bg-slate-700`} />)}
      </div>
    </div>
  );

  if (!data) return <div className="container mt-10 text-center text-slate-500">No analytics data available.</div>;

  const exportCSV = () => {
    const rows = [['Month','Income','Expenses','Savings','Savings Rate %']];
    Object.entries(data.monthlyData).forEach(([key, v]) => {
      rows.push([key, Math.round(v.income), Math.round(v.expense), Math.round(v.savings), v.income > 0 ? Math.round(((v.income - v.expense) / v.income) * 100) : 0]);
    });
    rows.push([]);
    rows.push(['Category','Total Spent']);
    Object.entries(data.categoryTotals).sort((a, b) => b[1] - a[1]).forEach(([cat, amt]) => rows.push([cat, Math.round(amt)]));
    rows.push([]);
    rows.push(['Metric','Value']);
    rows.push(['Total Income (Year)', data.yearIncome]);
    rows.push(['Total Expenses (Year)', data.yearExpense]);
    rows.push(['Total Savings (Year)', data.yearSavings]);
    rows.push(['Total Transactions', data.totalTransactions]);
    rows.push(['Avg Transaction', data.avgTransaction]);
    rows.push(['Goals Completed', data.goalsCompleted]);
    rows.push(['Goals Active', data.goalsActive]);
    if (data.budgetVsActual.length > 0) {
      rows.push([]);
      rows.push(['Budget Category','Budgeted','Actual','Difference']);
      data.budgetVsActual.forEach(b => rows.push([b.category, b.budget, b.actual, b.budget - b.actual]));
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report exported!');
  };

  const tabs = [
    { id: 'overview', label: t('ana_overview'), icon: <FiBarChart2 size={14} /> },
    { id: 'income-expense', label: t('ana_income_expense'), icon: <FiTrendingUp size={14} /> },
    { id: 'categories', label: t('ana_categories'), icon: <FiPieChart size={14} /> },
    { id: 'budgets', label: t('ana_budgets'), icon: <FiShield size={14} /> },
    { id: 'habits', label: t('ana_habits_tab'), icon: <FiCalendar size={14} /> },
    { id: 'heatmap', label: t('ana_heatmap'), icon: <FiGrid size={14} /> },
  ];

  // Chart configs
  const monthLabels = Object.keys(data.monthlyData).map(k => MONTH_NAMES[parseInt(k.split('-')[1]) - 1]);

  const incomeExpenseChart = {
    labels: monthLabels,
    datasets: [
      { label: 'Income', data: Object.values(data.monthlyData).map(v => Math.round(v.income)), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6 },
      { label: 'Expenses', data: Object.values(data.monthlyData).map(v => Math.round(v.expense)), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6 },
      { label: 'Savings', data: Object.values(data.monthlyData).map(v => Math.round(v.savings)), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6 },
    ]
  };

  const catColors = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316','#14b8a6','#84cc16'];
  const sortedCats = Object.entries(data.categoryTotals).sort((a, b) => b[1] - a[1]);
  const catChart = {
    labels: sortedCats.map(([k]) => k),
    datasets: [{ data: sortedCats.map(([, v]) => Math.round(v)), backgroundColor: catColors.slice(0, sortedCats.length), borderWidth: 0, hoverOffset: 8 }]
  };

  const savingsRateChart = {
    labels: monthLabels,
    datasets: [{ label: 'Savings Rate %', data: data.savingsRateTrend.map(v => v.rate), backgroundColor: data.savingsRateTrend.map(v => v.rate >= 20 ? '#10b981' : v.rate >= 0 ? '#f59e0b' : '#ef4444'), borderRadius: 6, maxBarThickness: 40 }]
  };

  const budgetChart = data.budgetVsActual.length > 0 ? {
    labels: data.budgetVsActual.map(b => b.category),
    datasets: [
      { label: 'Budget', data: data.budgetVsActual.map(b => b.budget), backgroundColor: 'rgba(99,102,241,0.7)', borderRadius: 6, maxBarThickness: 35 },
      { label: 'Actual', data: data.budgetVsActual.map(b => b.actual), backgroundColor: data.budgetVsActual.map(b => b.actual > b.budget ? 'rgba(239,68,68,0.7)' : 'rgba(16,185,129,0.7)'), borderRadius: 6, maxBarThickness: 35 },
    ]
  } : null;

  const dayLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const txByDayChart = {
    labels: dayLabels,
    datasets: [{ label: 'Transactions', data: dayLabels.map(d => data.transactionsByDay[d] || 0), backgroundColor: dayLabels.map(d => d === 'Sat' || d === 'Sun' ? '#f59e0b' : '#6366f1'), borderRadius: 6, maxBarThickness: 40 }]
  };

  const chartOpts = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'top', labels: { boxWidth: 10, padding: 14, usePointStyle: true, font: { size: 11 } } }, tooltip: { padding: 10, cornerRadius: 8, titleFont: { size: 12 }, bodyFont: { size: 11 } } }, scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { font: { size: 10 } } } } };
  const doughnutOpts = { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 10, usePointStyle: true, font: { size: 10 } } } } };
  const barOpts = { ...chartOpts, plugins: { ...chartOpts.plugins, legend: { display: false } } };

  return (
    <div className="container mt-10 mb-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('ana_title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('ana_subtitle')}</p>
        </div>
        <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md text-[13px] font-semibold bg-primary text-white hover:bg-primary-hover transition-all cursor-pointer border-none shadow-sm"><FiDownload size={14} /> {t('ana_export')}</button>
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer border-none ${tab === tb.id ? 'bg-primary text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
            {tb.icon} {tb.label}
          </button>
        ))}
      </div>

      {/* Year Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { l: 'Year Income', v: formatCurrency(data.yearIncome), c: 'text-emerald-600', icon: <FiTrendingUp size={16} />, bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          { l: 'Year Expenses', v: formatCurrency(data.yearExpense), c: 'text-red-500', icon: <FiTrendingDown size={16} />, bg: 'bg-red-50 dark:bg-red-900/20' },
          { l: 'Year Savings', v: formatCurrency(data.yearSavings), c: data.yearSavings >= 0 ? 'text-primary' : 'text-red-500', icon: <FiDollarSign size={16} />, bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { l: 'Transactions', v: data.totalTransactions, c: 'text-amber-600', icon: <FiBarChart2 size={16} />, bg: 'bg-amber-50 dark:bg-amber-900/20' },
        ].map((s, i) => (
          <div key={i} className={card}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg} ${s.c} mb-2`}>{s.icon}</div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{s.l}</p>
            <p className={`text-lg font-bold ${s.c} tracking-tight`}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={card}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Income vs Expense Trend</h3>
              <div className="h-72"><Line data={incomeExpenseChart} options={chartOpts} /></div>
            </div>
            <div className={card}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Spending by Category</h3>
              <div className="h-72"><Doughnut data={catChart} options={doughnutOpts} /></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className={card}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Savings Rate Trend</h3>
              <div className="h-56"><Bar data={savingsRateChart} options={barOpts} /></div>
            </div>
            <div className={card}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Transactions by Day</h3>
              <div className="h-56"><Bar data={txByDayChart} options={barOpts} /></div>
            </div>
            <div className={card}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Quick Stats</h3>
              <div className="space-y-3">
                {[
                  { l: 'Avg Transaction', v: formatCurrency(data.avgTransaction) },
                  { l: 'Annual Recurring', v: formatCurrency(data.annualRecurring) },
                  { l: 'Goals Active', v: data.goalsActive },
                  { l: 'Goals Completed', v: data.goalsCompleted },
                ].map((s, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                    <span className="text-xs text-slate-500">{s.l}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{s.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Income vs Expense Tab */}
      {tab === 'income-expense' && (
        <div className="space-y-4">
          <div className={card}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Monthly Income vs Expense vs Savings</h3>
            <div className="h-80"><Line data={incomeExpenseChart} options={chartOpts} /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(data.monthlyData).filter(([, v]) => v.income > 0 || v.expense > 0).map(([k, v]) => {
              const savRate = v.income > 0 ? Math.round((v.savings / v.income) * 100) : 0;
              return (
                <div key={k} className={card}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">{MONTH_NAMES[parseInt(k.split('-')[1]) - 1]} {k.split('-')[0]}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${savRate >= 20 ? 'bg-emerald-100 text-emerald-600' : savRate >= 0 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>{savRate}% saved</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><p className="text-[9px] text-slate-500 uppercase">Income</p><p className="text-xs font-bold text-emerald-600">{formatCurrency(v.income)}</p></div>
                    <div><p className="text-[9px] text-slate-500 uppercase">Expense</p><p className="text-xs font-bold text-red-500">{formatCurrency(v.expense)}</p></div>
                    <div><p className="text-[9px] text-slate-500 uppercase">Savings</p><p className={`text-xs font-bold ${v.savings >= 0 ? 'text-primary' : 'text-red-500'}`}>{formatCurrency(v.savings)}</p></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {tab === 'categories' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={card}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Category Distribution (Year)</h3>
              <div className="h-72"><Doughnut data={catChart} options={doughnutOpts} /></div>
            </div>
            <div className={card}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Category Breakdown</h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {sortedCats.map(([cat, amt], i) => {
                  const pct = data.yearExpense > 0 ? Math.round((amt / data.yearExpense) * 100) : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: catColors[i % catColors.length] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{cat}</span>
                          <span className="text-slate-500">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: catColors[i % catColors.length] }} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 shrink-0">{formatCurrency(amt)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* Top Merchants */}
          <div className={card}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Top Merchants / Payees</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {data.topMerchants.map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30 text-center">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate mb-1">{m.name}</p>
                  <p className="text-sm font-bold text-primary">{formatCurrency(m.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Budget Analysis Tab */}
      {tab === 'budgets' && (
        <div className="space-y-4">
          {budgetChart ? (
            <>
              <div className={card}>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Budget vs Actual Spending (Current Month)</h3>
                <div className="h-72"><Bar data={budgetChart} options={chartOpts} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.budgetVsActual.map((b, i) => {
                  const isOver = b.actual > b.budget;
                  return (
                    <div key={i} className={`${card} ${isOver ? 'border-l-[3px] border-l-red-500' : 'border-l-[3px] border-l-emerald-500'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{b.category}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isOver ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{b.percentage}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, b.percentage)}%`, backgroundColor: isOver ? '#ef4444' : b.percentage > 80 ? '#f59e0b' : '#10b981' }} />
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-500">Budget: {formatCurrency(b.budget)}</span>
                        <span className={`font-bold ${isOver ? 'text-red-500' : 'text-emerald-600'}`}>Spent: {formatCurrency(b.actual)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className={`${card} text-center py-16`}>
              <FiShield size={48} className="mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No budgets set for the current month. Set budgets to see analysis.</p>
            </div>
          )}
        </div>
      )}

      {/* Spending Habits Tab */}
      {tab === 'habits' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className={card}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Transactions by Weekday</h3>
              <div className="h-56"><Bar data={txByDayChart} options={barOpts} /></div>
            </div>
            <div className={card}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">Expense Size Distribution</h3>
              <div className="h-56">
                <Doughnut data={{
                  labels: ['< ₹500', '₹500-2K', '₹2K-10K', '> ₹10K'],
                  datasets: [{ data: [data.sizeDistribution.small, data.sizeDistribution.medium, data.sizeDistribution.large, data.sizeDistribution.veryLarge], backgroundColor: ['#10b981','#6366f1','#f59e0b','#ef4444'], borderWidth: 0 }]
                }} options={doughnutOpts} />
              </div>
            </div>
          </div>
          <div className={card}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Savings Rate Trend</h3>
            <div className="h-64"><Bar data={savingsRateChart} options={{ ...barOpts, scales: { ...barOpts.scales, y: { ...barOpts.scales.y, suggestedMin: -20, suggestedMax: 60 } } }} /></div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">Green = 20%+ savings rate (healthy) • Yellow = 0-20% • Red = negative</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { l: 'Avg Transaction', v: formatCurrency(data.avgTransaction), sub: `${data.totalTransactions} total` },
              { l: 'Annual Recurring', v: formatCurrency(data.annualRecurring), sub: 'subscriptions & bills' },
              { l: 'Active Goals', v: data.goalsActive, sub: `${data.goalsCompleted} completed` },
              { l: 'Savings Rate', v: `${data.yearIncome > 0 ? Math.round((data.yearSavings / data.yearIncome) * 100) : 0}%`, sub: 'this year' },
            ].map((s, i) => (
              <div key={i} className={card}>
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">{s.l}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{s.v}</p>
                <p className="text-[10px] text-slate-400">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Heatmap Tab */}
      {tab === 'heatmap' && heatmap && (
        <div className="space-y-4">
          {/* Daily spending heatmap */}
          <div className={card}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Daily Spending Heatmap (Last 6 Months)</h3>
            {heatmap.daily && heatmap.daily.length > 0 ? (
              <div>
                <div className="flex flex-wrap gap-[3px]">
                  {heatmap.daily.map((d, i) => {
                    const maxAmt = Math.max(...heatmap.daily.map(x => x.total), 1);
                    const intensity = d.total / maxAmt;
                    const bg = d.total === 0 ? 'bg-slate-100 dark:bg-slate-700/40' : '';
                    return (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-[2px] transition-all hover:ring-2 hover:ring-primary/40 ${bg}`}
                        style={d.total > 0 ? { backgroundColor: `rgba(99,102,241,${0.15 + intensity * 0.85})` } : {}}
                        title={`${d.date}: ${formatCurrency(d.total)} (${d.count} txn)`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500">
                  <span>Less</span>
                  {[0.15, 0.35, 0.55, 0.75, 1].map((v, i) => (
                    <div key={i} className="w-3 h-3 rounded-[2px]" style={{ backgroundColor: `rgba(99,102,241,${v})` }} />
                  ))}
                  <span>More</span>
                </div>
              </div>
            ) : <p className="text-xs text-slate-400">Not enough data for heatmap</p>}
          </div>

          {/* Category by month heatmap */}
          {heatmap.categoryByMonth && Object.keys(heatmap.categoryByMonth).length > 0 && (
            <div className={card}>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">Category Spending by Month</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr>
                      <th className="text-left p-2 font-semibold text-slate-600 dark:text-slate-400 sticky left-0 bg-white dark:bg-slate-800">Category</th>
                      {(() => {
                        const months = new Set();
                        Object.values(heatmap.categoryByMonth).forEach(mv => Object.keys(mv).forEach(m => months.add(m)));
                        return [...months].sort().map(m => <th key={m} className="p-2 font-semibold text-slate-600 dark:text-slate-400 text-center">{MONTH_NAMES[parseInt(m.split('-')[1]) - 1]}</th>);
                      })()}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(heatmap.categoryByMonth).map(([cat, months]) => {
                      const allMonths = new Set();
                      Object.values(heatmap.categoryByMonth).forEach(mv => Object.keys(mv).forEach(m => allMonths.add(m)));
                      const sortedMonths = [...allMonths].sort();
                      const maxVal = Math.max(...Object.values(months), 1);
                      return (
                        <tr key={cat} className="border-t border-slate-100 dark:border-slate-700">
                          <td className="p-2 font-semibold text-slate-700 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-800 whitespace-nowrap">{cat}</td>
                          {sortedMonths.map(m => {
                            const val = months[m] || 0;
                            const intensity = val / maxVal;
                            return (
                              <td key={m} className="p-1 text-center">
                                <div className="mx-auto w-full min-w-[40px] py-1.5 px-1 rounded text-[10px] font-medium" style={val > 0 ? { backgroundColor: `rgba(99,102,241,${0.1 + intensity * 0.4})`, color: intensity > 0.5 ? '#fff' : '#6366f1' } : { color: '#94a3b8' }}>
                                  {val > 0 ? formatCurrency(val) : '-'}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'heatmap' && !heatmap && (
        <div className={`${card} text-center py-16`}>
          <FiGrid size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">Loading heatmap data...</p>
        </div>
      )}
    </div>
  );
};

export default Analytics;

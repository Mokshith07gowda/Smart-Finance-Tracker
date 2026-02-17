import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPieChart } from 'react-icons/fi';
import { MdAccountBalanceWallet } from 'react-icons/md';
import { CurrencyContext } from '../context/CurrencyContext';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { formatCurrency, country } = useContext(CurrencyContext);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, trendRes, transactionsRes] = await Promise.all([
        axios.get('/api/dashboard/summary'),
        axios.get('/api/dashboard/monthly-trend'),
        axios.get('/api/dashboard/recent-transactions?limit=8')
      ]);

      setSummary(summaryRes.data);
      setMonthlyTrend(trendRes.data);
      setRecentTransactions(transactionsRes.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Monthly Trend Chart Data
  const trendChartData = {
    labels: monthlyTrend.map(m => m.month),
    datasets: [
      {
        label: 'Income',
        data: monthlyTrend.map(m => m.salary),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Expenses',
        data: monthlyTrend.map(m => m.expenses),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Savings',
        data: monthlyTrend.map(m => m.savings),
        borderColor: 'rgb(79, 70, 229)',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        tension: 0.4,
      }
    ],
  };

  // Category Expenses Chart Data
  const categoryChartData = summary ? {
    labels: summary.categoryExpenses.map(c => c._id),
    datasets: [
      {
        data: summary.categoryExpenses.map(c => c.total),
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(6, 182, 212, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderWidth: 0,
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '40px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '40px', marginBottom: '40px' }}>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-secondary">Overview of your financial health</p>
        </div>
      </div>

      {summary && (
        <>
          {/* Balance Card */}
          <div className="balance-card card fade-in">
            <div className="balance-card-inner">
              <div className="balance-icon-wrap">
                <MdAccountBalanceWallet size={32} />
              </div>
              <div className="balance-info">
                <h4>Balance</h4>
                <div className="balance-amount-wrapper">
                  <div className={`balance-amount ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(summary.balance)}
                  </div>
                  <div className="currency-info">
                    <span className="country-flag">{country.flag}</span>
                    <span className="country-name">{country.name}</span>
                    <span className="currency-code">({country.currency})</span>
                  </div>
                </div>
                <p className="text-secondary">All-time net balance</p>
              </div>
            </div>
            <div className="balance-breakdown">
              <div className="balance-item income">
                <span>Total Income</span>
                <span>+{formatCurrency(summary.allTimeSalary)}</span>
              </div>
              <div className="balance-item expense">
                <span>Total Expenses</span>
                <span>-{formatCurrency(summary.allTimeExpenses)}</span>
              </div>
              <div className="balance-item lent">
                <span>Money Lent (Outstanding)</span>
                <span>-{formatCurrency(summary.totalLentOutstanding)}</span>
              </div>
              <div className="balance-item borrowed">
                <span>Money Borrowed (Outstanding)</span>
                <span>+{formatCurrency(summary.totalBorrowedOutstanding)}</span>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards grid grid-2 fade-in">
            <div className="stat-card card" style={{ borderLeft: '4px solid #10b981' }}>
              <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <FiTrendingUp size={24} />
              </div>
              <div className="stat-details">
                <h4>Total Income</h4>
                <div className="stat-value">{formatCurrency(summary.totalSalary)}</div>
                <p className="text-secondary">This month</p>
              </div>
            </div>

            <div className="stat-card card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div className="stat-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                <FiTrendingDown size={24} />
              </div>
              <div className="stat-details">
                <h4>Total Expenses</h4>
                <div className="stat-value">{formatCurrency(summary.totalExpenses)}</div>
                <p className="text-secondary">This month</p>
              </div>
            </div>

            <div className="stat-card card" style={{ borderLeft: '4px solid #4f46e5' }}>
              <div className="stat-icon" style={{ backgroundColor: 'rgba(79, 70, 229, 0.1)', color: '#4f46e5' }}>
                <FiDollarSign size={24} />
              </div>
              <div className="stat-details">
                <h4>Savings</h4>
                <div className="stat-value" style={{ color: summary.savings >= 0 ? '#10b981' : '#ef4444' }}>
                  {formatCurrency(summary.savings)}
                </div>
                <p className="text-secondary">Savings rate: {summary.savingsRate}%</p>
              </div>
            </div>

            <div className="stat-card card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                <FiPieChart size={24} />
              </div>
              <div className="stat-details">
                <h4>Budget Status</h4>
                <div className="stat-value">
                  {summary.budgetAmount > 0 ? `${summary.budgetUsed}%` : 'Not Set'}
                </div>
                {summary.budgetAmount > 0 && (
                  <p className={summary.budgetUsed > 100 ? 'text-danger' : 'text-secondary'}>
                    {summary.budgetRemaining >= 0 
                      ? `${formatCurrency(summary.budgetRemaining)} remaining`
                      : `${formatCurrency(Math.abs(summary.budgetRemaining))} over budget`
                    }
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Budget Progress Bar */}
          {summary.budgetAmount > 0 && (
            <div className="budget-progress card fade-in">
              <h3>Monthly Budget Progress</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ 
                    width: `${Math.min(summary.budgetUsed, 100)}%`,
                    backgroundColor: summary.budgetUsed > 100 ? '#ef4444' : summary.budgetUsed > 80 ? '#f59e0b' : '#10b981'
                  }}
                />
              </div>
              <div className="progress-labels">
                <span>{formatCurrency(summary.totalExpenses)}</span>
                <span>{formatCurrency(summary.budgetAmount)}</span>
              </div>
            </div>
          )}

          {/* Charts */}
          <div className="charts-section grid grid-2">
            <div className="chart-card card fade-in">
              <h3>6 Month Trend</h3>
              <div className="chart-container">
                <Line data={trendChartData} options={chartOptions} />
              </div>
            </div>

            {summary.categoryExpenses.length > 0 && (
              <div className="chart-card card fade-in">
                <h3>Expenses by Category</h3>
                <div className="chart-container">
                  <Doughnut data={categoryChartData} options={chartOptions} />
                </div>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="recent-transactions card fade-in">
            <h3>Recent Transactions</h3>
            <div className="transactions-list">
              {recentTransactions.length === 0 ? (
                <p className="text-secondary text-center">No transactions yet</p>
              ) : (
                recentTransactions.map((transaction, index) => (
                  <div key={index} className="transaction-item">
                    <div className="transaction-icon" 
                      style={{ 
                        backgroundColor: transaction.type === 'income' 
                          ? 'rgba(16, 185, 129, 0.1)' 
                          : 'rgba(239, 68, 68, 0.1)',
                        color: transaction.type === 'income' ? '#10b981' : '#ef4444'
                      }}>
                      {transaction.type === 'income' ? '+' : '-'}
                    </div>
                    <div className="transaction-details">
                      <h4>{transaction.title}</h4>
                      <p className="text-secondary">{transaction.transactionType}</p>
                    </div>
                    <div className="transaction-amount">
                      <div className={transaction.type === 'income' ? 'text-success' : 'text-danger'}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                      <p className="text-secondary">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;

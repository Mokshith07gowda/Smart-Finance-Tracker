import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { MdDashboard, MdAccountBalanceWallet, MdSplitscreen } from 'react-icons/md';
import { BiWallet } from 'react-icons/bi';
import { RiMoneyDollarCircleLine, RiHandCoinLine, RiHandHeartLine } from 'react-icons/ri';
import { AuthContext } from '../context/AuthContext';
import './Home.css';

const Home = () => {
  const { user } = useContext(AuthContext);

  const features = [
    {
      icon: <MdDashboard size={32} />,
      title: 'Dashboard',
      color: '#6366f1',
      link: '/dashboard',
      description: 'Your financial command center. Get a complete overview of your income, expenses, and savings at a glance with interactive charts and real-time summaries.',
      howToUse: 'Navigate to Dashboard to see your financial snapshot — total income, expenses, budget usage, and visual breakdowns of where your money goes.',
      howItWorks: 'The dashboard automatically aggregates data from all your salary entries, expenses, budgets, and lending records to display consolidated charts and statistics.'
    },
    {
      icon: <RiMoneyDollarCircleLine size={32} />,
      title: 'Salary',
      color: '#10b981',
      link: '/salary',
      description: 'Track every source of income — whether it\'s your monthly salary, freelance earnings, bonuses, or side hustle revenue. Keep a complete history of all money coming in.',
      howToUse: 'Click "Add Salary" to log a new income entry. Fill in the amount, source (e.g., Company, Freelance), and date. View, edit, or delete entries anytime.',
      howItWorks: 'Each salary entry is stored with its amount, source, and date. The system calculates your total earnings, monthly averages, and displays income trends over time.'
    },
    {
      icon: <MdAccountBalanceWallet size={32} />,
      title: 'Budget',
      color: '#f59e0b',
      link: '/budget',
      description: 'Set spending limits for different categories like Food, Transport, Entertainment, and more. Stay within your financial goals and avoid overspending.',
      howToUse: 'Create a budget by selecting a category, setting a limit amount, and choosing the period. Track progress as your expenses are automatically matched against budgets.',
      howItWorks: 'Budgets are linked to expense categories. When you add an expense, the system checks it against your budget and shows how much you\'ve spent vs. your limit with progress bars.'
    },
    {
      icon: <BiWallet size={32} />,
      title: 'Expenses',
      color: '#ef4444',
      link: '/expenses',
      description: 'Log every purchase, bill, or payment you make. Categorize expenses to understand your spending patterns and identify areas where you can save.',
      howToUse: 'Click "Add Expense" to record a purchase. Enter the amount, select a category (Food, Transport, Bills, etc.), add a description, and pick the date.',
      howItWorks: 'All expenses are categorized and dated. The system generates breakdowns by category, tracks daily/monthly spending, and compares against your budgets automatically.'
    },
    {
      icon: <RiHandCoinLine size={32} />,
      title: 'Money Lent',
      color: '#8b5cf6',
      link: '/money-lent',
      description: 'Keep track of money you\'ve lent to friends, family, or colleagues. Never forget who owes you and how much — with payment tracking and status updates.',
      howToUse: 'Add a lending record with the person\'s name, amount, date, and optional notes. As they pay you back, record partial or full payments to track the remaining balance.',
      howItWorks: 'Each lending entry tracks the total amount, payments received, and outstanding balance. Progress bars show repayment status, and entries auto-complete when fully repaid.'
    },
    {
      icon: <RiHandHeartLine size={32} />,
      title: 'Money Borrowed',
      color: '#e84393',
      link: '/money-borrowed',
      description: 'Track money you\'ve borrowed from others. Stay accountable, record your repayments, and know exactly how much you still owe at any time.',
      howToUse: 'Add a borrowing record with the lender\'s name, amount, date, and reason. Log your repayments as you make them to keep an accurate outstanding balance.',
      howItWorks: 'Similar to Money Lent but from the borrower\'s perspective. Tracks total borrowed, payments made, and remaining debt with visual progress indicators.'
    },
    {
      icon: <MdSplitscreen size={32} />,
      title: 'Split Bills',
      color: '#667eea',
      link: '/split-bills',
      description: 'Manage shared expenses with friends, roommates, or colleagues. Split bills equally or unequally, track who paid and who owes whom.',
      howToUse: 'Click "Add Expense" to create a split bill. Enter who paid, choose split type (equal/unequal), add participants with their shares, and set the total amount.',
      howItWorks: 'Split Bills calculates each person\'s share automatically for equal splits, or lets you customize amounts for unequal splits. It tracks amounts owed to you and amounts you owe to others.'
    }
  ];

  return (
    <div className="home-page">
      <div className="container">
        {/* Hero Section */}
        <section className="home-hero">
          <div className="hero-greeting">
            <h1>Welcome, <span className="hero-name">{user?.name || 'User'}</span>! 👋</h1>
            <p className="hero-subtitle">Your personal finance companion</p>
          </div>
          <div className="hero-description">
            <p>
              <strong>Smart Finance Tracker</strong> is your all-in-one personal finance manager designed to help you take full control of your money. 
              Track your income, manage expenses, set budgets, and keep records of money lent or borrowed — all in one place. 
              With real-time currency conversion, beautiful charts, and smart insights, managing your finances has never been easier.
            </p>
          </div>
        </section>

        {/* Currency Reminder */}
        <div className="currency-reminder">
          <span className="currency-reminder-icon">💱</span>
          <p>You can change your preferred currency anytime in the <Link to="/settings" className="currency-reminder-link">Settings</Link> page. We support 128 world currencies with real-time exchange rates!</p>
        </div>

        {/* Quick Start */}
        <section className="home-quickstart">
          <h2 className="section-title">Quick Start</h2>
          <div className="quickstart-steps">
            <div className="quickstart-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Add Your Income</h3>
                <p>Start by logging your salary or income sources in the Salary section.</p>
              </div>
            </div>
            <div className="quickstart-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Set Budgets</h3>
                <p>Create spending limits for categories like Food, Transport, and Bills.</p>
              </div>
            </div>
            <div className="quickstart-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Track Expenses</h3>
                <p>Log every expense and watch your budget progress in real-time.</p>
              </div>
            </div>
            <div className="quickstart-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Monitor Dashboard</h3>
                <p>Visit the Dashboard for a complete overview of your financial health.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="home-features">
          <h2 className="section-title">Features & How They Work</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div className="feature-card" key={index} style={{ '--feature-color': feature.color }}>
                <div className="feature-card-header">
                  <div className="feature-icon" style={{ color: feature.color }}>
                    {feature.icon}
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                </div>

                <div className="feature-section">
                  <h4>📋 What is it?</h4>
                  <p>{feature.description}</p>
                </div>

                <div className="feature-section">
                  <h4>🚀 How to Use</h4>
                  <p>{feature.howToUse}</p>
                </div>

                <div className="feature-section">
                  <h4>⚙️ How it Works</h4>
                  <p>{feature.howItWorks}</p>
                </div>

                <Link to={feature.link} className="feature-go-btn" style={{ backgroundColor: feature.color }}>
                  Go to {feature.title} →
                </Link>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;

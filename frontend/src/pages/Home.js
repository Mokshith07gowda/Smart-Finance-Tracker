import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MdDashboard, MdAccountBalanceWallet, MdSplitscreen } from 'react-icons/md';
import { BiWallet } from 'react-icons/bi';
import { RiMoneyDollarCircleLine, RiHandCoinLine, RiHandHeartLine } from 'react-icons/ri';
import {
  FiArrowUp, FiArrowRight, FiShield, FiGlobe, FiTrendingUp, FiPieChart,
  FiZap, FiLock, FiCheckCircle, FiTarget, FiRefreshCw, FiBarChart2,
  FiBell, FiMessageCircle, FiDroplet, FiActivity, FiCpu, FiStar
} from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';

const quotes = [
  { text: "A budget is telling your money where to go instead of wondering where it went.", author: "Dave Ramsey" },
  { text: "Do not save what is left after spending, but spend what is left after saving.", author: "Warren Buffett" },
  { text: "Financial freedom is available to those who learn about it and work for it.", author: "Robert Kiyosaki" },
  { text: "Beware of little expenses. A small leak will sink a great ship.", author: "Benjamin Franklin" },
  { text: "It's not how much money you make, but how much money you keep.", author: "Robert Kiyosaki" },
  { text: "The habit of saving is itself an education.", author: "T.T. Munger" },
];

const AnimatedCounter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const startTime = Date.now();
        const tick = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(end * ease));
          if (progress < 1) requestAnimationFrame(tick);
        };
        tick();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const Home = () => {
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeQuote, setActiveQuote] = useState(0);
  const topRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setActiveQuote(prev => (prev + 1) % quotes.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const coreModules = [
    { icon: <MdDashboard size={24} />, title: 'Dashboard', color: '#6366f1', gradient: 'from-indigo-500 to-purple-600', link: '/dashboard', desc: 'Financial command center with charts, health score, AI insights, and spending predictions.' },
    { icon: <RiMoneyDollarCircleLine size={24} />, title: 'Salary Tracker', color: '#10b981', gradient: 'from-emerald-500 to-teal-600', link: '/salary', desc: 'Log salary, freelance, bonuses, and side income with type classification.' },
    { icon: <MdAccountBalanceWallet size={24} />, title: 'Smart Budgets', color: '#f59e0b', gradient: 'from-amber-500 to-orange-600', link: '/budget', desc: 'Category-wise budgets with auto-alerts at 85% and 100% thresholds.' },
    { icon: <BiWallet size={24} />, title: 'Expenses', color: '#ef4444', gradient: 'from-red-500 to-rose-600', link: '/expenses', desc: 'Auto-categorization, CSV import, bulk operations, and tag-based filtering.' },
    { icon: <FiTarget size={24} />, title: 'Savings Goals', color: '#0ea5e9', gradient: 'from-sky-500 to-blue-600', link: '/goals', desc: 'Set targets with deadlines, track progress, and get at-risk alerts.' },
    { icon: <FiRefreshCw size={24} />, title: 'Recurring Bills', color: '#14b8a6', gradient: 'from-teal-500 to-emerald-600', link: '/recurring-expenses', desc: 'Subscriptions and bills with due-date reminders and auto-processing.' },
    { icon: <FiBarChart2 size={24} />, title: 'Analytics', color: '#8b5cf6', gradient: 'from-violet-500 to-purple-600', link: '/analytics', desc: 'Spending heatmaps, deep analytics, trend charts, and export reports.' },
    { icon: <FiZap size={24} />, title: 'Smart Rules', color: '#f97316', gradient: 'from-orange-500 to-amber-600', link: '/rules', desc: 'Automation engine — trigger actions based on spending conditions.' },
    { icon: <RiHandCoinLine size={24} />, title: 'Money Lent', color: '#a855f7', gradient: 'from-purple-500 to-fuchsia-600', link: '/money-lent', desc: 'Track who owes you with payment history and status updates.' },
    { icon: <RiHandHeartLine size={24} />, title: 'Money Borrowed', color: '#ec4899', gradient: 'from-pink-500 to-rose-600', link: '/money-borrowed', desc: 'Stay accountable on debts with repayment tracking and reminders.' },
    { icon: <MdSplitscreen size={24} />, title: 'Split Bills', color: '#667eea', gradient: 'from-blue-500 to-indigo-600', link: '/split-bills', desc: 'Split expenses with friends — equal, percentage, or custom amounts.' },
    { icon: <FiMessageCircle size={24} />, title: 'AI Finance Chat', color: '#06b6d4', gradient: 'from-cyan-500 to-blue-600', link: '/dashboard', desc: 'Ask questions about your finances and get instant AI-powered answers.' },
  ];

  const stats = [
    { icon: <FiShield size={22} />, value: 256, suffix: '-bit', label: 'Encryption' },
    { icon: <FiGlobe size={22} />, value: 128, suffix: '+', label: 'Currencies' },
    { icon: <FiActivity size={22} />, value: 25, suffix: '', label: 'Languages' },
    { icon: <FiCpu size={22} />, value: 15, suffix: '+', label: 'AI Engines' },
    { icon: <FiBarChart2 size={22} />, value: 12, suffix: '', label: 'Modules' },
    { icon: <FiStar size={22} />, value: 30, suffix: '+', label: 'Preset Themes' },
  ];

  const quickSteps = [
    { num: '01', title: 'Add Income', desc: 'Log salary, freelance, or any income source with type tags.', icon: <RiMoneyDollarCircleLine size={22} /> },
    { num: '02', title: 'Set Budgets', desc: 'Define monthly limits per category. Get alerts before overspending.', icon: <MdAccountBalanceWallet size={22} /> },
    { num: '03', title: 'Track Expenses', desc: 'Auto-categorized spending with CSV import and smart tags.', icon: <BiWallet size={22} /> },
    { num: '04', title: 'Get Insights', desc: 'AI-powered predictions, anomaly detection, and habit scoring.', icon: <FiCpu size={22} /> },
  ];

  const aiCapabilities = [
    { icon: <FiTrendingUp size={18} />, title: 'Spending Predictions', desc: 'Month-end spend forecast based on your velocity.' },
    { icon: <FiActivity size={18} />, title: 'Anomaly Detection', desc: 'Flags unusual spending vs your historical averages.' },
    { icon: <FiTarget size={18} />, title: 'Financial Health Score', desc: 'Multi-factor score — savings rate, budget adherence, debt ratio.' },
    { icon: <FiZap size={18} />, title: 'Auto-Categorization', desc: 'Smart keyword engine maps expenses to 9+ categories.' },
    { icon: <FiBell size={18} />, title: 'Smart Notifications', desc: 'Budget breach, anomaly, goal progress, and recurring bill alerts.' },
    { icon: <FiMessageCircle size={18} />, title: 'AI Chat Assistant', desc: 'Ask "How much did I spend on food?" and get instant answers.' },
    { icon: <FiPieChart size={18} />, title: 'Habit Scoring', desc: 'Track consistency, budget discipline, and savings habits.' },
    { icon: <FiBarChart2 size={18} />, title: 'Spending Velocity', desc: 'Real-time pace tracking vs your budget and last month.' },
  ];

  const techHighlights = [
    { icon: <FiLock size={18} />, title: 'Secure Auth', desc: 'JWT-based authentication with password reset flow.' },
    { icon: <FiGlobe size={18} />, title: '128+ Currencies', desc: 'Live exchange rates with automatic conversion.' },
    { icon: <FiGlobe size={18} />, title: '25 Languages', desc: 'Full UI translation — Hindi, Arabic, Japanese, and more.' },
    { icon: <FiDroplet size={18} />, title: '30+ Themes', desc: 'Light, Dark, and fully customizable color palettes.' },
    { icon: <FiCheckCircle size={18} />, title: 'CSV Import', desc: 'Bulk import expenses from bank statements.' },
    { icon: <FiBell size={18} />, title: 'Smart Alerts', desc: 'Event-driven notifications — no spam on refresh.' },
  ];

  return (
    <div ref={topRef} className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 opacity-[0.06] dark:opacity-[0.15]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-primary/8 to-transparent rounded-full -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-secondary/8 to-transparent rounded-full translate-y-1/3 -translate-x-1/4" />

        <div className="container relative pt-14 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-5 tracking-wide uppercase">
              <FiZap size={14} /> AI-Powered Finance Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-5">
              Your Complete
              <span className="block bg-gradient-to-r from-primary via-secondary to-pink-500 bg-clip-text text-transparent">
                Financial Command Center
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              12 integrated modules. AI-powered insights. 128+ currencies. 25 languages. Smart notifications. Everything you need to master your money — in one platform.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap mb-8">
              <Link to="/dashboard" className="inline-flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold rounded-xl no-underline shadow-glow hover:shadow-glow-lg transition-all hover:-translate-y-0.5">
                Open Dashboard <FiArrowRight size={16} />
              </Link>
              <Link to="/expenses" className="inline-flex items-center gap-2 px-7 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl no-underline border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <BiWallet size={16} /> Add Expense
              </Link>
              <Link to="/settings" className="inline-flex items-center gap-2 px-7 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-xl no-underline border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                <FiGlobe size={16} /> Settings
              </Link>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('home_welcome')}, <span className="font-bold text-primary">{user?.name || 'User'}</span>!
            </p>
          </div>
        </div>
      </section>

      {/* ===== QUOTE CAROUSEL ===== */}
      <section className="py-10 px-4">
        <div className="container max-w-3xl mx-auto text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-4">Words of Wisdom</p>
          <div className="relative min-h-[80px] flex items-center justify-center">
            <div key={activeQuote} className="animate-fade-in">
              <p className="text-xl sm:text-2xl font-medium text-slate-700 dark:text-slate-200 italic leading-relaxed mb-3">
                "{quotes[activeQuote].text}"
              </p>
              <p className="text-sm font-bold text-primary">— {quotes[activeQuote].author}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mt-5">
            {quotes.map((_, i) => (
              <button key={i} onClick={() => setActiveQuote(i)} className={`w-2 h-2 rounded-full border-none cursor-pointer transition-all ${i === activeQuote ? 'bg-primary w-6' : 'bg-slate-300 dark:bg-slate-600'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ===== ANIMATED STATS BAR ===== */}
      <section className="relative mt-8 z-10 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-3">
            {stats.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-center">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-primary">{s.icon}</div>
                <p className="text-lg font-extrabold text-slate-900 dark:text-white leading-tight"><AnimatedCounter end={s.value} suffix={s.suffix} /></p>
                <p className="text-[10px] text-slate-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-16 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/30 dark:to-transparent" />
        <div className="container relative">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-2">Get Started in Minutes</p>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">How It Works</h2>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {quickSteps.map((step, i) => (
              <div key={step.num} className="relative group animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                {i < quickSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(100%+4px)] w-[calc(100%-40px)] h-px bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 text-center h-full">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white mx-auto mb-3 shadow-glow">
                    {step.icon}
                  </div>
                  <span className="text-[10px] font-extrabold text-primary/40 tracking-widest">STEP {step.num}</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1 mb-1.5">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 12 CORE MODULES ===== */}
      <section className="py-16 px-4">
        <div className="container">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-2">Complete Toolkit</p>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">12 Integrated Modules</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">Every tool you need to track, analyze, and optimize your finances.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {coreModules.map((f, i) => (
              <Link key={i} to={f.link} className="group no-underline animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="relative bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 h-full overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110" style={{ backgroundColor: `${f.color}12`, color: f.color }}>
                      {f.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">{f.title}</h3>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AI CAPABILITIES ===== */}
      <section className="py-16 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20" />
        <div className="container relative">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-wider mb-3">
              <FiCpu size={12} /> Artificial Intelligence
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">AI-Powered Intelligence</h2>
            <p className="text-sm text-slate-500 mt-2 max-w-lg mx-auto">15+ smart engines analyze your data to deliver predictions, anomalies, and actionable insights.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {aiCapabilities.map((a, i) => (
              <div key={i} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3">{a.icon}</div>
                <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-1">{a.title}</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TECH HIGHLIGHTS ===== */}
      <section className="py-14 px-4">
        <div className="container">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary/60 mb-2">Under the Hood</p>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Built for Power Users</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {techHighlights.map((h, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-primary shrink-0">{h.icon}</div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900 dark:text-white mb-0.5">{h.title}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="py-14 px-4">
        <div className="container max-w-5xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M0%200h60v60H0z%22%20fill%3D%22none%22/%3E%3Cpath%20d%3D%22M30%200v60M0%2030h60%22%20stroke%3D%22rgba(255%2C255%2C255%2C0.05)%22%20stroke-width%3D%221%22/%3E%3C/svg%3E')]" />
            <div className="relative px-8 py-12 sm:px-12 text-center">
              <p className="text-white/60 text-xs font-bold uppercase tracking-[0.2em] mb-3">Ready to Take Control?</p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Start Managing Your Finances Now</h3>
              <p className="text-white/80 text-sm leading-relaxed max-w-xl mx-auto mb-6">
                Add your first income, set a budget, track expenses — and let our AI engines guide you to smarter financial decisions.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link to="/dashboard" className="inline-flex items-center gap-2 px-7 py-3 bg-white text-indigo-600 text-sm font-bold rounded-xl no-underline shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
                  Go to Dashboard <FiArrowRight size={16} />
                </Link>
                <Link to="/salary" className="inline-flex items-center gap-2 px-7 py-3 bg-white/15 text-white text-sm font-bold rounded-xl no-underline border border-white/30 hover:bg-white/25 transition-all hover:-translate-y-0.5">
                  Add Income <RiMoneyDollarCircleLine size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <section className="py-10 px-4 text-center">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] font-medium">
          12 Modules  ·  15+ AI Engines  ·  128+ Currencies  ·  25 Languages  ·  30+ Themes
        </p>
        <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-2">
          Built with React, Node.js, MongoDB, and Chart.js
        </p>
      </section>

      {/* ===== SCROLL TO TOP (desktop only, mobile uses bottom nav) ===== */}
      {showScrollTop && (
        <button onClick={scrollToTop} className="fixed bottom-8 right-8 z-50 w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary text-white shadow-glow-lg flex items-center justify-center border-none cursor-pointer transition-all hover:scale-110 hover:shadow-xl animate-fade-up max-md:hidden" title="Scroll to top">
          <FiArrowUp size={18} />
        </button>
      )}
    </div>
  );
};

export default Home;

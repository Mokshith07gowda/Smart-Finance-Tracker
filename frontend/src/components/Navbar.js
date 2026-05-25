import React, { useContext, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiLogOut, FiDollarSign, FiSettings, FiUser, FiMenu, FiX, FiTarget, FiRefreshCw, FiBarChart2, FiZap } from 'react-icons/fi';
import { MdDashboard, MdAccountBalanceWallet, MdSplitscreen } from 'react-icons/md';
import { BiWallet } from 'react-icons/bi';
import { RiMoneyDollarCircleLine, RiHandCoinLine, RiHandHeartLine } from 'react-icons/ri';
import { FiHome } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import { LanguageContext } from '../context/LanguageContext';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { logout } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const linkBase = 'flex items-center gap-3 px-4 py-2.5 rounded-lg no-underline font-medium text-[13.5px] transition-all duration-200 relative group';
  const linkActive = 'text-primary bg-primary-light font-semibold shadow-xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-primary before:rounded-r-full';
  const linkInactive = 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-700/50';

  const navLinks = [
    { to: '/home', icon: <FiHome size={18} />, label: t('nav_home') },
    { to: '/dashboard', icon: <MdDashboard size={18} />, label: t('nav_dashboard') },
    { to: '/salary', icon: <RiMoneyDollarCircleLine size={18} />, label: t('nav_salary') },
    { to: '/budget', icon: <MdAccountBalanceWallet size={18} />, label: t('nav_budget') },
    { to: '/expenses', icon: <BiWallet size={18} />, label: t('nav_expenses') },
    { to: '/money-lent', icon: <RiHandCoinLine size={18} />, label: t('nav_lent') },
    { to: '/money-borrowed', icon: <RiHandHeartLine size={18} />, label: t('nav_borrowed') },
    { to: '/split-bills', icon: <MdSplitscreen size={18} />, label: t('nav_split') },
    { to: '/goals', icon: <FiTarget size={18} />, label: t('nav_goals') },
    { to: '/recurring-expenses', icon: <FiRefreshCw size={18} />, label: t('nav_recurring') },
    { to: '/analytics', icon: <FiBarChart2 size={18} />, label: t('nav_analytics') },
    { to: '/rules', icon: <FiZap size={18} />, label: t('nav_rules') },
  ];

  return (
    <>
      {/* Sidebar Overlay (mobile) */}
      <div
        className={`fixed inset-0 bg-black/30 z-[1099] backdrop-blur-[2px] md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Fixed Sidebar */}
      <aside className={`fixed top-0 left-0 w-[272px] h-screen bg-white dark:bg-surface-900 border-r border-slate-200/70 dark:border-slate-700/50 z-[1100] overflow-y-auto overflow-x-hidden flex flex-col transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'}`}>
        {/* Brand */}
        <div className="px-6 py-5 shrink-0">
          <Link to="/dashboard" className="flex items-center gap-3 no-underline group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
              <FiDollarSign size={20} className="text-white" />
            </div>
            <span className="text-[17px] font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent tracking-tight">FinanceTracker</span>
          </Link>
        </div>

        {/* Navigation */}
        <div className="flex flex-col px-3 gap-0.5 flex-1 mt-1">
          <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">{t('nav_menu')}</p>
          {navLinks.map(link => (
            <Link key={link.to} to={link.to} className={`${linkBase} ${isActive(link.to) ? linkActive : linkInactive}`}>
              <span className="w-5 flex items-center justify-center">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

      </aside>

      {/* Top Navbar */}
      <nav className="fixed top-0 left-[272px] right-0 z-[1000] h-16 border-b border-slate-200/60 dark:border-slate-700/40 backdrop-blur-xl bg-white/80 dark:bg-surface-900/80 max-md:left-0">
        <div className="flex items-center px-6 h-full gap-3 max-md:px-4">
          <button
            className="hidden max-md:flex items-center justify-center bg-transparent border-none text-slate-700 dark:text-slate-200 cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Link to="/settings" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 font-medium text-[13px] no-underline hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-all max-md:p-2 max-md:[&>span]:hidden">
              <FiSettings size={16} />
              <span>{t('nav_settings')}</span>
            </Link>
            <Link to="/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 font-medium text-[13px] no-underline hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-all max-md:p-2 max-md:[&>span]:hidden">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <FiUser size={14} className="text-white" />
              </div>
              <span>{t('nav_profile')}</span>
            </Link>
            <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-400 font-medium text-[13px] bg-transparent border-none cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all max-md:p-2 max-md:[&>span]:hidden">
              <FiLogOut size={16} />
              <span>{t('nav_logout')}</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;

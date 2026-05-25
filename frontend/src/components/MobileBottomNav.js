import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { RiMoneyDollarCircleLine } from 'react-icons/ri';
import { MdAccountBalanceWallet } from 'react-icons/md';
import { BiWallet } from 'react-icons/bi';
import { FiTarget } from 'react-icons/fi';

const MobileBottomNav = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { to: '/salary', icon: <RiMoneyDollarCircleLine size={18} />, label: 'Salary' },
    { to: '/budget', icon: <MdAccountBalanceWallet size={18} />, label: 'Budget' },
    { to: '/expenses', icon: <BiWallet size={18} />, label: 'Expenses' },
    { to: '/goals', icon: <FiTarget size={18} />, label: 'Goals' },
  ];

  return (
    <>
      {/* Bottom Navigation Bar — visible only on mobile (md:hidden) */}
      <nav className="fixed bottom-0 left-0 right-0 z-[1200] md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around h-14 px-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 no-underline rounded-lg transition-all ${
                isActive(item.to)
                  ? 'text-primary'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                isActive(item.to)
                  ? 'bg-primary/10 scale-110'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-semibold leading-none ${
                isActive(item.to) ? 'text-primary' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {item.label}
              </span>
            </Link>
          ))}

        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;

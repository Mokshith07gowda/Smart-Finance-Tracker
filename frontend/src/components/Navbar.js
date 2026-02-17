import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiLogOut, FiDollarSign, FiSettings, FiUser } from 'react-icons/fi';
import { MdDashboard, MdAccountBalanceWallet, MdSplitscreen } from 'react-icons/md';
import { BiWallet } from 'react-icons/bi';
import { RiMoneyDollarCircleLine, RiHandCoinLine, RiHandHeartLine } from 'react-icons/ri';
import { FiHome } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { logout } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Fixed Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-brand">
            <FiDollarSign size={28} />
            <span>Finance Tracker</span>
          </Link>
        </div>
        <div className="sidebar-links">
          <Link to="/home" className={`sidebar-link ${isActive('/home') ? 'active' : ''}`}>
            <FiHome size={20} />
            <span>Home</span>
          </Link>
          <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}>
            <MdDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/salary" className={`sidebar-link ${isActive('/salary') ? 'active' : ''}`}>
            <RiMoneyDollarCircleLine size={20} />
            <span>Salary</span>
          </Link>
          <Link to="/budget" className={`sidebar-link ${isActive('/budget') ? 'active' : ''}`}>
            <MdAccountBalanceWallet size={20} />
            <span>Budget</span>
          </Link>
          <Link to="/expenses" className={`sidebar-link ${isActive('/expenses') ? 'active' : ''}`}>
            <BiWallet size={20} />
            <span>Expenses</span>
          </Link>
          <Link to="/money-lent" className={`sidebar-link ${isActive('/money-lent') ? 'active' : ''}`}>
            <RiHandCoinLine size={20} />
            <span>Money Lent</span>
          </Link>
          <Link to="/money-borrowed" className={`sidebar-link ${isActive('/money-borrowed') ? 'active' : ''}`}>
            <RiHandHeartLine size={20} />
            <span>Money Borrowed</span>
          </Link>
          <Link to="/split-bills" className={`sidebar-link ${isActive('/split-bills') ? 'active' : ''}`}>
            <MdSplitscreen size={20} />
            <span>Split Bills</span>
          </Link>
        </div>
      </aside>

      {/* Top Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="navbar-spacer"></div>
          <div className="navbar-user">
            <Link to="/settings" className="user-profile-link">
              <FiSettings size={20} />
              <span>Settings</span>
            </Link>
            <Link to="/profile" className="user-profile-link">
              <FiUser size={20} />
              <span>Profile</span>
            </Link>
            <button onClick={logout} className="btn-logout">
              <FiLogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;

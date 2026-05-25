import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { LanguageProvider } from './context/LanguageContext';

// Components
import Navbar from './components/Navbar';
import MobileBottomNav from './components/MobileBottomNav';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Salary from './pages/Salary';
import Budget from './pages/Budget';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import MoneyLent from './pages/MoneyLent';
import MoneyBorrowed from './pages/MoneyBorrowed';
import SplitBills from './pages/SplitBills';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Goals from './pages/Goals';
import RecurringExpenses from './pages/RecurringExpenses';
import Analytics from './pages/Analytics';
import Rules from './pages/Rules';

// Private Route Component
const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect to dashboard if already logged in)
// Forces light theme on auth pages so dark/custom theme doesn't affect them
const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    const root = document.documentElement;
    const prevTheme = root.getAttribute('data-theme');
    const hadDark = root.classList.contains('dark');

    // Force light appearance on public pages
    root.setAttribute('data-theme', 'light');
    root.classList.remove('dark');

    return () => {
      // Restore saved theme when leaving the public page
      root.setAttribute('data-theme', prevTheme || 'light');
      if (hadDark) root.classList.add('dark');
    };
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return user ? <Navigate to="/dashboard" /> : children;
};

function AppRoutes() {
  const { user } = useContext(AuthContext);

  return (
    <>
      {user && <Navbar />}
      {user && <MobileBottomNav />}
      <div className={user ? 'app-content' : ''}>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/home" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
          <Route path="/salary" element={<PrivateRoute><Salary /></PrivateRoute>} />
          <Route path="/budget" element={<PrivateRoute><Budget /></PrivateRoute>} />
          <Route path="/money-lent" element={<PrivateRoute><MoneyLent /></PrivateRoute>} />
          <Route path="/money-borrowed" element={<PrivateRoute><MoneyBorrowed /></PrivateRoute>} />
          <Route path="/split-bills" element={<PrivateRoute><SplitBills /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
          <Route path="/recurring-expenses" element={<PrivateRoute><RecurringExpenses /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />
          <Route path="/rules" element={<PrivateRoute><Rules /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
      <AuthProvider>
      <CurrencyProvider>
      <LanguageProvider>
        <AppRoutes />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </LanguageProvider>
      </CurrencyProvider>
      </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

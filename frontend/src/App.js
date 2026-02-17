import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider } from './context/CurrencyContext';

// Components
import Navbar from './components/Navbar';
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
const PublicRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

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
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <ThemeProvider>
      <CurrencyProvider>
      <AuthProvider>
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
      </AuthProvider>
      </CurrencyProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiDollarSign, FiCalendar, FiUser, FiCheck } from 'react-icons/fi';
import { CurrencyContext } from '../context/CurrencyContext';
import './MoneyBorrowed.css';

const MoneyBorrowed = () => {
  const [records, setRecords] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const { formatCurrency, currencySymbol, convertToBase, convertFromBase } = useContext(CurrencyContext);
  const [stats, setStats] = useState({
    totalBorrowed: 0,
    totalPaidBack: 0,
    totalPending: 0,
    activeDebts: 0
  });

  const [formData, setFormData] = useState({
    borrowedFrom: '',
    date: new Date().toISOString().split('T')[0],
    totalAmount: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    note: ''
  });

  // Fetch money borrowed records
  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/money-borrowed');
      setRecords(response.data);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/money-borrowed/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Handle add
  const handleAdd = async (e) => {
    e.preventDefault();

    if (!formData.borrowedFrom || !formData.totalAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.totalAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      await axios.post('/api/money-borrowed', { ...formData, totalAmount: convertToBase(formData.totalAmount) });
      toast.success(`Borrowed from ${formData.borrowedFrom} recorded successfully!`);
      setShowAddModal(false);
      setFormData({
        borrowedFrom: '',
        date: new Date().toISOString().split('T')[0],
        totalAmount: ''
      });
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add record');
    }
  };

  // Handle payment
  const handlePayment = async (e) => {
    e.preventDefault();

    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      await axios.put(`/api/money-borrowed/${selectedRecord._id}/payment`, { ...paymentData, amount: convertToBase(paymentData.amount) });
      toast.success('Payment recorded successfully!');
      setShowPaymentModal(false);
      setPaymentData({ amount: '', note: '' });
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  // Handle delete
  const handleDelete = async (id, borrowedFrom) => {
    if (window.confirm(`Are you sure you want to delete the record for ${borrowedFrom}?`)) {
      try {
        await axios.delete(`/api/money-borrowed/${id}`);
        toast.success('Record deleted successfully');
        fetchRecords();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete record');
      }
    }
  };

  // Open payment modal
  const openPaymentModal = (record) => {
    setSelectedRecord(record);
    setPaymentData({ amount: '', note: '' });
    setShowPaymentModal(true);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="money-borrowed-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="money-borrowed-container">
      <div className="money-borrowed-header">
        <div className="header-content">
          <h1>🤝 Money Borrowed</h1>
          <p>Track money you've borrowed from others</p>
        </div>
        <button className="add-btn" onClick={() => setShowAddModal(true)}>
          <FiPlus /> Add New
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <FiDollarSign />
          </div>
          <div className="stat-info">
            <p>Total Borrowed</p>
            <h3>{formatCurrency(stats.totalBorrowed)}</h3>
          </div>
        </div>
        <div className="stat-card received">
          <div className="stat-icon">
            <FiCheck />
          </div>
          <div className="stat-info">
            <p>Total Paid Back</p>
            <h3>{formatCurrency(stats.totalPaidBack)}</h3>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">
            <FiCalendar />
          </div>
          <div className="stat-info">
            <p>Total Pending</p>
            <h3>{formatCurrency(stats.totalPending)}</h3>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-icon">
            <FiUser />
          </div>
          <div className="stat-info">
            <p>Active Debts</p>
            <h3>{stats.activeDebts}</h3>
          </div>
        </div>
      </div>

      {/* Money Borrowed List */}
      <div className="money-borrowed-list">
        {records.length === 0 ? (
          <div className="empty-state">
            <FiDollarSign size={64} />
            <h3>No Money Borrowed Records</h3>
            <p>Click "Add New" to record money you've borrowed</p>
          </div>
        ) : (
          records.map((record) => (
            <div key={record._id} className={`money-borrowed-card ${record.isFullyPaid ? 'fully-paid' : ''}`}>
              <div className="card-header">
                <div className="person-info">
                  <FiUser className="person-icon" />
                  <div>
                    <h3>{record.borrowedFrom}</h3>
                    <p className="date">
                      <FiCalendar /> {formatDate(record.date)}
                    </p>
                  </div>
                </div>
                {record.isFullyPaid && (
                  <span className="paid-badge">✓ Fully Paid</span>
                )}
              </div>

              <div className="card-body">
                <div className="amount-row">
                  <div className="amount-item">
                    <span className="label">Total Borrowed:</span>
                    <span className="value total">{formatCurrency(record.totalAmount)}</span>
                  </div>
                  <div className="amount-item">
                    <span className="label">Paid Back:</span>
                    <span className="value paid">{formatCurrency(record.amountPaid)}</span>
                  </div>
                  <div className="amount-item">
                    <span className="label">Remaining:</span>
                    <span className="value remaining">{formatCurrency(record.amountRemaining)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(record.amountPaid / record.totalAmount) * 100}%` }}
                  ></div>
                </div>
                <p className="progress-text">
                  {((record.amountPaid / record.totalAmount) * 100).toFixed(1)}% paid back
                </p>

                {/* Payment History */}
                {record.paymentHistory.length > 0 && (
                  <div className="payment-history">
                    <h4>Payment History</h4>
                    <div className="history-list">
                      {record.paymentHistory.map((payment, index) => (
                        <div key={index} className="history-item">
                          <span className="history-date">{formatDate(payment.date)}</span>
                          <span className="history-amount">{formatCurrency(payment.amount)}</span>
                          {payment.note && <span className="history-note">{payment.note}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="card-actions">
                {!record.isFullyPaid && (
                  <button 
                    className="paid-btn" 
                    onClick={() => openPaymentModal(record)}
                  >
                    <FiCheck /> Record Payment
                  </button>
                )}
                <button 
                  className="delete-btn" 
                  onClick={() => handleDelete(record._id, record.borrowedFrom)}
                >
                  <FiTrash2 /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Money Borrowed Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Money Borrowed</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>
                  <FiUser /> Borrowed From (Name)
                </label>
                <input
                  type="text"
                  value={formData.borrowedFrom}
                  onChange={(e) => setFormData({ ...formData, borrowedFrom: e.target.value })}
                  placeholder="Enter person's name"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <FiCalendar /> Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <FiDollarSign /> Total Amount ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                  placeholder="Enter amount"
                  min="1"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedRecord && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Record Payment to {selectedRecord.borrowedFrom}</h2>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="payment-info">
              <p><strong>Total Borrowed:</strong> {formatCurrency(selectedRecord.totalAmount)}</p>
              <p><strong>Already Paid:</strong> {formatCurrency(selectedRecord.amountPaid)}</p>
              <p><strong>Remaining:</strong> {formatCurrency(selectedRecord.amountRemaining)}</p>
            </div>
            <form onSubmit={handlePayment}>
              <div className="form-group">
                <label>
                  <FiDollarSign /> Amount Paying Back ({currencySymbol})
                </label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                  placeholder={`Max: ${formatCurrency(selectedRecord.amountRemaining)}`}
                  min="1"
                  max={Math.round(convertFromBase(selectedRecord.amountRemaining) * 100) / 100}
                  required
                />
              </div>

              <div className="form-group">
                <label>Note (Optional)</label>
                <input
                  type="text"
                  value={paymentData.note}
                  onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })}
                  placeholder="Add a note..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowPaymentModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Submit Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyBorrowed;

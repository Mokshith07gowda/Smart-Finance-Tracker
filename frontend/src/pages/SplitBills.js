import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiUsers, FiCalendar, FiDollarSign, FiEdit2 } from 'react-icons/fi';
import { MdSplitscreen } from 'react-icons/md';
import { CurrencyContext } from '../context/CurrencyContext';
import './SplitBills.css';

const SplitBills = () => {
  const [bills, setBills] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const { formatCurrency, currencySymbol, convertToBase, convertFromBase } = useContext(CurrencyContext);
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalBills: 0,
    totalOwedToYou: 0,
    totalYouOwe: 0
  });

  const [formData, setFormData] = useState({
    paidBy: 'You',
    splitType: 'equally',
    participants: [{ name: 'You', amount: '' }],
    totalAmount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch split bills
  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/split-bills');
      setBills(response.data);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch bills');
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/split-bills/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  // Add participant
  const addParticipant = () => {
    setFormData({
      ...formData,
      participants: [...formData.participants, { name: '', amount: '' }]
    });
  };

  // Remove participant
  const removeParticipant = (index) => {
    const newParticipants = formData.participants.filter((_, i) => i !== index);
    setFormData({ ...formData, participants: newParticipants });
  };

  // Update participant
  const updateParticipant = (index, field, value) => {
    const newParticipants = [...formData.participants];
    newParticipants[index][field] = value;
    setFormData({ ...formData, participants: newParticipants });
  };

  // Calculate equal split
  const calculateEqualSplit = () => {
    const total = parseFloat(formData.totalAmount) || 0;
    const count = formData.participants.length;
    if (count > 0 && total > 0) {
      const splitAmount = (total / count).toFixed(2);
      const newParticipants = formData.participants.map(p => ({
        ...p,
        amount: splitAmount
      }));
      setFormData({ ...formData, participants: newParticipants });
    }
  };

  // Handle split type change
  const handleSplitTypeChange = (type) => {
    setFormData({ ...formData, splitType: type });
    if (type === 'equally' && formData.totalAmount) {
      setTimeout(calculateEqualSplit, 100);
    }
  };

  // Calculate total from participants
  const calculateParticipantTotal = () => {
    return formData.participants.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toFixed(2);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.paidBy.trim()) {
      toast.error('Please specify who paid');
      return;
    }

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      toast.error('Please enter a valid total amount');
      return;
    }

    const hasEmptyParticipants = formData.participants.some(p => !p.name.trim());
    if (hasEmptyParticipants) {
      toast.error('Please fill all participant names');
      return;
    }

    const hasInvalidAmounts = formData.participants.some(p => !p.amount || parseFloat(p.amount) <= 0);
    if (hasInvalidAmounts) {
      toast.error('Please enter valid amounts for all participants');
      return;
    }

    const participantTotal = parseFloat(calculateParticipantTotal());
    const totalAmount = parseFloat(formData.totalAmount);
    
    if (Math.abs(participantTotal - totalAmount) > 0.1) {
      toast.error(`Participant amounts (${formatCurrency(participantTotal)}) must equal total amount (${formatCurrency(totalAmount)})`);
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        totalAmount: convertToBase(parseFloat(formData.totalAmount)),
        participants: formData.participants.map(p => ({
          name: p.name,
          amount: convertToBase(parseFloat(p.amount))
        }))
      };

      await axios.post('/api/split-bills', dataToSend);
      
      // Show appropriate success message based on who paid
      const paidByYou = formData.paidBy.toLowerCase() === 'you' || 
                        formData.paidBy.toLowerCase() === 'me';
      
      if (paidByYou) {
        const yourShare = formData.participants.find(p => 
          p.name.toLowerCase() === 'you' || p.name.toLowerCase() === 'me'
        );
        const othersCount = formData.participants.filter(p => 
          p.name.toLowerCase() !== 'you' && p.name.toLowerCase() !== 'me'
        ).length;
        
        toast.success(`Split bill added! Your share (${formatCurrency(yourShare?.amount || 0)}) added to expenses. ${othersCount} money lent entries created.`);
      } else {
        const yourShare = formData.participants.find(p => 
          p.name.toLowerCase() === 'you' || p.name.toLowerCase() === 'me'
        );
        toast.success(`Split bill added! Your share (${formatCurrency(yourShare?.amount || 0)}) added to money borrowed from ${formData.paidBy}.`);
      }
      
      setShowAddModal(false);
      resetForm();
      fetchBills();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add split bill');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      paidBy: 'You',
      splitType: 'equally',
      participants: [{ name: 'You', amount: '' }],
      totalAmount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Delete bill
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this split bill?')) {
      try {
        await axios.delete(`/api/split-bills/${id}`);
        toast.success('Split bill deleted successfully');
        fetchBills();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete bill');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="split-bills-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <h1><MdSplitscreen /> Split Bills</h1>
            <p>Track shared expenses with friends and family</p>
          </div>
          <button className="btn-add" onClick={() => setShowAddModal(true)}>
            <FiPlus /> Add Expense
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">
              <FiDollarSign />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Expenses</p>
              <h3 className="stat-value">{formatCurrency(convertFromBase(stats.totalExpenses))}</h3>
            </div>
          </div>

          <div className="stat-card stat-bills">
            <div className="stat-icon">
              <MdSplitscreen />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Bills</p>
              <h3 className="stat-value">{stats.totalBills}</h3>
            </div>
          </div>

          <div className="stat-card stat-owed">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div className="stat-content">
              <p className="stat-label">Owed to You</p>
              <h3 className="stat-value">{formatCurrency(convertFromBase(stats.totalOwedToYou))}</h3>
            </div>
          </div>

          <div className="stat-card stat-owing">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div className="stat-content">
              <p className="stat-label">You Owe</p>
              <h3 className="stat-value">{formatCurrency(convertFromBase(stats.totalYouOwe))}</h3>
            </div>
          </div>
        </div>

        {/* Bills List */}
        <div className="bills-section">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading bills...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="empty-state">
              <MdSplitscreen size={64} />
              <h3>No Split Bills Yet</h3>
              <p>Start tracking shared expenses by adding your first split bill</p>
            </div>
          ) : (
            <div className="bills-grid">
              {bills.map((bill) => (
                <div key={bill._id} className="bill-card">
                  <div className="bill-header">
                    <div className="bill-info">
                      <h3>{bill.description || 'Shared Expense'}</h3>
                      <p className="bill-date">
                        <FiCalendar /> {formatDate(bill.date)}
                      </p>
                    </div>
                    <button className="btn-delete-bill" onClick={() => handleDelete(bill._id)}>
                      <FiTrash2 />
                    </button>
                  </div>

                  <div className="bill-details">
                    <div className="bill-amount">
                      <span className="amount-label">Total Amount</span>
                      <span className="amount-value">{formatCurrency(convertFromBase(bill.totalAmount))}</span>
                    </div>

                    <div className="bill-paid-by">
                      <span className="paid-label">Paid by:</span>
                      <span className="paid-value">{bill.paidBy}</span>
                    </div>

                    <div className="bill-split-type">
                      <span className="split-badge">{bill.splitType === 'equally' ? 'Split Equally' : 'Split Unequally'}</span>
                    </div>
                  </div>

                  <div className="bill-participants">
                    <p className="participants-label">Participants:</p>
                    <div className="participants-list">
                      {bill.participants.map((participant, index) => (
                        <div key={index} className="participant-item">
                          <span className="participant-name">{participant.name}</span>
                          <span className="participant-amount">{formatCurrency(convertFromBase(participant.amount))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Bill Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="modal-content split-bill-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Expense</h2>
              <button className="modal-close" onClick={() => { setShowAddModal(false); resetForm(); }}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Paid by <span className="required">*</span></label>
                <select
                  value={formData.paidBy}
                  onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                  required
                  className="select-input"
                >
                  <option value="You">You</option>
                  <option value="">Select someone else</option>
                </select>
                {formData.paidBy === '' && (
                  <input
                    type="text"
                    placeholder="Enter name (e.g., John, Max, etc.)"
                    value={formData.paidBy}
                    onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                    required
                    style={{ marginTop: '0.5rem' }}
                  />
                )}
                {formData.paidBy !== '' && formData.paidBy !== 'You' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Enter name"
                      value={formData.paidBy}
                      onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Split Type <span className="required">*</span></label>
                <div className="split-type-options">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="splitType"
                      value="equally"
                      checked={formData.splitType === 'equally'}
                      onChange={(e) => handleSplitTypeChange(e.target.value)}
                    />
                    <span>Equally</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="splitType"
                      value="unequally"
                      checked={formData.splitType === 'unequally'}
                      onChange={(e) => handleSplitTypeChange(e.target.value)}
                    />
                    <span>Unequally</span>
                  </label>
                </div>
                {formData.paidBy && (
                  <div className="split-summary">
                    Paid by <strong>{formData.paidBy}</strong> and split <strong>{formData.splitType}</strong>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Total Amount <span className="required">*</span></label>
                <div className="input-with-icon">
                  <FiDollarSign className="input-icon" />
                  <input
                    type="number"
                    placeholder="Enter total amount"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    onBlur={() => {
                      if (formData.splitType === 'equally' && formData.totalAmount) {
                        calculateEqualSplit();
                      }
                    }}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Dinner at restaurant, Movie tickets"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Date <span className="required">*</span></label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group participants-section">
                <div className="participants-header">
                  <label>Participants <span className="required">*</span></label>
                  <button type="button" className="btn-add-participant" onClick={addParticipant}>
                    <FiPlus /> Add Person
                  </button>
                </div>

                <div className="participants-list-form">
                  {formData.participants.map((participant, index) => (
                    <div key={index} className="participant-form-item">
                      <div className="participant-inputs">
                        <input
                          type="text"
                          placeholder="Name"
                          value={participant.name}
                          onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                          required
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          value={participant.amount}
                          onChange={(e) => updateParticipant(index, 'amount', e.target.value)}
                          step="0.01"
                          min="0"
                          required
                          readOnly={formData.splitType === 'equally'}
                        />
                      </div>
                      {formData.participants.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove-participant"
                          onClick={() => removeParticipant(index)}
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="participants-total">
                  <span>Total:</span>
                  <span className={
                    Math.abs(parseFloat(calculateParticipantTotal()) - parseFloat(formData.totalAmount || 0)) < 0.1
                      ? 'total-valid'
                      : 'total-invalid'
                  }>
                    {currencySymbol}{calculateParticipantTotal()}
                  </span>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setShowAddModal(false); resetForm(); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Add Split Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitBills;

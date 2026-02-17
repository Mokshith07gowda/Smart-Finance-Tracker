import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { CurrencyContext } from '../context/CurrencyContext';
import './Budget.css';

const CATEGORIES = ['Overall', 'Food', 'Travel', 'Bills', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Savings', 'Other'];

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const { formatCurrency, convertToBase, convertFromBase } = useContext(CurrencyContext);
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    amount: '',
    category: 'Overall'
  });
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    fetchData();
  }, [formData.month, formData.year]);

  const fetchData = async () => {
    try {
      const [budgetsRes, expensesRes] = await Promise.all([
        axios.get('/api/budget', { 
          params: { month: formData.month, year: formData.year } 
        }),
        axios.get('/api/expenses', {
          params: {
            startDate: new Date(formData.year, formData.month - 1, 1).toISOString(),
            endDate: new Date(formData.year, formData.month, 0, 23, 59, 59).toISOString()
          }
        })
      ]);

      setBudgets(budgetsRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      toast.error('Failed to fetch budget data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.name === 'month' || e.target.name === 'year' || e.target.name === 'amount'
      ? parseFloat(e.target.value) || ''
      : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    if (formData.category === 'Other' && !customCategory.trim()) {
      toast.error('Please enter a custom category name');
      return;
    }

    try {
      const categoryToSave = formData.category === 'Other' ? customCategory.trim() : formData.category;
      
      if (editingBudget) {
        await axios.put(`/api/budget/${editingBudget._id}`, { amount: convertToBase(formData.amount) });
        toast.success('Budget updated successfully');
      } else {
        await axios.post('/api/budget', { ...formData, category: categoryToSave, amount: convertToBase(formData.amount) });
        toast.success('Budget created successfully');
      }
      
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save budget');
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      month: budget.month,
      year: budget.year,
      amount: Math.round(convertFromBase(budget.amount) * 100) / 100,
      category: budget.category
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await axios.delete(`/api/budget/${id}`);
        toast.success('Budget deleted successfully');
        fetchData();
      } catch (error) {
        toast.error('Failed to delete budget');
      }
    }
  };

  const resetForm = () => {
    const currentDate = new Date();
    setFormData({
      month: currentDate.getMonth() + 1,
      year: currentDate.getFullYear(),
      amount: '',
      category: 'Overall'
    });
    setCustomCategory('');
    setEditingBudget(null);
    setShowModal(false);
  };

  const getExpensesByCategory = (category) => {
    if (category === 'Overall') {
      return expenses.reduce((sum, exp) => sum + exp.amount, 0);
    }
    return expenses
      .filter(exp => exp.category === category)
      .reduce((sum, exp) => sum + exp.amount, 0);
  };

  const getBudgetStatus = (budget) => {
    const spent = getExpensesByCategory(budget.category);
    const percentage = (spent / budget.amount) * 100;
    return { spent, percentage };
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '40px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const totalBudget = budgets.find(b => b.category === 'Overall');
  const totalSpent = getExpensesByCategory('Overall');
  const totalPercentage = totalBudget ? (totalSpent / totalBudget.amount) * 100 : 0;

  return (
    <div className="container" style={{ marginTop: '40px', marginBottom: '40px' }}>
      <div className="page-header">
        <div>
          <h1>Budget Planning</h1>
          <p className="text-secondary">Set and track your monthly budgets</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus size={20} />
          Set Budget
        </button>
      </div>

      {/* Month Selector */}
      <div className="month-selector card fade-in">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Select Month & Year</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select
              name="month"
              className="form-control"
              value={formData.month}
              onChange={handleInputChange}
              style={{ flex: 1 }}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>
            <select
              name="year"
              className="form-control"
              value={formData.year}
              onChange={handleInputChange}
              style={{ flex: 1 }}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = currentDate.getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
        </div>
      </div>

      {/* Overall Budget Summary */}
      {totalBudget && (
        <div className="budget-overview card fade-in">
          <h3>Overall Budget - {getMonthName(formData.month)} {formData.year}</h3>
          <div className="budget-stats">
            <div className="budget-stat">
              <span className="label">Budget</span>
              <span className="value">{formatCurrency(totalBudget.amount)}</span>
            </div>
            <div className="budget-stat">
              <span className="label">Spent</span>
              <span className="value text-danger">{formatCurrency(totalSpent)}</span>
            </div>
            <div className="budget-stat">
              <span className="label">Remaining</span>
              <span className={`value ${totalBudget.amount - totalSpent >= 0 ? 'text-success' : 'text-danger'}`}>
                {formatCurrency(totalBudget.amount - totalSpent)}
              </span>
            </div>
          </div>
          <div className="progress-bar" style={{ marginTop: '16px' }}>
            <div 
              className="progress-fill" 
              style={{ 
                width: `${Math.min(totalPercentage, 100)}%`,
                backgroundColor: totalPercentage > 100 ? '#ef4444' : totalPercentage > 80 ? '#f59e0b' : '#10b981'
              }}
            />
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px', fontWeight: '600' }}>
            {totalPercentage.toFixed(1)}% Used
          </div>
          {totalPercentage > 100 && (
            <div className="warning-message">
              <FiAlertCircle size={16} />
              <span>You have exceeded your budget by {formatCurrency(totalSpent - totalBudget.amount)}</span>
            </div>
          )}
        </div>
      )}

      {/* Budget List */}
      <div className="budgets-grid grid grid-2">
        {budgets.length === 0 ? (
          <div className="empty-state card" style={{ gridColumn: '1 / -1' }}>
            <p>No budgets set for this month. Start by creating your first budget!</p>
          </div>
        ) : (
          budgets.map(budget => {
            const { spent, percentage } = getBudgetStatus(budget);
            const remaining = budget.amount - spent;
            const isOverBudget = percentage > 100;
            const isWarning = percentage > 80 && percentage <= 100;

            return (
              <div key={budget._id} className="budget-card card fade-in">
                <div className="budget-header">
                  <h4>{budget.category}</h4>
                  <div className="budget-actions">
                    <button className="action-btn edit" onClick={() => handleEdit(budget)}>
                      <FiEdit2 size={16} />
                    </button>
                    <button className="action-btn delete" onClick={() => handleDelete(budget._id)}>
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="budget-amounts">
                  <div>
                    <span className="amount-label">Budget</span>
                    <span className="amount-value">{formatCurrency(budget.amount)}</span>
                  </div>
                  <div>
                    <span className="amount-label">Spent</span>
                    <span className="amount-value">{formatCurrency(spent)}</span>
                  </div>
                </div>

                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: isOverBudget ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981'
                    }}
                  />
                </div>

                <div className="budget-footer">
                  <span className={remaining >= 0 ? 'text-success' : 'text-danger'}>
                    {remaining >= 0 
                      ? `${formatCurrency(remaining)} remaining`
                      : `${formatCurrency(Math.abs(remaining))} over budget`
                    }
                  </span>
                  <span className="percentage">{percentage.toFixed(1)}%</span>
                </div>

                {isOverBudget && (
                  <div className="budget-warning">
                    <FiAlertCircle size={14} />
                    <span>Over budget!</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBudget ? 'Edit Budget' : 'Set New Budget'}</h2>
              <button className="modal-close" onClick={resetForm}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  className="form-control"
                  value={formData.category}
                  onChange={handleInputChange}
                  disabled={editingBudget}
                  required
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {formData.category === 'Other' && (
                <div className="form-group">
                  <label>Custom Category Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category name"
                    required
                  />
                </div>
              )}

              <div className="form-group">
                <label>Month *</label>
                <select
                  name="month"
                  className="form-control"
                  value={formData.month}
                  onChange={handleInputChange}
                  disabled={editingBudget}
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {getMonthName(i + 1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Year *</label>
                <select
                  name="year"
                  className="form-control"
                  value={formData.year}
                  onChange={handleInputChange}
                  disabled={editingBudget}
                  required
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = currentDate.getFullYear() - 2 + i;
                    return <option key={year} value={year}>{year}</option>;
                  })}
                </select>
              </div>

              <div className="form-group">
                <label>Budget Amount *</label>
                <input
                  type="number"
                  name="amount"
                  className="form-control"
                  value={formData.amount}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBudget ? 'Update' : 'Create'} Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget;

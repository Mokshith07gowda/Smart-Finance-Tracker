import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiFilter } from 'react-icons/fi';
import { CurrencyContext } from '../context/CurrencyContext';
import './Expenses.css';

const CATEGORIES = ['All', 'Food', 'Travel', 'Bills', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Other'];

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filter, setFilter] = useState('All');
  const { formatCurrency, convertToBase, convertFromBase } = useContext(CurrencyContext);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchExpenses();
  }, [filter]);

  const fetchExpenses = async () => {
    try {
      const params = filter !== 'All' ? { category: filter } : {};
      const res = await axios.get('/api/expenses', { params });
      setExpenses(res.data);
    } catch (error) {
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const submitData = { ...formData, amount: convertToBase(formData.amount) };
      if (editingExpense) {
        await axios.put(`/api/expenses/${editingExpense._id}`, submitData);
        toast.success('Expense updated successfully');
      } else {
        await axios.post('/api/expenses', submitData);
        toast.success('Expense added successfully');
      }
      
      resetForm();
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save expense');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      amount: Math.round(convertFromBase(expense.amount) * 100) / 100,
      category: expense.category,
      description: expense.description || '',
      date: new Date(expense.date).toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await axios.delete(`/api/expenses/${id}`);
        toast.success('Expense deleted successfully');
        fetchExpenses();
      } catch (error) {
        toast.error('Failed to delete expense');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      category: 'Food',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingExpense(null);
    setShowModal(false);
  };

  const getTotalExpenses = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getCategoryColor = (category) => {
    const colors = {
      Food: '#10b981',
      Travel: '#3b82f6',
      Bills: '#ef4444',
      Entertainment: '#8b5cf6',
      Healthcare: '#ec4899',
      Shopping: '#f59e0b',
      Education: '#06b6d4',
      Other: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="container" style={{ marginTop: '40px' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container" style={{ marginTop: '40px', marginBottom: '40px' }}>
      <div className="page-header">
        <div>
          <h1>Expense Tracker</h1>
          <p className="text-secondary">Manage and track your expenses</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <FiPlus size={20} />
          Add Expense
        </button>
      </div>

      <div className="expense-summary card fade-in">
        <h3>Total Expenses</h3>
        <div className="total-amount">{formatCurrency(getTotalExpenses())}</div>
        <p className="text-secondary">{expenses.length} transactions</p>
      </div>

      <div className="filter-section">
        <div className="filter-header">
          <FiFilter size={20} />
          <span>Filter by Category</span>
        </div>
        <div className="filter-buttons">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="expenses-list">
        {expenses.length === 0 ? (
          <div className="empty-state card">
            <p>No expenses found. Start by adding your first expense!</p>
          </div>
        ) : (
          expenses.map(expense => (
            <div key={expense._id} className="expense-item card fade-in">
              <div className="expense-icon" style={{ backgroundColor: getCategoryColor(expense.category) }}>
                {expense.category.charAt(0)}
              </div>
              <div className="expense-details">
                <h4>{expense.title}</h4>
                <p className="text-secondary">{expense.description}</p>
                <div className="expense-meta">
                  <span className="category-badge" style={{ backgroundColor: getCategoryColor(expense.category) }}>
                    {expense.category}
                  </span>
                  <span className="date">{new Date(expense.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="expense-amount">
                <div className="amount">{formatCurrency(expense.amount)}</div>
                <div className="expense-actions">
                  <button className="action-btn edit" onClick={() => handleEdit(expense)}>
                    <FiEdit2 size={18} />
                  </button>
                  <button className="action-btn delete" onClick={() => handleDelete(expense._id)}>
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
              <button className="modal-close" onClick={resetForm}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  className="form-control"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Grocery Shopping"
                  required
                />
              </div>

              <div className="form-group">
                <label>Amount *</label>
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

              <div className="form-group">
                <label>Category *</label>
                <select
                  name="category"
                  className="form-control"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  {CATEGORIES.filter(cat => cat !== 'All').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  className="form-control"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  className="form-control"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Optional notes..."
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingExpense ? 'Update' : 'Add'} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;

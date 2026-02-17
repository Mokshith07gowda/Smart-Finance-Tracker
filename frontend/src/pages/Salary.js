import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiFilter, FiTrendingUp } from 'react-icons/fi';
import { CurrencyContext } from '../context/CurrencyContext';
import './Salary.css';

const TYPES = ['All', 'Monthly Salary', 'Bonus', 'Freelance', 'Investment', 'Other Income'];

const Salary = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [filter, setFilter] = useState('All');
  const { formatCurrency, currencySymbol, convertToBase, convertFromBase } = useContext(CurrencyContext);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'Monthly Salary',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchSalaries();
  }, [filter]);

  const fetchSalaries = async () => {
    try {
      const params = filter !== 'All' ? { type: filter } : {};
      const res = await axios.get('/api/salary', { params });
      setSalaries(res.data);
    } catch (error) {
      toast.error('Failed to fetch salary entries');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const submitData = { ...formData, amount: convertToBase(formData.amount) };
      if (editingSalary) {
        await axios.put(`/api/salary/${editingSalary._id}`, submitData);
        toast.success('Salary entry updated successfully');
      } else {
        await axios.post('/api/salary', submitData);
        toast.success('Salary entry added successfully');
      }
      
      resetForm();
      fetchSalaries();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save salary entry');
    }
  };

  const handleEdit = (salary) => {
    setEditingSalary(salary);
    setFormData({
      title: salary.title,
      amount: Math.round(convertFromBase(salary.amount) * 100) / 100,
      type: salary.type,
      description: salary.description || '',
      date: new Date(salary.date).toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this salary entry?')) {
      try {
        await axios.delete(`/api/salary/${id}`);
        toast.success('Salary entry deleted successfully');
        fetchSalaries();
      } catch (error) {
        toast.error('Failed to delete salary entry');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      type: 'Monthly Salary',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
    setEditingSalary(null);
    setShowModal(false);
  };

  const getTotalSalary = () => {
    return salaries.reduce((sum, salary) => sum + salary.amount, 0);
  };

  const getTypeColor = (type) => {
    const colors = {
      'Monthly Salary': '#10b981',
      'Bonus': '#f59e0b',
      'Freelance': '#3b82f6',
      'Investment': '#8b5cf6',
      'Other Income': '#6b7280'
    };
    return colors[type] || '#6b7280';
  };

  const getTypeIcon = (type) => {
    return type.charAt(0).toUpperCase();
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
          <h1>Salary & Income</h1>
          <p className="text-secondary">Track your income and earnings</p>
        </div>
        <button className="btn btn-success" onClick={() => setShowModal(true)}>
          <FiPlus size={20} />
          Add Income
        </button>
      </div>

      <div className="salary-summary card fade-in">
        <div className="summary-icon">
          <FiTrendingUp size={32} />
        </div>
        <div>
          <h3>Total Income</h3>
          <div className="total-amount">{formatCurrency(getTotalSalary())}</div>
          <p className="text-secondary">{salaries.length} entries</p>
        </div>
      </div>

      <div className="filter-section">
        <div className="filter-header">
          <FiFilter size={20} />
          <span>Filter by Type</span>
        </div>
        <div className="filter-buttons">
          {TYPES.map(type => (
            <button
              key={type}
              className={`filter-btn ${filter === type ? 'active' : ''}`}
              onClick={() => setFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="salary-list">
        {salaries.length === 0 ? (
          <div className="empty-state card">
            <p>No income entries found. Start by adding your first income entry!</p>
          </div>
        ) : (
          salaries.map(salary => (
            <div key={salary._id} className="salary-item card fade-in">
              <div className="salary-icon" style={{ backgroundColor: getTypeColor(salary.type) }}>
                {getTypeIcon(salary.type)}
              </div>
              <div className="salary-details">
                <h4>{salary.title}</h4>
                <p className="text-secondary">{salary.description}</p>
                <div className="salary-meta">
                  <span className="type-badge" style={{ backgroundColor: getTypeColor(salary.type) }}>
                    {salary.type}
                  </span>
                  <span className="date">{new Date(salary.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="salary-amount">
                <div className="amount text-success">+{formatCurrency(salary.amount)}</div>
                <div className="salary-actions">
                  <button className="action-btn edit" onClick={() => handleEdit(salary)}>
                    <FiEdit2 size={18} />
                  </button>
                  <button className="action-btn delete" onClick={() => handleDelete(salary._id)}>
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
              <h2>{editingSalary ? 'Edit Income Entry' : 'Add New Income'}</h2>
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
                  placeholder="e.g., March Salary"
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
                <label>Type *</label>
                <select
                  name="type"
                  className="form-control"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                >
                  {TYPES.filter(type => type !== 'All').map(type => (
                    <option key={type} value={type}>{type}</option>
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
                <button type="submit" className="btn btn-success">
                  {editingSalary ? 'Update' : 'Add'} Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary;

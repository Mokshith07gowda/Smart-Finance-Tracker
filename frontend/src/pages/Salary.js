import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiFilter, FiTrendingUp } from 'react-icons/fi';
import { LanguageContext } from '../context/LanguageContext';
import { CurrencyContext } from '../context/CurrencyContext';

const TYPES = ['All', 'Monthly Salary', 'Bonus', 'Freelance', 'Investment', 'Other Income'];
const inputCls = 'w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 dark:border-slate-600 rounded-md text-sm font-sans bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-light placeholder:text-slate-400';
const btnPrimary = 'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-[13.5px] font-semibold transition-all cursor-pointer border-none whitespace-nowrap select-none';
const cardCls = 'bg-white dark:bg-slate-800 rounded-lg p-5 shadow border border-slate-100 dark:border-slate-700 transition-all';

const Salary = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [filter, setFilter] = useState('All');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedSalaries, setSelectedSalaries] = useState([]);
  const { formatCurrency, convertToBase, convertFromBase } = useContext(CurrencyContext);
  const { t } = useContext(LanguageContext);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'Monthly Salary',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchSalaries = useCallback(async () => {
    try {
      const params = filter !== 'All' ? { type: filter } : {};
      const res = await axios.get('/api/salary', { params });
      setSalaries(res.data);
    } catch (error) {
      toast.error('Failed to fetch salary entries');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchSalaries();
  }, [fetchSalaries]);

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
      window.dispatchEvent(new Event('notifications-updated'));
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
        window.dispatchEvent(new Event('notifications-updated'));
      } catch (error) {
        toast.error('Failed to delete salary entry');
      }
    }
  };
  // Toggle select mode
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedSalaries([]);
  };

  // Toggle salary selection
  const toggleSalarySelection = (salaryId) => {
    setSelectedSalaries(prev => {
      if (prev.includes(salaryId)) {
        return prev.filter(id => id !== salaryId);
      } else {
        return [...prev, salaryId];
      }
    });
  };

  // Handle multi-delete
  const handleMultiDelete = async () => {
    if (selectedSalaries.length === 0) {
      toast.warning('Please select at least one income entry to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedSalaries.length} income entry(ies)?`)) {
      try {
        await Promise.all(
          selectedSalaries.map(id => axios.delete(`/api/salary/${id}`))
        );
        toast.success(`${selectedSalaries.length} income entry(ies) deleted successfully`);
        setSelectedSalaries([]);
        setSelectMode(false);
        fetchSalaries();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete income entries');
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
    return <div className="container mt-10"><div className="spinner"></div></div>;
  }

  return (
    <div className="container mt-10 mb-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('salary_title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('salary_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <button className={`${btnPrimary} bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600`} onClick={toggleSelectMode}>Cancel</button>
              {selectedSalaries.length > 0 && (
                <button className={`${btnPrimary} bg-red-500 text-white shadow-sm hover:bg-red-600`} onClick={handleMultiDelete}>
                  <FiTrash2 /> Delete ({selectedSalaries.length})
                </button>
              )}
            </>
          ) : (
            <>
              <button className={`${btnPrimary} bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600`} onClick={toggleSelectMode}>Select</button>
              <button className={`${btnPrimary} bg-emerald-600 text-white shadow-sm hover:bg-emerald-700`} onClick={() => setShowModal(true)}>
                <FiPlus size={20} /> Add Income
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`${cardCls} flex items-center gap-4 mb-6 animate-fade-in`}>
        <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center shrink-0">
          <FiTrendingUp size={32} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Total Income</h3>
          <div className="text-2xl font-bold text-emerald-600 tracking-tight">{formatCurrency(getTotalSalary())}</div>
          <p className="text-slate-500 text-xs">{salaries.length} entries</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
          <FiFilter size={20} />
          <span>Filter by Type</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {TYPES.map(type => (
            <button
              key={type}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-all cursor-pointer ${filter === type ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              onClick={() => setFilter(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {salaries.length === 0 ? (
          <div className={`${cardCls} text-center text-slate-500 py-10`}>
            <p>No income entries found. Start by adding your first income entry!</p>
          </div>
        ) : (
          salaries.map(salary => (
            <div
              key={salary._id}
              className={`${cardCls} flex items-center gap-3.5 animate-fade-in ${selectMode && selectedSalaries.includes(salary._id) ? 'ring-2 ring-primary bg-primary-light' : 'hover:shadow-md'} ${selectMode ? 'cursor-pointer' : ''}`}
              onClick={selectMode ? () => toggleSalarySelection(salary._id) : undefined}
            >
              {selectMode && (
                <input type="checkbox" checked={selectedSalaries.includes(salary._id)} onChange={() => toggleSalarySelection(salary._id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 accent-primary shrink-0" />
              )}
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: getTypeColor(salary.type) }}>
                {getTypeIcon(salary.type)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100 truncate">{salary.title}</h4>
                <p className="text-xs text-slate-500 truncate">{salary.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] font-medium text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: getTypeColor(salary.type) }}>{salary.type}</span>
                  <span className="text-[11px] text-slate-400">{new Date(salary.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-bold text-emerald-600 tracking-tight">+{formatCurrency(salary.amount)}</div>
                {!selectMode && (
                  <div className="flex items-center gap-1 mt-1.5 justify-end">
                    <button className="p-1.5 rounded-md text-slate-400 hover:text-primary hover:bg-primary-light transition-all border-none bg-transparent cursor-pointer" onClick={() => handleEdit(salary)}><FiEdit2 size={16} /></button>
                    <button className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border-none bg-transparent cursor-pointer" onClick={() => handleDelete(salary._id)}><FiTrash2 size={16} /></button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[2000] flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{editingSalary ? 'Edit Income Entry' : 'Add New Income'}</h2>
              <button className="text-2xl text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer" onClick={resetForm}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Title *</label>
                <input type="text" name="title" className={inputCls} value={formData.title} onChange={handleInputChange} placeholder="e.g., March Salary" required />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Amount *</label>
                <input type="number" name="amount" className={inputCls} value={formData.amount} onChange={handleInputChange} placeholder="0.00" min="0" step="0.01" required />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Type *</label>
                <select name="type" className={`${inputCls} cursor-pointer`} value={formData.type} onChange={handleInputChange} required>
                  {TYPES.filter(type => type !== 'All').map(type => (<option key={type} value={type}>{type}</option>))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Date *</label>
                <input type="date" name="date" className={inputCls} value={formData.date} onChange={handleInputChange} required />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description</label>
                <textarea name="description" className={`${inputCls} resize-y`} value={formData.description} onChange={handleInputChange} placeholder="Optional notes..." rows="3" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" className={`${btnPrimary} bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200`} onClick={resetForm}>Cancel</button>
                <button type="submit" className={`${btnPrimary} bg-emerald-600 text-white hover:bg-emerald-700`}>{editingSalary ? 'Update' : 'Add'} Income</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Salary;

import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiAlertCircle, FiTrendingUp, FiShield, FiClock } from 'react-icons/fi';
import { CurrencyContext } from '../context/CurrencyContext';
import { LanguageContext } from '../context/LanguageContext';

const CATEGORIES = ['Overall', 'Food', 'Travel', 'Bills', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Savings', 'Other'];
const inputCls = 'w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 dark:border-slate-600 rounded-md text-sm font-sans bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-light placeholder:text-slate-400';
const btnBase = 'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-[13.5px] font-semibold transition-all cursor-pointer border-none whitespace-nowrap select-none';
const cardCls = 'bg-white dark:bg-slate-800 rounded-lg p-5 shadow border border-slate-100 dark:border-slate-700 transition-all';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedBudgets, setSelectedBudgets] = useState([]);
  const { formatCurrency, convertToBase, convertFromBase } = useContext(CurrencyContext);
  const { t } = useContext(LanguageContext);
  const currentDate = new Date();
  const [formData, setFormData] = useState({
    month: currentDate.getMonth() + 1,
    year: currentDate.getFullYear(),
    amount: '',
    category: 'Overall'
  });
  const [customCategory, setCustomCategory] = useState('');

  const fetchData = useCallback(async () => {
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
  }, [formData.month, formData.year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      window.dispatchEvent(new Event('notifications-updated'));
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
        window.dispatchEvent(new Event('notifications-updated'));
      } catch (error) {
        toast.error('Failed to delete budget');
      }
    }
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedBudgets([]);
  };

  // Toggle budget selection
  const toggleBudgetSelection = (budgetId) => {
    setSelectedBudgets(prev => {
      if (prev.includes(budgetId)) {
        return prev.filter(id => id !== budgetId);
      } else {
        return [...prev, budgetId];
      }
    });
  };

  // Handle multi-delete
  const handleMultiDelete = async () => {
    if (selectedBudgets.length === 0) {
      toast.warning('Please select at least one budget to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedBudgets.length} budget(s)?`)) {
      try {
        await Promise.all(
          selectedBudgets.map(id => axios.delete(`/api/budget/${id}`))
        );
        toast.success(`${selectedBudgets.length} budget(s) deleted successfully`);
        setSelectedBudgets([]);
        setSelectMode(false);
        fetchData();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete budgets');
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
    return <div className="container mt-10"><div className="spinner"></div></div>;
  }

  const totalBudget = budgets.find(b => b.category === 'Overall');
  const totalSpent = getExpensesByCategory('Overall');
  const totalPercentage = totalBudget ? (totalSpent / totalBudget.amount) * 100 : 0;

  // Smart budget calculations
  const now = new Date();
  const isCurrentMonth = formData.month === (now.getMonth() + 1) && formData.year === now.getFullYear();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(formData.year, formData.month, 0).getDate();
  const daysRemaining = isCurrentMonth ? daysInMonth - dayOfMonth : daysInMonth;
  const dailyBurnRate = dayOfMonth > 0 && isCurrentMonth ? totalSpent / dayOfMonth : 0;
  const forecastTotal = dailyBurnRate * daysInMonth;
  const dailyAllowance = totalBudget && daysRemaining > 0 ? Math.max(0, (totalBudget.amount - totalSpent) / daysRemaining) : 0;
  const willExceed = totalBudget && forecastTotal > totalBudget.amount;

  return (
    <div className="container mt-10 mb-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('budget_title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('budget_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <button className={`${btnBase} bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600`} onClick={toggleSelectMode}>Cancel</button>
              {selectedBudgets.length > 0 && (
                <button className={`${btnBase} bg-red-500 text-white shadow-sm hover:bg-red-600`} onClick={handleMultiDelete}>
                  <FiTrash2 /> Delete ({selectedBudgets.length})
                </button>
              )}
            </>
          ) : (
            <>
              <button className={`${btnBase} bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600`} onClick={toggleSelectMode}>Select</button>
              <button className={`${btnBase} bg-primary text-white shadow-sm hover:bg-primary-hover`} onClick={() => setShowModal(true)}>
                <FiPlus size={20} /> Set Budget
              </button>
            </>
          )}
        </div>
      </div>

      {/* Month Selector */}
      <div className={`${cardCls} mb-6 animate-fade-in`}>
        <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-2">Select Month & Year</label>
        <div className="flex gap-3">
          <select name="month" className={`${inputCls} flex-1 cursor-pointer`} value={formData.month} onChange={handleInputChange}>
            {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>))}
          </select>
          <select name="year" className={`${inputCls} flex-1 cursor-pointer`} value={formData.year} onChange={handleInputChange}>
            {Array.from({ length: 5 }, (_, i) => { const year = currentDate.getFullYear() - 2 + i; return <option key={year} value={year}>{year}</option>; })}
          </select>
        </div>
      </div>

      {/* Overall Budget Summary */}
      {totalBudget && (
        <div className={`${cardCls} mb-6 animate-fade-in`}>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Overall Budget - {getMonthName(formData.month)} {formData.year}</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 rounded-md bg-slate-50 dark:bg-slate-700/50">
              <span className="block text-[11px] font-medium text-slate-500 uppercase mb-1">Budget</span>
              <span className="block text-lg font-bold text-slate-900 dark:text-slate-100">{formatCurrency(totalBudget.amount)}</span>
            </div>
            <div className="text-center p-3 rounded-md bg-slate-50 dark:bg-slate-700/50">
              <span className="block text-[11px] font-medium text-slate-500 uppercase mb-1">Spent</span>
              <span className="block text-lg font-bold text-red-500">{formatCurrency(totalSpent)}</span>
            </div>
            <div className="text-center p-3 rounded-md bg-slate-50 dark:bg-slate-700/50">
              <span className="block text-[11px] font-medium text-slate-500 uppercase mb-1">Remaining</span>
              <span className={`block text-lg font-bold ${totalBudget.amount - totalSpent >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatCurrency(totalBudget.amount - totalSpent)}</span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(totalPercentage, 100)}%`, backgroundColor: totalPercentage > 100 ? '#ef4444' : totalPercentage > 80 ? '#f59e0b' : '#10b981' }} />
          </div>
          <div className="text-center text-sm font-semibold text-slate-700 dark:text-slate-300 mt-3">{totalPercentage.toFixed(1)}% Used</div>
          {totalPercentage > 100 && (
            <div className="flex items-center gap-2 mt-3 p-3 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 text-sm font-medium">
              <FiAlertCircle size={16} />
              <span>You have exceeded your budget by {formatCurrency(totalSpent - totalBudget.amount)}</span>
            </div>
          )}
        </div>
      )}

      {/* Smart Budget Insights */}
      {totalBudget && isCurrentMonth && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className={`${cardCls} animate-fade-in`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center"><FiShield size={16} className="text-emerald-600" /></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Daily Allowance</span>
            </div>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(dailyAllowance)}</p>
            <p className="text-[11px] text-slate-500 mt-1">Safe to spend per day for {daysRemaining} remaining days</p>
          </div>
          <div className={`${cardCls} animate-fade-in`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center"><FiTrendingUp size={16} className="text-amber-600" /></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Daily Burn Rate</span>
            </div>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(dailyBurnRate)}</p>
            <p className="text-[11px] text-slate-500 mt-1">Average daily spending so far</p>
          </div>
          <div className={`${cardCls} animate-fade-in`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${willExceed ? 'bg-red-50 dark:bg-red-900/20' : 'bg-primary/10'}`}><FiClock size={16} className={willExceed ? 'text-red-500' : 'text-primary'} /></div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Month-End Forecast</span>
            </div>
            <p className={`text-xl font-bold ${willExceed ? 'text-red-500' : 'text-primary'}`}>{formatCurrency(forecastTotal)}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              {willExceed ? `⚠️ Will exceed budget by ${formatCurrency(forecastTotal - totalBudget.amount)}` : '✅ On track to stay within budget'}
            </p>
          </div>
        </div>
      )}

      {/* Budget List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {budgets.length === 0 ? (
          <div className={`${cardCls} text-center text-slate-500 py-10 col-span-full`}>
            <p>No budgets set for this month. Start by creating your first budget!</p>
          </div>
        ) : (
          budgets.map(budget => {
            const { spent, percentage } = getBudgetStatus(budget);
            const remaining = budget.amount - spent;
            const isOverBudget = percentage > 100;
            const isWarning = percentage > 80 && percentage <= 100;

            return (
              <div
                key={budget._id}
                className={`${cardCls} animate-fade-in ${selectMode && selectedBudgets.includes(budget._id) ? 'ring-2 ring-primary bg-primary-light' : 'hover:shadow-md'} ${selectMode ? 'cursor-pointer' : ''}`}
                onClick={selectMode ? () => toggleBudgetSelection(budget._id) : undefined}
              >
                {selectMode && (
                  <input type="checkbox" checked={selectedBudgets.includes(budget._id)} onChange={() => toggleBudgetSelection(budget._id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 accent-primary mb-2" />
                )}
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{budget.category}</h4>
                  {!selectMode && (
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-md text-slate-400 hover:text-primary hover:bg-primary-light transition-all border-none bg-transparent cursor-pointer" onClick={() => handleEdit(budget)}><FiEdit2 size={16} /></button>
                      <button className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border-none bg-transparent cursor-pointer" onClick={() => handleDelete(budget._id)}><FiTrash2 size={16} /></button>
                    </div>
                  )}
                </div>
                <div className="flex justify-between mb-3">
                  <div><span className="block text-[11px] font-medium text-slate-500 uppercase">Budget</span><span className="block text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(budget.amount)}</span></div>
                  <div className="text-right"><span className="block text-[11px] font-medium text-slate-500 uppercase">Spent</span><span className="block text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(spent)}</span></div>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: isOverBudget ? '#ef4444' : isWarning ? '#f59e0b' : '#10b981' }} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${remaining >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {remaining >= 0 ? `${formatCurrency(remaining)} remaining` : `${formatCurrency(Math.abs(remaining))} over budget`}
                  </span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">{percentage.toFixed(1)}%</span>
                </div>
                {isOverBudget && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-red-500">
                    <FiAlertCircle size={14} /> <span>Over budget!</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[2000] flex items-center justify-center p-4" onClick={resetForm}>
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{editingBudget ? 'Edit Budget' : 'Set New Budget'}</h2>
              <button className="text-2xl text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer" onClick={resetForm}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Category *</label>
                <select name="category" className={`${inputCls} cursor-pointer`} value={formData.category} onChange={handleInputChange} disabled={editingBudget} required>
                  {CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
              {formData.category === 'Other' && (
                <div className="mb-4">
                  <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Custom Category Name *</label>
                  <input type="text" className={inputCls} value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Enter custom category name" required />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Month *</label>
                <select name="month" className={`${inputCls} cursor-pointer`} value={formData.month} onChange={handleInputChange} disabled={editingBudget} required>
                  {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Year *</label>
                <select name="year" className={`${inputCls} cursor-pointer`} value={formData.year} onChange={handleInputChange} disabled={editingBudget} required>
                  {Array.from({ length: 5 }, (_, i) => { const year = currentDate.getFullYear() - 2 + i; return <option key={year} value={year}>{year}</option>; })}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">Budget Amount *</label>
                <input type="number" name="amount" className={inputCls} value={formData.amount} onChange={handleInputChange} placeholder="0.00" min="0" step="0.01" required />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" className={`${btnBase} bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200`} onClick={resetForm}>Cancel</button>
                <button type="submit" className={`${btnBase} bg-primary text-white hover:bg-primary-hover`}>{editingBudget ? 'Update' : 'Create'} Budget</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget;

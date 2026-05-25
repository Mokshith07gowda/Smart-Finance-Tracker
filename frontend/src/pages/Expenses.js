import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiFilter, FiUploadCloud, FiZap, FiDownload, FiCreditCard, FiTag } from 'react-icons/fi';
import { CurrencyContext } from '../context/CurrencyContext';
import { LanguageContext } from '../context/LanguageContext';

const CATEGORIES = ['All', 'Food', 'Travel', 'Bills', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Savings', 'Utilities', 'Other'];
const inputCls = 'w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 dark:border-slate-600 rounded-md text-sm font-sans bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-light placeholder:text-slate-400';
const btnBase = 'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-[13.5px] font-semibold transition-all cursor-pointer border-none whitespace-nowrap select-none';
const cardCls = 'bg-white dark:bg-slate-800 rounded-lg p-5 shadow border border-slate-100 dark:border-slate-700 transition-all';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filter, setFilter] = useState('All');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const { formatCurrency, convertToBase, convertFromBase } = useContext(CurrencyContext);
  const { t } = useContext(LanguageContext);
  const PAYMENT_METHODS = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Wallet', 'Other'];
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Food',
    paymentMethod: 'Cash',
    tags: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [suggestedCat, setSuggestedCat] = useState(null);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const fileInputRef = useRef(null);

  const fetchExpenses = useCallback(async () => {
    try {
      const params = filter !== 'All' ? { category: filter } : {};
      const res = await axios.get('/api/expenses', { params });
      setExpenses(res.data);
    } catch (error) {
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'title' && value.length >= 3) {
      autoSuggestCategory(value);
    } else if (name === 'title' && value.length < 3) {
      setSuggestedCat(null);
    }
  };

  const autoSuggestCategory = async (title) => {
    try {
      const res = await axios.get('/api/smart/suggest-category', { params: { title } });
      if (res.data.suggested && res.data.suggested !== formData.category) {
        setSuggestedCat(res.data.suggested);
      } else {
        setSuggestedCat(null);
      }
    } catch { setSuggestedCat(null); }
  };

  const applySuggestion = () => {
    if (suggestedCat) {
      setFormData(prev => ({ ...prev, category: suggestedCat }));
      setSuggestedCat(null);
    }
  };

  // CSV Import
  const handleCsvFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) { toast.error('CSV must have a header row + data'); return; }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const titleIdx = headers.findIndex(h => h === 'title' || h === 'name' || h === 'description');
      const amountIdx = headers.findIndex(h => h === 'amount' || h === 'value');
      const categoryIdx = headers.findIndex(h => h === 'category' || h === 'type');
      const dateIdx = headers.findIndex(h => h === 'date');
      if (titleIdx === -1 || amountIdx === -1) { toast.error('CSV must have "title" and "amount" columns'); return; }
      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        rows.push({
          title: cols[titleIdx] || '',
          amount: cols[amountIdx] || '',
          category: categoryIdx >= 0 ? cols[categoryIdx] || 'Other' : 'Other',
          date: dateIdx >= 0 ? cols[dateIdx] || '' : '',
          description: ''
        });
      }
      setCsvData(rows);
      setShowCsvModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const importCsv = async () => {
    if (csvData.length === 0) return;
    setCsvImporting(true);
    try {
      const rows = csvData.map(r => ({ ...r, amount: convertToBase(Number(r.amount)) }));
      const res = await axios.post('/api/expenses/import-csv', { rows });
      toast.success(`Imported ${res.data.imported} expenses${res.data.errors > 0 ? `, ${res.data.errors} errors` : ''}`);
      setShowCsvModal(false);
      setCsvData([]);
      fetchExpenses();
    } catch { toast.error('Import failed'); }
    finally { setCsvImporting(false); }
  };

  const downloadTemplate = () => {
    const csv = 'title,amount,category,date\nGrocery Shopping,500,Food,2025-01-15\nUber Ride,250,Travel,2025-01-16';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'expense_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const tags = typeof formData.tags === 'string' ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : formData.tags || [];
      const submitData = { ...formData, amount: convertToBase(formData.amount), tags };
      if (editingExpense) {
        await axios.put(`/api/expenses/${editingExpense._id}`, submitData);
        toast.success('Expense updated successfully');
      } else {
        await axios.post('/api/expenses', submitData);
        toast.success('Expense added successfully');
      }
      
      resetForm();
      fetchExpenses();
      window.dispatchEvent(new Event('notifications-updated'));
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
      paymentMethod: expense.paymentMethod || 'Cash',
      tags: (expense.tags || []).join(', '),
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
        window.dispatchEvent(new Event('notifications-updated'));
      } catch (error) {
        toast.error('Failed to delete expense');
      }
    }
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedExpenses([]);
  };

  // Toggle expense selection
  const toggleExpenseSelection = (expenseId) => {
    setSelectedExpenses(prev => {
      if (prev.includes(expenseId)) {
        return prev.filter(id => id !== expenseId);
      } else {
        return [...prev, expenseId];
      }
    });
  };

  // Handle multi-delete
  const handleMultiDelete = async () => {
    if (selectedExpenses.length === 0) {
      toast.warning('Please select at least one expense to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedExpenses.length} expense(s)?`)) {
      try {
        await Promise.all(
          selectedExpenses.map(id => axios.delete(`/api/expenses/${id}`))
        );
        toast.success(`${selectedExpenses.length} expense(s) deleted successfully`);
        setSelectedExpenses([]);
        setSelectMode(false);
        fetchExpenses();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete expenses');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      amount: '',
      category: 'Food',
      paymentMethod: 'Cash',
      tags: '',
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
    return <div className="container mt-10"><div className="spinner"></div></div>;
  }

  return (
    <div className="container mt-10 mb-10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('exp_title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('exp_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <button className={`${btnBase} bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600`} onClick={toggleSelectMode}>Cancel</button>
              {selectedExpenses.length > 0 && (
                <button className={`${btnBase} bg-red-500 text-white shadow-sm hover:bg-red-600`} onClick={handleMultiDelete}>
                  <FiTrash2 /> Delete ({selectedExpenses.length})
                </button>
              )}
            </>
          ) : (
            <>
              <button className={`${btnBase} bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600`} onClick={toggleSelectMode}>Select</button>
              <input type="file" accept=".csv" ref={fileInputRef} onChange={handleCsvFile} className="hidden" />
              <button className={`${btnBase} bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800`} onClick={() => fileInputRef.current?.click()}>
                <FiUploadCloud size={16} /> Import CSV
              </button>
              <button className={`${btnBase} bg-primary text-white shadow-sm hover:bg-primary-hover`} onClick={() => setShowModal(true)}>
                <FiPlus size={20} /> Add Expense
              </button>
            </>
          )}
        </div>
      </div>

      <div className={`${cardCls} mb-6 animate-fade-in`}>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t('exp_total')}</h3>
        <div className="text-2xl font-bold text-red-500 tracking-tight">{formatCurrency(getTotalExpenses())}</div>
        <p className="text-slate-500 text-xs">{expenses.length} transactions</p>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-3">
          <FiFilter size={20} />
          <span>Filter by Category</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium border transition-all cursor-pointer ${filter === cat ? 'bg-primary text-white border-primary' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {expenses.length === 0 ? (
          <div className={`${cardCls} text-center text-slate-500 py-10`}>
            <p>{t('exp_no_expenses')}</p>
          </div>
        ) : (
          expenses.map(expense => (
            <div
              key={expense._id}
              className={`${cardCls} flex items-center gap-3.5 animate-fade-in ${selectMode && selectedExpenses.includes(expense._id) ? 'ring-2 ring-primary bg-primary-light' : 'hover:shadow-md'} ${selectMode ? 'cursor-pointer' : ''}`}
              onClick={selectMode ? () => toggleExpenseSelection(expense._id) : undefined}
            >
              {selectMode && (
                <input type="checkbox" checked={selectedExpenses.includes(expense._id)} onChange={() => toggleExpenseSelection(expense._id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 accent-primary shrink-0" />
              )}
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0" style={{ backgroundColor: getCategoryColor(expense.category) }}>
                {expense.category.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-semibold text-slate-900 dark:text-slate-100 truncate">{expense.title}</h4>
                <p className="text-xs text-slate-500 truncate">{expense.description}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-[11px] font-medium text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: getCategoryColor(expense.category) }}>{expense.category}</span>
                  {expense.paymentMethod && expense.paymentMethod !== 'Cash' && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center gap-0.5"><FiCreditCard size={9} />{expense.paymentMethod}</span>
                  )}
                  {expense.tags && expense.tags.length > 0 && expense.tags.slice(0, 2).map((t, ti) => (
                    <span key={ti} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center gap-0.5"><FiTag size={8} />{t}</span>
                  ))}
                  <span className="text-[11px] text-slate-400">{new Date(expense.date).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-base font-bold text-red-500 tracking-tight">{formatCurrency(expense.amount)}</div>
                {!selectMode && (
                  <div className="flex items-center gap-1 mt-1.5 justify-end">
                    <button className="p-1.5 rounded-md text-slate-400 hover:text-primary hover:bg-primary-light transition-all border-none bg-transparent cursor-pointer" onClick={() => handleEdit(expense)}><FiEdit2 size={16} /></button>
                    <button className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border-none bg-transparent cursor-pointer" onClick={() => handleDelete(expense._id)}><FiTrash2 size={16} /></button>
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
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{editingExpense ? t('exp_edit') : t('exp_add')}</h2>
              <button className="text-2xl text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer" onClick={resetForm}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('exp_title_field')} *</label>
                <input type="text" name="title" className={inputCls} value={formData.title} onChange={handleInputChange} placeholder="e.g., Grocery Shopping" required />
                {suggestedCat && (
                  <div className="flex items-center gap-2 mt-1.5 p-2 rounded-lg bg-primary/5 border border-primary/20">
                    <FiZap size={13} className="text-primary shrink-0" />
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">Suggested: <strong>{suggestedCat}</strong></span>
                    <button type="button" onClick={applySuggestion} className="text-[10px] font-bold text-primary hover:underline bg-transparent border-none cursor-pointer ml-auto">Apply</button>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('exp_amount')} *</label>
                <input type="number" name="amount" className={inputCls} value={formData.amount} onChange={handleInputChange} placeholder="0.00" min="0" step="0.01" required />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('exp_category')} *</label>
                <select name="category" className={`${inputCls} cursor-pointer`} value={formData.category} onChange={handleInputChange} required>
                  {CATEGORIES.filter(cat => cat !== 'All').map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('exp_date')} *</label>
                <input type="date" name="date" className={inputCls} value={formData.date} onChange={handleInputChange} required />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('exp_payment')}</label>
                  <select name="paymentMethod" className={`${inputCls} cursor-pointer`} value={formData.paymentMethod} onChange={handleInputChange}>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('exp_tags')}</label>
                  <input type="text" name="tags" className={inputCls} value={formData.tags} onChange={handleInputChange} placeholder="e.g., lunch, personal" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t('exp_description')}</label>
                <textarea name="description" className={`${inputCls} resize-y`} value={formData.description} onChange={handleInputChange} placeholder="Optional notes..." rows="2" />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button type="button" className={`${btnBase} bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200`} onClick={resetForm}>Cancel</button>
                <button type="submit" className={`${btnBase} bg-primary text-white hover:bg-primary-hover`}>{editingExpense ? 'Update' : 'Add'} Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* CSV Import Modal */}
      {showCsvModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-[2000] flex items-center justify-center p-4" onClick={() => setShowCsvModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Import CSV Preview</h2>
              <button className="text-2xl text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer" onClick={() => setShowCsvModal(false)}>&times;</button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{csvData.length} expense(s) found in file</p>
              <div className="max-h-60 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 dark:text-slate-300">Title</th>
                      <th className="text-right px-3 py-2 font-semibold text-slate-600 dark:text-slate-300">Amount</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 dark:text-slate-300">Category</th>
                      <th className="text-left px-3 py-2 font-semibold text-slate-600 dark:text-slate-300">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.map((r, i) => (
                      <tr key={i} className="border-t border-slate-100 dark:border-slate-700">
                        <td className="px-3 py-1.5 text-slate-900 dark:text-slate-100">{r.title}</td>
                        <td className="px-3 py-1.5 text-right text-slate-900 dark:text-slate-100">{r.amount}</td>
                        <td className="px-3 py-1.5 text-slate-500">{r.category}</td>
                        <td className="px-3 py-1.5 text-slate-500">{r.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-4 gap-2">
                <button type="button" onClick={downloadTemplate} className={`${btnBase} text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300`}>
                  <FiDownload size={13} /> Template
                </button>
                <div className="flex gap-2">
                  <button type="button" className={`${btnBase} bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200`} onClick={() => setShowCsvModal(false)}>Cancel</button>
                  <button type="button" onClick={importCsv} disabled={csvImporting} className={`${btnBase} bg-primary text-white hover:bg-primary-hover ${csvImporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {csvImporting ? 'Importing...' : `Import ${csvData.length} Expenses`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;

import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiRefreshCw, FiClock, FiPause, FiPlay, FiBarChart2, FiAlertCircle } from 'react-icons/fi';
import { CurrencyContext } from '../context/CurrencyContext';
import { LanguageContext } from '../context/LanguageContext';

const inputCls = 'w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 dark:border-slate-600 rounded-md text-sm font-sans bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-light placeholder:text-slate-400';
const btnBase = 'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-[13.5px] font-semibold transition-all cursor-pointer border-none whitespace-nowrap select-none';
const card = 'bg-white dark:bg-slate-800 rounded-lg p-5 shadow border border-slate-100 dark:border-slate-700 transition-all';

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Savings', 'Utilities', 'Other'];

const RecurringExpenses = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const { formatCurrency, convertToBase, convertFromBase } = useContext(CurrencyContext);
  const { t } = useContext(LanguageContext);
  const [formData, setFormData] = useState({ title: '', amount: '', category: 'Bills', frequency: 'monthly', dayOfMonth: 1, description: '' });
  const [subIntel, setSubIntel] = useState(null);

  const fetchItems = useCallback(async () => {
    try {
      const res = await axios.get('/api/recurring-expenses');
      setItems(res.data);
    } catch { toast.error('Failed to fetch recurring expenses'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); fetchSubIntel(); }, [fetchItems]);

  const fetchSubIntel = async () => {
    try { const res = await axios.get('/api/smart/subscription-intelligence'); setSubIntel(res.data); }
    catch { /* silent */ }
  };

  const resetForm = () => { setFormData({ title: '', amount: '', category: 'Bills', frequency: 'monthly', dayOfMonth: 1, description: '' }); setEditing(null); setShowModal(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) { toast.error('Fill all required fields'); return; }
    try {
      const payload = { ...formData, amount: convertToBase(formData.amount) };
      if (editing) {
        await axios.put(`/api/recurring-expenses/${editing._id}`, payload);
        toast.success('Updated');
      } else {
        await axios.post('/api/recurring-expenses', payload);
        toast.success('Recurring expense added');
      }
      resetForm();
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
  };

  const handleEdit = (item) => {
    setEditing(item);
    setFormData({ title: item.title, amount: Math.round(convertFromBase(item.amount) * 100) / 100, category: item.category, frequency: item.frequency, dayOfMonth: item.dayOfMonth || 1, description: item.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring expense?')) return;
    try { await axios.delete(`/api/recurring-expenses/${id}`); toast.success('Deleted'); fetchItems(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async (item) => {
    try {
      await axios.put(`/api/recurring-expenses/${item._id}`, { ...item, isActive: !item.isActive });
      toast.success(item.isActive ? 'Paused' : 'Resumed');
      fetchItems();
    } catch { toast.error('Failed to update'); }
  };

  const processRecurring = async () => {
    try {
      const res = await axios.post('/api/recurring-expenses/process-due');
      if (res.data.processed > 0) {
        toast.success(`${res.data.processed} recurring expenses processed!`);
      } else {
        toast.info('No recurring expenses due right now');
      }
      fetchItems();
    } catch { toast.error('Failed to process'); }
  };

  const freqLabel = { weekly: 'Weekly', monthly: 'Monthly', quarterly: 'Quarterly', yearly: 'Yearly' };
  const totalMonthly = items.filter(i => i.isActive).reduce((s, i) => {
    const amt = i.amount;
    if (i.frequency === 'weekly') return s + amt * 4.33;
    if (i.frequency === 'quarterly') return s + amt / 3;
    if (i.frequency === 'yearly') return s + amt / 12;
    return s + amt;
  }, 0);

  if (loading) return <div className="container mt-10"><div className="spinner"></div></div>;

  return (
    <div className="container mt-10 mb-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('rec_title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('rec_subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={processRecurring} className={`${btnBase} bg-amber-50 dark:bg-amber-900/20 text-amber-600 hover:bg-amber-100`}><FiRefreshCw size={14} /> Process Due</button>
          <button onClick={() => { resetForm(); setShowModal(true); }} className={`${btnBase} bg-primary text-white hover:bg-primary-hover shadow-sm`}><FiPlus size={16} /> Add</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { l: 'Total Recurring', v: items.length, c: 'text-primary' },
          { l: 'Active', v: items.filter(i => i.isActive).length, c: 'text-emerald-600' },
          { l: 'Monthly Impact', v: formatCurrency(totalMonthly), c: 'text-red-500' },
          { l: 'Annual Cost', v: formatCurrency(totalMonthly * 12), c: 'text-amber-600' },
        ].map((s, i) => (
          <div key={i} className={`${card} animate-fade-in`}>
            <p className="text-[10px] font-bold text-slate-500 uppercase">{s.l}</p>
            <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Subscription Intelligence */}
      {subIntel && (subIntel.insights.length > 0 || subIntel.potentialSavings > 0) && (
        <div className={`${card} mb-6 animate-fade-in`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center"><FiBarChart2 size={16} className="text-indigo-600" /></div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Subscription Intelligence</h3>
              <p className="text-[10px] text-slate-500">Smart analysis of your recurring commitments</p>
            </div>
          </div>
          <div className="space-y-1.5 mb-3">
            {subIntel.insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <span className="text-sm shrink-0">{ins.icon}</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">{ins.text}</p>
              </div>
            ))}
          </div>
          {subIntel.potentialSavings > 0 && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <FiAlertCircle size={14} className="text-amber-600 shrink-0" />
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">Potential savings of {formatCurrency(subIntel.potentialSavings)}/month from possibly unused subscriptions</p>
            </div>
          )}
          {subIntel.categoryBreakdown && Object.keys(subIntel.categoryBreakdown).length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Cost by Category</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(subIntel.categoryBreakdown).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
                  <span key={cat} className="text-[10px] px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                    {cat}: {formatCurrency(amt)}/mo
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className={`${card} text-center py-16`}>
          <FiRefreshCw size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">No Recurring Expenses</h3>
          <p className="text-slate-500 text-sm mb-4">Add bills like rent, Netflix, EMIs</p>
          <button onClick={() => setShowModal(true)} className={`${btnBase} bg-primary text-white hover:bg-primary-hover`}><FiPlus size={16} /> Add Recurring</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => {
            const daysUntilDue = Math.ceil((new Date(item.nextDueDate) - new Date()) / (1000 * 60 * 60 * 24));
            const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;
            const isOverdue = daysUntilDue < 0;

            return (
              <div key={item._id} className={`${card} hover:-translate-y-0.5 hover:shadow-lg ${!item.isActive ? 'opacity-60' : ''}`} style={{ borderLeft: `3px solid ${isOverdue ? '#ef4444' : isDueSoon ? '#f59e0b' : '#10b981'}` }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{item.title}</h3>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">{freqLabel[item.frequency]}</span>
                      {!item.isActive && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30">Paused</span>}
                    </div>
                    <p className="text-[11px] text-slate-500">{item.category}</p>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-lg font-bold text-red-500">{formatCurrency(item.amount)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3 text-[11px]">
                  <div className="flex items-center gap-1 text-slate-500">
                    <FiClock size={12} />
                    <span>Next: {new Date(item.nextDueDate).toLocaleDateString()}</span>
                  </div>
                  {isOverdue && <span className="text-red-500 font-bold">Overdue!</span>}
                  {isDueSoon && !isOverdue && <span className="text-amber-500 font-bold">Due soon!</span>}
                  {daysUntilDue > 3 && <span className="text-slate-400">{daysUntilDue} days</span>}
                </div>

                <div className="flex gap-1.5">
                  <button onClick={() => handleToggle(item)} className={`${btnBase} flex-1 !px-2 !py-1.5 !text-[11px] ${item.isActive ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                    {item.isActive ? <><FiPause size={12} /> Pause</> : <><FiPlay size={12} /> Resume</>}
                  </button>
                  <button onClick={() => handleEdit(item)} className={`${btnBase} !px-2 !py-1.5 !text-[11px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300`}><FiEdit2 size={12} /></button>
                  <button onClick={() => handleDelete(item._id)} className={`${btnBase} !px-2 !py-1.5 !text-[11px] bg-red-50 dark:bg-red-900/20 text-red-500`}><FiTrash2 size={12} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">{editing ? 'Edit' : 'Add'} Recurring Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Netflix, Rent" className={inputCls} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Amount *</label>
                  <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="499" className={inputCls} required min="1" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={inputCls}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Frequency</label>
                  <select value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })} className={inputCls}>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Day of Month</label>
                  <input type="number" value={formData.dayOfMonth} onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })} min="1" max="31" className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Description</label>
                <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional" className={inputCls} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className={`${btnBase} flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200`}>Cancel</button>
                <button type="submit" className={`${btnBase} flex-1 bg-primary text-white hover:bg-primary-hover`}>{editing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringExpenses;

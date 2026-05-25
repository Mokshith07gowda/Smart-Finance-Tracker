import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiTarget, FiCheckCircle, FiCalendar, FiDollarSign, FiTrendingUp, FiZap } from 'react-icons/fi';
import { CurrencyContext } from '../context/CurrencyContext';
import { LanguageContext } from '../context/LanguageContext';

const inputCls = 'w-full py-2.5 px-3.5 border-[1.5px] border-slate-200 dark:border-slate-600 rounded-md text-sm font-sans bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary-light placeholder:text-slate-400';
const btnBase = 'inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md text-[13.5px] font-semibold transition-all cursor-pointer border-none whitespace-nowrap select-none';
const card = 'bg-white dark:bg-slate-800 rounded-lg p-5 shadow border border-slate-100 dark:border-slate-700 transition-all';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showAddSavings, setShowAddSavings] = useState(null);
  const [addAmount, setAddAmount] = useState('');
  const { formatCurrency, convertToBase, convertFromBase } = useContext(CurrencyContext);
  const { t } = useContext(LanguageContext);
  const [formData, setFormData] = useState({ title: '', targetAmount: '', targetDate: '', category: 'General', priority: 'medium' });
  const [habitData, setHabitData] = useState(null);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await axios.get('/api/goals');
      setGoals(res.data);
    } catch { toast.error('Failed to fetch goals'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchGoals(); fetchHabits(); }, [fetchGoals]);

  const fetchHabits = async () => {
    try {
      const res = await axios.get('/api/smart/habit-score');
      setHabitData(res.data);
    } catch { /* silent */ }
  };

  const resetForm = () => { setFormData({ title: '', targetAmount: '', targetDate: '', category: 'General', priority: 'medium' }); setEditingGoal(null); setShowModal(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.targetAmount || !formData.targetDate) { toast.error('Fill all required fields'); return; }
    try {
      const payload = { ...formData, targetAmount: convertToBase(formData.targetAmount) };
      if (editingGoal) {
        await axios.put(`/api/goals/${editingGoal._id}`, payload);
        toast.success('Goal updated');
      } else {
        await axios.post('/api/goals', payload);
        toast.success('Goal created');
      }
      resetForm();
      fetchGoals();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save goal'); }
  };

  const handleEdit = (g) => {
    setEditingGoal(g);
    setFormData({ title: g.title, targetAmount: Math.round(convertFromBase(g.targetAmount) * 100) / 100, targetDate: g.targetDate?.split('T')[0] || '', category: g.category || 'General', priority: g.priority || 'medium' });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    try { await axios.delete(`/api/goals/${id}`); toast.success('Goal deleted'); fetchGoals(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleAddSavings = async (goalId) => {
    if (!addAmount || Number(addAmount) <= 0) { toast.error('Enter a valid amount'); return; }
    try {
      await axios.put(`/api/goals/${goalId}/add-savings`, { amount: convertToBase(Number(addAmount)) });
      toast.success('Savings added!');
      setShowAddSavings(null);
      setAddAmount('');
      fetchGoals();
    } catch { toast.error('Failed to add savings'); }
  };

  const priorityColors = { high: 'bg-red-100 text-red-600 dark:bg-red-900/30', medium: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30', low: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' };

  if (loading) return <div className="container mt-10"><div className="spinner"></div></div>;

  const activeGoals = goals.filter(g => !g.isCompleted);
  const completedGoals = goals.filter(g => g.isCompleted);

  return (
    <div className="container mt-10 mb-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('goal_title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('goal_subtitle')}</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className={`${btnBase} bg-primary text-white hover:bg-primary-hover shadow-sm`}><FiPlus size={16} /> New Goal</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { l: 'Active Goals', v: activeGoals.length, c: 'text-primary', icon: <FiTarget size={18} /> },
          { l: 'Completed', v: completedGoals.length, c: 'text-emerald-600', icon: <FiCheckCircle size={18} /> },
          { l: 'Total Target', v: formatCurrency(goals.reduce((s, g) => s + g.targetAmount, 0)), c: 'text-amber-600', icon: <FiDollarSign size={18} /> },
          { l: 'Total Saved', v: formatCurrency(goals.reduce((s, g) => s + (g.savedAmount || 0), 0)), c: 'text-emerald-600', icon: <FiDollarSign size={18} /> },
        ].map((s, i) => (
          <div key={i} className={`${card} animate-fade-in`}>
            <div className={`${s.c} mb-1`}>{s.icon}</div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">{s.l}</p>
            <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* AI Goal Insights */}
      {habitData && activeGoals.length > 0 && (
        <div className={`${card} mb-6 animate-fade-in`}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center"><FiZap size={16} className="text-purple-600" /></div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Goal Intelligence</h3>
              <p className="text-[10px] text-slate-500">Smart recommendations based on your financial habits</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeGoals.slice(0, 3).map(g => {
              const saved = g.savedAmount || 0;
              const remaining = g.targetAmount - saved;
              const daysLeft = Math.max(1, Math.ceil((new Date(g.targetDate) - new Date()) / (1000 * 60 * 60 * 24)));
              const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
              const monthlyNeeded = remaining / monthsLeft;
              const isOnTrack = saved > 0 || daysLeft > 90;
              return (
                <div key={g._id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-1 truncate">{g.title}</h4>
                  <div className="flex items-center gap-1 mb-2">
                    <FiTrendingUp size={11} className={isOnTrack ? 'text-emerald-500' : 'text-amber-500'} />
                    <span className={`text-[10px] font-semibold ${isOnTrack ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isOnTrack ? 'On Track' : 'Needs Attention'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Save <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(monthlyNeeded)}/mo</strong> for {monthsLeft} months</p>
                  {remaining > 0 && <p className="text-[10px] text-slate-500 mt-1">{formatCurrency(remaining)} remaining to goal</p>}
                </div>
              );
            })}
          </div>
          {habitData.habits && habitData.habits.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {habitData.habits.filter(h => h.impact === 'high' || h.impact === 'medium').slice(0, 2).map((h, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                  <span className="text-sm shrink-0">{h.icon}</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{h.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Goals */}
      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <div className={`${card} text-center py-16`}>
          <FiTarget size={48} className="mx-auto mb-4 text-slate-300" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">No Goals Yet</h3>
          <p className="text-slate-500 text-sm mb-4">Create your first financial goal to start tracking!</p>
          <button onClick={() => setShowModal(true)} className={`${btnBase} bg-primary text-white hover:bg-primary-hover`}><FiPlus size={16} /> Create Goal</button>
        </div>
      ) : (
        <div className="space-y-4">
          {activeGoals.length > 0 && <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">Active Goals</h2>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map(g => {
              const pct = g.targetAmount > 0 ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100)) : 0;
              const remaining = g.targetAmount - (g.savedAmount || 0);
              const monthsLeft = Math.max(1, Math.ceil((new Date(g.targetDate) - new Date()) / (1000 * 60 * 60 * 24 * 30)));
              const monthlyNeeded = remaining / monthsLeft;
              const isOverdue = new Date(g.targetDate) < new Date();

              return (
                <div key={g._id} className={`${card} hover:-translate-y-0.5 hover:shadow-lg`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{g.title}</h3>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${priorityColors[g.priority]}`}>{g.priority}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{g.category}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => handleEdit(g)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-primary transition-all bg-transparent border-none cursor-pointer"><FiEdit2 size={14} /></button>
                      <button onClick={() => handleDelete(g._id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all bg-transparent border-none cursor-pointer"><FiTrash2 size={14} /></button>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">{formatCurrency(g.savedAmount || 0)} saved</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(g.targetAmount)}</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: pct >= 100 ? '#10b981' : pct >= 60 ? '#6366f1' : '#f59e0b' }} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 mb-3">
                    <span className="font-bold" style={{ color: pct >= 100 ? '#10b981' : '#6366f1' }}>{pct}% complete</span>
                    <span className="flex items-center gap-1">
                      <FiCalendar size={10} />
                      {isOverdue ? <span className="text-red-500 font-bold">Overdue</span> : `${monthsLeft}mo left`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50">
                      <span className="text-[9px] text-slate-500 font-medium">Remaining</span>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{formatCurrency(remaining)}</div>
                    </div>
                    <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50">
                      <span className="text-[9px] text-slate-500 font-medium">Need/month</span>
                      <div className="text-xs font-bold text-primary">{formatCurrency(monthlyNeeded)}</div>
                    </div>
                  </div>

                  {showAddSavings === g._id ? (
                    <div className="flex gap-2">
                      <input type="number" value={addAmount} onChange={(e) => setAddAmount(e.target.value)} placeholder="Amount" className={`${inputCls} !py-2 !text-xs`} />
                      <button onClick={() => handleAddSavings(g._id)} className={`${btnBase} bg-emerald-500 text-white hover:bg-emerald-600 !px-3 !py-2 !text-xs`}>Add</button>
                      <button onClick={() => { setShowAddSavings(null); setAddAmount(''); }} className={`${btnBase} bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 !px-3 !py-2 !text-xs`}>Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => setShowAddSavings(g._id)} className={`${btnBase} w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 !text-xs`}><FiDollarSign size={14} /> Add Savings</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide mt-6">Completed Goals 🎉</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedGoals.map(g => (
                  <div key={g._id} className={`${card} opacity-80 border-l-[3px] border-l-emerald-500`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FiCheckCircle size={18} className="text-emerald-500" />
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{g.title}</h3>
                          <p className="text-[10px] text-slate-500">{formatCurrency(g.targetAmount)} achieved</p>
                        </div>
                      </div>
                      <button onClick={() => handleDelete(g._id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-all bg-transparent border-none cursor-pointer"><FiTrash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-scale-in border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">{editingGoal ? 'Edit Goal' : 'New Goal'}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Goal Title *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Buy Laptop" className={inputCls} required />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Target Amount *</label>
                <input type="number" value={formData.targetAmount} onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })} placeholder="80000" className={inputCls} required min="1" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Target Date *</label>
                <input type="date" value={formData.targetDate} onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })} className={inputCls} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={inputCls}>
                    {['General', 'Electronics', 'Vehicle', 'Travel', 'Education', 'Emergency Fund', 'Investment', 'Home', 'Wedding', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Priority</label>
                  <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className={inputCls}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className={`${btnBase} flex-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200`}>Cancel</button>
                <button type="submit" className={`${btnBase} flex-1 bg-primary text-white hover:bg-primary-hover`}>{editingGoal ? 'Update' : 'Create'} Goal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;

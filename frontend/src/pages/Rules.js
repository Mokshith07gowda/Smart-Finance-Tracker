import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiZap, FiPlay, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { LanguageContext } from '../context/LanguageContext';

const card = 'bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-700';
const input = 'w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';
const btn = 'px-4 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer border-none';

const TRIGGER_TYPES = [
  { value: 'budget_threshold', label: 'Budget Threshold %' },
  { value: 'spending_limit', label: 'Spending Limit (₹)' },
  { value: 'savings_below', label: 'Savings Below (₹)' },
  { value: 'category_limit', label: 'Category Limit (₹)' },
  { value: 'goal_behind', label: 'Goal Behind Schedule' },
];
const ACTION_TYPES = [
  { value: 'notify', label: 'Send Notification' },
  { value: 'flag', label: 'Flag for Review' },
  { value: 'suggest_reduction', label: 'Suggest Reduction' },
];
const OPERATORS = ['>', '<', '>=', '<=', '=='];
const SEVERITIES = ['info', 'warning', 'critical'];

const Rules = () => {
  const [rules, setRules] = useState([]);
  const { t } = useContext(LanguageContext);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', trigger: { type: 'budget_threshold', category: '', threshold: 80, operator: '>' }, action: { type: 'notify', message: '', severity: 'warning' } });

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    try {
      const res = await axios.get('/api/rules');
      setRules(res.data);
    } catch { toast.error('Failed to load rules'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.trigger.threshold) { toast.error('Name and threshold required'); return; }
    try {
      if (editing) {
        const res = await axios.put(`/api/rules/${editing}`, form);
        setRules(prev => prev.map(r => r._id === editing ? res.data : r));
        toast.success('Rule updated');
      } else {
        const res = await axios.post('/api/rules', form);
        setRules(prev => [res.data, ...prev]);
        toast.success('Rule created');
      }
      resetForm();
    } catch { toast.error('Failed to save rule'); }
  };

  const deleteRule = async (id) => {
    try {
      await axios.delete(`/api/rules/${id}`);
      setRules(prev => prev.filter(r => r._id !== id));
      toast.success('Rule deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const toggleRule = async (rule) => {
    try {
      const res = await axios.put(`/api/rules/${rule._id}`, { isActive: !rule.isActive });
      setRules(prev => prev.map(r => r._id === rule._id ? res.data : r));
    } catch { toast.error('Failed to toggle'); }
  };

  const evaluateRules = async () => {
    try {
      const res = await axios.post('/api/rules/evaluate');
      toast.success(`${res.data.triggered} rule(s) triggered out of ${res.data.evaluated} evaluated`);
    } catch { toast.error('Failed to evaluate rules'); }
  };

  const resetForm = () => {
    setForm({ name: '', description: '', trigger: { type: 'budget_threshold', category: '', threshold: 80, operator: '>' }, action: { type: 'notify', message: '', severity: 'warning' } });
    setEditing(null);
    setShowForm(false);
  };

  const editRule = (rule) => {
    setForm({ name: rule.name, description: rule.description || '', trigger: rule.trigger, action: rule.action });
    setEditing(rule._id);
    setShowForm(true);
  };

  const severityBadge = { info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300', warning: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300', critical: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300' };

  if (loading) return (
    <div className="container mt-10">
      <div className="space-y-3">{[1,2,3].map(i => <div key={i} className={`${card} h-20 animate-pulse bg-slate-100 dark:bg-slate-700`} />)}</div>
    </div>
  );

  return (
    <div className="container mt-10 mb-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2"><FiZap className="text-primary" /> {t('rules_title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('rules_subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={evaluateRules} className={`${btn} bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/40 flex items-center gap-1.5`}>
            <FiPlay size={14} /> Evaluate Now
          </button>
          <button onClick={() => { resetForm(); setShowForm(true); }} className={`${btn} bg-primary text-white hover:opacity-90 flex items-center gap-1.5`}>
            <FiPlus size={14} /> New Rule
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className={`${card} mb-6`}>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">{editing ? 'Edit Rule' : 'Create New Rule'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Rule Name*</label>
                <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Alert when Food > 5000" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description</label>
                <input className={input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/30">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">⚡ Trigger Condition</p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <select className={input} value={form.trigger.type} onChange={(e) => setForm({ ...form, trigger: { ...form.trigger, type: e.target.value } })}>
                  {TRIGGER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <input className={input} value={form.trigger.category} onChange={(e) => setForm({ ...form, trigger: { ...form.trigger, category: e.target.value } })} placeholder="Category (optional)" />
                <select className={input} value={form.trigger.operator} onChange={(e) => setForm({ ...form, trigger: { ...form.trigger, operator: e.target.value } })}>
                  {OPERATORS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <input type="number" className={input} value={form.trigger.threshold} onChange={(e) => setForm({ ...form, trigger: { ...form.trigger, threshold: Number(e.target.value) } })} placeholder="Threshold" />
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/30">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">🎯 Action</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select className={input} value={form.action.type} onChange={(e) => setForm({ ...form, action: { ...form.action, type: e.target.value } })}>
                  {ACTION_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
                <select className={input} value={form.action.severity} onChange={(e) => setForm({ ...form, action: { ...form.action, severity: e.target.value } })}>
                  {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <input className={input} value={form.action.message} onChange={(e) => setForm({ ...form, action: { ...form.action, message: e.target.value } })} placeholder="Custom message (optional)" />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="submit" className={`${btn} bg-primary text-white hover:opacity-90`}>{editing ? 'Update Rule' : 'Create Rule'}</button>
              <button type="button" onClick={resetForm} className={`${btn} bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300`}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className={`${card} text-center py-16`}>
          <FiZap size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No rules created yet. Create your first automation rule!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => (
            <div key={rule._id} className={`${card} flex items-center gap-4 flex-wrap ${!rule.isActive ? 'opacity-60' : ''}`}>
              <button onClick={() => toggleRule(rule)} className="shrink-0 bg-transparent border-none cursor-pointer text-slate-400 hover:text-primary transition-all">
                {rule.isActive ? <FiToggleRight size={24} className="text-primary" /> : <FiToggleLeft size={24} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">{rule.name}</h4>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${severityBadge[rule.action.severity] || severityBadge.info}`}>{rule.action.severity}</span>
                  {rule.triggerCount > 0 && <span className="text-[9px] text-slate-400">Triggered {rule.triggerCount}x</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  When <strong>{rule.trigger.type.replace(/_/g, ' ')}</strong>
                  {rule.trigger.category ? ` (${rule.trigger.category})` : ''}
                  {` ${rule.trigger.operator} ${rule.trigger.threshold}`}
                  → <strong>{rule.action.type.replace(/_/g, ' ')}</strong>
                </p>
                {rule.description && <p className="text-[11px] text-slate-400 mt-0.5">{rule.description}</p>}
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => editRule(rule)} className="p-2 rounded-lg bg-transparent border-none cursor-pointer text-slate-400 hover:text-primary hover:bg-primary/5 transition-all"><FiEdit2 size={14} /></button>
                <button onClick={() => deleteRule(rule._id)} className="p-2 rounded-lg bg-transparent border-none cursor-pointer text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"><FiTrash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Rules;

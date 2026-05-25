import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiUsers, FiCalendar, FiDollarSign, FiEdit2 } from 'react-icons/fi';
import { LanguageContext } from '../context/LanguageContext';
import { MdSplitscreen } from 'react-icons/md';
import { CurrencyContext } from '../context/CurrencyContext';

const inputCls = 'w-full py-2.5 px-3.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light placeholder:text-slate-400';
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-md transition-all cursor-pointer border-none';
const btnSecondary = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all cursor-pointer border-none';
const btnDanger = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-red-500 text-white hover:bg-red-600 shadow-sm transition-all cursor-pointer border-none';
const labelCls = 'flex items-center gap-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1.5';

const SplitBills = () => {
  const [bills, setBills] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editingBillId, setEditingBillId] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedBills, setSelectedBills] = useState([]);
  const { formatCurrency, currencySymbol, convertToBase, convertFromBase } = useContext(CurrencyContext);
  const { t } = useContext(LanguageContext);
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
  const fetchBills = useCallback(async () => {
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
  }, []);

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
  }, [fetchBills]);

  // Add participant
  const addParticipant = () => {
    const newParticipants = [...formData.participants, { name: '', amount: '' }];
    
    // Recalculate equal split if needed
    if (formData.splitType === 'equally' && formData.totalAmount) {
      calculateEqualSplit(newParticipants, formData.totalAmount);
    } else {
      setFormData({
        ...formData,
        participants: newParticipants
      });
    }
  };

  // Remove participant
  const removeParticipant = (index) => {
    const newParticipants = formData.participants.filter((_, i) => i !== index);
    
    // Recalculate equal split if needed
    if (formData.splitType === 'equally' && formData.totalAmount) {
      calculateEqualSplit(newParticipants, formData.totalAmount);
    } else {
      setFormData({ ...formData, participants: newParticipants });
    }
  };

  // Update participant
  const updateParticipant = (index, field, value) => {
    const newParticipants = [...formData.participants];
    newParticipants[index][field] = value;
    setFormData({ ...formData, participants: newParticipants });
  };

  // Calculate equal split
  const calculateEqualSplit = (participants = null, total = null) => {
    setFormData(prev => {
      const amount = total !== null ? (typeof total === 'string' ? parseFloat(total) : total) : (parseFloat(prev.totalAmount) || 0);
      const participantList = participants !== null ? participants : prev.participants;
      const count = participantList.length;
      
      if (count > 0 && amount > 0) {
        const splitAmount = (amount / count).toFixed(2);
        const newParticipants = participantList.map(p => ({
          ...p,
          amount: splitAmount
        }));
        return { 
          ...prev, 
          participants: newParticipants,
          totalAmount: total !== null ? (typeof total === 'string' ? total : total.toString()) : prev.totalAmount
        };
      }
      return prev;
    });
  };

  // Handle split type change
  const handleSplitTypeChange = (type) => {
    setFormData({ ...formData, splitType: type });
    if (type === 'equally' && formData.totalAmount) {
      calculateEqualSplit(formData.participants, formData.totalAmount);
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

      if (editMode) {
        // Update existing bill
        await axios.put(`/api/split-bills/${editingBillId}`, dataToSend);
        toast.success('Split bill updated successfully!');
      } else {
        // Create new bill
        await axios.post('/api/split-bills', dataToSend);
        toast.success('Split bill added successfully!');
      }
      
      setShowAddModal(false);
      resetForm();
      fetchBills();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add split bill';
      toast.error(errorMessage);
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
    setEditMode(false);
    setEditingBillId(null);
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

  // Edit bill
  const handleEdit = (bill) => {
    setEditMode(true);
    setEditingBillId(bill._id);
    setFormData({
      paidBy: bill.paidBy,
      splitType: bill.splitType,
      participants: bill.participants.map(p => ({
        name: p.name,
        amount: convertFromBase(p.amount).toFixed(2)
      })),
      totalAmount: convertFromBase(bill.totalAmount).toFixed(2),
      description: bill.description || '',
      date: new Date(bill.date).toISOString().split('T')[0]
    });
    setShowAddModal(true);
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedBills([]);
  };

  // Toggle bill selection
  const toggleBillSelection = (billId) => {
    setSelectedBills(prev => {
      if (prev.includes(billId)) {
        return prev.filter(id => id !== billId);
      } else {
        return [...prev, billId];
      }
    });
  };

  // Delete multiple bills
  const handleMultiDelete = async () => {
    if (selectedBills.length === 0) {
      toast.error('Please select bills to delete');
      return;
    }

    const confirmMessage = `Do you really want to delete ${selectedBills.length} bill${selectedBills.length > 1 ? 's' : ''}?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await Promise.all(
          selectedBills.map(id => axios.delete(`/api/split-bills/${id}`))
        );
        toast.success(`${selectedBills.length} bill${selectedBills.length > 1 ? 's' : ''} deleted successfully`);
        setSelectedBills([]);
        setSelectMode(false);
        fetchBills();
      } catch (error) {
        toast.error('Failed to delete some bills');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const statCards = [
    { label: 'Total Expenses', value: formatCurrency(convertFromBase(stats.totalExpenses)), icon: <FiDollarSign size={18} />, color: 'from-indigo-500 to-purple-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'Total Bills', value: stats.totalBills, icon: <MdSplitscreen size={18} />, color: 'from-cyan-500 to-blue-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
    { label: 'Owed to You', value: formatCurrency(convertFromBase(stats.totalOwedToYou)), icon: <FiUsers size={18} />, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'You Owe', value: formatCurrency(convertFromBase(stats.totalYouOwe)), icon: <FiUsers size={18} />, color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  ];

  return (
    <div className="container mt-10 mb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('split_title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('split_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectMode && selectedBills.length > 0 && <button className={btnDanger} onClick={handleMultiDelete}><FiTrash2 /> Delete ({selectedBills.length})</button>}
          {!selectMode && <button className={btnPrimary} onClick={() => setShowAddModal(true)}><FiPlus size={16} /> Add Expense</button>}
          {bills.length > 0 && <button className={btnSecondary} onClick={toggleSelectMode}>{selectMode ? '✕ Cancel' : 'Select'}</button>}
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s, i) => (
          <div key={i} className={`${s.bg} rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50 animate-fade-up`} style={{ animationDelay: `${i * 80}ms` }}>
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}>{s.icon}</div>
            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{s.label}</p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">{s.value}</h3>
          </div>
        ))}
      </div>

      {/* Bills List */}
      {loading ? (
        <div className="text-center py-10"><div className="spinner"></div><p className="text-sm text-slate-500 mt-2">Loading bills...</p></div>
      ) : bills.length === 0 ? (
        <div className="card-elevated text-center py-16 animate-fade-in">
          <MdSplitscreen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Split Bills Yet</h3>
          <p className="text-sm text-slate-500 mt-1">Start tracking shared expenses by adding your first split bill</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bills.map((bill) => (
            <div
              key={bill._id}
              className={`card-elevated p-5 animate-fade-up transition-all ${selectMode && selectedBills.includes(bill._id) ? 'ring-2 ring-primary bg-primary-light' : 'hover:shadow-md'} ${selectMode ? 'cursor-pointer' : ''}`}
              onClick={selectMode ? () => toggleBillSelection(bill._id) : undefined}
            >
              {selectMode && <input type="checkbox" checked={selectedBills.includes(bill._id)} onChange={() => toggleBillSelection(bill._id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 accent-primary mb-3" />}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{bill.description || 'Shared Expense'}</h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><FiCalendar size={11} /> {formatDate(bill.date)}</p>
                </div>
                {!selectMode && (
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-md text-slate-400 hover:bg-primary-light hover:text-primary transition-all border-none bg-transparent cursor-pointer" onClick={() => handleEdit(bill)}><FiEdit2 size={15} /></button>
                    <button className="p-1.5 rounded-md text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all border-none bg-transparent cursor-pointer" onClick={() => handleDelete(bill._id)}><FiTrash2 size={15} /></button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mb-3 py-2 px-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div><span className="block text-[10px] font-medium text-slate-500 uppercase">Amount</span><span className="block text-base font-bold text-slate-900 dark:text-slate-100">{formatCurrency(convertFromBase(bill.totalAmount))}</span></div>
                <div className="text-right"><span className="block text-[10px] font-medium text-slate-500 uppercase">Paid by</span><span className="block text-sm font-semibold text-primary">{bill.paidBy}</span></div>
              </div>

              <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mb-3 ${bill.splitType === 'equally' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600'}`}>
                {bill.splitType === 'equally' ? 'Equal Split' : 'Unequal Split'}
              </span>

              <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase mb-2">Participants</p>
                <div className="space-y-1.5">
                  {bill.participants.map((p, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">{p.name}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(convertFromBase(p.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={() => { setShowAddModal(false); resetForm(); }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{editMode ? 'Edit Expense' : 'Add Expense'}</h2>
              <button className="text-2xl text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer leading-none" onClick={() => { setShowAddModal(false); resetForm(); }}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Paid by <span className="text-red-400">*</span></label>
                <select value={formData.paidBy} onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })} required className={inputCls}>
                  <option value="You">You</option>
                  <option value="">Select someone else</option>
                </select>
                {formData.paidBy === '' && <input type="text" placeholder="Enter name" value={formData.paidBy} onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })} required className={`${inputCls} mt-2`} />}
                {formData.paidBy !== '' && formData.paidBy !== 'You' && <input type="text" placeholder="Enter name" value={formData.paidBy} onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })} required className={`${inputCls} mt-2`} />}
              </div>

              <div>
                <label className={labelCls}>Split Type <span className="text-red-400">*</span></label>
                <div className="flex gap-3">
                  {['equally', 'unequally'].map(type => (
                    <label key={type} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg cursor-pointer border text-sm font-medium transition-all ${formData.splitType === type ? 'border-primary bg-primary-light text-primary' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}>
                      <input type="radio" name="splitType" value={type} checked={formData.splitType === type} onChange={(e) => handleSplitTypeChange(e.target.value)} className="accent-primary" />
                      {type === 'equally' ? 'Equally' : 'Unequally'}
                    </label>
                  ))}
                </div>
                {formData.paidBy && <p className="text-xs text-slate-500 mt-2">Paid by <strong className="text-slate-700 dark:text-slate-300">{formData.paidBy}</strong> and split <strong className="text-slate-700 dark:text-slate-300">{formData.splitType}</strong></p>}
              </div>

              <div>
                <label className={labelCls}>Total Amount <span className="text-red-400">*</span></label>
                <input type="number" placeholder="Enter total amount" value={formData.totalAmount} onChange={(e) => { const v = e.target.value; if (formData.splitType === 'equally' && v) { calculateEqualSplit(formData.participants, v); } else { setFormData({ ...formData, totalAmount: v }); } }} step="0.01" min="0" required className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Description (Optional)</label>
                <input type="text" placeholder="e.g., Dinner at restaurant" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Date <span className="text-red-400">*</span></label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className={inputCls} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`${labelCls} mb-0`}>Participants <span className="text-red-400">*</span></label>
                  <button type="button" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover bg-transparent border-none cursor-pointer" onClick={addParticipant}><FiPlus size={14} /> Add Person</button>
                </div>
                <div className="space-y-2">
                  {formData.participants.map((participant, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input type="text" placeholder="Name" value={participant.name} onChange={(e) => updateParticipant(index, 'name', e.target.value)} required className={`${inputCls} flex-1`} />
                      <input type="number" placeholder="Amount" value={participant.amount} onChange={(e) => updateParticipant(index, 'amount', e.target.value)} step="0.01" min="0" required readOnly={formData.splitType === 'equally'} className={`${inputCls} w-28 ${formData.splitType === 'equally' ? 'bg-slate-50 dark:bg-slate-800' : ''}`} />
                      {formData.participants.length > 1 && <button type="button" className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-all border-none bg-transparent cursor-pointer shrink-0" onClick={() => removeParticipant(index)}><FiTrash2 size={15} /></button>}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <span className="text-xs font-medium text-slate-500">Total:</span>
                  <span className={`text-sm font-bold ${Math.abs(parseFloat(calculateParticipantTotal()) - parseFloat(formData.totalAmount || 0)) < 0.1 ? 'text-emerald-600' : 'text-red-500'}`}>{currencySymbol}{calculateParticipantTotal()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" className={btnSecondary} onClick={() => { setShowAddModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className={btnPrimary}>{editMode ? 'Update Split Bill' : 'Add Split Bill'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplitBills;

import React, { useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2, FiDollarSign, FiCalendar, FiUser, FiCheck } from 'react-icons/fi';
import { LanguageContext } from '../context/LanguageContext';
import { CurrencyContext } from '../context/CurrencyContext';

const inputCls = 'w-full py-2.5 px-3.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light placeholder:text-slate-400';
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-md transition-all cursor-pointer border-none';
const btnSecondary = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all cursor-pointer border-none';
const btnDanger = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold bg-red-500 text-white hover:bg-red-600 shadow-sm transition-all cursor-pointer border-none';

const MoneyBorrowed = () => {
  const [records, setRecords] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const { formatCurrency, currencySymbol, convertToBase, convertFromBase } = useContext(CurrencyContext);
  const { t } = useContext(LanguageContext);
  const [stats, setStats] = useState({
    totalBorrowed: 0,
    totalPaidBack: 0,
    totalPending: 0,
    activeDebts: 0
  });

  const [formData, setFormData] = useState({
    borrowedFrom: '',
    date: new Date().toISOString().split('T')[0],
    totalAmount: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    note: ''
  });

  // Fetch money borrowed records
  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/money-borrowed');
      setRecords(response.data);
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch records');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/money-borrowed/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Handle add
  const handleAdd = async (e) => {
    e.preventDefault();

    if (!formData.borrowedFrom || !formData.totalAmount) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.totalAmount <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    try {
      await axios.post('/api/money-borrowed', { ...formData, totalAmount: convertToBase(formData.totalAmount) });
      toast.success(`Borrowed from ${formData.borrowedFrom} recorded successfully!`);
      setShowAddModal(false);
      setFormData({
        borrowedFrom: '',
        date: new Date().toISOString().split('T')[0],
        totalAmount: ''
      });
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add record');
    }
  };

  // Handle payment
  const handlePayment = async (e) => {
    e.preventDefault();

    if (!paymentData.amount || paymentData.amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      await axios.put(`/api/money-borrowed/${selectedRecord._id}/payment`, { ...paymentData, amount: convertToBase(paymentData.amount) });
      toast.success('Payment recorded successfully!');
      setShowPaymentModal(false);
      setPaymentData({ amount: '', note: '' });
      setSelectedRecord(null);
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  // Handle delete
  const handleDelete = async (id, borrowedFrom) => {
    if (window.confirm(`Are you sure you want to delete the record for ${borrowedFrom}?`)) {
      try {
        await axios.delete(`/api/money-borrowed/${id}`);
        toast.success('Record deleted successfully');
        fetchRecords();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete record');
      }
    }
  };

  // Toggle select mode
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedRecords([]);
  };

  // Toggle record selection
  const toggleRecordSelection = (recordId) => {
    setSelectedRecords(prev => {
      if (prev.includes(recordId)) {
        return prev.filter(id => id !== recordId);
      } else {
        return [...prev, recordId];
      }
    });
  };

  // Delete multiple records
  const handleMultiDelete = async () => {
    if (selectedRecords.length === 0) {
      toast.error('Please select records to delete');
      return;
    }

    const confirmMessage = `Do you really want to delete ${selectedRecords.length} record${selectedRecords.length > 1 ? 's' : ''}?`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await Promise.all(
          selectedRecords.map(id => axios.delete(`/api/money-borrowed/${id}`))
        );
        toast.success(`${selectedRecords.length} record${selectedRecords.length > 1 ? 's' : ''} deleted successfully`);
        setSelectedRecords([]);
        setSelectMode(false);
        fetchRecords();
      } catch (error) {
        toast.error('Failed to delete some records');
      }
    }
  };

  // Open payment modal
  const openPaymentModal = (record) => {
    setSelectedRecord(record);
    setPaymentData({ amount: '', note: '' });
    setShowPaymentModal(true);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return <div className="container mt-10"><div className="spinner"></div></div>;
  }

  const statCards = [
    { label: 'Total Borrowed', value: formatCurrency(stats.totalBorrowed), icon: <FiDollarSign size={18} />, color: 'from-rose-500 to-pink-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
    { label: 'Total Paid Back', value: formatCurrency(stats.totalPaidBack), icon: <FiCheck size={18} />, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Total Pending', value: formatCurrency(stats.totalPending), icon: <FiCalendar size={18} />, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Active Debts', value: stats.activeDebts, icon: <FiUser size={18} />, color: 'from-violet-500 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  ];

  return (
    <div className="container mt-10 mb-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{t('borrowed_title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('borrowed_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {selectMode && selectedRecords.length > 0 && <button className={btnDanger} onClick={handleMultiDelete}><FiTrash2 /> Delete ({selectedRecords.length})</button>}
          {!selectMode && <button className={btnPrimary} onClick={() => setShowAddModal(true)}><FiPlus size={16} /> Add New</button>}
          {records.length > 0 && <button className={btnSecondary} onClick={toggleSelectMode}>{selectMode ? '✕ Cancel' : 'Select'}</button>}
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

      {/* Records */}
      <div className="flex flex-col gap-4">
        {records.length === 0 ? (
          <div className="card-elevated text-center py-16 animate-fade-in">
            <FiDollarSign size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Money Borrowed Records</h3>
            <p className="text-sm text-slate-500 mt-1">Click "Add New" to record money you've borrowed</p>
          </div>
        ) : (
          records.map((record) => {
            const pct = (record.amountPaid / record.totalAmount) * 100;
            return (
              <div
                key={record._id}
                className={`card-elevated p-5 animate-fade-up transition-all ${record.isFullyPaid ? 'opacity-75' : ''} ${selectMode && selectedRecords.includes(record._id) ? 'ring-2 ring-primary bg-primary-light' : 'hover:shadow-md'} ${selectMode ? 'cursor-pointer' : ''}`}
                onClick={selectMode ? () => toggleRecordSelection(record._id) : undefined}
              >
                {selectMode && <input type="checkbox" checked={selectedRecords.includes(record._id)} onChange={() => toggleRecordSelection(record._id)} onClick={(e) => e.stopPropagation()} className="w-4 h-4 accent-primary mb-3" />}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center text-white text-sm font-bold">{record.borrowedFrom.charAt(0).toUpperCase()}</div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{record.borrowedFrom}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><FiCalendar size={11} /> {formatDate(record.date)}</p>
                    </div>
                  </div>
                  {record.isFullyPaid && <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full">✓ Fully Paid</span>}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3"><span className="block text-[10px] font-medium text-slate-500 uppercase">Borrowed</span><span className="block text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{formatCurrency(record.totalAmount)}</span></div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3"><span className="block text-[10px] font-medium text-slate-500 uppercase">Paid Back</span><span className="block text-sm font-bold text-emerald-600 mt-0.5">{formatCurrency(record.amountPaid)}</span></div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3"><span className="block text-[10px] font-medium text-slate-500 uppercase">Remaining</span><span className="block text-sm font-bold text-amber-600 mt-0.5">{formatCurrency(record.amountRemaining)}</span></div>
                </div>

                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: pct >= 100 ? '#10b981' : 'linear-gradient(90deg, #f43f5e, #ec4899)' }} />
                </div>
                <p className="text-xs text-slate-500 font-medium">{pct.toFixed(1)}% paid back</p>

                {record.paymentHistory.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Payment History</h4>
                    <div className="space-y-1.5">
                      {record.paymentHistory.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between text-xs py-1">
                          <span className="text-slate-400">{formatDate(payment.date)}</span>
                          <span className="font-semibold text-emerald-600">{formatCurrency(payment.amount)}</span>
                          {payment.note && <span className="text-slate-400 italic truncate max-w-[120px]">{payment.note}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!selectMode && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                    {!record.isFullyPaid && <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all border-none cursor-pointer" onClick={() => openPaymentModal(record)}><FiCheck size={14} /> Record Payment</button>}
                    <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-900/15 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border-none cursor-pointer ml-auto" onClick={() => handleDelete(record._id, record.borrowedFrom)}><FiTrash2 size={14} /> Delete</button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add Money Borrowed</h2>
              <button className="text-2xl text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer leading-none" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAdd} className="p-6">
              <div className="mb-4">
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1.5"><FiUser size={14} /> Borrowed From (Name)</label>
                <input type="text" value={formData.borrowedFrom} onChange={(e) => setFormData({ ...formData, borrowedFrom: e.target.value })} placeholder="Enter person's name" required className={inputCls} />
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1.5"><FiCalendar size={14} /> Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className={inputCls} />
              </div>
              <div className="mb-4">
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1.5"><FiDollarSign size={14} /> Total Amount ({currencySymbol})</label>
                <input type="number" value={formData.totalAmount} onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })} placeholder="Enter amount" min="1" required className={inputCls} />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" className={btnSecondary} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className={btnPrimary}>Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Record Payment to {selectedRecord.borrowedFrom}</h2>
              <button className="text-2xl text-slate-400 hover:text-slate-600 bg-transparent border-none cursor-pointer leading-none" onClick={() => setShowPaymentModal(false)}>×</button>
            </div>
            <div className="px-6 pt-4 pb-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2.5"><p className="text-[10px] font-medium text-slate-500 uppercase">Total</p><p className="text-sm font-bold text-slate-900 dark:text-slate-100">{formatCurrency(selectedRecord.totalAmount)}</p></div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5"><p className="text-[10px] font-medium text-slate-500 uppercase">Paid</p><p className="text-sm font-bold text-emerald-600">{formatCurrency(selectedRecord.amountPaid)}</p></div>
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2.5"><p className="text-[10px] font-medium text-slate-500 uppercase">Left</p><p className="text-sm font-bold text-amber-600">{formatCurrency(selectedRecord.amountRemaining)}</p></div>
              </div>
            </div>
            <form onSubmit={handlePayment} className="p-6">
              <div className="mb-4">
                <label className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1.5"><FiDollarSign size={14} /> Amount Paying Back ({currencySymbol})</label>
                <input type="number" value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })} placeholder={`Max: ${formatCurrency(selectedRecord.amountRemaining)}`} min="1" max={Math.round(convertFromBase(selectedRecord.amountRemaining) * 100) / 100} required className={inputCls} />
              </div>
              <div className="mb-4">
                <label className="text-[13px] font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Note (Optional)</label>
                <input type="text" value={paymentData.note} onChange={(e) => setPaymentData({ ...paymentData, note: e.target.value })} placeholder="Add a note..." className={inputCls} />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button type="button" className={btnSecondary} onClick={() => setShowPaymentModal(false)}>Cancel</button>
                <button type="submit" className={btnPrimary}>Submit Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyBorrowed;

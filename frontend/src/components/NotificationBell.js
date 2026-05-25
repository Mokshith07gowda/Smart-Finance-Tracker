import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { FiBell, FiCheck, FiTrash2, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get('/api/notifications?limit=20');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) { /* silent — notifications are non-critical */ }
  }, []);

  useEffect(() => {
    // Only fetch existing notifications on mount — no generate call
    fetchNotifications();
    // Poll for new notifications every 60s (just fetch, backend generates on data changes)
    const interval = setInterval(fetchNotifications, 60 * 1000);
    // Listen for custom event dispatched after user actions (add/edit/delete expense/budget/salary)
    const onRefresh = () => fetchNotifications();
    window.addEventListener('notifications-updated', onRefresh);
    return () => { clearInterval(interval); window.removeEventListener('notifications-updated', onRefresh); };
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) { /* silent */ }
  };

  const deleteNotif = async (id) => {
    try {
      await axios.delete(`/api/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { /* silent */ }
  };

  const handleClick = async (n) => {
    if (!n.isRead) {
      try {
        await axios.put(`/api/notifications/${n._id}/read`);
        setNotifications(prev => prev.map(x => x._id === n._id ? { ...x, isRead: true } : x));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) { /* silent */ }
    }
    if (n.actionUrl) { setOpen(false); navigate(n.actionUrl); }
  };

  const priorityColor = { critical: 'border-l-red-500', high: 'border-l-amber-500', medium: 'border-l-primary', low: 'border-l-slate-300' };
  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all bg-transparent border-none cursor-pointer"
      >
        <FiBell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-[460px] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[2100] overflow-hidden animate-scale-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</h3>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[10px] font-semibold text-primary hover:underline bg-transparent border-none cursor-pointer flex items-center gap-0.5">
                  <FiCheck size={12} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 bg-transparent border-none cursor-pointer">
                <FiX size={14} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[380px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <FiBell size={28} className="mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  className={`flex items-start gap-2.5 px-4 py-3 cursor-pointer transition-all border-l-[3px] ${priorityColor[n.priority] || 'border-l-slate-200'} ${!n.isRead ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'}`}
                  onClick={() => handleClick(n)}
                >
                  <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-snug ${!n.isRead ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-300'}`}>{n.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotif(n._id); }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-300 hover:text-red-400 transition-all bg-transparent border-none cursor-pointer shrink-0"
                    style={{ opacity: 1 }}
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

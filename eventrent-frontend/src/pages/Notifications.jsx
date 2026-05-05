import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabase';

export default function Notifications() {
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;
  const isAgentMode = user?.role === 'agent';

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);

  // 🔥 STATE BARU BUAT FITUR HAPUS 🔥
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedNotifs, setSelectedNotifs] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('selected'); // 'selected' atau 'all'
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    const fetchNotifications = async () => {
      const token = localStorage.getItem('supabase_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setNotifications(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    const notifChannel = supabase
      .channel('custom-notification-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newNotif = payload.new;
          setNotifications(prevNotifs => [newNotif, ...prevNotifs]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
    };
  }, [userId]);

  const handleRespondNotif = async (notifId, action) => {
    const token = localStorage.getItem('supabase_token');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notifId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        const resRefresh = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me/notifications`, {
           headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resRefresh.ok) {
          const dataRefresh = await resRefresh.json();
          setNotifications(Array.isArray(dataRefresh) ? dataRefresh : []);
        }
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Network error occurred.');
    }
  };

  const markAsRead = async (notifId) => {
    const token = localStorage.getItem('supabase_token');
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notifId}/read`, { 
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.is_read && n.type !== 'INVITATION_AGENT');
    if (unreadNotifs.length === 0) return;
    
    const token = localStorage.getItem('supabase_token');
    const toastId = toast.loading('Marking all as read...');
    
    try {
      await Promise.all(unreadNotifs.map(n => 
        fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${n.id}/read`, { 
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` } 
        })
      ));
      toast.success('All marked as read', { id: toastId });
      setNotifications(prev => prev.map(n => n.type !== 'INVITATION_AGENT' ? { ...n, is_read: true } : n));
    } catch (err) {
      toast.error('Failed to update data', { id: toastId });
    }
  };

  // 🔥 LOGIC ROUTING PAS DIKLIK 🔥
  const handleNotifClick = async (notif) => {
    // Kalau lagi mode edit, klik = centang notif, JANGAN pindah halaman
    if (isEditMode) {
      toggleSelection(notif.id);
      return;
    }

    if (!notif.is_read && notif.type !== 'INVITATION_AGENT') {
      await markAsRead(notif.id);
    }

    if (notif.type === 'REPORT_ISSUE' && notif.related_event_id) {
      navigate(`/manage/event/${notif.related_event_id}?tab=reports`);
    } else if (notif.type === 'NEW_APPLICANT' && notif.related_event_id) {
      navigate(`/manage/event/${notif.related_event_id}?tab=recruitment`);
    } else if (notif.type === 'PAYOUT_SUCCESS') {
      navigate(`/agent/wallet`);
    }
  };

  // ==========================================
  // 🔥 FUNGSI-FUNGSI BARU BUAT HAPUS NOTIF 🔥
  // ==========================================
  const toggleSelection = (id) => {
    setSelectedNotifs(prev => prev.includes(id) ? prev.filter(nId => nId !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedNotifs.length === notifications.length) {
      setSelectedNotifs([]); // Kalo udah milih semua, di-unselect
    } else {
      setSelectedNotifs(notifications.map(n => n.id)); // Pilih semua
    }
  };

  const confirmDelete = (type) => {
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    const token = localStorage.getItem('supabase_token');
    
    try {
      if (deleteType === 'all') {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/all`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setNotifications([]);
          toast.success('All notifications cleared!');
        }
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ notifIds: selectedNotifs })
        });
        if (res.ok) {
          setNotifications(prev => prev.filter(n => !selectedNotifs.includes(n.id)));
          setSelectedNotifs([]);
          toast.success(`${selectedNotifs.length} notifications deleted!`);
        }
      }
    } catch (err) {
      toast.error('Failed to delete notifications.');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      // Kalau notifnya abis, keluar dari mode edit
      if (deleteType === 'all' || notifications.length - selectedNotifs.length === 0) {
        setIsEditMode(false);
      }
    }
  };

  // 🔥 LOGIC STYLE BISA BUBGLON (LIGHT/DARK) & WARNA PER KATEGORI 🔥
  const getNotifStyle = (type, isRead) => {
    const styles = {
      'REPORT_ISSUE': {
        borderColor: isAgentMode ? 'border-l-rose-500' : 'border-l-red-500',
        bgUnread: isAgentMode ? 'bg-rose-500/10' : 'bg-red-50/60',
        textColor: isAgentMode ? 'text-rose-400' : 'text-red-600',
        iconBg: isAgentMode ? 'bg-rose-500/20 text-rose-400' : 'bg-red-100 text-red-500',
        dotColor: isAgentMode ? 'bg-rose-500' : 'bg-red-500',
        iconSvg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      },
      'PAYOUT_SUCCESS': {
        borderColor: 'border-l-emerald-500',
        bgUnread: isAgentMode ? 'bg-emerald-500/10' : 'bg-emerald-50/60',
        textColor: isAgentMode ? 'text-emerald-400' : 'text-emerald-600',
        iconBg: isAgentMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-500',
        dotColor: 'bg-emerald-500',
        iconSvg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      },
      'INVITATION_AGENT': {
        borderColor: 'border-l-blue-500',
        bgUnread: isAgentMode ? 'bg-blue-500/10' : 'bg-blue-50/60',
        textColor: isAgentMode ? 'text-blue-400' : 'text-blue-600',
        iconBg: isAgentMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-500',
        dotColor: 'bg-blue-500',
        iconSvg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
      },
      'NEW_APPLICANT': {
        borderColor: 'border-l-purple-500',
        bgUnread: isAgentMode ? 'bg-purple-500/10' : 'bg-purple-50/60',
        textColor: isAgentMode ? 'text-purple-400' : 'text-purple-600',
        iconBg: isAgentMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-500',
        dotColor: 'bg-purple-500',
        iconSvg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
      },
      'DEFAULT': {
        borderColor: isAgentMode ? 'border-l-orange-500' : 'border-l-[#FF6B35]',
        bgUnread: isAgentMode ? 'bg-orange-500/10' : 'bg-orange-50/40',
        textColor: isAgentMode ? 'text-orange-400' : 'text-[#FF6B35]',
        iconBg: isAgentMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-100 text-[#FF6B35]',
        dotColor: isAgentMode ? 'bg-orange-500' : 'bg-[#FF6B35]',
        iconSvg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      }
    };

    const style = styles[type] || styles['DEFAULT'];

    if (!isRead) {
      return {
        wrapperClass: `${style.bgUnread} border-l-4 ${style.borderColor}`,
        titleClass: style.textColor,
        descClass: isAgentMode ? 'text-slate-300 font-medium' : 'text-gray-700 font-medium',
        dateClass: isAgentMode ? 'text-slate-500' : 'text-gray-400',
        dotClass: style.dotColor,
        iconClass: style.iconBg,
        iconSvg: style.iconSvg
      };
    } else {
      return {
        wrapperClass: isAgentMode ? `bg-slate-800/30 border-l-4 border-l-transparent hover:bg-slate-800/80` : `bg-white border-l-4 border-l-transparent hover:bg-gray-50`,
        titleClass: isAgentMode ? `text-slate-300` : `text-gray-900`,
        descClass: isAgentMode ? 'text-slate-400' : 'text-gray-500',
        dateClass: isAgentMode ? 'text-slate-600' : 'text-gray-400',
        dotClass: `hidden`,
        iconClass: isAgentMode ? `bg-slate-700/50 text-slate-500` : `bg-gray-100 text-gray-400`,
        iconSvg: style.iconSvg
      };
    }
  };

  const isShowingAll = visibleCount >= notifications.length && notifications.length > 5;

  return (
    <div className={`${isAgentMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'} min-h-screen font-sans pb-20 pt-8 md:pt-12 text-left relative overflow-hidden transition-colors duration-300`}>

      {/* POP-UP CONFIRMATION DELETE */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`${isAgentMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'} rounded-[24px] p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center transform transition-all`}>
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 border border-red-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            
            <h3 className={`text-xl font-black mb-2 uppercase tracking-tight italic ${isAgentMode ? 'text-white' : 'text-gray-900'}`}>Delete Notifications?</h3>
            <p className={`text-xs mb-8 font-medium ${isAgentMode ? 'text-slate-400' : 'text-gray-500'}`}>
              {deleteType === 'all' 
                ? 'Are you sure you want to delete ALL notifications? This action cannot be undone.' 
                : `Are you sure you want to delete the ${selectedNotifs.length} selected notifications?`}
            </p>
            
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className={`flex-1 py-3.5 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-colors ${isAgentMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                Cancel
              </button>
              <button onClick={executeDelete} disabled={isDeleting} className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-red-600 shadow-md shadow-red-500/20 transition-all flex justify-center items-center gap-2">
                {isDeleting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 md:px-8 relative z-10">
        
        {/* Header Area */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center shrink-0 rounded-full border transition-all shadow-sm active:scale-95 ${isAgentMode ? 'bg-[#0f172a] border-slate-700 text-slate-400 hover:text-blue-500 hover:border-blue-500' : 'bg-white border-gray-200 text-gray-500 hover:text-[#FF6B35] hover:border-[#FF6B35]'}`}
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg> 
            </button>
            <h1 className={`text-2xl md:text-3xl font-black ${isAgentMode ? 'text-white' : 'text-gray-900'} uppercase tracking-tight`}>
              Notification Center
            </h1>
          </div>
          
          {/* Action Bar */}
          {notifications.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {isEditMode ? (
                <>
                  <button onClick={() => { setIsEditMode(false); setSelectedNotifs([]); }} className={`text-[10px] md:text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm ${isAgentMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    Cancel
                  </button>
                  <button onClick={handleSelectAll} className={`text-[10px] md:text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm ${isAgentMode ? 'bg-slate-800 text-blue-400 hover:bg-slate-700 border border-slate-700' : 'bg-white border border-gray-200 text-blue-600 hover:bg-blue-50'}`}>
                    {selectedNotifs.length === notifications.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button onClick={() => confirmDelete('selected')} disabled={selectedNotifs.length === 0} className={`text-[10px] md:text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${isAgentMode ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'}`}>
                    Delete ({selectedNotifs.length})
                  </button>
                  <button onClick={() => confirmDelete('all')} className={`text-[10px] md:text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm ml-auto ${isAgentMode ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-red-500 text-white hover:bg-red-600'}`}>
                    Delete All
                  </button>
                </>
              ) : (
                <>
                  {notifications.some(n => !n.is_read) && (
                    <button type="button" onClick={markAllAsRead} className={`text-[10px] md:text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm ${isAgentMode ? 'text-orange-400 hover:text-orange-300 bg-orange-500/10 border border-orange-500/20' : 'text-[#FF6B35] hover:text-orange-600 bg-orange-50'}`}>
                      Mark all as read
                    </button>
                  )}
                  <button onClick={() => setIsEditMode(true)} className={`text-[10px] md:text-xs font-bold px-4 py-2.5 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 ${isAgentMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Edit / Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* List Notifikasi Container */}
        <div className={`${isAgentMode ? 'bg-slate-800/50 border-slate-700/50 backdrop-blur-sm' : 'bg-white border-gray-200'} rounded-[24px] md:rounded-[32px] shadow-sm border overflow-hidden relative transition-colors duration-300`}>
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className={`w-8 h-8 border-4 ${isAgentMode ? 'border-slate-700 border-t-orange-500' : 'border-gray-200 border-t-[#FF6B35]'} rounded-full animate-spin`}></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-20 text-center">
              <svg className={`w-16 h-16 mx-auto mb-4 ${isAgentMode ? 'text-slate-600' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              <h3 className={`text-lg font-bold ${isAgentMode ? 'text-slate-300' : 'text-gray-900'}`}>No notifications yet</h3>
              <p className={`text-xs mt-1 font-medium ${isAgentMode ? 'text-slate-500' : 'text-gray-500'}`}>If there's any info or invitations, they will appear here.</p>
            </div>
          ) : (
            <div className="flex flex-col relative">
              <div className={`divide-y ${isAgentMode ? 'divide-slate-700/50' : 'divide-gray-100'}`}>
                
                {/* RENDER SEMUA NOTIFIKASI */}
                {notifications.map((notif, index) => {
                  const style = getNotifStyle(notif.type, notif.is_read);
                  const isSelected = selectedNotifs.includes(notif.id);

                  return (
                    <React.Fragment key={notif.id}>
                      <div 
                        className={`p-5 md:p-7 transition-all flex gap-3 md:gap-5 cursor-pointer ${style.wrapperClass} ${isSelected ? (isAgentMode ? '!bg-rose-500/10' : '!bg-red-50/50') : ''} ${index >= 5 && !isShowingAll ? 'hidden' : ''}`}
                        onClick={() => handleNotifClick(notif)}
                      >
                        {/* CHECKBOX BILA MODE EDIT AKTIF */}
                        {isEditMode && (
                          <div className="flex items-center pt-2 md:pt-3">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? (isAgentMode ? 'bg-rose-500 border-rose-500' : 'bg-red-500 border-red-500') : (isAgentMode ? 'border-slate-500 bg-slate-800' : 'border-gray-300 bg-white')}`}>
                              {isSelected && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                            </div>
                          </div>
                        )}

                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${style.iconClass}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">{style.iconSvg}</svg>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm md:text-base font-bold ${style.titleClass}`}>
                              {notif.title}
                            </h4>
                            {!notif.is_read && <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 shadow-sm ${style.dotClass}`}></span>}
                          </div>
                          <p className={`text-xs md:text-sm leading-relaxed mb-3 ${style.descClass}`}>
                            {notif.message}
                          </p>
                          <p className={`text-[10px] font-bold uppercase tracking-wider ${style.dateClass}`}>
                            {new Date(notif.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>

                          {/* Tombol Terima/Tolak disembunyikan kalau lagi mode edit biar ngga salah pencet */}
                          {notif.type === 'INVITATION_AGENT' && !notif.is_read && !isEditMode && (
                            <div className="flex gap-3 mt-4">
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); handleRespondNotif(notif.id, 'reject'); }} 
                                className={`px-5 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors ${isAgentMode ? 'bg-slate-700 text-rose-400 hover:bg-slate-600' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                              >
                                Decline
                              </button>
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); handleRespondNotif(notif.id, 'accept'); }} 
                                className={`px-5 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-md transition-colors ${isAgentMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-[#FF6B35] text-white hover:bg-orange-600'}`}
                              >
                                Accept Invitation
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* TOMBOL MUNCUL SETELAH NOTIF KE-5 */}
                      {index === 4 && notifications.length > 5 && !isEditMode && (
                        <div className={`p-5 border-y flex justify-center z-20 ${isAgentMode ? 'bg-slate-800/80 border-slate-700' : 'bg-gray-50/50 border-gray-100'}`}>
                          {isShowingAll ? (
                            <button 
                              type="button"
                              onClick={() => {
                                setVisibleCount(5);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className={`w-full md:w-auto px-8 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm border ${isAgentMode ? 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                            >
                              ↑ Show Less
                            </button>
                          ) : (
                            <button 
                              type="button"
                              onClick={() => setVisibleCount(notifications.length)} 
                              className={`w-full md:w-auto px-8 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm border-2 border-dashed ${isAgentMode ? 'bg-slate-800 border-slate-600 text-orange-400 hover:bg-slate-700' : 'bg-white border-orange-200 text-[#FF6B35] hover:bg-orange-50'}`}
                            >
                              View All Notifications ↓
                            </button>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
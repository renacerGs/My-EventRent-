import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../supabase';

export default function Notifications() {
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 🔥 STATE LIMIT: Default cuma nampilin 5
  const [visibleCount, setVisibleCount] = useState(5);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    // 🔥 PERUBAHAN KE-1: Ambil notifikasi pakai TOKEN dan HAPUS userId dari URL
    const fetchNotifications = async () => {
      const token = localStorage.getItem('supabase_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Panggil endpoint ME yang udah kita set di backend
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setNotifications(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);
        toast.error('Gagal memuat notifikasi.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    const notifChannel = supabase
      .channel('custom-notification-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT', 
          schema: 'public',
          table: 'notifications',
          // Karena JWT udah handle Auth, filter di sini sebenernya aman buat Realtime
          filter: `user_id=eq.${userId}` 
        },
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

  // 🔥 PERUBAHAN KE-2: Respond Notif pakai TOKEN
  const handleRespondNotif = async (notifId, action) => {
    const token = localStorage.getItem('supabase_token');
    try {
      // Hapus ?userId= dan tambahin Header
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notifId}/respond`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        
        // Refresh notifikasi setelah respond (Pake endpoint ME juga)
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
      toast.error('Kesalahan jaringan bro.');
    }
  };

  // 🔥 PERUBAHAN KE-3: Read Notif pakai TOKEN
  const markAsRead = async (notifId) => {
    const token = localStorage.getItem('supabase_token');
    try {
      // Hapus ?userId= dan tambahin Header
      await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${notifId}/read`, { 
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  // 🔥 PERUBAHAN KE-4: Read ALL Notif pakai TOKEN
  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.is_read && n.type !== 'INVITATION_AGENT');
    if (unreadNotifs.length === 0) return;
    
    const token = localStorage.getItem('supabase_token');
    const toastId = toast.loading('Menandai semua dibaca...');
    
    try {
      await Promise.all(unreadNotifs.map(n => 
        fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${n.id}/read`, { 
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` } 
        })
      ));
      toast.success('Semua telah dibaca', { id: toastId });
      setNotifications(prev => prev.map(n => n.type !== 'INVITATION_AGENT' ? { ...n, is_read: true } : n));
    } catch (err) {
      toast.error('Gagal memperbarui data', { id: toastId });
    }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.is_read && notif.type !== 'INVITATION_AGENT') {
      await markAsRead(notif.id);
    }

    if (notif.type === 'REPORT_ISSUE' && notif.related_event_id) {
      navigate(`/manage/event/${notif.related_event_id}?tab=reports`);
    } 
    else if (notif.type === 'NEW_APPLICANT' && notif.related_event_id) {
      navigate(`/manage/event/${notif.related_event_id}?tab=recruitment`);
    }
    else if (notif.type === 'PAYOUT_SUCCESS') {
      navigate(`/agent/wallet`);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'INVITATION_AGENT':
        return <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg></div>;
      case 'REPORT_ISSUE':
        return <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>;
      case 'PAYOUT_SUCCESS':
        return <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>;
      default:
        return <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>;
    }
  };

  const isShowingAll = visibleCount >= notifications.length && notifications.length > 5;
  const displayedNotifications = notifications.slice(0, visibleCount);

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans pb-20 pt-8 md:pt-12 text-left relative overflow-hidden">
      <div className="max-w-3xl mx-auto px-4 md:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button type="button" onClick={() => navigate(-1)} className="text-gray-400 hover:text-[#FF6B35] font-bold text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1.5 transition-colors w-max">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg> 
              Kembali
            </button>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">Pusat Notifikasi</h1>
          </div>
          {notifications.length > 0 && notifications.some(n => !n.is_read) && (
            <button type="button" onClick={markAllAsRead} className="text-[10px] md:text-xs font-bold text-[#FF6B35] hover:text-orange-600 bg-orange-50 px-4 py-2.5 rounded-lg transition-colors w-max shadow-sm">
              Tandai semua dibaca
            </button>
          )}
        </div>

        {/* List Notifikasi */}
        <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-200 overflow-hidden relative">
          {loading ? (
            <div className="py-20 flex justify-center">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-20 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              <h3 className="text-lg font-bold text-gray-900">Belum ada notifikasi</h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">Nanti kalau ada info atau undangan, munculnya di sini bro.</p>
            </div>
          ) : (
            <div className="flex flex-col relative">
              <div className="divide-y divide-gray-100">
                {/* 🔥 RENDER SEMUA NOTIFIKASI 🔥 */}
                {/* Tapi kita kasih pembatas tombol di urutan ke-5 */}
                {notifications.map((notif, index) => (
                  <React.Fragment key={notif.id}>
                    
                    {/* Render Item Notif */}
                    <div 
                      className={`p-5 md:p-7 transition-all flex gap-5 cursor-pointer ${
                        !notif.is_read 
                          ? 'bg-orange-50/40 border-l-4 border-l-[#FF6B35]' 
                          : 'bg-white border-l-4 border-l-transparent hover:bg-gray-50'
                      } ${index >= 5 && !isShowingAll ? 'hidden' : ''}`}
                      onClick={() => handleNotifClick(notif)}
                    >
                      {getIcon(notif.type)}
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm md:text-base font-bold ${!notif.is_read ? 'text-[#FF6B35]' : 'text-gray-900'}`}>
                            {notif.title}
                          </h4>
                          {!notif.is_read && <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] mt-1.5 shrink-0 shadow-sm"></span>}
                        </div>
                        <p className={`text-xs md:text-sm leading-relaxed mb-3 ${!notif.is_read ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          {new Date(notif.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>

                        {notif.type === 'INVITATION_AGENT' && !notif.is_read && (
                          <div className="flex gap-3 mt-4">
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleRespondNotif(notif.id, 'reject'); }} className="px-5 py-2.5 bg-red-50 text-red-500 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-colors">Tolak</button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleRespondNotif(notif.id, 'accept'); }} className="px-5 py-2.5 bg-[#FF6B35] text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-orange-600 shadow-md transition-colors">Terima Undangan</button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 🔥 INI DIA SATPAMNYA: Tombol muncul tepat setelah Notif ke-5 (Index 4) 🔥 */}
                    {index === 4 && notifications.length > 5 && (
                      <div className="p-5 bg-gray-50/50 border-y border-gray-100 flex justify-center z-20">
                        {isShowingAll ? (
                          <button 
                            type="button"
                            onClick={() => {
                              setVisibleCount(5);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="w-full md:w-auto px-8 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-gray-100 hover:text-gray-700 transition-all active:scale-95 shadow-sm"
                          >
                            ↑ Lihat Lebih Sedikit
                          </button>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => setVisibleCount(notifications.length)} 
                            className="w-full md:w-auto px-8 py-3 bg-white border-2 border-dashed border-orange-200 text-[#FF6B35] rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-orange-50 transition-all active:scale-95 shadow-sm"
                          >
                            Lihat Semua Notifikasi ↓
                          </button>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
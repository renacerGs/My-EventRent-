import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Notifications() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 👇 STATE BARU BUAT BATASIN JUMLAH NOTIF 👇
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchNotifications();
  }, [user, navigate]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`https://my-event-rent.vercel.app/api/users/${user.id}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat notifikasi.');
    } finally {
      setLoading(false);
    }
  };

  const handleRespondNotif = async (notifId, action) => {
    try {
      const res = await fetch(`https://my-event-rent.vercel.app/api/notifications/${notifId}/respond?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchNotifications(); // Refresh data
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Kesalahan jaringan bro.');
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await fetch(`https://my-event-rent.vercel.app/api/notifications/${notifId}/read?userId=${user.id}`, { method: 'PATCH' });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifs = notifications.filter(n => !n.is_read && n.type !== 'INVITATION_AGENT');
    if (unreadNotifs.length === 0) return;
    
    toast.loading('Menandai dibaca...', { id: 'readAll' });
    try {
      await Promise.all(unreadNotifs.map(n => 
        fetch(`https://my-event-rent.vercel.app/api/notifications/${n.id}/read?userId=${user.id}`, { method: 'PATCH' })
      ));
      toast.success('Semua notifikasi telah dibaca', { id: 'readAll' });
      fetchNotifications();
    } catch (err) {
      toast.error('Gagal menandai dibaca', { id: 'readAll' });
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'INVITATION_AGENT':
        return <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg></div>;
      case 'REPORT_ISSUE':
        return <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div>;
      default:
        return <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>;
    }
  };

  // 👇 LOGIKA PEMOTONGAN JUMLAH NOTIFIKASI 👇
  const displayedNotifications = showAll ? notifications : notifications.slice(0, 10);
  const hasMoreNotifs = notifications.length > 10;

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans pb-20 pt-8 md:pt-12 text-left relative">
      <div className="max-w-3xl mx-auto px-4 md:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-[#FF6B35] font-bold text-[10px] uppercase tracking-widest mb-3 flex items-center gap-1.5 transition-colors w-max">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg> 
              Kembali
            </button>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tight">Pusat Notifikasi</h1>
          </div>
          {notifications.some(n => !n.is_read) && (
            <button onClick={markAllAsRead} className="text-[10px] md:text-xs font-bold text-[#FF6B35] hover:text-orange-600 bg-orange-50 px-4 py-2.5 rounded-lg transition-colors w-max">
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
              <p className="text-xs text-gray-500 mt-1">Nanti kalau ada info atau undangan, munculnya di sini bro.</p>
            </div>
          ) : (
            <div className="flex flex-col relative">
              
              {/* 👇 TOMBOL PINDAH KE ATAS + DIBIKIN STICKY BIAR NEMPEL 👇 */}
              {hasMoreNotifs && (
                <div className="p-3 md:p-4 bg-gray-50/90 border-b border-gray-100 flex justify-end sticky top-0 z-20 backdrop-blur-md">
                  <button 
                    onClick={() => setShowAll(!showAll)}
                    className="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-widest hover:text-[#FF6B35] hover:border-[#FF6B35] transition-all shadow-sm active:scale-95"
                  >
                    {showAll ? 'Tutup Notifikasi Lama' : `Lihat Lebih Banyak (${notifications.length - 10} Notif Lama)`}
                  </button>
                </div>
              )}

              <div className="divide-y divide-gray-100">
                {displayedNotifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`p-5 md:p-6 transition-colors flex gap-4 cursor-pointer ${!notif.is_read ? 'bg-orange-50/20' : 'bg-white hover:bg-gray-50'}`}
                    onClick={() => !notif.is_read && notif.type !== 'INVITATION_AGENT' && markAsRead(notif.id)}
                  >
                    {getIcon(notif.type)}
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm md:text-base font-bold ${!notif.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notif.title}
                        </h4>
                        {!notif.is_read && <span className="w-2 h-2 rounded-full bg-[#FF6B35] mt-1.5 shrink-0"></span>}
                      </div>
                      <p className="text-xs md:text-sm text-gray-500 leading-relaxed mb-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {new Date(notif.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>

                      {/* Tombol Khusus Undangan Agen */}
                      {notif.type === 'INVITATION_AGENT' && !notif.is_read && (
                        <div className="flex gap-3 mt-4">
                          <button onClick={(e) => { e.stopPropagation(); handleRespondNotif(notif.id, 'reject'); }} className="px-5 py-2.5 bg-red-50 text-red-500 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-colors">Tolak</button>
                          <button onClick={(e) => { e.stopPropagation(); handleRespondNotif(notif.id, 'accept'); }} className="px-5 py-2.5 bg-[#FF6B35] text-white rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-orange-600 shadow-md transition-colors">Terima Undangan</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
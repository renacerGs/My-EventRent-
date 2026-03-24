import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- FUNGSI FORMAT TANGGAL CANTIK ---
const formatPrettyDate = (dateString) => {
  if (!dateString) return '';
  try {
    let rawDate = dateString;
    if (dateString.includes(' - ')) rawDate = dateString.split(' - ')[0].trim();
    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) return dateString;
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    return new Intl.DateTimeFormat('en-US', options).format(dateObj);
  } catch (error) {
    return dateString;
  }
};

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  // --- STATE POP-UP MODERN PENGGANTI ALERT ---
  const [popup, setPopup] = useState({ isOpen: false, message: '', type: 'info' });

  const showPopup = (message, type = 'info') => {
    setPopup({ isOpen: true, message, type });
  };

  const closePopup = () => {
    setPopup({ isOpen: false, message: '', type: 'info' });
  };

  useEffect(() => {
    const fetchEventDetail = async () => {
      try {
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) throw new Error('Gagal mengambil data event');
        const data = await response.json();
        setEvent(data);
        
        fetch(`/api/events/${id}/view`, { method: 'POST' }).catch(() => {});
        
        const savedLikes = JSON.parse(localStorage.getItem('likedEvents')) || [];
        setIsLiked(savedLikes.some(item => String(item.id) === String(id)));
      } catch (error) {
        console.error(error);
        showPopup("Event tidak ditemukan!", "error");
        setTimeout(() => navigate('/'), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  const handleLikeClick = async () => {
    if (!user) return showPopup("Login dulu bro buat nyimpen event ke Wishlist!", "error");
    try {
      const res = await fetch('/api/likes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, eventId: event.id })
      });
      if (res.ok) {
        setIsLiked(!isLiked);
      }
    } catch (error) { console.error(error); }
  };

  const handleGoToCheckout = (sessionId = null) => {
    const url = sessionId 
      ? `/checkout/${event.id}?session=${sessionId}` 
      : `/checkout/${event.id}`;
      
    navigate(url);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400 tracking-widest uppercase">Memuat Event...</div>;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans relative">
      
      {/* --- UI POP UP MODERN ANIMATED --- */}
      <AnimatePresence>
        {popup.isOpen && (
          <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`w-full max-w-sm rounded-[32px] p-8 text-center shadow-2xl relative overflow-hidden ${popup.type === 'error' ? 'bg-[#E24A29]' : popup.type === 'success' ? 'bg-[#27AE60]' : 'bg-gray-800'}`}
            >
              <div className={`w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${popup.type === 'error' ? 'text-[#E24A29]' : popup.type === 'success' ? 'text-[#27AE60]' : 'text-gray-800'}`}>
                {popup.type === 'error' ? (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : popup.type === 'success' ? (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">
                {popup.type === 'error' ? 'Ups!' : popup.type === 'success' ? 'Berhasil!' : 'Info'}
              </h2>
              <p className="text-white/90 font-medium mb-8">{popup.message}</p>
              <button 
                onClick={closePopup} 
                className={`w-full bg-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95 ${popup.type === 'error' ? 'text-[#E24A29] hover:bg-red-50' : popup.type === 'success' ? 'text-[#27AE60] hover:bg-green-50' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER BANNER */}
      <div className="relative w-full h-[280px] md:h-[500px] bg-gray-900">
        <img src={event.img} className="w-full h-full object-cover opacity-50" alt="Banner" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 md:top-8 md:left-8 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-gray-900 transition-all z-20">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10 -mt-20 md:-mt-32">
        
        {/* CARD UTAMA */}
        <div className="bg-white rounded-[28px] md:rounded-[40px] shadow-2xl p-6 md:p-12 flex flex-col lg:flex-row gap-8 md:gap-12 mb-8 md:mb-12 relative">
          
          {/* KIRI: INFO EVENT */}
          <div className="flex-1 text-left relative">
            <span className="inline-block bg-orange-50 text-[#FF6B35] border border-orange-100 px-4 py-1.5 md:px-5 md:py-2 rounded-xl text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6">
              {event.category}
            </span>
            
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-3 md:mb-4 leading-tight tracking-tight pr-12 md:pr-0">{event.title}</h1>
            
            <div className="inline-flex items-center text-xs md:text-sm font-bold text-gray-900 mb-6 md:mb-8 bg-gray-50 px-3 py-2 md:px-4 md:py-2 rounded-xl border border-gray-100">
              <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {formatPrettyDate(event.date_start)} {event.date_end ? `- ${formatPrettyDate(event.date_end)}` : ''}
            </div>

            <div className="space-y-6 md:space-y-8 mb-8 md:mb-10">
              <div>
                <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Location</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed bg-gray-50 p-4 md:p-5 rounded-2xl border border-gray-100">
                  <span className="font-bold text-gray-900 block mb-1 text-[15px] md:text-base">{event.name_place}</span>
                  {event.place}, {event.city}, {event.province}
                  
                  {event.map_url && (
                    <a href={event.map_url} target="_blank" rel="noreferrer" className="text-[11px] md:text-xs text-[#FF6B35] font-bold hover:text-orange-700 flex items-center mt-3 transition-colors">
                      Lihat di Google Maps 
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                    </a>
                  )}
                </p>
              </div>
              
              <div>
                <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Contact Information</h3>
                <p className="text-sm text-gray-900 font-bold flex items-center bg-gray-50 p-3 md:p-4 rounded-2xl border border-gray-100 w-full md:w-max">
                  <svg className="w-5 h-5 mr-3 text-[#FF6B35] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {event.contact || '-'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">About This Event</h3>
              <p className="text-[13px] md:text-sm text-gray-600 leading-relaxed text-justify whitespace-pre-line bg-gray-50 p-5 md:p-6 rounded-[20px] md:rounded-[24px] border border-gray-100">
                {event.description || "No description provided for this event."}
              </p>
            </div>
          </div>

          {/* KANAN: CARD TICKET & LIKE */}
          <div className="w-full lg:w-[320px] flex flex-col md:items-end gap-4 md:gap-6 text-left shrink-0">
            
            <button onClick={handleLikeClick} className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full border-2 transition-all active:scale-95 shadow-sm absolute top-4 right-4 md:relative md:top-0 md:right-0 z-20 ${isLiked ? 'border-red-500 bg-red-50 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:border-[#FF6B35] hover:text-[#FF6B35]'}`} title="Simpan ke Wishlist">
              <svg className={`w-4 h-4 md:w-6 md:h-6 ${isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>

            <div className="w-full bg-[#FFF5F0] rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-sm border border-orange-100 text-center flex flex-col items-center justify-center relative overflow-hidden mt-2 md:mt-0">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#FF6B35]"></div>
              <h3 className="text-xs md:text-sm font-black text-[#FF6B35] mb-4 md:mb-6 uppercase tracking-widest">Dapatkan Tiketmu</h3>
              
              <button 
                onClick={() => handleGoToCheckout('all')} 
                className="w-full py-3.5 md:py-4 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] md:text-xs shadow-xl hover:bg-black transition-all active:scale-95"
              >
                Beli Semua Sesi
              </button>
            </div>
          </div>

        </div>

        {/* CARD SESSION HORIZONTAL SCROLL DI HP */}
        <div className="bg-white rounded-[28px] md:rounded-[40px] shadow-sm border border-gray-100 p-6 md:p-12 mb-10 overflow-hidden">
          
          {/* 👇👇 JURUS UX AFFORDANCE DI SINI 👇👇 */}
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight">Session</h2>
            
            {/* Tulisan "Geser Tiket" yang goyang-goyang, CUMA MUNCUL DI HP (md:hidden) */}
            <div className="md:hidden flex items-center gap-1.5 text-[10px] font-black text-[#FF6B35] uppercase tracking-widest animate-pulse">
              <span>Geser Session</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
              </svg>
            </div>
          </div>
          {/* 👆👆 BATAS JURUS UX 👆👆 */}

          <div className="flex flex-nowrap md:grid md:grid-cols-1 gap-4 md:gap-6 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden max-h-none md:max-h-[800px] pb-6 md:pb-0 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:custom-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
            {event.sessions && event.sessions.length > 0 ? (
              event.sessions.map((session, index) => {
                const isSoldOut = session.stock < 1;
                
                return (
                  <div key={session.id} className={`shrink-0 snap-center w-[85vw] md:w-auto border-2 rounded-[20px] md:rounded-[24px] p-5 md:p-8 relative flex flex-col md:flex-row justify-between items-start md:items-center gap-5 md:gap-6 transition-colors ${isSoldOut ? 'border-gray-200 bg-gray-50 opacity-70' : 'border-gray-100 bg-white hover:border-[#FF6B35]'}`}>
                    
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-2 md:gap-3 mb-3">
                         <span className="bg-gray-900 text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                           Session {index + 1}
                         </span>
                         {isSoldOut && <span className="bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">Sold Out</span>}
                      </div>
                      
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 uppercase mb-3 md:mb-4">{session.name}</h3>
                      
                      <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
                        <div className="flex items-center text-[11px] md:text-xs font-bold text-gray-600">
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span className="truncate">{session.start_time.slice(0,5)} - {session.end_time.slice(0,5)} WIB</span>
                        </div>
                        <div className="flex items-center text-[11px] md:text-xs font-bold text-gray-600">
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="truncate">{formatPrettyDate(session.date)}</span>
                        </div>
                      </div>

                      <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed max-w-xl line-clamp-3 md:line-clamp-none">{session.description || "No specific details for this session."}</p>
                    </div>

                    <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-8 mt-2 md:mt-0 shrink-0">
                      <div className="text-left md:text-right">
                        <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">Harga Tiket</p>
                        <p className="font-black text-xl md:text-3xl text-gray-900 mb-0 md:mb-4">
                          {Number(session.price) === 0 ? <span className="text-[#27AE60]">FREE</span> : `Rp ${parseInt(session.price).toLocaleString('id-ID')}`}
                        </p>
                      </div>
                      
                      <button 
                        onClick={() => handleGoToCheckout(session.id)} 
                        disabled={isSoldOut}
                        className={`w-auto md:w-full px-5 py-2.5 md:px-8 md:py-3 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all ${isSoldOut ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#FF6B35] text-white hover:bg-[#E85526] shadow-md shadow-orange-100 active:scale-95'}`}
                      >
                        {isSoldOut ? 'Habis' : 'Pilih Tiket'}
                      </button>
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-[24px] border border-dashed border-gray-200">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Tiket belum tersedia.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
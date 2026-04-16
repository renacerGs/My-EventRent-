import React, { useState, useEffect, useRef } from 'react';
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
  
  const scrollContainerRef = useRef(null);
  const [popup, setPopup] = useState({ isOpen: false, message: '', type: 'info' });
  
  // 👇 STATE BARU BUAT MODAL SHARE 👇
  const [showShareModal, setShowShareModal] = useState(false);

  // 👇 CEK APAKAH INI WEDDING / PRIVATE 👇
  const isWed = event?.is_private || event?.isPrivate;

  const showPopup = (message, type = 'info') => {
    setPopup({ isOpen: true, message, type });
  };

  const closePopup = () => {
    setPopup({ isOpen: false, message: '', type: 'info' });
  };

  useEffect(() => {
    const fetchEventDetail = async () => {
      try {
        // ✅ URL VERCEL
        const response = await fetch(`https://my-event-rent.vercel.app/api/events/${id}`);
        if (!response.ok) throw new Error('Gagal mengambil data event');
        const data = await response.json();
        setEvent(data);
        
        // ✅ URL VERCEL
        fetch(`https://my-event-rent.vercel.app/api/events/${id}/view`, { method: 'POST' }).catch(() => {});
        
        // 👇👇 FIX LIKES (SABUK PENGAMAN KETAT) 👇👇
        const parsedLikes = JSON.parse(localStorage.getItem('likedEvents'));
        const savedLikes = Array.isArray(parsedLikes) ? parsedLikes : [];
        setIsLiked(savedLikes.some(item => String(item.id) === String(id)));
      } catch (error) {
        console.error(error);
        showPopup("Acara tidak ditemukan!", "error");
        setTimeout(() => navigate('/'), 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  const handleLikeClick = async () => {
    if (!user) return showPopup("Login dulu bro buat nyimpen ke Wishlist!", "error");
    try {
      // ✅ URL VERCEL
      const res = await fetch('https://my-event-rent.vercel.app/api/likes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, eventId: event.id })
      });
      if (res.ok) setIsLiked(!isLiked);
    } catch (error) { console.error(error); }
  };

  // 👇 FUNGSI BARU: SHARE KE PLATFORM TERTENTU 👇
  const shareToPlatform = async (platform) => {
    const url = window.location.href;
    const text = isWed ? `Undangan Spesial: ${event.title}. Mohon konfirmasi kehadiran Anda.` : `Yuk ikut event ${event.title}!`;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({ title: event.title, text: text, url: url });
          } catch (err) { console.error('Error sharing:', err); }
        }
        break;
      case 'copy':
      default:
        try {
          await navigator.clipboard.writeText(url);
          showPopup("Link berhasil dicopy! Silakan paste di grup/chat.", "success");
        } catch (err) {
          console.error("Gagal nyalin link:", err);
        }
        break;
    }
    setShowShareModal(false); 
  };

  const handleGoToCheckout = (sessionId = null) => {
    const url = sessionId ? `/checkout/${event.id}?session=${sessionId}` : `/checkout/${event.id}`;
    navigate(url);
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400 tracking-widest uppercase">Memuat Acara...</div>;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans relative">
      
      {/* POPUP INFO (BAWAAN LU) */}
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

      {/* 👇 MODAL BAGIKAN EVENT (NEW) 👇 */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-[150] flex flex-col items-center justify-end md:justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative"
            >
              {/* Header Modal */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Bagikan Event</h3>
                <button onClick={() => setShowShareModal(false)} className="w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Preview Event (Card Kecil) */}
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-8">
                <img src={event.img} alt="Event" className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                <div className="overflow-hidden">
                  <h4 className="font-bold text-gray-900 text-sm truncate">{event.title}</h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                    {formatPrettyDate(event.date_start)}
                  </p>
                </div>
              </div>

              {/* Deretan Tombol Sosmed */}
              <div className="flex justify-between items-start gap-2 mb-6 px-2">
                
                {/* WhatsApp */}
                <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => shareToPlatform('whatsapp')}>
                  <div className="w-14 h-14 bg-[#E7F9F1] rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                    <svg className="w-7 h-7 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-700">WhatsApp</span>
                </div>

                {/* X (Twitter) */}
                <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => shareToPlatform('twitter')}>
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                    <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-700">X (Twitter)</span>
                </div>

                {/* Facebook */}
                <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => shareToPlatform('facebook')}>
                  <div className="w-14 h-14 bg-[#EAF2FF] rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                    <svg className="w-6 h-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-700">Facebook</span>
                </div>

                {/* Salin Link */}
                <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => shareToPlatform('copy')}>
                  <div className="w-14 h-14 bg-[#FFF5F0] rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                    <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-700">Salin Link</span>
                </div>
              </div>

              {/* Tombol Opsi Lain (Panggil Native Share kalau didukung browser) */}
              {navigator.share && (
                 <button 
                   onClick={() => shareToPlatform('native')} 
                   className="w-full py-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-[11px] font-black text-gray-600 uppercase tracking-widest transition-colors mt-2"
                 >
                   Opsi Lainnya...
                 </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* 👆 AKHIR MODAL BAGIKAN EVENT 👆 */}

      <div className="relative w-full h-[280px] md:h-[500px] bg-gray-900">
        <img src={event.img} className="w-full h-full object-cover opacity-50" alt="Banner" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 md:top-8 md:left-8 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-gray-900 transition-all z-20">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10 -mt-20 md:-mt-32">
        
        <div className="bg-white rounded-[28px] md:rounded-[40px] shadow-2xl p-6 md:p-12 flex flex-col lg:flex-row gap-8 md:gap-12 mb-8 md:mb-12 relative">
          
          <div className="flex-1 text-left relative">
            <span className={`inline-block border px-4 py-1.5 md:px-5 md:py-2 rounded-xl text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6 ${isWed ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20' : 'bg-orange-50 text-[#FF6B35] border-orange-100'}`}>
              {isWed ? 'Undangan Spesial' : event.category}
            </span>
            
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-3 md:mb-4 leading-tight tracking-tight pr-12 md:pr-0">
              {event.title}
            </h1>
            
            <div className="inline-flex items-center text-xs md:text-sm font-bold text-gray-900 mb-6 md:mb-8 bg-gray-50 px-3 py-2 md:px-4 md:py-2 rounded-xl border border-gray-100">
              <svg className={`w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 ${isWed ? 'text-[#D4AF37]' : 'text-[#FF6B35]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {formatPrettyDate(event.date_start)} {event.date_end ? `- ${formatPrettyDate(event.date_end)}` : ''}
            </div>

            <div className="space-y-6 md:space-y-8 mb-8 md:mb-10">
              
              {!isWed && (
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
              )}
              
              <div>
                <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Contact Information</h3>
                <p className="text-sm text-gray-900 font-bold flex items-center bg-gray-50 p-3 md:p-4 rounded-2xl border border-gray-100 w-full md:w-max">
                  <svg className={`w-5 h-5 mr-3 shrink-0 ${isWed ? 'text-[#D4AF37]' : 'text-[#FF6B35]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {event.contact || '-'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] md:text-xs font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">
                {isWed ? 'Pesan Mempelai' : 'About This Event'}
              </h3>
              <p className="text-[13px] md:text-sm text-gray-600 leading-relaxed text-justify whitespace-pre-line bg-gray-50 p-5 md:p-6 rounded-[20px] md:rounded-[24px] border border-gray-100">
                {event.description || "Tidak ada detail tersedia."}
              </p>
            </div>
          </div>

          {/* KANAN: CARD TICKET & SHARE/LIKE */}
          <div className="w-full lg:w-[320px] flex flex-col md:items-end gap-4 md:gap-6 text-left shrink-0">
            
            <div className="flex gap-3 absolute top-4 right-4 md:relative md:top-0 md:right-0 z-20">
              {/* 👇 TOMBOL PEMICU MODAL SHARE 👇 */}
              <button onClick={() => setShowShareModal(true)} className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full border-2 transition-all active:scale-95 shadow-sm bg-white border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900`} title="Share Link Undangan">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              </button>
              
              <button onClick={handleLikeClick} className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full border-2 transition-all active:scale-95 shadow-sm ${isLiked ? 'border-red-500 bg-red-50 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-400'}`} title="Simpan Event">
                <svg className={`w-4 h-4 md:w-6 md:h-6 ${isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              </button>
            </div>

            <div className={`w-full rounded-[24px] md:rounded-[32px] p-6 md:p-8 shadow-sm border text-center flex flex-col items-center justify-center relative overflow-hidden mt-2 md:mt-0 ${isWed ? 'bg-[#FCFAEE] border-[#D4AF37]/30' : 'bg-[#FFF5F0] border-orange-100'}`}>
              <div className={`absolute top-0 left-0 w-full h-1 ${isWed ? 'bg-[#D4AF37]' : 'bg-[#FF6B35]'}`}></div>
              <h3 className={`text-xs md:text-sm font-black mb-4 md:mb-6 uppercase tracking-widest ${isWed ? 'text-[#D4AF37]' : 'text-[#FF6B35]'}`}>
                {isWed ? 'Konfirmasi Kehadiran' : 'Dapatkan Tiketmu'}
              </h3>
              
              <button 
                onClick={() => handleGoToCheckout('all')} 
                className={`w-full py-3.5 md:py-4 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] md:text-xs shadow-xl transition-all active:scale-95 ${isWed ? 'bg-[#D4AF37] hover:bg-[#B5952F]' : 'bg-gray-900 hover:bg-black'}`}
              >
                {isWed ? 'RSVP Semua Acara' : 'Beli Semua Sesi'}
              </button>
            </div>
          </div>

        </div>

        {/* CONTAINER SESI / RANGKAIAN ACARA */}
        <div className="bg-white rounded-[28px] md:rounded-[40px] shadow-sm border border-gray-100 p-6 md:p-12 mb-10 overflow-hidden relative">
          
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight">
              {isWed ? 'Rangkaian Acara' : 'Session'}
            </h2>
            
            {event.sessions && event.sessions.length > 1 && (
               <button onClick={scrollRight} className={`md:hidden flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full active:scale-95 transition-transform ${isWed ? 'text-[#D4AF37] bg-[#D4AF37]/10' : 'text-[#FF6B35] bg-orange-50'}`}>
                 <span>Geser</span>
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
               </button>
            )}
          </div>

          <div 
            ref={scrollContainerRef}
            className="flex flex-nowrap md:grid md:grid-cols-1 gap-4 md:gap-6 overflow-x-auto md:overflow-y-auto md:overflow-x-hidden max-h-none md:max-h-[800px] pb-6 md:pb-0 snap-x snap-mandatory scroll-smooth overscroll-x-contain md:overscroll-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-6 px-6 md:mx-0 md:px-0"
          >
            {event.sessions && event.sessions.length > 0 ? (
              event.sessions.map((session, index) => {
                const isSoldOut = session.stock < 1;
                
                return (
                  <motion.div 
                    key={session.id} 
                    initial={{ opacity: 0.3, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ amount: 0.5, margin: "0px", once: false }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`shrink-0 snap-center w-[85vw] md:w-auto border-2 rounded-[20px] md:rounded-[24px] p-5 md:p-8 relative flex flex-col justify-between items-start gap-5 transition-colors ${isSoldOut ? 'border-gray-200 bg-gray-50 opacity-70' : `bg-white border-gray-100 hover:border-${isWed ? '[#D4AF37]' : '[#FF6B35]'}`}`}
                  >
                    
                    <div className="flex flex-col md:flex-row w-full justify-between items-start gap-6">
                      
                      <div className="flex-1 w-full">
                        <div className="flex items-center gap-2 md:gap-3 mb-3">
                           <span className={`text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${isWed ? 'bg-[#D4AF37]' : 'bg-gray-900'}`}>
                             {isWed ? 'Acara' : 'Session'} {index + 1}
                           </span>
                           {isSoldOut && <span className="bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">Kuota Penuh</span>}
                        </div>
                        
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 uppercase mb-3 md:mb-4">{session.name}</h3>
                        
                        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3 md:mb-4">
                          <div className="flex items-center text-[11px] md:text-xs font-bold text-gray-600">
                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="truncate">{session.start_time.slice(0,5)} - {session.end_time.slice(0,5)} WIB</span>
                          </div>
                          <div className="flex items-center text-[11px] md:text-xs font-bold text-gray-600">
                            <svg className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="truncate">{formatPrettyDate(session.date)}</span>
                          </div>
                        </div>

                        <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed max-w-xl mb-4">{session.description || "Tidak ada detail."}</p>

                        {/* 👇 LOKASI SPESIFIK TIAP SESI (MUNCUL KHUSUS WEDDING) 👇 */}
                        {isWed && session.name_place && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-start gap-3">
                               <div className="mt-0.5 w-6 h-6 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0">
                                 <svg className="w-3.5 h-3.5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                               </div>
                               <div>
                                  <span className="block text-xs font-black text-gray-900 mb-0.5">{session.name_place}</span>
                                  <span className="block text-[10px] md:text-xs text-gray-500 font-medium">{session.place}, {session.city}</span>
                                  {session.map_url && (
                                    <a href={session.map_url} target="_blank" rel="noreferrer" className="inline-block mt-1.5 text-[10px] font-bold text-[#D4AF37] hover:text-[#B5952F] underline underline-offset-2">Buka G-Maps</a>
                                  )}
                               </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="w-full md:w-auto flex flex-row md:flex-col items-center md:items-end justify-between md:border-l border-gray-100 md:pl-8 shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
                        
                        {/* HARGA TIKET DIHILANGKAN JIKA WEDDING */}
                        {!isWed ? (
                          <div className="text-left md:text-right">
                            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5 md:mb-1">Harga Tiket</p>
                            <p className="font-black text-xl md:text-3xl text-gray-900 mb-0 md:mb-4">
                              {Number(session.price) === 0 ? <span className="text-[#27AE60]">FREE</span> : `Rp ${parseInt(session.price).toLocaleString('id-ID')}`}
                            </p>
                          </div>
                        ) : (
                          <div className="text-left md:text-right mb-0 md:mb-4">
                             <span className="inline-block px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-100">
                               Undangan Gratis
                             </span>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => handleGoToCheckout(session.id)} 
                          disabled={isSoldOut}
                          className={`w-auto md:w-full px-5 py-2.5 md:px-8 md:py-3 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all ${isSoldOut ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : (isWed ? 'bg-[#D4AF37] text-white hover:bg-[#B5952F] active:scale-95' : 'bg-[#FF6B35] text-white hover:bg-[#E85526] shadow-md shadow-orange-100 active:scale-95')}`}
                        >
                          {isSoldOut ? 'Penuh' : (isWed ? 'Kirim RSVP' : 'Pilih Tiket')}
                        </button>
                      </div>

                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-[24px] border border-dashed border-gray-200 w-full">
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">Belum ada rangkaian acara.</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
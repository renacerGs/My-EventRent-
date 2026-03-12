import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// --- FUNGSI FORMAT TANGGAL ---
const formatPrettyDate = (dateString) => {
  if (!dateString) return '';
  try {
    const rawDate = dateString.split(' - ')[0].trim();
    const timePart = dateString.includes(' - ') ? ` - ${dateString.split(' - ')[1]}` : '';
    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) return dateString;
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(dateObj);
    return `${formattedDate}${timePart}`;
  } catch (error) {
    return dateString;
  }
};

export default function Likes() {
  const [likedEvents, setLikedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // STATE UNTUK KONTROL POP-UP KONFIRMASI
  const [eventToUnlike, setEventToUnlike] = useState(null); 
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchLikedEvents = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:3000/api/likes/my?userId=${user.id}`);
        if (response.data) {
          setLikedEvents(response.data);
          localStorage.setItem('likedEvents', JSON.stringify(response.data));
        }
      } catch (error) {
        console.error("Gagal mengambil data likes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLikedEvents();
  }, [user?.id]); 

  const triggerUnlikeConfirmation = (e, eventId) => {
    e.preventDefault(); 
    e.stopPropagation();
    setEventToUnlike(eventId); 
  };

  const confirmUnlike = async () => {
    if (!eventToUnlike) return;
    
    // Hapus dari state lokal
    const updatedLikes = likedEvents.filter(event => event.id !== eventToUnlike);
    setLikedEvents(updatedLikes);
    localStorage.setItem('likedEvents', JSON.stringify(updatedLikes)); 
    setEventToUnlike(null);
    
    // Tembak API
    try {
      await axios.post('http://localhost:3000/api/likes/toggle', {
        userId: user.id,
        eventId: eventToUnlike
      });
    } catch (error) {
      console.error("Gagal unlike event:", error);
    }
  };

  const handleShare = async (e, event) => {
    e.preventDefault(); 
    e.stopPropagation();
    const shareData = {
      title: event.title,
      text: `Cek event keren ini: ${event.title}`,
      url: `${window.location.origin}/event/${event.id}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link berhasil disalin!");
      }
    } catch (err) {
      console.error("Gagal membagikan:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10 px-4 md:px-8 font-sans text-left relative">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-[#FF6B35] hover:border-[#FF6B35] shadow-sm transition-all active:scale-95">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight m-0">Wishlist</h1>
          </div>
          <span className="bg-orange-50 text-[#FF6B35] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-orange-100">
            {likedEvents.length} Events
          </span>
        </div>

        {/* EMPTY STATES */}
        {!user ? (
          <div className="text-center py-24 bg-white rounded-[40px] shadow-sm border border-gray-100">
            <p className="text-gray-500 mb-6 font-bold uppercase tracking-widest text-sm">Please login to see your liked events.</p>
            <Link to="/" className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl">Login Now</Link>
          </div>
        ) : likedEvents.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[40px] shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <span className="text-4xl">💔</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-wide">Wishlist Kosong</h3>
            <p className="text-gray-500 font-medium mb-8">Kamu belum menambahkan event apapun ke daftar favorit.</p>
            <Link to="/" className="bg-[#FF6B35] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-orange-100 hover:bg-[#E85526] transition-all active:scale-95">
              Cari Event Sekarang
            </Link>
          </div>
        ) : (
          /* GRID EVENTS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <AnimatePresence>
              {likedEvents.map((event) => (
                <motion.div 
                  key={event.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  className="group bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                  onClick={() => navigate(`/event/${event.id}`)}
                >
                  {/* Image Section */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                    <img src={event.img} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    
                    {/* Floating Badges */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                      <svg className="w-3.5 h-3.5 text-[#FF6B35]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                      <span className="text-[10px] font-black text-gray-900 uppercase">{event.category}</span>
                    </div>
                    
                    <button 
                      onClick={(e) => triggerUnlikeConfirmation(e, event.id)} 
                      className="absolute top-4 right-4 bg-white p-2.5 rounded-full text-red-500 shadow-md hover:scale-110 active:scale-95 transition-transform z-10"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </button>
                  </div>

                  {/* Content Section */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-black text-xl text-gray-900 leading-tight line-clamp-2 group-hover:text-[#FF6B35] transition-colors">{event.title}</h3>
                    </div>
                    
                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex items-center text-gray-500 text-xs font-bold">
                        <svg className="w-4 h-4 mr-2 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <span className="uppercase tracking-wider truncate">{formatPrettyDate(event.date)}</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-xs font-bold">
                        <svg className="w-4 h-4 mr-2 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span className="uppercase tracking-wider truncate">{event.location}</span>
                      </div>
                    </div>

                    {/* Footer Card */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Mulai Dari</p>
                        <p className="font-black text-lg text-gray-900 leading-none">
                          {Number(event.price) === 0 ? <span className="text-[#27AE60]">FREE</span> : `Rp ${parseInt(event.price).toLocaleString('id-ID')}`}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => handleShare(e, event)}
                        className="bg-gray-50 hover:bg-orange-50 text-gray-400 hover:text-[#FF6B35] p-2.5 rounded-xl transition-colors"
                        title="Share Event"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* --- MODAL KONFIRMASI UNLIKE --- */}
      <AnimatePresence>
        {eventToUnlike && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 border-[6px] border-red-100">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Hapus dari Wishlist?</h3>
                <p className="text-gray-500 text-sm mb-8 font-medium">
                  Yakin mau hapus event ini dari daftar favoritmu? Kamu bisa mencarinya lagi nanti di halaman utama.
                </p>
                
                <div className="flex w-full gap-4">
                  <button 
                    onClick={() => setEventToUnlike(null)} 
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={confirmUnlike} 
                    className="flex-1 py-4 bg-red-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-red-600 shadow-xl shadow-red-100 transition-all active:scale-95"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
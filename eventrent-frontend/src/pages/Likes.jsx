import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- FUNGSI FORMAT TANGGAL (Fri, 16 Apr 2026) ---
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
  
  // --- STATE UNTUK KONTROL POP-UP KONFIRMASI ---
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
        console.error("Gagal mengambil data likes dari database:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedEvents();
  }, [user?.id]); 

  // --- 1. Fungsi buat nampilin pop-up doang ---
  const triggerUnlikeConfirmation = (e, eventId) => {
    e.preventDefault(); 
    setEventToUnlike(eventId); // Munculin modal
  };

  // --- 2. Fungsi eksekusi hapus beneran (Jalan pas tombol 'Hapus' di klik) ---
  const confirmUnlike = async () => {
    if (!eventToUnlike) return;
    
    // Hapus dari state lokal biar layarnya langsung kerasa cepet
    const updatedLikes = likedEvents.filter(event => event.id !== eventToUnlike);
    setLikedEvents(updatedLikes);
    localStorage.setItem('likedEvents', JSON.stringify(updatedLikes)); 
    
    // Tutup modal
    setEventToUnlike(null);
    
    // Tembak API buat hapus di database
    try {
      await axios.post('http://localhost:3000/api/likes/toggle', {
        userId: user.id,
        eventId: eventToUnlike
      });
    } catch (error) {
      console.error("Gagal unlike event:", error);
      // Biar nggak pake alert, lu bisa ganti pakai toast notification kalau mau
      console.warn("Terjadi kesalahan saat menghapus like di server.");
    }
  };

  const handleShare = async (e, event) => {
    e.preventDefault(); 
    const shareData = {
      title: event.title,
      text: `Cek event ini di EventRent: ${event.title}`,
      url: `${window.location.origin}/event/${event.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        alert("Link berhasil disalin ke clipboard!");
      }
    } catch (err) {
      console.error("Gagal membagikan:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF6B35]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-10 px-6 font-sans text-left relative">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => navigate(-1)} 
            className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-50 border border-gray-200 text-gray-500 hover:bg-[#FF6B35] hover:text-white hover:border-[#FF6B35] transition-all"
            title="Go Back"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-4xl font-bold text-gray-900 uppercase tracking-tight m-0">Likes</h1>
        </div>

        {!user ? (
          <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
            <p className="text-gray-500 mb-6 font-semibold uppercase">Please login to see your liked events.</p>
            <Link to="/" className="bg-[#FF6B35] text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-orange-100 transition-all active:scale-95">Login Now</Link>
          </div>
        ) : likedEvents.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
               <svg className="w-10 h-10 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
            </div>
            <p className="text-gray-500 font-bold uppercase tracking-widest">No liked events yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {likedEvents.map((event) => (
              <Link 
                to={`/event/${event.id}`} 
                key={event.id} 
                className="flex flex-col md:flex-row items-center justify-between bg-white rounded-[32px] border border-gray-100 p-2 shadow-sm hover:shadow-md transition-all group overflow-hidden"
              >
                <div className="flex-1 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-tight group-hover:text-[#FF6B35] transition-colors line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-[#FF6B35] text-sm font-bold uppercase mb-1 tracking-widest">
                    {formatPrettyDate(event.date)}
                  </p>
                  <p className="text-gray-400 text-xs font-bold mb-4 uppercase">
                    {event.location}
                  </p>
                  <p className="text-gray-900 font-bold text-sm uppercase">
                    RP {parseInt(event.price).toLocaleString()}
                  </p>
                </div>

                <div className="relative w-full md:w-[280px] h-[180px] md:h-[180px] p-2">
                  <div className="w-full h-full rounded-[24px] overflow-hidden relative">
                    <img 
                      src={event.img} 
                      alt={event.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      <button 
                        onClick={(e) => triggerUnlikeConfirmation(e, event.id)} // <-- Diubah di sini
                        className="bg-white p-2 rounded-full text-red-500 shadow-xl border border-gray-50 transition-transform active:scale-90 hover:bg-red-50"
                        title="Remove from Likes"
                      >
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>

                      <button 
                        onClick={(e) => handleShare(e, event)}
                        className="bg-white p-2 rounded-full text-gray-400 hover:text-[#FF6B35] shadow-xl border border-gray-50 transition-transform active:scale-90"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* --- CUSTOM MODAL KONFIRMASI --- */}
      {eventToUnlike && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div 
            className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} // Biar kalau diklik di dalam modal nggak ketutup
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase">Hapus dari Likes?</h3>
              <p className="text-gray-500 text-sm mb-8 font-medium">
                Kamu yakin mau menghapus event ini dari daftar favoritmu?
              </p>
              
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setEventToUnlike(null)} // Tutup modal tanpa hapus
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmUnlike} // Eksekusi hapus beneran
                  className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
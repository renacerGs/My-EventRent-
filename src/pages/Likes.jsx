import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Likes() {
  const [likedEvents, setLikedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Ambil data user yang login
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchLikedEvents = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // AMBIL DATA DARI DATABASE
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
  }, []);

  // FUNGSI BAGIKAN (Web Share API)
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
    <div className="min-h-screen bg-white py-10 px-6 font-sans text-left">
      <div className="max-w-5xl mx-auto">
        {/* JUDUL BIASA (Tanpa Italic/Black) */}
        <h1 className="text-4xl font-bold text-gray-900 mb-10 uppercase tracking-tight">Likes</h1>

        {!user ? (
          <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
            <p className="text-gray-500 mb-6 font-semibold uppercase">Please login to see your liked events.</p>
            <Link to="/" className="bg-[#FF6B35] text-white px-8 py-3 rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-orange-100 transition-all active:scale-95">Login Now</Link>
          </div>
        ) : likedEvents.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-[40px] border border-dashed border-gray-200">
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
                {/* INFO CONTENT (KIRI) - Font Bold Standar */}
                <div className="flex-1 p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-tight group-hover:text-[#FF6B35] transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-[#FF6B35] text-sm font-bold uppercase mb-1 tracking-widest">
                    {event.date}
                  </p>
                  <p className="text-gray-400 text-xs font-bold mb-4 uppercase">
                    {event.location}
                  </p>
                  <p className="text-gray-900 font-bold text-sm uppercase">
                    RP {parseInt(event.price).toLocaleString()}
                  </p>
                </div>

                {/* IMAGE & ACTIONS (KANAN) */}
                <div className="relative w-full md:w-[280px] h-[180px] md:h-[180px] p-2">
                  <div className="w-full h-full rounded-[24px] overflow-hidden relative">
                    <img 
                      src={event.img} 
                      alt={event.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    />
                    
                    {/* BUTTON ACTIONS SESUAI GAMBAR */}
                    <div className="absolute bottom-3 right-3 flex gap-2">
                      {/* Tombol Like Merah */}
                      <div className="bg-white p-2 rounded-full text-red-500 shadow-xl border border-gray-50 transition-transform active:scale-90">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>

                      {/* Tombol Share */}
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
    </div>
  );
}
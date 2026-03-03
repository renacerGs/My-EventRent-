import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function EventDetail({ events }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const found = events?.find(e => String(e.id) === String(id));
    if (found) {
      setEvent(found);
      
      // Ambil data terbaru dari localStorage
      const savedLikes = JSON.parse(localStorage.getItem('likedEvents')) || [];
      const alreadyLiked = savedLikes.some(item => String(item.id) === String(found.id));
      setIsLiked(alreadyLiked);
    }
    window.scrollTo(0, 0);
  }, [id, events]);

  const handleLikeClick = () => {
    if (!event) return; // Guard clause agar tidak error jika event belum ada

    const savedLikes = JSON.parse(localStorage.getItem('likedEvents')) || [];
    let updatedLikes;
    
    if (!isLiked) {
      // Tambah ke favorites
      updatedLikes = [...savedLikes, event];
      setIsLiked(true);
    } else {
      // Hapus dari favorites (Unlike)
      updatedLikes = savedLikes.filter(item => String(item.id) !== String(event.id));
      setIsLiked(false);
    }

    // Simpan hasil perubahan ke localStorage
    localStorage.setItem('likedEvents', JSON.stringify(updatedLikes));
    
    // Opsional: Trigger event agar tab lain/halaman lain tahu ada perubahan storage
    window.dispatchEvent(new Event("storage"));
  };

  if (!event) return <div className="p-20 text-center font-bold">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-10 font-sans">
      <div className="relative w-full h-[220px] md:h-[320px] overflow-hidden">
        <img src={event.img} className="w-full h-full object-cover" alt="Banner" />
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-4 left-4 bg-black/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-black/40 transition-all z-10"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="absolute inset-0 bg-black/5"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4">
        <div className="relative -mt-12 bg-white rounded-[32px] shadow-xl p-6 md:p-10 border border-gray-50 flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1">
            <span className="inline-block bg-[#FF6B35] text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider mb-4">
              {event.category}
            </span>
            <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight mb-6">{event.title}</h1>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-gray-600 font-bold text-xs md:text-sm">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 border border-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div> {event.date}
              </div>
              {/* Ikon Lokasi - Style Google Maps Minimalis */}
              <div className="flex items-center gap-4 text-gray-600 font-bold text-xs md:text-sm">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 border border-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div> {event.location}
              </div>
              <div className="flex items-center gap-4 text-gray-600 font-bold text-xs md:text-sm">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl text-gray-400 border border-gray-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div> {event.author || 'Admin EventRent'}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="text-lg font-black mb-3 text-gray-900">About this event</h3>
              <p className="text-gray-500 leading-relaxed text-xs md:text-sm">{event.description}</p>
            </div>
          </div>

          <div className="w-full lg:w-[280px] flex flex-col items-end">
            <button 
              onClick={handleLikeClick}
              className="mb-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:scale-105 transition-all active:scale-95"
            >
              <svg 
                className={`w-6 h-6 transition-colors duration-300 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-300 fill-none'}`} 
                stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
              </svg>
            </button>

            <div className="w-full bg-[#F2F2F2] rounded-[28px] p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-black text-gray-800">Ticket</span>
                <div className="text-right">
                   <span className="text-[10px] text-gray-400 font-bold block">PRICE</span>
                   <span className="text-lg font-black text-gray-900">Rp {event.price}</span>
                </div>
              </div>
              <button className="w-full bg-[#FF6B35] hover:bg-[#e85a2a] text-white py-4 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95">Get Tickets</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
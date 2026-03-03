import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function EventDetail({ events }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (events && events.length > 0) {
      const found = events.find(e => String(e.id) === String(id));
      if (found) {
        setEvent(found);
        const savedLikes = JSON.parse(localStorage.getItem('likedEvents')) || [];
        const alreadyLiked = savedLikes.some(item => String(item.id) === String(found.id));
        setIsLiked(alreadyLiked);
      }
    }
    window.scrollTo(0, 0);
  }, [id, events]);

  const handleLikeClick = () => {
    if (!event) return;
    const savedLikes = JSON.parse(localStorage.getItem('likedEvents')) || [];
    let updatedLikes;
    
    if (!isLiked) {
      updatedLikes = [...savedLikes, event];
      setIsLiked(true);
    } else {
      updatedLikes = savedLikes.filter(item => String(item.id) !== String(event.id));
      setIsLiked(false);
    }
    localStorage.setItem('likedEvents', JSON.stringify(updatedLikes));
    window.dispatchEvent(new Event("storage"));
  };

  if (!event) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mb-4"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* --- 1. HERO IMAGE SECTION --- */}
      <div className="relative w-full h-[450px] bg-gray-900">
        <img 
          src={event.img} 
          className="w-full h-full object-cover opacity-80" 
          alt="Banner" 
        />
        
        {/* Tombol Back (Sesuai Desain: Bulat, Abu-abu transparan) */}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-gray-900 transition-all z-20"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
      </div>

      {/* --- 2. MAIN CARD CONTENT (OVERLAP) --- */}
      <div className="max-w-6xl mx-auto px-4 relative z-10 -mt-32">
        <div className="bg-white rounded-[30px] shadow-xl p-8 md:p-12 flex flex-col lg:flex-row gap-12 min-h-[400px]">
          
          {/* --- BAGIAN KIRI: DETAIL INFO --- */}
          <div className="flex-1">
            
            {/* Category Pill */}
            <span className="inline-block bg-[#FF6B35] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-5">
              {event.category || "Event"}
            </span>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-8">
              {event.title}
            </h1>
            
            {/* Info Rows (Icon + Text) */}
            <div className="space-y-5 mb-10">
              {/* Date */}
              <div className="flex items-center gap-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-base font-bold text-gray-800">{event.date}</p>
              </div>

              {/* Location */}
              <div className="flex items-center gap-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <p className="text-base font-bold text-gray-800">{event.location}</p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <p className="text-base font-bold text-gray-800">{event.author || 'EventRent Official'}</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xl font-black text-gray-900 mb-3">About this event</h3>
              <p className="text-gray-500 leading-relaxed text-sm md:text-base whitespace-pre-line">
                {event.description || "No description provided."}
              </p>
            </div>
          </div>

          {/* --- BAGIAN KANAN: LOVE & TICKET --- */}
          <div className="w-full lg:w-[320px] flex flex-col items-end gap-6">
            
            {/* 1. Tombol Like (Terpisah di atas) */}
            <button 
              onClick={handleLikeClick}
              className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all
                ${isLiked ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-[#FF6B35] hover:text-[#FF6B35]'}`}
            >
              <svg className={`w-6 h-6 ${isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {/* 2. Kotak Ticket (Background Abu-abu) */}
            <div className="w-full bg-gray-100/80 rounded-[24px] p-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-bold text-gray-900">Ticket</span>
                <span className="text-lg font-black text-gray-900">
                   {Number(event.price) === 0 ? 'Free' : `${parseInt(event.price).toLocaleString()}`}
                </span>
              </div>
              
              <button className="w-full bg-[#E85526] hover:bg-[#d1461b] text-white py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95">
                Get Tickets
              </button>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    const fetchEventDetail = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/events/${id}`);
        if (!response.ok) throw new Error('Gagal mengambil data event');
        const data = await response.json();
        setEvent(data);
        
        fetch(`http://localhost:3000/api/events/${id}/view`, { method: 'POST' }).catch(() => {});
        
        const savedLikes = JSON.parse(localStorage.getItem('likedEvents')) || [];
        setIsLiked(savedLikes.some(item => String(item.id) === String(id)));
      } catch (error) {
        console.error(error);
        alert("Event tidak ditemukan");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  const handleLikeClick = async () => {
    if (!user) return alert("Login dulu bro buat nyimpen event ke Likes!");
    try {
      const res = await fetch('http://localhost:3000/api/likes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, eventId: event.id })
      });
      if (res.ok) {
        setIsLiked(!isLiked);
      }
    } catch (error) { console.error(error); }
  };

  const handleGoToCheckout = () => {
    if (!user) {
      alert("Login dulu bro untuk pesan tiket!");
      return;
    }
    // Langsung arahin ke halaman checkout dengan membawa ID event
    navigate(`/checkout/${event.id}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400 tracking-widest">LOADING...</div>;
  if (!event) return null;

  return (
    <div className="min-h-screen bg-gray-100 pb-20 font-sans">
      
      {/* HEADER BANNER */}
      <div className="relative w-full h-[400px] md:h-[500px] bg-gray-900">
        <img src={event.img} className="w-full h-full object-cover opacity-60" alt="Banner" />
        <button onClick={() => navigate(-1)} className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-gray-900 transition-all z-20">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10 -mt-32">
        
        {/* CARD UTAMA */}
        <div className="bg-white rounded-[32px] shadow-xl p-8 md:p-12 flex flex-col lg:flex-row gap-12 mb-10">
          
          {/* KIRI: INFO EVENT */}
          <div className="flex-1 text-left relative">
            <span className="inline-block bg-[#FF6B35] text-white px-5 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
              {event.category}
            </span>
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">{event.title}</h1>
            
            <div className="flex items-center text-sm font-bold text-gray-900 mb-8">
              <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {formatPrettyDate(event.date_start)} {event.date_end ? `- ${formatPrettyDate(event.date_end)}` : ''}
            </div>

            <div className="space-y-6 mb-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Location</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  <span className="font-bold text-gray-900 block">{event.name_place}</span>
                  {event.place}, {event.city}, {event.province}
                </p>
                {event.map_url && (
                  <a href={event.map_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 font-bold hover:underline mt-2 inline-block">Lihat di Google Maps &rarr;</a>
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Contact Information</h3>
                <p className="text-sm text-gray-600 font-medium flex items-center">
                  <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {event.contact || '-'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">About This Event</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-justify whitespace-pre-line">
                {event.description || "No description provided for this event."}
              </p>
            </div>
          </div>

          {/* KANAN: CARD TICKET & LIKE (Sesuai Desain) */}
          <div className="w-full lg:w-[320px] flex flex-col items-end gap-6 text-left">
            <button onClick={handleLikeClick} className={`w-12 h-12 flex items-center justify-center rounded-xl border-2 transition-all ${isLiked ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-[#FF6B35] hover:text-[#FF6B35]'}`}>
              <svg className={`w-6 h-6 ${isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>

            <div className="w-full bg-gray-50 rounded-[32px] p-8 shadow-inner border border-gray-200 text-center flex flex-col items-center justify-center h-48">
              <h3 className="text-2xl font-black text-gray-900 mb-6 uppercase tracking-widest">TICKET</h3>
              <button 
                onClick={handleGoToCheckout} 
                className="w-full py-4 bg-[#FF6B35] text-white rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-orange-200 hover:bg-[#e85526] transition-all active:scale-95"
              >
                Buy Now
              </button>
            </div>
          </div>

        </div>

        {/* CARD SESSION (SCROLLABLE LIST) */}
        <div className="bg-white rounded-[32px] shadow-xl p-8 md:p-12 mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Session</h2>
          
          {/* max-h-[750px] ini bikin dia muat sekitar 3 session. Kalau 4 baru dia munculin scroll vertikal */}
          <div className="space-y-6 max-h-[750px] overflow-y-auto pr-4 custom-scrollbar">
            {event.sessions && event.sessions.length > 0 ? (
              event.sessions.map((session, index) => (
                <div key={session.id} className="border-2 border-[#FF6B35] rounded-[24px] p-8 bg-white relative">
                  
                  <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6">
                    <h3 className="text-2xl font-bold text-gray-900 uppercase pr-24">{session.name}</h3>
                    <span className="absolute top-8 right-8 text-xs font-bold text-gray-400 tracking-wider">Session {index + 1}</span>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center text-sm font-bold text-gray-900">
                      <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {formatPrettyDate(session.date)} | {session.start_time.slice(0,5)} - {session.end_time.slice(0,5)}
                    </div>
                    <div className="flex items-center text-sm font-bold text-gray-900">
                      <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {event.name_place} {/* Mengambil tempat dari event utama */}
                    </div>
                    {session.contact_person && (
                      <div className="flex items-center text-sm font-bold text-gray-900">
                        <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {session.contact_person}
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-gray-900 mb-2">About this event</h4>
                    <p className="text-sm text-gray-600 leading-relaxed text-justify">{session.description || "No specific details for this session."}</p>
                  </div>
                  
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm font-bold text-center py-10">Data session belum tersedia.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

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

const isEventPassed = (dateStr) => {
  if (!dateStr) return false;
  try {
    let cleanDate = dateStr;
    if (dateStr.includes(' - ')) cleanDate = dateStr.split(' - ')[0].trim();
    const eventDate = new Date(cleanDate);
    if (isNaN(eventDate.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate < today;
  } catch (error) {
    return false;
  }
};

export default function ManageEvent() {
  const [myEvents, setMyEvents] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null); 
  const [eventToDelete, setEventToDelete] = useState(null);

  const navigate = useNavigate();
  const menuRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    fetch(`/api/events/my?userId=${user.id}`)
      .then(res => res.json())
      .then(data => { 
        // Pastikan yang masuk beneran Array, kalau backend error, set array kosong
        setMyEvents(Array.isArray(data) ? data : []); 
      })
      .catch(err => console.error("Gagal ambil event:", err));
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const sortedEvents = [...myEvents].sort((a, b) => {
    // 👇 FIX: Pakai date_start sesuai respons backend 👇
    const isAPast = isEventPassed(a.date_start);
    const isBPast = isEventPassed(b.date_start);
    if (isAPast && !isBPast) return 1;  
    if (!isAPast && isBPast) return -1; 
    return 0; 
  });

  const handleCardClick = (id) => navigate(`/manage/event/${id}`);

  const handleView = (e, id) => {
    e.stopPropagation(); 
    navigate(`/event/${id}`);
    setActiveMenuId(null);
  };

  const handleEdit = (e, event) => {
    e.stopPropagation();
    navigate(`/edit/${event.id}`); 
    setActiveMenuId(null);
  };

  const triggerDelete = (e, id) => {
    e.stopPropagation();
    setEventToDelete(id); 
    setActiveMenuId(null);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      const res = await fetch(`/api/events/${eventToDelete}?userId=${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMyEvents(prev => prev.filter(event => event.id !== eventToDelete));
        setEventToDelete(null); 
      } else {
        console.error("Gagal menghapus event");
        setEventToDelete(null);
      }
    } catch (err) { 
      console.error(err); 
      setEventToDelete(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-6 md:mb-8 text-left">
          <div>
             <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">Manage Events</h1>
             <p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2 font-medium">Click on an event card to see the sales dashboard & attendees.</p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 min-h-[500px]">
          
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-gray-50/50 rounded-t-[24px] border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <div className="col-span-5">Event Details</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-center">Stock</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <div className="divide-y divide-gray-100">
            {sortedEvents.length > 0 ? (
              sortedEvents.map((event) => {
                // 👇 FIX: Pakai date_start 👇
                const isPast = isEventPassed(event.date_start);
                const isMenuActive = activeMenuId === event.id;
                const isWed = event.is_private || event.isPrivate; // Deteksi Wedding

                return (
                  <div 
                    key={event.id} 
                    onClick={() => handleCardClick(event.id)} 
                    className={`flex flex-col md:grid md:grid-cols-12 gap-2 md:gap-4 p-5 md:px-8 md:py-5 md:items-center hover:bg-gray-50 transition-colors group cursor-pointer relative ${isMenuActive ? 'z-50' : 'z-0'} ${isPast ? 'opacity-80' : ''}`}
                  >
                    {/* FOTO & JUDUL EVENT */}
                    <div className="md:col-span-5 flex items-center gap-3 md:gap-5 pr-8 md:pr-0 w-full mb-2 md:mb-0">
                      <div className={`w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 ${isPast ? 'grayscale-[60%]' : 'bg-gray-100'}`}>
                         <img src={event.img} alt={event.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm md:text-base mb-0.5 group-hover:text-[#FF6B35] transition-colors truncate flex items-center gap-2">
                          {event.title}
                          {/* 👇 BADGE KHUSUS WEDDING / PRIVATE 👇 */}
                          {isWed && (
                            <span className="bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-[#D4AF37]/20 shrink-0">
                              Private
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center gap-3 text-[10px] md:text-xs text-gray-500 font-medium">
                          {/* 👇 FIX: Pakai date_start 👇 */}
                          <span className="truncate">{formatPrettyDate(event.date_start)}</span>
                        </div>
                      </div>
                    </div>

                    {/* BUNGKUSAN STATS KHUSUS MOBILE */}
                    <div className="flex md:hidden items-center flex-wrap gap-2 w-full mt-1">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                        isPast ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {isPast ? 'Ended' : 'Active'}
                      </span>
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-bold ${event.stock > 0 ? (isWed ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-orange-50 text-[#FF6B35]') : 'bg-red-100 text-red-600'}`}>
                        {event.stock > 0 ? `${event.stock} Left` : 'Sold Out'}
                      </span>
                      <span className={`ml-auto text-xs font-bold ${isWed ? 'text-[#D4AF37]' : 'text-gray-900'}`}>
                        {Number(event.price) === 0 ? 'Free RSVP' : `Rp ${parseInt(event.price).toLocaleString()}`}
                      </span>
                    </div>

                    {/* BUNGKUSAN STATS KHUSUS DESKTOP */}
                    <div className="hidden md:block md:col-span-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        isPast ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {isPast ? 'Ended' : 'Active'}
                      </span>
                    </div>
                    <div className="hidden md:block md:col-span-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${event.stock > 0 ? (isWed ? 'bg-[#D4AF37]/10 text-[#D4AF37]' : 'bg-orange-50 text-[#FF6B35]') : 'bg-red-100 text-red-600'}`}>
                        {event.stock > 0 ? `${event.stock} Left` : 'Sold Out'}
                      </span>
                    </div>
                    <div className={`hidden md:block md:col-span-2 text-center text-sm font-bold ${isWed ? 'text-[#D4AF37]' : 'text-gray-900'}`}>
                      {Number(event.price) === 0 ? 'Free RSVP' : `Rp ${parseInt(event.price).toLocaleString()}`}
                    </div>

                    {/* TOMBOL ACTION (Titik Tiga) */}
                    <div className="absolute top-4 right-4 md:relative md:top-0 md:right-0 md:col-span-1 flex justify-end">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          setActiveMenuId(isMenuActive ? null : event.id);
                        }}
                        className={`p-1.5 md:p-2 text-gray-400 rounded-full transition-colors active:scale-90 ${isWed ? 'hover:text-[#D4AF37] hover:bg-[#D4AF37]/10' : 'hover:text-[#FF6B35] hover:bg-orange-50'}`}
                      >
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                      </button>

                      {isMenuActive && (
                        <div ref={menuRef} className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 z-[100] overflow-hidden animate-fadeIn origin-top-right">
                          <div className="py-1">
                            <button onClick={(e) => handleView(e, event.id)} className="w-full text-left px-4 py-3 md:py-2.5 text-xs md:text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-[#FF6B35] flex items-center gap-2">View Event Page</button>
                            <button onClick={(e) => handleEdit(e, event)} className="w-full text-left px-4 py-3 md:py-2.5 text-xs md:text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-[#FF6B35] flex items-center gap-2">Edit Event</button>
                            <div className="border-t border-gray-100 mt-1">
                              <button onClick={(e) => triggerDelete(e, event.id)} className="w-full text-left px-4 py-3 md:py-2.5 text-xs md:text-sm text-red-500 hover:bg-red-50 font-bold flex items-center gap-2">Delete Event</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="p-12 md:p-20 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <h3 className="text-gray-900 font-bold text-base md:text-lg mb-1">No Events Yet</h3>
                <p className="text-xs text-gray-400 mb-6 font-medium">Kamu belum membuat event satupun.</p>
                <Link to="/create" className="bg-[#FF6B35] text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg shadow-orange-200 active:scale-95 transition-transform">Create Event</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- CUSTOM MODAL KONFIRMASI DELETE --- */}
      {eventToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div 
            className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 md:mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Hapus Event?</h3>
              <p className="text-gray-500 text-xs md:text-sm mb-6 md:mb-8 font-medium">
                Kamu yakin mau menghapus event ini? Data penjualan yang dihapus tidak bisa dikembalikan.
              </p>
              
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setEventToDelete(null)}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-xl md:rounded-2xl font-bold uppercase text-[10px] md:text-xs tracking-wider hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3.5 bg-red-500 text-white rounded-xl md:rounded-2xl font-bold uppercase text-[10px] md:text-xs tracking-wider hover:bg-red-600 shadow-lg shadow-red-200 transition-colors"
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
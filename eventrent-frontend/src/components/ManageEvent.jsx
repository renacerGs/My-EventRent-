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
  
  // --- STATE BUAT POP-UP DELETE ---
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
      .then(data => { setMyEvents(Array.isArray(data) ? data : []); })
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
    const isAPast = isEventPassed(a.date);
    const isBPast = isEventPassed(b.date);
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

  // --- TRIGGER POP-UP ---
  const triggerDelete = (e, id) => {
    e.stopPropagation();
    setEventToDelete(id); // Munculin modal konfirmasi
    setActiveMenuId(null);
  };

  // --- EKSEKUSI DELETE ---
  const confirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      const res = await fetch(`/api/events/${eventToDelete}?userId=${user.id}`, { method: 'DELETE' });
      if (res.ok) {
        setMyEvents(prev => prev.filter(event => event.id !== eventToDelete));
        setEventToDelete(null); // Tutup modal
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        
        <div className="flex justify-between items-end mb-8">
          <div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manage Events</h1>
             <p className="text-gray-500 mt-2">Click on an event card to see the sales dashboard & attendees.</p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 min-h-[500px]">
          <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-gray-50/50 rounded-t-[24px] border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-5">Event Details</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-center">Stock</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          <div className="divide-y divide-gray-100">
            {sortedEvents.length > 0 ? (
              sortedEvents.map((event) => {
                const isPast = isEventPassed(event.date);
                const isMenuActive = activeMenuId === event.id;

                return (
                  <div 
                    key={event.id} 
                    onClick={() => handleCardClick(event.id)} 
                    className={`grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-gray-50 transition-colors group cursor-pointer relative ${isMenuActive ? 'z-50' : 'z-0'} ${isPast ? 'opacity-80' : ''}`}
                  >
                    <div className="col-span-5 flex items-center gap-5">
                      <div className={`w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 ${isPast ? 'grayscale-[60%]' : 'bg-gray-100'}`}>
                         <img src={event.img} alt={event.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-[#FF6B35] transition-colors line-clamp-1">{event.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                          <span className="flex items-center gap-1">{formatPrettyDate(event.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        isPast ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {isPast ? 'Ended' : 'Active'}
                      </span>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${event.stock > 0 ? 'bg-orange-50 text-[#FF6B35]' : 'bg-red-100 text-red-600'}`}>
                        {event.stock > 0 ? `${event.stock} Left` : 'Sold Out'}
                      </span>
                    </div>

                    <div className="col-span-2 text-center text-sm font-bold text-gray-900">
                      {Number(event.price) === 0 ? 'Free' : `Rp ${parseInt(event.price).toLocaleString()}`}
                    </div>

                    <div className="col-span-1 flex justify-end relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          setActiveMenuId(isMenuActive ? null : event.id);
                        }}
                        className="p-2 text-gray-400 hover:text-[#FF6B35] hover:bg-orange-50 rounded-full transition-colors"
                      >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                      </button>

                      {isMenuActive && (
                        <div ref={menuRef} className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 z-[100] overflow-hidden animate-fadeIn origin-top-right">
                          <div className="py-1">
                            <button onClick={(e) => handleView(e, event.id)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF6B35] flex items-center gap-2">View Event Page</button>
                            <button onClick={(e) => handleEdit(e, event)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF6B35] flex items-center gap-2">Edit Event</button>
                            <div className="border-t border-gray-100 mt-1">
                              {/* --- TOMBOL DELETE SEKARANG MANGGIL triggerDelete --- */}
                              <button onClick={(e) => triggerDelete(e, event.id)} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-semibold flex items-center gap-2">Delete</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })
            ) : (
              <div className="p-20 text-center flex flex-col items-center justify-center">
                <h3 className="text-gray-900 font-bold text-lg mb-1">No Events Yet</h3>
                <Link to="/create" className="bg-[#FF6B35] text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg shadow-orange-200 mt-4">Create Event</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- CUSTOM MODAL KONFIRMASI DELETE --- */}
      {eventToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div 
            className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase">Hapus Event?</h3>
              <p className="text-gray-500 text-sm mb-8 font-medium">
                Kamu yakin mau menghapus event ini? Data yang dihapus tidak bisa dikembalikan.
              </p>
              
              <div className="flex w-full gap-3">
                <button 
                  onClick={() => setEventToDelete(null)}
                  className="flex-1 py-3 px-4 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-gray-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDelete}
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
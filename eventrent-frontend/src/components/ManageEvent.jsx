import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ManageEvent() {
  const [myEvents, setMyEvents] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null); 
  const navigate = useNavigate();
  const menuRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user'));

  // 1. Fetch Data
  useEffect(() => {
    if (!user) { navigate('/'); return; }
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    fetch(`http://localhost:3000/api/events/my?userId=${user.id}`)
      .then(res => res.json())
      .then(data => { setMyEvents(Array.isArray(data) ? data : []); })
      .catch(err => console.error("Gagal ambil event:", err));
  };

  // 2. Tutup menu dropdown kalau klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- ACTIONS ---

  // FUNGSI BARU: KLIK CARD -> PINDAH KE DASHBOARD
  const handleCardClick = (id) => {
    navigate(`/manage/event/${id}`);
  };

  const handleView = (e, id) => {
    e.stopPropagation(); // Stop biar gak trigger klik card
    navigate(`/event/${id}`);
    setActiveMenuId(null);
  };

  const handleEdit = (e, event) => {
    e.stopPropagation();
    navigate(`/edit/${event.id}`); 
    setActiveMenuId(null);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const res = await fetch(`http://localhost:3000/api/events/${id}?userId=${user.id}`, { method: 'DELETE' });
        if (res.ok) {
          setMyEvents(prev => prev.filter(event => event.id !== id));
          setActiveMenuId(null);
        } else {
          alert("Gagal menghapus event");
        }
      } catch (err) { console.error(err); }
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        
        <div className="flex justify-between items-end mb-8">
          <div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manage Events</h1>
             <p className="text-gray-500 mt-2">Click on an event card to see the sales dashboard & attendees.</p>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
          {/* Header Tabel */}
          <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-6">Event Details</div>
            <div className="col-span-2 text-center">Stock</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          <div className="divide-y divide-gray-100">
            {myEvents.length > 0 ? (
              myEvents.map((event) => (
                <div 
                  key={event.id} 
                  onClick={() => handleCardClick(event.id)} // <--- KLIK CARD PINDAH KE DASHBOARD
                  className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  
                  {/* 1. Details */}
                  <div className="col-span-6 flex items-center gap-5">
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                       <img src={event.img} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-[#FF6B35] transition-colors line-clamp-1">{event.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1">{event.date}</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="flex items-center gap-1">{event.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Stock */}
                  <div className="col-span-2 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${event.stock > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {event.stock > 0 ? `${event.stock} Left` : 'Sold Out'}
                    </span>
                  </div>

                  {/* 3. Price */}
                  <div className="col-span-2 text-center text-sm font-bold text-gray-900">
                    {Number(event.price) === 0 ? 'Free' : `Rp ${parseInt(event.price).toLocaleString()}`}
                  </div>

                  {/* 4. Action (Tombol Titik Tiga) */}
                  <div className="col-span-2 flex justify-end relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Stop biar gak trigger masuk ke dashboard
                        setActiveMenuId(activeMenuId === event.id ? null : event.id);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                    </button>

                    {/* DROPDOWN MENU */}
                    {activeMenuId === event.id && (
                      <div ref={menuRef} className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 z-50 overflow-hidden animate-fadeIn origin-top-right">
                        <div className="py-1">
                          <button onClick={(e) => handleView(e, event.id)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF6B35] flex items-center gap-2">View Event Page</button>
                          <button onClick={(e) => handleEdit(e, event)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF6B35] flex items-center gap-2">Edit Event</button>
                          <div className="border-t border-gray-100 mt-1">
                            <button onClick={(e) => handleDelete(e, event.id)} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-semibold flex items-center gap-2">Delete</button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ))
            ) : (
              <div className="p-20 text-center flex flex-col items-center justify-center">
                <h3 className="text-gray-900 font-bold text-lg mb-1">No Events Yet</h3>
                <Link to="/create" className="bg-[#FF6B35] text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg shadow-orange-200 mt-4">Create Event</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
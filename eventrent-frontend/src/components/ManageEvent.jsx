import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ManageEvent() {
  const [myEvents, setMyEvents] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null); // Melacak menu mana yg lagi terbuka
  const navigate = useNavigate();
  const menuRef = useRef(null);
  
  const user = JSON.parse(localStorage.getItem('user'));

  // 1. Fetch Data
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchEvents();
  }, []);

  const fetchEvents = () => {
    fetch(`http://localhost:3000/api/events/my?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setMyEvents(Array.isArray(data) ? data : []);
      })
      .catch(err => console.error("Gagal ambil event saya:", err));
  };

  // 2. Tutup menu kalau klik di luar
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

  const handleView = (id) => {
    navigate(`/event/${id}`);
  };

  const handleCopyLink = (id) => {
    const url = `${window.location.origin}/event/${id}`;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
    setActiveMenuId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        const res = await fetch(`http://localhost:3000/api/events/${id}?userId=${user.id}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          // Hapus dari state biar langsung hilang tanpa refresh
          setMyEvents(prev => prev.filter(event => event.id !== id));
          setActiveMenuId(null);
        } else {
          alert("Gagal menghapus event");
        }
      } catch (err) {
        console.error("Error delete:", err);
      }
    }
  };

  // Fitur Edit & Copy Event (Sementara alert dulu, nanti kita buat halamannya)
  const handleEdit = (event) => {
    // navigate('/create', { state: { eventData: event, isEdit: true } }); // Nanti kita aktifkan ini
    alert("Fitur Edit akan segera hadir!"); 
    setActiveMenuId(null);
  };

  const handleDuplicate = (event) => {
    // navigate('/create', { state: { eventData: event, isDuplicate: true } }); // Nanti kita aktifkan ini
    alert("Fitur Copy Event akan segera hadir!"); 
    setActiveMenuId(null);
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-20">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        
        {/* HEADER */}
        <div className="flex justify-between items-end mb-8">
          <div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight">Manage Events</h1>
             <p className="text-gray-500 mt-2">View, edit, and manage all your created events here.</p>
          </div>
        </div>

        {/* TABEL LIST */}
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-8 py-4 bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-6">Event Details</div>
            <div className="col-span-2 text-center">Sold</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-100">
            {myEvents.length > 0 ? (
              myEvents.map((event) => (
                <div key={event.id} className="grid grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-gray-50 transition-colors group">
                  
                  {/* 1. Event Details */}
                  <div className="col-span-6 flex items-center gap-5">
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                       <img src={event.img} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base mb-1 group-hover:text-[#FF6B35] transition-colors">{event.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                           <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                           {event.date}
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="flex items-center gap-1">
                           <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                           {event.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Sold */}
                  <div className="col-span-2 text-center">
                    <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">0 / 100</span>
                  </div>

                  {/* 3. Price */}
                  <div className="col-span-2 text-center text-sm font-bold text-gray-900">
                    {Number(event.price) === 0 ? 'Free' : `Rp ${parseInt(event.price).toLocaleString()}`}
                  </div>

                  {/* 4. Action (Three Dots) */}
                  <div className="col-span-2 flex justify-end relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle menu: kalau diklik lagi, tutup. Kalau klik yg lain, buka yg itu.
                        setActiveMenuId(activeMenuId === event.id ? null : event.id);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                    </button>

                    {/* DROPDOWN MENU (Muncul jika activeMenuId === event.id) */}
                    {activeMenuId === event.id && (
                      <div ref={menuRef} className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 z-50 overflow-hidden animate-fadeIn origin-top-right">
                        <div className="py-1">
                          
                          <button onClick={() => handleView(event.id)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF6B35] transition-colors flex items-center gap-2">
                             <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                             View
                          </button>
                          
                          <button onClick={() => handleEdit(event)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF6B35] transition-colors flex items-center gap-2">
                             <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                             Edit
                          </button>
                          
                          <button onClick={() => handleCopyLink(event.id)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF6B35] transition-colors flex items-center gap-2">
                             <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                             Copy Link
                          </button>

                          <button onClick={() => handleDuplicate(event)} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#FF6B35] transition-colors flex items-center gap-2">
                             <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
                             Copy Event
                          </button>

                          <div className="border-t border-gray-100 mt-1">
                            <button onClick={() => handleDelete(event.id)} className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 font-semibold transition-colors flex items-center gap-2">
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                               Delete
                            </button>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ))
            ) : (
              <div className="p-20 text-center flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                <h3 className="text-gray-900 font-bold text-lg mb-1">No Events Yet</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">It looks like you haven't created any events. Start sharing your amazing events with the world!</p>
                <Link to="/create" className="bg-[#FF6B35] text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition">
                    Create My First Event
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
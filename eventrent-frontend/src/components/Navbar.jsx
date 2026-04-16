import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast'; 

const AnimatedSearchNavbar = ({ events, searchQuery, onSearchSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchQuery || ''); 
  
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setLocalSearch(searchQuery || '');
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredResults = events ? events.filter((event) =>
    event.title.toLowerCase().includes((localSearch || "").toLowerCase())
  ) : [];

  const handleResultClick = (eventTitle) => {
    setLocalSearch(eventTitle); 
    onSearchSelect(eventTitle); 
    setIsOpen(false); 
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onSearchSelect(localSearch); 
      setIsOpen(false);
      if (location.pathname !== '/') {
        navigate('/');
      }
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative group">
        <svg className={`absolute left-3.5 md:left-4 top-2.5 md:top-2.5 w-4 h-4 md:w-5 md:h-5 transition-colors duration-300 ${isOpen ? 'text-[#FF6B35]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <input
          type="text"
          placeholder="Search..."
          value={localSearch}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setLocalSearch(e.target.value);
            setIsOpen(true);
          }} 
          onKeyDown={handleKeyDown}
          className={`w-full pl-10 md:pl-11 pr-4 py-2 md:py-2.5 border rounded-full outline-none text-[13px] md:text-sm transition-all duration-300 bg-gray-50/50
            ${isOpen ? 'border-[#FF6B35] ring-4 ring-orange-50 bg-white' : 'border-gray-200 focus:border-[#FF6B35]'}`}
        />
      </div>

      <div className={`absolute z-50 w-[240px] md:w-full mt-2 left-1/2 md:left-0 -translate-x-1/2 md:translate-x-0 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 origin-top ${isOpen && localSearch ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <ul className="max-h-60 overflow-y-auto py-2">
          {filteredResults.length > 0 ? (
            filteredResults.map((event) => (
              <li 
                key={event.id} 
                onClick={() => handleResultClick(event.title)} 
                className="px-4 py-2.5 text-xs md:text-sm text-gray-600 hover:bg-orange-50 hover:text-[#FF6B35] cursor-pointer flex items-center gap-3"
              >
                <img src={event.img} alt="" className="w-8 h-8 rounded-md object-cover" />
                <span className="font-semibold truncate">{event.title}</span>
              </li>
            ))
          ) : (
            <li className="px-4 py-4 text-center text-xs md:text-sm text-gray-400 italic">No events found</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default function Navbar({ user, events, searchQuery, onSearchSelect, onOpenLogin, onLogout }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // 👇 STATE NOTIFIKASI 👇
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  const profileRef = useRef(null);
  const navigate = useNavigate();

  const isAgentMode = user?.role === 'agent';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotifDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Notifikasi
  useEffect(() => {
    if (user) fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`https://my-event-rent.vercel.app/api/users/${user.id}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRespondNotif = async (notifId, action) => {
    try {
      const res = await fetch(`https://my-event-rent.vercel.app/api/notifications/${notifId}/respond?userId=${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        fetchNotifications(); // Reload data
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Kesalahan jaringan, coba lagi bro.');
    }
  };

  const markAsRead = async (notifId) => {
    try {
      await fetch(`https://my-event-rent.vercel.app/api/notifications/${notifId}/read?userId=${user.id}`, { method: 'PATCH' });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const toggleRole = () => {
    const newRole = isAgentMode ? 'user' : 'agent';
    const updatedUser = { ...user, role: newRole };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setIsDropdownOpen(false);
    window.location.href = isAgentMode ? '/' : '/agent'; 
  };

  return (
    <>
      <nav className={`backdrop-blur-md flex items-center justify-between px-4 md:px-8 py-3 md:py-4 shadow-sm sticky top-0 z-[100] text-left font-sans transition-all duration-300 gap-3 md:gap-6 ${isAgentMode ? 'bg-slate-900 border-b border-slate-800' : 'bg-white/80'}`}>
        
        <div className="flex items-center shrink-0">
          <Link to={isAgentMode ? '/agent' : '/'} className="flex items-center gap-3 select-none cursor-pointer hover:opacity-80 transition-opacity">
            <img src="/logo.jpeg" alt="EventRent Logo" className="w-9 h-9 md:w-10 md:h-10 rounded-lg shadow-sm object-cover" />
            <div className="hidden sm:block">
              <h1 className={`text-xl font-extrabold leading-none tracking-tight ${isAgentMode ? 'text-white' : 'text-[#FF6B35]'}`}>EventRent</h1>
            </div>
          </Link>
        </div>

        <div className="flex-1 max-w-sm md:max-w-md lg:max-w-lg mx-auto flex justify-center">
           {!isAgentMode ? (
             <AnimatedSearchNavbar events={events} searchQuery={searchQuery} onSearchSelect={onSearchSelect} />
           ) : (
             <div className="bg-slate-800/50 px-6 py-2 rounded-full border border-slate-700/50 flex items-center gap-2">
               <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
               <span className="text-white text-[10px] sm:text-xs font-black uppercase tracking-widest">Portal Agen</span>
             </div>
           )}
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {!isAgentMode && (
            <>
              <Link to="/cek-tiket" className="flex items-center justify-center gap-1.5 bg-white border border-gray-200 text-gray-500 w-9 h-9 md:w-auto md:px-5 md:py-2.5 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-wider hover:text-[#FF6B35] hover:border-orange-200 hover:bg-orange-50 transition shadow-sm shrink-0">
                <svg className="w-[16px] h-[16px] md:w-[18px] md:h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
                </svg>
                <span className="hidden md:inline">Cek Tiket</span>
              </Link>
              <Link to="/create" className="flex items-center justify-center gap-1.5 bg-[#FF6B35] text-white w-9 h-9 md:w-auto md:px-5 md:py-2.5 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-orange-600 transition shadow-md shadow-orange-100 shrink-0">
                <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <span className="hidden md:inline">Create</span>
              </Link>
            </>
          )}

          {user ? (
            <>
              {/* 👇 TOMBOL LIKES 👇 */}
              {!isAgentMode && (
                <Link to="/likes" className="flex items-center justify-center w-9 h-9 md:w-[42px] md:h-[42px] border border-gray-100 text-gray-400 bg-white rounded-full hover:bg-orange-50 hover:text-[#FF6B35] hover:border-orange-100 transition shadow-sm shrink-0">
                   <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </Link>
              )}

              {/* 👇 BELL NOTIFIKASI 👇 */}
              <div className="relative shrink-0" ref={notifRef}>
                <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} className={`relative flex items-center justify-center w-9 h-9 md:w-[42px] md:h-[42px] border rounded-full transition shadow-sm shrink-0 ${isAgentMode ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-gray-100 bg-white text-gray-400 hover:bg-orange-50 hover:text-[#FF6B35] hover:border-orange-100'}`}>
                  <svg className="w-5 h-5 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-500 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Notifikasi */}
                <div className={`absolute right-0 top-full mt-3 w-[280px] md:w-[350px] bg-white rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 transform origin-top-right transition-all duration-300 z-[60] flex flex-col overflow-hidden ${showNotifDropdown ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                  
                  {/* Header Notif */}
                  <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                    <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest">Notifikasi</h3>
                    {unreadCount > 0 && <span className="bg-[#FF6B35] text-white px-2 py-0.5 rounded-md text-[9px] font-bold">{unreadCount} Baru</span>}
                  </div>
                  
                  {/* Container List Notifikasi (Scrollable) */}
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(notif => (
                        <div key={notif.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-orange-50/30' : ''}`} onClick={() => !notif.is_read && notif.type !== 'INVITATION_AGENT' && markAsRead(notif.id)}>
                          <p className="font-bold text-gray-900 text-sm mb-1">{notif.title}</p>
                          <p className="text-xs text-gray-500 mb-2 leading-relaxed">{notif.message}</p>
                          
                          {/* Tombol Terima/Tolak Khusus Undangan Agen */}
                          {notif.type === 'INVITATION_AGENT' && !notif.is_read && (
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => handleRespondNotif(notif.id, 'reject')} className="flex-1 bg-red-50 text-red-500 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors">Tolak</button>
                              <button onClick={() => handleRespondNotif(notif.id, 'accept')} className="flex-1 bg-[#FF6B35] text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-md">Terima</button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-gray-400 text-xs font-bold">Belum ada notifikasi bro.</div>
                    )}
                  </div>
                  
                  {/* FOOTER TOMBOL LIHAT SEMUA */}
                  <div className="border-t border-gray-100 bg-gray-50/50 p-2 shrink-0">
                    <button 
                      onClick={() => { 
                        setShowNotifDropdown(false);
                        navigate('/notifications'); 
                      }} 
                      className="block w-full text-center py-2.5 text-[10px] md:text-xs font-black text-[#FF6B35] hover:text-orange-600 uppercase tracking-widest transition-colors rounded-xl hover:bg-orange-50"
                    >
                      Lihat Semua Notifikasi
                    </button>
                  </div>

                </div>
              </div>

              <div className="relative shrink-0" ref={profileRef}>
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className={`flex items-center gap-3 p-0 md:p-1 md:pr-3 rounded-full border hover:bg-gray-50 transition-all shadow-none md:shadow-sm focus:outline-none shrink-0 ${isAgentMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-transparent md:bg-white border-transparent md:border-gray-100'}`}>
                  <div className={`w-9 h-9 rounded-full overflow-hidden border shadow-inner shrink-0 ${isAgentMode ? 'border-slate-600' : 'border-gray-100'}`}>
                    <img src={user.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="text-left hidden md:block">
                    <p className={`text-[11px] font-bold leading-none uppercase tracking-tight max-w-[100px] truncate ${isAgentMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</p>
                    <p className={`text-[9px] font-medium mt-0.5 lowercase max-w-[100px] truncate ${isAgentMode ? 'text-slate-400' : 'text-gray-400'}`}>{user.email}</p>
                  </div>
                  <svg className={`w-3.5 h-3.5 hidden md:block transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''} ${isAgentMode ? 'text-slate-400' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                </button>

                <div className={`absolute right-0 top-full mt-3 w-[220px] md:w-[260px] bg-white rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] border border-gray-100 transform origin-top-right transition-all duration-300 z-[60] overflow-hidden ${isDropdownOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                  <div className="p-2 flex flex-col gap-1">
                    
                    {/* MENU BERBEDA TERGANTUNG ROLE */}
                    {!isAgentMode ? (
                      <>
                        <button onClick={() => { navigate('/'); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:text-[#FF6B35] rounded-xl transition-all group">
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                          HOME
                        </button>
                        <button onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:text-[#FF6B35] rounded-xl transition-all group">
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          MY PROFILE
                        </button>
                        <button onClick={() => { navigate('/manage'); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:text-[#FF6B35] rounded-xl transition-all group">
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          MANAGE EVENTS
                        </button>
                        <button onClick={() => { navigate('/my-tickets'); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:text-[#FF6B35] rounded-xl transition-all group">
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          MY TICKETS
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { navigate('/agent'); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-500 rounded-xl transition-all group">
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                          DAFTAR TUGAS
                        </button>
                        
                        <button onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-500 rounded-xl transition-all group">
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                          PROFIL & REKENING
                        </button>

                        <button onClick={() => { navigate('/agent/history'); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-500 rounded-xl transition-all group">
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          RIWAYAT SCAN
                        </button>

                        {/* 👇 MENU CARI JOB WARNA IKUTAN BIRU 👇 */}
                        <button onClick={() => { navigate('/jobs'); setIsDropdownOpen(false); }} className="flex items-center gap-3 px-4 py-3 text-[11px] font-bold text-gray-600 hover:bg-gray-50 hover:text-blue-500 rounded-xl transition-all group">
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                          CARI JOB (FREELANCE)
                        </button>
                      </>
                    )}

                    <div className="h-px bg-gray-100 my-1 mx-2"></div>
                    
                    <button onClick={toggleRole} className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-gray-900 rounded-xl hover:bg-gray-100 transition-all group">
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-900 transition-colors">
                        {isAgentMode ? 'Mode Pembeli' : 'Mode Agen'}
                      </span>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                    </button>

                    <button 
                      onClick={() => { setIsDropdownOpen(false); setShowLogoutModal(true); }} 
                      className="w-full flex items-center gap-3 px-4 py-3 mt-1 text-[11px] font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all group"
                    >
                      <svg className="w-4 h-4 text-red-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      LOG OUT
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <button onClick={onOpenLogin} className="bg-[#FF6B35] text-white px-6 md:px-8 py-2 md:py-2.5 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-orange-600 transition shadow-md shadow-orange-100 active:scale-95 shrink-0">
              Login
            </button>
          )}
        </div>
      </nav>

      {/* POP-UP CONFIRMATION LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center transform transition-all animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight italic">Keluar Akun?</h3>
            <p className="text-xs text-gray-500 mb-8 font-medium">Yakin nih mau logout dari EventRent sekarang?</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)} 
                className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={() => { 
                  setShowLogoutModal(false); 
                  onLogout(); 
                  navigate('/'); 
                }} 
                className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-red-600 shadow-md shadow-red-200 transition-all active:scale-95"
              >
                Yakin, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
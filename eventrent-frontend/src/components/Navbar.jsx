import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// --- KOMPONEN PENCARIAN (JANGAN DIHAPUS) ---
const AnimatedSearchNavbar = ({ events, onSearchSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

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
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="relative w-1/3" ref={dropdownRef}>
      <div className="relative group">
        <svg className={`absolute left-4 top-2.5 w-5 h-5 transition-colors duration-300 ${isOpen ? 'text-[#FF6B35]' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
        <input
          type="text"
          placeholder="Search for event..."
          value={searchTerm}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-11 pr-4 py-2.5 border rounded-full outline-none text-sm transition-all duration-300 bg-gray-50/50
            ${isOpen ? 'border-[#FF6B35] ring-4 ring-orange-50 bg-white' : 'border-gray-200 focus:border-[#FF6B35]'}`}
        />
      </div>
      {/* Dropdown Result */}
      <div className={`absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 origin-top ${isOpen && searchTerm ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <ul className="max-h-60 overflow-y-auto py-2">
          {filteredResults.length > 0 ? (
            filteredResults.map((event) => (
              <li key={event.id} onClick={() => { onSearchSelect(event.title); setIsOpen(false); setSearchTerm(""); }} className="px-4 py-2.5 text-sm text-gray-600 hover:bg-orange-50 hover:text-[#FF6B35] cursor-pointer flex items-center gap-3">
                <img src={event.img} alt="" className="w-8 h-8 rounded-md object-cover" />
                <span className="font-semibold">{event.title}</span>
              </li>
            ))
          ) : (
            <li className="px-4 py-4 text-center text-sm text-gray-400 italic">No events found</li>
          )}
        </ul>
      </div>
    </div>
  );
};

// --- KOMPONEN UTAMA NAVBAR ---
export default function Navbar({ user, events, onSearchSelect, onOpenLogin, onLogout }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const profileRef = useRef(null);

  // Tutup dropdown kalau klik di luar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-white flex items-center justify-between px-8 py-4 shadow-sm relative z-50">
      
      {/* LOGO */}
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-[#FF6B35] rounded-full shadow-inner flex items-center justify-center">
             <div className="w-6 h-6 bg-white/20 rounded-full blur-sm"></div>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#FF6B35] leading-none tracking-tight">EventRent</h1>
          </div>
        </Link>
      </div>

      {/* SEARCH BAR */}
      <AnimatedSearchNavbar events={events} onSearchSelect={onSearchSelect} />

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-3">
        
        {/* Tombol Create (Selalu Muncul) */}
        <Link to="/create" className="flex items-center gap-1.5 bg-[#FF6B35] text-white px-5 py-2.5 rounded-full font-medium text-sm hover:bg-orange-600 transition shadow-md shadow-orange-200">
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Create
        </Link>

        {/* LOGIKA GANTI TAMPILAN SESUAI LOGIN */}
        {user ? (
          <>
            {/* 1. Tombol Likes (Hanya muncul kalau login) */}
            <Link to="/likes" className="flex items-center justify-center w-[42px] h-[42px] border border-[#FF6B35] text-[#FF6B35] bg-white rounded-full hover:bg-orange-50 transition shadow-sm">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
            </Link>

            {/* 2. Tombol Profil dengan Dropdown */}
            <div className="relative" ref={profileRef}>
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-[#FF6B35] text-white pl-2 pr-4 py-1.5 rounded-full hover:bg-orange-600 transition shadow-md cursor-pointer"
              >
                {/* Foto Profil dari Google */}
                <img 
                  src={user.picture || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border-2 border-white object-cover bg-white" 
                />
                <span className="font-medium text-sm max-w-[80px] truncate">{user.name.split(' ')[0]}</span>
              </button>

              {/* ISI DROPDOWN (Menu sesuai gambar 3) */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] overflow-hidden border border-gray-100 transform origin-top-right transition-all animate-fadeIn z-[60]">
                  
                  {/* Header Dropdown (Warna Peach) */}
                  <div className="bg-[#FFE4D6] p-5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#FF6B35] rounded-full flex items-center justify-center text-white text-xl font-bold border-2 border-white shadow-sm">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-gray-800 truncate text-base">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* List Menu */}
                  <div className="p-2">
                    <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                      My Profile
                    </Link>
                    <Link to="/manage" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                      Manage My Event
                    </Link>
                    <Link to="/tickets" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-xl transition-colors">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                      Tickets
                    </Link>
                  </div>

                  {/* Tombol Logout */}
                  <div className="p-2 border-t border-gray-100">
                    <button 
                      onClick={onLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-[#FF6B35] hover:bg-orange-50 rounded-xl transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                      Log Out
                    </button>
                  </div>

                </div>
              )}
            </div>
          </>
        ) : (
          /* 3. Tombol Login Biasa (Kalau belum login) */
          <button 
            onClick={onOpenLogin}
            className="flex items-center gap-1.5 bg-[#FF6B35] text-white px-5 py-2.5 rounded-full font-medium text-sm hover:bg-orange-600 transition shadow-md shadow-orange-200"
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            Login
          </button>
        )}

      </div>
    </nav>
  );
}
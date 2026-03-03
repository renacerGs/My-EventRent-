import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ showCreateAndFav = true, events = [], onSearchSelect, onOpenLogin }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Filter event berdasarkan input
  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Menutup dropdown jika klik di luar area search
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (title) => {
    setSearchTerm(title);
    setShowDropdown(false);
    if (onSearchSelect) onSearchSelect(title);
  };

  return (
    <nav className="bg-white flex items-center justify-between px-8 py-4 shadow-sm relative z-50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-[#FF6B35] rounded-full shadow-inner flex items-center justify-center">
          <div className="w-6 h-6 bg-white/20 rounded-full blur-sm"></div>
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-extrabold text-[#FF6B35] leading-none tracking-tight">EventRent</h1>
          <span className="text-[10px] text-gray-400 font-medium">lorem ipsum</span>
        </div>
      </Link>

      {/* Animated Select Search Bar */}
      <div className="relative w-1/3" ref={dropdownRef}>
        <div className="relative">
          <svg className="absolute left-4 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search for event / category" 
            className="w-full pl-11 pr-4 py-2.5 border border-gray-100 rounded-full focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-50 text-sm text-gray-600 bg-white transition-all shadow-sm" 
          />
        </div>

        {/* Dropdown Animated */}
        {showDropdown && searchTerm.length > 0 && (
          <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
            {filteredEvents.length > 0 ? (
              <div className="max-h-60 overflow-y-auto">
                {filteredEvents.map((event) => (
                  <div 
                    key={event.id}
                    onClick={() => handleSelect(event.title)}
                    className="px-5 py-3 hover:bg-orange-50 cursor-pointer flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <span className="text-orange-400 text-xs">🔍</span>
                    <span className="text-sm text-gray-700 font-medium">{event.title}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-4 text-sm text-gray-400 text-center">Event tidak ditemukan</div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        {showCreateAndFav && (
          <>
            <Link 
              to="/create" 
              className="flex items-center gap-2 bg-[#FF6B35] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition shadow-lg shadow-orange-100"
            >
              <div className="bg-white/20 rounded-full p-0.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
              </div>
              Create
            </Link>

            {/* Tombol Hati - Diarahkan ke /likes */}
            <Link 
              to="/likes" 
              className="flex items-center justify-center w-[42px] h-[42px] border border-gray-100 text-[#ffffff] bg-[#FF6B35] rounded-xl hover:bg-orange-600 transition shadow-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </Link>
          </>
        )}

        <button 
          onClick={onOpenLogin}
          className="flex items-center gap-2 bg-[#FF6B35] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition shadow-lg shadow-orange-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
          Login
        </button>
      </div>
    </nav>
  );
}
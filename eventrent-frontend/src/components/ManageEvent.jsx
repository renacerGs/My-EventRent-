import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import Navbar from './Navbar';

export default function ManageEvent() {
  // Menangkap data (state) yang dikirim dari halaman CreateEvent
  const location = useLocation();
  const newEvent = location.state?.newEvent; // Data event baru Anda ada di sini!

  return (
    <div className="bg-white min-h-screen font-sans flex flex-col">
      {/* Kita pakai navbar tanpa tombol create/love agar rapi */}
      {/* <Navbar showCreateAndFav={false} /> */}

      <div className="flex flex-1 overflow-hidden border-t border-gray-200">
        
        {/* SIDEBAR KIRI */}
        <aside className="w-[280px] bg-gray-100 flex flex-col border-r border-gray-200">
          <div className="p-8">
            <h2 className="text-2xl font-extrabold text-[#1C2331]">Manage Event</h2>
          </div>
          
          <nav className="flex flex-col mt-2">
            {/* Menu 1 (Aktif) */}
            <div className="flex items-center justify-between px-8 py-4 bg-white border-l-4 border-white shadow-sm cursor-pointer">
              <span className="font-semibold text-gray-800">Manage Event</span>
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
            </div>
            
            {/* Menu 2 */}
            <div className="flex items-center justify-between px-8 py-4 text-gray-500 hover:bg-white/50 transition cursor-pointer">
              <span className="font-medium">Tiket</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
            </div>
            
            {/* Menu 3 */}
            <div className="flex items-center justify-between px-8 py-4 text-gray-500 hover:bg-white/50 transition cursor-pointer">
              <span className="font-medium">Profile</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
          </nav>
        </aside>

        {/* KONTEN KANAN */}
        <main className="flex-1 p-8 bg-white">
          
          {/* Top Bar (Search & Button) */}
          {/* <div className="flex justify-between items-center mb-6 gap-4">
            <div className="relative w-1/2 max-w-md">
              <svg className="absolute left-4 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <input type="text" placeholder="Search for event" className="w-full pl-11 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:border-[#FF6B35] text-sm" />
            </div>
            
            <Link to="/create" className="flex items-center gap-1.5 bg-[#FF6B35] text-white px-5 py-2 rounded-full font-medium text-sm hover:bg-orange-600 transition shadow-md">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Create Event
            </Link>
          </div> */}

          {/* Table / List Event */}
          <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
            {/* Header Table */}
            <div className="bg-gray-300 flex text-sm font-bold text-gray-800 px-6 py-3">
              <div className="flex-1">Event</div>
              <div className="w-32 text-center">Sold</div>
              <div className="w-32 text-center">Gross</div>
              <div className="w-32 text-center">Status</div>
              <div className="w-10"></div>
            </div>

            {/* Isi Table (Data dari form akan muncul di sini) */}
            {newEvent ? (
              <div className="flex items-center bg-white border-t border-gray-200 px-6 py-4 hover:bg-gray-50 transition">
                {/* Kolom Event (Gambar & Info) */}
                <div className="flex-1 flex items-center gap-4">
                  <img src={newEvent.img} alt={newEvent.title} className="w-32 h-20 object-cover rounded-lg shadow-sm" />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base mb-1">{newEvent.title}</h3>
                    <div className="flex items-center text-xs text-gray-500 mb-1">
                      <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      {newEvent.date} - {newEvent.time}
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      {newEvent.location}
                    </div>
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] uppercase font-bold rounded border border-gray-200">
                      {newEvent.category || 'Event'}
                    </span>
                  </div>
                </div>
                
                {/* Kolom Status & Harga */}
                <div className="w-32 text-center text-sm font-semibold text-gray-700">0/100</div>
                <div className="w-32 text-center text-sm font-semibold text-gray-700">Rp {newEvent.price || '0'}</div>
                <div className="w-32 flex justify-center items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                  <span className="text-xs font-bold text-gray-700">ON SALE</span>
                </div>
                
                {/* Kolom Titik Tiga */}
                <div className="w-10 flex justify-end">
                  <button className="text-gray-400 hover:text-gray-800">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Belum ada event yang dibuat.
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
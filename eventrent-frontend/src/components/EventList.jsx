import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// --- FUNGSI FORMAT TANGGAL CANTIK ---
const formatPrettyDate = (dateString) => {
  if (!dateString) return '';
  try {
    let rawDate = dateString;
    let timePart = '';

    if (dateString.includes(' - ')) {
      const parts = dateString.split(' - ');
      rawDate = parts[0].trim();
      timePart = ` - ${parts[1]}`;
    }

    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) return dateString;

    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(dateObj);

    return `${formattedDate}${timePart}`;
  } catch (error) {
    return dateString;
  }
};

// --- FUNGSI CEK WAKTU YANG SUPER KETAT ---
const isEventPassed = (dateStr) => {
  if (!dateStr) return false;
  try {
    // Contoh dateStr asli dari backend lu: "Tue, 01 Sep 2026 - 07.00 PM AM" (ada 'AM' nyangkut)
    // 1. Hapus nama hari (contoh: "Tue, ")
    let cleanStr = dateStr;
    if (cleanStr.includes(',')) {
      cleanStr = cleanStr.split(',')[1].trim(); 
    }
    
    // 2. Ganti spasi strip spasi (" - ") jadi spasi biasa
    cleanStr = cleanStr.replace(' - ', ' ');

    // 3. Bersihin sisa 'AM' atau 'WIB' yang dobel
    cleanStr = cleanStr.replace('WIB', '').replace(' AM', '').replace(' PM AM', ' PM').replace(' AM AM', ' AM').trim();

    // 4. Ubah titik jadi titik dua di bagian jam (07.00 -> 07:00)
    cleanStr = cleanStr.replace(/(\d{2})\.(\d{2})/, '$1:$2');

    const eventDate = new Date(cleanStr);
    
    if (isNaN(eventDate.getTime())) return false; // Kalo tetep gak bisa dibaca, anggap blm basi

    const now = new Date(); 
    return eventDate < now; 
  } catch (error) {
    return false;
  }
};

export default function EventList({ events, searchQuery }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Music', 'Food', 'Tech', 'Religious', 'Arts', 'Sports'];

  // FILTER: Cuma tampilin yang cocok kategori/search DAN BELUM BASI
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (activeCategory === 'All' || event.category === activeCategory) &&
    !isEventPassed(event.date) 
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 font-sans">
      
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Browse by category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-2xl text-xs font-bold transition-all ${activeCategory === cat ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {filteredEvents.length > 0 ? (
          filteredEvents.map(event => (
            <Link 
              to={`/event/${event.id}`} 
              key={event.id} 
              className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group flex flex-col"
            >
              <div className="relative h-44 overflow-hidden bg-gray-100">
                <img src={event.img} alt={event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-black text-gray-900 shadow-md">
                   {Number(event.price) === 0 ? 'FREE' : `Rp ${parseInt(event.price).toLocaleString()}`}
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-md font-bold text-gray-900 mb-4 group-hover:text-[#FF6B35] transition-colors line-clamp-2">
                  {event.title}
                </h3>
                
                <div className="space-y-2 mb-5 flex-1">
                  <div className="flex items-center text-[12px] text-gray-500 font-medium">
                    <svg className="w-4 h-4 mr-2 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="truncate">{formatPrettyDate(event.date)}</span>
                  </div>
                  <div className="flex items-center text-[12px] text-gray-500 font-medium">
                    <svg className="w-4 h-4 mr-2 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between">
                  <span className="inline-block px-3 py-1 bg-orange-50 text-[#FF6B35] rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {event.category || 'Event'}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                     {event.stock > 0 ? 'Available' : 'Sold Out'}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-gray-400 font-bold bg-white rounded-3xl border border-gray-100">
            No active events found.
          </div>
        )}
      </div>
    </main>
  );
}
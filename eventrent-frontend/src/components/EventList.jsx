import React, { useState, useEffect, useRef } from 'react'; 
import { Link } from 'react-router-dom';

const displayDate = (event) => {
  if (event.date_start && event.date_end && event.date_start !== event.date_end) {
    return `${event.date_start} - ${event.date_end}`;
  }
  if (event.date_start) return event.date_start;
  if (event.date_old) return event.date_old; 
  return '-';
};

const displayLocation = (event) => {
  if (event.city && event.name_place) return `${event.name_place}, ${event.city}`;
  if (event.city) return event.city;
  if (event.place) return event.place;
  if (event.old_location) return event.old_location; 
  return 'Multiple / TBD';
};

const isEventPassed = (event) => {
  const dateToCheck = event.date_end || event.date_start || event.date_old;
  if (!dateToCheck) return false;
  
  try {
    const eventDate = new Date(dateToCheck);
    if (isNaN(eventDate.getTime())) return false; 
    
    const now = new Date(); 
    now.setHours(0, 0, 0, 0); 
    return eventDate < now; 
  } catch (error) {
    return false;
  }
};

export default function EventList({ events, searchQuery, onClearSearch }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Music', 'Food', 'Tech', 'Religious', 'Arts', 'Sports'];
  
  // --- PERBAIKAN: BENDERA PENANDA (Flag) ---
  const isCategoryClicked = useRef(false);

  // LOGIC 1: DETEKSI KATEGORI OTOMATIS
  useEffect(() => {
    // Kalau Search Bar kosong gara-gara kita klik tombol Kategori, SKIP LOGIC INI!
    if (isCategoryClicked.current) {
      isCategoryClicked.current = false; // Turunin benderanya lagi
      return; 
    }

    // Kalau user nge-HAPUS teks manual pakai backspace sampai kosong -> Balik ke All
    if (!searchQuery || searchQuery.trim() === '') {
      setActiveCategory('All');
      return; 
    }

    // Jika ada teks, baru jalankan deteksi pinter
    const queryLower = searchQuery.trim().toLowerCase();
    const matchedEvent = events.find(e => e.title.toLowerCase().includes(queryLower));
    
    if (matchedEvent && matchedEvent.category) {
      if (categories.includes(matchedEvent.category)) {
        setActiveCategory(matchedEvent.category);
      } else {
        setActiveCategory('All');
      }
    } else {
      const matchedCat = categories.find(c => 
        c !== 'All' && (c.toLowerCase() === queryLower || c.toLowerCase().includes(queryLower))
      );
      if (matchedCat) {
        setActiveCategory(matchedCat);
      } else {
        setActiveCategory('All');
      }
    }
  }, [searchQuery, events]); 

  // LOGIC 2: KLIK KATEGORI SECARA MANUAL
  const handleCategoryClick = (cat) => {
    // Kalau kotak search ada isinya, kita naikkan bendera sebelum dihapus
    if (searchQuery && searchQuery.trim() !== '') {
      isCategoryClicked.current = true; 
    }
    
    // Ubah ke kategori yang diklik
    setActiveCategory(cat); 
    
    // Bersihkan search bar
    if (onClearSearch) {
      onClearSearch(''); 
    }
  };

  // LOGIC 3: FILTER CARD EVENT
  const filteredEvents = events.filter(event => {
    if (isEventPassed(event)) return false;

    if (searchQuery && searchQuery.trim() !== '') {
      const queryLower = searchQuery.trim().toLowerCase();
      return event.title.toLowerCase().includes(queryLower) || 
             (event.category && event.category.toLowerCase().includes(queryLower));
    } 
    
    if (activeCategory === 'All') return true;
    return event.category === activeCategory;
  });

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 font-sans">
      
      <div className="mb-10">
        {/* 👇👇 JURUS UX AFFORDANCE DI SINI 👇👇 */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">Browse by category</h2>
          
          {/* Tulisan "Geser" yang goyang-goyang, CUMA MUNCUL DI HP (sm:hidden) */}
          <div className="sm:hidden flex items-center gap-1.5 text-[10px] font-black text-[#FF6B35] uppercase tracking-widest animate-pulse">
            <span>Geser</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
            </svg>
          </div>
        </div>
        {/* 👆👆 BATAS JURUS UX 👆👆 */}
        
        <div className="flex flex-nowrap sm:flex-wrap overflow-x-auto gap-2 pb-3 sm:pb-0 snap-x pr-8 sm:pr-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => handleCategoryClick(cat)} 
              className={`shrink-0 snap-start px-5 py-2 rounded-2xl text-xs font-bold transition-all ${activeCategory === cat ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* SISA KODINGAN CARD EVENT TETAP SAMA */}
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
                   {Number(event.price) === 0 ? 'FREE' : `Rp ${parseInt(event.price).toLocaleString('id-ID')}`}
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-md font-bold text-gray-900 mb-4 group-hover:text-[#FF6B35] transition-colors line-clamp-2">
                  {event.title}
                </h3>
                
                <div className="space-y-2 mb-5 flex-1">
                  <div className="flex items-center text-[12px] text-gray-500 font-medium">
                    <svg className="w-4 h-4 mr-2 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="truncate">{displayDate(event)}</span>
                  </div>
                  <div className="flex items-center text-[12px] text-gray-500 font-medium">
                    <svg className="w-4 h-4 mr-2 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="truncate">{displayLocation(event)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between">
                  <span className="inline-block px-3 py-1 bg-orange-50 text-[#FF6B35] rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {event.category || 'Event'}
                  </span>
                  
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${Number(event.stock) > 0 ? 'text-[#FF6B35]' : 'text-gray-400'}`}>
                     {Number(event.stock) > 0 ? 'Beli Tiket' : 'Sold Out'}
                  </span>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-gray-400 font-bold bg-white rounded-3xl border border-gray-100">
            Tidak ada event yang ditemukan.
          </div>
        )}
      </div>
    </main>
  );
}
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function EventList({ events, searchQuery }) {
  const [activeCategory, setActiveCategory] = useState('All');

  // <--- DISINI PERUBAHANNYA: Tambahkan 'Arts' dan 'Sports' biar lengkap
  const categories = [
    { id: 'All', label: 'All' },
    { id: 'Music', label: 'Music' },
    { id: 'Food', label: 'Food' },
    { id: 'Tech', label: 'Tech' },
    { id: 'Religious', label: 'Religious' },
    { id: 'Arts', label: 'Arts' },   // <--- Baru
    { id: 'Sports', label: 'Sports' } // <--- Baru
  ];

  // LOGIKA FILTERING (Gabungan Search + Category)
  const filteredEvents = events.filter((event) => {
    // 1. Filter by Category
    const matchCategory = activeCategory === 'All' || event.category === activeCategory;
    
    // 2. Filter by Search Query (dari Navbar)
    const matchSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        event.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchCategory && matchSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20">
      
      {/* 1. CATEGORY TABS */}
      <div className="flex items-center gap-3 overflow-x-auto pb-6 scrollbar-hide mb-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border
              ${activeCategory === cat.id 
                ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-lg shadow-orange-100' 
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#FF6B35] hover:text-[#FF6B35]'
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* 2. EVENT CARDS GRID */}
      {filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <Link to={`/event/${event.id}`} key={event.id} className="group bg-white rounded-[24px] border border-gray-100 overflow-hidden hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 hover:-translate-y-1">
              
              {/* Image Container */}
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={event.img} 
                  alt={event.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-xs font-bold text-[#FF6B35] uppercase tracking-wider shadow-sm">
                  {event.category}
                </div>
                {/* Price Tag Overlay */}
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-white text-xs font-bold">
                  {Number(event.price) === 0 ? 'Free' : `Rp ${parseInt(event.price).toLocaleString()}`}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">
                  <span className="text-[#FF6B35]">{event.date}</span>
                </div>
                
                <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight group-hover:text-[#FF6B35] transition-colors line-clamp-2">
                  {event.title}
                </h3>
                
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                  {event.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                   <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      <span className="truncate max-w-[150px]">{event.location}</span>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#FF6B35] group-hover:text-white transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                   </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-block p-4 rounded-full bg-orange-50 mb-4">
            <svg className="w-10 h-10 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Events Found</h3>
          <p className="text-gray-500 text-sm mt-1">Try changing the category or search keyword.</p>
        </div>
      )}
    </div>
  );
}
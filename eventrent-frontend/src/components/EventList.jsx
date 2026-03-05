import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function EventList({ events, searchQuery }) {
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Kategori ditambah Arts & Sports
  const categories = ['All', 'Music', 'Food', 'Tech', 'Religious', 'Arts', 'Sports'];

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
    (activeCategory === 'All' || event.category === activeCategory)
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 font-sans">
      
      {/* BAGIAN FILTER KATEGORI */}
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

      {/* DAFTAR EVENT (CARD GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        {filteredEvents.map(event => (
          <Link 
            to={`/event/${event.id}`} 
            key={event.id} 
            className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group flex flex-col"
          >
            {/* 1. BAGIAN GAMBAR & HARGA (Di pojok kanan bawah gambar) */}
            <div className="relative h-44 overflow-hidden bg-gray-100">
              <img 
                src={event.img} 
                alt={event.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
              
              {/* LABEL HARGA (Absolute Positioning) */}
              <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl text-xs font-black text-gray-900 shadow-md">
                 {Number(event.price) === 0 ? 'FREE' : `Rp ${parseInt(event.price).toLocaleString()}`}
              </div>
            </div>

            {/* 2. BAGIAN TEXT CONTENT */}
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-md font-bold text-gray-900 mb-4 group-hover:text-[#FF6B35] transition-colors line-clamp-2">
                {event.title}
              </h3>
              
              <div className="space-y-2 mb-5 flex-1">
                <div className="flex items-center text-[12px] text-gray-500 font-medium">
                  <svg className="w-4 h-4 mr-2 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="truncate">{event.date}</span>
                </div>
                <div className="flex items-center text-[12px] text-gray-500 font-medium">
                  <svg className="w-4 h-4 mr-2 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="truncate">{event.location}</span>
                </div>
              </div>

              {/* 3. BAGIAN KATEGORI DI BAWAH (Dengan garis pemisah) */}
              <div className="pt-4 border-t border-gray-100 mt-auto flex items-center justify-between">
                <span className="inline-block px-3 py-1 bg-orange-50 text-[#FF6B35] rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {event.category || 'Event'}
                </span>
                
                {/* Info Stok Opsional (Bisa dihapus kalau kepanjangan) */}
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                   {event.stock > 0 ? 'Available' : 'Sold Out'}
                </span>
              </div>

            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
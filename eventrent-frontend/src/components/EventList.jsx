import React, { useState, useEffect } from 'react'; 
import { Link } from 'react-router-dom';

// Fungsi merakit teks tanggal
const displayDate = (event) => {
  if (event.date_start && event.date_end && event.date_start !== event.date_end) {
    return `${event.date_start} - ${event.date_end}`;
  }
  if (event.date_start) return event.date_start;
  if (event.date_old) return event.date_old; // Fallback ke data event lama
  return '-';
};

// Fungsi merakit teks lokasi
const displayLocation = (event) => {
  if (event.city && event.name_place) return `${event.name_place}, ${event.city}`;
  if (event.city) return event.city;
  if (event.place) return event.place;
  if (event.old_location) return event.old_location; // Fallback ke data event lama
  return 'Multiple / TBD';
};

// Cek event sudah lewat atau belum (Cek dari tanggal selesai, atau tanggal mulai)
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

  useEffect(() => {
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      const matchedCat = categories.find(c => 
        c !== 'All' && (c.toLowerCase() === queryLower || queryLower.includes(c.toLowerCase()))
      );
      
      if (matchedCat) {
        setActiveCategory(matchedCat);
      } else {
        const matchedEvent = events.find(e => e.title.toLowerCase().includes(queryLower));
        if (matchedEvent && matchedEvent.category) {
          setActiveCategory(matchedEvent.category);
        }
      }
    } else {
      setActiveCategory('All'); 
    }
  }, [searchQuery, events]); 

  const handleCategoryClick = (cat) => {
    setActiveCategory(cat);
    if (onClearSearch) onClearSearch(); 
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes((searchQuery || "").toLowerCase()) &&
    (activeCategory === 'All' || event.category === activeCategory) &&
    !isEventPassed(event) 
  );

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 font-sans">
      
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Browse by category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button 
              key={cat} 
              onClick={() => handleCategoryClick(cat)} 
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
                  
                  {/* Status tiket dinamis ngecek total_stock dari backend */}
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${Number(event.stock) > 0 ? 'text-[#FF6B35]' : 'text-gray-400'}`}>
                     {Number(event.stock) > 0 ? 'Beli Tiket' : 'Sold Out'}
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
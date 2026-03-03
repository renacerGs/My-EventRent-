import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Likes() {
  const navigate = useNavigate();
  const [likedEvents, setLikedEvents] = useState([]);

  // Ambil data dari localStorage saat komponen dimuat
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('likedEvents')) || [];
    setLikedEvents(data);
  }, []);

  // Fungsi untuk menghapus like langsung dari halaman ini
  const handleRemoveLike = (id) => {
    const updatedLikes = likedEvents.filter(event => String(event.id) !== String(id));
    setLikedEvents(updatedLikes);
    localStorage.setItem('likedEvents', JSON.stringify(updatedLikes));
    // Trigger event agar halaman lain (seperti EventDetail) tahu ada perubahan
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div className="min-h-screen bg-white pt-10 px-8 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Tombol Back */}
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 p-2 -ml-2 hover:bg-gray-50 rounded-full transition-all group"
        >
          <svg className="w-8 h-8 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <h1 className="text-3xl font-extrabold mb-8 text-black tracking-tight">Likes</h1>

        <div className="space-y-4">
          {likedEvents.length > 0 ? (
            likedEvents.map((event) => (
              <div 
                key={event.id} 
                className="flex flex-col md:flex-row items-center gap-4 p-4 border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow bg-white relative group"
              >
                {/* Info Event */}
                <div className="flex-1 w-full">
                  <h3 
                    className="text-lg font-bold text-gray-900 leading-tight cursor-pointer"
                    onClick={() => navigate(`/event/${event.id}`)}
                  >
                    {event.title}
                  </h3>
                  <p className="text-[#FF6B35] text-xs font-bold mt-2 uppercase tracking-wide">
                    {event.date}
                  </p>
                  <p className="text-gray-400 text-[11px] mt-1 leading-relaxed">
                    {event.location}
                  </p>
                  <p className="text-gray-600 text-[11px] mt-2 font-black uppercase">
                    Rp {event.price}
                  </p>
                </div>

                {/* Gambar & Action Buttons */}
                <div className="relative w-full md:w-48 h-32 flex-shrink-0 overflow-hidden rounded-xl">
                  <img 
                    src={event.img || event.image} 
                    alt={event.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    {/* Button Unlike */}
                    <button 
                      onClick={() => handleRemoveLike(event.id)}
                      className="bg-white p-2 rounded-full shadow-lg text-red-500 hover:scale-110 active:scale-95 transition-all"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                      </svg>
                    </button>
                    <button className="bg-white p-2 rounded-full shadow-lg text-gray-400 hover:scale-110 active:scale-95 transition-all">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 text-gray-400 font-medium">
              No liked events yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
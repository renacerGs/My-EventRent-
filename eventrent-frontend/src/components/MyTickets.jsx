import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function MyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/'); return; }

    fetch(`http://localhost:3000/api/tickets/my?userId=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setTickets(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading tickets...</div>;

  return (
    <div className="bg-gray-50 min-h-screen pb-20 pt-10 font-sans">
      <div className="max-w-5xl mx-auto px-6">
        <h1 className="text-3xl font-black text-gray-900 mb-2">My Tickets</h1>
        <p className="text-gray-500 mb-8">See all the events you have joined.</p>

        {tickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tickets.map((t) => (
              <div key={t.ticket_id} className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex gap-5 hover:shadow-md transition-shadow">
                {/* Gambar Kecil */}
                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden">
                  <img src={t.img} alt={t.title} className="w-full h-full object-cover" />
                </div>
                
                {/* Info Tiket */}
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1 line-clamp-1">{t.title}</h3>
                  <p className="text-xs text-[#FF6B35] font-bold mb-2">{t.date}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                    {t.location}
                  </div>

                  <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                    <div>
                      <span className="block text-[10px] text-gray-400 uppercase font-bold">Total Paid</span>
                      <span className="text-sm font-black text-gray-900">
                         {Number(t.total_price) === 0 ? 'Free' : `Rp ${parseInt(t.total_price).toLocaleString()}`}
                      </span>
                    </div>
                    
                    {/* Fake QR Code Button */}
                    <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-gray-700 transition">
                      Show QR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="inline-block p-4 rounded-full bg-orange-50 mb-4">
              <svg className="w-10 h-10 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Tickets Yet</h3>
            <p className="text-gray-500 text-sm mt-1 mb-6">You haven't purchased any tickets yet.</p>
            <Link to="/" className="bg-[#FF6B35] text-white px-6 py-3 rounded-full font-bold text-sm shadow-lg hover:bg-[#e05a2b] transition">
              Explore Events
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
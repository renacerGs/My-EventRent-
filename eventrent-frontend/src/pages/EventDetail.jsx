import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function EventDetail({ events }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  
  // STATE BARU
  const [isBuying, setIsBuying] = useState(false);
  const [ticketQty, setTicketQty] = useState(1); // Default beli 1

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (events && events.length > 0) {
      const found = events.find(e => String(e.id) === String(id));
      if (found) {
        setEvent(found);
        
        // --- BARU: HIT API VIEW COUNTER ---
        fetch(`http://localhost:3000/api/events/${id}/view`, { method: 'POST' })
          .catch(err => console.error("Gagal update view:", err));
        // ---------------------------------

        const savedLikes = JSON.parse(localStorage.getItem('likedEvents')) || [];
        const alreadyLiked = savedLikes.some(item => String(item.id) === String(found.id));
        setIsLiked(alreadyLiked);
      }
    }
    window.scrollTo(0, 0);
  }, [id, events]);

  const handleLikeClick = () => {
    if (!event) return;
    const savedLikes = JSON.parse(localStorage.getItem('likedEvents')) || [];
    let updatedLikes;
    if (!isLiked) {
      updatedLikes = [...savedLikes, event];
      setIsLiked(true);
    } else {
      updatedLikes = savedLikes.filter(item => String(item.id) !== String(event.id));
      setIsLiked(false);
    }
    localStorage.setItem('likedEvents', JSON.stringify(updatedLikes));
    window.dispatchEvent(new Event("storage"));
  };

  // --- LOGIKA TAMBAH/KURANG TIKET ---
  const increaseQty = () => {
    if (ticketQty < event.stock) {
      setTicketQty(prev => prev + 1);
    }
  };

  const decreaseQty = () => {
    if (ticketQty > 1) {
      setTicketQty(prev => prev - 1);
    }
  };

  // --- LOGIKA BELI TIKET ---
  const handleBuyTicket = async () => {
    if (!user) {
      alert("Please login first to buy tickets!");
      return;
    }

    const totalPrice = Number(event.price) * ticketQty;
    const confirmMsg = `Buy ${ticketQty} ticket(s) for "${event.title}"?\nTotal: Rp ${totalPrice.toLocaleString()}`;

    if (window.confirm(confirmMsg)) {
      setIsBuying(true);
      try {
        const res = await fetch('http://localhost:3000/api/tickets/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: user.id, 
            eventId: event.id, 
            quantity: ticketQty // <--- Kirim Jumlah
          })
        });
        
        if (res.ok) {
          alert("Purchase Successful! See you at the event! 🎉");
          navigate('/my-tickets');
        } else {
          const err = await res.json();
          alert(err.message || "Failed to buy ticket");
        }
      } catch (error) {
        console.error(error);
        alert("Something went wrong");
      } finally {
        setIsBuying(false);
      }
    }
  };

  if (!event) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mb-4"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      
      {/* HERO IMAGE */}
      <div className="relative w-full h-[450px] bg-gray-900">
        <img src={event.img} className="w-full h-full object-cover opacity-80" alt="Banner" />
        <button onClick={() => navigate(-1)} className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-gray-900 transition-all z-20">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 relative z-10 -mt-32">
        <div className="bg-white rounded-[30px] shadow-xl p-8 md:p-12 flex flex-col lg:flex-row gap-12 min-h-[400px]">
          
          {/* LEFT: DETAIL */}
          <div className="flex-1">
            <span className="inline-block bg-[#FF6B35] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-5">{event.category}</span>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight mb-8">{event.title}</h1>
            
            <div className="space-y-5 mb-10">
              <div className="flex items-center gap-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-base font-bold text-gray-800">{event.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <p className="text-base font-bold text-gray-800">{event.location}</p>
              </div>
              <div className="flex items-center gap-4">
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <p className="text-base font-bold text-gray-800">{event.author || 'EventRent Official'}</p>
              </div>
              {event.phone && (
                <div className="flex items-center gap-4">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100 text-green-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.025-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.017-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                  </div>
                  <p className="text-base font-bold text-gray-800 tracking-wide">{event.phone}</p>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 mb-3">About this event</h3>
              <p className="text-gray-500 leading-relaxed whitespace-pre-line">{event.description || "No description provided."}</p>
            </div>
          </div>

          {/* RIGHT: TICKET CARD */}
          <div className="w-full lg:w-[320px] flex flex-col items-end gap-6">
            
            <button onClick={handleLikeClick} className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all ${isLiked ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-[#FF6B35] hover:text-[#FF6B35]'}`}>
              <svg className={`w-6 h-6 ${isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>

            <div className="w-full bg-gray-100/80 rounded-[24px] p-6 shadow-sm border border-gray-100">
              <div className="mb-4">
                 <span className="block text-gray-500 text-xs font-bold uppercase mb-1">Price per Ticket</span>
                 <span className="text-2xl font-black text-gray-900">
                    {Number(event.price) === 0 ? 'Free' : `Rp ${parseInt(event.price).toLocaleString()}`}
                 </span>
              </div>

              {/* TICKET COUNTER (BARU) */}
              {Number(event.stock) > 0 && (
                <div className="flex items-center justify-between bg-white rounded-xl p-2 mb-4 shadow-sm">
                  <button onClick={decreaseQty} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 font-bold text-lg disabled:opacity-50" disabled={ticketQty <= 1}>-</button>
                  <span className="font-bold text-gray-900 text-lg w-8 text-center">{ticketQty}</span>
                  <button onClick={increaseQty} className="w-8 h-8 flex items-center justify-center bg-[#FF6B35] rounded-lg text-white hover:bg-orange-600 font-bold text-lg disabled:opacity-50 disabled:bg-gray-300" disabled={ticketQty >= event.stock}>+</button>
                </div>
              )}

              {/* TOTAL PRICE DISPLAY */}
              {Number(event.stock) > 0 && (
                <div className="flex justify-between items-center mb-6 pt-4 border-t border-gray-200">
                   <span className="text-sm font-bold text-gray-500">Total:</span>
                   <span className="text-lg font-black text-[#FF6B35]">
                      Rp {(Number(event.price) * ticketQty).toLocaleString()}
                   </span>
                </div>
              )}

              <div className="text-right text-xs font-bold text-gray-500 mb-2">
                Available: <span className="text-[#FF6B35]">{event.stock || 0}</span> tickets
              </div>
              
              <button 
                onClick={handleBuyTicket} 
                disabled={isBuying || event.stock < 1} 
                className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95
                  ${event.stock < 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#E85526] hover:bg-[#d1461b] text-white'}`}
              >
                {isBuying ? 'Processing...' : (event.stock < 1 ? 'Sold Out' : `Checkout (${ticketQty})`)}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
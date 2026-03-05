import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- KOMPONEN MODAL PAYMENT (FONT STANDAR) ---
function PaymentModal({ isOpen, onClose, onConfirm, event, quantity, totalPrice, isBuying }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white w-full max-w-4xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row"
        >
          {/* KOLOM KIRI: QRIS */}
          <div className="flex-1 p-10 bg-white border-r border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-2 uppercase">QRIS Payment</h3>
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Silakan Scan untuk Membayar</p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-[32px] border-2 border-dashed border-gray-200 shadow-inner">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=EVENTRENT-VERIFY-${totalPrice}`} 
                alt="QRIS" 
                className="w-64 h-64 mix-blend-multiply"
              />
            </div>
            <p className="mt-8 text-[10px] text-gray-300 font-bold uppercase tracking-[0.3em]">EventRent Automatic System</p>
          </div>

          {/* KOLOM KANAN: RINCIAN */}
          <div className="w-full md:w-[380px] bg-gray-50 p-10 flex flex-col justify-between text-left">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-8 uppercase tracking-tight">Rincian Tagihan</h3>
              
              <div className="bg-white p-4 rounded-2xl border border-gray-200 mb-8 shadow-sm">
                <div className="flex items-center gap-4">
                  <img src={event.img} className="w-16 h-16 rounded-xl object-cover shadow-sm" alt="event" />
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-bold text-gray-900 truncate leading-tight">{event.title}</h4>
                    <p className="text-gray-400 text-[10px] mt-1 font-bold">{quantity} Tiket dipesan</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">Subtotal</span>
                  <span className="font-bold text-gray-900">Rp {parseInt(event.price).toLocaleString()}</span>
                </div>
                <div className="pt-6 border-t border-dashed border-gray-300 flex justify-between items-center">
                  <span className="font-bold text-gray-900 uppercase text-xs">Total Bayar</span>
                  <span className="text-2xl font-bold text-[#FF6B35]">Rp {totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 space-y-4 text-center">
              <button
                onClick={onConfirm}
                disabled={isBuying}
                className="w-full py-5 bg-[#FF6B35] text-white rounded-2xl font-bold shadow-xl shadow-orange-100 hover:bg-[#e85526] transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
              >
                {isBuying ? 'Verifikasi...' : 'Cek Tiket'}
              </button>
              
              <button 
                onClick={onClose} 
                disabled={isBuying} 
                className="w-full py-2 text-gray-400 font-bold hover:text-gray-900 transition-colors text-[10px] uppercase tracking-widest"
              >
                Kembali
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// --- KOMPONEN UTAMA ---
export default function EventDetail({ events }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [ticketQty, setTicketQty] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (events && events.length > 0) {
      const found = events.find(e => String(e.id) === String(id));
      if (found) {
        setEvent(found);
        fetch(`http://localhost:3000/api/events/${id}/view`, { method: 'POST' }).catch(err => console.error(err));
        const savedLikes = JSON.parse(localStorage.getItem('likedEvents')) || [];
        setIsLiked(savedLikes.some(item => String(item.id) === String(found.id)));
      }
    }
    window.scrollTo(0, 0);
  }, [id, events]);

  const handleLikeClick = async () => {
    if (!event || !user) return alert("Login dulu bro!");
    try {
      const res = await fetch('http://localhost:3000/api/likes/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, eventId: event.id })
      });
      if (res.ok) {
        setIsLiked(!isLiked);
        window.dispatchEvent(new Event("storage"));
      }
    } catch (error) { console.error(error); }
  };

  const handleBuyTicket = () => {
    if (!user) return alert("Login dulu untuk pesan tiket!");
    setIsModalOpen(true);
  };

  const verifyAndRedirect = async () => {
    setIsBuying(true);
    setTimeout(async () => {
      try {
        const res = await fetch('http://localhost:3000/api/tickets/buy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, eventId: event.id, quantity: ticketQty })
        });
        if (res.ok) {
          setIsModalOpen(false);
          navigate('/my-tickets'); 
        } else {
          alert("Gagal memverifikasi tiket");
        }
      } catch (error) {
        alert("Koneksi bermasalah");
      } finally {
        setIsBuying(false);
      }
    }, 1500);
  };

  if (!event) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400 uppercase tracking-widest">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <PaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={verifyAndRedirect}
        event={event}
        quantity={ticketQty}
        totalPrice={Number(event.price) * ticketQty}
        isBuying={isBuying}
      />

      {/* BANNER */}
      <div className="relative w-full h-[450px] bg-gray-900">
        <img src={event.img} className="w-full h-full object-cover opacity-80" alt="Banner" />
        <button onClick={() => navigate(-1)} className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-gray-900 transition-all z-20">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
      </div>

      {/* CONTENT CARD */}
      <div className="max-w-6xl mx-auto px-4 relative z-10 -mt-32">
        <div className="bg-white rounded-[32px] shadow-xl p-8 md:p-12 flex flex-col lg:flex-row gap-12 min-h-[400px]">
          
          {/* LEFT COLUMN: INFO & DESKRIPSI */}
          <div className="flex-1 text-left">
            <span className="inline-block bg-[#FF6B35] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase mb-5">{event.category}</span>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-8 uppercase">{event.title}</h1>
            
            <div className="space-y-5 mb-10 text-left">
              <div className="flex items-center gap-4 text-gray-700 font-semibold">
                <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7H5v14z" /></svg>
                <p>{event.date}</p>
              </div>
              <div className="flex items-center gap-4 text-gray-700 font-semibold">
                <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                <p>{event.location}</p>
              </div>
            </div>

            {/* DESKRIPSI UTAMA */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Description</h3>
              <p className="text-gray-500 leading-relaxed font-medium whitespace-pre-line text-justify">
                {event.description || "No description provided for this event."}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: TICKET SELECTOR */}
          <div className="w-full lg:w-[320px] flex flex-col items-end gap-6 text-left">
            <button onClick={handleLikeClick} className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all ${isLiked ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-[#FF6B35] hover:text-[#FF6B35]'}`}>
              <svg className={`w-6 h-6 ${isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>

            <div className="w-full bg-gray-100/80 rounded-3xl p-6 shadow-sm border border-gray-100 text-left">
              <div className="mb-4">
                 <span className="block text-gray-400 text-[10px] font-bold uppercase mb-1">Price per Ticket</span>
                 <span className="text-2xl font-bold text-gray-900 tracking-tight uppercase">{Number(event.price) === 0 ? 'Free' : `Rp ${parseInt(event.price).toLocaleString()}`}</span>
              </div>
              
              <div className="flex items-center justify-between bg-white rounded-xl p-2 mb-4 shadow-sm border border-gray-100">
                <button onClick={() => ticketQty > 1 && setTicketQty(ticketQty - 1)} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 font-bold">-</button>
                <span className="font-bold text-gray-900">{ticketQty}</span>
                <button onClick={() => ticketQty < event.stock && setTicketQty(ticketQty + 1)} className="w-8 h-8 flex items-center justify-center bg-[#FF6B35] rounded-lg text-white hover:bg-orange-600 font-bold">+</button>
              </div>

              <button 
                onClick={handleBuyTicket} 
                disabled={isBuying || event.stock < 1} 
                className="w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest bg-[#E85526] hover:bg-[#d1461b] text-white transition-all shadow-lg active:scale-95"
              >
                {event.stock < 1 ? 'Sold Out' : `Checkout (${ticketQty})`}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
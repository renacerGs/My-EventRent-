import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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

// --- KOMPONEN POPUP STATUS ---
function StatusModal({ status, onClose, onGoToTickets }) {
  if (!status) return null;
  const isSuccess = status === 'success';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center"
        >
          {isSuccess ? (
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 border-[6px] border-green-100">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
          ) : (
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 border-[6px] border-red-100">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
          )}

          <h3 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-tight">
            {isSuccess ? 'Payment Success!' : 'Payment Failed'}
          </h3>
          <p className="text-gray-500 text-xs font-medium mb-8 leading-relaxed">
            {isSuccess 
              ? 'Mantap bro! Tiket berhasil dibeli dan sudah masuk ke My Tickets.' 
              : 'Waduh, transaksi gagal. Silakan periksa kembali koneksi atau metode pembayaran kamu.'}
          </p>

          <div className="w-full flex flex-col gap-3">
            {isSuccess ? (
              <>
                <button 
                  onClick={onGoToTickets} 
                  className="w-full py-4 bg-[#FF6B35] text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] transition-all active:scale-95"
                >
                  Lihat Tiket Saya
                </button>
                <button 
                  onClick={onClose} 
                  className="w-full py-3 bg-gray-100 text-gray-500 rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
                >
                  Tutup
                </button>
              </>
            ) : (
              <button 
                onClick={onClose} 
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] transition-all active:scale-95"
              >
                Coba Lagi
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// --- KOMPONEN MODAL PAYMENT ---
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
                  <span className="font-bold text-gray-900">Rp {parseInt(event.price).toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-6 border-t border-dashed border-gray-300 flex justify-between items-center">
                  <span className="font-bold text-gray-900 uppercase text-xs">Total Bayar</span>
                  <span className="text-2xl font-bold text-[#FF6B35]">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 space-y-4 text-center">
              <button
                onClick={onConfirm}
                disabled={isBuying}
                className="w-full py-5 bg-[#FF6B35] text-white rounded-2xl font-bold shadow-xl shadow-orange-100 hover:bg-[#e85526] transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
              >
                {isBuying ? 'Verifikasi...' : 'Bayar'}
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
  const [paymentStatus, setPaymentStatus] = useState(null);
  
  // --- STATE BARU BUAT CUSTOM ALERT ---
  const [alertMessage, setAlertMessage] = useState(null);

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
    if (!event || !user) {
      setAlertMessage("Login dulu bro buat nyimpen event ke Likes!");
      return;
    }
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
    if (!user) {
      setAlertMessage("Login dulu bro untuk pesan tiket!");
      return;
    }
    
    // Validasi ekstra: Jangan bolehin checkout kalau kuota kurang dari yang dipesan
    if (ticketQty > event.stock) {
      setAlertMessage("Waduh, tiket yang tersisa kurang dari jumlah yang kamu pesan bro!");
      return;
    }
    
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
        
        setIsModalOpen(false); 

        if (res.ok) {
          // --- MAGIC-NYA DI SINI BRO! ---
          // Kurangin angka stock secara visual detik itu juga biar nggak perlu nunggu refresh!
          setEvent(prevEvent => ({
            ...prevEvent,
            stock: prevEvent.stock - ticketQty
          }));
          
          setPaymentStatus('success');
          setTicketQty(1); // Balikin angka pesenan ke 1
        } else {
          setPaymentStatus('failed');
        }
      } catch (error) {
        setIsModalOpen(false);
        setPaymentStatus('failed');
      } finally {
        setIsBuying(false);
      }
    }, 1500);
  };

  if (!event) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400 uppercase tracking-widest">Loading...</div>;

  const isSoldOut = event.stock < 1;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans relative">
      
      <StatusModal 
        status={paymentStatus} 
        onClose={() => setPaymentStatus(null)} 
        onGoToTickets={() => navigate('/my-tickets')} 
      />

      <PaymentModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={verifyAndRedirect}
        event={event}
        quantity={ticketQty}
        totalPrice={Number(event.price) * ticketQty}
        isBuying={isBuying}
      />

      <div className="relative w-full h-[450px] bg-gray-900">
        <img src={event.img} className="w-full h-full object-cover opacity-80" alt="Banner" />
        <button onClick={() => navigate(-1)} className="absolute top-8 left-8 w-12 h-12 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-gray-900 transition-all z-20">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-4 relative z-10 -mt-32">
        <div className="bg-white rounded-[32px] shadow-xl p-8 md:p-12 flex flex-col lg:flex-row gap-12 min-h-[400px]">
          
          <div className="flex-1 text-left">
            <span className="inline-block bg-[#FF6B35] text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase mb-5">{event.category}</span>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-8 uppercase">{event.title}</h1>
            
            <div className="space-y-5 mb-10 text-left">
              
              <div className="flex items-center gap-4 text-gray-700 font-semibold">
                <svg className="w-6 h-6 text-[#FF6B35] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p>{formatPrettyDate(event.date)}</p>
              </div>

              <div className="flex items-center gap-4 text-gray-700 font-semibold">
                <svg className="w-6 h-6 text-[#FF6B35] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>{event.location}</p> 
              </div>

              <div className="flex items-center gap-4 text-gray-700 font-semibold">
                <svg className="w-6 h-6 text-[#FF6B35] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <p>{event.phone}</p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Description</h3>
              <p className="text-gray-500 leading-relaxed font-medium whitespace-pre-line text-justify">
                {event.description || "No description provided for this event."}
              </p>
            </div>
          </div>

          <div className="w-full lg:w-[320px] flex flex-col items-end gap-6 text-left">
            <button onClick={handleLikeClick} className={`w-12 h-12 flex items-center justify-center rounded-xl border transition-all ${isLiked ? 'border-red-500 bg-red-50 text-red-500' : 'border-gray-200 text-gray-400 hover:border-[#FF6B35] hover:text-[#FF6B35]'}`}>
              <svg className={`w-6 h-6 ${isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
            </button>

            <div className="w-full bg-gray-100/80 rounded-3xl p-6 shadow-sm border border-gray-100 text-left">
              
              <div className="mb-5 flex justify-between items-end border-b border-gray-200/60 pb-4">
                 <div>
                   <span className="block text-gray-400 text-[10px] font-bold uppercase mb-1">Price per Ticket</span>
                   <span className="text-2xl font-bold text-gray-900 tracking-tight uppercase">{Number(event.price) === 0 ? 'Free' : `Rp ${parseInt(event.price).toLocaleString('id-ID')}`}</span>
                 </div>
                 <div className="text-right">
                   <span className="block text-gray-400 text-[10px] font-bold uppercase mb-1">Available</span>
                   <span className={`text-xl font-bold tracking-tight ${isSoldOut ? 'text-red-500' : 'text-[#FF6B35]'}`}>
                     {isSoldOut ? 'Habis' : event.stock}
                   </span>
                 </div>
              </div>
              
              <div className={`flex items-center justify-between bg-white rounded-xl p-2 mb-4 shadow-sm border border-gray-100 ${isSoldOut ? 'opacity-50 pointer-events-none' : ''}`}>
                <button onClick={() => ticketQty > 1 && setTicketQty(ticketQty - 1)} disabled={isSoldOut} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 font-bold">-</button>
                <span className="font-bold text-gray-900">{isSoldOut ? 0 : ticketQty}</span>
                <button onClick={() => ticketQty < event.stock && setTicketQty(ticketQty + 1)} disabled={isSoldOut} className="w-8 h-8 flex items-center justify-center bg-[#FF6B35] rounded-lg text-white hover:bg-orange-600 font-bold">+</button>
              </div>

              <button 
                onClick={handleBuyTicket} 
                disabled={isBuying || isSoldOut} 
                className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                  isSoldOut 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                    : 'bg-[#E85526] hover:bg-[#d1461b] text-white shadow-lg active:scale-95' 
                }`}
              >
                {isSoldOut ? 'SOLD OUT' : `Checkout (${ticketQty})`}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* --- CUSTOM MODAL ALERT --- */}
      <AnimatePresence>
        {alertMessage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-orange-50 text-[#FF6B35] rounded-full flex items-center justify-center mb-6 border-[6px] border-orange-100">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-tight">Perhatian</h3>
              <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
                {alertMessage}
              </p>
              <button 
                onClick={() => setAlertMessage(null)} 
                className="w-full py-4 bg-[#FF6B35] text-white rounded-2xl font-bold uppercase text-xs tracking-widest shadow-xl hover:scale-[1.02] transition-all active:scale-95"
              >
                OK, Paham
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// --- KOMPONEN CUSTOM DROPDOWN ALA GOOGLE FORMS ---
function CustomDropdown({ options, value, onChange, placeholder, isWed }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const bgNormal = isWed ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900';
  const focusRing = isWed ? 'border-[#D4AF37] ring-[#D4AF37]' : 'border-[#FF6B35] ring-[#FF6B35]';
  const bgMenu = isWed ? 'bg-slate-800 border-slate-700 shadow-xl' : 'bg-white border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)]';
  const itemHover = isWed ? 'hover:bg-slate-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700';
  const itemActive = isWed ? 'bg-slate-900 text-[#D4AF37] font-bold' : 'bg-orange-50 text-[#FF6B35] font-bold';

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border ${isOpen ? `${focusRing} ring-1` : bgNormal} rounded-xl px-4 py-3 text-sm outline-none cursor-pointer flex justify-between items-center transition-all ${isWed ? 'hover:border-slate-500' : 'hover:border-gray-400'}`}
      >
        <span className={value ? (isWed ? 'text-white font-medium' : 'text-gray-900 font-medium') : 'text-gray-500'}>{value || placeholder}</span>
        <svg className={`w-4 h-4 ${isWed ? 'text-gray-400' : 'text-gray-500'} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`absolute z-20 w-full mt-2 border rounded-xl py-2 max-h-60 overflow-y-auto ${bgMenu}`}
          >
            {options.map((opt, idx) => (
              <div 
                key={idx}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`px-5 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2 ${value === opt ? itemActive : itemHover}`}
              >
                {value === opt && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>}
                <span className={value === opt ? '' : 'pl-6'}>{opt}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preferredSessionId = queryParams.get('session'); 

  const [user] = useState(() => JSON.parse(localStorage.getItem('user')));

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [cart, setCart] = useState([]);
  const [formAnswers, setFormAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null); 
  const [paymentStatus, setPaymentStatus] = useState('idle'); 

  const [popup, setPopup] = useState({ isOpen: false, message: '', type: 'info' });

  const showPopup = (message, type = 'info') => {
    setPopup({ isOpen: true, message, type });
  };

  const closePopup = () => {
    setPopup({ isOpen: false, message: '', type: 'info' });
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${id}`);
        if (!res.ok) throw new Error("Gagal load");
        const data = await res.json();
        setEvent(data);
        
        if (data.sessions && data.sessions.length > 0) {
          if (preferredSessionId === 'all') {
            const availableSessions = data.sessions.filter(s => s.stock > 0);
            if (availableSessions.length > 0) {
              const allCartItems = availableSessions.map(s => ({
                id: crypto.randomUUID(), sessionId: s.id, qty: 1
              }));
              setCart(allCartItems);
            } else {
              showPopup("Maaf bro, semua tiket/kuota sudah habis!", "error");
              setTimeout(() => { navigate(`/event/${id}`); }, 2000);
            }
          } else if (preferredSessionId) {
            const initialSession = data.sessions.find(s => String(s.id) === String(preferredSessionId) && s.stock > 0);
            if (initialSession) {
               const newCartId = crypto.randomUUID();
               setCart([{ id: newCartId, sessionId: initialSession.id, qty: 1 }]);
            }
          } else {
            const initialSession = data.sessions.find(s => s.stock > 0);
            if (initialSession) {
               const newCartId = crypto.randomUUID();
               setCart([{ id: newCartId, sessionId: initialSession.id, qty: 1 }]);
            }
          }
        }
      } catch (err) {
        console.error(err);
        showPopup("Gagal memuat data", "error");
        setTimeout(() => { navigate('/'); }, 2000);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate, preferredSessionId]);

  const handleAddCartItem = () => {
    const availableSession = event.sessions.find(s => s.stock > 0 && !cart.some(item => String(item.sessionId) === String(s.id)));
    if (!availableSession) {
      showPopup("Semua kategori sudah kamu pilih!", "error");
      return;
    }
    const newCartId = crypto.randomUUID();
    setCart([...cart, { id: newCartId, sessionId: availableSession.id, qty: 1 }]);
  };

  const handleRemoveCartItem = (cartId) => {
    if (cart.length === 1) {
      showPopup("Minimal pilih 1 kategori!", "error");
      return;
    }
    setCart(cart.filter(item => item.id !== cartId));
  };

  const updateCartItem = (cartId, field, value) => {
    setCart(cart.map(item => item.id === cartId ? { ...item, [field]: value } : item));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const session = event?.sessions.find(s => String(s.id) === String(item.sessionId));
      return total + (Number(session?.price || 0) * item.qty);
    }, 0);
  };

  const canAddNewSession = event?.sessions?.some(s => s.stock > 0 && !cart.some(item => String(item.sessionId) === String(s.id)));

  const handleOpenPaymentModal = (e) => {
    e.preventDefault(); 

    if (cart.length === 0) {
      showPopup("Form belum lengkap!", "error");
      return;
    }
    const invalidItem = cart.find(item => item.qty < 1);
    if (invalidItem) {
      showPopup("Jumlah tiket minimal 1 per kategori!", "error");
      return;
    }
    
    setShowPaymentModal(true); 
    if (calculateTotal() === 0) {
      setPaymentMethod('free'); 
    } else {
      setPaymentMethod(null); 
    }
  };

  const executeRealPayment = async () => {
    setPaymentStatus('processing');
    setIsSubmitting(true);
    
    try {
      let emailTamu = '';
      if (!user && cart.length > 0) {
        const firstCartItem = cart[0];
        const emailKey = `cart-${firstCartItem.id}-ticket-0-email`;
        emailTamu = formAnswers[emailKey] || '';
      }

      const payload = { 
        userId: user ? user.id : null, 
        guestEmail: emailTamu, 
        eventId: event.id, 
        cart: cart, 
        formAnswers: formAnswers 
      };
      
      const res = await fetch('/api/tickets/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setPaymentStatus('success');
        setTimeout(() => {
          navigate(`/event/${id}`); 
        }, 2000);
      } else {
        showPopup("Gagal memproses: " + (data.message || 'Terjadi kesalahan di server'), "error");
        setShowPaymentModal(false);
        setPaymentStatus('idle');
      }
    } catch (err) {
      console.error(err);
      showPopup("Terjadi kesalahan jaringan atau server mati.", "error");
      setShowPaymentModal(false);
      setPaymentStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Loading Form...</div>;

  // 👇 DETEKTOR TEMA EKSKLUSIF (Persis kayak CreateEvent) 👇
  const isWed = event?.is_private || event?.category === 'Wedding';
  const primaryColor = isWed ? 'bg-[#D4AF37] hover:bg-[#B5952F] text-slate-950' : 'bg-gray-900 hover:bg-black text-white';
  const textHighlight = isWed ? 'text-[#D4AF37]' : 'text-[#FF6B35]';
  const bgMain = isWed ? 'bg-slate-950' : 'bg-gray-50';
  const bgCard = isWed ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200';
  const textTitle = isWed ? 'text-white' : 'text-gray-900';
  const textLabel = isWed ? 'text-gray-300' : 'text-gray-700';
  const inputBg = isWed ? 'bg-slate-800 text-white border-slate-700 placeholder-gray-500' : 'bg-white text-gray-900 border border-gray-300 placeholder-gray-400';
  const focusStyle = isWed ? 'focus:border-[#D4AF37] focus:ring-[#D4AF37]' : 'focus:border-[#FF6B35] focus:ring-[#FF6B35]';
  const inputStyle = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-1 ${inputBg} ${focusStyle}`;
  const labelStyle = `block text-xs font-bold mb-2 uppercase tracking-widest ${textLabel}`;

  return (
    <div className={`min-h-screen ${bgMain} pb-32 font-sans pt-10 relative transition-colors duration-500`}>
      
      <AnimatePresence>
        {popup.isOpen && (
          <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`w-full max-w-sm rounded-[32px] p-8 text-center shadow-2xl relative overflow-hidden ${popup.type === 'error' ? 'bg-[#E24A29]' : popup.type === 'success' ? 'bg-[#27AE60]' : 'bg-gray-800'}`}
            >
              <div className={`w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${popup.type === 'error' ? 'text-[#E24A29]' : popup.type === 'success' ? 'text-[#27AE60]' : 'text-gray-800'}`}>
                {popup.type === 'error' ? (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : popup.type === 'success' ? (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">
                {popup.type === 'error' ? 'Ups!' : popup.type === 'success' ? 'Berhasil!' : 'Info'}
              </h2>
              <p className="text-white/90 font-medium mb-8">{popup.message}</p>
              <button 
                onClick={closePopup} 
                className={`w-full bg-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95 ${popup.type === 'error' ? 'text-[#E24A29] hover:bg-red-50' : popup.type === 'success' ? 'text-[#27AE60] hover:bg-green-50' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <form onSubmit={handleOpenPaymentModal}>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-4 mb-8">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className={`w-12 h-12 flex items-center justify-center rounded-full border shadow-sm transition-all active:scale-95 ${isWed ? 'bg-slate-900 border-slate-700 text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37]' : 'bg-white border-gray-200 text-gray-500 hover:text-[#FF6B35] hover:border-[#FF6B35]'}`} 
              title="Kembali"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className={`text-3xl font-extrabold uppercase tracking-tight leading-none mb-1 ${textTitle}`}>
                {isWed ? 'RSVP Kehadiran' : 'Checkout Tiket'}
              </h1>
              <p className={`text-xs font-bold uppercase tracking-widest ${isWed ? 'text-[#D4AF37]' : 'text-gray-500'}`}>{event.title}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <div className="lg:col-span-4 space-y-4">
              {cart.map((item, index) => {
                const selectedSession = event.sessions.find(s => String(s.id) === String(item.sessionId));
                const availableStock = selectedSession ? selectedSession.stock : 0;

                return (
                  <div key={item.id} className={`${bgCard} p-5 rounded-2xl shadow-sm border`}>
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-xs font-bold uppercase tracking-widest ${textHighlight}`}>
                        {isWed ? 'Kategori Undangan' : `Kategori Tiket ${index + 1}`}
                      </span>
                      {cart.length > 1 && (
                        <button type="button" onClick={() => handleRemoveCartItem(item.id)} className="text-gray-400 hover:text-red-500 font-bold text-sm">✕ Hapus</button>
                      )}
                    </div>
                    <select 
                      value={item.sessionId} 
                      onChange={(e) => updateCartItem(item.id, 'sessionId', e.target.value)} 
                      className={`w-full ${isWed ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'} rounded-xl px-4 py-3 text-sm font-bold mb-4 focus:ring-1 ${focusStyle} outline-none`}
                    >
                      {event.sessions.map(s => {
                        const isAlreadySelectedByOtherCartItem = cart.some(c => String(c.sessionId) === String(s.id) && c.id !== item.id);
                        const isOutOfStock = s.stock < 1;
                        return (
                          <option key={s.id} value={s.id} disabled={isOutOfStock || isAlreadySelectedByOtherCartItem}>
                            {s.name} - {Number(s.price) === 0 ? 'FREE' : `Rp ${parseInt(s.price).toLocaleString('id-ID')}`} {isOutOfStock ? ' (Habis)' : isAlreadySelectedByOtherCartItem ? ' (Sudah Dipilih)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-[10px] font-bold uppercase mb-1 ${isWed ? 'text-gray-500' : 'text-gray-400'}`}>{isWed ? 'Sisa Kuota' : 'Sisa Stok'}</p>
                        <p className={`text-sm font-bold ${textTitle}`}>{availableStock} Orang</p>
                      </div>
                      <div className={`flex items-center rounded-xl p-1 ${isWed ? 'bg-slate-800' : 'bg-gray-100'}`}>
                        <button type="button" onClick={() => item.qty > 1 && updateCartItem(item.id, 'qty', item.qty - 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold shadow-sm ${isWed ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-white text-gray-600 hover:bg-gray-200'}`}>-</button>
                        <span className={`w-10 text-center font-bold ${textTitle}`}>{item.qty}</span>
                        <button type="button" onClick={() => item.qty < availableStock && updateCartItem(item.id, 'qty', item.qty + 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold shadow-sm ${isWed ? 'bg-[#D4AF37] text-slate-900 hover:bg-[#B5952F]' : 'bg-[#FF6B35] text-white hover:bg-orange-600'}`}>+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {canAddNewSession && (
                <button type="button" onClick={handleAddCartItem} className={`w-full py-4 border-2 border-dashed font-bold rounded-2xl transition-colors uppercase text-xs tracking-widest ${isWed ? 'border-[#D4AF37] text-[#D4AF37] hover:bg-slate-900' : 'border-green-500 text-green-600 hover:bg-green-50'}`}>
                  + {isWed ? 'Tambah Kategori Undangan' : 'Tambah Kategori Tiket'}
                </button>
              )}
            </div>

            <div className={`lg:col-span-8 ${bgCard} rounded-[32px] p-8 md:p-10 shadow-sm border`}>
              <h2 className={`text-2xl font-bold mb-6 border-b pb-4 ${isWed ? 'text-white border-slate-800' : 'text-gray-900 border-gray-100'}`}>
                {isWed ? 'Data Tamu Undangan' : 'Data Pemegang Tiket'}
              </h2>
              
              <div className="space-y-4">
                {cart.map((item, cartIndex) => {
                  const session = event.sessions.find(s => String(s.id) === String(item.sessionId));
                  if (!session) return null;

                  return Array.from({ length: item.qty }).map((_, qtyIndex) => {
                    const formKeyPrefix = `cart-${item.id}-ticket-${qtyIndex}`;

                    return (
                      <div key={formKeyPrefix} className="mb-10 last:mb-0">
                        <div className={`px-4 py-2 rounded-lg font-bold text-sm mb-5 inline-block border ${isWed ? 'bg-slate-800 text-[#D4AF37] border-slate-700' : 'bg-orange-50 text-[#FF6B35] border-orange-100'}`}>
                          {isWed ? 'Tamu' : 'Tiket'} {qtyIndex + 1} - <span className="uppercase">{session.name}</span>
                        </div>
                        
                        <div className={`space-y-5 pl-2 md:pl-4 border-l-2 ${isWed ? 'border-slate-800' : 'border-gray-100'}`}>
                          <div>
                            <label className={labelStyle}>Nama Lengkap <span className="text-red-500">*</span></label>
                            <input type="text" required value={formAnswers[`${formKeyPrefix}-nama`] || ''} onChange={(e) => setFormAnswers(prev => ({...prev, [`${formKeyPrefix}-nama`]: e.target.value}))} className={inputStyle} placeholder={isWed ? "Bapak/Ibu/Saudara..." : "Masukkan nama sesuai KTP"} />
                          </div>
                          <div>
                            <label className={labelStyle}>Email <span className="text-red-500">*</span></label>
                            <input type="email" required value={formAnswers[`${formKeyPrefix}-email`] || ''} onChange={(e) => setFormAnswers(prev => ({...prev, [`${formKeyPrefix}-email`]: e.target.value}))} className={inputStyle} placeholder={isWed ? "Untuk pengiriman E-Ticket (QR Code)" : "Masukkan email aktif"} />
                          </div>
                          
                          {/* 👇 TAMBAHAN KHUSUS WEDDING (PAX & UCAPAN) 👇 */}
                          {isWed && (
                            <>
                              <div>
                                <label className={labelStyle}>Jumlah Rombongan (Pax) <span className="text-red-500">*</span></label>
                                <select required value={formAnswers[`${formKeyPrefix}-pax`] || '1'} onChange={(e) => setFormAnswers(prev => ({...prev, [`${formKeyPrefix}-pax`]: e.target.value}))} className={`${inputStyle} cursor-pointer`}>
                                  <option value="1">1 Orang (Hanya Saya)</option>
                                  <option value="2">2 Orang (+ Partner)</option>
                                </select>
                              </div>
                              <div>
                                <label className={labelStyle}>Ucapan & Doa <span className="text-red-500">*</span></label>
                                <textarea required value={formAnswers[`${formKeyPrefix}-greeting`] || ''} onChange={(e) => setFormAnswers(prev => ({...prev, [`${formKeyPrefix}-greeting`]: e.target.value}))} className={inputStyle} rows="3" placeholder="Tuliskan ucapan selamat dan doa untuk kedua mempelai..."></textarea>
                              </div>
                            </>
                          )}
                          
                          {/* --- RENDER CUSTOM QUESTIONS --- */}
                          {session.questions && session.questions.map((q) => {
                            const formKey = `${formKeyPrefix}-q${q.id}`;
                            return (
                              <div key={q.id} className={`pt-4 border-t ${isWed ? 'border-slate-800' : 'border-gray-100'}`}>
                                <label className={labelStyle}>
                                  {q.question_text} {q.is_required && <span className="text-red-500">*</span>}
                                </label>

                                {(!q.answer_type || q.answer_type === 'Text') && (
                                  <input 
                                    type="text" 
                                    required={q.is_required} 
                                    value={formAnswers[formKey] || ''} 
                                    onChange={(e) => setFormAnswers(prev => ({...prev, [formKey]: e.target.value}))} 
                                    className={inputStyle} 
                                    placeholder="Ketik jawaban..." 
                                  />
                                )}

                                {/* --- CUSTOM DROPDOWN --- */}
                                {q.answer_type === 'Dropdown' && (
                                  <CustomDropdown 
                                    isWed={isWed}
                                    options={q.options} 
                                    value={formAnswers[formKey] || ''} 
                                    onChange={(val) => setFormAnswers(prev => ({...prev, [formKey]: val}))} 
                                    placeholder="Pilih jawaban..." 
                                    required={q.is_required}
                                  />
                                )}

                                {/* --- CUSTOM CHECKBOX --- */}
                                {q.answer_type === 'Checkbox' && (
                                  <div className={`space-y-3 mt-3 p-4 rounded-xl border ${isWed ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                    {q.options && q.options.map((opt, idx) => {
                                       const currentStr = formAnswers[formKey] || '';
                                       const isChecked = currentStr.split(', ').includes(opt);
                                       
                                       return (
                                         <label key={idx} className="flex items-start gap-3 cursor-pointer group">
                                           <div className="relative flex items-center justify-center w-5 h-5 shrink-0 mt-0.5">
                                             <input 
                                               type="checkbox" 
                                               checked={isChecked}
                                               onChange={(e) => {
                                                  const checked = e.target.checked;
                                                  setFormAnswers(prev => {
                                                     const prevStr = prev[formKey] || '';
                                                     let arr = prevStr ? prevStr.split(', ') : [];
                                                     if (checked) arr.push(opt);
                                                     else arr = arr.filter(x => x !== opt);
                                                     return { ...prev, [formKey]: arr.join(', ') };
                                                  });
                                               }} 
                                               className="peer w-full h-full absolute opacity-0 cursor-pointer" 
                                             />
                                             <div className={`w-5 h-5 border-2 rounded-[3px] flex items-center justify-center transition-all ${isWed ? 'border-slate-500 group-hover:border-[#D4AF37] peer-checked:bg-[#D4AF37] peer-checked:border-[#D4AF37]' : 'border-gray-400 group-hover:border-gray-600 peer-checked:bg-[#FF6B35] peer-checked:border-[#FF6B35]'}`}>
                                                <svg className={`w-3.5 h-3.5 opacity-0 peer-checked:opacity-100 transition-opacity ${isWed ? 'text-slate-900' : 'text-white'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                             </div>
                                           </div>
                                           <span className={`text-sm font-medium transition-colors ${isWed ? 'text-gray-300 group-hover:text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>{opt}</span>
                                         </label>
                                       )
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })}
              </div>

            </div>
          </div>
        </div>

        {/* BOTTOM FIXED BAR */}
        <div className={`fixed bottom-0 left-0 right-0 border-t shadow-[0_-10px_30px_rgba(0,0,0,0.05)] p-5 z-50 ${isWed ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">{isWed ? 'Status RSVP' : 'Total Pembayaran'}</p>
              <p className={`text-2xl font-black ${textHighlight}`}>{isWed ? 'GRATIS / VIP' : `Rp ${calculateTotal().toLocaleString('id-ID')}`}</p>
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting || cart.length === 0}
              className={`px-8 py-4 font-bold rounded-xl uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${primaryColor}`}
            >
              {isSubmitting ? 'Memproses...' : (isWed ? 'Kirim RSVP' : 'Lanjut Bayar')}
            </button>
          </div>
        </div>

      </form>

      {/* ======================================================= */}
      {/* POP UP PAYMENT GATEWAY MOCKUP                           */}
      {/* ======================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative ${isWed ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
            
            {paymentStatus === 'idle' && (
              <button 
                type="button"
                onClick={() => { setShowPaymentModal(false); setPaymentMethod(null); }} 
                className={`absolute top-5 right-5 rounded-full w-8 h-8 flex items-center justify-center transition-colors ${isWed ? 'text-gray-400 bg-slate-800 hover:text-white' : 'text-gray-400 bg-gray-100 hover:text-gray-900'}`}
              >
                ✕
              </button>
            )}

            {paymentStatus === 'idle' && !paymentMethod && calculateTotal() > 0 && !isWed && (
              <div className="p-8">
                <h3 className="text-xl font-black text-gray-900 mb-2">Pilih Pembayaran</h3>
                <p className="text-sm text-gray-500 mb-8 font-medium">Total: <strong className="text-[#FF6B35]">Rp {calculateTotal().toLocaleString('id-ID')}</strong></p>
                
                <div className="space-y-4">
                  <button type="button" onClick={() => setPaymentMethod('qris')} className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-2xl hover:border-[#FF6B35] hover:bg-orange-50 transition-all text-left group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs">QRIS</div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-[#FF6B35]">QR Code (QRIS)</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Gopay, OVO, Dana, dll</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                  </button>

                  <button type="button" onClick={() => setPaymentMethod('va')} className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 font-black text-xs">VA</div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-600">Virtual Account</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">BCA, Mandiri, BNI, BRI</p>
                      </div>
                    </div>
                    <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>
              </div>
            )}

            {paymentStatus === 'idle' && paymentMethod && (
              <div className="p-8 text-center">
                {paymentMethod !== 'free' && !isWed && (
                  <button type="button" onClick={() => setPaymentMethod(null)} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 mb-6 flex items-center justify-center w-full transition-colors">
                    ← Ganti Metode
                  </button>
                )}

                {paymentMethod === 'free' ? (
                  <>
                    <h3 className={`text-2xl font-black mb-2 ${textTitle}`}>{isWed ? 'Konfirmasi RSVP 💍' : 'Tiket Gratis! 🎉'}</h3>
                    <p className={`text-sm mb-8 font-medium ${isWed ? 'text-gray-400' : 'text-gray-500'}`}>
                      {isWed ? 'Silakan kirim form ini untuk mendapatkan E-Ticket (QR Code) Anda.' : 'Asyik, kamu gak perlu bayar sepeserpun untuk event ini.'}
                    </p>
                    <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-8 border-[8px] ${isWed ? 'bg-slate-800 text-[#D4AF37] border-slate-700' : 'bg-green-50 text-green-500 border-green-100'}`}>
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
                    </div>
                  </>
                ) : paymentMethod === 'qris' ? (
                  <>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Scan QRIS</h3>
                    <p className="text-xs text-gray-500 mb-6 font-medium">Buka aplikasi e-wallet / m-banking kamu</p>
                    <div className="w-48 h-48 mx-auto bg-gray-100 border-4 border-[#FF6B35] rounded-3xl p-3 shadow-lg mb-6 relative">
                       <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg" alt="QR Code" className="w-full h-full opacity-80 mix-blend-multiply" />
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Transfer ke VA</h3>
                    <p className="text-xs text-gray-500 mb-6 font-medium">Salin nomor rekening di bawah ini</p>
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Bank BCA</p>
                      <p className="text-2xl font-black text-gray-900 tracking-[0.2em]">8800 1234 5678</p>
                    </div>
                  </>
                )}

                {paymentMethod !== 'free' && !isWed && (
                  <div className="bg-orange-50 text-[#FF6B35] p-4 rounded-xl font-black text-xl mb-8 border border-orange-100">
                    Rp {calculateTotal().toLocaleString('id-ID')}
                  </div>
                )}

                <button 
                  type="button"
                  onClick={executeRealPayment}
                  className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 ${primaryColor}`}
                >
                  {paymentMethod === 'free' ? (isWed ? 'Kirim Undangan Saya' : 'Dapatkan Tiket') : 'Saya Sudah Bayar'}
                </button>
              </div>
            )}

            {paymentStatus !== 'idle' && (
              <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                {paymentStatus === 'processing' ? (
                  <>
                    <div className={`w-16 h-16 border-4 rounded-full animate-spin mb-6 ${isWed ? 'border-slate-800 border-t-[#D4AF37]' : 'border-gray-100 border-t-[#FF6B35]'}`}></div>
                    <h3 className={`text-lg font-black uppercase tracking-wide ${textTitle}`}>Memverifikasi...</h3>
                    <p className={`text-xs mt-2 font-medium ${isWed ? 'text-gray-400' : 'text-gray-500'}`}>Jangan tutup halaman ini</p>
                  </>
                ) : (
                  <>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border-[6px] animate-bounce ${isWed ? 'bg-slate-800 text-[#D4AF37] border-slate-700' : 'bg-green-50 text-green-500 border-green-100'}`}>
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className={`text-2xl font-black uppercase tracking-tight ${textTitle}`}>
                      {paymentMethod === 'free' ? (isWed ? 'RSVP Terkirim!' : 'Tiket Diklaim!') : 'Pembayaran Sukses!'}
                    </h3>
                    <p className={`text-sm mt-2 font-medium ${isWed ? 'text-gray-400' : 'text-gray-500'}`}>
                       {isWed ? 'E-Ticket sedang dikirim ke email Anda...' : 'Tiket kamu sedang disiapkan...'}
                    </p>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
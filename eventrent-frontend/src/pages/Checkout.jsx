import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';

// --- KOMPONEN CUSTOM DROPDOWN ALA GOOGLE FORMS ---
function CustomDropdown({ options, value, onChange, placeholder }) {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full border ${isOpen ? 'border-[#FF6B35] ring-1 ring-[#FF6B35]' : 'bg-white border-gray-300 text-gray-900'} rounded-xl px-4 py-3 text-sm outline-none cursor-pointer flex justify-between items-center transition-all hover:border-gray-400`}
      >
        <span className={value ? 'text-gray-900 font-medium' : 'text-gray-500'}>{value || placeholder}</span>
        <svg className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"></path></svg>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-20 w-full mt-2 border rounded-xl py-2 max-h-60 overflow-y-auto bg-white border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)]"
          >
            {options.map((opt, idx) => (
              <div 
                key={idx}
                onClick={() => { onChange(opt); setIsOpen(false); }}
                className={`px-5 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2 ${value === opt ? 'bg-orange-50 text-[#FF6B35] font-bold' : 'hover:bg-gray-50 text-gray-700'}`}
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
  
  // 🔥 PERUBAHAN: Set default kosong (belum ada metode yang terpilih)
  const [paymentMethod, setPaymentMethod] = useState(''); 

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle'); 

  // State untuk Cahaya Pay QR Code Modal
  const [qrData, setQrData] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

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
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}`);
        if (!res.ok) throw new Error("Failed to load");
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
              showPopup("Sorry, all tickets are sold out!", "error");
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
        showPopup("Failed to load data", "error");
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
      showPopup("You have selected all available ticket categories!", "error");
      return;
    }
    const newCartId = crypto.randomUUID();
    setCart([...cart, { id: newCartId, sessionId: availableSession.id, qty: 1 }]);
  };

  const handleRemoveCartItem = (cartId) => {
    if (cart.length === 1) {
      showPopup("You must select at least 1 ticket category!", "error");
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

  // ========================================================
  // 🔥 FUNGSI PEMBAYARAN HYBRID
  // ========================================================
  const handlePayment = async (e) => {
    e.preventDefault(); 

    if (cart.length === 0) return showPopup("Cart is empty!", "error");
    if (cart.find(item => item.qty < 1)) return showPopup("Minimum ticket quantity is 1 per category!", "error");

    const totalAmount = calculateTotal();

    // 🔥 PERUBAHAN: Validasi metode pembayaran belum dipilih
    if (totalAmount > 0 && !paymentMethod) {
      return showPopup("Silakan pilih Metode Pembayaran terlebih dahulu!", "error");
    }

    if (totalAmount === 0) {
      setShowPaymentModal(true);
      executeRealPayment();
      return;
    }

    setIsSubmitting(true);
    try {
      const authKey = Object.keys(localStorage).find(key => key.endsWith('-auth-token'));
      const sessionStr = authKey ? localStorage.getItem(authKey) : null;
      const token = sessionStr ? JSON.parse(sessionStr).access_token : '';
      
      // Ambil email pembeli (bisa dari akun atau dari form tiket pertama)
      let buyerEmail = user?.email || ''; 
      if (!buyerEmail && cart.length > 0) {
        const firstCartItem = cart[0];
        const emailKey = `cart-${firstCartItem.id}-ticket-0-email`;
        buyerEmail = formAnswers[emailKey] || '';
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/checkout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }) 
        },
        body: JSON.stringify({
          userId: user ? user.id : null,
          buyerEmail: buyerEmail, 
          eventId: event.id, 
          cart: cart, 
          formAnswers: formAnswers, 
          paymentMethod: paymentMethod 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal membuat pesanan");

      // Logika Navigasi Baru
      if (paymentMethod === 'MANUAL_TRANSFER') {
        showPopup("Pesanan Berhasil! Silakan upload bukti pembayaran.", "success");
        setTimeout(() => navigate(`/upload-proof/${data.orderId}`), 2000);
      } 
      else {
        // Jalur Otomatis (QRIS)
        if (data.checkoutUrl) {
          setQrData(data.checkoutUrl);
          setShowQrModal(true);
        } else {
          showPopup("Terjadi kesalahan, URL QR pembayaran tidak ditemukan.", "error");
        }
      }
    } catch (err) {
      console.error(err);
      showPopup(err.message || "Network error occurred.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeRealPayment = async () => {
    setPaymentStatus('processing');
    const authKey = Object.keys(localStorage).find(key => key.endsWith('-auth-token'));
    const sessionStr = authKey ? localStorage.getItem(authKey) : null;
    const token = sessionStr ? JSON.parse(sessionStr).access_token : '';

    try {
      let emailTamu = user?.email || ''; 
      if (!emailTamu && cart.length > 0) {
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
      
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tickets/buy`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setPaymentStatus('success');
        setTimeout(() => { navigate(`/event/${id}`); }, 2000);
      } else {
        showPopup("Failed: " + (data.message || 'Server error'), "error");
        setShowPaymentModal(false);
      }
    } catch (err) {
      console.error(err);
      showPopup("System error occurred.", "error");
      setShowPaymentModal(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Loading Form...</div>;

  const inputStyle = `w-full rounded-xl px-4 py-3 text-sm outline-none transition-all focus:ring-1 bg-white text-gray-900 border border-gray-300 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-[#FF6B35]`;
  const labelStyle = `block text-xs font-bold mb-2 uppercase tracking-widest text-gray-700`;

  return (
    <div className={`min-h-screen bg-gray-50 pb-32 font-sans pt-10 relative`}>
      
      <AnimatePresence>
        {popup.isOpen && (
          <div className="fixed inset-0 z-[210] flex flex-col items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
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
                {popup.type === 'error' ? 'Oops!' : popup.type === 'success' ? 'Success!' : 'Info'}
              </h2>
              <p className="text-white/90 font-medium mb-8">{popup.message}</p>
              <button 
                type="button"
                onClick={closePopup} 
                className={`w-full bg-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95 ${popup.type === 'error' ? 'text-[#E24A29] hover:bg-red-50' : popup.type === 'success' ? 'text-[#27AE60] hover:bg-green-50' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <form onSubmit={handlePayment}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-4 mb-8">
            <button 
              type="button" 
              onClick={() => navigate(`/event/${id}`)} 
              className={`w-12 h-12 flex items-center justify-center rounded-full border shadow-sm transition-all active:scale-95 bg-white border-gray-200 text-gray-500 hover:text-[#FF6B35] hover:border-[#FF6B35]`} 
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className={`text-3xl font-extrabold uppercase tracking-tight leading-none mb-1 text-gray-900`}>
                Checkout Ticket
              </h1>
              <p className={`text-xs font-bold uppercase tracking-widest text-gray-500`}>{event?.title}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-4">
              {cart.map((item, index) => {
                const selectedSession = event.sessions.find(s => String(s.id) === String(item.sessionId));
                const availableStock = selectedSession ? selectedSession.stock : 0;

                return (
                  <div key={item.id} className={`bg-white border-gray-200 p-5 rounded-2xl shadow-sm border`}>
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-xs font-bold uppercase tracking-widest text-[#FF6B35]`}>
                        Ticket Category {index + 1}
                      </span>
                      {cart.length > 1 && (
                        <button type="button" onClick={() => handleRemoveCartItem(item.id)} className="text-gray-400 hover:text-red-500 font-bold text-sm">✕ Remove</button>
                      )}
                    </div>
                    <select 
                      value={item.sessionId} 
                      onChange={(e) => updateCartItem(item.id, 'sessionId', e.target.value)} 
                      className={`w-full bg-gray-50 border-gray-200 text-gray-700 rounded-xl px-4 py-3 text-sm font-bold mb-4 outline-none focus:ring-1 focus:border-[#FF6B35] focus:ring-[#FF6B35]`}
                    >
                      {event.sessions.map(s => {
                        const isAlreadySelectedByOtherCartItem = cart.some(c => String(c.sessionId) === String(s.id) && c.id !== item.id);
                        const isOutOfStock = s.stock < 1;
                        return (
                          <option key={s.id} value={s.id} disabled={isOutOfStock || isAlreadySelectedByOtherCartItem}>
                            {s.name} - {Number(s.price) === 0 ? 'FREE' : `Rp ${parseInt(s.price).toLocaleString('id-ID')}`} {isOutOfStock ? ' (Sold Out)' : isAlreadySelectedByOtherCartItem ? ' (Selected)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-[10px] font-bold uppercase mb-1 text-gray-400`}>Remaining Stock</p>
                        <p className={`text-sm font-bold text-gray-900`}>{availableStock} Tickets</p>
                      </div>
                      <div className={`flex items-center rounded-xl p-1 bg-gray-100`}>
                        <button type="button" onClick={() => item.qty > 1 && updateCartItem(item.id, 'qty', item.qty - 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold shadow-sm bg-white text-gray-600 hover:bg-gray-200`}>-</button>
                        <span className={`w-10 text-center font-bold text-gray-900`}>{item.qty}</span>
                        <button type="button" onClick={() => item.qty < availableStock && updateCartItem(item.id, 'qty', item.qty + 1)} className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold shadow-sm bg-[#FF6B35] text-white hover:bg-orange-600`}>+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {canAddNewSession && (
                <button type="button" onClick={handleAddCartItem} className={`w-full py-4 border-2 border-dashed font-bold rounded-2xl transition-colors uppercase text-xs tracking-widest border-green-500 text-green-600 hover:bg-green-50`}>
                  + Add Ticket Category
                </button>
              )}
            </div>

            <div className={`lg:col-span-8 space-y-8`}>
              {/* CARD FORM DATA PEMEGANG TIKET */}
              <div className="bg-white border-gray-200 rounded-[32px] p-8 md:p-10 shadow-sm border">
                <h2 className={`text-2xl font-bold mb-6 border-b pb-4 text-gray-900 border-gray-100`}>
                  Ticket Holder Data
                </h2>
                
                <div className="space-y-4">
                  {cart.map((item) => {
                    const session = event.sessions.find(s => String(s.id) === String(item.sessionId));
                    if (!session) return null;

                    return Array.from({ length: item.qty }).map((_, qtyIndex) => {
                      const formKeyPrefix = `cart-${item.id}-ticket-${qtyIndex}`;

                      return (
                        <div key={formKeyPrefix} className="mb-10 last:mb-0">
                          <div className={`px-4 py-2 rounded-lg font-bold text-sm mb-5 inline-block border bg-orange-50 text-[#FF6B35] border-orange-100`}>
                            Ticket {qtyIndex + 1} - <span className="uppercase">{session.name}</span>
                          </div>
                          
                          <div className={`space-y-5 pl-2 md:pl-4 border-l-2 border-gray-100`}>
                            <div>
                              <label className={labelStyle}>Full Name <span className="text-red-500">*</span></label>
                              <input type="text" required value={formAnswers[`${formKeyPrefix}-nama`] || ''} onChange={(e) => setFormAnswers(prev => ({...prev, [`${formKeyPrefix}-nama`]: e.target.value}))} className={inputStyle} placeholder="Enter your full name" />
                            </div>
                            <div>
                              <label className={labelStyle}>Email <span className="text-red-500">*</span></label>
                              <input type="email" required value={formAnswers[`${formKeyPrefix}-email`] || ''} onChange={(e) => setFormAnswers(prev => ({...prev, [`${formKeyPrefix}-email`]: e.target.value}))} className={inputStyle} placeholder="Enter an active email" />
                            </div>
                            
                            {/* --- RENDER CUSTOM QUESTIONS --- */}
                            {session.questions && session.questions.map((q) => {
                              const formKey = `${formKeyPrefix}-q${q.id}`;
                              return (
                                <div key={q.id} className={`pt-4 border-t border-gray-100`}>
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
                                      placeholder="Type your answer..." 
                                    />
                                  )}

                                  {q.answer_type === 'Dropdown' && (
                                    <CustomDropdown 
                                      options={q.options} 
                                      value={formAnswers[formKey] || ''} 
                                      onChange={(val) => setFormAnswers(prev => ({...prev, [formKey]: val}))} 
                                      placeholder="Select Answer..." 
                                      required={q.is_required}
                                    />
                                  )}

                                  {q.answer_type === 'Checkbox' && (
                                    <div className={`space-y-3 mt-3 p-4 rounded-xl border bg-gray-50 border-gray-200`}>
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
                                              <div className={`w-5 h-5 border-2 rounded-[3px] flex items-center justify-center transition-all border-gray-400 group-hover:border-gray-600 peer-checked:bg-[#FF6B35] peer-checked:border-[#FF6B35]`}>
                                                  <svg className={`w-3.5 h-3.5 opacity-0 peer-checked:opacity-100 transition-opacity text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                                              </div>
                                            </div>
                                            <span className={`text-sm font-medium transition-colors text-gray-700 group-hover:text-gray-900`}>{opt}</span>
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

              {/* CARD METODE PEMBAYARAN */}
              {calculateTotal() > 0 && (
                <div className="bg-white border-gray-200 rounded-[32px] p-8 md:p-10 shadow-sm border space-y-6">
                   <h2 className="text-2xl font-bold border-b pb-4 text-gray-900 border-gray-100">
                      Payment Method
                   </h2>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Opsi QRIS */}
                      <div 
                        onClick={() => setPaymentMethod('QRIS')}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'QRIS' ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-100 hover:border-gray-300'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center font-bold text-[#FF6B35] text-xs">QRIS</div>
                          <div>
                            <p className="text-sm font-black text-slate-900">QRIS / E-Wallet</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Automatic Confirmation</p>
                          </div>
                        </div>
                        {paymentMethod === 'QRIS' && <div className="w-6 h-6 bg-[#FF6B35] rounded-full flex items-center justify-center"><svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg></div>}
                      </div>

                      {/* Opsi Transfer Bank */}
                      <div 
                        onClick={() => setPaymentMethod('MANUAL_TRANSFER')}
                        className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'MANUAL_TRANSFER' ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-100 hover:border-gray-300'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">Bank Transfer</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Manual Instruction</p>
                          </div>
                        </div>
                        {paymentMethod === 'MANUAL_TRANSFER' && <div className="w-6 h-6 bg-[#FF6B35] rounded-full flex items-center justify-center"><svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg></div>}
                      </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM FIXED BAR */}
        <div className={`fixed bottom-0 left-0 right-0 border-t shadow-[0_-10px_30px_rgba(0,0,0,0.05)] p-5 z-50 bg-white border-gray-200`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Payment</p>
              <p className={`text-2xl font-black text-[#FF6B35]`}>Rp {calculateTotal().toLocaleString('id-ID')}</p>
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting || cart.length === 0}
              className={`px-8 py-4 font-bold rounded-xl uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 hover:bg-black text-white`}
            >
              {isSubmitting ? 'Processing...' : (calculateTotal() === 0 ? 'Claim Free Tickets' : 'Pay Now')}
            </button>
          </div>
        </div>
      </form>

      {/* ANIMASI LOADING TIKET GRATIS */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative bg-white`}>
            <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              {paymentStatus === 'processing' ? (
                <>
                  <div className={`w-16 h-16 border-4 rounded-full animate-spin mb-6 border-gray-100 border-t-[#FF6B35]`}></div>
                  <h3 className={`text-lg font-black uppercase tracking-wide text-gray-900`}>Processing Tickets...</h3>
                  <p className={`text-xs mt-2 font-medium text-gray-500`}>Saving data and emailing your tickets.</p>
                </>
              ) : (
                <>
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border-[6px] animate-bounce bg-green-50 text-green-500 border-green-100`}>
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className={`text-2xl font-black uppercase tracking-tight text-gray-900`}>Tickets Generated!</h3>
                  <p className={`text-sm mt-2 font-medium text-gray-500`}>Check your email for barcode details.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL QR CODE PEMBAYARAN (CAHAYA PAY) */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl p-8 text-center relative overflow-hidden"
            >
              <h2 className="text-2xl font-black text-gray-900 mb-1 uppercase tracking-tight">Scan QRIS</h2>
              <p className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-widest">Buka e-Wallet / M-Banking Anda</p>
              
              <div className="flex justify-center p-6 bg-gray-50 rounded-2xl mb-6 border border-gray-100 shadow-inner">
                 {qrData ? (
                   <QRCodeSVG value={qrData} size={220} level="H" />
                 ) : (
                   <div className="w-[220px] h-[220px] flex items-center justify-center animate-pulse bg-gray-200 rounded-xl">
                      <span className="text-sm font-bold text-gray-400 uppercase">Memuat...</span>
                   </div>
                 )}
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowQrModal(false);
                    navigate('/my-orders'); 
                  }}
                  className="w-full py-4 bg-[#FF6B35] text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-[#e85b2a] transition-all active:scale-95 shadow-lg"
                >
                  Saya Sudah Bayar / Refresh
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQrModal(false);
                    navigate('/my-orders'); 
                  }}
                  className="w-full py-3 text-gray-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  Tutup & Bayar Nanti
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
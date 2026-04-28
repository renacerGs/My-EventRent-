import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

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

  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
  // 🔥 FUNGSI BARU: TRIGGER MIDTRANS PAYMENT
  // ========================================================
  const handlePayWithMidtrans = async (e) => {
    e.preventDefault(); 

    if (cart.length === 0) return showPopup("Cart is empty!", "error");
    if (cart.find(item => item.qty < 1)) return showPopup("Minimum ticket quantity is 1 per category!", "error");

    const totalAmount = calculateTotal();

    if (totalAmount === 0) {
      setShowPaymentModal(true);
      executeRealPayment();
      return;
    }

    setIsSubmitting(true);
    try {
      let emailTamu = user?.email || ''; 
      let namaTamu = user?.name || 'EventRent Guest'; 
      
      if (!emailTamu && cart.length > 0) {
        const firstCartItem = cart[0];
        emailTamu = formAnswers[`cart-${firstCartItem.id}-ticket-0-email`] || 'guest@email.com';
        namaTamu = formAnswers[`cart-${firstCartItem.id}-ticket-0-nama`] || 'Guest';
      }

      const orderId = `TKT-${event.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      let activePayments = event?.paymentMethods || { qris: true, va: true, transferBank: false };
      
      if (typeof activePayments === 'string') {
        try { activePayments = JSON.parse(activePayments); } catch(e) {}
      }

      let allowedInMidtrans = [];
      if (activePayments.qris) allowedInMidtrans.push("gopay", "shopeepay", "other_qris");
      if (activePayments.va || activePayments.transferBank) allowedInMidtrans.push("bca_va", "bni_va", "bri_va", "permata_va", "echannel", "other_va");
      if (allowedInMidtrans.length === 0) allowedInMidtrans.push("other_qris");

      let tokenMidtrans = null;
      const isGuest = !user;

      if (isGuest) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/payment/test-midtrans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId, amount: totalAmount, name: namaTamu, email: emailTamu, enabledPayments: allowedInMidtrans 
          })
        });
        const data = await res.json();
        tokenMidtrans = data.token;
      } else {
        const supabaseToken = localStorage.getItem('supabase_token');
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/checkout`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseToken}`
          },
          body: JSON.stringify({
            eventId: event.id, cart: cart, formAnswers: formAnswers, enabledPayments: allowedInMidtrans
          })
        });
        const data = await res.json();
        tokenMidtrans = data.snapToken;
      }

      if (tokenMidtrans) {
        window.snap.pay(tokenMidtrans, {
          onSuccess: function(result) {
            setShowPaymentModal(true); 
            executeRealPayment(); 
          },
          onPending: function(result) {
            if (!isGuest) {
               showPopup("Payment pending. You can complete the payment in the My Orders menu!", "info");
               setTimeout(() => navigate('/my-orders'), 3000);
            } else {
               showPopup("Pending status! Please complete your VA/Transfer payment.", "info");
            }
          },
          onError: function(result) {
            showPopup("Payment failed. Please try again.", "error");
          },
          onClose: function() {
            if (!isGuest) {
               showPopup("Pop-up closed! Don't worry, your order is safely saved in the My Orders menu.", "info");
               setTimeout(() => navigate('/my-orders'), 3000);
            } else {
               showPopup("You closed the pop-up before completing the payment.", "error");
            }
          }
        });
      } else {
        showPopup("Failed to retrieve payment token from the server.", "error");
      }
    } catch (err) {
      console.error(err);
      showPopup("Network error occurred.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeRealPayment = async () => {
    setPaymentStatus('processing');
    
    const token = localStorage.getItem('supabase_token');

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
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tickets/buy`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setPaymentStatus('success');
        setTimeout(() => {
          navigate(`/event/${id}`); 
        }, 2000);
      } else {
        showPopup("Failed to process ticket: " + (data.message || 'Server error'), "error");
        setShowPaymentModal(false);
      }
    } catch (err) {
      console.error(err);
      showPopup("System error occurred while generating the ticket.", "error");
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
                {popup.type === 'error' ? 'Oops!' : popup.type === 'success' ? 'Success!' : 'Info'}
              </h2>
              <p className="text-white/90 font-medium mb-8">{popup.message}</p>
              <button 
                onClick={closePopup} 
                className={`w-full bg-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95 ${popup.type === 'error' ? 'text-[#E24A29] hover:bg-red-50' : popup.type === 'success' ? 'text-[#27AE60] hover:bg-green-50' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <form onSubmit={handlePayWithMidtrans}>
        
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

            <div className={`lg:col-span-8 bg-white border-gray-200 rounded-[32px] p-8 md:p-10 shadow-sm border`}>
              <h2 className={`text-2xl font-bold mb-6 border-b pb-4 text-gray-900 border-gray-100`}>
                Ticket Holder Data
              </h2>
              
              <div className="space-y-4">
                {cart.map((item, cartIndex) => {
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

                                {/* --- CUSTOM DROPDOWN --- */}
                                {q.answer_type === 'Dropdown' && (
                                  <CustomDropdown 
                                    options={q.options} 
                                    value={formAnswers[formKey] || ''} 
                                    onChange={(val) => setFormAnswers(prev => ({...prev, [formKey]: val}))} 
                                    placeholder="Select Answer..." 
                                    required={q.is_required}
                                  />
                                )}

                                {/* --- CUSTOM CHECKBOX --- */}
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

      {/* ======================================================= */}
      {/* ANIMASI LOADING & SUKSES SETELAH MIDTRANS               */}
      {/* ======================================================= */}
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
                  <h3 className={`text-2xl font-black uppercase tracking-tight text-gray-900`}>
                    Tickets Generated!
                  </h3>
                  <p className={`text-sm mt-2 font-medium text-gray-500`}>
                     Check your email to view your ticket barcodes.
                  </p>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
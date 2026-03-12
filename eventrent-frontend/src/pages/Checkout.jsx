import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

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

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/events/${id}`);
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
              alert("Maaf bro, semua tiket sudah habis terjual!");
              navigate(`/event/${id}`);
            }
          } else if (preferredSessionId) {
            const initialSession = data.sessions.find(s => String(s.id) === String(preferredSessionId) && s.stock > 0);
            if (initialSession) setCart([{ id: crypto.randomUUID(), sessionId: initialSession.id, qty: 1 }]);
          } else {
            const initialSession = data.sessions.find(s => s.stock > 0);
            if (initialSession) setCart([{ id: crypto.randomUUID(), sessionId: initialSession.id, qty: 1 }]);
          }
        }
      } catch (err) {
        console.error(err);
        alert("Gagal memuat data checkout");
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, navigate, preferredSessionId, user]);

  const handleAddCartItem = () => {
    const availableSession = event.sessions.find(s => s.stock > 0 && !cart.some(item => String(item.sessionId) === String(s.id)));
    if (!availableSession) return alert("Semua tipe tiket sudah kamu pilih bro!");
    setCart([...cart, { id: crypto.randomUUID(), sessionId: availableSession.id, qty: 1 }]);
  };

  const handleRemoveCartItem = (cartId) => {
    if (cart.length === 1) return alert("Minimal beli 1 tiket bro!");
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

    if (cart.length === 0) return alert("Keranjang kosong bro!");
    const invalidItem = cart.find(item => item.qty < 1);
    if (invalidItem) return alert("Jumlah tiket minimal 1 per pilihan ya bro!");
    
    // --- PERBAIKAN LOGIKA POP UP TIKET GRATIS ---
    setShowPaymentModal(true); // Selalu buka Pop Up
    if (calculateTotal() === 0) {
      setPaymentMethod('free'); // Set mode 'free' otomatis
    } else {
      setPaymentMethod(null); // Reset biar milih bayar pakai apa
    }
  };

  const executeRealPayment = async () => {
    setPaymentStatus('processing');
    setIsSubmitting(true);
    
    try {
      const payload = { userId: user.id, eventId: event.id, cart: cart, formAnswers: formAnswers };
      const res = await fetch('http://localhost:3000/api/tickets/buy', {
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
        alert("Gagal bayar: " + (data.message || 'Terjadi kesalahan di server'));
        setShowPaymentModal(false);
        setPaymentStatus('idle');
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan atau server mati.");
      setShowPaymentModal(false);
      setPaymentStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Loading Checkout...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans pt-10">
      
      <form onSubmit={handleOpenPaymentModal}>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center gap-4 mb-8">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-[#FF6B35] hover:border-[#FF6B35] shadow-sm transition-all active:scale-95" 
              title="Kembali ke Event"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 uppercase tracking-tight leading-none mb-1">Checkout Tiket</h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{event.title}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <div className="lg:col-span-4 space-y-4">
              {cart.map((item, index) => {
                const selectedSession = event.sessions.find(s => String(s.id) === String(item.sessionId));
                const availableStock = selectedSession ? selectedSession.stock : 0;

                return (
                  <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold text-[#FF6B35] uppercase tracking-widest">Pilihan {index + 1}</span>
                      {cart.length > 1 && (
                        <button type="button" onClick={() => handleRemoveCartItem(item.id)} className="text-gray-400 hover:text-red-500 font-bold text-sm">✕ Hapus</button>
                      )}
                    </div>
                    <select value={item.sessionId} onChange={(e) => updateCartItem(item.id, 'sessionId', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 mb-4 focus:ring-1 focus:ring-[#FF6B35] outline-none">
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
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Sisa Stok</p>
                        <p className="text-sm font-bold text-gray-900">{availableStock} Tiket</p>
                      </div>
                      <div className="flex items-center bg-gray-100 rounded-xl p-1">
                        <button type="button" onClick={() => item.qty > 1 && updateCartItem(item.id, 'qty', item.qty - 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-gray-600 hover:bg-gray-200 font-bold shadow-sm">-</button>
                        <span className="w-10 text-center font-bold text-gray-900">{item.qty}</span>
                        <button type="button" onClick={() => item.qty < availableStock && updateCartItem(item.id, 'qty', item.qty + 1)} className="w-8 h-8 flex items-center justify-center bg-[#FF6B35] rounded-lg text-white hover:bg-orange-600 font-bold shadow-sm">+</button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {canAddNewSession && (
                <button type="button" onClick={handleAddCartItem} className="w-full py-4 border-2 border-dashed border-green-500 text-green-600 font-bold rounded-2xl hover:bg-green-50 transition-colors uppercase text-xs tracking-widest">+ Tambah Pilihan Tiket</button>
              )}
            </div>

            <div className="lg:col-span-8 bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4">Data Peserta</h2>
              {cart.map((item, cartIndex) => {
                const session = event.sessions.find(s => String(s.id) === String(item.sessionId));
                if (!session) return null;
                return Array.from({ length: item.qty }).map((_, qtyIndex) => {
                  const formKeyPrefix = `cart-${item.id}-ticket-${qtyIndex}`;
                  return (
                    <div key={formKeyPrefix} className="mb-10 last:mb-0">
                      <div className="bg-orange-50 text-[#FF6B35] px-4 py-2 rounded-lg font-bold text-sm mb-5 inline-block border border-orange-100">
                        Tiket {cartIndex + 1}.{qtyIndex + 1} - <span className="uppercase">{session.name}</span>
                      </div>
                      <div className="space-y-4 pl-2 md:pl-4 border-l-2 border-gray-100">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-2">Nama Lengkap <span className="text-red-500">*</span></label>
                          <input type="text" required value={formAnswers[`${formKeyPrefix}-nama`] || ''} onChange={(e) => setFormAnswers(prev => ({...prev, [`${formKeyPrefix}-nama`]: e.target.value}))} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35]" placeholder="Masukkan nama sesuai KTP" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                          <input type="email" required value={formAnswers[`${formKeyPrefix}-email`] || ''} onChange={(e) => setFormAnswers(prev => ({...prev, [`${formKeyPrefix}-email`]: e.target.value}))} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35]" placeholder="Masukkan email aktif" />
                        </div>
                        {session.questions && session.questions.map((q) => (
                          <div key={q.id}>
                            <label className="block text-xs font-bold text-gray-700 mb-2">{q.question_text} {q.is_required && <span className="text-red-500">*</span>}</label>
                            {q.answer_type === 'Text' ? (
                              <input type="text" required={q.is_required} value={formAnswers[`${formKeyPrefix}-q${q.id}`] || ''} onChange={(e) => setFormAnswers(prev => ({...prev, [`${formKeyPrefix}-q${q.id}`]: e.target.value}))} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35]" placeholder="Ketik jawaban..." />
                            ) : (
                              <textarea required={q.is_required} value={formAnswers[`${formKeyPrefix}-q${q.id}`] || ''} onChange={(e) => setFormAnswers(prev => ({...prev, [`${formKeyPrefix}-q${q.id}`]: e.target.value}))} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35]" rows="3" placeholder="Ketik jawaban detail..." />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] p-5 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Pembayaran</p>
              <p className="text-2xl font-black text-[#FF6B35]">Rp {calculateTotal().toLocaleString('id-ID')}</p>
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting || cart.length === 0}
              className="px-8 py-4 bg-gray-900 text-white font-bold rounded-xl uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Memproses...' : 'Lanjut Bayar'}
            </button>
          </div>
        </div>

      </form>

      {/* ======================================================= */}
      {/* POP UP PAYMENT GATEWAY MOCKUP                           */}
      {/* ======================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative">
            
            {paymentStatus === 'idle' && (
              <button 
                type="button"
                onClick={() => { setShowPaymentModal(false); setPaymentMethod(null); }} 
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-900 bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            )}

            {/* STATE 1: PILIH METODE BAYAR (Hanya kalau tiket berbayar) */}
            {paymentStatus === 'idle' && !paymentMethod && calculateTotal() > 0 && (
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

            {/* STATE 2: DETAIL PEMBAYARAN ATAU TIKET GRATIS */}
            {paymentStatus === 'idle' && paymentMethod && (
              <div className="p-8 text-center">
                {/* Tombol kembali cuma muncul kalau milih QR/VA */}
                {paymentMethod !== 'free' && (
                  <button type="button" onClick={() => setPaymentMethod(null)} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 mb-6 flex items-center justify-center w-full">
                    ← Ganti Metode
                  </button>
                )}

                {paymentMethod === 'free' ? (
                  <>
                    <h3 className="text-2xl font-black text-gray-900 mb-2">Tiket Gratis! 🎉</h3>
                    <p className="text-sm text-gray-500 mb-8 font-medium">Asyik, kamu gak perlu bayar sepeserpun untuk event ini.</p>
                    <div className="w-32 h-32 mx-auto bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-8 border-[8px] border-green-100">
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

                {/* Tampilan Total Harga (Sembunyi kalau gratis) */}
                {paymentMethod !== 'free' && (
                  <div className="bg-orange-50 text-[#FF6B35] p-4 rounded-xl font-black text-xl mb-8 border border-orange-100">
                    Rp {calculateTotal().toLocaleString('id-ID')}
                  </div>
                )}

                <button 
                  type="button"
                  onClick={executeRealPayment}
                  className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all active:scale-95"
                >
                  {paymentMethod === 'free' ? 'Dapatkan Tiket' : 'Saya Sudah Bayar'}
                </button>
              </div>
            )}

            {/* STATE 3: PROCESSING / SUCCESS */}
            {paymentStatus !== 'idle' && (
              <div className="p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                {paymentStatus === 'processing' ? (
                  <>
                    <div className="w-16 h-16 border-4 border-gray-100 border-t-[#FF6B35] rounded-full animate-spin mb-6"></div>
                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-wide">Memverifikasi...</h3>
                    <p className="text-xs text-gray-500 mt-2 font-medium">Jangan tutup halaman ini</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 border-[6px] border-green-100 animate-bounce">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                      {paymentMethod === 'free' ? 'Tiket Diklaim!' : 'Pembayaran Sukses!'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2 font-medium">Tiket kamu sedang disiapkan...</p>
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
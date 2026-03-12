import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Nangkep parameter ?session=xxx dari URL
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const preferredSessionId = queryParams.get('session'); 

  const user = JSON.parse(localStorage.getItem('user'));

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [cart, setCart] = useState([]);
  const [formAnswers, setFormAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) navigate('/');
    
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/events/${id}`);
        if (!res.ok) throw new Error("Gagal load");
        const data = await res.json();
        setEvent(data);
        
        if (data.sessions && data.sessions.length > 0) {
          let initialSession;
          
          // 1. Coba cari sesi yang sesuai dengan URL parameter dan masih ada stoknya
          if (preferredSessionId) {
            initialSession = data.sessions.find(s => String(s.id) === String(preferredSessionId) && s.stock > 0);
          }
          
          // 2. Kalau gak ketemu (karena URL kosong atau stok sesi itu habis), cari sesi pertama yang ready
          if (!initialSession) {
            initialSession = data.sessions.find(s => s.stock > 0);
          }

          // 3. Masukin ke keranjang
          if (initialSession) {
            setCart([{ id: crypto.randomUUID(), sessionId: initialSession.id, qty: 1 }]);
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
  }, [id, navigate, preferredSessionId]);

  const handleAddCartItem = () => {
    const availableSession = event.sessions.find(s => 
      s.stock > 0 && !cart.some(item => String(item.sessionId) === String(s.id))
    );

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

  const canAddNewSession = event?.sessions?.some(s => 
    s.stock > 0 && !cart.some(item => String(item.sessionId) === String(s.id))
  );

  const handleProceedPayment = async () => {
    if (cart.length === 0) return alert("Keranjang kosong bro!");

    const invalidItem = cart.find(item => item.qty < 1);
    if (invalidItem) return alert("Jumlah tiket minimal 1 per pilihan ya bro!");

    setIsSubmitting(true);
    try {
      const payload = {
        userId: user.id,
        eventId: event.id,
        cart: cart,         
        formAnswers: formAnswers 
      };

      const res = await fetch('http://localhost:3000/api/tickets/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        alert("Mantap bro! Tiket berhasil dibeli dan masuk ke database! 🎉");
        navigate(`/event/${id}`); 
      } else {
        alert("Gagal bayar: " + (data.message || 'Terjadi kesalahan di server'));
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan atau server mati.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Loading Checkout...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans pt-10">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* --- HEADER DENGAN TOMBOL BACK --- */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-[#FF6B35] hover:border-[#FF6B35] shadow-sm transition-all active:scale-95"
            title="Kembali ke Event"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 uppercase tracking-tight leading-none mb-1">Checkout Tiket</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{event.title}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ======================================================= */}
          {/* KIRI: PENGATURAN TIKET / SESSION                        */}
          {/* ======================================================= */}
          <div className="lg:col-span-4 space-y-4">
            {cart.map((item, index) => {
              const selectedSession = event.sessions.find(s => String(s.id) === String(item.sessionId));
              const availableStock = selectedSession ? selectedSession.stock : 0;

              return (
                <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-[#FF6B35] uppercase tracking-widest">Pilihan {index + 1}</span>
                    {cart.length > 1 && (
                      <button onClick={() => handleRemoveCartItem(item.id)} className="text-gray-400 hover:text-red-500 font-bold text-sm">✕ Hapus</button>
                    )}
                  </div>

                  {/* Dropdown Pilih Session */}
                  <select 
                    value={item.sessionId} 
                    onChange={(e) => updateCartItem(item.id, 'sessionId', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 mb-4 focus:ring-1 focus:ring-[#FF6B35] outline-none"
                  >
                    {event.sessions.map(s => {
                      const isAlreadySelectedByOtherCartItem = cart.some(c => String(c.sessionId) === String(s.id) && c.id !== item.id);
                      const isOutOfStock = s.stock < 1;

                      return (
                        <option key={s.id} value={s.id} disabled={isOutOfStock || isAlreadySelectedByOtherCartItem}>
                          {s.name} - {Number(s.price) === 0 ? 'FREE' : `Rp ${parseInt(s.price).toLocaleString('id-ID')}`} 
                          {isOutOfStock ? ' (Habis)' : isAlreadySelectedByOtherCartItem ? ' (Sudah Dipilih)' : ''}
                        </option>
                      );
                    })}
                  </select>

                  {/* Atur Jumlah & Info Stok */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Sisa Stok</p>
                      <p className="text-sm font-bold text-gray-900">{availableStock} Tiket</p>
                    </div>
                    
                    <div className="flex items-center bg-gray-100 rounded-xl p-1">
                      <button 
                        onClick={() => item.qty > 1 && updateCartItem(item.id, 'qty', item.qty - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-gray-600 hover:bg-gray-200 font-bold shadow-sm"
                      >-</button>
                      <span className="w-10 text-center font-bold text-gray-900">{item.qty}</span>
                      <button 
                        onClick={() => item.qty < availableStock && updateCartItem(item.id, 'qty', item.qty + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-[#FF6B35] rounded-lg text-white hover:bg-orange-600 font-bold shadow-sm"
                      >+</button>
                    </div>
                  </div>
                </div>
              );
            })}

            {canAddNewSession && (
              <button 
                onClick={handleAddCartItem} 
                className="w-full py-4 border-2 border-dashed border-green-500 text-green-600 font-bold rounded-2xl hover:bg-green-50 transition-colors uppercase text-xs tracking-widest"
              >
                + Tambah Pilihan Tiket
              </button>
            )}
          </div>

          {/* ======================================================= */}
          {/* KANAN: FORM PESERTA DINAMIS                             */}
          {/* ======================================================= */}
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
                        <input 
                          type="text" 
                          required
                          onChange={(e) => setFormAnswers(prev => ({...prev, [`${formKeyPrefix}-nama`]: e.target.value}))}
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35]" 
                          placeholder="Masukkan nama sesuai KTP" 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                        <input 
                          type="email" 
                          required
                          onChange={(e) => setFormAnswers(prev => ({...prev, [`${formKeyPrefix}-email`]: e.target.value}))}
                          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35]" 
                          placeholder="Masukkan email aktif" 
                        />
                      </div>

                      {session.questions && session.questions.map((q) => (
                        <div key={q.id}>
                          <label className="block text-xs font-bold text-gray-700 mb-2">
                            {q.question_text} {q.is_required && <span className="text-red-500">*</span>}
                          </label>
                          
                          {q.answer_type === 'Text' ? (
                            <input 
                              type="text" 
                              required={q.is_required}
                              onChange={(e) => setFormAnswers(prev => ({...prev, [`${formKeyPrefix}-q${q.id}`]: e.target.value}))}
                              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35]" 
                              placeholder="Ketik jawaban..." 
                            />
                          ) : (
                            <textarea 
                              required={q.is_required}
                              onChange={(e) => setFormAnswers(prev => ({...prev, [`${formKeyPrefix}-q${q.id}`]: e.target.value}))}
                              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35]" 
                              rows="3" placeholder="Ketik jawaban detail..." 
                            />
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
            onClick={handleProceedPayment}
            disabled={isSubmitting || cart.length === 0}
            className="px-8 py-4 bg-gray-900 text-white font-bold rounded-xl uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Memproses...' : 'Lanjut Bayar'}
          </button>
        </div>
      </div>

    </div>
  );
}
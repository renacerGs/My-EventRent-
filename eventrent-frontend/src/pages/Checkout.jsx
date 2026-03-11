import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // STATE KERANJANG (BAGIAN KIRI)
  // Format: [{ id: unik, sessionId: ID, qty: 1 }]
  const [cart, setCart] = useState([]);

  // STATE JAWABAN FORM (BAGIAN KANAN)
  const [formAnswers, setFormAnswers] = useState({});

  useEffect(() => {
    if (!user) navigate('/');
    
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/events/${id}`);
        if (!res.ok) throw new Error("Gagal load");
        const data = await res.json();
        setEvent(data);
        
        // Default cart: Masukin session pertama sebanyak 1 tiket (kalau ada stoknya)
        if (data.sessions && data.sessions.length > 0) {
          const firstAvailable = data.sessions.find(s => s.stock > 0);
          if (firstAvailable) {
            setCart([{ id: crypto.randomUUID(), sessionId: firstAvailable.id, qty: 1 }]);
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
  }, [id, navigate]);

  // --- LOGIC BAGIAN KIRI (KERANJANG) ---
  const handleAddCartItem = () => {
    const availableSession = event.sessions.find(s => s.stock > 0);
    if (!availableSession) return alert("Semua tiket habis bro!");
    
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

  // --- LOGIC SUBMIT (SEMENTARA) ---
  const handleProceedPayment = () => {
    console.log("Keranjang Belanja:", cart);
    console.log("Jawaban Form Peserta:", formAnswers);
    alert("Cek Console Log bro! Data keranjang dan jawaban udah siap dikirim ke API.");
    // TODO: Nanti disambungin ke API Checkout beneran
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Loading Checkout...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-32 font-sans pt-10">
      <div className="max-w-7xl mx-auto px-4">
        
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 uppercase">Checkout Tiket</h1>
        <p className="text-sm text-gray-500 font-medium mb-8">Event: {event.title}</p>

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
                    <span className="text-xs font-bold text-[#FF6B35] uppercase tracking-widest">Tiket {index + 1}</span>
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
                    {event.sessions.map(s => (
                      <option key={s.id} value={s.id} disabled={s.stock < 1}>
                        {s.name} - {Number(s.price) === 0 ? 'FREE' : `Rp ${parseInt(s.price).toLocaleString('id-ID')}`} {s.stock < 1 ? '(Habis)' : ''}
                      </option>
                    ))}
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

            <button 
              onClick={handleAddCartItem} 
              className="w-full py-4 border-2 border-dashed border-green-500 text-green-600 font-bold rounded-2xl hover:bg-green-50 transition-colors uppercase text-xs tracking-widest"
            >
              + Tambah Pilihan Tiket
            </button>
          </div>

          {/* ======================================================= */}
          {/* KANAN: FORM PESERTA DINAMIS                             */}
          {/* ======================================================= */}
          <div className="lg:col-span-8 bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-100 pb-4">Data Peserta</h2>

            {/* LOOPING: Untuk setiap item di keranjang... */}
            {cart.map((item, cartIndex) => {
              const session = event.sessions.find(s => String(s.id) === String(item.sessionId));
              if (!session) return null;

              // LOOPING: ...Render form sebanyak jumlah qty (tiket) yang dibeli
              return Array.from({ length: item.qty }).map((_, qtyIndex) => {
                const formKeyPrefix = `cart-${item.id}-ticket-${qtyIndex}`;

                return (
                  <div key={formKeyPrefix} className="mb-10 last:mb-0">
                    <div className="bg-orange-50 text-[#FF6B35] px-4 py-2 rounded-lg font-bold text-sm mb-5 inline-block border border-orange-100">
                      Tiket {cartIndex + 1}.{qtyIndex + 1} - <span className="uppercase">{session.name}</span>
                    </div>

                    <div className="space-y-4 pl-2 md:pl-4 border-l-2 border-gray-100">
                      {/* Default Form (Name & Email) */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">Nama Lengkap</label>
                        <input type="text" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35]" placeholder="Masukkan nama peserta" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">Email</label>
                        <input type="email" className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#FF6B35]" placeholder="Masukkan email peserta" />
                      </div>

                      {/* Custom Questions dari Backend */}
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

      {/* STICKY BOTTOM BAR UNTUK PEMBAYARAN */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] p-5 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Pembayaran</p>
            <p className="text-2xl font-black text-[#FF6B35]">Rp {calculateTotal().toLocaleString('id-ID')}</p>
          </div>
          <button 
            onClick={handleProceedPayment}
            className="px-8 py-4 bg-gray-900 text-white font-bold rounded-xl uppercase tracking-widest text-sm shadow-xl hover:bg-black transition-all active:scale-95"
          >
            Lanjut Bayar
          </button>
        </div>
      </div>

    </div>
  );
}
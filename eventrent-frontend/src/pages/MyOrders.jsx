import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase Client untuk akses Storage
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function MyOrders() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State untuk mengontrol Modal QR Code Cahaya Pay
  const [activeQrUrl, setActiveQrUrl] = useState(null);

  // 🔥 STATE BARU UNTUK MODAL UPLOAD BUKTI TRANSFER
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu untuk melihat pesanan Anda!');
      navigate('/');
      return;
    }
    fetchOrders(); 
  }, [user?.id, navigate]);

  const fetchOrders = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true); 
      
      const authKey = Object.keys(localStorage).find(key => key.endsWith('-auth-token'));
      const sessionStr = authKey ? localStorage.getItem(authKey) : null;
      let token = '';

      if (sessionStr) {
        const sessionData = JSON.parse(sessionStr);
        token = sessionData.access_token;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/my`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else {
        if (!isBackground) toast.error('Gagal mengambil riwayat pesanan');
      }
    } catch (err) {
      console.error(err);
      if (!isBackground) toast.error('Terjadi kesalahan jaringan');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // ========================================================
  // FUNGSI PEMBAYARAN & UPLOAD BUKTI
  // ========================================================

  const handlePayNow = (order) => {
    if (order.snap_token === 'MANUAL_TRANSFER') {
      // Arahkan ke halaman UploadProof yang baru!
      navigate(`/upload-proof/${order.order_id}`);
    } else if (order.snap_token) {
      // Buka modal QR jika ini pakai Cahaya Pay
      setActiveQrUrl(order.snap_token);
    } else {
      toast.error('Metode pembayaran tidak valid.');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validasi ukuran & tipe
    if (selectedFile.size > 5 * 1024 * 1024) {
      return toast.error('Ukuran file maksimal 5MB!');
    }
    if (!selectedFile.type.startsWith('image/')) {
      return toast.error('Harap upload file berupa gambar (JPG/PNG).');
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selectedOrder) return toast.error('Pilih gambar terlebih dahulu!');

    setIsUploading(true);
    try {
      // 1. Upload ke Supabase Storage (Bucket: payment_proofs)
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedOrder.order_id}-${Date.now()}.${fileExt}`;
      const filePath = `transfers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Dapatkan URL Publik Gambar
      const { data: { publicUrl } } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(filePath);

      // 3. Kirim URL Publik ke Backend NestJS kita
      const authKey = Object.keys(localStorage).find(key => key.endsWith('-auth-token'));
      const sessionStr = authKey ? localStorage.getItem(authKey) : null;
      const token = sessionStr ? JSON.parse(sessionStr).access_token : '';

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${selectedOrder.order_id}/proof`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ proofUrl: publicUrl })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Gagal update status pesanan');
      }

      // Bersihkan Modal & Refresh Order
      toast.success('Bukti berhasil diunggah! Menunggu verifikasi admin.');
      closeUploadModal();
      fetchOrders(true);

    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Gagal mengunggah bukti transfer.');
    } finally {
      setIsUploading(false);
    }
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedOrder(null);
    setFile(null);
    setPreviewUrl(null);
  };

  const closeQrModal = () => {
    setActiveQrUrl(null);
    fetchOrders(true); // Refresh data di background untuk cek webhook Cahaya
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-[#FF6B35] rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-widest text-xs font-bold text-slate-400">Loading Orders...</p>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-20 relative text-left">

      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-8 md:pt-12 relative z-10">
        
        {/* HEADER */}
        <div className="flex items-center gap-3 md:gap-4 mb-8">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center shrink-0 bg-white rounded-full border border-gray-200 text-gray-500 transition-all hover:border-[#FF6B35] hover:text-[#FF6B35] shadow-sm active:scale-95"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg> 
          </button>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">My Orders</h1>
            <p className="text-[10px] md:text-sm font-medium text-slate-500 mt-1">Your transaction history and ticket bills, bro.</p>
          </div>
        </div>

        {/* DAFTAR PESANAN */}
        {orders.length === 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] py-20 text-center relative z-10">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
               <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
             </div>
             <p className="font-black text-slate-900 text-lg tracking-tight mb-1">No Orders Yet</p>
             <p className="text-xs font-medium text-slate-500">You haven't made any orders yet.</p>
             <button onClick={() => navigate('/')} className="mt-6 px-6 py-2.5 bg-[#FF6B35] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">SEARCH FOR EVENTS NOW</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-slate-200 hover:border-[#FF6B35]/30 rounded-[24px] p-5 md:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 md:items-center justify-between">
                
                {/* INFO EVENT & ORDER ID */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                    <img src={order.event_img || 'https://via.placeholder.com/150'} alt={order.event_title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 mb-1.5 inline-block">#{order.order_id}</span>
                    <h3 className="font-black text-slate-900 text-base md:text-lg leading-tight line-clamp-1">{order.event_title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">{order.event_date}</p>
                  </div>
                </div>

                {/* STATUS & HARGA */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t border-slate-100 md:border-none pt-4 md:pt-0 gap-3">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Amount</p>
                    <p className="font-black text-slate-900 text-lg">Rp {Number(order.total_price).toLocaleString('id-ID')}</p>
                  </div>

                  {/* LOGIKA PERUBAHAN STATUS TAMPILAN */}
                  {order.payment_status === 'PENDING' ? (
                    <button 
                      onClick={() => handlePayNow(order)}
                      className="bg-[#FF6B35] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 whitespace-nowrap active:scale-95 border border-orange-400 animate-pulse"
                    >
                      {order.snap_token === 'MANUAL_TRANSFER' ? 'Upload Bukti Transfer' : 'Scan QRIS'}
                    </button>
                  ) : order.payment_status === 'WAITING_VERIFICATION' ? (
                    <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-yellow-200 whitespace-nowrap">
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Menunggu Verifikasi
                    </span>
                  ) : order.payment_status === 'SUCCESS' ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200 whitespace-nowrap">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Lunas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-200 whitespace-nowrap">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg> Dibatalkan / Expired
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>


      {/* ======================================================= */}
      {/* MODAL QR CODE PEMBAYARAN (CAHAYA PAY)                   */}
      {/* ======================================================= */}
      <AnimatePresence>
        {activeQrUrl && (
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
                 <QRCodeSVG value={activeQrUrl} size={220} level="H" />
              </div>

              <div className="space-y-3">
                <button
                  onClick={closeQrModal}
                  className="w-full py-4 bg-[#FF6B35] text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-[#e85b2a] transition-all active:scale-95 shadow-lg"
                >
                  Saya Sudah Bayar / Refresh
                </button>
                <button
                  onClick={() => setActiveQrUrl(null)}
                  className="w-full py-3 text-gray-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
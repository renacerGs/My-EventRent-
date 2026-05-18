import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 🔥 KOMPONEN SKELETON ORDER LIST 🔥
const OrderSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-[24px] p-5 md:p-6 shadow-sm flex flex-col md:flex-row gap-5 md:items-center justify-between animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-200 rounded-xl shrink-0"></div>
      <div>
        <div className="w-20 h-4 bg-slate-200 rounded mb-2"></div>
        <div className="w-48 md:w-64 h-5 md:h-6 bg-slate-200 rounded mb-2"></div>
        <div className="w-32 h-3 bg-slate-200 rounded"></div>
      </div>
    </div>
    <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t border-slate-100 md:border-none pt-4 md:pt-0 gap-3">
      <div className="text-left md:text-right">
        <div className="w-24 h-3 bg-slate-200 rounded mb-1 ml-auto"></div>
        <div className="w-32 h-6 bg-slate-200 rounded ml-auto"></div>
      </div>
      <div className="w-32 h-10 bg-slate-200 rounded-xl"></div>
    </div>
  </div>
);

// 🔥 KOMPONEN TIMER COUNTDOWN 🔥
const CountdownTimer = ({ createdAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Set batas waktu 30 Menit (1800000 milidetik) dari waktu order dibuat
    const expireTime = new Date(createdAt).getTime() + (30 * 60 * 1000);

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expireTime - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeLeft('00:00');
        setIsExpired(true);
        if (onExpire) onExpire();
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt, onExpire]);

  if (isExpired) return null; // Kalau expired, timernya ilangin aja

  return (
    <span className="text-[10px] font-mono text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded border border-red-100 mb-1.5 inline-flex items-center gap-1">
      <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      {timeLeft}
    </span>
  );
};

export default function MyOrders() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeQr, setActiveQr] = useState({ url: null, orderId: null });
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('Please login first to view your orders!');
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
        let data = await res.json();
        
        // 🔥 FRONTEND LOGIC: Cek expired secara manual berdasarkan waktu sekarang 🔥
        const now = new Date().getTime();
        data = data.map(order => {
           if (order.payment_status === 'PENDING') {
              const expireTime = new Date(order.created_at).getTime() + (30 * 60 * 1000);
              if (now >= expireTime) {
                 return { ...order, payment_status: 'EXPIRED' };
              }
           }
           return order;
        });

        setOrders(data);
      } else {
        if (!isBackground) toast.error('Failed to fetch order history.');
      }
    } catch (err) {
      console.error(err);
      if (!isBackground) toast.error('A network error occurred.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  // 🔥 FUNGSI BUAT NANGANIN KETIKA TIMER ABIS 🔥
  const handleOrderExpired = (orderId) => {
    setOrders(prevOrders => prevOrders.map(o => 
      o.order_id === orderId ? { ...o, payment_status: 'EXPIRED' } : o
    ));
    toast.error(`Order #${orderId} has expired!`);
  };

  const handlePayNow = (order) => {
    if (order.snap_token === 'MANUAL_TRANSFER') {
      navigate(`/upload-proof/${order.order_id}`);
    } else if (order.snap_token) {
      setActiveQr({ url: order.snap_token, orderId: order.order_id });
    } else {
      toast.error('Invalid payment method.');
    }
  };

  const closeQrModal = () => {
    setActiveQr({ url: null, orderId: null });
    fetchOrders(true); 
  };

  const handleRefreshStatus = async () => {
    if (!activeQr.orderId) return;
    const toastId = toast.loading('Checking status with the central server...');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${activeQr.orderId}/check-status`);
      const data = await res.json();
      
      if (res.ok && data.status === 'SUCCESS') {
        toast.success(data.message || 'Payment confirmed!', { id: toastId });
        closeQrModal(); 
      } else {
        toast.error(data.message || 'Payment not received yet, please try again in a moment.', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to check network status.', { id: toastId });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      return toast.error('Maximum file size is 5MB!');
    }
    if (!selectedFile.type.startsWith('image/')) {
      return toast.error('Please upload an image file (JPG/PNG).');
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file || !selectedOrder) return toast.error('Please select an image first!');

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedOrder.order_id}-${Date.now()}.${fileExt}`;
      const filePath = `transfers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(filePath);

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
        throw new Error(errData.message || 'Failed to update order status.');
      }

      toast.success('Proof uploaded successfully! Waiting for admin verification.');
      closeUploadModal();
      fetchOrders(true);

    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to upload transfer proof.');
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
            <p className="text-[10px] md:text-sm font-medium text-slate-500 mt-1">Your transaction history and ticket bills.</p>
          </div>
        </div>

        {/* ORDER LIST / SKELETON */}
        {loading ? (
          <div className="grid grid-cols-1 gap-5">
            {[...Array(3)].map((_, index) => (
              <OrderSkeleton key={index} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white border border-slate-200 shadow-sm rounded-[32px] py-20 text-center relative z-10">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
               <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
             </div>
             <p className="font-black text-slate-900 text-lg tracking-tight mb-1">No Orders Yet</p>
             <p className="text-xs font-medium text-slate-500">You haven't made any orders yet.</p>
             <button onClick={() => navigate('/')} className="mt-6 px-6 py-2.5 bg-[#FF6B35] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20">SEARCH FOR EVENTS NOW</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {orders.map((order) => (
              <div key={order.order_id} className={`bg-white border border-slate-200 rounded-[24px] p-5 md:p-6 shadow-sm transition-all flex flex-col md:flex-row gap-5 md:items-center justify-between ${order.payment_status === 'EXPIRED' ? 'opacity-70 grayscale-[50%]' : 'hover:border-[#FF6B35]/30 hover:shadow-md'}`}>
                
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                    <img src={order.event_img || 'https://via.placeholder.com/150'} alt={order.event_title} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">#{order.order_id}</span>
                      
                      {/* 🔥 PANGGIL TIMER DISINI JIKA PENDING 🔥 */}
                      {order.payment_status === 'PENDING' && (
                        <CountdownTimer createdAt={order.created_at} onExpire={() => handleOrderExpired(order.order_id)} />
                      )}
                    </div>
                    
                    <h3 className="font-black text-slate-900 text-base md:text-lg leading-tight line-clamp-1">{order.event_title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">{order.event_date}</p>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t border-slate-100 md:border-none pt-4 md:pt-0 gap-3">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Amount</p>
                    <p className={`font-black text-lg ${order.payment_status === 'EXPIRED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>Rp {Number(order.total_price).toLocaleString('id-ID')}</p>
                  </div>

                  {order.payment_status === 'PENDING' ? (
                    <button 
                      onClick={() => handlePayNow(order)}
                      className="bg-[#FF6B35] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 whitespace-nowrap active:scale-95 border border-orange-400 animate-pulse"
                    >
                      {order.snap_token === 'MANUAL_TRANSFER' ? 'Upload Transfer Proof' : 'Scan QRIS'}
                    </button>
                  ) : order.payment_status === 'WAITING_VERIFICATION' ? (
                    <span className="inline-flex items-center gap-1.5 bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-yellow-200 whitespace-nowrap">
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg> Waiting Verification
                    </span>
                  ) : order.payment_status === 'SUCCESS' ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200 whitespace-nowrap">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-200 whitespace-nowrap">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg> EXPIRED
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      <AnimatePresence>
        {activeQr.url && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl p-8 text-center relative overflow-hidden"
            >
              <h2 className="text-2xl font-black text-gray-900 mb-1 uppercase tracking-tight">Scan QRIS</h2>
              <p className="text-xs font-bold text-gray-500 mb-6 uppercase tracking-widest">Open your e-Wallet or Mobile Banking</p>
              
              <div className="flex justify-center p-6 bg-gray-50 rounded-2xl mb-6 border border-gray-100 shadow-inner">
                 <QRCodeSVG value={activeQr.url} size={220} level="H" />
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRefreshStatus}
                  className="w-full py-4 bg-[#FF6B35] text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-[#e85b2a] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                  I Have Paid
                </button>
                <button
                  onClick={closeQrModal}
                  className="w-full py-3 text-gray-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors"
                >
                  Close & Pay Later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
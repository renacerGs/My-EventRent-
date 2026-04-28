import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function MyOrders() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.error('Please login first to view your orders!');
      navigate('/');
      return;
    }
    fetchOrders(); 

    const scriptId = 'midtrans-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'; 
      script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
      document.body.appendChild(script);
    }
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
        if (!isBackground) toast.error('Failed to fetch order history');
      }
    } catch (err) {
      console.error(err);
      if (!isBackground) toast.error('Network error occurred');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handlePayNow = (order) => {
    if (!window.snap) {
      toast.error('Payment system is not ready yet, please wait.');
      return;
    }

    window.snap.pay(order.snap_token, {
      onSuccess: async function (result) {
        toast.loading('Generating your ticket...', { id: 'process-ticket' });
        try {
          const authKey = Object.keys(localStorage).find(key => key.endsWith('-auth-token'));
          const sessionStr = authKey ? localStorage.getItem(authKey) : null;
          let token = '';
          
          if (sessionStr) {
            token = JSON.parse(sessionStr).access_token;
          }

          const details = typeof order.ticket_details === 'string' ? JSON.parse(order.ticket_details) : order.ticket_details;
          
          await fetch(`${import.meta.env.VITE_API_URL}/api/tickets/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              userId: order.user_id, 
              eventId: order.event_id, 
              cart: details.cart, 
              formAnswers: details.formAnswers,
              orderId: order.order_id 
            })
          });
          
          toast.success('Payment Successful! Ticket generated.', { id: 'process-ticket' });
          
          setTimeout(() => fetchOrders(true), 2000); 
        } catch (err) {
          toast.error('Failed to generate ticket. Please contact admin.', { id: 'process-ticket' });
        }
      },
      onPending: function (result) {
        toast.success('Waiting for you to complete the payment...');
        fetchOrders(true); 
      },
      onError: function (result) {
        toast.error('Payment failed or expired.');
        fetchOrders(true); 
      },
      onClose: function () {
        toast.error('Pop-up closed before payment was completed.');
        fetchOrders(true); 
      }
    });
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-[#FF6B35] rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-widest text-xs font-bold text-slate-400">Loading Orders...</p>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans pb-20 relative text-left">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#FF6B35]/10 to-transparent pointer-events-none z-0"></div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 pt-8 md:pt-12 relative z-10">
        
        {/* HEADER */}
        <div className="mb-8">
          <button onClick={() => navigate('/')} className="text-slate-500 hover:text-[#FF6B35] font-bold text-[10px] uppercase tracking-widest mb-4 flex items-center gap-1.5 transition-colors w-max">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg> 
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 text-[#FF6B35] rounded-2xl flex items-center justify-center border border-orange-200 shrink-0">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-black text-slate-900 uppercase tracking-tight">My Orders</h1>
              <p className="text-[10px] md:text-sm font-medium text-slate-500 mt-1">Your transaction history and ticket bills, bro.</p>
            </div>
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

                  {order.payment_status === 'PENDING' ? (
                    <button 
                      onClick={() => handlePayNow(order)}
                      className="bg-[#FF6B35] hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 whitespace-nowrap active:scale-95 border border-orange-400 animate-pulse"
                    >
                      Pay Now
                    </button>
                  ) : order.payment_status === 'SUCCESS' ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200 whitespace-nowrap">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-200 whitespace-nowrap">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg> Cancelled / Expired
                    </span>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
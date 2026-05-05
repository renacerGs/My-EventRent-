import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AgentWallet() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 FIX 1: Change dependency array so it DOESN'T BLINK
  useEffect(() => {
    if (!user || user.role !== 'agent') {
      navigate('/');
      return;
    }
    fetchPayouts();
  }, [user?.id, user?.role, navigate]);

  // 🔥 FIX 2: Bring Supabase Token in Headers
  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('supabase_token');

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/payouts`, {
        headers: {
          'Authorization': `Bearer ${token}` // 👈 This is your ID bro!
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setPayouts(data);
      }
    } catch (err) {
      toast.error('Failed to fetch earnings data');
    } finally {
      setLoading(false);
    }
  };

  const totalPendapatan = payouts.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="bg-slate-900 min-h-screen font-sans pb-20 pt-8 md:pt-12 text-left relative">
      <div className="max-w-3xl mx-auto px-4 md:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-3 md:gap-4 mb-8">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center shrink-0 bg-[#0f172a] rounded-full border border-slate-700 text-slate-400 transition-all hover:border-blue-500 hover:text-blue-500 shadow-sm active:scale-95"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg> 
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">My Wallet</h1>
        </div>

        {/* Kartu Total Saldo */}
        <div className="bg-emerald-500 rounded-[24px] md:rounded-[32px] p-6 md:p-8 text-white shadow-[0_10px_40px_-10px_rgba(16,185,129,0.3)] mb-8 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-emerald-100 text-sm font-bold uppercase tracking-widest mb-1">Total Earnings</p>
            <h2 className="text-4xl md:text-5xl font-black">Rp {totalPendapatan.toLocaleString('en-US')}</h2>
          </div>
          <svg className="absolute right-0 bottom-0 opacity-20 w-40 h-40 transform translate-x-8 translate-y-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
        </div>

        {/* List Riwayat Pembayaran */}
        <div className="bg-slate-800 rounded-[24px] md:rounded-[32px] shadow-sm border border-slate-700 overflow-hidden">
          <div className="p-5 md:p-6 border-b border-slate-700 bg-slate-800/50">
             <h3 className="font-black text-white text-sm uppercase tracking-widest">Payout History</h3>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin"></div></div>
          ) : payouts.length === 0 ? (
            <div className="py-20 text-center">
              <h3 className="text-lg font-bold text-white">No earnings yet</h3>
              <p className="text-xs text-slate-400 mt-1">Complete event tasks to start earning money!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700/50">
              {payouts.map(payout => (
                <div key={payout.id} className="p-5 md:p-6 flex flex-col sm:flex-row justify-between gap-4 hover:bg-slate-700/30 transition-colors">
                  <div>
                    <span className="inline-block px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-md mb-2">Transfer Success</span>
                    
                    <h4 className="font-bold text-slate-100 mb-1">{payout.event_title || `Event ID: ${payout.event_id}`}</h4>
                    
                    <p className="text-xs text-slate-400">{new Date(payout.paid_at).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}</p>
                  </div>
                  
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <p className="text-lg font-black text-emerald-400">+ Rp {Number(payout.amount).toLocaleString('en-US')}</p>
                    {payout.proof_url ? (
                      <a 
                        href={payout.proof_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[10px] md:text-xs font-bold text-blue-400 hover:text-blue-300 underline flex items-center gap-1 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                        View Receipt
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">Receipt not available yet</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
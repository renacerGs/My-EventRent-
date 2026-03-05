import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQR, setShowQR] = useState(false);

  const user = JSON.parse(localStorage.getItem('user')) || null;

  useEffect(() => {
    const fetchMyTickets = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`http://localhost:3000/api/tickets/my?userId=${user.id}`);
        setTickets(response.data);
      } catch (error) {
        console.error("Gagal mengambil data tiket:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMyTickets();
  }, [user?.id]);

  if (loading) return <div className="text-center py-20 font-bold text-gray-500 animate-pulse">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-10 px-4 md:px-8 pb-20">
      
      <AnimatePresence>
        {showQR && selectedTicket && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="relative h-32 bg-gray-900 overflow-hidden">
                <img src={selectedTicket.img} alt="header" className="w-full h-full object-cover opacity-50" />
                <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-8 flex flex-col items-center -mt-12 relative z-10">
                <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100 mb-6">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TICKET-${selectedTicket.ticket_id}`} alt="QR" className="w-40 h-40 mix-blend-multiply" />
                </div>
                <div className="text-center mb-6">
                  <h4 className="text-xl font-black text-gray-900 leading-tight">{selectedTicket.title}</h4>
                  <p className="text-[#FF6B35] text-xs font-bold uppercase mt-1">{selectedTicket.date}</p>
                </div>
                <button onClick={() => window.print()} className="w-full py-4 bg-[#FF6B35] text-white rounded-2xl font-bold hover:bg-[#E85526] transition-all">Download Ticket</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-black mb-2 text-gray-900">My Tickets</h1>
        <p className="text-gray-500 mb-10">See all the events you have joined.</p>

        <div className="grid gap-5">
          {tickets.length > 0 ? (
            tickets.map((ticket) => (
              <motion.div 
                whileHover={{ y: -3 }}
                key={ticket.ticket_id} 
                className="bg-white h-auto rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row border border-gray-100 relative group transition-shadow hover:shadow-lg"
              >
                {/* Image Section - FIX: Menggunakan aspect-video agar tidak gepeng */}
                <div className="md:w-64 aspect-video md:aspect-auto md:h-32 self-center overflow-hidden bg-white p-2 border-r border-dashed border-gray-100">
                  <img 
                    src={ticket.img} 
                    alt={ticket.title} 
                    className="w-full h-full object-contain" 
                  />
                  <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#F8F9FA] rounded-full transform -translate-y-1/2 hidden md:block"></div>
                </div>

                <div className="flex-1 p-5 flex flex-col justify-center">
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-gray-900 leading-tight line-clamp-1 group-hover:text-[#FF6B35] transition-colors">{ticket.title}</h3>
                      <p className="text-[#FF6B35] text-xs font-bold uppercase mt-0.5">{ticket.date}</p>
                    </div>
                    <span className="bg-[#E7F9F1] text-[#27AE60] text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">
                      Paid
                    </span>
                  </div>

                  <div className="flex items-end justify-between border-t border-gray-100 pt-3">
                    <div className="flex gap-8">
                      <div>
                        <p className="text-gray-400 text-[9px] uppercase font-black mb-0.5">Qty</p>
                        <p className="font-bold text-gray-900 text-xs">{ticket.quantity}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[9px] uppercase font-black mb-0.5">Total</p>
                        <p className="font-black text-[#FF6B35] text-xs">Rp {Number(ticket.total_price).toLocaleString()}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setSelectedTicket(ticket); setShowQR(true); }}
                      className="bg-[#1A1A1A] text-white px-5 py-2.5 rounded-xl font-bold text-[11px] hover:bg-[#FF6B35] transition-all shadow-md shadow-gray-100"
                    >
                      Show QR
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 font-bold text-gray-400 bg-white rounded-3xl border border-gray-100">You don't have any tickets yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
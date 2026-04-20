import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // 👈 IMPORT INI BUAT TOMBOL BACK
import { Search, Ticket, Mail, MapPin, Clock, Calendar, User, AlertCircle, CheckCircle2, QrCode } from 'lucide-react';

export default function TrackTicket() {
  const navigate = useNavigate(); // 👈 INISIALISASI NAVIGATE
  const [formData, setFormData] = useState({ ticketId: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ticketData, setTicketData] = useState([]); 

  const handleSearch = async (e) => {
    e.preventDefault(); 

    if (!formData.ticketId.trim() || !formData.email.trim()) {
      setError("Order ID dan Email wajib diisi bro!");
      return;
    }

    setLoading(true);
    setError('');
    setTicketData([]);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tickets/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: formData.ticketId.trim(),
          email: formData.email.trim()
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Tiket tidak ditemukan. Pastikan datanya benar!");
      }

      const data = await res.json();
      setTicketData(data); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-slate-50 pt-8 pb-16 px-4 font-sans relative overflow-hidden flex flex-col items-center">
      
      {/* --- BACKGROUND ORNAMENTS --- */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[400px] bg-gradient-to-b from-[#FF6B35]/10 to-transparent blur-3xl -z-10 rounded-full"></div>
      
      {/* 👇 TOMBOL BACK 👇 */}
      <div className="w-full max-w-md md:max-w-4xl mx-auto relative z-20 mb-4 px-2 sm:px-0">
        <button onClick={() => navigate(-1)} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-[#FF6B35] hover:border-[#FF6B35] shadow-sm transition-all active:scale-95">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-xl mx-auto mb-10 relative z-10"
      >
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8 text-[#FF6B35]" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight mb-4">Lacak Tiket</h1>
        <p className="text-gray-500 font-medium text-sm md:text-base px-4">Masukkan Order ID dan Email dari bukti pembelian untuk menampilkan E-Ticket Anda.</p>
      </motion.div>

      {/* --- FORM PENCARIAN --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="w-full max-w-md bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-gray-100 mb-12 relative z-10"
      >
        <form onSubmit={handleSearch} className="flex flex-col gap-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Order ID</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Ticket className="w-5 h-5 text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="TKT-A9X2B1" 
                value={formData.ticketId} 
                onChange={(e) => setFormData({...formData, ticketId: e.target.value.toUpperCase()})} 
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-2xl pl-12 pr-5 py-4 outline-none focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all uppercase placeholder:normal-case" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Pembeli</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <input 
                type="email" 
                placeholder="email@contoh.com" 
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})} 
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-2xl pl-12 pr-5 py-4 outline-none focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all" 
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[#FF6B35] text-white font-black text-xs uppercase tracking-widest py-4 md:py-5 rounded-2xl hover:bg-[#E85526] transition-all active:scale-95 shadow-lg shadow-orange-500/30 mt-2 disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Mencari Tiket...
              </>
            ) : "Cari E-Ticket"}
          </button>
        </form>

        {/* --- ERROR MESSAGE --- */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0, x: [-5, 5, -5, 5, 0] }} 
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="mt-6 p-4 bg-red-50 border border-red-100 text-red-500 text-xs font-bold rounded-2xl text-center flex items-center justify-center gap-2 leading-relaxed"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* --- HASIL PENCARIAN TIKET --- */}
      {ticketData && ticketData.length > 0 && (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-3 mb-2"
          >
            <div className="h-px w-12 bg-gray-300"></div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Ditemukan {ticketData.length} Tiket</span>
            <div className="h-px w-12 bg-gray-300"></div>
          </motion.div>

          {ticketData.map((ticket, index) => (
            <motion.div 
              key={ticket.ticket_id} 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="w-full flex flex-col md:flex-row bg-white rounded-[32px] overflow-hidden shadow-2xl shadow-slate-200/60 border border-gray-100 relative group"
            >
              {/* LABEL STATUS TIKET */}
              <div className={`absolute top-6 -right-12 text-white text-[9px] font-black uppercase tracking-widest px-14 py-2 rotate-45 z-20 shadow-md ${ticket.is_scanned ? 'bg-red-500' : 'bg-[#27AE60]'}`}>
                {ticket.is_scanned ? 'Telah Dipakai' : 'Tiket Valid'}
              </div>

              {/* BAGIAN KIRI: GAMBAR EVENT */}
              <div className="md:w-5/12 h-56 md:h-auto relative overflow-hidden">
                <img src={ticket.img} alt={ticket.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent flex flex-col justify-end p-8">
                  <span className="bg-[#FF6B35] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg w-max mb-3 shadow-md">E-Ticket {index + 1}</span>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 line-clamp-2">{ticket.title}</h2>
                  <div className="flex items-center gap-2 text-white/80 text-xs font-bold bg-black/30 w-max px-3 py-1.5 rounded-lg backdrop-blur-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    {ticket.event_date}
                  </div>
                </div>
              </div>

              {/* BAGIAN KANAN: DETAIL & QR CODE */}
              <div className="md:w-7/12 p-6 md:p-10 flex flex-col md:flex-row gap-8 items-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative">
                
                {/* Garis Potong Tiket (Visual E-Ticket) */}
                <div className="hidden md:block absolute left-0 top-0 bottom-0 w-px border-l-2 border-dashed border-gray-200 -ml-px"></div>
                <div className="hidden md:block absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-50 rounded-full border-r border-gray-100"></div>
                
                {/* Detail Info */}
                <div className="flex-1 w-full space-y-6">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                      <Ticket className="w-3 h-3" /> Session / Kategori
                    </p>
                    <p className="text-lg font-black text-gray-900">{ticket.session_name}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> Jam Mulai
                      </p>
                      <p className="text-sm font-bold text-gray-900">{ticket.start_time.slice(0, 5)} WIB</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" /> Lokasi
                      </p>
                      <p className="text-sm font-bold text-gray-900 line-clamp-1" title={ticket.location}>{ticket.location}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-dashed border-gray-200">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <User className="w-3 h-3" /> Nama Pemegang Tiket
                    </p>
                    <div className="flex justify-between items-center bg-orange-50 px-4 py-3 rounded-xl border border-orange-100">
                      <span className="text-sm font-black text-[#FF6B35] uppercase">{ticket.attendee_name || 'Peserta'}</span>
                      {ticket.is_scanned && <CheckCircle2 className="w-5 h-5 text-red-500" />}
                    </div>
                  </div>
                </div>

                {/* QR Code Section */}
                <div className="w-full md:w-auto shrink-0 flex flex-col items-center gap-4 pt-6 md:pt-0 md:pl-8 md:border-l-2 border-dashed border-gray-200 relative">
                  <div className={`p-4 rounded-3xl shadow-sm border-2 ${ticket.is_scanned ? 'bg-gray-50 border-gray-200 opacity-50' : 'bg-white border-[#FF6B35]/20'}`}>
                    <QRCode 
                      value={JSON.stringify({ ticketId: ticket.ticket_id, eventId: ticket.event_id })} 
                      size={120} 
                      level="H" 
                      fgColor={ticket.is_scanned ? "#9CA3AF" : "#111827"}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5 flex items-center justify-center gap-1">
                      <QrCode className="w-3 h-3" /> Order ID
                    </p>
                    <p className={`text-sm font-mono font-bold tracking-wider ${ticket.is_scanned ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {ticket.ticket_id}
                    </p>
                  </div>
                </div>

              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import QRCode from 'react-qr-code';

export default function TrackTicket() {
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
      const res = await fetch('/api/tickets/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // 👇 FIX: Nggak pakai parseInt lagi, langsung kirim string utuh
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
    <div className="min-h-[80vh] bg-[#F8F9FA] py-16 px-4 font-sans flex flex-col items-center">
      <div className="text-center max-w-xl mx-auto mb-10">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tight mb-4">Lacak Tiket</h1>
        <p className="text-gray-500 font-medium">Masukkan SALAH SATU Order ID dari Email yang Anda terima untuk menampilkan semua E-Ticket Anda.</p>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 mb-12">
        <form onSubmit={handleSearch} className="flex flex-col gap-5">
          <div>
            <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Order ID</label>
            <input 
              type="text" 
              // 👇 FIX: Hapus inputMode="numeric" dan update placeholder
              placeholder="Contoh: TKT-A9X2B1" 
              value={formData.ticketId} 
              // 👇 Bikin hurufnya otomatis UPPERCASE biar rapi
              onChange={(e) => setFormData({...formData, ticketId: e.target.value.toUpperCase()})} 
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all" 
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-900 uppercase tracking-widest mb-2">Email Pembeli</label>
            <input 
              type="email" 
              placeholder="Contoh: eventrent26@gmail.com" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-bold rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all" 
            />
          </div>
          
          <button 
            type="submit" 
            onClick={handleSearch}
            disabled={loading} 
            className="w-full bg-gray-900 text-white font-black text-sm uppercase tracking-widest py-4 rounded-2xl hover:bg-black transition-colors shadow-xl mt-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? "Mencari..." : "Cari Tiket"}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-100 text-red-500 text-sm font-bold rounded-2xl text-center flex items-center justify-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            {error}
          </div>
        )}
      </div>

      {ticketData && ticketData.length > 0 && (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
          {ticketData.map((ticket, index) => (
            <div key={ticket.ticket_id} className="w-full flex flex-col md:flex-row bg-white rounded-[32px] overflow-hidden shadow-2xl border border-gray-100 relative">
              {ticket.is_scanned && (
                <div className="absolute top-6 -right-12 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-14 py-1.5 rotate-45 z-10 shadow-md">Telah Digunakan</div>
              )}
              <div className="md:w-5/12 h-64 md:h-auto relative">
                <img src={ticket.img} alt={ticket.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                  <span className="bg-[#FF6B35] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-max mb-3">E-Ticket {index + 1}</span>
                  <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2">{ticket.title}</h2>
                  <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {ticket.event_date}
                  </div>
                </div>
              </div>
              <div className="md:w-7/12 p-8 md:p-10 flex flex-col md:flex-row gap-8 items-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                <div className="flex-1 w-full space-y-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Session / Tiket</p>
                    <p className="text-lg font-bold text-gray-900">{ticket.session_name}</p>
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Jam Mulai</p>
                      <p className="text-sm font-bold text-gray-900">{ticket.start_time.slice(0, 5)} WIB</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Lokasi</p>
                      <p className="text-sm font-bold text-gray-900 line-clamp-1">{ticket.location}</p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-dashed border-gray-200">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Detail Peserta</p>
                    <div className="flex justify-between items-center bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                      <span className="text-sm font-black text-gray-900">{ticket.attendee_name || 'Peserta'}</span>
                    </div>
                  </div>
                </div>
                <div className="w-full md:w-auto shrink-0 flex flex-col items-center gap-3 pl-0 md:pl-8 md:border-l border-dashed border-gray-200">
                  <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                    {/* QR Code Payload udah aman, dia bakal ngirim ticket.ticket_id (TKT-XXXX) */}
                    <QRCode value={JSON.stringify({ ticketId: ticket.ticket_id, eventId: ticket.event_id })} size={120} level="H" />
                  </div>
                  {/* 👇 FIX: Hapus tanda '#' biar gak bingung baca ID-nya */}
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID: {ticket.ticket_id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
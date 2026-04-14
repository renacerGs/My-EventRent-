import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RiwayatScan() { // Pastikan nama fungsinya sesuai nama file ya
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // 👇 STATE BARU BUAT FILTER DROPDOWN 👇
  const [selectedEventFilter, setSelectedEventFilter] = useState('ALL');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('ALL');

  useEffect(() => {
    // Pastikan yang buka beneran agen
    if (!user || user.role !== 'agent') {
      navigate('/');
      return;
    }
    fetchHistory();
  }, [user, navigate]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // API Backend
      const res = await fetch(`https://my-event-rent.vercel.app/api/users/${user.id}/scan-history`);
      if (res.ok) {
        const data = await res.json();
        setScanHistory(data);
      } else {
        setScanHistory([]);
      }
    } catch (err) {
      console.error("Gagal menarik data riwayat", err);
      setScanHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // 👇 MENDAPATKAN DAFTAR UNIK EVENT & SESI DARI DATA HISTORY 👇
  const uniqueEvents = [...new Set(scanHistory.map(h => h.event_title))].filter(Boolean);
  const uniqueSessions = [...new Set(scanHistory.map(h => h.session_name))].filter(Boolean);

  // 👇 LOGIKA FILTER GABUNGAN (SEARCH + EVENT + SESI) 👇
  const filteredHistory = scanHistory.filter(h => {
    // 1. Cek Text Search
    let matchesSearch = true;
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      matchesSearch = (
        h.ticket_id?.toLowerCase().includes(lowerQ) || 
        h.attendee_name?.toLowerCase().includes(lowerQ) ||
        h.event_title?.toLowerCase().includes(lowerQ)
      );
    }

    // 2. Cek Filter Event
    let matchesEvent = true;
    if (selectedEventFilter !== 'ALL') {
      matchesEvent = h.event_title === selectedEventFilter;
    }

    // 3. Cek Filter Sesi
    let matchesSession = true;
    if (selectedSessionFilter !== 'ALL') {
      matchesSession = h.session_name === selectedSessionFilter;
    }

    return matchesSearch && matchesEvent && matchesSession;
  });

  return (
    <div className="bg-[#0f172a] min-h-screen font-sans pb-20 relative">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-10 md:pt-16 relative z-10">
        
        {/* HEADER & TOMBOL BACK */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-blue-500 font-bold text-[10px] uppercase tracking-widest mb-4 flex items-center gap-1.5 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg> 
              Kembali ke Portal
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/30 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Riwayat Scan</h1>
                <p className="text-xs md:text-sm font-medium text-slate-400 mt-1">Log aktivitas check-in tamu yang lo lakukan hari ini.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 👇 FILTER CONTROLS (SEARCH + DROPDOWNS) 👇 */}
        <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700/50 mb-8 flex flex-col lg:flex-row gap-4 backdrop-blur-sm">
          
          {/* SEARCH BAR (Lebar di layar gede) */}
          <div className="relative w-full lg:flex-1">
            <input 
              type="text" 
              placeholder="Cari ID tiket, nama tamu..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
            />
            <svg className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
            {/* DROPDOWN FILTER EVENT */}
            <div className="w-full sm:w-48 relative">
              <select 
                value={selectedEventFilter}
                onChange={(e) => setSelectedEventFilter(e.target.value)}
                className="w-full appearance-none bg-slate-900 border border-slate-700 text-white rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-inner"
              >
                <option value="ALL">Semua Event</option>
                {uniqueEvents.map((evt, i) => (
                  <option key={i} value={evt}>{evt}</option>
                ))}
              </select>
              <svg className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>

            {/* DROPDOWN FILTER SESI */}
            <div className="w-full sm:w-48 relative">
              <select 
                value={selectedSessionFilter}
                onChange={(e) => setSelectedSessionFilter(e.target.value)}
                className="w-full appearance-none bg-slate-900 border border-slate-700 text-white rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-inner"
              >
                <option value="ALL">Semua Sesi</option>
                {uniqueSessions.map((ses, i) => (
                  <option key={i} value={ses}>{ses}</option>
                ))}
              </select>
              <svg className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

        </div>

        {/* TABEL RIWAYAT */}
        <div className="bg-slate-800/50 rounded-[24px] md:rounded-[32px] border border-slate-700/50 overflow-hidden shadow-xl backdrop-blur-sm">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Menarik Log Data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-5">Waktu Scan</th>
                    <th className="px-6 py-5">Detail Tiket</th>
                    <th className="px-6 py-5">Event & Sesi</th>
                    <th className="px-6 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((log, idx) => (
                      <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                        {/* Waktu */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="font-bold text-white text-sm">{log.scan_time}</p>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{log.scan_date}</p>
                        </td>
                        
                        {/* Detail Tiket */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-white text-sm">{log.attendee_name}</p>
                          <p className="text-[10px] font-mono text-blue-400 mt-1 bg-blue-500/10 w-max px-2 py-0.5 rounded border border-blue-500/20">#{log.ticket_id}</p>
                        </td>

                        {/* Event */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-300 text-sm truncate max-w-[250px]">{log.event_title}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{log.session_name}</p>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4 text-right">
                          {log.status === 'success' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                              Sukses
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-500/20" title={log.error_reason}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                              Gagal
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                          <p className="font-bold text-sm">Tidak Ada Riwayat</p>
                          <p className="text-[10px] mt-1 font-medium max-w-xs text-center">Data kosong atau tidak ada tiket yang cocok dengan filter yang lo pilih bro.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
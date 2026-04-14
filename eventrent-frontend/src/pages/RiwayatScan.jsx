import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RiwayatScan() { 
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState('ALL');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('ALL');
  
  // 👇 STATE BARU: Filter Tanggal 👇
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    // Agen atau panitia boleh masuk
    if (!user) {
      navigate('/');
      return;
    }
    fetchHistory();
  }, [user, navigate]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
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

  const uniqueEvents = [...new Set(scanHistory.map(h => h.event_title))].filter(Boolean);
  const uniqueSessions = [...new Set(scanHistory.map(h => h.session_name))].filter(Boolean);

  // 👇 LOGIKA FILTER GABUNGAN (SEARCH + EVENT + SESI + TANGGAL) 👇
  const filteredHistory = scanHistory.filter(h => {
    // 1. Text Search
    let matchesSearch = true;
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      matchesSearch = (
        h.ticket_id?.toLowerCase().includes(lowerQ) || 
        h.attendee_name?.toLowerCase().includes(lowerQ) ||
        h.event_title?.toLowerCase().includes(lowerQ)
      );
    }

    // 2. Filter Event
    let matchesEvent = selectedEventFilter === 'ALL' || h.event_title === selectedEventFilter;

    // 3. Filter Sesi
    let matchesSession = selectedSessionFilter === 'ALL' || h.session_name === selectedSessionFilter;

    // 4. Filter Tanggal (Range)
    let matchesDate = true;
    if (h.raw_date) {
      const logDate = new Date(h.raw_date);
      if (startDate) {
        matchesDate = matchesDate && logDate >= new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Mentokin ke akhir hari
        matchesDate = matchesDate && logDate <= end;
      }
    }

    return matchesSearch && matchesEvent && matchesSession && matchesDate;
  });

  return (
    <div className="bg-[#0f172a] min-h-screen font-sans pb-20 relative text-left">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12 relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-blue-500 font-bold text-[10px] uppercase tracking-widest mb-4 flex items-center gap-1.5 transition-colors w-max">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg> 
              Kembali
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/30 shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-black text-white uppercase tracking-tight">Riwayat Scan</h1>
                <p className="text-[10px] md:text-sm font-medium text-slate-400 mt-1">Log aktivitas check-in tamu yang lo lakuin.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 👇 FILTER CONTROLS RESPONSIVE 👇 */}
        <div className="bg-slate-800/50 p-4 md:p-5 rounded-[20px] md:rounded-2xl border border-slate-700/50 mb-8 backdrop-blur-sm shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 items-center">
            
            {/* Search */}
            <div className="relative lg:col-span-2">
              <input 
                type="text" 
                placeholder="Cari ID, Nama Tamu, atau Event..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 text-xs md:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              />
              <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>

            {/* Event Dropdown */}
            <div className="relative">
              <select value={selectedEventFilter} onChange={(e) => setSelectedEventFilter(e.target.value)} className="w-full appearance-none bg-slate-900/80 border border-slate-700 text-white rounded-xl pl-3 pr-8 py-3 text-xs md:text-sm focus:outline-none focus:border-blue-500 transition-all cursor-pointer">
                <option value="ALL">Semua Event</option>
                {uniqueEvents.map((evt, i) => <option key={i} value={evt}>{evt}</option>)}
              </select>
              <svg className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>

            {/* Tgl Mulai */}
            <div className="relative flex items-center bg-slate-900/80 border border-slate-700 rounded-xl px-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-2">Dari:</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-transparent text-white py-3 text-xs md:text-sm focus:outline-none appearance-none [color-scheme:dark]" />
            </div>

            {/* Tgl Akhir */}
            <div className="relative flex items-center bg-slate-900/80 border border-slate-700 rounded-xl px-3 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-2">Sampai:</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-transparent text-white py-3 text-xs md:text-sm focus:outline-none appearance-none [color-scheme:dark]" />
            </div>

          </div>
        </div>

        {/* HASIL DATA */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Menarik Log Data...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-3xl py-16 text-center">
             <svg className="w-12 h-12 mb-3 opacity-20 mx-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
             <p className="font-bold text-slate-300 text-sm">Tidak Ada Riwayat</p>
             <p className="text-[10px] md:text-xs mt-1 font-medium text-slate-500">Data kosong atau filter tidak cocok.</p>
          </div>
        ) : (
          <>
            {/* TAMPILAN DESKTOP (Tabel) */}
            <div className="hidden md:block bg-slate-800/50 rounded-[32px] border border-slate-700/50 overflow-hidden shadow-xl backdrop-blur-sm">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-5">Waktu Scan</th>
                    <th className="px-8 py-5">Detail Tiket</th>
                    <th className="px-8 py-5">Event & Sesi</th>
                    <th className="px-8 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.map((log, idx) => (
                    <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-8 py-4 whitespace-nowrap">
                        <p className="font-bold text-white text-sm">{log.scan_time}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{log.scan_date}</p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="font-bold text-white text-sm">{log.attendee_name}</p>
                        <p className="text-[10px] font-mono text-blue-400 mt-1 bg-blue-500/10 w-max px-2 py-0.5 rounded border border-blue-500/20">#{log.ticket_id}</p>
                      </td>
                      <td className="px-8 py-4">
                        <p className="font-bold text-slate-300 text-sm truncate max-w-[250px]">{log.event_title}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{log.session_name}</p>
                      </td>
                      <td className="px-8 py-4 text-right">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Sukses
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* TAMPILAN HP (Card Responsif) */}
            <div className="md:hidden flex flex-col gap-3">
              {filteredHistory.map((log, idx) => (
                <div key={idx} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-emerald-500/10 border-b border-l border-emerald-500/20 px-3 py-1.5 rounded-bl-lg flex items-center gap-1">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Sukses</span>
                  </div>
                  
                  <div className="mb-3 border-b border-slate-700/50 pb-3">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{log.scan_date} • {log.scan_time}</p>
                    <p className="font-bold text-white text-base leading-tight">{log.attendee_name}</p>
                    <p className="text-[10px] font-mono text-blue-400 mt-1.5 bg-blue-500/10 w-max px-2 py-0.5 rounded border border-blue-500/20">#{log.ticket_id}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-bold text-slate-300 line-clamp-1">{log.event_title}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{log.session_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
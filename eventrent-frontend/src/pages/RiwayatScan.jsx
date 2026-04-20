import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomDatePicker from "../components/shared/CustomDatePicker";

export default function RiwayatScan() { 
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State Filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('ALL');
  
  // State nyimpen event mana yang lagi diklik/dibuka detailnya
  const [activeEventTracker, setActiveEventTracker] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchHistory();
  }, [user, navigate]);

  // Reset Sesi tiap kali ganti halaman detail event
  useEffect(() => {
    setSelectedSessionFilter('ALL');
    setSearchQuery('');
  }, [activeEventTracker]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // 👇 SUDAH DISESUAIKAN DENGAN ENV API URL 👇
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/scan-history`);
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

  // --- LOGIKA FILTER TAHAP 1: FILTER TANGGAL SECARA GLOBAL ---
  const dateFilteredHistory = scanHistory.filter(h => {
    let matchesDate = true;
    if (h.raw_date) {
      const logDate = new Date(h.raw_date);
      logDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && logDate >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); 
        matchesDate = matchesDate && logDate <= end;
      }
    }
    return matchesDate;
  });

  // --- LOGIKA KELOMPOKIN DATA BERDASARKAN EVENT (UNTUK TAMPILAN AWAL) ---
  const groupedEvents = dateFilteredHistory.reduce((acc, log) => {
    if (!acc[log.event_title]) {
      acc[log.event_title] = {
        title: log.event_title,
        totalScans: 0,
        sessions: new Set()
      };
    }
    acc[log.event_title].totalScans += 1;
    acc[log.event_title].sessions.add(log.session_name);
    return acc;
  }, {});
  
  const eventListSummary = Object.values(groupedEvents);

  // --- LOGIKA FILTER TAHAP 2: DETAIL PESERTA DI DALAM EVENT TERTENTU ---
  const detailedFilteredHistory = dateFilteredHistory.filter(h => {
    if (h.event_title !== activeEventTracker) return false;

    let matchesSearch = true;
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      matchesSearch = (
        h.ticket_id?.toLowerCase().includes(lowerQ) || 
        h.attendee_name?.toLowerCase().includes(lowerQ)
      );
    }

    let matchesSession = selectedSessionFilter === 'ALL' || h.session_name === selectedSessionFilter;

    return matchesSearch && matchesSession;
  });

  const availableSessionsInActiveEvent = activeEventTracker 
    ? Array.from(groupedEvents[activeEventTracker]?.sessions || [])
    : [];

  return (
    <div className="bg-[#0f172a] min-h-screen font-sans pb-20 relative text-left">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none z-0"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12 relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative z-20">
          <div>
            <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-blue-500 font-bold text-[10px] uppercase tracking-widest mb-4 flex items-center gap-1.5 transition-colors w-max relative z-30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path></svg> 
              Kembali
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/30 shrink-0">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div>
                <h1 className="text-xl md:text-3xl font-black text-white uppercase tracking-tight">Riwayat Scan</h1>
                <p className="text-[10px] md:text-sm font-medium text-slate-400 mt-1">Log aktivitas check-in tamu oleh {user?.name || 'Agen'}.</p>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER GLOBAL TANGGAL */}
        <div className="bg-slate-800/50 p-4 md:p-6 rounded-[24px] border border-slate-700/50 mb-8 backdrop-blur-sm shadow-xl relative z-20">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex flex-col gap-1 w-full">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Dari Tgl</span>
              <div className="w-full">
                <CustomDatePicker value={startDate} onChange={setStartDate} placeholder="Pilih Tanggal Mulai" theme="dark" />
              </div>
            </div>
            <div className="flex flex-col gap-1 w-full">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Sampai Tgl</span>
              <div className="w-full">
                <CustomDatePicker value={endDate} onChange={setEndDate} placeholder="Pilih Tanggal Selesai" theme="dark" />
              </div>
            </div>
          </div>
        </div>

        {/* TAMPILAN LOADING */}
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Menarik Log Data...</p>
          </div>
        ) : eventListSummary.length === 0 ? (
          /* KOSONG JIKA TIDAK ADA DATA DI TANGGAL TERSEBUT */
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-[32px] py-20 text-center relative z-10">
             <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
               <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
             </div>
             <p className="font-black text-white text-lg tracking-tight mb-1">Tidak Ada Riwayat</p>
             <p className="text-xs font-medium text-slate-400">Belum ada tiket yang lu scan di rentang tanggal ini.</p>
          </div>
        ) : !activeEventTracker ? (
          /* MODE 1: MENAMPILKAN DAFTAR EVENT */
          <div className="relative z-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Daftar Event ({eventListSummary.length})</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {eventListSummary.map((evt, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveEventTracker(evt.title)}
                  className="bg-slate-800/50 border border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800 rounded-[24px] p-6 shadow-lg transition-all cursor-pointer group flex flex-col justify-between min-h-[160px]"
                >
                  <div>
                    <h3 className="font-black text-white text-xl leading-tight mb-2 group-hover:text-blue-400 transition-colors">{evt.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {Array.from(evt.sessions).map((ses, i) => (
                         <span key={i} className="px-2 py-0.5 bg-slate-700/50 rounded-md text-[9px] text-slate-300 font-bold uppercase tracking-widest border border-slate-600 truncate max-w-full">
                           {ses}
                         </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t border-slate-700/50 pt-4 mt-auto">
                    <div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Total Scan Lu</p>
                      <p className="font-black text-emerald-400 text-lg">{evt.totalScans} <span className="text-xs font-bold text-slate-400">Tiket</span></p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                      <svg className="w-4 h-4 text-blue-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* MODE 2: MENAMPILKAN DETAIL PESERTA */
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            <div className="flex items-center justify-between mb-6">
               <button onClick={() => setActiveEventTracker(null)} className="text-slate-400 hover:text-white font-bold text-xs flex items-center gap-2 transition-colors bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-xl">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                 List Event
               </button>
               <h2 className="font-black text-white text-lg md:text-xl truncate ml-4 text-right flex-1">{activeEventTracker}</h2>
            </div>

            {/* Filter Khusus Detail Peserta */}
            <div className="bg-slate-800/50 p-4 rounded-[20px] border border-slate-700/50 mb-6 flex flex-col md:flex-row gap-4 relative z-20">
              <div className="relative w-full md:flex-1 group h-[46px]">
                <input 
                  type="text" 
                  placeholder="Cari ID Tiket atau Nama Tamu..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-white rounded-xl pl-12 pr-4 py-2 text-xs md:text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <svg className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>

              <div className="relative group h-[46px] w-full md:w-64 shrink-0">
                <select value={selectedSessionFilter} onChange={(e) => setSelectedSessionFilter(e.target.value)} className="w-full h-full appearance-none bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-white rounded-xl pl-4 pr-10 text-xs md:text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer truncate relative z-0" disabled={availableSessionsInActiveEvent.length === 0}>
                  <option value="ALL">Semua Sesi</option>
                  {availableSessionsInActiveEvent.map((ses, i) => <option key={i} value={ses}>{ses}</option>)}
                </select>
                <svg className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            {/* TABEL DATA PESERTA */}
            {detailedFilteredHistory.length === 0 ? (
               <div className="bg-slate-800/30 border border-slate-700/50 rounded-3xl py-12 text-center text-slate-400 text-sm font-bold">Tidak ada data peserta yang cocok dengan pencarian.</div>
            ) : (
              <>
                <div className="hidden md:block bg-slate-800/50 rounded-[32px] border border-slate-700/50 overflow-hidden shadow-xl backdrop-blur-sm">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-5 text-blue-400">Detail Tiket & Tamu</th>
                        <th className="px-8 py-5">Sesi</th>
                        <th className="px-8 py-5">Waktu Scan</th>
                        <th className="px-8 py-5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailedFilteredHistory.map((log, idx) => (
                        <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/40 transition-colors">
                          <td className="px-8 py-5">
                            <p className="font-bold text-slate-200 text-sm">{log.attendee_name}</p>
                            <p className="text-[10px] font-mono text-blue-400 mt-1 bg-blue-500/10 w-max px-2 py-0.5 rounded border border-blue-500/20">#{log.ticket_id}</p>
                          </td>
                          <td className="px-8 py-5">
                            <span className="inline-block px-2 py-0.5 bg-slate-700/50 rounded-md text-[9px] text-slate-300 font-bold uppercase tracking-widest border border-slate-600">{log.session_name}</span>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              <div>
                                <p className="font-bold text-slate-300 text-sm">{log.scan_time}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{log.scan_date}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Sukses
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* TAMPILAN HP */}
                <div className="md:hidden flex flex-col gap-4">
                  {detailedFilteredHistory.map((log, idx) => (
                    <div key={idx} className="bg-slate-800/60 border border-slate-700/50 rounded-[24px] p-5 shadow-lg relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-emerald-500/10 border-b border-l border-emerald-500/20 px-3 py-1.5 rounded-bl-xl flex items-center gap-1 backdrop-blur-md">
                        <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Sukses</span>
                      </div>
                      <div className="mb-4 pr-16">
                        <p className="font-bold text-slate-200 text-lg truncate mb-1">{log.attendee_name}</p>
                        <p className="text-[10px] font-mono text-blue-400 mb-2">#{log.ticket_id}</p>
                        <span className="inline-block px-2 py-0.5 bg-slate-700/50 rounded-md text-[8px] text-slate-300 font-bold uppercase tracking-widest border border-slate-600">{log.session_name}</span>
                      </div>
                      <div className="border-t border-slate-700/50 pt-4 text-right">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Waktu Scan</p>
                         <p className="font-bold text-slate-200 text-sm">{log.scan_time}</p>
                         <p className="text-[9px] font-bold text-slate-400 mt-1">{log.scan_date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
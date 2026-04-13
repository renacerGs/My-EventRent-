import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user || user.role !== 'agent') {
      navigate('/');
      return;
    }
    fetchAssignedEvents();
  }, [user?.id, user?.role, navigate]);

  const fetchAssignedEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`https://my-event-rent.vercel.app/api/users/${user.id}/assigned-events`);
      if (res.ok) {
        const data = await res.json();
        setAssignedEvents(data);
      }
    } catch (err) {
      console.error("Gagal mengambil data tugas agen");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGuestList = async (eventData) => {
    setSelectedEvent(eventData);
    setSearchQuery('');
    setCurrentPage(1);
    fetchGuestList(eventData.id);
  };

  const fetchGuestList = async (eventId) => {
    try {
      setLoadingAttendees(true);
      const res = await fetch(`https://my-event-rent.vercel.app/api/events/${eventId}/attendees?userId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setAttendees(data);
      } else {
        toast.error("Gagal menarik data tamu.");
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleManualCheckIn = async (ticketId, eventId) => {
    if (!window.confirm("Yakin ingin Check-In manual tamu ini?")) return;
    
    try {
      const toastId = toast.loading('Memproses Check-In...');
      const res = await fetch('https://my-event-rent.vercel.app/api/tickets/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticketId, eventId: parseInt(eventId), userId: user.id })
      });
      
      const data = await res.json();
      
      if (res.ok && data.valid) {
        toast.success("Check-In Manual Berhasil!", { id: toastId });
        fetchGuestList(eventId); 
      } else {
        toast.error(`Gagal: ${data.message}`, { id: toastId });
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan.", { id: toastId });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a]">
      <div className="w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-widest text-xs font-bold text-slate-500">Memuat Markas...</p>
    </div>
  );

  const filteredAttendees = attendees.filter(t => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (t.attendee_name?.toLowerCase().includes(searchLower) || t.buyer_name?.toLowerCase().includes(searchLower) || t.ticket_id?.toLowerCase().includes(searchLower));
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAttendees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAttendees.length / itemsPerPage);

  const ratedEvents = assignedEvents.filter(ev => ev.rating_given > 0);
  const avgRating = ratedEvents.length > 0 
    ? (ratedEvents.reduce((sum, ev) => sum + ev.rating_given, 0) / ratedEvents.length).toFixed(1) 
    : 'N/A';

  return (
    <div className="bg-[#0f172a] min-h-screen font-sans pb-20 relative">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-10 md:pt-16 relative z-10">
        
        {/* HEADER PROFIL AGEN */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 mb-10 bg-slate-800/50 p-8 rounded-[32px] border border-slate-700/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-slate-700 shadow-xl">
              <img src={user?.picture} alt={user?.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-black text-white">{user?.name}</h1>
                <span className="bg-orange-500/20 text-orange-400 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-orange-500/30">Verified Agent</span>
              </div>
              <p className="text-sm font-medium text-slate-400">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex w-full md:w-auto border-t md:border-t-0 border-slate-700 pt-6 md:pt-0 justify-around md:justify-end gap-8 md:gap-10">
            <div className="text-center md:text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Event</p>
              <p className="text-3xl font-black text-white">{assignedEvents.length}</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Avg. Rating</p>
              <p className="text-3xl font-black text-yellow-500 flex items-center justify-center md:justify-end gap-1">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                {avgRating}
              </p>
            </div>
          </div>
        </div>

        {!selectedEvent ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2 h-8 bg-orange-500 rounded-full inline-block"></span>
              <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wide">Daftar Tugas Anda</h2>
            </div>

            {/* 👇👇 TAMPILAN LIST MEMANJANG ALA MANAGE EVENT 👇👇 */}
            {assignedEvents.length > 0 ? (
              <div className="bg-slate-800/50 rounded-[24px] md:rounded-[32px] border border-slate-700/50 overflow-hidden shadow-xl">
                
                {/* HEADER TABEL (KHUSUS DESKTOP) */}
                <div className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-900/50 border-b border-slate-700/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="w-[40%]">Event Details</div>
                  <div className="w-[20%] text-center">Tugas & Rating</div>
                  <div className="w-[15%] text-center">Status</div>
                  <div className="w-[25%] text-right">Action</div>
                </div>

                {/* LIST EVENT */}
                <div className="flex flex-col">
                  {assignedEvents.map((ev, index) => (
                    <div key={ev.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between p-5 md:px-8 md:py-6 hover:bg-slate-700/30 transition-colors gap-4 md:gap-0 ${index !== assignedEvents.length - 1 ? 'border-b border-slate-700/50' : ''}`}>
                      
                      {/* 1. Event Details (Gambar + Judul) */}
                      <div className="flex items-center gap-4 w-full md:w-[40%]">
                        <img src={ev.img} alt={ev.title} className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border border-slate-700 shrink-0" />
                        <div>
                          <h3 className="font-black text-white text-base md:text-lg line-clamp-1">{ev.title}</h3>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            {ev.date_start}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest truncate max-w-[200px]">{ev.location}</p>
                        </div>
                      </div>

                      {/* 2. Tugas & Rating */}
                      <div className="w-full md:w-[20%] flex flex-row md:flex-col items-center justify-between md:justify-center gap-2 border-t md:border-none border-slate-700 pt-3 md:pt-0">
                        <span className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Tugas:</span>
                        <div className="flex flex-col items-end md:items-center gap-1.5">
                          <span className="bg-slate-900 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest truncate max-w-[140px]">
                            {ev.role || 'Panitia'}
                          </span>
                          <div className="flex items-center gap-1 text-yellow-500 text-[10px] font-black bg-yellow-500/10 px-2 py-0.5 rounded-md border border-yellow-500/20" title="Rating Anda dari EO">
                            ★ {ev.rating_given ? `${ev.rating_given}.0` : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* 3. Status Event (ACTIVE) */}
                      <div className="w-full md:w-[15%] flex justify-between md:justify-center items-center border-t md:border-none border-slate-700 pt-3 md:pt-0">
                        <span className="md:hidden text-[10px] font-bold text-slate-500 uppercase">Status:</span>
                        <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                          Active
                        </span>
                      </div>

                      {/* 4. Actions (Tombol) */}
                      <div className="w-full md:w-[25%] flex items-center justify-end gap-2 mt-2 md:mt-0">
                        {/* Tombol Daftar Tamu */}
                        <button onClick={() => handleOpenGuestList(ev)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors text-[10px] font-black uppercase tracking-widest border border-slate-600" title="Daftar Tamu">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                          <span className="md:hidden">Tamu</span>
                        </button>
                        {/* Tombol Buka Scanner */}
                        <button onClick={() => navigate(`/scanner/${ev.id}`)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20" title="Buka Scanner">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                          <span className="md:hidden">Scan</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 rounded-[32px] p-12 text-center border border-slate-700/50 flex flex-col items-center justify-center min-h-[300px]">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                </div>
                <h3 className="text-xl font-black text-white mb-2">Tugas Kosong</h3>
                <p className="text-slate-400 text-sm font-medium max-w-md mx-auto leading-relaxed">
                  Santai dulu bro! Belum ada Event Organizer yang menugaskan lo buat jadi panitia/agen di acaranya.
                </p>
              </div>
            )}
          </>
        ) : (
          /* TAMPILAN 2: DAFTAR TAMU SPESIFIK EVENT */
          <div className="animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-orange-500 font-bold text-[10px] uppercase tracking-widest mb-2 flex items-center gap-1 transition-colors">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg> Kembali
                </button>
                <h2 className="text-xl md:text-2xl font-black text-white leading-tight">Daftar Tamu: <span className="text-orange-500">{selectedEvent.title}</span></h2>
              </div>
              
              <div className="relative w-full md:w-64">
                <input 
                  type="text" 
                  placeholder="Cari nama atau ID tiket..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
                <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>

            <div className="bg-slate-800 rounded-[24px] border border-slate-700 overflow-hidden shadow-xl">
              {loadingAttendees ? (
                <div className="py-20 text-center"><p className="text-slate-400 font-bold text-sm">Menarik data tamu...</p></div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-slate-900/50 border-b border-slate-700 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-6 py-5">Tiket ID</th>
                          <th className="px-6 py-5">Nama Tamu</th>
                          <th className="px-6 py-5">Sesi</th>
                          <th className="px-6 py-5 text-center">Status</th>
                          <th className="px-6 py-5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((t) => (
                            <tr key={t.ticket_id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                              <td className="px-6 py-4 text-xs font-bold text-slate-400 font-mono">#{t.ticket_id.slice(-6)}</td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-white text-sm">{t.attendee_name || t.buyer_name}</p>
                                <p className="text-[10px] text-slate-500">{t.attendee_email || t.buyer_email}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-bold text-slate-300 border border-slate-700 uppercase">{t.session_name}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {t.is_attending === false ? (
                                  <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/30">Absen</span>
                                ) : t.is_scanned ? (
                                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">Hadir</span>
                                ) : (
                                  <span className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-[10px] font-bold uppercase tracking-widest">Belum</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {!t.is_scanned && t.is_attending !== false ? (
                                  <button onClick={() => handleManualCheckIn(t.ticket_id, selectedEvent.id)} className="bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-orange-500/30">
                                    Check-In
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Selesai</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-bold text-sm">Tidak ada data tamu yang cocok.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-700 bg-slate-900/30 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">
                        Hal <span className="text-white">{currentPage}</span> dari <span className="text-white">{totalPages}</span>
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition-colors">Prev</button>
                        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition-colors">Next</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
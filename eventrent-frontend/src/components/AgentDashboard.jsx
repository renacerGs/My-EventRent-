import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('Semua Sesi');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Semua Status');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [activeTab, setActiveTab] = useState('active');

  // 👇 STATE KHUSUS UNTUK POP-UP EMERGENCY 👇
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [isSendingEmergency, setIsSendingEmergency] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'agent') {
      navigate('/');
      return;
    }
    fetchAssignedEvents();
  }, [user?.id, user?.role, navigate]); // 👈 Kuncian React hooks udah aman, no infinite loop!

  // 🔥 PERUBAHAN 1: Ambil data tugas bawa Token
  const fetchAssignedEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('supabase_token');
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/assigned-events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
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
    setSelectedSessionFilter('Semua Sesi');
    setSelectedStatusFilter('Semua Status');
    setCurrentPage(1);
    fetchGuestList(eventData.id);
  };

  // 🔥 PERUBAHAN 2: Ambil daftar tamu bawa Token & Hapus userId di URL
  const fetchGuestList = async (eventId) => {
    try {
      setLoadingAttendees(true);
      const token = localStorage.getItem('supabase_token');
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${eventId}/attendees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
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

  // 🔥 PERUBAHAN 3: Check-in Manual bawa Token & Hapus userId di Body
  const handleManualCheckIn = async (ticketId, eventId) => {
    if (!window.confirm("Yakin ingin Check-In manual tamu ini?")) return;
    
    try {
      const toastId = toast.loading('Memproses Check-In...');
      const token = localStorage.getItem('supabase_token');
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tickets/scan`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticketId: ticketId, eventId: parseInt(eventId) })
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

  // 🔥 PERUBAHAN 4: Kirim Emergency Laporan bawa Token & Hapus agentId di Body
  const handleSendEmergency = async () => {
    if (!emergencyMessage.trim()) {
      toast.error("Tulis pesan kendala lu dulu bro!");
      return;
    }

    try {
      setIsSendingEmergency(true);
      const token = localStorage.getItem('supabase_token');
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${selectedEvent.id}/reports`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: emergencyMessage })
      });

      if (res.ok) {
        toast.success('Laporan berhasil masuk ke sistem EO!');
        setIsEmergencyOpen(false);
        setEmergencyMessage('');
      } else {
        toast.error('Gagal mengirim laporan darurat. Coba lagi.');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan saat mengirim laporan.');
    } finally {
      setIsSendingEmergency(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a]">
      <div className="w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-widest text-xs font-bold text-slate-500">Memuat Markas...</p>
    </div>
  );

  const uniqueSessions = ['Semua Sesi', ...new Set(attendees.map(t => t.session_name))];

  const filteredAttendees = attendees.filter(t => {
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || (
      t.attendee_name?.toLowerCase().includes(searchLower) || 
      t.buyer_name?.toLowerCase().includes(searchLower) || 
      t.ticket_id?.toLowerCase().includes(searchLower)
    );
    
    const matchSession = selectedSessionFilter === 'Semua Sesi' || t.session_name === selectedSessionFilter;
    
    let matchStatus = true;
    if (selectedStatusFilter === 'Sudah Hadir') {
      matchStatus = t.is_scanned === true;
    } else if (selectedStatusFilter === 'Belum Hadir') {
      matchStatus = t.is_scanned === false && t.is_attending !== false;
    } else if (selectedStatusFilter === 'Absen') {
      matchStatus = t.is_attending === false;
    }
    
    return matchSearch && matchSession && matchStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAttendees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAttendees.length / itemsPerPage) || 1;

  const ratedEvents = assignedEvents.filter(ev => ev.rating_given > 0);
  const avgRating = ratedEvents.length > 0 
    ? (ratedEvents.reduce((sum, ev) => sum + ev.rating_given, 0) / ratedEvents.length).toFixed(1) 
    : 'N/A';

  const now = new Date();
  
  const activeEvents = assignedEvents.filter(ev => {
    const eventDate = new Date(ev.date_start);
    eventDate.setHours(23, 59, 59, 999);
    return eventDate >= now;
  });

  const historyEvents = assignedEvents.filter(ev => {
    const eventDate = new Date(ev.date_start);
    eventDate.setHours(23, 59, 59, 999); 
    return eventDate < now;
  });

  const displayedEvents = activeTab === 'active' ? activeEvents : historyEvents;

  const totalGuests = attendees.length;
  const checkedInGuests = attendees.filter(t => t.is_scanned === true).length;
  const progressPercentage = totalGuests === 0 ? 0 : Math.round((checkedInGuests / totalGuests) * 100);

  return (
    <div className="bg-[#0f172a] min-h-screen font-sans pb-20 relative">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none"></div>

      {/* 👇 MODAL POP-UP EMERGENCY 👇 */}
      <AnimatePresence>
        {isEmergencyOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-slate-800 w-full max-w-md rounded-[32px] border border-slate-700 shadow-2xl overflow-hidden"
            >
              <div className="bg-red-500/10 p-6 border-b border-red-500/20 text-center">
                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h3 className="text-xl font-black text-red-500 uppercase tracking-tight">Lapor Kendala</h3>
                <p className="text-xs font-medium text-slate-400 mt-1">Laporan lo bakal langsung masuk ke dashboard EO pusat.</p>
              </div>
              
              <div className="p-6">
                <textarea 
                  value={emergencyMessage}
                  onChange={(e) => setEmergencyMessage(e.target.value)}
                  placeholder={`Ceritain kendalanya di event ${selectedEvent?.title} bro...`}
                  className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none transition-all mb-6"
                ></textarea>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsEmergencyOpen(false)}
                    disabled={isSendingEmergency}
                    className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleSendEmergency}
                    disabled={isSendingEmergency}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                  >
                    {isSendingEmergency ? (
                      <>
                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Mengirim...
                      </>
                    ) : (
                      'Kirim Laporan'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-6 md:pt-16 relative z-10">
        
        {/* HEADER PROFIL AGEN */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 mb-8 md:mb-10 bg-slate-800/50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-700/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-slate-700 shadow-xl shrink-0">
              <img src={user?.picture} alt={user?.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 mb-1">
                <h1 className="text-xl md:text-3xl font-black text-white">{user?.name}</h1>
                <span className="bg-orange-500/20 text-orange-400 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-orange-500/30 mt-1 md:mt-0">Verified Agent</span>
              </div>
              <p className="text-xs md:text-sm font-medium text-slate-400">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex w-full md:w-auto border-t md:border-t-0 border-slate-700 pt-5 md:pt-0 justify-around md:justify-end gap-6 md:gap-10">
            <div className="text-center md:text-right">
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Event</p>
              <p className="text-2xl md:text-3xl font-black text-white">{assignedEvents.length}</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Avg. Rating</p>
              <p className="text-2xl md:text-3xl font-black text-yellow-500 flex items-center justify-center md:justify-end gap-1">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                {avgRating}
              </p>
            </div>
          </div>
        </div>

        {/* TAMPILAN 1: DAFTAR EVENT */}
        {!selectedEvent ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-700/50 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-2 h-6 md:h-8 bg-orange-500 rounded-full inline-block"></span>
                <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-wide">Tugas Anda</h2>
              </div>
              
              <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700 w-full sm:w-auto">
                <button onClick={() => setActiveTab('active')} className={`flex-1 sm:flex-none px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'active' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  Upcoming
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 sm:flex-none px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'history' ? 'bg-slate-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  History
                </button>
              </div>
            </div>

            {displayedEvents.length > 0 ? (
              <div className="bg-slate-800/50 rounded-[20px] md:rounded-[32px] border border-slate-700/50 overflow-hidden shadow-xl">
                
                {/* HEADER TABEL DESKTOP */}
                <div className="hidden md:flex items-center justify-between px-8 py-4 bg-slate-900/50 border-b border-slate-700/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="w-[40%]">Event Details</div>
                  <div className="w-[35%] flex justify-between">
                    <div className="w-[57%] text-center">Tugas & Rating</div>
                    <div className="w-[43%] text-center">Status</div>
                  </div>
                  <div className="w-[25%] text-right">Action</div>
                </div>

                <div className="flex flex-col">
                  {displayedEvents.map((ev, index) => (
                    <div key={ev.id} className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:px-8 md:py-6 hover:bg-slate-700/30 transition-colors gap-3 md:gap-0 ${index !== displayedEvents.length - 1 ? 'border-b border-slate-700/50' : ''}`}>
                      
                      {/* EVENT DETAIL (KIRI) */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-[40%]">
                        <div className="w-full sm:w-20 h-36 sm:h-20 rounded-xl overflow-hidden relative shrink-0 border border-slate-700">
                          <img src={ev.img} alt={ev.title} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h3 className="font-black text-white text-lg md:text-lg line-clamp-1">{ev.title}</h3>
                          <p className="text-[10px] md:text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            {ev.date_start}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest truncate max-w-[200px]">{ev.location}</p>
                        </div>
                      </div>

                      {/* TUGAS, RATING & STATUS (TENGAH) */}
                      <div className="w-full md:w-[35%] flex flex-row items-center justify-start md:justify-between gap-2 border-t md:border-none border-slate-700 pt-3 md:pt-0">
                        
                        <div className="flex flex-row md:flex-col items-center justify-start md:justify-center gap-2 md:w-[57%]">
                          <span className="bg-slate-900 border border-slate-700 text-slate-300 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate max-w-[120px] md:max-w-[140px]">
                            {ev.role || 'Panitia'}
                          </span>
                          <span className="flex items-center gap-1 text-yellow-500 text-[9px] md:text-[10px] font-black bg-yellow-500/10 px-2 py-1 md:py-0.5 rounded-md border border-yellow-500/20" title="Rating Anda dari EO">
                            ★ {ev.rating_given ? `${ev.rating_given}.0` : 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center justify-start md:justify-center md:w-[43%]">
                          {activeTab === 'active' ? (
                            <span className="bg-emerald-500/10 text-emerald-400 px-2.5 md:px-3 py-1 rounded-lg md:rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Active</span>
                          ) : (
                            <span className="bg-slate-700 text-slate-400 px-2.5 md:px-3 py-1 rounded-lg md:rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-slate-600">Ended</span>
                          )}
                        </div>

                      </div>

                      {/* ACTIONS (KANAN) */}
                      <div className="w-full md:w-[25%] flex flex-row items-center justify-end gap-2 mt-3 md:mt-0">
                        <button onClick={() => handleOpenGuestList(ev)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors text-[10px] font-black uppercase tracking-widest border border-slate-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                          <span className="md:hidden lg:inline">Tamu</span>
                        </button>
                        {activeTab === 'active' && (
                          <button onClick={() => navigate(`/scanner/${ev.id}`)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                            <span className="md:hidden lg:inline">Scan</span>
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/50 rounded-[24px] md:rounded-[32px] p-8 md:p-12 text-center border border-slate-700/50 flex flex-col items-center justify-center min-h-[250px] md:min-h-[300px]">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-inner">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                </div>
                <h3 className="text-lg md:text-xl font-black text-white mb-2">Tugas Kosong</h3>
                <p className="text-slate-400 text-xs md:text-sm font-medium max-w-sm mx-auto leading-relaxed">
                  {activeTab === 'active' ? 'Belum ada Event Organizer yang menugaskan lo buat jadi panitia/agen di acaranya.' : 'Belum ada riwayat event yang selesai lo kerjain.'}
                </p>
              </div>
            )}
          </>
        ) : (
          /* TAMPILAN 2: DAFTAR TAMU SPESIFIK EVENT */
          <div className="animate-fadeIn">
            
            {/* 👇 TOMBOL KEMBALI, JUDUL EVENT, DAN TOMBOL LAPOR KENDALA 👇 */}
            <div className="flex flex-col mb-4">
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-orange-500 font-bold text-xs md:text-sm uppercase tracking-widest mb-3 flex items-center gap-1.5 transition-colors py-1 w-max">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg> Kembali
              </button>
              
              {/* Flexbox justify-between untuk misahin Judul (kiri) dan Tombol (kanan) */}
              <div className="flex flex-row items-center justify-between gap-3 w-full">
                <h2 className="text-lg md:text-2xl font-black text-white leading-tight truncate">Tamu: <span className="text-orange-500">{selectedEvent.title}</span></h2>
                
                {/* Tombol Lapor Kendala di Pojok Kanan Sejajar Judul */}
                <button 
                  onClick={() => setIsEmergencyOpen(true)}
                  className="flex items-center gap-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border border-red-500/30 shrink-0"
                >
                  <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  Lapor Kendala
                </button>
              </div>
            </div>

            {/* LIVE PROGRESS COUNTER */}
            {!loadingAttendees && (
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-orange-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>
                    Live Progress Check-In
                  </p>
                  <p className="text-2xl font-black text-white leading-none">
                    {checkedInGuests} <span className="text-sm font-medium text-slate-500">/ {totalGuests} Tamu</span>
                  </p>
                </div>
                <div className="w-full md:w-1/2 flex items-center gap-3">
                  <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-black text-orange-500 min-w-[36px] text-right">{progressPercentage}%</span>
                </div>
              </div>
            )}
              
            {/* TAMPILAN FILTER & SEARCH */}
            <div className="flex flex-col lg:flex-row gap-3 w-full mt-2 lg:mt-0 mb-6">
              <div className="relative w-full lg:flex-1">
                <input 
                  type="text" 
                  placeholder="Cari nama, email, ID..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); 
                  }}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 md:py-2.5 text-[11px] md:text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
                <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              
              <div className="flex flex-row gap-2 w-full lg:w-auto">
                <select
                  value={selectedSessionFilter}
                  onChange={(e) => {
                    setSelectedSessionFilter(e.target.value);
                    setCurrentPage(1); 
                  }}
                  className="flex-1 lg:flex-none bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-3 md:py-2.5 text-[10px] md:text-sm font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer appearance-none truncate"
                >
                  {uniqueSessions.map(session => (
                    <option key={session} value={session}>{session}</option>
                  ))}
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => {
                    setSelectedStatusFilter(e.target.value);
                    setCurrentPage(1); 
                  }}
                  className="flex-1 lg:flex-none bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-3 md:py-2.5 text-[10px] md:text-sm font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer appearance-none truncate"
                >
                  <option value="Semua Status">Semua Status</option>
                  <option value="Sudah Hadir">Sudah Hadir</option>
                  <option value="Belum Hadir">Belum Hadir</option>
                  <option value="Absen">Tolak Hadir</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-800/50 md:bg-slate-800 rounded-[20px] md:rounded-[24px] border border-transparent md:border-slate-700 overflow-hidden md:shadow-xl">
              {loadingAttendees ? (
                <div className="py-20 text-center"><p className="text-slate-400 font-bold text-xs md:text-sm">Menarik data tamu...</p></div>
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
                                {!t.is_scanned && t.is_attending !== false && activeTab === 'active' ? (
                                  <button onClick={() => handleManualCheckIn(t.ticket_id, selectedEvent.id)} className="bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-orange-500/30 whitespace-nowrap">
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
                    <div className="px-6 py-4 border-t border-slate-700 bg-transparent md:bg-slate-900/30 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">
                        Hal <span className="text-white">{currentPage}</span> dari <span className="text-white">{totalPages}</span>
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition-colors">Prev</button>
                        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition-colors">Next</button>
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
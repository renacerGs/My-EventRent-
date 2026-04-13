import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function EventDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // FIX: JADIKAN USER SEBAGAI STATE AWAL, BUKAN VARIABLE BIASA BIAR GAK INFINITE LOOP
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);

  const [event, setEvent] = useState(null);
  const [groupedAttendees, setGroupedAttendees] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [expandedRow, setExpandedRow] = useState(null); 
  const [isRefreshing, setIsRefreshing] = useState(false); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, ticketId: null });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  const [activeTab, setActiveTab] = useState('attendees'); // 'attendees' | 'agents'
  const [agents, setAgents] = useState([]);
  const [agentEmailInput, setAgentEmailInput] = useState('');
  const [agentDetailModal, setAgentDetailModal] = useState(null); // Buat lihat CV
  const [agentEditRole, setAgentEditRole] = useState({ show: false, agentId: null, role: '' });

  const fetchData = async (isBackground = false) => {
    try {
      if (isBackground) setIsRefreshing(true);
      else setLoading(true);
      
      const resEvent = await fetch(`https://my-event-rent.vercel.app/api/events/${id}`);
      if (!resEvent.ok) throw new Error("Gagal mengambil event");
      const eventData = await resEvent.json();

      const resAttendees = await fetch(`https://my-event-rent.vercel.app/api/events/${id}/attendees?userId=${user?.id}`);
      const dataAttendees = await resAttendees.json();

      const groupedMap = new Map();
      
      // FIX: Cek array biar gak crash map function-nya
      if (Array.isArray(dataAttendees)) {
        dataAttendees.forEach(t => {
          const key = `${t.purchase_date}_${t.buyer_email || 'guest'}`;
          if (!groupedMap.has(key)) {
            groupedMap.set(key, {
              order_id: t.ticket_id, 
              buyer_name: t.attendee_name || t.buyer_name || 'Guest', 
              buyer_email: t.attendee_email || t.buyer_email,
              session_names: new Set(), 
              total_qty: 0,
              scanned_qty: 0,
              tickets: [],
              is_attending_all: true 
            });
          }
          const group = groupedMap.get(key);
          group.total_qty += 1;
          group.session_names.add(t.session_name); 
          
          if (t.is_scanned) group.scanned_qty += 1;
          if (t.is_attending === false) group.is_attending_all = false; 
          group.tickets.push(t);
        });
      }

      const finalAttendees = Array.from(groupedMap.values()).map(g => ({
        ...g,
        session_name: Array.from(g.session_names).join(' & ') 
      }));

      setEvent(prev => JSON.stringify(prev) === JSON.stringify(eventData) ? prev : eventData);
      setGroupedAttendees(prev => JSON.stringify(prev) === JSON.stringify(finalAttendees) ? prev : finalAttendees);
      
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch(`https://my-event-rent.vercel.app/api/events/${id}/agents?eoId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        if(Array.isArray(data)) setAgents(data);
      }
    } catch (err) {
      console.error("Gagal menarik data agen", err);
    }
  };

  useEffect(() => {
    if (!user?.id) { navigate('/'); return; }
    
    fetchData();
    fetchAgents(); // Panggil fetch agen SEKALI saja saat buka
    
    // FIX: Refresh otomatis setiap 60 detik (1 Menit)
    const intervalId = setInterval(() => { fetchData(true); }, 60000);
    return () => clearInterval(intervalId); 
  }, [id, user?.id, navigate]); // FIX: Dependency aman

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleAddAgent = async (e) => {
    e.preventDefault();
    if (!agentEmailInput) return;
    try {
      const res = await fetch(`https://my-event-rent.vercel.app/api/events/${id}/agents?eoId=${user?.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: agentEmailInput, role: 'Panitia' })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setAgentEmailInput('');
        fetchAgents();
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan.');
    }
  };

  const handleRemoveAgent = async (agentId) => {
    if (!window.confirm('Yakin ingin memberhentikan agen ini?')) return;
    try {
      const res = await fetch(`https://my-event-rent.vercel.app/api/events/${id}/agents/${agentId}?eoId=${user?.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Agen berhasil diberhentikan.');
        fetchAgents();
      } else {
        toast.error('Gagal menghapus agen.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan.');
    }
  };

  const submitEditRole = async () => {
    try {
      const res = await fetch(`https://my-event-rent.vercel.app/api/events/${id}/agents/${agentEditRole.agentId}?eoId=${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: agentEditRole.role })
      });
      if (res.ok) {
        toast.success('Tugas agen berhasil diubah!');
        setAgentEditRole({ show: false, agentId: null, role: '' });
        fetchAgents();
      } else {
        toast.error('Gagal mengubah tugas agen.');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan.');
    }
  };

  const toggleExpand = (orderId) => setExpandedRow(expandedRow === orderId ? null : orderId);
  const initiateManualCheckIn = (ticketId) => setConfirmDialog({ show: true, ticketId: ticketId }); 

  const confirmManualCheckIn = async () => {
    const ticketId = confirmDialog.ticketId;
    setConfirmDialog({ show: false, ticketId: null }); 
    try {
      const res = await fetch('https://my-event-rent.vercel.app/api/tickets/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: ticketId, eventId: parseInt(id), userId: user?.id })
      });
      if (res.ok) {
        setPopup({ show: true, message: "Check-In Manual Berhasil!", type: 'success' });
        fetchData(); 
      } else {
        const errorData = await res.json();
        setPopup({ show: true, message: `Gagal Check-In: ${errorData.message}`, type: 'error' });
      }
    } catch (err) { setPopup({ show: true, message: "Terjadi kesalahan jaringan.", type: 'error' }); }
  };

  const isWed = event?.is_private || event?.category === 'Wedding' || event?.category === 'Personal';

  const handleExportCSV = () => {
    let csvHeader = isWed 
      ? "Order ID;Ticket ID;Konfirmasi;Status Scan;Session;Nama Tamu;Email Tamu;Jumlah Pax;Ucapan Doa;Jawaban Custom\n"
      : "Order ID;Ticket ID;Status Kehadiran;Session;Pembeli;Email Pembeli;Nama Peserta;Email Peserta;Jawaban Custom\n";
    let csvContent = csvHeader;
    groupedAttendees.forEach(order => {
      order.tickets.forEach(t => {
        const statusScan = t.is_scanned ? "Telah Hadir" : "Belum Hadir";
        const konfirmasi = t.is_attending === false ? "Tidak Hadir" : "Hadir";
        let customAnsText = "";
        if (t.custom_answers && t.custom_answers.length > 0) {
          customAnsText = t.custom_answers.map(ans => `${ans.question}: ${ans.answer}`).join(" | ");
        }
        const cleanGreeting = t.greeting ? t.greeting.replace(/(\r\n|\n|\r)/gm, " ") : "";
        let row = isWed
          ? `"${order.order_id}";"${t.ticket_id}";"${konfirmasi}";"${statusScan}";"${t.session_name}";"${t.attendee_name || order.buyer_name}";"${t.attendee_email || order.buyer_email}";"${t.pax || 1}";"${cleanGreeting}";"${customAnsText}"`
          : `"${order.order_id}";"${t.ticket_id}";"${statusScan}";"${t.session_name}";"${order.buyer_name}";"${order.buyer_email}";"${t.attendee_name || ''}";"${t.attendee_email || ''}";"${customAnsText}"`;
        csvContent += row + "\n";
      });
    });
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Data_${isWed ? 'Tamu' : 'Peserta'}_${event?.title || 'Event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); 
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/invitation/${id}`);
    setPopup({ show: true, message: "Link Undangan/Event berhasil disalin!", type: 'success' }); 
  };

  const filteredOrders = groupedAttendees.filter(order => {
    if (!searchQuery) return true;
    return order.tickets.some(t => 
      t.attendee_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.greeting && t.greeting.toLowerCase().includes(searchQuery.toLowerCase())) 
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading && !event) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-400 font-bold">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-widest text-xs">Memuat Data Dashboard...</p>
    </div>
  );

  let totalSold = 0; let totalCheckedIn = 0; let totalRevenue = 0; let totalPaxExpected = 0; 
  groupedAttendees.forEach(o => {
    totalSold += o.total_qty;
    totalCheckedIn += o.scanned_qty;
    o.tickets.forEach(t => {
      totalRevenue += Number(t.price);
      if (t.is_attending !== false) totalPaxExpected += Number(t.pax || 1);
    }); 
  });

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans pb-20 pt-4 md:pt-8 text-left relative">
      
      {/* MODAL GLOBAL (Notif & Konfirmasi) */}
      {popup.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 transition-all">
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl transform text-center">
            <div className={`w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full flex items-center justify-center mb-4 md:mb-5 ${popup.type === 'success' ? 'bg-[#E7F9F1] text-[#27AE60]' : 'bg-red-50 text-red-500'}`}>
              {popup.type === 'success' ? (
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              )}
            </div>
            <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2">{popup.type === 'success' ? 'Berhasil!' : 'Oops!'}</h3>
            <p className="text-xs md:text-sm font-bold text-gray-500 mb-6 md:mb-8">{popup.message}</p>
            <button onClick={() => setPopup({ show: false, message: '', type: 'success' })} className="w-full bg-gray-900 text-white font-bold py-3 md:py-3.5 rounded-xl md:rounded-2xl hover:bg-black transition-colors uppercase tracking-widest text-[10px] md:text-xs">Tutup</button>
          </div>
        </div>
      )}

      {confirmDialog.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 transition-all">
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl transform text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-orange-50 text-[#FF6B35] flex items-center justify-center mb-4 md:mb-5">
              <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-lg md:text-xl font-black text-gray-900 mb-2">Konfirmasi Kehadiran</h3>
            <p className="text-xs md:text-sm font-bold text-gray-500 mb-6 md:mb-8">Apakah Anda yakin tamu/peserta ini sudah hadir dan ingin melakukan Check-In manual?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog({ show: false, ticketId: null })} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 md:py-3.5 rounded-xl md:rounded-2xl hover:bg-gray-200 transition-colors uppercase tracking-widest text-[10px] md:text-xs">Batal</button>
              <button onClick={confirmManualCheckIn} className="flex-1 bg-[#FF6B35] text-white font-bold py-3 md:py-3.5 rounded-xl md:rounded-2xl hover:bg-orange-600 transition-colors uppercase tracking-widest text-[10px] md:text-xs">Ya, Check-In</button>
            </div>
          </div>
        </div>
      )}

      {/* 👇 MODAL CV AGEN 👇 */}
      {agentDetailModal && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl transform">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Profile Agen</h3>
              <button onClick={() => setAgentDetailModal(null)} className="text-gray-400 hover:text-gray-900 transition-colors">✕</button>
            </div>
            <div className="flex flex-col items-center mb-6">
              <img src={agentDetailModal.picture} alt={agentDetailModal.name} className="w-24 h-24 rounded-full object-cover border-4 border-orange-50 shadow-md mb-4" />
              <h4 className="text-xl font-black text-gray-900">{agentDetailModal.name}</h4>
              <p className="text-xs text-gray-500 font-bold mb-3">{agentDetailModal.email}</p>
              <div className="bg-yellow-50 text-yellow-600 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                {agentDetailModal.rating_given ? `${agentDetailModal.rating_given}.0` : 'Belum Ada Rating'}
              </div>
            </div>
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-200 pb-2">Informasi Pembayaran</p>
              {agentDetailModal.bank_name && agentDetailModal.bank_account ? (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500 font-bold">Bank: <span className="text-gray-900">{agentDetailModal.bank_name}</span></p>
                  <p className="text-xs text-gray-500 font-bold">No. Rek: <span className="text-gray-900 font-mono tracking-wider font-black">{agentDetailModal.bank_account}</span></p>
                  <p className="text-xs text-gray-500 font-bold">A.N: <span className="text-gray-900 uppercase font-black">{agentDetailModal.bank_account_name}</span></p>
                </div>
              ) : (
                <p className="text-xs text-gray-500 font-bold italic">Agen ini belum melengkapi data rekening bank di profilnya.</p>
              )}
            </div>
            <button onClick={() => setAgentDetailModal(null)} className="w-full mt-6 bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black uppercase tracking-widest text-[10px]">Tutup Detail</button>
          </div>
        </div>
      )}

      {/* 👇 MODAL EDIT ROLE AGEN 👇 */}
      {agentEditRole.show && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 mb-1">Edit Tugas Agen</h3>
            <p className="text-xs font-bold text-gray-500 mb-6">Ubah pembagian tugas agen ini di lapangan.</p>
            <input 
              type="text" 
              value={agentEditRole.role} 
              onChange={(e) => setAgentEditRole(prev => ({...prev, role: e.target.value}))} 
              placeholder="Misal: Penjaga Pintu A" 
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-700 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 transition-all mb-6"
            />
            <div className="flex gap-3">
              <button onClick={() => setAgentEditRole({show:false, agentId: null, role:''})} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-200">Batal</button>
              <button onClick={submitEditRole} className="flex-1 py-3.5 bg-[#FF6B35] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-200">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {isRefreshing && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 animate-bounce">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></span> Syncing Data...
          </div>
        )}

        {/* HEADER DASHBOARD */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-4 mb-6 md:mb-8 mt-2 md:mt-0">
          <div className="flex items-start md:items-center gap-3">
             <button onClick={() => navigate('/manage')} className="w-8 h-8 md:w-8 md:h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#FF6B35] hover:border-[#FF6B35] transition-colors shrink-0 mt-1 md:mt-0">
               <svg className="w-4 h-4 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
             </button>
             <div>
               <h1 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight">Dashboard</h1>
               <h2 className="text-xs md:text-base text-gray-500 font-bold mt-0.5 line-clamp-1">{event.title}</h2>
             </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
            <div className="bg-white px-3 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between md:justify-start flex-1 md:flex-none gap-2 md:gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleCopy}>
              <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Share Link</span>
              <button className="text-xs md:text-sm font-bold text-[#FF6B35] transition bg-orange-50 px-2.5 md:px-3 py-1 rounded-lg">Copy</button>
            </div>
            <button onClick={() => navigate(`/scanner/${event.id}`)} className="bg-gray-900 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl shadow-xl hover:bg-black transition-colors flex items-center justify-center flex-1 md:flex-none gap-2">
              <span className="font-bold text-[10px] md:text-sm uppercase tracking-widest">Buka Scanner</span>
            </button>
          </div>
        </div>

        {/* KOTAK STATISTIK */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mb-8 md:mb-10">
          <div className="bg-white p-5 md:p-8 rounded-[20px] md:rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden flex flex-col justify-center">
            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 md:mb-3">{isWed ? 'Data RSVP Masuk' : 'Tickets Sold'}</p>
            <h3 className="text-2xl md:text-4xl font-black text-gray-900 mb-1">{totalSold}</h3>
            {isWed ? (
              <p className="text-[9px] md:text-xs font-bold text-[#D4AF37] mt-1 md:mt-3 bg-[#D4AF37]/10 w-max px-2 py-0.5 md:px-3 md:py-1 rounded-md">Total Pax/Orang: {totalPaxExpected}</p>
            ) : (
              <p className="text-[9px] md:text-xs font-bold text-[#27AE60] mt-1 md:mt-3 bg-[#E7F9F1] w-max px-2 py-0.5 md:px-3 md:py-1 rounded-md truncate max-w-full">Rp {(totalRevenue/1000)}K</p>
            )}
          </div>
          
          <div className="bg-white p-5 md:p-8 rounded-[20px] md:rounded-[32px] border border-gray-200 shadow-[0_10px_30px_rgba(39,174,96,0.1)] relative overflow-hidden ring-2 ring-[#27AE60]/20 flex flex-col justify-center">
            <p className="text-[9px] md:text-[10px] font-black text-[#27AE60] uppercase tracking-widest mb-1 md:mb-3 flex items-center gap-1.5 md:gap-2">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#27AE60] rounded-full animate-ping"></span> Live Presence
            </p>
            <h3 className="text-2xl md:text-4xl font-black text-gray-900 mb-1">{totalCheckedIn} <span className="text-sm md:text-xl text-gray-300">/ {isWed ? totalPaxExpected : totalSold}</span></h3>
            <p className="text-[9px] md:text-xs font-bold text-gray-500 mt-1 md:mt-3">Telah Hadir (Scan)</p>
          </div>

          <div className="bg-white p-5 md:p-8 rounded-[20px] md:rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden col-span-2 md:col-span-1 flex flex-col justify-center items-center md:items-start text-center md:text-left">
            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 md:mb-3">Tim Agen</p>
            <h3 className="text-xl md:text-3xl font-black mt-0 md:mt-2 text-gray-900">{agents.length} <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Orang</span></h3>
          </div>
        </div>

        {/* 👇👇 TABS NAVIGATION 👇👇 */}
        <div className="flex border-b border-gray-200 mb-6 px-2 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('attendees')} 
            className={`px-6 py-3.5 font-black text-xs md:text-sm uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === 'attendees' ? 'border-[#FF6B35] text-[#FF6B35]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
          >
            🎟️ Data {isWed ? 'Tamu RSVP' : 'Peserta'}
          </button>
          <button 
            onClick={() => setActiveTab('agents')} 
            className={`px-6 py-3.5 font-black text-xs md:text-sm uppercase tracking-widest border-b-2 transition-colors whitespace-nowrap ${activeTab === 'agents' ? 'border-[#FF6B35] text-[#FF6B35]' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
          >
            👥 Tim Agen & Panitia
          </button>
        </div>

        {/* ========================================================== */}
        {/* ================= TAB 1: DATA PESERTA/TAMU =============== */}
        {/* ========================================================== */}
        {activeTab === 'attendees' && (
          <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-200 overflow-hidden mb-10 animate-fadeIn">
            <div className="px-5 py-5 md:px-8 md:py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h3 className="text-lg md:text-xl font-bold text-gray-900">{isWed ? 'Buku Tamu & RSVP' : 'Peserta Event'}</h3>
              <div className="flex flex-row items-center gap-2 md:gap-3 w-full md:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <input 
                    type="text" 
                    placeholder={isWed ? "Cari tamu atau doa..." : "Cari peserta..."} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 md:pl-10 md:pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
                  />
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <button onClick={handleExportCSV} className="w-auto bg-gray-100 text-gray-900 px-4 md:px-5 py-2.5 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors whitespace-nowrap shrink-0">
                  <span className="hidden md:inline">Download CSV</span>
                  <span className="md:hidden">CSV</span>
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto bg-gray-50/20 md:bg-white p-4 md:p-0">
              <table className="hidden md:table w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-8 py-5">ID</th>
                    <th className="px-8 py-5">{isWed ? 'Nama Tamu' : 'Buyer Account'}</th>
                    <th className="px-8 py-5 max-w-[200px]">Session(s)</th>
                    <th className="px-8 py-5 text-center">{isWed ? 'Pax' : 'Qty'}</th>
                    <th className="px-8 py-5">Status</th> 
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                {currentItems.length > 0 ? (
                  currentItems.map((order) => (
                    <tbody key={`desktop-${order.order_id}`} className="border-b border-gray-50 last:border-none">
                      <tr className="hover:bg-gray-50/30 transition-colors">
                        <td className="px-8 py-5 text-xs font-bold text-gray-400">#{order.order_id}</td>
                        <td className="px-8 py-5 font-bold text-sm">{order.buyer_name} <br/><span className="text-xs font-normal text-gray-400">{order.buyer_email}</span></td>
                        <td className="px-8 py-5 max-w-[200px] truncate" title={order.session_name}>
                          <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold uppercase truncate inline-block max-w-full">
                            {order.session_name}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center font-black">{isWed ? (order.tickets[0]?.pax || 1) : order.total_qty}</td>
                        <td className="px-8 py-5">
                          {order.is_attending_all === false ? (
                            <span className="px-3 py-1 bg-red-50 text-red-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">Tidak Hadir</span>
                          ) : order.scanned_qty === order.total_qty ? (
                            <span className="px-3 py-1 bg-[#E7F9F1] text-[#27AE60] rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">All Checked-In</span>
                          ) : order.scanned_qty > 0 ? (
                            <span className="px-3 py-1 bg-orange-50 text-[#FF6B35] rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">Partial ({order.scanned_qty}/{order.total_qty})</span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-[10px] font-bold uppercase tracking-widest">Belum Hadir</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <button onClick={() => toggleExpand(order.order_id)} className="text-[10px] font-bold text-gray-500 hover:text-[#FF6B35] uppercase tracking-wider underline">
                            {expandedRow === order.order_id ? 'Tutup Detail' : 'Lihat Detail'}
                          </button>
                        </td>
                      </tr>
                      {expandedRow === order.order_id && (
                        <tr className="bg-orange-50/30">
                          <td colSpan="6" className="px-8 py-6 border-l-4 border-[#FF6B35]">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                              {isWed ? 'Detail Undangan & Ucapan Doa' : 'Daftar Tiket Individual'}
                            </p>
                            <div className={`grid gap-4 ${isWed ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-3'}`}>
                              {order.tickets.map((t, idx) => {
                                const isMatch = searchQuery && (t.attendee_name?.toLowerCase().includes(searchQuery.toLowerCase()) || t.greeting?.toLowerCase().includes(searchQuery.toLowerCase()));
                                return (
                                  <div key={t.ticket_id} className={`bg-white p-5 rounded-2xl border ${isWed ? 'border-[#D4AF37]/30 shadow-md' : 'border-orange-100 shadow-sm'} relative overflow-hidden flex flex-col justify-between`}>
                                    {isMatch && <div className="absolute top-0 right-0 bg-[#FF6B35] text-white text-[8px] font-black uppercase px-2 py-1 rounded-bl-lg">MATCH</div>}
                                    <div>
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <p className={`text-[10px] font-black uppercase mb-1 ${isWed ? 'text-[#D4AF37]' : 'text-[#FF6B35]'}`}>
                                            {isWed ? 'Data Tamu' : `Tiket #${t.ticket_id}`}
                                          </p>
                                          <span className="bg-gray-100 text-gray-600 text-[8px] px-2 py-0.5 rounded uppercase font-bold tracking-wider inline-block">
                                            {t.session_name}
                                          </span>
                                        </div>
                                        {t.is_attending === false ? (
                                          <span className="text-[8px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase mt-1">Tidak Hadir</span>
                                        ) : t.is_scanned ? (
                                          <span className="text-[8px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase mt-1">Hadir</span>
                                        ) : null}
                                      </div>
                                      <h4 className="font-black text-gray-900 text-lg truncate mt-2">{t.attendee_name || `Peserta ${idx + 1}`}</h4>
                                      <p className={`text-xs text-gray-500 truncate ${isWed ? 'mb-1' : 'mb-3'}`}>{t.attendee_email || '-'}</p>
                                      {isWed && (
                                        <div className="mt-3 bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
                                          <p className="text-xs text-gray-600"><span className="font-bold text-gray-800">Pax:</span> {t.pax || 1} Orang</p>
                                          <p className="text-xs text-gray-600 italic line-clamp-3"><span className="font-bold text-gray-800 not-italic">Ucapan:</span> "{t.greeting || '-'}"</p>
                                        </div>
                                      )}
                                    </div>
                                    {!t.is_scanned && t.is_attending !== false && (
                                      <button onClick={() => initiateManualCheckIn(t.ticket_id)} className={`w-full mt-4 text-[10px] font-black text-white py-2.5 rounded-xl uppercase tracking-widest shadow-sm transition-colors ${isWed ? 'bg-slate-900 hover:bg-black' : 'bg-[#FF6B35] hover:bg-orange-600'}`}>
                                        Manual Check-In
                                      </button>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  ))
                ) : (
                  <tbody>
                    <tr>
                      <td colSpan="6" className="px-8 py-10 text-center text-gray-400 font-bold text-sm">
                        <div className="flex flex-col items-center justify-center">
                          <svg className="w-12 h-12 mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                          Tidak ada data yang cocok.
                        </div>
                      </td>
                    </tr>
                  </tbody>
                )}
              </table>

              <div className="md:hidden flex flex-col gap-3">
                {currentItems.length > 0 ? (
                  currentItems.map((order) => (
                    <div key={`mobile-${order.order_id}`} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                      <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                        <div className="max-w-[60%]">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">#{order.order_id}</p>
                          <p className="text-sm font-bold text-gray-900 leading-tight">{order.buyer_name}</p>
                          <p className="text-[10px] text-gray-500 truncate w-40">{order.buyer_email}</p>
                        </div>
                        <div className="text-right max-w-[40%]">
                          <span className="px-2 py-0.5 bg-gray-100 rounded-md text-[8px] font-bold uppercase mb-1.5 inline-block truncate max-w-full">{order.session_name}</span>
                          <div className="text-[10px] font-bold">{isWed ? 'Pax' : 'Qty'}: <span className="font-black text-[#FF6B35]">{isWed ? (order.tickets[0]?.pax || 1) : order.total_qty}</span></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div>
                          {order.is_attending_all === false ? (
                            <span className="px-2.5 py-1 bg-red-50 text-red-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-100">Tidak Hadir</span>
                          ) : order.scanned_qty === order.total_qty ? (
                            <span className="px-2.5 py-1 bg-[#E7F9F1] text-[#27AE60] rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">All Hadir</span>
                          ) : order.scanned_qty > 0 ? (
                            <span className="px-2.5 py-1 bg-orange-50 text-[#FF6B35] rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-100">Sebagian ({order.scanned_qty}/{order.total_qty})</span>
                          ) : (
                            <span className="px-2.5 py-1 bg-gray-50 text-gray-400 rounded-full text-[9px] font-bold uppercase tracking-widest">Belum Hadir</span>
                          )}
                        </div>
                        <button onClick={() => toggleExpand(order.order_id)} className="text-[10px] font-black text-[#FF6B35] uppercase tracking-wider flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all">
                          {expandedRow === order.order_id ? 'Tutup' : 'Lihat Data'}
                        </button>
                      </div>
                      {expandedRow === order.order_id && (
                        <div className="mt-4 pt-4 border-t-2 border-dashed border-orange-100 flex flex-col gap-3">
                          {order.tickets.map((t, idx) => (
                            <div key={t.ticket_id} className={`p-4 rounded-xl border shadow-sm ${t.is_attending === false ? 'bg-red-50/20 border-red-100' : t.is_scanned ? 'bg-green-50/30 border-green-100' : 'bg-white border-gray-200'}`}>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className={`text-[9px] font-black uppercase mb-1 ${isWed ? 'text-[#D4AF37]' : 'text-gray-500'}`}>{isWed ? 'Data Tamu' : `TIKET #${t.ticket_id.toString().slice(-5)}`}</p>
                                  <span className="bg-gray-100 text-gray-600 text-[8px] px-2 py-0.5 rounded uppercase font-bold tracking-wider inline-block">{t.session_name}</span>
                                </div>
                                {t.is_attending === false ? (<span className="text-[8px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-full uppercase mt-1">Tidak Hadir</span>) : t.is_scanned ? (<span className="text-[8px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase mt-1">Hadir</span>) : null}
                              </div>
                              <p className="font-black text-gray-900 text-base truncate mt-2">{t.attendee_name || `Peserta ${idx + 1}`}</p>
                              <p className={`text-[10px] text-gray-500 truncate ${isWed ? 'mb-1' : 'mb-2'}`}>{t.attendee_email || '-'}</p>
                              {!t.is_scanned && t.is_attending !== false && (
                                <button onClick={() => initiateManualCheckIn(t.ticket_id)} className={`w-full mt-3 text-[10px] font-black text-white py-2.5 rounded-lg uppercase tracking-widest shadow-sm active:scale-95 transition-all ${isWed ? 'bg-slate-900' : 'bg-[#FF6B35]'}`}>Check-In Manual</button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm"><p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data tidak ditemukan</p></div>
                )}
              </div>
            </div>
            
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <span className="text-[10px] md:text-xs font-bold text-gray-500">
                  Menampilkan <span className="text-gray-900">{indexOfFirstItem + 1}</span> - <span className="text-gray-900">{Math.min(indexOfLastItem, filteredOrders.length)}</span> dari <span className="text-gray-900">{filteredOrders.length}</span> data
                </span>
                <div className="flex gap-1 md:gap-2">
                  <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>Prev</button>
                  <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>Next</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================== */}
        {/* ================= TAB 2: TIM AGEN / PANITIA ============== */}
        {/* ========================================================== */}
        {activeTab === 'agents' && (
          <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-200 overflow-hidden mb-10 animate-fadeIn">
            <div className="px-5 py-6 md:px-8 md:py-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2">Rekrut Agen Baru</h3>
              <p className="text-xs md:text-sm font-bold text-gray-500 mb-6">Masukkan email agen untuk memberikan akses Scanner ke event ini. Pastikan mereka sudah terdaftar di EventRent.</p>
              <form onSubmit={handleAddAgent} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                  </div>
                  <input 
                    value={agentEmailInput} 
                    onChange={e => setAgentEmailInput(e.target.value)} 
                    type="email" 
                    placeholder="Misal: budi@gmail.com" 
                    required
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl md:rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all shadow-sm" 
                  />
                </div>
                <button type="submit" className="bg-[#FF6B35] text-white px-8 py-3.5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-orange-600 transition-colors shadow-lg shadow-orange-200 flex items-center justify-center gap-2 whitespace-nowrap">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  Tambah Agen
                </button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Profil Agen</th>
                    <th className="px-8 py-5">Tugas / Role</th>
                    <th className="px-8 py-5 text-center">Avg Rating</th>
                    <th className="px-8 py-5 text-right">Manajemen</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.length > 0 ? (
                    agents.map((a) => (
                      <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                        <td className="px-8 py-4">
                          <div className="flex items-center gap-4">
                            <img src={a.picture} alt={a.name} className="w-12 h-12 rounded-full border-2 border-gray-100 object-cover" />
                            <div>
                              <p className="font-black text-gray-900 text-sm">{a.name}</p>
                              <p className="text-[10px] font-bold text-gray-400">{a.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                          <span className="bg-orange-50 text-[#FF6B35] px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-orange-100">
                            {a.role || 'Panitia'}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <div className="inline-flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full text-yellow-600 font-black text-[10px] tracking-widest border border-yellow-100">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                            {a.rating_given ? `${a.rating_given}.0` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setAgentDetailModal(a)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="Lihat CV/Profil">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            </button>
                            <button onClick={() => setAgentEditRole({ show: true, agentId: a.id, role: a.role })} className="p-2 bg-orange-50 text-[#FF6B35] rounded-xl hover:bg-orange-100 transition-colors" title="Edit Tugas">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                            <button onClick={() => handleRemoveAgent(a.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors" title="Berhentikan Agen">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-8 py-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </div>
                        <h4 className="text-base font-black text-gray-900 mb-1">Belum Ada Agen</h4>
                        <p className="text-xs font-bold text-gray-400">Silakan tambahkan email teman Anda untuk direkrut menjadi panitia.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
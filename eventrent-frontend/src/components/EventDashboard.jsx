import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function EventDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);

  const [event, setEvent] = useState(null);
  const [groupedAttendees, setGroupedAttendees] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [expandedRow, setExpandedRow] = useState(null); 
  const [isRefreshing, setIsRefreshing] = useState(false); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('Semua Sesi'); 
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('Semua'); 
  
  // STATE MODALS
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, ticketId: null });
  const [confirmRemoveAgent, setConfirmRemoveAgent] = useState({ show: false, agentId: null });
  const [confirmDeleteJob, setConfirmDeleteJob] = useState({ show: false, jobId: null });
  const [confirmRespondApp, setConfirmRespondApp] = useState({ show: false, appId: null, action: null });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  const [activeTab, setActiveTab] = useState('attendees'); 
  const [agents, setAgents] = useState([]);
  const [agentEmailInput, setAgentEmailInput] = useState('');
  const [agentDetailModal, setAgentDetailModal] = useState(null); 
  const [agentEditRole, setAgentEditRole] = useState({ show: false, agentId: null, role: '', rating_given: 0 });

  const [reports, setReports] = useState([]);

  // STATE RECRUITMENT
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [newJob, setNewJob] = useState({ role: '', quota: '', fee: '', description: '' });
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [showRecruitmentModal, setShowRecruitmentModal] = useState(false); 

  // STATE PAYOUT (PENGGAJIAN)
  const [payouts, setPayouts] = useState([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false); 
  const [selectedAgentPayout, setSelectedAgentPayout] = useState(null);
  const [payoutAmountInput, setPayoutAmountInput] = useState('');
  // 👇 STATE BARU UNTUK ANIMASI CHECKOUT PAYOUT
  const [payoutProcessStatus, setPayoutProcessStatus] = useState('idle'); 

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

  const fetchReports = async () => {
    try {
      const res = await fetch(`https://my-event-rent.vercel.app/api/events/${id}/reports?eoId=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Gagal menarik data laporan", err);
    }
  };

  const fetchRecruitmentData = async () => {
    try {
      const resJobs = await fetch(`https://my-event-rent.vercel.app/api/events/${id}/jobs?eoId=${user?.id}`);
      if (resJobs.ok) setJobs(await resJobs.json());

      const resApps = await fetch(`https://my-event-rent.vercel.app/api/events/${id}/applicants?eoId=${user?.id}`);
      if (resApps.ok) setApplicants(await resApps.json());
    } catch (err) {
      console.error("Gagal narik data recruitment", err);
    }
  };

  const fetchPayouts = async () => {
    try {
      const res = await fetch(`https://my-event-rent.vercel.app/api/events/${id}/payouts?eoId=${user?.id}`);
      if (res.ok) setPayouts(await res.json());
    } catch (err) {
      console.error("Gagal narik data payout", err);
    }
  };

  const handleResolveReport = async (reportId) => {
    const toastId = toast.loading("Memproses...");
    try {
      const res = await fetch(`https://my-event-rent.vercel.app/api/reports/${reportId}/resolve?eoId=${user?.id}`, { method: 'PATCH' });
      if (res.ok) {
        toast.success("Kendala berhasil ditandai selesai!", { id: toastId });
        fetchReports();
      } else {
        toast.error("Gagal menandai selesai", { id: toastId });
      }
    } catch (err) {
      toast.error("Gagal memproses jaringan.", { id: toastId });
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setIsCreatingJob(true);
    const toastId = toast.loading('Membuka lowongan...');
    
    try {
      const res = await fetch('https://my-event-rent.vercel.app/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: id,
          eoId: user?.id,
          role: newJob.role,
          quota: parseInt(newJob.quota),
          fee: parseInt(newJob.fee),
          description: newJob.description
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Lowongan berhasil dibuka!', { id: toastId });
        setNewJob({ role: '', quota: '', fee: '', description: '' });
        fetchRecruitmentData(); 
        setShowRecruitmentModal(false); 
      } else {
        toast.error(data.message || 'Gagal membuka lowongan.', { id: toastId });
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan atau API belum siap.', { id: toastId });
    } finally {
      setIsCreatingJob(false);
    }
  };

  const initiateDeleteJob = (jobId) => {
    setConfirmDeleteJob({ show: true, jobId: jobId });
  };

  const executeDeleteJob = async () => {
    const jobId = confirmDeleteJob.jobId;
    setConfirmDeleteJob({ show: false, jobId: null });

    const toastId = toast.loading('Menghapus lowongan...');
    try {
      const res = await fetch(`https://my-event-rent.vercel.app/api/jobs/${jobId}?eoId=${user?.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (res.ok) {
        toast.success('Lowongan berhasil dihapus!', { id: toastId });
        fetchRecruitmentData(); 
      } else {
        toast.error(data.message || 'Gagal menghapus lowongan.', { id: toastId });
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan.', { id: toastId });
    }
  };

  const executeRespondApplicant = async () => {
    const { appId, action } = confirmRespondApp;
    setConfirmRespondApp({ show: false, appId: null, action: null });
    
    const toastId = toast.loading('Memproses lamaran...');
    try {
      const res = await fetch('https://my-event-rent.vercel.app/api/jobs/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, action: action, eoId: user?.id })
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(action === 'ACCEPTED' ? 'Pelamar diterima & otomatis jadi Agen!' : 'Pelamar ditolak.', { id: toastId });
        fetchRecruitmentData(); 
        if (action === 'ACCEPTED') {
          fetchAgents(); 
          fetchPayouts(); 
        }
      } else {
        toast.error(data.message || 'Gagal memproses lamaran.', { id: toastId });
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan.', { id: toastId });
    }
  };

  // 👇 FUNGSI MARK PAID YANG UDAH DI UPDATE PAKE ANIMASI ALA CHECKOUT 👇
  const executeMarkPaid = async () => {
    const amount = payoutAmountInput || 0;
    if (amount <= 0) {
      toast.error('Isi nominal transfernya dulu bro!');
      return;
    }

    if (!selectedAgentPayout) return;
    const agentId = selectedAgentPayout.agent_id;

    // Ganti ke animasi loading
    setPayoutProcessStatus('processing');

    try {
      const res = await fetch(`https://my-event-rent.vercel.app/api/events/${id}/payouts/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, eoId: user?.id, amount: Number(amount) })
      });
      const data = await res.json();

      if (res.ok) {
        setPayoutProcessStatus('success'); // Munculin centang hijau
        fetchPayouts(); 
        
        // Auto close pop-up setelah animasi jalan 2 detik
        setTimeout(() => {
          setShowPayoutModal(false);
          setSelectedAgentPayout(null);
          setPayoutAmountInput('');
          setPayoutProcessStatus('idle'); // Reset kembali normal
        }, 2000);
      } else {
        toast.error(data.message || 'Gagal memproses pembayaran.');
        setPayoutProcessStatus('idle');
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan.');
      setPayoutProcessStatus('idle');
    }
  };

  useEffect(() => {
    if (!user?.id) { navigate('/'); return; }
    fetchData();
    fetchAgents(); 
    fetchReports(); 
    fetchRecruitmentData(); 
    fetchPayouts(); 
    const intervalId = setInterval(() => { fetchData(true); }, 60000);
    return () => clearInterval(intervalId); 
  }, [id, user?.id, navigate]); 

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSessionFilter, selectedStatusFilter]); 

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
        fetchPayouts(); 
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan.');
    }
  };

  const executeRemoveAgent = async () => {
    const agentId = confirmRemoveAgent.agentId;
    setConfirmRemoveAgent({ show: false, agentId: null });
    try {
      const res = await fetch(`https://my-event-rent.vercel.app/api/events/${id}/agents/${agentId}?eoId=${user?.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Agen berhasil diberhentikan.');
        fetchAgents(); 
        fetchPayouts();
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
        body: JSON.stringify({ role: agentEditRole.role, rating_given: agentEditRole.rating_given })
      });
      if (res.ok) {
        toast.success('Data agen berhasil diubah!');
        setAgentEditRole({ show: false, agentId: null, role: '', rating_given: 0 });
        fetchAgents();
        fetchPayouts();
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
  const isEventEnded = event ? new Date(event.date_end) < new Date() : false;

  const handleExportCSV = () => {
    let csvHeader = isWed 
      ? "Order ID;Ticket ID;Konfirmasi;Status Scan;Session;Nama Tamu;Email Tamu;Jumlah Pax;Ucapan Doa;Di-scan Oleh;Jawaban Custom\n"
      : "Order ID;Ticket ID;Status Kehadiran;Session;Pembeli;Email Pembeli;Nama Peserta;Email Peserta;Di-scan Oleh;Jawaban Custom\n";
    let csvContent = csvHeader;
    groupedAttendees.forEach(order => {
      order.tickets.forEach(t => {
        const statusScan = t.is_scanned ? "Telah Hadir" : "Belum Hadir";
        const konfirmasi = t.is_attending === false ? "Tidak Hadir" : "Hadir";
        const scannedBy = t.scanned_by_name || "-";
        let customAnsText = "";
        if (t.custom_answers && t.custom_answers.length > 0) {
          customAnsText = t.custom_answers.map(ans => `${ans.question}: ${ans.answer}`).join(" | ");
        }
        const cleanGreeting = t.greeting ? t.greeting.replace(/(\r\n|\n|\r)/gm, " ") : "";
        let row = isWed
          ? `"${order.order_id}";"${t.ticket_id}";"${konfirmasi}";"${statusScan}";"${t.session_name}";"${t.attendee_name || order.buyer_name}";"${t.attendee_email || order.buyer_email}";"${t.pax || 1}";"${cleanGreeting}";"${scannedBy}";"${customAnsText}"`
          : `"${order.order_id}";"${t.ticket_id}";"${statusScan}";"${t.session_name}";"${order.buyer_name}";"${order.buyer_email}";"${t.attendee_name || ''}";"${t.attendee_email || ''}";"${scannedBy}";"${customAnsText}"`;
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

  const filteredOrders = groupedAttendees.map(order => {
    const filteredTickets = order.tickets.filter(t => {
      if (selectedStatusFilter === 'Hadir') return t.is_scanned;
      if (selectedStatusFilter === 'Belum Hadir') return !t.is_scanned && t.is_attending !== false;
      if (selectedStatusFilter === 'Tidak Hadir') return t.is_attending === false;
      return true;
    });
    return { ...order, tickets: filteredTickets };
  }).filter(order => {
    if (order.tickets.length === 0) return false;

    const matchSearch = !searchQuery || order.tickets.some(t => 
      t.attendee_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.greeting && t.greeting.toLowerCase().includes(searchQuery.toLowerCase())) 
    );
    
    const matchSession = selectedSessionFilter === 'Semua Sesi' || order.tickets.some(t => t.session_name === selectedSessionFilter);

    return matchSearch && matchSession;
  });

  const uniqueSessions = ['Semua Sesi', ...new Set(groupedAttendees.flatMap(o => o.tickets.map(t => t.session_name)))];

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
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

  const pendingApplicantsCount = applicants.filter(a => a.status === 'PENDING').length;
  const pendingReportsCount = reports.filter(r => r.status === 'PENDING').length;

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans pb-20 pt-4 md:pt-8 text-left relative">
      
      {/* ======================= MODAL RECRUITMENT ======================= */}
      {showRecruitmentModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fadeIn">
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 max-w-lg w-full shadow-2xl relative">
            <button onClick={() => setShowRecruitmentModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>

            <h3 className="text-xl font-black text-gray-900 mb-1">Buka Lowongan Baru</h3>
            <p className="text-xs font-bold text-gray-500 mb-6">Cari panitia / agen tambahan buat event lo.</p>
            
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Tugas / Posisi</label>
                <input type="text" value={newJob.role} onChange={e => setNewJob({...newJob, role: e.target.value})} placeholder="Misal: Penjaga Pintu A" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Kuota Orang</label>
                  <input type="number" min="1" value={newJob.quota} onChange={e => setNewJob({...newJob, quota: e.target.value})} placeholder="Misal: 5" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Fee / Gaji (Rp)</label>
                  <input type="number" min="0" value={newJob.fee} onChange={e => setNewJob({...newJob, fee: e.target.value})} placeholder="Misal: 150000" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Deskripsi / Syarat</label>
                <textarea value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} placeholder="Tulis syarat, jam kerja, atau dresscode..." required className="w-full h-24 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none transition-all"></textarea>
              </div>
              <button type="submit" disabled={isCreatingJob} className="w-full bg-blue-600 text-white font-black py-3.5 rounded-xl hover:bg-blue-700 transition-colors uppercase tracking-widest text-[10px] md:text-xs shadow-lg shadow-blue-200 mt-2">
                {isCreatingJob ? 'Memproses...' : 'Posting Lowongan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL PENGGAJIAN (UPDATE GAYA CHECKOUT) ======================= */}
      {showPayoutModal && selectedAgentPayout && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl relative bg-white">
            
            {/* Tampil Pas Mode Input (Idle) */}
            {payoutProcessStatus === 'idle' && (
              <button onClick={() => { setShowPayoutModal(false); setSelectedAgentPayout(null); setPayoutAmountInput(''); }} className="absolute top-5 right-5 rounded-full w-8 h-8 flex items-center justify-center transition-colors text-gray-400 bg-gray-100 hover:text-gray-900 z-10">
                ✕
              </button>
            )}

            {payoutProcessStatus === 'idle' && (
              <div className="p-8 pt-10">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                
                <h3 className="text-xl font-black text-gray-900 mb-1 text-center">Transfer Gaji Agen</h3>
                <p className="text-xs font-bold text-gray-500 mb-6 text-center">Tandai lunas untuk agen <span className="text-gray-900">{selectedAgentPayout.agent_name}</span></p>

                {/* Info Bank Agen biar EO gampang transfer */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 text-center relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Tujuan Transfer ({selectedAgentPayout.bank_name || 'Bank Belum Diisi'})</p>
                   <p className="text-2xl font-black text-gray-900 tracking-widest select-all">{selectedAgentPayout.bank_account || '-'}</p>
                   <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">A.N {selectedAgentPayout.bank_account_name || '-'}</p>
                </div>

                <div className="mb-8">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block text-center">Nominal Ditransfer (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400">Rp</span>
                    <input 
                      type="number" 
                      min="0"
                      placeholder="150000"
                      value={payoutAmountInput}
                      onChange={(e) => setPayoutAmountInput(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-2xl pl-14 pr-4 py-4 text-xl font-black text-gray-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all text-center"
                    />
                  </div>
                </div>

                <button 
                  onClick={executeMarkPaid} 
                  className="w-full py-4 bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 shadow-xl shadow-emerald-200 transition-all active:scale-95"
                >
                  Konfirmasi Lunas
                </button>
              </div>
            )}

            {/* Tampil Pas Mode Processing / Success */}
            {payoutProcessStatus !== 'idle' && (
              <div className="p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
                {payoutProcessStatus === 'processing' ? (
                  <>
                    <div className="w-16 h-16 border-4 rounded-full animate-spin mb-6 border-gray-100 border-t-emerald-500"></div>
                    <h3 className="text-lg font-black uppercase tracking-wide text-gray-900">Memverifikasi...</h3>
                    <p className="text-xs mt-2 font-medium text-gray-500">Menyimpan data pembayaran</p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 border-[6px] animate-bounce bg-emerald-50 text-emerald-500 border-emerald-100">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-gray-900">Pembayaran Sukses!</h3>
                    <p className="text-sm mt-2 font-medium text-gray-500">Notifikasi gaji cair telah dikirim ke agen.</p>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ======================= MODAL HAPUS LOWONGAN ======================= */}
      {confirmDeleteJob.show && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 transition-all animate-fadeIn">
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl transform text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-red-50 text-red-50 flex items-center justify-center mb-4 md:mb-5">
              <svg className="w-8 h-8 md:w-10 md:h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </div>
            <h3 className="text-lg md:text-xl font-black text-gray-900 mb-2">Hapus Lowongan?</h3>
            <p className="text-xs md:text-sm font-medium text-gray-500 mb-6 md:mb-8">Yakin mau hapus lowongan ini bro? Data semua pelamar di posisi ini juga bakal ikut ilang loh.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteJob({ show: false, jobId: null })} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 md:py-3.5 rounded-xl md:rounded-2xl hover:bg-gray-200 transition-colors uppercase tracking-widest text-[10px] md:text-xs">Batal</button>
              <button onClick={executeDeleteJob} className="flex-1 bg-red-500 text-white font-bold py-3 md:py-3.5 rounded-xl md:rounded-2xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95 uppercase tracking-widest text-[10px] md:text-xs">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL TERIMA/TOLAK PELAMAR ======================= */}
      {confirmRespondApp.show && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 transition-all animate-fadeIn">
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl transform text-center">
            <div className={`w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full flex items-center justify-center mb-4 md:mb-5 ${confirmRespondApp.action === 'ACCEPTED' ? 'bg-blue-50 text-blue-500' : 'bg-red-50 text-red-500'}`}>
              {confirmRespondApp.action === 'ACCEPTED' ? (
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
              )}
            </div>
            <h3 className="text-lg md:text-xl font-black text-gray-900 mb-2">
              {confirmRespondApp.action === 'ACCEPTED' ? 'Terima Pelamar?' : 'Tolak Pelamar?'}
            </h3>
            <p className="text-xs md:text-sm font-medium text-gray-500 mb-6 md:mb-8">
              {confirmRespondApp.action === 'ACCEPTED' 
                ? 'Yakin mau terima agen ini? Mereka akan otomatis masuk ke tim panitia event lo.' 
                : 'Yakin mau tolak lamaran ini? Notifikasi penolakan akan otomatis dikirim.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRespondApp({ show: false, appId: null, action: null })} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 md:py-3.5 rounded-xl md:rounded-2xl hover:bg-gray-200 transition-colors uppercase tracking-widest text-[10px] md:text-xs">Batal</button>
              <button onClick={executeRespondApplicant} className={`flex-1 text-white font-bold py-3 md:py-3.5 rounded-xl md:rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-[10px] md:text-xs ${confirmRespondApp.action === 'ACCEPTED' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-red-500 hover:bg-red-600 shadow-red-200'}`}>
                {confirmRespondApp.action === 'ACCEPTED' ? 'Ya, Terima' : 'Ya, Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GLOBAL LAINNYA */}
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

      {confirmRemoveAgent.show && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 transition-all animate-fadeIn">
          <div className="bg-white rounded-[24px] md:rounded-[32px] p-6 md:p-8 max-w-sm w-full shadow-2xl transform text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-red-50 text-red-50 flex items-center justify-center mb-4 md:mb-5">
              <svg className="w-8 h-8 md:w-10 md:h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h3 className="text-lg md:text-xl font-black text-gray-900 mb-2">Berhentikan Agen?</h3>
            <p className="text-xs md:text-sm font-medium text-gray-500 mb-6 md:mb-8">Yakin mau memecat agen ini dari event? Mereka akan otomatis menerima notifikasi pemberhentian.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRemoveAgent({ show: false, agentId: null })} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 md:py-3.5 rounded-xl md:rounded-2xl hover:bg-gray-200 transition-colors uppercase tracking-widest text-[10px] md:text-xs">Batal</button>
              <button onClick={executeRemoveAgent} className="flex-1 bg-red-500 text-white font-bold py-3 md:py-3.5 rounded-xl md:rounded-2xl hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95 uppercase tracking-widest text-[10px] md:text-xs">Ya, Berhentikan</button>
            </div>
          </div>
        </div>
      )}

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
              <p className="text-xs text-gray-500 font-bold">{agentDetailModal.email}</p>
              {agentDetailModal.phone && (
                <p className="text-xs text-[#FF6B35] font-black mt-1">📞 {agentDetailModal.phone}</p>
              )}
              <div className="bg-yellow-50 text-yellow-600 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5 mt-3">
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

      {agentEditRole.show && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-black text-gray-900 mb-1">Kelola Agen</h3>
            <p className="text-xs font-bold text-gray-500 mb-6">Ubah pembagian tugas dan berikan penilaian performa kepada agen.</p>
            
            <div className="mb-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tugas di Lapangan</label>
              <input 
                type="text" 
                value={agentEditRole.role} 
                onChange={(e) => setAgentEditRole(prev => ({...prev, role: e.target.value}))} 
                placeholder="Misal: Penjaga Pintu A" 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-bold text-gray-700 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/20 transition-all"
              />
            </div>

            <div className="mb-8">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex justify-between items-center">
                <span>Berikan Bintang / Rating</span>
                {!isEventEnded && <span className="bg-red-50 text-red-500 px-2 py-0.5 rounded text-[8px] flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg> TERKUNCI</span>}
              </label>
              
              <div className={`flex gap-2 justify-center bg-gray-50 p-3 rounded-xl border border-gray-200 ${!isEventEnded ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    disabled={!isEventEnded}
                    onClick={() => setAgentEditRole(prev => ({ ...prev, rating_given: star }))}
                    className={`text-3xl transition-transform ${isEventEnded ? 'active:scale-75' : ''} ${agentEditRole.rating_given >= star ? 'text-yellow-400 drop-shadow-sm' : 'text-gray-300'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              {!isEventEnded ? (
                <p className="text-[10px] text-center font-bold text-red-400 mt-2 italic">*Rating baru bisa diberikan setelah event selesai ({event?.date_end}).</p>
              ) : (
                <p className="text-[10px] text-center font-bold text-gray-400 mt-2 italic">Rating Anda bakal tampil di profil Agen.</p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setAgentEditRole({show:false, agentId: null, role:'', rating_given: 0})} className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-200">Batal</button>
              <button onClick={submitEditRole} className="flex-1 py-3.5 bg-[#FF6B35] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-orange-600 shadow-lg shadow-orange-200">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER DASHBOARD */}
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {isRefreshing && (
          <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 animate-bounce">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-pulse"></span> Syncing Data...
          </div>
        )}

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

        {/* TAB NAVIGATION */}
        <div className="bg-white p-2 rounded-2xl md:rounded-full shadow-sm border border-gray-100 mb-8 overflow-x-auto hide-scrollbar flex items-center gap-2 relative z-10 w-full sm:w-max">
          <button onClick={() => setActiveTab('attendees')} className={`flex items-center gap-2 px-6 py-3 rounded-xl md:rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${activeTab === 'attendees' ? 'bg-[#FF6B35] text-white shadow-md shadow-orange-200 scale-100' : 'text-gray-500 hover:bg-gray-50 scale-95'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
            Data {isWed ? 'Tamu' : 'Peserta'}
          </button>
          <button onClick={() => setActiveTab('agents')} className={`flex items-center gap-2 px-6 py-3 rounded-xl md:rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${activeTab === 'agents' ? 'bg-purple-600 text-white shadow-md shadow-purple-200 scale-100' : 'text-gray-500 hover:bg-gray-50 scale-95'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Tim Agen
          </button>
          <button onClick={() => setActiveTab('recruitment')} className={`flex items-center gap-2 px-6 py-3 rounded-xl md:rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap transition-all duration-300 relative ${activeTab === 'recruitment' ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-100' : 'text-gray-500 hover:bg-gray-50 scale-95'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            Recruitment
            {pendingApplicantsCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[9px] shadow-sm animate-bounce">{pendingApplicantsCount}</span>}
          </button>
          <button onClick={() => setActiveTab('payouts')} className={`flex items-center gap-2 px-6 py-3 rounded-xl md:rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap transition-all duration-300 relative ${activeTab === 'payouts' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200 scale-100' : 'text-gray-500 hover:bg-gray-50 scale-95'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            Penggajian
            {payouts.filter(p => p.status === 'PENDING').length > 0 && <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[9px] shadow-sm animate-pulse border-2 border-white">{payouts.filter(p => p.status === 'PENDING').length}</span>}
          </button>
          <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-2 px-6 py-3 rounded-xl md:rounded-full font-black text-[10px] md:text-xs uppercase tracking-widest whitespace-nowrap transition-all duration-300 relative ${activeTab === 'reports' ? 'bg-rose-500 text-white shadow-md shadow-rose-200 scale-100' : 'text-gray-500 hover:bg-gray-50 scale-95'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            Kendala
            {pendingReportsCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[9px] shadow-sm border-2 border-white">{pendingReportsCount}</span>}
          </button>
        </div>

        {/* TAB 1: DATA PESERTA */}
        {activeTab === 'attendees' && (
          <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-200 overflow-hidden mb-10 animate-fadeIn">
            <div className="px-5 py-5 md:px-8 md:py-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 whitespace-nowrap">{isWed ? 'Buku Tamu & RSVP' : 'Peserta Event'}</h3>
              
              <div className="flex flex-col gap-3 w-full lg:w-auto">
                <div className="relative w-full">
                  <input type="text" placeholder={isWed ? "Cari nama tamu atau doa..." : "Cari peserta..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 md:pl-10 md:pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all" />
                  <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400 absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <div className="flex gap-2 w-full lg:w-auto">
                  <select value={selectedSessionFilter} onChange={(e) => setSelectedSessionFilter(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-2 md:px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]">
                    {uniqueSessions.map(session => <option key={session} value={session}>{session}</option>)}
                  </select>
                  <select value={selectedStatusFilter} onChange={(e) => setSelectedStatusFilter(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl px-2 md:px-4 py-2.5 text-xs font-bold focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]">
                    <option value="Semua">Semua Status</option>
                    <option value="Hadir">Sudah Hadir</option>
                    <option value="Belum Hadir">Belum Hadir</option>
                    <option value="Tidak Hadir">Tidak Hadir (Absen)</option>
                  </select>
                  <button onClick={handleExportCSV} className="bg-gray-100 text-gray-900 px-3 md:px-5 py-2.5 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors whitespace-nowrap shrink-0">
                    <span className="hidden md:inline">Download CSV</span><span className="md:hidden">CSV</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto bg-gray-50/20 md:bg-white p-4 md:p-0">
              <table className="hidden md:table w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="px-8 py-5">ID</th><th className="px-8 py-5">{isWed ? 'Nama Tamu (Buyer)' : 'Buyer Account'}</th><th className="px-8 py-5 max-w-[200px]">Session(s)</th><th className="px-8 py-5 text-center">{isWed ? 'Pax Total' : 'Qty Tiket'}</th><th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                {currentItems.length > 0 ? currentItems.map((order) => (
                  <tbody key={`desktop-${order.order_id}`} className="border-b border-gray-50 last:border-none">
                    <tr className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-8 py-5 text-xs font-bold text-gray-400">#{order.order_id}</td>
                      <td className="px-8 py-5 font-bold text-sm">{order.buyer_name} <br/><span className="text-xs font-normal text-gray-400">{order.buyer_email}</span></td>
                      <td className="px-8 py-5 max-w-[200px] truncate" title={order.session_name}><span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold uppercase truncate inline-block max-w-full">{order.session_name}</span></td>
                      <td className="px-8 py-5 text-center font-black">{isWed ? order.tickets.reduce((sum, t) => sum + (t.pax || 1), 0) : order.tickets.length}</td>
                      <td className="px-8 py-5 text-right"><button onClick={() => toggleExpand(order.order_id)} className="text-[10px] font-bold text-gray-500 hover:text-[#FF6B35] uppercase tracking-wider underline">{expandedRow === order.order_id ? 'Tutup Detail' : 'Lihat Detail Data'}</button></td>
                    </tr>
                    {expandedRow === order.order_id && (
                      <tr className="bg-gray-50/50">
                        <td colSpan="6" className="px-8 py-6 border-l-4 border-[#FF6B35]">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">{isWed ? 'Detail Undangan & Ucapan Doa' : 'Daftar Tiket Individual'}</p>
                          <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                  <th className="px-4 py-3 w-1/4">ID & Profil Peserta</th><th className="px-4 py-3">Status Kehadiran</th><th className="px-4 py-3">Di-scan Oleh (Agen)</th>{isWed && <th className="px-4 py-3 w-1/3">Detail RSVP & Doa</th>}<th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.tickets.map((t, idx) => (
                                  <tr key={t.ticket_id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                                    <td className="px-4 py-3"><p className="font-bold text-sm text-gray-900">{t.attendee_name || `Peserta ${idx + 1}`}</p><p className="text-[10px] text-gray-500">{t.attendee_email || '-'}</p><span className="bg-gray-100 text-gray-600 text-[8px] px-2 py-0.5 rounded uppercase font-bold tracking-wider inline-block mt-1">{t.session_name}</span></td>
                                    <td className="px-4 py-3">{t.is_attending === false ? (<span className="text-[9px] font-black bg-red-100 text-red-600 px-2 py-1 rounded-md uppercase">Tidak Hadir</span>) : t.is_scanned ? (<span className="text-[9px] font-black bg-green-100 text-green-600 px-2 py-1 rounded-md uppercase">Hadir</span>) : (<span className="text-[9px] font-black bg-gray-100 text-gray-500 px-2 py-1 rounded-md uppercase">Belum Hadir</span>)}</td>
                                    <td className="px-4 py-3">{t.is_scanned ? (<span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{t.scanned_by_name || 'Agen/EO'}</span>) : '-'}</td>
                                    {isWed && (<td className="px-4 py-3"><p className="text-xs text-gray-600"><span className="font-bold">Pax:</span> {t.pax || 1} Orang</p><p className="text-[10px] text-gray-500 italic line-clamp-2 mt-1">"{t.greeting || '-'}"</p></td>)}
                                    <td className="px-4 py-3 text-right">{!t.is_scanned && t.is_attending !== false && (<button onClick={() => initiateManualCheckIn(t.ticket_id)} className={`text-[10px] font-black text-white px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-sm transition-colors ${isWed ? 'bg-slate-900 hover:bg-black' : 'bg-[#FF6B35] hover:bg-orange-600'}`}>Check-In</button>)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                )) : <tbody><tr><td colSpan="6" className="px-8 py-10 text-center text-gray-400 font-bold text-sm"><div className="flex flex-col items-center justify-center"><svg className="w-12 h-12 mb-3 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>Tidak ada data yang cocok dengan filter.</div></td></tr></tbody>}
              </table>

              <div className="md:hidden flex flex-col gap-3">
                {currentItems.length > 0 ? currentItems.map((order) => (
                  <div key={`mobile-${order.order_id}`} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3 border-b border-gray-50 pb-3">
                      <div className="max-w-[60%]"><p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">#{order.order_id}</p><p className="text-sm font-bold text-gray-900 leading-tight">{order.buyer_name}</p><p className="text-[10px] text-gray-500 truncate w-40">{order.buyer_email}</p></div>
                      <div className="text-right max-w-[40%]"><span className="px-2 py-0.5 bg-gray-100 rounded-md text-[8px] font-bold uppercase mb-1.5 inline-block truncate max-w-full">{order.session_name}</span><div className="text-[10px] font-bold">{isWed ? 'Pax' : 'Qty Tiket'}: <span className="font-black text-[#FF6B35]">{isWed ? order.tickets.reduce((sum, t) => sum + (t.pax || 1), 0) : order.tickets.length}</span></div></div>
                    </div>
                    <div className="flex justify-between items-center mt-3"><button onClick={() => toggleExpand(order.order_id)} className="text-[10px] font-black text-[#FF6B35] uppercase tracking-wider flex items-center gap-1 bg-orange-50 px-3 py-1.5 rounded-lg w-full justify-center active:scale-95 transition-all">{expandedRow === order.order_id ? 'Tutup Detail' : 'Lihat Detail Peserta'}</button></div>
                    {expandedRow === order.order_id && (
                      <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-100 flex flex-col gap-3">
                        {order.tickets.map((t, idx) => (
                          <div key={t.ticket_id} className={`p-4 rounded-xl border shadow-sm ${t.is_attending === false ? 'bg-red-50/20 border-red-100' : t.is_scanned ? 'bg-green-50/30 border-green-100' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-between items-start mb-2"><div><p className={`text-[9px] font-black uppercase mb-1 ${isWed ? 'text-[#D4AF37]' : 'text-gray-500'}`}>{isWed ? 'Data Tamu' : `TIKET #${t.ticket_id.toString().slice(-5)}`}</p></div>{t.is_attending === false ? (<span className="text-[8px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded-md uppercase">Tidak Hadir</span>) : t.is_scanned ? (<span className="text-[8px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-md uppercase">Hadir</span>) : (<span className="text-[8px] font-black bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md uppercase">Belum Hadir</span>)}</div>
                            <p className="font-black text-gray-900 text-base truncate">{t.attendee_name || `Peserta ${idx + 1}`}</p><p className={`text-[10px] text-gray-500 truncate ${isWed ? 'mb-1' : 'mb-2'}`}>{t.attendee_email || '-'}</p>
                            {t.is_scanned && <p className="text-[9px] text-gray-600 mt-1 mb-2 font-bold">Di-scan oleh: <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">{t.scanned_by_name || 'Agen/EO'}</span></p>}
                            {!t.is_scanned && t.is_attending !== false && (<button onClick={() => initiateManualCheckIn(t.ticket_id)} className={`w-full mt-3 text-[10px] font-black text-white py-2.5 rounded-lg uppercase tracking-widest shadow-sm active:scale-95 transition-all ${isWed ? 'bg-slate-900' : 'bg-[#FF6B35]'}`}>Check-In Manual</button>)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )) : <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm"><p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data tidak ditemukan</p></div>}
              </div>
            </div>
            
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                <span className="text-[10px] md:text-xs font-bold text-gray-500">Menampilkan <span className="text-gray-900">{indexOfFirstItem + 1}</span> - <span className="text-gray-900">{Math.min(indexOfLastItem, filteredOrders.length)}</span> dari <span className="text-gray-900">{filteredOrders.length}</span> data</span>
                <div className="flex gap-1 md:gap-2"><button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>Prev</button><button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 border hover:bg-gray-50'}`}>Next</button></div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TIM AGEN */}
        {activeTab === 'agents' && (
          <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-200 overflow-hidden mb-10 animate-fadeIn">
            <div className="px-5 py-6 md:px-8 md:py-8 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2">Rekrut Agen Manual</h3>
              <p className="text-xs md:text-sm font-bold text-gray-500 mb-6">Masukkan email agen secara manual. Atau buka lowongan di tab Recruitment.</p>
              <form onSubmit={handleAddAgent} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg></div>
                  <input value={agentEmailInput} onChange={e => setAgentEmailInput(e.target.value)} type="email" placeholder="Misal: budi@gmail.com" required className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl md:rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm" />
                </div>
                <button type="submit" className="bg-purple-600 text-white px-8 py-3.5 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 flex items-center justify-center gap-2 whitespace-nowrap"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg> Tambah Agen</button>
              </form>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr><th className="px-8 py-5">Profil Agen</th><th className="px-8 py-5">Tugas / Role</th><th className="px-8 py-5 text-center">Avg Rating</th><th className="px-8 py-5 text-right">Manajemen</th></tr>
                </thead>
                <tbody>
                  {agents.length > 0 ? agents.map((a) => (
                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50/30 transition-colors">
                      <td className="px-8 py-4"><div className="flex items-center gap-4"><img src={a.picture} alt={a.name} className="w-12 h-12 rounded-full border-2 border-gray-100 object-cover" /><div><p className="font-black text-gray-900 text-sm">{a.name}</p><p className="text-[10px] font-bold text-gray-400">{a.email}</p></div></div></td>
                      <td className="px-8 py-4"><div className="flex flex-col items-start gap-1.5"><span className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-purple-100">{a.role || 'Panitia'}</span>{a.is_accepted ? (<span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Aktif</span>) : (<span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1 animate-pulse"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Menunggu Konfirmasi</span>)}</div></td>
                      <td className="px-8 py-4 text-center"><div className="inline-flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-full text-yellow-600 font-black text-[10px] tracking-widest border border-yellow-100"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>{a.rating_given ? `${a.rating_given}.0` : 'N/A'}</div></td>
                      <td className="px-8 py-4 text-right"><div className="flex items-center justify-end gap-2"><button onClick={() => setAgentDetailModal(a)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="Lihat CV/Profil"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg></button><button onClick={() => setAgentEditRole({ show: true, agentId: a.id, role: a.role || '', rating_given: a.rating_given || 0 })} className="p-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors" title="Kelola Agen"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button><button onClick={() => setConfirmRemoveAgent({ show: true, agentId: a.id })} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors" title="Berhentikan Agen"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div></td>
                    </tr>
                  )) : <tr><td colSpan="4" className="px-8 py-16 text-center"><h4 className="text-base font-black text-gray-900 mb-1">Belum Ada Agen</h4></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RECRUITMENT */}
        {activeTab === 'recruitment' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 animate-fadeIn">
            <div className="lg:col-span-3 space-y-6">
              
              <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between bg-gray-50/50 gap-4">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Lowongan Aktif</h3>
                    <p className="text-xs text-gray-500 font-bold mt-1">Daftar loker yang lagi lu buka buat nyari agen.</p>
                  </div>
                  <button 
                    onClick={() => setShowRecruitmentModal(true)} 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                    Buka Lowongan Baru
                  </button>
                </div>
                <div className="p-5">
                  {jobs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {jobs.map(job => (
                        <div key={job.id} className="border border-gray-100 rounded-xl p-4 shadow-sm relative bg-white flex justify-between items-start">
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${job.is_active ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                <h4 className="font-black text-gray-900 text-sm">{job.role}</h4>
                            </div>
                            <p className="text-[10px] text-gray-500 font-bold mb-3">Rp {new Intl.NumberFormat('id-ID').format(job.fee)} • Kuota: {job.quota} org</p>
                            <p className="text-xs text-gray-600 line-clamp-2">{job.description}</p>
                          </div>
                          <button 
                            onClick={() => initiateDeleteJob(job.id)}
                            className="p-2 text-red-500 bg-red-50 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                            title="Hapus Lowongan"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-xs font-bold">Lo belum buka lowongan apapun.</div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-[24px] shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Inbox Pelamar</h3>
                  <span className="bg-blue-100 text-blue-600 px-2.5 py-1 rounded-md text-[10px] font-black">{applicants.filter(a => a.status === 'PENDING').length} Menunggu</span>
                </div>
                <div className="p-0">
                  {applicants.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {applicants.map(app => (
                        <div key={app.id} className="p-5 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img src={app.user_pic || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="" className="w-10 h-10 rounded-full border border-gray-200" />
                            <div>
                              <p className="font-bold text-sm text-gray-900">{app.user_name}</p>
                              <p className="text-[10px] text-gray-500">Apply untuk: <span className="font-bold text-blue-600">{app.role_applied}</span></p>
                            </div>
                          </div>
                          {app.status === 'PENDING' ? (
                            <div className="flex gap-2 w-full md:w-auto">
                              <button onClick={() => setConfirmRespondApp({ show: true, appId: app.id, action: 'REJECTED' })} className="flex-1 md:flex-none px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors">Tolak</button>
                              <button onClick={() => setConfirmRespondApp({ show: true, appId: app.id, action: 'ACCEPTED' })} className="flex-1 md:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">Terima</button>
                            </div>
                          ) : (
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${app.status === 'ACCEPTED' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-500'}`}>
                              {app.status === 'ACCEPTED' ? 'Diterima' : 'Ditolak'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400 text-xs font-bold">Belum ada user yang ngelamar.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 4: PENGGAJIAN (PAYOUT) */}
        {activeTab === 'payouts' && (
          <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-200 overflow-hidden mb-10 animate-fadeIn">
            <div className="px-5 py-6 md:px-8 md:py-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-gray-50 to-white">
              <div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-1">Rekap Gaji Agen</h3>
                <p className="text-xs md:text-sm font-medium text-gray-500">Bayar honor agen yang udah bantuin event lo dengan gampang.</p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-xl">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Total Agen Lunas</p>
                <p className="text-lg font-black text-emerald-700">{payouts.filter(p => p.status === 'PAID').length} / {payouts.length}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-5">Profil Agen</th>
                    <th className="px-6 py-5">Info Rekening Bank</th>
                    <th className="px-6 py-5 text-right">Status Pembayaran</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.length > 0 ? payouts.map((agent) => (
                    <tr key={`payout-${agent.agent_id}`} className={`border-b border-gray-50 transition-colors ${agent.status === 'PAID' ? 'bg-emerald-50/10' : 'hover:bg-gray-50/30'}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={agent.agent_pic || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="" className="w-10 h-10 rounded-full border border-gray-200 object-cover" />
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{agent.agent_name}</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{agent.role || 'Agen'}</p>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {agent.bank_name && agent.bank_account ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 inline-block">
                            <p className="text-xs font-black text-gray-900 mb-0.5">{agent.bank_name}</p>
                            <p className="text-sm font-mono tracking-wider text-gray-700 select-all">{agent.bank_account}</p>
                            <p className="text-[10px] text-gray-500 uppercase mt-1">a.n {agent.bank_account_name}</p>
                          </div>
                        ) : (
                          <span className="text-xs italic font-medium text-red-400 bg-red-50 px-2 py-1 rounded">Belum isi data bank</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {agent.status === 'PAID' ? (
                          <div className="flex flex-col items-end gap-1">
                            <p className="text-base font-black text-emerald-600 mb-1">Rp {Number(agent.amount_paid).toLocaleString('id-ID')}</p>
                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg> Lunas
                            </span>
                            <span className="text-[9px] text-gray-400 font-bold uppercase mt-1">{new Date(agent.paid_at).toLocaleString('id-ID', {day: 'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setSelectedAgentPayout(agent);
                              setPayoutAmountInput('');
                              setShowPayoutModal(true);
                            }}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                          >
                            Bayar / Tandai Lunas
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : <tr><td colSpan="3" className="px-8 py-16 text-center"><h4 className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-widest">Belum Ada Agen</h4></td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: LAPORAN KENDALA */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-gray-200 overflow-hidden mb-10 animate-fadeIn">
            <div className="px-5 py-6 md:px-8 md:py-8 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-900">Kendala Lapangan</h3>
              <p className="text-xs font-bold text-gray-500">Laporan langsung dari agen saat event berlangsung.</p>
            </div>
            
            <div className="p-5 md:p-8">
              {reports.length > 0 ? (
                <div className="grid gap-4">
                  {reports.map(r => (
                    <div key={r.id} className={`p-5 rounded-2xl border ${r.status === 'PENDING' ? 'bg-rose-50/30 border-rose-100' : 'bg-gray-50 border-gray-100'} flex flex-col md:flex-row gap-4 items-start md:items-center justify-between`}>
                      <div className="flex items-start gap-4">
                        <img src={r.agent_pic || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Agent" className="w-10 h-10 rounded-full border border-gray-200 object-cover shrink-0" />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm text-gray-900">{r.agent_name}</h4>
                            {r.status === 'PENDING' ? (
                              <span className="bg-rose-100 text-rose-600 text-[9px] px-2 py-0.5 rounded font-black tracking-widest uppercase">Perlu Tindakan</span>
                            ) : (
                              <span className="bg-green-100 text-green-600 text-[9px] px-2 py-0.5 rounded font-black tracking-widest uppercase">Terselesaikan</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed font-medium">"{r.message}"</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-widest">{new Date(r.created_at).toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      {r.status === 'PENDING' && (
                        <button onClick={() => handleResolveReport(r.id)} className="w-full md:w-auto px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm active:scale-95 shrink-0">
                          Tandai Selesai
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  </div>
                  <p className="text-gray-400 font-bold text-sm">Aman bro! Belum ada laporan kendala dari agen.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
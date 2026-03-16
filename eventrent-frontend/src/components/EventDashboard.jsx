import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function EventDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [event, setEvent] = useState(null);
  const [groupedAttendees, setGroupedAttendees] = useState([]); // Array yang sudah dirapikan
  const [loading, setLoading] = useState(true); 
  const [expandedRow, setExpandedRow] = useState(null); 
  const [isRefreshing, setIsRefreshing] = useState(false); 
  
  const [searchQuery, setSearchQuery] = useState('');
  const [popup, setPopup] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, ticketId: null });

  const fetchData = async (isBackground = false) => {
    try {
      if (isBackground) setIsRefreshing(true);
      else setLoading(true);
      
      const resEvent = await fetch(`http://localhost:3000/api/events/${id}`);
      const eventData = await resEvent.json();

      const resAttendees = await fetch(`http://localhost:3000/api/events/${id}/attendees?userId=${user?.id}`);
      const dataAttendees = await resAttendees.json();

      // --- MENGELOMPOKKAN TIKET (SOLUSI DOBEL) ---
      const groupedMap = new Map();
      dataAttendees.forEach(t => {
        // Kelompokkan berdasarkan Waktu Beli + Email Pembeli
        const key = `${t.purchase_date}_${t.buyer_email || 'guest'}`;
        if (!groupedMap.has(key)) {
          groupedMap.set(key, {
            order_id: t.ticket_id, // Perwakilan 1 ID untuk Order ini
            buyer_name: t.buyer_name || 'Guest Checkout',
            buyer_email: t.buyer_email,
            session_name: t.session_name,
            total_qty: 0,
            scanned_qty: 0,
            tickets: [] // Isi tiket anak-anaknya
          });
        }
        const group = groupedMap.get(key);
        group.total_qty += 1;
        if (t.is_scanned) group.scanned_qty += 1;
        group.tickets.push(t);
      });

      const finalAttendees = Array.from(groupedMap.values());

      setEvent(prev => JSON.stringify(prev) === JSON.stringify(eventData) ? prev : eventData);
      setGroupedAttendees(prev => JSON.stringify(prev) === JSON.stringify(finalAttendees) ? prev : finalAttendees);
      
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    fetchData();
    const intervalId = setInterval(() => { fetchData(true); }, 5000);
    return () => clearInterval(intervalId); 
  }, [id, user, navigate]);

  const toggleExpand = (orderId) => {
    setExpandedRow(expandedRow === orderId ? null : orderId);
  };

  const initiateManualCheckIn = (ticketId) => {
    setConfirmDialog({ show: true, ticketId: ticketId }); 
  };

  const confirmManualCheckIn = async () => {
    const ticketId = confirmDialog.ticketId;
    setConfirmDialog({ show: false, ticketId: null }); 

    try {
      const res = await fetch('http://localhost:3000/api/tickets/scan', {
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
    } catch (err) {
      console.error(err);
      setPopup({ show: true, message: "Terjadi kesalahan jaringan.", type: 'error' });
    }
  };

  // Export CSV juga disesuaikan karena struktur bersarang
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Order ID,Ticket ID,Status Kehadiran,Session,Pembeli,Email Pembeli,Nama Peserta,Email Peserta,Jawaban Custom\n";
    
    groupedAttendees.forEach(order => {
      order.tickets.forEach(t => {
        const statusKehadiran = t.is_scanned ? "Telah Hadir" : "Belum Hadir";
        const p = t.attendee_data?.[0] || {}; // Karena 1 tiket cuma 1 orang

        let customAnsText = "";
        if (p.customAnswers && p.customAnswers.length > 0) {
          customAnsText = p.customAnswers.map(ans => `${ans.question}: ${ans.answer}`).join(" | ");
        }
        
        let row = `"${order.order_id}","${t.ticket_id}","${statusKehadiran}","${t.session_name}","${order.buyer_name}","${order.buyer_email}","${p.name || ''}","${p.email || ''}","${customAnsText}"`;
        csvContent += row + "\n";
      });
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Peserta_${event?.title || 'Event'}.csv`);
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/event/${id}`);
    setPopup({ show: true, message: "Link Dashboard berhasil disalin!", type: 'success' }); 
  };

  // Filter Search berdasarkan nama anak tiket
  const filteredOrders = groupedAttendees.filter(order => {
    if (!searchQuery) return true;
    return order.tickets.some(t => 
      t.attendee_data?.[0]?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  if (loading && !event) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-400 font-bold">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-widest text-xs">Memuat Data Dashboard...</p>
    </div>
  );

  // Kalkulasi total
  let totalSold = 0;
  let totalCheckedIn = 0;
  let totalRevenue = 0;
  groupedAttendees.forEach(o => {
    totalSold += o.total_qty;
    totalCheckedIn += o.scanned_qty;
    o.tickets.forEach(t => totalRevenue += Number(t.total_price));
  });

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans pb-20 pt-8 text-left relative">
      
      {/* POPUP & MODAL (Sama seperti sebelumnya) */}
      {popup.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 transition-all">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl transform text-center">
            <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-5 ${popup.type === 'success' ? 'bg-[#E7F9F1] text-[#27AE60]' : 'bg-red-50 text-red-500'}`}>
              {popup.type === 'success' ? (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
              ) : (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
              )}
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">{popup.type === 'success' ? 'Berhasil!' : 'Oops!'}</h3>
            <p className="text-sm font-bold text-gray-500 mb-8">{popup.message}</p>
            <button onClick={() => setPopup({ show: false, message: '', type: 'success' })} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-2xl hover:bg-black transition-colors uppercase tracking-widest text-xs">Tutup</button>
          </div>
        </div>
      )}

      {confirmDialog.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4 transition-all">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl transform text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-orange-50 text-[#FF6B35] flex items-center justify-center mb-5">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Konfirmasi Kehadiran</h3>
            <p className="text-sm font-bold text-gray-500 mb-8">Apakah Anda yakin tiket ini sudah hadir dan ingin melakukan Check-In manual?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDialog({ show: false, ticketId: null })} className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 rounded-2xl hover:bg-gray-200 transition-colors uppercase tracking-widest text-xs">Batal</button>
              <button onClick={confirmManualCheckIn} className="flex-1 bg-[#FF6B35] text-white font-bold py-3.5 rounded-2xl hover:bg-orange-600 transition-colors uppercase tracking-widest text-xs">Ya, Check-In</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {isRefreshing && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 animate-bounce">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Syncing Data...
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <button onClick={() => navigate('/manage')} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#FF6B35] hover:border-[#FF6B35] transition-colors">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
               </button>
               <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Dashboard</h1>
            </div>
            <h2 className="text-base text-gray-500 font-bold ml-11">{event.title}</h2>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleCopy}>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Share Link</span>
              <button className="text-sm font-bold text-[#FF6B35] transition bg-orange-50 px-3 py-1 rounded-lg">Copy</button>
            </div>
            <button onClick={() => navigate(`/scanner/${event.id}`)} className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-xl hover:bg-black transition-colors flex items-center gap-2">
              <span className="font-bold text-sm uppercase tracking-widest">Buka Scanner</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tickets Sold</p>
            <h3 className="text-4xl font-black text-gray-900 mb-1">{totalSold}</h3>
            <p className="text-xs font-bold text-[#27AE60] mt-3 bg-[#E7F9F1] inline-block px-3 py-1 rounded-md">Rp {totalRevenue.toLocaleString('id-ID')} Revenue</p>
          </div>
          
          <div className="bg-white p-8 rounded-[32px] border border-gray-200 shadow-[0_10px_30px_rgba(39,174,96,0.1)] relative overflow-hidden ring-2 ring-[#27AE60]/20">
            <p className="text-[10px] font-black text-[#27AE60] uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#27AE60] rounded-full animate-ping"></span> Live Presence
            </p>
            <h3 className="text-4xl font-black text-gray-900 mb-1">{totalCheckedIn} <span className="text-xl text-gray-300">/ {totalSold}</span></h3>
            <p className="text-xs font-bold text-gray-500 mt-3">Peserta Check-In</p>
          </div>

          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Event Status</p>
            <h3 className="text-2xl font-black mt-2 text-gray-900 uppercase">Live Event</h3>
          </div>
        </div>

        {/* TABEL DATA PENGUNJUNG */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-gray-900">Peserta Event</h3>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="relative w-full sm:w-64">
                <input 
                  type="text" 
                  placeholder="Cari nama di tiket..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:border-[#FF6B35] transition-all"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <button onClick={handleExportCSV} className="w-full sm:w-auto bg-gray-100 text-gray-900 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors whitespace-nowrap">
                Download CSV
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Order ID</th>
                  <th className="px-8 py-5">Buyer Account</th>
                  <th className="px-8 py-5">Session</th>
                  <th className="px-8 py-5 text-center">Qty</th>
                  <th className="px-8 py-5">Status</th> 
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tbody key={order.order_id} className="border-b border-gray-50 last:border-none">
                    {/* BARIS UTAMA (ORDER GROUP) */}
                    <tr className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-8 py-5 text-xs font-bold text-gray-400">#{order.order_id}</td>
                      <td className="px-8 py-5 font-bold text-sm">{order.buyer_name} <br/><span className="text-xs font-normal text-gray-400">{order.buyer_email}</span></td>
                      <td className="px-8 py-5"><span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold uppercase">{order.session_name}</span></td>
                      <td className="px-8 py-5 text-center font-black">{order.total_qty}</td>
                      <td className="px-8 py-5">
                        {order.scanned_qty === order.total_qty ? (
                          <span className="px-3 py-1 bg-[#E7F9F1] text-[#27AE60] rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">All Checked-In</span>
                        ) : order.scanned_qty > 0 ? (
                          <span className="px-3 py-1 bg-orange-50 text-[#FF6B35] rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-100">Partial ({order.scanned_qty}/{order.total_qty})</span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-[10px] font-bold uppercase tracking-widest">Pending</span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => toggleExpand(order.order_id)} className="text-[10px] font-bold text-gray-500 hover:text-[#FF6B35] uppercase tracking-wider underline">
                          {expandedRow === order.order_id ? 'Tutup Detail' : 'Lihat Detail'}
                        </button>
                      </td>
                    </tr>
                    
                    {/* BARIS EXPAND (BERISI ANAK-ANAK TIKET) */}
                    {expandedRow === order.order_id && (
                      <tr className="bg-orange-50/30">
                        <td colSpan="6" className="px-8 py-6 border-l-4 border-[#FF6B35]">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Daftar Tiket Individual</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            
                            {order.tickets.map((t, idx) => {
                              const p = t.attendee_data?.[0] || {}; // Data peserta untuk tiket ini
                              const isMatch = searchQuery && p.name?.toLowerCase().includes(searchQuery.toLowerCase());

                              return (
                                <div key={t.ticket_id} className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
                                  {isMatch && (
                                    <div className="absolute top-0 right-0 bg-[#FF6B35] text-white text-[8px] font-black uppercase px-2 py-1 rounded-bl-lg">MATCH</div>
                                  )}
                                  
                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <p className="text-[10px] font-black text-[#FF6B35] uppercase">Tiket #{t.ticket_id}</p>
                                      {t.is_scanned && <span className="text-[8px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase">Hadir</span>}
                                    </div>
                                    <p className="font-bold text-gray-900 truncate">{p.name || `Peserta ${idx + 1}`}</p>
                                    <p className="text-xs text-gray-500 mb-3 truncate">{p.email || '-'}</p>
                                    
                                    {p.customAnswers && p.customAnswers.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-orange-100/50 flex flex-wrap gap-2 mb-3">
                                        {p.customAnswers.map((ans, aIdx) => (
                                          <div key={aIdx} title={ans.question} className="cursor-help bg-orange-50/50 border border-orange-100 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-orange-100 transition-colors">
                                            <span className="text-[10px] font-bold text-gray-700 truncate max-w-[100px]">{ans.answer}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {!t.is_scanned && (
                                    <button 
                                      onClick={() => initiateManualCheckIn(t.ticket_id)} 
                                      className="w-full mt-2 text-[10px] font-black text-white bg-[#FF6B35] py-2 rounded-lg uppercase tracking-widest shadow-sm hover:bg-orange-600 transition-colors"
                                    >
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
                        Tidak ada data peserta yang cocok dengan "{searchQuery}"
                      </div>
                    </td>
                  </tr>
                </tbody>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
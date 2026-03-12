import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function EventDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true); // Cuma buat tarikan pertama
  const [expandedRow, setExpandedRow] = useState(null); 
  const [isRefreshing, setIsRefreshing] = useState(false); // Buat indikator silent refresh

  // --- FUNGSI FETCH DATA (VERSI ANTI KEDIP) ---
  const fetchData = async (isBackground = false) => {
    try {
      // Kalau background refresh, jangan nyalain loading utama
      if (isBackground) setIsRefreshing(true);
      else setLoading(true);
      
      const resEvent = await fetch(`http://localhost:3000/api/events/${id}`);
      const eventData = await resEvent.json();

      const resAttendees = await fetch(`http://localhost:3000/api/events/${id}/attendees?userId=${user?.id}`);
      const dataAttendees = await resAttendees.json();

      // Bandingkan data lama vs baru. Kalau sama, jangan update state biar gak re-render
      setEvent(prev => JSON.stringify(prev) === JSON.stringify(eventData) ? prev : eventData);
      setAttendees(prev => JSON.stringify(prev) === JSON.stringify(dataAttendees) ? prev : (dataAttendees || []));
      
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

    // Silent refresh tiap 5 detik (lebih cepet tapi tanpa kedip)
    const intervalId = setInterval(() => {
      fetchData(true); 
    }, 5000);

    return () => clearInterval(intervalId); 
  }, [id, user, navigate]);

  const toggleExpand = (ticketId) => {
    setExpandedRow(expandedRow === ticketId ? null : ticketId);
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Order ID,Status Kehadiran,Session,Pembeli,Email Pembeli,Nama Peserta,Email Peserta,Jawaban Custom\n";
    attendees.forEach(a => {
      const statusKehadiran = a.is_scanned ? "Telah Hadir" : "Belum Hadir";
      if(a.attendee_data) {
        a.attendee_data.forEach(p => {
          let row = `"${a.ticket_id}","${statusKehadiran}","${a.session_name}","${a.buyer_name}","${a.buyer_email}","${p.name}","${p.email}"`;
          csvContent += row + "\n";
        });
      }
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Peserta.csv`);
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}/event/${id}`);
    alert("Link copied!");
  };

  // --- TAMPILAN LOADING AWAL (CUMA SEKALI) ---
  if (loading && !event) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-400 font-bold">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-widest text-xs">Memuat Data Dashboard...</p>
    </div>
  );

  const totalSold = attendees.reduce((acc, curr) => acc + parseInt(curr.quantity), 0);
  const totalRevenue = attendees.reduce((acc, curr) => acc + Number(curr.total_price), 0);
  const totalCheckedIn = attendees.filter(a => a.is_scanned).reduce((acc, curr) => acc + parseInt(curr.quantity), 0);

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans pb-20 pt-8 text-left">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* INDIKATOR SILENT REFRESH (Notif kecil di pojok biar user tau data update) */}
        {isRefreshing && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 animate-bounce">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Syncing Data...
          </div>
        )}

        {/* HEADER DASHBOARD */}
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
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Share</span>
              <button onClick={handleCopy} className="text-sm font-bold text-[#FF6B35] transition bg-orange-50 px-3 py-1 rounded-lg">Copy</button>
            </div>
            <button onClick={() => navigate(`/scanner/${event.id}`)} className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-xl hover:bg-black transition-colors flex items-center gap-2">
              <span className="font-bold text-sm uppercase tracking-widest">Buka Scanner</span>
            </button>
          </div>
        </div>

        {/* STATISTIK BOX */}
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

        {/* TABEL DATA */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Recent Transactions</h3>
            <button onClick={handleExportCSV} className="bg-gray-100 text-gray-900 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">Download CSV</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Order ID</th>
                  <th className="px-8 py-5">Buyer</th>
                  <th className="px-8 py-5">Session</th>
                  <th className="px-8 py-5 text-center">Qty</th>
                  <th className="px-8 py-5">Status</th> 
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              {attendees.map((a) => (
                <tbody key={a.ticket_id} className="border-b border-gray-50 last:border-none">
                  <tr className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-8 py-5 text-xs font-bold text-gray-400">#{a.ticket_id}</td>
                    <td className="px-8 py-5 font-bold text-sm">{a.buyer_name}</td>
                    <td className="px-8 py-5"><span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold uppercase">{a.session_name}</span></td>
                    <td className="px-8 py-5 text-center font-black">{a.quantity}</td>
                    <td className="px-8 py-5">
                      {a.is_scanned ? (
                        <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">Checked-In</span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-50 text-gray-400 rounded-full text-[10px] font-bold uppercase tracking-widest">Pending</span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button onClick={() => toggleExpand(a.ticket_id)} className="text-[10px] font-bold text-[#FF6B35] uppercase tracking-wider underline">
                        {expandedRow === a.ticket_id ? 'Close' : 'Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedRow === a.ticket_id && (
                    <tr className="bg-orange-50/30">
                      <td colSpan="6" className="px-8 py-6 border-l-4 border-[#FF6B35]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {a.attendee_data?.map((p, i) => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-orange-100 shadow-sm">
                              <p className="text-[10px] font-black text-[#FF6B35] uppercase mb-1">Attendee {i+1}</p>
                              <p className="font-bold text-gray-900">{p.name}</p>
                              <p className="text-xs text-gray-500">{p.email}</p>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              ))}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
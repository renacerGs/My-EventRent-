import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function EventDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null); 

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const resEvent = await fetch(`http://localhost:3000/api/events/${id}`);
      if (!resEvent.ok) throw new Error("Event not found");
      const eventData = await resEvent.json();

      const resAttendees = await fetch(`http://localhost:3000/api/events/${id}/attendees?userId=${user.id}`);
      const dataAttendees = await resAttendees.json();

      setEvent(eventData);
      setAttendees(dataAttendees || []);
    } catch (err) { 
      console.error(err); 
      alert("Gagal memuat dashboard event");
      navigate('/manage');
    } finally { 
      setLoading(false); 
    }
  };

  const toggleExpand = (ticketId) => {
    setExpandedRow(expandedRow === ticketId ? null : ticketId);
  };

  // --- FUNGSI DOWNLOAD DATA KE EXCEL/CSV ---
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // Header Kolom
    csvContent += "Order ID,Session,Pembeli,Email Pembeli,Nama Peserta,Email Peserta,Jawaban Custom\n";
    
    attendees.forEach(a => {
      if(a.attendee_data && a.attendee_data.length > 0) {
        a.attendee_data.forEach(p => {
          // Gabungin jawaban custom jadi 1 teks panjang (contoh: Ukuran: XL | Alamat: Jkt)
          let customAnswersStr = p.customAnswers 
            ? p.customAnswers.map(c => `${c.question}: ${c.answer}`).join(" | ") 
            : "";
            
          let row = `"${a.ticket_id}","${a.session_name}","${a.buyer_name}","${a.buyer_email}","${p.name}","${p.email}","${customAnswersStr}"`;
          csvContent += row + "\n";
        });
      }
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Peserta_${event.title.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !event) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold tracking-widest uppercase">Loading Dashboard...</div>;

  const totalSold = attendees.reduce((acc, curr) => acc + parseInt(curr.quantity), 0);
  const totalRevenue = attendees.reduce((acc, curr) => acc + Number(curr.total_price), 0);
  const currentTotalStock = event.sessions?.reduce((acc, s) => acc + s.stock, 0) || 0;
  const maxCapacity = currentTotalStock + totalSold; 

  const eventLink = `${window.location.origin}/event/${id}`;
  const handleCopy = () => {
    navigator.clipboard.writeText(eventLink);
    alert("Link copied!");
  };

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans pb-20 pt-8 text-left">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
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
          <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Share Link</span>
            <button onClick={handleCopy} className="text-sm font-bold text-[#FF6B35] hover:text-orange-700 flex items-center gap-2 transition bg-orange-50 px-3 py-1 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              Copy
            </button>
          </div>
        </div>

        {/* STATISTIK BOX */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[64px] -z-10"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Tickets Sold</p>
            <h3 className="text-4xl font-black text-gray-900 mb-1">{totalSold} <span className="text-xl text-gray-300 font-bold">/ {maxCapacity}</span></h3>
            <p className="text-xs font-bold text-[#27AE60] mt-3 bg-[#E7F9F1] inline-block px-3 py-1 rounded-md">
              Rp {totalRevenue.toLocaleString('id-ID')} Revenue
            </p>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[64px] -z-10"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Total Sessions</p>
            <h3 className="text-4xl font-black text-gray-900 mb-1">{event.sessions?.length || 0}</h3>
            <p className="text-xs font-bold text-gray-500 mt-3">Active Ticket Types</p>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-[64px] -z-10"></div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Event Status</p>
            <h3 className={`text-2xl font-black mt-2 ${currentTotalStock > 0 ? 'text-gray-900' : 'text-red-500'}`}>
              {currentTotalStock > 0 ? 'ON SALE' : 'SOLD OUT'}
            </h3>
          </div>
        </div>

        {/* TABEL DATA PEMBELI */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
              <p className="text-xs text-gray-500 mt-1">Kelola dan lihat data pemesan tiket</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-[#FF6B35] bg-orange-50 px-4 py-2 rounded-full tracking-widest uppercase">
                {attendees.length} Transactions
              </span>
              
              {/* TOMBOL EXPORT DATA */}
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Data
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Order ID</th>
                  <th className="px-8 py-5">Buyer Info</th>
                  <th className="px-8 py-5">Session / Ticket</th>
                  <th className="px-8 py-5 text-center">Qty</th>
                  <th className="px-8 py-5">Paid</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendees.length > 0 ? attendees.map((a) => {
                  const isExpanded = expandedRow === a.ticket_id;

                  return (
                    <React.Fragment key={a.ticket_id}>
                      {/* Baris Utama Transaksi */}
                      <tr className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-8 py-5 text-xs font-bold text-gray-400">#{a.ticket_id}</td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <img src={a.buyer_pic} alt="buyer" className="w-8 h-8 rounded-full bg-gray-200" />
                            <div>
                              <p className="font-bold text-gray-900 text-sm leading-tight">{a.buyer_name}</p>
                              <p className="text-[10px] font-semibold text-gray-400 truncate w-32">{a.buyer_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase">
                            {a.session_name}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center font-black text-gray-900">{a.quantity}</td>
                        <td className="px-8 py-5 text-sm font-black text-[#27AE60]">Rp {parseInt(a.total_price).toLocaleString('id-ID')}</td>
                        <td className="px-8 py-5 text-right">
                          <button 
                            onClick={() => toggleExpand(a.ticket_id)}
                            className="text-[10px] font-bold text-[#FF6B35] border border-[#FF6B35] hover:bg-[#FF6B35] hover:text-white px-4 py-2 rounded-lg transition-colors uppercase tracking-wider"
                          >
                            {isExpanded ? 'Tutup Data' : 'Lihat Data'}
                          </button>
                        </td>
                      </tr>

                      {/* Baris Expand (Detail Form Jawaban Custom) */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan="6" className="p-0 border-none">
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="bg-[#FFF5F0] border-l-[6px] border-[#FF6B35]"
                              >
                                <div className="px-8 py-6">
                                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Informasi Pemegang Tiket</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                                    
                                    {a.attendee_data && a.attendee_data.map((participant, pIndex) => (
                                      <div key={pIndex} className="bg-white border border-orange-100 p-5 rounded-[20px] shadow-sm hover:shadow-md transition-shadow">
                                        <div className="border-b border-gray-100 pb-3 mb-3">
                                          <p className="text-[10px] font-black text-[#FF6B35] mb-1 uppercase tracking-widest">Tiket {pIndex + 1}</p>
                                          <p className="text-sm font-black text-gray-900 truncate uppercase">{participant.name || `Peserta ${pIndex + 1}`}</p>
                                          <p className="text-[10px] font-semibold text-gray-400 truncate">{participant.email || '-'}</p>
                                        </div>
                                        
                                        {/* Menampilkan Jawaban Form Custom */}
                                        {participant.customAnswers && participant.customAnswers.length > 0 ? (
                                          <div className="space-y-3">
                                            {participant.customAnswers.map((ans, idx) => (
                                              <div key={idx}>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{ans.question}</p>
                                                <p className="text-xs font-semibold text-gray-800">{ans.answer}</p>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <p className="text-xs text-gray-400 italic">Tidak ada data tambahan</p>
                                        )}
                                        
                                      </div>
                                    ))}
                                    
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                }) : (
                  <tr>
                    <td colSpan="6" className="px-8 py-16 text-center text-gray-400 font-bold text-sm">
                      Belum ada pembeli tiket untuk event ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
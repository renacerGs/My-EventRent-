import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';

const formatPrettyDate = (dateString) => {
  if (!dateString) return '';
  try {
    let rawDate = dateString;
    let timePart = '';
    if (dateString.includes(' - ')) {
      const parts = dateString.split(' - ');
      rawDate = parts[0].trim();
      timePart = ` - ${parts[1]}`;
    }
    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) return dateString;
    // Format hari ala TIX ID
    const options = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('id-ID', options).format(dateObj);
    return `${formattedDate}${timePart}`;
  } catch (error) {
    return dateString;
  }
};

const formatPurchaseTime = (dateString) => {
  if (!dateString) return '';
  try {
    const dateObj = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Intl.DateTimeFormat('id-ID', options).format(dateObj);
  } catch (error) {
    return dateString;
  }
};

const isEventPassed = (dateStr) => {
  if (!dateStr) return false;
  try {
    const eventDate = new Date(dateStr);
    if (isNaN(eventDate.getTime())) return false; 
    const now = new Date(); 
    now.setHours(0, 0, 0, 0); 
    return eventDate < now; 
  } catch (error) {
    return false;
  }
};

export default function MyTickets() {
  const navigate = useNavigate();
  const [groupedOrders, setGroupedOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // STATE TABS (aktif / riwayat)
  const [activeTab, setActiveTab] = useState('aktif');

  const [selectedQR, setSelectedQR] = useState(null); 
  const [showQR, setShowQR] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const user = JSON.parse(localStorage.getItem('user')) || null;

  useEffect(() => {
    const fetchMyTickets = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`/api/tickets/my?userId=${user.id}`);
        const rawTickets = response.data;

        const grouped = {};
        rawTickets.forEach(ticket => {
          const orderKey = `${ticket.event_id}_${ticket.purchase_date}`;
          if (!grouped[orderKey]) {
            grouped[orderKey] = {
              order_id: orderKey, 
              event_id: ticket.event_id,
              title: ticket.title,
              img: ticket.img,
              location: ticket.location,
              event_date: ticket.event_date || ticket.session_date, 
              purchase_date: ticket.purchase_date, 
              total_quantity: 0,
              transactions: [] 
            };
          }
          grouped[orderKey].total_quantity += 1; 
          grouped[orderKey].transactions.push(ticket);
        });

        setGroupedOrders(Object.values(grouped));
      } catch (error) {
        console.error("Gagal mengambil data tiket:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMyTickets();
    const interval = setInterval(fetchMyTickets, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  if (loading) return <div className="text-center py-20 font-bold text-gray-500 animate-pulse">Loading My Tickets...</div>;

  const activeEvents = groupedOrders.filter(order => !isEventPassed(order.event_date));
  const pastEvents = groupedOrders.filter(order => isEventPassed(order.event_date));
  
  // Filter data berdasarkan Tab yang aktif
  const displayedEvents = activeTab === 'aktif' ? activeEvents : pastEvents;

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const openQR = (trx, globalIndex) => {
    const attendeeName = trx.attendee_name || `Peserta ${globalIndex + 1}`;
    
    setSelectedQR({ 
      ...trx, 
      uniqueQRData: JSON.stringify({ ticketId: trx.ticket_id, eventId: trx.event_id }), 
      attendeeName: attendeeName,
      attendeeNum: globalIndex + 1 
    });
    setShowQR(true);
  };

  // 👇 FUNGSI DOWNLOAD AJAIB (ANTI KEPOTONG FINAL LEVEL DEWA) 👇
  const handleDownloadImage = async () => {
    const ticketElement = document.getElementById('ticket-download-area');
    if (!ticketElement) return;

    setIsDownloading(true);

    // 1. Simpan posisi scroll layar lu saat ini
    const currentScroll = window.scrollY;
    // 2. Paksa layar scroll ke paling atas! Ini trik rahasia buat ngakalin bug html2canvas di Pop-Up
    window.scrollTo(0, 0);

    // 3. Kasih napas ke browser 100 milidetik buat nyesuain posisi kordinat sebelum dijepret
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const canvas = await html2canvas(ticketElement, {
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff',
        // Paksa html2canvas ngikutin tinggi dan lebar murni dari kotaknya!
        width: ticketElement.offsetWidth,
        height: ticketElement.offsetHeight
      });
      
      const image = canvas.toDataURL("image/png", 1.0);
      
      const link = document.createElement('a');
      link.href = image;
      const cleanName = selectedQR.attendeeName.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `EventRent_Ticket_${cleanName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Gagal download gambar tiket", err);
      alert("Oops, gagal download tiket. Coba lagi bro!");
    } finally {
      // 4. Balikin layar ke posisi scroll semula secepat kilat!
      window.scrollTo(0, currentScroll);
      setIsDownloading(false);
    }
  };
  const OrderCardGroup = ({ orderGroup, isPast }) => {
    const isExpanded = expandedOrderId === orderGroup.order_id;
    return (
      <div className={`bg-white transition-all hover:shadow-md mb-4 md:mb-6 
        rounded-[20px] border border-gray-100 p-3 shadow-sm 
        md:rounded-[32px] md:shadow-sm md:border-gray-200 md:p-0 md:overflow-hidden
        ${isPast ? 'md:opacity-70 md:grayscale-[30%]' : ''}`}>
        
        <div onClick={() => toggleExpand(orderGroup.order_id)} className="flex flex-row cursor-pointer group relative gap-3 md:gap-0">
          
          {/* IMAGE CONTAINER */}
          <div className="w-24 h-32 rounded-xl shrink-0 bg-gray-100 overflow-hidden relative 
                          md:w-64 md:rounded-none md:aspect-auto md:h-full">
             <img src={orderGroup.img} alt={orderGroup.title} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isPast ? 'grayscale opacity-80 md:grayscale-0 md:opacity-100' : ''}`} />
          </div>

          {/* 👇 UI KHUSUS MOBILE (Ala TIX ID) 👇 */}
          <div className="md:hidden flex flex-col flex-1 py-1">
             <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1.5 uppercase line-clamp-2">{orderGroup.title}</h3>
             <p className="text-[10px] font-semibold text-gray-500 flex items-center gap-1.5 mb-1">
               <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
               <span className="truncate max-w-[140px]">{orderGroup.location}</span>
             </p>
             <p className="text-[10px] font-semibold text-gray-500 flex items-center gap-1.5 mb-1.5">
               <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
               Tiket ({orderGroup.total_quantity})
             </p>
             <p className="text-[10px] text-gray-400 capitalize mb-1">{formatPrettyDate(orderGroup.event_date)}</p>
             <div className="mt-auto text-right w-full">
                <span className={`text-[11px] font-bold uppercase tracking-wide ${isPast ? 'text-gray-400' : 'text-[#FF6B35]'}`}>
                  {isPast ? 'Selesai' : 'Berhasil'}
                </span>
             </div>
          </div>

          {/* 👇 UI KHUSUS DESKTOP (Sama persis kayak Kodingan Lama) 👇 */}
          <div className="hidden md:flex flex-1 p-6 md:p-8 flex-col justify-center relative">
             <div className="flex flex-row justify-between items-start gap-4 mb-4">
               <div>
                 <div className="flex items-center gap-2 mb-3">
                   <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Order Dikonfirmasi</span>
                   <span className="text-xs font-bold text-gray-400">{formatPurchaseTime(orderGroup.purchase_date)}</span>
                 </div>
                 <h3 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2 group-hover:text-[#FF6B35] transition-colors">{orderGroup.title}</h3>
                 <p className="text-sm font-semibold text-gray-500 flex items-center gap-2">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                   {orderGroup.location}
                 </p>
               </div>
               <span className={`text-[10px] self-start font-black px-4 py-1.5 rounded-full uppercase tracking-wider whitespace-nowrap ${isPast ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                 {isPast ? 'Event Berakhir' : 'Tiket Aktif'}
               </span>
             </div>
             <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-50">
               <div className="bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                 <p className="text-[#FF6B35] font-bold text-sm">Total <span className="text-lg font-black">{orderGroup.total_quantity}</span> Tiket</p>
               </div>
               <div className="text-gray-400 group-hover:text-[#FF6B35] bg-gray-50 p-3 rounded-full transition-colors border border-gray-100">
                 <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
               </div>
             </div>
          </div>

        </div>

        {/* EXPAND AREA (Isi Daftar Tiket) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="p-3 pt-4 md:p-8 space-y-6 md:space-y-8 md:border-t-2 md:border-dashed md:border-gray-200 md:bg-gray-50/50 mt-1 md:mt-0 border-t border-gray-100">
                {(() => {
                  const sessionGroups = {};
                  orderGroup.transactions.forEach(trx => {
                    if(!sessionGroups[trx.session_id]) {
                      sessionGroups[trx.session_id] = {
                        session_name: trx.session_name,
                        session_date: trx.session_date,
                        start_time: trx.start_time,
                        end_time: trx.end_time,
                        tickets: []
                      };
                    }
                    sessionGroups[trx.session_id].tickets.push(trx);
                  });

                  return Object.values(sessionGroups).map((sg, sIndex) => (
                    <div key={sIndex} className="relative">
                      <div className="mb-3 md:mb-4">
                        <h4 className="text-sm md:text-base font-bold text-gray-900 uppercase tracking-wide border-l-4 border-[#FF6B35] pl-2.5 md:pl-3">
                          {sg.session_name}
                        </h4>
                        <p className="text-[10px] md:text-xs text-gray-500 font-semibold mt-1 pl-3.5 md:pl-4 hidden md:block">
                          Jadwal: {formatPrettyDate(sg.session_date)} | {sg.start_time?.slice(0,5)} - {sg.end_time?.slice(0,5)}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 pl-0 md:pl-4">
                        {sg.tickets.map((trx, tIndex) => {
                          const attendeeName = trx.attendee_name || `Peserta ${tIndex + 1}`;
                          const isScanned = trx.is_scanned; 
                          
                          return (
                            <div key={trx.ticket_id} className={`bg-white border rounded-xl md:rounded-2xl p-3 md:p-4 flex flex-row items-center justify-between shadow-sm transition-colors gap-3 ${isScanned ? 'border-gray-200 opacity-60' : 'border-gray-200 hover:border-[#FF6B35]'}`}>
                              <div className="overflow-hidden">
                                <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-0.5 md:mb-1">
                                  {isScanned ? 'TIKET TERPAKAI' : `E-Ticket ${tIndex + 1}`}
                                </span>
                                <p className={`font-bold text-xs md:text-sm truncate uppercase ${isScanned ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                  {attendeeName}
                                </p>
                              </div>
                              <button 
                                onClick={() => openQR(trx, tIndex)}
                                disabled={isPast || isScanned}
                                className={`shrink-0 px-4 py-2 md:px-5 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all shadow-sm uppercase tracking-wider
                                  ${isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                                  : isScanned ? 'bg-green-50 text-green-600 border border-green-200 cursor-not-allowed' 
                                  : 'bg-[#FF6B35] text-white hover:bg-orange-600 active:scale-95 shadow-md shadow-orange-100'}`}
                              >
                                {isPast ? 'Expired' : isScanned ? 'Dipakai' : 'Buka QR'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 md:pt-10 px-4 md:px-8 pb-20 font-sans">
      
      {/* POPUP QR CODE (GAMBAR TIKET) */}
      <AnimatePresence>
        {showQR && selectedQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-sm">
              <div id="ticket-download-area" className="bg-white rounded-[24px] md:rounded-[32px] shadow-2xl overflow-hidden relative">
                <div className="relative h-20 md:h-24 bg-gray-900">
                  <img src={selectedQR.img} alt="header" className="w-full h-full object-cover opacity-30" crossOrigin="anonymous" />
                </div>
                <div className="p-6 md:p-8 flex flex-col items-center -mt-8 md:-mt-10 relative z-10 bg-white rounded-t-[24px] md:rounded-t-[32px]">
                  <div className="bg-white p-3 md:p-5 rounded-[20px] md:rounded-[24px] shadow-lg border border-gray-100 mb-5 md:mb-6">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedQR.uniqueQRData}`} alt="QR" className="w-40 h-40 md:w-48 md:h-48 mix-blend-multiply" crossOrigin="anonymous" />
                  </div>
                  <div className="text-center w-full">
                    <span className="bg-orange-50 text-[#FF6B35] border border-orange-100 text-[9px] md:text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-3 md:mb-4 inline-block">E-Ticket {selectedQR.attendeeNum}</span>
                    <h3 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-widest mb-2 md:mb-3 truncate px-2">{selectedQR.attendeeName}</h3>
                    <div className="pt-3 border-t border-dashed border-gray-200">
                      <h4 className="text-xs md:text-sm font-bold text-gray-600 leading-tight line-clamp-2">{selectedQR.title}</h4>
                      <p className="text-gray-400 text-[10px] md:text-xs font-semibold mt-1 uppercase tracking-wider">{selectedQR.session_name}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={() => setShowQR(false)} className="w-14 shrink-0 py-3 md:py-4 bg-gray-200 text-gray-600 rounded-xl md:rounded-2xl font-bold flex items-center justify-center hover:bg-gray-300 transition-all active:scale-95">✕</button>
                <button onClick={handleDownloadImage} disabled={isDownloading} className="flex-1 py-3 md:py-4 bg-[#FF6B35] text-white rounded-xl md:rounded-2xl font-bold hover:bg-[#E85526] transition-all uppercase tracking-widest text-[10px] md:text-xs shadow-xl shadow-orange-100/50 active:scale-95 disabled:bg-gray-400 disabled:cursor-wait">
                  {isDownloading ? 'Menyimpan...' : 'Simpan ke Galeri'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        
        {/* HEADER & TABS NAVIGATION */}
        <div className="bg-gray-50 md:bg-transparent sticky md:relative top-0 z-40 pt-4 md:pt-0 mb-4 md:mb-8">
           
           {/* Judul Besar Hanya Tampil di Desktop */}
           <div className="hidden md:block">
             <h1 className="text-4xl font-extrabold mb-2 text-gray-900 tracking-tight">My Tickets</h1>
             <p className="text-gray-500 mb-8 font-medium">Riwayat pembelian dan e-ticket kamu.</p>
           </div>

           {/* Tabs Mobile & Desktop */}
           <div className="flex border-b border-gray-200 bg-white md:bg-transparent rounded-t-[20px] md:rounded-none px-2 md:px-0 pt-2 md:pt-0">
             <button 
               onClick={() => setActiveTab('aktif')}
               className={`flex-1 py-3.5 text-xs md:text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'aktif' ? 'border-b-2 border-[#FF6B35] text-[#FF6B35]' : 'border-b-2 border-transparent text-gray-400 hover:text-gray-600'}`}
             >
               Tiket Aktif
             </button>
             <button 
               onClick={() => setActiveTab('riwayat')}
               className={`flex-1 py-3.5 text-xs md:text-sm font-bold uppercase tracking-widest transition-all ${activeTab === 'riwayat' ? 'border-b-2 border-[#FF6B35] text-[#FF6B35]' : 'border-b-2 border-transparent text-gray-400 hover:text-gray-600'}`}
             >
               Daftar Transaksi
             </button>
           </div>
        </div>

        {/* LIST KONTEN SESUAI TAB */}
        <div className="min-h-[50vh]">
          {displayedEvents.length > 0 ? (
            displayedEvents.map(orderGroup => (
              <OrderCardGroup key={orderGroup.order_id} orderGroup={orderGroup} isPast={activeTab === 'riwayat'} />
            ))
          ) : (
            <div className="text-center py-20 px-4 bg-white md:bg-transparent rounded-[24px] md:rounded-none">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <svg className="w-10 h-10 md:w-12 md:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
              </div>
              <h3 className="text-lg md:text-2xl font-black text-gray-900 mb-2 md:mb-3">{activeTab === 'aktif' ? 'Belum Ada Tiket Aktif' : 'Belum Ada Transaksi'}</h3>
              <p className="text-sm md:text-base text-gray-500 font-medium">Ayo cari event seru dan beli tiketnya sekarang!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
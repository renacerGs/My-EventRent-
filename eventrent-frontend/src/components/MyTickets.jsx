import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// --- FUNGSI FORMAT TANGGAL EVENT ---
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
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(dateObj);
    return `${formattedDate}${timePart}`;
  } catch (error) {
    return dateString;
  }
};

// --- FUNGSI FORMAT WAKTU PEMBELIAN (TRANSAKSI) ---
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

  const [selectedQR, setSelectedQR] = useState(null); 
  const [showQR, setShowQR] = useState(false);

  const user = JSON.parse(localStorage.getItem('user')) || null;

  // --- REFRESH DATA OTOMATIS SAAT HALAMAN DIBUKA KEMBALI ---
  useEffect(() => {
    const fetchMyTickets = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`http://localhost:3000/api/tickets/my?userId=${user.id}`);
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
          grouped[orderKey].total_quantity += parseInt(ticket.quantity);
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
    
    // Polling setiap 10 detik biar kalau tiket discan di gate, layarnya otomatis update
    const interval = setInterval(fetchMyTickets, 10000);
    return () => clearInterval(interval);
    
  }, [user?.id]);

  if (loading) return <div className="text-center py-20 font-bold text-gray-500 animate-pulse">Loading My Tickets...</div>;

  const activeEvents = groupedOrders.filter(order => !isEventPassed(order.event_date));
  const pastEvents = groupedOrders.filter(order => isEventPassed(order.event_date));

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const openQR = (trx, index) => {
    const attendeeName = (trx.attendee_data && trx.attendee_data[index]?.name) 
      ? trx.attendee_data[index].name 
      : `Peserta ${index + 1}`;
    
    setSelectedQR({ 
      ...trx, 
      // PERBAIKAN: QR Code HANYA BERISI TICKET ID MURNI (ANGKA)
      uniqueQRData: `${trx.ticket_id}`, 
      attendeeName: attendeeName,
      attendeeNum: index + 1 
    });
    setShowQR(true);
  };

  const OrderCardGroup = ({ orderGroup, isPast }) => {
    const isExpanded = expandedOrderId === orderGroup.order_id;
    
    return (
      <div className={`bg-white rounded-[32px] shadow-sm border border-gray-200 overflow-hidden transition-all hover:shadow-md mb-6 ${isPast ? 'opacity-70 grayscale-[30%]' : ''}`}>
        
        <div onClick={() => toggleExpand(orderGroup.order_id)} className="flex flex-col md:flex-row cursor-pointer group relative">
          <div className="md:w-64 aspect-video md:aspect-auto md:h-full relative overflow-hidden bg-gray-100">
            <img src={orderGroup.img} alt={orderGroup.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          </div>

          <div className="flex-1 p-6 md:p-8 relative flex flex-col justify-center">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-gray-100 text-gray-500 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    Order Dikonfirmasi
                  </span>
                  <span className="text-xs font-bold text-gray-400">
                    {formatPurchaseTime(orderGroup.purchase_date)}
                  </span>
                </div>

                <h3 className="text-2xl font-extrabold text-gray-900 leading-tight mb-2 group-hover:text-[#FF6B35] transition-colors">
                  {orderGroup.title}
                </h3>
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
                <p className="text-[#FF6B35] font-bold text-sm">
                  Total <span className="text-lg font-black">{orderGroup.total_quantity}</span> Tiket Dibeli
                </p>
              </div>
              <div className="text-gray-400 group-hover:text-[#FF6B35] bg-gray-50 p-3 rounded-full transition-colors border border-gray-100">
                <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t-2 border-dashed border-gray-200 bg-gray-50/50"
            >
              <div className="p-6 md:p-8 space-y-8">
                
                {orderGroup.transactions.map((trx, tIndex) => (
                  <div key={trx.ticket_id} className="relative">
                    
                    <div className="mb-4">
                      <h4 className="text-base font-bold text-gray-900 uppercase tracking-wide border-l-4 border-[#FF6B35] pl-3">
                        {trx.session_name}
                      </h4>
                      <p className="text-xs text-gray-500 font-semibold mt-1 pl-4">
                        Jadwal: {formatPrettyDate(trx.session_date)} | {trx.start_time?.slice(0,5)} - {trx.end_time?.slice(0,5)}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4">
                      {Array.from({ length: trx.quantity }).map((_, idx) => {
                        const attendeeName = (trx.attendee_data && trx.attendee_data[idx]?.name) 
                          ? trx.attendee_data[idx].name 
                          : `Peserta ${idx + 1}`;
                        
                        // Cek apakah tiket sudah discan
                        const isScanned = trx.is_scanned; 
                        
                        return (
                          <div key={idx} className={`bg-white border rounded-2xl p-4 flex items-center justify-between shadow-sm transition-colors ${isScanned ? 'border-gray-200 opacity-60' : 'border-gray-200 hover:border-[#FF6B35]'}`}>
                            <div className="overflow-hidden pr-3">
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">
                                {isScanned ? 'TIKET TERPAKAI' : `E-Ticket ${idx + 1}`}
                              </span>
                              <p className={`font-bold text-sm truncate uppercase ${isScanned ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {attendeeName}
                              </p>
                            </div>
                            
                            <button 
                              onClick={() => openQR(trx, idx)}
                              disabled={isPast || isScanned}
                              className={`shrink-0 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm 
                                ${isPast ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                                : isScanned ? 'bg-green-50 text-green-600 border border-green-200 cursor-not-allowed' 
                                : 'bg-[#1a1a1a] text-white hover:bg-[#FF6B35]'}`}
                            >
                              {isPast ? 'Expired' : isScanned ? 'Dipakai' : 'Show QR'}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                ))}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pt-10 px-4 md:px-8 pb-20 font-sans">
      
      {/* POP UP QR CODE */}
      <AnimatePresence>
        {showQR && selectedQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="relative h-24 bg-gray-900">
                <img src={selectedQR.img} alt="header" className="w-full h-full object-cover opacity-30" />
                <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="p-8 flex flex-col items-center -mt-10 relative z-10">
                <div className="bg-white p-5 rounded-[24px] shadow-lg border border-gray-100 mb-6">
                  {/* GENERATOR QR CODE MENGGUNAKAN API GOOGLE/QRSERVER */}
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedQR.uniqueQRData}`} alt="QR" className="w-48 h-48 mix-blend-multiply" />
                </div>
                
                <div className="text-center mb-8 w-full">
                  <span className="bg-orange-50 text-[#FF6B35] border border-orange-100 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
                    E-Ticket {selectedQR.attendeeNum}
                  </span>
                  
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-widest mb-3">
                    {selectedQR.attendeeName}
                  </h3>

                  <div className="pt-3 border-t border-dashed border-gray-200">
                    <h4 className="text-sm font-bold text-gray-600 leading-tight line-clamp-1">{selectedQR.title}</h4>
                    <p className="text-gray-400 text-xs font-semibold mt-1 uppercase tracking-wider">{selectedQR.session_name}</p>
                  </div>
                </div>
                
                <button onClick={() => window.print()} className="w-full py-4 bg-[#FF6B35] text-white rounded-2xl font-bold hover:bg-[#E85526] transition-all uppercase tracking-widest text-xs shadow-xl shadow-orange-100 active:scale-95">
                  Download E-Ticket
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-gray-900 tracking-tight">My Tickets</h1>
        <p className="text-gray-500 mb-10 font-medium">Riwayat pembelian dan e-ticket kamu.</p>

        {/* SECTION: TIKET AKTIF */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse"></span>
            Active Tickets
          </h2>
          <div>
            {activeEvents.length > 0 ? (
              activeEvents.map(orderGroup => <OrderCardGroup key={orderGroup.order_id} orderGroup={orderGroup} isPast={false} />)
            ) : (
              <div className="text-center py-16 text-gray-400 bg-white rounded-[32px] border border-gray-100 shadow-sm">
                <div className="text-4xl mb-3">🎟️</div>
                <p className="font-bold">Belum ada tiket aktif.</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION: RIWAYAT / PAST TICKETS */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-400 mb-5 flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
              History (Past Events)
            </h2>
            <div>
              {pastEvents.map(orderGroup => <OrderCardGroup key={orderGroup.order_id} orderGroup={orderGroup} isPast={true} />)}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
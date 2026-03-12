import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Scanner as QrScanner } from '@yudiel/react-qr-scanner';

export default function Scanner() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [scanResult, setScanResult] = useState(null); 
  const [message, setMessage] = useState('');
  const [ticketData, setTicketData] = useState(null);

  // Gembok Anti-Dobel
  const isProcessingRef = useRef(false); 

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  // --- FUNGSI PROSES KE BACKEND ---
  const processTicket = async (ticketIdStr) => {
    setScanResult('processing');
    
    const ticketId = parseInt(ticketIdStr);
    if (isNaN(ticketId)) {
      setScanResult('error');
      setMessage("QR Code Tidak Valid! Bukan tiket EventRent.");
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/tickets/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, eventId, userId: user?.id })
      });
      const data = await res.json();

      if (res.ok && data.valid) {
        setScanResult('success');
        setMessage(data.message);
        setTicketData(data.data);
      } else {
        setScanResult('error');
        setMessage(data.message || 'Akses Ditolak!');
        setTicketData(data.data || null);
      }
    } catch (error) {
      setScanResult('error');
      setMessage("Gagal terhubung ke server. Cek internet!");
    }
  };

  // --- FUNGSI SAAT KAMERA NANGKEP QR CODE ---
  const handleScan = (result) => {
    // Cegah scan berulang kalau lagi ngeproses tiket
    if (isProcessingRef.current || scanResult) return; 

    let text = '';
    // Format data dari library versi terbaru
    if (Array.isArray(result) && result.length > 0) text = result[0].rawValue;
    // Format data dari library versi lama
    else if (typeof result === 'string') text = result;

    if (!text) return;

    isProcessingRef.current = true; // Kunci gembok!
    if (navigator.vibrate) navigator.vibrate(200); // Getarkan HP
    
    processTicket(text);
  };

  const resetScanner = () => {
    setScanResult(null);
    setMessage('');
    setTicketData(null);
    
    // Buka gembok setelah 1 detik biar gak langsung nge-scan lagi secara membabi buta
    setTimeout(() => {
      isProcessingRef.current = false; 
    }, 1000); 
  };

  // --- FUNGSI TUTUP SANGAT CLEAN ---
  const handleCloseScanner = () => {
    // Nggak perlu Kill Switch! Begitu pindah halaman, komponen QrScanner akan unmount dan mematikan dirinya sendiri.
    navigate(-1); 
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col relative overflow-hidden">
      
      {/* HEADER */}
      <div className="p-6 flex items-center justify-between bg-gray-900/80 backdrop-blur-md z-30 relative">
        <button 
          onClick={handleCloseScanner} 
          className="text-gray-400 hover:text-white flex items-center gap-2 font-bold text-sm uppercase tracking-widest transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Tutup Scanner
        </button>
        {!scanResult && (
          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
            Live
          </span>
        )}
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
        
        {/* WADAH KAMERA REACT-NATIVE */}
        <div className={`w-full max-w-sm relative transition-all duration-300 ${scanResult ? 'opacity-40 blur-sm scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
          <h2 className="text-center text-gray-300 font-bold mb-4 uppercase tracking-widest text-xs">Arahkan kamera ke QR Code Tiket</h2>
          <div className="w-full rounded-3xl overflow-hidden border-4 border-[#FF6B35] shadow-[0_0_30px_rgba(255,107,53,0.3)] bg-black aspect-square">
             {/* COMPONENT SCANNER MODERN */}
             <QrScanner
               onScan={handleScan}
               onError={(error) => {
                 // Abaikan error "notFound" karena itu wajar saat kamera lagi nyari QR
               }}
               formats={['qr_code']}
             />
          </div>
        </div>

        {/* OVERLAY POP UP */}
        {scanResult && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            
            {/* LOADING */}
            {scanResult === 'processing' && (
              <div className="flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 border-4 border-gray-700 border-t-[#FF6B35] rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-bold uppercase tracking-widest text-white animate-pulse">Memverifikasi...</h2>
              </div>
            )}

            {/* SUKSES */}
            {scanResult === 'success' && (
              <div className="bg-[#27AE60] w-full max-w-sm rounded-[32px] p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
                <div className="w-24 h-24 bg-white text-[#27AE60] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">TIKET VALID!</h2>
                <p className="text-green-100 font-medium mb-6">{message}</p>
                
                <div className="bg-black/20 rounded-2xl p-4 text-left mb-8">
                  <p className="text-[10px] text-green-200 uppercase tracking-widest mb-1">Detail Peserta</p>
                  <p className="text-lg font-bold text-white leading-tight mb-1">{ticketData?.buyer_name}</p>
                  <p className="text-sm text-green-100 font-medium">{ticketData?.session_name} • {ticketData?.quantity} Tiket</p>
                </div>

                <button onClick={resetScanner} className="w-full bg-white text-[#27AE60] py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-green-50 transition-all active:scale-95">
                  Lanjut Scan (Next)
                </button>
              </div>
            )}

            {/* GAGAL / SUDAH DIPAKAI */}
            {scanResult === 'error' && (
              <div className="bg-[#E24A29] w-full max-w-sm rounded-[32px] p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 bg-white text-[#E24A29] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </div>
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">DITOLAK!</h2>
                <p className="text-red-100 font-bold mb-6">{message}</p>
                
                {ticketData && (
                  <div className="bg-black/20 rounded-2xl p-4 text-left mb-8">
                    <p className="text-[10px] text-red-200 uppercase tracking-widest mb-1">Data Tiket Tercatat:</p>
                    <p className="text-lg font-bold text-white leading-tight mb-1">{ticketData?.buyer_name}</p>
                    <p className="text-sm text-red-100 font-medium">{ticketData?.session_name}</p>
                  </div>
                )}

                <button onClick={resetScanner} className="w-full bg-white text-[#E24A29] py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:bg-red-50 transition-all active:scale-95">
                  Scan Tiket Lain
                </button>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
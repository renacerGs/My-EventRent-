import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function PersonalInvitation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false); 
  
  // State untuk Carousel Gallery
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Gagal memuat event");
        return res.json();
      })
      .then(data => {
        setEvent(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        alert("Event tidak ditemukan");
        navigate('/');
      });
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const details = event?.event_details || {};
  const profiles = details.profiles || [];
  const gallery = details.galleryImages || [];
  const gifts = details.digitalGifts || [];
  const sessions = event?.sessions || [];
  const greetings = event?.greetings || [];

  // Fungsi Carousel
  const nextSlide = () => setCurrentSlide((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-purple-200 selection:text-purple-900 relative overflow-hidden">
      
      {/* --- HERO SECTION (COVER UNDANGAN SEBELUM DIBUKA) --- */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div 
            initial={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '-100%' }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${event.img})` }}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
            
            <div className="relative z-10 text-center px-6 max-w-lg mx-auto flex flex-col items-center">
              <span className="px-4 py-1.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-widest border border-purple-400/30 mb-6 backdrop-blur-md">
                You're Invited! 🎉
              </span>
              
              <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight drop-shadow-xl">
                {event.title}
              </h1>
              
              <p className="text-gray-300 font-medium text-sm md:text-base mb-12 uppercase tracking-widest">
                {event.date_start}
              </p>

              <button 
                onClick={() => setIsOpen(true)}
                className="px-10 py-4 bg-white text-purple-700 rounded-full font-black uppercase tracking-widest text-sm hover:bg-purple-50 hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(168,85,247,0.4)]"
              >
                Buka Undangan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- ISI UNDANGAN SETELAH DIBUKA --- */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="pb-32"
        >
          
          {/* HEADER IMAGE KECIL */}
          <div className="w-full h-[40vh] md:h-[60vh] relative">
            <img src={event.img} alt="Cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-transparent"></div>
          </div>

          <div className="max-w-3xl mx-auto px-6 -mt-20 relative z-10">
            
            {/* OPENING SECTION */}
            {details.openingMessage && (
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl shadow-purple-900/5 text-center mb-12">
                <span className="text-4xl block mb-4">✨</span>
                <p className="text-gray-600 leading-relaxed font-medium text-lg md:text-xl">
                  "{details.openingMessage}"
                </p>
              </div>
            )}

            {/* PROFILE SECTION (HOST) - KOTAK & TIDAK GEPENG */}
            {profiles.length > 0 && (
              <div className="mb-16 text-center">
                <h2 className="text-sm font-black text-purple-600 uppercase tracking-widest mb-8">Hosted By</h2>
                <div className="flex flex-wrap justify-center gap-8">
                  {profiles.map(prof => (
                    <div key={prof.id} className="flex flex-col items-center">
                      {/* 👇 Ubah ke Kotak (rounded-3xl) dan object-cover biar ga gepeng */}
                      <div className="w-40 h-40 md:w-48 md:h-48 rounded-3xl overflow-hidden mb-4 border-4 border-white shadow-xl bg-purple-50">
                        {prof.photoUrl ? (
                          <img src={prof.photoUrl} alt={prof.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl">😎</div>
                        )}
                      </div>
                      <h3 className="text-2xl font-black text-gray-900">{prof.fullName}</h3>
                      <p className="text-sm font-bold text-purple-500 uppercase tracking-widest mt-1">{prof.role}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EVENT SECTION (SESSIONS) */}
            <div className="mb-16">
              <h2 className="text-sm font-black text-center text-purple-600 uppercase tracking-widest mb-8">Rangkaian Acara</h2>
              <div className="space-y-6">
                {sessions.map((s, idx) => (
                  <div key={s.id} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-purple-100 flex flex-col md:flex-row gap-6 items-center text-center md:text-left">
                    <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-2xl shrink-0">
                      🗓️
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-black text-gray-900 mb-2">{s.name}</h3>
                      <p className="text-gray-600 font-medium text-sm mb-1">
                        <span className="font-bold text-gray-900">Tanggal:</span> {s.date}
                      </p>
                      <p className="text-gray-600 font-medium text-sm mb-3">
                        <span className="font-bold text-gray-900">Waktu:</span> {s.start_time} - {s.end_time}
                      </p>
                      <p className="text-sm text-gray-500">
                        📍 <strong>{s.name_place}</strong> <br/>
                        {s.place}, {s.city}
                      </p>
                    </div>
                    {s.map_url && (
                      <a href={s.map_url} target="_blank" rel="noreferrer" className="px-6 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-colors shrink-0">
                        Buka Maps
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* GALLERY SECTION (CAROUSEL SLIDER) */}
            {gallery.length > 0 && (
              <div className="mb-16">
                <h2 className="text-sm font-black text-center text-purple-600 uppercase tracking-widest mb-8">Our Moments</h2>
                
                <div className="relative w-full max-w-xl mx-auto aspect-[4/3] md:aspect-video rounded-[32px] overflow-hidden shadow-xl border-4 border-white bg-gray-100 group">
                  <img 
                    src={gallery[currentSlide]} 
                    alt={`Gallery ${currentSlide + 1}`} 
                    className="w-full h-full object-cover transition-opacity duration-500 ease-in-out" 
                  />
                  
                  {/* Tombol Navigasi Kiri Kanan */}
                  {gallery.length > 1 && (
                    <>
                      <button 
                        onClick={prevSlide} 
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-sm text-purple-600 rounded-full flex items-center justify-center font-bold shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all z-10 opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                      </button>
                      <button 
                        onClick={nextSlide} 
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/80 backdrop-blur-sm text-purple-600 rounded-full flex items-center justify-center font-bold shadow-lg hover:bg-white hover:scale-110 active:scale-95 transition-all z-10 opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"></path></svg>
                      </button>
                      
                      {/* Indikator Titik */}
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10">
                        {gallery.map((_, idx) => (
                          <button 
                            key={idx} 
                            onClick={() => setCurrentSlide(idx)}
                            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 shadow-sm ${currentSlide === idx ? 'bg-purple-600 w-6' : 'bg-white/80 hover:bg-white'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* GIFT SECTION */}
            {gifts.length > 0 && (
              <div className="mb-16">
                <h2 className="text-sm font-black text-center text-purple-600 uppercase tracking-widest mb-8">Kado Digital</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {gifts.map(gift => (
                    <div key={gift.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
                      <h4 className="text-lg font-black text-gray-900 mb-1 uppercase">{gift.bankName}</h4>
                      <p className="text-2xl font-bold text-purple-600 mb-2 tracking-widest">{gift.accountNumber}</p>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">a.n {gift.accountName}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(gift.accountNumber);
                          alert('Nomor rekening disalin!');
                        }}
                        className="mt-4 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-colors"
                      >
                        Copy Rekening
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* WISHES / GREETINGS SECTION */}
            <div className="mb-16">
              <h2 className="text-sm font-black text-center text-purple-600 uppercase tracking-widest mb-8">Ucapan & Doa</h2>
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 max-h-[400px] overflow-y-auto space-y-4">
                {greetings.length > 0 ? (
                  greetings.map((greet, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-2xl">
                      <p className="text-sm text-gray-700 font-medium italic mb-2">"{greet.greeting}"</p>
                      <p className="text-xs font-black text-gray-900 uppercase">{greet.name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{greet.time}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-gray-400 font-medium py-8">Belum ada ucapan. Jadilah yang pertama!</p>
                )}
              </div>
            </div>

            {/* CLOSING SECTION */}
            {details.closingMessage && (
              <div className="text-center mb-16">
                <p className="text-gray-600 leading-relaxed font-medium text-lg italic">
                  "{details.closingMessage}"
                </p>
              </div>
            )}

          </div>

          {/* FLOATING RSVP BUTTON */}
          <div className="fixed bottom-6 left-0 right-0 z-50 px-6 flex justify-center">
            {/* 👇 Ubah Link ke route baru buat RSVP Personal 👇 */}
            <Link 
              to={`/party-rsvp/${id}`} 
              className="bg-purple-600 text-white px-12 py-4 rounded-full font-black uppercase tracking-widest text-sm shadow-xl shadow-purple-500/30 hover:bg-purple-700 hover:-translate-y-1 transition-all"
            >
              Konfirmasi Kehadiran
            </Link>
          </div>

        </motion.div>
      )}
    </div>
  );
}
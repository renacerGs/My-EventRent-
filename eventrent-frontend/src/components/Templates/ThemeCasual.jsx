import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays, Clock, MapPin, ExternalLink, Copy, Check, Send,
  ChevronLeft, ChevronRight, CreditCard, MessageSquare
} from "lucide-react";

/* ─── CUSTOM STYLES: PROFESSIONAL THEME ─── */
const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    /* Corporate Color Palette */
    .bg-corporate-light { background-color: #F8FAFC; }
    .bg-corporate-alt { background-color: #F1F5F9; }
    .text-corporate-accent { color: #2563EB; }
    .bg-corporate-accent { background-color: #2563EB; }
    
    /* Sleek Cards */
    .card-professional { 
      background-color: #FFFFFF; 
      border-radius: 1rem; 
      border: 1px solid #E2E8F0; 
      box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04); 
      transition: all 0.3s ease;
    }
    .card-professional:hover {
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      border-color: #CBD5E1;
    }

    /* Clean Divider */
    .divider-clean { 
      height: 3px; 
      background: #2563EB; 
      border-radius: 4px;
    }

    /* Elegant Text Shadows for Hero */
    .text-shadow-elegant { text-shadow: 0px 4px 15px rgba(0,0,0,0.8), 0px 2px 5px rgba(0,0,0,0.5); }
    .text-shadow-sm { text-shadow: 0px 2px 6px rgba(0,0,0,0.7); }
    
    /* Scrollbar */
    .scrollbar-professional::-webkit-scrollbar { width: 6px; }
    .scrollbar-professional::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-professional::-webkit-scrollbar-thumb { background-color: #CBD5E1; border-radius: 10px; }
  `}} />
);

/* ─── Countdown Hook ─── */
const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return;
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);
  return timeLeft;
};

/* 🔥 KOMPONEN DAFTAR PESAN / KONFIRMASI TAMU 🔥 */
const GuestMessagesProfessional = ({ greetings }) => {
  const safeGreetings = Array.isArray(greetings) ? greetings : [];
  const daftarUcapan = safeGreetings
    .map((item, index) => ({
      id: item.id || index,
      nama: item.name || item.attendee_name || "Peserta",
      pesan: item.greeting || item.pesan || ""
    }))
    .filter(item => item.pesan.trim() !== "");

  return (
    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-professional text-left">
      {daftarUcapan.length > 0 ? (
        daftarUcapan.map((item) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            key={item.id} 
            className="card-professional p-6 text-left border-l-4 border-l-blue-600"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                <MessageSquare className="w-4 h-4 text-blue-600" />
              </div>
              <p className="font-bold text-sm text-slate-800">{item.nama}</p>
            </div>
            <p className="text-sm text-slate-600 pl-11 leading-relaxed">{item.pesan}</p>
          </motion.div>
        ))
      ) : (
        <div className="text-center text-slate-400 card-professional p-6">
          Belum ada pesan atau konfirmasi yang masuk.
        </div>
      )}
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — Theme Professional (Corporate / Formal Edition)
   ═══════════════════════════════════════════════════════════════ */
export default function ThemeProfessional({ eventData, guestName, isOpen, onOpen, navigate, id }) {
  let details = eventData?.eventDetails || eventData?.event_details || {};
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch (e) { details = {}; }
  }

  let profilesList = details.profiles || [];
  if (typeof profilesList === 'string') {
    try { profilesList = JSON.parse(profilesList); } catch (e) { profilesList = []; }
  }

  const coverImg = eventData?.img || "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1000&auto=format&fit=crop";
  const profile = profilesList[0] || {};
  
  const hostName = profile.fullName || profile.full_name || eventData?.title || "Organisasi/Perusahaan";
  const roleName = profile.role || "Penyelenggara";
  const hostPhoto = profile.photoUrl || profile.photo_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=500&auto=format&fit=crop";
  const companyInfo = profile.parentsInfo || profile.parents_info || "";

  const sessions = Array.isArray(eventData?.sessions) ? eventData.sessions : [];
  const gallery = Array.isArray(details.galleryImages || details.gallery_images) ? (details.galleryImages || details.gallery_images) : [];
  const gifts = Array.isArray(details.digitalGifts || details.digital_gifts) ? (details.digitalGifts || details.digital_gifts) : [];
  
  const heroDateText = sessions[0]?.date || eventData?.date_start || "TBA";
  const targetDate = eventData?.date_start || sessions[0]?.date || new Date(Date.now() + 864000000).toISOString();

  const defaultCaptions = ["Suasana Acara", "Sesi Diskusi", "Dokumentasi", "Networking", "Presentasi Materi"];
  const galleryCaptions = Array.isArray(details.galleryCaptions) && details.galleryCaptions.length > 0 ? details.galleryCaptions : defaultCaptions;

  const countdown = useCountdown(targetDate);
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c === 0 ? (gallery.length > 0 ? gallery.length - 1 : 0) : c - 1));
  const next = () => setCurrent((c) => (c === (gallery.length > 0 ? gallery.length - 1 : 0) ? 0 : c + 1));

  const [copied, setCopied] = useState(null);
  const copyNumber = (num, idx) => {
    navigator.clipboard.writeText(num);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-corporate-light text-slate-800 overflow-x-hidden font-sans selection:bg-blue-600 selection:text-white">
      <CustomStyles />
      
      {/* 🔥 HERO / COVER 🔥 */}
      {!isOpen && (
        <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-slate-900">
          <div className="absolute inset-0 z-0">
            <img src={coverImg} alt="Professional event" className="w-full h-full object-cover object-center opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/50 to-slate-900/90" /> 
          </div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="relative z-10 w-full px-6 flex flex-col items-center mt-[-15vh]">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-blue-400 text-sm font-bold uppercase tracking-[0.3em] mb-4">
              Formal Invitation
            </motion.p>
            
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="text-center text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 tracking-tight text-white px-4">
              {eventData?.title || "Professional Event Gathering"}
            </motion.h1>
            
            <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.7, duration: 0.6 }} className="w-24 h-[2px] bg-blue-500 my-4" />
            
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-base sm:text-lg text-slate-300 font-medium tracking-wide mb-2 max-w-xl text-center">
              {details.quote || "Menghadirkan inovasi dan kolaborasi untuk masa depan yang lebih baik."}
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="text-white text-sm font-bold tracking-[0.1em] mt-4 mb-12 bg-white/10 px-6 py-2 rounded-full border border-white/20 backdrop-blur-sm">
              {heroDateText}
            </motion.p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="absolute bottom-28 md:bottom-32 left-0 right-0 z-20 flex flex-col items-center w-full px-6">
            <div className="text-center mb-6 bg-slate-900/80 backdrop-blur-md py-4 px-10 rounded-2xl border border-slate-700">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Kepada Yth.</p>
              <p className="text-lg text-white font-bold tracking-wide">{guestName}</p>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              onClick={onOpen} 
              className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-[0.15em] rounded-full shadow-lg transition-all duration-300 border border-blue-500 flex items-center gap-3"
            >
               Buka Undangan
            </motion.button>
          </motion.div>
        </section>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

            {/* ─── OPENING ─── */}
            <section className="py-24 px-6 bg-white">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 tracking-tight">
                  Selamat Datang
                </h2>
                <div className="divider-clean w-16 mx-auto mb-8" />
                <p className="text-slate-600 leading-relaxed text-base sm:text-lg max-w-2xl mx-auto">
                  {details.openingMessage || "Terima kasih atas perhatian Anda. Kehadiran dan partisipasi Anda merupakan suatu kehormatan bagi kami. Mari bersama-sama menyukseskan acara ini."}
                </p>
              </motion.div>
            </section>

            {/* ─── PROFILE (HOST / SPEAKER) ─── */}
            <section className="py-24 px-6 bg-corporate-alt">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-2xl mx-auto text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-600 mb-2 font-bold">{roleName}</p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-8 uppercase tracking-widest">Informasi Penyelenggara</h2>

                <motion.div initial={{ scale: 0.95, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="card-professional p-8 sm:p-10">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white flex items-center justify-center">
                    {/* 🔥 PERBAIKAN FOTO PROFIL: object-contain & p-2 biar logo bulat sempurna dan nggak ketarik 🔥 */}
                    <img src={hostPhoto} alt={hostName} className="w-full h-full object-contain p-2" />
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 mb-2">{hostName}</h3>
                  {companyInfo && <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">{companyInfo}</p>}
                </motion.div>
              </motion.div>
            </section>

            {/* ─── COUNTDOWN ─── */}
            <section className="py-20 px-6 bg-slate-900 text-white">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl font-black mb-10 uppercase tracking-widest text-slate-100">Menuju Pelaksanaan Acara</h2>

                <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
                  {[{ label: "Hari", value: countdown.days }, { label: "Jam", value: countdown.hours }, { label: "Menit", value: countdown.minutes }, { label: "Detik", value: countdown.seconds }].map((item, i) => (
                    <div key={item.label} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-4 sm:p-6 rounded-2xl">
                      <p className="text-3xl sm:text-5xl font-black text-blue-400 mb-2">
                        {String(item.value).padStart(2, "0")}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-widest">{item.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* ─── EVENT DETAILS (SESSIONS) ─── */}
            <section className="py-24 px-6 bg-white">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400 font-bold mb-2">Agenda Kegiatan</p>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-8 uppercase tracking-widest">Waktu & Lokasi</h2>
                
                <div className="space-y-6 text-left">
                  {sessions.map((session, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 * idx, duration: 0.5 }} className="card-professional p-8">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-wide">{session.name}</h3>
                        <span className="mt-2 sm:mt-0 inline-block px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-widest rounded-full border border-blue-100 w-max">
                          Sesi {idx + 1}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="space-y-4">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 shrink-0">
                                <CalendarDays className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Tanggal</p>
                              <p className="text-slate-800 font-semibold">{session.date}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 shrink-0">
                                <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Waktu</p>
                              <p className="text-slate-800 font-semibold">{session.start_time || session.startTime} - {session.end_time || session.endTime} WIB</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 shrink-0">
                              <MapPin className="w-5 h-5 text-blue-600" />
                           </div>
                           <div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Lokasi Acara</p>
                             <p className="text-slate-800 font-bold mb-1">{session.name_place || session.location?.namePlace || "Venue Utama"}</p>
                             <p className="text-slate-500 leading-relaxed">{session.place || session.location?.place}</p>
                             
                             {(session.map_url || session.location?.mapUrl) && (
                               <a href={session.map_url || session.location?.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-4 px-5 py-2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-blue-600 transition-colors">
                                 <ExternalLink className="w-3 h-3" /> Buka Google Maps
                               </a>
                             )}
                           </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* ─── GALLERY ─── */}
            {gallery && gallery.length > 0 && (
              <section className="py-24 px-6 bg-corporate-alt">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Dokumentasi</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-10 uppercase tracking-widest">Galeri</h2>

                  <div className="relative overflow-hidden rounded-2xl shadow-lg border border-slate-200 bg-white">
                    <AnimatePresence mode="wait">
                      {gallery[current] && (
                        <motion.img key={current} src={gallery[current]} alt={`Gallery ${current + 1}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full h-80 sm:h-[500px] object-cover" />
                      )}
                    </AnimatePresence>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/80 to-transparent p-6 text-left">
                       {galleryCaptions && galleryCaptions.length > 0 && (
                         <p className="text-white font-medium text-sm sm:text-base">{galleryCaptions[current % galleryCaptions.length]}</p>
                       )}
                    </div>

                    <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-md border border-slate-200"><ChevronLeft className="w-5 h-5 text-slate-700" /></button>
                    <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-md border border-slate-200"><ChevronRight className="w-5 h-5 text-slate-700" /></button>
                  </div>

                  <div className="flex justify-center gap-2 mt-6">
                    {gallery.map((_, i) => (
                      <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all duration-300 ${i === current ? "bg-blue-600 w-8" : "bg-slate-300 w-2 hover:bg-blue-400"}`} />
                    ))}
                  </div>
                </motion.div>
              </section>
            )}

            {/* ─── RSVP & MESSAGES ─── */}
            <section className="py-24 px-6 bg-white">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
                  <Send className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 uppercase tracking-widest">Registrasi & Kehadiran</h2>
                <p className="text-sm text-slate-500 font-medium mb-10">Kami mohon ketersediaan Anda untuk melakukan konfirmasi kehadiran melalui tautan berikut.</p>

                <div className="card-professional p-8 mb-12 border-t-4 border-t-blue-600">
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Formulir Konfirmasi</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">Pendaftaran diperlukan untuk manajemen kuota peserta dan persiapan akomodasi acara.</p>
                  <button onClick={() => navigate(`/party-rsvp/${id}`)} className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white font-bold text-sm tracking-widest uppercase rounded-xl hover:bg-blue-600 transition-colors shadow-md">
                    Isi Formulir RSVP
                  </button>
                </div>

                <GuestMessagesProfessional greetings={eventData?.greetings} />
              </motion.div>
            </section>

            {/* ─── DIGITAL GIFTS / SUPPORT ─── */}
            {gifts.length > 0 && (
              <section className="py-24 px-6 bg-corporate-alt">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-2xl mx-auto text-center">
                  <div className="w-16 h-16 bg-slate-200 text-slate-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CreditCard className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 uppercase tracking-widest">Dukungan & Partisipasi</h2>
                  <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed max-w-lg mx-auto">
                    Bagi Anda yang ingin memberikan kontribusi atau dukungan dana untuk kelancaran acara ini, dapat melalui rekening berikut:
                  </p>

                  <div className="space-y-4 text-left">
                    {gifts.map((acc, idx) => (
                      <div key={idx} className="card-professional p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-l-4 border-l-slate-700">
                        <div>
                          <p className="text-xs text-blue-600 font-black uppercase tracking-widest mb-1">{acc.bankName || acc.bank_name}</p>
                          <p className="text-slate-900 font-bold mb-1">{acc.accountName || acc.account_name}</p>
                          <p className="text-xl font-mono text-slate-600 tracking-wider">{acc.accountNumber || acc.account_number}</p>
                        </div>
                        <button onClick={() => copyNumber(acc.accountNumber || acc.account_number, idx)} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border ${copied === idx ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                          {copied === idx ? <><Check className="w-4 h-4" /> Tersalin</> : <><Copy className="w-4 h-4" /> Salin No. Rek</>}
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </section>
            )}

            {/* ─── CLOSING ─── */}
            <section className="py-24 px-6 bg-slate-900 text-center">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-2xl mx-auto">
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-6 uppercase tracking-widest">
                  Kami Menantikan Kehadiran Anda
                </h2>
                <div className="w-16 h-1 bg-blue-500 mx-auto mb-8 rounded-full" />
                <p className="text-slate-400 font-medium leading-relaxed text-base mb-12 max-w-lg mx-auto">
                  {details.closingMessage || details.closing_message || "Kehadiran serta partisipasi aktif Anda akan sangat berkontribusi pada kesuksesan agenda ini. Sampai jumpa di acara."}
                </p>
                
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-2xl inline-block">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-2">Hormat Kami,</p>
                  <p className="text-2xl font-black text-white uppercase tracking-wide">{hostName}</p>
                </div>
              </motion.div>
            </section>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays, Clock, MapPin, ExternalLink, Copy, Check, Send,
  ChevronLeft, ChevronRight, CreditCard, MessageSquare, Leaf
} from "lucide-react";

/* ─── CUSTOM STYLES: CLEAN CASUAL THEME ─── */
const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    .bg-casual-light { background-color: #F8FAF9; }
    .bg-casual-alt { background-color: #ECFDF5; }
    
    .card-casual { 
      background-color: #FFFFFF; 
      border-radius: 1.5rem; 
      border: 1px solid #E5E7EB; 
      box-shadow: 0 10px 30px rgba(4, 47, 46, 0.03); 
      transition: all 0.3s ease;
    }
    .card-casual:hover {
      box-shadow: 0 15px 35px rgba(4, 47, 46, 0.06);
      border-color: #D1FAE5;
      transform: translateY(-2px);
    }

    .divider-casual { 
      height: 3px; 
      background: #10B981; 
      border-radius: 4px;
    }
    
    .scrollbar-casual::-webkit-scrollbar { width: 6px; }
    .scrollbar-casual::-webkit-scrollbar-track { background: transparent; }
    .scrollbar-casual::-webkit-scrollbar-thumb { background-color: #A7F3D0; border-radius: 10px; }
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

/* 🔥 KOMPONEN DAFTAR PESAN 🔥 */
const GuestMessagesCasual = ({ greetings }) => {
  const safeGreetings = Array.isArray(greetings) ? greetings : [];
  const daftarUcapan = safeGreetings
    .map((item, index) => ({
      id: item.id || index,
      nama: item.name || item.attendee_name || "Peserta",
      pesan: item.greeting || item.pesan || ""
    }))
    .filter(item => item.pesan.trim() !== "");

  return (
    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-casual text-left mt-8">
      {daftarUcapan.length > 0 ? (
        daftarUcapan.map((item) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            key={item.id} 
            className="card-casual p-6 text-left border-l-4 border-l-emerald-500"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="font-bold text-sm text-slate-800">{item.nama}</p>
            </div>
            <p className="text-sm text-slate-600 pl-11 leading-relaxed">{item.pesan}</p>
          </motion.div>
        ))
      ) : (
        <div className="text-center text-slate-400 card-casual p-6 border-dashed">
          Belum ada pesan. Jadilah yang pertama memberikan ucapan!
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — Theme Casual (Clean, Nature, Emerald)
   ═══════════════════════════════════════════════════════════════ */
export default function ThemeCasual({ eventData, guestName, isOpen, onOpen, navigate, id }) {
  let details = eventData?.eventDetails || eventData?.event_details || {};
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch (e) { details = {}; }
  }

  let profilesList = details.profiles || [];
  if (typeof profilesList === 'string') {
    try { profilesList = JSON.parse(profilesList); } catch (e) { profilesList = []; }
  }

  if (!Array.isArray(profilesList) || profilesList.length === 0) {
    profilesList = [{
      fullName: eventData?.title || "Tuan Rumah",
      role: "Penyelenggara",
      photoUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=500&auto=format&fit=crop"
    }];
  }

  const coverImg = eventData?.img || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000&auto=format&fit=crop";
  const sessions = Array.isArray(eventData?.sessions) ? eventData.sessions : [];
  
  // Tangkap Galeri (Mendukung array of images dari Supabase/Backend)
  const gallery = Array.isArray(details.galleryImages || details.gallery_images) ? (details.galleryImages || details.gallery_images) : [];
  const galleryCaptions = Array.isArray(details.galleryCaptions) ? details.galleryCaptions : ["Vibe Check", "Momen Manis", "Keseruan", "Chill Time", "Memories"];

  const gifts = Array.isArray(details.digitalGifts || details.digital_gifts) ? (details.digitalGifts || details.digital_gifts) : [];
  
  const heroDateText = sessions[0]?.date || eventData?.date_start || "TBA";
  const targetDate = eventData?.date_start || sessions[0]?.date || new Date(Date.now() + 864000000).toISOString();

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
    <div className="min-h-screen bg-casual-light text-slate-800 overflow-x-hidden font-sans selection:bg-emerald-500 selection:text-white">
      <CustomStyles />
      
      {/* 🔥 HERO / COVER 🔥 */}
      {!isOpen && (
        <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-slate-900">
          <div className="absolute inset-0 z-0">
            <img src={coverImg} alt="Event Cover" className="w-full h-full object-cover object-center opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" /> 
          </div>

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="relative z-10 w-full px-6 flex flex-col items-center mt-[-10vh]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mb-4 bg-white/20 backdrop-blur-md p-3 rounded-full border border-white/30 text-white">
              <Leaf className="w-6 h-6" />
            </motion.div>
            
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="text-center text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-4 tracking-tight text-white px-4 drop-shadow-lg">
              {eventData?.title || "Let's Get Together"}
            </motion.h1>
            
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className="text-base sm:text-lg text-emerald-100 font-medium tracking-wide mb-6 max-w-xl text-center italic drop-shadow-md">
              "{details.quote || "Merayakan momen spesial dengan santai dan penuh makna."}"
            </motion.p>
            
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="text-white text-sm font-bold tracking-widest mt-2 mb-12 bg-emerald-600/80 px-6 py-2 rounded-full backdrop-blur-sm shadow-xl border border-emerald-400">
              {heroDateText}
            </motion.p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="absolute bottom-20 md:bottom-28 left-0 right-0 z-20 flex flex-col items-center w-full px-6">
            <div className="text-center mb-6">
              <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-2 drop-shadow-md">Eksklusif Untuk</p>
              <p className="text-2xl text-white font-black tracking-wide drop-shadow-lg">{guestName}</p>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }} 
              onClick={onOpen} 
              className="px-8 py-4 bg-white hover:bg-emerald-50 text-emerald-700 text-sm font-bold uppercase tracking-widest rounded-full shadow-2xl transition-all duration-300 flex items-center gap-2"
            >
               Buka Undangan 💌
            </motion.button>
          </motion.div>
        </section>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

            {/* ─── OPENING ─── */}
            <section className="py-24 px-6 bg-casual-light">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto text-center">
                <Leaf className="w-8 h-8 text-emerald-400 mx-auto mb-6 opacity-60" />
                <h2 className="text-3xl sm:text-4xl font-bold text-slate-800 mb-6 tracking-tight">
                  Halo Semuanya!
                </h2>
                <div className="divider-casual w-12 mx-auto mb-8 opacity-70" />
                <p className="text-slate-600 leading-relaxed text-base sm:text-lg max-w-2xl mx-auto font-medium">
                  {details.openingMessage || "Sangat senang rasanya bisa mengundang kalian. Kosongkan jadwal dan pastikan hadir untuk merayakan momen seru ini bersama-sama!"}
                </p>
              </motion.div>
            </section>

            {/* ─── PROFILE (FOTO BULAT SEMPURNA & DESKRIPSI) ─── */}
            <section className="py-24 px-6 bg-casual-alt">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-5xl mx-auto text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-12 uppercase tracking-widest">Temui Tuan Rumah</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-auto-fit gap-8 justify-center items-start">
                  {profilesList.map((prof, idx) => {
                    const name = prof.fullName || prof.full_name || prof.name || "Nama Tidak Tersedia";
                    const role = prof.role || "Host";
                    const photo = prof.photoUrl || prof.photo_url || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=500&auto=format&fit=crop";
                    const description = prof.parentsInfo || prof.parents_info || prof.description || "";

                    return (
                      <motion.div 
                        key={idx}
                        initial={{ scale: 0.95, opacity: 0 }} 
                        whileInView={{ scale: 1, opacity: 1 }} 
                        viewport={{ once: true }} 
                        transition={{ duration: 0.5, delay: idx * 0.1 }} 
                        className="card-casual p-8 flex flex-col items-center hover:bg-white"
                      >
                        {/* 🔥 PERBAIKAN: aspect-square menjamin kotak, rounded-full membulatkan, object-cover agar gambar proporsional 🔥 */}
                        <div className="w-32 h-32 mb-5 rounded-full overflow-hidden border-4 border-emerald-100 shadow-md bg-white aspect-square shrink-0 flex items-center justify-center">
                          <img src={photo} alt={name} className="w-full h-full object-cover" />
                        </div>
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-3">
                          {role}
                        </span>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{name}</h3>
                        {description && (
                          <p className="text-sm text-slate-500 font-medium leading-relaxed mt-2 text-center">
                            {description}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            </section>

            {/* ─── COUNTDOWN ─── */}
            <section className="py-20 px-6 bg-slate-800 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "30px 30px" }}></div>
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative z-10 max-w-3xl mx-auto text-center">
                <h2 className="text-xl sm:text-2xl font-bold mb-10 text-emerald-300 tracking-wider">Momen Dimulai Dalam</h2>

                <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-2xl mx-auto">
                  {[{ label: "Hari", value: countdown.days }, { label: "Jam", value: countdown.hours }, { label: "Menit", value: countdown.minutes }, { label: "Detik", value: countdown.seconds }].map((item, i) => (
                    <div key={item.label} className="bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-6 rounded-2xl">
                      <p className="text-2xl sm:text-5xl font-bold text-white mb-2 font-mono">
                        {String(item.value).padStart(2, "0")}
                      </p>
                      <p className="text-[10px] sm:text-xs text-emerald-200 font-medium uppercase tracking-widest">{item.label}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* ─── EVENT DETAILS (MENAMPILKAN DESKRIPSI) ─── */}
            <section className="py-24 px-6 bg-casual-light">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2 tracking-widest">Detail & Lokasi</h2>
                  <p className="text-sm text-slate-500">Catat tanggal dan tempatnya agar tidak terlewat.</p>
                </div>
                
                <div className="space-y-6">
                  {sessions.map((session, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 * idx, duration: 0.5 }} className="card-casual p-8">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-gray-100 pb-5 mb-6">
                        <div className="max-w-xl">
                          <h3 className="text-xl font-bold text-emerald-700 tracking-wide">{session.name}</h3>
                          {/* 🔥 Binding Deskripsi Sesi 🔥 */}
                          {(session.description || session.desc) && (
                            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                              {session.description || session.desc}
                            </p>
                          )}
                        </div>
                        <span className="mt-4 sm:mt-0 inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-emerald-100 w-max shrink-0">
                          Sesi {idx + 1}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                        <div className="space-y-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                <CalendarDays className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="pt-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tanggal</p>
                              <p className="text-slate-800 font-semibold text-base">{session.date}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div className="pt-1">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Waktu</p>
                              <p className="text-slate-800 font-semibold text-base">{session.start_time || session.startTime} - {session.end_time || session.endTime}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-4">
                           <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                              <MapPin className="w-5 h-5 text-emerald-500" />
                           </div>
                           <div className="pt-1">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lokasi</p>
                             <p className="text-slate-800 font-bold mb-1 text-base">{session.name_place || session.location?.namePlace || "Venue Utama"}</p>
                             <p className="text-slate-500 leading-relaxed mt-2">{session.place || session.location?.place}</p>
                             
                             {(session.map_url || session.location?.mapUrl) && (
                               <a href={session.map_url || session.location?.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-full hover:bg-emerald-600 transition-colors shadow-md">
                                 <ExternalLink className="w-4 h-4" /> Buka di Maps
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

            {/* ─── GALLERY (GALERI FOTO OTOMATIS) ─── */}
            {gallery && gallery.length > 0 && (
              <section className="py-24 px-6 bg-casual-alt">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-4xl mx-auto text-center">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-10 tracking-widest">Sneak Peek / Galeri</h2>

                  <div className="relative overflow-hidden rounded-[2rem] shadow-xl border-4 border-white bg-white">
                    <AnimatePresence mode="wait">
                      {gallery[current] && (
                        <motion.img key={current} src={gallery[current]} alt={`Gallery ${current + 1}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="w-full h-80 sm:h-[500px] object-cover" />
                      )}
                    </AnimatePresence>
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent pt-20 pb-8 px-6 text-center">
                       {galleryCaptions && galleryCaptions.length > 0 && (
                         <p className="text-white font-medium text-sm sm:text-base italic">"{galleryCaptions[current % galleryCaptions.length]}"</p>
                       )}
                    </div>

                    <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition text-slate-800"><ChevronLeft className="w-6 h-6" /></button>
                    <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition text-slate-800"><ChevronRight className="w-6 h-6" /></button>
                  </div>

                  <div className="flex justify-center gap-2 mt-6">
                    {gallery.map((_, i) => (
                      <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all duration-300 ${i === current ? "bg-emerald-500 w-8" : "bg-emerald-200 w-2 hover:bg-emerald-400"}`} />
                    ))}
                  </div>
                </motion.div>
              </section>
            )}

            {/* ─── RSVP & MESSAGES ─── */}
            <section className="py-24 px-6 bg-casual-light">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Send className="w-7 h-7 ml-1" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 tracking-widest">RSVP Kehadiran</h2>
                <p className="text-sm text-slate-500 font-medium mb-10 max-w-md mx-auto">Tolong isi form di bawah ini agar kami bisa menyiapkan yang terbaik untukmu.</p>

                <div className="card-casual p-8 mb-12">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">Formulir Konfirmasi</h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">Pastikan kamu mengisi data dengan benar ya!</p>
                  <button onClick={() => navigate(`/party-rsvp/${id}`)} className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 text-white font-bold text-sm tracking-widest uppercase rounded-2xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200">
                    Isi Formulir RSVP
                  </button>
                </div>

                <div className="pt-8 border-t border-gray-200">
                   <h3 className="text-lg font-bold text-slate-800">Papan Ucapan</h3>
                   <GuestMessagesCasual greetings={eventData?.greetings} />
                </div>
              </motion.div>
            </section>

            {/* ─── DIGITAL GIFTS / SUPPORT ─── */}
            {gifts.length > 0 && (
              <section className="py-24 px-6 bg-casual-alt">
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-2xl mx-auto text-center">
                  <div className="w-16 h-16 bg-white text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <CreditCard className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3 tracking-widest">Digital Gift</h2>
                  <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed max-w-lg mx-auto">
                    Kehadiranmu adalah hadiah terbaik. Namun jika ingin memberikan lebih, silakan melalui rekening di bawah ini:
                  </p>

                  <div className="space-y-4 text-left">
                    {gifts.map((acc, idx) => (
                      <div key={idx} className="card-casual p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-l-4 border-l-emerald-400">
                        <div>
                          <p className="text-xs text-emerald-600 font-black uppercase tracking-widest mb-1">{acc.bankName || acc.bank_name}</p>
                          <p className="text-slate-800 font-bold mb-1">{acc.accountName || acc.account_name}</p>
                          <p className="text-xl font-mono text-slate-600 tracking-wider">{acc.accountNumber || acc.account_number}</p>
                        </div>
                        <button onClick={() => copyNumber(acc.accountNumber || acc.account_number, idx)} className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${copied === idx ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                          {copied === idx ? <><Check className="w-4 h-4" /> Tersalin</> : <><Copy className="w-4 h-4" /> Salin Rekening</>}
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </section>
            )}

            {/* ─── CLOSING ─── */}
            <section className="py-32 px-6 bg-slate-900 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}></div>
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="relative z-10 max-w-2xl mx-auto">
                <Leaf className="w-8 h-8 text-emerald-500 mx-auto mb-6" />
                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-6 tracking-wide">
                  Sampai Jumpa Nanti!
                </h2>
                <p className="text-emerald-100/80 font-medium leading-relaxed text-base mb-12 max-w-lg mx-auto italic">
                  "{details.closingMessage || details.closing_message || "Kehadiranmu sangat berarti. Jangan sampai kelewatan momen seru ini ya!"}"
                </p>
                
                <div className="inline-block mt-4">
                  <p className="text-xs text-emerald-400 uppercase font-bold tracking-widest mb-2">Cheers,</p>
                  <p className="text-2xl font-bold text-white tracking-wide">
                    {profilesList[0]?.fullName || profilesList[0]?.full_name || profilesList[0]?.name || eventData?.title || "Tuan Rumah"}
                  </p>
                </div>
              </motion.div>
            </section>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
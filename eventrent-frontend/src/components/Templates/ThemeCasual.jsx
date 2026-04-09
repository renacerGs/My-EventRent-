import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays, Clock, MapPin, ExternalLink, Gift, Copy, Check, Send,
  ChevronLeft, ChevronRight, Heart, Leaf, Sun, Camera, Star
} from "lucide-react";

/* ─── CUSTOM ANIMATIONS & WARM STYLES ─── */
const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes sway { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
    .animate-sway { animation: sway 3s ease-in-out infinite; }
    @keyframes gentle-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5%); } }
    .animate-gentle-bounce { animation: gentle-bounce 2s ease-in-out infinite; }
    
    .text-gradient-warm { 
      background: linear-gradient(to right, #ea580c, #f59e0b); 
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent; 
    }
    .divider-floral { height: 2px; background: linear-gradient(to right, transparent, #f59e0b, transparent); }
    
    /* Custom Background Colors */
    .bg-background { background-color: #fafaf9; }
    .bg-warm-glow { background-color: #fefce8; }
    .bg-soft-pattern { background-color: #fffbeb; background-image: radial-gradient(#fde68a 1px, transparent 1px); background-size: 20px 20px; }
    .bg-warm-section { background-color: #fff7ed; }
    
    .card-casual { background-color: rgba(255, 255, 255, 0.9); backdrop-filter: blur(8px); border-radius: 1.5rem; border: 1px solid #fef08a; box-shadow: 0 10px 30px rgba(251, 191, 36, 0.1); }
    .shadow-warm { box-shadow: 0 10px 25px rgba(251, 191, 36, 0.2); }
    .shadow-soft { box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); }

    /* Shadow yang lebih tebel biar tulisan makin terang/terbaca */
    .text-shadow-elegant { text-shadow: 0px 4px 15px rgba(0,0,0,0.8), 0px 2px 5px rgba(0,0,0,0.5); }
    .text-shadow-sm { text-shadow: 0px 2px 6px rgba(0,0,0,0.7); }
  `}} />
);

/* ─── Floating Emoji ─── */
const FloatingEmoji = ({ emoji, left, delay }) => (
  <motion.div
    className="absolute text-xl sm:text-2xl pointer-events-none opacity-40 z-10"
    style={{ left }}
    initial={{ y: "110vh" }}
    animate={{ y: "-10vh" }}
    transition={{ delay, duration: 15, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
  >
    <div className="animate-sway" style={{ animationDelay: `${delay}s` }}>{emoji}</div>
  </motion.div>
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

/* 🔥 KOMPONEN DAFTAR UCAPAN TAMU 🔥 */
const DaftarUcapanTamuCasual = ({ greetings }) => {
  const safeGreetings = Array.isArray(greetings) ? greetings : [];
  const daftarUcapan = safeGreetings
    .map((item, index) => ({
      id: item.id || index,
      nama: item.name || item.attendee_name || "Kerabat",
      pesan: item.greeting || item.pesan || ""
    }))
    .filter(item => item.pesan.trim() !== "");

  return (
    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-transparent text-left">
      {daftarUcapan.length > 0 ? (
        daftarUcapan.map((item) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            key={item.id} 
            className="card-casual p-6 text-left border border-amber-100/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <Heart className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="font-bold text-sm text-amber-600">{item.nama}</p>
            </div>
            <p className="text-sm text-stone-500 pl-10 leading-relaxed font-medium">{item.pesan}</p>
          </motion.div>
        ))
      ) : (
        <div className="text-center text-stone-400 italic card-casual p-6 shadow-sm">
          Belum ada ucapan hangat. Jadilah yang pertama memberikan pesan! ✨
        </div>
      )}
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — Theme Casual 
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

  const coverImg = eventData?.img || "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1000&auto=format&fit=crop";
  const profile = profilesList[0] || {};
  
  // Nama Host (dimunculin lagi biar ga error)
  const hostName = profile.fullName || profile.full_name || eventData?.title || "Keluarga Besar";
  
  // Format Nama Host untuk tampilan split di hero
  const splitName = String(hostName).split(' ');
  const firstName = splitName[0];
  const restName = splitName.slice(1).join(' ') || "Gathering";

  const hostPhoto = profile.photoUrl || profile.photo_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Casual";
  const parentsInfo = profile.parentsInfo || profile.parents_info || "";

  // PENGAMAN ARRAY: Pastikan data list berupa Array biar ga error .map()
  const sessions = Array.isArray(eventData?.sessions) ? eventData.sessions : [];
  const gallery = Array.isArray(details.galleryImages || details.gallery_images) ? (details.galleryImages || details.gallery_images) : [];
  const gifts = Array.isArray(details.digitalGifts || details.digital_gifts) ? (details.digitalGifts || details.digital_gifts) : [];
  
  const heroDateText = sessions[0]?.date || eventData?.date_start || "20 • 12 • 2026";
  const targetDate = eventData?.date_start || sessions[0]?.date || new Date(Date.now() + 864000000).toISOString();

  const defaultCaptions = ["Sore yang indah bersama 🌅", "Tawa & kebersamaan 😄", "Momen berharga ✨", "Garden vibes 🌿", "Memories to keep 💛"];
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
    <div className="min-h-screen bg-stone-50 text-stone-800 overflow-x-hidden font-sans selection:bg-amber-400 selection:text-white">
      <CustomStyles />
      
      {/* 🔥 HERO / COVER 🔥 */}
      {!isOpen && (
        <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img src={coverImg} alt="Casual event" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-black/30" /> {/* Dibuat sedikit lebih gelap biar tulisan terang makin mencolok */}
            <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-stone-100 via-stone-100/60 to-transparent" />
          </div>

          <FloatingEmoji emoji="🌸" left="8%" delay={0} />
          <FloatingEmoji emoji="🍃" left="88%" delay={3} />
          <FloatingEmoji emoji="🌻" left="18%" delay={6} />

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }} className="relative z-10 w-full px-6 flex flex-col items-center mt-[-10vh]">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 150 }} className="text-4xl mb-2 drop-shadow-md">
              🌿
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-white text-sm font-extrabold uppercase tracking-[0.3em] mb-4 text-shadow-sm">
              You're Invited
            </motion.p>
            
            {/* 🔥 FONT DIBIKIN TERANG DAN MENCALOK 🔥 */}
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }} className="text-center font-display text-6xl sm:text-7xl lg:text-8xl font-black leading-tight mb-2 tracking-tight">
              <span className="text-white text-shadow-elegant block mb-1">{firstName}</span>
              <span className="text-[#FBBF24] text-shadow-elegant block">{restName}</span> 
            </motion.h1>
            
            <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.9, duration: 0.6 }} className="w-24 h-[2px] bg-gradient-to-r from-transparent via-[#FBBF24] to-transparent my-4 opacity-80" />
            
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-xl sm:text-2xl text-white font-serif font-semibold italic text-shadow-sm mb-2">
              Celebrate life's little moments
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="text-white text-sm font-extrabold tracking-[0.2em] mb-12 text-shadow-sm">
              {heroDateText}
            </motion.p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }} className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center w-full px-6">
            
            {/* 🔥 BAGIAN KEPADA YTH DIPERJELAS PAKE BACKGROUND GLASSMORPHISM 🔥 */}
            <div className="text-center mb-6 bg-white/70 backdrop-blur-sm py-3 px-8 rounded-2xl shadow-sm border border-white/50">
              <p className="text-stone-500 text-[10px] font-extrabold uppercase tracking-[0.2em] mb-1">Kepada Yth.</p>
              <p className="text-xl text-stone-800 font-black">{guestName}</p>
            </div>
            
            {/* 🔥 TOMBOL DIBIKIN IJO SAGE 🔥 */}
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onOpen} className="px-10 py-4 bg-[#9CA68E] hover:bg-[#8b957e] text-white text-sm font-extrabold uppercase tracking-wider rounded-full shadow-lg shadow-[#9CA68E]/40 transition-all duration-300 flex items-center gap-2 border border-[#8b957e]/50">
              <span className="text-lg">🌸</span> Buka Undangan
            </motion.button>
          </motion.div>
        </section>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

            {/* ─── OPENING ─── */}
            <section className="py-24 px-6 bg-warm-glow">
              <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-2xl mx-auto text-center">
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 200 }} className="text-5xl mb-4 inline-block">🌻</motion.div>
                <h2 className="text-3xl sm:text-4xl font-black text-stone-800 mb-3">
                  Hai, Selamat Datang! <span className="text-gradient-warm">🎉</span>
                </h2>
                <div className="divider-floral w-28 mx-auto mb-6" />
                <p className="text-stone-500 font-medium leading-relaxed text-base sm:text-lg max-w-md mx-auto">
                  {details.openingMessage || "Terima kasih sudah membuka undangan ini. Kehadiranmu akan sangat berarti di hari spesial kami 💛"}
                </p>
              </motion.div>
            </section>

            {/* ─── PROFILE ─── */}
            <section className="py-24 px-6 bg-soft-pattern">
              <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-md mx-auto text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-amber-500 mb-2 font-bold">The Celebrant</p>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-800 mb-1 uppercase tracking-widest">Tuan Rumah</h2>
                <div className="divider-floral w-20 mx-auto mb-10" />

                <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 100 }} className="card-casual p-8 sm:p-10">
                  <div className="relative w-36 h-36 mx-auto mb-6">
                    <motion.div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-300 opacity-40 blur-sm" animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} />
                    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-warm">
                      <img src={hostPhoto} alt={hostName} className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <h3 className="text-3xl font-black text-gradient-warm mb-1 uppercase tracking-wider">{hostName}</h3>
                  <p className="text-xl text-stone-400 mb-4 font-serif italic">~ Warming the hearts ~</p>
                  {parentsInfo && <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mb-4">{parentsInfo}</p>}

                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {["Nature 🌿", "Good Food 🍰", "Family 💛"].map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold uppercase tracking-wider rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </section>

            {/* ─── COUNTDOWN ─── */}
            <section className="py-20 px-6 bg-warm-section">
              <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-lg mx-auto text-center">
                <p className="text-xl text-amber-500 mb-2 font-serif italic">Menuju Hari Bahagia ⏳</p>
                <h2 className="text-2xl font-black text-stone-800 mb-8 uppercase tracking-widest">Hitung Mundur</h2>

                <div className="grid grid-cols-4 gap-3">
                  {[{ label: "Hari", value: countdown.days }, { label: "Jam", value: countdown.hours }, { label: "Menit", value: countdown.minutes }, { label: "Detik", value: countdown.seconds }].map((item, i) => (
                    <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card-casual p-4">
                      <motion.p initial={{ scale: 1.2, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl sm:text-4xl font-black text-gradient-warm">
                        {String(item.value).padStart(2, "0")}
                      </motion.p>
                      <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">{item.label}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* ─── EVENT DETAILS ─── */}
            <section className="py-24 px-6 bg-warm-glow">
              <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-2xl mx-auto text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-stone-400 font-bold mb-2">Save The Date</p>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-800 mb-1 uppercase tracking-widest">Kapan & Dimana</h2>
                <div className="divider-floral w-24 mx-auto mb-12" />

                <div className="space-y-6">
                  {sessions.map((session, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.7 }} className="card-casual p-8 sm:p-10">
                      <motion.p animate={{ y: [0, -5, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl mb-4 inline-block">{session.emoji || "🌿"}</motion.p>
                      <h3 className="text-2xl text-amber-600 font-black mb-8 uppercase tracking-widest">{session.name}</h3>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-center gap-3 bg-stone-50 rounded-xl py-3 px-5 border border-stone-100">
                          <CalendarDays className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          <span className="text-stone-600 font-medium">{session.date}</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 bg-stone-50 rounded-xl py-3 px-5 border border-stone-100">
                          <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
                          <span className="text-stone-600 font-medium">{session.start_time || session.startTime} - {session.end_time || session.endTime}</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 bg-stone-50 rounded-xl py-3 px-5 border border-stone-100">
                          <MapPin className="w-4 h-4 text-red-400 flex-shrink-0" />
                          <span className="text-stone-600 font-medium">{session.name_place || session.location?.namePlace || session.place || session.location?.place}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-center gap-2 mt-7">
                        {session.highlights && Array.isArray(session.highlights) && session.highlights.map((h, i) => (
                          <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.1 }} className="px-4 py-2 bg-amber-50 border border-amber-100 text-amber-600 text-xs font-bold uppercase rounded-full">
                            {h}
                          </motion.span>
                        ))}
                      </div>

                      <motion.a href={session.map_url || session.location?.mapUrl || "#"} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-flex items-center gap-2 mt-8 px-8 py-3 bg-[#EE7354] text-white text-xs font-black uppercase tracking-wider rounded-full shadow-warm hover:bg-[#d66549] transition-all duration-300">
                        <ExternalLink className="w-3.5 h-3.5" /> Lihat Lokasi
                      </motion.a>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-center gap-6 mt-14">
                  {[{ icon: Leaf, label: "Outdoor" }, { icon: Sun, label: "Sore Hari" }, { icon: Camera, label: "Photos" }, { icon: Heart, label: "Love" }].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 + i * 0.1 }} whileHover={{ y: -5 }} className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-xl bg-white border border-stone-100 flex items-center justify-center shadow-soft">
                        <item.icon className="w-6 h-6 text-amber-500" />
                      </div>
                      <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* ─── GALLERY ─── */}
            {gallery && gallery.length > 0 && (
              <section className="py-24 px-6 bg-soft-pattern">
                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-2xl mx-auto text-center">
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-stone-400 mb-2">Gallery</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-800 mb-2 uppercase tracking-widest">Momen Indah 📸</h2>
                  <div className="divider-floral w-20 mx-auto mb-10" />

                  <div className="relative overflow-hidden rounded-3xl shadow-warm border-4 border-white bg-white">
                    <AnimatePresence mode="wait">
                      {gallery[current] && (
                        <motion.img key={current} src={gallery[current]} alt={`Gallery ${current + 1}`} initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.5 }} className="w-full h-72 sm:h-96 object-cover" />
                      )}
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 via-transparent to-transparent pointer-events-none" />

                    <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition shadow-soft"><ChevronLeft className="w-5 h-5 text-stone-700" /></button>
                    <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition shadow-soft"><ChevronRight className="w-5 h-5 text-stone-700" /></button>
                    
                    <div className="absolute bottom-4 right-4 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full text-xs font-bold text-stone-600 shadow-sm">
                      {current + 1} / {gallery.length}
                    </div>
                  </div>

                  {galleryCaptions && galleryCaptions.length > 0 && (
                    <p className="text-xl text-amber-600 mt-5 italic font-serif">{galleryCaptions[current % galleryCaptions.length]}</p>
                  )}

                  <div className="flex justify-center gap-2 mt-5">
                    {gallery.map((_, i) => (
                      <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all duration-300 ${i === current ? "bg-amber-500 w-10" : "bg-stone-300 w-3 hover:bg-amber-300"}`} />
                    ))}
                  </div>
                </motion.div>
              </section>
            )}

            {/* ─── RSVP & WISHES ─── */}
            <section className="py-24 px-6 bg-warm-section">
              <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-lg mx-auto text-center">
                <p className="text-4xl mb-2">💌</p>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-800 mb-1 uppercase tracking-widest">Kehadiran & Doa</h2>
                <p className="text-sm text-stone-500 font-medium mb-8">Mohon konfirmasi kehadiran Anda agar kami dapat mempersiapkan acara dengan baik 💛</p>

                <div className="card-casual p-8 mb-10 text-center">
                  <h3 className="text-xl font-black text-amber-600 mb-3">RSVP Sekarang</h3>
                  <p className="text-xs text-stone-400 font-medium mb-6">Bantu kami mencatat kehadiran Anda melalui form di bawah ini.</p>
                  <button onClick={() => navigate(`/party-rsvp/${id}`)} className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-black text-sm tracking-widest uppercase rounded-xl shadow-warm hover:opacity-90 transition-all">
                    <Send className="w-5 h-5" /> Isi Form RSVP
                  </button>
                </div>

                <DaftarUcapanTamuCasual greetings={eventData?.greetings} />

              </motion.div>
            </section>

            {/* ─── GIFT ─── */}
            {gifts.length > 0 && (
              <section className="py-24 px-6 bg-warm-glow">
                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-lg mx-auto text-center">
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl mb-3 inline-block">🎁</motion.div>
                  <h2 className="text-2xl sm:text-3xl font-black text-stone-800 mb-2 uppercase tracking-widest">Kirim Hadiah</h2>
                  <p className="text-sm text-stone-500 font-medium mb-10">Kehadiranmu adalah hadiah terindah 💛<br />Tapi kalau mau kasih lebih... 😊</p>

                  <div className="space-y-5">
                    {gifts.map((acc, idx) => (
                      <div key={idx} className="card-casual p-7 border-2 border-white">
                        <p className="text-3xl mb-2">{idx % 2 === 0 ? "💳" : "📱"}</p>
                        <p className="text-xs text-amber-500 font-black uppercase tracking-wider mb-1">{acc.bankName || acc.bank_name}</p>
                        <p className="text-stone-600 text-sm mb-4 font-bold">{acc.accountName || acc.account_name}</p>
                        <div className="flex items-center justify-center gap-3 bg-stone-50 border border-stone-100 rounded-xl py-3 px-5">
                          <span className="text-lg text-stone-800 font-black tracking-wider">{acc.accountNumber || acc.account_number}</span>
                          <motion.button onClick={() => copyNumber(acc.accountNumber || acc.account_number, idx)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 hover:bg-amber-50 transition rounded-lg">
                            {copied === idx ? <Check className="w-5 h-5 text-amber-500" /> : <Copy className="w-5 h-5 text-stone-400" />}
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </section>
            )}

            {/* ─── CLOSING ─── */}
            <section className="py-24 px-6 bg-soft-pattern text-center relative overflow-hidden">
              <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="max-w-lg mx-auto relative z-10">
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 200 }} className="text-5xl mb-5 inline-block">🌸</motion.div>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-800 mb-4 uppercase tracking-widest">
                  Sampai Jumpa <span className="text-amber-500">Nanti!</span>
                </h2>
                <div className="divider-floral w-24 mx-auto mb-6" />
                <p className="text-stone-500 font-medium leading-relaxed text-base mb-8 max-w-md mx-auto">
                  {details.closingMessage || details.closing_message || "Kehadiranmu akan membuat hari ini semakin spesial. Terima kasih dari lubuk hati terdalam 💛🌿"}
                </p>
                
                <motion.div initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ type: "spring" }} className="card-casual p-8 inline-block bg-white/90">
                  <p className="text-xs text-stone-400 uppercase font-bold tracking-widest mb-2">Dengan Cinta</p>
                  <p className="text-4xl font-black text-gradient-warm mb-2 uppercase">{hostName}</p>
                  <p className="text-sm text-stone-400 font-bold">💛🌿🌸</p>
                </motion.div>

                <div className="divider-floral w-16 mx-auto mt-10 mb-4" />
                <p className="text-xs text-stone-400 font-bold tracking-widest uppercase">
                  Gathering & Reunion
                </p>

                <motion.div className="mt-8 text-2xl" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity }}>
                  🌸🌿💛☀️✨🌻
                </motion.div>
              </motion.div>
            </section>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
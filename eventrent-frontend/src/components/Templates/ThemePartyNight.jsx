import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays, Clock, MapPin, ExternalLink, Gift, Copy, Check, Send,
  ChevronLeft, ChevronRight, Star, Music, Sparkles, Wine, Disc3,
} from "lucide-react";

/* ─── CUSTOM ANIMATIONS & NEON STYLES ─── */
const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
    .animate-float { animation: float 4s ease-in-out infinite; }
    
    .text-gradient-neon { 
      background: linear-gradient(to right, #c084fc, #e879f9); 
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent; 
    }
    .divider-neon { height: 2px; background: linear-gradient(to right, transparent, #c084fc, transparent); }
    .glow-purple { box-shadow: 0 0 20px rgba(192, 132, 252, 0.4); }
    .card-night { background-color: rgba(24, 24, 27, 0.7); backdrop-filter: blur(12px); border-radius: 1.5rem; }
    .neon-border { border: 1px solid rgba(192, 132, 252, 0.3); box-shadow: 0 0 15px rgba(192, 132, 252, 0.1); }
  `}} />
);

/* ─── Sparkle Particle ─── */
const SparkleParticle = ({ delay, left }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full bg-purple-400"
    style={{ left, top: `${Math.random() * 100}%` }}
    animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
    transition={{ delay, duration: 2 + Math.random() * 2, repeat: Infinity, repeatDelay: Math.random() * 4 }}
  />
);

/* ─── Floating Glow ─── */
const FloatingGlow = ({ emoji, left, delay }) => (
  <motion.div
    className="absolute text-2xl sm:text-3xl pointer-events-none opacity-60 z-10"
    style={{ left }}
    initial={{ y: "110vh" }}
    animate={{ y: "-10vh" }}
    transition={{ delay, duration: 12, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
  >
    <div className="animate-float" style={{ animationDelay: `${delay}s` }}>{emoji}</div>
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

/* 🔥 KOMPONEN DAFTAR UCAPAN TAMU (Versi Neon Night) 🔥 */
const DaftarUcapanTamuNight = ({ greetings }) => {
  const daftarUcapan = (greetings || [])
    .map((item, index) => ({
      id: item.id || index,
      nama: item.name || item.attendee_name || "Guest",
      pesan: item.greeting || item.pesan || ""
    }))
    .filter(item => item.pesan.trim() !== "");

  return (
    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-transparent text-left">
      {daftarUcapan.length > 0 ? (
        daftarUcapan.map((item) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }}
            key={item.id} 
            className="card-night p-5 text-left border border-zinc-800"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center border border-purple-500/30">
                <Star className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <p className="font-bold text-sm text-purple-400">{item.nama}</p>
            </div>
            <p className="text-sm text-zinc-400 pl-10 leading-relaxed">{item.pesan}</p>
          </motion.div>
        ))
      ) : (
        <div className="text-center text-zinc-500 italic card-night neon-border p-6 shadow-sm">
          Belum ada ucapan. Jadilah yang pertama memberikan doa! ✨
        </div>
      )}
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — Theme Party Night (Dynamic)
   ═══════════════════════════════════════════════════════════════ */
export default function ThemePartyNight({ eventData, guestName, isOpen, onOpen, navigate, id }) {
  let details = eventData?.eventDetails || eventData?.event_details || {};
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch (e) { details = {}; }
  }

  let profilesList = details.profiles || [];
  if (typeof profilesList === 'string') {
    try { profilesList = JSON.parse(profilesList); } catch (e) { profilesList = []; }
  }

  const coverImg = eventData?.img || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000&auto=format&fit=crop";
  const profile = profilesList[0] || {};
  const hostName = profile.fullName || profile.full_name || eventData?.title || "VIP Host";
  const hostPhoto = profile.photoUrl || profile.photo_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Night";
  const parentsInfo = profile.parentsInfo || profile.parents_info || "";

  const sessions = eventData?.sessions || [];
  const gallery = details.galleryImages || details.gallery_images || [];
  const gifts = details.digitalGifts || details.digital_gifts || [];
  const targetDate = eventData?.date_start || sessions[0]?.date || new Date(Date.now() + 864000000).toISOString();

  const defaultCaptions = ["Dance floor vibes 💃🕺", "Cheers to us! 🥂", "The beat drops here 🎵", "VIP only ✨", "Squad goals 📸"];
  const galleryCaptions = details.galleryCaptions?.length > 0 ? details.galleryCaptions : defaultCaptions;

  const countdown = useCountdown(targetDate);
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c === 0 ? gallery.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === gallery.length - 1 ? 0 : c + 1));

  const [copied, setCopied] = useState(null);
  const copyNumber = (num, idx) => {
    navigator.clipboard.writeText(num);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 overflow-x-hidden font-sans selection:bg-purple-500 selection:text-white">
      <CustomStyles />
      
      {/* ═══ HERO / COVER ═══ */}
      {!isOpen && (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            {/* 👇 SABUK PENGAMAN GAMBAR 1 👇 */}
            <img 
              src={coverImg} 
              alt="Party Night" 
              className="w-full h-full object-cover opacity-60" 
              onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1000&auto=format&fit=crop"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-[#09090b]" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-fuchsia-900/20" />
          </div>

          {Array.from({ length: 20 }).map((_, i) => (
            <SparkleParticle key={i} delay={i * 0.5} left={`${Math.random() * 100}%`} />
          ))}
          <FloatingGlow emoji="✨" left="5%" delay={0} />
          <FloatingGlow emoji="🪩" left="85%" delay={3} />
          <FloatingGlow emoji="💫" left="15%" delay={6} />
          <FloatingGlow emoji="⭐" left="80%" delay={1.5} />

          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: "easeOut" }} className="relative z-10 text-center px-6 max-w-lg">
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3, type: "spring" }} className="text-7xl sm:text-8xl mb-6 inline-block">
              <motion.span animate={{ rotateY: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="inline-block">🪩</motion.span>
            </motion.div>

            <motion.p initial={{ opacity: 0, letterSpacing: "0em" }} animate={{ opacity: 1, letterSpacing: "0.4em" }} transition={{ delay: 0.6, duration: 0.8 }} className="font-bold text-zinc-400 uppercase text-xs mb-4 tracking-[0.4em]">
              You're Invited To
            </motion.p>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.8 }} className="text-5xl sm:text-6xl font-black mb-2 leading-tight uppercase tracking-tight">
              <span className="text-gradient-neon">{hostName}'s</span><br />
              <span className="text-white">Party Night</span>
            </motion.h1>

            <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 1.1, duration: 0.6 }} className="divider-neon w-32 mx-auto my-5" />

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="text-2xl sm:text-3xl text-fuchsia-400 mb-2 italic font-serif">
              One night, endless memories
            </motion.p>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }} className="text-zinc-500 text-sm mb-4 font-bold tracking-widest uppercase">
              {eventData?.title}
            </motion.p>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }} className="mb-10 bg-black/50 py-3 px-6 rounded-2xl border border-white/10 inline-block backdrop-blur-sm">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1">Untuk</p>
              <p className="text-lg text-white font-semibold">Teman & Sahabat Tersayang 💜</p>
            </motion.div>

            <motion.button initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.7 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onOpen} className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-purple-600 text-white text-sm font-bold uppercase tracking-widest rounded-full glow-purple transition-all duration-300">
              ✨ Enter Party
            </motion.button>
          </motion.div>
        </section>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>

            {/* ─── OPENING ─── */}
            <section className="relative py-24 px-6 bg-[#09090b] overflow-hidden">
              {Array.from({ length: 8 }).map((_, i) => <SparkleParticle key={i} delay={i * 0.7} left={`${10 + i * 12}%`} />)}
              <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }} className="max-w-2xl mx-auto text-center relative z-10">
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring" }} className="text-6xl mb-5 inline-block">🎉</motion.div>
                <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 uppercase tracking-wide">
                  Get Ready to <span className="text-gradient-neon">Party!</span>
                </h2>
                <div className="divider-neon w-28 mx-auto mb-6" />
                <p className="text-zinc-400 leading-relaxed text-base sm:text-lg max-w-md mx-auto">
                  {details.openingMessage || "Malam spesial ini cuma datang sekali. Dress up, show up, dan let's make it a night to remember! 🌙✨"}
                </p>
              </motion.div>
            </section>

            {/* ─── PROFILE ─── */}
            <section className="py-24 px-6 bg-[#0f0f13]">
              <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-purple-400 mb-2 font-bold">The Star of the Night</p>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 uppercase tracking-wide">VIP Host</h2>
                <div className="divider-neon w-20 mx-auto mb-10" />

                <motion.div initial={{ scale: 0.85, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ type: "spring" }} className="card-night p-8 sm:p-10 neon-border">
                  <div className="relative w-36 h-36 mx-auto mb-6">
                    <motion.div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 opacity-60 blur-md" animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }} />
                    <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-purple-500/50">
                      {/* 👇 SABUK PENGAMAN GAMBAR 2 👇 */}
                      <img 
                        src={hostPhoto} 
                        alt={hostName} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Night"; }}
                      />
                    </div>
                    <motion.div className="absolute -top-1 -right-1 text-2xl" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}>👑</motion.div>
                  </div>

                  <h3 className="text-3xl font-black text-gradient-neon mb-1 tracking-wide uppercase">{hostName}</h3>
                  <p className="text-xl text-fuchsia-400 mb-4 italic font-serif">~ Birthday Star ~</p>
                  {parentsInfo && <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-4">{parentsInfo}</p>}
                  
                  <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {["Glam ✨", "Music Lover 🎵", "Night Owl 🦉"].map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-semibold rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            </section>

            {/* ─── COUNTDOWN ─── */}
            <section className="py-20 px-6 bg-[#09090b]">
              <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-lg mx-auto text-center">
                <p className="text-xl text-fuchsia-400 mb-2 italic font-serif">The Night Awaits ⏳</p>
                <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-widest">Hitung Mundur</h2>
                <div className="grid grid-cols-4 gap-3">
                  {[{ label: "Hari", value: countdown.days }, { label: "Jam", value: countdown.hours }, { label: "Menit", value: countdown.minutes }, { label: "Detik", value: countdown.seconds }].map((item, i) => (
                    <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card-night neon-border p-4 text-center">
                      <motion.p initial={{ scale: 1.3, opacity: 0.5 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl sm:text-4xl font-black text-gradient-neon">
                        {String(item.value).padStart(2, "0")}
                      </motion.p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2 font-bold">{item.label}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* ─── EVENT DETAILS ─── */}
            <section className="py-24 px-6 bg-[#0f0f13]">
              <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
                <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-400 mb-2 font-bold">Save The Date</p>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 uppercase tracking-widest">Kapan & Dimana</h2>
                <div className="divider-neon w-24 mx-auto mb-12" />

                <div className="space-y-6">
                  {sessions.map((session, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card-night neon-border p-8 sm:p-10">
                      <motion.p animate={{ rotateY: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="text-5xl mb-4 inline-block">{session.emoji || "🪩"}</motion.p>
                      <h3 className="text-2xl text-gradient-neon font-black mb-8 uppercase tracking-widest">{session.name}</h3>

                      <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-center gap-3 bg-zinc-900/50 rounded-xl py-3 px-5 border border-white/5">
                          <CalendarDays className="w-4 h-4 text-purple-400 flex-shrink-0" />
                          <span className="text-zinc-300 font-medium">{session.date}</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 bg-zinc-900/50 rounded-xl py-3 px-5 border border-white/5">
                          <Clock className="w-4 h-4 text-fuchsia-400 flex-shrink-0" />
                          <span className="text-zinc-300 font-medium">{session.start_time || session.startTime} - {session.end_time || session.endTime}</span>
                        </div>
                        <div className="flex items-center justify-center gap-3 bg-zinc-900/50 rounded-xl py-3 px-5 border border-white/5">
                          <MapPin className="w-4 h-4 text-pink-400 flex-shrink-0" />
                          <span className="text-zinc-300 font-medium">{session.name_place || session.location?.namePlace || session.place || session.location?.place}</span>
                        </div>
                      </div>

                      <motion.a href={session.map_url || session.location?.mapUrl || "#"} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(192, 132, 252, 0.3)" }} whileTap={{ scale: 0.95 }} className="inline-flex items-center gap-2 mt-8 px-8 py-3 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-xs font-bold uppercase tracking-wider rounded-full glow-purple transition-all">
                        <ExternalLink className="w-3.5 h-3.5" /> Lihat Lokasi
                      </motion.a>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-center gap-6 mt-14">
                  {[{ icon: Disc3, label: "DJ" }, { icon: Wine, label: "Drinks" }, { icon: Music, label: "Music" }, { icon: Sparkles, label: "VIP" }].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1 }} className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-xl card-night neon-border flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* ─── GALLERY ─── */}
            {gallery.length > 0 && (
              <section className="py-24 px-6 bg-[#09090b]">
                <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-fuchsia-400 mb-2 font-bold">Gallery</p>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 uppercase tracking-widest">Sneak Peek 📸</h2>
                  <div className="divider-neon w-20 mx-auto mb-10" />

                  <div className="relative overflow-hidden rounded-2xl neon-border">
                    <AnimatePresence mode="wait">
                      {/* 👇 SABUK PENGAMAN GAMBAR 3 👇 */}
                      <motion.img 
                        key={current} 
                        src={gallery[current]} 
                        alt={`Gallery ${current}`} 
                        initial={{ opacity: 0, scale: 1.1 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        exit={{ opacity: 0, scale: 0.95 }} 
                        transition={{ duration: 0.5 }} 
                        className="w-full h-72 sm:h-96 object-cover" 
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000&auto=format&fit=crop"; }}
                      />
                    </AnimatePresence>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                    
                    <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black transition border border-purple-500/30 shadow-lg"><ChevronLeft className="w-5 h-5 text-white" /></button>
                    <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black transition border border-purple-500/30 shadow-lg"><ChevronRight className="w-5 h-5 text-white" /></button>
                    <div className="absolute bottom-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs font-bold text-zinc-300 border border-purple-500/30">{current + 1} / {gallery.length}</div>
                  </div>

                  {galleryCaptions.length > 0 && (
                    <p className="text-xl text-fuchsia-400 mt-5 italic font-serif">{galleryCaptions[current % galleryCaptions.length]}</p>
                  )}

                  <div className="flex justify-center gap-2 mt-5">
                    {gallery.map((_, i) => (
                      <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all duration-300 ${i === current ? "bg-purple-500 w-10 glow-purple" : "bg-zinc-800 w-3 hover:bg-purple-500/30"}`} />
                    ))}
                  </div>
                </motion.div>
              </section>
            )}

            {/* ─── RSVP & WISHES ─── */}
            <section className="py-24 px-6 bg-[#0f0f13]">
              <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-lg mx-auto text-center">
                <p className="text-4xl mb-2">💬</p>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 uppercase tracking-widest">RSVP & Messages</h2>
                <p className="text-sm text-zinc-400 mb-8">Confirm attendance & drop a message 💜</p>

                {/* Tombol Arah ke Form RSVP */}
                <div className="card-night neon-border p-8 mb-10 text-center">
                  <h3 className="text-xl font-black text-white mb-3">Join The Party!</h3>
                  <p className="text-xs text-zinc-400 mb-6">Let us know you're coming so we can prepare the best night for you.</p>
                  <button onClick={() => navigate(`/party-rsvp/${id}`)} className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-bold text-sm tracking-widest uppercase rounded-xl glow-purple hover:opacity-90 transition-all">
                    <Send className="w-5 h-5" /> RSVP Sekarang
                  </button>
                </div>

                {/* List Ucapan dari Data */}
                <DaftarUcapanTamuNight greetings={eventData?.greetings} />

              </motion.div>
            </section>

            {/* ─── GIFT ─── */}
            {gifts.length > 0 && (
              <section className="py-24 px-6 bg-[#09090b]">
                <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-lg mx-auto text-center">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-5xl mb-3 inline-block">🎁</motion.div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 uppercase tracking-widest">Send a Gift</h2>
                  <p className="text-sm text-zinc-400 mb-10">Your presence is the best gift 💜<br />But if you insist... 😉</p>

                  <div className="space-y-5">
                    {gifts.map((acc, idx) => (
                      <div key={idx} className="card-night neon-border p-7">
                        <p className="text-3xl mb-2">{idx % 2 === 0 ? "💳" : "📱"}</p>
                        <p className="text-xs text-fuchsia-400 font-bold uppercase tracking-wider mb-1">{acc.bankName || acc.bank_name}</p>
                        <p className="text-zinc-400 text-sm mb-4 font-medium">{acc.accountName || acc.account_name}</p>
                        <div className="flex items-center justify-center gap-3 bg-black/50 border border-white/5 rounded-xl py-3 px-5">
                          <span className="text-lg text-white font-bold tracking-wider">{acc.accountNumber || acc.account_number}</span>
                          <motion.button onClick={() => copyNumber(acc.accountNumber || acc.account_number, idx)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 hover:bg-white/5 transition rounded-lg">
                            {copied === idx ? <Check className="w-5 h-5 text-fuchsia-400" /> : <Copy className="w-5 h-5 text-zinc-500" />}
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </section>
            )}

            {/* ─── CLOSING ─── */}
            <section className="relative py-24 px-6 bg-[#0f0f13] overflow-hidden">
              {Array.from({ length: 10 }).map((_, i) => <SparkleParticle key={i} delay={i * 0.6} left={`${Math.random() * 100}%`} />)}
              <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-lg mx-auto text-center relative z-10">
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", stiffness: 200 }} className="text-6xl mb-5 inline-block">🌙</motion.div>
                <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 uppercase tracking-widest">
                  See You <span className="text-gradient-neon">Tonight!</span>
                </h2>
                <div className="divider-neon w-24 mx-auto mb-6" />
                <p className="text-zinc-400 leading-relaxed text-base mb-8 max-w-sm mx-auto">{details.closingMessage || details.closing_message || "Kehadiran kamu bakal bikin malam ini makin berkesan. Let's celebrate, dance, and make memories! 💃🕺"}</p>
                
                <div className="card-night neon-border p-8 inline-block mt-4">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2 font-bold">With Love</p>
                  <p className="text-4xl font-black text-gradient-neon mb-2 uppercase">{hostName}</p>
                  <p className="text-sm text-zinc-500 font-semibold">💜✨🪩</p>
                </div>
              </motion.div>
            </section>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays, Clock, MapPin, ExternalLink, Gift, Copy, Check, Send,
  ChevronLeft, ChevronRight, Cake, Music, Gamepad2, PartyPopper, Star
} from "lucide-react";

/* ─── Confetti Particle ─── */
const ConfettiPiece = ({ delay, left, color }) => (
  <motion.div
    className="absolute w-2 h-3 rounded-sm z-0"
    style={{ left, top: "-10px", backgroundColor: color, rotate: `${Math.random() * 360}deg` }}
    animate={{ y: ["0vh", "100vh"], rotate: [0, 720], opacity: [0, 1, 1, 0] }}
    transition={{ delay, duration: 4 + Math.random() * 3, repeat: Infinity, repeatDelay: Math.random() * 5, ease: "linear" }}
  />
);

/* ─── Floating Balloon ─── */
const FloatingBalloon = ({ emoji, left, delay }) => (
  <motion.div
    className="absolute text-4xl sm:text-5xl pointer-events-none z-10"
    style={{ left }}
    initial={{ y: "100vh", opacity: 0 }}
    animate={{ y: "-20vh", opacity: [0, 1, 1, 0.8] }}
    transition={{ delay, duration: 8, repeat: Infinity, repeatDelay: 3, ease: "linear" }}
  >
    <div className="animate-bounce" style={{ animationDelay: `${delay}s` }}>
      {emoji}
    </div>
  </motion.div>
);

/* ─── Countdown Timer Hook ─── */
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

const confettiColors = ["#ec4899", "#8b5cf6", "#f59e0b", "#0ea5e9", "#10b981", "#f43f5e"];

/* 🔥 KOMPONEN DAFTAR UCAPAN TAMU (Versi Birthday Pastel) 🔥 */
const DaftarUcapanTamuBirthday = ({ greetings }) => {
  const daftarUcapan = (greetings || [])
    .map((item, index) => ({
      id: item.id || index,
      nama: item.name || item.attendee_name || "Teman",
      pesan: item.greeting || item.pesan || ""
    }))
    .filter(item => item.pesan.trim() !== "");

  return (
    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-transparent text-left mt-8">
      {daftarUcapan.length > 0 ? (
        daftarUcapan.map((item) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            key={item.id} 
            className="bg-white p-5 rounded-[1.5rem] border-2 border-sky-100 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                <Star className="w-4 h-4 text-pink-500" />
              </div>
              <h4 className="font-bold text-[#5CB8E4] text-base">{item.nama}</h4>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed pl-10">
              {item.pesan}
            </p>
          </motion.div>
        ))
      ) : (
        <div className="text-center text-slate-400 italic bg-white p-6 rounded-[1.5rem] border-2 border-sky-100 shadow-sm">
          Belum ada ucapan. Yuk isi RSVP untuk mengirim doa! ✨
        </div>
      )}
    </div>
  );
};


/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT — Theme Birthday (Dynamic)
   ═══════════════════════════════════════════════════════════════ */
export default function ThemeBirthday({ eventData, guestName, isOpen, onOpen, navigate, id }) {
  let details = eventData?.eventDetails || eventData?.event_details || {};
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch (e) { details = {}; }
  }

  let profilesList = details.profiles || [];
  if (typeof profilesList === 'string') {
    try { profilesList = JSON.parse(profilesList); } catch (e) { profilesList = []; }
  }

  const coverImg = eventData?.img || "https://images.unsplash.com/photo-1530103862676-de88b3bb5f5f?q=80&w=1000&auto=format&fit=crop";
  const profile = profilesList[0] || {};
  const hostName = profile.fullName || profile.full_name || eventData?.title || "Yang Berulang Tahun";
  const hostPhoto = profile.photoUrl || profile.photo_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Party";
  const parentsInfo = profile.parentsInfo || profile.parents_info || "";

  const sessions = eventData?.sessions || [];
  const gallery = details.galleryImages || details.gallery_images || [];
  const gifts = details.digitalGifts || details.digital_gifts || [];
  const targetDate = eventData?.date_start || sessions[0]?.date || new Date(Date.now() + 864000000).toISOString();

  const defaultCaptions = ["Pesta yang penuh warna! 🎈", "Kue ulang tahun spesial 🎂", "Bersama teman-teman! 👫", "Kado penuh kejutan! 🎁", "Bermain & tertawa! 🎪"];
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
    <div className="min-h-screen bg-pink-50 overflow-x-hidden font-sans text-slate-800">
      
      {/* ═══ HERO / COVER ═══ */}
      {!isOpen && (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-sky-100 to-pink-100">
          <div className="absolute inset-0">
            <img src={coverImg} alt="Birthday Party" className="w-full h-full object-cover opacity-30 mix-blend-overlay blur-[2px]" />
          </div>

          <FloatingBalloon emoji="🎈" left="5%" delay={0} />
          <FloatingBalloon emoji="🎈" left="15%" delay={2} />
          <FloatingBalloon emoji="⭐" left="25%" delay={4} />
          <FloatingBalloon emoji="🎈" left="75%" delay={1} />
          <FloatingBalloon emoji="🎊" left="85%" delay={3} />

          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="relative z-10 text-center px-6 max-w-lg bg-white/60 backdrop-blur-md py-12 rounded-[3rem] border-4 border-white shadow-2xl">
            <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.3, type: "spring" }} className="text-7xl mb-4 inline-block">🎂</motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="font-bold text-pink-500 tracking-[0.2em] uppercase text-xs mb-3">Undangan Ulang Tahun</motion.p>
            <motion.h1 initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7, type: "spring" }} className="font-black text-4xl sm:text-5xl text-slate-800 mb-2 leading-tight">{hostName}</motion.h1>
            <div className="h-1 w-24 bg-gradient-to-r from-pink-400 to-sky-400 rounded-full mx-auto my-4" />
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="text-lg text-slate-600 font-bold mb-6">{eventData?.title}</motion.p>
            
            <div className="mb-8 bg-white/80 py-3 px-6 rounded-2xl border border-pink-100 mx-auto max-w-xs">
              <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-1">Kepada Yth.</p>
              <p className="text-lg text-sky-500 font-black">{guestName}</p>
            </div>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onOpen} className="px-10 py-4 bg-pink-500 text-white font-black text-sm tracking-widest uppercase rounded-full shadow-[0_10px_20px_rgba(236,72,153,0.3)] hover:bg-pink-600 transition-all">
              🎁 Buka Undangan
            </motion.button>
          </motion.div>
        </section>
      )}

      {/* ═══ MAIN CONTENT ═══ */}
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}>

            {/* ─── OPENING ─── */}
            <section className="relative py-20 px-6 overflow-hidden bg-white">
              {confettiColors.map((color, i) => <ConfettiPiece key={i} delay={i * 0.8} left={`${10 + i * 15}%`} color={color} />)}
              <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center relative z-10">
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring" }} className="text-6xl mb-5 inline-block">🎉🎈🎊</motion.div>
                <h2 className="font-black text-3xl sm:text-4xl text-pink-500 mb-4">Yuk, Ikut Merayakan!</h2>
                <p className="font-medium text-slate-600 leading-relaxed text-base sm:text-lg max-w-md mx-auto">{details.openingMessage || "Hai teman-teman! Ayo datang ke pesta ulang tahun yang seru dan penuh kejutan! Ada kue, balon, games, dan banyak keseruan lainnya menanti kamu! 🎪✨"}</p>
              </motion.div>
            </section>

            {/* ─── PROFILE ─── */}
            <section className="py-20 px-6 bg-sky-50">
              <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-md mx-auto text-center">
                <p className="text-5xl mb-4">👑</p>
                <h2 className="font-black text-2xl sm:text-3xl text-sky-500 mb-8">Yang Berulang Tahun</h2>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} className="bg-white p-8 sm:p-10 rounded-[3rem] shadow-xl border-4 border-sky-100">
                  <div className="relative w-40 h-40 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-400 to-sky-400 animate-spin-slow" style={{ animation: "spin 8s linear infinite", padding: "4px" }}></div>
                    <div className="absolute inset-1 rounded-full overflow-hidden border-4 border-white bg-white">
                      <img src={hostPhoto} alt={hostName} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <h3 className="font-black text-3xl text-slate-800 mb-2">{hostName}</h3>
                  {parentsInfo && <p className="text-slate-500 text-sm font-semibold">{parentsInfo}</p>}
                  <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: "spring", delay: 0.3 }} className="inline-flex items-center gap-2 mt-6 px-5 py-2 bg-pink-100 rounded-full">
                    <Cake className="w-5 h-5 text-pink-500" />
                    <span className="font-black text-pink-500">Happy Birthday!</span>
                  </motion.div>
                </motion.div>
              </motion.div>
            </section>

            {/* ─── COUNTDOWN ─── */}
            <section className="py-16 px-6 bg-gradient-to-b from-sky-50 to-pink-50">
              <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-lg mx-auto text-center">
                <h2 className="font-black text-2xl text-pink-500 mb-8">Hitung Mundur! ⏰</h2>
                <div className="grid grid-cols-4 gap-3">
                  {[{ label: "Hari", value: countdown.days, emoji: "🌞" }, { label: "Jam", value: countdown.hours, emoji: "⏰" }, { label: "Menit", value: countdown.minutes, emoji: "⏳" }, { label: "Detik", value: countdown.seconds, emoji: "💫" }].map((item, i) => (
                    <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="bg-white rounded-3xl p-4 shadow-md border-2 border-pink-50">
                      <p className="text-xl mb-1">{item.emoji}</p>
                      <p className="font-black text-2xl sm:text-3xl text-sky-500">{item.value}</p>
                      <p className="text-xs text-slate-500 mt-1 font-bold">{item.label}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* ─── EVENT DETAILS ─── */}
            <section className="py-20 px-6 bg-white">
              <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
                <p className="text-4xl mb-4">📅</p>
                <h2 className="font-black text-2xl sm:text-3xl text-pink-500 mb-10">Kapan & Dimana?</h2>
                <div className="space-y-6">
                  {sessions.map((session, idx) => (
                    <motion.div key={idx} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-pink-50 rounded-[3rem] p-8 sm:p-10 shadow-sm border border-pink-100">
                      <p className="text-5xl mb-4">{idx % 2 === 0 ? "🎪" : "🎨"}</p>
                      <h3 className="font-black text-2xl text-slate-800 mb-6">{session.name}</h3>
                      <div className="space-y-4 text-sm text-slate-600 font-medium">
                        <div className="flex items-center justify-center gap-3 bg-white rounded-2xl py-3 px-5 shadow-sm"><CalendarDays className="w-5 h-5 text-pink-500" /><span>{session.date}</span></div>
                        <div className="flex items-center justify-center gap-3 bg-white rounded-2xl py-3 px-5 shadow-sm"><Clock className="w-5 h-5 text-sky-500" /><span>{session.start_time || session.startTime} - {session.end_time || session.endTime}</span></div>
                        <div className="flex items-center justify-center gap-3 bg-white rounded-2xl py-3 px-5 shadow-sm"><MapPin className="w-5 h-5 text-yellow-500" /><span>{session.name_place || session.location?.namePlace || session.place || session.location?.place}</span></div>
                      </div>
                      <a href={session.map_url || session.location?.mapUrl || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 mt-8 px-8 py-3 bg-white text-pink-500 border-2 border-pink-200 text-sm font-black uppercase tracking-widest rounded-full shadow-md hover:bg-pink-50 transition-all">
                        <ExternalLink className="w-4 h-4" /> Lihat Lokasi
                      </a>
                    </motion.div>
                  ))}
                </div>
                
                <div className="flex justify-center gap-5 mt-12">
                  {[{ icon: Cake, color: "text-pink-500" }, { icon: Music, color: "text-sky-500" }, { icon: Gamepad2, color: "text-yellow-500" }, { icon: PartyPopper, color: "text-emerald-500" }].map((item, i) => (
                    <div key={i} className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center"><item.icon className={`w-6 h-6 ${item.color}`} /></div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* ─── GALLERY ─── */}
            {gallery.length > 0 && (
              <section className="py-20 px-6 bg-pink-50">
                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
                  <p className="text-4xl mb-4">📸</p>
                  <h2 className="font-black text-2xl sm:text-3xl text-pink-500 mb-8">Galeri Foto</h2>
                  
                  <div className="relative overflow-hidden rounded-3xl shadow-xl border-4 border-white bg-white">
                    <AnimatePresence mode="wait">
                      <motion.img key={current} src={gallery[current]} alt={`Gallery ${current}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="w-full h-72 sm:h-96 object-cover" />
                    </AnimatePresence>
                    <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 rounded-full flex items-center justify-center shadow-lg"><ChevronLeft className="w-6 h-6 text-slate-700" /></button>
                    <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-white/90 rounded-full flex items-center justify-center shadow-lg"><ChevronRight className="w-6 h-6 text-slate-700" /></button>
                  </div>
                  
                  {galleryCaptions.length > 0 && (
                    <p className="font-bold text-sky-500 mt-6">{galleryCaptions[current % galleryCaptions.length]}</p>
                  )}
                  
                  <div className="flex justify-center gap-2 mt-5">
                    {gallery.map((_, i) => (
                      <button key={i} onClick={() => setCurrent(i)} className={`h-3 rounded-full transition-all duration-300 ${i === current ? "bg-pink-500 w-10" : "bg-pink-200 w-3"}`} />
                    ))}
                  </div>
                </motion.div>
              </section>
            )}

            {/* ─── RSVP & WISHES ─── */}
            <section className="py-20 px-6 bg-white">
              <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-lg mx-auto text-center">
                <p className="text-4xl mb-4">💌</p>
                <h2 className="font-black text-2xl sm:text-3xl text-pink-500 mb-4">Kehadiran & Doa</h2>
                <p className="text-sm text-slate-500 font-medium mb-8">Bantu kami menyiapkan pesta yang luar biasa dengan mengisi form RSVP ya! 💕</p>

                {/* Tombol Arah ke Form RSVP */}
                <div className="bg-sky-50 p-8 rounded-[2.5rem] mb-10 border border-sky-100 shadow-sm">
                  <button onClick={() => navigate(`/party-rsvp/${id}`)} className="w-full flex items-center justify-center gap-2 py-4 bg-sky-500 text-white font-black text-sm tracking-widest uppercase rounded-2xl shadow-lg hover:bg-sky-600 transition-all">
                    <Send className="w-5 h-5" /> Isi Form RSVP
                  </button>
                </div>

                {/* List Ucapan dari Data */}
                <DaftarUcapanTamuBirthday greetings={eventData?.greetings} />

              </motion.div>
            </section>

            {/* ─── GIFT / KADO ─── */}
            {gifts.length > 0 && (
              <section className="py-20 px-6 bg-pink-50">
                <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-lg mx-auto text-center">
                  <p className="text-5xl mb-4">🎁</p>
                  <h2 className="font-black text-2xl sm:text-3xl text-pink-500 mb-4">Kirim Kado</h2>
                  <p className="text-sm text-slate-500 font-medium mb-10">Kehadiran kamu sudah jadi kado terindah 💕 Tapi kalau mau kirim hadiah, boleh banget ya 😊</p>

                  <div className="space-y-5">
                    {gifts.map((acc, idx) => (
                      <div key={idx} className="bg-white p-7 rounded-3xl shadow-sm border border-pink-100">
                        <p className="text-3xl mb-2">{idx % 2 === 0 ? "💳" : "📱"}</p>
                        <p className="font-black text-xs text-sky-500 tracking-widest uppercase mb-1">{acc.bankName || acc.bank_name}</p>
                        <p className="text-slate-600 text-sm mb-4 font-bold">{acc.accountName || acc.account_name}</p>
                        <div className="flex items-center justify-center gap-3 bg-slate-50 rounded-2xl py-3 px-5">
                          <span className="font-mono text-lg text-slate-800 font-bold tracking-wider">{acc.accountNumber || acc.account_number}</span>
                          <button onClick={() => copyNumber(acc.accountNumber || acc.account_number, idx)} className="p-2 hover:bg-pink-50 text-slate-400 hover:text-pink-500 transition rounded-full">
                            {copied === idx ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </section>
            )}

            {/* ─── CLOSING ─── */}
            <section className="py-20 px-6 bg-white relative overflow-hidden">
              <FloatingBalloon emoji="🎈" left="8%" delay={0} />
              <FloatingBalloon emoji="⭐" left="88%" delay={2} />
              <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-lg mx-auto text-center relative z-10">
                <p className="text-6xl mb-6">🥰</p>
                <h2 className="font-black text-3xl text-pink-500 mb-6">Terima Kasih!</h2>
                <p className="text-slate-500 font-medium leading-relaxed text-base mb-8 max-w-sm mx-auto">{details.closingMessage || details.closing_message || "Kehadiran dan doa restu teman-teman sangat berarti. Sampai jumpa di pesta! 💕"}</p>
                <p className="font-black text-2xl text-sky-500">{hostName} 🎀</p>
              </motion.div>
            </section>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, ExternalLink, Gift, Copy, Check, Send, ChevronLeft, ChevronRight } from "lucide-react";

/* ─── CUSTOM ANIMATIONS & PATTERNS ─── */
const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
    .animate-float { animation: float 3s ease-in-out infinite; }
    @keyframes wiggle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
    .animate-wiggle { animation: wiggle 2s ease-in-out infinite; }
    
    .bg-confetti-pattern { background-color: #fdf4ff; background-image: radial-gradient(#fbcfe8 1px, transparent 1px); background-size: 20px 20px; }
    .bg-party-pattern { background-color: #eff6ff; background-image: radial-gradient(#bfdbfe 1px, transparent 1px); background-size: 20px 20px; }
    .divider-rainbow { height: 4px; border-radius: 2px; background: linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6, #10b981, #f59e0b); }

    /* 🔥 3D CAROUSEL BENTUK PERSEGI PANJANG (LANDSCAPE) */
    .carousel-container { perspective: 1000px; display: flex; align-items: center; justify-content: center; position: relative; height: 50vw; max-height: 380px; width: 100%; margin-bottom: 2rem; }
    .carousel-item { position: absolute; width: 75%; max-width: 650px; height: 100%; transition: all 0.5s ease-in-out; overflow: hidden; border-radius: 1.5rem; border: 4px solid white; object-fit: cover; }
    .carousel-item.prev { transform: translateX(-35%) scale(0.85) rotateY(15deg); z-index: 10; opacity: 0.6; }
    .carousel-item.active { transform: translateX(0) scale(1) rotateY(0deg); z-index: 20; opacity: 1; box-shadow: 0 15px 30px rgba(0,0,0,0.15); }
    .carousel-item.next { transform: translateX(35%) scale(0.85) rotateY(-15deg); z-index: 10; opacity: 0.6; }
  `}} />
);

const Balloon = ({ color, left, delay }) => (
  <motion.div
    className="absolute bottom-0 text-5xl sm:text-6xl z-10"
    style={{ left }}
    initial={{ y: 100, opacity: 0 }}
    animate={{ y: -20, opacity: 1 }}
    transition={{ delay, duration: 1.5, ease: "easeOut" }}
  >
    <div className="animate-float" style={{ animationDelay: `${delay}s` }}>
      {color === "pink" && "🎈"}
      {color === "star" && "⭐"}
      {color === "party" && "🎉"}
      {color === "balloon" && "🎊"}
    </div>
  </motion.div>
);

const eventColors = ["bg-pink-500 text-white", "bg-blue-500 text-white"];
const borderColors = ["border-pink-300", "border-blue-300", "border-yellow-300"];
const dotColors = ["bg-pink-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500"];

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
  
  /* 🔥 DEFAULT CAPTIONS KALAU DARI BACKEND KOSONG */
  const defaultCaptions = [
    "Pesta yang penuh warna dan kegembiraan! 🎈🎉",
    "Kue ulang tahun paling spesial! 🎂🦄",
    "Bersama teman-teman tersayang! 👫💕",
    "Kado-kado penuh kejutan! 🎁✨",
    "Bermain bersama, tertawa bersama! 🎪🌈"
  ];
  const galleryCaptions = details.galleryCaptions?.length > 0 ? details.galleryCaptions : defaultCaptions;

  /* Gallery Logic */
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c === 0 ? gallery.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === gallery.length - 1 ? 0 : c + 1));
  const getImgIdx = (offset) => (current + offset + gallery.length) % gallery.length;

  const [copied, setCopied] = useState(null);
  const copyNumber = (num, idx) => {
    navigator.clipboard.writeText(num);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isOpen) return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-pink-50 px-4 text-center font-sans">
      <CustomStyles />
      <div className="absolute inset-0">
        <img src={coverImg} alt="Cover" className="w-full h-full object-cover blur-[2px]" />
        <div className="absolute inset-0 bg-blue-900/30" />
      </div>
      <Balloon color="pink" left="10%" delay={0.5} />
      <Balloon color="star" left="25%" delay={0.8} />
      <Balloon color="party" left="75%" delay={0.6} />
      <Balloon color="balloon" left="85%" delay={1} />
      
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative z-20 text-center px-6 py-10 max-w-sm w-full bg-white/90 backdrop-blur-sm rounded-[3rem] shadow-2xl border-4 border-white/50">
        <div className="text-5xl mb-4 drop-shadow-md">🎂</div>
        <p className="font-bold text-pink-500 tracking-widest uppercase text-xs mb-3">Kamu Diundang!</p>
        <h1 className="font-black text-4xl text-slate-800 mb-2">{hostName}</h1>
        <p className="text-sm text-slate-500 mb-6 font-bold">{eventData?.title}</p>
        <div className="w-24 h-1 bg-gradient-to-r from-pink-300 via-blue-300 to-yellow-300 rounded-full mx-auto mb-6" />
        <div className="mb-8 bg-pink-50/50 py-3 rounded-2xl border border-pink-100">
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-1">Kepada Yth.</p>
          <p className="text-lg text-slate-800 font-black">{guestName}</p>
        </div>
        <button onClick={onOpen} className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white text-sm font-black tracking-widest uppercase rounded-full shadow-lg transition-all">🎁 Buka Undangan</button>
      </motion.div>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-slate-800 overflow-hidden pb-10">
      <CustomStyles />
      <div className="w-full h-48 md:h-64 relative">
         <img src={coverImg} className="w-full h-full object-cover rounded-b-[3rem] shadow-sm" alt="Header" />
         <div className="absolute inset-0 bg-black/20 rounded-b-[3rem]"></div>
      </div>

      <section className="py-16 px-6 bg-confetti-pattern -mt-10 relative z-10 rounded-[3rem] mx-2 shadow-sm border border-pink-50">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center">
          <p className="text-5xl mb-4 drop-shadow-md animate-float">🎉</p>
          <h2 className="font-black text-3xl text-pink-500 mb-4 tracking-tight">Yuk, Ikut Merayakan!</h2>
          <p className="text-slate-600 font-medium leading-relaxed">{details.openingMessage || details.opening_message || "Hai teman-teman! Ayo datang ke pesta ulang tahun yang seru dan penuh kejutan!"}</p>
        </motion.div>
      </section>

      <section className="py-16 px-6 bg-party-pattern">
        <div className="max-w-md mx-auto text-center">
          <p className="text-5xl mb-2 drop-shadow-sm">👑</p>
          <h2 className="font-black text-3xl text-blue-500 mb-6">Yang Berulang Tahun</h2>
          <div className="bg-white rounded-[3rem] p-8 shadow-xl border-4 border-yellow-200">
            <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-pink-400 bg-pink-50">
              <img src={hostPhoto} alt={hostName} className="w-full h-full object-cover" />
            </div>
            <h3 className="font-black text-3xl text-slate-800 mb-2">{hostName}</h3>
            {parentsInfo && <p className="text-slate-500 text-xs font-bold uppercase">{parentsInfo}</p>}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-confetti-pattern">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-5xl mb-2 drop-shadow-sm">📅</p>
          <h2 className="font-black text-3xl text-pink-500 mb-8">Kapan & Dimana?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sessions.map((session, idx) => (
              <div key={idx} className={`bg-white rounded-[2rem] p-8 shadow-lg border-2 ${borderColors[idx % borderColors.length]}`}>
                <p className="text-4xl mb-4">{idx % 2 === 0 ? "🎪" : "🎭"}</p>
                <h3 className="font-black text-2xl text-slate-800 mb-6">{session.name}</h3>
                <div className="space-y-3 text-sm text-slate-600 font-medium mb-8">
                  <div className="flex items-center justify-center gap-3 bg-slate-50 py-3 rounded-xl"><CalendarDays className="w-5 h-5 text-pink-500" /><span>{session.date}</span></div>
                  <div className="flex items-center justify-center gap-3 bg-slate-50 py-3 rounded-xl"><Clock className="w-5 h-5 text-blue-500" /><span>{session.start_time || session.startTime} - {session.end_time || session.endTime}</span></div>
                  <div className="flex items-center justify-center gap-3 bg-slate-50 py-3 px-4 rounded-xl"><MapPin className="w-5 h-5 text-yellow-500 shrink-0" /><span className="truncate">{session.name_place || session.location?.namePlace || session.place || session.location?.place}</span></div>
                </div>
                <a href={session.map_url || session.location?.mapUrl || "#"} target="_blank" rel="noreferrer" className={`w-full flex justify-center items-center gap-2 py-3 rounded-full text-xs font-bold tracking-widest uppercase shadow-md ${eventColors[idx % eventColors.length]}`}>Lihat Lokasi</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GALLERY DENGAN TEKS ─── */}
      {gallery.length > 0 && (
        <section className="py-16 px-6 bg-party-pattern overflow-visible">
          <div className="max-w-2xl mx-auto text-center overflow-visible">
            <p className="text-5xl mb-2 drop-shadow-sm">📸</p>
            <h2 className="font-black text-3xl text-blue-500 mb-8">Galeri Seru!</h2>
            
            <div className="carousel-container max-w-xl mx-auto mb-8">
                {gallery.length > 1 && <img src={gallery[getImgIdx(-1)]} alt="Prev" className="carousel-item prev" />}
                <img src={gallery[getImgIdx(0)]} alt="Active" className="carousel-item active" />
                {gallery.length > 2 && <img src={gallery[getImgIdx(1)]} alt="Next" className="carousel-item next" />}
            </div>

            {/* 🔥 TEKS CAPTION MUNCUL DI SINI 🔥 */}
            {galleryCaptions.length > 0 && (
                <motion.p 
                    key={current + 'text_bday'} 
                    initial={{ opacity: 0, y: 5 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="text-slate-500 font-medium text-sm mb-6 px-4"
                >
                    {galleryCaptions[current % galleryCaptions.length]}
                </motion.p>
            )}

            <div className="flex flex-col items-center gap-6">
              <div className="flex justify-center gap-4">
                  <button onClick={prev} className="rounded-full bg-white p-3 shadow-md border border-slate-100 hover:bg-slate-50"><ChevronLeft className="h-6 w-6 text-slate-600" /></button>
                  <button onClick={next} className="rounded-full bg-white p-3 shadow-md border border-slate-100 hover:bg-slate-50"><ChevronRight className="h-6 w-6 text-slate-600" /></button>
              </div>
              <div className="flex justify-center gap-2">
                  {gallery.map((_, i) => (
                    <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all ${i === current ? `${dotColors[i % dotColors.length]} w-8` : "bg-slate-300 w-3"}`} />
                  ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 px-6 bg-confetti-pattern text-center">
        <h2 className="font-black text-3xl text-pink-500 mb-6">Doa & Kehadiran</h2>
        <div className="mx-auto max-w-md bg-white rounded-[3rem] p-8 shadow-xl border-4 border-pink-100">
          <p className="text-slate-600 font-medium mb-8">Bantu kami menyiapkan pesta yang luar biasa dengan mengisi form RSVP ya!</p>
          <button onClick={() => navigate(`/party-rsvp/${id}`)} className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-pink-500 text-white font-black text-sm tracking-widest uppercase shadow-[0_10px_20px_rgba(236,72,153,0.3)] hover:bg-pink-600 transition-all"><Send className="w-5 h-5" /> Isi Form RSVP</button>
        </div>
      </section>

      <section className="py-20 px-6 bg-confetti-pattern text-center border-t border-pink-50">
        <p className="text-5xl mb-6">🎊🥳🎊</p>
        <h2 className="font-black text-4xl text-pink-500 mb-4">Terima Kasih!</h2>
        <p className="text-slate-600 font-medium mb-8 max-w-sm mx-auto">{details.closingMessage || details.closing_message || "Kehadiranmu adalah hadiah terindah!"}</p>
        <p className="font-black text-4xl text-blue-500 mb-8">{hostName} 🎀</p>
      </section>
    </div>
  );
}
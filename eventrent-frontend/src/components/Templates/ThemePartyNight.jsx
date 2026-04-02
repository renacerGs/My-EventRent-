import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, ExternalLink, Gift, Copy, Check, Send, ChevronLeft, ChevronRight, Sparkles, Star } from "lucide-react";

/* ─── CUSTOM ANIMATIONS & GOLD/DARK STYLES ─── */
const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    .text-gold-gradient { 
      background: linear-gradient(to right, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c); 
      -webkit-background-clip: text; 
      -webkit-text-fill-color: transparent; 
    }
    .divider-gold { height: 1px; background: linear-gradient(to right, transparent, #bf953f, transparent); }
    .bg-night-glow { background-color: #0a0a0a; }
    .bg-night-warm { background-color: #121212; }
    .border-gold-glow { border-color: rgba(191, 149, 63, 0.3); box-shadow: 0 0 20px rgba(191,149,63,0.08); }
    
    @keyframes shimmer { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
    .animate-shimmer { animation: shimmer 3s infinite; }
    
    @keyframes glow-pulse { 0%, 100% { box-shadow: 0 0 15px rgba(191, 149, 63, 0.2); } 50% { box-shadow: 0 0 30px rgba(191, 149, 63, 0.5); } }
    .animate-glow-pulse { animation: glow-pulse 3s infinite; }

    /* 🔥 3D CAROUSEL BENTUK PERSEGI PANJANG (LANDSCAPE) */
    .carousel-container { perspective: 1000px; display: flex; align-items: center; justify-content: center; position: relative; height: 50vw; max-height: 380px; width: 100%; margin-bottom: 2rem; }
    .carousel-item { position: absolute; width: 75%; max-width: 650px; height: 100%; transition: all 0.5s ease-in-out; overflow: hidden; border-radius: 1rem; border: 1px solid rgba(191, 149, 63, 0.5); object-fit: cover; }
    .carousel-item.prev { transform: translateX(-35%) scale(0.85) rotateY(15deg); z-index: 10; opacity: 0.4; filter: blur(2px) grayscale(30%); }
    .carousel-item.active { transform: translateX(0) scale(1) rotateY(0deg); z-index: 20; opacity: 1; filter: blur(0px); box-shadow: 0 0 25px rgba(191, 149, 63, 0.4); border: 2px solid rgba(191, 149, 63, 0.8); }
    .carousel-item.next { transform: translateX(35%) scale(0.85) rotateY(-15deg); z-index: 10; opacity: 0.4; filter: blur(2px) grayscale(30%); }
  `}} />
);

const FloatingStar = ({ left, delay, size = "text-sm" }) => (
  <motion.div
    className={`absolute ${size} text-amber-500 animate-shimmer z-10`}
    style={{ left, top: `${20 + Math.random() * 60}%`, animationDelay: `${delay}s` }}
    initial={{ opacity: 0 }}
    animate={{ opacity: [0, 1, 0] }}
    transition={{ delay, duration: 3, repeat: Infinity }}
  >
    ✦
  </motion.div>
);

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

  /* 🔥 DEFAULT CAPTIONS KALAU DARI BACKEND KOSONG */
  const defaultCaptions = [
    "An evening of elegance and celebration ✨",
    "Wrapped in love and luxury 🎁",
    "Intimate moments under the stars 🌙",
    "A night to remember forever 🥂",
    "Cheers to another amazing year! 🎉"
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 text-center font-sans">
      <CustomStyles />
      <div className="absolute inset-0">
        <img src={coverImg} alt="Cover" className="w-full h-full object-cover opacity-30 grayscale-[30%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/80 via-[#0a0a0a]/50 to-[#0a0a0a]" />
      </div>
      <FloatingStar left="8%" delay={0} />
      <FloatingStar left="20%" delay={1.2} size="text-xs" />
      <FloatingStar left="75%" delay={0.6} />
      <FloatingStar left="88%" delay={1.8} size="text-lg" />
      
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="relative z-20 text-center px-8 py-12 max-w-sm w-full bg-zinc-900/60 backdrop-blur-xl rounded-[2rem] border border-zinc-800">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl mb-6">🪩</motion.div>
        <p className="font-bold text-amber-500 tracking-[0.3em] uppercase text-[10px] mb-4">You're Invited</p>
        <h1 className="text-3xl sm:text-4xl text-gold-gradient mb-2 uppercase font-serif tracking-tight">{hostName}</h1>
        <p className="text-sm text-zinc-400 font-bold uppercase tracking-wider">{eventData?.title}</p>
        <div className="divider-gold w-full mx-auto my-8 opacity-50" />
        <div className="mb-10">
          <p className="text-zinc-500 text-[10px] font-bold tracking-widest uppercase mb-2">Exclusive For</p>
          <p className="text-lg text-white font-black uppercase tracking-wider">{guestName}</p>
        </div>
        <button onClick={onOpen} className="w-full py-4 border border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-zinc-950 text-xs font-black tracking-[0.2em] uppercase rounded-full transition-all">Enter Party</button>
      </motion.div>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] font-sans text-zinc-300 overflow-hidden pb-10">
      <CustomStyles />
      
      <div className="w-full h-64 md:h-80 relative">
         <img src={coverImg} className="w-full h-full object-cover opacity-50" alt="Header" />
         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/80 to-[#0a0a0a]"></div>
      </div>

      <section className="-mt-16 relative z-10 px-6">
        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center bg-zinc-900/80 backdrop-blur-md border border-zinc-800 p-8 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          <p className="text-zinc-300 font-medium leading-relaxed text-base italic">"{details.openingMessage || details.opening_message || "Get ready for the most epic night! Good vibes, great music, and unforgettable memories await."}"</p>
        </motion.div>
      </section>

      <section className="py-16 px-6">
        <div className="mb-10 text-center">
          <span className="text-4xl block mb-4 text-amber-500">👑</span>
          <h2 className="text-3xl font-serif text-white uppercase tracking-widest text-gold-gradient">The Host</h2>
        </div>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} className="mx-auto max-w-sm rounded-[2.5rem] bg-zinc-900/80 backdrop-blur-sm p-10 text-center border border-zinc-800">
          <div className="mx-auto mb-6 w-36 h-36 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-amber-600 to-amber-300 animate-glow-pulse">
            <img src={hostPhoto} alt="Host" className="w-full h-full object-cover rounded-full border-4 border-zinc-950" />
          </div>
          <h3 className="text-3xl font-serif text-white mb-2 uppercase text-gold-gradient">{hostName}</h3>
          {parentsInfo && <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{parentsInfo}</p>}
        </motion.div>
      </section>

      <section className="py-16 px-4 bg-night-warm">
        <div className="mb-10 text-center">
          <span className="text-4xl block mb-4">🪩</span>
          <h2 className="text-3xl font-serif text-white uppercase tracking-widest text-gold-gradient">Time & Venue</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {sessions.map((s, i) => (
            <div key={i} className="rounded-[2rem] bg-zinc-900 border border-zinc-800 p-8 flex flex-col items-center text-center">
              <h3 className="text-2xl font-serif text-amber-500 uppercase tracking-wider mb-6">{s.name}</h3>
              <div className="space-y-4 text-sm font-light text-zinc-300 mb-8 w-full">
                <div className="flex items-center justify-center gap-3"><CalendarDays className="h-5 w-5 text-amber-500/70" /><span>{s.date}</span></div>
                <div className="flex items-center justify-center gap-3"><Clock className="h-5 w-5 text-amber-500/70" /><span>{s.start_time || s.startTime} - {s.end_time || s.endTime}</span></div>
                <div className="flex items-center justify-center gap-3"><MapPin className="h-5 w-5 text-amber-500/70 shrink-0" /><span className="truncate">{s.name_place || s.location?.namePlace || s.place || s.location?.place}</span></div>
              </div>
              <a href={s.map_url || s.location?.mapUrl || "#"} target="_blank" rel="noreferrer" className="w-full mt-auto">
                <button className="w-full rounded-full border border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-zinc-950 py-3 text-xs font-black uppercase tracking-[0.2em] transition-all">Open Maps</button>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* ─── GALLERY DENGAN TEKS ─── */}
      {gallery.length > 0 && (
        <section className="py-20 px-6 bg-night-glow overflow-visible">
          <div className="mb-12 text-center">
            <span className="text-4xl block mb-4">📸</span>
            <h2 className="text-3xl font-serif text-white uppercase tracking-widest text-gold-gradient">Moments</h2>
          </div>
          
          <div className="carousel-container max-w-2xl mx-auto mb-8">
              {gallery.length > 1 && <img src={gallery[getImgIdx(-1)]} alt="Prev" className="carousel-item prev" />}
              <img src={gallery[getImgIdx(0)]} alt="Active" className="carousel-item active" />
              {gallery.length > 2 && <img src={gallery[getImgIdx(1)]} alt="Next" className="carousel-item next" />}
          </div>

          <div className="max-w-2xl mx-auto text-center">
             {/* 🔥 TEKS CAPTION MUNCUL DI SINI 🔥 */}
             <motion.p key={current + 'text'} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-gold-gradient font-serif text-base italic mb-8 px-4">
                {galleryCaptions[current % galleryCaptions.length]}
             </motion.p>

             <div className="flex flex-col items-center gap-6">
                <div className="flex justify-center gap-4">
                    <button onClick={prev} className="rounded-full bg-zinc-900 p-4 border border-zinc-800 hover:border-amber-500 text-white transition-colors active:scale-95 shadow-lg"><ChevronLeft className="h-6 w-6" /></button>
                    <button onClick={next} className="rounded-full bg-zinc-900 p-4 border border-zinc-800 hover:border-amber-500 text-white transition-colors active:scale-95 shadow-lg"><ChevronRight className="h-6 w-6" /></button>
                </div>
                <div className="flex justify-center gap-2">
                    {gallery.map((_, i) => (
                      <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all ${i === current ? "bg-amber-500 w-8" : "bg-zinc-700 w-2"}`} />
                    ))}
                </div>
             </div>
          </div>
        </section>
      )}

      <section className="py-16 px-6 bg-night-warm">
        <div className="mx-auto max-w-sm bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-800 text-center">
          <p className="text-zinc-400 text-sm mb-8 font-medium leading-relaxed">Confirm your attendance and let us know you're coming to the party.</p>
          <button onClick={() => navigate(`/party-rsvp/${id}`)} className="w-full rounded-full bg-amber-500 py-4 font-black text-zinc-950 uppercase tracking-[0.2em] text-xs shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:bg-amber-400 flex justify-center gap-2">
            <Send className="w-4 h-4" /> RSVP Now
          </button>
        </div>
      </section>

      {gifts.length > 0 && (
        <section className="py-16 px-6 bg-night-glow">
          <div className="mb-10 text-center">
            <span className="text-4xl block mb-4">🎁</span>
            <h2 className="text-3xl font-serif text-white uppercase tracking-widest text-gold-gradient">Gift Drop</h2>
          </div>
          <div className="mx-auto max-w-md space-y-4">
            {gifts.map((acc, idx) => (
              <div key={idx} className="rounded-3xl bg-zinc-900 p-6 flex items-center border border-zinc-800 gap-4">
                <div className="w-14 h-14 bg-zinc-950 rounded-full flex items-center justify-center shrink-0 border border-zinc-800 text-2xl">{idx % 2 === 0 ? "🏦" : "💳"}</div>
                <div className="flex-1">
                  <p className="font-bold text-amber-500 text-[10px] tracking-widest uppercase mb-1">{acc.bankName || acc.bank_name}</p>
                  <p className="font-bold text-white mb-1 uppercase text-sm">{acc.accountName || acc.account_name}</p>
                  <p className="font-mono text-lg text-zinc-400 tracking-wider">{acc.accountNumber || acc.account_number}</p>
                </div>
                <button onClick={() => copyNumber(acc.accountNumber || acc.account_number, idx)} className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 hover:text-amber-500 text-zinc-500 transition-colors"><Copy className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="text-center py-20 mt-10">
        <div className="divider-gold w-1/2 mx-auto mb-16 opacity-30" />
        <h2 className="text-4xl font-serif text-white uppercase mb-6 text-gold-gradient">See You There!</h2>
        <p className="mx-auto max-w-md text-zinc-400 font-medium leading-relaxed mb-10 px-6 italic">{details.closingMessage || details.closing_message || "Dress to impress and get ready for a night to remember!"}</p>
        <p className="text-2xl font-serif text-amber-500 tracking-[0.3em] uppercase">{hostName}</p>
      </section>
    </div>
  );
}
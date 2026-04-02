import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, ExternalLink, Gift, Copy, Check, Send, ChevronLeft, ChevronRight } from "lucide-react";

/* ─── CUSTOM ANIMATIONS & CLEAN STYLES ─── */
const CustomStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes float-soft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    .animate-float-soft { animation: float-soft 4s ease-in-out infinite; }
    
    .bg-paper-pattern { background-color: #fafaf9; background-image: radial-gradient(#d6d3d1 1px, transparent 1px); background-size: 24px 24px; }
    .divider-leaf { height: 2px; border-radius: 1px; background: linear-gradient(90deg, transparent, #10b981, #047857, transparent); }
    
    /* 🔥 3D CAROUSEL BENTUK PERSEGI PANJANG (LANDSCAPE) */
    .carousel-container { perspective: 1000px; display: flex; align-items: center; justify-content: center; position: relative; height: 50vw; max-height: 380px; width: 100%; margin-bottom: 2rem; }
    .carousel-item { position: absolute; width: 75%; max-width: 650px; height: 100%; transition: all 0.5s ease-in-out; overflow: hidden; border-radius: 1.5rem; border: 4px solid white; object-fit: cover; }
    .carousel-item.prev { transform: translateX(-35%) scale(0.85) rotateY(10deg); z-index: 10; opacity: 0.7; }
    .carousel-item.active { transform: translateX(0) scale(1) rotateY(0deg); z-index: 20; opacity: 1; box-shadow: 0 20px 40px rgba(16, 185, 129, 0.15); }
    .carousel-item.next { transform: translateX(35%) scale(0.85) rotateY(-10deg); z-index: 10; opacity: 0.7; }
  `}} />
);

const softIcons = ["🌿", "🕊️", "✨", "☕", "🤍", "🌿"];
const FloatingSoft = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-60 z-0">
    {softIcons.map((icon, i) => (
      <span key={i} className="animate-float-soft absolute text-2xl md:text-4xl drop-shadow-sm" style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 0.5}s`, top: `${10 + (i % 3) * 20}%` }}>{icon}</span>
    ))}
  </div>
);

const Section = ({ children, className = "" }) => <section className={`relative px-4 py-16 ${className}`}>{children}</section>;
const SectionTitle = ({ icon, title, subtitle }) => (
  <div className="mb-12 text-center">
    <span className="text-4xl block mb-4 opacity-80">{icon}</span>
    <h2 className="text-3xl md:text-4xl font-bold text-stone-800 tracking-tight">{title}</h2>
    {subtitle && <p className="text-stone-500 font-medium mt-3 text-sm md:text-base">{subtitle}</p>}
  </div>
);

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
  const hostName = profile.fullName || profile.full_name || eventData?.title || "Tuan Rumah";
  const hostPhoto = profile.photoUrl || profile.photo_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Casual";
  const parentsInfo = profile.parentsInfo || profile.parents_info || "";

  const sessions = eventData?.sessions || [];
  const gallery = details.galleryImages || details.gallery_images || [];
  const gifts = details.digitalGifts || details.digital_gifts || [];

  // 🔥 DEFAULT CAPTIONS TEMA CASUAL
  const defaultCaptions = ["Momen tak terlupakan ✨", "Tawa dan bahagia bersama", "Kehangatan keluarga", "Hari yang indah", "Penuh cinta"];
  const galleryCaptions = details.galleryCaptions?.length > 0 ? details.galleryCaptions : defaultCaptions;

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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-stone-100 px-4 text-center font-sans">
      <CustomStyles />
      <FloatingSoft />
      <div className="absolute inset-0">
        <img src={coverImg} alt="Cover" className="w-full h-full object-cover opacity-20 grayscale-[20%]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="relative z-20 text-center px-8 py-14 max-w-sm w-full bg-white/80 backdrop-blur-lg rounded-t-full rounded-b-[3rem] shadow-[0_20px_40px_rgba(0,0,0,0.05)] border border-white">
        <p className="font-medium text-emerald-600 tracking-[0.2em] uppercase text-xs mb-6">Hello, You're Invited!</p>
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white shadow-md">
          <img src={hostPhoto} alt="Host" className="w-full h-full object-cover" />
        </motion.div>
        <h1 className="font-bold text-3xl text-stone-800 mb-2">{hostName}</h1>
        <p className="text-sm text-stone-500 mb-8">{eventData?.title}</p>
        <div className="w-12 h-px bg-stone-300 mx-auto mb-6" />
        <div className="mb-10">
          <p className="text-stone-400 text-xs uppercase tracking-widest mb-2">Dear,</p>
          <p className="text-lg text-stone-800 font-semibold">{guestName}</p>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onOpen} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium tracking-widest uppercase rounded-full shadow-lg shadow-emerald-600/30 transition-all">
          Open Invitation
        </motion.button>
      </motion.div>
    </section>
  );

  return (
    <div className="min-h-screen bg-paper-pattern font-sans text-stone-800 overflow-hidden pb-10">
      <CustomStyles />
      <div className="w-full h-72 relative rounded-b-[3rem] overflow-hidden shadow-sm">
         <img src={coverImg} className="w-full h-full object-cover" alt="Header" />
         <div className="absolute inset-0 bg-emerald-900/30 mix-blend-multiply"></div>
         <div className="absolute inset-0 flex items-center justify-center text-center px-6">
            <h1 className="text-white text-3xl md:text-5xl font-bold tracking-wide drop-shadow-md">{eventData?.title || "Gathering Event"}</h1>
         </div>
      </div>

      <Section className="-mt-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-2xl mx-auto text-center bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-50">
          <span className="text-3xl block mb-4">🕊️</span>
          <p className="text-stone-600 font-medium leading-relaxed text-base md:text-lg">"{details.openingMessage || details.opening_message || "Kehadiranmu sangat berarti untuk melengkapi kebahagiaan di hari yang spesial ini."}"</p>
        </motion.div>
      </Section>

      <Section>
        <SectionTitle icon="🤍" title="The Host" subtitle="Kami mengundang teman-teman semua" />
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-sm text-center">
          <div className="mx-auto mb-6 w-40 h-40 rounded-full overflow-hidden p-1 bg-white shadow-lg border border-stone-100">
            <img src={hostPhoto} alt="Host" className="w-full h-full object-cover rounded-full" />
          </div>
          <h3 className="text-2xl font-bold text-stone-800 mb-2">{hostName}</h3>
          {parentsInfo && <p className="text-sm font-medium text-stone-500">{parentsInfo}</p>}
        </motion.div>
      </Section>

      <Section>
        <div className="max-w-4xl mx-auto py-12 px-6 bg-emerald-50/50 rounded-[3rem] border border-emerald-100">
          <SectionTitle icon="🗓️" title="Event Schedule" subtitle="Catat waktu dan tempatnya" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {sessions.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.2 }} className="bg-white rounded-[2rem] p-8 text-center shadow-sm border border-stone-100 hover:shadow-md transition-shadow">
                <h3 className="text-xl font-bold text-stone-800 mb-6">{s.name}</h3>
                <div className="space-y-4 text-sm font-medium text-stone-600 mb-8">
                  <div className="flex items-center justify-center gap-3"><CalendarDays className="h-5 w-5 text-emerald-500" /><span>{s.date}</span></div>
                  <div className="flex items-center justify-center gap-3"><Clock className="h-5 w-5 text-emerald-500" /><span>{s.start_time || s.startTime} - {s.end_time || s.endTime}</span></div>
                  <div className="flex items-center justify-center gap-3"><MapPin className="h-5 w-5 text-emerald-500 shrink-0" /><span className="truncate">{s.name_place || s.location?.namePlace || s.place || s.location?.place}</span></div>
                </div>
                <a href={s.map_url || s.location?.mapUrl || "#"} target="_blank" rel="noreferrer" className="w-full inline-block">
                  <button className="w-full rounded-xl border border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white py-3 text-sm font-medium transition-colors flex justify-center items-center gap-2">
                    <ExternalLink className="w-4 h-4" /> Buka Google Maps
                  </button>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {gallery.length > 0 && (
        <Section className="overflow-visible">
          <SectionTitle icon="📷" title="Moments" subtitle="Beberapa momen spesial kami" />
          <div className="carousel-container max-w-xl mx-auto mb-8">
              {gallery.length > 1 && <img src={gallery[getImgIdx(-1)]} alt="Prev" className="carousel-item prev" />}
              <img src={gallery[getImgIdx(0)]} alt="Active" className="carousel-item active" />
              {gallery.length > 2 && <img src={gallery[getImgIdx(1)]} alt="Next" className="carousel-item next" />}
          </div>
          
          {/* 🔥 TEKS CAPTION */}
          {galleryCaptions.length > 0 && (
              <motion.p key={current + '_cas_cap'} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-center font-medium text-emerald-700/80 italic mb-6 px-4">
                  {galleryCaptions[current % galleryCaptions.length]}
              </motion.p>
          )}

          <div className="flex flex-col items-center gap-6">
            <div className="flex justify-center gap-4">
                <button onClick={prev} className="rounded-full bg-white p-3 shadow-sm hover:bg-stone-50 transition border border-stone-200"><ChevronLeft className="h-5 w-5 text-stone-600" /></button>
                <button onClick={next} className="rounded-full bg-white p-3 shadow-sm hover:bg-stone-50 transition border border-stone-200"><ChevronRight className="h-5 w-5 text-stone-600" /></button>
            </div>
            <div className="flex justify-center gap-2">
                {gallery.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all ${i === current ? "bg-emerald-500 w-6" : "bg-stone-300 w-2"}`} />
                ))}
            </div>
          </div>
        </Section>
      )}

      <Section>
        <div className="mx-auto max-w-md bg-white p-10 rounded-[2.5rem] border border-stone-100 text-center shadow-lg shadow-stone-200/50">
          <Send className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-stone-800 mb-2">RSVP Kehadiran</h2>
          <p className="text-stone-500 text-sm mb-8 leading-relaxed">Konfirmasi kehadiranmu membantu kami mempersiapkan acara dengan lebih baik.</p>
          <button onClick={() => navigate(`/party-rsvp/${id}`)} className="w-full rounded-xl bg-emerald-600 py-4 font-medium text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition active:scale-95">
            Isi Form Kehadiran
          </button>
        </div>
      </Section>

      {gifts.length > 0 && (
        <Section>
          <SectionTitle icon="🎁" title="Send a Gift" subtitle="Tanda kasih untuk momen spesial" />
          <div className="mx-auto max-w-md space-y-4">
            {gifts.map((acc, idx) => (
              <div key={idx} className="rounded-2xl bg-white p-6 flex items-center border border-stone-100 shadow-sm gap-4 hover:shadow-md transition">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center shrink-0 text-emerald-600"><span className="text-xl">{idx % 2 === 0 ? "🏦" : "💳"}</span></div>
                <div className="flex-1">
                  <p className="font-semibold text-stone-400 text-[10px] tracking-widest uppercase mb-1">{acc.bankName || acc.bank_name}</p>
                  <p className="font-bold text-stone-800 text-sm mb-1">{acc.accountName || acc.account_name}</p>
                  <p className="font-mono font-medium text-emerald-600">{acc.accountNumber || acc.account_number}</p>
                </div>
                <button onClick={() => copyNumber(acc.accountNumber || acc.account_number, idx)} className="p-3 rounded-full bg-stone-50 hover:bg-emerald-50 text-stone-500 hover:text-emerald-600 transition-colors shrink-0">{copied === idx ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}</button>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section className="text-center py-20 mt-8">
        <div className="w-12 h-px bg-stone-300 mx-auto mb-10" />
        <h2 className="text-3xl font-bold text-stone-800 mb-6">Terima Kasih</h2>
        <p className="mx-auto max-w-md text-stone-500 leading-relaxed mb-10 px-6">{details.closingMessage || details.closing_message || "Kehadiranmu melengkapi kebahagiaan kami. Sampai jumpa di hari H!"}</p>
        <p className="text-xl font-bold text-emerald-600">{hostName}</p>
      </Section>
    </div>
  );
}
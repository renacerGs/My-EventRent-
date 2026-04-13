import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Volume2, VolumeX, Heart, Gift, Copy, Check, MapPin, Clock, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

/* ─── REUSABLE PRIMITIVES ─── */
const animationVariants = {
  "fade-up": { hidden: { opacity: 0, y: 60 }, visible: { opacity: 1, y: 0 } },
  "fade-left": { hidden: { opacity: 0, x: -60 }, visible: { opacity: 1, x: 0 } },
  "fade-right": { hidden: { opacity: 0, x: 60 }, visible: { opacity: 1, x: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } },
  blur: { hidden: { opacity: 0, filter: "blur(10px)", y: 30 }, visible: { opacity: 1, filter: "blur(0px)", y: 0 } },
};

const AnimatedSection = ({ children, className = "", delay = 0, animation = "fade-up" }) => (
  <motion.section
    className={className}
    variants={animationVariants[animation]}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    {children}
  </motion.section>
);

const SectionDivider = () => (
  <motion.div
    className="section-divider py-4 flex justify-center"
    initial={{ opacity: 0, scaleX: 0 }}
    whileInView={{ opacity: 1, scaleX: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8 }}
  >
    <span className="text-[#D4AF37] text-2xl">✦</span>
  </motion.div>
);

const ParallaxSection = ({ children, className = "", speed = 0.3, direction = "up" }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const factor = direction === "up" ? -1 : 1;
  const y = useTransform(scrollYProgress, [0, 1], [factor * 100 * speed, factor * -100 * speed]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
};

/* ─── FLOATING PETALS ─── */
const FloatingPetals = () => {
  const [petals, setPetals] = useState([]);

  useEffect(() => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 12 + 6,
      delay: Math.random() * 8,
      duration: Math.random() * 8 + 10,
      rotation: Math.random() * 360,
      type: ["petal", "sparkle", "heart"][Math.floor(Math.random() * 3)],
    }));
    setPetals(items);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {petals.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{ left: `${p.x}%`, top: -20 }}
          animate={{
            y: [0, typeof window !== "undefined" ? window.innerHeight + 40 : 1000],
            x: [0, Math.sin(p.id) * 80, Math.sin(p.id + 1) * -60, 0],
            rotate: [0, p.rotation, p.rotation * 2],
            opacity: [0, 0.8, 0.6, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
        >
          {p.type === "petal" && (
            <svg width={p.size} height={p.size} viewBox="0 0 20 20">
              <ellipse cx="10" cy="10" rx="5" ry="10" fill="hsl(38 60% 55% / 0.4)" transform="rotate(30 10 10)" />
            </svg>
          )}
          {p.type === "sparkle" && (
            <span className="text-[#D4AF37]" style={{ fontSize: p.size, opacity: 0.5 }}>✦</span>
          )}
          {p.type === "heart" && (
            <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="hsl(38 60% 55% / 0.3)">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          )}
        </motion.div>
      ))}
    </div>
  );
};

/* ─── MUSIC PLAYER ─── */
const MusicPlayer = ({ src, autoPlay = false }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [autoPlay, src]); 

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause(); else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      <audio ref={audioRef} src={src} loop preload="auto" />
      <motion.button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#D4AF37] text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </motion.button>
    </>
  );
};

/* ─── SECTIONS DENGAN DATA DINAMIS ─── */
const HeroSection = ({ onOpen, name1, name2, guestName, coverImg }) => (
  <motion.section
    className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden bg-slate-950 text-white"
    initial={{ opacity: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.8 }}
  >
    <div className="absolute inset-0 opacity-30">
        <img 
          src={coverImg} 
          alt="Cover" 
          className="w-full h-full object-cover blur-sm" 
          onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000&auto=format&fit=crop"; }}
        />
    </div>

    <motion.div
      initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10"
    >
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <div className="w-72 sm:w-88 md:w-[420px] h-72 sm:h-88 md:h-[420px] rounded-full border border-dashed border-[#D4AF37]/40" />
      </motion.div>

      <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 mx-auto rounded-full overflow-hidden border-4 border-[#D4AF37]/50 p-2 shadow-2xl relative z-10 bg-slate-950">
         <img 
           src={coverImg} 
           alt="Couple" 
           className="w-full h-full object-cover rounded-full" 
           onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000&auto=format&fit=crop"; }}
         />
      </div>

      <div className="mt-8 flex flex-col items-center justify-center z-20">
        <motion.p className="text-[#D4AF37] font-serif text-sm tracking-[0.3em] uppercase mb-2" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}>
          The Wedding of
        </motion.p>
        <motion.h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-tight" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}>
          {name1}
          <motion.span className="block text-3xl sm:text-4xl my-1 text-[#D4AF37]">
            &
          </motion.span>
          {name2}
        </motion.h1>
      </div>
    </motion.div>

    <motion.div className="mt-8 space-y-4 z-10" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 0.8 }}>
      <p className="text-gray-300 font-sans text-sm">Kepada Yth.</p>
      <motion.p className="font-sans font-bold text-2xl text-white" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        {guestName || "Tamu Undangan"}
      </motion.p>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <button onClick={onOpen} className="mt-6 px-10 py-4 rounded-full bg-[#D4AF37] text-slate-950 font-bold uppercase tracking-widest text-sm hover:bg-[#FFDF73] transition-colors shadow-[0_0_20px_rgba(212,175,55,0.3)]">
          ✉ Buka Undangan
        </button>
      </motion.div>
    </motion.div>
  </motion.section>
);

// 🔥 BAWAAN "BISMILLAH" & "ASSALAMUALAIKUM" UDAH DIHAPUS 🔥
const OpeningSection = ({ message }) => {
  if (!message) return null; 
  return (
    <AnimatedSection className="py-20 px-6 text-center max-w-2xl mx-auto text-slate-800">
      <SectionDivider />
      <p className="text-base sm:text-lg text-slate-600 leading-relaxed whitespace-pre-line mt-6">
        {message}
      </p>
    </AnimatedSection>
  );
};

const CoupleSection = ({ profiles }) => (
  <ParallaxSection speed={0.15}>
    <div className="py-20 px-6 max-w-4xl mx-auto">
      <AnimatedSection className="text-center mb-12" animation="scale">
        <h2 className="font-serif text-3xl sm:text-4xl text-slate-800 italic">Mempelai</h2>
        <SectionDivider />
      </AnimatedSection>
      <div className="flex flex-col sm:flex-row gap-8 items-stretch justify-center">
        {profiles.map((person, index) => (
            <AnimatedSection
                key={person.id || index}
                delay={index * 0.2}
                animation={index % 2 === 0 ? "fade-left" : "fade-right"}
                className="flex-1 min-w-[280px] flex flex-col items-center bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-xl hover:shadow-2xl hover:border-[#D4AF37]/30 transition-all duration-500"
            >
                {person.photoUrl || person.photo_url ? (
                  <div className="w-44 h-44 sm:w-52 sm:h-52 mx-auto rounded-full overflow-hidden border-4 border-[#D4AF37]/30 p-1 mb-6 shadow-inner">
                    <img 
                      src={person.photoUrl || person.photo_url} 
                      alt={person.fullName || person.full_name} 
                      className="w-full h-full object-cover object-center rounded-full" 
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=500&q=80"; }}
                    />
                  </div>
                ) : (
                  <div className="w-44 h-44 sm:w-52 sm:h-52 mx-auto rounded-full overflow-hidden border-4 border-[#D4AF37]/30 p-1 mb-6 shadow-inner flex items-center justify-center bg-slate-50">
                     <Heart className="w-12 h-12 text-[#D4AF37]" />
                  </div>
                )}
                <p className="text-[#D4AF37] text-xs font-bold tracking-[0.2em] uppercase mb-4 font-sans">{person.role || (index === 0 ? "Mempelai Pria" : "Mempelai Wanita")}</p>
                <h3 className="font-serif text-2xl sm:text-3xl text-slate-800 mb-4 leading-tight font-medium italic">{person.fullName || person.full_name}</h3>
                <div className="w-12 h-px bg-[#D4AF37]/40 mx-auto mb-4" />
                <p className="font-sans text-slate-600 text-base leading-relaxed">{person.parentsInfo || person.parents_info}</p>
                <p className="font-sans text-slate-500 text-sm mt-3 font-bold italic">{person.birthPlace || person.birth_place}</p>
                {person.address && <p className="font-sans text-slate-400 text-sm mt-1">{person.address}</p>}
            </AnimatedSection>
        ))}
      </div>
    </div>
  </ParallaxSection>
);

function getTimeLeft(dateStr) {
  if (!dateStr) { return calculateDiff(Date.now() + 30 * 24 * 60 * 60 * 1000); }
  const cleanStr = typeof dateStr === 'string' && dateStr.includes(',') ? dateStr.split(', ')[1] : dateStr;
  let targetTime = new Date(cleanStr).getTime();
  if (isNaN(targetTime)) { targetTime = Date.now() + 14 * 24 * 60 * 60 * 1000; }
  return calculateDiff(targetTime);
}

function calculateDiff(targetTime) {
  const diff = Math.max(0, targetTime - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

const CountdownSection = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft(targetDate)), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <ParallaxSection speed={0.2} className="bg-slate-900 text-white">
      <div className="py-20 px-6">
        <AnimatedSection className="text-center max-w-2xl mx-auto" animation="blur">
          <h2 className="font-serif text-3xl sm:text-4xl italic text-[#D4AF37]">Menuju Hari Bahagia</h2>
          <SectionDivider />
          <div className="flex justify-center gap-4 sm:gap-8 mt-8">
            {[
              { value: timeLeft.days, label: "Hari" },
              { value: timeLeft.hours, label: "Jam" },
              { value: timeLeft.minutes, label: "Menit" },
              { value: timeLeft.seconds, label: "Detik" },
            ].map((item, i) => (
              <motion.div key={item.label} className="text-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6 }}>
                <motion.div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-2 hover:border-[#D4AF37]/50 transition-colors shadow-lg" whileHover={{ scale: 1.1, rotate: 3 }}>
                  <motion.span className="font-serif text-2xl sm:text-3xl text-[#D4AF37]" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    {String(item.value).padStart(2, "0")}
                  </motion.span>
                </motion.div>
                <p className="text-xs sm:text-sm text-gray-400 tracking-wider uppercase font-bold">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </ParallaxSection>
  );
};

const EventsSection = ({ sessions, eventId, navigate }) => {
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) return null;
  return (
    <div className="py-20 px-6 max-w-4xl mx-auto">
      <AnimatedSection className="text-center mb-12">
        <h2 className="font-serif text-3xl sm:text-4xl text-slate-800 italic">Rangkaian Acara</h2>
        <SectionDivider />
        <p className="text-slate-500 text-lg">Momen yang telah kami nantikan</p>
      </AnimatedSection>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {sessions.map((s, i) => (
            <AnimatedSection key={s.id || i} delay={i * 0.15} className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-1 bg-[#D4AF37]"></div>
              <h3 className="font-serif text-2xl text-[#D4AF37] mb-6">{s.name}</h3>
              <div className="space-y-4 text-slate-600 font-medium mb-8 font-sans">
                <div className="flex items-center justify-center gap-3"><Calendar className="w-5 h-5 text-[#D4AF37]" /><span>{s.date}</span></div>
                <div className="flex items-center justify-center gap-3"><Clock className="w-5 h-5 text-[#D4AF37]" /><span>{s.start_time || s.startTime} – {s.end_time || s.endTime}</span></div>
                <div className="flex items-center justify-center gap-3"><MapPin className="w-5 h-5 text-[#D4AF37]" /><span>{s.name_place || s.place || s.location?.namePlace}</span></div>
              </div>
              {(s.map_url || s.mapUrl || s.location?.mapUrl) && (
                  <a href={s.map_url || s.mapUrl || s.location?.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-block mt-2">
                  <button className="px-6 py-2 text-xs font-bold tracking-widest uppercase border-2 border-[#D4AF37] text-[#D4AF37] rounded-full hover:bg-[#D4AF37] hover:text-white transition-colors flex items-center gap-2 font-sans">
                      <MapPin className="w-4 h-4" /> Buka Peta
                  </button>
                  </a>
              )}
            </AnimatedSection>
        ))}
      </div>

      <AnimatedSection delay={0.4} className="mt-16 text-center">
          <button 
              onClick={() => navigate(`/rsvp/${eventId}`)}
              className="px-10 py-5 bg-slate-900 text-[#D4AF37] rounded-full font-bold uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all hover:-translate-y-1 font-sans"
          >
              Tentukan Kehadiran (RSVP)
          </button>
      </AnimatedSection>
    </div>
  );
};

// 🔥 QUOTE GALERI BAWAAN UDAH DIHAPUS 🔥
const GallerySection = ({ images }) => {
  if (!images || !Array.isArray(images) || images.length === 0) return null;
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  return (
    <div className="py-20 px-6 max-w-3xl mx-auto">
      <AnimatedSection className="text-center mb-12">
        <h2 className="font-serif text-3xl sm:text-4xl text-slate-800 italic">Galeri & Cerita</h2>
        <SectionDivider />
      </AnimatedSection>
      <AnimatedSection className="relative">
        <div className="relative overflow-hidden rounded-3xl aspect-[4/3] bg-slate-100 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.img 
              key={current} 
              src={images[current]} 
              alt={`Gallery ${current + 1}`} 
              className="w-full h-full object-cover" 
              initial={{ opacity: 0, x: 50 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -50 }} 
              transition={{ duration: 0.4 }} 
              onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"; }}
            />
          </AnimatePresence>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur shadow-lg flex items-center justify-center text-slate-800 hover:bg-white transition-colors"><ChevronLeft className="w-6 h-6" /></button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur shadow-lg flex items-center justify-center text-slate-800 hover:bg-white transition-colors"><ChevronRight className="w-6 h-6" /></button>
        </div>
        <div className="flex justify-center gap-3 mt-8">
          {images.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all ${i === current ? "bg-[#D4AF37] w-8" : "bg-slate-300 w-2"}`} aria-label={`Go to slide ${i + 1}`} />
          ))}
        </div>
      </AnimatedSection>
    </div>
  );
};

const WishesSection = ({ quote, greetings }) => {
  const safeGreetings = Array.isArray(greetings) ? greetings : [];
  return (
    <div className="py-20 px-6 max-w-4xl mx-auto text-center">
      <AnimatedSection>
        <h2 className="font-serif text-3xl sm:text-4xl text-slate-800 italic">Doa & Ucapan</h2>
        <SectionDivider />
      </AnimatedSection>
      
      <AnimatedSection delay={0.2} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-xl mt-8 relative">
        <Heart className="w-10 h-10 text-[#D4AF37] mx-auto mb-8 animate-pulse" />
        {quote && (
          <p className="font-serif text-xl md:text-2xl text-slate-700 leading-relaxed italic whitespace-pre-line font-medium mb-10">
            "{quote}"
          </p>
        )}

        <div className="text-left bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-4">
              <span className="bg-[#D4AF37] text-white font-bold px-3 py-1 rounded-lg text-sm">{safeGreetings.length}</span>
              <h3 className="font-bold text-slate-800 font-sans uppercase tracking-widest text-sm">Pesan Kehadiran</h3>
          </div>

          <div className="h-80 overflow-y-auto pr-2 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#D4AF37 transparent' }}>
            {safeGreetings.length > 0 ? (
              safeGreetings.map((g, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  viewport={{ once: true }} 
                  key={i} 
                  className="bg-white p-5 rounded-xl shadow-sm border border-slate-100"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-slate-800 font-sans text-sm capitalize">{g.name || g.attendee_name}</p>
                    <p className="text-[10px] text-slate-400 font-sans uppercase tracking-wider">{g.time || ""}</p>
                  </div>
                  <p className="text-slate-600 font-sans text-sm leading-relaxed italic">"{g.greeting || g.pesan}"</p>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-60">
                 <span className="text-4xl mb-3">💌</span>
                 <p className="font-sans text-sm italic text-center">Belum ada ucapan.<br/>Jadilah yang pertama memberikan doa saat RSVP!</p>
              </div>
            )}
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
};

const GiftSection = ({ gifts }) => {
  if (!gifts || !Array.isArray(gifts) || gifts.length === 0) return null;
  return (
    <div className="py-20 px-6 max-w-2xl mx-auto">
      <AnimatedSection className="text-center mb-12">
        <Gift className="w-10 h-10 text-[#D4AF37] mx-auto mb-6" />
        <h2 className="font-serif text-3xl sm:text-4xl text-slate-800 italic">Wedding Gift</h2>
        <SectionDivider />
        <p className="text-slate-500 text-base leading-relaxed mt-6">
          Doa restu Anda merupakan karunia yang sangat berarti bagi kami.
          Namun jika Anda ingin memberikan tanda kasih, kami menyediakan informasi berikut.
        </p>
      </AnimatedSection>
      <div className="grid gap-6 font-sans">
        {gifts.map((account, index) => {
           const [copied, setCopied] = useState(false);
           const copy = () => {
             navigator.clipboard.writeText(account.accountNumber || account.account_number);
             setCopied(true);
             setTimeout(() => setCopied(false), 2000);
           };
           return (
              <AnimatedSection key={account.id || index} delay={index * 0.15} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-lg text-center">
                <p className="text-[#D4AF37] text-sm font-bold tracking-widest uppercase mb-4">{account.bankName || account.bank_name}</p>
                <p className="font-serif text-2xl text-slate-800 mb-2 italic font-medium">{account.accountName || account.account_name}</p>
                <p className="font-mono text-slate-600 text-xl tracking-[0.2em] mb-6 font-bold">{account.accountNumber || account.account_number}</p>
                <button onClick={copy} className="px-6 py-2 rounded-full border-2 border-[#D4AF37] text-[#D4AF37] font-bold uppercase text-xs tracking-widest hover:bg-[#D4AF37] hover:text-white transition-colors flex items-center justify-center mx-auto gap-2">
                  {copied ? <><Check className="w-4 h-4" /> Tersalin</> : <><Copy className="w-4 h-4" /> Salin Nomor</>}
                </button>
              </AnimatedSection>
           );
        })}
      </div>
    </div>
  );
};

// 🔥 BAWAAN "WASSALAMUALAIKUM" UDAH DIHAPUS 🔥
const ClosingSection = ({ message, name1, name2 }) => (
  <div className="py-20 px-6 text-center max-w-2xl mx-auto relative overflow-hidden">
    <AnimatedSection animation="scale">
      <h2 className="font-serif text-4xl text-[#D4AF37] italic mb-8">Terima Kasih</h2>
      
      {message && (
        <p className="text-slate-600 text-lg leading-relaxed mb-8 whitespace-pre-line">
          {message}
        </p>
      )}

      <div className="mt-12 font-sans">
        <p className="font-serif text-3xl text-slate-800 italic font-medium">{name1} & {name2}</p>
      </div>
    </AnimatedSection>
    <motion.div className="mt-20 pt-8 border-t border-slate-200" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
      <p className="text-xs text-slate-400 font-bold tracking-widest uppercase font-sans">Powered by EventRent ❤️</p>
    </motion.div>
  </div>
);

/* ─── MAIN COMPONENT: THEME ELEGANT GOLD ─── */
export default function ThemeElegantGold({ eventData, guestName, isOpen, onOpen }) {
  const navigate = useNavigate();

  let details = eventData?.eventDetails || eventData?.event_details || {};
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch (e) { details = {}; }
  }

  let profilesList = details.profiles || [];
  if (typeof profilesList === 'string') {
    try { profilesList = JSON.parse(profilesList); } catch (e) { profilesList = []; }
  }

  const gallery = Array.isArray(details.galleryImages || details.gallery_images) ? (details.galleryImages || details.gallery_images) : [];
  const gifts = Array.isArray(details.digitalGifts || details.digital_gifts) ? (details.digitalGifts || details.digital_gifts) : [];
  
  const name1 = profilesList[0]?.nickName || profilesList[0]?.fullName?.split(' ')[0] || 'Mempelai 1';
  const name2 = profilesList[1]?.nickName || profilesList[1]?.fullName?.split(' ')[0] || 'Mempelai 2';

  const audioSrc = details.bgMusicUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 

  return (
    <div className="min-h-screen bg-[#FDFBF7] overflow-x-hidden font-sans">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div key="hero" exit={{ opacity: 0, y: -100 }} transition={{ duration: 0.8, ease: "easeInOut" }} className="absolute inset-0 z-50 bg-slate-950">
            <HeroSection 
               onOpen={onOpen} 
               name1={name1} name2={name2} 
               guestName={guestName} 
               coverImg={eventData?.img || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000&auto=format&fit=crop"} 
            />
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }}>
            <FloatingPetals />
            <MusicPlayer src={audioSrc} autoPlay /> 
            
            <OpeningSection message={details.openingMessage || details.opening_message} />
            {profilesList.length > 0 && <CoupleSection profiles={profilesList} />}
            <CountdownSection targetDate={eventData?.date_start} />
            <EventsSection sessions={eventData?.sessions || []} eventId={eventData?.id} navigate={navigate} />
            <GallerySection images={gallery} />
            <WishesSection quote={details.quote} greetings={eventData?.greetings} />
            <GiftSection gifts={gifts} />
            <ClosingSection message={details.closingMessage || details.closing_message} name1={name1} name2={name2} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
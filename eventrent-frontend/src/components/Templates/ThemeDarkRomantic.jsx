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
    {/* TEMA DARK ROMANTIC: Pakai ornamen klasik */}
    <span className="text-rose-700 text-3xl opacity-80 font-serif">❦</span>
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

/* ─── FLOATING PETALS (Warna Maroon & Red) ─── */
const FloatingPetals = () => {
  const [petals, setPetals] = useState([]);

  useEffect(() => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 15 + 8, 
      delay: Math.random() * 8,
      duration: Math.random() * 8 + 12, 
      rotation: Math.random() * 360,
      type: ["petal", "sparkle", "petal"][Math.floor(Math.random() * 3)],
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
            opacity: [0, 0.7, 0.3, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
        >
          {p.type === "petal" && (
            <svg width={p.size} height={p.size} viewBox="0 0 20 20">
              {/* Warna Maroon Gelap */}
              <ellipse cx="10" cy="10" rx="6" ry="10" fill="hsl(340 80% 30% / 0.6)" transform="rotate(30 10 10)" />
            </svg>
          )}
          {p.type === "sparkle" && (
            <span className="text-rose-400" style={{ fontSize: p.size, opacity: 0.4 }}>✦</span>
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
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-rose-900 border border-rose-700 text-rose-200 shadow-lg flex items-center justify-center hover:bg-rose-800 transition-colors"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </motion.button>
    </>
  );
};

/* ─── SECTIONS DENGAN DATA DINAMIS (DARK ROMANTIC THEME) ─── */
const HeroSection = ({ onOpen, name1, name2, guestName, coverImg }) => (
  <motion.section
    className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden bg-stone-950 text-stone-300"
    initial={{ opacity: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.8 }}
  >
    {/* OVERLAY DRAMATIS */}
    <div className="absolute inset-0">
        <img 
          src={coverImg} 
          alt="Cover" 
          className="w-full h-full object-cover grayscale-[30%] opacity-40" 
          onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1505934333218-8ef25c0e1db7?q=80&w=1000&auto=format&fit=crop"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-rose-950/50"></div>
    </div>

    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="relative z-10 w-full max-w-lg"
    >
      <div className="w-[280px] h-[380px] sm:w-[320px] sm:h-[440px] mx-auto rounded-t-full overflow-hidden border border-rose-900/50 p-2 shadow-2xl relative z-10 bg-stone-900/50 backdrop-blur-sm">
         <img 
           src={coverImg} 
           alt="Couple" 
           className="w-full h-full object-cover rounded-t-full grayscale-[20%]" 
           onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1505934333218-8ef25c0e1db7?q=80&w=1000&auto=format&fit=crop"; }}
         />
      </div>

      <div className="mt-12 flex flex-col items-center justify-center z-20">
        <motion.p className="text-rose-400 font-serif text-xs tracking-[0.4em] uppercase mb-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.8 }}>
          The Wedding Of
        </motion.p>
        <motion.h1 className="font-serif text-5xl sm:text-6xl md:text-7xl leading-none text-white tracking-tight" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 1 }}>
          {name1}
          <motion.span className="block text-3xl sm:text-4xl my-4 text-rose-700 italic font-light">
            &
          </motion.span>
          {name2}
        </motion.h1>
      </div>
    </motion.div>

    <motion.div className="mt-16 space-y-3 z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 1 }}>
      <p className="text-stone-500 font-sans text-[10px] uppercase tracking-widest">Kepada Yth.</p>
      <motion.p className="font-serif text-2xl text-rose-200 font-medium" animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        {guestName || "Tamu Undangan"}
      </motion.p>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="pt-6">
        <button onClick={onOpen} className="px-10 py-4 border border-rose-800 bg-rose-950/40 backdrop-blur-sm text-rose-200 font-bold uppercase tracking-widest text-xs hover:bg-rose-900 transition-colors shadow-lg">
          Buka Undangan
        </button>
      </motion.div>
    </motion.div>
  </motion.section>
);

const OpeningSection = ({ message }) => (
  <AnimatedSection className="py-24 px-6 text-center max-w-2xl mx-auto text-stone-400">
    <p className="text-rose-700 text-xs tracking-[0.4em] uppercase mb-6 font-bold">Bismillahirrahmanirrahim</p>
    <SectionDivider />
    <p className="text-xl sm:text-2xl text-rose-200 leading-relaxed font-serif italic mb-6 mt-4">
      Assalamu'alaikum Warahmatullahi Wabarakatuh
    </p>
    <p className="text-sm sm:text-base leading-loose font-light">
      {message || "Dengan memohon rahmat dan ridho Allah Subhanahu Wa Ta'ala, kami bermaksud menyelenggarakan pernikahan putra-putri kami. Merupakan suatu kehormatan dan kebahagiaan apabila Bapak/Ibu/Saudara/i berkenan hadir."}
    </p>
  </AnimatedSection>
);

const CoupleSection = ({ profiles }) => (
  <ParallaxSection speed={0.1}>
    <div className="py-16 px-6 max-w-5xl mx-auto">
      <AnimatedSection className="text-center mb-20" animation="scale">
        <h2 className="font-serif text-3xl sm:text-5xl text-rose-200 italic mb-2">Dua Jiwa Menjadi Satu</h2>
        <SectionDivider />
      </AnimatedSection>
      <div className="flex flex-col md:flex-row gap-16 items-center justify-center relative">
        {/* Garis penghubung di desktop */}
        <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-px bg-rose-900/50 -translate-y-1/2 z-0"></div>
        
        {profiles.map((person, index) => (
            <AnimatedSection
                key={person.id || index}
                delay={index * 0.2}
                animation={index % 2 === 0 ? "fade-left" : "fade-right"}
                className="flex-1 w-full max-w-sm flex flex-col items-center text-center z-10"
            >
                {person.photoUrl || person.photo_url ? (
                  <div className="w-56 h-72 sm:w-64 sm:h-80 mx-auto rounded-t-full overflow-hidden border border-rose-900/50 p-2 mb-8 bg-stone-900 shadow-2xl relative">
                    <img 
                      src={person.photoUrl || person.photo_url} 
                      alt={person.fullName || person.full_name} 
                      className="w-full h-full object-cover object-center rounded-t-full grayscale-[15%]" 
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=500&q=80"; }}
                    />
                  </div>
                ) : (
                  <div className="w-56 h-72 sm:w-64 sm:h-80 mx-auto rounded-t-full overflow-hidden border border-rose-900/50 p-2 mb-8 bg-stone-900 flex items-center justify-center shadow-2xl relative">
                      <Heart className="w-12 h-12 text-rose-900" />
                  </div>
                )}
                <p className="text-rose-700 text-[10px] font-black tracking-[0.3em] uppercase mb-4">{person.role || (index === 0 ? "Mempelai Pria" : "Mempelai Wanita")}</p>
                <h3 className="font-serif text-3xl sm:text-4xl text-white mb-4 leading-tight">{person.fullName || person.full_name || "Nama Mempelai"}</h3>
                <p className="font-sans text-stone-400 text-sm leading-relaxed max-w-xs">{person.parentsInfo || person.parents_info || "Putra/i Bapak dan Ibu"}</p>
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
    <div className="py-24 px-6 relative overflow-hidden bg-rose-950/10 border-y border-rose-950/30">
      <AnimatedSection className="text-center max-w-2xl mx-auto relative z-10" animation="blur">
        <h2 className="font-serif text-2xl sm:text-3xl text-rose-200 tracking-widest uppercase mb-4">Save The Date</h2>
        <SectionDivider />
        <div className="flex justify-center gap-4 sm:gap-6 mt-12">
          {[
            { value: timeLeft.days, label: "Days" },
            { value: timeLeft.hours, label: "Hours" },
            { value: timeLeft.minutes, label: "Mins" },
            { value: timeLeft.seconds, label: "Secs" },
          ].map((item, i) => (
            <motion.div key={item.label} className="text-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6 }}>
              <motion.div className="w-16 h-16 sm:w-20 sm:h-20 border border-rose-800/50 bg-stone-950 flex items-center justify-center mb-3 transform rotate-45 hover:rotate-0 transition-transform duration-500" whileHover={{ scale: 1.1 }}>
                <span className="font-serif text-2xl sm:text-3xl text-white font-medium -rotate-45 hover:rotate-0 transition-transform duration-500">
                  {String(item.value).padStart(2, "0")}
                </span>
              </motion.div>
              <p className="text-[10px] sm:text-xs text-rose-700 tracking-widest uppercase font-bold mt-4">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>
    </div>
  );
};

const EventsSection = ({ sessions, eventId, navigate }) => {
  if (!sessions || !Array.isArray(sessions) || sessions.length === 0) return null;
  return (
    <div className="py-24 px-6 max-w-5xl mx-auto">
      <AnimatedSection className="text-center mb-16">
        <h2 className="font-serif text-3xl sm:text-4xl text-rose-200 italic mb-4">Waktu & Tempat</h2>
        <SectionDivider />
      </AnimatedSection>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {sessions.map((s, i) => (
            <AnimatedSection key={s.id || i} delay={i * 0.15} className="bg-stone-900/40 p-10 text-center border border-rose-900/30 relative">
              <h3 className="font-serif text-2xl text-rose-300 mb-8 uppercase tracking-widest">{s.name}</h3>
              <div className="space-y-5 text-stone-400 text-sm font-sans mb-10">
                <div className="flex items-center justify-center gap-3"><span className="text-white font-serif text-xl">{s.date}</span></div>
                <div className="flex items-center justify-center gap-3"><Clock className="w-4 h-4 text-rose-800" /><span>{s.start_time || s.startTime} – {s.end_time || s.endTime}</span></div>
                <div className="flex items-center justify-center gap-3"><MapPin className="w-4 h-4 text-rose-800" /><span>{s.name_place || s.place || s.location?.namePlace}</span></div>
              </div>
              {(s.map_url || s.mapUrl || s.location?.mapUrl) && (
                  <a href={s.map_url || s.mapUrl || s.location?.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                  <button className="px-8 py-3 text-[10px] font-bold tracking-widest uppercase border border-rose-800 text-rose-300 hover:bg-rose-900 hover:text-white transition-colors">
                      Lihat Lokasi
                  </button>
                  </a>
              )}
            </AnimatedSection>
        ))}
      </div>

      <AnimatedSection delay={0.4} className="mt-20 text-center">
          <button 
              onClick={() => navigate(`/rsvp/${eventId}`)}
              className="px-12 py-5 bg-rose-900 text-rose-100 font-bold uppercase tracking-widest hover:bg-rose-800 transition-all hover:scale-105 text-xs shadow-xl shadow-rose-900/20"
          >
              Konfirmasi Kehadiran (RSVP)
          </button>
      </AnimatedSection>
    </div>
  );
};

const GallerySection = ({ images }) => {
  if (!images || !Array.isArray(images) || images.length === 0) return null;
  const [current, setCurrent] = useState(0);
  const prev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  return (
    <div className="py-20 px-6 max-w-4xl mx-auto">
      <AnimatedSection className="text-center mb-16">
        <h2 className="font-serif text-3xl sm:text-4xl text-rose-200 italic">Abadikan Momen</h2>
        <SectionDivider />
      </AnimatedSection>
      <AnimatedSection className="relative">
        <div className="relative overflow-hidden aspect-[4/3] bg-stone-900 border border-stone-800 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.img 
              key={current} 
              src={images[current]} 
              alt={`Gallery ${current + 1}`} 
              className="w-full h-full object-cover opacity-80" 
              initial={{ opacity: 0, filter: "blur(10px)" }} 
              animate={{ opacity: 0.8, filter: "blur(0px)" }} 
              exit={{ opacity: 0, filter: "blur(10px)" }} 
              transition={{ duration: 0.5 }} 
              onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"; }}
            />
          </AnimatePresence>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-rose-800/50 bg-stone-950/80 backdrop-blur flex items-center justify-center text-rose-400 hover:text-rose-200 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 border border-rose-800/50 bg-stone-950/80 backdrop-blur flex items-center justify-center text-rose-400 hover:text-rose-200 transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="flex justify-center gap-3 mt-6">
          {images.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-1 transition-all ${i === current ? "bg-rose-700 w-8" : "bg-stone-800 w-3"}`} />
          ))}
        </div>
      </AnimatedSection>
    </div>
  );
};

const WishesSection = ({ quote, greetings }) => {
  const safeGreetings = Array.isArray(greetings) ? greetings : [];
  return (
    <div className="py-20 px-6 max-w-3xl mx-auto text-center">
      <AnimatedSection>
        <h2 className="font-serif text-3xl sm:text-4xl text-rose-200 italic">Doa & Ucapan</h2>
        <SectionDivider />
      </AnimatedSection>
      
      <AnimatedSection delay={0.2} className="bg-stone-900/50 border border-rose-900/20 p-8 sm:p-12 mt-8 relative">
        <Heart className="w-6 h-6 text-rose-900 mx-auto mb-6" />
        <p className="font-serif text-lg text-stone-400 leading-loose italic whitespace-pre-line mb-12">
          "{quote || 'Mencintai bukan sekadar saling memandang, melainkan memandang ke arah yang sama bersama-sama.'}"
        </p>

        <div className="text-left bg-stone-950 p-6 border border-stone-800 shadow-inner">
          <div className="flex items-center gap-3 mb-6 border-b border-stone-800 pb-4">
              <span className="bg-rose-900 text-rose-200 font-bold px-3 py-1 text-xs">{safeGreetings.length}</span>
              <h3 className="font-bold text-stone-400 font-sans uppercase tracking-widest text-xs">Pesan Kehadiran</h3>
          </div>

          <div className="h-[350px] overflow-y-auto pr-3 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#881337 transparent' }}>
            {safeGreetings.length > 0 ? (
              safeGreetings.map((g, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} key={i} 
                  className="bg-stone-900/50 p-5 border border-stone-800"
                >
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-serif text-rose-300 text-base capitalize">{g.name || g.attendee_name}</p>
                    <p className="text-[10px] text-stone-600 font-sans uppercase tracking-wider">{g.time || ""}</p>
                  </div>
                  <p className="text-stone-400 font-sans text-sm leading-relaxed italic">"{g.greeting || g.pesan}"</p>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-stone-600">
                <span className="text-3xl mb-3 opacity-30">💌</span>
                <p className="font-sans text-sm italic text-center">Belum ada ucapan.<br/>Jadilah yang pertama memberikan doa!</p>
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
        <Gift className="w-8 h-8 text-rose-900 mx-auto mb-6" />
        <h2 className="font-serif text-3xl sm:text-4xl text-rose-200 italic mb-4">Tanda Kasih</h2>
        <p className="text-stone-500 text-sm leading-relaxed max-w-md mx-auto">
          Doa restu Anda merupakan karunia yang sangat berarti bagi kami. Jika Anda ingin memberikan tanda kasih secara digital, Anda dapat melalui tautan berikut.
        </p>
      </AnimatedSection>
      <div className="grid gap-6 font-sans">
        {gifts.map((account, index) => {
           const [copied, setCopied] = useState(false);
           const copy = () => { navigator.clipboard.writeText(account.accountNumber || account.account_number); setCopied(true); setTimeout(() => setCopied(false), 2000); };
           return (
              <AnimatedSection key={index} delay={index * 0.15} className="bg-stone-900 p-8 border border-rose-900/20 text-center relative overflow-hidden">
                <p className="text-rose-800 text-xs font-bold tracking-widest uppercase mb-3">{account.bankName || account.bank_name}</p>
                <p className="font-serif text-xl text-stone-300 mb-1 italic">{account.accountName || account.account_name}</p>
                <p className="font-mono text-white text-xl tracking-[0.2em] mb-6 font-medium">{account.accountNumber || account.account_number}</p>
                <button onClick={copy} className="px-6 py-2 border border-rose-900 text-rose-400 font-bold uppercase text-[10px] tracking-widest hover:bg-rose-900 hover:text-white transition-colors flex items-center justify-center mx-auto gap-2">
                  {copied ? <><Check className="w-4 h-4" /> Tersalin</> : <><Copy className="w-4 h-4" /> Salin Nomor</>}
                </button>
              </AnimatedSection>
           );
        })}
      </div>
    </div>
  );
};

const ClosingSection = ({ message, name1, name2 }) => (
  <div className="py-24 px-6 text-center max-w-2xl mx-auto relative overflow-hidden">
    <AnimatedSection animation="scale">
      <h2 className="font-serif text-4xl sm:text-5xl text-rose-200 italic mb-8">Terima Kasih</h2>
      <p className="text-stone-400 text-sm sm:text-base leading-loose mb-12 max-w-lg mx-auto font-light">
        {message || "Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu."}
      </p>
      <div className="mt-8">
        <p className="text-[10px] text-rose-900 font-bold tracking-[0.3em] uppercase mb-4">Wassalamu'alaikum Warahmatullahi Wabarakatuh</p>
        <p className="font-serif text-4xl text-white italic">{name1} & {name2}</p>
      </div>
    </AnimatedSection>
    <motion.div className="mt-32 pt-8 border-t border-stone-900" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
      <p className="text-[10px] text-stone-600 font-bold tracking-widest uppercase font-sans">Powered by EventRent 🍷</p>
    </motion.div>
  </div>
);

/* ─── MAIN COMPONENT: THEME DARK ROMANTIC ─── */
export default function ThemeDarkRomantic({ eventData, guestName, isOpen, onOpen }) {
  const navigate = useNavigate();

  // Safe parsing untuk event details
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
    <div className="min-h-screen bg-stone-950 overflow-x-hidden font-sans selection:bg-rose-900 selection:text-white">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div key="hero" exit={{ opacity: 0, y: -50, filter: "blur(20px)" }} transition={{ duration: 1, ease: "easeInOut" }} className="absolute inset-0 z-50 bg-stone-950">
            <HeroSection 
               onOpen={onOpen} 
               name1={name1} name2={name2} 
               guestName={guestName} 
               coverImg={eventData?.img || "https://images.unsplash.com/photo-1505934333218-8ef25c0e1db7?q=80&w=1000&auto=format&fit=crop"} 
            />
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, delay: 0.2 }}>
            <FloatingPetals />
            <MusicPlayer src={audioSrc} autoPlay /> 
            
            <OpeningSection message={details.openingMessage} />
            {profilesList.length > 0 && <CoupleSection profiles={profilesList} />}
            <CountdownSection targetDate={eventData?.date_start} />
            <EventsSection sessions={eventData?.sessions || []} eventId={eventData?.id} navigate={navigate} />
            <GallerySection images={gallery} />
            <WishesSection quote={details.quote} greetings={eventData?.greetings} />
            <GiftSection gifts={gifts} />
            <ClosingSection message={details.closingMessage} name1={name1} name2={name2} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
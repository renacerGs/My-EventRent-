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
    <span className="text-rose-400 text-3xl opacity-80">❀</span>
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
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 15 + 8, 
      delay: Math.random() * 8,
      duration: Math.random() * 8 + 12, 
      rotation: Math.random() * 360,
      type: ["petal", "petal", "leaf"][Math.floor(Math.random() * 3)], 
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
            opacity: [0, 0.7, 0.4, 0],
          }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "linear" }}
        >
          {p.type === "petal" && (
            <svg width={p.size} height={p.size} viewBox="0 0 20 20">
              <ellipse cx="10" cy="10" rx="6" ry="10" fill="hsl(340 70% 85% / 0.6)" transform="rotate(30 10 10)" />
            </svg>
          )}
          {p.type === "leaf" && (
            <svg width={p.size} height={p.size} viewBox="0 0 24 24" fill="hsl(140 30% 80% / 0.5)">
               <path d="M12 2C7.5 2 4 5.5 4 10c0 4.5 8 12 8 12s8-7.5 8-12c0-4.5-3.5-8-8-8z" />
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
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-rose-400 text-white shadow-lg flex items-center justify-center hover:bg-rose-500 transition-colors"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isPlaying ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
      </motion.button>
    </>
  );
};

/* ─── SECTIONS ─── */
const HeroSection = ({ onOpen, name1, name2, guestName, coverImg }) => (
  <motion.section
    className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden bg-[#FDFCFB] text-slate-900"
    initial={{ opacity: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.8 }}
  >
    <div className="absolute inset-0">
        <img 
          src={coverImg} 
          alt="Cover" 
          className="w-full h-full object-cover" 
          onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000&auto=format&fit=crop"; }}
        />
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px]"></div>
    </div>

    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 1.5, ease: "easeOut" }}
      className="relative z-10"
    >
      <div className="w-64 h-64 sm:w-80 sm:h-80 md:w-[400px] md:h-[400px] mx-auto rounded-t-full overflow-hidden border-[8px] border-white p-1 shadow-xl relative z-10 bg-rose-50">
         <img 
           src={coverImg} 
           alt="Couple" 
           className="w-full h-full object-cover rounded-t-full" 
           onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000&auto=format&fit=crop"; }}
         />
      </div>

      <div className="mt-10 flex flex-col items-center justify-center z-20">
        <motion.p className="text-rose-500 font-serif text-sm tracking-[0.3em] uppercase mb-4 font-bold" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}>
          The Wedding Of
        </motion.p>
        <motion.h1 className="font-serif text-5xl sm:text-6xl md:text-7xl leading-tight text-slate-800" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 1 }}>
          {name1}
          <motion.span className="block text-4xl sm:text-5xl my-2 text-rose-300 font-light italic">
            and
          </motion.span>
          {name2}
        </motion.h1>
      </div>
    </motion.div>

    <motion.div className="mt-12 space-y-4 z-10 bg-white/60 p-6 rounded-2xl backdrop-blur-sm border border-white shadow-sm" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4, duration: 0.8 }}>
      <p className="text-slate-500 font-sans text-xs uppercase tracking-widest font-bold">Kepada Yth.</p>
      <motion.p className="font-serif font-bold text-2xl text-slate-800" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
        {guestName || "Tamu Undangan"}
      </motion.p>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <button onClick={onOpen} className="mt-4 px-10 py-3.5 rounded-full bg-rose-500 text-white font-bold uppercase tracking-widest text-xs hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200">
          ✉ Buka Undangan
        </button>
      </motion.div>
    </motion.div>
  </motion.section>
);

const OpeningSection = ({ message }) => (
  <AnimatedSection className="py-24 px-6 text-center max-w-3xl mx-auto text-slate-800">
    <SectionDivider />
    {/* 👇 FONT LEBIH ELEGAN DAN BISA BACA ENTER/BARIS BARU 👇 */}
    <p className="text-lg sm:text-2xl text-slate-700 leading-loose font-serif italic mt-8 whitespace-pre-line">
      {message || "Dengan penuh rasa syukur dan bahagia, kami bermaksud menyelenggarakan acara pernikahan putra-putri kami. Merupakan suatu kehormatan apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu."}
    </p>
  </AnimatedSection>
);

const CoupleSection = ({ profiles }) => (
  <ParallaxSection speed={0.1}>
    <div className="py-16 px-6 max-w-5xl mx-auto bg-rose-50/30 rounded-[3rem] border border-rose-50 my-10">
      <AnimatedSection className="text-center mb-16" animation="scale">
        <h2 className="font-serif text-3xl sm:text-5xl text-slate-800 italic">Sang Mempelai</h2>
        <SectionDivider />
      </AnimatedSection>
      <div className="flex flex-col md:flex-row gap-12 items-center justify-center">
        {profiles.map((person, index) => (
            <AnimatedSection
                key={index}
                delay={index * 0.2}
                animation={index % 2 === 0 ? "fade-left" : "fade-right"}
                className="flex-1 w-full max-w-sm flex flex-col items-center text-center"
            >
                {person.photoUrl || person.photo_url ? (
                  <div className="w-48 h-64 sm:w-56 sm:h-72 mx-auto rounded-t-full overflow-hidden border-[6px] border-white mb-6 shadow-xl relative">
                    <img 
                      src={person.photoUrl || person.photo_url} 
                      alt={person.fullName || person.full_name} 
                      className="w-full h-full object-cover object-center" 
                      onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=500&q=80"; }}
                    />
                  </div>
                ) : (
                  <div className="w-48 h-64 sm:w-56 sm:h-72 mx-auto rounded-t-full overflow-hidden border-[6px] border-white mb-6 shadow-xl relative bg-rose-100 flex items-center justify-center">
                      <Heart className="w-12 h-12 text-rose-300" />
                  </div>
                )}
                <p className="text-rose-400 text-[10px] font-black tracking-[0.3em] uppercase mb-4 font-sans">{person.role || (index === 0 ? "Mempelai Pria" : "Mempelai Wanita")}</p>
                <h3 className="font-serif text-3xl sm:text-4xl text-slate-800 mb-3 leading-tight font-medium">{person.fullName || person.full_name || "Nama Mempelai"}</h3>
                <div className="w-8 h-0.5 bg-rose-200 mx-auto mb-4" />
                <p className="font-sans text-slate-500 text-sm leading-relaxed">{person.parentsInfo || person.parents_info || "Putra/i Bapak dan Ibu"}</p>
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
    <div className="py-24 px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-50 rounded-full blur-3xl opacity-50 -z-10"></div>
      
      <AnimatedSection className="text-center max-w-2xl mx-auto relative z-10" animation="blur">
        <h2 className="font-serif text-3xl sm:text-4xl text-slate-800 italic mb-2">Menanti Hari Bahagia</h2>
        <SectionDivider />
        <div className="flex justify-center gap-3 sm:gap-6 mt-10">
          {[
            { value: timeLeft.days, label: "Hari" },
            { value: timeLeft.hours, label: "Jam" },
            { value: timeLeft.minutes, label: "Menit" },
            { value: timeLeft.seconds, label: "Detik" },
          ].map((item, i) => (
            <motion.div key={item.label} className="text-center" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.6 }}>
              <motion.div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-white border border-rose-100 flex items-center justify-center mb-3 shadow-lg shadow-rose-100/50" whileHover={{ scale: 1.1 }}>
                <span className="font-serif text-2xl sm:text-4xl text-rose-500 font-medium">
                  {String(item.value).padStart(2, "0")}
                </span>
              </motion.div>
              <p className="text-[10px] sm:text-xs text-slate-500 tracking-widest uppercase font-bold">{item.label}</p>
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
    <div className="py-20 px-6 max-w-5xl mx-auto">
      <AnimatedSection className="text-center mb-16">
        <h2 className="font-serif text-3xl sm:text-4xl text-slate-800 italic mb-2">Rangkaian Acara</h2>
        <SectionDivider />
        <p className="text-slate-500 text-sm max-w-md mx-auto mt-4">Kehadiran Anda adalah hadiah terindah di momen yang telah kami nantikan ini.</p>
      </AnimatedSection>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sessions.map((s, i) => (
            <AnimatedSection key={i} delay={i * 0.15} className="bg-white rounded-[2rem] p-8 text-center shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-rose-50 relative overflow-hidden group hover:-translate-y-2 transition-transform duration-500">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-rose-100 transition-colors">
                 <Calendar className="w-7 h-7 text-rose-400" />
              </div>
              <h3 className="font-serif text-2xl text-slate-800 mb-6">{s.name}</h3>
              <div className="space-y-4 text-slate-500 text-sm font-sans mb-8">
                <div className="flex items-center justify-center gap-3"><span className="font-medium text-slate-700">{s.date}</span></div>
                <div className="flex items-center justify-center gap-3"><Clock className="w-4 h-4 text-rose-300" /><span>{s.start_time || s.startTime} – {s.end_time || s.endTime}</span></div>
                <div className="flex items-center justify-center gap-3"><MapPin className="w-4 h-4 text-rose-300" /><span>{s.name_place || s.place}</span></div>
              </div>
              {(s.map_url || s.mapUrl) && (
                  <a href={s.map_url || s.mapUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                  <button className="px-8 py-2.5 text-xs font-bold tracking-widest uppercase bg-slate-50 text-slate-600 rounded-full hover:bg-rose-500 hover:text-white transition-colors">
                      Lihat Peta Lokasi
                  </button>
                  </a>
              )}
            </AnimatedSection>
        ))}
      </div>

      <AnimatedSection delay={0.4} className="mt-20 text-center">
          <button 
              onClick={() => navigate(`/party-rsvp/${eventId}`)}
              className="px-12 py-4 bg-slate-800 text-white rounded-full font-bold uppercase tracking-widest shadow-xl hover:bg-slate-900 transition-all hover:scale-105 text-sm"
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
      <AnimatedSection className="text-center mb-12">
        <h2 className="font-serif text-3xl sm:text-4xl text-slate-800 italic">Momen Kami</h2>
        <SectionDivider />
      </AnimatedSection>
      <AnimatedSection className="relative">
        <div className="relative overflow-hidden rounded-2xl aspect-[4/3] bg-white border-[12px] border-white shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.img 
              key={current} 
              src={images[current]} 
              alt={`Gallery ${current + 1}`} 
              className="w-full h-full object-cover" 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              transition={{ duration: 0.5 }} 
              onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80"; }}
            />
          </AnimatePresence>
          <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-sm flex items-center justify-center text-slate-800 hover:bg-white transition-colors"><ChevronLeft className="w-5 h-5" /></button>
          <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur shadow-sm flex items-center justify-center text-slate-800 hover:bg-white transition-colors"><ChevronRight className="w-5 h-5" /></button>
        </div>
        <div className="flex justify-center gap-2 mt-6">
          {images.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${i === current ? "bg-rose-400 w-8" : "bg-slate-200 w-2"}`} />
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
        <h2 className="font-serif text-3xl sm:text-4xl text-slate-800 italic">Doa & Harapan</h2>
        <SectionDivider />
      </AnimatedSection>
      
      <AnimatedSection delay={0.2} className="bg-white rounded-[2rem] p-8 sm:p-12 border border-rose-50 shadow-xl mt-8 relative">
        <Heart className="w-8 h-8 text-rose-300 mx-auto mb-6" />
        {/* 👇 QUOTE LEBIH ELEGAN DAN UNIVERSAL 👇 */}
        <p className="font-serif text-lg md:text-xl text-slate-600 leading-loose italic whitespace-pre-line font-medium mb-12">
          "{quote || 'Cinta tidak berupa tatapan satu sama lain, tetapi memandang ke luar bersama ke arah yang sama.'}"
        </p>

        <div className="text-left bg-[#FDFCFB] p-6 rounded-3xl border border-slate-100 shadow-inner">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <span className="bg-rose-100 text-rose-600 font-bold px-3 py-1 rounded-full text-xs">{safeGreetings.length}</span>
              <h3 className="font-bold text-slate-700 font-sans uppercase tracking-widest text-xs">Pesan Kehadiran</h3>
          </div>

          <div className="h-[350px] overflow-y-auto pr-3 space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#fda4af transparent' }}>
            {safeGreetings.length > 0 ? (
              safeGreetings.map((g, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} key={i} 
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-50"
                >
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-slate-700 font-sans text-sm capitalize">{g.name || g.attendee_name}</p>
                    <p className="text-[10px] text-slate-400 font-sans uppercase tracking-wider">{g.time || ""}</p>
                  </div>
                  <p className="text-slate-500 font-sans text-sm leading-relaxed italic">"{g.greeting || g.pesan}"</p>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                  <span className="text-4xl mb-3 opacity-50">💌</span>
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
        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
           <Gift className="w-7 h-7 text-rose-400" />
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl text-slate-800 italic mb-4">Tanda Kasih</h2>
        <p className="text-slate-500 text-sm leading-relaxed max-w-md mx-auto">
          Kehadiran Anda adalah kado terindah, namun jika Anda ingin memberikan tanda kasih secara digital, Anda dapat melalui tautan berikut.
        </p>
      </AnimatedSection>
      <div className="grid gap-6 font-sans">
        {gifts.map((account, index) => {
           const [copied, setCopied] = useState(false);
           const copy = () => { navigator.clipboard.writeText(account.accountNumber || account.account_number); setCopied(true); setTimeout(() => setCopied(false), 2000); };
           return (
              <AnimatedSection key={index} delay={index * 0.15} className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.08)] text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-300"></div>
                <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-3">{account.bankName || account.bank_name}</p>
                <p className="font-serif text-2xl text-slate-800 mb-1 italic font-medium">{account.accountName || account.account_name}</p>
                <p className="font-mono text-rose-500 text-xl tracking-wider mb-6 font-bold">{account.accountNumber || account.account_number}</p>
                <button onClick={copy} className="px-6 py-2.5 rounded-full bg-slate-50 text-slate-600 font-bold uppercase text-xs tracking-widest hover:bg-rose-500 hover:text-white transition-colors flex items-center justify-center mx-auto gap-2">
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
      <h2 className="font-serif text-4xl sm:text-5xl text-slate-800 italic mb-8 mt-4">Terima Kasih</h2>
      {/* 👇 CLOSING LEBIH ELEGAN DAN UNIVERSAL 👇 */}
      <p className="font-serif text-lg sm:text-xl text-slate-600 leading-relaxed italic mb-10 max-w-lg mx-auto whitespace-pre-line">
        {message || "Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu."}
      </p>
      <div className="mt-8 font-sans">
        <p className="font-serif text-3xl text-rose-500 italic mt-6">{name1} & {name2}</p>
      </div>
    </AnimatedSection>
    <motion.div className="mt-24 pt-8 border-t border-slate-100" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
      <p className="text-[10px] text-slate-300 font-bold tracking-widest uppercase font-sans">Powered by EventRent 🕊️</p>
    </motion.div>
  </div>
);

/* ─── MAIN COMPONENT: THEME FLORAL WHITE ─── */
export default function ThemeFloralWhite({ eventData, guestName, isOpen, onOpen }) {
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
  
  const name1 = profilesList[0]?.nickName || profilesList[0]?.fullName?.split(' ')[0] || 'Mempelai Pria';
  const name2 = profilesList[1]?.nickName || profilesList[1]?.fullName?.split(' ')[0] || 'Mempelai Wanita';

  const audioSrc = details.bgMusicUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"; 

  return (
    <div className="min-h-screen bg-[#FDFCFB] overflow-x-hidden font-sans selection:bg-rose-200 selection:text-rose-900">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div key="hero" exit={{ opacity: 0, y: -50, filter: "blur(10px)" }} transition={{ duration: 0.8, ease: "easeInOut" }} className="absolute inset-0 z-50 bg-[#FDFCFB]">
            <HeroSection 
               onOpen={onOpen} 
               name1={name1} name2={name2} 
               guestName={guestName} 
               coverImg={eventData?.img || "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1000&auto=format&fit=crop"} 
            />
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.3 }}>
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
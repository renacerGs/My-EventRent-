import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, HelpCircle, Briefcase, Calendar, ShieldCheck, Ticket, CreditCard } from "lucide-react";

const BRAND = {
  dark: "#1C2331",
  darker: "#151B26",
  orange: "#FF6B35",
  orangeSoft: "#FF8C5A",
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.1 },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

function BackButton() {
  const navigate = useNavigate();
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onClick={() => navigate(-1)}
      className="fixed top-6 left-6 z-50 group inline-flex items-center gap-2 rounded-full
                 bg-white/10 backdrop-blur-md border border-white/10 px-5 py-2.5 text-sm font-semibold
                 text-white shadow-xl hover:bg-white/20 hover:-translate-x-1 transition-all duration-300"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Kembali</span>
    </motion.button>
  );
}

function FAQCard({ icon: Icon, question, answer, i = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={i}
      whileHover={{ y: -5, scale: 1.01 }}
      className="relative group rounded-3xl p-8 transition-all duration-500
                 bg-white/[0.02] backdrop-blur-xl border border-white/5
                 hover:border-[#FF6B35]/40 hover:bg-white/[0.04] hover:shadow-[0_0_40px_rgba(255,107,53,0.1)]"
    >
      <div className="flex flex-col gap-5">
        <div
          className="inline-flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeSoft})`,
            boxShadow: "0 10px 30px -10px rgba(255,107,53,0.8)",
          }}
        >
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-3 tracking-wide">{question}</h3>
          <p className="text-sm leading-relaxed text-slate-400 font-medium">{answer}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function FAQ() {
  const faqs = [
    { icon: HelpCircle, q: "Apa itu EventRent?", a: "EventRent adalah platform manajemen acara modern. Kami membantu EO membuat tiket digital, dan memudahkan freelance mencari pekerjaan sebagai agen lapangan secara real-time." },
    { icon: Briefcase, q: "Gimana cara ngelamar jadi Agen?", a: "Sangat mudah! Buka halaman 'Find Jobs', pilih loker yang sesuai dengan jadwalmu, lalu klik Apply. Tunggu EO mengkonfirmasi, dan kamu resmi masuk ke dalam tim!" },
    { icon: Calendar, q: "Cara bikin acara di EventRent?", a: "Login menggunakan akun Google kamu, lalu masuk ke Dashboard dan klik 'Create Event'. Kamu bisa memilih mode Public (Konser), Wedding, atau Personal." },
    { icon: ShieldCheck, q: "Apakah uang pembayaran aman?", a: "Sangat aman. Sistem kami didukung oleh gateway Cahaya Pay (QRIS) dengan auto-polling. Pembayaran langsung terverifikasi tanpa ribet." },
    { icon: Ticket, q: "Cara pakai tiketnya gimana?", a: "Setelah beli, tiket akan muncul di 'My Tickets'. Tunjukkan QR Code unik tersebut ke Panitia/Agen di gerbang acara untuk di-scan. Selesai!" },
    { icon: CreditCard, q: "Bisa bayar lewat transfer manual?", a: "Bisa! Jika EO mengaktifkan fitur transfer manual, kamu cukup transfer dan upload bukti bayarnya. EO akan melakukan klik verifikasi dari dashboard mereka." }
  ];

  return (
    <div className="min-h-screen font-sans antialiased selection:bg-[#FF6B35] selection:text-white pb-32 relative overflow-hidden"
         style={{ background: `radial-gradient(circle at 50% 0%, ${BRAND.darker}, ${BRAND.dark} 100%)` }}>
      <BackButton />
      
      {/* Abstract Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#FF6B35]/10 blur-[150px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10 pt-40">
        <motion.div variants={stagger} initial="hidden" animate="show" className="text-center mb-20">
          <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase text-[#FF6B35]"
                       style={{ backgroundColor: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.3)" }}>
            <Sparkles className="h-4 w-4" /> Bantuan Cepat
          </motion.span>
          <motion.h1 variants={fadeUp} className="mt-8 text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Punya <span style={{ backgroundClip: "text", WebkitTextFillColor: "transparent", backgroundImage: `linear-gradient(120deg, ${BRAND.orange}, ${BRAND.orangeSoft})` }}>Pertanyaan?</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
            Gak perlu bingung. Temukan semua jawaban tentang cara kerja EventRent, mulai dari tiket, rekrutmen, hingga sistem pembayaran.
          </motion.p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {faqs.map((item, i) => (
             <FAQCard key={i} icon={item.icon} question={item.q} answer={item.a} i={i} />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
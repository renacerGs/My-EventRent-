import React from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom"; // 🔥 Import ditambahkan
import {
  ArrowLeft,
  Server,
  Zap,
  ShieldCheck,
  QrCode,
  Ticket,
  CreditCard,
  Briefcase,
  ScanLine,
  AlertTriangle,
  Wallet,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
} from "lucide-react";

/**
 * EventRent - About Page
 * Stack: React + Tailwind CSS + Framer Motion
 * Brand: Dark Blue #1C2331 / Orange #FF6B35
 */

const BRAND = {
  dark: "#1C2331",
  darker: "#151B26",
  orange: "#FF6B35",
  orangeSoft: "#FF8C5A",
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

function BackButton() {
  const navigate = useNavigate(); // 🔥 Gunakan hook navigasi React Router

  const handleBack = () => {
    // Kembali ke home dengan mulus
    navigate("/");
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onClick={handleBack}
      className="fixed top-5 left-5 z-50 group inline-flex items-center gap-2 rounded-full
                 bg-white/90 backdrop-blur-md px-4 py-2.5 text-sm font-semibold
                 text-[#1C2331] shadow-lg shadow-black/10 ring-1 ring-black/5
                 hover:bg-white hover:shadow-xl hover:-translate-x-0.5 transition-all duration-300"
      aria-label="Kembali"
    >
      <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
      <span>Kembali</span>
    </motion.button>
  );
}

function SectionTitle({ eyebrow, title, desc, light = false }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className="max-w-3xl mx-auto text-center mb-14"
    >
      {eyebrow && (
        <motion.span
          variants={fadeUp}
          className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-widest uppercase"
          style={{
            color: BRAND.orange,
            backgroundColor: "rgba(255,107,53,0.10)",
            border: "1px solid rgba(255,107,53,0.25)",
          }}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {eyebrow}
        </motion.span>
      )}
      <motion.h2
        variants={fadeUp}
        className={`mt-4 text-3xl md:text-5xl font-extrabold tracking-tight ${
          light ? "text-white" : "text-[#1C2331]"
        }`}
      >
        {title}
      </motion.h2>
      {desc && (
        <motion.p
          variants={fadeUp}
          className={`mt-4 text-base md:text-lg leading-relaxed ${
            light ? "text-slate-300" : "text-slate-600"
          }`}
        >
          {desc}
        </motion.p>
      )}
    </motion.div>
  );
}

function FeatureCard({ icon: Icon, title, children, i = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={i}
      whileHover={{ y: -6 }}
      className="relative group rounded-2xl bg-white p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)]
                 ring-1 ring-slate-100 hover:ring-[#FF6B35]/30 hover:shadow-[0_20px_50px_rgba(28,35,49,0.12)]
                 transition-all duration-500"
    >
      <div
        className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-5"
        style={{
          background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeSoft})`,
          boxShadow: "0 10px 25px -10px rgba(255,107,53,0.55)",
        }}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-bold text-[#1C2331]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{children}</p>
      <div
        className="absolute inset-x-7 bottom-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${BRAND.orange}, transparent)` }}
      />
    </motion.div>
  );
}

function DarkFeatureCard({ icon: Icon, title, children, i = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={i}
      whileHover={{ y: -6 }}
      className="relative group rounded-2xl p-7 transition-all duration-500
                 bg-white/[0.03] backdrop-blur-sm ring-1 ring-white/10
                 hover:ring-[#FF6B35]/50 hover:bg-white/[0.05]"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
    >
      <div
        className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-5"
        style={{
          background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeSoft})`,
          boxShadow: "0 10px 30px -10px rgba(255,107,53,0.7)",
        }}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{children}</p>
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(255,107,53,0.12), transparent 40%)",
        }}
      />
    </motion.div>
  );
}

export default function About() {
  return (
    <div className="min-h-screen bg-white text-[#1C2331] font-sans antialiased selection:bg-[#FF6B35] selection:text-white">
      <BackButton />

      {/* ============== HERO ============== */}
      <section
        className="relative overflow-hidden"
        style={{
          background: `radial-gradient(1200px 600px at 80% -10%, rgba(255,107,53,0.18), transparent 60%),
                       radial-gradient(900px 500px at 0% 10%, rgba(255,107,53,0.08), transparent 55%),
                       linear-gradient(180deg, ${BRAND.darker} 0%, ${BRAND.dark} 100%)`,
        }}
      >
        {/* grid overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-32 pb-28 md:pt-40 md:pb-36">
          <motion.div
            initial="hidden"
            animate="show"
            variants={stagger}
            className="max-w-3xl"
          >
            <motion.span
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tracking-widest uppercase text-[#FF6B35]"
              style={{
                backgroundColor: "rgba(255,107,53,0.12)",
                border: "1px solid rgba(255,107,53,0.35)",
              }}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Tentang EventRent
            </motion.span>

            <motion.h1
              variants={fadeUp}
              className="mt-6 text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05]"
            >
              Platform Manajemen Acara{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage: `linear-gradient(120deg, ${BRAND.orange}, ${BRAND.orangeSoft})`,
                }}
              >
                end-to-end
              </span>{" "}
              untuk era modern.
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl"
            >
              EventRent adalah SaaS terpusat untuk membuat, menjual, dan
              mengelola acara — dari ticketing QR, pembayaran QRIS otomatis,
              hingga koordinasi panitia di lapangan secara real-time.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
              <a
                href="#arsitektur"
                className="group inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: `linear-gradient(120deg, ${BRAND.orange}, ${BRAND.orangeSoft})`,
                  boxShadow: "0 15px 40px -15px rgba(255,107,53,0.7)",
                }}
              >
                Pelajari Arsitektur
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#agen"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white/90 ring-1 ring-white/15 hover:bg-white/5 hover:ring-white/30 transition-all duration-300"
              >
                Mode Agen & Panitia
              </a>
            </motion.div>

            {/* stats */}
            <motion.div
              variants={fadeUp}
              className="mt-14 grid grid-cols-3 gap-4 max-w-2xl"
            >
              {[
                { k: "3", v: "Tipe Acara" },
                { k: "5s", v: "Auto-Polling QRIS" },
                { k: "24/7", v: "Centralized API" },
              ].map((s) => (
                <div
                  key={s.v}
                  className="rounded-xl bg-white/[0.04] ring-1 ring-white/10 px-4 py-4"
                >
                  <div
                    className="text-2xl md:text-3xl font-extrabold"
                    style={{ color: BRAND.orange }}
                  >
                    {s.k}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 mt-1">
                    {s.v}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* wave bottom */}
        <svg
          className="block w-full"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          style={{ height: 60 }}
        >
          <path d="M0,40 C360,90 1080,0 1440,50 L1440,80 L0,80 Z" fill="#ffffff" />
        </svg>
      </section>

      {/* ============== ARSITEKTUR ============== */}
      <section id="arsitektur" className="relative py-24 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <SectionTitle
            eyebrow="Arsitektur Sistem"
            title="Satu API terpusat. Banyak kanal."
            desc="EventRent dibangun di atas arsitektur centralized API (NestJS + PostgreSQL) yang melayani Web App dan Mobile App secara bersamaan, dengan Supabase sebagai layer otentikasi & storage."
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <FeatureCard icon={Server} title="Centralized API (NestJS)" i={0}>
              Seluruh logika bisnis hidup di satu Backend NestJS. Web (React)
              dan Mobile (Flutter) mengonsumsi kontrak API yang sama, sehingga
              setiap fitur baru langsung tersedia di kedua platform.
            </FeatureCard>

            <FeatureCard icon={ShieldCheck} title="Auth Supabase JWT" i={1}>
              Otentikasi murni berbasis Supabase JWT melalui header{" "}
              <code className="px-1.5 py-0.5 rounded bg-slate-100 text-[#1C2331] text-xs font-mono">
                Authorization: Bearer
              </code>
              . Aman, stateless, dan siap untuk skala enterprise.
            </FeatureCard>

            <FeatureCard icon={Zap} title="Auto-Polling Pembayaran" i={2}>
              Integrasi <strong>Cahaya Pay (QRIS)</strong> dengan polling
              otomatis tiap <strong>5 detik</strong>. Status transaksi
              ter-update real-time tanpa perlu refresh manual dari customer.
            </FeatureCard>

            <FeatureCard icon={CreditCard} title="Manual Transfer + Verifikasi" i={3}>
              Selain QRIS, tersedia jalur transfer manual dengan alur
              verifikasi oleh Event Organizer — fleksibel untuk berbagai
              segmen pasar.
            </FeatureCard>

            <FeatureCard icon={Ticket} title="Ticketing QR + Email" i={4}>
              Setiap tiket memiliki kode <strong>alphanumeric unik</strong> dan{" "}
              <strong>QR Code</strong> yang dikirim otomatis via Nodemailer ke
              email pembeli, siap dipindai di gerbang acara.
            </FeatureCard>

            <FeatureCard icon={Calendar} title="3 Tipe Acara + Form Builder" i={5}>
              Public, Wedding, dan Personal. Dilengkapi{" "}
              <strong>Dynamic Form Builder</strong> dan{" "}
              <strong>Auto-Save Draft</strong> agar EO tidak pernah kehilangan
              data setengah jadi.
            </FeatureCard>
          </motion.div>

          {/* Diagram alur sederhana */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="mt-16 rounded-3xl p-8 md:p-12 ring-1 ring-slate-200 bg-gradient-to-br from-slate-50 to-white"
          >
            <div className="grid md:grid-cols-5 items-center gap-6 text-center">
              {[
                { label: "Web App", sub: "React + Vite" },
                { label: "Mobile App", sub: "Flutter" },
                { label: "API Gateway", sub: "NestJS", highlight: true },
                { label: "Database", sub: "PostgreSQL" },
                { label: "BaaS", sub: "Supabase Auth & Storage" },
              ].map((n, idx) => (
                <React.Fragment key={n.label}>
                  <div
                    className={`rounded-2xl px-4 py-5 ring-1 transition-all ${
                      n.highlight
                        ? "bg-[#1C2331] text-white ring-[#1C2331]"
                        : "bg-white text-[#1C2331] ring-slate-200"
                    }`}
                  >
                    <div
                      className="text-xs uppercase tracking-widest mb-1"
                      style={{ color: n.highlight ? BRAND.orange : "#94a3b8" }}
                    >
                      {n.sub}
                    </div>
                    <div className="font-bold">{n.label}</div>
                  </div>
                  {idx < 4 && (
                    <div className="hidden md:flex items-center justify-center">
                      <ArrowRight
                        className="h-5 w-5"
                        style={{ color: BRAND.orange }}
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============== MODE AGEN & PANITIA (DARK) ============== */}
      <section
        id="agen"
        className="relative py-24 md:py-32 overflow-hidden"
        style={{
          background: `radial-gradient(1000px 500px at 100% 0%, rgba(255,107,53,0.18), transparent 55%),
                       radial-gradient(800px 400px at 0% 100%, rgba(255,107,53,0.10), transparent 60%),
                       linear-gradient(180deg, ${BRAND.dark} 0%, ${BRAND.darker} 100%)`,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage:
              "radial-gradient(ellipse at center, black 35%, transparent 80%)",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
          <SectionTitle
            light
            eyebrow="Mode Agen & Panitia"
            title="Operasional lapangan, dikendalikan dari satu tempat."
            desc="Modul khusus untuk Event Organizer dan Agen — dari rekrutmen panitia, scanning tiket live, hingga laporan darurat dan penggajian otomatis."
          />

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <DarkFeatureCard icon={Briefcase} title="Job Board" i={0}>
              EO mem-posting kebutuhan panitia. Agen dapat{" "}
              <strong className="text-white">Apply</strong>, lalu EO{" "}
              <strong className="text-white">Accept / Reject</strong> langsung
              dari dashboard — proses rekrutmen jadi cepat dan terstruktur.
            </DarkFeatureCard>

            <DarkFeatureCard icon={ScanLine} title="Live Scanner" i={1}>
              Scanner check-in real-time melalui Web maupun Mobile. Validasi QR
              instan dengan deteksi tiket duplikat & status anti-fraud.
            </DarkFeatureCard>

            <DarkFeatureCard icon={AlertTriangle} title="Emergency Report" i={2}>
              Panitia di lapangan dapat mengirim laporan darurat ke EO hanya
              dengan satu ketukan — kategori insiden, lokasi, dan eskalasi
              otomatis.
            </DarkFeatureCard>

            <DarkFeatureCard icon={Wallet} title="Agent Wallet" i={3}>
              Sistem dompet digital untuk penggajian agen. Riwayat earning
              transparan, withdraw on-demand, dan rekonsiliasi otomatis dengan
              EO.
            </DarkFeatureCard>
          </motion.div>

          {/* Highlight strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16 rounded-2xl p-6 md:p-8 ring-1 ring-white/10 bg-white/[0.03] backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeSoft})`,
                }}
              >
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">
                  Ekosistem Agen yang berkelanjutan
                </h4>
                <p className="text-slate-300 text-sm mt-1 max-w-2xl">
                  Setiap interaksi — dari apply, scan, hingga payout —
                  tercatat di centralized API. EO mendapat visibilitas penuh,
                  agen mendapat keadilan transaksi.
                </p>
              </div>
            </div>
            {/* 🔥 Tombol Gabung Agen diganti Link */}
            <Link
              to="/jobs"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white whitespace-nowrap transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(120deg, ${BRAND.orange}, ${BRAND.orangeSoft})`,
                boxShadow: "0 12px 30px -12px rgba(255,107,53,0.7)",
              }}
            >
              Gabung sebagai Agen
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============== CTA ============== */}
      <section className="relative py-24 md:py-32 bg-white">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-3xl p-10 md:p-16 text-center"
            style={{
              background: `linear-gradient(135deg, ${BRAND.dark} 0%, #2A3447 100%)`,
            }}
          >
            <div
              aria-hidden
              className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl opacity-40"
              style={{ background: BRAND.orange }}
            />
            <div
              aria-hidden
              className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-25"
              style={{ background: BRAND.orange }}
            />

            <div className="relative">
              <QrCode
                className="mx-auto h-10 w-10 mb-5"
                style={{ color: BRAND.orange }}
              />
              <h3 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                Siap menghidupkan acara Anda berikutnya?
              </h3>
              <p className="mt-4 text-slate-300 max-w-2xl mx-auto">
                Mulai gratis, skala saat dibutuhkan. EventRent menyiapkan
                tools, agen, dan pembayaran — Anda fokus pada momennya.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                {/* 🔥 Tombol Mulai Sekarang diganti Link */}
                <Link
                  to="/create"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{
                    background: `linear-gradient(120deg, ${BRAND.orange}, ${BRAND.orangeSoft})`,
                    boxShadow: "0 18px 40px -15px rgba(255,107,53,0.7)",
                  }}
                >
                  Mulai Sekarang
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============== FOOTER MINI ============== */}
      <footer
        className="py-10 text-center text-sm"
        style={{ background: BRAND.darker, color: "#94a3b8" }}
      >
        © {new Date().getFullYear()} EventRent — Built for organizers,
        powered by people.
      </footer>
    </div>
  );
}

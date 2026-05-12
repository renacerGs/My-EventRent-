import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles, AlertTriangle, Scale } from "lucide-react";

const BRAND = {
  dark: "#1C2331",
  orange: "#FF6B35",
  orangeSoft: "#FF8C5A",
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

function BackButton() {
  const navigate = useNavigate();
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      onClick={() => navigate(-1)}
      className="fixed top-6 left-6 z-50 group inline-flex items-center gap-2 rounded-full
                 bg-white/80 backdrop-blur-md px-5 py-2.5 text-sm font-bold border border-slate-200
                 text-[#1C2331] shadow-lg hover:shadow-xl hover:-translate-x-1 hover:bg-white transition-all duration-300"
    >
      <ArrowLeft className="h-4 w-4" />
      <span>Kembali</span>
    </motion.button>
  );
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 text-[#1C2331] font-sans antialiased selection:bg-[#FF6B35] selection:text-white pb-32 relative">
      <BackButton />
      
      {/* Background Graphic */}
      <div className="absolute top-0 w-full h-[60vh] bg-white border-b border-slate-200/60"
           style={{ backgroundImage: "radial-gradient(circle at 50% 0%, rgba(255,107,53,0.05) 0%, transparent 70%)" }} />

      <div className="relative max-w-4xl mx-auto px-6 lg:px-10 pt-32 md:pt-40">
        
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }} className="text-center mb-16">
          <motion.div variants={fadeUp} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 text-[#FF6B35] mb-6 shadow-inner ring-1 ring-orange-100">
             <Scale className="w-8 h-8" />
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-extrabold tracking-tight text-[#1C2331] leading-tight">
            Syarat & <span className="text-[#FF6B35]">Ketentuan.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 text-lg text-slate-500 font-medium">
            Pahami aturan main di EventRent agar ekosistem acara kita tetap aman, nyaman, dan profesional.
          </motion.p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
          className="bg-white rounded-[40px] p-8 md:p-14 shadow-[0_20px_60px_rgba(28,35,49,0.04)] border border-slate-100 relative"
        >
          {/* Accent Line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1.5 rounded-b-full bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A]" />

          <div className="space-y-12 text-slate-600 leading-relaxed font-medium">
            
            <section className="group">
              <h2 className="text-2xl font-extrabold text-[#1C2331] flex items-center gap-4 border-b border-slate-100 pb-4 mb-5 transition-colors group-hover:border-[#FF6B35]/30">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#FF6B35] text-lg font-black group-hover:bg-[#FF6B35] group-hover:text-white transition-colors">1</span>
                Ketentuan Umum Platform
              </h2>
              <p className="pl-14 text-base">Dengan mengakses platform SaaS EventRent, Anda dianggap telah membaca dan menyetujui seluruh aturan ini. Kami berhak melakukan *banned* atau suspend akun secara sepihak apabila terindikasi melakukan kecurangan, transaksi fiktif, atau pelanggaran data.</p>
            </section>

            <section className="group">
              <h2 className="text-2xl font-extrabold text-[#1C2331] flex items-center gap-4 border-b border-slate-100 pb-4 mb-5 transition-colors group-hover:border-[#FF6B35]/30">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#FF6B35] text-lg font-black group-hover:bg-[#FF6B35] group-hover:text-white transition-colors">2</span>
                Wewenang Penyelenggara (EO)
              </h2>
              <p className="pl-14 text-base">EO wajib memberikan informasi acara yang jujur dan valid. EO berhak melakukan <strong>Penerimaan (Accept)</strong> maupun <strong>Pemecatan (Dismiss)</strong> terhadap Agen lapangan. EO juga berkewajiban mencairkan honor/gaji agen tepat waktu melalui fitur *Payout* setelah acara selesai.</p>
            </section>

            <section className="group">
              <h2 className="text-2xl font-extrabold text-[#1C2331] flex items-center gap-4 border-b border-slate-100 pb-4 mb-5 transition-colors group-hover:border-[#FF6B35]/30">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#FF6B35] text-lg font-black group-hover:bg-[#FF6B35] group-hover:text-white transition-colors">3</span>
                Kode Etik Freelance / Agen
              </h2>
              <p className="pl-14 text-base">Agen yang diterima bertugas wajib mematuhi jam kerja dan SOP acara. Agen dilarang keras melakukan manipulasi *scanner* tiket, membocorkan QR tamu, atau berperilaku tidak pantas. Rating yang buruk dari EO akan mempengaruhi peluang kerjamu di event selanjutnya.</p>
            </section>

            <section className="group">
              <h2 className="text-2xl font-extrabold text-[#1C2331] flex items-center gap-4 border-b border-slate-100 pb-4 mb-5 transition-colors group-hover:border-[#FF6B35]/30">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-[#FF6B35] text-lg font-black group-hover:bg-[#FF6B35] group-hover:text-white transition-colors">4</span>
                Pembayaran & Refund Tiket
              </h2>
              <p className="pl-14 text-base">EventRent hanya berposisi sebagai penyedia teknologi. Seluruh kebijakan pengembalian dana (Refund) akibat pembatalan konser, cuaca buruk, atau kelalaian EO adalah murni tanggung jawab penyelenggara. Uang pembayaran yang divalidasi akan otomatis masuk ke data EO.</p>
            </section>

          </div>

          <div className="mt-16 bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
               <AlertTriangle className="h-8 w-8 text-[#FF6B35]" />
            </div>
            <div>
              <h4 className="font-extrabold text-[#1C2331] text-lg mb-2">Penting untuk Diketahui</h4>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                EventRent menyediakan platform "as-is" (sebagaimana adanya). Kami melakukan yang terbaik untuk menjaga server tetap hidup 24/7, namun kami tidak bertanggung jawab atas kerugian finansial langsung akibat kendala teknis eksternal (seperti gangguan gateway pembayaran pihak ketiga).
              </p>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function JobBoard() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [applyingId, setApplyingId] = useState(null);
  
  // State buat nyimpen ID pekerjaan yang udah pernah dilamar sama user ini
  const [appliedJobs, setAppliedJobs] = useState([]);
  
  // 👇 STATE BARU BUAT MODAL KONFIRMASI LAMAR 👇
  const [confirmApply, setConfirmApply] = useState({ show: false, jobId: null });

  useEffect(() => {
    if (!user) {
      toast.error('Lo harus login dulu bro buat nyari job!');
      navigate('/');
      return;
    }
    fetchJobs();
    
    // Load data lamaran dari localStorage (sementara nunggu API backend)
    const savedApplications = JSON.parse(localStorage.getItem(`applied_jobs_${user.id}`)) || [];
    setAppliedJobs(savedApplications);
  }, [user, navigate]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs`);
      
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      } else {
        console.warn("API /api/jobs belum siap, nampilin data dummy sementara.");
        setJobs([
          { id: 1, event_title: "Konser We The Fest 2026", event_date: "10 Mei 2026", role: "Penjaga Pintu A", fee: 150000, quota: 5, description: "Standby jam 15.00 - 22.00. Membantu scan tiket pengunjung VIP." },
          { id: 2, event_title: "Seminar Nasional Tech", event_date: "15 Juni 2026", role: "Registrasi VIP", fee: 250000, quota: 2, description: "Handle tamu VIP. Wajib rapi, dresscode kemeja hitam." }
        ]);
      }
    } catch (err) {
      console.error("Gagal menarik data lowongan:", err);
      toast.error("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger modal konfirmasi
  const handleApplyClick = (jobId) => {
    setConfirmApply({ show: true, jobId });
  };

  // Eksekusi API pas klik Yakin
  const executeApply = async () => {
    const jobId = confirmApply.jobId;
    setConfirmApply({ show: false, jobId: null }); // Tutup modal

    try {
      setApplyingId(jobId);
      const toastId = toast.loading('Mengirim lamaran...');

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/jobs/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: jobId, userId: user.id })
      });
      
      const data = await res.json();

      if (res.ok) {
        toast.success("Lamaran berhasil dikirim! Pantengin terus notifikasi lu bro.", { id: toastId });
        
        const newAppliedList = [...appliedJobs, jobId];
        setAppliedJobs(newAppliedList);
        localStorage.setItem(`applied_jobs_${user.id}`, JSON.stringify(newAppliedList));
        
      } else {
        toast.error(data.message || "Gagal ngirim lamaran. Mungkin lu udah pernah apply?", { id: toastId });
        if(data.message && data.message.includes('pernah ngelamar')){
            const newAppliedList = [...appliedJobs, jobId];
            setAppliedJobs(newAppliedList);
            localStorage.setItem(`applied_jobs_${user.id}`, JSON.stringify(newAppliedList));
        }
      }
    } catch (err) {
      toast.error("Terjadi kesalahan jaringan.", { id: toastId });
    } finally {
      setApplyingId(null);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true;
    const lowerQ = searchQuery.toLowerCase();
    return (
      job.event_title?.toLowerCase().includes(lowerQ) ||
      job.role?.toLowerCase().includes(lowerQ) ||
      job.description?.toLowerCase().includes(lowerQ)
    );
  });

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a]">
      <div className="w-12 h-12 border-4 border-slate-700 border-t-[#FF6B35] rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-widest text-xs font-bold text-slate-500">Mencari Peluang...</p>
    </div>
  );

  return (
    <div className="bg-[#0f172a] min-h-screen font-sans pb-20 relative">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none"></div>
      
      {/* 👇 MODAL KONFIRMASI LAMAR JOB 👇 */}
      <AnimatePresence>
        {confirmApply.show && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-slate-800 rounded-[32px] p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center border border-slate-700"
            >
              <div className="w-16 h-16 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-5 border border-orange-500/30">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Kirim Lamaran?</h3>
              <p className="text-xs text-slate-400 mb-8 font-medium leading-relaxed">Yakin mau ngelamar posisi ini? Pastikan jadwal kosong dan jangan sampai telat ya bro!</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmApply({ show: false, jobId: null })} 
                  className="flex-1 py-3.5 bg-slate-700 text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-600 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={executeApply} 
                  className="flex-1 py-3.5 bg-[#FF6B35] text-white rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-[#e85a2a] shadow-lg shadow-orange-500/20 transition-all active:scale-95 border border-orange-400"
                >
                  Yakin, Lamar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-6 md:pt-16 relative z-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 mb-8 md:mb-10 bg-slate-800/50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-700/50 backdrop-blur-sm shadow-xl">
          <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
            <div className="inline-flex items-center justify-center lg:justify-start gap-2 bg-orange-500/20 text-orange-400 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest mb-4 border border-orange-500/30">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              Freelance Board
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight tracking-tight mb-2">
              Cari Job Event <span className="text-[#FF6B35]">Sekarang.</span>
            </h1>
            <p className="text-xs md:text-sm font-medium text-slate-400 leading-relaxed">
              Jadilah bagian dari event-event keren di kotamu dan dapatkan penghasilan tambahan sebagai agen profesional EventRent.
            </p>
          </div>
          
          <div className="w-full lg:w-96 shrink-0 relative">
            <input 
              type="text" 
              placeholder="Cari nama event atau peran..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-all"
            />
            <svg className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>

        {/* JOB CARDS GRID */}
        <div className="mb-6 flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
             <span className="w-2 h-6 md:h-8 bg-orange-500 rounded-full inline-block"></span>
             <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wide">Lowongan Tersedia <span className="text-slate-500 text-sm ml-1">({filteredJobs.length})</span></h2>
          </div>
        </div>

        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const isApplied = appliedJobs.includes(job.id);
              
              return (
                <div key={job.id} className={`bg-slate-800/50 rounded-[24px] p-6 border transition-all duration-300 flex flex-col h-full group relative overflow-hidden ${isApplied ? 'border-slate-700 opacity-60 grayscale-[50%]' : 'border-slate-700 hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(255,107,53,0.15)] hover:-translate-y-1'}`}>
                  
                  {!isApplied && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#FF6B35] to-orange-300 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}
                  
                  <div className="flex justify-between items-start mb-5 relative z-10">
                    <span className="inline-flex items-center gap-1.5 bg-slate-900 text-slate-300 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-700 group-hover:text-[#FF6B35] group-hover:border-[#FF6B35]/30 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      {job.role}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-700">Sisa Kuota: <span className="text-white">{job.quota}</span></span>
                  </div>

                  <h3 className="text-xl font-black text-white mb-2 leading-tight line-clamp-2 relative z-10">{job.event_title}</h3>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-5 relative z-10">
                    <svg className="w-4 h-4 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {job.event_date || "Tanggal Menyusul"}
                  </div>

                  <div className="bg-slate-900/80 rounded-xl p-4 mb-6 flex-grow border border-slate-700/50 relative z-10">
                    <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-3">
                      {job.description}
                    </p>
                  </div>

                  <div className="mt-auto pt-2 flex items-center justify-between gap-4 relative z-10">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Fee / Upah</p>
                      <p className="text-lg font-black text-[#FF6B35]">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(job.fee)}
                      </p>
                    </div>
                    
                    {isApplied ? (
                      <button 
                        disabled
                        className="flex items-center gap-1.5 bg-slate-700/50 text-slate-500 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-700 cursor-not-allowed"
                      >
                        <svg className="w-4 h-4 animate-spin text-slate-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="hidden sm:inline">Menunggu ACC</span>
                        <span className="sm:hidden">ACC...</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleApplyClick(job.id)}
                        disabled={applyingId === job.id}
                        className="bg-[#FF6B35] hover:bg-[#e85a2a] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-orange-400"
                      >
                        {applyingId === job.id ? 'Loading...' : 'Lamar Job'}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-[32px] p-12 text-center border border-slate-700/50 shadow-xl flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-24 h-24 bg-slate-900 rounded-full flex items-center justify-center mb-6 border border-slate-700 shadow-inner">
              <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Belum Ada Lowongan</h3>
            <p className="text-slate-400 text-sm font-medium max-w-md mx-auto leading-relaxed">
              Saat ini belum ada Event Organizer yang buka lowongan freelance. Jangan sedih, coba cek lagi nanti atau cari dengan kata kunci lain ya bro!
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-6 px-6 py-2.5 bg-slate-700 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-600 transition-colors border border-slate-600"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
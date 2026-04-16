import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function JobBoard() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [applyingId, setApplyingId] = useState(null);
  
  // State buat nyimpen ID pekerjaan yang udah pernah dilamar sama user ini
  const [appliedJobs, setAppliedJobs] = useState([]);

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
      const res = await fetch('https://my-event-rent.vercel.app/api/jobs');
      
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

  const handleApply = async (jobId) => {
    if (!window.confirm("Yakin mau ngelamar posisi ini? Pastikan tanggal lu kosong ya!")) return;

    try {
      setApplyingId(jobId);
      const toastId = toast.loading('Mengirim lamaran...');

      const res = await fetch('https://my-event-rent.vercel.app/api/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: jobId, userId: user.id })
      });
      
      const data = await res.json();

      if (res.ok) {
        toast.success("Lamaran berhasil dikirim! Pantengin terus notifikasi lu bro.", { id: toastId });
        
        // Simpan ID pekerjaan ke state dan localStorage biar tombolnya berubah
        const newAppliedList = [...appliedJobs, jobId];
        setAppliedJobs(newAppliedList);
        localStorage.setItem(`applied_jobs_${user.id}`, JSON.stringify(newAppliedList));
        
      } else {
        toast.error(data.message || "Gagal ngirim lamaran. Mungkin lu udah pernah apply?", { id: toastId });
        // Kalau errornya karena udah pernah ngelamar, langsung update state aja
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
      <div className="w-12 h-12 border-4 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-widest text-xs font-bold text-gray-400">Mencari Peluang...</p>
    </div>
  );

  return (
    <div className="bg-[#F8F9FA] min-h-screen font-sans pb-20 pt-8 md:pt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        
        {/* HEADER SECTION */}
        <div className="bg-white rounded-[32px] p-6 md:p-10 mb-8 shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl text-center lg:text-left mx-auto lg:mx-0">
            <div className="inline-flex items-center justify-center lg:justify-start gap-2 bg-orange-50 text-[#FF6B35] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-orange-100 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              Freelance Board
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight mb-3">
              Cari Job Event <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-orange-400">Sekarang.</span>
            </h1>
            <p className="text-sm md:text-base font-medium text-gray-500 leading-relaxed">
              Jadilah bagian dari event-event keren di kotamu dan dapatkan penghasilan tambahan sebagai agen profesional EventRent.
            </p>
          </div>
          
          <div className="w-full lg:w-96 shrink-0 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-300 to-[#FF6B35] rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Cari nama event atau peran..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 text-gray-900 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:outline-none focus:border-[#FF6B35] focus:ring-4 focus:ring-orange-50 transition-all shadow-sm"
              />
              <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
          </div>
        </div>

        {/* JOB CARDS GRID */}
        <div className="mb-6 flex items-center justify-between px-2">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Lowongan Tersedia <span className="text-gray-400 ml-2">({filteredJobs.length})</span></h2>
        </div>

        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredJobs.map((job) => {
              const isApplied = appliedJobs.includes(job.id);
              
              return (
                <div key={job.id} className={`bg-white rounded-[24px] p-6 border transition-all duration-300 flex flex-col h-full group ${isApplied ? 'border-gray-200 shadow-none opacity-80' : 'border-gray-100 shadow-sm hover:shadow-xl hover:border-orange-100 hover:-translate-y-1'}`}>
                  
                  <div className="flex justify-between items-start mb-5">
                    <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200 group-hover:bg-orange-50 group-hover:text-[#FF6B35] group-hover:border-orange-200 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                      {job.role}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">Sisa Kuota: <span className="text-gray-900">{job.quota}</span></span>
                  </div>

                  <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight line-clamp-2">{job.event_title}</h3>
                  <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 mb-5">
                    <svg className="w-4 h-4 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {job.event_date || "Tanggal Menyusul"}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-6 flex-grow border border-gray-100">
                    <p className="text-xs text-gray-600 leading-relaxed font-medium line-clamp-3">
                      {job.description}
                    </p>
                  </div>

                  <div className="mt-auto pt-2 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Fee / Upah</p>
                      <p className="text-lg font-black text-[#FF6B35]">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(job.fee)}
                      </p>
                    </div>
                    
                    {isApplied ? (
                      <button 
                        disabled
                        className="flex items-center gap-1.5 bg-gray-100 text-gray-500 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-gray-200 cursor-not-allowed"
                      >
                        <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span className="hidden sm:inline">Menunggu ACC</span>
                        <span className="sm:hidden">ACC...</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleApply(job.id)}
                        disabled={applyingId === job.id}
                        className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="bg-white rounded-[32px] p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 border border-gray-100 shadow-inner">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Belum Ada Lowongan</h3>
            <p className="text-gray-500 text-sm font-medium max-w-md mx-auto leading-relaxed">
              Saat ini belum ada Event Organizer yang buka lowongan freelance. Jangan sedih, coba cek lagi nanti atau cari dengan kata kunci lain ya bro!
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="mt-6 px-6 py-2.5 bg-orange-50 text-[#FF6B35] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-orange-100 transition-colors"
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
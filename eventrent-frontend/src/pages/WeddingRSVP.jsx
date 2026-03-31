import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, CheckCircle2, User, Users } from "lucide-react";

export default function WeddingRSVP() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    isAttending: null, 
    pax: 1, 
    greeting: "",
  });
  
  const [selectedSessions, setSelectedSessions] = useState([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${id}`);
        if (!res.ok) throw new Error("Event tidak ditemukan");
        const data = await res.json();
        setEvent(data);
        
        if (data.sessions && data.sessions.length > 0) {
          setSelectedSessions([data.sessions[0].id]);
        }
      } catch (err) {
        alert(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 👇 FUNGSI BARU: Nangkep Jawaban Custom (Teks, Dropdown, Checkbox)
  const handleCustomChange = (qId, value, type, isChecked = false) => {
    if (type === 'Checkbox') {
      setFormData(prev => {
        const currentArr = prev[qId] || [];
        if (isChecked) return { ...prev, [qId]: [...currentArr, value] };
        return { ...prev, [qId]: currentArr.filter(v => v !== value) };
      });
    } else {
      setFormData(prev => ({ ...prev, [qId]: value }));
    }
  };

  const toggleSession = (sessionId) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId) 
        : [...prev, sessionId] 
    );
  };

  // 👇 FUNGSI BARU: Ambil pertanyaan custom berdasarkan sesi yang dicentang
  const activeQuestions = [];
  const seenQIds = new Set();
  if (event && event.sessions) {
    selectedSessions.forEach(sId => {
      const session = event.sessions.find(s => s.id === sId);
      session?.questions?.forEach(q => {
        if (!seenQIds.has(q.id)) {
          seenQIds.add(q.id);
          activeQuestions.push(q);
        }
      });
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.isAttending === null) return alert("Pilih konfirmasi kehadiran Anda!");
    if (formData.isAttending === true && selectedSessions.length === 0) {
      return alert("Pilih minimal 1 sesi acara yang akan dihadiri!");
    }
    
    // Validasi Custom Checkbox (Wajib Isi)
    for (const q of activeQuestions) {
      if (q.is_required && q.answer_type === 'Checkbox' && (!formData[q.id] || formData[q.id].length === 0)) {
        return alert(`Pertanyaan "${q.question_text}" wajib diisi!`);
      }
    }

    setIsSubmitting(true);

    try {
      const cartPayload = formData.isAttending 
      ? selectedSessions.map(sId => ({ 
          sessionId: sId, 
          qty: 1, 
          pax: Number(formData.pax) 
        })) 
      : [];

      const payload = {
        eventId: Number(id),
        guestEmail: formData.email,
        cart: cartPayload,
        formAnswers: {
          ...formData, // 👈 Masukin semua Custom Answers biar ditangkep Backend
          attendee_name: formData.name,
          greeting: formData.greeting,
          isAttending: formData.isAttending 
        }
      };

      const headers = { "Content-Type": "application/json" };
      const token = localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch('/api/tickets/buy', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Gagal mengirim RSVP");
      }

      setIsSuccess(true);
      
      setTimeout(() => {
        navigate(`/invitation/${id}`);
      }, 3000);

    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full"></div></div>;
  if (!event) return <div className="text-center mt-20 text-white">Event tidak valid.</div>;

  const inputStyle = `w-full bg-slate-950 text-white border border-slate-800 rounded-xl px-5 py-4 focus:border-[#D4AF37] outline-none transition text-sm placeholder:text-slate-600`;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-200">
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 flex items-center sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="text-[#D4AF37] p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center font-bold text-white uppercase tracking-widest text-sm mr-9">
          Data Tamu Undangan
        </h1>
      </div>

      <div className="flex-1 p-4 sm:p-6 flex justify-center items-start pt-8 pb-20">
        <div className="w-full max-w-2xl bg-slate-900/80 border border-slate-800 rounded-[32px] shadow-2xl p-6 sm:p-10">
          
          {isSuccess ? (
            <div className="text-center py-12 animate-fade-in">
              <CheckCircle2 className="w-24 h-24 text-[#D4AF37] mx-auto mb-6" />
              <h2 className="text-3xl font-serif text-white mb-4 italic">RSVP Berhasil!</h2>
              <p className="text-slate-400 text-base leading-relaxed">
                {formData.isAttending 
                  ? "Terima kasih atas konfirmasinya. E-Ticket telah dikirimkan ke email Anda." 
                  : "Terima kasih atas doa dan ucapan Anda. Kami menghargai konfirmasi Anda."}
              </p>
              <p className="text-[#D4AF37] text-xs mt-8 uppercase tracking-widest font-bold animate-pulse">Mengalihkan kembali ke undangan...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Ketik nama Anda di sini..." className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Untuk pengiriman E-Ticket (QR Code)" className={inputStyle} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest mb-3">Konfirmasi Kehadiran <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, isAttending: true})}
                    className={`py-4 rounded-xl text-sm font-bold transition-all border-2 ${formData.isAttending === true ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600'}`}
                  >
                    Ya, Saya Hadir
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, isAttending: false})}
                    className={`py-4 rounded-xl text-sm font-bold transition-all border-2 ${formData.isAttending === false ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600'}`}
                  >
                    Maaf, Tidak Bisa
                  </button>
                </div>
              </div>

              {formData.isAttending === true && (
                <div className="space-y-8 animate-fade-in p-6 bg-slate-950/50 border border-slate-800 rounded-2xl">
                  
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Pilih Sesi Yang Dihadiri <span className="text-red-500">*</span></label>
                    <div className="space-y-3">
                      {event.sessions?.map(s => (
                        <label 
                          key={s.id} 
                          onClick={() => toggleSession(s.id)} 
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedSessions.includes(s.id) ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-slate-800 bg-slate-950 hover:border-slate-700'}`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${selectedSessions.includes(s.id) ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-slate-600'}`}>
                             {selectedSessions.includes(s.id) && <CheckCircle2 className="w-3 h-3 text-slate-900" strokeWidth={4} />}
                          </div>
                          <div className="flex-1">
                            <p className={`font-bold text-sm ${selectedSessions.includes(s.id) ? 'text-[#D4AF37]' : 'text-slate-300'}`}>{s.name}</p>
                            <p className="text-xs text-slate-500">{s.date} • {s.start_time}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Jumlah Rombongan (Pax) <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, pax: 1})}
                        className={`py-5 flex flex-col items-center justify-center gap-2 rounded-xl transition-all border-2 ${formData.pax === 1 ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600'}`}
                      >
                        <User className="w-6 h-6" />
                        <span className="text-xs font-bold uppercase tracking-widest">Hanya Saya</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, pax: 2})}
                        className={`py-5 flex flex-col items-center justify-center gap-2 rounded-xl transition-all border-2 ${formData.pax === 2 ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-600'}`}
                      >
                        <Users className="w-6 h-6" />
                        <span className="text-xs font-bold uppercase tracking-widest">Saya & Partner</span>
                      </button>
                    </div>
                  </div>

                  {/* 👇 BAGIAN RENDER CUSTOM QUESTIONS UNTUK WEDDING 👇 */}
                  {activeQuestions.length > 0 && (
                    <div className="pt-6 border-t border-slate-800 space-y-6">
                      <h3 className="text-[11px] font-black text-[#D4AF37] uppercase tracking-widest bg-[#D4AF37]/10 inline-block px-3 py-1 rounded-md border border-[#D4AF37]/20">Pertanyaan Tambahan</h3>
                      {activeQuestions.map(q => (
                        <div key={q.id}>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                            {q.question_text} {q.is_required && <span className="text-red-500">*</span>}
                          </label>
                          
                          {q.answer_type === 'Text' && (
                            <input type="text" onChange={e => handleCustomChange(q.id, e.target.value, 'Text')} required={q.is_required} className={inputStyle} placeholder="Ketik jawaban di sini..." />
                          )}
                          
                          {q.answer_type === 'Dropdown' && (
                            <select onChange={e => handleCustomChange(q.id, e.target.value, 'Dropdown')} required={q.is_required} className={`${inputStyle} cursor-pointer`}>
                              <option value="">-- Pilih Jawaban --</option>
                              {q.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                            </select>
                          )}
                          
                          {q.answer_type === 'Checkbox' && (
                            <div className="space-y-3 mt-2">
                              {q.options?.map((opt, i) => (
                                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                  <input type="checkbox" value={opt} onChange={e => handleCustomChange(q.id, opt, 'Checkbox', e.target.checked)} className="w-5 h-5 text-[#D4AF37] border-slate-700 bg-slate-900 rounded focus:ring-[#D4AF37]" />
                                  <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 👆 AKHIR RENDER CUSTOM QUESTIONS 👆 */}

                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#D4AF37] uppercase tracking-widest mb-2">Ucapan & Doa <span className="text-red-500">*</span></label>
                <textarea 
                  name="greeting" 
                  value={formData.greeting} 
                  onChange={handleChange}
                  required 
                  placeholder={formData.isAttending === false ? "Berikan doa dan alasan ketidakhadiran Anda..." : "Semoga langgeng dan bisa menjadi pasangan sehidup semati..."}
                  rows="4" 
                  className={`${inputStyle} resize-none`} 
                />
              </div>

              <div className="pt-4 mt-8">
                <button 
                  type="submit" 
                  disabled={isSubmitting || formData.isAttending === null}
                  className="w-full py-4 bg-[#D4AF37] text-slate-950 font-black uppercase tracking-widest rounded-xl hover:bg-[#FFDF73] transition-colors disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(212,175,55,0.2)] text-sm"
                >
                  {isSubmitting ? 'Memproses...' : 'Kirim RSVP'}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
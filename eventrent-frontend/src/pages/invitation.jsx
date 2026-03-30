import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

export default function Invitation() {
  const { eventId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const guestName = searchParams.get('to') || 'Tamu Undangan'; 
  
  const [isOpen, setIsOpen] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [baseForm, setBaseForm] = useState({
    attendee_name: guestName,
    guest_email: '',
    pax: 1,
    greeting: ''
  });

  const [customAnswers, setCustomAnswers] = useState({});

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) throw new Error('Event tidak ditemukan');
        const data = await response.json();
        setEventData(data);
      } catch (error) {
        console.error(error);
        alert('Gagal memuat data undangan.');
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, navigate]);

  const handleCustomAnswerChange = (questionId, value) => {
    setCustomAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleRSVP = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const sessionId = eventData.sessions?.[0]?.id;
    const payload = {
      eventId: eventData.id,
      sessionId: sessionId,
      attendee_name: baseForm.attendee_name,
      guest_email: baseForm.guest_email,
      pax: parseInt(baseForm.pax),
      greeting: baseForm.greeting,
      custom_answers: customAnswers, 
      price: 0, 
    };

    try {
      const response = await fetch('/api/tickets/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('RSVP Berhasil! QR E-Ticket telah dikirim ke email Anda.');
        navigate('/cek-tiket'); 
      } else {
        const errData = await response.json();
        alert('Gagal RSVP: ' + (errData.message || 'Server Error'));
      }
    } catch (error) {
      alert('Terjadi kesalahan koneksi jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-[#D4AF37] font-bold tracking-widest uppercase">Membuka Undangan...</div>;
  if (!eventData) return null;

  const eventDate = new Date(eventData.event_start || eventData.eventStart).toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="bg-slate-950 font-serif text-slate-100 min-h-screen relative overflow-hidden">
      
      {/* --- COVER UNDANGAN BERSIH (TANPA Z-INDEX BRUTAL) --- */}
      <div 
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-transform duration-1000 ease-in-out ${isOpen ? '-translate-y-full' : 'translate-y-0'}`}
      >
        {/* GAMBAR BACKGROUND PAKAI TAG IMG (ANTI BERULANG) */}
        <img 
          src={eventData.image_url || eventData.img} 
          alt="Cover" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* LAPISAN HITAM (OVERLAY) */}
        <div className="absolute inset-0 bg-black/70"></div>

        {/* KONTEN COVER */}
        <div className="text-center text-white relative z-10 border border-[#D4AF37]/30 bg-black/40 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl mx-4">
          <p className="tracking-widest mb-3 uppercase text-xs text-[#D4AF37]">You are invited to</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-8 italic text-white">{eventData.title}</h1>
          <div className="mb-10">
            <p className="text-xs tracking-widest uppercase text-gray-400">Kepada Yth.</p>
            <p className="text-2xl font-bold mt-2 text-[#D4AF37]">{guestName}</p>
          </div>
          <button 
            type="button"
            onClick={() => setIsOpen(true)}
            className="bg-[#D4AF37] text-slate-900 px-8 py-3 rounded-full font-bold uppercase tracking-wider hover:bg-[#B5952F] transition-colors shadow-[0_0_20px_rgba(212,175,55,0.4)] cursor-pointer"
          >
            Buka Undangan
          </button>
        </div>
      </div>

      {/* --- ISI KONTEN UNDANGAN & RSVP --- */}
      <div className={`w-full min-h-screen pb-20 overflow-y-auto ${!isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-1000 delay-300`}>
        
        {/* Gambar Header di Dalam Undangan */}
        <div className="w-full h-[40vh] md:h-[60vh] relative">
           <img src={eventData.image_url || eventData.img} alt="Cover" className="w-full h-full object-cover opacity-40" />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent"></div>
        </div>

        {/* Header Content */}
        <section className="px-6 text-center -mt-20 relative z-10 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold italic mb-6 text-white">{eventData.title}</h2>
          <p className="text-lg text-gray-300 italic max-w-2xl mx-auto leading-relaxed mb-8">
            "{eventData.description}"
          </p>
          
          <div className="inline-block border border-[#D4AF37]/30 rounded-2xl p-6 bg-slate-900/50 backdrop-blur-sm shadow-xl">
            <p className="text-lg text-[#D4AF37] font-bold mb-2">{eventDate}</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              {eventData.sessions?.[0]?.location?.namePlace || 'Lokasi Acara'} <br/>
              {eventData.sessions?.[0]?.location?.place || ''} <br/>
              {eventData.sessions?.[0]?.location?.city || ''}
            </p>
          </div>
        </section>

        {/* Form RSVP Dinamis */}
        <section className="max-w-xl mx-auto px-6 relative z-10">
          <div className="bg-slate-900 shadow-2xl rounded-[32px] border border-slate-800 p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
            
            <h3 className="text-2xl font-bold text-center mb-2 text-[#D4AF37]">Konfirmasi Kehadiran</h3>
            <p className="text-center text-xs text-gray-400 mb-8 tracking-widest uppercase">Mohon isi form di bawah ini</p>
            
            <form onSubmit={handleRSVP} className="space-y-5 font-sans">
              <div>
                <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider text-gray-400">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={baseForm.attendee_name}
                  onChange={(e) => setBaseForm({...baseForm, attendee_name: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none bg-slate-950 border border-slate-800 text-white focus:border-[#D4AF37]"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider text-gray-400">Email (Untuk E-Ticket)</label>
                <input 
                  type="email" 
                  value={baseForm.guest_email}
                  onChange={(e) => setBaseForm({...baseForm, guest_email: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none bg-slate-950 border border-slate-800 text-white focus:border-[#D4AF37]"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider text-gray-400">Jumlah Orang (Pax)</label>
                <select 
                  value={baseForm.pax}
                  onChange={(e) => setBaseForm({...baseForm, pax: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none bg-slate-950 border border-slate-800 text-white focus:border-[#D4AF37]"
                >
                  <option value="1">1 Orang</option>
                  <option value="2">2 Orang</option>
                  <option value="3">3 Orang</option>
                </select>
              </div>
              
              {/* Render Pertanyaan Custom Secara Dinamis */}
              {eventData.sessions?.[0]?.questions?.map((q) => (
                <div key={q.id}>
                  <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider text-gray-400">
                    {q.text} {q.isRequired && <span className="text-red-500">*</span>}
                  </label>
                  
                  {q.type === 'Text' && (
                    <input 
                      type="text" 
                      onChange={(e) => handleCustomAnswerChange(q.id, e.target.value)}
                      required={q.isRequired}
                      className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none bg-slate-950 border border-slate-800 text-white focus:border-[#D4AF37]"
                    />
                  )}

                  {q.type === 'Dropdown' && (
                    <select 
                      onChange={(e) => handleCustomAnswerChange(q.id, e.target.value)}
                      required={q.isRequired}
                      className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none bg-slate-950 border border-slate-800 text-white focus:border-[#D4AF37]"
                    >
                      <option value="" disabled selected hidden>Pilih salah satu...</option>
                      {q.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                  )}

                  {q.type === 'Checkbox' && (
                    <div className="space-y-2 mt-2">
                      {q.options.map((opt, i) => (
                        <label key={i} className="flex items-center gap-3 text-sm text-gray-300 cursor-pointer">
                          <input 
                            type="checkbox" 
                            value={opt}
                            onChange={(e) => {
                               const currentAnswers = customAnswers[q.id] || [];
                               let newAnswers;
                               if (e.target.checked) {
                                 newAnswers = [...currentAnswers, opt];
                               } else {
                                 newAnswers = currentAnswers.filter(item => item !== opt);
                               }
                               handleCustomAnswerChange(q.id, newAnswers);
                            }}
                            className="w-4 h-4 rounded text-[#D4AF37] focus:ring-[#D4AF37] bg-slate-950 border-slate-700"
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div>
                <label className="text-xs font-bold mb-1.5 block uppercase tracking-wider text-[#D4AF37]">Ucapan & Doa</label>
                <textarea 
                  rows="3"
                  value={baseForm.greeting}
                  onChange={(e) => setBaseForm({...baseForm, greeting: e.target.value})}
                  className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none bg-slate-950 border border-slate-800 text-white focus:border-[#D4AF37]"
                  placeholder="Tuliskan harapan terbaik Anda..."
                ></textarea>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-[#D4AF37] text-slate-900 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-[#B5952F] transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Memproses...' : 'Kirim RSVP & Dapatkan QR'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
      
    </div>
  );
}
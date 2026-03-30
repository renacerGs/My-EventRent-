import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

export default function WeddingInvitation() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const guestName = searchParams.get('to') || 'Tamu Undangan Spesial'; 

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpened, setIsOpened] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${id}`);
        if (!res.ok) throw new Error('Undangan tidak ditemukan');
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        console.error(err);
        alert(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!event) return <div className="text-center mt-20 text-white">Undangan tidak valid.</div>;

  const details = event.event_details || {};
  const profiles = details.profiles || [];
  const gallery = details.galleryImages || [];
  const gifts = details.digitalGifts || [];

  return (
    <div className="font-sans bg-[#FAFAFA] text-slate-800 min-h-screen selection:bg-[#D4AF37] selection:text-white pb-20">
      
      {/* ======================================================== */}
      {/* COVER DEPAN */}
      {/* ======================================================== */}
      <div className={`fixed inset-0 z-50 transition-transform duration-1000 ease-in-out flex flex-col ${isOpened ? '-translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}>
        <div className="absolute inset-0">
          <img src={event.img} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6 py-12">
          <p className="text-[#D4AF37] tracking-[0.3em] text-xs font-bold mb-4 uppercase">The Wedding Of</p>
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-8 italic">{event.title}</h1>
          <div className="bg-slate-900/50 border border-[#D4AF37]/30 p-8 rounded-2xl backdrop-blur-md max-w-sm w-full mb-10">
            <p className="text-gray-300 text-sm mb-2">Kepada Yth. Bapak/Ibu/Saudara/i:</p>
            <p className="text-2xl font-bold text-white mb-2">{guestName}</p>
            <p className="text-xs text-gray-400 italic">*Mohon maaf bila ada kesalahan penulisan nama/gelar</p>
          </div>
          <button onClick={() => setIsOpened(true)} className="px-8 py-4 bg-[#D4AF37] text-slate-900 rounded-full font-bold uppercase tracking-widest text-sm shadow-[0_0_40px_rgba(212,175,55,0.3)] hover:scale-105 transition-all">
             ✉ Buka Undangan
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ISI UNDANGAN */}
      {/* ======================================================== */}
      <div className={`transition-opacity duration-1000 delay-500 ${isOpened ? 'opacity-100' : 'opacity-0 h-screen overflow-hidden'}`}>
        
        {/* 1. PENGANTAR & QUOTES */}
        <section className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-20 bg-white relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-[#D4AF37]/30"></div>
          <p className="text-[#D4AF37] text-2xl mb-6">🌿</p>
          <h2 className="text-xl md:text-2xl font-serif italic text-slate-800 max-w-2xl leading-relaxed mb-8">
            "{details.quote || 'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu isteri-isteri dari jenismu sendiri...'}"
          </h2>
          <p className="text-sm text-slate-600 max-w-3xl leading-loose">
            {details.openingMessage}
          </p>
        </section>

        {/* 2. PROFIL MEMPELAI */}
        <section className="py-24 bg-slate-50 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-serif text-[#D4AF37] mb-16 italic">Sang Mempelai</h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-8">
              {profiles.map((prof, idx) => (
                <React.Fragment key={prof.id}>
                  {/* Card Mempelai */}
                  <div className="w-full md:w-1/2 flex flex-col items-center text-center">
                    <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-[#D4AF37]/30 p-2 mb-6 shadow-xl">
                      <img src={prof.photoUrl || 'https://via.placeholder.com/300'} alt={prof.fullName} className="w-full h-full object-cover rounded-full" />
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-2">{prof.role}</p>
                    <h3 className="text-3xl font-serif mb-4 text-slate-800">{prof.fullName}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed max-w-xs">{prof.parentsInfo}</p>
                  </div>

                  {/* Icon '&' di tengah (Hanya muncul jika profil ada lebih dari 1 dan bukan elemen terakhir) */}
                  {idx < profiles.length - 1 && (
                    <div className="text-5xl font-serif text-[#D4AF37]/40 md:py-0 py-8">&</div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </section>

        {/* 3. WAKTU & LOKASI (SESSIONS) */}
        <section className="py-24 bg-white px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-serif text-[#D4AF37] mb-16 italic">Rangkaian Acara</h2>
            
            <div className="space-y-12">
              {event.sessions?.map((session, idx) => (
                <div key={session.id} className="bg-slate-50 p-8 md:p-12 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#D4AF37]"></div>
                  <h3 className="text-2xl font-serif font-bold text-slate-800 mb-2">{session.name}</h3>
                  <p className="text-sm text-slate-500 mb-8">{session.description}</p>
                  
                  <div className="flex flex-col md:flex-row justify-center gap-8 mb-8">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl mb-2">🗓️</span>
                      <p className="font-bold text-slate-800">{session.date}</p>
                    </div>
                    <div className="hidden md:block w-px h-12 bg-slate-200"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl mb-2">⏰</span>
                      <p className="font-bold text-slate-800">{session.start_time} - {session.end_time}</p>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 mb-8">
                    <p className="font-bold text-slate-800 mb-1">{session.name_place}</p>
                    <p className="text-sm text-slate-600 mb-4">{session.place}, {session.city}</p>
                    {session.map_url && (
                      <a href={session.map_url} target="_blank" rel="noreferrer" className="inline-block text-xs font-bold uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37] px-6 py-2 rounded-full hover:bg-[#D4AF37] hover:text-white transition">
                        Buka Google Maps
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* TOMBOL RSVP SAKTI KITA */}
            <div className="mt-16">
               <button 
                 onClick={() => navigate(`/checkout/${event.id}`)} 
                 className="px-10 py-5 bg-slate-900 text-[#D4AF37] rounded-full font-bold uppercase tracking-widest shadow-2xl hover:bg-slate-800 transition-all hover:-translate-y-1"
               >
                 Tentukan Kehadiran (RSVP)
               </button>
            </div>
          </div>
        </section>

        {/* 4. GALERI FOTO */}
        {gallery.length > 0 && (
          <section className="py-24 bg-slate-950 px-6">
            <div className="max-w-5xl mx-auto text-center">
              <h2 className="text-4xl font-serif text-[#D4AF37] mb-12 italic">Momen Bahagia</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gallery.map((imgUrl, idx) => (
                  <div key={idx} className={`rounded-xl overflow-hidden shadow-lg ${idx === 0 ? 'col-span-2 md:col-span-2 row-span-2' : ''}`}>
                    <img src={imgUrl} alt={`Galeri ${idx}`} className="w-full h-full object-cover aspect-square hover:scale-110 transition duration-700" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 5. DIGITAL GIFT / REKENING */}
        {gifts.length > 0 && (
          <section className="py-24 bg-slate-50 px-6">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-4xl font-serif text-[#D4AF37] mb-6 italic">Wedding Gift</h2>
              <p className="text-sm text-slate-600 mb-12 leading-relaxed">
                Doa restu Anda merupakan karunia yang sangat berarti bagi kami. 
                Namun jika Anda bermaksud memberikan tanda kasih, kami menyediakan fitur amplop digital di bawah ini.
              </p>
              
              <div className="space-y-6">
                {gifts.map((gift) => (
                  <div key={gift.id} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
                    <p className="text-lg font-black uppercase text-slate-800 mb-2">{gift.bankName}</p>
                    <p className="text-3xl font-mono text-[#D4AF37] mb-2 tracking-widest">{gift.accountNumber}</p>
                    <p className="text-sm font-bold text-slate-600 uppercase">a/n {gift.accountName}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(gift.accountNumber);
                        alert("Nomor rekening berhasil disalin!");
                      }}
                      className="mt-4 text-xs font-bold uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37] px-6 py-2 rounded-full hover:bg-[#D4AF37] hover:text-white transition"
                    >
                      Salin Rekening
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 6. PENUTUP */}
        <section className="py-24 bg-white px-6 text-center border-t border-slate-100">
          <div className="max-w-2xl mx-auto">
            <p className="text-sm text-slate-600 leading-loose mb-8">
              {details.closingMessage || 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu.'}
            </p>
            <h3 className="text-4xl font-serif text-[#D4AF37] italic mb-4">Terima Kasih</h3>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
              {profiles.map(p => p.nickName || p.fullName.split(' ')[0]).join(' & ')}
            </p>
          </div>
        </section>

      </div>
    </div>
  );
}
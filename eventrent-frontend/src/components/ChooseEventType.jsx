import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChooseEventType() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-20 px-6 flex items-center justify-center font-sans">
      <div className="max-w-4xl w-full">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-4">Pilih Platform Acara</h1>
          <p className="text-gray-500 font-medium">Sesuaikan sistem EventRent dengan kebutuhan Anda.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* KARTU PUBLIC EVENT */}
          <div 
            onClick={() => navigate('/create/public')}
            className="bg-white rounded-[32px] p-10 cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all border-2 border-transparent hover:border-[#FF6B35] group"
          >
            <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-4xl">🎫</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">Public Event</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">Sistem penjualan tiket terbuka untuk umum. Cocok untuk Konser, Pameran, Seminar, atau Turnamen.</p>
            <ul className="space-y-2 text-sm font-bold text-gray-700">
              <li className="flex items-center gap-2"><span className="text-[#FF6B35]">✔</span> Payment Gateway Integrasi</li>
              <li className="flex items-center gap-2"><span className="text-[#FF6B35]">✔</span> Manajemen Kuota & Kategori</li>
              <li className="flex items-center gap-2"><span className="text-[#FF6B35]">✔</span> Tampil di Halaman Publik</li>
            </ul>
          </div>

          {/* KARTU PERSONAL / WEDDING EVENT */}
          <div 
            onClick={() => navigate('/create/personal')}
            className="bg-gradient-to-br from-slate-900 to-black rounded-[32px] p-10 cursor-pointer shadow-xl hover:shadow-[0_20px_50px_rgba(212,175,55,0.2)] hover:-translate-y-2 transition-all border-2 border-slate-800 hover:border-[#D4AF37] group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] blur-[80px] opacity-30"></div>
            <div className="w-20 h-20 bg-slate-800 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10">
              <span className="text-4xl">💍</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-3 relative z-10">Wedding Invitation</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 relative z-10">Sistem RSVP Eksklusif untuk acara Pernikahan. Elegan, rapi, dan khusus untuk tamu undangan.</p>
            <ul className="space-y-2 text-sm font-medium text-gray-300 relative z-10">
              <li className="flex items-center gap-2"><span className="text-[#D4AF37]">✦</span> Form Kehadiran & Ucapan (RSVP)</li>
              <li className="flex items-center gap-2"><span className="text-[#D4AF37]">✦</span> QR Code Guestbook Digital</li>
              <li className="flex items-center gap-2"><span className="text-[#D4AF37]">✦</span> Link Undangan Rahasia</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
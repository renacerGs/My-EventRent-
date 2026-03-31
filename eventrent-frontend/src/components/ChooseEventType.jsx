import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChooseEventType() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-20 px-4 sm:px-6 flex items-center justify-center font-sans">
      <div className="max-w-6xl w-full">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight mb-4">Pilih Platform Acara</h1>
          <p className="text-gray-500 font-medium text-lg">Sesuaikan sistem EventRent dengan kebutuhan momen spesial Anda.</p>
        </div>
        
        {/* GRID DIBUAT JADI 3 KOLOM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 1. KARTU PUBLIC EVENT */}
          <div 
            onClick={() => navigate('/create/public')}
            className="bg-white rounded-[32px] p-8 lg:p-10 cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all border-2 border-transparent hover:border-[#FF6B35] group flex flex-col h-full"
          >
            <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-4xl">🎫</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tight">Public Event</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow">
              Sistem penjualan tiket terbuka. Cocok untuk Konser, Pameran, Seminar, atau Turnamen Olahraga.
            </p>
            <ul className="space-y-3 text-xs font-bold text-gray-700 uppercase tracking-wide">
              <li className="flex items-center gap-3"><span className="text-[#FF6B35] text-lg">✔</span> Payment Gateway Integrasi</li>
              <li className="flex items-center gap-3"><span className="text-[#FF6B35] text-lg">✔</span> Manajemen Kuota & Stok</li>
              <li className="flex items-center gap-3"><span className="text-[#FF6B35] text-lg">✔</span> Tampil di Katalog Publik</li>
            </ul>
          </div>

          {/* 2. KARTU WEDDING EVENT */}
          <div 
            onClick={() => navigate('/create/wedding')} // 👈 FIX: Diarahkan ke /create/wedding
            className="bg-gradient-to-br from-slate-900 to-black rounded-[32px] p-8 lg:p-10 cursor-pointer shadow-xl hover:shadow-[0_20px_50px_rgba(212,175,55,0.2)] hover:-translate-y-2 transition-all border-2 border-slate-800 hover:border-[#D4AF37] group relative overflow-hidden flex flex-col h-full"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] blur-[80px] opacity-30"></div>
            <div className="w-20 h-20 bg-slate-800 border border-[#D4AF37]/30 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10">
              <span className="text-4xl">💍</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-tight relative z-10">Wedding</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-grow relative z-10">
              Undangan digital super elegan untuk Pernikahan. Lengkap dengan data kedua mempelai dan ucapan doa.
            </p>
            <ul className="space-y-3 text-xs font-bold text-gray-300 uppercase tracking-wide relative z-10">
              <li className="flex items-center gap-3"><span className="text-[#D4AF37] text-lg">✦</span> Tema Elegan & Eksklusif</li>
              <li className="flex items-center gap-3"><span className="text-[#D4AF37] text-lg">✦</span> Amplop Digital (Gifts)</li>
              <li className="flex items-center gap-3"><span className="text-[#D4AF37] text-lg">✦</span> Buku Tamu & RSVP</li>
            </ul>
          </div>

          {/* 3. KARTU PERSONAL EVENT (BARU) */}
          <div 
            onClick={() => navigate('/create/personal')}
            className="bg-white rounded-[32px] p-8 lg:p-10 cursor-pointer shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all border-2 border-transparent hover:border-[#8B5CF6] group flex flex-col h-full"
          >
            <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <span className="text-4xl">🥳</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3 uppercase tracking-tight">Acara Pribadi</h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 flex-grow">
              Sistem RSVP Private untuk Pesta Ulang Tahun, Reuni Akbar, Syukuran, atau Private Party.
            </p>
            <ul className="space-y-3 text-xs font-bold text-gray-700 uppercase tracking-wide">
              <li className="flex items-center gap-3"><span className="text-[#8B5CF6] text-lg">✔</span> 1 Profil Tuan Rumah (Host)</li>
              <li className="flex items-center gap-3"><span className="text-[#8B5CF6] text-lg">✔</span> Konfirmasi Kehadiran Cepat</li>
              <li className="flex items-center gap-3"><span className="text-[#8B5CF6] text-lg">✔</span> Link Undangan Rahasia</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}
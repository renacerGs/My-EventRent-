import React from 'react';

export default function Hero() {
  return (
    <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden bg-black font-sans">
      
      {/* 1. BACKGROUND IMAGE - HD Concert dengan Suasana Orange */}
      <img 
        src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=2000&q=80" 
        alt="HD Event Experience" 
        className="absolute inset-0 w-full h-full object-cover opacity-70"
      />

      {/* 2. SOFT GRADIENT OVERLAY - Biar teks tetap terbaca tajam */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
      
      {/* 3. KONTEN TEKS - PADDING HP DIKURANGIN (px-6) BIAR GAK SUMPEK */}
      <div className="absolute inset-0 flex flex-col items-start justify-center px-6 md:px-16 lg:px-24">
         
         {/* Judul: Di HP text-3xl, Di Desktop text-5xl/6xl */}
         <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-tight uppercase tracking-tighter">
            FIND YOUR NEXT <br />
            <span className="text-[#FF6B35]">MOMENT</span>
         </h1>
         
         {/* Deskripsi: Line-height dirapihin */}
         <p className="mt-4 md:mt-5 text-[11px] sm:text-xs md:text-sm font-medium text-gray-200 max-w-[280px] sm:max-w-sm leading-relaxed border-l-2 border-[#FF6B35] pl-3 md:pl-4">
            Explore curated events and unforgettable experiences tailored just for you. 
            Join the community and start your journey with EventRent.
         </p>
      </div>
      
      {/* 4. DEKORASI LINE HALUS DI BAWAH */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF6B35] to-transparent opacity-50"></div>
    </div>
  );
}
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
      
      {/* 3. KONTEN TEKS - Ukuran Sedang & Layout Minimalis */}
      <div className="absolute inset-0 flex flex-col items-start justify-center px-12 md:px-24">
         
         {/* Judul: Ukuran Sedang & Proporsional */}
         <h1 className="text-2xl md:text-5xl font-black text-white leading-tight uppercase tracking-tighter">
            FIND YOUR NEXT <br />
            <span className="text-[#FF6B35]">MOMENT</span>
         </h1>
         
         {/* Deskripsi: Clean & Elegan */}
         <p className="mt-5 text-xs md:text-sm font-medium text-gray-200 max-w-sm leading-relaxed border-l-2 border-[#FF6B35] pl-4">
            Explore curated events and unforgettable experiences tailored just for you. 
            Join the community and start your journey with EventRent.
         </p>
      </div>
      
      {/* 4. DEKORASI LINE HALUS DI BAWAH */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF6B35] to-transparent opacity-50"></div>
    </div>
  );
}
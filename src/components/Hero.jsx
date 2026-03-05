import React from 'react';

export default function Hero() {
  return (
    <div className="relative w-full h-[350px] md:h-[450px] overflow-hidden">
      {/* Background Image sesuai gambar yang kamu kirim */}
      <img 
        src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=2000&q=80" 
        alt="Hero Background" 
        className="w-full h-full object-cover"
      />
      
      {/* Overlay Gelap Tipis agar teks Navbar tetap terlihat jelas */}
      <div className="absolute inset-0 bg-black/10"></div>
    </div>
  );
}
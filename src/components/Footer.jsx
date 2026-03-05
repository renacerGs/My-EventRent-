import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#1C2331] w-full border-t-[5px] border-[#FF6B35] text-gray-400">
      <div className="max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Kolom 1: Logo & Deskripsi */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-[#FF6B35] rounded-full shadow-lg flex items-center justify-center">
                <div className="w-5 h-5 bg-white/20 rounded-full blur-[2px]"></div>
              </div>
              <h2 className="text-2xl font-extrabold text-[#FF6B35] tracking-tight">EventRent</h2>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              Platform penyewaan peralatan event terbaik untuk menunjang kesuksesan acara Anda.
            </p>
            <p className="text-xs mt-4 font-medium">Copyright © 2024 EventRent</p>
          </div>

          {/* Kolom 2: Get in Touch */}
          <div className="flex flex-col gap-6">
            <h3 className="text-white font-bold text-lg">Get in Touch</h3>
            <ul className="flex flex-col gap-4 text-sm">
              <li className="flex items-center gap-3">
                <span className="text-[#FF6B35] text-lg">📍</span> Jakarta, Indonesia
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#FF6B35] text-lg">✉️</span> hello@eventrent.com
              </li>
              <li className="flex items-center gap-3">
                <span className="text-[#FF6B35] text-lg">📞</span> +62 812 3456 789
              </li>
            </ul>
          </div>

          {/* Kolom 3: Follow Us */}
          <div className="flex flex-col gap-6">
            <h3 className="text-white font-bold text-lg">Follow Us</h3>
            <div className="flex flex-wrap gap-4">
              {/* Instagram */}
              <div className="w-10 h-10 bg-[#2C3544] text-white rounded-full flex items-center justify-center hover:bg-[#FF6B35] cursor-pointer transition-all duration-300 shadow-md">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.822a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.88z"/></svg>
              </div>
              
              {/* LinkedIn */}
              <div className="w-10 h-10 bg-[#2C3544] text-white rounded-full flex items-center justify-center hover:bg-[#0077b5] cursor-pointer transition-all duration-300 shadow-md">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </div>

              {/* Facebook */}
              <div className="w-10 h-10 bg-[#2C3544] text-white rounded-full flex items-center justify-center hover:bg-[#3b5998] cursor-pointer transition-all duration-300 shadow-md">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.595 0 0 .595 0 1.325v21.351C0 23.405.595 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.595 1.323-1.325V1.325C24 .595 23.405 0 22.675 0z"/></svg>
              </div>

              {/* X / Twitter */}
              <div className="w-10 h-10 bg-[#2C3544] text-white rounded-full flex items-center justify-center hover:bg-black cursor-pointer transition-all duration-300 shadow-md">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </div>
            </div>
            <p className="text-[11px] italic leading-tight text-gray-500 mt-4">
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod."
            </p>
          </div>

        </div>
      </div>
    </footer>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-[#1C2331] w-full border-t-[5px] border-[#FF6B35] text-gray-400 font-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 pt-12 pb-6 md:pt-16 md:pb-8">
        
        {/* ════ GRID UTAMA: 2 Kolom di HP, 4 Kolom di Laptop ════ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 md:gap-12">
          
          {/* ════ KOLOM 1: LOGO (Makan 2 kolom di HP agar di atas) ════ */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4 items-start text-left">
            <div className="flex items-center gap-3 select-none">
              <img 
                src="/logo.jpeg" 
                alt="EventRent Logo" 
                className="w-10 h-10 rounded-lg shadow-sm object-cover" 
              />
              <h2 className="text-2xl font-extrabold text-[#FF6B35] tracking-tight">EventRent</h2>
            </div>
            <p className="text-[12px] md:text-sm italic leading-relaxed text-gray-500 max-w-[280px]">
              "Menghubungkan Anda dengan pengalaman dan komunitas terbaik di sekitar Anda."
            </p>
          </div>

          {/* ════ KOLOM 2: QUICK LINKS (Kiri di HP) ════ */}
          <div className="col-span-1 flex flex-col gap-5 items-start text-left">
            <h3 className="text-white font-bold text-lg">Quick Links</h3>
            <ul className="flex flex-col gap-4 text-sm items-start">
              <li>
                <Link to="/about" className="hover:text-[#FF6B35] transition-colors duration-300">
                  About EventRent
                </Link>
              </li>
              {/* Tambahkan link lain di sini nanti */}
            </ul>
          </div>

          {/* ════ KOLOM 3: FOLLOW US (Kanan di HP) ════ */}
          <div className="col-span-1 flex flex-col gap-5 items-start text-left">
            <h3 className="text-white font-bold text-lg">Follow Us</h3>
            <div className="flex items-center gap-4 text-gray-400 mt-1 flex-wrap">
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="inline-block hover:text-pink-500 hover:-translate-y-1 transition-all duration-300">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.822a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.88z"/></svg>
              </a>
              <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="inline-block hover:text-blue-600 hover:-translate-y-1 transition-all duration-300">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="inline-block hover:text-blue-500 hover:-translate-y-1 transition-all duration-300">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35C.595 0 0 .595 0 1.325v21.351C0 23.405.595 24 1.325 24H12.82v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.595 1.323-1.325V1.325C24 .595 23.405 0 22.675 0z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="inline-block hover:text-gray-100 hover:-translate-y-1 transition-all duration-300">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>

          {/* ════ KOLOM 4: GET IN TOUCH (Makan 2 kolom di HP biar email gak kepotong) ════ */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-5 items-start text-left">
            <h3 className="text-white font-bold text-lg">Get in Touch</h3>
            <ul className="flex flex-col gap-4 text-sm items-start">
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#FF6B35] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Surakarta, Indonesia</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#FF6B35] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>hello@eventrent.com</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#FF6B35] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>+62 812 3456</span>
              </li>
            </ul>
          </div>

        </div>

        {/* ════ COPYRIGHT SECTION (Paling Bawah) ════ */}
        <div className="mt-12 pt-6 border-t border-gray-700/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-medium text-gray-500 text-center w-full">
            Copyright © {new Date().getFullYear()} EventRent. cah 4
          </p>
        </div>

      </div>
    </footer>
  );
}
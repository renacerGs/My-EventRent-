import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

// 🔥 KONFIGURASI WARNA TEMA
const themeStyles = {
  public: {
    bg: "bg-[#FF6B35]",
    text: "text-[#FF6B35]",
    hoverText: "hover:text-[#FF6B35]",
    borderHover: "hover:border-[#FF6B35]",
    shadow: "shadow-orange-200"
  },
  wedding: {
    bg: "bg-[#D4AF37]",
    text: "text-[#D4AF37]",
    hoverText: "hover:text-[#D4AF37]",
    borderHover: "hover:border-[#D4AF37]",
    shadow: "shadow-[#D4AF37]/30"
  },
  personal: {
    bg: "bg-purple-600",
    text: "text-purple-600",
    hoverText: "hover:text-purple-600",
    borderHover: "hover:border-purple-500",
    shadow: "shadow-purple-200"
  }
};

export default function CustomTimePicker({ value, onChange, placeholder = "Pilih Jam", theme = "public" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState(value ? value.split(':')[0] : '12');
  const [minute, setMinute] = useState(value ? value.split(':')[1] : '00');

  // Ambil warna berdasarkan tema
  const colors = themeStyles[theme] || themeStyles.public;

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const handleConfirm = () => {
    onChange(`${hour}:${minute}`);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div onClick={() => setIsOpen(true)} className={`w-full rounded-xl px-4 py-3 text-sm transition-all bg-white text-gray-900 border border-gray-300 ${colors.borderHover} cursor-pointer flex items-center justify-between shadow-sm`}>
        <span className={value ? "text-gray-900 font-bold" : "text-gray-400"}>
          {value ? value : placeholder}
        </span>
        <Clock className={`w-5 h-5 ${colors.text}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} className={`${colors.bg} p-2 rounded-[2rem] w-full max-w-[280px] shadow-2xl`}>
              <div className="bg-white rounded-[1.5rem] p-6 w-full">
                <h3 className="text-center font-black text-gray-800 mb-5 tracking-widest uppercase text-xs">Pilih Waktu (WIB)</h3>
                
                <div className="flex justify-center items-center gap-4 mb-6">
                  {/* SCROLL JAM */}
                  <div className="w-20 h-[160px] overflow-y-auto snap-y snap-mandatory border border-gray-200 rounded-2xl bg-gray-50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {hours.map(h => (
                      <div key={h} onClick={() => setHour(h)} className={`h-12 flex items-center justify-center snap-center cursor-pointer font-bold text-xl transition-colors ${h === hour ? `${colors.bg} text-white rounded-xl mx-1 my-1 shadow-md` : `text-gray-400 ${colors.hoverText}`}`}>
                        {h}
                      </div>
                    ))}
                  </div>
                  
                  <div className="font-black text-2xl text-gray-800 animate-pulse">:</div>
                  
                  {/* SCROLL MENIT */}
                  <div className="w-20 h-[160px] overflow-y-auto snap-y snap-mandatory border border-gray-200 rounded-2xl bg-gray-50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {minutes.map(m => (
                      <div key={m} onClick={() => setMinute(m)} className={`h-12 flex items-center justify-center snap-center cursor-pointer font-bold text-xl transition-colors ${m === minute ? `${colors.bg} text-white rounded-xl mx-1 my-1 shadow-md` : `text-gray-400 ${colors.hoverText}`}`}>
                        {m}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <button type="button" onClick={handleConfirm} className={`flex-1 ${colors.bg} hover:opacity-90 text-white py-3.5 rounded-[1rem] font-black uppercase tracking-widest text-[10px] shadow-lg ${colors.shadow} transition-all active:scale-95`}>Set</button>
                  <button type="button" onClick={() => setIsOpen(false)} className="flex-1 text-gray-500 hover:bg-gray-50 py-3.5 rounded-[1rem] font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 border border-gray-100">Batal</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
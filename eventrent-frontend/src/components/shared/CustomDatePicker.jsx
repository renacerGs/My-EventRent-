import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays, ChevronDown } from 'lucide-react';

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; 
};

// 🔥 KONFIGURASI WARNA TEMA
const themeStyles = {
  public: {
    bg: "bg-[#FF6B35]",
    text: "text-[#FF6B35]",
    hoverText: "hover:text-[#FF6B35]",
    borderHover: "hover:border-[#FF6B35]",
    lightBgHover: "hover:bg-orange-50",
    shadow: "shadow-orange-200"
  },
  wedding: {
    bg: "bg-[#D4AF37]",
    text: "text-[#D4AF37]",
    hoverText: "hover:text-[#D4AF37]",
    borderHover: "hover:border-[#D4AF37]",
    lightBgHover: "hover:bg-[#FCFAEE]",
    shadow: "shadow-[#D4AF37]/30"
  },
  personal: {
    bg: "bg-purple-600",
    text: "text-purple-600",
    hoverText: "hover:text-purple-600",
    borderHover: "hover:border-purple-500",
    lightBgHover: "hover:bg-purple-50",
    shadow: "shadow-purple-200"
  }
};

export default function CustomDatePicker({ value, onChange, placeholder = "Pilih Tanggal", theme = "public" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const modalRef = useRef(null);

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  // Ambil warna berdasarkan tema (default: public)
  const colors = themeStyles[theme] || themeStyles.public;

  const formatOutput = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatDisplay = (date) => {
    if (!date) return '';
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);

  let calendarDays = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    calendarDays.push({ day: prevMonthDays - i, isCurrentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
  }
  const remainingSlots = 42 - calendarDays.length;
  for (let i = 1; i <= remainingSlots; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
  }

  const handleConfirm = () => {
    if (selectedDate) onChange(formatOutput(selectedDate));
    setIsOpen(false);
  };

  const currentYear = new Date().getFullYear();
  const yearList = Array.from({ length: 15 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="relative w-full">
      <div onClick={() => setIsOpen(true)} className={`w-full rounded-xl px-4 py-3 text-sm transition-all bg-white text-gray-900 border border-gray-300 ${colors.borderHover} cursor-pointer flex items-center justify-between`}>
        <span className={selectedDate ? "text-gray-900 font-bold" : "text-gray-400"}>
          {selectedDate ? formatDisplay(selectedDate) : placeholder}
        </span>
        <CalendarDays className={`w-5 h-5 ${colors.text}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} ref={modalRef} className={`${colors.bg} p-2 rounded-[2rem] w-full max-w-[320px] shadow-2xl`}>
              <div className="bg-white rounded-[1.5rem] p-5 w-full relative">
                <div className="flex justify-between items-center mb-6 px-1 relative">
                  <button type="button" onClick={() => { setViewDate(new Date(year, month - 1, 1)); setShowMonthDropdown(false); setShowYearDropdown(false); }} className="p-1 hover:bg-gray-100 rounded-full transition text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
                  <div className="flex gap-2 font-bold text-gray-800">
                    
                    {/* DROPDOWN BULAN */}
                    <div className="relative">
                      <span onClick={() => { setShowMonthDropdown(!showMonthDropdown); setShowYearDropdown(false); }} className="cursor-pointer px-2 py-1.5 hover:bg-gray-100 rounded-lg select-none flex items-center gap-1.5 text-sm transition-colors">{MONTHS[month]} <ChevronDown className="w-3.5 h-3.5 text-gray-400" /></span>
                      {showMonthDropdown && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[180px] bg-white border border-gray-100 shadow-xl rounded-2xl p-2 grid grid-cols-3 gap-1 z-[300]">
                          {MONTHS.map((m, idx) => (<button key={m} type="button" onClick={() => { setViewDate(new Date(year, idx, 1)); setShowMonthDropdown(false); }} className={`py-2 text-xs font-bold rounded-xl transition-all ${idx === month ? `${colors.bg} text-white shadow-md` : `${colors.lightBgHover} text-gray-600 ${colors.hoverText}`}`}>{m}</button>))}
                        </div>
                      )}
                    </div>
                    
                    {/* DROPDOWN TAHUN */}
                    <div className="relative">
                      <span onClick={() => { setShowYearDropdown(!showYearDropdown); setShowMonthDropdown(false); }} className="cursor-pointer px-2 py-1.5 hover:bg-gray-100 rounded-lg select-none flex items-center gap-1.5 text-sm transition-colors">{year} <ChevronDown className="w-3.5 h-3.5 text-gray-400" /></span>
                      {showYearDropdown && (
                        <div className="absolute top-full right-0 mt-1 w-[90px] max-h-[220px] overflow-y-auto bg-white border border-gray-100 shadow-xl rounded-2xl p-1.5 flex flex-col gap-1 z-[300] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {yearList.map(y => (<button key={y} type="button" onClick={() => { setViewDate(new Date(y, month, 1)); setShowYearDropdown(false); }} className={`py-2 text-xs font-bold rounded-xl transition-all shrink-0 ${y === year ? `${colors.bg} text-white shadow-md` : `${colors.lightBgHover} text-gray-600 ${colors.hoverText}`}`}>{y}</button>))}
                        </div>
                      )}
                    </div>

                  </div>
                  <button type="button" onClick={() => { setViewDate(new Date(year, month + 1, 1)); setShowMonthDropdown(false); setShowYearDropdown(false); }} className="p-1 hover:bg-gray-100 rounded-full transition text-gray-600"><ChevronRight className="w-5 h-5" /></button>
                </div>
                
                <div className="grid grid-cols-7 mb-3 text-center">
                  {DAYS.map(day => (<div key={day} className="text-[10px] font-black text-gray-400 tracking-widest">{day}</div>))}
                </div>
                
                <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center mb-6">
                  {calendarDays.map((d, i) => {
                    const isSelected = selectedDate && d.date.toDateString() === selectedDate.toDateString();
                    return (<button type="button" key={i} onClick={() => { if(d.isCurrentMonth) setSelectedDate(d.date); }} disabled={!d.isCurrentMonth} className={`w-8 h-8 mx-auto flex items-center justify-center rounded-full text-xs font-bold transition-all ${!d.isCurrentMonth ? 'text-gray-300 cursor-not-allowed' : isSelected ? `${colors.bg} text-white shadow-md scale-110` : `text-gray-700 ${colors.lightBgHover} ${colors.hoverText}`}`}>{d.day}</button>);
                  })}
                </div>
                
                <div className="flex items-center gap-3">
                  <button type="button" onClick={handleConfirm} className={`flex-1 ${colors.bg} hover:opacity-90 text-white py-3.5 rounded-[1rem] font-black uppercase tracking-widest text-[10px] shadow-lg ${colors.shadow} transition-all active:scale-95`}>Confirm</button>
                  <button type="button" onClick={() => setIsOpen(false)} className="flex-1 text-gray-500 hover:bg-gray-50 py-3.5 rounded-[1rem] font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 border border-gray-100">Cancel</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
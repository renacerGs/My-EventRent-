import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays, ChevronDown } from 'lucide-react';

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => {
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; 
};

// 👇 TEMA UDAH DIPISAH SPESIFIK (EMAS-HITAM, PUTIH-UNGU, DLL) 👇
const themes = {
  public: {
    triggerBtn: "bg-white text-gray-900 border-gray-300 hover:border-[#FF6B35]",
    triggerText: "text-gray-900 font-bold",
    triggerIcon: "text-[#FF6B35]",
    modalOuter: "bg-[#FF6B35]",
    modalInner: "bg-white",
    headerText: "text-gray-800",
    iconBtn: "text-gray-600 hover:bg-gray-100",
    dropdownOuter: "bg-white border-gray-100",
    dropdownItem: "text-gray-600 hover:bg-orange-50 hover:text-[#FF6B35]",
    dropdownActive: "bg-[#FF6B35] text-white",
    dayHeader: "text-gray-400",
    dayNormal: "text-gray-700 hover:bg-orange-50 hover:text-[#FF6B35]",
    dayDisabled: "text-gray-300",
    daySelected: "bg-[#FF6B35] text-white shadow-md scale-110",
    confirmBtn: "bg-[#FF6B35] text-white shadow-orange-200 hover:opacity-90",
    cancelBtn: "text-gray-500 border-gray-100 hover:bg-gray-50"
  },
  wedding: { // ITEM EMAS
    triggerBtn: "bg-white text-gray-900 border-gray-300 hover:border-[#D4AF37]",
    triggerText: "text-gray-900 font-bold",
    triggerIcon: "text-[#D4AF37]",
    modalOuter: "bg-[#D4AF37]",
    modalInner: "bg-[#18181B]", // Latar Hitam Elegan
    headerText: "text-white",
    iconBtn: "text-gray-400 hover:bg-white/10 hover:text-white",
    dropdownOuter: "bg-[#27272A] border-gray-700",
    dropdownItem: "text-gray-300 hover:bg-white/10 hover:text-[#D4AF37]",
    dropdownActive: "bg-[#D4AF37] text-[#18181B] font-black",
    dayHeader: "text-gray-500",
    dayNormal: "text-gray-300 hover:bg-white/10 hover:text-white",
    dayDisabled: "text-gray-600",
    daySelected: "bg-[#D4AF37] text-[#18181B] font-black shadow-md scale-110", // Emas text hitam
    confirmBtn: "bg-[#D4AF37] text-[#18181B] font-black hover:opacity-90",
    cancelBtn: "text-gray-400 border-transparent hover:bg-white/10 hover:text-white"
  },
  personal: { // PUTIH UNGU
    triggerBtn: "bg-white text-gray-900 border-gray-300 hover:border-purple-500",
    triggerText: "text-gray-900 font-bold",
    triggerIcon: "text-purple-600",
    modalOuter: "bg-purple-600",
    modalInner: "bg-white",
    headerText: "text-gray-800",
    iconBtn: "text-gray-600 hover:bg-gray-100",
    dropdownOuter: "bg-white border-gray-100",
    dropdownItem: "text-gray-600 hover:bg-purple-50 hover:text-purple-600",
    dropdownActive: "bg-purple-600 text-white",
    dayHeader: "text-gray-400",
    dayNormal: "text-gray-700 hover:bg-purple-50 hover:text-purple-600",
    dayDisabled: "text-gray-300",
    daySelected: "bg-purple-600 text-white shadow-md scale-110",
    confirmBtn: "bg-purple-600 text-white shadow-purple-200 hover:opacity-90",
    cancelBtn: "text-gray-500 border-gray-100 hover:bg-gray-50"
  },
  dark: { // BIRU GELAP (Untuk Riwayat)
    triggerBtn: "bg-slate-900/80 border-slate-700 hover:border-blue-500 focus:ring-1 focus:ring-blue-500",
    triggerText: "text-white font-bold",
    triggerIcon: "text-slate-400 group-hover:text-blue-500",
    modalOuter: "bg-blue-600",
    modalInner: "bg-[#18181B]", 
    headerText: "text-white",
    iconBtn: "text-gray-400 hover:bg-white/10 hover:text-white",
    dropdownOuter: "bg-[#27272A] border-gray-700",
    dropdownItem: "text-gray-300 hover:bg-white/10 hover:text-white",
    dropdownActive: "bg-blue-600 text-white",
    dayHeader: "text-gray-500",
    dayNormal: "text-gray-300 hover:bg-white/10 hover:text-white",
    dayDisabled: "text-gray-600",
    daySelected: "bg-blue-600 text-white shadow-md scale-110",
    confirmBtn: "bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700",
    cancelBtn: "text-gray-400 border-transparent hover:bg-white/5 hover:text-white"
  }
};

export default function CustomDatePicker({ value, onChange, placeholder = "Pilih Tanggal", theme = "public" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null);
  const [mounted, setMounted] = useState(false);
  const modalRef = useRef(null);

  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);

  const t = themes[theme] || themes.public;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // 👇 Confirm & Cancel udah dibalikin normal 👇
  const handleConfirm = (e) => {
    e.preventDefault();
    if (selectedDate) onChange(formatOutput(selectedDate));
    setIsOpen(false);
  };

  const currentYear = new Date().getFullYear();
  const yearList = Array.from({ length: 15 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="relative w-full group">
      {/* TOMBOL INPUT */}
      <button 
        type="button" 
        onClick={(e) => { e.preventDefault(); setIsOpen(true); }} 
        className={`w-full rounded-xl px-4 flex items-center justify-between min-h-[46px] border transition-all cursor-pointer ${t.triggerBtn}`}
      >
        <span className={selectedDate ? t.triggerText : "text-gray-400"}>
          {selectedDate ? formatDisplay(selectedDate) : placeholder}
        </span>
        <CalendarDays className={`w-5 h-5 transition-colors ${t.triggerIcon}`} />
      </button>

      {/* PORTAL MODAL KALENDER */}
      {mounted && typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} ref={modalRef} className={`p-1.5 md:p-2 rounded-[2rem] w-full max-w-[320px] shadow-2xl ${t.modalOuter}`}>
                <div className={`rounded-[1.5rem] p-5 w-full relative ${t.modalInner}`}>
                  
                  {/* HEADER */}
                  <div className={`flex justify-between items-center mb-6 px-1 relative ${t.headerText}`}>
                    <button type="button" onClick={(e) => { e.preventDefault(); setViewDate(new Date(year, month - 1, 1)); setShowMonthDropdown(false); setShowYearDropdown(false); }} className={`p-1.5 rounded-full transition-colors ${t.iconBtn}`}><ChevronLeft className="w-5 h-5" /></button>
                    <div className="flex gap-2 font-bold">
                      
                      {/* DROPDOWN BULAN */}
                      <div className="relative">
                        <button type="button" onClick={(e) => { e.preventDefault(); setShowMonthDropdown(!showMonthDropdown); setShowYearDropdown(false); }} className={`cursor-pointer px-2 py-1.5 rounded-lg select-none flex items-center gap-1.5 text-sm transition-colors ${t.iconBtn}`}>
                          {MONTHS[month]} <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                        </button>
                        {showMonthDropdown && (
                          <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 w-[180px] shadow-xl rounded-2xl p-2 grid grid-cols-3 gap-1 z-[300] border ${t.dropdownOuter}`}>
                            {MONTHS.map((m, idx) => (
                              <button key={m} type="button" onClick={(e) => { e.preventDefault(); setViewDate(new Date(year, idx, 1)); setShowMonthDropdown(false); }} className={`py-2 text-xs font-bold rounded-xl transition-all ${idx === month ? t.dropdownActive : t.dropdownItem}`}>
                                {m}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* DROPDOWN TAHUN */}
                      <div className="relative">
                        <button type="button" onClick={(e) => { e.preventDefault(); setShowYearDropdown(!showYearDropdown); setShowMonthDropdown(false); }} className={`cursor-pointer px-2 py-1.5 rounded-lg select-none flex items-center gap-1.5 text-sm transition-colors ${t.iconBtn}`}>
                          {year} <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                        </button>
                        {showYearDropdown && (
                          <div className={`absolute top-full right-0 mt-1 w-[90px] max-h-[220px] overflow-y-auto shadow-xl rounded-2xl p-1.5 flex flex-col gap-1 z-[300] border [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${t.dropdownOuter}`}>
                            {yearList.map(y => (
                              <button key={y} type="button" onClick={(e) => { e.preventDefault(); setViewDate(new Date(y, month, 1)); setShowYearDropdown(false); }} className={`py-2 text-xs font-bold rounded-xl transition-all shrink-0 ${y === year ? t.dropdownActive : t.dropdownItem}`}>
                                {y}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                    <button type="button" onClick={(e) => { e.preventDefault(); setViewDate(new Date(year, month + 1, 1)); setShowMonthDropdown(false); setShowYearDropdown(false); }} className={`p-1.5 rounded-full transition-colors ${t.iconBtn}`}><ChevronRight className="w-5 h-5" /></button>
                  </div>
                  
                  {/* NAMA HARI */}
                  <div className="grid grid-cols-7 mb-3 text-center">
                    {DAYS.map(day => (<div key={day} className={`text-[10px] font-black tracking-widest ${t.dayHeader}`}>{day}</div>))}
                  </div>
                  
                  {/* GRID ANGKA TANGGAL */}
                  <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center mb-6">
                    {calendarDays.map((d, i) => {
                      const isSelected = selectedDate && d.date.toDateString() === selectedDate.toDateString();
                      return (
                        <button 
                          type="button" 
                          key={i} 
                          onClick={(e) => { e.preventDefault(); if(d.isCurrentMonth) setSelectedDate(d.date); }} 
                          disabled={!d.isCurrentMonth} 
                          className={`w-8 h-8 p-0 m-0 aspect-square shrink-0 mx-auto flex items-center justify-center rounded-full text-xs font-bold transition-all 
                            ${!d.isCurrentMonth ? `${t.dayDisabled} cursor-not-allowed` : 
                              isSelected ? `${t.daySelected}` : 
                              `${t.dayNormal}`}`
                          }
                        >
                          {d.day}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* TOMBOL CONFIRM & CANCEL DIBALIKIN */}
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={handleConfirm} className={`flex-1 py-3 md:py-3.5 rounded-[1rem] font-bold uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 ${t.confirmBtn}`}>
                      Confirm
                    </button>
                    <button type="button" onClick={(e) => { e.preventDefault(); setIsOpen(false); }} className={`flex-1 py-3 md:py-3.5 rounded-[1rem] font-bold uppercase tracking-widest text-[10px] transition-all active:scale-95 border ${t.cancelBtn}`}>
                      Cancel
                    </button>
                  </div>

                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      ) : null}
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

// Import All Themes Here
import ThemeElegantGold from 
'../components/Templates/ThemeElegantGold';
import ThemeFloralWhite from 
'../components/Templates/ThemeFloralWhite';
import ThemeDarkRomantic from 
'../components/Templates/ThemeDarkRomantic';


export default function WeddingInvitation() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const guestName = searchParams.get('to') || 'Special Guest'; 

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // State to keep invitation open/close consistent

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}`);
        if (!res.ok) throw new Error('Invitation not found');
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        console.error(err);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!event) return <div className="text-center mt-20 text-slate-800 font-serif">Invalid invitation.</div>;

  // Read selected template from database, default to elegant-gold
  const selectedTheme = event.event_details?.templateId || 'elegant-gold';

  // --- RENDER CONTROLLER ---
  if (selectedTheme === 'floral-white') {
    return <ThemeFloralWhite eventData={event} guestName={guestName} isOpen={isOpen} onOpen={() => setIsOpen(true)} />;
  } 
  
  if (selectedTheme === 'dark-romantic') {
    return <ThemeDarkRomantic eventData={event} guestName={guestName} isOpen={isOpen} onOpen={() => setIsOpen(true)} />;
  }

  // DEFAULT FALLBACK: Elegant Gold
  return (
    <ThemeElegantGold 
       eventData={event} 
       guestName={guestName} 
       isOpen={isOpen} 
       onOpen={() => setIsOpen(true)} 
    />
  );
}
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

// Import Komponen
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import EventList from './components/EventList';
import EventDetail from './pages/EventDetail';
import Likes from './pages/Likes'; 
import CreateEvent from "./components/CreateEvent"; 
import ManageEvent from "./components/ManageEvent"; 

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Gagal mengambil data event:", err);
        setEvents([]); 
      });
  }, []);

  // Tampilan Halaman Utama
  const HomePage = () => (
    <>
      <Hero />
      <div className="relative z-10 bg-white -mt-10 rounded-t-[40px] pt-4 min-h-[500px]">
        <EventList events={events} searchQuery={searchQuery} />
      </div>
    </>
  );

  return (
    <div className="bg-white min-h-screen font-sans flex flex-col">
      {/* Navbar muncul di semua halaman */}
      <Navbar 
        events={events} 
        onSearchSelect={(title) => setSearchQuery(title)}
        onOpenLogin={() => setIsLoginOpen(true)} 
      />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/likes" element={<Likes />} />
          <Route path="/create" element={<CreateEvent />} />
          <Route path="/manage" element={<ManageEvent />} />
          <Route path="/event/:id" element={<EventDetail events={events} />} />
          
          <Route path="*" element={
            <div className="text-center py-20 font-bold text-gray-400">
              Halaman tidak ditemukan.
            </div>
          } />
        </Routes>
      </main>

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />

      <Footer />
    </div>
  );
}
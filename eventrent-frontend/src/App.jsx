import React, { useState, useEffect } from 'react';
// 👇 1. IMPORT USELOCATION DI SINI
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import Komponen Lama
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import EventList from './components/EventList';
import EventDetail from './pages/EventDetail';
import Likes from './pages/Likes'; 
import ManageEvent from "./components/ManageEvent"; 
import EditEvent from "./components/EditEvent"; 
import Profile from "./components/Profile"; 
import MyTickets from "./components/MyTickets"; 
import EventDashboard from "./components/EventDashboard";
import Checkout from "./pages/Checkout"; 
import Scanner from './pages/Scanner';
import TrackTicket from './pages/TrackTicket'; 
import WeddingInvitation from './pages/WeddingInvitation';
import ChooseEventType from "./components/ChooseEventType"; 
import CreatePublicEvent from "./components/CreatePublicEvent"; 
import CreatePersonalEvent from "./components/CreatePersonalEvent"; 


export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // 👇 2. INISIALISASI LOKASI UNTUK CEK HALAMAN SAAT INI
  const location = useLocation();
  const isInvitationPage = location.pathname.startsWith('/invitation');

  useEffect(() => {
    fetch('/api/events')
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Gagal mengambil data event:", err);
        setEvents([]); 
      });
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (!user) {
      setTimeout(() => setIsLoginOpen(true), 0);
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <div className="bg-white min-h-screen font-sans flex flex-col">
      
      {/* 👇 3. SEMBUNYIKAN NAVBAR JIKA DI HALAMAN UNDANGAN 👇 */}
      {!isInvitationPage && (
        <Navbar 
          user={user} 
          events={events} 
          searchQuery={searchQuery}
          onSearchSelect={(title) => setSearchQuery(title)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={() => {
            setUser(null);
            localStorage.removeItem('user');
          }}
        />
      )}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <div className="relative z-10 bg-white -mt-10 rounded-t-[40px] pt-4 min-h-[500px]">
                <EventList events={events} searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
              </div>
            </>
          } />
          
          <Route path="/likes" element={<Likes />} />
          <Route path="/event/:id" element={<EventDetail events={events} />} />
          <Route path="/scanner/:eventId" element={<Scanner />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/cek-tiket" element={<TrackTicket />} />
          
          <Route path="/create" element={<ProtectedRoute><ChooseEventType /></ProtectedRoute>} />
          <Route path="/create/public" element={<ProtectedRoute><CreatePublicEvent /></ProtectedRoute>} />
          <Route path="/create/personal" element={<ProtectedRoute><CreatePersonalEvent /></ProtectedRoute>} />
          <Route path="/manage" element={<ProtectedRoute><ManageEvent /></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
          <Route path="/manage/event/:id" element={<ProtectedRoute><EventDashboard /></ProtectedRoute>} />
          <Route path="/invitation/:id" element={<WeddingInvitation />} />
          
          <Route path="*" element={<div className="text-center py-20 font-bold text-gray-400">Halaman tidak ditemukan.</div>} />
        </Routes>
      </main>

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLoginSuccess={(userData) => {
          setUser(userData); 
          try {
            localStorage.setItem('user', JSON.stringify(userData)); 
          } catch (error) {
            localStorage.setItem('user', JSON.stringify({ ...userData, picture: null }));
          }
          setIsLoginOpen(false); 
        }}
      />

      {/* 👇 4. SEMBUNYIKAN FOOTER JIKA DI HALAMAN UNDANGAN 👇 */}
      {!isInvitationPage && <Footer />}
    </div>
  );
}
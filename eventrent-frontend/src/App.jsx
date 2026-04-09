import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Import Komponen
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import EventList from './components/EventList';
import EventDetail from './pages/EventDetail';
import Likes from './pages/Likes'; 
import ManageEvent from "./components/ManageEvent"; 
import Profile from "./components/Profile"; 
import MyTickets from "./components/MyTickets"; 
import EventDashboard from "./components/EventDashboard";
import Checkout from "./pages/Checkout"; 
import Scanner from './pages/Scanner';
import TrackTicket from './pages/TrackTicket'; 

// --- ROUTE KHUSUS PEMBUATAN EVENT ---
import ChooseEventType from "./components/ChooseEventType"; 
import CreatePublicEvent from "./components/CreatePublicEvent"; 
import CreateWeddingEvent from "./components/CreateWeddingEvent"; 
import CreatePersonalEvent from "./components/CreatePersonalEvent"; 

// --- ROUTE KHUSUS EDIT EVENT ---
import EditPublicEvent from "./components/EditPublicEvent"; 
import EditWeddingEvent from "./components/EditWeddingEvent"; 
import EditPersonalEvent from "./components/EditPersonalEvent"; // 🔥 UDAH DI-UNCOMMENT!

// --- ROUTE KHUSUS WEDDING/PERSONAL ---
import WeddingInvitation from './pages/WeddingInvitation';
import WeddingRSVP from './pages/WeddingRSVP';
import PersonalInvitation from './pages/PersonalInvitation';
import PersonalRSVP from './pages/PersonalRSVP';

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const location = useLocation();
  // 👇 FIX: Sembunyikan Navbar/Footer di Halaman Undangan DAN Form RSVP
  const isInvitationPage = 
    location.pathname.startsWith('/invitation') || 
    location.pathname.startsWith('/party') || 
    location.pathname.startsWith('/rsvp') || 
    location.pathname.startsWith('/party-rsvp');

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
          {/* --- HALAMAN PUBLIK --- */}
          <Route path="/" element={
            <>
              <Hero />
              <div className="relative z-10 bg-white -mt-10 rounded-t-[40px] pt-4 min-h-[500px]">
                <EventList events={events} searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
              </div>
            </>
          } />
          <Route path="/event/:id" element={<EventDetail events={events} />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/cek-tiket" element={<TrackTicket />} />
          
          {/* --- HALAMAN UNDANGAN KHUSUS --- */}
          <Route path="/invitation/:id" element={<WeddingInvitation />} />
          <Route path="/party/:id" element={<PersonalInvitation />} /> 
          <Route path="/rsvp/:id" element={<WeddingRSVP />} />
          <Route path="/party-rsvp/:id" element={<PersonalRSVP />} />
          
          {/* --- HALAMAN PROTECTED (BUTUH LOGIN) --- */}
          <Route path="/likes" element={<ProtectedRoute><Likes /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
          
          {/* --- MANAJEMEN EVENT & DASHBOARD --- */}
          <Route path="/manage" element={<ProtectedRoute><ManageEvent /></ProtectedRoute>} />
          <Route path="/manage/event/:id" element={<ProtectedRoute><EventDashboard /></ProtectedRoute>} />
          <Route path="/scanner/:eventId" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
          
          {/* --- PEMBUATAN EVENT --- */}
          <Route path="/create" element={<ProtectedRoute><ChooseEventType /></ProtectedRoute>} />
          <Route path="/create/public" element={<ProtectedRoute><CreatePublicEvent /></ProtectedRoute>} />
          <Route path="/create/wedding" element={<ProtectedRoute><CreateWeddingEvent /></ProtectedRoute>} />
          <Route path="/create/personal" element={<ProtectedRoute><CreatePersonalEvent /></ProtectedRoute>} />

          {/* --- EDIT EVENT (DIPISAH BERDASARKAN TIPE) --- */}
          <Route path="/edit/public/:id" element={<ProtectedRoute><EditPublicEvent /></ProtectedRoute>} />
          <Route path="/edit/wedding/:id" element={<ProtectedRoute><EditWeddingEvent /></ProtectedRoute>} />
          
          {/* 🔥 ROUTE EDIT PERSONAL EVENT UDAH AKTIF! 🔥 */}
          <Route path="/edit/personal/:id" element={<ProtectedRoute><EditPersonalEvent /></ProtectedRoute>} />
          
          {/* HALAMAN 404 FALLBACK */}
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

      {!isInvitationPage && <Footer />}
    </div>
  );
}
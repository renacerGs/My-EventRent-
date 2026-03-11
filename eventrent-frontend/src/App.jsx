import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

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
import EditEvent from "./components/EditEvent"; 
import Profile from "./components/Profile"; 
import MyTickets from "./components/MyTickets"; 
import EventDashboard from "./components/EventDashboard";
// --- BARU DI IMPORT ---
import Checkout from "./pages/Checkout"; 

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

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

  const ProtectedRoute = ({ children }) => {
    if (!user) {
      setTimeout(() => setIsLoginOpen(true), 0);
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <div className="bg-white min-h-screen font-sans flex flex-col">
      
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

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={
            <>
              <Hero />
              <div className="relative z-10 bg-white -mt-10 rounded-t-[40px] pt-4 min-h-[500px]">
                <EventList 
                  events={events} 
                  searchQuery={searchQuery} 
                  onClearSearch={() => setSearchQuery('')} 
                />
              </div>
            </>
          } />
          
          <Route path="/likes" element={<Likes />} />
          <Route path="/event/:id" element={<EventDetail events={events} />} />
          
          {/* --- ROUTE BARU UNTUK CHECKOUT --- */}
          <Route path="/checkout/:id" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          
          <Route path="/create" element={<ProtectedRoute><CreateEvent /></ProtectedRoute>} />
          <Route path="/manage" element={<ProtectedRoute><ManageEvent /></ProtectedRoute>} />
          <Route path="/edit/:id" element={<ProtectedRoute><EditEvent /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
          <Route path="/manage/event/:id" element={<ProtectedRoute><EventDashboard /></ProtectedRoute>} />
          
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
        onLoginSuccess={(userData) => {
          console.log("User berhasil login:", userData);
          setUser(userData); 
          try {
            localStorage.setItem('user', JSON.stringify(userData)); 
          } catch (error) {
            console.warn("Memori browser penuh! Menyimpan sesi login tanpa gambar lokal.");
            const safeUserData = { ...userData, picture: null };
            localStorage.setItem('user', JSON.stringify(safeUserData));
          }
          setIsLoginOpen(false); 
        }}
      />

      <Footer />
    </div>
  );
}
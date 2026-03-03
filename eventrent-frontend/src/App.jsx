import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

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

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // STATE USER
  const [user, setUser] = useState(null);

  useEffect(() => {
    // A. Cek login
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // B. Ambil data events
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

  // KOMPONEN PROTEKSI
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      setIsLoginOpen(true);
      return <Navigate to="/" replace />;
    }
    return children;
  };

  const HomePage = () => (
    <>
      <Hero />
      <div className="relative z-10 bg-white -mt-10 rounded-t-[40px] pt-4 min-h-[500px]">
        <EventList events={events} searchQuery={searchQuery} />
      </div>
    </>
  );

  return (
    <GoogleOAuthProvider clientId="561806317736-eq0ktc36954e6vftgp7q2bgi46bnhvqg.apps.googleusercontent.com">
      <div className="bg-white min-h-screen font-sans flex flex-col">
        
        <Navbar 
          user={user} 
          events={events} 
          onSearchSelect={(title) => setSearchQuery(title)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={() => {
            setUser(null);
            localStorage.removeItem('user');
          }}
        />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/likes" element={<Likes />} />
            <Route path="/event/:id" element={<EventDetail events={events} />} />
            
            {/* HALAMAN YANG DIKUNCI (Harus Login) */}
            <Route path="/create" element={
              <ProtectedRoute>
                <CreateEvent />
              </ProtectedRoute>
            } />
            
            <Route path="/manage" element={
              <ProtectedRoute>
                <ManageEvent />
              </ProtectedRoute>
            } />

            <Route path="/edit/:id" element={
              <ProtectedRoute>
                <EditEvent />
              </ProtectedRoute>
            } />

            {/* <--- 2. TAMBAHKAN ROUTE PROFILE DISINI */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

            <Route path="/my-tickets" element={
              <ProtectedRoute>
                <MyTickets />
              </ProtectedRoute>
            } />
            
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
            localStorage.setItem('user', JSON.stringify(userData)); 
            setIsLoginOpen(false); 
          }}
        />

        <Footer />
      </div>
    </GoogleOAuthProvider>
  );
}
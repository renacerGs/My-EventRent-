import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google'; // <--- 1. Import Provider Google

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
  
  // <--- 2. STATE USER (Wajib ada buat nyimpen data login)
  const [user, setUser] = useState(null);

  useEffect(() => {
    // A. Cek apakah user sudah login sebelumnya (disimpan di localStorage)
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

  // <--- 3. KOMPONEN PROTEKSI (Biar yang belum login gak bisa masuk /create)
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      // Kalau belum login, buka modal login & lempar ke Home
      setIsLoginOpen(true);
      return <Navigate to="/" replace />;
    }
    return children;
  };

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
    // <--- 4. BUNGKUS DENGAN GOOGLE PROVIDER (Paste Client ID lo disini)
    <GoogleOAuthProvider clientId="561806317736-eq0ktc36954e6vftgp7q2bgi46bnhvqg.apps.googleusercontent.com">
      <div className="bg-white min-h-screen font-sans flex flex-col">
        
        {/* Navbar: Kirim data user & fungsi logout */}
        <Navbar 
          user={user} 
          events={events} 
          onSearchSelect={(title) => setSearchQuery(title)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={() => {
            setUser(null);
            localStorage.removeItem('user'); // Hapus sesi
          }}
        />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/likes" element={<Likes />} />
            <Route path="/event/:id" element={<EventDetail events={events} />} />
            
            {/* <--- 5. HALAMAN YANG DIKUNCI (Harus Login Dulu) */}
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
          // <--- 6. Logika sukses login sekarang aman karena setUser sudah ada
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
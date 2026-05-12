import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast'; 

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
import Notifications from './pages/Notifications';
import AgentWallet from './components/AgentWallet';
import MyOrders from './pages/MyOrders'; 
import UploadProof from './pages/UploadProof';
import About from './pages/About';

// 🔥 IMPORT HALAMAN FAQ & TERMS BARU 🔥
import FAQ from './pages/FAQ';
import Terms from './pages/Terms';

// Import Halaman Job Board
import JobBoard from './pages/JobBoard';

// Route Khusus Agen
import AgentDashboard from './components/AgentDashboard'; 
import RiwayatScan from './pages/RiwayatScan'; 

// Route Khusus Pembuatan Event
import ChooseEventType from "./components/ChooseEventType"; 
import CreatePublicEvent from "./components/CreatePublicEvent"; 
import CreateWeddingEvent from "./components/CreateWeddingEvent"; 
import CreatePersonalEvent from "./components/CreatePersonalEvent"; 

// Route Khusus Edit Event
import EditPublicEvent from "./components/EditPublicEvent"; 
import EditWeddingEvent from "./components/EditWeddingEvent"; 
import EditPersonalEvent from "./components/EditPersonalEvent"; 

// Route Khusus Wedding / Personal
import WeddingInvitation from './pages/WeddingInvitation';
import WeddingRSVP from './pages/WeddingRSVP';
import PersonalInvitation from './pages/PersonalInvitation';
import PersonalRSVP from './pages/PersonalRSVP';

// Supabase
import { supabase } from './supabase'; 

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Safe initialization untuk localStorage
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Gagal parse data user dari localStorage", error);
      return null;
    }
  });

  const isInvitationPage = 
    location.pathname.startsWith('/invitation') || 
    location.pathname.startsWith('/party') || 
    location.pathname.startsWith('/rsvp') || 
    location.pathname.startsWith('/party-rsvp') ||
    location.pathname.startsWith('/about');

  // Deteksi & Handle Error URL dari Supabase Google Auth
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(location.hash.replace('#', '?'));
    const errorDesc = queryParams.get('error_description') || hashParams.get('error_description');

    if (errorDesc) {
      toast.error(errorDesc.replace(/\+/g, ' '), {
        duration: 6000,
        style: {
          background: '#fee2e2', 
          color: '#991b1b', 
          border: '1px solid #f87171', 
          fontWeight: 'bold'
        },
      });
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // Fetch Event Data menggunakan Async/Await
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events`);
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Gagal mengambil data event:", err);
        toast.error("Gagal terhubung ke server"); 
        setEvents([]); 
      }
    };
    fetchEvents();
  }, []);

  // Protected Route Wrapper
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      // setTimeout mencegah warning React saat update state di render cycle
      setTimeout(() => setIsLoginOpen(true), 0);
      return <Navigate to="/" replace />;
    }
    return children;
  };

  // useCallback agar fungsi tidak di-recreate setiap render
  const handleLoginSuccess = useCallback((userData, showToast = true) => {
    setUser(userData); 
    try {
      localStorage.setItem('user', JSON.stringify(userData)); 
    } catch (error) {
      localStorage.setItem('user', JSON.stringify({ ...userData, picture: null }));
    }
    setIsLoginOpen(false); 

    if (showToast) {
      if (userData.role === 'agent') {
        toast.success(`Berhasil masuk portal agen, ${userData.name}!`, { id: 'auth-toast' });
        if (location.pathname === '/') navigate('/agent');
      } else {
        toast.success('Kembali ke mode Reguler.', { id: 'auth-toast' }); 
        if (location.pathname === '/agent') navigate('/');
      }
    }
  }, [location.pathname, navigate]);

  // CCTV Deteksi Google Login via Supabase
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const storedUser = localStorage.getItem('user');
        const currentUser = storedUser ? JSON.parse(storedUser) : null;

        if (!currentUser || currentUser.id !== session.user.id) {
          const isAgent = localStorage.getItem('agentMode') === 'true';
          const loggedInUser = {
            ...session.user,
            name: session.user.user_metadata?.full_name || 'User',
            role: isAgent ? 'agent' : 'user'
          };
          
          localStorage.setItem('supabase_token', session.access_token);
          handleLoginSuccess(loggedInUser);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [handleLoginSuccess]); 

  // Handle Logout Logic
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('agentMode');
    localStorage.removeItem('supabase_token'); // Pastikan token juga dihapus
    toast.success('Berhasil logout bro!'); 
  };

  return (
    <div className="bg-white min-h-screen font-sans flex flex-col">
      <Toaster 
        position="top-center" 
        toastOptions={{
          duration: 3000,
          style: { background: '#333', color: '#fff', borderRadius: '10px' },
        }} 
      />

      {!isInvitationPage && (
        <Navbar 
          user={user} 
          events={events} 
          searchQuery={searchQuery}
          onSearchSelect={(title) => setSearchQuery(title)}
          onOpenLogin={() => setIsLoginOpen(true)}
          onLogout={handleLogout}
          onLoginSuccess={handleLoginSuccess}
        />
      )}

      <main className="flex-grow">
        <Routes>
          {/* Rute Publik */}
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
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/about" element={<About />} />
          
          {/* 🔥 DAFTARIN RUTE FAQ & TERMS DI SINI 🔥 */}
          <Route path="/faq" element={<FAQ />} />
          <Route path="/terms" element={<Terms />} />
          
          {/* Rute Undangan */}
          <Route path="/invitation/:id" element={<WeddingInvitation />} />
          <Route path="/party/:id" element={<PersonalInvitation />} /> 
          <Route path="/rsvp/:id" element={<WeddingRSVP />} />
          <Route path="/party-rsvp/:id" element={<PersonalRSVP />} />
          
          {/* Rute Proteksi */}
          <Route path="/likes" element={<ProtectedRoute><Likes /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/my-tickets" element={<ProtectedRoute><MyTickets /></ProtectedRoute>} />
          <Route path="/my-orders" element={<MyOrders />} />
          <Route path="/jobs" element={<ProtectedRoute><JobBoard /></ProtectedRoute>} />
          
          {/* Rute Agen */}
          <Route path="/agent" element={<ProtectedRoute><AgentDashboard /></ProtectedRoute>} />
          <Route path="/agent/history" element={<ProtectedRoute><RiwayatScan /></ProtectedRoute>} /> 
          <Route path="/agent/wallet" element={<ProtectedRoute><AgentWallet /></ProtectedRoute>} />
          
          {/* Rute Manajemen & Event */}
          <Route path="/manage" element={<ProtectedRoute><ManageEvent /></ProtectedRoute>} />
          <Route path="/manage/event/:id" element={<ProtectedRoute><EventDashboard /></ProtectedRoute>} />
          <Route path="/scanner/:eventId" element={<ProtectedRoute><Scanner /></ProtectedRoute>} />
          <Route path="/upload-proof/:orderId" element={<UploadProof />} />
          
          <Route path="/create" element={<ProtectedRoute><ChooseEventType /></ProtectedRoute>} />
          <Route path="/create/public" element={<ProtectedRoute><CreatePublicEvent /></ProtectedRoute>} />
          <Route path="/create/wedding" element={<ProtectedRoute><CreateWeddingEvent /></ProtectedRoute>} />
          <Route path="/create/personal" element={<ProtectedRoute><CreatePersonalEvent /></ProtectedRoute>} />

          <Route path="/edit/public/:id" element={<ProtectedRoute><EditPublicEvent /></ProtectedRoute>} />
          <Route path="/edit/wedding/:id" element={<ProtectedRoute><EditWeddingEvent /></ProtectedRoute>} />
          <Route path="/edit/personal/:id" element={<ProtectedRoute><EditPersonalEvent /></ProtectedRoute>} />
          
          {/* 404 Fallback */}
          <Route path="*" element={<div className="text-center py-20 font-bold text-gray-400">Halaman tidak ditemukan.</div>} />
        </Routes>
      </main>

      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLoginSuccess={handleLoginSuccess}
      />

      {!isInvitationPage && <Footer />}
    </div>
  );
}
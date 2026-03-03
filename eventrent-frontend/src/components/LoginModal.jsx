import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google'; // <--- 1. Import Hook ini

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);

  // 2. Pasang Logika Login Google
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log("Dapat Token Google:", tokenResponse); // Debugging

        // A. Ambil Info User dari Google
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await res.json();
        console.log("Data User Google:", googleUser); // Debugging

        // B. Kirim ke Backend NestJS
        const backendRes = await fetch('http://localhost:3000/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
            googleId: googleUser.sub
          }),
        });

        if (!backendRes.ok) throw new Error("Gagal simpan ke database");

        const loggedInUser = await backendRes.json();
        console.log("Login Sukses:", loggedInUser); // Debugging
        
        // C. Kabari App.jsx & Tutup Modal
        onLoginSuccess(loggedInUser); 
        onClose();

      } catch (err) {
        console.error("Login Error:", err);
        alert("Gagal login. Cek console browser.");
      }
    },
    onError: () => alert('Login Gagal dari Google-nya langsung!'),
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-[380px] rounded-[32px] p-6 relative shadow-2xl animate-fadeIn">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-6 text-gray-400 hover:text-gray-600 text-xl transition-colors"
        >
          &times;
        </button>
        
        <div className="flex flex-col items-center mb-4">
          <div className="w-16 h-16 bg-[#87CEEB] rounded-full mb-3 overflow-hidden border-4 border-white shadow-sm">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4" 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-400 text-[10px] font-medium mt-0.5 text-center">
            {isSignUp ? 'Join EventRent and discover events' : 'Sign in to continue to EventRent'}
          </p>
        </div>

        <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
          {/* ... (Bagian Input Form Manual Tetap Sama) ... */}
           {isSignUp && (
            <div>
              <label className="block text-[10px] font-bold text-gray-700 mb-1 ml-1 uppercase tracking-wide">Full Name</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-[#5D3F9B]" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <input type="text" placeholder="Enter your name" className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#FF6B35] outline-none transition-all text-sm placeholder:text-gray-400" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-700 mb-1 ml-1 uppercase tracking-wide">Email Address</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-[#5D3F9B]" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <input type="email" placeholder="Enter email" className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#FF6B35] outline-none transition-all text-sm placeholder:text-gray-400" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-700 mb-1 ml-1 uppercase tracking-wide">Password</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-[#F4B400]" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <input type="password" placeholder="Enter password" className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:border-[#FF6B35] outline-none transition-all text-sm placeholder:text-gray-400" />
            </div>
          </div>

          <button className="w-full py-3 bg-gradient-to-r from-[#FF8C61] to-[#FF6B35] text-white rounded-xl font-bold text-sm hover:shadow-lg active:scale-[0.98] transition-all mt-2">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <span className="bg-white px-3 text-[10px] text-gray-400 relative z-10 font-bold uppercase tracking-wider">
            Or
          </span>
        </div>

        {/* 3. TOMBOL GOOGLE SEKARANG MANGGIL FUNGSI LOGIN */}
        <button 
          onClick={() => loginWithGoogle()} // <--- INI KUNCINYA
          className="w-full py-2.5 border border-gray-200 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 font-bold text-gray-700 text-xs transition-all shadow-sm active:scale-95"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
          Continue with Google
        </button>

        <p className="text-center mt-5 text-[11px] text-gray-500 font-medium">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button 
            onClick={() => setIsSignUp(!isSignUp)} 
            className="text-[#FF6B35] font-black hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
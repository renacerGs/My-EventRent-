import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setErrorMsg('');
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const googleUser = await res.json();
        
        const backendRes = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
            googleId: googleUser.sub
          }),
        });
        
        if (!backendRes.ok) throw new Error("Gagal login dengan Google dari Server");
        
        const loggedInUser = await backendRes.json();
        onLoginSuccess(loggedInUser); 
        
      } catch (err) {
        console.error("Error saat Google Login:", err);
        setErrorMsg("Koneksi ke server gagal. Coba lagi.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setErrorMsg('Akses Google ditolak!'),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    const endpoint = isSignUp ? 'register' : 'login';
    const payload = isSignUp 
      ? { name: formData.name, email: formData.email, password: formData.password }
      : { email: formData.email, password: formData.password };

    try {
      const res = await fetch(`/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication failed');

      if (isSignUp) {
        setSuccessMsg("Registration Successful! Please login.");
        setIsSignUp(false);
        setFormData(prev => ({ ...prev, password: '' }));
      } else {
        onLoginSuccess(data);
        onClose(); 
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        // 👇 PERBAIKAN: Tinggi auto di HP, tinggi fixed 550px di Laptop 👇
        className="bg-white w-full max-w-[800px] h-auto md:h-[550px] min-h-[450px] rounded-[32px] md:rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col md:flex-row"
      >
        {/* Tombol Close */}
        <button onClick={onClose} className="absolute top-5 right-6 md:top-6 md:right-8 text-gray-400 hover:text-gray-900 text-3xl md:text-2xl font-black transition-all z-[110] leading-none">&times;</button>

        {/* 1. CONTAINER FORM (KIRI/KANAN BERGANTUNG MODE) */}
        {/* 👇 PERBAIKAN: Lebar 100% di HP, 50% di Laptop. Animasi geser cuma jalan di Laptop (md:translate-x-full) 👇 */}
        <div className={`w-full md:w-1/2 h-full p-8 sm:p-12 flex flex-col justify-center transition-transform duration-700 ease-in-out ${isSignUp ? 'md:translate-x-full' : 'translate-x-0'}`}>
          <div className="text-center mb-6 md:mb-8 mt-4 md:mt-0">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase italic">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
            <div className="flex gap-4 justify-center mt-5 md:mt-4">
              <button type="button" onClick={() => loginWithGoogle()} className="w-12 h-12 md:w-10 md:h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm active:scale-90">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 md:w-4 md:h-4" alt="Google" />
              </button>
            </div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-5 md:mt-6">or use your email account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full px-5 py-3.5 md:py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:bg-white border border-transparent focus:border-orange-100 transition-all text-sm" required />
            )}
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full px-5 py-3.5 md:py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:bg-white border border-transparent focus:border-orange-100 transition-all text-sm" required />
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="w-full px-5 py-3.5 md:py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:bg-white border border-transparent focus:border-orange-100 transition-all text-sm" required />
            
            {errorMsg && <p className="text-red-500 text-[10px] text-center font-bold bg-red-50 py-2.5 rounded-xl italic">{errorMsg}</p>}
            {successMsg && <p className="text-green-600 text-[10px] text-center font-bold bg-green-50 py-2.5 rounded-xl italic">{successMsg}</p>}

            <button type="submit" disabled={isLoading} className="w-full py-4 bg-[#FF6B35] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_8px_20px_-6px_rgba(255,107,53,0.5)] hover:bg-[#e85526] hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 italic mt-2">
              {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          {/* 👇👇👇 FITUR KHUSUS MODE HP (Tombol Ganti Mode) 👇👇👇 */}
          <div className="md:hidden mt-8 pt-6 border-t border-gray-100 text-center">
             <p className="text-[11px] text-gray-500 font-medium">
               {isSignUp ? "Already have an account?" : "Don't have an account?"}
             </p>
             <button 
               type="button" 
               onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); setSuccessMsg(''); }}
               className="mt-2 text-[#FF6B35] font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
             >
               {isSignUp ? "Sign In Here" : "Create Account"}
             </button>
          </div>
          {/* 👆👆👆 BATAS FITUR KHUSUS HP 👆👆👆 */}

        </div>

        {/* 2. OVERLAY PANEL (ORANGE) YANG BERGESER (KHUSUS LAPTOP) */}
        {/* 👇 PERBAIKAN: Ditambah class "hidden md:flex" biar ngilang di HP 👇 */}
        <div 
          className={`hidden md:flex absolute top-0 left-0 w-1/2 h-full transition-transform duration-700 ease-in-out z-100 
          ${isSignUp ? '-translate-x-0' : 'translate-x-full'}`}
        >
          <div className="bg-[#FF6B35] h-full w-full flex flex-col items-center justify-center text-white p-12 text-center relative overflow-hidden">
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

            <AnimatePresence mode="wait">
              <motion.div
                key={isSignUp ? 'signup-text' : 'signin-text'}
                initial={{ opacity: 0, x: isSignUp ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isSignUp ? 50 : -50 }}
                className="relative z-10"
              >
                <h2 className="text-4xl font-black tracking-tighter italic uppercase mb-4 leading-tight">
                  {isSignUp ? 'Welcome Back!' : 'Create, Account!'}
                </h2>
                <p className="text-sm font-medium mb-10 opacity-90 leading-relaxed">
                  {isSignUp 
                    ? "Enter your personal details to stay connected with the best events." 
                    : "Sign up if you still don't have an account and join the party!"}
                </p>
                <button 
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); setSuccessMsg(''); }}
                  className="px-12 py-3 border-2 border-white rounded-2xl font-black uppercase text-[10px] tracking-[2px] hover:bg-white hover:text-[#FF6B35] transition-all active:scale-90"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
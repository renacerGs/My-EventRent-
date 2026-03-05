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
        if (!backendRes.ok) throw new Error("Gagal login dengan Google");
        const loggedInUser = await backendRes.json();
        onLoginSuccess(loggedInUser); 
        onClose();
      } catch (err) {
        setErrorMsg("Google login failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setErrorMsg('Login Gagal dari Google!'),
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
      const res = await fetch(`http://localhost:3000/api/auth/${endpoint}`, {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-[800px] h-[550px] rounded-[40px] shadow-2xl relative overflow-hidden flex"
      >
        {/* Tombol Close tetap di pojok */}
        <button onClick={onClose} className="absolute top-6 right-8 text-gray-400 hover:text-gray-900 text-2xl font-bold transition-all z-[110]">&times;</button>

        {/* 1. CONTAINER FORM (KIRI/KANAN BERGANTUNG MODE) */}
        <div className={`w-1/2 h-full p-12 flex flex-col justify-center transition-all duration-700 ease-in-out ${isSignUp ? 'translate-x-full' : 'translate-x-0'}`}>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">{isSignUp ? 'Create Account' : 'Sign In'}</h2>
            <div className="flex gap-4 justify-center mt-4">
              <button onClick={() => loginWithGoogle()} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm active:scale-90">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
              </button>
            </div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-6">or use your email account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:bg-white transition-all text-sm" required />
            )}
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:bg-white transition-all text-sm" required />
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="w-full px-5 py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#FF6B35]/20 focus:bg-white transition-all text-sm" required />
            
            {errorMsg && <p className="text-red-500 text-[10px] text-center font-bold bg-red-50 py-2 rounded-xl italic">{errorMsg}</p>}
            {successMsg && <p className="text-green-600 text-[10px] text-center font-bold bg-green-50 py-2 rounded-xl italic">{successMsg}</p>}

            <button type="submit" disabled={isLoading} className="w-full py-4 bg-[#FF6B35] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-100 hover:bg-[#e85526] transition-all active:scale-95 disabled:opacity-50 italic">
              {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>
        </div>

        {/* 2. OVERLAY PANEL (ORANGE) YANG BERGESER */}
        <div 
          className={`absolute top-0 left-0 w-1/2 h-full transition-all duration-700 ease-in-out z-100 
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
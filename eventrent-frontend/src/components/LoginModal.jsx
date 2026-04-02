import React, { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';

// 👇👇👇 KOMPONEN MATA (SUPER CLEAN & ANTI ERROR) 👇👇👇
const AnimatedEyeToggle = ({ isVisible }) => {
  const strokeColor = "#9ca3af"; 
  const activeColor = "#FF6B35"; 

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={isVisible ? activeColor : strokeColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-colors group-hover:stroke-[#FF6B35]"
    >
      {/* initial={false} paksa Framer Motion nge-render langsung tanpa mikir animasi awal */}
      <motion.path
        initial={false}
        animate={{ d: isVisible ? "M 2 12 C 8 4, 16 4, 22 12" : "M 3 13 C 8 16, 16 16, 21 13" }}
        transition={{ duration: 0.3 }}
      />
      
      <motion.path
        initial={false}
        animate={{ d: isVisible ? "M 2 12 C 8 20, 16 20, 22 12" : "M 3 13 C 8 16, 16 16, 21 13" }}
        transition={{ duration: 0.3 }}
      />
      
      <motion.circle
        cx="12" cy="12" r="3.5" stroke="none" fill={isVisible ? activeColor : strokeColor}
        initial={false}
        animate={
          isVisible
            ? { x: [0, 4, -2, 0], y: [4, -1, 1, 0], scale: 1, opacity: 1 }
            : { x: 0, y: 4, scale: 0.5, opacity: 0 }
        }
        transition={{ duration: 0.6, times: [0, 0.4, 0.7, 1] }}
      />
    </svg>
  );
};
// 👆👆👆 BATAS KOMPONEN MATA 👆👆👆

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-[800px] h-auto md:h-[550px] min-h-[450px] rounded-[24px] md:rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col md:flex-row"
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-5 md:top-6 md:right-8 text-white md:text-gray-400 hover:text-white/80 md:hover:text-gray-900 text-3xl md:text-2xl font-black transition-all z-[110] leading-none"
        >
          &times;
        </button>

        {/* HEADER ORANGE KHUSUS MOBILE */}
        <div className="md:hidden bg-[#FF6B35] relative w-full px-6 py-10 overflow-hidden flex flex-col items-center justify-center text-center shadow-sm">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? 'mobile-signup-text' : 'mobile-signin-text'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="relative z-10"
            >
              <h2 className="text-3xl font-black tracking-tighter italic uppercase text-white mb-1">
                {isSignUp ? 'Create Account' : 'Welcome Back!'}
              </h2>
              <p className="text-white/90 text-xs font-medium px-4">
                {isSignUp 
                  ? "Join the party and manage your events easily!" 
                  : "Sign in to access your personal dashboard."}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CONTAINER FORM */}
        <div className={`w-full md:w-1/2 h-full p-6 sm:p-8 md:p-12 flex flex-col justify-center transition-transform duration-700 ease-in-out ${isSignUp ? 'md:translate-x-full' : 'translate-x-0'} bg-white`}>
          
          <div className="text-center mb-6 md:mb-8 hidden md:block">
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase italic">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>
          </div>

          <div className="text-center mb-6 mt-4 md:mt-0">
            <div className="flex gap-4 justify-center">
              <button type="button" onClick={() => loginWithGoogle()} className="w-12 h-12 md:w-10 md:h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm active:scale-90 bg-white">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 md:w-4 md:h-4" alt="Google" />
              </button>
            </div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-4 md:mt-5">or use your email account</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? 'form-signup' : 'form-signin'}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-4">
                {isSignUp && (
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full px-5 py-3.5 md:py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:bg-white border border-transparent focus:border-orange-100 transition-all text-sm" required />
                )}
                
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full px-5 py-3.5 md:py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:bg-white border border-transparent focus:border-orange-100 transition-all text-sm" required />
                
                {/* Input Password */}
                <div className="relative w-full group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="Password" 
                    className="w-full pl-5 pr-12 py-3.5 md:py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:bg-white border border-transparent focus:border-orange-100 transition-all text-sm" 
                    required 
                  />
                  
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none flex items-center justify-center p-1.5 z-10"
                  >
                    <AnimatedEyeToggle isVisible={showPassword} />
                  </button>
                </div>
                
                {errorMsg && <p className="text-red-500 text-[10px] text-center font-bold bg-red-50 py-2.5 rounded-xl italic">{errorMsg}</p>}
                {successMsg && <p className="text-green-600 text-[10px] text-center font-bold bg-green-50 py-2.5 rounded-xl italic">{successMsg}</p>}

                <button type="submit" disabled={isLoading} className="w-full py-4 bg-[#FF6B35] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_8px_20px_-6px_rgba(255,107,53,0.5)] hover:bg-[#e85526] hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 italic mt-2">
                  {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
                </button>
              </form>
            </motion.div>
          </AnimatePresence>

          {/* FITUR KHUSUS MODE HP */}
          <div className="md:hidden mt-8 pt-6 border-t border-gray-100 text-center">
             <p className="text-[11px] text-gray-500 font-medium">
               {isSignUp ? "Already have an account?" : "Don't have an account?"}
             </p>
             <button 
               type="button" 
               onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); setSuccessMsg(''); setShowPassword(false); }}
               className="mt-2 text-[#FF6B35] font-black text-xs uppercase tracking-widest active:scale-95 transition-transform"
             >
               {isSignUp ? "Sign In Here" : "Create Account"}
             </button>
          </div>
        </div>

        {/* OVERLAY PANEL (ORANGE) YANG BERGESER (KHUSUS LAPTOP) */}
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
                  onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); setSuccessMsg(''); setShowPassword(false); }}
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
import React, { useState, useRef, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, RefreshCw, ArrowLeft, UserCircle2, Briefcase, KeyRound } from 'lucide-react'; 

import { supabase } from '../supabase'; 

const AnimatedEyeToggle = ({ isVisible, activeColor = "#FF6B35" }) => {
  const strokeColor = "#9ca3af"; 

  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isVisible ? activeColor : strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-colors hover:stroke-gray-600">
      <motion.path initial={false} animate={{ d: isVisible ? "M 2 12 C 8 4, 16 4, 22 12" : "M 3 13 C 8 16, 16 16, 21 13" }} transition={{ duration: 0.3 }} />
      <motion.path initial={false} animate={{ d: isVisible ? "M 2 12 C 8 20, 16 20, 22 12" : "M 3 13 C 8 16, 16 16, 21 13" }} transition={{ duration: 0.3 }} />
      <motion.circle cx="12" cy="12" r="3.5" stroke="none" fill={isVisible ? activeColor : strokeColor} initial={false} animate={ isVisible ? { x: [0, 4, -2, 0], y: [4, -1, 1, 0], scale: 1, opacity: 1 } : { x: 0, y: 4, scale: 0.5, opacity: 0 } } transition={{ duration: 0.6, times: [0, 0.4, 0.7, 1] }} />
    </svg>
  );
};

const OtpVerification = ({ email, onVerified, onCancel, isAgentMode }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // 🔥 UPDATE WARNA AGEN KE #0f172a
  const themeColor = isAgentMode ? 'text-[#0f172a]' : 'text-[#FF6B35]';
  const themeBg = isAgentMode ? 'bg-[#0f172a] hover:bg-[#1f7ca0]' : 'bg-[#FF6B35] hover:bg-[#e85526]';
  const themeRing = isAgentMode ? 'focus:ring-[#0f172a]/30 focus:border-[#0f172a]' : 'focus:ring-[#FF6B35]/30 focus:border-[#FF6B35]';
  const themeIconBg = isAgentMode ? 'bg-[#0f172a]/10 text-[#0f172a]' : 'bg-[#FF6B35]/10 text-[#FF6B35]';

  const verifyOtpCode = async (codeToVerify) => {
    if (codeToVerify.length < 6 || isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: codeToVerify,
        type: 'signup' 
      });

      if (verifyError) throw verifyError;
      
      if (data.session) {
        localStorage.setItem('supabase_token', data.session.access_token);
      }

      const finalUser = { ...data.user, name: data.user.user_metadata?.full_name, role: isAgentMode ? 'agent' : 'user' };
      onVerified(finalUser); 
    } catch (err) {
      setError(err.message || 'Verifikasi gagal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== '' && index < 5) inputRefs.current[index + 1].focus();
    const currentCode = newOtp.join('');
    if (currentCode.length === 6) verifyOtpCode(currentCode);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) newOtp[i] = pastedData[i];
      setOtp(newOtp);
      const focusIndex = Math.min(pastedData.length, 5);
      inputRefs.current[focusIndex].focus();
      if (pastedData.length === 6) verifyOtpCode(pastedData);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1].focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyOtpCode(otp.join(''));
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setError('');
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });
      
      if (resendError) throw resendError;
      
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) clearInterval(timer);
          return prev - 1;
        });
      }, 1000);
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setIsLoading(false); 
    }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full flex flex-col justify-center items-center bg-white p-6 sm:p-8">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${themeIconBg}`}>
        <Mail className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-black text-center text-gray-900 mb-2 italic uppercase">Cek Email Lu!</h2>
      <p className="text-center text-gray-500 mb-8 text-xs font-medium px-4">
        Kita udah ngirim kode 6 digit ke <br/>
        <span className={`font-bold ${themeColor}`}>{email}</span>
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="flex justify-center gap-2 mb-6">
          {otp.map((digit, index) => (
            <input key={index} ref={(el) => (inputRefs.current[index] = el)} type="text" maxLength="1" value={digit} onChange={(e) => handleChange(index, e.target.value)} onKeyDown={(e) => handleKeyDown(index, e)} onPaste={handlePaste} disabled={isLoading} className={`w-11 h-14 text-center text-xl font-black text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white outline-none transition-all disabled:opacity-70 ${themeRing}`} />
          ))}
        </div>
        {error && <p className="text-red-500 text-[10px] text-center font-bold bg-red-50 py-2.5 rounded-xl italic mb-4">{error}</p>}
        <button type="submit" disabled={isLoading || otp.join('').length < 6} className={`w-full py-4 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 flex justify-center items-center gap-2 ${themeBg}`}>
          {isLoading ? 'Mengecek...' : 'Verifikasi Akun'} {!isLoading && <CheckCircle2 className="w-4 h-4" />}
        </button>
      </form>

      <div className="mt-8 flex flex-col items-center gap-4 text-xs font-medium">
        <p className="text-gray-500"> Belum dapet emailnya?{' '} <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || isLoading} className={`${themeColor} font-black hover:underline disabled:text-gray-400 inline-flex items-center gap-1 uppercase tracking-widest`}><RefreshCw className="w-3 h-3" /> {resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : 'Kirim Ulang'}</button></p>
        <button onClick={onCancel} disabled={isLoading} className="text-gray-400 hover:text-gray-800 font-bold inline-flex items-center gap-1 uppercase tracking-widest mt-2 transition-colors disabled:opacity-50"><ArrowLeft className="w-3 h-3" /> Kembali</button>
      </div>
    </motion.div>
  );
};

const ForgotPasswordScreen = ({ onCancel, onPasswordResetSuccess }) => {
  const [step, setStep] = useState(1); 
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const inputRefs = useRef([]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      setStep(2);
      setSuccessMsg('Kode OTP pemulihan telah dikirim ke email lu!');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6 || !newPassword) return;
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'recovery'
      });
      if (verifyError) throw verifyError;

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (updateError) throw updateError;
      
      setSuccessMsg('Password berhasil direset! Silakan login.');
      setTimeout(() => {
        onPasswordResetSuccess(); 
      }, 2000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value !== '' && index < 5) inputRefs.current[index + 1].focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputRefs.current[index - 1].focus();
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full h-full flex flex-col justify-center items-center bg-white p-6 sm:p-8">
      <div className="w-16 h-16 bg-[#FF6B35]/10 text-[#FF6B35] rounded-full flex items-center justify-center mb-6">
        <KeyRound className="w-8 h-8" />
      </div>
      
      <h2 className="text-2xl font-black text-center text-gray-900 mb-2 italic uppercase">
        {step === 1 ? 'Lupa Password?' : 'Bikin Password Baru'}
      </h2>
      <p className="text-center text-gray-500 mb-8 text-xs font-medium px-4">
        {step === 1 
          ? "Kalem bro, masukin email lu ntar kita kirimin kode OTP buat reset." 
          : <span>Masukin kode OTP yang udah dikirim ke <span className="font-bold text-[#FF6B35]">{email}</span> dan password baru lu.</span>
        }
      </p>

      {errorMsg && <p className="w-full max-w-sm text-red-500 text-[10px] text-center font-bold bg-red-50 py-2.5 rounded-xl italic mb-4">{errorMsg}</p>}
      {successMsg && <p className="w-full max-w-sm text-emerald-600 text-[10px] text-center font-bold bg-emerald-50 py-2.5 rounded-xl italic mb-4">{successMsg}</p>}

      {step === 1 ? (
        <form onSubmit={handleSendOtp} className="w-full max-w-sm">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email terdaftar" className="w-full px-5 py-3.5 mb-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:bg-white border border-transparent focus:border-orange-100 transition-all text-sm" required />
          <button type="submit" disabled={isLoading || !email} className="w-full py-4 bg-[#FF6B35] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#e85526] transition-all shadow-[0_8px_20px_-6px_rgba(255,107,53,0.5)] active:scale-95 disabled:opacity-50">
            {isLoading ? 'Mencari...' : 'Kirim Kode OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="w-full max-w-sm">
          <div className="flex justify-center gap-2 mb-6">
            {otp.map((digit, index) => (
              <input key={index} ref={(el) => (inputRefs.current[index] = el)} type="text" maxLength="1" value={digit} onChange={(e) => handleOtpChange(index, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(index, e)} disabled={isLoading} className="w-11 h-14 text-center text-xl font-black text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/30 outline-none transition-all" />
            ))}
          </div>

          <div className="relative w-full group mb-6">
            <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password Baru" className="w-full pl-5 pr-12 py-3.5 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:bg-white border border-transparent focus:border-orange-100 transition-all text-sm" required minLength="6" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none flex items-center justify-center p-1.5 z-10">
              <AnimatedEyeToggle isVisible={showPassword} activeColor="#FF6B35" />
            </button>
          </div>

          <button type="submit" disabled={isLoading || otp.join('').length < 6 || !newPassword} className="w-full py-4 bg-[#FF6B35] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-[0_8px_20px_-6px_rgba(255,107,53,0.5)] hover:bg-[#e85526] transition-all active:scale-95 disabled:opacity-50">
            {isLoading ? 'Menyimpan...' : 'Simpan Password'}
          </button>
        </form>
      )}

      <button onClick={onCancel} disabled={isLoading} className="text-gray-400 hover:text-gray-800 font-bold inline-flex items-center gap-1 uppercase tracking-widest mt-6 transition-colors disabled:opacity-50 text-[10px]">
        <ArrowLeft className="w-3 h-3" /> Kembali ke Login
      </button>
    </motion.div>
  );
};


// ════════ MAIN COMPONENT LOGIN MODAL ════════
export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false); 
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isAgentMode, setIsAgentMode] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setShowOtpScreen(false);
        setShowForgotPassword(false);
        setIsSignUp(false);
        setFormData({ name: '', email: '', password: '' });
        setErrorMsg('');
        setSuccessMsg('');
        setShowPassword(false);
        setRegisteredEmail('');
        setIsAgentMode(false); 
      }, 300);
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      
      // 🔥 FIX GOOGLE AUTH: SIMPAN PILIHAN AGEN KE LOCAL STORAGE SEBELUM PINDAH HALAMAN 🔥
      localStorage.setItem('agentMode', isAgentMode ? 'true' : 'false');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (err) {
      setErrorMsg(err.message || 'Akses Google ditolak!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name, 
            }
          }
        });
        
        if (error) throw error;

        setRegisteredEmail(formData.email);
        setShowOtpScreen(true);
        
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        const token = data.session.access_token;
        localStorage.setItem('supabase_token', token);
        
        // Simpan mode ke brankas biar pas refresh tetap kebaca
        localStorage.setItem('agentMode', isAgentMode ? 'true' : 'false');

        const loggedInUser = { 
          ...data.user, 
          name: data.user.user_metadata?.full_name || 'User',
          role: isAgentMode ? 'agent' : 'user' 
        };
        
        onLoginSuccess(loggedInUser);
        onClose(); 
      }
    } catch (err) { 
      setErrorMsg(err.message || 'Autentikasi gagal'); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleOtpSuccess = (userData) => {
    localStorage.setItem('agentMode', isAgentMode ? 'true' : 'false');
    onLoginSuccess(userData);
    onClose(); 
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-[800px] h-auto md:h-[600px] min-h-[500px] rounded-[24px] md:rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col md:flex-row"
      >
        <button onClick={onClose} className={`absolute top-4 right-5 md:top-6 md:right-8 text-3xl md:text-2xl font-black transition-all z-[110] leading-none ${(showOtpScreen || showForgotPassword) ? 'text-gray-400 hover:text-gray-900' : 'text-white md:text-gray-400 hover:text-white/80 md:hover:text-gray-900'}`}>&times;</button>

        {showOtpScreen ? (
          <div className="w-full h-full relative z-[105] bg-white">
            <OtpVerification email={registeredEmail} onVerified={handleOtpSuccess} onCancel={() => setShowOtpScreen(false)} isAgentMode={isAgentMode} />
          </div>
        ) : showForgotPassword ? (
          <div className="w-full h-full relative z-[105] bg-white">
            <ForgotPasswordScreen onCancel={() => setShowForgotPassword(false)} onPasswordResetSuccess={() => { setShowForgotPassword(false); setIsSignUp(false); }} />
          </div>
        ) : (
          <>
            {/* 🔥 UPDATE: Background Agent jadi Biru #0f172a 🔥 */}
            <div className={`md:hidden relative w-full px-6 py-10 overflow-hidden flex flex-col items-center justify-center text-center shadow-sm transition-colors duration-500 ${isAgentMode ? 'bg-[#0f172a]' : 'bg-[#FF6B35]'}`}>
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              
              <AnimatePresence mode="wait">
                <motion.div key={isSignUp ? 'mobile-signup-text' : 'mobile-signin-text'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="relative z-10">
                  <h2 className="text-3xl font-black tracking-tighter italic uppercase text-white mb-1">
                    {isSignUp ? 'Create Account' : (isAgentMode ? 'Portal Agen' : 'Welcome Back!')}
                  </h2>
                  <p className="text-white/90 text-xs font-medium px-4">
                    {isSignUp 
                      ? "Join the party and manage your events easily!" 
                      : (isAgentMode ? "Masuk sebagai panitia untuk kelola tiket dan peserta." : "Sign in to access your personal dashboard.")}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className={`w-full md:w-1/2 h-full p-6 sm:p-8 md:px-12 md:py-8 flex flex-col justify-center transition-transform duration-700 ease-in-out ${isSignUp ? 'md:translate-x-full' : 'translate-x-0'} bg-white`}>
              
              <div className="text-center mb-5 md:mb-6 hidden md:block">
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase italic">
                  {isSignUp ? 'Create Account' : (isAgentMode ? 'Portal Agen' : 'Sign In')}
                </h2>
              </div>

              {/* 🔥 UPDATE: Warna switch toggle ke #0f172a 🔥 */}
              <div className="w-full bg-gray-100 p-1 rounded-xl flex items-center justify-between mb-6 shadow-inner relative">
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out z-0`}
                  style={{ left: isAgentMode ? 'calc(50% + 2px)' : '4px' }}
                />
                <button type="button" onClick={() => setIsAgentMode(false)} className={`flex-1 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest z-10 transition-colors flex items-center justify-center gap-1.5 ${!isAgentMode ? 'text-[#FF6B35]' : 'text-gray-400 hover:text-gray-600'}`}>
                  <UserCircle2 className="w-3.5 h-3.5" /> Reguler
                </button>
                <button type="button" onClick={() => setIsAgentMode(true)} className={`flex-1 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest z-10 transition-colors flex items-center justify-center gap-1.5 ${isAgentMode ? 'text-[#0f172a]' : 'text-gray-400 hover:text-gray-600'}`}>
                  <Briefcase className="w-3.5 h-3.5" /> Agen
                </button>
              </div>

              <div className="text-center mb-5 mt-2 md:mt-0">
                <div className="flex gap-4 justify-center">
                  <button type="button" onClick={handleGoogleLogin} className="w-12 h-12 md:w-10 md:h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-all shadow-sm active:scale-90 bg-white">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5 md:w-4 md:h-4" alt="Google" />
                  </button>
                </div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-4">or use your email account</p>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={isSignUp ? 'form-signup' : 'form-signin'} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-4">
                    {isSignUp && (
                      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className={`w-full px-5 py-3.5 md:py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:bg-white border border-transparent transition-all text-sm ${isAgentMode ? 'focus:ring-[#0f172a]/30 focus:border-[#0f172a]/30' : 'focus:ring-[#FF6B35]/30 focus:border-orange-100'}`} required />
                    )}
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className={`w-full px-5 py-3.5 md:py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:bg-white border border-transparent transition-all text-sm ${isAgentMode ? 'focus:ring-[#0f172a]/30 focus:border-[#0f172a]/30' : 'focus:ring-[#FF6B35]/30 focus:border-orange-100'}`} required />
                    
                    <div className="relative w-full group">
                      <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} placeholder="Password" className={`w-full pl-5 pr-12 py-3.5 md:py-3 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:bg-white border border-transparent transition-all text-sm ${isAgentMode ? 'focus:ring-[#0f172a]/30 focus:border-[#0f172a]/30' : 'focus:ring-[#FF6B35]/30 focus:border-orange-100'}`} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 focus:outline-none flex items-center justify-center p-1.5 z-10">
                        {/* 🔥 UPDATE: Mata dinamis warnanya 🔥 */}
                        <AnimatedEyeToggle isVisible={showPassword} activeColor={isAgentMode ? "#0f172a" : "#FF6B35"} />
                      </button>
                    </div>

                    {!isSignUp && (
                      <div className="flex justify-end w-full">
                        <button type="button" onClick={() => setShowForgotPassword(true)} className={`text-[10px] font-bold text-gray-500 transition-colors uppercase tracking-widest cursor-pointer ${isAgentMode ? 'hover:text-[#0f172a]' : 'hover:text-[#FF6B35]'}`}>
                          Lupa Password?
                        </button>
                      </div>
                    )}
                    
                    {errorMsg && <p className="text-red-500 text-[10px] text-center font-bold bg-red-50 py-2.5 rounded-xl italic">{errorMsg}</p>}
                    {successMsg && <p className="text-green-600 text-[10px] text-center font-bold bg-green-50 py-2.5 rounded-xl italic">{successMsg}</p>}

                    {/* 🔥 UPDATE: Tombol dinamis warnanya (Biru/Orange) 🔥 */}
                    <button type="submit" disabled={isLoading} className={`w-full py-4 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 disabled:opacity-50 italic mt-2 ${isAgentMode ? 'bg-[#0f172a] hover:bg-[#1f7ca0] shadow-[0_8px_20px_-6px_rgba(37,150,190,0.5)]' : 'bg-[#FF6B35] hover:bg-[#e85526] shadow-[0_8px_20px_-6px_rgba(255,107,53,0.5)]'}`}>
                      {isLoading ? 'Processing...' : (isSignUp ? 'Sign Up' : (isAgentMode ? 'Masuk Portal Agen' : 'Sign In'))}
                    </button>
                  </form>
                </motion.div>
              </AnimatePresence>

              <div className="md:hidden mt-8 pt-6 border-t border-gray-100 text-center">
                 <p className="text-[11px] text-gray-500 font-medium">{isSignUp ? "Already have an account?" : "Don't have an account?"}</p>
                 <button type="button" onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); setSuccessMsg(''); setShowPassword(false); }} className={`mt-2 font-black text-xs uppercase tracking-widest active:scale-95 transition-transform ${isAgentMode ? 'text-[#0f172a]' : 'text-[#FF6B35]'}`}>
                   {isSignUp ? "Sign In Here" : "Create Account"}
                 </button>
              </div>
            </div>

            {/* 🔥 UPDATE: Background Kanan Desktop dinamis (Biru #0f172a) 🔥 */}
            <div className={`hidden md:flex absolute top-0 left-0 w-1/2 h-full transition-transform duration-700 ease-in-out z-100 ${isSignUp ? '-translate-x-0' : 'translate-x-full'}`}>
              <div className={`h-full w-full flex flex-col items-center justify-center text-white p-12 text-center relative overflow-hidden transition-colors duration-500 ${isAgentMode ? 'bg-[#0f172a]' : 'bg-[#FF6B35]'}`}>
                <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                <AnimatePresence mode="wait">
                  <motion.div key={isSignUp ? 'signup-text' : 'signin-text'} initial={{ opacity: 0, x: isSignUp ? -50 : 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isSignUp ? 50 : -50 }} className="relative z-10">
                    <h2 className="text-4xl font-black tracking-tighter italic uppercase mb-4 leading-tight">
                      {isSignUp ? (isAgentMode ? 'Portal Agen!' : 'Welcome Back!') : 'Create, Account!'}
                    </h2>
                    <p className="text-sm font-medium mb-10 opacity-90 leading-relaxed">
                      {isSignUp ? "Enter your personal details to stay connected with the best events." : "Sign up if you still don't have an account and join the party!"}
                    </p>
                    <button type="button" onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); setSuccessMsg(''); setShowPassword(false); }} className={`px-12 py-3 border-2 border-white rounded-2xl font-black uppercase text-[10px] tracking-[2px] transition-all active:scale-90 hover:bg-white ${isAgentMode ? 'hover:text-[#0f172a]' : 'hover:text-[#FF6B35]'}`}>
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}


import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OtpVerification({ email, onVerified, onCancel }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);

  // Fungsi buat nanganin ketikan di kotak OTP
  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Otomatis pindah ke kotak selanjutnya kalau udah diisi
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Kalau pencet backspace dan kotaknya kosong, mundur ke kotak sebelumnya
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Fungsi kirim ke Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Masukkan 6 digit kode lengkap ya bro!');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // PANGGIL API BACKEND LU DI SINI
      const response = await fetch('http://my-event-rent.vercel.app/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verifikasi gagal');
      }

      // Kalo sukses, panggil fungsi dari parent (buat nutup modal & login)
      onVerified(data.user);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('http://my-event-rent.vercel.app/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message);
      
      // Bikin cooldown 60 detik biar ga dispam
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) clearInterval(timer);
          return prev - 1;
        });
      }, 1000);
      
      toast.success('Kode baru udah dikirim ke email lu bro!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full mx-auto border border-amber-100"
    >
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center">
          <Mail className="w-8 h-8" />
        </div>
      </div>
      
      <h2 className="text-2xl font-black text-center text-stone-800 mb-2">Cek Email Lu!</h2>
      <p className="text-center text-stone-500 mb-8 text-sm">
        Kita udah ngirim kode 6 digit ke <br/>
        <span className="font-bold text-amber-600">{email}</span>
      </p>

      <form onSubmit={handleSubmit}>
        <div className="flex justify-center gap-2 sm:gap-3 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-2xl font-bold text-stone-800 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-center text-sm mb-4 font-medium">{error}</p>
        )}

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold tracking-wider uppercase rounded-xl hover:shadow-lg transition-all disabled:opacity-70"
        >
          {isLoading ? 'Mengecek...' : 'Verifikasi Akun'}
          {!isLoading && <CheckCircle2 className="w-5 h-5" />}
        </button>
      </form>

      <div className="mt-8 flex flex-col items-center gap-4 text-sm">
        <p className="text-stone-500">
          Belum dapet emailnya?{' '}
          <button 
            type="button" 
            onClick={handleResend}
            disabled={resendCooldown > 0 || isLoading}
            className="text-amber-600 font-bold hover:underline disabled:text-stone-400 inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            {resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : 'Kirim Ulang'}
          </button>
        </p>

        <button onClick={onCancel} className="text-stone-400 hover:text-stone-600 font-medium inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </div>
    </motion.div>
  );
}
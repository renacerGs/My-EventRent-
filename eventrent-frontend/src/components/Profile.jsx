import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(''); 
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const [passData, setPassData] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [isLoadingPass, setIsLoadingPass] = useState(false);

  const [bankData, setBankData] = useState({ bank_name: '', bank_account: '', bank_account_name: '' });

  const [popup, setPopup] = useState({ isOpen: false, message: '', type: 'info', action: null });

  const showPopup = (message, type = 'info', action = null) => {
    setPopup({ isOpen: true, message, type, action });
  };

  const closePopup = () => {
    if (popup.action) popup.action(); 
    setPopup({ isOpen: false, message: '', type: 'info', action: null });
  };

  useEffect(() => {
    if (!user) {
      navigate('/'); 
      return;
    }
    
    setName(user.name || '');
    setPhone(user.phone || ''); 
    setImagePreview(user.picture || null);
    
    if (user.bank_name) {
      setBankData({
        bank_name: user.bank_name || '',
        bank_account: user.bank_account || '',
        bank_account_name: user.bank_account_name || ''
      });
    }
  }, [navigate, user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300; 
          const MAX_HEIGHT = 300; 
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setImageBase64(compressedBase64); 
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          phone, 
          img: imageBase64,
          bank_name: bankData.bank_name,
          bank_account: bankData.bank_account,
          bank_account_name: bankData.bank_account_name
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        const newPicture = data.picture || imagePreview; 
        const updatedUser = { 
          ...user, 
          name: data.name || name, 
          phone: data.phone || phone, 
          picture: newPicture,
          bank_name: data.bank_name || bankData.bank_name,
          bank_account: data.bank_account || bankData.bank_account,
          bank_account_name: data.bank_account_name || bankData.bank_account_name
        };
        
        try {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
          const safeUser = { ...updatedUser, picture: null };
          localStorage.setItem('user', JSON.stringify(safeUser));
        }

        setUser(updatedUser); 
        setImageBase64(null); 
        
        showPopup("Profil & Data Bank berhasil diperbarui!", "success", () => window.location.reload());
      } else {
        showPopup("Gagal memperbarui profil", "error");
      }
    } catch (err) {
      console.error(err);
      showPopup("Terjadi kesalahan sistem", "error");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passData.newPass !== passData.confirmPass) {
      showPopup("Password baru dan konfirmasi tidak cocok!", "error");
      return;
    }
    if (passData.newPass.length < 6) {
      showPopup("Password minimal terdiri dari 6 karakter!", "error");
      return;
    }

    setIsLoadingPass(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPass: passData.oldPass, newPass: passData.newPass })
      });
      const data = await res.json();
      if (res.ok) {
        showPopup("Password berhasil diubah!", "success");
        setPassData({ oldPass: '', newPass: '', confirmPass: '' });
      } else {
        showPopup(data.message || "Gagal mengubah password", "error");
      }
    } catch (err) {
      console.error(err);
      showPopup("Terjadi kesalahan sistem", "error");
    } finally {
      setIsLoadingPass(false);
    }
  };

  if (!user) return null;
  
  const isGoogleUser = !!user.googleId; 
  // 👇 BACA ROLE UNTUK MENGUBAH TEMA 👇
  const isAgentMode = user.role === 'agent';

  // 👇 STYLING DINAMIS BERDASARKAN MODE 👇
  const inputStyle = `w-full border rounded-xl px-5 py-4 text-sm font-bold focus:outline-none transition-all ${
    isAgentMode 
      ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500' 
      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]'
  }`;
  
  const labelStyle = `block text-[10px] font-black mb-2 uppercase tracking-widest ml-1 ${
    isAgentMode ? 'text-slate-400' : 'text-gray-400'
  }`;

  const currentImage = imagePreview || user.picture;

  return (
    <div className={`min-h-screen pt-10 pb-20 font-sans relative ${isAgentMode ? 'bg-[#0f172a]' : 'bg-[#F8F9FA]'}`}>
      
      {/* ORNAMEN BACKGROUND KHUSUS MODE AGEN */}
      {isAgentMode && (
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none"></div>
      )}

      <AnimatePresence>
        {popup.isOpen && (
          <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`w-full max-w-sm rounded-[32px] p-8 text-center shadow-2xl relative overflow-hidden ${popup.type === 'error' ? 'bg-[#E24A29]' : popup.type === 'success' ? 'bg-[#27AE60]' : 'bg-gray-800'}`}
            >
              <div className={`w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${popup.type === 'error' ? 'text-[#E24A29]' : popup.type === 'success' ? 'text-[#27AE60]' : 'text-gray-800'}`}>
                {popup.type === 'error' ? (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : popup.type === 'success' ? (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              
              <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
                {popup.type === 'error' ? 'Ups, Gagal!' : popup.type === 'success' ? 'Berhasil!' : 'Info'}
              </h2>
              <p className="text-white/90 font-medium mb-8 text-sm">{popup.message}</p>
              
              <button 
                onClick={closePopup} 
                className={`w-full bg-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95 text-xs ${popup.type === 'error' ? 'text-[#E24A29] hover:bg-red-50' : popup.type === 'success' ? 'text-[#27AE60] hover:bg-green-50' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 md:px-8 relative z-10">
        
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className={`w-12 h-12 flex items-center justify-center rounded-full border shadow-sm transition-all active:scale-95 ${isAgentMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-orange-500 hover:border-orange-500' : 'bg-white border-gray-200 text-gray-500 hover:text-[#FF6B35] hover:border-[#FF6B35]'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className={`text-3xl md:text-4xl font-black uppercase tracking-tight m-0 ${isAgentMode ? 'text-white' : 'text-gray-900'}`}>My Account</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* BAGIAN KIRI: PROFIL UTAMA & BANK */}
          <div className="lg:col-span-7">
            <div className={`p-8 rounded-[32px] shadow-sm border ${isAgentMode ? 'bg-slate-800/50 border-slate-700/50 backdrop-blur-sm' : 'bg-white border-gray-100'}`}>
              <h2 className={`text-xl font-black mb-6 uppercase tracking-wide border-b pb-4 ${isAgentMode ? 'text-white border-slate-700' : 'text-gray-900 border-gray-100'}`}>Personal & Bank Info</h2>
              
              <form onSubmit={handleUpdateProfile}>
                <div className={`flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 p-6 rounded-2xl border ${isAgentMode ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                  <div className={`w-24 h-24 rounded-full overflow-hidden border-4 shadow-md relative group shrink-0 ${isAgentMode ? 'border-slate-700 bg-slate-800' : 'border-white bg-gray-200'}`}>
                     {currentImage && currentImage.length > 10 ? (
                       <img src={currentImage} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                       <svg className={`w-12 h-12 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${isAgentMode ? 'text-slate-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                     )}
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                        <span className="text-white text-[10px] font-bold uppercase tracking-widest">Edit</span>
                     </div>
                     <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} accept="image/*" />
                  </div>
                  
                  <div className="text-center sm:text-left">
                    <h3 className={`text-lg font-black ${isAgentMode ? 'text-white' : 'text-gray-900'}`}>{user.name}</h3>
                    <p className={`text-sm font-semibold mb-2 ${isAgentMode ? 'text-slate-400' : 'text-gray-500'}`}>{user.email}</p>
                    <label className={`cursor-pointer inline-block px-4 py-1.5 border rounded-lg text-xs font-bold uppercase tracking-widest transition-colors shadow-sm ${isAgentMode ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'}`}>
                      Ganti Foto
                      <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                    </label>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelStyle}>Full Name</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputStyle} required />
                    </div>
                    <div>
                      <label className={labelStyle}>WhatsApp / Phone</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} className={inputStyle} placeholder="081234567890" />
                    </div>
                  </div>
                  
                  <div>
                    <label className={labelStyle}>Email Address</label>
                    <input type="email" value={user.email} disabled className={`w-full rounded-xl px-5 py-4 text-sm font-bold cursor-not-allowed ${isAgentMode ? 'bg-slate-800 border border-slate-700 text-slate-500' : 'bg-gray-100 border border-gray-200 text-gray-400'}`} />
                    <p className="text-[10px] text-red-400 font-bold mt-2 ml-1 uppercase tracking-widest">*Email tidak dapat diubah</p>
                  </div>

                  <div className={`pt-4 mt-6 border-t ${isAgentMode ? 'border-slate-700' : 'border-gray-100'}`}>
                    <h3 className={`text-[10px] font-black mb-4 uppercase tracking-widest w-max px-3 py-1.5 rounded-lg border ${isAgentMode ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 'bg-orange-50 text-[#FF6B35] border-orange-100'}`}>🏦 Data Rekening (Untuk Agen)</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelStyle}>Nama Bank</label>
                        <input type="text" value={bankData.bank_name} onChange={e => setBankData({...bankData, bank_name: e.target.value})} className={inputStyle} placeholder="BCA / Mandiri" />
                      </div>
                      <div>
                        <label className={labelStyle}>Nomor Rekening</label>
                        <input type="text" value={bankData.bank_account} onChange={e => setBankData({...bankData, bank_account: e.target.value})} className={inputStyle} placeholder="1234567890" />
                      </div>
                      <div>
                        <label className={labelStyle}>A.N (Pemilik)</label>
                        <input type="text" value={bankData.bank_account_name} onChange={e => setBankData({...bankData, bank_account_name: e.target.value})} className={inputStyle} placeholder="Budi Santoso" />
                      </div>
                    </div>
                    <p className={`text-[10px] font-bold mt-2 ml-1 ${isAgentMode ? 'text-slate-400' : 'text-gray-400'}`}>*Lengkapi data ini agar EO mudah mentransfer upah Anda.</p>
                  </div>

                  <div className="pt-6">
                    {/* 👇 FIX: Logika Shadow yang Cerdas 👇 */}
                    <button 
                      type="submit" 
                      disabled={isLoadingProfile}
                      className={`w-full sm:w-auto bg-[#FF6B35] text-white px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#E85526] transition-all active:scale-95 disabled:opacity-50 shadow-xl ${isAgentMode ? 'shadow-orange-500/20' : 'shadow-orange-100/50'}`}
                    >
                      {isLoadingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* BAGIAN KANAN: SECURITY */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div className={`p-8 rounded-[32px] shadow-sm border ${isAgentMode ? 'bg-slate-800/50 border-slate-700/50 backdrop-blur-sm' : 'bg-white border-gray-100'}`}>
              <h2 className={`text-xl font-black mb-6 uppercase tracking-wide border-b pb-4 ${isAgentMode ? 'text-white border-slate-700' : 'text-gray-900 border-gray-100'}`}>Keamanan</h2>
              
              {isGoogleUser ? (
                <div className={`text-center py-10 px-4 rounded-2xl border ${isAgentMode ? 'bg-blue-900/10 border-blue-800/50' : 'bg-blue-50/50 border-blue-100'}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isAgentMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-500'}`}>
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/></svg>
                  </div>
                  <h3 className={`text-sm font-black mb-1 uppercase tracking-wide ${isAgentMode ? 'text-white' : 'text-gray-900'}`}>Login via Google</h3>
                  <p className={`text-[10px] font-bold leading-relaxed px-4 ${isAgentMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    Akun kamu terhubung secara aman dengan Google. Tidak perlu mengingat password.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div>
                    <label className={labelStyle}>Password Lama</label>
                    <input type="password" value={passData.oldPass} onChange={e => setPassData({...passData, oldPass: e.target.value})} className={inputStyle} placeholder="••••••••" required />
                  </div>
                  <div>
                    <label className={labelStyle}>Password Baru</label>
                    <input type="password" value={passData.newPass} onChange={e => setPassData({...passData, newPass: e.target.value})} className={inputStyle} placeholder="••••••••" required />
                  </div>
                  <div>
                    <label className={labelStyle}>Konfirmasi Password Baru</label>
                    <input type="password" value={passData.confirmPass} onChange={e => setPassData({...passData, confirmPass: e.target.value})} className={inputStyle} placeholder="••••••••" required />
                  </div>
                  <div className="pt-2">
                     <button type="submit" disabled={isLoadingPass} className={`w-full text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 ${isAgentMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-900 hover:bg-black'}`}>
                      {isLoadingPass ? 'Memproses...' : 'Ubah Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  // Ambil user dari localStorage
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  
  // State Edit Profile
  const [name, setName] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  // State Ganti Password
  const [passData, setPassData] = useState({ oldPass: '', newPass: '', confirmPass: '' });
  const [isLoadingPass, setIsLoadingPass] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/'); 
      return;
    }
    // Set data awal
    setName(user.name);
    setImagePreview(user.picture);
  }, []);

  // --- HANDLER UPDATE PROFILE ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    try {
      const res = await fetch(`http://localhost:3000/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, img: imageBase64 })
      });
      const data = await res.json();
      if (res.ok) {
        // Update LocalStorage biar Navbar berubah
        const updatedUser = { ...user, name: data.name, picture: data.picture };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser); // Update state lokal
        alert("Profile updated successfully!");
        window.location.reload(); // Reload biar Navbar segar
      } else {
        alert("Failed to update profile");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // --- HANDLER GANTI PASSWORD ---
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // 1. Validasi Frontend
    if (passData.newPass !== passData.confirmPass) {
      alert("New Password and Confirmation do not match!");
      return;
    }
    if (passData.newPass.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    setIsLoadingPass(true);
    try {
      const res = await fetch(`http://localhost:3000/api/users/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldPass: passData.oldPass, 
          newPass: passData.newPass 
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("Password changed successfully!");
        setPassData({ oldPass: '', newPass: '', confirmPass: '' });
      } else {
        alert(data.message || "Failed to change password");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingPass(false);
    }
  };

  if (!user) return null;

  // Cek apakah user login via Google (Biasanya google_id ada isinya, password kosong/null di DB, 
  // tapi di localStorage kita gak simpan password. Kita cek googleId aja)
  const isGoogleUser = !!user.googleId; 

  const inputStyle = "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-orange-200 transition bg-white";
  const labelStyle = "block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide";

  return (
    <div className="bg-gray-50 min-h-screen pt-10 pb-20 font-sans">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-black text-gray-900 mb-8">My Profile</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* KOLOM KIRI: EDIT PUBLIC PROFILE */}
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Personal Information</h2>
            
            <form onSubmit={handleUpdateProfile}>
              {/* Foto Profil */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-gray-100 shadow-md mb-4 relative group">
                   <img src={imagePreview || user.picture} alt="Profile" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                      <span className="text-white text-xs font-bold">Change</span>
                   </div>
                   <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} accept="image/*" />
                </div>
                <p className="text-xs text-gray-400">Allowed *.jpeg, *.jpg, *.png</p>
              </div>

              <div className="space-y-5">
                <div>
                  <label className={labelStyle}>Full Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputStyle} />
                </div>
                
                <div>
                  <label className={labelStyle}>Email Address</label>
                  <input type="email" value={user.email} disabled className={`${inputStyle} bg-gray-100 text-gray-500 cursor-not-allowed`} />
                  <p className="text-[10px] text-gray-400 mt-1">*Email cannot be changed</p>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoadingProfile}
                  className="w-full bg-[#FF6B35] text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-[#e05a2b] transition disabled:opacity-50"
                >
                  {isLoadingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* KOLOM KANAN: CHANGE PASSWORD (HANYA MUNCUL KALAU BUKAN GOOGLE USER) */}
          <div className="bg-white p-8 rounded-[24px] shadow-sm border border-gray-100 h-fit">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Security</h2>
            
            {isGoogleUser ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                </div>
                <h3 className="text-gray-900 font-bold mb-2">Google Account</h3>
                <p className="text-gray-500 text-sm px-4">
                  You are logged in via Google. You don't need to manage a password here.
                </p>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className={labelStyle}>Current Password</label>
                  <input 
                    type="password" 
                    value={passData.oldPass} 
                    onChange={e => setPassData({...passData, oldPass: e.target.value})} 
                    className={inputStyle} placeholder="Enter current password" required
                  />
                </div>

                <div>
                  <label className={labelStyle}>New Password</label>
                  <input 
                    type="password" 
                    value={passData.newPass} 
                    onChange={e => setPassData({...passData, newPass: e.target.value})} 
                    className={inputStyle} placeholder="Enter new password" required
                  />
                </div>

                <div>
                  <label className={labelStyle}>Confirm New Password</label>
                  <input 
                    type="password" 
                    value={passData.confirmPass} 
                    onChange={e => setPassData({...passData, confirmPass: e.target.value})} 
                    className={inputStyle} placeholder="Re-enter new password" required
                  />
                </div>

                <div className="pt-2">
                   <button 
                    type="submit" 
                    disabled={isLoadingPass}
                    className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    {isLoadingPass ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
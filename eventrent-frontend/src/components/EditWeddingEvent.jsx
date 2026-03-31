import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- HELPER: ACCORDION ---
const SectionAccordion = ({ title, isOpen, onToggle, children }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-[24px] shadow-sm overflow-hidden mb-6 transition-all duration-300">
    <button type="button" onClick={onToggle} className="w-full px-8 py-6 flex justify-between items-center bg-slate-800/50 hover:bg-slate-800 transition-colors">
      <h2 className="text-xl font-black uppercase tracking-widest text-white">{title}</h2>
      <span className={`text-[#D4AF37] text-2xl transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
    </button>
    {isOpen && <div className="p-8 border-t border-slate-800">{children}</div>}
  </div>
);

// --- HELPER: CROPPER ---
const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.setAttribute('crossOrigin', 'anonymous'); 
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 736;
      canvas.height = 436;
      ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 736, 436);
      resolve(canvas.toDataURL('image/webp', 0.6));
    };
    image.onerror = (error) => reject(error);
  });
};

const formatDateForInput = (dateStr) => {
  if (!dateStr || dateStr.includes('TBA') || dateStr.includes('-')) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch (err) { return ''; }
};

export default function EditWeddingEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [openSection, setOpenSection] = useState('basic'); 
  const toggleSection = (sectionName) => setOpenSection(prev => prev === sectionName ? null : sectionName);

  const [formData, setFormData] = useState({
    title: '', eventStart: '', eventEnd: '',
    openingMessage: '', closingMessage: '', quote: '',
    oldImgUrl: ''
  });

  const [profiles, setProfiles] = useState([]);
  const [digitalGifts, setDigitalGifts] = useState([]);
  
  // State Gallery: Pisahkan lama dan baru
  const [existingGallery, setExistingGallery] = useState([]); // URL strings
  const [newGalleryFiles, setNewGalleryFiles] = useState([]); // { file, preview }

  const [imagePreview, setImagePreview] = useState(null); // Preview Cover
  const [newCoverBase64, setNewCoverBase64] = useState(''); // Kalau cover diubah
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Cropper State
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); 

  useEffect(() => {
    if (!user) { navigate('/'); return; }

    fetch(`/api/events/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Gagal load event");
        return res.json();
      })
      .then(found => {
        // 🔥 PENGAMAN: Tendang kalau bukan Wedding/Private 🔥
        if (found.category !== 'Wedding' && found.category !== 'Personal' && !found.is_private) {
          alert("Ini bukan Private/Wedding Event. Gunakan menu Edit Public Event.");
          navigate('/manage');
          return;
        }

        const details = found.event_details || {};
        
        setFormData({
          title: found.title || '',
          eventStart: formatDateForInput(found.date_start), 
          eventEnd: formatDateForInput(found.date_end),
          openingMessage: details.openingMessage || '',
          closingMessage: details.closingMessage || '',
          quote: details.quote || '',
          oldImgUrl: found.img || ''
        });

        setImagePreview(found.img);
        setProfiles(details.profiles || []);
        setDigitalGifts(details.digitalGifts || []);
        setExistingGallery(details.galleryImages || []);
        
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        alert("Gagal memuat data edit");
        navigate('/manage');
      });
  }, [id, navigate, user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  // --- PROFIL HANDLER ---
  const handleProfileChange = (profId, field, value) => {
    setProfiles(prev => prev.map(p => p.id === profId ? { ...p, [field]: value } : p));
  };
  const addProfile = () => setProfiles(prev => [...prev, { id: crypto.randomUUID(), fullName: '', nickName: '', role: '', parentsInfo: '', address: '', photoUrl: null }]);
  const removeProfile = (profId) => setProfiles(prev => prev.filter(p => p.id !== profId));

  // --- GIFT HANDLER ---
  const handleGiftChange = (giftId, field, value) => {
    setDigitalGifts(prev => prev.map(g => g.id === giftId ? { ...g, [field]: value } : g));
  };
  const addGift = () => setDigitalGifts(prev => [...prev, { id: crypto.randomUUID(), bankName: '', accountNumber: '', accountName: '' }]);
  const removeGift = (giftId) => setDigitalGifts(prev => prev.filter(g => g.id !== giftId));

  // --- GALLERY HANDLER ---
  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files);
    if (existingGallery.length + newGalleryFiles.length + files.length > 5) {
      return alert("Maksimal hanya 5 foto galeri!");
    }
    const newFiles = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setNewGalleryFiles(prev => [...prev, ...newFiles]);
    e.target.value = null; 
  };
  const removeExistingGallery = (index) => setExistingGallery(prev => prev.filter((_, i) => i !== index));
  const removeNewGallery = (index) => setNewGalleryFiles(prev => prev.filter((_, i) => i !== index));

  // --- CROPPER HANDLER ---
  const handleImageChange = (e, target = 'cover') => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawImageSrc(reader.result);
        setCropTarget(target);
        setShowCropModal(true); 
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null; 
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels), []);

  const handleSaveCrop = async () => {
    try {
      const croppedBase64 = await getCroppedImg(rawImageSrc, croppedAreaPixels);
      if (cropTarget === 'cover') {
        setImagePreview(croppedBase64); 
        setNewCoverBase64(croppedBase64); 
      } else {
        setProfiles(prev => prev.map(p => p.id === cropTarget ? { ...p, photoUrl: croppedBase64 } : p));
      }
      setShowCropModal(false); setCropTarget(null);
    } catch (e) { alert('Gagal memotong gambar!'); }
  };

  // --- UPLOAD HELPER ---
  const uploadToSupabase = async (fileOrBase64, folderPath) => {
    if (!fileOrBase64) return null;
    // Jika sudah URL (misal foto profil lama yg nggak diubah), langsung return
    if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('http')) return fileOrBase64;
    
    let fileToUpload;
    if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:image')) {
       const res = await fetch(fileOrBase64);
       fileToUpload = await res.blob();
    } else {
       fileToUpload = fileOrBase64;
    }

    const fileExt = fileToUpload.type === 'image/webp' ? 'webp' : fileToUpload.name ? fileToUpload.name.split('.').pop() : 'jpg';
    const fileName = `${folderPath}-${Date.now()}-${Math.floor(Math.random()*1000)}.${fileExt}`;
    
    const { error } = await supabase.storage.from('event-posters').upload(fileName, fileToUpload, { contentType: fileToUpload.type || 'image/jpeg' });
    if (error) throw new Error("Gagal upload gambar.");
    
    const { data } = supabase.storage.from('event-posters').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // 1. Upload Cover (Jika ada yang baru)
      const finalCoverUrl = newCoverBase64 ? await uploadToSupabase(newCoverBase64, 'cover') : formData.oldImgUrl;

      // 2. Upload Profile Pics
      const uploadedProfiles = await Promise.all(profiles.map(async (prof) => {
         if (prof.photoUrl && prof.photoUrl.startsWith('data:image')) {
            const url = await uploadToSupabase(prof.photoUrl, `profile-${prof.id}`);
            return { ...prof, photoUrl: url };
         }
         return prof;
      }));

      // 3. Upload New Gallery & Combine
      const uploadedNewGallery = await Promise.all(newGalleryFiles.map(async (gf) => {
         return await uploadToSupabase(gf.file, `gallery`);
      }));
      const finalGallery = [...existingGallery, ...uploadedNewGallery];

      const finalEventDetails = {
         openingMessage: formData.openingMessage,
         closingMessage: formData.closingMessage,
         quote: formData.quote,
         profiles: uploadedProfiles,
         digitalGifts: digitalGifts,
         galleryImages: finalGallery
      };

      const payload = {
        title: formData.title,
        eventStart: formData.eventStart, 
        eventEnd: formData.eventEnd,     
        img: finalCoverUrl,
        eventDetails: finalEventDetails 
      };

      const res = await fetch(`/api/events/${id}?userId=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Wedding Event berhasil diperbarui! ✨");
        navigate('/manage');
      } else {
        alert("Gagal update. Pastikan kamu pembuat event ini.");
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center font-bold text-[#D4AF37]">Loading...</div>;

  const inputStyle = `w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-slate-800 text-white border border-slate-700 placeholder-gray-500 focus:border-[#D4AF37] focus:ring-[#D4AF37]`;
  const labelStyle = `text-xs font-bold mb-1.5 block uppercase tracking-wider text-gray-300`;

  return (
    <div className="bg-slate-950 min-h-screen pb-20 font-sans relative">
      
      {/* MODAL CROPPER */}
      {showCropModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Sesuaikan Gambar</h3>
              <button onClick={() => setShowCropModal(false)} className="text-gray-400 hover:text-red-500 font-bold">✕ Batal</button>
            </div>
            <div className="relative w-full h-[50vh] bg-black">
              <Cropper image={rawImageSrc} crop={crop} zoom={zoom} aspect={cropTarget === 'cover' ? 736 / 436 : 1 / 1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-6 bg-slate-900 flex justify-between items-center gap-4">
              <div className="w-1/2 flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 uppercase">Zoom:</span>
                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(e.target.value)} className="w-full accent-[#D4AF37]" />
              </div>
              <button onClick={handleSaveCrop} className="px-8 py-3 bg-[#D4AF37] text-slate-900 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#FFDF73]">✔ Simpan</button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-8 px-6 max-w-4xl mx-auto flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Edit Wedding</h1>
        <button onClick={() => navigate('/manage')} className="text-gray-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest">Batal</button>
      </div>

      <main className="max-w-4xl mx-auto px-6">
        
        {/* BANNER WARNING */}
        <div className="bg-slate-900 border-l-[4px] border-[#D4AF37] p-5 mb-8 rounded-r-2xl flex items-start gap-4">
           <span className="text-2xl">⚠️</span>
           <div>
             <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider">Data Rangkaian Acara (Sesi)</h3>
             <p className="text-xs text-gray-400 font-medium mt-1">Sesi acara (Waktu, Tempat) dan Pertanyaan Custom RSVP tidak dapat diubah di sini demi menjaga keamanan data tamu yang sudah mendaftar.</p>
           </div>
        </div>

        <form onSubmit={handleSubmit}>
          
          <SectionAccordion title="1. Cover & Teks Pembuka" isOpen={openSection === 'basic'} onToggle={() => toggleSection('basic')}>
            <div className="space-y-5">
              <div>
                <label className={labelStyle}>Foto Cover Undangan</label>
                <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                  {imagePreview ? <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" /> : <span className="text-[#D4AF37]">Upload Cover Baru</span>}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />
                </label>
              </div>
              <div><label className={labelStyle}>Judul Undangan</label><input type="text" name="title" value={formData.title} onChange={handleChange} className={inputStyle} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelStyle}>Tanggal Mulai Acara</label><input type="date" name="eventStart" value={formData.eventStart} onChange={handleChange} className={inputStyle} required /></div>
                <div><label className={labelStyle}>Tanggal Selesai Acara</label><input type="date" name="eventEnd" value={formData.eventEnd} onChange={handleChange} className={inputStyle} required /></div>
              </div>
              <div><label className={labelStyle}>Kata Pengantar (Cover)</label><textarea name="openingMessage" value={formData.openingMessage} onChange={handleChange} rows="3" className={inputStyle} /></div>
              <div><label className={labelStyle}>Kata Penutup</label><textarea name="closingMessage" value={formData.closingMessage} onChange={handleChange} rows="3" className={inputStyle} /></div>
              <div><label className={labelStyle}>Quotes Romantis</label><textarea name="quote" value={formData.quote} onChange={handleChange} rows="2" className={inputStyle} /></div>
            </div>
          </SectionAccordion>

          <SectionAccordion title="2. Profil Mempelai" isOpen={openSection === 'profiles'} onToggle={() => toggleSection('profiles')}>
            {profiles.map((prof, index) => (
               <div key={prof.id} className="p-6 border border-slate-700 bg-slate-800/30 rounded-xl mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[#D4AF37] font-bold uppercase text-sm">Profil {index + 1}</h3>
                    {profiles.length > 1 && <button type="button" onClick={() => removeProfile(prof.id)} className="text-red-400 text-xs font-bold uppercase">Hapus</button>}
                  </div>
                  <div className="flex flex-col md:flex-row gap-6">
                     <div className="w-full md:w-1/3">
                        <label className={labelStyle}>Foto Mempelai</label>
                        <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-full cursor-pointer overflow-hidden border-slate-600 bg-slate-800 hover:border-[#D4AF37]">
                          {prof.photoUrl ? <img src={prof.photoUrl} alt="Profil" className="w-full h-full object-cover" /> : <span className="text-2xl">📸</span>}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, prof.id)} />
                        </label>
                     </div>
                     <div className="w-full md:w-2/3 space-y-4">
                        <div><label className={labelStyle}>Peran (Ex: Mempelai Pria)</label><input type="text" value={prof.role} onChange={(e) => handleProfileChange(prof.id, 'role', e.target.value)} className={inputStyle} /></div>
                        <div><label className={labelStyle}>Nama Lengkap</label><input type="text" value={prof.fullName} onChange={(e) => handleProfileChange(prof.id, 'fullName', e.target.value)} className={inputStyle} /></div>
                        <div><label className={labelStyle}>Informasi Orang Tua</label><textarea value={prof.parentsInfo} onChange={(e) => handleProfileChange(prof.id, 'parentsInfo', e.target.value)} rows="2" className={inputStyle} /></div>
                     </div>
                  </div>
               </div>
            ))}
            <button type="button" onClick={addProfile} className="w-full py-3 border border-dashed border-[#D4AF37] text-[#D4AF37] rounded-xl font-bold uppercase text-xs hover:bg-[#D4AF37]/10">+ Tambah Profil Lainnya</button>
          </SectionAccordion>

          <SectionAccordion title={`3. Galeri Foto (${existingGallery.length + newGalleryFiles.length}/5)`} isOpen={openSection === 'gallery'} onToggle={() => toggleSection('gallery')}>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* EXISTING GALLERY */}
                {existingGallery.map((url, i) => (
                   <div key={`old-${i}`} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-slate-700">
                      <img src={url} alt="Old Gallery" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExistingGallery(i)} className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100">Hapus</button>
                   </div>
                ))}
                {/* NEW GALLERY */}
                {newGalleryFiles.map((gf, i) => (
                   <div key={`new-${i}`} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-green-500/50">
                      <img src={gf.preview} alt="New Gallery" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeNewGallery(i)} className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100">Batal</button>
                   </div>
                ))}
                
                {(existingGallery.length + newGalleryFiles.length) < 5 && (
                   <label className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-dashed rounded-xl cursor-pointer hover:border-[#D4AF37] border-slate-600 bg-slate-800">
                      <span className="text-2xl text-slate-500 mb-2">+</span>
                      <span className="text-[10px] font-bold uppercase text-slate-400">Pilih Foto</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleGallerySelect} />
                   </label>
                )}
             </div>
          </SectionAccordion>

          <SectionAccordion title="4. Amplop Digital / Rekening" isOpen={openSection === 'gifts'} onToggle={() => toggleSection('gifts')}>
            {digitalGifts.map((gift) => (
              <div key={gift.id} className="p-5 border border-slate-700 bg-slate-800/30 rounded-xl mb-4 relative flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/4"><label className={labelStyle}>Bank / E-Wallet</label><input type="text" value={gift.bankName} onChange={(e) => handleGiftChange(gift.id, 'bankName', e.target.value)} className={inputStyle} /></div>
                <div className="w-full md:w-1/3"><label className={labelStyle}>Nomor Rekening</label><input type="text" value={gift.accountNumber} onChange={(e) => handleGiftChange(gift.id, 'accountNumber', e.target.value)} className={inputStyle} /></div>
                <div className="w-full md:w-1/3"><label className={labelStyle}>Atas Nama</label><input type="text" value={gift.accountName} onChange={(e) => handleGiftChange(gift.id, 'accountName', e.target.value)} className={inputStyle} /></div>
                <button type="button" onClick={() => removeGift(gift.id)} className="px-4 py-3 bg-red-900/30 text-red-400 rounded-xl hover:bg-red-900/50">✕</button>
              </div>
            ))}
            <button type="button" onClick={addGift} className="w-full py-3 border border-dashed border-[#D4AF37] text-[#D4AF37] rounded-xl font-bold uppercase text-xs">+ Tambah Rekening Lain</button>
          </SectionAccordion>

          <div className="pt-6 mt-8 mb-10">
            <button type="submit" disabled={isSaving} className="w-full py-4 rounded-xl text-slate-900 font-bold uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 bg-[#D4AF37] hover:bg-[#FFDF73]">
              {isSaving ? '⏳ Menyimpan Perubahan...' : '✨ Update Wedding Event'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
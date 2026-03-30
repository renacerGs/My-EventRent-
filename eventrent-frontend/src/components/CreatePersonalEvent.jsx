import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- HELPER COMPONENT: ACCORDION SECTION ---
const SectionAccordion = ({ title, isOpen, onToggle, children }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-[24px] shadow-sm overflow-hidden mb-6 transition-all duration-300">
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-8 py-6 flex justify-between items-center bg-slate-800/50 hover:bg-slate-800 transition-colors"
    >
      <h2 className="text-xl font-black uppercase tracking-widest text-white">{title}</h2>
      <span className={`text-[#D4AF37] text-2xl transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
        ▼
      </span>
    </button>
    {isOpen && <div className="p-8 border-t border-slate-800">{children}</div>}
  </div>
);

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
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0, 0, 736, 436
      );
      resolve(canvas.toDataURL('image/webp', 0.6));
    };
    image.onerror = (error) => reject(error);
  });
};

export default function CreatePersonalEvent() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  // --- STATE ACCORDION ---
  const [openSection, setOpenSection] = useState('basic'); // 'basic', 'profiles', 'sessions', 'gallery', 'gifts'
  
  const toggleSection = (sectionName) => {
    setOpenSection(prev => prev === sectionName ? null : sectionName);
  };

  // --- STATE UTAMA ---
  const [formData, setFormData] = useState({
    title: '', description: '', eventStart: '', eventEnd: '', phone: '', 
    category: 'Wedding', 
    isPrivate: true, 
    location: { namePlace: '', place: '', city: '', province: '', mapUrl: '' }, 
    sessions: [
      {
        id: crypto.randomUUID(), name: '', description: '', date: '', startTime: '', endTime: '', 
        contactPerson: '', typeEvent: 'Free', price: '0', stock: '', ticketDesc: '', 
        location: { namePlace: '', place: '', city: '', province: '', mapUrl: '' }, 
        questions: [{ id: crypto.randomUUID(), text: '', type: 'Text', isRequired: true, options: [''] }]
      }
    ]
  });

  // --- STATE KHUSUS WEDDING (Akan disimpan ke JSONB event_details) ---
  const [eventDetails, setEventDetails] = useState({
    openingMessage: '',
    closingMessage: '',
    quote: '',
    profiles: [
      { id: crypto.randomUUID(), fullName: '', nickName: '', role: 'Mempelai Pria', parentsInfo: '', address: '', photoUrl: null },
      { id: crypto.randomUUID(), fullName: '', nickName: '', role: 'Mempelai Wanita', parentsInfo: '', address: '', photoUrl: null }
    ],
    digitalGifts: [
      { id: crypto.randomUUID(), bankName: '', accountNumber: '', accountName: '' }
    ]
  });

  // --- STATE GALLERY (Maksimal 5 Foto) ---
  const [galleryFiles, setGalleryFiles] = useState([]); // Array of { file: File, preview: URL }

  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  // --- CROPPER STATE ---
  const [showCropModal, setShowCropModal] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); // 'cover' atau profile_id

  // --- HANDLERS DASAR ---
  const handleEventChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleDetailsChange = (e) => setEventDetails({ ...eventDetails, [e.target.name]: e.target.value });

  // --- HANDLERS PROFIL MEMPELAI ---
  const handleProfileChange = (id, field, value) => {
    setEventDetails(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const addProfile = () => {
    setEventDetails(prev => ({
      ...prev,
      profiles: [...prev.profiles, { id: crypto.randomUUID(), fullName: '', nickName: '', role: '', parentsInfo: '', address: '', photoUrl: null }]
    }));
  };

  const removeProfile = (id) => {
    setEventDetails(prev => ({ ...prev, profiles: prev.profiles.filter(p => p.id !== id) }));
  };

  // --- HANDLERS DIGITAL GIFT ---
  const handleGiftChange = (id, field, value) => {
    setEventDetails(prev => ({
      ...prev,
      digitalGifts: prev.digitalGifts.map(g => g.id === id ? { ...g, [field]: value } : g)
    }));
  };

  const addGift = () => {
    setEventDetails(prev => ({
      ...prev,
      digitalGifts: [...prev.digitalGifts, { id: crypto.randomUUID(), bankName: '', accountNumber: '', accountName: '' }]
    }));
  };

  const removeGift = (id) => {
    setEventDetails(prev => ({ ...prev, digitalGifts: prev.digitalGifts.filter(g => g.id !== id) }));
  };

  // --- HANDLERS GALLERY ---
  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files);
    if (galleryFiles.length + files.length > 5) {
      return alert("Maksimal hanya 5 foto galeri!");
    }
    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setGalleryFiles(prev => [...prev, ...newFiles]);
    e.target.value = null; // Reset input
  };

  const removeGalleryImage = (indexToRemove) => {
    setGalleryFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // --- HANDLERS CROPPER (COVER & PROFILE) ---
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

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = async () => {
    try {
      const croppedImageBase64 = await getCroppedImg(rawImageSrc, croppedAreaPixels);
      
      if (cropTarget === 'cover') {
        setImagePreview(croppedImageBase64); 
        setImageBase64(croppedImageBase64); 
      } else {
        // Ini untuk foto profil mempelai
        setEventDetails(prev => ({
          ...prev,
          profiles: prev.profiles.map(p => p.id === cropTarget ? { ...p, photoUrl: croppedImageBase64 } : p)
        }));
      }
      
      setShowCropModal(false); 
      setCropTarget(null);
    } catch (e) {
      console.error(e);
      alert('Gagal memotong gambar!');
    }
  };

  // --- HANDLERS SESSION & LOKASI (Tetap Sama) ---
  const handleSessionLocationChange = (sIndex, field, value) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions));
    if (!updated[sIndex].location) updated[sIndex].location = { namePlace: '', place: '', city: '', province: '', mapUrl: '' };
    updated[sIndex].location[field] = value;
    setFormData({ ...formData, sessions: updated });
  };
  const handleSessionChange = (index, field, value) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions));
    updated[index][field] = value;
    setFormData({ ...formData, sessions: updated });
  };
  const addSession = () => {
    setFormData(prev => ({
      ...prev,
      sessions: [...prev.sessions, {
        id: crypto.randomUUID(), name: '', description: '', date: '', startTime: '', endTime: '', 
        contactPerson: '', typeEvent: 'Free', price: '0', stock: '', ticketDesc: '',
        location: { namePlace: '', place: '', city: '', province: '', mapUrl: '' }, 
        questions: [{ id: crypto.randomUUID(), text: '', type: 'Text', isRequired: true, options: [''] }]
      }]
    }));
  };
  const removeSession = (indexToRemove) => {
    if (formData.sessions.length <= 1) return alert("Minimal harus ada 1 session untuk event ini!");
    const updatedSessions = formData.sessions.filter((_, index) => index !== indexToRemove);
    setFormData({ ...formData, sessions: updatedSessions });
  };

  // --- HANDLERS QUESTION FORM BUILDER (Tetap Sama) ---
  const handleQuestionChange = (sIndex, qIndex, field, value) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions));
    updated[sIndex].questions[qIndex][field] = value;
    if (field === 'type' && (value === 'Dropdown' || value === 'Checkbox')) {
      if (!updated[sIndex].questions[qIndex].options || updated[sIndex].questions[qIndex].options.length === 0) {
        updated[sIndex].questions[qIndex].options = [''];
      }
    }
    setFormData({ ...formData, sessions: updated });
  };
  const addQuestion = (sIndex) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions));
    updated[sIndex].questions.push({ id: crypto.randomUUID(), text: '', type: 'Text', isRequired: true, options: [''] });
    setFormData({ ...formData, sessions: updated });
  };
  const removeQuestion = (sIndex, qIndex) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions));
    updated[sIndex].questions = updated[sIndex].questions.filter((_, i) => i !== qIndex);
    setFormData({ ...formData, sessions: updated });
  };
  const addQuestionOption = (sIndex, qIndex) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions));
    updated[sIndex].questions[qIndex].options.push('');
    setFormData({ ...formData, sessions: updated });
  };
  const updateQuestionOption = (sIndex, qIndex, optIndex, value) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions));
    updated[sIndex].questions[qIndex].options[optIndex] = value;
    setFormData({ ...formData, sessions: updated });
  };
  const removeQuestionOption = (sIndex, qIndex, optIndex) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions));
    updated[sIndex].questions[qIndex].options.splice(optIndex, 1);
    setFormData({ ...formData, sessions: updated });
  };

  // --- HELPER UNGGAH GAMBAR KE SUPABASE ---
  const uploadImageToSupabase = async (base64OrFile, folderPath) => {
    let fileToUpload;
    
    if (typeof base64OrFile === 'string' && base64OrFile.startsWith('data:image')) {
       // Convert Base64 (hasil cropper) ke Blob
       const res = await fetch(base64OrFile);
       fileToUpload = await res.blob();
    } else {
       // File murni (dari input file biasa, spt galeri)
       fileToUpload = base64OrFile;
    }

    const fileExt = fileToUpload.type === 'image/webp' ? 'webp' : fileToUpload.name ? fileToUpload.name.split('.').pop() : 'jpg';
    const fileName = `${folderPath}-${Date.now()}-${Math.floor(Math.random()*1000)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('event-posters')
      .upload(fileName, fileToUpload, { contentType: fileToUpload.type || 'image/jpeg', upsert: false });

    if (error) throw new Error("Gagal mengunggah gambar ke Supabase.");
    
    const { data: publicUrlData } = supabase.storage.from('event-posters').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  };

  // --- SUBMIT UTAMA ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageBase64) return alert("Poster/Cover Utama wajib diupload!");
    
    setIsLoading(true);
    try {
      // 1. Upload Cover Utama
      const coverUrl = await uploadImageToSupabase(imageBase64, 'cover');

      // 2. Upload Foto Profil (Yang tidak null)
      const uploadedProfiles = await Promise.all(eventDetails.profiles.map(async (prof) => {
         if (prof.photoUrl && prof.photoUrl.startsWith('data:image')) {
            const url = await uploadImageToSupabase(prof.photoUrl, `profile-${prof.id}`);
            return { ...prof, photoUrl: url };
         }
         return prof; // Tidak diubah jika belum upload/sudah URL
      }));

      // 3. Upload Gallery Foto
      const uploadedGallery = await Promise.all(galleryFiles.map(async (gf) => {
         return await uploadImageToSupabase(gf.file, `gallery`);
      }));

      // 4. Susun Payload Event Details
      const finalEventDetails = {
         ...eventDetails,
         profiles: uploadedProfiles,
         galleryImages: uploadedGallery // Simpan array URL galeri
      };
      
      // 5. Susun Payload Akhir untuk Backend
      const payload = {
          ...formData,
          userId: user.id,
          img: coverUrl,
          eventDetails: finalEventDetails // Kirim JSONB ke Backend
      };

      const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });

      if (response.ok) {
          navigate('/manage'); 
      } else {
          const errorData = await response.json();
          alert("Gagal membuat undangan: " + (errorData.message || 'Server error'));
      }
    } catch (error) {
        console.error(error);
        alert(error.message || "Gagal terhubung ke server.");
    } finally {
        setIsLoading(false);
    }
  };

  // Tema Input UI
  const inputStyle = `w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-slate-800 text-white border border-slate-700 placeholder-gray-500 focus:border-[#D4AF37] focus:ring-[#D4AF37]`;
  const labelStyle = `text-xs font-bold mb-1.5 block uppercase tracking-wider text-gray-300`;

  return (
    <div className="bg-slate-950 min-h-screen pb-20 font-sans relative transition-colors duration-500">
      
      {/* MODAL CROPPER */}
      {showCropModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Sesuaikan Gambar</h3>
              <button onClick={() => setShowCropModal(false)} className="text-gray-400 hover:text-red-500 font-bold">✕ Batal</button>
            </div>
            <div className="relative w-full h-[50vh] md:h-[60vh] bg-black">
              {/* Aspek rasio berbeda: Cover (Landscape), Profil (Square/Portrait) */}
              <Cropper 
                image={rawImageSrc} crop={crop} zoom={zoom} 
                aspect={cropTarget === 'cover' ? 736 / 436 : 1 / 1} 
                onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} 
              />
            </div>
            <div className="p-6 bg-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="w-full sm:w-1/2 flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 uppercase">Zoom:</span>
                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(e.target.value)} className="w-full accent-[#D4AF37]" />
              </div>
              <button onClick={handleSaveCrop} className="w-full sm:w-auto px-8 py-3 bg-[#D4AF37] text-slate-900 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 hover:bg-[#FFDF73]">
                ✔ Potong & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-8 px-6 max-w-4xl mx-auto flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-sm font-bold flex items-center gap-2 text-[#D4AF37] hover:opacity-80">
            ← Kembali
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Buat Undangan Digital</h1>
          <p className="text-[#D4AF37] mt-2 font-serif italic">Siapkan RSVP elegan untuk momen spesial Anda.</p>
        </div>

        <form onSubmit={handleSubmit}>
          
          {/* ========================================================= */}
          {/* SECTION 1: BASIC INFO & COVER */}
          {/* ========================================================= */}
          <SectionAccordion title="1. Cover & Informasi Dasar" isOpen={openSection === 'basic'} onToggle={() => toggleSection('basic')}>
            <div className="space-y-5">
              <div>
                <label className={labelStyle}>Foto Cover Undangan Utama <span className="normal-case ml-1 font-normal text-[#D4AF37]">(Wajib)</span></label>
                <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                      <span className="text-4xl mb-2 opacity-50">🖼️</span>
                      <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Upload Foto Cover</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />
                </label>
              </div>

              <div>
                <label className={labelStyle}>Judul Undangan</label>
                <input type="text" name="title" placeholder="Ex: The Wedding of Romeo & Juliet" value={formData.title} onChange={handleEventChange} className={inputStyle} required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Tanggal Mulai Acara Utama</label>
                  <input type="date" name="eventStart" value={formData.eventStart} onChange={handleEventChange} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>Tanggal Selesai Acara</label>
                  <input type="date" name="eventEnd" value={formData.eventEnd} onChange={handleEventChange} className={inputStyle} required />
                </div>
              </div>

              <div>
                <label className={labelStyle}>Kata Pengantar / Doa (Tampil di Cover/Awal)</label>
                <textarea name="openingMessage" placeholder="Halo, dengan memohon rahmat dan ridho Allah SWT..." value={eventDetails.openingMessage} onChange={handleDetailsChange} rows="3" className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Kata Penutup / Ucapan Terima Kasih</label>
                <textarea name="closingMessage" placeholder="Merupakan suatu kehormatan apabila Bapak/Ibu berkenan hadir..." value={eventDetails.closingMessage} onChange={handleDetailsChange} rows="3" className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Quotes / Kata-kata Romantis (Opsional)</label>
                <textarea name="quote" placeholder="Ex: Dan di antara tanda-tanda kebesaran-Nya..." value={eventDetails.quote} onChange={handleDetailsChange} rows="2" className={inputStyle} />
              </div>
            </div>
          </SectionAccordion>

          {/* ========================================================= */}
          {/* SECTION 2: PROFIL MEMPELAI / TUAN RUMAH */}
          {/* ========================================================= */}
          <SectionAccordion title="2. Profil Mempelai" isOpen={openSection === 'profiles'} onToggle={() => toggleSection('profiles')}>
            {eventDetails.profiles.map((prof, index) => (
               <div key={prof.id} className="p-6 border border-slate-700 bg-slate-800/30 rounded-xl mb-6 relative">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[#D4AF37] font-bold uppercase tracking-widest text-sm">Profil {index + 1}</h3>
                    {eventDetails.profiles.length > 1 && (
                      <button type="button" onClick={() => removeProfile(prof.id)} className="text-red-400 text-xs font-bold uppercase hover:text-red-300">Hapus</button>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                     <div className="w-full md:w-1/3">
                        <label className={labelStyle}>Foto Mempelai</label>
                        <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-full cursor-pointer overflow-hidden border-slate-600 bg-slate-800 hover:border-[#D4AF37]">
                          {prof.photoUrl ? (
                            <img src={prof.photoUrl} alt="Profil" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl text-slate-500">📸</span>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, prof.id)} />
                        </label>
                     </div>
                     <div className="w-full md:w-2/3 space-y-4">
                        <div>
                           <label className={labelStyle}>Peran (Ex: Mempelai Pria)</label>
                           <input type="text" value={prof.role} onChange={(e) => handleProfileChange(prof.id, 'role', e.target.value)} className={inputStyle} required />
                        </div>
                        <div>
                           <label className={labelStyle}>Nama Lengkap</label>
                           <input type="text" value={prof.fullName} onChange={(e) => handleProfileChange(prof.id, 'fullName', e.target.value)} className={inputStyle} required />
                        </div>
                        <div>
                           <label className={labelStyle}>Nama Panggilan</label>
                           <input type="text" value={prof.nickName} onChange={(e) => handleProfileChange(prof.id, 'nickName', e.target.value)} className={inputStyle} />
                        </div>
                        <div>
                           <label className={labelStyle}>Informasi Orang Tua</label>
                           <textarea placeholder="Putra pertama dari Bpk X & Ibu Y" value={prof.parentsInfo} onChange={(e) => handleProfileChange(prof.id, 'parentsInfo', e.target.value)} rows="2" className={inputStyle} />
                        </div>
                     </div>
                  </div>
               </div>
            ))}
            <button type="button" onClick={addProfile} className="w-full py-3 border border-dashed border-[#D4AF37] text-[#D4AF37] rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-[#D4AF37]/10 transition">
              + Tambah Profil Lainnya
            </button>
          </SectionAccordion>

          {/* ========================================================= */}
          {/* SECTION 3: RANGKAIAN ACARA (SESSIONS) */}
          {/* ========================================================= */}
          <SectionAccordion title="3. Rangkaian Acara (Sesi)" isOpen={openSection === 'sessions'} onToggle={() => toggleSection('sessions')}>
            {formData.sessions.map((session, sIndex) => (
              <div key={session.id} className="p-6 border border-slate-700 bg-slate-800/30 rounded-xl mb-6 relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[#D4AF37] font-bold uppercase tracking-widest text-sm">Sesi {sIndex + 1}</h3>
                  {formData.sessions.length > 1 && (
                    <button type="button" onClick={() => removeSession(sIndex)} className="text-red-400 text-xs font-bold uppercase hover:text-red-300">Hapus Sesi</button>
                  )}
                </div>

                <div className="space-y-4">
                  <div><label className={labelStyle}>Nama Acara (Ex: Akad Nikah / Resepsi)</label><input type="text" value={session.name} onChange={(e) => handleSessionChange(sIndex, 'name', e.target.value)} className={inputStyle} required /></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className={labelStyle}>Tanggal</label><input type="date" value={session.date} onChange={(e) => handleSessionChange(sIndex, 'date', e.target.value)} className={inputStyle} required /></div>
                    <div><label className={labelStyle}>Jam Mulai</label><input type="time" value={session.startTime} onChange={(e) => handleSessionChange(sIndex, 'startTime', e.target.value)} className={inputStyle} required /></div>
                    <div><label className={labelStyle}>Jam Selesai</label><input type="time" value={session.endTime} onChange={(e) => handleSessionChange(sIndex, 'endTime', e.target.value)} className={inputStyle} required /></div>
                  </div>
                  <div><label className={labelStyle}>Batas Maksimal Tamu</label><input type="text" value={session.stock} onChange={(e) => { const val = e.target.value; if (val === '' || /^\d+$/.test(val)) handleSessionChange(sIndex, 'stock', val); }} className={inputStyle} required /></div>
                  
                  {/* Lokasi Khusus Sesi */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-[#D4AF37] font-bold mb-3 uppercase">Lokasi Sesi Ini</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div><label className={labelStyle}>Nama Gedung</label><input type="text" value={session.location?.namePlace || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'namePlace', e.target.value)} className={inputStyle} required /></div>
                       <div><label className={labelStyle}>Kota</label><input type="text" value={session.location?.city || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'city', e.target.value)} className={inputStyle} required /></div>
                    </div>
                    <div className="mt-3"><label className={labelStyle}>Full Alamat</label><textarea value={session.location?.place || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'place', e.target.value)} rows="2" className={inputStyle} required /></div>
                    <div className="mt-3"><label className={labelStyle}>URL Google Maps</label><input type="url" value={session.location?.mapUrl || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'mapUrl', e.target.value)} className={inputStyle} /></div>
                  </div>

                  {/* Form Builder Sederhana */}
                  <div className="mt-6 pt-4 border-t border-slate-700">
                     <p className="text-xs text-white font-bold mb-3 uppercase">Pertanyaan Tambahan RSVP (Opsional)</p>
                     {session.questions.map((q, qIndex) => (
                        <div key={q.id} className="flex gap-2 mb-2">
                           <input type="text" placeholder="Ex: Alamat Kirim Souvenir" value={q.text} onChange={(e) => handleQuestionChange(sIndex, qIndex, 'text', e.target.value)} className={`${inputStyle} flex-1`} />
                           <button type="button" onClick={() => removeQuestion(sIndex, qIndex)} className="px-4 bg-red-900/30 text-red-400 rounded-xl hover:bg-red-900/50">✕</button>
                        </div>
                     ))}
                     <button type="button" onClick={() => addQuestion(sIndex)} className="text-xs text-[#D4AF37] font-bold mt-2">+ Tambah Pertanyaan</button>
                  </div>

                </div>
              </div>
            ))}
            <button type="button" onClick={addSession} className="w-full py-3 border border-dashed border-[#D4AF37] text-[#D4AF37] rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-[#D4AF37]/10 transition">
              + Tambah Rangkaian Acara Lain
            </button>
          </SectionAccordion>

          {/* ========================================================= */}
          {/* SECTION 4: GALLERY FOTO */}
          {/* ========================================================= */}
          <SectionAccordion title={`4. Galeri Foto (${galleryFiles.length}/5)`} isOpen={openSection === 'gallery'} onToggle={() => toggleSection('gallery')}>
             <div className="space-y-4">
                <p className="text-sm text-gray-400">Pilih maksimal 5 foto terbaik Anda untuk ditampilkan di halaman undangan.</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                   {galleryFiles.map((gf, i) => (
                      <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-slate-700">
                         <img src={gf.preview} alt={`Galeri ${i}`} className="w-full h-full object-cover" />
                         <button type="button" onClick={() => removeGalleryImage(i)} className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            Hapus
                         </button>
                      </div>
                   ))}
                   {galleryFiles.length < 5 && (
                      <label className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-dashed rounded-xl cursor-pointer hover:border-[#D4AF37] border-slate-600 bg-slate-800">
                         <span className="text-2xl text-slate-500 mb-2">+</span>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Pilih Foto</span>
                         <input type="file" multiple accept="image/*" className="hidden" onChange={handleGallerySelect} />
                      </label>
                   )}
                </div>
             </div>
          </SectionAccordion>

          {/* ========================================================= */}
          {/* SECTION 5: DIGITAL GIFT / REKENING */}
          {/* ========================================================= */}
          <SectionAccordion title="5. Amplop Digital / Rekening" isOpen={openSection === 'gifts'} onToggle={() => toggleSection('gifts')}>
            <p className="text-sm text-gray-400 mb-6">Tamu dapat memberikan hadiah secara digital melalui nomor rekening di bawah ini.</p>
            {eventDetails.digitalGifts.map((gift, index) => (
              <div key={gift.id} className="p-5 border border-slate-700 bg-slate-800/30 rounded-xl mb-4 relative flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/4">
                  <label className={labelStyle}>Nama Bank / E-Wallet</label>
                  <input type="text" placeholder="BCA / Mandiri / GoPay" value={gift.bankName} onChange={(e) => handleGiftChange(gift.id, 'bankName', e.target.value)} className={inputStyle} />
                </div>
                <div className="w-full md:w-1/3">
                  <label className={labelStyle}>Nomor Rekening</label>
                  <input type="text" value={gift.accountNumber} onChange={(e) => handleGiftChange(gift.id, 'accountNumber', e.target.value)} className={inputStyle} />
                </div>
                <div className="w-full md:w-1/3">
                  <label className={labelStyle}>Atas Nama (a/n)</label>
                  <input type="text" value={gift.accountName} onChange={(e) => handleGiftChange(gift.id, 'accountName', e.target.value)} className={inputStyle} />
                </div>
                <button type="button" onClick={() => removeGift(gift.id)} className="w-full md:w-auto px-4 py-3 bg-red-900/30 text-red-400 rounded-xl hover:bg-red-900/50 font-bold text-sm">✕</button>
              </div>
            ))}
            <button type="button" onClick={addGift} className="w-full py-3 border border-dashed border-[#D4AF37] text-[#D4AF37] rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-[#D4AF37]/10 transition">
              + Tambah Rekening Lain
            </button>
          </SectionAccordion>

          {/* TOMBOL SUBMIT */}
          <div className="flex justify-between items-center pt-6 mt-10 border-t border-slate-800">
            <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition text-gray-400 hover:text-white">
               Batal
            </button>
            <button type="submit" disabled={isLoading} className="px-10 py-4 rounded-xl text-slate-900 font-bold uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 bg-[#D4AF37] hover:bg-[#FFDF73]">
              {isLoading ? '⏳ Menyimpan Undangan...' : '✨ Publish Undangan Digital'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
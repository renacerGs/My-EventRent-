import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// --- HELPER COMPONENT: ACCORDION SECTION (Clean White) ---
const SectionAccordion = ({ title, isOpen, onToggle, children }) => (
  <div className="bg-white border border-gray-200 rounded-[24px] shadow-sm overflow-hidden mb-6 transition-all duration-300 hover:shadow-md">
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-8 py-6 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition-colors"
    >
      <h2 className="text-xl font-black uppercase tracking-widest text-gray-900">{title}</h2>
      <span className={`text-purple-600 text-2xl transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
        ▼
      </span>
    </button>
    <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100 p-8 border-t border-gray-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        {children}
    </div>
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

  const [openSection, setOpenSection] = useState('basic'); 
  
  const toggleSection = (sectionName) => {
    setOpenSection(prev => prev === sectionName ? null : sectionName);
  };

  const [formData, setFormData] = useState({
    title: '', description: '', eventStart: '', eventEnd: '', phone: '', 
    category: 'Personal',
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

  const [eventDetails, setEventDetails] = useState({
    openingMessage: '',
    closingMessage: '',
    profiles: [
      { id: crypto.randomUUID(), fullName: '', nickName: '', role: 'Tuan Rumah', address: '', photoUrl: null }
    ],
    digitalGifts: [
      { id: crypto.randomUUID(), bankName: '', accountNumber: '', accountName: '' }
    ]
  });

  const [galleryFiles, setGalleryFiles] = useState([]); 
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  const [showCropModal, setShowCropModal] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); 

  const handleEventChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleDetailsChange = (e) => setEventDetails({ ...eventDetails, [e.target.name]: e.target.value });

  const handleProfileChange = (id, field, value) => {
    setEventDetails(prev => ({
      ...prev,
      profiles: prev.profiles.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const addProfile = () => {
    setEventDetails(prev => ({
      ...prev,
      profiles: [...prev.profiles, { id: crypto.randomUUID(), fullName: '', nickName: '', role: 'Co-Host', address: '', photoUrl: null }]
    }));
  };

  const removeProfile = (id) => {
    setEventDetails(prev => ({ ...prev, profiles: prev.profiles.filter(p => p.id !== id) }));
  };

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
    e.target.value = null; 
  };

  const removeGalleryImage = (indexToRemove) => {
    setGalleryFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

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

  const uploadImageToSupabase = async (base64OrFile, folderPath) => {
    let fileToUpload;
    if (typeof base64OrFile === 'string' && base64OrFile.startsWith('data:image')) {
       const res = await fetch(base64OrFile);
       fileToUpload = await res.blob();
    } else {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageBase64) return alert("Poster/Cover Utama wajib diupload!");
    setIsLoading(true);
    try {
      const coverUrl = await uploadImageToSupabase(imageBase64, 'cover');
      const uploadedProfiles = await Promise.all(eventDetails.profiles.map(async (prof) => {
         if (prof.photoUrl && prof.photoUrl.startsWith('data:image')) {
            const url = await uploadImageToSupabase(prof.photoUrl, `profile-${prof.id}`);
            return { ...prof, photoUrl: url };
         }
         return prof;
      }));
      const uploadedGallery = await Promise.all(galleryFiles.map(async (gf) => {
         return await uploadImageToSupabase(gf.file, `gallery`);
      }));
      
      const finalEventDetails = {
         ...eventDetails,
         profiles: uploadedProfiles,
         galleryImages: uploadedGallery 
      };

      const payload = {
          ...formData,
          userId: user.id,
          img: coverUrl,
          eventDetails: finalEventDetails 
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

  const inputStyle = `w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all bg-white text-gray-900 border border-gray-300 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 shadow-sm`;
  const labelStyle = `text-xs font-bold mb-1.5 block uppercase tracking-wider text-gray-600`;

  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans relative transition-colors duration-500">
      
      {showCropModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Sesuaikan Gambar</h3>
              <button onClick={() => setShowCropModal(false)} className="text-gray-400 hover:text-red-500 font-bold">✕ Batal</button>
            </div>
            <div className="relative w-full h-[50vh] md:h-[60vh] bg-black">
              <Cropper 
                image={rawImageSrc} crop={crop} zoom={zoom} 
                aspect={cropTarget === 'cover' ? 736 / 436 : 1 / 1} 
                onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} 
              />
            </div>
            <div className="p-6 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="w-full sm:w-1/2 flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase">Zoom:</span>
                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(e.target.value)} className="w-full accent-purple-600" />
              </div>
              <button onClick={handleSaveCrop} className="w-full sm:w-auto px-8 py-3 bg-purple-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 hover:bg-purple-700 transition">
                ✔ Potong & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-8 px-6 max-w-4xl mx-auto flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-sm font-bold flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors">
            ← Kembali
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tight text-gray-900">Buat Undangan Pesta</h1>
          <p className="text-purple-600 mt-3 font-sans font-bold uppercase tracking-widest text-xs">Sistem RSVP Private untuk Acara Pribadi Anda.</p>
        </div>

        <form onSubmit={handleSubmit}>
          
          <SectionAccordion title="1. Cover & Informasi Dasar" isOpen={openSection === 'basic'} onToggle={() => toggleSection('basic')}>
            <div className="space-y-5">
              <div>
                <label className={labelStyle}>Foto Cover Acara <span className="normal-case ml-1 font-normal text-purple-600">(Wajib)</span></label>
                <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden border-purple-200 bg-purple-50 hover:bg-purple-100">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                      <span className="text-4xl mb-2">🎉</span>
                      <p className="text-xs font-bold uppercase tracking-widest text-purple-600">Upload Foto Poster/Cover</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />
                </label>
              </div>

              <div>
                <label className={labelStyle}>Nama Acara</label>
                <input type="text" name="title" placeholder="Ex: Ulang Tahun ke-20 Budi / Reuni Akbar SMA 1" value={formData.title} onChange={handleEventChange} className={inputStyle} required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Tanggal Mulai Acara</label>
                  <input type="date" name="eventStart" value={formData.eventStart} onChange={handleEventChange} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>Tanggal Selesai</label>
                  <input type="date" name="eventEnd" value={formData.eventEnd} onChange={handleEventChange} className={inputStyle} required />
                </div>
              </div>

              <div>
                <label className={labelStyle}>Kata Sambutan (Tampil di awal undangan)</label>
                <textarea name="openingMessage" placeholder="Halo teman-teman, jangan lupa datang ya ke acaraku..." value={eventDetails.openingMessage} onChange={handleDetailsChange} rows="3" className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Pesan Penutup / Dresscode (Opsional)</label>
                <textarea name="closingMessage" placeholder="Bakal seru banget kalo lo bisa dateng. Dresscode: Casual All Black!" value={eventDetails.closingMessage} onChange={handleDetailsChange} rows="3" className={inputStyle} />
              </div>
            </div>
          </SectionAccordion>

          <SectionAccordion title="2. Profil Tuan Rumah / Host" isOpen={openSection === 'profiles'} onToggle={() => toggleSection('profiles')}>
            {eventDetails.profiles.map((prof, index) => (
               <div key={prof.id} className="p-6 border border-gray-100 bg-gray-50 rounded-xl mb-6 relative shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-purple-600 font-bold uppercase tracking-widest text-sm">Profil Host {index + 1}</h3>
                    {eventDetails.profiles.length > 1 && (
                      <button type="button" onClick={() => removeProfile(prof.id)} className="text-red-500 text-xs font-bold uppercase hover:text-red-700">Hapus</button>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                     <div className="w-full md:w-1/3">
                        <label className={labelStyle}>Foto Host</label>
                        <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-full cursor-pointer overflow-hidden border-purple-200 bg-white hover:bg-purple-50 transition-colors">
                          {prof.photoUrl ? (
                            <img src={prof.photoUrl} alt="Profil" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl opacity-80">😎</span>
                          )}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, prof.id)} />
                        </label>
                     </div>
                     <div className="w-full md:w-2/3 space-y-4">
                        <div>
                           <label className={labelStyle}>Peran (Ex: Tuan Rumah / Yang Berulang Tahun)</label>
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
                     </div>
                  </div>
               </div>
            ))}
            <button type="button" onClick={addProfile} className="w-full py-3 border border-dashed border-purple-300 text-purple-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-purple-50 transition">
              + Tambah Host Lainnya
            </button>
          </SectionAccordion>

          <SectionAccordion title="3. Rangkaian Acara (Sesi)" isOpen={openSection === 'sessions'} onToggle={() => toggleSection('sessions')}>
            {formData.sessions.map((session, sIndex) => (
              <div key={session.id} className="p-6 border border-gray-100 bg-gray-50 rounded-xl mb-6 relative shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-purple-600 font-bold uppercase tracking-widest text-sm">Sesi {sIndex + 1}</h3>
                  {formData.sessions.length > 1 && (
                    <button type="button" onClick={() => removeSession(sIndex)} className="text-red-500 text-xs font-bold uppercase hover:text-red-700">Hapus Sesi</button>
                  )}
                </div>

                <div className="space-y-4">
                  <div><label className={labelStyle}>Nama Acara (Ex: Tiup Lilin / Makan Malam)</label><input type="text" value={session.name} onChange={(e) => handleSessionChange(sIndex, 'name', e.target.value)} className={inputStyle} required /></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className={labelStyle}>Tanggal</label><input type="date" value={session.date} onChange={(e) => handleSessionChange(sIndex, 'date', e.target.value)} className={inputStyle} required /></div>
                    <div><label className={labelStyle}>Jam Mulai</label><input type="time" value={session.startTime} onChange={(e) => handleSessionChange(sIndex, 'startTime', e.target.value)} className={inputStyle} required /></div>
                    <div><label className={labelStyle}>Jam Selesai</label><input type="time" value={session.endTime} onChange={(e) => handleSessionChange(sIndex, 'endTime', e.target.value)} className={inputStyle} required /></div>
                  </div>
                  <div><label className={labelStyle}>Batas Maksimal Tamu</label><input type="text" value={session.stock} onChange={(e) => { const val = e.target.value; if (val === '' || /^\d+$/.test(val)) handleSessionChange(sIndex, 'stock', val); }} className={inputStyle} required /></div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-purple-600 font-bold mb-3 uppercase">Lokasi Sesi Ini</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div><label className={labelStyle}>Nama Tempat / Cafe / Rumah</label><input type="text" value={session.location?.namePlace || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'namePlace', e.target.value)} className={inputStyle} required /></div>
                       <div><label className={labelStyle}>Kota</label><input type="text" value={session.location?.city || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'city', e.target.value)} className={inputStyle} required /></div>
                    </div>
                    <div className="mt-3"><label className={labelStyle}>Full Alamat</label><textarea value={session.location?.place || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'place', e.target.value)} rows="2" className={inputStyle} required /></div>
                    <div className="mt-3"><label className={labelStyle}>URL Google Maps</label><input type="url" value={session.location?.mapUrl || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'mapUrl', e.target.value)} className={inputStyle} /></div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                     <div className="mb-6">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-gray-500">Form Registrasi / RSVP Untuk:</p>
                        <h2 className="text-xl font-bold text-gray-900">{session.name || `Session ${sIndex + 1}`}</h2>
                     </div>
                     
                     <div className="space-y-4 mb-8 select-none opacity-60">
                        <div><label className={labelStyle}>Nama Lengkap (Bawaan)</label><input type="text" disabled className={`${inputStyle} bg-gray-100 text-gray-500 cursor-not-allowed`} value="Akan diisi oleh tamu saat RSVP" readOnly/></div>
                        <div><label className={labelStyle}>Email (Bawaan)</label><input type="text" disabled className={`${inputStyle} bg-gray-100 text-gray-500 cursor-not-allowed`} value="Akan diisi oleh tamu saat RSVP" readOnly/></div>
                        <div><label className={labelStyle}>Jumlah Orang / Plus One (Otomatis)</label><input type="text" disabled className={`${inputStyle} bg-gray-100 text-gray-500 cursor-not-allowed`} value="Akan diisi tamu" readOnly/></div>
                        <div><label className={labelStyle}>Ucapan / Pesan Singkat (Otomatis)</label><textarea disabled className={`${inputStyle} bg-gray-100 text-gray-500 cursor-not-allowed`} rows="2" value="Tamu dapat menuliskan pesan di sini" readOnly/></div>
                     </div>

                     <p className="text-xs text-gray-700 font-bold mb-3 uppercase">Pertanyaan Tambahan (Opsional)</p>
                     
                     {session.questions.map((q, qIndex) => (
                        <div key={q.id} className="border rounded-xl p-5 mb-4 shadow-sm relative border-l-4 border-gray-200 border-l-purple-500 bg-white">
                          <div className="flex flex-col md:flex-row gap-4 mb-3 w-full">
                            <div className="flex-1 min-w-0">
                              <input 
                                type="text" 
                                placeholder="Ketik pertanyaan tambahan (Ex: Request Lagu Kesukaan)" 
                                value={q.text} 
                                onChange={(e) => handleQuestionChange(sIndex, qIndex, 'text', e.target.value)} 
                                className={`${inputStyle} w-full`} 
                                required 
                              />
                            </div>
                            <div className="w-full md:w-48 shrink-0">
                              <select 
                                value={q.type} 
                                onChange={(e) => handleQuestionChange(sIndex, qIndex, 'type', e.target.value)} 
                                className={`${inputStyle} w-full cursor-pointer font-semibold`}
                              >
                                <option value="Text">Teks Singkat</option>
                                <option value="Dropdown">Dropdown</option>
                                <option value="Checkbox">Checkbox</option>
                              </select>
                            </div>
                          </div>

                          {q.type === 'Text' && (
                            <input type="text" placeholder="Kolom jawaban teks (diisi peserta nanti)" disabled className={`${inputStyle} bg-gray-50 cursor-not-allowed opacity-70`} />
                          )}

                          {(q.type === 'Dropdown' || q.type === 'Checkbox') && (
                            <div className="pl-4 border-l-2 mt-4 space-y-2 border-purple-200">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Atur Pilihan Jawaban:</label>
                              {q.options?.map((opt, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-3">
                                  <div className="text-purple-600 shrink-0">
                                    {q.type === 'Checkbox' ? (
                                      <div className="w-4 h-4 border-2 border-purple-400 rounded-sm"></div>
                                    ) : (
                                      <div className="w-4 h-4 border-2 border-purple-400 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                                      </div>
                                    )}
                                  </div>
                                  <input 
                                    type="text" 
                                    placeholder={`Opsi ${optIndex + 1}`} 
                                    value={opt} 
                                    onChange={(e) => updateQuestionOption(sIndex, qIndex, optIndex, e.target.value)} 
                                    className={`${inputStyle} py-2 flex-1`} 
                                    required 
                                  />
                                  {q.options.length > 1 && (
                                    <button type="button" onClick={() => removeQuestionOption(sIndex, qIndex, optIndex)} className="w-8 h-8 flex items-center justify-center rounded-lg font-bold transition text-gray-400 hover:text-red-500 hover:bg-gray-100">
                                      ✕
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button type="button" onClick={() => addQuestionOption(sIndex, qIndex)} className="text-xs font-bold mt-2 px-3 py-1.5 rounded-lg transition-colors text-purple-600 hover:bg-purple-50">
                                + Tambah Opsi
                              </button>
                            </div>
                          )}

                          <div className="flex justify-end items-center gap-4 mt-6 pt-4 border-t border-gray-100">
                            <button type="button" onClick={() => removeQuestion(sIndex, qIndex)} className="text-xs font-bold uppercase tracking-widest transition text-gray-400 hover:text-red-500">Hapus Form</button>
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer uppercase tracking-widest select-none text-gray-700">
                              Wajib Isi
                              <input type="checkbox" checked={q.isRequired} onChange={(e) => handleQuestionChange(sIndex, qIndex, 'isRequired', e.target.checked)} className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300" />
                            </label>
                          </div>
                        </div>
                     ))}
                     
                     <button type="button" onClick={() => addQuestion(sIndex)} className="text-sm font-bold flex items-center gap-2 mt-4 transition text-purple-600 hover:text-purple-800">
                        <span className="text-xl">⊕</span> Tambah Pertanyaan Ekstra
                     </button>
                  </div>

                </div>
              </div>
            ))}
            <button type="button" onClick={addSession} className="w-full py-3 border border-dashed border-purple-300 text-purple-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-purple-50 transition">
              + Tambah Rangkaian Acara Lain
            </button>
          </SectionAccordion>

          <SectionAccordion title={`4. Galeri Foto (${galleryFiles.length}/5)`} isOpen={openSection === 'gallery'} onToggle={() => toggleSection('gallery')}>
             <div className="space-y-4">
                <p className="text-sm text-gray-500">Pilih maksimal 5 foto keseruan atau foto lo untuk meramaikan halaman undangan.</p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                   {galleryFiles.map((gf, i) => (
                      <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-gray-200 shadow-sm">
                         <img src={gf.preview} alt={`Galeri ${i}`} className="w-full h-full object-cover" />
                         {/* FIX: z-index ditinggikan biar ga tenggelam saat hover */}
                         <button type="button" onClick={() => removeGalleryImage(i)} className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            Hapus
                         </button>
                      </div>
                   ))}
                   {galleryFiles.length < 5 && (
                      <label className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-dashed rounded-xl cursor-pointer transition-all border-purple-200 bg-white hover:bg-purple-50">
                         <span className="text-2xl text-purple-400 opacity-80 mb-2">+</span>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">Pilih Foto</span>
                         <input type="file" multiple accept="image/*" className="hidden" onChange={handleGallerySelect} />
                      </label>
                   )}
                </div>
             </div>
          </SectionAccordion>

          <SectionAccordion title="5. Kado Digital / Patungan (Opsional)" isOpen={openSection === 'gifts'} onToggle={() => toggleSection('gifts')}>
            <p className="text-sm text-gray-500 mb-6">Tamu bisa langsung transfer hadiah atau patungan via rekening / e-wallet di bawah.</p>
            {eventDetails.digitalGifts.map((gift, index) => (
              <div key={gift.id} className="p-5 border border-gray-200 bg-gray-50 rounded-xl mb-4 relative flex flex-col md:flex-row gap-4 items-end shadow-sm">
                <div className="w-full md:w-1/4">
                  <label className={labelStyle}>Nama Bank / E-Wallet</label>
                  <input type="text" placeholder="BCA / Mandiri / GoPay / DANA" value={gift.bankName} onChange={(e) => handleGiftChange(gift.id, 'bankName', e.target.value)} className={inputStyle} />
                </div>
                <div className="w-full md:w-1/3">
                  <label className={labelStyle}>Nomor Rekening / No. HP</label>
                  <input type="text" value={gift.accountNumber} onChange={(e) => handleGiftChange(gift.id, 'accountNumber', e.target.value)} className={inputStyle} />
                </div>
                <div className="w-full md:w-1/3">
                  <label className={labelStyle}>Atas Nama (a/n)</label>
                  <input type="text" value={gift.accountName} onChange={(e) => handleGiftChange(gift.id, 'accountName', e.target.value)} className={inputStyle} />
                </div>
                <button type="button" onClick={() => removeGift(gift.id)} className="w-full md:w-auto px-4 py-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 font-bold text-sm transition">✕</button>
              </div>
            ))}
            <button type="button" onClick={addGift} className="w-full py-3 border border-dashed border-purple-300 text-purple-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-purple-50 transition">
              + Tambah Rekening Lain
            </button>
          </SectionAccordion>

          <div className="flex justify-between items-center pt-6 mt-10 border-t border-gray-200">
            <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition text-gray-500 hover:text-gray-800">
               Batal
            </button>
            <button type="submit" disabled={isLoading} className="px-10 py-4 rounded-xl text-white font-bold uppercase tracking-widest text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50 bg-purple-600 hover:bg-purple-700">
              {isLoading ? '⏳ Menyimpan...' : '🎉 Publish Undangan'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
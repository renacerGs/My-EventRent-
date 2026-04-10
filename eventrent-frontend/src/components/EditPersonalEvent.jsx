import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

// 🔥 IMPORT KOMPONEN DARI FOLDER SHARED
import CustomDatePicker from './shared/CustomDatePicker';
import CustomTimePicker from './shared/CustomTimePicker';

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

const formatDateForInput = (dateStr) => {
  if (!dateStr || dateStr.includes('TBA') || dateStr.includes('-')) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } catch (err) { return ''; }
};

export default function EditPersonalEvent() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const userId = user?.id; // 👇 FIX 1: Hindari Infinite Loop di useEffect

  const [openSection, setOpenSection] = useState('theme'); 
  
  const toggleSection = (sectionName) => {
    setOpenSection(prev => prev === sectionName ? null : sectionName);
  };

  const [formData, setFormData] = useState({
    title: '', description: '', eventStart: '', eventEnd: '', phone: '', 
    category: 'Personal',
    isPrivate: true, 
    location: { namePlace: '', place: '', city: '', province: '', mapUrl: '' }, 
    sessions: []
  });

  const [eventDetails, setEventDetails] = useState({
    templateType: 'ThemeBirthday',
    quote: '',
    openingMessage: '',
    closingMessage: '',
    profiles: [],
    digitalGifts: []
  });

  const [galleryFiles, setGalleryFiles] = useState([]); 
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(''); 
  const [isLoading, setIsLoading] = useState(true); 
  const [isSaving, setIsSaving] = useState(false); // 👇 Tambah State ini
  const [showSuccessModal, setShowSuccessModal] = useState(false); // 👇 Tambah State ini

  const [showCropModal, setShowCropModal] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); 

  // 🔥 FETCH DATA LAMA DARI DATABASE
  useEffect(() => {
    if (!userId) { navigate('/'); return; }

    const fetchEventData = async () => {
      try {
        const res = await fetch(`https://my-event-rent.vercel.app/api/events/${id}`);
        const data = await res.json();

        const formattedSessions = (data.sessions || []).map(s => ({
          id: s.id,
          name: s.name,
          date: formatDateForInput(s.date),
          startTime: s.start_time || '',
          endTime: s.end_time || '',
          stock: s.stock || '',
          location: {
            namePlace: s.name_place || '',
            city: s.city || '',
            place: s.place || '',
            mapUrl: s.map_url || ''
          },
          questions: (s.questions || []).map(q => ({
            id: q.id,
            text: q.question_text || '',
            type: q.answer_type || 'Text',
            isRequired: q.is_required !== undefined ? q.is_required : true,
            options: q.options || ['']
          }))
        }));

        setFormData({
          title: data.title || '',
          description: data.description || '',
          eventStart: formatDateForInput(data.date_start) || '',
          eventEnd: formatDateForInput(data.date_end) || '',
          phone: data.phone || '',
          category: 'Personal',
          isPrivate: true,
          location: data.location || { namePlace: '', place: '', city: '', province: '', mapUrl: '' },
          sessions: formattedSessions 
        });

        if (data.img) {
          setImagePreview(data.img);
          setImageBase64(data.img); 
        }

        let details = data.eventDetails || data.event_details || {};
        if (typeof details === 'string') details = JSON.parse(details);

        setEventDetails({
          templateType: details.templateType || 'ThemeBirthday',
          quote: details.quote || '',
          openingMessage: details.openingMessage || '',
          closingMessage: details.closingMessage || '',
          profiles: details.profiles?.length > 0 ? details.profiles : [{ id: crypto.randomUUID(), fullName: '', nickName: '', role: 'Tuan Rumah', address: '', parentsInfo: '', photoUrl: null }],
          digitalGifts: details.digitalGifts || details.digital_gifts || []
        });

        if (details.galleryImages && details.galleryImages.length > 0) {
          const captions = details.galleryCaptions || [];
          const loadedGallery = details.galleryImages.map((url, i) => ({
            file: url, 
            preview: url,
            caption: captions[i] || ''
          }));
          setGalleryFiles(loadedGallery);
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Gagal mengambil data event:", err);
        setIsLoading(false);
      }
    };

    if (id) fetchEventData();
  }, [id, navigate, userId]); // 👇 FIX 2: Dependency pakai userId, BUKAN user object

  const handleEventChange = (e) => {
    if (e && e.target) {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (e && e.name && e.value !== undefined) {
      setFormData(prev => ({ ...prev, [e.name]: e.value }));
    }
  };

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setEventDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileChange = (profId, field, value) => {
    setEventDetails(prev => ({ ...prev, profiles: prev.profiles.map(p => p.id === profId ? { ...p, [field]: value } : p) }));
  };
  const addProfile = () => setEventDetails(prev => ({ ...prev, profiles: [...prev.profiles, { id: crypto.randomUUID(), fullName: '', nickName: '', role: 'Co-Host', address: '', parentsInfo: '', photoUrl: null }] }));
  const removeProfile = (profId) => setEventDetails(prev => ({ ...prev, profiles: prev.profiles.filter(p => p.id !== profId) }));

  const handleGiftChange = (giftId, field, value) => {
    setEventDetails(prev => ({ ...prev, digitalGifts: prev.digitalGifts.map(g => g.id === giftId ? { ...g, [field]: value } : g) }));
  };
  const addGift = () => setEventDetails(prev => ({ ...prev, digitalGifts: [...prev.digitalGifts, { id: crypto.randomUUID(), bankName: '', accountNumber: '', accountName: '' }] }));
  const removeGift = (giftId) => setEventDetails(prev => ({ ...prev, digitalGifts: prev.digitalGifts.filter(g => g.id !== giftId) }));

  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files);
    if (galleryFiles.length + files.length > 5) return toast.error("Maksimal hanya 5 foto galeri!");
    const newFiles = files.map(file => ({ file, preview: URL.createObjectURL(file), caption: '' }));
    setGalleryFiles(prev => [...prev, ...newFiles]);
    e.target.value = null; 
  };
  const handleGalleryCaptionChange = (index, text) => {
    const updatedGallery = [...galleryFiles];
    updatedGallery[index].caption = text;
    setGalleryFiles(updatedGallery);
  };
  const removeGalleryImage = (indexToRemove) => setGalleryFiles(prev => prev.filter((_, index) => index !== indexToRemove));

  const handleImageChange = (e, target = 'cover') => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setRawImageSrc(reader.result); setCropTarget(target); setShowCropModal(true); };
      reader.readAsDataURL(file);
    }
    e.target.value = null; 
  };
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels), []);
  const handleSaveCrop = async () => {
    try {
      const croppedImageBase64 = await getCroppedImg(rawImageSrc, croppedAreaPixels);
      if (cropTarget === 'cover') { setImagePreview(croppedImageBase64); setImageBase64(croppedImageBase64); } 
      else { setEventDetails(prev => ({ ...prev, profiles: prev.profiles.map(p => p.id === cropTarget ? { ...p, photoUrl: croppedImageBase64 } : p) })); }
      setShowCropModal(false); setCropTarget(null);
    } catch (e) { console.error(e); toast.error('Gagal memotong gambar!'); }
  };

  const handleSessionLocationChange = (sIndex, field, value) => {
    setFormData(prev => {
      const updated = JSON.parse(JSON.stringify(prev.sessions));
      if (!updated[sIndex].location) updated[sIndex].location = { namePlace: '', place: '', city: '', province: '', mapUrl: '' };
      updated[sIndex].location[field] = value;
      return { ...prev, sessions: updated };
    });
  };

  const handleSessionChange = (index, field, value) => {
    setFormData(prev => {
      const updated = JSON.parse(JSON.stringify(prev.sessions));
      updated[index][field] = value;
      return { ...prev, sessions: updated };
    });
  };

  const addSession = () => {
    setFormData(prev => ({ ...prev, sessions: [...prev.sessions, { id: crypto.randomUUID(), name: '', description: '', date: '', startTime: '', endTime: '', contactPerson: '', typeEvent: 'Free', price: '0', stock: '', ticketDesc: '', location: { namePlace: '', place: '', city: '', province: '', mapUrl: '' }, questions: [{ id: crypto.randomUUID(), text: '', type: 'Text', isRequired: true, options: [''] }] }] }));
  };

  const removeSession = (indexToRemove) => {
    setFormData(prev => {
      if (prev.sessions.length <= 1) { toast.error("Minimal harus ada 1 session untuk event ini!"); return prev; }
      return { ...prev, sessions: prev.sessions.filter((_, index) => index !== indexToRemove) };
    });
  };

  const handleQuestionChange = (sIndex, qIndex, field, value) => {
    setFormData(prev => {
      const updated = JSON.parse(JSON.stringify(prev.sessions));
      updated[sIndex].questions[qIndex][field] = value;
      if (field === 'type' && (value === 'Dropdown' || value === 'Checkbox')) {
        if (!updated[sIndex].questions[qIndex].options || updated[sIndex].questions[qIndex].options.length === 0) updated[sIndex].questions[qIndex].options = [''];
      }
      return { ...prev, sessions: updated };
    });
  };

  const addQuestion = (sIndex) => {
    setFormData(prev => {
      const updated = JSON.parse(JSON.stringify(prev.sessions));
      updated[sIndex].questions.push({ id: crypto.randomUUID(), text: '', type: 'Text', isRequired: true, options: [''] });
      return { ...prev, sessions: updated };
    });
  };

  const removeQuestion = (sIndex, qIndex) => {
    setFormData(prev => {
      const updated = JSON.parse(JSON.stringify(prev.sessions));
      updated[sIndex].questions = updated[sIndex].questions.filter((_, i) => i !== qIndex);
      return { ...prev, sessions: updated };
    });
  };

  const addQuestionOption = (sIndex, qIndex) => {
    setFormData(prev => {
      const updated = JSON.parse(JSON.stringify(prev.sessions));
      updated[sIndex].questions[qIndex].options.push('');
      return { ...prev, sessions: updated };
    });
  };

  const updateQuestionOption = (sIndex, qIndex, optIndex, value) => {
    setFormData(prev => {
      const updated = JSON.parse(JSON.stringify(prev.sessions));
      updated[sIndex].questions[qIndex].options[optIndex] = value;
      return { ...prev, sessions: updated };
    });
  };

  const removeQuestionOption = (sIndex, qIndex, optIndex) => {
    setFormData(prev => {
      const updated = JSON.parse(JSON.stringify(prev.sessions));
      updated[sIndex].questions[qIndex].options.splice(optIndex, 1);
      return { ...prev, sessions: updated };
    });
  };

  const uploadImageToSupabase = async (base64OrFileOrUrl, folderPath) => {
    if (!base64OrFileOrUrl) return null;
    if (typeof base64OrFileOrUrl === 'string' && base64OrFileOrUrl.startsWith('http')) return base64OrFileOrUrl;

    let fileToUpload;
    if (typeof base64OrFileOrUrl === 'string' && base64OrFileOrUrl.startsWith('data:image')) {
       const res = await fetch(base64OrFileOrUrl);
       fileToUpload = await res.blob();
    } else {
       fileToUpload = base64OrFileOrUrl;
    }
    const fileExt = fileToUpload.type === 'image/webp' ? 'webp' : fileToUpload.name ? fileToUpload.name.split('.').pop() : 'jpg';
    const fileName = `${folderPath}-${Date.now()}-${Math.floor(Math.random()*1000)}.${fileExt}`;
    const { data, error } = await supabase.storage.from('event-posters').upload(fileName, fileToUpload, { contentType: fileToUpload.type || 'image/jpeg', upsert: false });
    if (error) throw new Error("Gagal mengunggah gambar ke Supabase.");
    const { data: publicUrlData } = supabase.storage.from('event-posters').getPublicUrl(fileName);
    return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageBase64) return toast.error("Poster/Cover Utama wajib diupload!");
    if (!formData.eventStart || !formData.eventEnd) return toast.error("Harap isi Tanggal Mulai dan Selesai Event!");
    
    setIsSaving(true);
    try {
      const coverUrl = await uploadImageToSupabase(imageBase64, 'cover');
      const uploadedProfiles = await Promise.all(eventDetails.profiles.map(async (prof) => {
         if (prof.photoUrl && !prof.photoUrl.startsWith('http')) {
            const url = await uploadImageToSupabase(prof.photoUrl, `profile-${prof.id}`);
            return { ...prof, photoUrl: url };
         }
         return prof;
      }));
      const uploadedGallery = await Promise.all(galleryFiles.map(async (gf) => {
         return await uploadImageToSupabase(gf.file, `gallery`);
      }));
      const galleryCaptions = galleryFiles.map(gf => gf.caption || "");

      const finalEventDetails = { ...eventDetails, profiles: uploadedProfiles, galleryImages: uploadedGallery, galleryCaptions: galleryCaptions };

      // 👇 FIX 3: Payload LENGKAP dengan kategori
      const payload = { 
        ...formData, 
        userId: userId, 
        img: coverUrl, 
        eventDetails: finalEventDetails, 
        sessions: formData.sessions,
        category: 'Personal', // 👈 WAJIB ADA BIAR GAK NGILANG!
        isPrivate: true       // 👈 WAJIB ADA
      };

      const response = await fetch(`https://my-event-rent.vercel.app/api/events/${id}?userId=${userId}`, {
          method: 'PUT', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });

      if (response.ok) {
          setShowSuccessModal(true); // 👈 Panggil Modal Pop Up Premium
          setTimeout(() => { navigate('/manage'); }, 1500); 
      } else {
          const errorData = await response.json();
          toast.error("Gagal update undangan: " + (errorData.message || 'Server error'));
      }
    } catch (error) {
        console.error(error);
        toast.error(error.message || "Gagal terhubung ke server.");
    } finally {
        setIsSaving(false);
    }
  };

  const inputStyle = `w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all bg-white text-gray-900 border border-gray-300 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 shadow-sm`;
  const labelStyle = `text-xs font-bold mb-1.5 block uppercase tracking-wider text-gray-600`;

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="font-bold text-purple-600 animate-pulse">Menyiapkan Data Event...</p></div>;
  }

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
              <Cropper image={rawImageSrc} crop={crop} zoom={zoom} aspect={cropTarget === 'cover' ? 736 / 436 : 1 / 1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-6 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="w-full sm:w-1/2 flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 uppercase">Zoom:</span>
                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(e.target.value)} className="w-full accent-purple-600" />
              </div>
              <button onClick={handleSaveCrop} className="w-full sm:w-auto px-8 py-3 bg-purple-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95 hover:bg-purple-700 transition">✔ Potong & Simpan</button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-8 px-6 max-w-4xl mx-auto flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-sm font-bold flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors">← Kembali</button>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tight text-gray-900">Edit Undangan Pesta</h1>
          <p className="text-purple-600 mt-3 font-sans font-bold uppercase tracking-widest text-xs">Ubah rincian data acara pribadi Anda.</p>
        </div>

        <form onSubmit={handleSubmit}>
          
          <SectionAccordion title="★ PILIH TEMA UNDANGAN" isOpen={openSection === 'theme'} onToggle={() => toggleSection('theme')}>
            <p className="text-gray-500 text-sm mb-6 font-medium">Pilih desain visual yang paling cocok untuk acara kamu.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div onClick={() => setEventDetails({ ...eventDetails, templateType: 'ThemeBirthday' })} className={`cursor-pointer rounded-3xl border-4 p-4 text-center transition-all ${eventDetails.templateType === 'ThemeBirthday' ? 'border-pink-400 bg-pink-50' : 'border-gray-200 bg-white hover:border-pink-200'}`}>
                  <div className="h-32 bg-gradient-to-br from-pink-300 via-blue-200 to-yellow-200 rounded-2xl mb-4 flex items-center justify-center shadow-inner"><span className="text-5xl drop-shadow-md">🎈</span></div>
                  <p className={`font-black uppercase tracking-widest text-xs ${eventDetails.templateType === 'ThemeBirthday' ? 'text-pink-600' : 'text-gray-600'}`}>Birthday Pastel</p>
               </div>
               <div onClick={() => setEventDetails({ ...eventDetails, templateType: 'ThemePartyNight' })} className={`cursor-pointer rounded-3xl border-4 p-4 text-center transition-all ${eventDetails.templateType === 'ThemePartyNight' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-purple-200'}`}>
                  <div className="h-32 bg-slate-900 rounded-2xl mb-4 flex items-center justify-center shadow-inner relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/50 to-transparent"></div>
                    <span className="text-5xl drop-shadow-[0_0_15px_rgba(168,85,247,0.8)] relative z-10">🪩</span>
                  </div>
                  <p className={`font-black uppercase tracking-widest text-xs ${eventDetails.templateType === 'ThemePartyNight' ? 'text-purple-600' : 'text-gray-600'}`}>Party / Night</p>
               </div>
               <div onClick={() => setEventDetails({ ...eventDetails, templateType: 'ThemeCasual' })} className={`cursor-pointer rounded-3xl border-4 p-4 text-center transition-all ${eventDetails.templateType === 'ThemeCasual' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white hover:border-emerald-200'}`}>
                  <div className="h-32 bg-gradient-to-br from-emerald-100 to-teal-50 rounded-2xl mb-4 flex items-center justify-center shadow-inner"><span className="text-5xl drop-shadow-sm opacity-80">🌿</span></div>
                  <p className={`font-black uppercase tracking-widest text-xs ${eventDetails.templateType === 'ThemeCasual' ? 'text-emerald-600' : 'text-gray-600'}`}>Clean Casual</p>
               </div>
            </div>
          </SectionAccordion>

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
              <div><label className={labelStyle}>Nama Acara</label><input type="text" name="title" placeholder="Ex: Ulang Tahun ke-20 Budi / Reuni Akbar SMA 1" value={formData.title} onChange={handleEventChange} className={inputStyle} required /></div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Tanggal Mulai Acara</label>
                  <CustomDatePicker theme="personal" value={formData.eventStart} onChange={(newDate) => handleEventChange({ name: 'eventStart', value: newDate })} placeholder="Pilih Tanggal Mulai" />
                </div>
                <div>
                  <label className={labelStyle}>Tanggal Selesai</label>
                  <CustomDatePicker theme="personal" value={formData.eventEnd} onChange={(newDate) => handleEventChange({ name: 'eventEnd', value: newDate })} placeholder="Pilih Tanggal Selesai" />
                </div>
              </div>

              <div><label className={labelStyle}>Kata Sambutan (Tampil di awal undangan)</label><textarea name="openingMessage" placeholder="Halo teman-teman, jangan lupa datang ya ke acaraku..." value={eventDetails.openingMessage} onChange={handleDetailsChange} rows="3" className={inputStyle} /></div>
              <div><label className={labelStyle}>Pesan Penutup / Dresscode (Opsional)</label><textarea name="closingMessage" placeholder="Bakal seru banget kalo lo bisa dateng. Dresscode: Casual All Black!" value={eventDetails.closingMessage} onChange={handleDetailsChange} rows="3" className={inputStyle} /></div>
            </div>
          </SectionAccordion>

          <SectionAccordion title="2. Profil Tuan Rumah / Host" isOpen={openSection === 'profiles'} onToggle={() => toggleSection('profiles')}>
            {eventDetails.profiles.map((prof, index) => (
               <div key={prof.id} className="p-6 border border-gray-100 bg-gray-50 rounded-xl mb-6 relative shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-purple-600 font-bold uppercase tracking-widest text-sm">Profil Host {index + 1}</h3>
                    {eventDetails.profiles.length > 1 && (<button type="button" onClick={() => removeProfile(prof.id)} className="text-red-500 text-xs font-bold uppercase hover:text-red-700">Hapus</button>)}
                  </div>
                  <div className="flex flex-col md:flex-row gap-6">
                     <div className="w-full md:w-1/3">
                        <label className={labelStyle}>Foto Host</label>
                        <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-full cursor-pointer overflow-hidden border-purple-200 bg-white hover:bg-purple-50 transition-colors">
                          {prof.photoUrl ? (<img src={prof.photoUrl} alt="Profil" className="w-full h-full object-cover" />) : (<span className="text-2xl opacity-80">😎</span>)}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, prof.id)} />
                        </label>
                     </div>
                     <div className="w-full md:w-2/3 space-y-4">
                        <div><label className={labelStyle}>Peran</label><input type="text" value={prof.role} onChange={(e) => handleProfileChange(prof.id, 'role', e.target.value)} className={inputStyle} required /></div>
                        <div><label className={labelStyle}>Nama Lengkap</label><input type="text" value={prof.fullName} onChange={(e) => handleProfileChange(prof.id, 'fullName', e.target.value)} className={inputStyle} required /></div>
                        <div><label className={labelStyle}>Nama Panggilan</label><input type="text" value={prof.nickName} onChange={(e) => handleProfileChange(prof.id, 'nickName', e.target.value)} className={inputStyle} /></div>
                     </div>
                  </div>
               </div>
            ))}
            <button type="button" onClick={addProfile} className="w-full py-3 border border-dashed border-purple-300 text-purple-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-purple-50 transition">+ Tambah Host Lainnya</button>
          </SectionAccordion>

          <SectionAccordion title="3. Rangkaian Acara (Sesi)" isOpen={openSection === 'sessions'} onToggle={() => toggleSection('sessions')}>
            {formData.sessions.map((session, sIndex) => (
              <div key={session.id || sIndex} className="p-6 border border-gray-100 bg-gray-50 rounded-xl mb-6 relative shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-purple-600 font-bold uppercase tracking-widest text-sm">Sesi {sIndex + 1}</h3>
                  {formData.sessions.length > 1 && (<button type="button" onClick={() => removeSession(sIndex)} className="text-red-500 text-xs font-bold uppercase hover:text-red-700">Hapus Sesi</button>)}
                </div>
                <div className="space-y-4">
                  <div><label className={labelStyle}>Nama Acara</label><input type="text" value={session.name} onChange={(e) => handleSessionChange(sIndex, 'name', e.target.value)} className={inputStyle} required /></div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelStyle}>Tanggal</label>
                      <CustomDatePicker theme="personal" value={session.date} onChange={(newDate) => handleSessionChange(sIndex, 'date', newDate)} placeholder="Pilih Tanggal Sesi" />
                    </div>
                    <div>
                      <label className={labelStyle}>Jam Mulai</label>
                      <CustomTimePicker theme="personal" value={session.startTime} onChange={(newTime) => handleSessionChange(sIndex, 'startTime', newTime)} placeholder="08:00" />
                    </div>
                    <div>
                      <label className={labelStyle}>Jam Selesai</label>
                      <CustomTimePicker theme="personal" value={session.endTime} onChange={(newTime) => handleSessionChange(sIndex, 'endTime', newTime)} placeholder="10:00" />
                    </div>
                  </div>

                  <div><label className={labelStyle}>Batas Maksimal Tamu</label><input type="text" value={session.stock} onChange={(e) => { const val = e.target.value; if (val === '' || /^\d+$/.test(val)) handleSessionChange(sIndex, 'stock', val); }} className={inputStyle} required /></div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-purple-600 font-bold mb-3 uppercase">Lokasi Sesi Ini</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div><label className={labelStyle}>Nama Tempat</label><input type="text" value={session.location?.namePlace || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'namePlace', e.target.value)} className={inputStyle} required /></div>
                       <div><label className={labelStyle}>Kota</label><input type="text" value={session.location?.city || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'city', e.target.value)} className={inputStyle} required /></div>
                    </div>
                    <div className="mt-3"><label className={labelStyle}>Full Alamat</label><textarea value={session.location?.place || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'place', e.target.value)} rows="2" className={inputStyle} required /></div>
                    <div className="mt-3"><label className={labelStyle}>URL Google Maps</label><input type="url" value={session.location?.mapUrl || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'mapUrl', e.target.value)} className={inputStyle} /></div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                     <div className="mb-6"><p className="text-[10px] font-black uppercase tracking-widest mb-1 text-gray-500">Form Registrasi / RSVP Untuk:</p><h2 className="text-xl font-bold text-gray-900">{session.name || `Session ${sIndex + 1}`}</h2></div>
                     
                     <div className="space-y-4 mb-8 select-none opacity-60">
                        <div><label className={labelStyle}>Nama Lengkap (Bawaan)</label><input type="text" disabled className={`${inputStyle} bg-gray-100 text-gray-500 cursor-not-allowed`} value="Akan diisi oleh tamu saat RSVP" readOnly/></div>
                        <div><label className={labelStyle}>Email (Bawaan)</label><input type="text" disabled className={`${inputStyle} bg-gray-100 text-gray-500 cursor-not-allowed`} value="Akan diisi oleh tamu saat RSVP" readOnly/></div>
                        <div><label className={labelStyle}>Jumlah Orang / Plus One (Otomatis)</label><input type="text" disabled className={`${inputStyle} bg-gray-100 text-gray-500 cursor-not-allowed`} value="Akan diisi tamu" readOnly/></div>
                        <div><label className={labelStyle}>Ucapan / Pesan Singkat (Otomatis)</label><textarea disabled className={`${inputStyle} bg-gray-100 text-gray-500 cursor-not-allowed`} rows="2" value="Tamu dapat menuliskan pesan di sini" readOnly/></div>
                     </div>

                     <p className="text-xs text-gray-700 font-bold mb-3 uppercase">Pertanyaan Tambahan (Opsional)</p>
                     {session.questions?.map((q, qIndex) => (
                        <div key={q.id || qIndex} className="border rounded-xl p-5 mb-4 shadow-sm relative border-l-4 border-gray-200 border-l-purple-500 bg-white">
                          <div className="flex flex-col md:flex-row gap-4 mb-3 w-full">
                            <div className="flex-1 min-w-0">
                              <input type="text" placeholder="Ketik pertanyaan tambahan (Ex: Request Lagu Kesukaan)" value={q.text} onChange={(e) => handleQuestionChange(sIndex, qIndex, 'text', e.target.value)} className={`${inputStyle} w-full`} required />
                            </div>
                            <div className="w-full md:w-48 shrink-0">
                              <select value={q.type} onChange={(e) => handleQuestionChange(sIndex, qIndex, 'type', e.target.value)} className={`${inputStyle} w-full cursor-pointer font-semibold`}>
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
                                  <input type="text" placeholder={`Opsi ${optIndex + 1}`} value={opt} onChange={(e) => updateQuestionOption(sIndex, qIndex, optIndex, e.target.value)} className={`${inputStyle} py-2 flex-1`} required />
                                  {q.options.length > 1 && (
                                    <button type="button" onClick={() => removeQuestionOption(sIndex, qIndex, optIndex)} className="w-8 h-8 flex items-center justify-center rounded-lg font-bold transition text-gray-400 hover:text-red-500 hover:bg-gray-100">✕</button>
                                  )}
                                </div>
                              ))}
                              <button type="button" onClick={() => addQuestionOption(sIndex, qIndex)} className="text-xs font-bold mt-2 px-3 py-1.5 rounded-lg transition-colors text-purple-600 hover:bg-purple-50">+ Tambah Opsi</button>
                            </div>
                          )}
                          <div className="flex justify-end items-center gap-4 mt-6 pt-4 border-t border-gray-100">
                            <button type="button" onClick={() => removeQuestion(sIndex, qIndex)} className="text-xs font-bold uppercase tracking-widest transition text-gray-400 hover:text-red-500">Hapus Form</button>
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer uppercase tracking-widest select-none text-gray-700">
                              Wajib Isi
                              <input type="checkbox" checked={q.isRequired} onChange={(e) => handleQuestionChange(sIndex, qIndex, 'isRequired', e.target.checked)} className="w-4 h-4 rounded text-purple-600 focus:ring-purple-50 border-gray-300" />
                            </label>
                          </div>
                        </div>
                     ))}
                     <button type="button" onClick={() => addQuestion(sIndex)} className="text-sm font-bold flex items-center gap-2 mt-4 transition text-purple-600 hover:text-purple-800"><span className="text-xl">⊕</span> Tambah Pertanyaan Ekstra</button>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addSession} className="w-full py-3 border border-dashed border-purple-300 text-purple-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-purple-50 transition">+ Tambah Rangkaian Acara Lain</button>
          </SectionAccordion>

          <SectionAccordion title={`4. Galeri Foto (${galleryFiles.length}/5)`} isOpen={openSection === 'gallery'} onToggle={() => toggleSection('gallery')}>
             <div className="space-y-4">
                <p className="text-sm text-gray-500">Pilih maksimal 5 foto, dan berikan caption (opsional).</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                   {galleryFiles.map((gf, i) => (
                      <div key={i} className="group flex flex-col gap-2">
                         <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <img src={gf.preview} alt={`Galeri ${i}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeGalleryImage(i)} className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">Hapus</button>
                         </div>
                         <input type="text" placeholder="Tulis caption foto ini..." value={gf.caption} onChange={(e) => handleGalleryCaptionChange(i, e.target.value)} className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 bg-white" />
                      </div>
                   ))}
                   {galleryFiles.length < 5 && (
                      <label className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-dashed rounded-xl cursor-pointer transition-all border-purple-200 bg-white hover:bg-purple-50">
                         <span className="text-2xl text-purple-400 opacity-80 mb-2">+</span><span className="text-[10px] font-bold uppercase tracking-widest text-purple-600">Pilih Foto</span>
                         <input type="file" multiple accept="image/*" className="hidden" onChange={handleGallerySelect} />
                      </label>
                   )}
                </div>
             </div>
          </SectionAccordion>

          <SectionAccordion title="5. Kado Digital / Patungan (Opsional)" isOpen={openSection === 'gifts'} onToggle={() => toggleSection('gifts')}>
            <p className="text-sm text-gray-500 mb-6">Tamu bisa langsung transfer hadiah atau patungan via rekening / e-wallet di bawah.</p>
            {eventDetails.digitalGifts.map((gift, index) => (
              <div key={gift.id} className="p-5 border border-gray-200 bg-gray-50 rounded-xl mb-4 flex flex-col md:flex-row gap-4 items-end shadow-sm">
                <div className="w-full md:w-1/4"><label className={labelStyle}>Bank/E-Wallet</label><input type="text" placeholder="BCA / Mandiri / GoPay / DANA" value={gift.bankName} onChange={(e) => handleGiftChange(gift.id, 'bankName', e.target.value)} className={inputStyle} /></div>
                <div className="w-full md:w-1/3"><label className={labelStyle}>No. Rekening/HP</label><input type="text" value={gift.accountNumber} onChange={(e) => handleGiftChange(gift.id, 'accountNumber', e.target.value)} className={inputStyle} /></div>
                <div className="w-full md:w-1/3"><label className={labelStyle}>Atas Nama (a/n)</label><input type="text" value={gift.accountName} onChange={(e) => handleGiftChange(gift.id, 'accountName', e.target.value)} className={inputStyle} /></div>
                <button type="button" onClick={() => removeGift(gift.id)} className="w-full md:w-auto px-4 py-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 font-bold text-sm transition">✕</button>
              </div>
            ))}
            <button type="button" onClick={addGift} className="w-full py-3 border border-dashed border-purple-300 text-purple-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-purple-50 transition">+ Tambah Rekening Lain</button>
          </SectionAccordion>

          <div className="flex justify-between items-center pt-6 mt-10 border-t border-gray-200">
            <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition text-gray-500 hover:text-gray-800">Batal</button>
            <button type="submit" disabled={isSaving} className="px-10 py-4 rounded-xl text-white font-bold uppercase tracking-widest text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50 bg-purple-600 hover:bg-purple-700">
              {isSaving ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
            </button>
          </div>

        </form>
      </main>

      {/* 👇 FIX 4: MODAL SUCCESS ALA PERSONAL EVENT (Warna Ungu) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl transform transition-all text-center">
            <div className="w-20 h-20 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 border-[6px] border-purple-100">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Sukses!</h3>
            <p className="text-gray-500 text-sm font-medium mb-2">
              Undangan Personal berhasil diperbarui.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
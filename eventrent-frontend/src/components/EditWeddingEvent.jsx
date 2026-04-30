import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';

// 🔥 IMPORT KOMPONEN DARI FOLDER SHARED
import CustomDatePicker from './shared/CustomDatePicker';
import CustomTimePicker from './shared/CustomTimePicker';

const SectionAccordion = ({ title, isOpen, onToggle, children }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-[24px] shadow-sm overflow-hidden mb-6 transition-all duration-300 hover:border-slate-700">
    <button type="button" onClick={onToggle} className="w-full px-8 py-6 flex justify-between items-center bg-slate-800/50 hover:bg-slate-800 transition-colors">
      <h2 className="text-xl font-black uppercase tracking-widest text-white">{title}</h2>
      <span className={`text-[#D4AF37] text-2xl transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
    </button>
    <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100 p-8 border-t border-slate-800' : 'max-h-0 opacity-0 overflow-hidden'}`}>
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
  const userId = user?.id; 

  const [openSection, setOpenSection] = useState('template'); 
  const toggleSection = (sectionName) => setOpenSection(prev => prev === sectionName ? null : sectionName);

  const [formData, setFormData] = useState({
    title: '', eventStart: '', eventEnd: '',
    openingMessage: '', closingMessage: '', quote: '',
    bgMusicUrl: '', 
    oldImgUrl: '', templateId: 'elegant-gold',
    sessions: [] 
  });

  const [profiles, setProfiles] = useState([]);
  const [digitalGifts, setDigitalGifts] = useState([]);
  
  const [existingGallery, setExistingGallery] = useState([]);
  const [newGalleryFiles, setNewGalleryFiles] = useState([]);

  const [imagePreview, setImagePreview] = useState(null);
  const [newCoverBase64, setNewCoverBase64] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false); 

  const [showCropModal, setShowCropModal] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropTarget, setCropTarget] = useState(null); 

  // 🔥 FETCH DATA LAMA (DITAMBAHIN KTP TOKEN)
  useEffect(() => {
    if (!userId) { navigate('/'); return; }

    const fetchEventData = async () => {
      try {
        const token = localStorage.getItem('supabase_token');
        if (!token) throw new Error("No token found");

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}` // 👈 Token lu wajib ikut
          }
        });

        if (!res.ok) throw new Error("Failed to load event data");
        const found = await res.json();

        if (found.category !== 'Wedding' && found.category !== 'Personal' && !found.is_private) {
          toast.error("This is not a Private/Wedding Event. Please use the Edit Public Event menu.");
          navigate('/manage');
          return;
        }

        const details = found.event_details || {};
        
        const formattedSessions = (found.sessions || []).map(s => ({
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
          title: found.title || '',
          eventStart: formatDateForInput(found.date_start), 
          eventEnd: formatDateForInput(found.date_end),
          openingMessage: details.openingMessage || '',
          closingMessage: details.closingMessage || '',
          quote: details.quote || '',
          bgMusicUrl: details.bgMusicUrl || '', 
          oldImgUrl: found.img || '',
          templateId: details.templateId || 'elegant-gold',
          sessions: formattedSessions
        });

        setImagePreview(found.img);
        setProfiles(details.profiles || []);
        setDigitalGifts(details.digitalGifts || []);
        setExistingGallery(details.galleryImages || []);
        
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load event details");
        setIsLoading(false);
        navigate('/manage');
      }
    };

    fetchEventData();
  }, [id, navigate, userId]);

  const handleChange = (e) => {
    if (e && e.target) {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (e && e.name && e.value !== undefined) {
      setFormData(prev => ({ ...prev, [e.name]: e.value }));
    }
  };

  const handleProfileChange = (profId, field, value) => { setProfiles(prev => prev.map(p => p.id === profId ? { ...p, [field]: value } : p)); };
  const addProfile = () => setProfiles(prev => [...prev, { id: crypto.randomUUID(), fullName: '', nickName: '', role: '', parentsInfo: '', address: '', photoUrl: null }]);
  const removeProfile = (profId) => setProfiles(prev => prev.filter(p => p.id !== profId));

  const handleGiftChange = (giftId, field, value) => { setDigitalGifts(prev => prev.map(g => g.id === giftId ? { ...g, [field]: value } : g)); };
  const addGift = () => setDigitalGifts(prev => [...prev, { id: crypto.randomUUID(), bankName: '', accountNumber: '', accountName: '' }]);
  const removeGift = (giftId) => setDigitalGifts(prev => prev.filter(g => g.id !== giftId));

  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files);
    if (existingGallery.length + newGalleryFiles.length + files.length > 5) return toast.error("Maximum of 5 gallery photos allowed!");
    const newFiles = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setNewGalleryFiles(prev => [...prev, ...newFiles]);
    e.target.value = null; 
  };
  const removeExistingGallery = (index) => setExistingGallery(prev => prev.filter((_, i) => i !== index));
  const removeNewGallery = (index) => setNewGalleryFiles(prev => prev.filter((_, i) => i !== index));

  const handleImageChange = (e, target = 'cover') => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { setRawImageSrc(reader.result); setCropTarget(target); setShowCropModal(true); };
      reader.readAsDataURL(file);
    }
    e.target.value = null; 
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels), []);

  const handleSaveCrop = async () => {
    try {
      const croppedBase64 = await getCroppedImg(rawImageSrc, croppedAreaPixels);
      if (cropTarget === 'cover') { setImagePreview(croppedBase64); setNewCoverBase64(croppedBase64); } 
      else { setProfiles(prev => prev.map(p => p.id === cropTarget ? { ...p, photoUrl: croppedBase64 } : p)); }
      setShowCropModal(false); setCropTarget(null);
    } catch (e) { toast.error('Failed to crop image!'); }
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
      if (prev.sessions.length <= 1) { toast.error("There must be at least 1 session for this event!"); return prev; }
      return { ...prev, sessions: prev.sessions.filter((_, index) => index !== indexToRemove) };
    });
  };

  const handleQuestionChange = (sIndex, qIndex, field, value) => {
    setFormData(prev => {
      const updated = JSON.parse(JSON.stringify(prev.sessions));
      updated[sIndex].questions[qIndex][field] = value;
      if (field === 'type' && (value === 'Dropdown' || value === 'Checkbox')) { 
        if (!updated[sIndex].questions[qIndex].options || updated[sIndex].questions[qIndex].options.length === 0) { 
          updated[sIndex].questions[qIndex].options = ['']; 
        } 
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

  const uploadToSupabase = async (fileOrBase64, folderPath) => {
    if (!fileOrBase64) return null;
    if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('http')) return fileOrBase64;
    let fileToUpload;
    if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:image')) { const res = await fetch(fileOrBase64); fileToUpload = await res.blob(); } 
    else { fileToUpload = fileOrBase64; }
    const fileExt = fileToUpload.type === 'image/webp' ? 'webp' : fileToUpload.name ? fileToUpload.name.split('.').pop() : 'jpg';
    const fileName = `${folderPath}-${Date.now()}-${Math.floor(Math.random()*1000)}.${fileExt}`;
    const { error } = await supabase.storage.from('event-posters').upload(fileName, fileToUpload, { contentType: fileToUpload.type || 'image/jpeg' });
    if (error) throw new Error("Failed to upload image.");
    const { data } = supabase.storage.from('event-posters').getPublicUrl(fileName); return data.publicUrl;
  };

  // 🔥 SUBMIT UPDATE EVENT (DITAMBAHIN KTP TOKEN JUGA)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('supabase_token');
      if (!token) throw new Error("Authentication failed. Please login again.");

      const finalCoverUrl = newCoverBase64 ? await uploadToSupabase(newCoverBase64, 'cover') : formData.oldImgUrl;
      const uploadedProfiles = await Promise.all(profiles.map(async (prof) => {
         if (prof.photoUrl && prof.photoUrl.startsWith('data:image')) { const url = await uploadToSupabase(prof.photoUrl, `profile-${prof.id}`); return { ...prof, photoUrl: url }; }
         return prof;
      }));
      const uploadedNewGallery = await Promise.all(newGalleryFiles.map(async (gf) => { return await uploadToSupabase(gf.file, `gallery`); }));
      const finalGallery = [...existingGallery, ...uploadedNewGallery];

      const finalEventDetails = {
         templateId: formData.templateId, 
         openingMessage: formData.openingMessage,
         closingMessage: formData.closingMessage,
         quote: formData.quote,
         bgMusicUrl: formData.bgMusicUrl, 
         profiles: uploadedProfiles,
         digitalGifts: digitalGifts,
         galleryImages: finalGallery
      };

      const payload = {
        title: formData.title,
        eventStart: formData.eventStart, 
        eventEnd: formData.eventEnd,     
        img: finalCoverUrl,
        eventDetails: finalEventDetails,
        sessions: formData.sessions,
        category: 'Wedding', 
        isPrivate: true      
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}?userId=${userId}`, { 
        method: 'PUT', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 👈 Jangan lupa KTP bro!
        }, 
        body: JSON.stringify(payload) 
      });

      if (res.ok) { 
        setShowSuccessModal(true);
        setTimeout(() => { navigate('/manage'); }, 1500); 
      } else { 
        toast.error("Failed to update. Make sure you are the creator of this event.");
      }
    } catch (err) { console.error(err); toast.error(err.message || "An error occurred."); }
    finally { setIsSaving(false); }
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center font-bold text-[#D4AF37]">Loading...</div>;

  const inputStyle = `w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-slate-800 text-white border border-slate-700 placeholder-gray-500 focus:border-[#D4AF37] focus:ring-[#D4AF37]`;
  const labelStyle = `text-xs font-bold mb-1.5 block uppercase tracking-wider text-gray-300`;

  const TEMPLATES = [
    { id: 'elegant-gold', name: 'Elegant Gold', desc: 'Luxury, Black & Gold', style: 'bg-slate-950 border-slate-700 text-[#D4AF37]' },
    { id: 'floral-white', name: 'Floral White', desc: 'Clean, White & Aesthetic', style: 'bg-gray-100 border-gray-300 text-gray-800' },
    { id: 'dark-romantic', name: 'Dark Romantic', desc: 'Elegant, Maroon Red', style: 'bg-rose-950 border-rose-900 text-rose-300' }
  ];

  return (
    <div className="bg-slate-950 min-h-screen pb-20 font-sans relative">
      
      {showCropModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Adjust Image</h3>
              <button onClick={() => setShowCropModal(false)} className="text-gray-400 hover:text-red-500 font-bold">✕ Cancel</button>
            </div>
            <div className="relative w-full h-[50vh] bg-black">
              <Cropper image={rawImageSrc} crop={crop} zoom={zoom} aspect={cropTarget === 'cover' ? 736 / 436 : 1 / 1} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-6 bg-slate-900 flex justify-between items-center gap-4">
              <div className="w-1/2 flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 uppercase">Zoom:</span>
                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(e.target.value)} className="w-full accent-[#D4AF37]" />
              </div>
              <button onClick={handleSaveCrop} className="px-8 py-3 bg-[#D4AF37] text-slate-900 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#FFDF73]">✔ Save</button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-8 px-6 max-w-4xl mx-auto flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Edit Wedding</h1>
        <button onClick={() => navigate('/manage')} className="text-gray-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest">Cancel</button>
      </div>

      <main className="max-w-4xl mx-auto px-6">

        <form onSubmit={handleSubmit}>

          <SectionAccordion title="1. Change Invitation Theme" isOpen={openSection === 'template'} onToggle={() => toggleSection('template')}>
            <p className="text-sm text-gray-400 mb-6">Choose your favorite theme</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TEMPLATES.map(theme => (
                <div 
                  key={theme.id}
                  onClick={() => setFormData(prev => ({...prev, templateId: theme.id}))}
                  className={`cursor-pointer rounded-2xl border-4 p-4 transition-all duration-300 ${formData.templateId === theme.id ? 'border-[#D4AF37] scale-[1.02] shadow-[0_0_20px_rgba(212,175,55,0.2)] bg-slate-800/50' : 'border-transparent hover:border-slate-700'}`}
                >
                  <div className={`w-full aspect-[4/3] rounded-xl mb-3 flex flex-col items-center justify-center border pointer-events-none ${theme.style}`}>
                    <span className="text-3xl mb-2">✨</span>
                    <span className="font-serif italic font-bold">{theme.name}</span>
                  </div>
                  <h4 className="text-white font-bold text-center text-sm">{theme.name}</h4>
                  <p className="text-gray-500 text-[10px] text-center uppercase tracking-widest mt-1">{theme.desc}</p>
                </div>
              ))}
            </div>
          </SectionAccordion>
          
          <SectionAccordion title="2. Cover & Opening Text" isOpen={openSection === 'basic'} onToggle={() => toggleSection('basic')}>
            <div className="space-y-5">
              <div>
                <label className={labelStyle}>Invitation Cover Photo</label>
                <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                  {imagePreview ? <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" /> : <span className="text-[#D4AF37]">Upload New Cover</span>}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />
                </label>
              </div>
              <div><label className={labelStyle}>Invitation Title</label><input type="text" name="title" value={formData.title} onChange={handleChange} className={inputStyle} required /></div>
              
              <div>
                <label className={labelStyle}>Background Music Link (Optional)</label>
                <input 
                  type="url" 
                  name="bgMusicUrl" 
                  placeholder="MP3 file link (E.g., https://site.com/song.mp3)" 
                  value={formData.bgMusicUrl} 
                  onChange={handleChange} 
                  className={inputStyle} 
                />
                <p className="text-[10px] text-slate-500 mt-1.5 font-bold tracking-wide">Leave blank to use our default romantic song.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Event Start Date</label>
                  <CustomDatePicker 
                    theme="wedding"
                    value={formData.eventStart} 
                    onChange={(val) => handleChange({ name: 'eventStart', value: val })} 
                    placeholder="Select Start Date"
                  />
                </div>
                <div>
                  <label className={labelStyle}>Event End Date</label>
                  <CustomDatePicker 
                    theme="wedding"
                    value={formData.eventEnd} 
                    onChange={(val) => handleChange({ name: 'eventEnd', value: val })} 
                    placeholder="Select End Date"
                  />
                </div>
              </div>

              <div><label className={labelStyle}>Opening Message (Cover)</label><textarea name="openingMessage" value={formData.openingMessage} onChange={handleChange} rows="3" className={inputStyle} /></div>
              <div><label className={labelStyle}>Closing Message</label><textarea name="closingMessage" value={formData.closingMessage} onChange={handleChange} rows="3" className={inputStyle} /></div>
              <div><label className={labelStyle}>Romantic Quotes</label><textarea name="quote" value={formData.quote} onChange={handleChange} rows="2" className={inputStyle} /></div>
            </div>
          </SectionAccordion>

          <SectionAccordion title="3. Couple Profiles" isOpen={openSection === 'profiles'} onToggle={() => toggleSection('profiles')}>
            {profiles.map((prof, index) => (
               <div key={prof.id} className="p-6 border border-slate-700 bg-slate-800/30 rounded-xl mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[#D4AF37] font-bold uppercase text-sm">Profile {index + 1}</h3>
                    {profiles.length > 1 && <button type="button" onClick={() => removeProfile(prof.id)} className="text-red-400 text-xs font-bold uppercase">Remove</button>}
                  </div>
                  <div className="flex flex-col md:flex-row gap-6">
                     <div className="w-full md:w-1/3">
                        <label className={labelStyle}>Couple Photo</label>
                        <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-full cursor-pointer overflow-hidden border-slate-600 bg-slate-800 hover:border-[#D4AF37]">
                          {prof.photoUrl ? <img src={prof.photoUrl} alt="Profil" className="w-full h-full object-cover" /> : <span className="text-2xl">📸</span>}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, prof.id)} />
                        </label>
                     </div>
                     <div className="w-full md:w-2/3 space-y-4">
                        <div><label className={labelStyle}>Role</label><input type="text" value={prof.role} onChange={(e) => handleProfileChange(prof.id, 'role', e.target.value)} className={inputStyle} /></div>
                        <div><label className={labelStyle}>Full Name</label><input type="text" value={prof.fullName} onChange={(e) => handleProfileChange(prof.id, 'fullName', e.target.value)} className={inputStyle} /></div>
                        <div><label className={labelStyle}>Parents Information</label><textarea value={prof.parentsInfo} onChange={(e) => handleProfileChange(prof.id, 'parentsInfo', e.target.value)} rows="2" className={inputStyle} /></div>
                     </div>
                  </div>
               </div>
            ))}
            <button type="button" onClick={addProfile} className="w-full py-3 border border-dashed border-[#D4AF37] text-[#D4AF37] rounded-xl font-bold uppercase text-xs hover:bg-[#D4AF37]/10">+ Add Another Profile</button>
          </SectionAccordion>

          <SectionAccordion title="4. Event Series (Sessions)" isOpen={openSection === 'sessions'} onToggle={() => toggleSection('sessions')}>
             {formData.sessions.map((session, sIndex) => (
              <div key={session.id || sIndex} className="p-6 border border-slate-700 bg-slate-800/30 rounded-xl mb-6 relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[#D4AF37] font-bold uppercase tracking-widest text-sm">Session {sIndex + 1}</h3>
                  {formData.sessions.length > 1 && <button type="button" onClick={() => removeSession(sIndex)} className="text-red-400 text-xs font-bold uppercase">Remove Session</button>}
                </div>
                <div className="space-y-4">
                  <div><label className={labelStyle}>Event Name</label><input type="text" value={session.name} onChange={(e) => handleSessionChange(sIndex, 'name', e.target.value)} className={inputStyle} required /></div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className={labelStyle}>Date</label>
                      <CustomDatePicker 
                        theme="wedding"
                        value={session.date} 
                        onChange={(val) => handleSessionChange(sIndex, 'date', val)} 
                        placeholder="Select Session Date"
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Start Time</label>
                      <CustomTimePicker 
                        theme="wedding"
                        value={session.startTime} 
                        onChange={(val) => handleSessionChange(sIndex, 'startTime', val)} 
                        placeholder="08:00"
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>End Time</label>
                      <CustomTimePicker 
                        theme="wedding"
                        value={session.endTime} 
                        onChange={(val) => handleSessionChange(sIndex, 'endTime', val)} 
                        placeholder="10:00"
                      />
                    </div>
                  </div>

                  <div><label className={labelStyle}>Maximum Guest Limit</label><input type="text" value={session.stock} onChange={(e) => { const val = e.target.value; if (val === '' || /^\d+$/.test(val)) handleSessionChange(sIndex, 'stock', val); }} className={inputStyle} required /></div>
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-[#D4AF37] font-bold mb-3 uppercase">Session Location</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div><label className={labelStyle}>Venue Name</label><input type="text" value={session.location?.namePlace || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'namePlace', e.target.value)} className={inputStyle} required /></div>
                       <div><label className={labelStyle}>City</label><input type="text" value={session.location?.city || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'city', e.target.value)} className={inputStyle} required /></div>
                    </div>
                    <div className="mt-3"><label className={labelStyle}>Full Address</label><textarea value={session.location?.place || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'place', e.target.value)} rows="2" className={inputStyle} required /></div>
                    
                    <div className="mt-3"><label className={labelStyle}>Google Maps URL</label><input type="url" value={session.location?.mapUrl || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'mapUrl', e.target.value)} className={inputStyle} /></div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-700">
                     <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-[#D4AF37]">Custom Questions (Optional)</p>
                     {session.questions?.map((q, qIndex) => (
                        <div key={q.id || qIndex} className="border rounded-xl p-5 mb-4 shadow-sm border-l-4 border-slate-700 border-l-[#D4AF37] bg-slate-800/30">
                          <div className="flex flex-col md:flex-row gap-4 mb-3 w-full">
                            <div className="flex-1 min-w-0">
                              <input type="text" placeholder="Type additional question" value={q.text} onChange={(e) => handleQuestionChange(sIndex, qIndex, 'text', e.target.value)} className={`${inputStyle} w-full`} required />
                            </div>
                            <div className="w-full md:w-48 shrink-0">
                              <select value={q.type} onChange={(e) => handleQuestionChange(sIndex, qIndex, 'type', e.target.value)} className={`${inputStyle} w-full cursor-pointer`}>
                                <option value="Text">Short Text</option>
                                <option value="Dropdown">Dropdown</option>
                                <option value="Checkbox">Checkbox</option>
                              </select>
                            </div>
                          </div>
                          {(q.type === 'Dropdown' || q.type === 'Checkbox') && (
                            <div className="pl-4 border-l-2 mt-4 space-y-2 border-[#D4AF37]/50">
                              {q.options?.map((opt, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-3">
                                  <input type="text" value={opt} onChange={(e) => updateQuestionOption(sIndex, qIndex, optIndex, e.target.value)} className={`${inputStyle} py-2 flex-1`} required />
                                  {q.options.length > 1 && <button type="button" onClick={() => removeQuestionOption(sIndex, qIndex, optIndex)} className="text-gray-400 hover:text-red-500 font-bold">✕</button>}
                                </div>
                              ))}
                              <button type="button" onClick={() => addQuestionOption(sIndex, qIndex)} className="text-xs text-[#D4AF37]">+ Add Option</button>
                            </div>
                          )}
                          <div className="flex justify-end gap-4 mt-4 pt-4 border-t border-slate-700">
                            <button type="button" onClick={() => removeQuestion(sIndex, qIndex)} className="text-xs text-red-400">Remove Field</button>
                          </div>
                        </div>
                     ))}
                     <button type="button" onClick={() => addQuestion(sIndex)} className="text-sm font-bold text-[#D4AF37]">⊕ Add Question</button>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addSession} className="w-full py-3 border border-dashed border-[#D4AF37] text-[#D4AF37] rounded-xl font-bold uppercase text-xs hover:bg-[#D4AF37]/10 transition">
              + Add Event Series
            </button>
          </SectionAccordion>

          <SectionAccordion title={`5. Photo Gallery (${existingGallery.length + newGalleryFiles.length}/5)`} isOpen={openSection === 'gallery'} onToggle={() => toggleSection('gallery')}>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {existingGallery.map((url, i) => (
                   <div key={`old-${i}`} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-slate-700">
                      <img src={url} alt="Old Gallery" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeExistingGallery(i)} className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100">Delete</button>
                   </div>
                ))}
                {newGalleryFiles.map((gf, i) => (
                   <div key={`new-${i}`} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-green-500/50">
                      <img src={gf.preview} alt="New Gallery" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeNewGallery(i)} className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100">Cancel</button>
                   </div>
                ))}
                {(existingGallery.length + newGalleryFiles.length) < 5 && (
                   <label className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-dashed rounded-xl cursor-pointer hover:border-[#D4AF37] border-slate-600 bg-slate-800">
                      <span className="text-2xl text-slate-500 mb-2">+</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleGallerySelect} />
                   </label>
                )}
             </div>
          </SectionAccordion>

          <SectionAccordion title="6. Digital Envelope / Bank Account" isOpen={openSection === 'gifts'} onToggle={() => toggleSection('gifts')}>
            {digitalGifts.map((gift) => (
              <div key={gift.id} className="p-5 border border-slate-700 bg-slate-800/30 rounded-xl mb-4 relative flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/4"><label className={labelStyle}>Bank / E-Wallet</label><input type="text" value={gift.bankName} onChange={(e) => handleGiftChange(gift.id, 'bankName', e.target.value)} className={inputStyle} /></div>
                <div className="w-full md:w-1/3"><label className={labelStyle}>Account Number</label><input type="text" value={gift.accountNumber} onChange={(e) => handleGiftChange(gift.id, 'accountNumber', e.target.value)} className={inputStyle} /></div>
                <div className="w-full md:w-1/3"><label className={labelStyle}>Account Name</label><input type="text" value={gift.accountName} onChange={(e) => handleGiftChange(gift.id, 'accountName', e.target.value)} className={inputStyle} /></div>
                <button type="button" onClick={() => removeGift(gift.id)} className="px-4 py-3 bg-red-900/30 text-red-400 rounded-xl hover:bg-red-900/50">✕</button>
              </div>
            ))}
            <button type="button" onClick={addGift} className="w-full py-3 border border-dashed border-[#D4AF37] text-[#D4AF37] rounded-xl font-bold uppercase text-xs">+ Add Another Account</button>
          </SectionAccordion>

          <div className="pt-6 mt-8 mb-10 flex gap-4">
            <button type="submit" disabled={isSaving} className="w-full py-4 rounded-xl text-slate-900 font-bold uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 bg-[#D4AF37] hover:bg-[#FFDF73]">
              {isSaving ? '⏳ Saving Changes...' : '✨ Update Wedding Event'}
            </button>
          </div>

        </form>
      </main>

      {/* MODAL SUCCESS (TEMA DARK GOLD) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 max-w-sm w-full shadow-2xl transform transition-all text-center">
            <div className="w-20 h-20 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6 border-[6px] border-[#D4AF37]/20">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Success!</h3>
            <p className="text-gray-400 text-sm font-medium mb-2">
              Wedding Event successfully updated ✨
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
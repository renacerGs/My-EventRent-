import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';

// 🔥 IMPORT KOMPONEN DARI FOLDER SHARED
import CustomDatePicker from './shared/CustomDatePicker';
import CustomTimePicker from './shared/CustomTimePicker';

const SectionAccordion = ({ title, isOpen, onToggle, children }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-[24px] shadow-sm overflow-hidden mb-6 transition-all duration-300">
    <button type="button" onClick={onToggle} className="w-full px-8 py-6 flex justify-between items-center bg-slate-800/50 hover:bg-slate-800 transition-colors">
      <h2 className="text-xl font-black uppercase tracking-widest text-white">{title}</h2>
      <span className={`text-[#D4AF37] text-2xl transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
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
      ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, 736, 436);
      resolve(canvas.toDataURL('image/webp', 0.6));
    };
    image.onerror = (error) => reject(error);
  });
};

export default function CreateWeddingEvent() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => { if (!user) navigate('/'); }, [user, navigate]);

  const [openSection, setOpenSection] = useState('template'); 
  const toggleSection = (sectionName) => setOpenSection(prev => prev === sectionName ? null : sectionName);

  const [formData, setFormData] = useState({
    title: '', description: '', eventStart: '', eventEnd: '', phone: '', 
    category: 'Wedding', isPrivate: true, 
    location: { namePlace: '', place: '', city: '', province: '', mapUrl: '' }, 
    sessions: [{
        id: crypto.randomUUID(), name: '', description: '', date: '', startTime: '', endTime: '', 
        contactPerson: '', typeEvent: 'Free', price: '0', stock: '', ticketDesc: '', 
        location: { namePlace: '', place: '', city: '', province: '', mapUrl: '' }, 
        questions: [{ id: crypto.randomUUID(), text: '', type: 'Text', isRequired: true, options: [''] }]
    }]
  });

  const [eventDetails, setEventDetails] = useState({
    templateId: 'elegant-gold', 
    openingMessage: '', closingMessage: '', quote: '',
    bgMusicUrl: '',
    profiles: [
      { id: crypto.randomUUID(), fullName: '', nickName: '', role: 'Groom', parentsInfo: '', address: '', photoUrl: null },
      { id: crypto.randomUUID(), fullName: '', nickName: '', role: 'Bride', parentsInfo: '', address: '', photoUrl: null }
    ],
    digitalGifts: [{ id: crypto.randomUUID(), bankName: '', accountNumber: '', accountName: '' }]
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

  const handleProfileChange = (id, field, value) => { setEventDetails(prev => ({ ...prev, profiles: prev.profiles.map(p => p.id === id ? { ...p, [field]: value } : p) })); };
  const addProfile = () => { setEventDetails(prev => ({ ...prev, profiles: [...prev.profiles, { id: crypto.randomUUID(), fullName: '', nickName: '', role: '', parentsInfo: '', address: '', photoUrl: null }] })); };
  const removeProfile = (id) => setEventDetails(prev => ({ ...prev, profiles: prev.profiles.filter(p => p.id !== id) }));

  const handleGiftChange = (id, field, value) => { setEventDetails(prev => ({ ...prev, digitalGifts: prev.digitalGifts.map(g => g.id === id ? { ...g, [field]: value } : g) })); };
  const addGift = () => { setEventDetails(prev => ({ ...prev, digitalGifts: [...prev.digitalGifts, { id: crypto.randomUUID(), bankName: '', accountNumber: '', accountName: '' }] })); };
  const removeGift = (id) => setEventDetails(prev => ({ ...prev, digitalGifts: prev.digitalGifts.filter(g => g.id !== id) }));

  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files);
    if (galleryFiles.length + files.length > 5) return toast.error("Maximum 5 gallery photos allowed!");
    const newFiles = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
    setGalleryFiles(prev => [...prev, ...newFiles]);
    e.target.value = null; 
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

  const onCropComplete = useCallback((_, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels), []);

  const handleSaveCrop = async () => {
    try {
      const croppedImageBase64 = await getCroppedImg(rawImageSrc, croppedAreaPixels);
      if (cropTarget === 'cover') { setImagePreview(croppedImageBase64); setImageBase64(croppedImageBase64); } 
      else { setEventDetails(prev => ({ ...prev, profiles: prev.profiles.map(p => p.id === cropTarget ? { ...p, photoUrl: croppedImageBase64 } : p) })); }
      setShowCropModal(false); setCropTarget(null);
    } catch (e) { toast.error('Failed to crop image!'); }
  };

  const handleSessionLocationChange = (sIndex, field, value) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions));
    if (!updated[sIndex].location) updated[sIndex].location = { namePlace: '', place: '', city: '', province: '', mapUrl: '' };
    updated[sIndex].location[field] = value; setFormData({ ...formData, sessions: updated });
  };
  const handleSessionChange = (index, field, value) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions));
    updated[index][field] = value; setFormData({ ...formData, sessions: updated });
  };
  const addSession = () => {
    setFormData(prev => ({ ...prev, sessions: [...prev.sessions, { id: crypto.randomUUID(), name: '', description: '', date: '', startTime: '', endTime: '', contactPerson: '', typeEvent: 'Free', price: '0', stock: '', ticketDesc: '', location: { namePlace: '', place: '', city: '', province: '', mapUrl: '' }, questions: [{ id: crypto.randomUUID(), text: '', type: 'Text', isRequired: true, options: [''] }] }] }));
  };
  const removeSession = (indexToRemove) => {
    if (formData.sessions.length <= 1) return toast.error("There must be at least 1 session for this event!");
    const updatedSessions = formData.sessions.filter((_, index) => index !== indexToRemove); setFormData({ ...formData, sessions: updatedSessions });
  };
  const handleQuestionChange = (sIndex, qIndex, field, value) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions));
    updated[sIndex].questions[qIndex][field] = value;
    if (field === 'type' && (value === 'Dropdown' || value === 'Checkbox')) { if (!updated[sIndex].questions[qIndex].options || updated[sIndex].questions[qIndex].options.length === 0) { updated[sIndex].questions[qIndex].options = ['']; } }
    setFormData({ ...formData, sessions: updated });
  };
  const addQuestion = (sIndex) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions)); updated[sIndex].questions.push({ id: crypto.randomUUID(), text: '', type: 'Text', isRequired: true, options: [''] }); setFormData({ ...formData, sessions: updated });
  };
  const removeQuestion = (sIndex, qIndex) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions)); updated[sIndex].questions = updated[sIndex].questions.filter((_, i) => i !== qIndex); setFormData({ ...formData, sessions: updated });
  };
  const addQuestionOption = (sIndex, qIndex) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions)); updated[sIndex].questions[qIndex].options.push(''); setFormData({ ...formData, sessions: updated });
  };
  const updateQuestionOption = (sIndex, qIndex, optIndex, value) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions)); updated[sIndex].questions[qIndex].options[optIndex] = value; setFormData({ ...formData, sessions: updated });
  };
  const removeQuestionOption = (sIndex, qIndex, optIndex) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions)); updated[sIndex].questions[qIndex].options.splice(optIndex, 1); setFormData({ ...formData, sessions: updated });
  };

  const uploadImageToSupabase = async (base64OrFile, folderPath) => {
    let fileToUpload;
    if (typeof base64OrFile === 'string' && base64OrFile.startsWith('data:image')) {
       const res = await fetch(base64OrFile); fileToUpload = await res.blob();
    } else { fileToUpload = base64OrFile; }
    const fileExt = fileToUpload.type === 'image/webp' ? 'webp' : fileToUpload.name ? fileToUpload.name.split('.').pop() : 'jpg';
    const fileName = `${folderPath}-${Date.now()}-${Math.floor(Math.random()*1000)}.${fileExt}`;
    const { data, error } = await supabase.storage.from('event-posters').upload(fileName, fileToUpload, { contentType: fileToUpload.type || 'image/jpeg', upsert: false });
    if (error) throw new Error("Failed to upload image to Supabase.");
    const { data: publicUrlData } = supabase.storage.from('event-posters').getPublicUrl(fileName); return publicUrlData.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageBase64) return toast.error("Main Poster/Cover is required!");
    if (!formData.eventStart || !formData.eventEnd) return toast.error("Please select start and end dates!");

    setIsLoading(true);
    try {
      const token = localStorage.getItem('supabase_token');

      const coverUrl = await uploadImageToSupabase(imageBase64, 'cover');
      const uploadedProfiles = await Promise.all(eventDetails.profiles.map(async (prof) => {
         if (prof.photoUrl && prof.photoUrl.startsWith('data:image')) { const url = await uploadImageToSupabase(prof.photoUrl, `profile-${prof.id}`); return { ...prof, photoUrl: url }; }
         return prof;
      }));
      const uploadedGallery = await Promise.all(galleryFiles.map(async (gf) => { return await uploadImageToSupabase(gf.file, `gallery`); }));
      
      const finalEventDetails = { ...eventDetails, profiles: uploadedProfiles, galleryImages: uploadedGallery };
      
      const payload = { ...formData, img: coverUrl, eventDetails: finalEventDetails };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events`, { 
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }, 
        body: JSON.stringify(payload) 
      });

      if (response.ok) { 
        toast.success("Wedding invitation successfully created!");
        navigate('/manage'); 
      } else { 
        const errorData = await response.json(); 
        toast.error("Failed to create invitation: " + (errorData.message || 'Server error')); 
      }
    } catch (error) { 
      console.error(error); 
      toast.error(error.message || "Failed to connect to the server."); 
    } finally { 
      setIsLoading(false); 
    }
  };

  const inputStyle = `w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-slate-800 text-white border border-slate-700 placeholder-gray-500 focus:border-[#D4AF37] focus:ring-[#D4AF37]`;
  const labelStyle = `text-xs font-bold mb-1.5 block uppercase tracking-wider text-gray-300`;

  const TEMPLATES = [
    { id: 'elegant-gold', name: 'Elegant Gold', desc: 'Luxurious, Black & Gold', style: 'bg-slate-950 border-slate-700 text-[#D4AF37]' },
    { id: 'floral-white', name: 'Floral White', desc: 'Clean, White & Aesthetic', style: 'bg-gray-100 border-gray-300 text-gray-800' },
    { id: 'dark-romantic', name: 'Dark Romantic', desc: 'Elegant, Maroon Red', style: 'bg-rose-950 border-rose-900 text-rose-300' }
  ];

  return (
    <div className="bg-slate-950 min-h-screen pb-20 font-sans relative transition-colors duration-500">
      
      {showCropModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-widest text-white">Adjust Image</h3>
              <button onClick={() => setShowCropModal(false)} className="text-gray-400 hover:text-red-500 font-bold">✕ Cancel</button>
            </div>
            <div className="relative w-full h-[50vh] md:h-[60vh] bg-black">
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

      <div className="pt-8 px-6 max-w-4xl mx-auto flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-sm font-bold flex items-center gap-2 text-[#D4AF37] hover:opacity-80 transition-colors">← Back</button>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">Create Digital Invitation</h1>
          <p className="text-[#D4AF37] mt-2 font-serif italic">Prepare an elegant RSVP for your special moment.</p>
        </div>

        <form onSubmit={handleSubmit}>

          <SectionAccordion title="1. Choose Invitation Theme" isOpen={openSection === 'template'} onToggle={() => toggleSection('template')}>
            <p className="text-sm text-gray-400 mb-6">Select a design theme for your digital invitation page.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TEMPLATES.map(theme => (
                <div 
                  key={theme.id}
                  onClick={() => setEventDetails({...eventDetails, templateId: theme.id})}
                  className={`cursor-pointer rounded-2xl border-4 p-4 transition-all duration-300 ${eventDetails.templateId === theme.id ? 'border-[#D4AF37] scale-[1.02] shadow-[0_0_20px_rgba(212,175,55,0.2)]' : 'border-transparent hover:border-slate-700'}`}
                >
                  <div className={`w-full aspect-[4/3] rounded-xl mb-3 flex flex-col items-center justify-center border ${theme.style}`}>
                    <span className="text-3xl mb-2">✨</span>
                    <span className="font-serif italic font-bold">{theme.name}</span>
                  </div>
                  <h4 className="text-white font-bold text-center text-sm">{theme.name}</h4>
                  <p className="text-gray-500 text-[10px] text-center uppercase tracking-widest mt-1">{theme.desc}</p>
                </div>
              ))}
            </div>
          </SectionAccordion>
          
          <SectionAccordion title="2. Cover & Basic Information" isOpen={openSection === 'basic'} onToggle={() => toggleSection('basic')}>
             <div className="space-y-5">
              <div>
                <label className={labelStyle}>Main Invitation Cover Photo <span className="normal-case ml-1 font-normal text-[#D4AF37]">(Required)</span></label>
                <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                  {imagePreview ? <img src={imagePreview} alt="Preview Cover" className="w-full h-full object-cover" /> : <span className="text-4xl opacity-50">🖼️</span>}
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />
                </label>
              </div>
              <div><label className={labelStyle}>Invitation Title</label><input type="text" name="title" value={formData.title} onChange={handleEventChange} className={inputStyle} required /></div>
              
              <div>
                <label className={labelStyle}>Background Music Link (Optional)</label>
                <input 
                  type="url" 
                  name="bgMusicUrl" 
                  placeholder="MP3 file link (Ex: https://site.com/song.mp3)" 
                  value={eventDetails.bgMusicUrl} 
                  onChange={handleDetailsChange} 
                  className={inputStyle} 
                />
                <p className="text-[10px] text-slate-500 mt-1.5 font-bold tracking-wide">Leave blank if you want to use our default romantic song.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Event Start Date</label>
                  <CustomDatePicker 
                    theme="wedding"
                    value={formData.eventStart} 
                    onChange={(newDate) => handleEventChange({ target: { name: 'eventStart', value: newDate }})} 
                    placeholder="Select Start Date"
                  />
                </div>
                <div>
                  <label className={labelStyle}>End Date</label>
                  <CustomDatePicker 
                    theme="wedding"
                    value={formData.eventEnd} 
                    onChange={(newDate) => handleEventChange({ target: { name: 'eventEnd', value: newDate }})} 
                    placeholder="Select End Date"
                  />
                </div>
              </div>
              
              <div><label className={labelStyle}>Opening Message (Prayer)</label><textarea name="openingMessage" value={eventDetails.openingMessage} onChange={handleDetailsChange} rows="3" className={inputStyle} /></div>
              <div><label className={labelStyle}>Closing Message</label><textarea name="closingMessage" value={eventDetails.closingMessage} onChange={handleDetailsChange} rows="3" className={inputStyle} /></div>
              <div><label className={labelStyle}>Romantic Quotes</label><textarea name="quote" value={eventDetails.quote} onChange={handleDetailsChange} rows="2" className={inputStyle} /></div>
            </div>
          </SectionAccordion>

          <SectionAccordion title="3. Couple Profiles" isOpen={openSection === 'profiles'} onToggle={() => toggleSection('profiles')}>
             {eventDetails.profiles.map((prof, index) => (
               <div key={prof.id} className="p-6 border border-slate-700 bg-slate-800/30 rounded-xl mb-6 relative">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-[#D4AF37] font-bold uppercase text-sm">Profile {index + 1}</h3>
                    {eventDetails.profiles.length > 1 && <button type="button" onClick={() => removeProfile(prof.id)} className="text-red-400 text-xs font-bold uppercase">Remove</button>}
                  </div>
                  <div className="flex flex-col md:flex-row gap-6">
                     <div className="w-full md:w-1/3">
                        <label className={labelStyle}>Couple's Photo</label>
                        <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-full cursor-pointer overflow-hidden border-slate-600 bg-slate-800 hover:border-[#D4AF37]">
                          {prof.photoUrl ? <img src={prof.photoUrl} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-2xl">📸</span>}
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, prof.id)} />
                        </label>
                     </div>
                     <div className="w-full md:w-2/3 space-y-4">
                        <div><label className={labelStyle}>Role</label><input type="text" value={prof.role} onChange={(e) => handleProfileChange(prof.id, 'role', e.target.value)} className={inputStyle} required /></div>
                        <div><label className={labelStyle}>Full Name</label><input type="text" value={prof.fullName} onChange={(e) => handleProfileChange(prof.id, 'fullName', e.target.value)} className={inputStyle} required /></div>
                        <div><label className={labelStyle}>Nickname</label><input type="text" value={prof.nickName} onChange={(e) => handleProfileChange(prof.id, 'nickName', e.target.value)} className={inputStyle} /></div>
                        <div><label className={labelStyle}>Parents Information</label><textarea value={prof.parentsInfo} onChange={(e) => handleProfileChange(prof.id, 'parentsInfo', e.target.value)} rows="2" className={inputStyle} /></div>
                     </div>
                  </div>
               </div>
            ))}
            <button type="button" onClick={addProfile} className="w-full py-3 border border-dashed border-[#D4AF37] text-[#D4AF37] rounded-xl font-bold uppercase text-xs hover:bg-[#D4AF37]/10">+ Add Another Profile</button>
          </SectionAccordion>

          <SectionAccordion title="4. Event Schedule (Sessions)" isOpen={openSection === 'sessions'} onToggle={() => toggleSection('sessions')}>
             {formData.sessions.map((session, sIndex) => (
              <div key={session.id} className="p-6 border border-slate-700 bg-slate-800/30 rounded-xl mb-6 relative">
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
                        onChange={(newDate) => handleSessionChange(sIndex, 'date', newDate)} 
                        placeholder="Select Session Date"
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>Start Time</label>
                      <CustomTimePicker 
                        theme="wedding"
                        value={session.startTime} 
                        onChange={(newTime) => handleSessionChange(sIndex, 'startTime', newTime)} 
                        placeholder="08:00"
                      />
                    </div>
                    <div>
                      <label className={labelStyle}>End Time</label>
                      <CustomTimePicker 
                        theme="wedding"
                        value={session.endTime} 
                        onChange={(newTime) => handleSessionChange(sIndex, 'endTime', newTime)} 
                        placeholder="10:00"
                      />
                    </div>
                  </div>

                  <div><label className={labelStyle}>Maximum Guest Limit</label><input type="text" value={session.stock} onChange={(e) => { const val = e.target.value; if (val === '' || /^\d+$/.test(val)) handleSessionChange(sIndex, 'stock', val); }} className={inputStyle} required /></div>
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <p className="text-xs text-[#D4AF37] font-bold mb-3 uppercase">Location for This Session</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div><label className={labelStyle}>Venue Name</label><input type="text" value={session.location?.namePlace || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'namePlace', e.target.value)} className={inputStyle} required /></div>
                       <div><label className={labelStyle}>City</label><input type="text" value={session.location?.city || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'city', e.target.value)} className={inputStyle} required /></div>
                    </div>
                    <div className="mt-3"><label className={labelStyle}>Full Address</label><textarea value={session.location?.place || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'place', e.target.value)} rows="2" className={inputStyle} required /></div>
                    <div className="mt-3"><label className={labelStyle}>Google Maps URL</label><input type="url" value={session.location?.mapUrl || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'mapUrl', e.target.value)} className={inputStyle} /></div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-700">
                     <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-[#D4AF37]">Custom Questions (Optional)</p>
                     {session.questions.map((q, qIndex) => (
                        <div key={q.id} className="border rounded-xl p-5 mb-4 shadow-sm border-l-4 border-slate-700 border-l-[#D4AF37] bg-slate-800/30">
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
                                  {q.options.length > 1 && <button type="button" onClick={() => removeQuestionOption(sIndex, qIndex, optIndex)} className="text-gray-400 hover:text-red-500">✕</button>}
                                </div>
                              ))}
                              <button type="button" onClick={() => addQuestionOption(sIndex, qIndex)} className="text-xs text-[#D4AF37]">+ Add Option</button>
                            </div>
                          )}
                          <div className="flex justify-end gap-4 mt-4 pt-4 border-t border-slate-700">
                            <button type="button" onClick={() => removeQuestion(sIndex, qIndex)} className="text-xs text-red-400">Remove</button>
                          </div>
                        </div>
                     ))}
                     <button type="button" onClick={() => addQuestion(sIndex)} className="text-sm font-bold text-[#D4AF37]">⊕ Add Question</button>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addSession} className="w-full py-3 border border-dashed border-[#D4AF37] text-[#D4AF37] rounded-xl font-bold uppercase text-xs hover:bg-[#D4AF37]/10 transition">
              + Add Another Event Schedule
            </button>
          </SectionAccordion>

          <SectionAccordion title={`5. Photo Gallery (${galleryFiles.length}/5)`} isOpen={openSection === 'gallery'} onToggle={() => toggleSection('gallery')}>
             <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {galleryFiles.map((gf, i) => (
                    <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-slate-700">
                      <img src={gf.preview} alt="Gallery" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeGalleryImage(i)} className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold opacity-0 group-hover:opacity-100">Remove</button>
                    </div>
                ))}
                {galleryFiles.length < 5 && (
                  <label className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-dashed rounded-xl cursor-pointer hover:border-[#D4AF37] border-slate-600 bg-slate-800">
                    <span className="text-2xl text-slate-500">+</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleGallerySelect} />
                  </label>
                )}
             </div>
          </SectionAccordion>

          <SectionAccordion title="6. Digital Envelopes (Optional)" isOpen={openSection === 'gifts'} onToggle={() => toggleSection('gifts')}>
             {eventDetails.digitalGifts.map((gift) => (
              <div key={gift.id} className="p-5 border border-slate-700 bg-slate-800/30 rounded-xl mb-4 flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:w-1/4"><label className={labelStyle}>Bank</label><input type="text" value={gift.bankName} onChange={(e) => handleGiftChange(gift.id, 'bankName', e.target.value)} className={inputStyle} /></div>
                <div className="w-full md:w-1/3"><label className={labelStyle}>Account No.</label><input type="text" value={gift.accountNumber} onChange={(e) => handleGiftChange(gift.id, 'accountNumber', e.target.value)} className={inputStyle} /></div>
                <div className="w-full md:w-1/3"><label className={labelStyle}>Account Name</label><input type="text" value={gift.accountName} onChange={(e) => handleGiftChange(gift.id, 'accountName', e.target.value)} className={inputStyle} /></div>
                <button type="button" onClick={() => removeGift(gift.id)} className="px-4 py-3 bg-red-900/30 text-red-400 rounded-xl">✕</button>
              </div>
            ))}
            <button type="button" onClick={addGift} className="w-full py-3 border border-dashed border-[#D4AF37] text-[#D4AF37] rounded-xl font-bold text-xs hover:bg-[#D4AF37]/10">+ Add Another Account</button>
          </SectionAccordion>

          <div className="flex justify-between items-center pt-6 mt-10 border-t border-slate-800">
            <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition text-gray-500 hover:text-white">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-10 py-4 rounded-xl text-slate-900 font-bold uppercase tracking-widest text-sm shadow-xl active:scale-95 disabled:opacity-50 bg-[#D4AF37] hover:bg-[#FFDF73]">
              {isLoading ? '⏳ Saving...' : '🎉 Publish Invitation'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
}
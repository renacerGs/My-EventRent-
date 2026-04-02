import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { createClient } from '@supabase/supabase-js';

// 🔥 IMPORT KOMPONEN DARI FOLDER SHARED
import CustomDatePicker from './shared/CustomDatePicker';
import CustomTimePicker from './shared/CustomTimePicker';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

export default function CreatePublicEvent() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  const categoriesList = ['Music', 'Food', 'Tech', 'Religious', 'Arts', 'Sports'];

  const [formData, setFormData] = useState({
    title: '', description: '', eventStart: '', eventEnd: '', phone: '', category: '',
    isPrivate: false, 
    location: { namePlace: '', place: '', city: '', province: '', mapUrl: '' },
    sessions: [
      {
        id: crypto.randomUUID(), name: '', description: '', date: '', startTime: '', endTime: '', 
        contactPerson: '', typeEvent: 'Paid', price: '', stock: '', ticketDesc: '',
        location: { namePlace: '', place: '', city: '', province: '', mapUrl: '' }, 
        questions: [{ id: crypto.randomUUID(), text: '', type: 'Text', isRequired: true, options: [''] }]
      }
    ]
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  const [showCropModal, setShowCropModal] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleEventChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleLocationChange = (e) => {
    setFormData({ ...formData, location: { ...formData.location, [e.target.name]: e.target.value }});
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRawImageSrc(reader.result); 
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
      setImagePreview(croppedImageBase64); 
      setImageBase64(croppedImageBase64); 
      setShowCropModal(false); 
    } catch (e) {
      console.error(e);
      alert('Gagal memotong gambar!');
    }
  };

  const handleSessionChange = (index, field, value) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions));
    updated[index][field] = value;
    if (field === 'typeEvent' && value === 'Free') updated[index]['price'] = 0;
    setFormData({ ...formData, sessions: updated });
  };

  const addSession = () => {
    setFormData(prev => ({
      ...prev,
      sessions: [...prev.sessions, {
        id: crypto.randomUUID(), name: '', description: '', date: '', startTime: '', endTime: '', 
        contactPerson: '', typeEvent: 'Paid', price: '0', stock: '', ticketDesc: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageBase64) return alert("Poster/Gambar wajib diupload!");
    if (!formData.eventStart || !formData.eventEnd) return alert("Harap isi Tanggal Mulai dan Selesai Event!");
    
    setIsLoading(true);
    try {
      const resBase64 = await fetch(imageBase64);
      const imageBlob = await resBase64.blob();
      
      const fileName = `poster-${Date.now()}.webp`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-posters')
        .upload(fileName, imageBlob, { contentType: 'image/webp', upsert: false });

      if (uploadError) throw new Error("Gagal mengunggah gambar ke Supabase.");

      const { data: publicUrlData } = supabase.storage.from('event-posters').getPublicUrl(fileName);
      
      const payload = {
          ...formData,
          userId: user.id,
          img: publicUrlData.publicUrl 
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
          alert("Gagal membuat acara: " + (errorData.message || 'Server error'));
      }
    } catch (error) {
        alert(error.message || "Gagal terhubung ke server.");
    } finally {
        setIsLoading(false);
    }
  };

  const inputStyle = `w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-white text-gray-900 border border-gray-300 placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500`;
  const labelStyle = `text-xs font-bold mb-1.5 block uppercase tracking-wider text-gray-700`;

  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans relative transition-colors duration-500">
      
      {showCropModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Sesuaikan Gambar</h3>
              <button type="button" onClick={() => setShowCropModal(false)} className="text-gray-400 hover:text-red-500 font-bold">✕ Batal</button>
            </div>
            <div className="relative w-full h-[50vh] md:h-[60vh] bg-gray-900">
              <Cropper image={rawImageSrc} crop={crop} zoom={zoom} aspect={736 / 436} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-6 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="w-full sm:w-1/2 flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 uppercase">Zoom:</span>
                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(e.target.value)} className="w-full accent-[#FF6B35]" />
              </div>
              <button type="button" onClick={handleSaveCrop} className="w-full sm:w-auto px-8 py-3 bg-[#FF6B35] text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95">
                ✔ Potong & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="pt-8 px-6 max-w-4xl mx-auto flex items-center gap-4">
        <button type="button" onClick={() => navigate(-1)} className="text-sm font-bold flex items-center gap-2 text-[#FF6B35] hover:opacity-80">
            ← Kembali
        </button>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tight text-gray-900">Create Public Event</h1>
          <p className="text-gray-500 mt-2 font-medium">Isi detail acara publik Anda di bawah ini.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* BAGIAN 1: DETAIL ACARA */}
          <div className="bg-white border-gray-200 rounded-[24px] shadow-sm p-8 border">
            <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4">Event Details</h2>
            <div className="space-y-5 mt-6">
              <div>
                <label className={labelStyle}>Event Poster <span className="normal-case ml-1 font-normal text-orange-500">(Rasio 736x436)</span></label>
                <div className="relative group">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden border-gray-300 bg-gray-50 hover:bg-gray-100">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <span className="text-3xl mb-2 opacity-50">+</span>
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Upload Gambar</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} required={!imagePreview} />
                  </label>
                </div>
              </div>

              <div>
                <label className={labelStyle}>Event Title</label>
                <input type="text" name="title" value={formData.title} onChange={handleEventChange} className={inputStyle} required />
              </div>
              <div>
                <label className={labelStyle}>Deskripsi</label>
                <textarea name="description" value={formData.description} onChange={handleEventChange} rows="4" className={inputStyle} required />
              </div>
              
              {/* 🔥 TANGGAL EVENT (Tema Public/Orange) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Event Start</label>
                  <CustomDatePicker 
                    theme="public"
                    value={formData.eventStart} 
                    onChange={(newDate) => handleEventChange({ target: { name: 'eventStart', value: newDate }})} 
                    placeholder="Pilih Tanggal Mulai"
                  />
                </div>
                <div>
                  <label className={labelStyle}>Event End</label>
                  <CustomDatePicker 
                    theme="public"
                    value={formData.eventEnd} 
                    onChange={(newDate) => handleEventChange({ target: { name: 'eventEnd', value: newDate }})} 
                    placeholder="Pilih Tanggal Selesai"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Contact (WhatsApp)</label>
                  <input type="text" name="phone" placeholder="Ex: 08123456789" value={formData.phone} onChange={handleEventChange} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>Kategori</label>
                  <select name="category" value={formData.category} onChange={handleEventChange} className={inputStyle} required>
                    <option value="" disabled hidden>Select Category</option>
                    {categoriesList.filter(c => c !== 'Wedding').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* BAGIAN 2: LOKASI GLOBAL */}
          <div className="bg-white border-gray-200 rounded-[24px] shadow-sm p-8 border">
            <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-gray-900 border-b border-gray-100 pb-4">Lokasi Acara</h2>
            <div className="space-y-5 mt-6">
              <div>
                <label className={labelStyle}>Nama Tempat</label>
                <input type="text" name="namePlace" value={formData.location.namePlace} onChange={handleLocationChange} className={inputStyle} required />
              </div>
              <div>
                <label className={labelStyle}>Full Alamat</label>
                <textarea name="place" value={formData.location.place} onChange={handleLocationChange} rows="2" className={inputStyle} required />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Kota</label>
                  <input type="text" name="city" value={formData.location.city} onChange={handleLocationChange} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>Provinsi</label>
                  <input type="text" name="province" value={formData.location.province} onChange={handleLocationChange} className={inputStyle} required />
                </div>
              </div>
              <div>
                <label className={labelStyle}>URL Google Maps (Opsional)</label>
                <input type="url" name="mapUrl" value={formData.location.mapUrl} onChange={handleLocationChange} className={inputStyle} />
              </div>
            </div>
          </div>

          {/* BAGIAN 3: SESSION / KATEGORI TAMU */}
          {formData.sessions.map((session, sIndex) => (
            <div key={session.id} className="bg-white border-gray-200 rounded-[24px] shadow-sm p-8 border relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4 mt-2">
                <h2 className="text-lg font-black uppercase text-[#FF6B35]">Session {sIndex + 1}</h2>
                {formData.sessions.length > 1 && (
                  <button type="button" onClick={() => removeSession(sIndex)} className="text-xs uppercase tracking-widest font-bold px-4 py-2 rounded-xl transition-all bg-red-50 text-red-500 hover:bg-red-100">
                    Hapus
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={labelStyle}>Name Session / Jenis Tiket</label>
                  <input type="text" value={session.name} onChange={(e) => handleSessionChange(sIndex, 'name', e.target.value)} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>Deskripsi</label>
                  <textarea value={session.description} onChange={(e) => handleSessionChange(sIndex, 'description', e.target.value)} rows="3" className={inputStyle} />
                </div>
                
                {/* 🔥 TANGGAL SESI */}
                <div>
                  <label className={labelStyle}>Tanggal</label>
                  <CustomDatePicker 
                    theme="public"
                    value={session.date} 
                    onChange={(newDate) => handleSessionChange(sIndex, 'date', newDate)} 
                    placeholder="Pilih Tanggal Sesi"
                  />
                </div>
                
                {/* 🔥 JAM MULAI & SELESAI */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Jam Mulai</label>
                    <CustomTimePicker 
                      theme="public"
                      value={session.startTime} 
                      onChange={(newTime) => handleSessionChange(sIndex, 'startTime', newTime)} 
                      placeholder="08:00"
                    />
                  </div>
                  <div>
                    <label className={labelStyle}>Jam Selesai</label>
                    <CustomTimePicker 
                      theme="public"
                      value={session.endTime} 
                      onChange={(newTime) => handleSessionChange(sIndex, 'endTime', newTime)} 
                      placeholder="10:00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Type Event</label>
                    <select value={session.typeEvent} onChange={(e) => handleSessionChange(sIndex, 'typeEvent', e.target.value)} className={inputStyle}>
                      <option value="Paid">Paid</option>
                      <option value="Free">Free</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelStyle}>Price</label>
                    <div className="relative">
                        {session.typeEvent === 'Paid' && <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm text-gray-700`}>Rp</span>}
                        <input 
                          type="text" 
                          value={session.price} 
                          onChange={(e) => {
                              const val = e.target.value;
                              if (val === '' || /^\d+$/.test(val)) handleSessionChange(sIndex, 'price', val);
                          }} 
                          disabled={session.typeEvent === 'Free'} 
                          className={`${inputStyle} ${session.typeEvent === 'Paid' ? 'pl-10' : 'opacity-50 cursor-not-allowed'}`} 
                          required={session.typeEvent === 'Paid'} 
                        />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className={labelStyle}>Contact Person Session</label>
                  <input type="text" value={session.contactPerson} onChange={(e) => handleSessionChange(sIndex, 'contactPerson', e.target.value)} className={inputStyle} />
                </div>

                <div>
                  <label className={labelStyle}>Stock / Kuota Tiket</label>
                  <input type="text" value={session.stock} onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) handleSessionChange(sIndex, 'stock', val);
                    }} className={inputStyle} required />
                </div>

                <div>
                  <label className={labelStyle}>Syarat & Ketentuan</label>
                  <textarea value={session.ticketDesc} onChange={(e) => handleSessionChange(sIndex, 'ticketDesc', e.target.value)} rows="3" className={inputStyle} />
                </div>
              </div>
            </div>
          ))}
          
          <button type="button" onClick={addSession} className="w-full py-4 border-2 border-dashed font-black tracking-widest uppercase rounded-2xl transition border-orange-200 bg-orange-50 text-[#FF6B35] hover:bg-orange-100">
            + Add Another Session
          </button>

          {/* BAGIAN 4: FORM BUILDER */}
          <div className="space-y-8 mt-8">
            {formData.sessions.map((session, sIndex) => (
              <div key={`formbuilder-${session.id}`} className="bg-white border-gray-200 rounded-[24px] shadow-sm p-8 border">
                <div className="mb-6 border-b border-gray-100 pb-4">
                   <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-gray-400">Form Registrasi Tambahan Untuk:</p>
                   <h2 className="text-xl font-bold text-gray-900">{session.name || `Session ${sIndex + 1}`}</h2>
                </div>
                
                <div className="space-y-4 mb-6 select-none opacity-50">
                  <div><label className={labelStyle}>Nama Lengkap (Bawaan)</label><input type="text" disabled className={inputStyle} value="Akan diisi oleh peserta" readOnly/></div>
                  <div><label className={labelStyle}>Email (Bawaan)</label><input type="text" disabled className={inputStyle} value="Akan diisi oleh peserta" readOnly/></div>
                </div>

                {session.questions.map((q, qIndex) => (
                  <div key={q.id} className="border rounded-xl p-5 mb-4 shadow-sm relative border-l-4 border-orange-100 border-l-[#FF6B35] bg-orange-50/20">
                    <div className="flex flex-col md:flex-row gap-4 mb-3 w-full">
                      <div className="flex-1 min-w-0">
                        <input 
                          type="text" 
                          placeholder="Ketik pertanyaan custom di sini (Ex: Ukuran Kaos)" 
                          value={q.text} 
                          onChange={(e) => handleQuestionChange(sIndex, qIndex, 'text', e.target.value)} 
                          className={`${inputStyle} w-full border-orange-200`} 
                          required 
                        />
                      </div>
                      <div className="w-full md:w-48 shrink-0">
                        <select 
                          value={q.type} 
                          onChange={(e) => handleQuestionChange(sIndex, qIndex, 'type', e.target.value)} 
                          className={`${inputStyle} w-full cursor-pointer font-semibold border-orange-200`}
                        >
                          <option value="Text">Teks Singkat</option>
                          <option value="Dropdown">Dropdown</option>
                          <option value="Checkbox">Checkbox</option>
                        </select>
                      </div>
                    </div>

                    {q.type === 'Text' && (
                      <input type="text" placeholder="Kolom jawaban teks (diisi peserta nanti)" disabled className={`${inputStyle} opacity-60 bg-gray-50 border-gray-200`} />
                    )}

                    {(q.type === 'Dropdown' || q.type === 'Checkbox') && (
                      <div className="pl-4 border-l-2 mt-4 space-y-2 border-orange-200">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Atur Pilihan Jawaban:</label>
                        {q.options?.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-3">
                            <div className="text-gray-400 shrink-0">
                              {q.type === 'Checkbox' ? (
                                <div className="w-4 h-4 border-2 border-gray-400 rounded-sm"></div>
                              ) : (
                                <div className="w-4 h-4 border-2 border-gray-400 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
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
                              <button type="button" onClick={() => removeQuestionOption(sIndex, qIndex, optIndex)} className="w-8 h-8 flex items-center justify-center rounded-lg font-bold transition text-gray-400 hover:text-red-500 hover:bg-red-50">
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => addQuestionOption(sIndex, qIndex)} className="text-xs font-bold mt-2 px-3 py-1.5 rounded-lg transition-colors text-[#FF6B35] hover:text-orange-700 bg-orange-50">
                          + Tambah Opsi
                        </button>
                      </div>
                    )}

                    <div className="flex justify-end items-center gap-4 mt-6 pt-4 border-t border-orange-100">
                      <button type="button" onClick={() => removeQuestion(sIndex, qIndex)} className="text-xs font-bold uppercase tracking-widest transition text-gray-400 hover:text-red-500">Hapus Form</button>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer uppercase tracking-widest select-none text-gray-700">
                        Wajib Isi
                        <input type="checkbox" checked={q.isRequired} onChange={(e) => handleQuestionChange(sIndex, qIndex, 'isRequired', e.target.checked)} className="w-4 h-4 rounded focus:ring-2 text-orange-500 focus:ring-orange-500" />
                      </label>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => addQuestion(sIndex)} className="text-sm font-bold flex items-center gap-2 mt-4 transition text-[#FF6B35] hover:text-orange-700">
                  <span className="text-xl">⊕</span> Tambah Pertanyaan Baru
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-6 border-t mt-10 border-gray-200">
            <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition text-gray-400 hover:text-gray-900">
               Batal
            </button>
            <button type="submit" disabled={isLoading} className="px-10 py-4 rounded-xl text-white font-bold uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-[#FF6B35] hover:bg-[#E85526]">
              {isLoading ? 'Processing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
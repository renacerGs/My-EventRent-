import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { createClient } from '@supabase/supabase-js';

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
      // Sudah WEBP
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

  // Default data untuk PERSONAL EVENT / WEDDING
  const [formData, setFormData] = useState({
    title: '', description: '', eventStart: '', eventEnd: '', phone: '', 
    category: 'Wedding', // OTOMATIS WEDDING DULU (Bisa dirubah nanti)
    isPrivate: true, // PASTI TRUE
    location: { namePlace: '', place: '', city: '', province: '', mapUrl: '' }, // Tidak dipakai di UI, tapi dibiarkan agar DB aman
    sessions: [
      {
        id: crypto.randomUUID(), name: '', description: '', date: '', startTime: '', endTime: '', 
        contactPerson: '', typeEvent: 'Free', price: '0', stock: '', ticketDesc: '', // Tiket pasti Free
        location: { namePlace: '', place: '', city: '', province: '', mapUrl: '' }, // Lokasi Sesi Dinyalakan
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
  
  const handleSessionLocationChange = (sIndex, field, value) => {
    const updated = JSON.parse(JSON.stringify(formData.sessions));
    if (!updated[sIndex].location) {
      updated[sIndex].location = { namePlace: '', place: '', city: '', province: '', mapUrl: '' };
    }
    updated[sIndex].location[field] = value;
    setFormData({ ...formData, sessions: updated });
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageBase64) return alert("Poster/Gambar wajib diupload!");
    
    setIsLoading(true);
    try {
      const resBase64 = await fetch(imageBase64);
      const imageBlob = await resBase64.blob();
      
      // 👇 FIX EKSTENSI WEBP 👇
      const fileName = `poster-${Date.now()}.webp`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('event-posters')
        // 👇 FIX CONTENT-TYPE WEBP 👇
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

  // Tema Personal / Wedding
  const inputStyle = `w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 transition-all bg-slate-800 text-white border border-slate-700 placeholder-gray-500 focus:border-[#D4AF37] focus:ring-[#D4AF37]`;
  const labelStyle = `text-xs font-bold mb-1.5 block uppercase tracking-wider text-gray-300`;

  return (
    <div className="bg-slate-950 min-h-screen pb-20 font-sans relative transition-colors duration-500">
      
      {showCropModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-widest text-gray-900">Sesuaikan Gambar</h3>
              <button onClick={() => setShowCropModal(false)} className="text-gray-400 hover:text-red-500 font-bold">✕ Batal</button>
            </div>
            <div className="relative w-full h-[50vh] md:h-[60vh] bg-gray-900">
              <Cropper image={rawImageSrc} crop={crop} zoom={zoom} aspect={736 / 436} onCropChange={setCrop} onCropComplete={onCropComplete} onZoomChange={setZoom} />
            </div>
            <div className="p-6 bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="w-full sm:w-1/2 flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 uppercase">Zoom:</span>
                <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(e.target.value)} className="w-full accent-[#FF6B35]" />
              </div>
              <button onClick={handleSaveCrop} className="w-full sm:w-auto px-8 py-3 bg-[#FF6B35] text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg active:scale-95">
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
          <p className="text-[#D4AF37] mt-2 font-serif italic">Siapkan RSVP elegan untuk tamu spesial Anda.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* BAGIAN 1: DETAIL ACARA */}
          <div className="bg-slate-900 border border-slate-800 rounded-[24px] shadow-sm p-8">
            <h2 className="text-xl font-black mb-6 uppercase tracking-widest text-white border-b border-slate-800 pb-4">Detail Pernikahan</h2>
            <div className="space-y-5 mt-6">
              <div>
                <label className={labelStyle}>Foto Pre-Wedding / Desain Undangan <span className="normal-case ml-1 font-normal text-[#D4AF37]">(Rasio 736x436)</span></label>
                <div className="relative group">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all overflow-hidden border-slate-700 bg-slate-800/50 hover:bg-slate-800">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                        <span className="text-3xl mb-2 opacity-50">💍</span>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Upload Gambar</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} required={!imagePreview} />
                  </label>
                </div>
              </div>

              <div>
                <label className={labelStyle}>Nama Mempelai / Pemilik Acara</label>
                <input type="text" name="title" placeholder="Ex: Romeo & Juliet" value={formData.title} onChange={handleEventChange} className={inputStyle} required />
              </div>
              <div>
                <label className={labelStyle}>Pesan Pembuka / Doa</label>
                <textarea name="description" value={formData.description} onChange={handleEventChange} rows="4" className={inputStyle} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Tanggal Acara Mulai</label>
                  <input type="date" name="eventStart" value={formData.eventStart} onChange={handleEventChange} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>Tanggal Acara Selesai</label>
                  <input type="date" name="eventEnd" value={formData.eventEnd} onChange={handleEventChange} className={inputStyle} required />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Contact (WhatsApp)</label>
                  <input type="text" name="phone" placeholder="Ex: 08123456789" value={formData.phone} onChange={handleEventChange} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>Kategori</label>
                  <input type="text" value="Wedding / Personal" disabled className={`${inputStyle} opacity-50 cursor-not-allowed`} />
                </div>
              </div>
            </div>
          </div>

          {/* LOKASI GLOBAL DIHILANGKAN, LANGSUNG KE SESSION */}

          {/* BAGIAN 3: SESSION / KATEGORI TAMU */}
          {formData.sessions.map((session, sIndex) => (
            <div key={session.id} className="bg-slate-900 border border-slate-800 rounded-[24px] shadow-sm p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
              
              <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4 mt-2">
                <h2 className="text-lg font-black uppercase text-[#D4AF37]">Session {sIndex + 1}</h2>
                {formData.sessions.length > 1 && (
                  <button type="button" onClick={() => removeSession(sIndex)} className="text-xs uppercase tracking-widest font-bold px-4 py-2 rounded-xl transition-all bg-red-900/30 text-red-400 hover:bg-red-900/50">
                    Hapus
                  </button>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className={labelStyle}>Nama Session + (Keluarga / Teman)</label>
                  <input type="text" value={session.name} onChange={(e) => handleSessionChange(sIndex, 'name', e.target.value)} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>Deskripsi Session</label>
                  <textarea value={session.description} onChange={(e) => handleSessionChange(sIndex, 'description', e.target.value)} rows="3" className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Tanggal</label>
                  <input type="date" value={session.date} onChange={(e) => handleSessionChange(sIndex, 'date', e.target.value)} className={inputStyle} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelStyle}>Jam Mulai</label>
                    <input type="time" value={session.startTime} onChange={(e) => handleSessionChange(sIndex, 'startTime', e.target.value)} className={inputStyle} required />
                  </div>
                  <div>
                    <label className={labelStyle}>Jam Selesai</label>
                    <input type="time" value={session.endTime} onChange={(e) => handleSessionChange(sIndex, 'endTime', e.target.value)} className={inputStyle} required />
                  </div>
                </div>

                <div>
                  <label className={labelStyle}>Batas Maksimal Kuota Tamu</label>
                  <input type="text" value={session.stock} onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d+$/.test(val)) handleSessionChange(sIndex, 'stock', val);
                    }} className={inputStyle} required />
                </div>

                {/* LOKASI KHUSUS SESI */}
                <div className="mt-8 pt-6 border-t border-slate-800">
                  <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-widest mb-5">Lokasi Acara Untuk Sesi Ini</h3>
                  <div className="space-y-4">
                    <div>
                      <label className={labelStyle}>Nama Gedung / Tempat</label>
                      <input type="text" value={session.location?.namePlace || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'namePlace', e.target.value)} className={inputStyle} required />
                    </div>
                    <div>
                      <label className={labelStyle}>Full Alamat</label>
                      <textarea value={session.location?.place || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'place', e.target.value)} rows="2" className={inputStyle} required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelStyle}>Kota</label>
                        <input type="text" value={session.location?.city || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'city', e.target.value)} className={inputStyle} required />
                      </div>
                      <div>
                        <label className={labelStyle}>Provinsi</label>
                        <input type="text" value={session.location?.province || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'province', e.target.value)} className={inputStyle} required />
                      </div>
                    </div>
                    <div>
                      <label className={labelStyle}>URL Google Maps (Opsional)</label>
                      <input type="url" value={session.location?.mapUrl || ''} onChange={(e) => handleSessionLocationChange(sIndex, 'mapUrl', e.target.value)} className={inputStyle} />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ))}
          
          <button type="button" onClick={addSession} className="w-full py-4 border-2 border-dashed font-black tracking-widest uppercase rounded-2xl transition border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10">
            + Add Another Session
          </button>

          {/* BAGIAN 4: FORM BUILDER */}
          <div className="space-y-8 mt-8">
            {formData.sessions.map((session, sIndex) => (
              <div key={`formbuilder-${session.id}`} className="bg-slate-900 border border-slate-800 rounded-[24px] shadow-sm p-8">
                <div className="mb-6 border-b border-slate-800 pb-4">
                   <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-[#D4AF37]">Form Registrasi Tambahan Untuk:</p>
                   <h2 className="text-xl font-bold text-white">{session.name || `Session ${sIndex + 1}`}</h2>
                </div>
                
                <div className="space-y-4 mb-6 select-none opacity-30">
                  <div><label className={labelStyle}>Nama Lengkap (Bawaan)</label><input type="text" disabled className={inputStyle} value="Akan diisi oleh peserta" readOnly/></div>
                  <div><label className={labelStyle}>Email (Bawaan)</label><input type="text" disabled className={inputStyle} value="Akan diisi oleh peserta" readOnly/></div>
                  <div><label className={labelStyle}>Jumlah Rombongan / Pax (Otomatis)</label><input type="text" disabled className={inputStyle} value="Akan diisi tamu" readOnly/></div>
                  <div><label className={labelStyle}>Ucapan & Doa (Otomatis)</label><input type="text" disabled className={inputStyle} value="Akan diisi tamu" readOnly/></div>
                </div>

                {session.questions.map((q, qIndex) => (
                  <div key={q.id} className="border rounded-xl p-5 mb-4 shadow-sm relative border-l-4 border-slate-700 border-l-[#D4AF37] bg-slate-800/30">
                    <div className="flex flex-col md:flex-row gap-4 mb-3 w-full">
                      <div className="flex-1 min-w-0">
                        <input 
                          type="text" 
                          placeholder="Ketik pertanyaan tambahan (Ex: Alamat Pengiriman Souvenir)" 
                          value={q.text} 
                          onChange={(e) => handleQuestionChange(sIndex, qIndex, 'text', e.target.value)} 
                          className={`${inputStyle} w-full border-slate-600`} 
                          required 
                        />
                      </div>
                      <div className="w-full md:w-48 shrink-0">
                        <select 
                          value={q.type} 
                          onChange={(e) => handleQuestionChange(sIndex, qIndex, 'type', e.target.value)} 
                          className={`${inputStyle} w-full cursor-pointer font-semibold border-slate-600`}
                        >
                          <option value="Text">Teks Singkat</option>
                          <option value="Dropdown">Dropdown</option>
                          <option value="Checkbox">Checkbox</option>
                        </select>
                      </div>
                    </div>

                    {q.type === 'Text' && (
                      <input type="text" placeholder="Kolom jawaban teks (diisi peserta nanti)" disabled className={`${inputStyle} opacity-60 bg-slate-900 border-slate-700`} />
                    )}

                    {(q.type === 'Dropdown' || q.type === 'Checkbox') && (
                      <div className="pl-4 border-l-2 mt-4 space-y-2 border-[#D4AF37]/50">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Atur Pilihan Jawaban:</label>
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
                              <button type="button" onClick={() => removeQuestionOption(sIndex, qIndex, optIndex)} className="w-8 h-8 flex items-center justify-center rounded-lg font-bold transition text-gray-500 hover:text-red-400 hover:bg-slate-800">
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => addQuestionOption(sIndex, qIndex)} className="text-xs font-bold mt-2 px-3 py-1.5 rounded-lg transition-colors text-[#D4AF37] hover:text-[#FFDF73] bg-[#D4AF37]/10">
                          + Tambah Opsi
                        </button>
                      </div>
                    )}

                    <div className="flex justify-end items-center gap-4 mt-6 pt-4 border-t border-slate-700">
                      <button type="button" onClick={() => removeQuestion(sIndex, qIndex)} className="text-xs font-bold uppercase tracking-widest transition text-gray-500 hover:text-red-400">Hapus Form</button>
                      <label className="flex items-center gap-2 text-xs font-bold cursor-pointer uppercase tracking-widest select-none text-gray-300">
                        Wajib Isi
                        <input type="checkbox" checked={q.isRequired} onChange={(e) => handleQuestionChange(sIndex, qIndex, 'isRequired', e.target.checked)} className="w-4 h-4 rounded focus:ring-2 text-[#D4AF37] focus:ring-[#D4AF37] bg-slate-800 border-slate-600" />
                      </label>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => addQuestion(sIndex)} className="text-sm font-bold flex items-center gap-2 mt-4 transition text-[#D4AF37] hover:text-[#FFDF73]">
                  <span className="text-xl">⊕</span> Tambah Pertanyaan Baru
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-6 border-t mt-10 border-slate-800">
            <button type="button" onClick={() => navigate(-1)} className="px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition text-gray-400 hover:text-white">
               Batal
            </button>
            <button type="submit" disabled={isLoading} className="px-10 py-4 rounded-xl text-white font-bold uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-[#D4AF37] hover:bg-[#B5952F]">
              {isLoading ? 'Processing...' : '✨ Simpan Undangan'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
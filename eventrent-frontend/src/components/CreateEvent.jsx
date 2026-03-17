import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateEvent() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  const categoriesList = ['Music', 'Food', 'Tech', 'Religious', 'Arts', 'Sports'];

  const [formData, setFormData] = useState({
    title: '', description: '', eventStart: '', eventEnd: '', phone: '', category: '',
    location: { namePlace: '', place: '', city: '', province: '', mapUrl: '' },
    sessions: [
      {
        id: crypto.randomUUID(), name: '', description: '', date: '', startTime: '', endTime: '', 
        contactPerson: '', typeEvent: 'Paid', price: '', stock: '', ticketDesc: '',
        questions: [{ id: crypto.randomUUID(), text: '', type: 'Text', isRequired: true, options: [''] }]
      }
    ]
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  // --- HANDLERS DASAR ---
  const handleEventChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handleLocationChange = (e) => {
    setFormData({ ...formData, location: { ...formData.location, [e.target.name]: e.target.value }});
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      const reader = new FileReader();
      reader.onloadend = () => setImageBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // --- 🔥 HANDLERS ARRAY DEEP COPY (BIAR GAK FREEZE PAS NGETIK) 🔥 ---
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
        contactPerson: '', typeEvent: 'Paid', price: '', stock: '', ticketDesc: '',
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

  // --- 🌐 SUBMIT DATA KE BACKEND (UDAH DISESUAIKAN BUAT CLOUD) 🌐 ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
          ...formData,
          userId: user.id,
          img: imageBase64 
      };

      // 👇 INI YANG UDAH DIHAPUS LOCALHOST-NYA 👇
      const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });

      if (response.ok) {
          navigate('/manage'); 
      } else {
          const errorData = await response.json();
          console.error("Backend Error:", errorData);
          alert("Gagal membuat event: " + (errorData.message || 'Server error'));
      }
    } catch (error) {
        console.error("Error creating event:", error);
        alert("Gagal terhubung ke server.");
    } finally {
        setIsLoading(false);
    }
  };

  const inputStyle = 'w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all';
  const labelStyle = 'text-xs font-semibold text-gray-700 mb-1.5 block uppercase tracking-wider';

  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans">
      <main className="max-w-4xl mx-auto px-6 py-12">
        
        {/* BANNER PERINGATAN */}
        <div className="bg-[#FFF5F0] border-l-[6px] border-[#FF6B35] p-6 mb-8 rounded-r-2xl shadow-sm flex items-start gap-4">
           <div className="bg-[#FF6B35] bg-opacity-10 p-3 rounded-full shrink-0">
              <svg className="w-6 h-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
           </div>
           <div>
             <h3 className="text-lg font-black text-[#FF6B35] mb-2 uppercase tracking-tight">Perhatian Sebelum Membuat Event!</h3>
             <p className="text-sm text-gray-700 leading-relaxed font-medium">
               Pastikan semua data terkait <strong className="text-gray-900 font-black">Sesi/Tiket, Harga, Kuota, dan Custom Form</strong> sudah benar dan final. Setelah event dibuat dan ada tiket yang terjual, data-data tersebut <span className="text-red-500 font-bold">TIDAK DAPAT DIHAPUS ATAU DIUBAH</span> untuk menjaga validitas transaksi peserta. Harap teliti sebelum menyimpan!
             </p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECTION 1: CREATE AN EVENT */}
          <div className="bg-white rounded-[24px] shadow-sm p-8 border border-gray-200">
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">Event Details</h2>
            
            <div className="space-y-5">
              {/* IMAGE UPLOAD */}
              <div>
                <label className={labelStyle}>Event Poster</label>
                <div className="relative group">
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <span className="text-3xl mb-2 text-gray-400">➕</span>
                        <p className="text-xs text-gray-500 font-medium">Click to upload poster</p>
                      </div>
                    )}
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} required />
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Event Start</label>
                  <input type="date" name="eventStart" value={formData.eventStart} onChange={handleEventChange} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>Event End</label>
                  <input type="date" name="eventEnd" value={formData.eventEnd} onChange={handleEventChange} className={inputStyle} required />
                </div>
              </div>
              <div>
                <label className={labelStyle}>Contact (WhatsApp)</label>
                <input type="text" name="phone" placeholder="Ex: 08123456789" value={formData.phone} onChange={handleEventChange} className={inputStyle} required />
              </div>
              <div>
                <label className={labelStyle}>Category</label>
                <select name="category" value={formData.category} onChange={handleEventChange} className={inputStyle} required>
                  <option value="" disabled hidden>Select Category</option>
                  {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: LOCATION */}
          <div className="bg-white rounded-[24px] shadow-sm p-8 border border-gray-200">
            <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">Event Location</h2>
            
            <div className="space-y-5">
              <div>
                <label className={labelStyle}>Nama Tempat</label>
                <input type="text" name="namePlace" value={formData.location.namePlace} onChange={handleLocationChange} className={inputStyle} placeholder="Ex: Gelora Bung Karno" required />
              </div>
              <div>
                <label className={labelStyle}>Full Alamat</label>
                <textarea name="place" value={formData.location.place} onChange={handleLocationChange} rows="2" className={inputStyle} placeholder="Ex: Jl. Pintu Satu Senayan, RT.1/RW.3..." required />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>City</label>
                  <input type="text" name="city" value={formData.location.city} onChange={handleLocationChange} className={inputStyle} placeholder="Ex: Jakarta Pusat" required />
                </div>
                <div>
                  <label className={labelStyle}>Provinsi</label>
                  <input type="text" name="province" value={formData.location.province} onChange={handleLocationChange} className={inputStyle} placeholder="Ex: DKI Jakarta" required />
                </div>
              </div>

              <div>
                <label className={labelStyle}>URL Google Maps (Opsional)</label>
                <input type="url" name="mapUrl" value={formData.location.mapUrl} onChange={handleLocationChange} className={inputStyle} placeholder="Ex: https://maps.app.goo.gl/..." />
              </div>
            </div>
          </div>

          {/* SECTION 3: SESSIONS */}
          {formData.sessions.map((session, sIndex) => (
            <div key={session.id} className="bg-white rounded-[24px] shadow-sm p-8 border border-gray-200">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h2 className="text-xl font-black uppercase text-[#FF6B35]">Session {sIndex + 1}</h2>
                {formData.sessions.length > 1 && (
                  <button type="button" onClick={() => removeSession(sIndex)} className="bg-red-50 hover:bg-red-100 text-red-500 text-xs uppercase tracking-widest font-bold px-4 py-2 rounded-xl transition-all">
                    Remove Session
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelStyle}>Name Session / Jenis Tiket</label>
                  <input type="text" value={session.name} placeholder="Ex: VIP M&G" onChange={(e) => handleSessionChange(sIndex, 'name', e.target.value)} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>Deskripsi</label>
                  <textarea value={session.description} onChange={(e) => handleSessionChange(sIndex, 'description', e.target.value)} rows="3" className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Date</label>
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
                  <label className={labelStyle}>Contact Person Session</label>
                  <input type="text" value={session.contactPerson} onChange={(e) => handleSessionChange(sIndex, 'contactPerson', e.target.value)} className={inputStyle} />
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
                       {session.typeEvent === 'Paid' && <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">Rp</span>}
                       <input 
                         type="text" 
                         value={session.price} 
                         onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d+$/.test(val)) {
                                handleSessionChange(sIndex, 'price', val);
                            }
                         }} 
                         disabled={session.typeEvent === 'Free'} 
                         className={`${inputStyle} ${session.typeEvent === 'Paid' ? 'pl-10' : 'bg-gray-100'}`} 
                         placeholder={session.typeEvent === 'Free' ? '0' : 'Harga...'} 
                         required={session.typeEvent === 'Paid'} 
                       />
                    </div>
                  </div>
                </div>
                <div>
                  <label className={labelStyle}>Stock / Kuota Tiket</label>
                  <input 
                    type="text" 
                    value={session.stock} 
                    onChange={(e) => {
                       const val = e.target.value;
                       if (val === '' || /^\d+$/.test(val)) {
                           handleSessionChange(sIndex, 'stock', val);
                       }
                    }} 
                    className={inputStyle} 
                    required 
                  />
                </div>
                <div>
                  <label className={labelStyle}>Syarat & Ketentuan Ticket</label>
                  <textarea value={session.ticketDesc} onChange={(e) => handleSessionChange(sIndex, 'ticketDesc', e.target.value)} rows="3" className={inputStyle} />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addSession} className="w-full py-4 bg-orange-50 text-[#FF6B35] border-2 border-dashed border-orange-200 font-black tracking-widest uppercase rounded-2xl hover:bg-orange-100 transition">
            + Add Another Session / Category
          </button>

          {/* SECTION 4: FORM BUILDER */}
          <div className="space-y-8">
            {formData.sessions.map((session, sIndex) => (
              <div key={`formbuilder-${session.id}`} className="bg-white rounded-[24px] shadow-sm p-8 border border-gray-200">
                <div className="mb-6 border-b border-gray-100 pb-4">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Form Registrasi Peserta Untuk:</p>
                   <h2 className="text-xl font-bold text-gray-900">{session.name || `Session ${sIndex + 1}`}</h2>
                </div>
                
                <div className="space-y-4 mb-6 opacity-50 select-none">
                  <div><label className={labelStyle}>Nama Lengkap (Bawaan)</label><input type="text" disabled className={inputStyle} value="Akan diisi oleh peserta" readOnly/></div>
                  <div><label className={labelStyle}>Email (Bawaan)</label><input type="text" disabled className={inputStyle} value="Akan diisi oleh peserta" readOnly/></div>
                </div>

                {session.questions.map((q, qIndex) => (
                  <div key={q.id} className="border border-orange-100 rounded-xl p-5 mb-4 shadow-sm relative border-l-4 border-l-[#FF6B35] bg-orange-50/20">
                    
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
                          className={`${inputStyle} w-full border-orange-200 cursor-pointer font-semibold`}
                        >
                          <option value="Text">Teks Singkat</option>
                          <option value="Dropdown">Dropdown</option>
                          <option value="Checkbox">Checkbox</option>
                        </select>
                      </div>
                    </div>

                    {/* RENDER JAWABAN BERDASARKAN TIPE */}
                    {q.type === 'Text' && (
                      <input type="text" placeholder="Kolom jawaban teks (diisi peserta nanti)" disabled className={`${inputStyle} bg-gray-50 border-gray-200 opacity-60`} />
                    )}

                    {(q.type === 'Dropdown' || q.type === 'Checkbox') && (
                      <div className="pl-4 border-l-2 border-orange-200 mt-4 space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Atur Pilihan Jawaban:</label>
                        {q.options?.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-3">
                            <div className="text-gray-400 shrink-0">
                              {q.type === 'Checkbox' ? (
                                <div className="w-4 h-4 border-2 border-gray-300 rounded-sm"></div>
                              ) : (
                                <div className="w-4 h-4 border-2 border-gray-300 rounded-full flex items-center justify-center">
                                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                </div>
                              )}
                            </div>
                            <input 
                              type="text" 
                              placeholder={`Opsi ${optIndex + 1}`} 
                              value={opt} 
                              onChange={(e) => updateQuestionOption(sIndex, qIndex, optIndex, e.target.value)} 
                              className={`${inputStyle} py-2 text-sm flex-1 bg-white border-gray-200`} 
                              required 
                            />
                            {q.options.length > 1 && (
                              <button type="button" onClick={() => removeQuestionOption(sIndex, qIndex, optIndex)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg font-bold transition">
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={() => addQuestionOption(sIndex, qIndex)} className="text-xs font-bold text-[#FF6B35] hover:text-orange-700 mt-2 px-2 py-1 bg-orange-50 rounded-lg">
                          + Tambah Opsi
                        </button>
                      </div>
                    )}

                    <div className="flex justify-end items-center gap-4 mt-6 pt-4 border-t border-orange-100">
                      <button type="button" onClick={() => removeQuestion(sIndex, qIndex)} className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest transition">Hapus Form</button>
                      <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer uppercase tracking-widest select-none">
                        Wajib Isi
                        <input type="checkbox" checked={q.isRequired} onChange={(e) => handleQuestionChange(sIndex, qIndex, 'isRequired', e.target.checked)} className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500" />
                      </label>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => addQuestion(sIndex)} className="text-sm font-bold text-[#FF6B35] hover:text-orange-700 flex items-center gap-2 mt-4 transition">
                  <span className="text-xl">⊕</span> Tambah Pertanyaan Baru
                </button>
              </div>
            ))}
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-10">
            <button type="button" onClick={() => navigate('/')} className="px-8 py-4 rounded-xl font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest text-xs transition">Cancel</button>
            <button type="submit" disabled={isLoading} className="px-10 py-4 rounded-xl bg-gray-900 text-white font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-black transition-all active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed">
              {isLoading ? 'Processing...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
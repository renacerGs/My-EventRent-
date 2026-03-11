import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateEvent() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  const categoriesList = ['Music', 'Food', 'Tech', 'Religious', 'Arts', 'Sports'];

  // STATE UTAMA
  const [formData, setFormData] = useState({
    title: '', description: '', eventStart: '', eventEnd: '', phone: '', category: '',
    location: { namePlace: '', place: '', city: '', province: '', mapUrl: '' },
    sessions: [
      {
        id: crypto.randomUUID(), name: '', description: '', date: '', startTime: '', endTime: '', 
        contactPerson: '', typeEvent: 'Paid', price: '', stock: '', ticketDesc: '',
        questions: [{ id: crypto.randomUUID(), text: '', type: 'Text', isRequired: true }]
      }
    ]
  });

  // STATE UNTUK GAMBAR
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);

  // --- HANDLERS ---
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

  const handleSessionChange = (index, field, value) => {
    const updated = [...formData.sessions];
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
        questions: [{ id: crypto.randomUUID(), text: '', type: 'Text', isRequired: true }]
      }]
    }));
  };

  const removeSession = (indexToRemove) => {
    if (formData.sessions.length <= 1) return alert("Minimal harus ada 1 session untuk event ini!");
    const updatedSessions = formData.sessions.filter((_, index) => index !== indexToRemove);
    setFormData({ ...formData, sessions: updatedSessions });
  };

  const handleQuestionChange = (sIndex, qIndex, field, value) => {
    const updated = [...formData.sessions];
    updated[sIndex].questions[qIndex][field] = value;
    setFormData({ ...formData, sessions: updated });
  };

  const addQuestion = (sIndex) => {
    const updated = [...formData.sessions];
    updated[sIndex].questions.push({ id: crypto.randomUUID(), text: '', type: 'Text', isRequired: true });
    setFormData({ ...formData, sessions: updated });
  };

  const removeQuestion = (sIndex, qIndex) => {
    const updated = [...formData.sessions];
    updated[sIndex].questions = updated[sIndex].questions.filter((_, i) => i !== qIndex);
    setFormData({ ...formData, sessions: updated });
  };

  // --- SUBMIT DATA KE BACKEND ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload = {
          ...formData,
          userId: user.id,
          img: imageBase64 
      };

      const response = await fetch('http://localhost:3000/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
      });

      if (response.ok) {
          navigate('/manage'); // Redirect kalau sukses
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
  const labelStyle = 'text-xs font-semibold text-gray-700 mb-1.5 block';

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <main className="max-w-4xl mx-auto px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* SECTION 1: CREATE AN EVENT */}
          <div className="bg-white rounded-[24px] shadow-sm p-8 border border-gray-200">
            <h2 className="text-xl font-bold mb-6">Create an Event</h2>
            
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
                        <span className="text-3xl mb-2 text-gray-400">📷</span>
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

          {/* SECTION 2: LOCATION (MANUAL INPUT) */}
          <div className="bg-white rounded-[24px] shadow-sm p-8 border border-gray-200">
            <h2 className="text-xl font-bold mb-6">Event Location</h2>
            
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
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Session {sIndex + 1}</h2>
                {formData.sessions.length > 1 && (
                  <button type="button" onClick={() => removeSession(sIndex)} className="bg-[#E24A29] hover:bg-red-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all shadow-sm">
                    Remove Session
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelStyle}>Name Session</label>
                  <input type="text" value={session.name} onChange={(e) => handleSessionChange(sIndex, 'name', e.target.value)} className={inputStyle} required />
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
                  <label className={labelStyle}>Contact Person</label>
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
                    <input type="number" value={session.price} onChange={(e) => handleSessionChange(sIndex, 'price', e.target.value)} disabled={session.typeEvent === 'Free'} className={`${inputStyle} ${session.typeEvent === 'Free' ? 'bg-gray-100' : ''}`} placeholder={session.typeEvent === 'Free' ? '0' : 'Rp...'} required={session.typeEvent === 'Paid'} />
                  </div>
                </div>
                <div>
                  <label className={labelStyle}>Stock</label>
                  <input type="number" value={session.stock} onChange={(e) => handleSessionChange(sIndex, 'stock', e.target.value)} className={inputStyle} required />
                </div>
                <div>
                  <label className={labelStyle}>Deskripsi Ticket</label>
                  <textarea value={session.ticketDesc} onChange={(e) => handleSessionChange(sIndex, 'ticketDesc', e.target.value)} rows="3" className={inputStyle} />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={addSession} className="w-full py-4 bg-green-500/10 text-green-600 border border-green-500 font-bold rounded-xl hover:bg-green-500/20 transition">Add Session</button>

          {/* SECTION 4: FORM BUILDER */}
          <div className="space-y-8">
            {formData.sessions.map((session, sIndex) => (
              <div key={`formbuilder-${session.id}`} className="bg-white rounded-[24px] shadow-sm p-8 border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-[#FF6B35]">Judul Session: {session.name || `Session ${sIndex + 1}`}</h2>
                <div className="space-y-4 mb-6 opacity-60">
                  <div><label className={labelStyle}>Name</label><input type="text" disabled className={inputStyle} /></div>
                  <div><label className={labelStyle}>Email</label><input type="text" disabled className={inputStyle} /></div>
                </div>
                {session.questions.map((q, qIndex) => (
                  <div key={q.id} className="border border-orange-200 rounded-xl p-4 mb-4 shadow-sm relative border-l-4 border-l-orange-500">
                    <div className="flex gap-4 mb-3">
                      <input type="text" placeholder="Pertanyaan" value={q.text} onChange={(e) => handleQuestionChange(sIndex, qIndex, 'text', e.target.value)} className={`${inputStyle} flex-1`} required />
                      <select value={q.type} onChange={(e) => handleQuestionChange(sIndex, qIndex, 'type', e.target.value)} className="border border-gray-300 rounded-xl px-4 py-3 w-32 outline-none">
                        <option value="Text">Text</option>
                        <option value="Dropdown">Dropdown</option>
                      </select>
                    </div>
                    <input type="text" placeholder="Jawaban (Preview)" disabled className={`${inputStyle} bg-gray-50`} />
                    <div className="flex justify-end items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                      <button type="button" onClick={() => removeQuestion(sIndex, qIndex)} className="text-gray-400 hover:text-red-500">🗑️</button>
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                        Wajib isi
                        <input type="checkbox" checked={q.isRequired} onChange={(e) => handleQuestionChange(sIndex, qIndex, 'isRequired', e.target.checked)} className="w-4 h-4 text-orange-500" />
                      </label>
                      <button type="button" onClick={() => addQuestion(sIndex)} className="text-gray-600 hover:text-orange-500 text-xl font-bold">⊕</button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* FOOTER BUTTONS */}
          <div className="flex justify-between items-center pt-6">
            <button type="button" className="px-8 py-3 rounded-full border border-gray-300 font-semibold text-gray-500 hover:bg-gray-50">Save as Draft</button>
            <div className="flex gap-4">
              <button type="button" onClick={() => navigate('/')} className="px-8 py-3 rounded-full border border-gray-300 font-semibold text-gray-500 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={isLoading} className="px-8 py-3 rounded-full bg-[#FF6B35] text-white font-bold shadow-lg shadow-orange-200 hover:opacity-90 disabled:opacity-50">
                {isLoading ? 'Processing...' : 'Create Event'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
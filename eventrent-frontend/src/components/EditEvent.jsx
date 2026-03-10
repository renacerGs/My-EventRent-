import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [formData, setFormData] = useState({
    title: '',
    phone: '', 
    category: '',
    location: '',
    date: '',
    time: '',
    price: '',
    description: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  
  // --- STATE BUAT POP-UP SUKSES ---
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const categories = ['Music', 'Food', 'Tech', 'Religious', 'Arts', 'Sports'];

  useEffect(() => {
    if (!user) { navigate('/'); return; }

    fetch(`http://localhost:3000/api/events`) 
      .then(res => res.json())
      .then(data => {
        const found = data.find(e => String(e.id) === String(id));
        
        if (found) {
          setFormData({
            title: found.title,
            phone: found.phone || '',
            category: found.category,
            location: found.location,
            date: '', 
            time: '', 
            price: found.price,
            stock: found.stock || 0, 
            description: found.description,
          });
          setImagePreview(found.img);
        }
        setIsLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData, img: imageBase64 };

      const res = await fetch(`http://localhost:3000/api/events/${id}?userId=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // --- JANGAN LANGSUNG NAVIGATE, MUNCULIN MODAL DULU (KILAT 0.5s) ---
        setShowSuccessModal(true);
        setTimeout(() => {
          navigate('/manage');
        }, 500); 
      } else {
        console.error("Gagal update event");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const labelStyle = "block text-sm font-bold text-gray-800 mb-2 ml-3";
  const inputStyle = "w-full bg-white border border-gray-200 rounded-full px-5 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 transition-all";
  const sectionStyle = "bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-gray-100 mb-6";

  return (
    <div className="bg-gray-50 min-h-screen pb-32 pt-10 font-sans relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="flex items-center justify-between mb-8">
           <h1 className="text-2xl font-black text-gray-900">Edit Event</h1>
           <button onClick={() => navigate('/manage')} className="text-gray-500 hover:text-gray-900 font-bold text-sm">Cancel</button>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div className={sectionStyle}>
            <h2 className="text-lg font-black text-gray-900 mb-6 pb-4 border-b border-gray-100 text-left">Event Overview</h2>
            
            <div className="mb-6 text-left">
              <label className={labelStyle}>Event Title <span className="text-red-500">*</span></label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required className={inputStyle} />
            </div>

            <div className="mb-6 text-left">
              <label className={labelStyle}>WhatsApp / Contact Person <span className="text-red-500">*</span></label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className={inputStyle} placeholder="Ex: 08123456789" />
            </div>

            <div className="text-left">
              <label className={labelStyle}>Summary / Description <span className="text-red-500">*</span></label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" required className="w-full border border-gray-200 rounded-[20px] px-5 py-4 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-[#FF6B35] transition resize-none min-h-[120px]" />
            </div>
          </div>

          <div className={sectionStyle}>
            <h2 className="text-lg font-black text-gray-900 mb-6 pb-4 border-b border-gray-100 text-left">Date and Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-left">
              <div><label className={labelStyle}>Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} required className={`${inputStyle} cursor-pointer`} /></div>
              <div><label className={labelStyle}>Time</label><input type="time" name="time" value={formData.time} onChange={handleChange} required className={`${inputStyle} cursor-pointer`} /></div>
            </div>
            <div className="mb-6 text-left">
              <label className={labelStyle}>Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} required className={inputStyle} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left items-end">
               <div>
                  <label className={labelStyle}>Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} required className={`${inputStyle} appearance-none bg-white`}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               {/* --- PERBAIKAN DI SINI: TYPE GANTI TEXT + SENSOR ANGKA + PREFIX Rp --- */}
               <div>
                    <label className={labelStyle}>Price (Rp)</label>
                    <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Rp</span>
                        <input 
                            type="text" // Ganti ke text
                            name="price" 
                            value={formData.price} 
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || /^\d+$/.test(val)) {
                                    handleChange(e);
                                }
                            }}
                            className={`${inputStyle} pl-12`} 
                        />
                    </div>
                </div>
               
               <div>
                    <label className={labelStyle}>Stock</label>
                    <input 
                        type="text" // Ganti ke text
                        name="stock" 
                        value={formData.stock} 
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d+$/.test(val)) {
                                handleChange(e);
                            }
                        }}
                        required 
                        className={inputStyle} 
                    />
                </div>
            </div>
          </div>

          <div className={sectionStyle}>
            <h2 className="text-lg font-black text-gray-900 mb-6 pb-4 border-b border-gray-100 text-left">Event Image</h2>
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-full md:w-64 h-40 bg-gray-100 rounded-[16px] overflow-hidden border border-gray-200 relative group flex-shrink-0">
                 {imagePreview && <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />}
              </div>
              <div className="flex-1 text-left pt-4">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-6 py-2.5 rounded-full text-xs font-bold hover:bg-gray-50 transition shadow-sm">
                  <svg className="w-4 h-4 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  Change Image
                  <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </label>
                <p className="text-[10px] text-gray-400 mt-3 ml-3">Max file size: 2MB. Accepted formats: JPG, PNG, WEBP.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-gradient-to-r from-orange-400 to-[#FF6B35] text-white px-12 py-3 rounded-full font-bold text-sm shadow-lg shadow-orange-100 hover:shadow-orange-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">Save Changes</button>
          </div>
        </form>
      </div>

      {/* --- CUSTOM MODAL SUCCESS EDIT (TANPA TOMBOL & REDIRECT KILAT) --- */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 text-center relative overflow-hidden">
            
            {/* Animasi loading bar kecil di atas biar keliatan mau redirect */}
            <div className="absolute top-0 left-0 h-1 bg-[#FF6B35] animate-loadBar"></div>

            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border-[6px] border-green-100">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-tight">Sukses!</h3>
            <p className="text-gray-500 text-sm font-medium">
              Event kamu berhasil diupdate. Mengalihkan...
            </p>
            
          </div>
        </div>
      )}

    </div>
  );
}
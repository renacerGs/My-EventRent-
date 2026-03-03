import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateEvent() {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    location: '',
    date: '',
    time: '',
    price: '',
    description: '',
  });
  const [imagePreview, setImagePreview] = useState(null);

  const navigate = useNavigate(); 

  const handleSubmit = (e) => {
    e.preventDefault();
    const newEvent = {
      ...formData,
      id: Date.now(),
      // Menggunakan preview image jika ada, jika tidak pakai default
      img: imagePreview || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'
    };
    navigate('/manage', { state: { newEvent } });
  };

  const categories = ['Music', 'Food', 'Tech', 'Religious', 'Arts', 'Sports'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const inputStyle = 'w-full bg-white border border-gray-200 rounded-full px-5 py-3 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 transition-all';
  const labelStyle = 'text-xs font-bold text-gray-700 mb-2 ml-3 block';

  return (
    <div className="bg-gray-50 min-h-screen font-sans pb-20">
      {/* Ukuran diubah ke max-w-4xl agar ukuran sedang/pas */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-[32px] shadow-sm p-10 border border-gray-100">
          
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create an Event</h2>
            <p className="text-sm text-gray-400 mt-1">Fill in the details below to list your event on EventRent</p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            
            {/* Upload Image Section */}
            <div>
              <label className={labelStyle}>Event Poster</label>
              <div className="relative group">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-200 rounded-[24px] cursor-pointer bg-gray-50 hover:bg-gray-100 transition-all overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-3 text-gray-400 group-hover:text-[#FF6B35] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                      <p className="text-xs text-gray-500 font-medium">Click to upload or drag & drop</p>
                    </div>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              </div>
            </div>

            {/* 1. Judul Event */}
            <div>
              <label htmlFor="title" className={labelStyle}>Event Title</label>
              <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Enter your title event" required className={inputStyle} />
            </div>

            {/* 2. Kategori & Lokasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className={labelStyle}>Category</label>
                <div className="relative">
                  {/* bg-white ditambahkan untuk memastikan tidak abu-abu */}
                  <select 
                    id="category" name="category" 
                    value={formData.category} onChange={handleChange} 
                    required 
                    className={`${inputStyle} appearance-none pr-10 bg-white`} 
                    style={{ color: formData.category ? '#374151' : '#9CA3AF' }}
                  >
                    <option value="" disabled hidden>Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat} className="text-gray-700">{cat}</option>
                    ))}
                  </select>
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <div>
                <label htmlFor="location" className={labelStyle}>Location</label>
                <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} required placeholder="Enter location" className={inputStyle} />
              </div>
            </div>

            {/* 3. Tanggal & Waktu */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <label htmlFor="date" className={labelStyle}>Date</label>
                <div className="relative">
                  <input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required className={`${inputStyle} cursor-pointer`} />
                </div>
              </div>
              <div className="group">
                <label htmlFor="time" className={labelStyle}>Time</label>
                <div className="relative">
                  <input type="time" id="time" name="time" value={formData.time} onChange={handleChange} required className={`${inputStyle} cursor-pointer`} />
                </div>
              </div>
            </div>

            {/* 4. Harga */}
            <div>
              <label htmlFor="price" className={labelStyle}>Price (Rp)</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">Rp</span>
                <input type="text" id="price" name="price" value={formData.price} onChange={handleChange} placeholder="0.00" className={`${inputStyle} pl-12`} />
              </div>
            </div>

            {/* 5. Deskripsi */}
            <div>
              <label htmlFor="description" className={labelStyle}>Description</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Tell people about event" rows="4" className="w-full border border-gray-200 rounded-[20px] px-5 py-4 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-[#FF6B35] transition resize-none min-h-[120px]" />
              <p className="text-[10px] text-gray-400 mt-2 ml-4 italic">Give a clear description to attract more visitors</p>
            </div>

            {/* Tombol Aksi */}
            <div className="flex justify-end items-center gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => navigate('/')} 
                className="text-gray-400 hover:text-gray-600 px-6 py-2.5 font-bold text-sm transition"
              >
                Cancel
              </button>
              
              <button 
                type="submit" 
                className="bg-gradient-to-r from-orange-400 to-[#FF6B35] text-white px-10 py-3 rounded-full font-bold text-sm shadow-lg shadow-orange-100 hover:shadow-orange-200 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
              >
                Create Event
              </button>
            </div>
          </form>

        </div>
      </main>
    </div>
  );
}
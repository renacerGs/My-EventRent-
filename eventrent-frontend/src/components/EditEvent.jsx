import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [formData, setFormData] = useState({
    title: '',
    phone: '', // <--- FIELD BARU
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
            stock: found.stock || 0, // <--- Load stock lama
            description: found.description,
          });
          setImagePreview(found.img);
        }
        setIsLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        navigate('/manage');
      } else {
        alert("Gagal update event");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const labelStyle = "block text-sm font-bold text-gray-800 mb-2";
  const inputStyle = "w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-orange-200 transition bg-white";
  const sectionStyle = "bg-white p-6 md:p-8 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-gray-100 mb-6";

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-32 pt-10 font-sans">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="flex items-center justify-between mb-8">
           <h1 className="text-2xl font-black text-gray-900">Edit Event</h1>
           <button onClick={() => navigate('/manage')} className="text-gray-500 hover:text-gray-900 font-bold text-sm">Cancel</button>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div className={sectionStyle}>
            <h2 className="text-lg font-black text-gray-900 mb-6 pb-4 border-b border-gray-100">Event Overview</h2>
            
            <div className="mb-6">
              <label className={labelStyle}>Event Title <span className="text-red-500">*</span></label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required className={inputStyle} />
            </div>

            {/* INPUT PHONE DISINI */}
            <div className="mb-6">
              <label className={labelStyle}>WhatsApp / Contact Person <span className="text-red-500">*</span></label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className={inputStyle} placeholder="Ex: 08123456789" />
            </div>

            <div>
              <label className={labelStyle}>Summary / Description <span className="text-red-500">*</span></label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" required className={inputStyle} />
            </div>
          </div>

          <div className={sectionStyle}>
            <h2 className="text-lg font-black text-gray-900 mb-6 pb-4 border-b border-gray-100">Date and Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div><label className={labelStyle}>Date</label><input type="date" name="date" value={formData.date} onChange={handleChange} required className={inputStyle} /></div>
              <div><label className={labelStyle}>Time</label><input type="time" name="time" value={formData.time} onChange={handleChange} required className={inputStyle} /></div>
            </div>
            <div className="mb-6">
              <label className={labelStyle}>Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} required className={inputStyle} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className={labelStyle}>Category</label>
                  <select name="category" value={formData.category} onChange={handleChange} className={inputStyle}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               <div><label className={labelStyle}>Price (Rp)</label><input type="number" name="price" value={formData.price} onChange={handleChange} className={inputStyle} /></div>
               
               {/* INPUT STOCK BARU */}
               <div><label className={labelStyle}>Stock</label><input type="number" name="stock" value={formData.stock} onChange={handleChange} required className={inputStyle} /></div>
            </div>
          </div>

          <div className={sectionStyle}>
            <h2 className="text-lg font-black text-gray-900 mb-6 pb-4 border-b border-gray-100">Event Image</h2>
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-full md:w-64 h-40 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 relative group">
                 {imagePreview && <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />}
              </div>
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-gray-50 transition shadow-sm">
                  Change Image
                  <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-[#E85526] text-white px-10 py-4 rounded-xl font-bold text-sm shadow-xl shadow-orange-200 hover:bg-[#d1461b] transition-all transform hover:-translate-y-1 active:scale-95">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
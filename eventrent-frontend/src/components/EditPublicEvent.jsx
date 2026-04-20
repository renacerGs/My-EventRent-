import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';

import CustomDatePicker from './shared/CustomDatePicker';

const formatDateForInput = (dateStr) => {
  if (!dateStr || dateStr.includes('TBA') || dateStr.includes('-')) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (err) {
    return '';
  }
};

export default function EditPublicEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  
  // 👇 FIX 1: Ambil ID user aja buat nge-trigger useEffect, jangan full object!
  const userId = user?.id;

  const [formData, setFormData] = useState({
    title: '', phone: '', category: '', description: '', place: '',
    namePlace: '', city: '', province: '', mapUrl: '', eventStart: '', eventEnd: '', oldImgUrl: ''
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const categories = ['Music', 'Food', 'Tech', 'Religious', 'Arts', 'Sports', 'Seminar', 'Workshop'];

  // 👇 FIX 2: Ganti array dependency 'user' jadi 'userId'
  useEffect(() => {
    if (!userId) { navigate('/'); return; }

    fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}`) 
      .then(res => {
        if (!res.ok) throw new Error("Gagal load event");
        return res.json();
      })
      .then(found => {
        if (found.category === 'Wedding' || found.category === 'Personal' || found.is_private) {
          toast.error("Ini adalah Private Event. Silakan edit melalui menu yang sesuai.");
          navigate('/manage');
          return;
        }

        setFormData({
          title: found.title || '',
          phone: found.contact || '',
          category: found.category || 'Music',
          description: found.description || '',
          place: found.place || '',
          namePlace: found.name_place || '',
          city: found.city || '',
          province: found.province || '',
          mapUrl: found.map_url || '',
          eventStart: formatDateForInput(found.date_start), 
          eventEnd: formatDateForInput(found.date_end),
          oldImgUrl: found.img || ''
        });
        setImagePreview(found.img);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        toast.error("Gagal memuat data edit");
        navigate('/manage');
      });
  }, [id, navigate, userId]); // <--- SEKARANG UDAH AMAN DARI INFINITE LOOP!

  const handleChange = (e) => {
    if (e && e.target) {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (e && e.name && e.value !== undefined) {
      setFormData(prev => ({ ...prev, [e.name]: e.value }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setImageFile(file); 
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      let finalImageUrl = formData.oldImgUrl;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `cover-public-${Date.now()}-${Math.floor(Math.random()*1000)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('event-posters')
          .upload(fileName, imageFile, { contentType: imageFile.type, upsert: false });

        if (error) throw new Error("Gagal mengunggah gambar baru ke Supabase.");
        
        const { data: publicUrlData } = supabase.storage.from('event-posters').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      const payload = { 
        title: formData.title, description: formData.description, category: formData.category, phone: formData.phone,
        eventStart: formData.eventStart, eventEnd: formData.eventEnd,      
        location: { place: formData.place, namePlace: formData.namePlace, city: formData.city, province: formData.province, mapUrl: formData.mapUrl },
        img: finalImageUrl, 
        isPrivate: false 
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}?userId=${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowSuccessModal(true);
        setTimeout(() => { navigate('/manage'); }, 1500); 
      } else {
        toast.error("Gagal update event. Pastikan kamu pembuat event ini.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-400">Loading Edit Form...</div>;

  const labelStyle = "block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1";
  const inputStyle = "w-full bg-white border border-gray-200 rounded-xl px-5 py-4 text-sm font-bold text-gray-900 placeholder-gray-300 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-all";
  const sectionStyle = "bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 mb-8";

  return (
    <div className="bg-[#F8F9FA] min-h-screen pb-32 pt-10 font-sans relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        <div className="flex items-center justify-between mb-6">
           <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Edit Public Event</h1>
           <button onClick={() => navigate('/manage')} className="text-gray-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-colors">Batal</button>
        </div>

        <div className="bg-[#FFF5F0] border-l-[6px] border-[#FF6B35] p-5 mb-8 rounded-r-2xl shadow-sm flex items-start gap-4">
           <div className="bg-[#FF6B35] bg-opacity-10 p-2 rounded-full shrink-0">
              <svg className="w-5 h-5 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
           </div>
           <div>
             <h3 className="text-sm font-black text-[#FF6B35] mb-1 uppercase tracking-wider">Perhatian Buat Organizer</h3>
             <p className="text-xs text-gray-600 leading-relaxed font-medium">
               Untuk menjaga validitas dan keamanan data transaksi peserta yang sudah membeli tiket, <strong className="text-gray-900 font-bold">Sesi Tiket, Harga, Kuota, dan Custom Form TIDAK DAPAT DIUBAH</strong> setelah event dibuat. Anda hanya dapat memperbarui informasi dasar di bawah ini.
             </p>
           </div>
        </div>

        <form onSubmit={handleSubmit}>
          
          <div className={sectionStyle}>
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Event Overview</h2>
            
            <div className="mb-6">
              <label className={labelStyle}>Event Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required className={inputStyle} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className={labelStyle}>Category</label>
                <select name="category" value={formData.category} onChange={handleChange} required className={inputStyle}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelStyle}>Contact Person (WA)</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className={inputStyle} />
              </div>
            </div>

            <div>
              <label className={labelStyle}>Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="6" required className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm font-medium text-gray-700 placeholder-gray-300 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] transition-all resize-none" />
            </div>
          </div>

          <div className={sectionStyle}>
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Date & Location</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className={labelStyle}>Tanggal Mulai</label>
                <CustomDatePicker 
                  theme="public"
                  value={formData.eventStart} 
                  onChange={(newDate) => handleChange({ name: 'eventStart', value: newDate })} 
                  placeholder="Pilih Tanggal Mulai"
                />
              </div>
              <div>
                <label className={labelStyle}>Tanggal Selesai</label>
                <CustomDatePicker 
                  theme="public"
                  value={formData.eventEnd} 
                  onChange={(newDate) => handleChange({ name: 'eventEnd', value: newDate })} 
                  placeholder="Pilih Tanggal Selesai"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className={labelStyle}>Nama Tempat / Gedung</label>
              <input type="text" name="namePlace" value={formData.namePlace} onChange={handleChange} placeholder="Contoh: Palur Plaza" className={inputStyle} />
            </div>

            <div className="mb-6">
              <label className={labelStyle}>Alamat Lengkap</label>
              <input type="text" name="place" value={formData.place} onChange={handleChange} required className={inputStyle} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className={labelStyle}>Kota</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} required className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Provinsi</label>
                <input type="text" name="province" value={formData.province} onChange={handleChange} required className={inputStyle} />
              </div>
            </div>

            <div>
              <label className={labelStyle}>Google Maps URL (Opsional)</label>
              <input type="url" name="mapUrl" value={formData.mapUrl} onChange={handleChange} placeholder="https://goo.gl/maps/..." className={inputStyle} />
            </div>
          </div>

          <div className={sectionStyle}>
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Event Banner</h2>
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="w-full md:w-80 aspect-video bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 relative flex-shrink-0">
                 {imagePreview ? (
                   <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs uppercase tracking-widest">No Image</div>
                 )}
              </div>
              <div className="flex-1 text-center md:text-left w-full">
                <label className="cursor-pointer inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md w-full md:w-auto">
                  <svg className="w-4 h-4 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  Ganti Gambar
                  <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </label>
                <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-wider">Maksimal 2MB. Format: JPG, PNG, WEBP.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isSaving} className="w-full md:w-auto bg-[#FF6B35] text-white px-12 py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-[#E85526] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL SUCCESS */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl transform transition-all text-center">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border-[6px] border-green-100">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Sukses!</h3>
            <p className="text-gray-500 text-sm font-medium mb-2">
              Detail event publik berhasil diperbarui.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
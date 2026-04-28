import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import toast from 'react-hot-toast';
import { Landmark } from 'lucide-react'; 

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
  
  const userId = user?.id;

  const [formData, setFormData] = useState({
    title: '', phone: '', category: '', description: '', place: '',
    namePlace: '', city: '', province: '', mapUrl: '', eventStart: '', eventEnd: '', oldImgUrl: '',
    paymentMethods: {
      qris: true,
      va: true,
      transferBank: false
    }
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const categories = ['Music', 'Food', 'Tech', 'Religious', 'Arts', 'Sports', 'Seminar', 'Workshop'];

  // 🔥 GET DATA EVENT (DITAMBAHIN TOKEN BIAR SATPAM NGGAK MARAH)
  useEffect(() => {
    if (!userId) { navigate('/'); return; }

    const fetchEditData = async () => {
      try {
        const token = localStorage.getItem('supabase_token');
        if (!token) throw new Error("No token found");

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}` // 👈 Ini KTP lu bro
          }
        });

        if (!res.ok) throw new Error("Failed to load event data");
        const found = await res.json();

        if (found.category === 'Wedding' || found.category === 'Personal' || found.is_private) {
          toast.error("This is a Private Event. Please edit through the appropriate menu.");
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
          oldImgUrl: found.img || '',
          paymentMethods: found.paymentMethods || { qris: true, va: true, transferBank: false }
        });
        setImagePreview(found.img);
        setIsLoading(false);

      } catch (err) {
        console.error(err);
        toast.error("Failed to load event details");
        navigate('/manage');
      }
    };

    fetchEditData();
  }, [id, navigate, userId]);

  const handleChange = (e) => {
    if (e && e.target) {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    } else if (e && e.name && e.value !== undefined) {
      setFormData(prev => ({ ...prev, [e.name]: e.value }));
    }
  };

  const togglePaymentMethod = (method) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [method]: !prev.paymentMethods[method]
      }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
      setImageFile(file); 
    }
  };

  // 🔥 SUBMIT DATA EVENT (DITAMBAHIN TOKEN JUGA)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.paymentMethods.qris && !formData.paymentMethods.va && !formData.paymentMethods.transferBank) {
      return toast.error("You must enable at least one payment method!");
    }

    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('supabase_token');
      if (!token) throw new Error("Authentication failed");

      let finalImageUrl = formData.oldImgUrl;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `cover-public-${Date.now()}-${Math.floor(Math.random()*1000)}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('event-posters')
          .upload(fileName, imageFile, { contentType: imageFile.type, upsert: false });

        if (error) throw new Error("Failed to upload new image to Supabase.");
        
        const { data: publicUrlData } = supabase.storage.from('event-posters').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      const payload = { 
        title: formData.title, description: formData.description, category: formData.category, phone: formData.phone,
        eventStart: formData.eventStart, eventEnd: formData.eventEnd,      
        location: { place: formData.place, namePlace: formData.namePlace, city: formData.city, province: formData.province, mapUrl: formData.mapUrl },
        img: finalImageUrl, 
        isPrivate: false,
        paymentMethods: formData.paymentMethods 
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // 👈 Token lu wajib ikut
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowSuccessModal(true);
        setTimeout(() => { navigate('/manage'); }, 1500); 
      } else {
        toast.error("Failed to update event. Make sure you are the event organizer.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "An error occurred while saving data.");
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
           <button onClick={() => navigate('/manage')} className="text-gray-400 hover:text-red-500 font-bold text-xs uppercase tracking-widest transition-colors">Cancel</button>
        </div>

        <div className="bg-[#FFF5F0] border-l-[6px] border-[#FF6B35] p-5 mb-8 rounded-r-2xl shadow-sm flex items-start gap-4">
           <div className="bg-[#FF6B35] bg-opacity-10 p-2 rounded-full shrink-0">
              <svg className="w-5 h-5 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
           </div>
           <div>
             <h3 className="text-sm font-black text-[#FF6B35] mb-1 uppercase tracking-wider">Notice for Organizers</h3>
             <p className="text-xs text-gray-600 leading-relaxed font-medium">
               To maintain data validity and transaction security for attendees who have purchased tickets, <strong className="text-gray-900 font-bold">Ticket Sessions, Prices, Quotas, and Custom Forms CANNOT BE EDITED</strong> after the event is created. You can only update the basic information below.
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
                <label className={labelStyle}>Contact Person (WhatsApp)</label>
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
                <label className={labelStyle}>Start Date</label>
                <CustomDatePicker 
                  theme="public"
                  value={formData.eventStart} 
                  onChange={(newDate) => handleChange({ name: 'eventStart', value: newDate })} 
                  placeholder="Select Start Date"
                />
              </div>
              <div>
                <label className={labelStyle}>End Date</label>
                <CustomDatePicker 
                  theme="public"
                  value={formData.eventEnd} 
                  onChange={(newDate) => handleChange({ name: 'eventEnd', value: newDate })} 
                  placeholder="Select End Date"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className={labelStyle}>Venue / Building Name</label>
              <input type="text" name="namePlace" value={formData.namePlace} onChange={handleChange} placeholder="E.g., Grand Ballroom Hotel" className={inputStyle} />
            </div>

            <div className="mb-6">
              <label className={labelStyle}>Full Address</label>
              <input type="text" name="place" value={formData.place} onChange={handleChange} required className={inputStyle} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className={labelStyle}>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} required className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Province</label>
                <input type="text" name="province" value={formData.province} onChange={handleChange} required className={inputStyle} />
              </div>
            </div>

            <div>
              <label className={labelStyle}>Google Maps URL (Optional)</label>
              <input type="url" name="mapUrl" value={formData.mapUrl} onChange={handleChange} placeholder="https://goo.gl/maps/..." className={inputStyle} />
            </div>
          </div>

          <div className={sectionStyle}>
            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">Payment Methods Setting</h2>
            <p className="text-sm text-gray-500 mb-6 font-medium">Select the payment methods you want to offer to your attendees.</p>

            <div className="space-y-4">
              {/* QRIS */}
              <label className={`flex items-center p-4 md:p-5 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMethods.qris ? 'border-[#FF6B35] bg-orange-50/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-center mr-4">
                  <input type="checkbox" checked={formData.paymentMethods.qris} onChange={() => togglePaymentMethod('qris')} className="w-5 h-5 rounded cursor-pointer accent-[#FF6B35]" />
                </div>
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mr-4 shrink-0 font-black text-xs shadow-sm">
                  QRIS
                </div>
                <div>
                  <p className="font-bold text-gray-900 md:text-lg">QR Code (QRIS)</p>
                  <p className="text-xs text-gray-500 mt-0.5">GOPAY, OVO, DANA, ETC.</p>
                </div>
              </label>

              {/* Virtual Account */}
              <label className={`flex items-center p-4 md:p-5 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMethods.va ? 'border-[#FF6B35] bg-orange-50/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-center mr-4">
                  <input type="checkbox" checked={formData.paymentMethods.va} onChange={() => togglePaymentMethod('va')} className="w-5 h-5 rounded cursor-pointer accent-[#FF6B35]" />
                </div>
                <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center mr-4 shrink-0 font-black text-xs shadow-sm border border-gray-200">
                  VA
                </div>
                <div>
                  <p className="font-bold text-gray-900 md:text-lg">Virtual Account</p>
                  <p className="text-xs text-gray-500 mt-0.5">BCA, MANDIRI, BNI, BRI, ETC.</p>
                </div>
              </label>

              {/* Transfer Bank */}
              <label className={`flex items-center p-4 md:p-5 border-2 rounded-2xl cursor-pointer transition-all ${formData.paymentMethods.transferBank ? 'border-[#FF6B35] bg-orange-50/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                <div className="flex items-center justify-center mr-4">
                  <input type="checkbox" checked={formData.paymentMethods.transferBank} onChange={() => togglePaymentMethod('transferBank')} className="w-5 h-5 rounded cursor-pointer accent-[#FF6B35]" />
                </div>
                <div className="w-12 h-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center mr-4 shrink-0 shadow-sm border border-gray-200">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 md:text-lg">Bank Transfer</p>
                  <p className="text-xs text-gray-500 mt-0.5">BCA, MANDIRI, PERMATA, ETC.</p>
                </div>
              </label>
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
                  Change Image
                  <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                </label>
                <p className="text-[10px] text-gray-400 mt-4 font-bold uppercase tracking-wider">Max 2MB. Format: JPG, PNG, WEBP.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={isSaving} className="w-full md:w-auto bg-[#FF6B35] text-white px-12 py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-orange-100 hover:bg-[#E85526] hover:-translate-y-1 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {isSaving ? 'Saving...' : 'Save Changes'}
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
            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">Success!</h3>
            <p className="text-gray-500 text-sm font-medium mb-2">
              Public event details updated successfully.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
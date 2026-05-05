import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function UploadProof() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchOrderInfo();
  }, [orderId]);

  const fetchOrderInfo = async () => {
    try {
      // Endpoint ini harus bisa diakses publik tanpa token
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/payment-info`);
      if (!res.ok) throw new Error('Pesanan tidak ditemukan');
      const data = await res.json();
      setOrderInfo(data);
    } catch (err) {
      console.error(err);
      toast.error('Pesanan tidak ditemukan atau tidak valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      return toast.error('Ukuran file maksimal 5MB!');
    }
    if (!selectedFile.type.startsWith('image/')) {
      return toast.error('Harap upload file berupa gambar (JPG/PNG).');
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Pilih gambar terlebih dahulu!');

    setIsUploading(true);
    const toastId = toast.loading('Sedang mengunggah bukti...');

    try {
      // 1. Upload ke Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}-${Date.now()}.${fileExt}`;
      const filePath = `transfers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment_proofs')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Dapatkan Link Publik
      const { data: { publicUrl } } = supabase.storage
        .from('payment_proofs')
        .getPublicUrl(filePath);

      // 3. Tembak Backend (TANPA TOKEN/AUTH agar Guest bisa upload)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/${orderId}/proof`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ proofUrl: publicUrl })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal memperbarui status di server');
      }

      toast.success('Bukti berhasil dikirim! Mohon tunggu verifikasi admin.', { id: toastId });
      
      // Reset form dan refresh data
      setFile(null);
      setPreviewUrl(null);
      fetchOrderInfo(); 

    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Terjadi kesalahan saat mengunggah.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-400">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin mb-4"></div>
      <p className="font-bold uppercase tracking-widest text-xs">Mencari Data Pesanan...</p>
    </div>
  );

  if (!orderInfo) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
      <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </div>
      <h1 className="text-2xl font-black text-gray-900">Pesanan Tidak Ditemukan</h1>
      <p className="text-gray-500 mt-2">Link mungkin sudah kedaluwarsa atau Order ID salah.</p>
      <button onClick={() => navigate('/')} className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-black transition-all">Kembali ke Beranda</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 font-sans flex flex-col items-center">
      
      {/* Brand Header */}
      <div className="mb-8 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
        <div className="w-8 h-8 bg-[#FF6B35] rounded-lg flex items-center justify-center text-white font-black text-lg">ER</div>
        <span className="font-black text-xl tracking-tighter text-gray-900 uppercase">EventRent</span>
      </div>

      <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8 md:p-10 relative overflow-hidden">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-gray-900 mb-1 uppercase tracking-tight">Konfirmasi Bayar</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID: #{orderId}</p>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-6 mb-8 text-center ring-4 ring-orange-50/50">
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Total Tagihan</p>
          <p className="text-3xl font-black text-gray-900 tracking-tight">Rp {Number(orderInfo.total_price).toLocaleString('id-ID')}</p>
        </div>

        {orderInfo.payment_status === 'SUCCESS' ? (
          <div className="text-center py-10 bg-emerald-50 rounded-[24px] border border-emerald-100">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
            </div>
            <h3 className="text-xl font-black text-emerald-900 uppercase tracking-tight">Pembayaran Lunas!</h3>
            <p className="text-xs text-emerald-700 mt-2 px-4 leading-relaxed font-medium">Tiket Anda telah terbit dan dikirimkan ke alamat email pembeli. Silakan cek Inbox atau folder Spam.</p>
            <button onClick={() => navigate('/')} className="mt-6 text-[10px] font-black text-emerald-600 uppercase tracking-widest underline">Kembali Cari Event</button>
          </div>
        ) : orderInfo.payment_status === 'WAITING_VERIFICATION' ? (
          <div className="text-center py-10 bg-yellow-50 rounded-[24px] border border-yellow-100">
            <div className="w-16 h-16 bg-yellow-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-200 animate-pulse">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-xl font-black text-yellow-900 uppercase tracking-tight">Dalam Verifikasi</h3>
            <p className="text-xs text-yellow-700 mt-2 px-4 leading-relaxed font-medium">Bukti transfer Anda sudah kami terima dan sedang divalidasi oleh admin. Tiket akan dikirim segera!</p>
          </div>
        ) : (
          <form onSubmit={handleUploadSubmit}>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Unggah Struk Transfer</p>
            <div className="relative border-2 border-dashed border-gray-200 rounded-3xl p-6 hover:bg-gray-50 hover:border-[#FF6B35]/40 transition-all mb-8 group cursor-pointer overflow-hidden min-h-[200px] flex flex-col items-center justify-center">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                required
              />
              {previewUrl ? (
                <div className="relative w-full h-full">
                  <img src={previewUrl} alt="Preview" className="w-full h-48 object-contain rounded-xl" />
                  <p className="text-[9px] font-black text-center text-[#FF6B35] mt-2 uppercase tracking-widest">Klik untuk ganti foto</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform group-hover:bg-orange-100 group-hover:text-[#FF6B35]">
                    <svg className="w-6 h-6 text-gray-400 group-hover:text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                  </div>
                  <p className="text-sm font-bold text-gray-700">Pilih Foto Struk</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mt-1 tracking-wider">Format JPG/PNG • Max 5MB</p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!file || isUploading}
              className="w-full py-4.5 bg-[#FF6B35] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#e85b2a] hover:shadow-xl hover:shadow-orange-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale flex justify-center items-center gap-3 shadow-lg shadow-orange-500/20"
            >
              {isUploading ? (
                <><div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div> Memproses...</>
              ) : (
                <><svg className="w-4 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg> Kirim Konfirmasi</>
              )}
            </button>
          </form>
        )}
      </div>

      <p className="mt-8 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Powered by EventRent Ticketing System</p>
    </div>
  );
}
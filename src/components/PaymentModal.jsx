import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export default function PaymentModal({ isOpen, onClose, onConfirm, eventTitle, quantity, totalPrice, isBuying }) {
  const [selectedMethod, setSelectedMethod] = useState('gopay'); // Default pilihan

  if (!isOpen) return null;

  const paymentMethods = [
    { id: 'gopay', name: 'Gopay', icon: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Gopay_logo.svg' },
    { id: 'dana', name: 'DANA', icon: 'https://upload.wikimedia.org/wikipedia/commons/7/72/Logo_dana_blue.svg' },
    { id: 'bank', name: 'Rekening Bank', icon: 'https://img.icons8.com/ios-filled/50/000000/bank.png' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl p-8"
        >
          <div className="text-center mb-6">
            <h3 className="text-2xl font-black text-gray-900">Pembayaran</h3>
            <p className="text-gray-500 text-sm">Pilih metode pembayaran favoritmu</p>
          </div>

          {/* PILIHAN METODE PEMBAYARAN */}
          <div className="space-y-3 mb-8">
            {paymentMethods.map((method) => (
              <label 
                key={method.id}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedMethod === method.id ? 'border-[#FF6B35] bg-orange-50' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <img src={method.icon} alt={method.name} className="h-6 w-auto object-contain" />
                  <span className="font-bold text-gray-800">{method.name}</span>
                </div>
                <input 
                  type="radio" 
                  name="payment" 
                  className="accent-[#FF6B35] w-5 h-5"
                  checked={selectedMethod === method.id}
                  onChange={() => setSelectedMethod(method.id)}
                />
              </label>
            ))}
          </div>

          {/* RINGKASAN HARGA */}
          <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-bold text-xs uppercase">Total Bayar</span>
              <span className="text-[#FF6B35] font-black text-xl">Rp {totalPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => onConfirm(selectedMethod)}
              disabled={isBuying}
              className="w-full py-4 bg-[#FF6B35] text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-[#e85526] transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isBuying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Memproses...
                </>
              ) : 'Bayar Sekarang'}
            </button>
            <button
              onClick={onClose}
              disabled={isBuying}
              className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
            >
              Batal
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
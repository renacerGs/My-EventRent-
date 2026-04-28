import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

// --- FUNGSI FORMAT TANGGAL ---
const formatPrettyDate = (dateString) => {
  if (!dateString) return '';
  try {
    const rawDate = dateString.split(' - ')[0].trim();
    const timePart = dateString.includes(' - ') ? ` - ${dateString.split(' - ')[1]}` : '';
    const dateObj = new Date(rawDate);
    if (isNaN(dateObj.getTime())) return dateString;
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(dateObj);
    return `${formattedDate}${timePart}`;
  } catch (error) {
    return dateString;
  }
};

export default function Likes() {
  const [likedEvents, setLikedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [eventToUnlike, setEventToUnlike] = useState(null); 
  const [shareEvent, setShareEvent] = useState(null);
  const [popup, setPopup] = useState({ isOpen: false, message: '', type: 'info' });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const showPopup = (message, type = 'info') => {
    setPopup({ isOpen: true, message, type });
  };

  const closePopup = () => {
    setPopup({ isOpen: false, message: '', type: 'info' });
  };

  useEffect(() => {
    const fetchLikedEvents = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem('supabase_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/likes/my`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data) {
          const validData = Array.isArray(response.data) ? response.data : [];
          setLikedEvents(validData);
          localStorage.setItem('likedEvents', JSON.stringify(validData));
        }
      } catch (error) {
        console.error("Failed to fetch likes data:", error);
        showPopup("Failed to fetch wishlist data from the server.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchLikedEvents();
  }, [user?.id]); 

  const triggerUnlikeConfirmation = (e, eventId) => {
    e.preventDefault(); 
    e.stopPropagation();
    setEventToUnlike(eventId); 
  };

  const confirmUnlike = async () => {
    if (!eventToUnlike) return;
    
    const updatedLikes = likedEvents.filter(event => event.id !== eventToUnlike);
    setLikedEvents(updatedLikes);
    localStorage.setItem('likedEvents', JSON.stringify(updatedLikes)); 
    const currentEventId = eventToUnlike;
    setEventToUnlike(null);
    
    const token = localStorage.getItem('supabase_token');

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/likes/toggle`, 
      {
        eventId: currentEventId
      }, 
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error("Failed to unlike event:", error);
      showPopup("Failed to remove event from wishlist.", "error");
    }
  };

  const triggerShareMenu = (e, event) => {
    e.preventDefault(); 
    e.stopPropagation();
    setShareEvent(event);
  };

  const executeShare = async (platform) => {
    if (!shareEvent) return;
    
    const url = `${window.location.origin}/event/${shareEvent.id}`;
    const text = `Check out this awesome event: ${shareEvent.title}`;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text + '\n\n');

    try {
      if (platform === 'wa') {
        window.open(`https://wa.me/?text=${encodedText}${encodedUrl}`, '_blank');
      } else if (platform === 'x') {
        window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
      } else if (platform === 'fb') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
      } else if (platform === 'copy') {
        await navigator.clipboard.writeText(url);
        showPopup("Link successfully copied!", "success");
      } else if (platform === 'native' && navigator.share) {
        await navigator.share({ title: shareEvent.title, text: text, url: url });
      }
    } catch (err) {
      console.error("Failed to share:", err);
      showPopup("Failed to share the event.", "error");
    } finally {
      setShareEvent(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-10 px-4 md:px-8 font-sans text-left relative">
      
      {/* POPUP INFO */}
      <AnimatePresence>
        {popup.isOpen && (
          <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`w-full max-w-sm rounded-[32px] p-8 text-center shadow-2xl relative overflow-hidden ${popup.type === 'error' ? 'bg-[#E24A29]' : popup.type === 'success' ? 'bg-[#27AE60]' : 'bg-gray-800'}`}
            >
              <div className={`w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${popup.type === 'error' ? 'text-[#E24A29]' : popup.type === 'success' ? 'text-[#27AE60]' : 'text-gray-800'}`}>
                {popup.type === 'error' ? (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                ) : popup.type === 'success' ? (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                )}
              </div>
              
              <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">
                {popup.type === 'error' ? 'Oops!' : popup.type === 'success' ? 'Success!' : 'Info'}
              </h2>
              <p className="text-white/90 font-medium mb-8">{popup.message}</p>
              
              <button 
                onClick={closePopup} 
                className={`w-full bg-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95 ${popup.type === 'error' ? 'text-[#E24A29] hover:bg-red-50' : popup.type === 'success' ? 'text-[#27AE60] hover:bg-green-50' : 'text-gray-900 hover:bg-gray-50'}`}
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-[#FF6B35] hover:border-[#FF6B35] shadow-sm transition-all active:scale-95">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight m-0">Wishlist</h1>
          </div>
          <span className="bg-orange-50 text-[#FF6B35] px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest border border-orange-100">
            {likedEvents.length} Events
          </span>
        </div>

        {/* EMPTY STATES */}
        {!user ? (
          <div className="text-center py-24 bg-white rounded-[40px] shadow-sm border border-gray-100">
            <p className="text-gray-500 mb-6 font-bold uppercase tracking-widest text-sm">Please login to see your liked events.</p>
            <Link to="/" className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl">Login Now</Link>
          </div>
        ) : likedEvents.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[40px] shadow-sm border border-gray-100">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <span className="text-4xl">💔</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-wide">Empty Wishlist</h3>
            <p className="text-gray-500 font-medium mb-8">You haven't added any events to your favorites yet.</p>
            <Link to="/" className="bg-[#FF6B35] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-orange-100 hover:bg-[#E85526] transition-all active:scale-95">
              Search Events Now
            </Link>
          </div>
        ) : (
          /* GRID EVENTS */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <AnimatePresence>
              {likedEvents.map((event) => (
                <motion.div 
                  key={event.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  className="group bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl hover:border-orange-100 transition-all duration-300 flex flex-col cursor-pointer"
                  onClick={() => navigate(`/event/${event.id}`)}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                    <img src={event.img} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                    
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm">
                      <svg className="w-3.5 h-3.5 text-[#FF6B35]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                      <span className="text-[10px] font-black text-gray-900 uppercase">{event.category}</span>
                    </div>
                    
                    <button 
                      onClick={(e) => triggerUnlikeConfirmation(e, event.id)} 
                      className="absolute top-4 right-4 bg-white p-2.5 rounded-full text-red-500 shadow-md hover:scale-110 active:scale-95 transition-transform z-10"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </button>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-black text-xl text-gray-900 leading-tight line-clamp-2 group-hover:text-[#FF6B35] transition-colors">{event.title}</h3>
                    </div>
                    
                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex items-center text-gray-500 text-xs font-bold">
                        <svg className="w-4 h-4 mr-2 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <span className="uppercase tracking-wider truncate">{formatPrettyDate(event.date)}</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-xs font-bold">
                        <svg className="w-4 h-4 mr-2 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span className="uppercase tracking-wider truncate">{event.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tickets & Info</p>
                        <p className="font-bold text-sm text-[#FF6B35] leading-none flex items-center gap-1">
                          View Details
                          <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                        </p>
                      </div>
                      <button 
                        onClick={(e) => triggerShareMenu(e, event)}
                        className="bg-gray-50 hover:bg-orange-50 text-gray-400 hover:text-[#FF6B35] p-2.5 rounded-xl transition-colors"
                        title="Share Event"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      </button>
                    </div>

                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* --- MODAL SHARE MENU --- */}
      <AnimatePresence>
        {shareEvent && (
          <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/60 backdrop-blur-sm" onClick={() => setShareEvent(null)}>
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-gray-900 uppercase tracking-widest text-sm">Share Event</h3>
                <button onClick={() => setShareEvent(null)} className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
                <img src={shareEvent.img} alt="preview" className="w-14 h-14 object-cover rounded-xl shadow-sm" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-bold text-gray-900 truncate leading-tight">{shareEvent.title}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 truncate">{formatPrettyDate(shareEvent.date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <button onClick={() => executeShare('wa')} className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-green-500 group-hover:text-white transition-all shadow-sm">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.655-1.484-1.464-1.657-1.763-.173-.298-.018-.458.13-.606.148-.148.348-.348.52-.522.172-.174.232-.298.348-.497.116-.199.058-.375-.017-.524-.075-.148-.67-1.618-.918-2.215-.242-.579-.487-.5-.67-.51-.172-.008-.371-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600">WhatsApp</span>
                </button>
                
                <button onClick={() => executeShare('x')} className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 bg-gray-100 text-gray-900 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-gray-900 group-hover:text-white transition-all shadow-sm">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 24.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600">X (Twitter)</span>
                </button>

                <button onClick={() => executeShare('fb')} className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600">Facebook</span>
                </button>

                <button onClick={() => executeShare('copy')} className="flex flex-col items-center gap-2 group">
                  <div className="w-14 h-14 bg-orange-50 text-[#FF6B35] rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-[#FF6B35] group-hover:text-white transition-all shadow-sm">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-600">Copy Link</span>
                </button>
              </div>

              {navigator.share && (
                <button onClick={() => executeShare('native')} className="w-full mt-6 py-4 bg-gray-50 text-gray-600 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-100 transition-colors">
                  More Options...
                </button>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL KONFIRMASI UNLIKE --- */}
      <AnimatePresence>
        {eventToUnlike && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 border-[6px] border-red-100">
                  <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">Remove from Wishlist?</h3>
                <p className="text-gray-500 text-sm mb-8 font-medium">
                  Are you sure you want to remove this event from your favorites? You can always find it again on the main page.
                </p>
                
                <div className="flex w-full gap-4">
                  <button 
                    onClick={() => setEventToUnlike(null)} 
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmUnlike} 
                    className="flex-1 py-4 bg-red-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-red-600 shadow-xl shadow-red-100 transition-all active:scale-95"
                  >
                    Yes, Remove
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
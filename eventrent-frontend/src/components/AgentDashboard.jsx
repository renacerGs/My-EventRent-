import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  
  const [assignedEvents, setAssignedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('All Sessions');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Status');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [activeTab, setActiveTab] = useState('active');

  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [isSendingEmergency, setIsSendingEmergency] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'agent') {
      navigate('/');
      return;
    }
    fetchAssignedEvents();
  }, [user?.id, user?.role, navigate]); 

  const fetchAssignedEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('supabase_token');
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${user.id}/assigned-events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignedEvents(data);
      }
    } catch (err) {
      console.error("Failed to fetch assigned events");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGuestList = async (eventData) => {
    setSelectedEvent(eventData);
    setSearchQuery('');
    setSelectedSessionFilter('All Sessions');
    setSelectedStatusFilter('All Status');
    setCurrentPage(1);
    fetchGuestList(eventData.id);
  };

  const fetchGuestList = async (eventId) => {
    try {
      setLoadingAttendees(true);
      const token = localStorage.getItem('supabase_token');
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${eventId}/attendees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setAttendees(data);
      } else {
        toast.error("Failed to fetch guest list.");
      }
    } catch (err) {
      toast.error("Network error occurred.");
    } finally {
      setLoadingAttendees(false);
    }
  };

  const handleManualCheckIn = async (ticketId, eventId) => {
    if (!window.confirm("Are you sure you want to manually Check-In this guest?")) return;
    
    try {
      const toastId = toast.loading('Processing Check-In...');
      const token = localStorage.getItem('supabase_token');
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tickets/scan`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ticketId: ticketId, eventId: parseInt(eventId) })
      });
      
      const data = await res.json();
      
      if (res.ok && data.valid) {
        toast.success("Manual Check-In Successful!", { id: toastId });
        fetchGuestList(eventId); 
      } else {
        toast.error(`Failed: ${data.message}`, { id: toastId });
      }
    } catch (err) {
      toast.error("Network error occurred.", { id: toastId });
    }
  };

  const handleSendEmergency = async () => {
    if (!emergencyMessage.trim()) {
      toast.error("Please write your emergency message first, bro!");
      return;
    }

    try {
      setIsSendingEmergency(true);
      const token = localStorage.getItem('supabase_token');
      
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${selectedEvent.id}/reports`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: emergencyMessage })
      });

      if (res.ok) {
        toast.success('Report successfully submitted to the EO dashboard!');
        setIsEmergencyOpen(false);
        setEmergencyMessage('');
      } else {
        toast.error('Failed to send emergency report. Please try again.');
      }
    } catch (error) {
      toast.error('Network error while sending report.');
    } finally {
      setIsSendingEmergency(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B1426]">
      <div className="w-12 h-12 border-4 border-[#1E2D4A] border-t-blue-500 rounded-full animate-spin mb-4"></div>
      <p className="uppercase tracking-widest text-xs font-bold text-slate-500">Loading Dashboard...</p>
    </div>
  );

  const uniqueSessions = ['All Sessions', ...new Set(attendees.map(t => t.session_name))];

  const filteredAttendees = attendees.filter(t => {
    const searchLower = searchQuery.toLowerCase();
    const matchSearch = !searchQuery || (
      t.attendee_name?.toLowerCase().includes(searchLower) || 
      t.buyer_name?.toLowerCase().includes(searchLower) || 
      t.ticket_id?.toLowerCase().includes(searchLower)
    );
    
    const matchSession = selectedSessionFilter === 'All Sessions' || t.session_name === selectedSessionFilter;
    
    let matchStatus = true;
    if (selectedStatusFilter === 'Present') {
      matchStatus = t.is_scanned === true;
    } else if (selectedStatusFilter === 'Absent') {
      matchStatus = t.is_scanned === false && t.is_attending !== false;
    } else if (selectedStatusFilter === 'Declined') {
      matchStatus = t.is_attending === false;
    }
    
    return matchSearch && matchSession && matchStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAttendees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAttendees.length / itemsPerPage) || 1;

  const ratedEvents = assignedEvents.filter(ev => ev.rating_given > 0);
  const avgRating = ratedEvents.length > 0 
    ? (ratedEvents.reduce((sum, ev) => sum + ev.rating_given, 0) / ratedEvents.length).toFixed(1) 
    : 'N/A';

  const now = new Date();
  
  const activeEvents = assignedEvents.filter(ev => {
    const eventDate = new Date(ev.date_start);
    eventDate.setHours(23, 59, 59, 999);
    return eventDate >= now;
  });

  const historyEvents = assignedEvents.filter(ev => {
    const eventDate = new Date(ev.date_start);
    eventDate.setHours(23, 59, 59, 999); 
    return eventDate < now;
  });

  const displayedEvents = activeTab === 'active' ? activeEvents : historyEvents;

  const totalGuests = attendees.length;
  const checkedInGuests = attendees.filter(t => t.is_scanned === true).length;
  const progressPercentage = totalGuests === 0 ? 0 : Math.round((checkedInGuests / totalGuests) * 100);

  return (
    <div className="bg-[#0B1426] min-h-screen font-sans pb-20 relative">

      <AnimatePresence>
        {isEmergencyOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0B1426]/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#152036] w-full max-w-md rounded-[32px] border border-[#1E2D4A] shadow-2xl overflow-hidden"
            >
              <div className="bg-red-500/10 p-6 border-b border-red-500/20 text-center">
                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
                <h3 className="text-xl font-black text-red-500 uppercase tracking-tight">Report Issue</h3>
                <p className="text-xs font-medium text-slate-400 mt-1">Your report will be sent directly to the central EO dashboard.</p>
              </div>
              
              <div className="p-6">
                <textarea 
                  value={emergencyMessage}
                  onChange={(e) => setEmergencyMessage(e.target.value)}
                  placeholder={`Describe the issue at the event ${selectedEvent?.title} bro...`}
                  className="w-full h-32 bg-[#0B1426] border border-[#1E2D4A] rounded-xl p-4 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none transition-all mb-6"
                ></textarea>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsEmergencyOpen(false)}
                    disabled={isSendingEmergency}
                    className="flex-1 py-3 bg-[#1E2D4A] hover:bg-[#2A3F63] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSendEmergency}
                    disabled={isSendingEmergency}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                  >
                    {isSendingEmergency ? (
                      <>
                        <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Sending...
                      </>
                    ) : (
                      'Send Report'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-6 md:pt-16 relative z-10">
        
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-6 mb-8 md:mb-10 bg-[#152036]/50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-[#1E2D4A]/50 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-center md:text-left">
            <div className="w-16 h-16 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-[#1E2D4A] shadow-xl shrink-0">
              <img src={user?.picture} alt={user?.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 mb-1">
                <h1 className="text-xl md:text-3xl font-black text-white">{user?.name}</h1>
                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 md:px-2.5 md:py-1 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-blue-500/30 mt-1 md:mt-0">Verified Agent</span>
              </div>
              <p className="text-xs md:text-sm font-medium text-slate-400">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex w-full md:w-auto border-t md:border-t-0 border-[#1E2D4A] pt-5 md:pt-0 justify-around md:justify-end gap-6 md:gap-10">
            <div className="text-center md:text-right">
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Total Events</p>
              <p className="text-2xl md:text-3xl font-black text-white">{assignedEvents.length}</p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Avg. Rating</p>
              <p className="text-2xl md:text-3xl font-black text-yellow-500 flex items-center justify-center md:justify-end gap-1">
                <svg className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                {avgRating}
              </p>
            </div>
          </div>
        </div>

        {!selectedEvent ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#1E2D4A]/50 pb-4">
              <div className="flex items-center gap-3">
                <span className="w-2 h-6 md:h-8 bg-blue-500 rounded-full inline-block"></span>
                <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-wide">Your Tasks</h2>
              </div>
              
              <div className="flex bg-[#152036] rounded-xl p-1 border border-[#1E2D4A] w-full sm:w-auto">
                <button onClick={() => setActiveTab('active')} className={`flex-1 sm:flex-none px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'active' ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  Upcoming
                </button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 sm:flex-none px-4 py-2 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'history' ? 'bg-[#1E2D4A] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                  History
                </button>
              </div>
            </div>

            {displayedEvents.length > 0 ? (
              <div className="bg-[#152036]/50 rounded-[20px] md:rounded-[32px] border border-[#1E2D4A]/50 overflow-hidden shadow-xl">
                
                <div className="hidden md:flex items-center justify-between px-8 py-4 bg-[#0B1426]/50 border-b border-[#1E2D4A]/50 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="w-[40%]">Event Details</div>
                  <div className="w-[35%] flex justify-between">
                    <div className="w-[57%] text-center">Role & Rating</div>
                    <div className="w-[43%] text-center">Status</div>
                  </div>
                  <div className="w-[25%] text-right">Action</div>
                </div>

                <div className="flex flex-col">
                  {displayedEvents.map((ev, index) => (
                    <div 
                      key={ev.id} 
                      onClick={() => handleOpenGuestList(ev)}
                      className={`group flex flex-col md:flex-row items-start md:items-center justify-between p-4 md:px-8 md:py-6 cursor-pointer hover:bg-[#152036]/80 transition-all duration-300 gap-3 md:gap-0 relative overflow-hidden ${index !== displayedEvents.length - 1 ? 'border-b border-[#1E2D4A]/50 hover:border-transparent' : ''}`}
                    >
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-[40%]">
                        <div className="w-full sm:w-20 h-36 sm:h-20 rounded-xl overflow-hidden relative shrink-0 border border-[#1E2D4A] group-hover:border-blue-500/50 transition-colors">
                          <img src={ev.img} alt={ev.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div>
                          <h3 className="font-black text-white text-lg md:text-lg line-clamp-1 group-hover:text-blue-400 transition-colors">{ev.title}</h3>
                          <p className="text-[10px] md:text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            {ev.date_start}
                          </p>
                          <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest truncate max-w-[200px]">{ev.location}</p>
                        </div>
                      </div>

                      <div className="w-full md:w-[35%] flex flex-row items-center justify-start md:justify-between gap-2 border-t md:border-none border-[#1E2D4A] pt-3 md:pt-0">
                        
                        <div className="flex flex-row md:flex-col items-center justify-start md:justify-center gap-2 md:w-[57%]">
                          <span className="bg-[#0B1426] border border-[#1E2D4A] text-slate-300 px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate max-w-[120px] md:max-w-[140px] group-hover:border-slate-500 transition-colors">
                            {ev.role || 'Staff'}
                          </span>
                          <span className="flex items-center gap-1 text-yellow-500 text-[9px] md:text-[10px] font-black bg-yellow-500/10 px-2 py-1 md:py-0.5 rounded-md border border-yellow-500/20" title="Your Rating from EO">
                            ★ {ev.rating_given ? `${ev.rating_given}.0` : 'N/A'}
                          </span>
                        </div>

                        <div className="flex items-center justify-start md:justify-center md:w-[43%]">
                          {activeTab === 'active' ? (
                            <span className="bg-emerald-500/10 text-emerald-400 px-2.5 md:px-3 py-1 rounded-lg md:rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.2)] transition-shadow">Active</span>
                          ) : (
                            <span className="bg-[#1E2D4A] text-slate-400 px-2.5 md:px-3 py-1 rounded-lg md:rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-[#2A3F63]">Ended</span>
                          )}
                        </div>

                      </div>

                      <div className="w-full md:w-[25%] flex flex-row items-center justify-between md:justify-end gap-4 mt-3 md:mt-0">
                        
                        <div className="md:hidden flex items-center text-slate-400 group-hover:text-blue-500 text-[10px] font-black uppercase tracking-widest transition-colors">
                          View Guests <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7"></path></svg>
                        </div>

                        <div className="flex items-center gap-3">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenGuestList(ev);
                            }} 
                            className="hidden md:flex flex-1 md:flex-none items-center justify-center gap-1.5 px-3 py-2.5 bg-[#1E2D4A] text-white rounded-xl hover:bg-[#2A3F63] transition-colors text-[10px] font-black uppercase tracking-widest border border-[#2A3F63] relative z-10"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            <span className="md:hidden lg:inline">Guests</span>
                          </button>

                          {activeTab === 'active' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/scanner/${ev.id}`);
                              }} 
                              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 relative z-10"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                              <span className="md:hidden lg:inline">Scan</span>
                            </button>
                          )}
                          
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-[#152036]/50 rounded-[24px] md:rounded-[32px] p-8 md:p-12 text-center border border-[#1E2D4A]/50 flex flex-col items-center justify-center min-h-[250px] md:min-h-[300px]">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-[#152036] rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-inner">
                  <svg className="w-8 h-8 md:w-10 md:h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                </div>
                <h3 className="text-lg md:text-xl font-black text-white mb-2">No Tasks</h3>
                <p className="text-slate-400 text-xs md:text-sm font-medium max-w-sm mx-auto leading-relaxed">
                  {activeTab === 'active' ? 'No Event Organizer has assigned you to be an agent for their event yet.' : 'There is no history of completed events yet.'}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="animate-fadeIn">
            
           <div className="flex flex-col mb-4">
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-blue-500 font-bold text-xs md:text-sm uppercase tracking-widest mb-3 flex items-center gap-1.5 transition-colors py-1 w-max">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg> Back
              </button>
              
              <div className="flex flex-row items-center justify-between gap-3 w-full">
                <h2 className="text-lg md:text-2xl font-black text-white leading-tight truncate">Guests: <span className="text-blue-500">{selectedEvent.title}</span></h2>
                
                <button 
                  onClick={() => setIsEmergencyOpen(true)}
                  className="flex items-center gap-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-all border border-red-500/30 shrink-0"
                >
                  <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  Report Issue
                </button>
              </div>
            </div>

            {!loadingAttendees && (
              <div className="bg-[#152036]/80 border border-[#1E2D4A] rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path></svg>
                    Live Check-In Progress
                  </p>
                  <p className="text-2xl font-black text-white leading-none">
                    {checkedInGuests} <span className="text-sm font-medium text-slate-500">/ {totalGuests} Guests</span>
                  </p>
                </div>
                <div className="w-full md:w-1/2 flex items-center gap-3">
                  <div className="flex-1 h-3 bg-[#0B1426] rounded-full overflow-hidden border border-[#1E2D4A] shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-black text-blue-500 min-w-[36px] text-right">{progressPercentage}%</span>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-3 w-full mt-2 lg:mt-0 mb-6">
              <div className="relative w-full lg:flex-1">
                <input 
                  type="text" 
                  placeholder="Search name, email, ID..." 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); 
                  }}
                  className="w-full bg-[#152036] border border-[#1E2D4A] text-white rounded-xl pl-10 pr-4 py-3 md:py-2.5 text-[11px] md:text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              
              <div className="flex flex-row gap-2 w-full lg:w-auto">
                <select
                  value={selectedSessionFilter}
                  onChange={(e) => {
                    setSelectedSessionFilter(e.target.value);
                    setCurrentPage(1); 
                  }}
                  className="flex-1 lg:flex-none bg-[#152036] border border-[#1E2D4A] text-white rounded-xl px-3 py-3 md:py-2.5 text-[10px] md:text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none truncate"
                >
                  {uniqueSessions.map(session => (
                    <option key={session} value={session}>{session}</option>
                  ))}
                </select>

                <select
                  value={selectedStatusFilter}
                  onChange={(e) => {
                    setSelectedStatusFilter(e.target.value);
                    setCurrentPage(1); 
                  }}
                  className="flex-1 lg:flex-none bg-[#152036] border border-[#1E2D4A] text-white rounded-xl px-3 py-3 md:py-2.5 text-[10px] md:text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none truncate"
                >
                  <option value="All Status">All Status</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Declined">Declined</option>
                </select>
              </div>
            </div>

            <div className="bg-[#152036]/50 md:bg-[#152036] rounded-[20px] md:rounded-[24px] border border-transparent md:border-[#1E2D4A] overflow-hidden md:shadow-xl">
              {loadingAttendees ? (
                <div className="py-20 text-center"><p className="text-slate-400 font-bold text-xs md:text-sm">Fetching guest data...</p></div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-[#0B1426]/50 border-b border-[#1E2D4A] text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-6 py-5">Ticket ID</th>
                          <th className="px-6 py-5">Guest Name</th>
                          <th className="px-6 py-5">Session</th>
                          <th className="px-6 py-5 text-center">Status</th>
                          <th className="px-6 py-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentItems.length > 0 ? (
                          currentItems.map((t) => (
                            <tr key={t.ticket_id} className="border-b border-[#1E2D4A]/50 hover:bg-[#1A2844] transition-colors">
                              <td className="px-6 py-4 text-xs font-bold text-slate-400 font-mono">#{t.ticket_id.slice(-6)}</td>
                              <td className="px-6 py-4">
                                <p className="font-bold text-white text-sm">{t.attendee_name || t.buyer_name}</p>
                                <p className="text-[10px] text-slate-500">{t.attendee_email || t.buyer_email}</p>
                              </td>
                              <td className="px-6 py-4">
                                <span className="px-2.5 py-1 bg-[#0B1426] rounded-md text-[10px] font-bold text-slate-300 border border-[#1E2D4A] uppercase">{t.session_name}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {t.is_attending === false ? (
                                  <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-500/30">Declined</span>
                                ) : t.is_scanned ? (
                                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">Present</span>
                                ) : (
                                  <span className="px-3 py-1 bg-[#1E2D4A] text-slate-300 rounded-full text-[10px] font-bold uppercase tracking-widest">Absent</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {!t.is_scanned && t.is_attending !== false && activeTab === 'active' ? (
                                  <button onClick={() => handleManualCheckIn(t.ticket_id, selectedEvent.id)} className="bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-blue-500/30 whitespace-nowrap">
                                    Check-In
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Completed</span>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-bold text-sm">No matching guest data found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-[#1E2D4A] bg-transparent md:bg-[#0B1426]/30 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">
                        Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span>
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#152036] border border-[#1E2D4A] text-slate-300 hover:bg-[#1E2D4A] disabled:opacity-50 transition-colors">Prev</button>
                        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#152036] border border-[#1E2D4A] text-slate-300 hover:bg-[#1E2D4A] disabled:opacity-50 transition-colors">Next</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
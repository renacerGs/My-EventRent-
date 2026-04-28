import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, CheckCircle2, User, Users } from "lucide-react";
import toast from 'react-hot-toast';

export default function PersonalRSVP() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    isAttending: null, 
    pax: 1, 
    greeting: "",
  });
  
  const [selectedSessions, setSelectedSessions] = useState([]);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}`);
        if (!res.ok) throw new Error("Event not found");
        const data = await res.json();
        setEvent(data);
        
        if (data.sessions && data.sessions.length > 0) {
          setSelectedSessions([data.sessions[0].id]);
        }
      } catch (err) {
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCustomChange = (qId, value, type, isChecked = false) => {
    if (type === 'Checkbox') {
      setFormData(prev => {
        const currentArr = prev[qId] || [];
        if (isChecked) return { ...prev, [qId]: [...currentArr, value] };
        return { ...prev, [qId]: currentArr.filter(v => v !== value) };
      });
    } else {
      setFormData(prev => ({ ...prev, [qId]: value }));
    }
  };

  const toggleSession = (sessionId) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId) 
        : [...prev, sessionId] 
    );
  };

  const activeQuestions = [];
  const seenQIds = new Set();
  if (event && event.sessions) {
    selectedSessions.forEach(sId => {
      const session = event.sessions.find(s => s.id === sId);
      session?.questions?.forEach(q => {
        if (!seenQIds.has(q.id)) {
          seenQIds.add(q.id);
          activeQuestions.push(q);
        }
      });
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.isAttending === null) return toast.error("Please confirm your attendance!");
    if (formData.isAttending === true && selectedSessions.length === 0) {
      return toast.error("Please select at least 1 session to attend!");
    }
    
    for (const q of activeQuestions) {
      if (q.is_required && q.answer_type === 'Checkbox' && (!formData[q.id] || formData[q.id].length === 0)) {
        return toast.error(`The question "${q.question_text}" is required!`);
      }
    }

    setIsSubmitting(true);

    try {
      const cartPayload = formData.isAttending 
      ? selectedSessions.map(sId => ({ 
          sessionId: sId, 
          qty: 1, 
          pax: Number(formData.pax) 
        })) 
      : [];

      const payload = {
        eventId: Number(id),
        guestEmail: formData.email,
        cart: cartPayload,
        formAnswers: {
          ...formData, 
          attendee_name: formData.name,
          greeting: formData.greeting,
          isAttending: formData.isAttending 
        }
      };

      const headers = { "Content-Type": "application/json" };
      const token = localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tickets/buy`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Failed to send RSVP");
      }

      setIsSuccess(true);
      
      setTimeout(() => {
        navigate(`/party/${id}`); 
      }, 3000);

    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full"></div></div>;
  if (!event) return <div className="text-center mt-20 text-gray-500 font-bold">Event not found.</div>;

  const inputStyle = `w-full bg-white text-gray-900 border border-gray-200 rounded-xl px-5 py-4 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition text-sm placeholder:text-gray-400`;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center sticky top-0 z-50 shadow-sm">
        <button onClick={() => navigate(-1)} className="text-gray-400 p-2 bg-gray-50 rounded-full hover:text-purple-600 hover:bg-purple-50 transition">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="flex-1 text-center font-black text-gray-900 uppercase tracking-widest text-sm mr-9">
          Confirm Attendance
        </h1>
      </div>

      <div className="flex-1 p-4 sm:p-6 flex justify-center items-start pt-8 pb-20">
        <div className="w-full max-w-2xl bg-white border border-gray-100 rounded-[32px] shadow-xl p-6 sm:p-10 relative overflow-hidden">
          
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

          {isSuccess ? (
            <div className="text-center py-12 relative z-10">
              <CheckCircle2 className="w-24 h-24 text-purple-500 mx-auto mb-6" />
              <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">RSVP Successful! 🎉</h2>
              <p className="text-gray-500 font-medium text-sm leading-relaxed mb-8">
                {formData.isAttending 
                  ? "Awesome! Thanks for confirming. Your E-Ticket QR has been sent to your email." 
                  : "Too bad you can't make it. Don't worry, your greetings have been delivered!"}
              </p>
              <p className="text-purple-600 text-xs uppercase tracking-widest font-bold animate-pulse">
                Returning to the party page...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
              
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Type your name here..." className={inputStyle} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="Required for sending E-Ticket (QR Code)" className={inputStyle} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Will you be attending? <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, isAttending: true})}
                    className={`py-4 rounded-xl text-sm font-bold transition-all border-2 ${formData.isAttending === true ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-purple-200 hover:bg-white'}`}
                  >
                    Yes, I'm In!
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, isAttending: false})}
                    className={`py-4 rounded-xl text-sm font-bold transition-all border-2 ${formData.isAttending === false ? 'border-red-500 bg-red-50 text-red-600 shadow-sm' : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-red-200 hover:bg-white'}`}
                  >
                    Sorry, Can't Make It
                  </button>
                </div>
              </div>

              {formData.isAttending === true && (
                <div className="space-y-8 p-6 bg-purple-50/50 border border-purple-100 rounded-2xl">
                  
                  <div>
                    <label className="block text-[11px] font-bold text-purple-600 uppercase tracking-widest mb-3">Which Sessions Will You Attend? <span className="text-red-500">*</span></label>
                    <div className="space-y-3">
                      {event.sessions?.map(s => (
                        <label 
                          key={s.id} 
                          onClick={() => toggleSession(s.id)} 
                          className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all bg-white ${selectedSessions.includes(s.id) ? 'border-purple-500 shadow-md' : 'border-gray-100 hover:border-purple-200'}`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-colors ${selectedSessions.includes(s.id) ? 'bg-purple-500 border-purple-500' : 'border-gray-300'}`}>
                             {selectedSessions.includes(s.id) && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={4} />}
                          </div>
                          <div className="flex-1">
                            <p className={`font-black text-sm ${selectedSessions.includes(s.id) ? 'text-purple-700' : 'text-gray-700'}`}>{s.name}</p>
                            <p className="text-xs font-medium text-gray-500">{s.date} • {s.start_time}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-600 uppercase tracking-widest mb-3">How Many People? (Pax) <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, pax: 1})}
                        className={`py-5 flex flex-col items-center justify-center gap-2 rounded-xl transition-all border-2 bg-white ${formData.pax === 1 ? 'border-purple-500 text-purple-700 shadow-md' : 'border-gray-100 text-gray-400 hover:border-purple-200'}`}
                      >
                        <User className="w-6 h-6" />
                        <span className="text-xs font-bold uppercase tracking-widest">Just Me</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, pax: 2})}
                        className={`py-5 flex flex-col items-center justify-center gap-2 rounded-xl transition-all border-2 bg-white ${formData.pax === 2 ? 'border-purple-500 text-purple-700 shadow-md' : 'border-gray-100 text-gray-400 hover:border-purple-200'}`}
                      >
                        <Users className="w-6 h-6" />
                        <span className="text-xs font-bold uppercase tracking-widest">+1 (Plus One)</span>
                      </button>
                    </div>
                  </div>

                  {activeQuestions.length > 0 && (
                    <div className="pt-6 border-t border-purple-100 space-y-6">
                      <h3 className="text-[11px] font-black text-purple-600 uppercase tracking-widest bg-purple-100/50 inline-block px-3 py-1 rounded-md">Additional Questions</h3>
                      {activeQuestions.map(q => (
                        <div key={q.id}>
                          <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-widest mb-2">
                            {q.question_text} {q.is_required && <span className="text-red-500">*</span>}
                          </label>
                          
                          {q.answer_type === 'Text' && (
                            <input type="text" onChange={e => handleCustomChange(q.id, e.target.value, 'Text')} required={q.is_required} className={inputStyle} placeholder="Type your answer here..." />
                          )}
                          
                          {q.answer_type === 'Dropdown' && (
                            <select onChange={e => handleCustomChange(q.id, e.target.value, 'Dropdown')} required={q.is_required} className={`${inputStyle} cursor-pointer`}>
                              <option value="">-- Select Answer --</option>
                              {q.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                            </select>
                          )}
                          
                          {q.answer_type === 'Checkbox' && (
                            <div className="space-y-3 mt-2">
                              {q.options?.map((opt, i) => (
                                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                                  <input type="checkbox" value={opt} onChange={e => handleCustomChange(q.id, opt, 'Checkbox', e.target.checked)} className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700 transition-colors">{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Greetings & Wishes <span className="text-red-500">*</span></label>
                <textarea 
                  name="greeting" 
                  value={formData.greeting} 
                  onChange={handleChange}
                  required 
                  placeholder={formData.isAttending === false ? "Write your reason or send regards here..." : "Happy birthday / Happy party! Wishing you..."}
                  rows="4" 
                  className={`${inputStyle} resize-none`} 
                />
              </div>

              <div className="pt-4 mt-8">
                <button 
                  type="submit" 
                  disabled={isSubmitting || formData.isAttending === null}
                  className="w-full py-4 bg-purple-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-purple-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200 text-sm"
                >
                  {isSubmitting ? 'Processing...' : 'Send RSVP'}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
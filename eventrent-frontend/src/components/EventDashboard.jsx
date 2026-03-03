import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function EventDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const resEvent = await fetch(`http://localhost:3000/api/events`);
      const dataEvents = await resEvent.json();
      const foundEvent = dataEvents.find(e => String(e.id) === String(id));
      
      const resAttendees = await fetch(`http://localhost:3000/api/events/${id}/attendees?userId=${user.id}`);
      const dataAttendees = await resAttendees.json();

      if (foundEvent) {
        setEvent(foundEvent);
        setAttendees(dataAttendees || []);
      } else {
        alert("Event not found");
        navigate('/manage');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !event) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">Loading Dashboard...</div>;

  // --- STATS CALCULATION ---
  const totalSold = attendees.reduce((acc, curr) => acc + curr.quantity, 0);
  const totalRevenue = attendees.reduce((acc, curr) => acc + Number(curr.total_price), 0);
  const totalStock = (event.stock || 0) + totalSold;
  const pageViews = event.views || 0; 

  const eventLink = `${window.location.origin}/event/${id}`;
  const handleCopy = () => {
    navigator.clipboard.writeText(eventLink);
    alert("Link copied!");
  };

  return (
    <div className="bg-[#F3F4F6] min-h-screen font-sans pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <button onClick={() => navigate('/manage')} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
               </button>
               <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
            </div>
            <h2 className="text-lg text-gray-600 font-medium ml-11">{event.title}</h2>
          </div>
          
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase">Share Link</span>
            <div className="h-4 w-px bg-gray-200"></div>
            <button onClick={handleCopy} className="text-sm font-bold text-[#FF6B35] hover:text-orange-700 flex items-center gap-2 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              Copy
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          
          {/* Card 1: Sales */}
          <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-[100px] -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tickets Sold</p>
              <h3 className="text-4xl font-black text-gray-900 mb-1">{totalSold} <span className="text-lg text-gray-300 font-medium">/ {totalStock}</span></h3>
              <p className="text-sm font-bold text-green-600 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Rp {totalRevenue.toLocaleString()} Revenue
              </p>
            </div>
          </div>

          {/* Card 2: Page Views */}
          <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Page Views</p>
              <h3 className="text-4xl font-black text-gray-900 mb-1">{pageViews}</h3>
              <p className="text-sm font-bold text-blue-500 mt-2 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                People visited details
              </p>
            </div>
          </div>

          {/* Card 3: Status */}
          <div className="bg-white p-6 rounded-[24px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[100px] -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Event Status</p>
              <div className="flex items-center gap-2">
                 <div className={`w-3 h-3 rounded-full ${event.stock > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                 <h3 className="text-lg font-bold text-gray-900">{event.stock > 0 ? 'Active & Selling' : 'Sold Out / Ended'}</h3>
              </div>
              <p className="text-sm font-bold text-gray-400 mt-2">
                {event.stock} tickets remaining
              </p>
            </div>
          </div>

        </div>

        {/* RECENT ORDERS TABLE */}
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Recent Attendees</h3>
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{attendees.length} Orders</span>
          </div>
          
          {attendees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-8 py-4">Order ID</th>
                    <th className="px-8 py-4">Buyer Info</th>
                    <th className="px-8 py-4 text-center">Qty</th>
                    <th className="px-8 py-4">Total Paid</th>
                    <th className="px-8 py-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {attendees.map((a) => (
                    <tr key={a.ticket_id} className="hover:bg-gray-50 transition-colors group">
                      {/* --- DISINI PERBAIKANNYA (HAPUS .substring) --- */}
                      <td className="px-8 py-4 text-sm font-medium text-gray-400">#{a.ticket_id}</td>
                      
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                             <img src={a.buyer_pic || `https://ui-avatars.com/api/?name=${a.buyer_name}`} alt="avt" className="w-full h-full object-cover"/>
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm group-hover:text-[#FF6B35] transition-colors">{a.buyer_name}</p>
                            <p className="text-xs text-gray-400">{a.buyer_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-orange-50 text-[#FF6B35] text-xs font-bold">
                          {a.quantity}
                        </span>
                      </td>
                      <td className="px-8 py-4 text-sm font-bold text-gray-900">
                        {Number(a.total_price) === 0 ? 'Free' : `Rp ${parseInt(a.total_price).toLocaleString()}`}
                      </td>
                      <td className="px-8 py-4 text-right text-xs text-gray-500 font-medium">
                        {new Date(a.purchase_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <h3 className="text-gray-900 font-bold text-base">No Orders Yet</h3>
              <p className="text-gray-400 text-sm mt-1">Waiting for the first sale!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
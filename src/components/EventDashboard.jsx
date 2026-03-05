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
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  if (loading || !event) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-bold">Loading Dashboard...</div>;

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
    <div className="bg-[#F3F4F6] min-h-screen font-sans pb-20 pt-8 text-left">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <button onClick={() => navigate('/manage')} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
               </button>
               {/* Dashboard diubah dari font-black ke font-bold */}
               <h1 className="text-2xl font-bold text-gray-900 uppercase">Dashboard</h1>
            </div>
            <h2 className="text-lg text-gray-600 font-bold ml-11">{event.title}</h2>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase">Share Link</span>
            <button onClick={handleCopy} className="text-sm font-bold text-[#FF6B35] hover:text-orange-700 flex items-center gap-2 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              Copy
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tickets Sold</p>
            {/* Angka diubah ke font-bold */}
            <h3 className="text-4xl font-bold text-gray-900 mb-1">{totalSold} <span className="text-lg text-gray-300 font-medium">/ {totalStock}</span></h3>
            <p className="text-sm font-bold text-green-600 mt-2">Rp {totalRevenue.toLocaleString()} Revenue</p>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Page Views</p>
            <h3 className="text-4xl font-bold text-gray-900 mb-1">{pageViews}</h3>
          </div>
          <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Event Status</p>
            <h3 className="text-lg font-bold text-gray-900">{event.stock > 0 ? 'Active & Selling' : 'Sold Out / Ended'}</h3>
          </div>
        </div>

        <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Recent Attendees</h3>
            <span className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full">{attendees.length} Orders</span>
          </div>
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
                  <tr key={a.ticket_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-8 py-4 text-sm font-medium text-gray-400">#{a.ticket_id}</td>
                    <td className="px-8 py-4 font-bold text-gray-900 text-sm">{a.buyer_name}</td>
                    <td className="px-8 py-4 text-center font-bold text-gray-600">{a.quantity}</td>
                    <td className="px-8 py-4 text-sm font-bold text-gray-900">Rp {parseInt(a.total_price).toLocaleString()}</td>
                    <td className="px-8 py-4 text-right text-xs text-gray-500 font-medium">{new Date(a.purchase_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
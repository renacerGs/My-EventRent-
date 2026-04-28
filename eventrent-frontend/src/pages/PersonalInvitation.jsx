import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";


// 🔥 IMPORT SEMUA TEMPLATE LU DI SINI
import ThemeBirthday from "../components/Templates/ThemeBirthday";
import ThemePartyNight from "../components/Templates/ThemePartyNight"; 
import ThemeCasual from "../components/Templates/ThemeCasual";

export default function PersonalInvitation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [eventData, setEventData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const guestName = searchParams.get("to") || "Guest";

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/events/${id}`)
      .then(res => res.json())
      .then(data => {
        setEventData(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch event data:", err);
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="font-bold text-blue-500 animate-pulse">Preparing Invitation...</p></div>;
  }
  if (!eventData) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Invitation not found.</div>;
  }

  let details = eventData?.eventDetails || eventData?.event_details || {};
  if (typeof details === 'string') {
    try { details = JSON.parse(details); } catch (e) { details = {}; }
  }
  const themeType = details.templateType || 'ThemeBirthday';

  if (themeType === 'ThemePartyNight') {
    return (
      <ThemePartyNight eventData={eventData} guestName={guestName} isOpen={isOpen} onOpen={() => setIsOpen(true)} navigate={navigate} id={id} />
    );
  } else if (themeType === 'ThemeCasual') {
    return (
      <ThemeCasual eventData={eventData} guestName={guestName} isOpen={isOpen} onOpen={() => setIsOpen(true)} navigate={navigate} id={id} />
    );
  } else {
    return (
      <ThemeBirthday eventData={eventData} guestName={guestName} isOpen={isOpen} onOpen={() => setIsOpen(true)} navigate={navigate} id={id} />
    );
  }
}
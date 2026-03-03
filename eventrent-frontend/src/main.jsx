import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      {/* Cukup panggil App saja di sini, Router cukup satu di level ini */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
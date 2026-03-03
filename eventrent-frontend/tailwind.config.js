/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#FF6B35', 
        dark: '#1C2331',  
      }
    },
  },
  plugins: [],
}
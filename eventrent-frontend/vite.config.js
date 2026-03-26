import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // 👇 INI KUNCI SAKTINYA: Izinkan semua domain (termasuk Cloudflare) buat akses Vite lu 👇
    allowedHosts: true, 
    
    // 👇 INI TETEP ADA BIAR API BACKEND LU JALAN 👇
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
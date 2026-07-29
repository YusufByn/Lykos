import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // en dev, on redirige /api vers le backend Express (port 3000)
    // comme ca le frontend peut faire fetch("/api/...") sans se soucier
    // du port ni des problemes de CORS
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})

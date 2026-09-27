import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Same-origin API keeps the session cookie first-party on every device (incl. iOS Safari).
    proxy: {
      '/api': process.env.IRONBASE_API_URL || 'http://localhost:3001',
    },
  },
})

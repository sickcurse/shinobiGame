import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      'tweezers-unwritten-aching.ngrok-free.dev',
      'localhost',
      '172.16.101.164'
    ],
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
})
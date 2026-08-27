import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      allow: ['..', path.resolve(__dirname, '../.cursor')],
    },
    // SOLO proxy para auth y vistas, NO para dashboard
    proxy: {
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/vistas': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // QUITAR: '/dashboard': 'http://localhost:8000',
    },
  },
  appType: 'spa',
})
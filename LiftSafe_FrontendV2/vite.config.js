import { defineConfig } from 'vitest/config'
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

  // ── Pruebas unitarias y de componentes (Vitest) ──────────────────────
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
    // CAMBIO 1: más tiempo por test, para que no fallen de forma intermitente
    // cuando el computador va lento con muchos archivos corriendo en paralelo
    testTimeout: 20000,
    // MUI trae imports de carpeta que Node no resuelve solo; Vitest debe procesarlos
    server: { deps: { inline: [/@mui/] } },
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // Medir TODOS los archivos de src (incluso los que aún no tienen test)
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.{test,spec}.{js,jsx}',
        'src/test/**',
        'src/main.jsx', // arranque de React: no tiene lógica de negocio
        'src/assets/**', // imágenes
        'src/data/**', // datos de demostración (mock), no es lógica
      ],
      // CAMBIO 2: umbral = cobertura real de la semana 5 (redondeada hacia abajo).
      // Desde hoy solo puede subir. Si baja, "npm test" falla.
      thresholds: { lines: 39, branches: 29, functions: 43, statements: 39 },
    },
  },
})
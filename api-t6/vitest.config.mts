import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

// Ambiente de PRUEBAS separado del de desarrollo: variables de .env.test (si existe)
const entornoPruebas = config({ path: '.env.test' }).parsed ?? {};

export default defineConfig({
  test: {
    environment: 'node',
    // Ambiente de pruebas separado: NODE_ENV=test y una clave JWT solo para pruebas.
    // Las pruebas de integración usan la base liftsafe_t6_test (ver .env.test.example).
    env: { ...entornoPruebas, NODE_ENV: 'test', JWT_SECRET: 'clave-solo-para-pruebas-automaticas-0123456789', JWT_EXPIRES_IN: '15m' },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts'],
      reporter: ['text', 'html'],
      // Módulo crítico: autenticación y autorización
      thresholds: {
        'src/services/auth.service.ts': { lines: 80 },
        'src/middlewares/auth.ts': { lines: 80 },
      },
    },
  },
});

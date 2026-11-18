import { expect, test } from '@playwright/test';

// Semana 6 · E2E contra el backend REAL con la BD de pruebas (sin page.route).
// El test crea lo que necesita (un correo nuevo en cada corrida), así que no
// depende de datos previos y pasa dos veces seguidas y después de un `down -v`.

const API = process.env.API_URL ?? 'http://localhost:8000';

test('should register a new client through the UI and land on the dashboard', async ({ page, request }) => {
  // Arrange: correo único por corrida
  const correo = `cliente.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.goto('/register');

  // Act
  await page.getByLabel(/^Nombre/).fill('Cliente');
  await page.getByLabel(/^Apellidos/).fill('Integracion');
  await page.getByLabel(/^Correo electrónico/).fill(correo);
  await page.getByLabel(/^Número de documento/).fill('1098765432');
  await page.getByLabel(/^Contraseña/).fill('Segura#18x');
  await page.getByLabel(/^Confirmar contraseña/).fill('Segura#18x');
  await page.getByRole('button', { name: 'Crear cuenta de cliente' }).click();

  // Assert: sesión abierta Y cuenta guardada en la BD con esa contraseña
  await expect(page).toHaveURL(/\/dashboard/);
  const login = await request.post(`${API}/auth/login`, { data: { correo, contrasena: 'Segura#18x' } });
  expect(login.ok()).toBeTruthy();
});

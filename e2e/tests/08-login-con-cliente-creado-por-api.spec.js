import { expect, test } from '@playwright/test';

const API = process.env.API_URL ?? 'http://localhost:8000';

// Semana 6 · E2E contra el backend REAL: el cliente se crea por el API (no
// por datos que ya estuvieran en la BD) y luego inicia sesión por la UI.

test('should log in through the UI with a client created through the API', async ({ page, request }) => {
  // Arrange: crear el cliente por el API
  const correo = `login.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
  const contrasena = 'Segura#18x';
  const registro = await request.post(`${API}/auth/register`, {
    data: {
      nombre_completo: 'Cliente Login', correo, contrasena, tipo_documento: 'CC',
      documento_identidad: '1098765432', id_rol: 6,
    },
  });
  expect(registro.ok()).toBeTruthy();

  // Act: iniciar sesión por la UI
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña').fill(contrasena);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  // Assert
  await expect(page).toHaveURL(/\/dashboard/);
});

test('should reject a wrong password for a client created through the API', async ({ page, request }) => {
  // Arrange
  const correo = `clave.${Date.now()}.${Math.floor(Math.random() * 1e6)}@example.com`;
  await request.post(`${API}/auth/register`, {
    data: {
      nombre_completo: 'Cliente Clave', correo, contrasena: 'Segura#18x', tipo_documento: 'CC',
      documento_identidad: '1098765432', id_rol: 6,
    },
  });

  // Act
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill(correo);
  await page.getByLabel('Contraseña').fill('Otra#Clave7');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();

  // Assert
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

// Dobles (semana 5): page.route responde en lugar del backend, dentro de un
// navegador real. Sirve para estados difíciles de provocar con el API real.
import { expect, test } from '@playwright/test';

async function intentarLogin(page) {
  await page.goto('/login');
  await page.getByLabel('Correo electrónico').fill('cliente@example.com');
  await page.getByLabel('Contraseña').fill('Clave#Segura7');
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}

test('should show the server error when the API is down (500)', async ({ page }) => {
  // STUB de red: el API responde 500.
  await page.route('**/auth/login', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Error interno del servidor' }),
    }),
  );

  await intentarLogin(page);

  await expect(page.getByRole('alert')).toHaveText('Error interno del servidor');
});

test('should show the credentials error when the API responds 401', async ({ page }) => {
  // STUB de red: credenciales incorrectas, sin necesitar un usuario real en la BD.
  await page.route('**/auth/login', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Credenciales incorrectas' }),
    }),
  );

  await intentarLogin(page);

  await expect(page.getByRole('alert')).toHaveText('Credenciales incorrectas');
  await expect(page).toHaveURL(/\/login/);
});
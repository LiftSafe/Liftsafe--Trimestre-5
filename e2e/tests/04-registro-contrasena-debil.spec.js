import { expect, test } from '@playwright/test';

test('should reject a weak password when registering', async ({ page }) => {
  // Arrange
  await page.goto('/register');

  // Act: datos de prueba (no reales) con una contraseña que incumple las reglas
  await page.getByLabel(/^Nombre/).fill('Cliente');
  await page.getByLabel(/^Apellidos/).fill('Prueba');
  await page.getByLabel(/^Correo electrónico/).fill(`cliente.${Date.now()}@example.com`);
  await page.getByLabel(/^Número de documento/).fill('1098765432');
  await page.getByLabel(/^Contraseña/).fill('abc');
  await page.getByLabel(/^Confirmar contraseña/).fill('abc');
  await page.getByRole('button', { name: 'Crear cuenta de cliente' }).click();

  // Assert
  await expect(page.getByRole('alert')).toHaveText('La contraseña no cumple los requisitos de seguridad');
});

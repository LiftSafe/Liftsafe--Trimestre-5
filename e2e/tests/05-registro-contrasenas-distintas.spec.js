import { expect, test } from '@playwright/test';

test('should show an error when the two passwords do not match', async ({ page }) => {
  // Arrange
  await page.goto('/register');

  // Act: contraseña válida, pero la confirmación es distinta
  await page.getByLabel(/^Nombre/).fill('Cliente');
  await page.getByLabel(/^Apellidos/).fill('Prueba');
  await page.getByLabel(/^Correo electrónico/).fill(`cliente.${Date.now()}@example.com`);
  await page.getByLabel(/^Número de documento/).fill('1098765432');
  await page.getByLabel(/^Contraseña/).fill('Abcdefg1');
  await page.getByLabel(/^Confirmar contraseña/).fill('Abcdefg2');
  await page.getByRole('button', { name: 'Crear cuenta de cliente' }).click();

  // Assert
  await expect(page.getByRole('alert')).toHaveText('Las contraseñas no coinciden');
});

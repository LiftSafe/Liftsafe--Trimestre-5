import { expect, test } from '@playwright/test';

test('should show the login form with email, password and submit button', async ({ page }) => {
  // Arrange
  await page.goto('/login');

  // Act: la persona solo mira la pantalla de inicio

  // Assert
  await expect(page.getByLabel('Correo electrónico')).toBeVisible();
  await expect(page.getByLabel('Contraseña')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar sesión' })).toBeVisible();
});

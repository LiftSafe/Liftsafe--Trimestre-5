import { expect, test } from '@playwright/test';

test('should open the password recovery form from the login link', async ({ page }) => {
  // Arrange
  await page.goto('/login');

  // Act
  await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();

  // Assert
  await expect(page).toHaveURL(/\/forgot-password/);
  await expect(page.getByRole('heading', { name: 'Recuperar contraseña' })).toBeVisible();
  await expect(page.getByLabel('Correo electrónico')).toBeVisible();
});

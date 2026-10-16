import { expect, test } from '@playwright/test';

test('should go to the register page from the login link', async ({ page }) => {
  // Arrange
  await page.goto('/login');

  // Act
  await page.getByRole('link', { name: '¿Eres cliente? Regístrate aquí' }).click();

  // Assert
  await expect(page).toHaveURL(/\/register/);
  await expect(page.getByRole('heading', { name: 'Crear cuenta' })).toBeVisible();
});

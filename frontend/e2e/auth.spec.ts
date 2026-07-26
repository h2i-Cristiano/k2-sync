import { test, expect } from '@playwright/test';

test('login page has title and login form', async ({ page }) => {
  await page.goto('/login');

  // Verify the page title
  await expect(page).toHaveTitle(/K2-Sync/);

  // Expect the form to exist
  await expect(page.locator('form')).toBeVisible();

  // Expect email and password inputs
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/senha/i)).toBeVisible();

  // Expect the submit button
  await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
});

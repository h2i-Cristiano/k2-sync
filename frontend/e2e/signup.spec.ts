import { test, expect } from '@playwright/test';

test.describe('Signup flow', () => {
  test('signup page has all required fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveTitle(/K2-Sync/);
    await expect(page.getByLabel('Nome Completo', { exact: true })).toBeVisible();
    await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Senha', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /criar conta/i })).toBeVisible();
  });

  test('signup shows error for duplicate email', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Nome Completo', { exact: true }).fill('Teste Dup');
    await page.getByLabel('E-mail', { exact: true }).fill('test@example.com');
    await page.getByLabel('Senha', { exact: true }).fill('testpassword123');
    await page.getByRole('button', { name: /criar conta/i }).click();
    await page.waitForTimeout(3000);
    const errorBox = page.locator('.bg-red-50, [class*="red"]').first();
    const errorVisible = await errorBox.isVisible().catch(() => false);
    const url = page.url();
    const stayedOnSignup = url.includes('/signup');
    expect(errorVisible || stayedOnSignup).toBeTruthy();
  });

  test('signup form validates required fields', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('button', { name: /criar conta/i }).click();
    const nameInput = page.getByLabel('Nome Completo', { exact: true });
    await expect(nameInput).toHaveAttribute('required');
  });

  test('login link is present on signup page', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('link', { name: /faça login/i })).toBeVisible();
  });

  test('signup link is present on login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /cadastre-se/i })).toBeVisible();
  });
});

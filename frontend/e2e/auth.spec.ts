import { test, expect } from '@playwright/test';
import { login, loginAsTestUser, TEST_EMAIL } from './helpers';

test('login page has title and login form', async ({ page }) => {
  await page.goto('/login');

  // Verify the page title
  await expect(page).toHaveTitle(/K2-Sync/);

  // Expect the form to exist
  await expect(page.locator('form')).toBeVisible();

  // Expect email and password inputs
  await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Senha', { exact: true })).toBeVisible();

  // Expect the submit button
  await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
});

test('login with valid credentials redirects to dashboard', async ({ page }) => {
  await login(page);
  await expect(page).toHaveURL(/.*\/dashboard.*/, { timeout: 15000 });
  await expect(page.locator('aside').getByText('K2-Sync')).toBeVisible();
});

test('login with wrong password shows error message', async ({ page }) => {
  await page.goto('/login');

  await page.getByLabel('E-mail', { exact: true }).fill(TEST_EMAIL);
  await page.getByLabel('Senha', { exact: true }).fill('senha-incorreta-123');
  await page.getByRole('button', { name: /entrar/i }).click();

  await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
});

test('logout returns to login page', async ({ page }) => {
  await login(page);

  // Open the user dropdown in the sidebar and click Sair
  const trigger = page.locator('aside').getByRole('button').filter({ hasText: TEST_EMAIL }).first();
  await trigger.click();

  const logoutItem = page.getByRole('menuitem', { name: /sair/i });
  await expect(logoutItem).toBeVisible();
  await logoutItem.click();

  await expect(page).toHaveURL(/.*\/login.*/, { timeout: 15000 });
});
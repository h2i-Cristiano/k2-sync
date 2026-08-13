import { Page, expect } from '@playwright/test';

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'e2e@test.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'test123456';
const TEST_NAME = 'Teste E2E K2';

export { TEST_EMAIL, TEST_PASSWORD, TEST_NAME };

async function isOnDashboard(page: Page): Promise<boolean> {
  try {
    await page.waitForURL(/.*\/dashboard.*/, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export async function login(page: Page, email = TEST_EMAIL, password = TEST_PASSWORD) {
  await page.goto('/login');

  const alreadyAuth = await isOnDashboard(page);
  if (alreadyAuth) return;

  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: /entrar/i }).click();
  await page.waitForURL(/.*\/dashboard.*/, { timeout: 15000 });
  await page.waitForTimeout(1000);
}

export async function loginAsTestUser(page: Page) {
  await ensureTestUserExists(page);
  await login(page, TEST_EMAIL, TEST_PASSWORD);
}

export async function ensureTestUserExists(page: Page) {
  await page.goto('/login');

  const alreadyAuth = await isOnDashboard(page);
  if (alreadyAuth) return;

  await page.getByLabel('Email', { exact: true }).fill(TEST_EMAIL);
  await page.getByLabel('Senha', { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /entrar/i }).click();

  let loginSucceeded = false;
  try {
    await page.waitForURL(/.*\/dashboard.*/, { timeout: 5000 });
    loginSucceeded = true;
  } catch {
    loginSucceeded = false;
  }

  if (loginSucceeded) return;

  await page.goto('/signup');
  await page.waitForTimeout(1000);

  const isSignupPage = await page.getByLabel(/nome completo/i).isVisible().catch(() => false);
  if (!isSignupPage) return;

  await page.getByLabel('Nome Completo', { exact: true }).fill(TEST_NAME);
  await page.getByLabel('Email', { exact: true }).fill(TEST_EMAIL);
  await page.getByLabel('Senha', { exact: true }).fill(TEST_PASSWORD);
  await page.getByRole('button', { name: /criar conta/i }).click();

  await page.waitForTimeout(5000);

  const successVisible = await page.locator('text=Conta criada').or(page.locator('text=Ir para o Dashboard')).isVisible().catch(() => false);
  if (successVisible) {
    await page.getByRole('button', { name: /ir para o dashboard/i }).click();
    await page.waitForTimeout(3000);
  }
}

export async function waitForDashboard(page: Page) {
  await expect(page.locator('header')).toBeVisible();
  await expect(page.locator('aside').getByText('K2-Sync')).toBeVisible();
}

export async function openDialog(page: Page, buttonText: string) {
  await page.getByRole('button', { name: new RegExp(buttonText, 'i') }).click();
  await page.waitForTimeout(500);
}

export async function closeDialog(page: Page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

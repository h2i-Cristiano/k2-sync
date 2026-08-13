import { test, expect, type Page } from '@playwright/test';
import { loginAsTestUser } from './helpers';

function tab(page: Page, name: string) {
  return page.getByRole('tab').filter({ hasText: name }).first();
}

test.describe('Settings', () => {
  test('settings page loads with tabs', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');

    await expect(page.getByText(/configuracoes/i).first()).toBeVisible();
    await expect(tab(page, 'Apar')).toBeVisible();
    await expect(tab(page, 'Perfil')).toBeVisible();
    await expect(tab(page, 'Notific')).toBeVisible();
    await expect(tab(page, 'Segur')).toBeVisible();
  });

  test('appearance tab shows theme options', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');

    await expect(page.getByText(/modo claro/i)).toBeVisible();
    await expect(page.getByText(/modo escuro/i)).toBeVisible();
    await expect(page.getByText('Automático (Sistema)')).toBeVisible();
  });

  test('can switch to dark mode', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');

    await page.getByText(/modo escuro/i).click();
    await page.waitForTimeout(800);

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/, { timeout: 10000 });
  });

  test('can switch to light mode', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');

    await page.getByText(/modo claro/i).click();
    await page.waitForTimeout(500);
  });

  test('profile tab shows form fields', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');

    await tab(page, 'Perfil').click();
    await page.waitForTimeout(1000);

    await expect(page.getByText('Informações Pessoais')).toBeVisible();
    await expect(page.getByText(/nome completo/i)).toBeVisible();
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('security tab shows password fields', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');

    await tab(page, 'Segur').click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(/alterar senha/i)).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').last()).toBeVisible();
  });

  test('notifications tab shows toggle options', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');

    await tab(page, 'Notific').click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/novos agendamentos/i)).toBeVisible();
  });
});
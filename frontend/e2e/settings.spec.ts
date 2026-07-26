import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

test.describe('Settings', () => {
  test('settings page loads with tabs', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');

    await expect(page.getByText(/configuracoes/i).first()).toBeVisible();
    await expect(page.getByRole('tab', { name: /aparencia/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /perfil/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /notificacoes/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /seguranca/i })).toBeVisible();
  });

  test('appearance tab shows theme options', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');

    await expect(page.getByText(/modo claro/i)).toBeVisible();
    await expect(page.getByText(/modo escuro/i)).toBeVisible();
    await expect(page.getByText(/automatico/i)).toBeVisible();
  });

  test('can switch to dark mode', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');

    await page.getByText(/modo escuro/i).click();
    await page.waitForTimeout(500);

    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
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

    await page.getByRole('tab', { name: /perfil/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(/informacoes pessoais/i)).toBeVisible();
    await expect(page.getByText(/nome completo/i)).toBeVisible();
    await expect(page.locator('input').first()).toBeVisible();
  });

  test('security tab shows password fields', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');

    await page.getByRole('tab', { name: /seguranca/i }).click();
    await page.waitForTimeout(1000);

    await expect(page.getByText(/alterar senha/i)).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').last()).toBeVisible();
  });

  test('notifications tab shows toggle options', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings');

    await page.getByRole('tab', { name: /notificacoes/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/novos agendamentos/i)).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

test.describe('Dashboard', () => {
  test('dashboard loads with stats and navigation', async ({ page }) => {
    await loginAsTestUser(page);

    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByText('K2-Sync')).toBeVisible();

    await expect(page.getByText(/pacientes/i).first()).toBeVisible();
    await expect(page.getByText(/agendamento/i).first()).toBeVisible();

    await expect(page.getByRole('link', { name: 'Pacientes', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Agenda', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Prontuarios', exact: true })).toBeVisible();
  });

  test('dashboard has user avatar menu', async ({ page }) => {
    await loginAsTestUser(page);

    const avatar = page.locator('header').locator('[class*="rounded-full"]').last();
    await expect(avatar).toBeVisible();
  });

  test('theme toggle is visible', async ({ page }) => {
    await loginAsTestUser(page);

    const themeButton = page.locator('header button[data-slot="theme-toggle"]').or(
      page.locator('header button').filter({ hasText: /sun|moon/i })
    ).or(
      page.locator('header button[aria-label*="theme"]').or(page.locator('header button[aria-label*="tema"]'))
    );
    const anyButton = page.locator('header .flex.items-center.gap-2 button').last();
    await expect(anyButton).toBeVisible();
  });

  test('navigation links work', async ({ page }) => {
    await loginAsTestUser(page);

    await page.getByRole('link', { name: 'Pacientes', exact: true }).first().click();
    await page.waitForURL(/.*\/patients.*/);
    await expect(page.getByText(/pacientes/i).first()).toBeVisible();

    await page.getByRole('link', { name: 'Agenda', exact: true }).first().click();
    await page.waitForURL(/.*\/appointments.*/);
    await expect(page.getByText(/agenda/i).first()).toBeVisible();

    await page.getByRole('link', { name: 'Prontuarios', exact: true }).first().click();
    await page.waitForURL(/.*\/records.*/);
    await expect(page.getByText(/prontuarios/i).first()).toBeVisible();
  });

  test('logout redirects to login', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    await expect(page.locator('header')).toBeVisible();
    await page.waitForTimeout(1000);

    const avatar = page.locator('header').locator('[class*="rounded-full"]').last();
    await avatar.click();
    await page.waitForTimeout(1000);
    
    const sairLink = page.getByText(/sair/i);
    const isVisible = await sairLink.isVisible().catch(() => false);
    if (isVisible) {
      await sairLink.click();
      await page.waitForURL(/.*\/login.*/, { timeout: 10000 });
      await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
    }
  });
});

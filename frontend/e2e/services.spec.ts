import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

test.describe('Services CRUD', () => {
  test('services page loads', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/services');

    await expect(page.getByText(/servicos/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /novo servi/i })).toBeVisible();
  });

  test('can create a service', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/services');

    await page.getByRole('button', { name: /novo servi/i }).click();
    await page.waitForTimeout(500);

    const name = `Servico E2E ${Date.now()}`;
    await page.getByPlaceholder(/nome do servi/i).fill(name);
    await page.getByPlaceholder('0,00').first().fill('120');
    await page.getByRole('button', { name: /salvar/i }).click();

    await expect(page.getByText(name)).toBeVisible({ timeout: 10000 });
  });

  test('can open kit editor when a service exists', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/services');

    const kitBtn = page.locator('button[title="Kit de materiais"]').first();
    try {
      await kitBtn.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      test.skip();
    }
    await kitBtn.click();
    await page.waitForTimeout(500);
    await expect(page.getByText(/kit de materiais/i).first()).toBeVisible();
  });
});

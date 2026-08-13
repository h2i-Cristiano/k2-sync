import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

test.describe('Stock management', () => {
  test('can restock a product and see movement history', async ({ page }) => {
    await loginAsTestUser(page);

    const name = `Estoque E2E ${Date.now()}`;
    await page.goto('/products');
    await page.getByRole('button', { name: /novo produto/i }).click();
    await page.waitForTimeout(500);
    await page.getByPlaceholder(/nome do produto/i).fill(name);
    await page.getByPlaceholder('0,00').first().fill('50');
    await page.getByRole('button', { name: /salvar/i }).click();
    await expect(page.locator('div.p-4', { hasText: name }).first()).toBeVisible({ timeout: 10000 });

    await page.goto('/stock');
    const row = page.locator('div.p-4', { hasText: name }).first();
    await expect(row).toBeVisible({ timeout: 10000 });

    await row.getByRole('button', { name: /repor/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/quantidade/i).fill('5');
    await dialog.getByRole('button', { name: /repor/i }).click();
    await expect(page.getByText(/registrada/i)).toBeVisible();

    await expect(row.getByText(/atual:\s*5/i)).toBeVisible();

    await row.locator('button[title="Histórico"]').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/entrada/i).first()).toBeVisible();
  });
});

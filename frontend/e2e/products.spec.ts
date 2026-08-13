import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

test.describe('Products CRUD', () => {
  test('products page loads', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/products');

    await expect(page.getByText(/produtos/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /novo produto/i })).toBeVisible();
  });

  test('can create a product with low stock alert', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/products');

    await page.getByRole('button', { name: /novo produto/i }).click();
    await page.waitForTimeout(500);

    const name = `Produto E2E ${Date.now()}`;
    await page.getByPlaceholder(/nome do produto/i).fill(name);
    const moneyInputs = page.getByPlaceholder('0,00');
    await moneyInputs.nth(0).fill('100');
    await moneyInputs.nth(1).fill('40');
    await page.getByLabel(/estoque inicial/i).fill('2');
    await page.getByLabel(/estoque mini/i).fill('5');
    await page.getByRole('button', { name: /salvar/i }).click();

    const row = page.locator('div.p-4', { hasText: name }).first();
    await expect(row).toBeVisible({ timeout: 10000 });
    await expect(row.getByText(/estoque baixo/i)).toBeVisible();
  });
});

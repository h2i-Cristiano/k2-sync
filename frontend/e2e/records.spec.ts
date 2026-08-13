import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

test.describe('Records CRUD', () => {
  test('records page loads', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/records');

    await expect(page.getByText(/prontuarios/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /novo prontuario/i })).toBeVisible();
  });

  test('search input is visible', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/records');

    await expect(page.getByPlaceholder(/buscar/i)).toBeVisible();
  });

  test('can open new record dialog', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/records');

    await page.getByRole('button', { name: /novo prontuario/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/paciente/i).first()).toBeVisible();
  });

  test('empty state or list shows correctly', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/records');

    const emptyState = page.getByText(/nenhum prontuario/i);
    const anyRecord = page.getByText(/sessao/i).first();

    await Promise.race([
      emptyState.waitFor({ state: 'visible', timeout: 10000 }),
      anyRecord.waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {});

    if (await anyRecord.isVisible().catch(() => false)) return;
    await expect(emptyState).toBeVisible();
  });
});

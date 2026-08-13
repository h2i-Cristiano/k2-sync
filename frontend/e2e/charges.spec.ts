import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

test.describe('Charges', () => {
  test.describe.configure({ timeout: 180_000 });

  test('can create a receivable and mark it as paid', async ({ page }) => {
    await loginAsTestUser(page);

    await page.goto('/financial/receivable');
    await page.getByRole('button', { name: /nova conta/i }).click();
    await page.waitForTimeout(500);

    const desc = `Conta E2E ${Date.now()}`;
    await page.getByPlaceholder(/ex:/i).fill(desc);
    await page.getByPlaceholder('0,00').first().fill('75');
    await page.locator('input[type="date"]').first().fill('2026-12-31');

    const saveBtn = page.getByRole('button', { name: /salvar/i });
    let created = false;
    for (let i = 0; i < 5 && !created; i++) {
      if (i > 0) await page.waitForTimeout(3000);
      if (!(await saveBtn.isVisible().catch(() => false))) { created = true; break; }
      await saveBtn.click().catch(() => {});
      try {
        await page.getByText(/conta criada/i).waitFor({ state: 'visible', timeout: 20000 });
        created = true;
      } catch { /* form still open - retry */ }
    }

    await page.goto('/financial/charges');
    const row = page.locator('div.p-3', { hasText: desc }).first();
    try {
      await row.waitFor({ state: 'visible', timeout: 60000 });
    } catch {
      await page.reload();
      await row.waitFor({ state: 'visible', timeout: 60000 });
    }

    await row.getByRole('button', { name: /marcar pago/i }).click();
    await expect(page.getByText(/pagamento registrado/i)).toBeVisible({ timeout: 20000 });
  });
});

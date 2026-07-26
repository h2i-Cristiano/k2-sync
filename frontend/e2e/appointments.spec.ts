import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

test.describe('Appointments CRUD', () => {
  test('appointments page loads', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/appointments');

    await expect(page.getByText(/agenda/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /novo agendamento/i })).toBeVisible();
  });

  test('date navigator is visible', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/appointments');

    await expect(page.getByRole('button', { name: /hoje/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /agendar/i }).or(page.getByText(/agendamento/i).first())).toBeVisible();
  });

  test('can open new appointment dialog', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/appointments');

    await page.getByRole('button', { name: /novo agendamento/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/paciente/i).first()).toBeVisible();
  });

  test('can navigate days', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/appointments');

    await expect(page.getByRole('button', { name: /hoje/i })).toBeVisible({ timeout: 10000 });

    const todayBtn = page.getByRole('button', { name: /hoje/i });
    await todayBtn.click();
    await page.waitForTimeout(500);
  });

  test('empty state shows correctly', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/appointments');

    const emptyState = page.getByText(/dia livre/i);
    const hasAppointments = await page.locator('[class*="timeline"]').isVisible().catch(() => false);
    if (!hasAppointments) {
      await expect(emptyState).toBeVisible();
    }
  });
});

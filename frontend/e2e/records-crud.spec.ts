import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

test.describe('Records CRUD', () => {
  test('can create a patient then a record', async ({ page }) => {
    await loginAsTestUser(page);

    const suffix = Date.now();
    const patientName = `Paciente E2E Prontuario ${suffix}`;

    await page.goto('/patients');
    await page.getByRole('button', { name: /novo paciente/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/nome completo/i).fill(patientName);
    await page.getByLabel(/email/i).fill(`prontuario.e2e${suffix}@test.com`);
    await page.locator('#phone').fill('(11) 98888-7777');
    await page.locator('#cpf').fill('52998224725');
    await page.locator('#birth_date').fill('1985-03-15');
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /feminino/i }).click();
    await page.getByRole('button', { name: /salvar paciente/i }).click();
    await expect(page.getByText(/paciente criado com sucesso/i).first()).toBeVisible({ timeout: 45000 });
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);

    await page.goto('/records');
    await page.getByRole('button', { name: /novo prontuario/i }).click();
    await page.waitForTimeout(500);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.locator('#patient_id').selectOption({ label: patientName });
    const complaint = `Queixa E2E ${suffix}`;
    await dialog.locator('#chief_complaint').fill(complaint);
    await dialog.getByRole('button', { name: /salvar/i }).click();

    await expect(page.getByText(/criado com sucesso/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(complaint)).toBeVisible({ timeout: 10000 });
  });
});

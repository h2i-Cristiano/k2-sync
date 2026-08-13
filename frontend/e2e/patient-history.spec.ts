import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

test.describe('Patient history', () => {
  test('shows summary, category tabs and creates a record from profile', async ({ page }) => {
    await loginAsTestUser(page);

    const suffix = Date.now();
    const patientName = `Paciente E2E Historico ${suffix}`;

    await page.goto('/patients');
    await page.getByRole('button', { name: /novo paciente/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/nome completo/i).fill(patientName);
    await page.getByLabel(/email/i).fill(`historico.e2e${suffix}@test.com`);
    await page.locator('#phone').fill('(11) 97777-6666');
    await page.locator('#cpf').fill('52998224725');
    await page.locator('#birth_date').fill('1988-07-10');
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /feminino/i }).click();
    await page.getByRole('button', { name: /salvar paciente/i }).click();
    await expect(page.getByText(/paciente criado com sucesso/i).first()).toBeVisible({ timeout: 45000 });
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);

    await page.goto('/patients');
    const row = page.locator('tr', { hasText: patientName });
    await expect(row).toBeVisible({ timeout: 10000 });
    await row.getByRole('link', { name: /perfil/i }).click();
    await page.waitForURL(/.*\/patients\/[0-9a-f-]{36}/);
    await expect(page.getByText(patientName).first()).toBeVisible({ timeout: 10000 });

    await page.getByRole('tab', { name: /hist/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByText(/atendimentos/i)).toBeVisible();
    await expect(page.getByText(/total investido/i)).toBeVisible();
    await expect(page.getByText('Prontuários', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/anamneses/i).first()).toBeVisible();

    await expect(page.getByRole('button', { name: /todos/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Prontuários', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /anamneses/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /agendamentos/i })).toBeVisible();
    await expect(page.getByText(/linha do tempo/i)).toBeVisible();
    await expect(page.getByText(/nenhum registro/i)).toBeVisible();

    await page.getByRole('button', { name: /novo prontu/i }).click();
    await page.waitForTimeout(500);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await expect(dialog.locator('#session_number')).toHaveValue('1');
    const selectedPatient = await dialog.locator('#patient_id option:checked').textContent();
    expect(selectedPatient).toContain(patientName);

    const complaint = `Queixa Historico ${suffix}`;
    await dialog.locator('#chief_complaint').fill(complaint);
    await dialog.getByRole('button', { name: /salvar/i }).click();

    await expect(page.getByText(/criado com sucesso/i)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(complaint)).toBeVisible({ timeout: 10000 });
  });
});

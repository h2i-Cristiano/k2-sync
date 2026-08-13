import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './helpers';

test.describe('Appointments CRUD', () => {
  test('appointments page loads', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/appointments');

    await expect(page.getByText(/agenda/i).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /novo/i })).toBeVisible();
  });

  test('date navigator is visible', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/appointments');

    await expect(page.getByText(/ir para hoje/i)).toBeVisible();
    await expect(page.getByText(/agendar/i).or(page.getByText(/agendamento/i).first())).toBeVisible();
  });

  test('can open new appointment dialog', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/appointments');

    await page.getByRole('button', { name: /novo/i }).click();
    await page.waitForTimeout(500);

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/paciente/i).first()).toBeVisible();
  });

  test('can navigate days', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/appointments');

    await expect(page.getByText(/ir para hoje/i)).toBeVisible({ timeout: 10000 });

    const todayBtn = page.getByText(/ir para hoje/i);
    await todayBtn.click();
    await page.waitForTimeout(500);
  });

  test('empty state shows correctly', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/appointments');

    const emptyState = page.getByText(/dia livre/i);
    const counter = page.locator('p', { hasText: /agendamento\(s\)/ }).first();
    let hasAppointments = false;
    for (let i = 0; i < 10; i++) {
      const text = await counter.textContent().catch(() => '');
      const n = parseInt(text?.match(/\d+/)?.[0] ?? '0', 10);
      if (n > 0) { hasAppointments = true; break; }
      await page.waitForTimeout(500);
    }
    if (!hasAppointments) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('time field accepts broken hour (07:30)', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/appointments');

    await page.getByRole('button', { name: /novo/i }).click();
    await page.waitForTimeout(500);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const timeInput = dialog.locator('#scheduled_at_time');
    await timeInput.fill('07:30');
    await expect(timeInput).toHaveValue('07:30');
    await expect(dialog.getByText(/07:30/).first()).toBeVisible();
  });

  test('money fields do not add a leading zero', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/appointments');

    await page.getByRole('button', { name: /novo/i }).click();
    await page.waitForTimeout(500);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.getByText(/cobrar entrada/i).click();
    const depositInput = dialog.locator('#deposit_amount');
    await expect(depositInput).toBeVisible();

    await depositInput.fill('050');
    await expect(depositInput).toHaveValue('50');

    await depositInput.fill('0.50');
    await expect(depositInput).toHaveValue('0.50');
  });

  test('creates patient and appointment with deposit', async ({ page }) => {
    await loginAsTestUser(page);

    // Create a patient first
    const suffix = Date.now();
    const patientName = `Paciente E2E Agendamento ${suffix}`;

    await page.goto('/patients');
    await page.getByRole('button', { name: /novo paciente/i }).click();
    await page.waitForTimeout(500);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/nome completo/i).fill(patientName);
    await page.getByLabel(/email/i).fill(`paciente.e2e.agendamento${suffix}@test.com`);
    await page.locator('#phone').fill('(11) 99999-8888');
    await page.locator('#cpf').fill('52998224725');
    await page.locator('#birth_date').fill('1990-05-20');
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /feminino/i }).click();
    await page.getByRole('button', { name: /salvar paciente/i }).click();
    await expect(page.getByText(/paciente criado com sucesso/i).first()).toBeVisible({ timeout: 45000 });
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(500);

    // Open the appointment dialog
    await page.goto('/appointments');
    await page.getByRole('button', { name: /novo/i }).click();
    await page.waitForTimeout(500);

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.locator('#patient_id').selectOption({ label: patientName });

    const serviceOptions = await dialog.locator('#service_type option').count();
    if (serviceOptions < 2) test.skip();

    await dialog.locator('#service_type').selectOption({ index: 1 });
    await dialog.locator('#scheduled_at_time').fill('07:30');
    await dialog.getByText(/cobrar entrada/i).click();
    await dialog.locator('#deposit_amount').fill('50');
    await expect(dialog.locator('#deposit_amount')).toHaveValue('50');

    await dialog.getByRole('button', { name: /salvar/i }).click();
    await expect(page.getByText(/agendamento criado/i)).toBeVisible({ timeout: 15000 });
  });
});

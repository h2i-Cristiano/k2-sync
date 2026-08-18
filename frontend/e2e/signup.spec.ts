import { test, expect } from '@playwright/test';

test.describe('Signup flow', () => {
  test('signup page has all required fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveTitle(/K2-Sync/);
    await expect(page.getByLabel('Nome Completo', { exact: true })).toBeVisible();
    await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Senha', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /criar conta/i })).toBeVisible();
  });

  test('signup shows error for duplicate email', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Nome Completo', { exact: true }).fill('Teste Dup');
    await page.getByLabel('E-mail', { exact: true }).fill('test@example.com');
    await page.getByLabel('Senha', { exact: true }).fill('testpassword123');
    await page.getByRole('button', { name: /criar conta/i }).click();
    await page.waitForTimeout(3000);
    // A assercao anterior era `errorVisible || stayedOnSignup`, que nunca podia
    // falhar: no sucesso a pagina troca o conteudo in-place e a URL segue em
    // /signup, entao stayedOnSignup era true nos dois desfechos. O que importa
    // e que um e-mail duplicado NAO conclua o cadastro.
    await expect(page.getByText('Conta criada!')).not.toBeVisible();
  });

  test('signup form validates required fields', async ({ page }) => {
    await page.goto('/signup');
    await page.getByRole('button', { name: /criar conta/i }).click();
    const nameInput = page.getByLabel('Nome Completo', { exact: true });
    await expect(nameInput).toHaveAttribute('required');
  });

  test('login link is present on signup page', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('link', { name: /faça login/i })).toBeVisible();
  });

  test('signup link is present on login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /cadastre-se/i })).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';

// Cadastro real, ponta a ponta. Os testes de signup.spec.ts so verificam a
// renderizacao do formulario; nenhum CONCLUI um cadastro. Foi essa lacuna que
// deixou passar a regressao de 2026-08-16, quando um NOT NULL em
// profiles.tenant_id derrubou o trigger handle_new_user e quebrou todo o
// cadastro sem que nenhum dos 67 testes falhasse.
//
// O fluxo exercitado aqui cobre as tres etapas que podem quebrar de forma
// independente:
//   1. supabase.auth.signUp()      -> trigger handle_new_user cria o profile
//   2. create_tenant_for_user()    -> cria o tenant e preenche o tenant_id
//   3. sessao com tenant valido    -> o dashboard so carrega se houver tenant
//
// Cada execucao cria um usuario, um tenant e um profile de verdade. Limpeza
// periodica (service_role):
//   DELETE FROM tenants WHERE slug LIKE 'e2e-signup-%';
//   -- e remover os usuarios e2e-signup-*@test.com em Authentication > Users

test.describe('Signup completo', () => {
  test('cria conta e tenant, e chega ao dashboard', async ({ page }) => {
    const stamp = Date.now();
    const nome = `E2E Signup ${stamp}`;
    const email = `e2e-signup-${stamp}@test.com`;
    const senha = 'test123456';

    await page.goto('/signup');
    await page.getByLabel('Nome Completo', { exact: true }).fill(nome);
    await page.getByLabel('E-mail', { exact: true }).fill(email);
    await page.getByLabel('Senha', { exact: true }).fill(senha);
    await page.getByRole('button', { name: /criar conta/i }).click();

    // O alerta precisa ser escopado ao form: o Next.js mantem um
    // <div id="__next-route-announcer__" role="alert"> sempre visivel na
    // pagina, e um getByRole('alert') solto casa com ele.
    const alerta = page.locator('form').getByRole('alert');

    // Espera desfechar para um dos dois lados antes de julgar, para que uma
    // falha reporte a mensagem real em vez de um timeout generico.
    await expect(
      page.getByText('Conta criada!').or(alerta)
    ).toBeVisible({ timeout: 20000 });

    if (await alerta.isVisible().catch(() => false)) {
      throw new Error(`Cadastro falhou: ${(await alerta.textContent())?.trim()}`);
    }

    await expect(page.getByText('Conta criada!')).toBeVisible();

    // Sem tenant_id no profile o dashboard nao carrega, entao chegar ate aqui
    // prova que a etapa 2 rodou.
    await page.getByRole('button', { name: /ir para o dashboard/i }).click();
    await page.waitForURL(/.*\/dashboard.*/, { timeout: 15000 });
    await expect(page.locator('header')).toBeVisible();
  });
});

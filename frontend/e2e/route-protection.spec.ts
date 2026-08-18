import { test, expect } from '@playwright/test';

// Proteção de rotas para quem não tem sessão.
//
// Nenhum dos outros testes cobre isto: todos fazem login antes de navegar,
// então uma falha no proxy passa despercebida. Foi o que aconteceu em
// 2026-08-17, quando um commit trocou frontend/src/proxy.ts (convenção do
// Next.js 16) por frontend/middleware.ts (convenção antiga, exportando
// `middleware` em vez de `proxy`). O arquivo continuou aparecendo no
// middleware-manifest.json, mas parou de executar: /patients, /dashboard e
// /records passaram a servir a página real para anônimos, e os 70 testes
// seguiram verdes.
//
// A checagem é feita por HTTP, com maxRedirects: 0, porque é o nível em que o
// proxy age. Um teste de navegação no browser também detectaria, mas passaria
// caso a página redirecionasse por conta própria no cliente — o que esconderia
// o fato de o HTML protegido já ter sido enviado.

const ROTAS_PROTEGIDAS = [
  '/dashboard',
  '/patients',
  '/appointments',
  '/settings',
  '/records',
  '/services',
  '/products',
  '/stock',
  '/financial/charges',
  '/financial/payable',
  '/financial/receivable',
];

const ROTAS_PUBLICAS = ['/login', '/signup'];

test.describe('Proteção de rotas', () => {
  for (const rota of ROTAS_PROTEGIDAS) {
    test(`${rota} redireciona para /login sem sessão`, async ({ request }) => {
      const resposta = await request.get(rota, { maxRedirects: 0 });

      expect(
        resposta.status(),
        `${rota} deveria redirecionar (307) para quem não tem sessão, mas devolveu ${resposta.status()}. ` +
          `Se for 200, o proxy não está executando — conferir se frontend/src/proxy.ts existe e exporta "proxy".`
      ).toBe(307);

      expect(resposta.headers()['location']).toContain('/login');
    });
  }

  for (const rota of ROTAS_PUBLICAS) {
    test(`${rota} continua acessível sem sessão`, async ({ request }) => {
      const resposta = await request.get(rota, { maxRedirects: 0 });
      expect(
        resposta.status(),
        `${rota} é pública e não pode exigir sessão.`
      ).toBe(200);
    });
  }

  test('rota protegida não entrega HTML antes de redirecionar', async ({ request }) => {
    // Complementa a checagem de status: garante que o corpo da resposta não
    // traz a página protegida junto do redirecionamento.
    const resposta = await request.get('/patients', { maxRedirects: 0 });
    const corpo = await resposta.text();
    expect(corpo).not.toContain('<!DOCTYPE html');
  });

  test('navegação no browser leva o anônimo até /login', async ({ page }) => {
    await page.goto('/patients');
    await page.waitForURL(/\/login/, { timeout: 15000 });
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });
});

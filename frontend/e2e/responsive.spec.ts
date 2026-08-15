import { test, expect, Page } from '@playwright/test';
import { loginAsTestUser } from './helpers';

const MOBILE = { width: 390, height: 844 };
const TABLET = { width: 768, height: 1024 };
const DRAWER_WIDTH_RATIO = 0.85;

const authRoutes = ['/login', '/signup'];
const dashboardRoutes = [
  '/dashboard',
  '/appointments',
  '/patients',
  '/records',
  '/financial/charges',
  '/stock',
  '/settings',
];

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  expect(overflow, `overflow horizontal de ${overflow}px`).toBeLessThanOrEqual(2);
}

async function expectVisibleHeader(page: Page) {
  await expect(page.locator('header')).toBeVisible();
}

async function openMobileDrawer(page: Page) {
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  const sheet = page.locator('[data-slot="sheet-content"]');
  await expect(sheet).toBeVisible();
  return sheet;
}

async function checkDrawerWidth(page: Page, sheet: ReturnType<Page['locator']>) {
  const viewportWidth = page.viewportSize()!.width;
  const expected = Math.min(viewportWidth * DRAWER_WIDTH_RATIO, 448);
  await expect
    .poll(
      async () => {
        const box = await sheet.boundingBox();
        return box ? Math.abs(box.width - expected) : Infinity;
      },
      { timeout: 5000, message: 'drawer deve atingir a largura final esperada' }
    )
    .toBeLessThanOrEqual(5);
}

test.describe('Responsividade mobile (390px)', () => {
  test.use({ viewport: MOBILE });

  for (const route of authRoutes) {
    test(`${route} sem overflow horizontal`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('input').first()).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }

  for (const route of dashboardRoutes) {
    test(`${route} sem overflow horizontal e header visivel`, async ({ page }) => {
      await loginAsTestUser(page);
      await page.goto(route);
      await expectVisibleHeader(page);
      await assertNoHorizontalOverflow(page);
    });
  }

  test('drawer abre com largura correta e navegacao acessivel', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard');
    await expectVisibleHeader(page);

    const sheet = await openMobileDrawer(page);
    await checkDrawerWidth(page, sheet);

    for (const label of ['Agenda', 'Pacientes', 'Financeiro', 'Estoque', 'Configurações']) {
      const link = sheet.getByRole('link', { name: label, exact: false }).first();
      await expect(link).toBeVisible();
    }

    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });
});

test.describe('Responsividade tablet (768px)', () => {
  test.use({ viewport: TABLET });

  for (const route of authRoutes) {
    test(`${route} sem overflow horizontal`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('input').first()).toBeVisible();
      await assertNoHorizontalOverflow(page);
    });
  }

  for (const route of dashboardRoutes) {
    test(`${route} sem overflow horizontal e header visivel`, async ({ page }) => {
      await loginAsTestUser(page);
      await page.goto(route);
      await expectVisibleHeader(page);
      await assertNoHorizontalOverflow(page);
    });
  }

  test('header compacto com botao de menu', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: 'Abrir menu' })).toBeVisible();

    const sheet = await openMobileDrawer(page);
    await checkDrawerWidth(page, sheet);
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
  });
});
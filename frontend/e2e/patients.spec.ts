import { test, expect } from '@playwright/test';

test('patients page requires authentication', async ({ page }) => {
  await page.goto('/patients');

  // Next.js middleware should redirect to /login
  await expect(page).toHaveURL(/.*\/login.*/);
});

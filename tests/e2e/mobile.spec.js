'use strict';

const { test, expect } = require('@playwright/test');
const { createErrorGuard, waitForActiveMatchBoard } = require('./helpers');

test.describe('VALENCY Mobile PWA Viewport (mobile.html)', () => {
  test('mobile home menu renders with no horizontal overflow and launches Classic Match cleanly', async ({ page }) => {
    const guard = createErrorGuard(page);
    await page.goto('/mobile.html');

    await expect(page).toHaveTitle(/VALENCY Mobile/i);
    await expect(page.locator('#menu-screen')).toBeVisible();
    await expect(page.locator('#menu-btn-ai')).toBeVisible();
    await expect(page.locator('#menu-btn-tutorial')).toBeVisible();

    // Check layout does not overflow horizontally on mobile width
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `Horizontal overflow detected: ${overflow}px`).toBeLessThanOrEqual(4);

    // Launch Classic Match vs. Dr. Mendeleev on mobile
    await page.locator('#menu-btn-ai').click();
    await waitForActiveMatchBoard(page);

    const handCount = await page.locator('#player-hand-row [data-card-id]').count();
    expect(handCount).toBeGreaterThanOrEqual(5);

    guard.assertClean();
  });
});

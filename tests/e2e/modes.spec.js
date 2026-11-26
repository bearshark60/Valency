'use strict';

const { test, expect } = require('@playwright/test');
const { createErrorGuard } = require('./helpers');

test.describe('VALENCY Story Mode & Elemental Frontier Flows', () => {
  test('Story Mode (Chapter 0: Academy Licensure) hub opens, lists missions, and switches tabs cleanly', async ({ page }) => {
    const guard = createErrorGuard(page);
    await page.goto('/index.html');

    await page.locator('#menu-btn-story').click();
    const modal = page.locator('#modal-root');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Academy Licensure/i);

    // Verify all 6 Chapter 0 missions render and Mission 1 launch button is enabled
    const launchButtons = modal.locator('[data-launch-mission]');
    await expect(launchButtons).toHaveCount(6);
    await expect(launchButtons.first()).toBeEnabled();

    // Switch across Research Archive & Scientist Themes tabs
    await modal.getByRole('button', { name: /Research Archive/i }).click();
    await expect(modal).toContainText(/Lavoisier|Mendeleev/i);
    await modal.getByRole('button', { name: /Scientist Themes/i }).click();
    await expect(modal).toContainText(/Conservation Theme|Periodic Law Theme/i);

    await page.locator('#modal-close-btn').click();
    await expect(modal).toBeHidden();

    guard.assertClean();
  });

  test('Chapter 1: The Elemental Frontier hub renders and switches all 5 tabs cleanly', async ({ page }) => {
    const guard = createErrorGuard(page);
    await page.goto('/index.html');

    await page.locator('#menu-btn-frontier').click();
    const modal = page.locator('#modal-root');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/The Elemental Frontier/i);

    // Cycle through all 5 Frontier tabs
    const tabs = ['world', 'expedition', 'scientists', 'collection', 'investigation'];
    for (const tab of tabs) {
      const btn = modal.locator(`[data-ftab="${tab}"]`);
      await expect(btn).toBeVisible();
      await btn.click();
      await expect(modal.locator(`[data-ftab="${tab}"]`)).toHaveClass(/active/);
      await expect(modal.locator('.frontier-tab-body')).toBeVisible();
    }

    await page.locator('#modal-close-btn').click();
    await expect(modal).toBeHidden();

    guard.assertClean();
  });
});

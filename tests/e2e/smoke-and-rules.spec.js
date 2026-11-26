'use strict';

const { test, expect } = require('@playwright/test');
const { createErrorGuard } = require('./helpers');

test.describe('VALENCY Desktop Smoke, Modals & Built-in Rules Suite', () => {
  test('home menu renders all primary game modes and utility controls cleanly', async ({ page }) => {
    const guard = createErrorGuard(page);
    await page.goto('/index.html');

    await expect(page).toHaveTitle(/VALENCY/);
    await expect(page.locator('#menu-screen')).toBeVisible();
    await expect(page.locator('.menu-title')).toHaveText('VALENCY');

    // All 5 primary game modes
    await expect(page.locator('#menu-btn-story')).toBeVisible();
    await expect(page.locator('#menu-btn-frontier')).toBeVisible();
    await expect(page.locator('#menu-btn-ai')).toBeVisible();
    await expect(page.locator('#menu-btn-pvp')).toBeVisible();
    await expect(page.locator('#menu-btn-tutorial')).toBeVisible();

    // Key utility controls
    await expect(page.locator('#menu-btn-periodic')).toBeVisible();
    await expect(page.locator('#menu-btn-gallery')).toBeVisible();
    await expect(page.locator('#menu-btn-char-studio')).toBeVisible();
    await expect(page.locator('#menu-btn-rules')).toBeVisible();
    await expect(page.locator('#menu-btn-audio-settings')).toBeVisible();

    guard.assertClean();
  });

  test('utility modals (Periodic Table, Event Art Gallery, Quick Rules, Audio Mixer, Character Studio) open and close cleanly', async ({ page }) => {
    const guard = createErrorGuard(page);
    await page.goto('/index.html');

    const modals = [
      { btn: '#menu-btn-periodic', expectedText: /Periodic Table/i },
      { btn: '#menu-btn-gallery', expectedText: /Event/i },
      { btn: '#menu-btn-rules', expectedText: /Rules|Synthesis|25 SP/i },
      { btn: '#menu-btn-audio-settings', expectedText: /Audio|Volume|Music/i },
      { btn: '#menu-btn-char-studio', expectedText: /Character|Portrait|Lavoisier|Mendeleev/i },
    ];

    for (const item of modals) {
      await page.locator(item.btn).click();
      const modal = page.locator('#modal-root');
      await expect(modal).toBeVisible();
      await expect(modal).toContainText(item.expectedText);

      if (item.btn === '#menu-btn-char-studio') {
        // Verify an SVG portrait rig mounts inside Character Animation Studio
        await expect(modal.locator('svg').first()).toBeVisible();
      }

      await page.locator('#modal-close-btn').click();
      await expect(modal).toBeHidden();
    }

    guard.assertClean();
  });

  test('built-in browser rules verification suite (/tests.html) passes 100%', async ({ page }) => {
    const guard = createErrorGuard(page);
    await page.goto('/tests.html');

    const summary = page.locator('#summary');
    await expect(summary).toBeVisible();
    await expect(summary).toHaveClass(/pass-bg/);
    await expect(summary).toContainText(/\d+\s*\/\s*\d+\s+tests passed/);

    // Ensure every test row passed and zero failed
    const totalRows = await page.locator('#results .row').count();
    expect(totalRows).toBeGreaterThanOrEqual(9);
    await expect(page.locator('#results .row.fail')).toHaveCount(0);

    guard.assertClean();
  });
});

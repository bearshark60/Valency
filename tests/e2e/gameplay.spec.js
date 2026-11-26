'use strict';

const { test, expect } = require('@playwright/test');
const { createErrorGuard, waitForActiveMatchBoard } = require('./helpers');

test.describe('VALENCY Core Gameplay Flows', () => {
  test('Interactive Tutorial Lesson 1: synthesizes Water (H2O) for +8 SP and advances to Phase 3', async ({ page }) => {
    const guard = createErrorGuard(page);
    await page.goto('/index.html');

    await page.locator('#menu-btn-tutorial').click();

    // Tutorial picker modal opens with all 7 lessons; launch Lesson 1
    const modal = page.locator('#modal-root');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/Lab Academy/i);
    await modal.getByRole('button', { name: /Start Full Tutorial \(Lesson 1\)/i }).click();

    await waitForActiveMatchBoard(page);

    // Tutorial coach banner should be visible with Lesson 1
    const banner = page.locator('#tutorial-banner');
    await expect(banner).toBeVisible();
    await expect(banner).toContainText(/Compound Synthesis/i);

    // Select both Hydrogen cards and the Oxygen card from Lesson 1's deterministic hand
    const hCards = page.locator('#player-hand-row [data-card-id$="_H"]');
    const oCard = page.locator('#player-hand-row [data-card-id$="_O"]').first();
    await expect(hCards).toHaveCount(2);
    await expect(oCard).toBeVisible();

    await hCards.nth(0).click();
    await hCards.nth(1).click();
    await oCard.click();

    // Synthesize Compound button should now be enabled
    const btnSynth = page.locator('#btn-synthesize');
    await expect(btnSynth).toBeEnabled();
    await btnSynth.click();

    // Verify Water (H2O) was placed on the field, SP updated to 8, and tutorial objective completed
    await expect(page.locator('#player-zone')).toContainText('H₂O');
    await expect(page.locator('#player-zone')).toContainText(/8\s*\/\s*25\s*SP/);
    await expect(banner).toContainText(/Water \(H₂O\) synthesized for \+8 SP/i);

    guard.assertClean();
  });

  test('Classic Match vs. Dr. Mendeleev (AI): starts match, switches sidebar tabs, completes a full turn cycle', async ({ page }) => {
    const guard = createErrorGuard(page);
    await page.goto('/index.html');

    await page.locator('#menu-btn-ai').click();
    await waitForActiveMatchBoard(page);

    // Opponent and player hand should be populated
    await expect(page.locator('#opponent-zone')).toContainText(/Mendeleev/i);
    const handCount = await page.locator('#player-hand-row [data-card-id]').count();
    expect(handCount).toBeGreaterThanOrEqual(5);

    // Switch sidebar between Hints and Log
    await page.locator('#tab-log').click();
    await expect(page.locator('#pane-log')).toBeVisible();
    await expect(page.locator('#pane-hints')).toBeHidden();
    await page.locator('#tab-hints').click();
    await expect(page.locator('#pane-hints')).toBeVisible();

    // Advance through Phase 2 -> Phase 3 -> End Turn so AI takes a turn
    const passBtn = page.locator('#center-bench button', { hasText: /Pass to Phase 3/i });
    if (await passBtn.isVisible().catch(() => false)) {
      await passBtn.click();
    }
    const endTurnBtn = page.locator('#btn-end-turn');
    await expect(endTurnBtn).toBeVisible();
    await endTurnBtn.click();

    // Wait for turn banner to remain valid while AI executes and returns control (or ends match)
    await expect(page.locator('#turn-banner')).toBeVisible();

    // Return to main menu cleanly
    await page.locator('#btn-back-menu').click();
    await expect(page.locator('#menu-screen')).toBeVisible();

    guard.assertClean();
  });

  test('2-Player Pass & Play launches cleanly and returns to menu', async ({ page }) => {
    const guard = createErrorGuard(page);
    await page.goto('/index.html');

    await page.locator('#menu-btn-pvp').click();

    // Dismiss Pass & Play curtain if displayed before board
    const curtain = page.locator('#curtain-root');
    if (await curtain.isVisible().catch(() => false)) {
      const readyBtn = curtain.locator('button').first();
      if (await readyBtn.isVisible().catch(() => false)) {
        await readyBtn.click();
      }
    }

    await waitForActiveMatchBoard(page);
    const handCount = await page.locator('#player-hand-row [data-card-id]').count();
    expect(handCount).toBeGreaterThanOrEqual(5);

    await page.locator('#btn-back-menu').click();
    await expect(page.locator('#menu-screen')).toBeVisible();

    guard.assertClean();
  });
});

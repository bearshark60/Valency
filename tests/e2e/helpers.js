// Shared Playwright helpers for VALENCY E2E tests
'use strict';

const { expect } = require('@playwright/test');

/**
 * Attach console/pageerror and non-audio failed request listeners.
 * Returns a guard object whose .assertClean() verifies zero unexpected runtime errors.
 */
function createErrorGuard(page) {
  const pageErrors = [];
  const consoleErrors = [];
  const failedRequests = [];

  page.on('pageerror', (err) => {
    pageErrors.push(err.message || String(err));
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore browser-logged 404s for optional custom audio tracks in assets/audio/
      if (text.includes('assets/audio/') || text.includes('Failed to load resource: the server responded with a status of 404')) {
        return;
      }
      consoleErrors.push(text);
    }
  });

  page.on('response', (res) => {
    if (res.status() >= 400) {
      const url = res.url();
      // Custom audio tracks under assets/audio/ are optional by design (Web Audio synth fallback)
      if (url.includes('/assets/audio/')) return;
      failedRequests.push(`${res.status()} ${url}`);
    }
  });

  return {
    pageErrors,
    consoleErrors,
    failedRequests,
    assertClean() {
      expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
      expect(consoleErrors, `Console errors:\n${consoleErrors.join('\n')}`).toEqual([]);
      expect(failedRequests, `Unexpected HTTP errors:\n${failedRequests.join('\n')}`).toEqual([]);
    },
  };
}

/**
 * Wait for the VS intro overlay (if shown) to dismiss or click to skip it.
 */
async function waitForActiveMatchBoard(page) {
  const intro = page.locator('#intro-root');
  // Give the intro a brief moment to appear or auto-dismiss, clicking it if visible
  if (await intro.isVisible().catch(() => false)) {
    await intro.click({ force: true }).catch(() => {});
  }
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('#player-zone')).toBeVisible();
  await expect(page.locator('#opponent-zone')).toBeVisible();
  await expect(page.locator('#center-bench')).toBeVisible();
}

module.exports = {
  createErrorGuard,
  waitForActiveMatchBoard,
};

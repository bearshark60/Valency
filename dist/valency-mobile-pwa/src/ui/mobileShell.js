// VALENCY Mobile Shell — Touch Drawers, Action Sheet, iOS Safari Audio Unlock & PWA Registration
// Loaded exclusively by mobile.html; keeps desktop index.html and app.js 100% untouched.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const elSidebar = document.getElementById('sidebar');
  const elDrawerBackdrop = document.getElementById('mobile-drawer-backdrop');
  const elBtnHints = document.getElementById('btn-mobile-hints');
  const elBtnLog = document.getElementById('btn-mobile-log');
  const elBtnDrawerClose = document.getElementById('btn-mobile-drawer-close');
  const elTabHints = document.getElementById('tab-hints');
  const elTabLog = document.getElementById('tab-log');
  const elRecipeCount = document.getElementById('recipe-count');
  const elMobileBadge = document.getElementById('mobile-hints-badge');
  const elRecipeHints = document.getElementById('recipe-hints');

  const elBtnMore = document.getElementById('btn-mobile-more');
  const elMoreBackdrop = document.getElementById('mobile-more-backdrop');
  const elBtnMoreClose = document.getElementById('btn-mobile-more-close');

  function openDrawer(tab) {
    closeMoreSheet();
    if (tab === 'log' && elTabLog) elTabLog.click();
    else if (elTabHints) elTabHints.click();
    if (elSidebar) elSidebar.classList.add('open');
    if (elDrawerBackdrop) elDrawerBackdrop.classList.remove('hidden');
  }

  function closeDrawer() {
    if (elSidebar) elSidebar.classList.remove('open');
    if (elDrawerBackdrop) elDrawerBackdrop.classList.add('hidden');
  }

  function openMoreSheet() {
    closeDrawer();
    syncMobileSheetLabels();
    if (elMoreBackdrop) elMoreBackdrop.classList.remove('hidden');
  }

  function closeMoreSheet() {
    if (elMoreBackdrop) elMoreBackdrop.classList.add('hidden');
  }

  function syncMobileSheetLabels() {
    const musicOn = V.Sound && V.Sound.isMusicEnabled ? V.Sound.isMusicEnabled() : true;
    const sfxOn = V.Sound && V.Sound.isSoundEnabled ? V.Sound.isSoundEnabled() : true;
    const fxOn = V.isAnimationsEnabled ? V.isAnimationsEnabled() : true;
    const bMusic = document.getElementById('btn-music-toggle');
    const bSfx = document.getElementById('btn-sfx-toggle');
    const bFx = document.getElementById('btn-fx-toggle');
    if (bMusic) bMusic.textContent = musicOn ? '🎵 Music: On' : '🔇 Music: Off';
    if (bSfx) bSfx.textContent = sfxOn ? '🔊 SFX: On' : '🔇 SFX: Off';
    if (bFx) bFx.textContent = fxOn ? '✨ Visual FX: On' : '○ Visual FX: Off';
  }

  if (elBtnHints) elBtnHints.addEventListener('click', () => openDrawer('hints'));
  if (elBtnLog) elBtnLog.addEventListener('click', () => openDrawer('log'));
  if (elBtnDrawerClose) elBtnDrawerClose.addEventListener('click', closeDrawer);
  if (elDrawerBackdrop) elDrawerBackdrop.addEventListener('click', closeDrawer);

  if (elBtnMore) elBtnMore.addEventListener('click', openMoreSheet);
  if (elBtnMoreClose) elBtnMoreClose.addEventListener('click', closeMoreSheet);
  if (elMoreBackdrop) {
    elMoreBackdrop.addEventListener('click', (e) => {
      if (e.target === elMoreBackdrop) closeMoreSheet();
    });
  }

  // Auto-close More sheet after tapping navigation/modal actions; refresh labels after toggles
  ['btn-periodic', 'btn-rules', 'btn-concede', 'btn-new-game'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => setTimeout(closeMoreSheet, 0));
  });
  ['btn-music-toggle', 'btn-sfx-toggle', 'btn-fx-toggle'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => setTimeout(syncMobileSheetLabels, 0));
  });

  // Auto-close Hints drawer right after tapping a recipe chip so the player sees their selected hand immediately!
  if (elRecipeHints) {
    elRecipeHints.addEventListener('click', (e) => {
      if (e.target && e.target.closest && e.target.closest('[data-recipe-idx]')) {
        setTimeout(closeDrawer, 60);
      }
    });
  }

  // Mirror live playable recipe count into the topbar mobile badge
  if (elRecipeCount && elMobileBadge && typeof MutationObserver !== 'undefined') {
    const syncBadge = () => {
      elMobileBadge.textContent = elRecipeCount.textContent || '0';
    };
    syncBadge();
    new MutationObserver(syncBadge).observe(elRecipeCount, { childList: true, characterData: true, subtree: true });
  }

  // Ensure drawers reset cleanly when returning to menu
  const btnBackMenu = document.getElementById('btn-back-menu');
  if (btnBackMenu) {
    btnBackMenu.addEventListener('click', () => {
      closeDrawer();
      closeMoreSheet();
    });
  }

  // Hide the "Add to Home Screen" tip if already running as an installed iPhone Home Screen web app
  const isStandalone =
    (global.navigator && global.navigator.standalone === true) ||
    (global.matchMedia && global.matchMedia('(display-mode: standalone)').matches);
  const elInstallTip = document.getElementById('ios-install-tip');
  if (elInstallTip && isStandalone) {
    elInstallTip.classList.add('hidden');
  }

  // iOS Safari Web Audio unlock on very first touchstart
  global.addEventListener(
    'touchstart',
    () => {
      if (V.Sound && V.Sound.unlockAudio) V.Sound.unlockAudio();
    },
    { capture: true, passive: true, once: true }
  );

  // Register offline Service Worker when served over HTTP/HTTPS
  if (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')
  ) {
    global.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  }

  syncMobileSheetLabels();
})(typeof window !== 'undefined' ? window : globalThis);

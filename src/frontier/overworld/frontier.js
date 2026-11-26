// VALENCY: The Elemental Frontier — Overworld Prototype Orchestrator
// Isolated under window.Valency.Frontier.Overworld and #frontier-overworld-screen
// so zero globals, DOM IDs, or selectors collide with Stage 3B Frontier Hub managers or UI.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});
  const O = (F.Overworld = F.Overworld || {});

  let active = false;
  let initialized = false;
  let rafId = null;
  let lastTimestamp = 0;

  let world = null;
  let player = null;
  let camera = null;
  let renderer = null;
  let keyboard = null;
  let resizeObserver = null;

  let elScreen = null;
  let elCanvasWrap = null;
  let elCanvas = null;
  let elCoordsReadout = null;
  let elDirReadout = null;

  function handleResize() {
    if (!elCanvasWrap || !renderer || !camera) return;
    const rect = elCanvasWrap.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width || window.innerWidth || 800));
    const h = Math.max(1, Math.floor(rect.height || window.innerHeight || 600));
    renderer.resize(w, h);
    O.Camera.setViewport(camera, w, h, world);
    if (active) {
      renderer.render(world, player, camera);
    }
  }

  function updateHudReadout() {
    if (!player) return;
    if (elCoordsReadout) {
      elCoordsReadout.textContent = `X:${Math.round(player.x)} Y:${Math.round(player.y)}`;
    }
    if (elDirReadout) {
      const stateLabel = player.isMoving ? 'MOV' : 'IDLE';
      elDirReadout.textContent = `${player.facingDir} • ${stateLabel}`;
    }
  }

  /**
   * Deterministic simulation tick (usable by both RAF loop and automated tests).
   */
  function stepSimulation(dtSeconds, externalInput) {
    if (!world || !player || !camera) return null;

    const inputSources = [];
    if (keyboard) inputSources.push(keyboard.getVector());
    if (externalInput) inputSources.push(externalInput);

    const combined = O.Movement.combineInputVectors(inputSources);
    const moveRes = O.Movement.stepPlayerMovement(player, combined, dtSeconds, world);
    O.Camera.updateCamera(camera, player.x, player.y, dtSeconds, world);
    updateHudReadout();

    if (renderer && active) {
      renderer.render(world, player, camera);
    }
    return moveRes;
  }

  function loop(timestamp) {
    if (!active) return;
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dtSeconds = Math.min(0.1, Math.max(0, (timestamp - lastTimestamp) / 1000));
    lastTimestamp = timestamp;

    stepSimulation(dtSeconds);
    rafId = global.requestAnimationFrame(loop);
  }

  function buildDOM() {
    if (initialized) return true;
    if (typeof document === 'undefined') return false;

    elScreen = document.getElementById('frontier-overworld-screen');
    if (!elScreen) {
      elScreen = document.createElement('div');
      elScreen.id = 'frontier-overworld-screen';
      elScreen.className = 'frontier-overworld-screen hidden';
      document.body.appendChild(elScreen);
    }

    elScreen.innerHTML = `
      <header class="fo-topbar">
        <div class="fo-top-left">
          <button id="frontier-overworld-btn-exit" class="ctrl-btn fo-exit-btn" type="button" title="Return to Main Menu (Esc)">← Menu</button>
          <div class="fo-title-group">
            <span class="fo-title">FRONTIER OVERWORLD</span>
            <span class="fo-zone-sub">Outpost Alpha • Top-Down Prototype</span>
          </div>
        </div>
        <div class="fo-top-right">
          <button id="frontier-overworld-btn-reset" class="ctrl-btn fo-ctrl-btn" type="button" title="Reset scientist to courtyard spawn">↺ Spawn</button>
        </div>
      </header>
      <div id="frontier-overworld-canvas-wrap" class="fo-canvas-wrap">
        <canvas id="frontier-overworld-canvas" class="fo-canvas" aria-label="Frontier overworld map"></canvas>
        <div id="frontier-overworld-hud-telemetry" class="fo-hud-telemetry" aria-live="off">
          <span id="frontier-overworld-coords">X:960 Y:640</span>
          <span class="fo-hud-sep">|</span>
          <span id="frontier-overworld-dir">S • IDLE</span>
        </div>
        <div id="frontier-overworld-controls-hint" class="fo-controls-hint">Move: WASD / Arrow Keys • Esc: Menu</div>
      </div>
    `;

    elCanvasWrap = elScreen.querySelector('#frontier-overworld-canvas-wrap');
    elCanvas = elScreen.querySelector('#frontier-overworld-canvas');
    elCoordsReadout = elScreen.querySelector('#frontier-overworld-coords');
    elDirReadout = elScreen.querySelector('#frontier-overworld-dir');

    const btnExit = elScreen.querySelector('#frontier-overworld-btn-exit');
    const btnReset = elScreen.querySelector('#frontier-overworld-btn-reset');

    if (btnExit) {
      btnExit.addEventListener('click', () => {
        if (V.Sound && V.Sound.playButtonClick) V.Sound.playButtonClick();
        exitOverworld();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (V.Sound && V.Sound.playButtonClick) V.Sound.playButtonClick();
        resetPosition();
      });
    }

    // Core simulation objects (rendering-independent)
    world = O.World.createTestWorld();
    player = O.Player.createPlayer({
      x: world.spawn.x,
      y: world.spawn.y,
      name: 'Field Chemist',
    });
    camera = O.Camera.createCamera({
      x: player.x,
      y: player.y,
      viewportWidth: window.innerWidth || 800,
      viewportHeight: window.innerHeight || 600,
      projectionId: 'topdown',
      followSmoothing: 10,
      clampToWorld: true,
    });

    // Swappable presentation renderer
    renderer = O.TopDownRenderer.createTopDownRenderer(elCanvas);

    // Decoupled desktop keyboard input provider
    keyboard = O.KeyboardInput.createKeyboardInput({
      onEscape: () => {
        if (active) exitOverworld();
      },
    });

    window.addEventListener('resize', handleResize);
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(elCanvasWrap);
    }

    initialized = true;
    return true;
  }

  function resetPosition() {
    if (!world || !player || !camera) return;
    O.Player.resetPlayer(player, world.spawn.x, world.spawn.y);
    O.Camera.snapTo(camera, player.x, player.y, world);
    updateHudReadout();
    if (renderer && active) {
      renderer.render(world, player, camera);
    }
  }

  function enterOverworld() {
    if (!buildDOM()) return false;
    if (active) return true;

    const menuEl = document.getElementById('menu-screen');
    const appEl = document.getElementById('app');
    if (V.UI && V.UI.closeModal) V.UI.closeModal();
    if (menuEl) menuEl.classList.add('hidden');
    if (appEl) appEl.classList.add('hidden');

    document.body.classList.add('frontier-overworld-active');
    elScreen.classList.remove('hidden');

    active = true;
    lastTimestamp = 0;

    handleResize();
    O.Camera.snapTo(camera, player.x, player.y, world);
    keyboard.enable();
    updateHudReadout();
    renderer.render(world, player, camera);

    if (typeof global.requestAnimationFrame === 'function') {
      rafId = global.requestAnimationFrame(loop);
    }
    return true;
  }

  function exitOverworld() {
    if (!active && elScreen && elScreen.classList.contains('hidden')) return false;

    active = false;
    if (rafId !== null && typeof global.cancelAnimationFrame === 'function') {
      global.cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTimestamp = 0;

    if (keyboard) keyboard.disable();

    document.body.classList.remove('frontier-overworld-active');
    if (elScreen) elScreen.classList.add('hidden');

    if (V.UI && typeof V.UI.showMenuScreen === 'function') {
      V.UI.showMenuScreen();
    } else {
      const menuEl = document.getElementById('menu-screen');
      if (menuEl) menuEl.classList.remove('hidden');
    }
    return true;
  }

  function getState() {
    return {
      active,
      initialized,
      world,
      player,
      camera,
      rendererId: renderer ? renderer.id : null,
      projectionId: camera ? camera.projectionId : null,
      keyboard: keyboard ? keyboard.getVector() : { x: 0, y: 0, active: false },
    };
  }

  function bindMenuEntry() {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById('menu-btn-frontier-overworld');
    if (!btn || btn.dataset.frontierOverworldBound === '1') return;
    btn.dataset.frontierOverworldBound = '1';
    btn.addEventListener('click', () => {
      if (V.Sound && V.Sound.unlockAudio) V.Sound.unlockAudio();
      if (V.Sound && V.Sound.playButtonClick) V.Sound.playButtonClick();
      enterOverworld();
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindMenuEntry);
    } else {
      bindMenuEntry();
    }
  }

  // Public Overworld API (strictly under window.Valency.Frontier.Overworld)
  O.enter = enterOverworld;
  O.exit = exitOverworld;
  O.isActive = () => active;
  O.resetPosition = resetPosition;
  O.stepSimulation = stepSimulation;
  O.getState = getState;
  O._getInputsForTest = () => ({ keyboard });
})(typeof window !== 'undefined' ? window : globalThis);

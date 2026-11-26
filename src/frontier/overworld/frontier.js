// VALENCY: The Elemental Frontier — Overworld Prototype Orchestrator (Desktop)
// Independent layer managing Frontier lifecycle, simulation loop, keyboard input,
// world-space camera tracking, swappable renderer, and clean entry/exit without touching Story Mode or card battles.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

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
    F.Camera.setViewport(camera, w, h, world);
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

    const combined = F.Movement.combineInputVectors(inputSources);
    const moveRes = F.Movement.stepPlayerMovement(player, combined, dtSeconds, world);
    F.Camera.updateCamera(camera, player.x, player.y, dtSeconds, world);
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

    elScreen = document.getElementById('frontier-screen');
    if (!elScreen) {
      elScreen = document.createElement('div');
      elScreen.id = 'frontier-screen';
      elScreen.className = 'frontier-screen hidden';
      document.body.appendChild(elScreen);
    }

    elScreen.innerHTML = `
      <header class="frontier-topbar">
        <div class="frontier-top-left">
          <button id="frontier-btn-exit" class="ctrl-btn frontier-exit-btn" type="button" title="Return to Main Menu (Esc)">← Menu</button>
          <div class="frontier-title-group">
            <span class="frontier-title">FRONTIER</span>
            <span class="frontier-zone-sub">Outpost Alpha • Top-Down Prototype</span>
          </div>
        </div>
        <div class="frontier-top-right">
          <button id="frontier-btn-reset" class="ctrl-btn frontier-ctrl-btn" type="button" title="Reset scientist to courtyard spawn">↺ Spawn</button>
        </div>
      </header>
      <div id="frontier-canvas-wrap" class="frontier-canvas-wrap">
        <canvas id="frontier-canvas" class="frontier-canvas" aria-label="Frontier overworld map"></canvas>
        <div id="frontier-hud-telemetry" class="frontier-hud-telemetry" aria-live="off">
          <span id="frontier-coords">X:960 Y:640</span>
          <span class="frontier-hud-sep">|</span>
          <span id="frontier-dir">S • IDLE</span>
        </div>
        <div id="frontier-controls-hint" class="frontier-controls-hint">Move: WASD / Arrow Keys • Esc: Menu</div>
      </div>
    `;

    elCanvasWrap = elScreen.querySelector('#frontier-canvas-wrap');
    elCanvas = elScreen.querySelector('#frontier-canvas');
    elCoordsReadout = elScreen.querySelector('#frontier-coords');
    elDirReadout = elScreen.querySelector('#frontier-dir');

    const btnExit = elScreen.querySelector('#frontier-btn-exit');
    const btnReset = elScreen.querySelector('#frontier-btn-reset');

    if (btnExit) {
      btnExit.addEventListener('click', () => {
        if (V.Sound && V.Sound.playButtonClick) V.Sound.playButtonClick();
        exitFrontier();
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (V.Sound && V.Sound.playButtonClick) V.Sound.playButtonClick();
        resetPosition();
      });
    }

    // Core simulation objects (rendering-independent)
    world = F.World.createTestWorld();
    player = F.Player.createPlayer({
      x: world.spawn.x,
      y: world.spawn.y,
      name: 'Field Chemist',
    });
    camera = F.Camera.createCamera({
      x: player.x,
      y: player.y,
      viewportWidth: window.innerWidth || 800,
      viewportHeight: window.innerHeight || 600,
      projectionId: 'topdown',
      followSmoothing: 10,
      clampToWorld: true,
    });

    // Swappable presentation renderer
    renderer = F.TopDownRenderer.createTopDownRenderer(elCanvas);

    // Decoupled desktop keyboard input provider
    keyboard = F.KeyboardInput.createKeyboardInput({
      onEscape: () => {
        if (active) exitFrontier();
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
    F.Player.resetPlayer(player, world.spawn.x, world.spawn.y);
    F.Camera.snapTo(camera, player.x, player.y, world);
    updateHudReadout();
    if (renderer && active) {
      renderer.render(world, player, camera);
    }
  }

  /**
   * Enter the Frontier Overworld layer cleanly without altering card-battle or Story Mode state.
   */
  function enterFrontier() {
    if (!buildDOM()) return false;
    if (active) return true;

    const menuEl = document.getElementById('menu-screen');
    const appEl = document.getElementById('app');
    if (V.UI && V.UI.closeModal) V.UI.closeModal();
    if (menuEl) menuEl.classList.add('hidden');
    if (appEl) appEl.classList.add('hidden');

    document.body.classList.add('frontier-active');
    elScreen.classList.remove('hidden');

    active = true;
    lastTimestamp = 0;

    handleResize();
    F.Camera.snapTo(camera, player.x, player.y, world);
    keyboard.enable();
    updateHudReadout();
    renderer.render(world, player, camera);

    if (typeof global.requestAnimationFrame === 'function') {
      rafId = global.requestAnimationFrame(loop);
    }
    return true;
  }

  /**
   * Exit the Frontier Overworld cleanly and restore the Valency Main Menu with zero leaked state.
   */
  function exitFrontier() {
    if (!active && elScreen && elScreen.classList.contains('hidden')) return false;

    active = false;
    if (rafId !== null && typeof global.cancelAnimationFrame === 'function') {
      global.cancelAnimationFrame(rafId);
      rafId = null;
    }
    lastTimestamp = 0;

    if (keyboard) keyboard.disable();

    document.body.classList.remove('frontier-active');
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

  // Bind non-invasive menu entry button on load (isolated from Stage 3B #menu-btn-frontier)
  function bindMenuEntry() {
    if (typeof document === 'undefined') return;
    const btn = document.getElementById('menu-btn-frontier-overworld');
    if (!btn || btn.dataset.frontierBound === '1') return;
    btn.dataset.frontierBound = '1';
    btn.addEventListener('click', () => {
      if (V.Sound && V.Sound.unlockAudio) V.Sound.unlockAudio();
      if (V.Sound && V.Sound.playButtonClick) V.Sound.playButtonClick();
      enterFrontier();
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bindMenuEntry);
    } else {
      bindMenuEntry();
    }
  }

  // Public Frontier API
  F.enter = enterFrontier;
  F.exit = exitFrontier;
  F.isActive = () => active;
  F.resetPosition = resetPosition;
  F.stepSimulation = stepSimulation;
  F.getState = getState;
  F._getInputsForTest = () => ({ keyboard });
})(typeof window !== 'undefined' ? window : globalThis);

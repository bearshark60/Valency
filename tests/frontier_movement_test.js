// VALENCY: The Elemental Frontier — Headless Movement, Collision, Camera & Architecture Verification Suite
// Mirrors zero-build VM sandbox pattern from tests/stage2_integration_test.js.
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

// Pure headless sandbox (NO document/canvas) to prove core Frontier simulation has zero DOM coupling
const sandbox = {
  window: null,
  globalThis: null,
  console,
  Math,
  Date,
  Set,
  Map,
  Object,
  Array,
  JSON,
  Number,
  String,
  Boolean,
  Error,
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const FRONTIER_SCRIPTS = [
  'src/frontier/overworld/world.js',
  'src/frontier/overworld/player.js',
  'src/frontier/overworld/movement.js',
  'src/frontier/overworld/camera.js',
  'src/frontier/overworld/inputKeyboard.js',
  'src/frontier/overworld/topDownRenderer.js',
  'src/frontier/overworld/frontier.js',
];

for (const rel of FRONTIER_SCRIPTS) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(code, sandbox, { filename: rel });
}

const V = sandbox.Valency;
const F = V.Frontier;
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS: ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${name}\n  -> ${err.stack || err.message}`);
  }
}

function approxEqual(a, b, eps, msg) {
  assert.ok(Math.abs(a - b) <= (eps || 1e-6), `${msg || 'approxEqual failed'}: expected ${a} ≈ ${b} (eps=${eps || 1e-6})`);
}

// ===== TEST 1: WORLD GEOMETRY & SPAWN INTEGRITY =====
test('World Geometry: bounds, spawn clearance, and unique rect/circle colliders are valid', () => {
  const world = F.World.createTestWorld();
  assert.strictEqual(world.width, 1920);
  assert.strictEqual(world.height, 1280);
  assert.ok(world.colliders.length >= 8, 'Expected rich obstacle layout');
  assert.ok(world.colliders.some((c) => c.kind === 'rect'), 'Expected rect colliders');
  assert.ok(world.colliders.some((c) => c.kind === 'circle'), 'Expected circle colliders');

  const ids = new Set(world.colliders.map((c) => c.id));
  assert.strictEqual(ids.size, world.colliders.length, 'All collider IDs must be unique');

  const player = F.Player.createPlayer({ x: world.spawn.x, y: world.spawn.y });
  assert.strictEqual(F.World.isPositionClear(player.x, player.y, player.radius, world), true, 'Spawn point must be clear of colliders');
});

// ===== TEST 2: 8-DIRECTION MOVEMENT & NORMALIZED DIAGONAL VECTORS =====
test('Movement Kinematics: all 8 directions work and diagonal speed equals cardinal speed', () => {
  const world = F.World.createTestWorld();

  // Verify pure vector normalization
  const diag = F.Movement.normalizeInputVector(1, 1);
  approxEqual(diag.x, Math.SQRT1_2, 1e-9, 'Diagonal X normalized');
  approxEqual(diag.y, Math.SQRT1_2, 1e-9, 'Diagonal Y normalized');
  approxEqual(Math.hypot(diag.x, diag.y), 1, 1e-9, 'Diagonal magnitude must equal 1.0');
  assert.strictEqual(diag.active, true);

  // Verify deadzone suppression
  const dead = F.Movement.normalizeInputVector(0.03, -0.04);
  assert.strictEqual(dead.active, false);
  assert.strictEqual(dead.x, 0);
  assert.strictEqual(dead.y, 0);

  // Verify cardinal vs diagonal distance traveled over identical dt (1.0s)
  const cases = [
    { input: { x: 0, y: -1 }, dir: 'N' },
    { input: { x: 1, y: -1 }, dir: 'NE' },
    { input: { x: 1, y: 0 }, dir: 'E' },
    { input: { x: 1, y: 1 }, dir: 'SE' },
    { input: { x: 0, y: 1 }, dir: 'S' },
    { input: { x: -1, y: 1 }, dir: 'SW' },
    { input: { x: -1, y: 0 }, dir: 'W' },
    { input: { x: -1, y: -1 }, dir: 'NW' },
  ];

  let refDist = null;
  for (const c of cases) {
    const p = F.Player.createPlayer({ x: world.spawn.x, y: world.spawn.y });
    for (let i = 0; i < 60; i++) {
      F.Movement.stepPlayerMovement(p, c.input, 1 / 60, world);
    }
    const dist = Math.hypot(p.x - world.spawn.x, p.y - world.spawn.y);
    assert.strictEqual(p.facingDir, c.dir, `Expected facingDir ${c.dir}`);
    assert.strictEqual(p.isMoving, true);
    if (refDist === null) refDist = dist;
    approxEqual(dist, refDist, 1e-4, `Distance in direction ${c.dir} must match cardinal distance`);
  }

  // Verify combined input sources never exceed unit speed
  const combined = F.Movement.combineInputVectors([
    { x: 1, y: 1 },
    { x: 0.9, y: 0.9 },
  ]);
  approxEqual(Math.hypot(combined.x, combined.y), 1.0, 1e-9, 'Combined inputs must remain unit-clamped');
});

// ===== TEST 3: WORLD BOUNDARIES, RECT/CIRCLE COLLISION, WALL-SLIDING & ANTI-TUNNELING =====
test('Collision & Boundaries: clamps to edges, blocks rect/circle colliders, slides cleanly, and prevents tunneling', () => {
  const world = F.World.createTestWorld();
  const r = 18;

  // 1. All 4 world boundaries
  const edges = [
    { start: { x: 24, y: 640 }, input: { x: -1, y: 0 }, check: (p) => approxEqual(p.x, r, 1e-5, 'Left boundary') },
    { start: { x: world.width - 24, y: 640 }, input: { x: 1, y: 0 }, check: (p) => approxEqual(p.x, world.width - r, 1e-5, 'Right boundary') },
    { start: { x: 960, y: 24 }, input: { x: 0, y: -1 }, check: (p) => approxEqual(p.y, r, 1e-5, 'Top boundary') },
    { start: { x: 960, y: world.height - 24 }, input: { x: 0, y: 1 }, check: (p) => approxEqual(p.y, world.height - r, 1e-5, 'Bottom boundary') },
  ];
  for (const e of edges) {
    const p = F.Player.createPlayer({ x: e.start.x, y: e.start.y, radius: r });
    for (let i = 0; i < 30; i++) {
      F.Movement.stepPlayerMovement(p, e.input, 1 / 60, world);
    }
    e.check(p);
    assert.strictEqual(p.lastCollision.hitBoundary, true, 'Boundary hit must be reported');
  }

  // 2. Rect collision + smooth diagonal wall-sliding against Field Lab HQ (x:256..576, y:192..416)
  const lab = world.colliders.find((c) => c.id === 'field_lab_hq');
  const pRect = F.Player.createPlayer({ x: lab.x + lab.width + 26, y: lab.y + 80, radius: r });
  const startY = pRect.y;
  for (let i = 0; i < 45; i++) {
    F.Movement.stepPlayerMovement(pRect, { x: -1, y: 1 }, 1 / 60, world);
  }
  assert.ok(pRect.x >= lab.x + lab.width + r - 1e-4, 'Player must not penetrate Field Lab HQ');
  assert.ok(pRect.y > startY + 60, 'Player must slide smoothly South along wall during diagonal push');
  assert.ok(pRect.lastCollision.hitIds.includes('field_lab_hq'), 'Hit collider ID must be recorded');

  // 3. Circle collision against Halite Outcrop (x:1488, y:896, r:52)
  const crystal = world.colliders.find((c) => c.id === 'crystal_cluster_e');
  const pCirc = F.Player.createPlayer({ x: crystal.x - crystal.radius - r - 20, y: crystal.y - 10, radius: r });
  for (let i = 0; i < 60; i++) {
    F.Movement.stepPlayerMovement(pCirc, { x: 1, y: 0 }, 1 / 60, world);
  }
  const distToCenter = Math.hypot(pCirc.x - crystal.x, pCirc.y - crystal.y);
  assert.ok(distToCenter >= crystal.radius + r - 1e-4, 'Player must not penetrate circular crystal collider');

  // 4. Anti-tunneling on large frame hitch (dt = 0.25s) against thin 48px wall (south_wall_west y:1088..1136)
  const wall = world.colliders.find((c) => c.id === 'south_wall_west');
  const pFast = F.Player.createPlayer({ x: wall.x + 120, y: wall.y - r - 4, radius: r, speed: 600 });
  F.Movement.stepPlayerMovement(pFast, { x: 0, y: 1 }, 0.25, world, { instantVelocity: true });
  assert.ok(pFast.y <= wall.y - r + 1e-4, `Player tunneled through thin wall: y=${pFast.y}, wallTop=${wall.y - r}`);
});

// ===== TEST 4: CAMERA TRACKING & RENDERING INDEPENDENCE (TOPDOWN vs ISOMETRIC PROJECTION SEAM) =====
test('Camera & Rendering Independence: player-centered tracking, viewport clamping, and projection-invariant simulation', () => {
  const world = F.World.createTestWorld();
  const viewports = [
    { name: 'Desktop 1280x800', w: 1280, h: 800 },
    { name: 'Desktop 1920x1080', w: 1920, h: 1080 },
  ];

  for (const vp of viewports) {
    const cam = F.Camera.createCamera({ x: 960, y: 640, viewportWidth: vp.w, viewportHeight: vp.h, followSmoothing: 10 });
    F.Camera.snapTo(cam, 960, 640, world);
    const centerScreen = F.Camera.worldToScreen(cam, 960, 640);
    approxEqual(centerScreen.x, vp.w / 2, 1e-6, `${vp.name} player centered X`);
    approxEqual(centerScreen.y, vp.h / 2, 1e-6, `${vp.name} player centered Y`);

    F.Camera.snapTo(cam, 20, 20, world);
    const vis = F.Camera.getVisibleWorldBounds(cam);
    assert.ok(vis.minX >= -1e-6 && vis.minY >= -1e-6, `${vp.name} camera must clamp to top-left world bounds`);

    F.Camera.snapTo(cam, 960, 640, world);
    for (let i = 0; i < 120; i++) {
      F.Camera.updateCamera(cam, 1120, 720, 1 / 60, world);
    }
    const expectedX = vp.w >= world.width ? world.width / 2 : 1120;
    approxEqual(cam.x, expectedX, 0.2, `${vp.name} camera converged X`);
    approxEqual(cam.y, 720, 0.2, `${vp.name} camera converged Y`);
  }

  // Round-trip accuracy on BOTH TopDownProjection and IsometricProjection
  const pts = [
    { x: 0, y: 0 },
    { x: 960, y: 640 },
    { x: 1488.5, y: 312.25 },
  ];
  for (const projId of ['topdown', 'isometric']) {
    const cam = F.Camera.createCamera({ x: 960, y: 640, viewportWidth: 1280, viewportHeight: 800, projectionId: projId });
    for (const pt of pts) {
      const scr = F.Camera.worldToScreen(cam, pt.x, pt.y);
      const back = F.Camera.screenToWorld(cam, scr.x, scr.y);
      approxEqual(back.x, pt.x, 1e-9, `${projId} round-trip X`);
      approxEqual(back.y, pt.y, 1e-9, `${projId} round-trip Y`);
    }
  }

  // Prove simulation outcomes are bit-identical regardless of active camera projection
  const pTop = F.Player.createPlayer({ x: world.spawn.x, y: world.spawn.y });
  const pIso = F.Player.createPlayer({ x: world.spawn.x, y: world.spawn.y });
  const camTop = F.Camera.createCamera({ x: 960, y: 640, projectionId: 'topdown' });
  const camIso = F.Camera.createCamera({ x: 960, y: 640, projectionId: 'isometric' });

  for (let i = 0; i < 40; i++) {
    F.Movement.stepPlayerMovement(pTop, { x: 1, y: -1 }, 1 / 60, world);
    F.Camera.updateCamera(camTop, pTop.x, pTop.y, 1 / 60, world);
    F.Movement.stepPlayerMovement(pIso, { x: 1, y: -1 }, 1 / 60, world);
    F.Camera.updateCamera(camIso, pIso.x, pIso.y, 1 / 60, world);
  }
  assert.strictEqual(pTop.x, pIso.x);
  assert.strictEqual(pTop.y, pIso.y);
  assert.strictEqual(pTop.facingDir, pIso.facingDir);
});

// ===== TEST 5: DECOUPLED DESKTOP KEYBOARD INPUT MODULE =====
test('Decoupled Keyboard Input: 8-way vector output, opposite-key cancellation, and clean disable reset', () => {
  const kb = F.KeyboardInput.createKeyboardInput({ target: null });
  kb.enable();
  kb._setKeyForTest('KeyD', true);
  kb._setKeyForTest('KeyW', true);
  assert.deepStrictEqual({ ...kb.getVector() }, { x: 1, y: -1, active: true });

  // Opposite keys cancel cleanly
  kb._setKeyForTest('KeyA', true);
  assert.deepStrictEqual({ ...kb.getVector() }, { x: 0, y: -1, active: true });

  // Disable clears held state
  kb.disable();
  assert.deepStrictEqual({ ...kb.getVector() }, { x: 0, y: 0, active: false });
});

// ===== TEST 6: NON-DESTRUCTIVE index.html WIRING AUDIT =====
test('index.html Integration: preserves all existing scripts/buttons and wires desktop Frontier cleanly', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  // Existing menu buttons & core containers preserved (including Stage 3B #menu-btn-frontier)
  for (const id of ['menu-screen', 'menu-btn-story', 'menu-btn-frontier', 'menu-btn-ai', 'menu-btn-pvp', 'menu-btn-tutorial', 'app', 'modal-root']) {
    assert.ok(html.includes(`id="${id}"`), `Existing DOM ID #${id} must remain intact`);
  }

  // New Frontier Overworld elements present and mobile joystick script not loaded
  assert.ok(html.includes('href="src/styles/frontier-overworld.css"'), 'frontier-overworld.css must be linked');
  assert.ok(html.includes('id="menu-btn-frontier-overworld"'), '#menu-btn-frontier-overworld button must exist');
  assert.ok(html.includes('id="frontier-screen"'), '#frontier-screen container must exist');
  assert.ok(!html.includes('inputJoystick.js'), 'Mobile joystick script must not be loaded');

  // Script order: app.js loads before Frontier modules, and Frontier scripts are in dependency order
  const appIdx = html.indexOf('src/ui/app.js');
  assert.ok(appIdx > 0, 'src/ui/app.js must remain present');
  let prevIdx = appIdx;
  for (const rel of FRONTIER_SCRIPTS) {
    const idx = html.indexOf(rel);
    assert.ok(idx > prevIdx, `Script ${rel} must load after previous script in index.html`);
    prevIdx = idx;
  }
});

console.log(`\nFRONTIER MOVEMENT TEST SUMMARY: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

// VALENCY — Stage 3D.2 Production Painterly Character & Live Battle Portrait Acceptance Tests
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
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

const EXPECTED_LAYER_PNGS = [
  '01_background.png',
  '02_body_clothing.png',
  '03_hair_rear.png',
  '04_face_head.png',
  '05_eye_left_iris.png',
  '06_eye_right_iris.png',
  '07_lid_left_upper.png',
  '08_lid_right_upper.png',
  '09_brow_left.png',
  '10_brow_right.png',
  '11_mouth.png',
  '12_jaw_lower.png',
  '13_hair_front.png',
];

test('Production Layered Painterly Assets: archival masters, 13 RGBA layers, and valid SVG hrefs exist for Frontier & Institute Lavoisier', () => {
  for (const cid of ['sci_lav_001_frontier', 'sci_lav_001_institute']) {
    const dir = path.join(ROOT, 'assets/characters', cid);
    assert.strictEqual(fs.existsSync(path.join(dir, 'production/source_master.png')), true, `${cid} missing archival source_master.png`);

    for (const png of EXPECTED_LAYER_PNGS) {
      const p = path.join(dir, 'layers', png);
      assert.strictEqual(fs.existsSync(p), true, `${cid} missing separated layer PNG: ${png}`);
      assert.ok(fs.statSync(p).size > 200, `${cid} layer PNG looks empty: ${png}`);
    }

    const svg = fs.readFileSync(path.join(dir, 'master_layered.svg'), 'utf8');
    assert.ok(svg.includes('data-art-tier="PRODUCTION_PAINTERLY"'), `${cid} SVG must declare PRODUCTION_PAINTERLY`);
    const hrefs = [...svg.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    assert.ok(hrefs.length >= 13, `${cid} SVG must mount all separated painterly layers`);
    for (const rel of hrefs) {
      assert.strictEqual(fs.existsSync(path.join(ROOT, rel)), true, `Broken SVG layer href in ${cid}: ${rel}`);
    }

    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'rig_manifest.json'), 'utf8'));
    assert.strictEqual(manifest.artTier, 'PRODUCTION_PAINTERLY');
    assert.strictEqual(manifest.viewBox, '0 0 896 1200');
  }
});

test('CharacterRegistry: resolves Frontier & Institute Lavoisier strictly by ID and returns null for non-animated fallback opponents', () => {
  const sb = { window: null, globalThis: null, console, Math, Date, Set, Map, Object, Array, JSON, Number, String, Boolean, Promise, RegExp };
  sb.window = sb;
  sb.globalThis = sb;
  vm.createContext(sb);
  for (const rel of ['src/presentation/visualTheme.js', 'src/presentation/characterSvgRegistry.js', 'src/presentation/characterRigEngine.js', 'src/presentation/characterRegistry.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sb, { filename: rel });
  }
  const V = sb.Valency;
  const CR = V.CharacterRegistry;

  // Frontier Lavoisier by encounterId and opponentEntityId
  const f1 = CR.resolveForBattleState({
    encounterMeta: { encounterId: 'enc_rogue_lavoisier' },
    players: [{ id: 0 }, { id: 1, entityId: 'opp_entity_rogue_lavoisier', name: 'Arbitrary Display Name' }],
  });
  assert.ok(f1 && f1.characterId === 'sci_lav_001_frontier' && f1.manifest.aiFamily === 'FRONTIER');

  // Institute Lavoisier by Academy Chapter 0 missionId
  const i1 = CR.resolveForBattleState({
    storyMissionId: 'ch0_m2_lavoisier',
    players: [{ id: 0 }, { id: 1, name: 'Antoine Lavoisier' }],
  });
  assert.ok(i1 && i1.characterId === 'sci_lav_001_institute' && i1.manifest.aiFamily === 'INSTITUTE');

  // Non-animated fallback opponents MUST return null (no display-name false positives!)
  assert.strictEqual(CR.resolveForBattleState({
    encounterMeta: { encounterId: 'enc_caloric_sentinel' },
    players: [{ id: 0 }, { id: 1, entityId: 'opp_entity_caloric_sentinel', name: 'Caloric Calibration Sentinel' }],
  }), null);
  assert.strictEqual(CR.resolveForBattleState({
    mode: 'vs_ai',
    players: [{ id: 0 }, { id: 1, name: 'Dr. Mendeleev (AI)' }],
  }), null);

  // Extensibility: registering a future scientist works purely via config
  CR.registerOpponentMapping({ encounterId: 'enc_future_curie', characterId: 'sci_lav_001_frontier' });
  assert.strictEqual(CR.resolveCharacterId({ encounterId: 'enc_future_curie' }), 'sci_lav_001_frontier');
});

test('Live Battle Integration & Registry Wiring: app.js, animations.js, HTML & SW properly integrated without static portrait duplication', () => {
  const appJs = fs.readFileSync(path.join(ROOT, 'src/ui/app.js'), 'utf8');
  assert.ok(appJs.includes('resolveAnimatedOpponentForState'), 'app.js must resolve opponent via centralized registry');
  assert.ok(appJs.includes('battle-opp-animated-portrait-slot'), 'app.js must replace static portrait slot cleanly');
  assert.ok(appJs.includes('slot.replaceWith(activeOpponentRig.container)') || appJs.includes('animSlot.replaceWith(activeOpponentRig.container)'), 'app.js must persistently re-attach live rig across turns');

  for (const file of ['index.html', 'mobile.html', 'sw.js']) {
    const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.ok(content.includes('characterRegistry.js'), `${file} missing characterRegistry.js`);
  }
});

console.log(`\nSTAGE 3D.2 PRODUCTION PORTRAIT SUMMARY: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

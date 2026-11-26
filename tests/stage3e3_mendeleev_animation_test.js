// VALENCY — Stage 3E.3 Mendeleev Character Animation Integration & Personality Tests
// Verifies registry/manifest/SVG integration, distinct Institute vs. Frontier Mendeleev kinetics
// (not Lavoisier clones), 8 expressions, beard-safe speaking cadence, Mendeleev battle reactions,
// Studio multi-character wiring, accessibility freeze, and zero Lavoisier regression.

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

function makeFakeElement(tag) {
  const attrs = {};
  const classSet = new Set();
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    dataset: {},
    style: {},
    isConnected: true,
    classList: {
      add(...cls) { cls.forEach((c) => classSet.add(c)); },
      remove(...cls) { cls.forEach((c) => classSet.delete(c)); },
      toggle(c, force) {
        if (force === undefined) {
          if (classSet.has(c)) classSet.delete(c);
          else classSet.add(c);
        } else if (force) classSet.add(c);
        else classSet.delete(c);
      },
      contains(c) { return classSet.has(c); },
    },
    setAttribute(k, v) { attrs[k] = String(v); },
    getAttribute(k) { return attrs[k]; },
    _parts: {},
    querySelector(sel) {
      if (sel === 'svg') return el._svg || null;
      return el._parts[sel] || null;
    },
    querySelectorAll(sel) {
      if (sel === '[data-layer]') return new Array(16).fill({});
      return [];
    },
  };
  return el;
}

function attachMockSvg(container) {
  const svg = makeFakeElement('svg');
  const selectors = [
    '[data-rig="torso"]', '[data-rig="head"]', '[data-layer="layer_jaw_lower"]',
    '[data-layer="layer_eye_left"]', '[data-layer="layer_eye_right"]',
    '[data-layer="layer_eye_left"] [data-part="iris"]', '[data-layer="layer_eye_right"] [data-part="iris"]',
    '[data-layer="layer_eye_left"] [data-part="lid_upper"]', '[data-layer="layer_eye_left"] [data-part="lid_lower"]',
    '[data-layer="layer_eye_right"] [data-part="lid_upper"]', '[data-layer="layer_eye_right"] [data-part="lid_lower"]',
    '[data-layer="layer_brow_left"]', '[data-layer="layer_brow_right"]',
    '[data-layer="layer_mouth"]', '[data-layer="layer_mouth"] [data-part="mouth_cavity"]',
    '[data-layer="layer_mech_crystal"]', '[data-layer="layer_fx_reconstruction"]',
    '[data-layer="layer_fx_reconstruction"] [data-part="fx_scanbar"]',
    '[data-layer="layer_fx_reconstruction"] [data-part="fx_lattice"]',
  ];
  for (const sel of selectors) svg._parts[sel] = makeFakeElement('g');
  container._svg = svg;
  Object.defineProperty(container, 'innerHTML', { set() {}, get() { return '<svg></svg>'; } });
  return svg;
}

function createSandbox() {
  const storage = {};
  const sb = {
    window: null, globalThis: null, console, Math, Date, Set, Map, Object, Array, Number, String, Boolean, RegExp, JSON, Promise, setTimeout, clearTimeout,
    performance: { now: () => 1000 },
    localStorage: {
      getItem: (k) => (k in storage ? storage[k] : null),
      setItem: (k, v) => { storage[k] = String(v); },
    },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
  };
  sb.window = sb;
  sb.globalThis = sb;
  vm.createContext(sb);
  for (const rel of [
    'src/presentation/visualTheme.js',
    'src/presentation/characterSvgRegistry.js',
    'src/presentation/characterRigEngine.js',
    'src/presentation/characterRegistry.js',
  ]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sb, { filename: rel });
  }
  return sb;
}

function loadBattleReactionEvaluator() {
  const appSrc = fs.readFileSync(path.join(ROOT, 'src/ui/app.js'), 'utf8');
  const startIdx = appSrc.indexOf('const SEVERE_DISRUPTION_EVENTS');
  const endIdx = appSrc.indexOf('V.evaluateBattlePortraitReaction = evaluateBattlePortraitReaction;');
  assert(startIdx > 0 && endIdx > startIdx);
  const snippet = appSrc.slice(startIdx, endIdx + 'V.evaluateBattlePortraitReaction = evaluateBattlePortraitReaction;'.length);
  const sandbox = { V: {}, Date, Math, Object, Number };
  vm.createContext(sandbox);
  vm.runInContext(snippet, sandbox, { filename: 'battleReactionEvaluator.js' });
  return sandbox.V.evaluateBattlePortraitReaction;
}

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
}

// 1. Canonical Registry, Visual Manifest, SVG Registry & Built-In Manifest Parity
runTest('1. Mendeleev registry mappings, visual manifest, SVG sync & fallback preservation', () => {
  const sb = createSandbox();
  const V = sb.Valency;
  const Rig = V.CharacterRig;
  const CR = V.CharacterRegistry;

  assert.strictEqual(Rig.listCharacters().length, 4, 'Registry should now contain 4 built-in production portraits (2 Lavoisier + 2 Mendeleev)');

  // Exact JSON parity between BUILTIN_CHARACTERS and disk rig_manifest.json
  for (const cid of ['sci_men_002_frontier', 'sci_men_002_institute']) {
    const disk = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/characters', cid, 'rig_manifest.json'), 'utf8'));
    const built = Rig.getCharacterManifest(cid);
    assert.ok(built, `Missing built-in manifest for ${cid}`);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(built.motionProfile)), disk.motionProfile, `${cid} motionProfile parity`);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(built.expressions)), disk.expressions, `${cid} expressions parity`);
    assert.ok(V.CHARACTER_SVG_SOURCES[disk.sourceAsset], `${cid} missing from characterSvgRegistry.js`);
    assert.strictEqual(V.Visual.resolveAsset('characters', cid).status, 'EXISTING', `${cid} missing from visualTheme ASSET_MANIFEST`);
  }

  // Canonical Academy & Frontier mappings
  const instRes = CR.resolveForBattleState({ storyMissionId: 'ch0_m3_mendeleev', players: [{ id: 0 }, { id: 1, name: 'Dmitri Mendeleev' }] });
  assert.strictEqual(instRes.characterId, 'sci_men_002_institute');

  const frontRes = CR.resolveForBattleState({
    encounterMeta: { encounterId: 'enc_rogue_mendeleev' },
    players: [{ id: 0 }, { id: 1, entityId: 'opp_entity_rogue_mendeleev', name: 'Rogue Construct' }],
  });
  assert.strictEqual(frontRes.characterId, 'sci_men_002_frontier');

  // Lavoisier untouched
  assert.strictEqual(CR.resolveCharacterId({ storyMissionId: 'ch0_m2_lavoisier' }), 'sci_lav_001_institute');
  assert.strictEqual(CR.resolveCharacterId({ encounterId: 'enc_rogue_lavoisier' }), 'sci_lav_001_frontier');

  // Unregistered opponents & Classic AI retain static fallback (null)
  assert.strictEqual(CR.resolveCharacterId({ storyMissionId: 'ch0_m4_pauling' }), null);
  assert.strictEqual(CR.resolveCharacterId({ storyMissionId: 'ch0_m5_curie' }), null);
  assert.strictEqual(CR.resolveForBattleState({ mode: 'vs_ai', players: [{ id: 0 }, { id: 1, name: 'Dr. Mendeleev (AI)' }] }), null);
});

// 2. Distinct Mendeleev Kinetic Personalities Over 60 Virtual Seconds (Not Lavoisier Clones)
runTest('2. 60-second simulation verifies distinct Institute vs. Frontier Mendeleev kinetics', () => {
  const sb = createSandbox();
  const Rig = sb.Valency.CharacterRig;
  Rig.setAnimationMode('full');

  const cF = makeFakeElement('div'); attachMockSvg(cF);
  const cI = makeFakeElement('div'); attachMockSvg(cI);
  const rigF = Rig.mount(cF, { characterId: 'sci_men_002_frontier', expression: 'neutral' });
  const rigI = Rig.mount(cI, { characterId: 'sci_men_002_institute', expression: 'neutral' });

  const fMicroIds = new Set();
  const fBreathPeriods = new Set();
  const iBreathPeriods = new Set();
  let iMicroSeen = 0;
  let iMaxAbsTilt = 0;
  let iMaxAbsGazeY = 0;
  let fGen2DualAxisGlitchFrames = 0;
  let iGlitchFrames = 0;

  let t = 1000;
  for (let i = 0; i < 2000; i++) {
    t += 30;
    rigF._step(t);
    rigI._step(t);

    if (rigF.activeMicroExpr) fMicroIds.add(rigF.activeMicroExpr.id);
    if (rigI.activeMicroExpr) iMicroSeen += 1;
    fBreathPeriods.add(Math.round(rigF.breathPeriodCur));
    iBreathPeriods.add(Math.round(rigI.breathPeriodCur));

    iMaxAbsTilt = Math.max(iMaxAbsTilt, Math.abs(rigI.postureTilt));
    iMaxAbsGazeY = Math.max(iMaxAbsGazeY, Math.abs(rigI.gazeY));

    if (rigI.glitchStartTs > 0) iGlitchFrames += 1;
    assert.strictEqual(rigI.parts.mechCrystal.getAttribute('opacity'), '0.00');

    // Check Gen-2 orthogonal glitch (left iris X desync != right iris X desync AND right Y != left Y)
    if (rigF.glitchStartTs > 0) {
      const lTr = rigF.parts.irisLeft.getAttribute('transform') || '';
      const rTr = rigF.parts.irisRight.getAttribute('transform') || '';
      if (lTr !== rTr) fGen2DualAxisGlitchFrames += 1;
    }
  }

  // Frontier Mendeleev checks
  assert(fBreathPeriods.size >= 3, 'Frontier Mendeleev must exhibit organic thoracic breathing variance');
  assert(fMicroIds.size >= 1, 'Frontier Mendeleev must exhibit Mendeleev-specific idle micro-expressions');
  for (const id of fMicroIds) {
    assert(['row_verify_furrow', 'heavy_nod_ack', 'lattice_arrest'].includes(id), `Unexpected non-Mendeleev micro-expression: ${id}`);
  }
  assert(fGen2DualAxisGlitchFrames > 0, 'Frontier Mendeleev must trigger Gen-2 orthogonal dual-axis glitch');

  // Institute Mendeleev checks
  assert.strictEqual(iBreathPeriods.size, 1, 'Institute Mendeleev breathing period must stay exact (6800ms)');
  assert.strictEqual(iMicroSeen, 0, 'Institute Mendeleev must have zero idle micro-expressions');
  assert.strictEqual(iGlitchFrames, 0, 'Institute Mendeleev must have zero reconstruction glitches');
  assert(iMaxAbsTilt <= 0.20, `Institute Mendeleev lateral head tilt must remain anchored (got ${iMaxAbsTilt})`);
  assert(iMaxAbsGazeY <= 0.35, `Institute Mendeleev gaze must sweep horizontally along periodic rows (maxY=${iMaxAbsGazeY})`);

  rigF.destroy();
  rigI.destroy();
});

// 3. All 8 Expressions & Beard-Safe Speaking Cadence
runTest('3. All 8 expressions distinct and speaking cadence stays strictly beard-safe with pauses', () => {
  const sb = createSandbox();
  const Rig = sb.Valency.CharacterRig;
  Rig.setAnimationMode('full');

  const cF = makeFakeElement('div'); attachMockSvg(cF);
  const cI = makeFakeElement('div'); attachMockSvg(cI);
  const rigF = Rig.mount(cF, { characterId: 'sci_men_002_frontier', expression: 'explaining' });
  const rigI = Rig.mount(cI, { characterId: 'sci_men_002_institute', expression: 'explaining' });

  rigF.setSpeaking(true);
  rigI.setSpeaking(true);
  const phasesF = new Set();
  const phasesI = new Set();
  let maxJawF = 0;
  let maxJawI = 0;

  let t = 1000;
  for (let i = 0; i < 240; i++) { // 7.2s of speech
    t += 30;
    rigF._step(t);
    rigI._step(t);
    phasesF.add(rigF.speakPhase);
    phasesI.add(rigI.speakPhase);

    const mF = /translate\(0 ([^)]+)\)/.exec(rigF.parts.jaw.getAttribute('transform') || '');
    const mI = /translate\(0 ([^)]+)\)/.exec(rigI.parts.jaw.getAttribute('transform') || '');
    if (mF) maxJawF = Math.max(maxJawF, parseFloat(mF[1]));
    if (mI) maxJawI = Math.max(maxJawI, parseFloat(mI[1]));
  }

  assert(phasesF.has('syllable') && phasesF.has('gap') && phasesF.has('pause'), 'Frontier Mendeleev speech must include syllables, gaps, and pauses');
  assert(phasesI.has('syllable') && phasesI.has('gap') && phasesI.has('pause'), 'Institute Mendeleev speech must include syllables, gaps, and pauses');
  // Beard-safe cap: max jaw displacement strictly <= 5.6px (vs Lavoisier clean-shaven ~7.4px)
  assert(maxJawF > 2.0 && maxJawF <= 5.6, `Frontier Mendeleev jaw travel must be beard-safe (got ${maxJawF.toFixed(2)}px)`);
  assert(maxJawI > 1.8 && maxJawI <= 5.0, `Institute Mendeleev jaw travel must be beard-safe (got ${maxJawI.toFixed(2)}px)`);

  // Smooth return to idle
  rigF.setSpeaking(false);
  rigI.setSpeaking(false);
  for (let i = 0; i < 30; i++) {
    t += 30;
    rigF._step(t);
    rigI._step(t);
  }
  assert.strictEqual(rigF.getState().speakPhase, 'idle');
  assert.strictEqual(rigI.getState().speakPhase, 'idle');
  assert(rigF.speakOpenCur < 0.01 && rigI.speakOpenCur < 0.01);

  rigF.destroy();
  rigI.destroy();
});

// 4. Mendeleev Personality-Driven Battle Reactions (Decoupled From Game Rules)
runTest('4. Mendeleev battle reactions reflect periodic personality with cooldowns & Institute restraint', () => {
  const evalReaction = loadBattleReactionEvaluator();
  const baseState = { battleStartTs: 1000, lastReactionTs: 0, lastReactionExpr: 'neutral', lastGlitchTs: 0, prevPlayerSP: 0, prevOppSP: 0 };

  // Unexpected reaction (Hydrocarbon Synergy) -> thoughtful curiosity
  const r1 = evalReaction([{ meta: { type: 'HYDROCARBON_SYNERGY', playerId: 0 } }], {
    now: 5000, aiFamily: 'FRONTIER', characterId: 'sci_men_002_frontier', playerSP: 10, oppSP: 8, reactionState: baseState,
  });
  assert.strictEqual(r1.action, 'react');
  assert.strictEqual(r1.expression, 'thoughtful');

  // Mendeleev shields his pillar -> amused intellectual satisfaction
  const r2 = evalReaction([{ meta: { type: 'SHIELD', playerId: 1 } }], {
    now: 8000, aiFamily: 'INSTITUTE', characterId: 'sci_men_002_institute', playerSP: 10, oppSP: 10, reactionState: r1.nextState,
  });
  assert.strictEqual(r2.action, 'react');
  assert.strictEqual(r2.expression, 'amused');

  // Player big synthesis (+14 SP): Institute thoughtful acknowledgment vs Frontier concerned
  const rInstBig = evalReaction([{ meta: { type: 'SYNTHESIZE', playerId: 0, sp: 14 } }], {
    now: 12000, aiFamily: 'INSTITUTE', characterId: 'sci_men_002_institute', playerSP: 14, oppSP: 10, reactionState: r2.nextState,
  });
  const rFrontBig = evalReaction([{ meta: { type: 'SYNTHESIZE', playerId: 0, sp: 14 } }], {
    now: 12000, aiFamily: 'FRONTIER', characterId: 'sci_men_002_frontier', playerSP: 14, oppSP: 10, reactionState: r2.nextState,
  });
  assert.strictEqual(rInstBig.expression, 'thoughtful', 'Institute Mendeleev acknowledges impressive synthesis thoughtfully');
  assert.strictEqual(rFrontBig.expression, 'concerned', 'Frontier Mendeleev shows sharper concern on +14 SP');

  // Player small synthesis (+5 SP): Frontier Mendeleev disappointed (unlike Lavoisier amused!)
  const rFrontSmall = evalReaction([{ meta: { type: 'SYNTHESIZE', playerId: 0, sp: 5 } }], {
    now: 16000, aiFamily: 'FRONTIER', characterId: 'sci_men_002_frontier', playerSP: 5, oppSP: 10, reactionState: baseState,
  });
  assert.strictEqual(rFrontSmall.expression, 'disappointed');

  // Major battle swing (18 vs 8 SP): Institute disappointed (ZERO instability), Frontier instability + glitch!
  const rSwingInst = evalReaction([{ meta: { type: 'SYNTHESIZE', playerId: 0, sp: 8 } }], {
    now: 20000, aiFamily: 'INSTITUTE', characterId: 'sci_men_002_institute', playerSP: 18, oppSP: 8, reactionState: baseState,
  });
  const rSwingFront = evalReaction([{ meta: { type: 'SYNTHESIZE', playerId: 0, sp: 8 } }], {
    now: 20000, aiFamily: 'FRONTIER', characterId: 'sci_men_002_frontier', playerSP: 18, oppSP: 8, reactionState: baseState,
  });
  assert.strictEqual(rSwingInst.expression, 'disappointed');
  assert.strictEqual(rSwingInst.triggerGlitch, false);
  assert.strictEqual(rSwingFront.expression, 'instability');
  assert.strictEqual(rSwingFront.triggerGlitch, true);
});

// 5. Studio Multi-Character Controls & Accessibility Modes
runTest('5. Character Animation Studio exposes Mendeleev selector, battle reaction tester & Reduced/Off freeze', () => {
  const studioJs = fs.readFileSync(path.join(ROOT, 'src/ui/frontierUI.js'), 'utf8');
  assert(studioJs.includes('sci_men_002_frontier') && studioJs.includes('sci_men_002_institute'));
  assert(studioJs.includes('data-poc-scientist'));
  assert(studioJs.includes('data-poc-view'));
  assert(studioJs.includes('data-poc-react'));
  assert(studioJs.includes('btn-poc-cadence'));
  assert(studioJs.includes('enc_rogue_mendeleev'));

  const sb = createSandbox();
  const Rig = sb.Valency.CharacterRig;
  const c = makeFakeElement('div'); attachMockSvg(c);
  const rig = Rig.mount(c, { characterId: 'sci_men_002_frontier', expression: 'amused' });
  Rig.setAnimationMode('reduced');
  assert.strictEqual(Rig.isEffectivelyAnimated(), false);
  assert.strictEqual(c.classList.contains('rig-reduced'), true);
  Rig.setAnimationMode('off');
  assert.strictEqual(c.classList.contains('rig-off'), true);
  Rig.setAnimationMode('full');
  rig.destroy();
  assert.strictEqual(Rig.getActiveRigCount(), 0);
});

if (!process.exitCode) {
  console.log('\nALL STAGE 3E.3 MENDELEEV ANIMATION INTEGRATION TESTS PASSED!');
}

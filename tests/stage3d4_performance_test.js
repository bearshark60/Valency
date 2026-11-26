// VALENCY — Stage 3D.4 Character Performance, Expression Refinement & Personality Animation Tests
// Verifies Frontier vs. Institute personalities, 60-second simulated idle performance,
// coordinated 8-expression differentiation, phrase-structured speaking cadence,
// contextual battle reactions with cooldowns/deduplication, and motion accessibility modes.

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
    children: [],
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
    _attrs: attrs,
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

function attachMockSvgToContainer(container) {
  const svg = makeFakeElement('svg');
  const partSelectors = [
    '[data-rig="torso"]',
    '[data-rig="head"]',
    '[data-layer="layer_jaw_lower"]',
    '[data-layer="layer_eye_left"]',
    '[data-layer="layer_eye_right"]',
    '[data-layer="layer_eye_left"] [data-part="iris"]',
    '[data-layer="layer_eye_right"] [data-part="iris"]',
    '[data-layer="layer_eye_left"] [data-part="lid_upper"]',
    '[data-layer="layer_eye_left"] [data-part="lid_lower"]',
    '[data-layer="layer_eye_right"] [data-part="lid_upper"]',
    '[data-layer="layer_eye_right"] [data-part="lid_lower"]',
    '[data-layer="layer_brow_left"]',
    '[data-layer="layer_brow_right"]',
    '[data-layer="layer_mouth"]',
    '[data-layer="layer_mouth"] [data-part="mouth_cavity"]',
    '[data-layer="layer_mech_crystal"]',
    '[data-layer="layer_fx_reconstruction"]',
    '[data-layer="layer_fx_reconstruction"] [data-part="fx_scanbar"]',
    '[data-layer="layer_fx_reconstruction"] [data-part="fx_lattice"]',
  ];
  for (const sel of partSelectors) {
    svg._parts[sel] = makeFakeElement('g');
  }
  container._svg = svg;
  Object.defineProperty(container, 'innerHTML', {
    set() { /* SVG already mocked */ },
    get() { return '<svg></svg>'; },
  });
  return svg;
}

function createSandbox() {
  const storage = {};
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
    Number,
    String,
    Boolean,
    RegExp,
    JSON,
    Promise,
    setTimeout,
    clearTimeout,
    performance: { now: () => 1000 },
    localStorage: {
      getItem: (k) => (k in storage ? storage[k] : null),
      setItem: (k, v) => { storage[k] = String(v); },
    },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  // Load SVG registry + rig engine
  const files = [
    'src/presentation/characterSvgRegistry.js',
    'src/presentation/characterRigEngine.js',
  ];
  for (const rel of files) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }
  return sandbox;
}

function loadBattleReactionEvaluator() {
  const appSrc = fs.readFileSync(path.join(ROOT, 'src/ui/app.js'), 'utf8');
  const startIdx = appSrc.indexOf('const SEVERE_DISRUPTION_EVENTS');
  const endIdx = appSrc.indexOf('V.evaluateBattlePortraitReaction = evaluateBattlePortraitReaction;');
  assert(startIdx > 0 && endIdx > startIdx, 'evaluateBattlePortraitReaction must exist in src/ui/app.js');
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

// 1. Personality & Manifest Parity
runTest('1. Frontier vs. Institute personalities & manifest JSON parity', () => {
  const sb = createSandbox();
  const Rig = sb.Valency.CharacterRig;

  const frontDisk = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/characters/sci_lav_001_frontier/rig_manifest.json'), 'utf8'));
  const instDisk = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/characters/sci_lav_001_institute/rig_manifest.json'), 'utf8'));
  const frontBuilt = Rig.getCharacterManifest('sci_lav_001_frontier');
  const instBuilt = Rig.getCharacterManifest('sci_lav_001_institute');

  assert.strictEqual(frontDisk.personality.archetype, 'Human Reconstruction');
  assert.strictEqual(instDisk.personality.archetype, 'Preserved Intelligence');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(frontBuilt.motionProfile)), frontDisk.motionProfile, 'Frontier builtin motionProfile must match rig_manifest.json');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(instBuilt.motionProfile)), instDisk.motionProfile, 'Institute builtin motionProfile must match rig_manifest.json');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(frontBuilt.expressions)), frontDisk.expressions, 'Frontier builtin expressions must match rig_manifest.json');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(instBuilt.expressions)), instDisk.expressions, 'Institute builtin expressions must match rig_manifest.json');

  // Strict personality contrasts
  assert(frontDisk.motionProfile.breathingVarianceMs > 0, 'Frontier breathing must allow subtle organic variance');
  assert.strictEqual(instDisk.motionProfile.breathingVarianceMs, 0, 'Institute breathing must be steady/metronomic');
  assert(instDisk.motionProfile.breathingAmplitudePx < frontDisk.motionProfile.breathingAmplitudePx, 'Institute breathing must be more restrained');
  assert(instDisk.motionProfile.postureHoldMinMs > frontDisk.motionProfile.postureHoldMinMs, 'Institute must hold formal posture longer');
  assert(instDisk.motionProfile.postureMaxTiltDeg < frontDisk.motionProfile.postureMaxTiltDeg, 'Institute head tilt must be tighter');
  assert.strictEqual(frontDisk.motionProfile.allowAsymmetricBlink, true);
  assert.strictEqual(instDisk.motionProfile.allowAsymmetricBlink, false);
  assert.strictEqual(frontDisk.motionProfile.allowIdleMicroExpressions, true);
  assert.strictEqual(instDisk.motionProfile.allowIdleMicroExpressions, false);
  assert.strictEqual(frontDisk.motionProfile.allowReconstructionGlitch, true);
  assert.strictEqual(instDisk.motionProfile.allowReconstructionGlitch, false);
  assert(frontDisk.motionProfile.rightEyeTrackLagMs > 0);
  assert.strictEqual(instDisk.motionProfile.rightEyeTrackLagMs, 0);
});

// 2. 60-Second Simulated Idle Performance (Frontier vs. Institute)
runTest('2. 60-second simulated idle performance (stillness holds, blinks, micro-expressions, zero Institute drift)', () => {
  const sb = createSandbox();
  const Rig = sb.Valency.CharacterRig;
  Rig.setAnimationMode('full');

  const cFront = makeFakeElement('div');
  const cInst = makeFakeElement('div');
  attachMockSvgToContainer(cFront);
  attachMockSvgToContainer(cInst);

  const rigF = Rig.mount(cFront, { characterId: 'sci_lav_001_frontier', expression: 'neutral' });
  const rigI = Rig.mount(cInst, { characterId: 'sci_lav_001_institute', expression: 'neutral' });

  let frontMicroSeen = 0;
  let instMicroSeen = 0;
  let frontGlitchFrames = 0;
  let instGlitchFrames = 0;
  let frontAsymBlinkFrames = 0;
  let instAsymBlinkFrames = 0;
  let frontBreathPeriods = new Set();
  let instBreathPeriods = new Set();

  // Simulate 60 seconds at 30ms step (2000 steps)
  let t = 1000;
  for (let i = 0; i < 2000; i++) {
    t += 30;
    rigF._step(t);
    rigI._step(t);

    if (rigF.activeMicroExpr) frontMicroSeen += 1;
    if (rigI.activeMicroExpr) instMicroSeen += 1;
    if (rigF.glitchStartTs > 0) frontGlitchFrames += 1;
    if (rigI.glitchStartTs > 0) instGlitchFrames += 1;

    if (rigF.blinkLeftStart > 0 && rigF.blinkRightStart > 0 && rigF.blinkRightStart !== rigF.blinkLeftStart) {
      frontAsymBlinkFrames += 1;
    }
    if (rigI.blinkLeftStart > 0 && rigI.blinkRightStart > 0 && rigI.blinkRightStart !== rigI.blinkLeftStart) {
      instAsymBlinkFrames += 1;
    }

    frontBreathPeriods.add(Math.round(rigF.breathPeriodCur));
    instBreathPeriods.add(Math.round(rigI.breathPeriodCur));

    // Verify Institute seam opacity stays strictly 0
    assert.strictEqual(rigI.parts.mechCrystal.getAttribute('opacity'), '0.00', 'Institute seam opacity must always stay 0.00');
  }

  assert(frontBreathPeriods.size >= 3, `Frontier should vary breath periods organically across 60s (saw ${frontBreathPeriods.size})`);
  assert.strictEqual(instBreathPeriods.size, 1, 'Institute breath period must stay strictly constant');
  assert(frontMicroSeen > 0, 'Frontier should exhibit subtle idle micro-expressions during 60s stillness');
  assert.strictEqual(instMicroSeen, 0, 'Institute must never drift into Frontier idle micro-expressions');
  assert(frontGlitchFrames > 0, 'Frontier should trigger rare reconstruction instability during 60s');
  assert.strictEqual(instGlitchFrames, 0, 'Institute must never trigger reconstruction instability');
  assert.strictEqual(instAsymBlinkFrames, 0, 'Institute blinks must be strictly symmetrical');
  assert(rigI.triggerReconstructionGlitch() === false, 'Institute triggerReconstructionGlitch must return false');

  rigF.destroy();
  rigI.destroy();
});

// 3. All 8 Expressions Coordinated Differentiation
runTest('3. All 8 expressions produce distinct coordinated facial poses', () => {
  const sb = createSandbox();
  const Rig = sb.Valency.CharacterRig;
  Rig.setAnimationMode('off'); // static snap inspects exact target pose per expression

  const cFront = makeFakeElement('div');
  const cInst = makeFakeElement('div');
  attachMockSvgToContainer(cFront);
  attachMockSvgToContainer(cInst);

  const rigF = Rig.mount(cFront, { characterId: 'sci_lav_001_frontier', expression: 'neutral' });
  const rigI = Rig.mount(cInst, { characterId: 'sci_lav_001_institute', expression: 'neutral' });

  const frontSigs = new Set();
  for (const expr of Rig.DEFAULT_EXPRESSIONS) {
    assert.strictEqual(rigF.setExpression(expr), true);
    const sig = [
      rigF.parts.head.getAttribute('transform'),
      rigF.parts.browLeft.getAttribute('transform'),
      rigF.parts.browRight.getAttribute('transform'),
      rigF.parts.lidUpperLeft.getAttribute('transform'),
      rigF.parts.lidUpperRight.getAttribute('transform'),
      rigF.parts.mouth.getAttribute('transform'),
      rigF.parts.jaw.getAttribute('transform'),
      rigF.parts.mechCrystal.getAttribute('opacity'),
    ].join('|');
    frontSigs.add(sig);
  }
  assert.strictEqual(frontSigs.size, 8, 'All 8 Frontier expressions must yield 8 distinct coordinated multi-part poses');

  // Institute instability must remain identical to neutral (stable hologram, zero drift)
  rigI.setExpression('neutral');
  const instNeutralHead = rigI.parts.head.getAttribute('transform');
  const instNeutralIrisR = rigI.parts.irisRight.getAttribute('transform');
  rigI.setExpression('instability');
  assert.strictEqual(rigI.parts.head.getAttribute('transform'), instNeutralHead, 'Institute instability must not tilt head');
  assert.strictEqual(rigI.parts.irisRight.getAttribute('transform'), instNeutralIrisR, 'Institute instability must not desync right iris');
  assert.strictEqual(rigI.parts.mechCrystal.getAttribute('opacity'), '0.00');

  rigF.destroy();
  rigI.destroy();
});

// 4. Phrase-Structured Speaking Cadence & Smooth Return to Idle
runTest('4. Phrase-structured speaking cadence includes real pauses and settles smoothly to idle', () => {
  const sb = createSandbox();
  const Rig = sb.Valency.CharacterRig;
  Rig.setAnimationMode('full');

  const cFront = makeFakeElement('div');
  attachMockSvgToContainer(cFront);
  const rig = Rig.mount(cFront, { characterId: 'sci_lav_001_frontier', expression: 'explaining' });

  rig.setSpeaking(true);
  const phasesSeen = new Set();
  let minOpenDuringPause = 1;
  let maxOpenDuringSyllable = 0;

  let t = 1000;
  for (let i = 0; i < 200; i++) { // 6 seconds of speech
    t += 30;
    rig._step(t);
    phasesSeen.add(rig.speakPhase);
    if (rig.speakPhase === 'syllable') maxOpenDuringSyllable = Math.max(maxOpenDuringSyllable, rig.speakOpenCur);
    if (rig.speakPhase === 'pause') minOpenDuringPause = Math.min(minOpenDuringPause, rig.speakOpenCur);
  }

  assert(phasesSeen.has('syllable'), 'Speaking cadence must enter syllable phase');
  assert(phasesSeen.has('gap'), 'Speaking cadence must include inter-syllable consonant gaps');
  assert(phasesSeen.has('pause'), 'Speaking cadence must include clause/breath pauses (not nonstop sine flapping)');
  assert(maxOpenDuringSyllable > 0.2, 'Syllables must visibly open mouth');
  assert(minOpenDuringPause < 0.08, `Mouth must settle closed during clause pauses (minOpen=${minOpenDuringPause.toFixed(3)})`);

  // Now stop speaking and confirm smooth settle back to 0
  rig.setSpeaking(false);
  for (let i = 0; i < 30; i++) { // 900ms settle
    t += 30;
    rig._step(t);
  }
  assert.strictEqual(rig.getState().speakPhase, 'idle');
  assert(rig.speakOpenCur < 0.01, `Speaking open offset must settle smoothly to 0 (got ${rig.speakOpenCur})`);
  assert(Math.abs(rig.speakBrowPulse) < 0.05, 'Speaking brow emphasis must settle back to 0');

  rig.destroy();
});

// 5. Contextual Battle Reactions, Cooldowns & Deduplication
runTest('5. Contextual battle reactions enforce cooldowns, deduplication, and Frontier-only instability', () => {
  const evalReaction = loadBattleReactionEvaluator();

  // Battle start grace window blocks low-priority synthesis during first 1.8s
  let rs = { battleStartTs: 10000, lastReactionTs: 0, lastReactionExpr: 'neutral', lastGlitchTs: 0, prevPlayerSP: 0, prevOppSP: 0 };
  let res = evalReaction([{ meta: { type: 'SYNTHESIZE', playerId: 0, sp: 8 } }], {
    now: 10800, aiFamily: 'FRONTIER', playerSP: 8, oppSP: 0, reactionState: rs,
  });
  assert.strictEqual(res.action, 'cooldown', 'Should stay composed neutral during opening 1.8s grace window');

  // After grace window: player mid synthesis -> thoughtful
  res = evalReaction([{ meta: { type: 'SYNTHESIZE', playerId: 0, sp: 8 } }], {
    now: 12500, aiFamily: 'FRONTIER', playerSP: 8, oppSP: 4, reactionState: res.nextState,
  });
  assert.strictEqual(res.action, 'react');
  assert.strictEqual(res.expression, 'thoughtful');

  // Rapid duplicate thoughtful 2.5s later (< 4.5s dedup window) -> blocked
  res = evalReaction([{ meta: { type: 'SYNTHESIZE', playerId: 0, sp: 9 } }], {
    now: 15000, aiFamily: 'FRONTIER', playerSP: 10, oppSP: 6, reactionState: res.nextState,
  });
  assert.strictEqual(res.action, 'cooldown');
  assert.strictEqual(res.reason, 'same_expression_dedup');

  // Hostile disruption (Acid Rain) 1.3s later -> preempts with irritated
  res = evalReaction([{ meta: { type: 'ACID_RAIN', playerId: 0, victimId: 1, lostSP: 4 } }], {
    now: 16300, aiFamily: 'FRONTIER', playerSP: 10, oppSP: 2, reactionState: res.nextState,
  });
  assert.strictEqual(res.action, 'react');
  assert.strictEqual(res.expression, 'irritated');

  // Strategic advantage loss (player takes >= 6 SP lead) after cooldown -> disappointed
  res = evalReaction([{ meta: { type: 'SYNTHESIZE', playerId: 0, sp: 6 } }], {
    now: 19200, aiFamily: 'INSTITUTE', playerSP: 18, oppSP: 10, reactionState: res.nextState,
  });
  assert.strictEqual(res.action, 'react');
  assert.strictEqual(res.expression, 'disappointed', 'Institute under heavy pressure must react with disappointed, NEVER instability');
  assert.strictEqual(res.triggerGlitch, false);

  // Same heavy pressure on Frontier -> triggers rare instability + glitch!
  const resFront = evalReaction([{ meta: { type: 'SYNTHESIZE', playerId: 0, sp: 6 } }], {
    now: 19200, aiFamily: 'FRONTIER', playerSP: 18, oppSP: 10, reactionState: res.nextState,
  });
  assert.strictEqual(resFront.action, 'react');
  assert.strictEqual(resFront.expression, 'instability');
  assert.strictEqual(resFront.triggerGlitch, true);

  // Second heavy pressure 4s later on Frontier -> blocked by 14s glitch cooldown (falls back to normal reaction rules)
  const resFront2 = evalReaction([{ meta: { type: 'ACID_RAIN', playerId: 0, victimId: 1, lostSP: 4 } }], {
    now: 23500, aiFamily: 'FRONTIER', playerSP: 18, oppSP: 6, reactionState: resFront.nextState,
  });
  assert.strictEqual(resFront2.triggerGlitch, false, 'Frontier glitch cooldown (14s) must prevent instability spam');
  assert.strictEqual(resFront2.expression, 'irritated');
});

// 6. Motion Accessibility Modes
runTest('6. Reduced & Off modes cleanly freeze poses without crashing', () => {
  const sb = createSandbox();
  const Rig = sb.Valency.CharacterRig;

  const c = makeFakeElement('div');
  attachMockSvgToContainer(c);
  const rig = Rig.mount(c, { characterId: 'sci_lav_001_frontier', expression: 'thoughtful' });

  Rig.setAnimationMode('reduced');
  assert.strictEqual(Rig.isEffectivelyAnimated(), false);
  assert.strictEqual(c.classList.contains('rig-reduced'), true);
  assert.strictEqual(rig.speakForDuration(2000), false, 'speakForDuration must not animate in reduced mode');

  Rig.setAnimationMode('off');
  assert.strictEqual(Rig.isEffectivelyAnimated(), false);
  assert.strictEqual(c.classList.contains('rig-off'), true);

  Rig.setAnimationMode('full');
  assert.strictEqual(Rig.isEffectivelyAnimated(), true);
  rig.destroy();
  assert.strictEqual(Rig.getActiveRigCount(), 0);
});

if (!process.exitCode) {
  console.log('\nALL STAGE 3D.4 CHARACTER PERFORMANCE TESTS PASSED!');
}

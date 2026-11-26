// VALENCY — Stage 3E.4 Multi-Scientist Architecture Validation & Scalability Regression Test
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Minimal DOM & Browser Mock for Headless Rig Engine + Battle Evaluator Verification
function makeMockEl(tag = 'div', attrs = {}) {
  const children = [];
  const classes = new Set();
  const el = {
    tagName: tag.toUpperCase(),
    attrs: Object.assign({}, attrs),
    dataset: {},
    style: {},
    isConnected: true,
    classList: {
      add: (...c) => c.forEach((x) => classes.add(x)),
      remove: (...c) => c.forEach((x) => classes.delete(x)),
      contains: (c) => classes.has(c),
      toggle: (c, force) => {
        if (force === undefined) {
          if (classes.has(c)) classes.delete(c);
          else classes.add(c);
        } else if (force) classes.add(c);
        else classes.delete(c);
      },
    },
    _innerHTML: '',
    get innerHTML() { return this._innerHTML; },
    set innerHTML(val) {
      this._innerHTML = String(val || '');
      children.length = 0;
      if (this._innerHTML.includes('<svg')) {
        const svg = makeMockEl('svg');
        const layerRegex = /data-layer="([^"]+)"/g;
        let m;
        while ((m = layerRegex.exec(this._innerHTML)) !== null) {
          svg._children.push(makeMockEl('g', { 'data-layer': m[1] }));
        }
        const rigRegex = /id="(rig_[^"]+)"/g;
        while ((m = rigRegex.exec(this._innerHTML)) !== null) {
          svg._children.push(makeMockEl('g', { id: m[1] }));
        }
        children.push(svg);
      }
    },
    _children: children,
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k] || null; },
    querySelector(sel) {
      if (sel === 'svg') return children.find((c) => c.tagName === 'SVG') || null;
      const svg = children.find((c) => c.tagName === 'SVG') || this;
      const dm = sel.match(/^\[data-layer="([^"]+)"\]$/);
      if (dm) return svg._children.find((c) => c.attrs['data-layer'] === dm[1]) || null;
      const im = sel.match(/^#(.+)$/);
      if (im) return svg._children.find((c) => c.attrs.id === im[1]) || null;
      return null;
    },
    querySelectorAll(sel) {
      const svg = children.find((c) => c.tagName === 'SVG') || this;
      if (sel === '[data-layer]') return svg._children.filter((c) => c.attrs['data-layer']);
      return [];
    },
  };
  return el;
}

const memStore = {};
global.localStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(memStore, k) ? memStore[k] : null),
  setItem: (k, v) => { memStore[k] = String(v); },
  removeItem: (k) => { delete memStore[k]; },
};
let rafCallbacks = [];
let rafSeq = 0;
let cancelRafCount = 0;
global.requestAnimationFrame = (cb) => {
  rafSeq += 1;
  rafCallbacks.push({ id: rafSeq, cb });
  return rafSeq;
};
global.cancelAnimationFrame = (id) => {
  cancelRafCount += 1;
  rafCallbacks = rafCallbacks.filter((x) => x.id !== id);
};
global.performance = { now: () => Date.now() };
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
  body: makeMockEl('body'),
};
global.window = global;

// Load Presentation Modules
require(path.join(ROOT, 'src', 'presentation', 'visualTheme.js'));
require(path.join(ROOT, 'src', 'presentation', 'characterSvgRegistry.js'));
require(path.join(ROOT, 'src', 'presentation', 'characterRigEngine.js'));
require(path.join(ROOT, 'src', 'presentation', 'characterRegistry.js'));

const V = global.Valency;
const Rig = V.CharacterRig;
const Reg = V.CharacterRegistry;

// Extract live evaluateBattlePortraitReaction from src/ui/app.js
const appSrc = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'app.js'), 'utf8');
const fnStart = appSrc.indexOf('  const SEVERE_DISRUPTION_EVENTS = [');
const fnEnd = appSrc.indexOf('  V.evaluateBattlePortraitReaction = evaluateBattlePortraitReaction;');
assert(fnStart !== -1 && fnEnd !== -1, 'evaluateBattlePortraitReaction block must exist in src/ui/app.js');
const evaluateBattlePortraitReaction = new Function(
  'V',
  `${appSrc.slice(fnStart, fnEnd)}\nreturn evaluateBattlePortraitReaction;`
)(V);

const PRODUCTION_IDS = [
  'sci_lav_001_frontier',
  'sci_lav_001_institute',
  'sci_men_002_frontier',
  'sci_men_002_institute',
];

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  PASS: ${name}`);
  } catch (err) {
    console.error(`  FAIL: ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

async function runAsyncTests() {
  console.log('=== VALENCY Stage 3E.4 Multi-Scientist Scalability & Architecture Validation ===');

  // 1. Production Manifest, SVG, Asset & Mobile Eye-Framing Validation for all 4 Portraits
  test('All 4 production portraits pass validateManifest(), SVG layer parity, disk PNG integrity, budget <= 2.5MB, and circular eye-framing invariant', () => {
    for (const id of PRODUCTION_IDS) {
      const manifestPath = path.join(ROOT, 'assets', 'characters', id, 'rig_manifest.json');
      const svgPath = path.join(ROOT, 'assets', 'characters', id, 'master_layered.svg');
      const layersDir = path.join(ROOT, 'assets', 'characters', id, 'layers');
      assert(fs.existsSync(manifestPath), `${id}: missing rig_manifest.json`);
      assert(fs.existsSync(svgPath), `${id}: missing master_layered.svg`);
      assert(fs.existsSync(layersDir), `${id}: missing layers/ directory`);

      const diskManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const res = Rig.validateManifest(diskManifest);
      assert.strictEqual(res.valid, true, `${id} validateManifest failed: ${res.errors.join('; ')}`);
      assert.strictEqual(res.warnings.length, 0, `${id} unexpected warnings: ${res.warnings.join('; ')}`);

      // Parity between disk rig_manifest.json and BUILTIN_CHARACTERS
      const builtin = Rig.getCharacterManifest(id);
      assert(builtin, `${id}: missing in BUILTIN_CHARACTERS`);
      assert.deepStrictEqual(builtin.motionProfile, diskManifest.motionProfile, `${id}: motionProfile drift`);
      assert.deepStrictEqual(builtin.pivots, diskManifest.pivots, `${id}: pivots drift`);
      if (diskManifest.battleReactions) {
        assert.deepStrictEqual(builtin.battleReactions, diskManifest.battleReactions, `${id}: battleReactions drift`);
      }

      // Mobile circular avatar eye framing invariant: eyes centered vertically inside [378, 420]
      assert(
        diskManifest.pivots.eyeLeft.y >= 378 && diskManifest.pivots.eyeLeft.y <= 420,
        `${id}: eyeLeft.y=${diskManifest.pivots.eyeLeft.y} outside mobile crop safe band [378, 420]`
      );
      assert(
        diskManifest.pivots.eyeRight.y >= 378 && diskManifest.pivots.eyeRight.y <= 420,
        `${id}: eyeRight.y=${diskManifest.pivots.eyeRight.y} outside mobile crop safe band [378, 420]`
      );

      // SVG synced & all 16 layers + referenced PNGs present
      const relSvgKey = `assets/characters/${id}/master_layered.svg`;
      assert(V.CHARACTER_SVG_SOURCES[relSvgKey], `${id}: missing from characterSvgRegistry.js`);
      const svgText = fs.readFileSync(svgPath, 'utf8');
      assert.strictEqual(V.CHARACTER_SVG_SOURCES[relSvgKey], svgText, `${id}: characterSvgRegistry.js out of sync with disk`);
      for (const layerId of diskManifest.requiredLayers) {
        assert(svgText.includes(`data-layer="${layerId}"`), `${id}: SVG missing layer ${layerId}`);
      }
      const hrefs = svgText.match(/href="(assets\/[^"]+)"/g) || [];
      assert(hrefs.length >= 13, `${id}: expected >= 13 PNG layer refs, found ${hrefs.length}`);
      let totalPngBytes = 0;
      const seenPngs = new Set();
      for (const h of hrefs) {
        const relPng = h.slice(6, -1);
        const absPng = path.join(ROOT, relPng);
        assert(fs.existsSync(absPng), `${id}: missing PNG layer ${relPng}`);
        if (!seenPngs.has(absPng)) {
          seenPngs.add(absPng);
          totalPngBytes += fs.statSync(absPng).size;
        }
      }
      const mb = totalPngBytes / (1024 * 1024);
      assert(mb <= 2.5, `${id}: layers/ PNG bundle ${mb.toFixed(2)} MB exceeds 2.5 MB production budget`);
    }
  });

  // 2. Centralized CharacterRegistry Validation & Discovery
  test('CharacterRegistry.validateRegistry() passes cleanly with 0 errors and discovers Lavoisier + Mendeleev pairs', () => {
    const report = Reg.validateRegistry();
    assert.strictEqual(report.valid, true, `validateRegistry failed: ${JSON.stringify(report.errors)}`);
    assert.strictEqual(report.missingCharacterIds.length, 0);
    assert.strictEqual(report.missingSvgSources.length, 0);
    assert.strictEqual(report.duplicateAliases.length, 0);
    assert.strictEqual(report.scientistPairCount, 2);
    assert.strictEqual(report.characterCount, 4);

    const pairs = Reg.listScientistPairs();
    assert.strictEqual(pairs.length, 2);
    assert.deepStrictEqual(pairs.map((p) => p.key), ['lavoisier', 'mendeleev']);
    assert.strictEqual(Reg.hasAnimatedCharacterForScientist('lavoisier'), true);
    assert.strictEqual(Reg.hasAnimatedCharacterForScientist('mendeleev'), true);
    assert.strictEqual(Reg.hasAnimatedCharacterForScientist('pauling_unregistered'), false);
  });

  // 3. Manifest Validation & Graceful Failure Diagnostics
  test('validateManifest(), registerCharacter(), and registerOpponentMapping() reject invalid manifests gracefully and detect duplicate IDs/aliases', () => {
    assert.strictEqual(Rig.registerCharacter(null, {}), null);
    assert.strictEqual(Rig.registerCharacter('invalid_empty', {}), null);

    const badFamily = Rig.validateManifest({
      characterId: 'bad_fam',
      aiFamily: 'ROGUE_AI',
      sourceAsset: 'assets/characters/bad_fam/master_layered.svg',
      pivots: Rig.getCharacterManifest('sci_lav_001_frontier').pivots,
      expressions: { neutral: {} },
    });
    assert.strictEqual(badFamily.valid, false);
    assert(badFamily.errors.some((e) => e.includes('Invalid aiFamily')));

    const badInstGlitch = Rig.validateManifest({
      characterId: 'bad_inst',
      aiFamily: 'INSTITUTE',
      sourceAsset: 'assets/characters/bad_inst/master_layered.svg',
      pivots: Rig.getCharacterManifest('sci_lav_001_institute').pivots,
      expressions: { neutral: {} },
      motionProfile: { allowReconstructionGlitch: true },
    });
    assert.strictEqual(badInstGlitch.valid, false);
    assert(badInstGlitch.errors.some((e) => e.includes('allowReconstructionGlitch')));

    const badEnums = Rig.validateManifest({
      characterId: 'bad_enum',
      aiFamily: 'FRONTIER',
      sourceAsset: 'assets/characters/bad_enum/master_layered.svg',
      pivots: Rig.getCharacterManifest('sci_men_002_frontier').pivots,
      expressions: { neutral: {} },
      motionProfile: {
        breathProfile: 'hyperventilate',
        gazePattern: 'spiral',
        speakingCadence: { jawSpeechScale: 15 },
      },
    });
    assert.strictEqual(badEnums.valid, false);
    assert(badEnums.errors.some((e) => e.includes('breathProfile')));
    assert(badEnums.errors.some((e) => e.includes('gazePattern')));
    assert(badEnums.errors.some((e) => e.includes('jawSpeechScale')));

    // Duplicate ID rejection when { rejectDuplicate: true }
    const existing = Rig.getCharacterManifest('sci_lav_001_frontier');
    const dupRes = Rig.registerCharacter('sci_lav_001_frontier', existing, { rejectDuplicate: true });
    assert.strictEqual(dupRes, null);
    const diags = Rig.getRegistrationDiagnostics();
    assert(diags.some((d) => d.type === 'duplicate_id' && d.characterId === 'sci_lav_001_frontier' && d.rejected === true));
    assert(diags.some((d) => d.type === 'invalid_manifest' && d.characterId === 'invalid_empty'));

    // Duplicate alias detection in CharacterRegistry (preserves original mapping unless { overwrite: true })
    Reg.registerOpponentMapping({
      encounterIds: ['enc_rogue_lavoisier'],
      characterId: 'sci_men_002_frontier',
    });
    assert(Reg.getAliasDiagnostics().some((d) => d.includes('enc_rogue_lavoisier')));
    assert.strictEqual(Reg.resolveCharacterId({ encounterId: 'enc_rogue_lavoisier' }), 'sci_lav_001_frontier');

    // Graceful missing-character mount
    const missingMount = Rig.mount(makeMockEl('div'), { characterId: 'sci_does_not_exist' });
    assert.strictEqual(missingMount, null);
  });

  // 4. Static Fallback Preservation
  test('Unregistered opponents and Classic AI preserve static fallback cleanly', () => {
    assert.strictEqual(Reg.resolveForBattleState(null), null);
    assert.strictEqual(Reg.resolveForBattleState({ mode: 'vs_ai', players: [{ name: 'You' }, { name: 'Dr. Mendeleev (AI)' }] }), null);
    assert.strictEqual(Reg.resolveForBattleState({ storyMissionId: 'ch0_m1_practice', players: [{}, { name: 'Training Drone' }] }), null);
    assert.strictEqual(Reg.resolveForBattleState({ encounterMeta: { encounterId: 'enc_unknown_999' }, players: [{}, {}] }), null);

    assert.strictEqual(Reg.resolveCharacterId({ storyMissionId: 'ch0_m2_lavoisier' }), 'sci_lav_001_institute');
    assert.strictEqual(Reg.resolveCharacterId({ storyMissionId: 'ch0_m3_mendeleev' }), 'sci_men_002_institute');
    assert.strictEqual(Reg.resolveCharacterId({ encounterId: 'enc_rogue_lavoisier' }), 'sci_lav_001_frontier');
    assert.strictEqual(Reg.resolveCharacterId({ encounterId: 'enc_rogue_mendeleev' }), 'sci_men_002_frontier');
  });

  // 5. Data-Driven Onboarding of Scientist #3 (Mock Linus Pauling) with ZERO Shared-Code Edits
  test('Data-driven onboarding of a 3rd Scientist auto-updates Studio discovery, alias routing, and manifest-driven battle reactions', () => {
    const baseFront = Rig.getCharacterManifest('sci_men_002_frontier');
    const baseInst = Rig.getCharacterManifest('sci_men_002_institute');
    const paulingFront = {
      characterId: 'sci_pau_003_frontier',
      displayName: 'Linus Pauling (Frontier Construct)',
      constructTitle: 'Frontier Construct: Linus Pauling',
      aiFamily: 'FRONTIER',
      generationStage: 'GEN_3_FRONTIER',
      renderer: 'svg_rig',
      sourceAsset: 'assets/characters/sci_pau_003_frontier/master_layered.svg',
      requiredLayers: baseFront.requiredLayers,
      pivots: baseFront.pivots,
      expressions: baseFront.expressions,
      motionProfile: Object.assign({}, Rig.DEFAULT_MOTION_PROFILE, {
        breathProfile: 'organic_wave',
        postureStyle: 'dwell_shift',
        gazePattern: 'saccade_center',
        blinkStyle: 'natural_asym',
        allowReconstructionGlitch: true,
        glitchStyle: 'gen1_right_drift',
      }),
      battleReactions: {
        playerHighSynthMinSP: 9,
        onPlayerHighSynth: 'explaining',
        onPlayerMidSynth: 'amused',
        onPlayerLowSynth: 'thoughtful',
        onUnexpectedReaction: 'amused',
        onOwnShield: 'explaining',
        onOwnHighSynth: 'amused',
        onOwnStandardSynth: 'explaining',
      },
    };
    const paulingInst = {
      characterId: 'sci_pau_003_institute',
      displayName: 'Linus Pauling (Institute Hologram)',
      constructTitle: 'Academy Archival Hologram: Linus Pauling',
      aiFamily: 'INSTITUTE',
      generationStage: 'INSTITUTE_HOLOGRAM',
      renderer: 'svg_rig',
      sourceAsset: 'assets/characters/sci_pau_003_institute/master_layered.svg',
      requiredLayers: baseInst.requiredLayers,
      pivots: baseInst.pivots,
      expressions: baseInst.expressions,
      motionProfile: Object.assign({}, Rig.DEFAULT_MOTION_PROFILE, {
        breathProfile: 'diaphragmatic_poise',
        allowReconstructionGlitch: false,
      }),
      battleReactions: {
        playerHighSynthMinSP: 12,
        onPlayerHighSynth: 'thoughtful',
        onPlayerMidSynth: 'thoughtful',
        onPlayerLowSynth: 'thoughtful',
        onUnexpectedReaction: 'explaining',
        onOwnShield: 'amused',
        onOwnHighSynth: 'amused',
        onOwnStandardSynth: 'explaining',
      },
    };

    const regResult = Reg.registerScientist({
      key: 'pauling',
      code: 'SCI-PAU-003',
      fullName: 'Linus Pauling',
      frontierId: 'sci_pau_003_frontier',
      instituteId: 'sci_pau_003_institute',
      frontierManifest: paulingFront,
      instituteManifest: paulingInst,
      encounterIds: ['enc_rogue_pauling'],
      opponentEntityIds: ['opp_entity_rogue_pauling'],
      storyMissionIds: ['ch0_m4_pauling'],
    }, { rejectDuplicate: true });
    assert.strictEqual(regResult.ok, true, `registerScientist failed: ${JSON.stringify(regResult.errors)}`);

    const pairs = Reg.listScientistPairs();
    assert.strictEqual(pairs.length, 3, 'Studio pair discovery should now automatically list 3 Scientists');
    assert(pairs.some((p) => p.key === 'pauling'));
    assert.strictEqual(Reg.hasAnimatedCharacterForScientist('pauling'), true);
    assert.strictEqual(Reg.resolveCharacterId({ encounterId: 'enc_rogue_pauling' }), 'sci_pau_003_frontier');
    assert.strictEqual(Reg.resolveCharacterId({ storyMissionId: 'ch0_m4_pauling' }), 'sci_pau_003_institute');
    assert.strictEqual(Reg.resolveCharacterId({ opponentEntityId: 'opp_entity_rogue_pauling' }), 'sci_pau_003_frontier');

    // Duplicate Scientist key rejected gracefully
    const dupSci = Reg.registerScientist({ key: 'pauling', fullName: 'Duplicate' });
    assert.strictEqual(dupSci.ok, false);

    // Manifest-driven battle reactions WITHOUT editing src/ui/app.js
    const rSynth = evaluateBattlePortraitReaction(
      [{ meta: { type: 'SYNTHESIZE', playerId: 0, sp: 10 } }],
      { now: 20000, aiFamily: 'FRONTIER', characterId: 'sci_pau_003_frontier', manifest: paulingFront, playerSP: 10, oppSP: 8, reactionState: {} }
    );
    assert.strictEqual(rSynth.action, 'react');
    assert.strictEqual(rSynth.expression, 'explaining', 'Pauling Frontier should use manifest battleReactions.onPlayerHighSynth');

    const rShield = evaluateBattlePortraitReaction(
      [{ meta: { type: 'SHIELD', playerId: 1 } }],
      { now: 35000, aiFamily: 'FRONTIER', characterId: 'sci_pau_003_frontier', manifest: paulingFront, playerSP: 10, oppSP: 12, reactionState: {} }
    );
    assert.strictEqual(rShield.action, 'react');
    assert.strictEqual(rShield.expression, 'explaining', 'Pauling Frontier should use manifest battleReactions.onOwnShield');
  });

  // 6. Concurrent SVG Fetch Deduplication
  let fetchCalls = 0;
  let resolveFetch;
  global.fetch = () => {
    fetchCalls += 1;
    return new Promise((res) => {
      resolveFetch = () => res({
        ok: true,
        text: () => Promise.resolve('<svg viewBox="0 0 896 1200"><g id="rig_torso"><g data-layer="layer_bg"></g></g></svg>'),
      });
    });
  };
  const c1 = makeMockEl('div');
  const c2 = makeMockEl('div');
  const r1 = Rig.mount(c1, { characterId: 'sci_pau_003_frontier' });
  const r2 = Rig.mount(c2, { characterId: 'sci_pau_003_frontier' });
  assert.strictEqual(fetchCalls, 1, 'Concurrent mounts of uncached SVG must deduplicate to 1 fetch() call');
  resolveFetch();
  await new Promise((r) => setTimeout(r, 15));
  assert(r1.getState().mountedSvg && r2.getState().mountedSvg, 'Both concurrent rigs must receive SVG after single fetch');
  r1.destroy();
  r2.destroy();
  passed += 1;
  console.log('  PASS: Concurrent SVG fetch deduplication via svgPending prevents duplicate network loads');

  // 7. Rapid Multi-Scientist Switching, Memory Teardown & Reduced/Off Modes
  test('Rapid switching across all 4 production portraits tears down cleanly with 0 leaked rigs, cleared DOM refs, and Reduced/Off freeze', () => {
    Rig.setAnimationMode('full');
    const sequence = [
      'sci_lav_001_frontier', 'sci_lav_001_institute',
      'sci_men_002_frontier', 'sci_men_002_institute',
      'sci_lav_001_frontier', 'sci_men_002_frontier',
      'sci_lav_001_institute', 'sci_men_002_institute',
    ];
    const beforeCancel = cancelRafCount;
    for (const id of sequence) {
      const host = makeMockEl('div');
      const rig = Rig.mount(host, { characterId: id, expression: 'neutral' });
      assert(rig && rig.getState().mountedSvg, `${id}: mount failed`);
      assert.strictEqual(rig.getState().layerCount, 16, `${id}: expected 16 SVG layers`);
      rig.setExpression('thoughtful');
      rig.setSpeaking(true);
      rig.destroy();
      assert.strictEqual(Object.keys(rig.parts).length, 0, `${id}: destroy() must clear rig.parts`);
      assert.strictEqual(rig.svgEl, null, `${id}: destroy() must null rig.svgEl`);
      assert.strictEqual(rig.container, null, `${id}: destroy() must null rig.container`);
    }
    assert.strictEqual(Rig.getActiveRigCount(), 0, 'Zero active rigs must remain after switching teardown');
    assert(cancelRafCount > beforeCancel, 'cancelAnimationFrame must be called when active rigs drop to 0');

    // Reduced & Off mode freeze verification across both Scientists
    const hostA = makeMockEl('div');
    const hostB = makeMockEl('div');
    Rig.mount(hostA, { characterId: 'sci_lav_001_frontier' });
    Rig.mount(hostB, { characterId: 'sci_men_002_frontier' });
    Rig.setAnimationMode('reduced');
    assert.strictEqual(Rig.isEffectivelyAnimated(), false);
    assert(hostA.classList.contains('rig-reduced'));
    assert(hostB.classList.contains('rig-reduced'));
    Rig.setAnimationMode('off');
    assert(hostA.classList.contains('rig-off'));
    assert(hostB.classList.contains('rig-off'));
    Rig.setAnimationMode('full');
    assert.strictEqual(Rig.isEffectivelyAnimated(), true);
    Rig.destroyAll();
    assert.strictEqual(Rig.getActiveRigCount(), 0);
  });

  if (process.exitCode) {
    console.error(`\nStage 3E.4 validation finished with failures (${passed} passed).`);
    process.exit(1);
  }
  console.log(`\nALL STAGE 3E.4 SCALABILITY VALIDATION TESTS PASSED (${passed} suites)!`);
}

runAsyncTests();

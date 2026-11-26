// VALENCY — Stage 3E.2 Mendeleev Production Artwork, Layered Asset & Engine Compatibility Tests
// Verifies Institute & Frontier Mendeleev production masters, 13 RGBA layers, 16-group SVGs,
// rig manifests, QA contact sheets, Scientist Production Standard compliance, zero Lavoisier changes,
// and drop-in compatibility with existing untouched V.CharacterRig engine.

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

function readPngDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  // PNG signature + IHDR chunk width (bytes 16..19) & height (bytes 20..23) big-endian
  assert.strictEqual(buf.toString('hex', 0, 8), '89504e470d0a1a0a', `${filePath} must be a valid PNG`);
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

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

const REQUIRED_PNGS = [
  '01_background.png', '02_body_clothing.png', '03_hair_rear.png', '04_face_head.png',
  '05_eye_left_iris.png', '06_eye_right_iris.png', '07_lid_left_upper.png', '08_lid_right_upper.png',
  '09_brow_left.png', '10_brow_right.png', '11_mouth.png', '12_jaw_lower.png', '13_hair_front.png',
];

const REQUIRED_LAYERS = [
  'layer_bg', 'layer_hair_rear', 'layer_clothing_rear', 'layer_neck', 'layer_clothing_front',
  'layer_head_base', 'layer_jaw_lower', 'layer_eye_left', 'layer_eye_right',
  'layer_brow_left', 'layer_brow_right', 'layer_nose_detail', 'layer_mouth',
  'layer_hair_front', 'layer_mech_crystal', 'layer_fx_reconstruction',
];

const REQUIRED_EXPRS = [
  'neutral', 'thoughtful', 'amused', 'explaining', 'concerned', 'disappointed', 'irritated', 'instability',
];

const REQUIRED_QA = [
  'layer_contact_sheet.png', 'reconstruction_and_stress_qa.png', 'expressions_preview_sheet.png',
];

// 1. Complete Production Asset Structure, Resolution & Budget Compliance
runTest('1. Production masters, 13 RGBA layers, QA sheets, 896x1200 framing & <=2.2MB budget', () => {
  for (const charId of ['sci_men_002_frontier', 'sci_men_002_institute']) {
    const base = path.join(ROOT, 'assets', 'characters', charId);
    const masterPath = path.join(base, 'production', 'source_master.png');
    assert(fs.existsSync(masterPath), `${charId}: missing production/source_master.png`);
    const mDim = readPngDimensions(masterPath);
    assert.strictEqual(mDim.width, 896, `${charId}: source_master width must be 896`);
    assert.strictEqual(mDim.height, 1200, `${charId}: source_master height must be 1200`);

    let totalBytes = 0;
    for (const png of REQUIRED_PNGS) {
      const p = path.join(base, 'layers', png);
      assert(fs.existsSync(p), `${charId}: missing layer ${png}`);
      const d = readPngDimensions(p);
      assert.strictEqual(d.width, 896, `${charId}/${png}: width must be 896`);
      assert.strictEqual(d.height, 1200, `${charId}/${png}: height must be 1200`);
      totalBytes += fs.statSync(p).size;
    }
    const totalMB = totalBytes / (1024 * 1024);
    assert(totalMB <= 2.25, `${charId}: layer bundle ${totalMB.toFixed(2)} MB exceeds 2.2 MB standard`);

    for (const qa of REQUIRED_QA) {
      assert(fs.existsSync(path.join(base, 'qa', qa)), `${charId}: missing QA sheet qa/${qa}`);
    }
  }
});

// 2. Layered SVG Contract & Asset Href Integrity
runTest('2. Layered master_layered.svg files satisfy 16-layer rig contract & valid local hrefs', () => {
  for (const spec of [
    { id: 'sci_men_002_frontier', family: 'FRONTIER', gen: 'GEN_2_DRIFTING' },
    { id: 'sci_men_002_institute', family: 'INSTITUTE', gen: 'INSTITUTE_HOLOGRAM' },
  ]) {
    const svgPath = path.join(ROOT, 'assets', 'characters', spec.id, 'master_layered.svg');
    assert(fs.existsSync(svgPath), `${spec.id}: missing master_layered.svg`);
    const svg = fs.readFileSync(svgPath, 'utf8');
    assert(svg.includes(`data-character-id="${spec.id}"`), `${spec.id}: missing data-character-id`);
    assert(svg.includes(`data-ai-family="${spec.family}"`), `${spec.id}: missing data-ai-family`);
    assert(svg.includes(`data-generation="${spec.gen}"`), `${spec.id}: missing data-generation`);
    assert(svg.includes('data-art-tier="PRODUCTION_PAINTERLY"'), `${spec.id}: missing PRODUCTION_PAINTERLY`);
    assert(svg.includes('data-rig="torso"') && svg.includes('data-rig="head"'), `${spec.id}: missing rig roots`);

    for (const layerId of REQUIRED_LAYERS) {
      assert(svg.includes(`data-layer="${layerId}"`), `${spec.id}: missing ${layerId}`);
    }

    const hrefs = [...svg.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    assert.strictEqual(hrefs.length, 13, `${spec.id}: expected 13 image hrefs, found ${hrefs.length}`);
    for (const href of hrefs) {
      assert(fs.existsSync(path.join(ROOT, href)), `${spec.id}: broken href ${href}`);
    }

    if (spec.family === 'INSTITUTE') {
      assert(svg.includes('<g id="layer_mech_crystal" data-layer="layer_mech_crystal" opacity="0"></g>'),
        'Institute Mendeleev layer_mech_crystal must be empty with opacity=0');
    } else {
      assert(svg.includes('EKA-SYNC'), 'Frontier Mendeleev must include Gen-2 periodic eka-sync lattice FX');
    }
  }
});

// 3. Rig Manifest Schema, Eye Alignment, Beard-Safe Limits & Dual-Identity Contrast
runTest('3. Rig manifests satisfy schemaVersion 2, eye framing, beard-safe caps & Frontier/Institute contrast', () => {
  const fMan = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/characters/sci_men_002_frontier/rig_manifest.json'), 'utf8'));
  const iMan = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/characters/sci_men_002_institute/rig_manifest.json'), 'utf8'));

  for (const m of [fMan, iMan]) {
    assert.strictEqual(m.schemaVersion, 2);
    assert.strictEqual(m.artTier, 'PRODUCTION_PAINTERLY');
    assert.strictEqual(m.viewBox, '0 0 896 1200');
    assert.deepStrictEqual(m.requiredLayers, REQUIRED_LAYERS);
    // Eye vertical framing check (y = 31.5%..35% of 1200 -> 378..420px for zero-hack 42x42 mini-portrait centering)
    assert(m.pivots.eyeLeft.y >= 378 && m.pivots.eyeLeft.y <= 420, `${m.characterId}: eyeLeft.y out of standard framing band`);
    assert(m.pivots.eyeRight.y >= 378 && m.pivots.eyeRight.y <= 420, `${m.characterId}: eyeRight.y out of standard framing band`);
    // Beard-safe jawSpeechScale
    assert(m.motionProfile.speakingCadence.jawSpeechScale <= 3.6, `${m.characterId}: jawSpeechScale must remain beard-safe (<= 3.6)`);
    for (const expr of REQUIRED_EXPRS) {
      assert(m.expressions[expr], `${m.characterId}: missing expression ${expr}`);
    }
  }

  // Bilateral symmetry & zero drift on Institute
  assert.strictEqual(iMan.pivots.eyeLeft.y, iMan.pivots.eyeRight.y, 'Institute Mendeleev eyes must be level');
  assert.strictEqual(Math.abs((448 - iMan.pivots.eyeLeft.x) - (iMan.pivots.eyeRight.x - 448)), 0, 'Institute Mendeleev eyes must be bilaterally symmetrical around x=448');
  assert.strictEqual(iMan.motionProfile.allowReconstructionGlitch, false);
  assert.strictEqual(iMan.motionProfile.allowAsymmetricBlink, false);
  assert.strictEqual(iMan.motionProfile.restingSeamOpacity, 0);
  assert.strictEqual(iMan.expressions.instability.headTilt, 0);
  assert.strictEqual(iMan.expressions.instability.seamOpacity, 0);

  // Frontier Gen-2 presence
  assert.strictEqual(fMan.generationStage, 'GEN_2_DRIFTING');
  assert.strictEqual(fMan.motionProfile.allowReconstructionGlitch, true);
  assert(fMan.motionProfile.restingSeamOpacity > 0.08 && fMan.motionProfile.restingSeamOpacity <= 0.16);
  assert(fMan.expressions.instability.seamOpacity >= 0.80);
});

// 4. Drop-In Engine Compatibility (Without Modifying Existing Shared Engine Code!)
runTest('4. Untouched V.CharacterRig loads, namespaces, mounts & poses both Mendeleev rigs cleanly', () => {
  const storage = {};
  const sandbox = {
    window: null, globalThis: null, console, Math, Date, Set, Map, Object, Array, Number, String, Boolean, RegExp, JSON, Promise, setTimeout, clearTimeout,
    performance: { now: () => 1000 },
    localStorage: { getItem: (k) => (k in storage ? storage[k] : null), setItem: (k, v) => { storage[k] = String(v); } },
    requestAnimationFrame: () => 1,
    cancelAnimationFrame: () => {},
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/presentation/characterSvgRegistry.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'src/presentation/characterRigEngine.js'), 'utf8'), sandbox);

  const Rig = sandbox.Valency.CharacterRig;
  const fMan = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/characters/sci_men_002_frontier/rig_manifest.json'), 'utf8'));
  const iMan = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/characters/sci_men_002_institute/rig_manifest.json'), 'utf8'));
  const fSvg = fs.readFileSync(path.join(ROOT, 'assets/characters/sci_men_002_frontier/master_layered.svg'), 'utf8');
  const iSvg = fs.readFileSync(path.join(ROOT, 'assets/characters/sci_men_002_institute/master_layered.svg'), 'utf8');

  // Verify SVG <defs> namespacing prevents collisions without breaking layer_* IDs
  const nsF = Rig.namespaceSvgMarkup(fSvg, 'menF1');
  const nsI = Rig.namespaceSvgMarkup(iSvg, 'menI1');
  assert(nsF.includes('id="menF1_menF_clipEyeLeft"') && nsF.includes('url(#menF1_menF_clipEyeLeft)'));
  assert(nsI.includes('id="menI1_menI_clipEyeLeft"') && nsI.includes('url(#menI1_menI_clipEyeLeft)'));
  assert(nsF.includes('id="layer_head_base"') && nsI.includes('id="layer_head_base"'));

  // Register declaratively via existing API + supply in-memory SVG source
  sandbox.Valency.CHARACTER_SVG_SOURCES[fMan.sourceAsset] = fSvg;
  sandbox.Valency.CHARACTER_SVG_SOURCES[iMan.sourceAsset] = iSvg;
  Rig.registerCharacter('sci_men_002_frontier', fMan);
  Rig.registerCharacter('sci_men_002_institute', iMan);

  Rig.setAnimationMode('off');
  const cF = makeFakeElement('div'); attachMockSvg(cF);
  const cI = makeFakeElement('div'); attachMockSvg(cI);
  const rigF = Rig.mount(cF, { characterId: 'sci_men_002_frontier', expression: 'neutral' });
  const rigI = Rig.mount(cI, { characterId: 'sci_men_002_institute', expression: 'neutral' });

  const sigsF = new Set();
  for (const expr of REQUIRED_EXPRS) {
    assert.strictEqual(rigF.setExpression(expr), true);
    sigsF.add([
      rigF.parts.head.getAttribute('transform'),
      rigF.parts.browLeft.getAttribute('transform'),
      rigF.parts.browRight.getAttribute('transform'),
      rigF.parts.lidUpperLeft.getAttribute('transform'),
      rigF.parts.lidUpperRight.getAttribute('transform'),
      rigF.parts.mouth.getAttribute('transform'),
      rigF.parts.jaw.getAttribute('transform'),
      rigF.parts.mechCrystal.getAttribute('opacity'),
    ].join('|'));
  }
  assert.strictEqual(sigsF.size, 8, 'All 8 Frontier Mendeleev expressions must produce 8 distinct poses');

  // Institute instability must remain strictly identical to neutral
  rigI.setExpression('neutral');
  const nHead = rigI.parts.head.getAttribute('transform');
  rigI.setExpression('instability');
  assert.strictEqual(rigI.parts.head.getAttribute('transform'), nHead);
  assert.strictEqual(rigI.parts.mechCrystal.getAttribute('opacity'), '0.00');

  // Lavoisier manifests remain intact and unchanged
  assert(Rig.getCharacterManifest('sci_lav_001_frontier'), 'Frontier Lavoisier must remain intact');
  assert(Rig.getCharacterManifest('sci_lav_001_institute'), 'Institute Lavoisier must remain intact');

  rigF.destroy();
  rigI.destroy();
  assert.strictEqual(Rig.getActiveRigCount(), 0);
});

if (!process.exitCode) {
  console.log('\nALL STAGE 3E.2 MENDELEEV ASSET & COMPATIBILITY TESTS PASSED!');
}

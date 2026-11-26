// VALENCY — Stage 3D.1 Visual Production Pipeline & Animated Character PoC Acceptance Tests
// Verifies:
// 1. All Stage 3D.1 documentation deliverables exist (Visual Design Bible, Production Standards, Tool Evaluation).
// 2. Unflattened 16-layer SVG master assets & JSON rig manifests for both Frontier Lavoisier (SCI-LAV-001)
//    and Institute Hologram (SCI-LAV-001-INST), plus Reference Sheet.
// 3. Rig Engine functionality (8 expressions, Frontier glitch/asymmetric blink vs Institute clean stability,
//    SVG <defs> ID namespacing, reduced/off animation persistence, config-only asset override).
// 4. Non-destructive integration (existing Academy/Classic portraits preserved untouched; Frontier Lavoisier
//    encounter wired cleanly without modifying battle rules; HTML/SW/mobile bundler wired).
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

const REQUIRED_16_LAYERS = [
  'layer_bg',
  'layer_hair_rear',
  'layer_clothing_rear',
  'layer_neck',
  'layer_clothing_front',
  'layer_head_base',
  'layer_jaw_lower',
  'layer_eye_left',
  'layer_eye_right',
  'layer_brow_left',
  'layer_brow_right',
  'layer_nose_detail',
  'layer_mouth',
  'layer_hair_front',
  'layer_mech_crystal',
  'layer_fx_reconstruction',
];

const REQUIRED_8_EXPRESSIONS = [
  'neutral',
  'thoughtful',
  'amused',
  'explaining',
  'concerned',
  'disappointed',
  'irritated',
  'instability',
];

// ===== 1. DOCUMENTATION DELIVERABLES =====
test('Documentation: Visual Design Bible, Production Standards, and Animation Tool Evaluation exist and cover required topics', () => {
  const bible = fs.readFileSync(path.join(ROOT, 'docs/VALENCY_VISUAL_DESIGN_BIBLE.md'), 'utf8');
  const stds = fs.readFileSync(path.join(ROOT, 'docs/CHARACTER_ASSET_PRODUCTION_STANDARDS.md'), 'utf8');
  const evalDoc = fs.readFileSync(path.join(ROOT, 'docs/ANIMATION_TECHNOLOGY_EVALUATION.md'), 'utf8');

  assert.ok(bible.includes('Institute AIs') && bible.includes('Frontier AIs'), 'Design Bible must define both AI visual families');
  assert.ok(bible.includes('Color Palettes') && bible.includes('Portrait Composition'), 'Design Bible missing core sections');
  assert.ok(stds.includes('16-Layer') && stds.includes('Hidden Under-Paint'), 'Standards must document 16-layer unflattened rules');
  assert.ok(evalDoc.includes('Live2D Cubism') && evalDoc.includes('Spine') && evalDoc.includes('Rive'), 'Tool evaluation must compare Live2D, Spine, and Rive');
});

// ===== 2. UNFLATTENED 16-LAYER ASSETS & RIG MANIFESTS =====
test('Layered Character Assets: Frontier SCI-LAV-001 & Institute Hologram preserve all 16 unflattened layers, pivots, and 8 expressions', () => {
  const pairs = [
    {
      id: 'sci_lav_001_frontier',
      family: 'FRONTIER',
      svgPath: 'assets/characters/sci_lav_001_frontier/master_layered.svg',
      manifestPath: 'assets/characters/sci_lav_001_frontier/rig_manifest.json',
      expectGlitch: true,
      expectAsymBlink: true,
    },
    {
      id: 'sci_lav_001_institute',
      family: 'INSTITUTE',
      svgPath: 'assets/characters/sci_lav_001_institute/master_layered.svg',
      manifestPath: 'assets/characters/sci_lav_001_institute/rig_manifest.json',
      expectGlitch: false,
      expectAsymBlink: false,
    },
  ];

  for (const p of pairs) {
    const svg = fs.readFileSync(path.join(ROOT, p.svgPath), 'utf8');
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, p.manifestPath), 'utf8'));

    assert.strictEqual(manifest.characterId, p.id);
    assert.strictEqual(manifest.aiFamily, p.family);
    assert.strictEqual(manifest.motionProfile.allowReconstructionGlitch, p.expectGlitch);
    assert.strictEqual(manifest.motionProfile.allowAsymmetricBlink, p.expectAsymBlink);

    for (const lid of REQUIRED_16_LAYERS) {
      assert.ok(svg.includes(`data-layer="${lid}"`), `${p.id} SVG missing unflattened layer ${lid}`);
      assert.ok(manifest.requiredLayers.includes(lid), `${p.id} manifest missing requiredLayer ${lid}`);
    }
    for (const expr of REQUIRED_8_EXPRESSIONS) {
      assert.ok(manifest.expressions[expr], `${p.id} manifest missing expression ${expr}`);
    }
    // Check movable sub-parts inside eyes and mouth
    assert.ok(svg.includes('data-part="iris"') && svg.includes('data-part="lid_upper"') && svg.includes('data-part="mouth_cavity"'));
  }

  // Reference sheet exists for SCI-LAV-001
  const refSheet = fs.readFileSync(path.join(ROOT, 'assets/characters/sci_lav_001_frontier/reference_sheet.svg'), 'utf8');
  assert.ok(refSheet.includes('Front-Facing Reference') && refSheet.includes('Primary 3/4 Bust Pose'));
});

// ===== 3. CHARACTER RIG ENGINE RUNTIME & NAMESPACING & PERFORMANCE MODE =====
test('Character Rig Engine: SVG <defs> namespacing, reduced/off persistence, and config-only asset override', () => {
  const store = {};
  function makeSandbox() {
    const sb = {
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
      Promise,
      RegExp,
      localStorage: {
        getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
        setItem(k, v) { store[k] = String(v); },
      },
    };
    sb.window = sb;
    sb.globalThis = sb;
    vm.createContext(sb);
    for (const rel of ['src/presentation/visualTheme.js', 'src/presentation/characterRigEngine.js']) {
      vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sb, { filename: rel });
    }
    return sb.Valency;
  }

  const V1 = makeSandbox();
  assert.ok(V1.CharacterRig.getCharacterManifest('sci_lav_001_frontier'));
  assert.ok(V1.CharacterRig.getCharacterManifest('sci_lav_001_institute'));

  // Test SVG <defs> ID namespacing preserves layer_ IDs AND data-character-id while isolating gradient/clip IDs
  const sampleSvg = '<svg data-character-id="sci_lav_001_frontier"><defs><radialGradient id="lavF_bgGrad"></radialGradient></defs><g id="layer_bg" data-layer="layer_bg"><rect fill="url(#lavF_bgGrad)"/></g></svg>';
  const ns1 = V1.CharacterRig.namespaceSvgMarkup(sampleSvg, 'inst1');
  assert.ok(ns1.includes('id="inst1_lavF_bgGrad"') && ns1.includes('url(#inst1_lavF_bgGrad)'));
  assert.ok(ns1.includes('id="layer_bg"'), 'Semantic layer_ IDs must remain intact');
  assert.ok(ns1.includes('data-character-id="sci_lav_001_frontier"'), 'data-character-id attribute must remain intact');

  // Test animation mode persistence across reload
  assert.strictEqual(V1.CharacterRig.getAnimationMode(), 'full');
  V1.CharacterRig.setAnimationMode('reduced');
  assert.strictEqual(V1.CharacterRig.isEffectivelyAnimated(), false);

  const V2 = makeSandbox();
  assert.strictEqual(V2.CharacterRig.getAnimationMode(), 'reduced', 'Portrait animation preference must persist across reload');
  V2.CharacterRig.setAnimationMode('full');
  assert.strictEqual(V2.CharacterRig.isEffectivelyAnimated(), true);

  // Test independent asset replacement via V.Visual.setAssetOverride
  assert.strictEqual(
    V2.Visual.resolveAsset('characters', 'sci_lav_001_frontier').path,
    'assets/characters/sci_lav_001_frontier/master_layered.svg'
  );
  V2.Visual.setAssetOverride('characters', 'sci_lav_001_frontier', 'assets/characters/custom_lavoisier.svg');
  assert.strictEqual(
    V2.Visual.resolveAsset('characters', 'sci_lav_001_frontier').path,
    'assets/characters/custom_lavoisier.svg'
  );
  V2.Visual.clearAssetOverrides();
});

// ===== 4. EXISTING ARTWORK PRESERVATION & WIRING =====
test('Integration & Preservation: existing portraits untouched; Lavoisier Frontier encounter, HTML, SW & mobile bundler wired', () => {
  // Existing 5 Academy/Classic SVG portraits remain intact
  for (const p of ['lavoisier.svg', 'mendeleev.svg', 'pauling.svg', 'curie.svg', 'proctor.svg']) {
    assert.strictEqual(fs.existsSync(path.join(ROOT, 'assets/portraits', p)), true, `Existing portrait missing: ${p}`);
  }

  const encJs = fs.readFileSync(path.join(ROOT, 'src/frontier/encounterManager.js'), 'utf8');
  assert.ok(encJs.includes("animatedPortraitId: 'sci_lav_001_frontier'"), 'enc_rogue_lavoisier must bind animatedPortraitId');
  assert.ok(encJs.includes('preBattleDialogue'), 'enc_rogue_lavoisier must define preBattleDialogue');

  for (const file of ['index.html', 'mobile.html']) {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.ok(html.includes('src/styles/character-portrait.css'), `${file} missing character-portrait.css`);
    assert.ok(html.includes('src/presentation/characterSvgRegistry.js'), `${file} missing characterSvgRegistry.js`);
    assert.ok(html.includes('src/presentation/characterRigEngine.js'), `${file} missing characterRigEngine.js`);
    assert.ok(html.includes('menu-btn-char-studio'), `${file} missing top-level Character Animation Studio button`);
  }

  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.ok(sw.includes('character-portrait.css') && sw.includes('characterSvgRegistry.js') && sw.includes('characterRigEngine.js') && sw.includes('sci_lav_001_frontier/master_layered.svg'));

  const appJs = fs.readFileSync(path.join(ROOT, 'src/ui/app.js'), 'utf8');
  assert.ok(appJs.includes('preModalVisualScene') && appJs.includes('restoreVisual'), 'app.js must snapshot and restore pre-modal visual scenes');
  assert.ok(appJs.includes('menu-btn-char-studio'), 'app.js must bind #menu-btn-char-studio');

  const frontierUiJs = fs.readFileSync(path.join(ROOT, 'src/ui/frontierUI.js'), 'utf8');
  assert.ok(frontierUiJs.includes('btn-poc-reset-idle') && frontierUiJs.includes('poc-active-expr-label') && frontierUiJs.includes('data-poc-motion'), 'Studio must expose Reset to Idle, Selected Expression indicator, and Full/Reduced/Off buttons');

  const bundler = fs.readFileSync(path.join(ROOT, 'scripts/build-mobile-bundle.js'), 'utf8');
  assert.ok(bundler.includes("'assets/characters'"), 'Mobile PWA bundler must copy assets/characters');
});

console.log(`\nSTAGE 3D.1 CHARACTER PIPELINE SUMMARY: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

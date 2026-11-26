// VALENCY — Stage 3C Modular Visual & Audio Architecture Acceptance Tests
// Verifies:
// 1. Visual Theme System (4 themes, 12 screen configs, zero broken asset manifest paths, config-only asset overrides).
// 2. Audio Manifest Preservation (existing menu/AI/tutorial/scientist audio untouched; unassigned Frontier scenes never silently reuse unrelated tracks).
// 3. Audio Manager Runtime (requestScene routing, crossfade config, independent music/SFX volume scaling, localStorage persistence, missing-file graceful fallback).
// 4. HTML & PWA Manifest Integration (index.html, mobile.html, sw.js, build-mobile-bundle.js).
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

function createMockEnv(storageBacking) {
  const body = { dataset: {} };
  const fakeAudioEls = {};
  const audioIds = [
    'bgm-menu',
    'bgm-vs_ai',
    'bgm-pass_and_play',
    'bgm-tutorial',
    'bgm-scientist-lavoisier',
    'bgm-scientist-mendeleev',
    'bgm-scientist-pauling',
    'bgm-scientist-curie',
    'bgm-scientist-proctor',
  ];
  for (const id of audioIds) {
    fakeAudioEls[id] = {
      id,
      paused: true,
      volume: 0.45,
      loop: true,
      src: '',
      playCount: 0,
      pauseCount: 0,
      failWith: null,
      load() {},
      play() {
        this.playCount += 1;
        if (this.failWith) {
          return Promise.reject(this.failWith);
        }
        this.paused = false;
        return Promise.resolve();
      },
      pause() {
        this.pauseCount += 1;
        this.paused = true;
      },
    };
  }

  const promptEl = {
    hidden: true,
    classList: {
      toggle(cls, force) {
        if (cls === 'hidden') promptEl.hidden = Boolean(force);
      },
    },
  };

  function FakeAudio() {
    this.paused = true;
    this.volume = 0.45;
    this.loop = true;
    this.src = '';
    this.load = function () {};
    this.play = function () {
      if (this.src && this.src.includes('missing')) {
        return Promise.reject(Object.assign(new Error('NotSupportedError'), { name: 'NotSupportedError' }));
      }
      this.paused = false;
      return Promise.resolve();
    };
    this.pause = function () {
      this.paused = true;
    };
  }

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
    Promise,
    setInterval,
    clearInterval,
    setTimeout,
    clearTimeout,
    Audio: FakeAudio,
    document: {
      body,
      getElementById(id) {
        if (id === 'menu-audio-prompt') return promptEl;
        return fakeAudioEls[id] || null;
      },
    },
    localStorage: {
      getItem(k) { return Object.prototype.hasOwnProperty.call(storageBacking, k) ? storageBacking[k] : null; },
      setItem(k, v) { storageBacking[k] = String(v); },
      removeItem(k) { delete storageBacking[k]; },
    },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  for (const rel of ['src/presentation/visualTheme.js', 'src/presentation/audioConfig.js', 'src/ui/sound.js']) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }
  return { sandbox, V: sandbox.Valency, fakeAudioEls, body, promptEl };
}

// ===== 1. VISUAL ARCHITECTURE & ASSET MANIFEST INTEGRITY =====
test('Visual Architecture: all EXISTING manifest assets exist on disk and unbuilt roadmap assets use null paths', () => {
  const { V } = createMockEnv({});
  const manifest = V.Visual.ASSET_MANIFEST;
  let existingCount = 0;
  let placeholderCount = 0;

  for (const [category, entries] of Object.entries(manifest)) {
    for (const [key, entry] of Object.entries(entries)) {
      if (entry.status === 'EXISTING') {
        existingCount += 1;
        assert.ok(entry.path && typeof entry.path === 'string', `${category}.${key} must define a path`);
        const full = path.join(ROOT, entry.path);
        assert.strictEqual(fs.existsSync(full), true, `Verified manifest asset missing on disk: ${entry.path}`);
      } else {
        placeholderCount += 1;
        assert.strictEqual(entry.path, null, `Non-existing asset ${category}.${key} must declare path: null`);
      }
    }
  }
  assert.ok(existingCount >= 26, `Expected >=26 existing assets (5 portraits + 18 events + 3 icons), got ${existingCount}`);
  assert.ok(placeholderCount >= 9, `Expected roadmap/procedural scene placeholders, got ${placeholderCount}`);
});

test('Visual Architecture: theme switching across academy, frontier, laboratory, collective & config-only asset override', () => {
  const { V, body } = createMockEnv({});
  assert.deepStrictEqual(Object.keys(V.Visual.VISUAL_THEMES).sort(), ['academy', 'collective', 'frontier', 'laboratory']);

  V.Visual.applyScene('main_menu');
  assert.strictEqual(body.dataset.visualTheme, 'academy');
  assert.strictEqual(body.dataset.visualScene, 'main_menu');

  V.Visual.applyScene('frontier_settlement');
  assert.strictEqual(body.dataset.visualTheme, 'laboratory');

  V.Visual.applyScene('frontier_expedition');
  assert.strictEqual(body.dataset.visualTheme, 'frontier');

  V.Visual.applyScene('collective_anomaly');
  assert.strictEqual(body.dataset.visualTheme, 'collective');

  // Config-only asset override replaces portrait without touching UI code
  const orig = V.Visual.resolveAsset('portraits', 'lavoisier');
  assert.strictEqual(orig.path, 'assets/portraits/lavoisier.svg');
  V.Visual.setAssetOverride('portraits', 'lavoisier', 'assets/portraits/lavoisier_v2.svg');
  const html = V.Visual.renderPortrait('lavoisier', 'story-char-img', 'Lavoisier');
  assert.ok(html.includes('assets/portraits/lavoisier_v2.svg'));
  V.Visual.clearAssetOverrides();
  assert.strictEqual(V.Visual.resolveAsset('portraits', 'lavoisier').path, 'assets/portraits/lavoisier.svg');
});

// ===== 2. AUDIO CONFIG PRESERVATION & NO SILENT UNRELATED REUSE =====
test('Audio Config: existing menu/AI/tutorial/scientist audio preserved verbatim; Frontier scenes are UNASSIGNED_FALLBACK', () => {
  const { V } = createMockEnv({});
  const AC = V.AudioConfig;

  const menuCfg = AC.getSceneConfig('menu');
  assert.strictEqual(menuCfg.sceneId, 'main_menu');
  assert.strictEqual(menuCfg.elementId, 'bgm-menu');
  assert.strictEqual(menuCfg.verifiedFile, 'assets/audio/menu-theme.wav');
  assert.strictEqual(fs.existsSync(path.join(ROOT, menuCfg.verifiedFile)), true);

  const aiCfg = AC.getSceneConfig('vs_ai');
  assert.strictEqual(aiCfg.sceneId, 'classic_ai');
  assert.strictEqual(aiCfg.elementId, 'bgm-vs_ai');
  assert.strictEqual(aiCfg.verifiedFile, 'assets/audio/ai-battle-theme.wav');
  assert.strictEqual(fs.existsSync(path.join(ROOT, aiCfg.verifiedFile)), true);

  const tutCfg = AC.getSceneConfig('tutorial');
  assert.strictEqual(tutCfg.elementId, 'bgm-tutorial');
  assert.strictEqual(tutCfg.verifiedFile, 'assets/audio/tutorial-theme.wav');
  assert.strictEqual(fs.existsSync(path.join(ROOT, tutCfg.verifiedFile)), true);

  // All 12 Frontier & Collective scenes must NOT silently reuse existing menu/AI/scientist tracks
  const frontierScenes = [
    'frontier_hub',
    'frontier_exploration',
    'frontier_settlement',
    'frontier_laboratory',
    'frontier_expedition',
    'frontier_encounter_standard',
    'frontier_encounter_elite',
    'frontier_encounter_rogue_scientist',
    'frontier_victory',
    'frontier_defeat',
    'frontier_anomaly_discovery',
    'collective_story',
  ];
  for (const sid of frontierScenes) {
    const c = AC.getSceneConfig(sid);
    assert.ok(c, `Missing audio config for ${sid}`);
    assert.strictEqual(c.status, 'UNASSIGNED_FALLBACK', `${sid} must be UNASSIGNED_FALLBACK`);
    assert.strictEqual(c.elementId, null, `${sid} must NOT silently bind an existing HTML audio element`);
    assert.strictEqual(c.synthTrackId, null, `${sid} must NOT silently bind an unrelated synth track`);
    assert.strictEqual(c.silentIfMissing, true, `${sid} must fail gracefully to silence when unassigned`);
    assert.ok(Array.isArray(c.alternateVariants) && Array.isArray(c.intensityLayers), `${sid} must expose future expansion slots`);
  }

  // Config-only scene track registration works without touching UI code
  AC.registerSceneTrack('frontier_hub', { customUrl: 'assets/audio/custom-frontier-hub.mp3', silentIfMissing: false });
  assert.strictEqual(AC.getSceneConfig('frontier_hub').customUrl, 'assets/audio/custom-frontier-hub.mp3');
  assert.strictEqual(AC.getSceneConfig('frontier_hub').status, 'CONFIG_OVERRIDE');
  AC.clearSceneOverrides();
  assert.strictEqual(AC.getSceneConfig('frontier_hub').status, 'UNASSIGNED_FALLBACK');
});

// ===== 3. AUDIO MANAGER SETTINGS PERSISTENCE & SCENE ROUTING =====
test('Audio Manager: independent music/SFX volume + mute + fade persist across reload and unassigned scenes transition cleanly', () => {
  const store = {};
  const env1 = createMockEnv(store);
  const S1 = env1.V.Sound;

  S1.setFadeDuration(0); // instant for deterministic sync verification
  S1.setMusicVolume(0.72);
  S1.setSfxVolume(0.35);
  S1.setSoundEnabled(false);

  // Start menu music -> plays #bgm-menu
  const rMenu = S1.requestScene('main_menu', { immediate: true });
  assert.strictEqual(rMenu.sceneId, 'main_menu');
  assert.strictEqual(env1.fakeAudioEls['bgm-menu'].paused, false);
  assert.strictEqual(env1.fakeAudioEls['bgm-menu'].playCount, 1);

  // Switch to academy_menu -> seamlessly continues #bgm-menu without restarting!
  const rAcad = S1.requestScene('academy_menu', { immediate: true });
  assert.strictEqual(rAcad.continued, true);
  assert.strictEqual(env1.fakeAudioEls['bgm-menu'].playCount, 1);

  // Transition to unassigned Frontier scene -> fades out/pauses menu music and stays cleanly silent (zero errors!)
  const rFront = S1.requestScene('frontier_settlement', { immediate: true });
  assert.strictEqual(rFront.state, 'SILENT_UNASSIGNED');
  assert.strictEqual(env1.fakeAudioEls['bgm-menu'].paused, true);

  // Missing custom file on an overridden Frontier scene fails gracefully without throwing
  env1.V.AudioConfig.registerSceneTrack('frontier_hub', { customUrl: 'assets/audio/missing-track.mp3', silentIfMissing: false });
  const rMissing = S1.requestScene('frontier_hub', { immediate: true });
  assert.strictEqual(rMissing.sceneId, 'frontier_hub');

  // Reload Audio Manager from the same localStorage -> settings MUST survive reload!
  const env2 = createMockEnv(store);
  const loaded = env2.V.Sound.getAudioSettings();
  assert.strictEqual(loaded.musicVolume, 0.72);
  assert.strictEqual(loaded.sfxVolume, 0.35);
  assert.strictEqual(loaded.soundEnabled, false);
  assert.strictEqual(loaded.musicEnabled, true);
  assert.strictEqual(loaded.fadeDurationMs, 0);
});

// ===== 4. HTML, SW & BUNDLER INTEGRATION CHECKS =====
test('HTML & Mobile PWA Integration: theme-tokens.css, visualTheme.js, audioConfig.js, and Audio Mixer controls wired everywhere', () => {
  const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const mob = fs.readFileSync(path.join(ROOT, 'mobile.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const bundler = fs.readFileSync(path.join(ROOT, 'scripts/build-mobile-bundle.js'), 'utf8');

  for (const [label, html] of [['index.html', idx], ['mobile.html', mob]]) {
    assert.ok(html.includes('src/styles/theme-tokens.css'), `${label} missing theme-tokens.css`);
    assert.ok(html.includes('src/presentation/visualTheme.js'), `${label} missing visualTheme.js`);
    assert.ok(html.includes('src/presentation/audioConfig.js'), `${label} missing audioConfig.js`);
    assert.ok(html.includes('menu-btn-audio-settings'), `${label} missing menu-btn-audio-settings`);
    assert.ok(html.includes('btn-audio-settings'), `${label} missing btn-audio-settings`);
    assert.ok(
      html.indexOf('src/presentation/audioConfig.js') < html.indexOf('src/ui/sound.js'),
      `${label} must load audioConfig.js before sound.js`
    );
  }
  assert.ok(sw.includes('./src/styles/theme-tokens.css'), 'sw.js missing theme-tokens.css');
  assert.ok(sw.includes('./src/presentation/visualTheme.js'), 'sw.js missing visualTheme.js');
  assert.ok(sw.includes('./src/presentation/audioConfig.js'), 'sw.js missing audioConfig.js');
  assert.ok(bundler.includes("'src/presentation'"), 'build-mobile-bundle.js missing src/presentation');
});

console.log(`\nSTAGE 3C PRESENTATION ACCEPTANCE SUMMARY: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

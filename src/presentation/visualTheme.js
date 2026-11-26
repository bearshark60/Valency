// VALENCY — Stage 3C Centralized Visual Theme, Asset Manifest & Reusable Component Layer
// Strictly decoupled from gameplay engines, collection, expedition, and progression modules.
// Enables changing themes, backgrounds, portraits, and card illustrations through configuration only.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const VISUAL_THEMES = Object.freeze({
    academy: Object.freeze({
      themeId: 'academy',
      label: 'Valency Academy',
      identity: 'Established scientific civilization — structured laboratories, institutional prestige, refined academic precision.',
      accentColor: '#38bdf8',
      secondaryAccent: '#5eead4',
    }),
    frontier: Object.freeze({
      themeId: 'frontier',
      label: 'The Elemental Frontier',
      identity: 'Science-fantasy exploration — crystalline formations, ancient structures, unfamiliar molecular anomalies.',
      accentColor: '#22d3ee',
      secondaryAccent: '#34d399',
    }),
    laboratory: Object.freeze({
      themeId: 'laboratory',
      label: 'Field Research Laboratory',
      identity: 'Experimental instruments, spectrographs, molecular displays, and controlled preparation benches.',
      accentColor: '#2dd4bf',
      secondaryAccent: '#60a5fa',
    }),
    collective: Object.freeze({
      themeId: 'collective',
      label: 'The Collective',
      identity: 'Geometric organization, repeating molecular patterns, unnatural symmetry, and calm intelligent control.',
      accentColor: '#a78bfa',
      secondaryAccent: '#818cf8',
    }),
  });

  /**
   * Screen-Level Visual Configuration Registry.
   * Associates each major screen/scene with a theme and optional replaceable scene art slot.
   */
  const SCREEN_CONFIGS = Object.freeze({
    main_menu: Object.freeze({ sceneId: 'main_menu', themeId: 'academy', backgroundAssetKey: 'bg_main_menu', label: 'Main Menu' }),
    classic_battle: Object.freeze({ sceneId: 'classic_battle', themeId: 'laboratory', backgroundAssetKey: 'bg_lab_table', label: 'Classic Battle' }),
    tutorial: Object.freeze({ sceneId: 'tutorial', themeId: 'laboratory', backgroundAssetKey: 'bg_lab_table', label: 'Interactive Tutorial' }),
    academy_hub: Object.freeze({ sceneId: 'academy_hub', themeId: 'academy', backgroundAssetKey: 'bg_academy_hub', label: 'Academy Licensure Hub' }),
    academy_exam: Object.freeze({ sceneId: 'academy_exam', themeId: 'academy', backgroundAssetKey: 'bg_academy_exam', label: 'Academy Examination' }),
    frontier_hub: Object.freeze({ sceneId: 'frontier_hub', themeId: 'frontier', backgroundAssetKey: 'bg_frontier_hub', label: 'Frontier Hub' }),
    frontier_region: Object.freeze({ sceneId: 'frontier_region', themeId: 'frontier', backgroundAssetKey: 'bg_region_caloric_basin', label: 'Regional Exploration' }),
    frontier_settlement: Object.freeze({ sceneId: 'frontier_settlement', themeId: 'laboratory', backgroundAssetKey: 'bg_loc_hearth_outpost', label: 'Settlement & Field Lab' }),
    frontier_laboratory: Object.freeze({ sceneId: 'frontier_laboratory', themeId: 'laboratory', backgroundAssetKey: 'bg_loc_archive_ruins', label: 'Research Laboratory' }),
    frontier_expedition: Object.freeze({ sceneId: 'frontier_expedition', themeId: 'frontier', backgroundAssetKey: 'bg_exp_caloric_crucible', label: 'Frontier Expedition' }),
    frontier_encounter: Object.freeze({ sceneId: 'frontier_encounter', themeId: 'frontier', backgroundAssetKey: 'bg_enc_rogue_lavoisier', label: 'Frontier Encounter' }),
    collective_anomaly: Object.freeze({ sceneId: 'collective_anomaly', themeId: 'collective', backgroundAssetKey: 'bg_collective_anomaly', label: 'Convergence Anomaly' }),
  });

  /**
   * Centralized Graphical Asset Manifest.
   * Only points to VERIFIED existing files on disk; unbuilt roadmap assets explicitly declare `path: null`
   * so no broken image references or guessed file paths ever exist.
   */
  const ASSET_MANIFEST = {
    portraits: {
      lavoisier: { path: 'assets/portraits/lavoisier.svg', status: 'EXISTING', label: 'Antoine Lavoisier' },
      mendeleev: { path: 'assets/portraits/mendeleev.svg', status: 'EXISTING', label: 'Dmitri Mendeleev' },
      pauling: { path: 'assets/portraits/pauling.svg', status: 'EXISTING', label: 'Linus Pauling' },
      curie: { path: 'assets/portraits/curie.svg', status: 'EXISTING', label: 'Marie Curie' },
      proctor: { path: 'assets/portraits/proctor.svg', status: 'EXISTING', label: 'Academy Proctor' },
    },
    events: {
      ACID_RAIN: { path: 'assets/events/acid_rain.svg', status: 'EXISTING' },
      BOND_CLEAVAGE: { path: 'assets/events/bond_cleavage.svg', status: 'EXISTING' },
      BUFFER_SOLUTION: { path: 'assets/events/buffer_solution.svg', status: 'EXISTING' },
      CATALYST: { path: 'assets/events/catalyst.svg', status: 'EXISTING' },
      CHAIN_REACTION: { path: 'assets/events/chain_reaction.svg', status: 'EXISTING' },
      DIFFUSION: { path: 'assets/events/diffusion.svg', status: 'EXISTING' },
      DISTILLATION: { path: 'assets/events/distillation.svg', status: 'EXISTING' },
      ELECTROLYSIS: { path: 'assets/events/electrolysis.svg', status: 'EXISTING' },
      EQUILIBRIUM_SHIFT: { path: 'assets/events/equilibrium_shift.svg', status: 'EXISTING' },
      EXOTHERMIC_SURGE: { path: 'assets/events/exothermic_surge.svg', status: 'EXISTING' },
      HALF_LIFE_DECAY: { path: 'assets/events/half_life_decay.svg', status: 'EXISTING' },
      IONIZATION_SURGE: { path: 'assets/events/ionization_surge.svg', status: 'EXISTING' },
      OXIDATION: { path: 'assets/events/oxidation.svg', status: 'EXISTING' },
      PRECIPITATION: { path: 'assets/events/precipitation.svg', status: 'EXISTING' },
      REACTION_DELAY: { path: 'assets/events/reaction_delay.svg', status: 'EXISTING' },
      RESONANCE_STABILIZER: { path: 'assets/events/resonance_stabilizer.svg', status: 'EXISTING' },
      SYNTHESIS_ACCELERATOR: { path: 'assets/events/synthesis_accelerator.svg', status: 'EXISTING' },
      THERMAL_ACTIVATION: { path: 'assets/events/thermal_activation.svg', status: 'EXISTING' },
    },
    icons: {
      app_180: { path: 'assets/icons/valency-icon-180.png', status: 'EXISTING' },
      app_192: { path: 'assets/icons/valency-icon-192.png', status: 'EXISTING' },
      app_512: { path: 'assets/icons/valency-icon-512.png', status: 'EXISTING' },
    },
    characters: {
      sci_lav_001_frontier: {
        path: 'assets/characters/sci_lav_001_frontier/master_layered.svg',
        manifestPath: 'assets/characters/sci_lav_001_frontier/rig_manifest.json',
        referenceSheet: 'assets/characters/sci_lav_001_frontier/reference_sheet.svg',
        status: 'EXISTING',
        aiFamily: 'FRONTIER',
        label: 'SCI-LAV-001 Frontier Construct: Antoine Lavoisier',
      },
      sci_lav_001_institute: {
        path: 'assets/characters/sci_lav_001_institute/master_layered.svg',
        manifestPath: 'assets/characters/sci_lav_001_institute/rig_manifest.json',
        status: 'EXISTING',
        aiFamily: 'INSTITUTE',
        label: 'SCI-LAV-001-INST Institute AI Hologram: Antoine Lavoisier',
      },
      sci_men_002_frontier: {
        path: 'assets/characters/sci_men_002_frontier/master_layered.svg',
        manifestPath: 'assets/characters/sci_men_002_frontier/rig_manifest.json',
        status: 'EXISTING',
        aiFamily: 'FRONTIER',
        label: 'SCI-MEN-002 Frontier Construct: Dmitri Mendeleev',
      },
      sci_men_002_institute: {
        path: 'assets/characters/sci_men_002_institute/master_layered.svg',
        manifestPath: 'assets/characters/sci_men_002_institute/rig_manifest.json',
        status: 'EXISTING',
        aiFamily: 'INSTITUTE',
        label: 'SCI-MEN-002-INST Institute AI Hologram: Dmitri Mendeleev',
      },
    },
    scenes: {
      bg_main_menu: { path: null, status: 'CSS_PROCEDURAL', note: 'Rendered via tokenized CSS lab glassware backdrop' },
      bg_lab_table: { path: null, status: 'CSS_PROCEDURAL', note: 'Rendered via tokenized epoxy bench grid' },
      bg_academy_hub: { path: null, status: 'ROADMAP_PLACEHOLDER', note: 'Future Academy architecture vista' },
      bg_academy_exam: { path: null, status: 'ROADMAP_PLACEHOLDER', note: 'Future Academy simulation chamber art' },
      bg_frontier_hub: { path: null, status: 'ROADMAP_PLACEHOLDER', note: 'Priority 1 visual asset: Frontier Hub background' },
      bg_region_caloric_basin: { path: null, status: 'ROADMAP_PLACEHOLDER', note: 'Priority 2 visual asset: Sector 01 regional map' },
      bg_loc_hearth_outpost: { path: null, status: 'ROADMAP_PLACEHOLDER', note: 'Priority 3 visual asset: Hearth Settlement art' },
      bg_loc_archive_ruins: { path: null, status: 'ROADMAP_PLACEHOLDER', note: 'Priority 4 visual asset: Relay Lab art' },
      bg_exp_caloric_crucible: { path: null, status: 'ROADMAP_PLACEHOLDER', note: 'Priority 5 visual asset: Expedition caldera art' },
      bg_enc_rogue_lavoisier: { path: null, status: 'ROADMAP_PLACEHOLDER', note: 'Priority 7 visual asset: Rogue Scientist encounter art' },
      bg_collective_anomaly: { path: null, status: 'ROADMAP_PLACEHOLDER', note: 'Priority 9 visual asset: Collective geometric symmetry FX' },
    },
  };

  // Runtime overrides allow replacing any portrait/event/character/scene asset purely through configuration
  const assetOverrides = { portraits: {}, events: {}, icons: {}, characters: {}, scenes: {} };
  let activeSceneId = 'main_menu';
  let activeThemeId = 'academy';

  function setAssetOverride(category, key, filePath) {
    if (!assetOverrides[category]) assetOverrides[category] = {};
    if (!filePath) {
      delete assetOverrides[category][key];
    } else {
      assetOverrides[category][key] = { path: filePath, status: 'OVERRIDE' };
    }
    return resolveAsset(category, key);
  }

  function clearAssetOverrides() {
    for (const k of Object.keys(assetOverrides)) assetOverrides[k] = {};
  }

  function resolveAsset(category, key) {
    if (assetOverrides[category] && assetOverrides[category][key]) {
      return assetOverrides[category][key];
    }
    if (ASSET_MANIFEST[category] && ASSET_MANIFEST[category][key]) {
      return ASSET_MANIFEST[category][key];
    }
    return { path: null, status: 'MISSING' };
  }

  function getScreenConfig(sceneId) {
    return SCREEN_CONFIGS[sceneId] || SCREEN_CONFIGS.main_menu;
  }

  function applyScene(sceneId) {
    const cfg = getScreenConfig(sceneId);
    activeSceneId = cfg.sceneId;
    activeThemeId = cfg.themeId;

    if (typeof document !== 'undefined' && document.body) {
      document.body.dataset.visualScene = cfg.sceneId;
      document.body.dataset.visualTheme = cfg.themeId;
    }
    return { sceneId: activeSceneId, themeId: activeThemeId, config: cfg };
  }

  function getActiveVisualState() {
    return {
      sceneId: activeSceneId,
      themeId: activeThemeId,
      theme: VISUAL_THEMES[activeThemeId] || VISUAL_THEMES.academy,
    };
  }

  // ===== STANDARDIZED REUSABLE UI COMPONENT HELPERS =====
  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderThemePill(themeId) {
    const theme = VISUAL_THEMES[themeId] || VISUAL_THEMES[activeThemeId] || VISUAL_THEMES.academy;
    return `<span class="v-theme-pill">${esc(theme.label)}</span>`;
  }

  function renderResourcePill(icon, label, value) {
    return `<span class="v-resource-pill">${icon} <span>${esc(label)}:</span> <strong>${esc(value)}</strong></span>`;
  }

  function renderPortrait(portraitKey, cssClass, altText) {
    const resolved = resolveAsset('portraits', portraitKey);
    if (resolved && resolved.path) {
      return `<img src="${esc(resolved.path)}" alt="${esc(altText || portraitKey)}" class="${esc(cssClass || 'story-char-img')}" />`;
    }
    if (V.renderPortraitSVG) {
      return V.renderPortraitSVG(portraitKey, cssClass || 'story-row-avatar');
    }
    return '';
  }

  V.Visual = {
    VISUAL_THEMES,
    SCREEN_CONFIGS,
    ASSET_MANIFEST,
    getScreenConfig,
    applyScene,
    getActiveVisualState,
    setAssetOverride,
    clearAssetOverrides,
    resolveAsset,
    renderThemePill,
    renderResourcePill,
    renderPortrait,
  };
})(typeof window !== 'undefined' ? window : globalThis);

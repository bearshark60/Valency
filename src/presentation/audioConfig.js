// VALENCY — Stage 3C Centralized Modular Audio Configuration & Scene-to-Music Manifest
// Strictly preserves all existing menu, Classic AI, tutorial, and Scientist theme assignments.
// New Frontier scenes explicitly declare UNASSIGNED_FALLBACK (never silently reusing unrelated tracks).
// Supports drop-in files, runtime config overrides, and future multi-layer/motif expansion slots.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const LEGACY_MODE_ALIASES = Object.freeze({
    menu: 'main_menu',
    vs_ai: 'classic_ai',
  });

  function makeSceneEntry(spec) {
    return Object.assign(
      {
        sceneId: '',
        category: 'GENERAL',
        label: '',
        elementId: null,
        synthTrackId: null,
        status: 'UNASSIGNED_FALLBACK', // 'EXISTING_FILE' | 'PRESERVED_MENU_DEFAULT' | 'SYNTH_FALLBACK' | 'UNASSIGNED_FALLBACK' | 'CONFIG_OVERRIDE'
        verifiedFile: null,
        dropInBasename: null,
        customUrl: null,
        defaultVolume: 0.36,
        loop: true,
        silentIfMissing: false,
        // Future expansion hooks (no-op until authored)
        alternateVariants: [],
        intensityLayers: [],
        ambientLoop: null,
        motifId: null,
        note: '',
      },
      spec
    );
  }

  const SCENE_MUSIC_MANIFEST = {
    // ===== PRESERVED EXISTING SCENES (DO NOT ALTER EXISTING MENU/GAME ASSIGNMENTS) =====
    main_menu: makeSceneEntry({
      sceneId: 'main_menu',
      category: 'CORE_MENU',
      label: 'Main Menu',
      elementId: 'bgm-menu',
      synthTrackId: 'menu',
      status: 'EXISTING_FILE',
      verifiedFile: 'assets/audio/menu-theme.wav',
      dropInBasename: 'menu-theme',
      defaultVolume: 0.45,
      loop: true,
      note: 'Existing menu music preserved verbatim (assets/audio/menu-theme.wav).',
    }),

    academy_menu: makeSceneEntry({
      sceneId: 'academy_menu',
      category: 'ACADEMY',
      label: 'Academy Hub & Menus',
      elementId: 'bgm-menu',
      synthTrackId: 'menu',
      status: 'PRESERVED_MENU_DEFAULT',
      verifiedFile: 'assets/audio/menu-theme.wav',
      dropInBasename: 'academy-menu-theme',
      defaultVolume: 0.45,
      loop: true,
      note: 'Preserves existing menu music in Academy Hub until a dedicated academy-menu-theme is added.',
    }),

    academy_story: makeSceneEntry({
      sceneId: 'academy_story',
      category: 'ACADEMY',
      label: 'Academy Narrative & Briefings',
      elementId: null,
      synthTrackId: null,
      status: 'UNASSIGNED_FALLBACK',
      dropInBasename: 'academy-story-theme',
      defaultVolume: 0.36,
      loop: true,
      silentIfMissing: true,
      note: 'Reserved for dedicated Academy narrative scenes; does not silently reassign unrelated tracks.',
    }),

    classic_ai: makeSceneEntry({
      sceneId: 'classic_ai',
      category: 'CORE_BATTLE',
      label: 'Classic Match vs. AI',
      elementId: 'bgm-vs_ai',
      synthTrackId: 'vs_ai',
      status: 'EXISTING_FILE',
      verifiedFile: 'assets/audio/ai-battle-theme.wav',
      dropInBasename: 'ai-battle-theme',
      defaultVolume: 0.34,
      loop: true,
      note: 'Existing Classic AI battle music preserved verbatim (assets/audio/ai-battle-theme.wav).',
    }),

    pass_and_play: makeSceneEntry({
      sceneId: 'pass_and_play',
      category: 'CORE_BATTLE',
      label: '2-Player Pass & Play',
      elementId: 'bgm-pass_and_play',
      synthTrackId: 'pass_and_play',
      status: 'SYNTH_FALLBACK',
      dropInBasename: 'pvp-theme',
      defaultVolume: 0.34,
      loop: true,
      note: 'Uses built-in procedural lab rivalry synth unless assets/audio/pvp-theme.* is supplied.',
    }),

    tutorial: makeSceneEntry({
      sceneId: 'tutorial',
      category: 'CORE_TUTORIAL',
      label: 'Interactive Tutorial',
      elementId: 'bgm-tutorial',
      synthTrackId: 'tutorial',
      status: 'EXISTING_FILE',
      verifiedFile: 'assets/audio/tutorial-theme.wav',
      dropInBasename: 'tutorial-theme',
      defaultVolume: 0.34,
      loop: true,
      note: 'Existing tutorial music preserved verbatim (assets/audio/tutorial-theme.wav).',
    }),

    // ===== PRESERVED ACADEMY SCIENTIST THEMES =====
    scientist_lavoisier: makeSceneEntry({
      sceneId: 'scientist_lavoisier',
      category: 'SCIENTIST_EXAM',
      label: 'Antoine Lavoisier — Conservation Theme',
      elementId: 'bgm-scientist-lavoisier',
      synthTrackId: 'scientist_lavoisier',
      status: 'SYNTH_FALLBACK',
      dropInBasename: 'lavoisier-theme',
      defaultVolume: 0.34,
      motifId: 'motif_lavoisier',
      note: 'Baroque harpsichord synth fallback; drop in assets/audio/lavoisier-theme.* to override.',
    }),

    scientist_mendeleev: makeSceneEntry({
      sceneId: 'scientist_mendeleev',
      category: 'SCIENTIST_EXAM',
      label: 'Dmitri Mendeleev — Periodic Law Theme',
      elementId: 'bgm-scientist-mendeleev',
      synthTrackId: 'scientist_mendeleev',
      status: 'SYNTH_FALLBACK',
      dropInBasename: 'mendeleev-theme',
      defaultVolume: 0.34,
      motifId: 'motif_mendeleev',
      note: 'Periodic octave waltz synth fallback; drop in assets/audio/mendeleev-theme.* to override.',
    }),

    scientist_pauling: makeSceneEntry({
      sceneId: 'scientist_pauling',
      category: 'SCIENTIST_EXAM',
      label: 'Linus Pauling — Electronegativity Theme',
      elementId: 'bgm-scientist-pauling',
      synthTrackId: 'scientist_pauling',
      status: 'SYNTH_FALLBACK',
      dropInBasename: 'pauling-theme',
      defaultVolume: 0.34,
      motifId: 'motif_pauling',
      note: 'Syncopated E-Dorian synth fallback; drop in assets/audio/pauling-theme.* to override.',
    }),

    scientist_curie: makeSceneEntry({
      sceneId: 'scientist_curie',
      category: 'SCIENTIST_EXAM',
      label: 'Marie Curie — Luminous Nocturne',
      elementId: 'bgm-scientist-curie',
      synthTrackId: 'scientist_curie',
      status: 'SYNTH_FALLBACK',
      dropInBasename: 'curie-theme',
      defaultVolume: 0.34,
      motifId: 'motif_curie',
      note: 'Crystalline glass-bell synth fallback; drop in assets/audio/curie-theme.* to override.',
    }),

    scientist_proctor: makeSceneEntry({
      sceneId: 'scientist_proctor',
      category: 'SCIENTIST_EXAM',
      label: 'Final Examination — The Licensure Trial',
      elementId: 'bgm-scientist-proctor',
      synthTrackId: 'scientist_proctor',
      status: 'SYNTH_FALLBACK',
      dropInBasename: 'final-exam-theme',
      defaultVolume: 0.34,
      motifId: 'motif_academy_proctor',
      note: 'Stately C-minor exam synth fallback; drop in assets/audio/final-exam-theme.* to override.',
    }),

    // ===== NEW ELEMENTAL FRONTIER SCENES (UNASSIGNED_FALLBACK — NO SILENT UNRELATED REUSE) =====
    frontier_hub: makeSceneEntry({
      sceneId: 'frontier_hub',
      category: 'FRONTIER',
      label: 'Frontier Hub',
      dropInBasename: 'frontier-hub-theme',
      defaultVolume: 0.38,
      silentIfMissing: true,
      note: 'Priority 1 new audio track: expansive science-fantasy Frontier Hub theme.',
    }),

    frontier_exploration: makeSceneEntry({
      sceneId: 'frontier_exploration',
      category: 'FRONTIER',
      label: 'Frontier Regional Exploration',
      dropInBasename: 'frontier-exploration-theme',
      defaultVolume: 0.36,
      silentIfMissing: true,
      ambientLoop: null,
      note: 'Priority 2 new audio track: Sector 01 regional exploration.',
    }),

    frontier_settlement: makeSceneEntry({
      sceneId: 'frontier_settlement',
      category: 'FRONTIER',
      label: 'Settlement & Safe Zone (Hearth Outpost)',
      dropInBasename: 'frontier-settlement-theme',
      defaultVolume: 0.36,
      silentIfMissing: true,
      note: 'Priority 3 new audio track: calm restorative Hearth Outpost settlement theme.',
    }),

    frontier_laboratory: makeSceneEntry({
      sceneId: 'frontier_laboratory',
      category: 'FRONTIER',
      label: 'Field Research Laboratory & Deck Preparation',
      dropInBasename: 'frontier-laboratory-theme',
      defaultVolume: 0.34,
      silentIfMissing: true,
      note: 'Priority 4 new audio track: thoughtful deckbuilding & Scientist lab theme.',
    }),

    frontier_expedition: makeSceneEntry({
      sceneId: 'frontier_expedition',
      category: 'FRONTIER',
      label: 'Frontier Expedition Progression',
      dropInBasename: 'frontier-expedition-theme',
      defaultVolume: 0.36,
      silentIfMissing: true,
      intensityLayers: [],
      note: 'Priority 5 new audio track: high-tension branching expedition progression.',
    }),

    frontier_encounter_standard: makeSceneEntry({
      sceneId: 'frontier_encounter_standard',
      category: 'FRONTIER_BATTLE',
      label: 'Standard Frontier Battle',
      dropInBasename: 'frontier-encounter-standard-theme',
      defaultVolume: 0.34,
      silentIfMissing: true,
      intensityLayers: [],
      note: 'Priority 6 new audio track: standard Frontier molecular encounter.',
    }),

    frontier_encounter_elite: makeSceneEntry({
      sceneId: 'frontier_encounter_elite',
      category: 'FRONTIER_BATTLE',
      label: 'Elite Frontier Encounter',
      dropInBasename: 'frontier-encounter-elite-theme',
      defaultVolume: 0.36,
      silentIfMissing: true,
      intensityLayers: [],
      note: 'Reserved for future elite Frontier guardians.',
    }),

    frontier_encounter_rogue_scientist: makeSceneEntry({
      sceneId: 'frontier_encounter_rogue_scientist',
      category: 'FRONTIER_BATTLE',
      label: 'Rogue Scientist Encounter',
      dropInBasename: 'frontier-rogue-scientist-theme',
      defaultVolume: 0.36,
      silentIfMissing: true,
      motifId: 'motif_rogue_construct',
      note: 'Priority 7 new audio track: Rogue Scientist Construct boss encounter.',
    }),

    frontier_victory: makeSceneEntry({
      sceneId: 'frontier_victory',
      category: 'FRONTIER_STINGER',
      label: 'Frontier Victory Stinger',
      dropInBasename: 'frontier-victory-stinger',
      defaultVolume: 0.42,
      loop: false,
      silentIfMissing: true,
      note: 'Priority 9 new audio track: short orchestral/electronic victory cue.',
    }),

    frontier_defeat: makeSceneEntry({
      sceneId: 'frontier_defeat',
      category: 'FRONTIER_STINGER',
      label: 'Frontier Defeat / Expedition Failure Stinger',
      dropInBasename: 'frontier-defeat-stinger',
      defaultVolume: 0.40,
      loop: false,
      silentIfMissing: true,
      note: 'Priority 9 new audio track: somber withdrawal/failure cue.',
    }),

    frontier_anomaly_discovery: makeSceneEntry({
      sceneId: 'frontier_anomaly_discovery',
      category: 'FRONTIER_STORY',
      label: 'Anomaly Discovery & Investigation',
      dropInBasename: 'frontier-anomaly-theme',
      defaultVolume: 0.35,
      silentIfMissing: true,
      note: 'Priority 8 new audio track: mysterious molecular anomaly discovery.',
    }),

    collective_story: makeSceneEntry({
      sceneId: 'collective_story',
      category: 'COLLECTIVE',
      label: 'Collective Story & Convergence Mystery',
      dropInBasename: 'collective-theme',
      defaultVolume: 0.35,
      silentIfMissing: true,
      motifId: 'motif_collective',
      note: 'Priority 8 new audio track: geometric, cool, intelligent Collective theme.',
    }),
  };

  const UNASSIGNED_DISK_ASSETS = Object.freeze({
    lightning_sfx: Object.freeze({
      path: 'assets/audio/lightning.wav',
      status: 'UNASSIGNED_ON_DISK',
      note: 'Verified file on disk; preserved intact without silent reassignment.',
    }),
  });

  const sceneOverrides = {};

  function resolveSceneId(sceneOrMode) {
    if (!sceneOrMode) return null;
    return LEGACY_MODE_ALIASES[sceneOrMode] || sceneOrMode;
  }

  function getSceneConfig(sceneOrMode) {
    const id = resolveSceneId(sceneOrMode);
    if (!id) return null;
    const base = SCENE_MUSIC_MANIFEST[id];
    const patch = sceneOverrides[id];
    if (!base && !patch) return null;
    return Object.assign({}, base || makeSceneEntry({ sceneId: id }), patch || {});
  }

  function listSceneConfigs(categoryFilter) {
    const ids = new Set([...Object.keys(SCENE_MUSIC_MANIFEST), ...Object.keys(sceneOverrides)]);
    const out = [];
    for (const id of ids) {
      const cfg = getSceneConfig(id);
      if (!categoryFilter || cfg.category === categoryFilter) out.push(cfg);
    }
    return out;
  }

  /**
   * Register or override any scene's music track strictly through configuration
   * without touching gameplay, expedition, or UI logic.
   */
  function registerSceneTrack(sceneOrMode, patch) {
    const id = resolveSceneId(sceneOrMode);
    if (!id || !patch || typeof patch !== 'object') return null;
    sceneOverrides[id] = Object.assign({}, sceneOverrides[id] || {}, patch, {
      sceneId: id,
      status: patch.status || (patch.customUrl ? 'CONFIG_OVERRIDE' : (SCENE_MUSIC_MANIFEST[id] ? SCENE_MUSIC_MANIFEST[id].status : 'CONFIG_OVERRIDE')),
    });
    return getSceneConfig(id);
  }

  function clearSceneOverrides() {
    for (const k of Object.keys(sceneOverrides)) delete sceneOverrides[k];
  }

  V.AudioConfig = {
    LEGACY_MODE_ALIASES,
    SCENE_MUSIC_MANIFEST,
    UNASSIGNED_DISK_ASSETS,
    resolveSceneId,
    getSceneConfig,
    listSceneConfigs,
    registerSceneTrack,
    clearSceneOverrides,
  };
})(typeof window !== 'undefined' ? window : globalThis);

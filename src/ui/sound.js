// VALENCY — Centralized Modular Audio Manager & Web Audio SFX Engine (Stage 3C)
// Preserves all existing menu, Classic AI, Tutorial, and Scientist soundtracks untouched.
// Adds scene-based music routing via V.AudioConfig, smooth configurable crossfades,
// independent Music/SFX volume sliders, localStorage persistence, and graceful missing-file handling.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const AUDIO_SETTINGS_KEY = 'valency_audio_settings_v1';
  const DEFAULT_SETTINGS = Object.freeze({
    musicEnabled: true,
    soundEnabled: true,
    musicVolume: 0.45,   // 0.0 – 1.0 (0.45 matches legacy menu volume baseline)
    sfxVolume: 0.85,     // 0.0 – 1.0
    fadeDurationMs: 350, // Smooth crossfade duration in ms
  });

  let audioCtx = null;
  let noiseBuffer = null;
  let soundEnabled = DEFAULT_SETTINGS.soundEnabled;
  let musicEnabled = DEFAULT_SETTINGS.musicEnabled;
  let musicVolume = DEFAULT_SETTINGS.musicVolume;
  let sfxVolume = DEFAULT_SETTINGS.sfxVolume;
  let fadeDurationMs = DEFAULT_SETTINGS.fadeDurationMs;

  let currentMusicMode = null;  // Preserves requested scene/mode identifier
  let activeSceneId = null;     // Canonical sceneId from V.AudioConfig
  let activePlaybackState = 'IDLE'; // 'IDLE' | 'HTML_AUDIO' | 'SYNTH' | 'SILENT_UNASSIGNED' | 'AUTOPLAY_BLOCKED' | 'MUTED'
  let activeAudioEl = null;
  let dynamicAudioPool = {};    // sceneId -> HTMLAudioElement for runtime config/customUrl tracks
  let synthMusicTimer = null;
  let synthStep = 0;
  let userGestureSeen = false;

  const BGM_ELEMENT_IDS = {
    menu: 'bgm-menu',
    main_menu: 'bgm-menu',
    academy_menu: 'bgm-menu',
    vs_ai: 'bgm-vs_ai',
    classic_ai: 'bgm-vs_ai',
    pass_and_play: 'bgm-pass_and_play',
    tutorial: 'bgm-tutorial',
    scientist_lavoisier: 'bgm-scientist-lavoisier',
    scientist_mendeleev: 'bgm-scientist-mendeleev',
    scientist_pauling: 'bgm-scientist-pauling',
    scientist_curie: 'bgm-scientist-curie',
    scientist_proctor: 'bgm-scientist-proctor',
  };

  function clamp(val, min, max, fallback) {
    const n = Number(val);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function getStorage() {
    try {
      return global.localStorage || null;
    } catch (_) {
      return null;
    }
  }

  function loadAudioSettings() {
    const store = getStorage();
    if (!store) return getAudioSettings();
    try {
      const raw = store.getItem(AUDIO_SETTINGS_KEY);
      if (!raw) return getAudioSettings();
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.musicEnabled === 'boolean') musicEnabled = parsed.musicEnabled;
        if (typeof parsed.soundEnabled === 'boolean') soundEnabled = parsed.soundEnabled;
        if (parsed.musicVolume !== undefined) musicVolume = clamp(parsed.musicVolume, 0, 1, DEFAULT_SETTINGS.musicVolume);
        if (parsed.sfxVolume !== undefined) sfxVolume = clamp(parsed.sfxVolume, 0, 1, DEFAULT_SETTINGS.sfxVolume);
        if (parsed.fadeDurationMs !== undefined) fadeDurationMs = Math.round(clamp(parsed.fadeDurationMs, 0, 2000, DEFAULT_SETTINGS.fadeDurationMs));
      }
    } catch (_) {
      // Ignore corrupt storage gracefully
    }
    return getAudioSettings();
  }

  function saveAudioSettings() {
    const snapshot = getAudioSettings();
    const store = getStorage();
    if (store) {
      try {
        store.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(snapshot));
      } catch (_) {
        // Ignore storage quota / private-mode errors
      }
    }
    return snapshot;
  }

  function getAudioSettings() {
    return {
      musicEnabled,
      soundEnabled,
      musicVolume,
      sfxVolume,
      fadeDurationMs,
    };
  }

  function resolveSceneId(modeOrScene) {
    if (!modeOrScene) return null;
    if (V.AudioConfig && typeof V.AudioConfig.resolveSceneId === 'function') {
      return V.AudioConfig.resolveSceneId(modeOrScene);
    }
    if (modeOrScene === 'menu') return 'main_menu';
    if (modeOrScene === 'vs_ai') return 'classic_ai';
    return modeOrScene;
  }

  function getSceneConfig(modeOrScene) {
    const canonical = resolveSceneId(modeOrScene);
    if (!canonical) return null;
    if (V.AudioConfig && typeof V.AudioConfig.getSceneConfig === 'function') {
      return V.AudioConfig.getSceneConfig(canonical);
    }
    return {
      sceneId: canonical,
      elementId: BGM_ELEMENT_IDS[canonical] || null,
      synthTrackId: SYNTH_TRACKS[modeOrScene] ? modeOrScene : (SYNTH_TRACKS[canonical] ? canonical : null),
      defaultVolume: canonical === 'main_menu' ? 0.45 : 0.34,
      loop: true,
      silentIfMissing: false,
    };
  }

  function computeTargetElVolume(cfg) {
    const baseDefault = cfg && typeof cfg.defaultVolume === 'number' ? cfg.defaultVolume : 0.45;
    const relativeScale = baseDefault / 0.45;
    return clamp(musicVolume * relativeScale, 0, 1, 0.45);
  }

  function getMusicEl(modeOrScene) {
    if (typeof document === 'undefined') return null;
    const cfg = getSceneConfig(modeOrScene || currentMusicMode || 'main_menu');
    if (cfg && cfg.customUrl) {
      let dyn = dynamicAudioPool[cfg.sceneId];
      if (!dyn && typeof global.Audio === 'function') {
        dyn = new global.Audio();
        dynamicAudioPool[cfg.sceneId] = dyn;
      }
      if (dyn) {
        if (dyn.src !== cfg.customUrl) {
          dyn.src = cfg.customUrl;
          if (typeof dyn.load === 'function') dyn.load();
        }
        dyn.loop = cfg.loop !== false;
        return dyn;
      }
    }
    const id = (cfg && cfg.elementId) || BGM_ELEMENT_IDS[modeOrScene || currentMusicMode || 'main_menu'];
    return id ? document.getElementById(id) : null;
  }

  function setAudioPromptVisible(visible) {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('menu-audio-prompt');
    if (el) el.classList.toggle('hidden', !visible);
  }

  function clearElementFade(el) {
    if (el && el._valencyFadeTimer) {
      clearInterval(el._valencyFadeTimer);
      el._valencyFadeTimer = null;
    }
  }

  function fadeOutAndPause(el, durationMs) {
    if (!el) return;
    clearElementFade(el);
    const dur = durationMs !== undefined ? durationMs : fadeDurationMs;
    if (el.paused || dur <= 0) {
      try {
        el.pause();
      } catch (_) {}
      return;
    }
    const startVol = typeof el.volume === 'number' ? el.volume : 0.42;
    const steps = Math.max(4, Math.min(16, Math.round(dur / 30)));
    const stepMs = Math.max(15, Math.round(dur / steps));
    let tick = 0;
    el._valencyFadeTimer = setInterval(() => {
      tick++;
      el.volume = Math.max(0, startVol * (1 - tick / steps));
      if (tick >= steps) {
        clearElementFade(el);
        if (el !== activeAudioEl) {
          try {
            el.pause();
          } catch (_) {}
        }
      }
    }, stepMs);
  }

  function fadeInAudio(el, targetVol, durationMs) {
    if (!el) return;
    clearElementFade(el);
    const dur = durationMs !== undefined ? durationMs : fadeDurationMs;
    const goal = clamp(targetVol, 0, 1, 0.45);
    if (dur <= 0 || goal <= 0.001) {
      el.volume = goal;
      return;
    }
    el.volume = 0;
    const steps = Math.max(4, Math.min(16, Math.round(dur / 30)));
    const stepMs = Math.max(15, Math.round(dur / steps));
    let tick = 0;
    el._valencyFadeTimer = setInterval(() => {
      tick++;
      if (el !== activeAudioEl || !musicEnabled) {
        clearElementFade(el);
        return;
      }
      el.volume = Math.min(goal, goal * (tick / steps));
      if (tick >= steps) {
        el.volume = goal;
        clearElementFade(el);
      }
    }, stepMs);
  }

  function stopSynthMusic() {
    if (synthMusicTimer) {
      clearInterval(synthMusicTimer);
      synthMusicTimer = null;
    }
  }

  function stopAllHtmlAudio(immediate, exceptEl) {
    const visited = new Set();
    const candidates = [];
    if (typeof document !== 'undefined') {
      for (const id of Object.values(BGM_ELEMENT_IDS)) {
        const el = document.getElementById(id);
        if (el && !visited.has(el)) {
          visited.add(el);
          candidates.push(el);
        }
      }
    }
    for (const el of Object.values(dynamicAudioPool)) {
      if (el && !visited.has(el)) {
        visited.add(el);
        candidates.push(el);
      }
    }
    for (const el of candidates) {
      if (el === exceptEl) continue;
      if (el.paused) continue;
      if (immediate) {
        clearElementFade(el);
        try {
          el.pause();
        } catch (_) {}
      } else {
        fadeOutAndPause(el, fadeDurationMs);
      }
    }
    if (!exceptEl) activeAudioEl = null;
  }

  // ===== PROCEDURAL MODE SOUNDTRACKS (Auto-fallback when no custom file is dropped in assets/audio/) =====
  const SYNTH_TRACKS = {
    // 1P vs. Dr. Mendeleev (AI): Focused tactical D-minor chemistry duel (116 BPM)
    vs_ai: {
      stepMs: 258,
      bass: [146.83, 0, 146.83, 130.81, 116.54, 0, 116.54, 130.81, 146.83, 0, 174.61, 164.81, 130.81, 0, 110.0, 130.81],
      arp:  [293.66, 349.23, 440.0, 523.25, 440.0, 349.23, 329.63, 293.66, 349.23, 440.0, 587.33, 523.25, 440.0, 392.0, 349.23, 329.63],
      bassType: 'triangle',
      arpType: 'sine',
      bassVol: 0.055,
      arpVol: 0.036,
      pulseHat: true,
    },
    // 2-Player Pass & Play: Upbeat playful C-major / pentatonic lab rivalry groove (124 BPM)
    pass_and_play: {
      stepMs: 242,
      bass: [130.81, 0, 164.81, 0, 196.0, 0, 164.81, 146.83, 174.61, 0, 196.0, 0, 146.83, 0, 196.0, 0],
      arp:  [523.25, 0, 659.25, 587.33, 523.25, 783.99, 659.25, 0, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 440.0, 0],
      bassType: 'triangle',
      arpType: 'triangle',
      bassVol: 0.052,
      arpVol: 0.038,
      pulseHat: true,
    },
    // Interactive Tutorial: Calm warm Fmaj7 / Cmaj9 study-lab ambient lo-fi (84 BPM)
    tutorial: {
      stepMs: 357,
      bass: [174.61, 0, 0, 0, 164.81, 0, 0, 0, 146.83, 0, 0, 0, 130.81, 0, 0, 0],
      arp:  [349.23, 440.0, 523.25, 659.25, 329.63, 392.0, 493.88, 587.33, 293.66, 349.23, 440.0, 523.25, 261.63, 329.63, 392.0, 493.88],
      bassType: 'sine',
      arpType: 'sine',
      bassVol: 0.05,
      arpVol: 0.032,
      pulseHat: false,
    },
    // Menu fallback if menu-theme.wav is ever removed
    menu: {
      stepMs: 320,
      bass: [130.81, 0, 0, 196.0, 146.83, 0, 0, 220.0],
      arp:  [261.63, 329.63, 392.0, 523.25, 293.66, 392.0, 493.88, 587.33],
      bassType: 'sine',
      arpType: 'triangle',
      bassVol: 0.045,
      arpVol: 0.028,
      pulseHat: false,
    },
    // Antoine Lavoisier: 18th-century Enlightenment Baroque harpsichord symmetry in D major (108 BPM)
    scientist_lavoisier: {
      stepMs: 278,
      bass: [146.83, 0, 220.0, 0, 196.0, 0, 146.83, 0, 164.81, 0, 220.0, 0, 146.83, 185.0, 220.0, 146.83],
      arp:  [587.33, 440.0, 369.99, 440.0, 587.33, 493.88, 392.0, 493.88, 659.25, 554.37, 440.0, 554.37, 587.33, 440.0, 369.99, 293.66],
      lead: [739.99, 0, 0, 587.33, 783.99, 0, 659.25, 0, 659.25, 0, 554.37, 0, 587.33, 0, 0, 0],
      bassType: 'triangle',
      arpType: 'sawtooth',
      leadType: 'triangle',
      bassVol: 0.048,
      arpVol: 0.024,
      leadVol: 0.028,
      pulseHat: false,
    },
    // Dmitri Mendeleev: Structured Russian-inspired periodic waltz/octave cadence in A minor (114 BPM)
    scientist_mendeleev: {
      stepMs: 263,
      bass: [110.0, 0, 164.81, 110.0, 0, 164.81, 146.83, 0, 220.0, 130.81, 0, 196.0, 123.47, 0, 164.81, 110.0],
      arp:  [440.0, 523.25, 659.25, 523.25, 440.0, 329.63, 587.33, 523.25, 440.0, 523.25, 392.0, 329.63, 493.88, 440.0, 329.63, 220.0],
      lead: [880.0, 0, 659.25, 0, 523.25, 0, 587.33, 0, 659.25, 0, 523.25, 0, 493.88, 0, 440.0, 0],
      bassType: 'triangle',
      arpType: 'triangle',
      leadType: 'sine',
      bassVol: 0.056,
      arpVol: 0.032,
      leadVol: 0.026,
      pulseHat: true,
    },
    // Linus Pauling: High-energy mid-century syncopated E-Dorian tactical pulse (128 BPM)
    scientist_pauling: {
      stepMs: 234,
      bass: [164.81, 164.81, 0, 196.0, 220.0, 0, 185.0, 164.81, 146.83, 146.83, 0, 164.81, 196.0, 0, 185.0, 146.83],
      arp:  [329.63, 493.88, 659.25, 587.33, 659.25, 739.99, 587.33, 493.88, 440.0, 587.33, 659.25, 587.33, 493.88, 440.0, 369.99, 329.63],
      lead: [659.25, 0, 739.99, 659.25, 0, 587.33, 493.88, 0, 587.33, 0, 659.25, 739.99, 880.0, 0, 739.99, 0],
      bassType: 'sawtooth',
      arpType: 'triangle',
      leadType: 'square',
      bassVol: 0.036,
      arpVol: 0.032,
      leadVol: 0.018,
      pulseHat: true,
    },
    // Marie Curie: Luminous crystalline F# minor nocturne with glass-bell overtones (96 BPM)
    scientist_curie: {
      stepMs: 312,
      bass: [185.0, 0, 0, 138.59, 146.83, 0, 0, 110.0, 123.47, 0, 0, 146.83, 138.59, 0, 164.81, 0],
      arp:  [369.99, 440.0, 554.37, 739.99, 587.33, 440.0, 369.99, 293.66, 493.88, 587.33, 739.99, 659.25, 554.37, 440.0, 369.99, 554.37],
      lead: [1108.73, 0, 0, 880.0, 0, 0, 739.99, 0, 987.77, 0, 0, 880.0, 739.99, 0, 659.25, 0],
      bassType: 'sine',
      arpType: 'sine',
      leadType: 'sine',
      bassVol: 0.052,
      arpVol: 0.032,
      leadVol: 0.024,
      pulseHat: false,
    },
    // Chapter 0 Final Examination (Academy Proctor): Dramatic stately C-minor licensure trial (120 BPM)
    scientist_proctor: {
      stepMs: 250,
      bass: [130.81, 0, 130.81, 155.56, 174.61, 0, 174.61, 146.83, 155.56, 0, 196.0, 0, 123.47, 146.83, 196.0, 130.81],
      arp:  [261.63, 311.13, 392.0, 523.25, 349.23, 415.3, 523.25, 622.25, 311.13, 392.0, 466.16, 622.25, 392.0, 493.88, 587.33, 523.25],
      lead: [523.25, 0, 622.25, 0, 698.46, 0, 622.25, 587.33, 523.25, 0, 466.16, 0, 493.88, 0, 523.25, 0],
      bassType: 'triangle',
      arpType: 'triangle',
      leadType: 'sawtooth',
      bassVol: 0.055,
      arpVol: 0.032,
      leadVol: 0.02,
      pulseHat: true,
    },
  };

  function startSynthMusic(synthTrackId, sceneSnapshot) {
    stopSynthMusic();
    if (!musicEnabled || musicVolume <= 0.001) return;
    const track = SYNTH_TRACKS[synthTrackId];
    if (!track) return;

    synthStep = 0;
    activePlaybackState = 'SYNTH';

    function playBeat() {
      if (!musicEnabled || activeSceneId !== sceneSnapshot) {
        stopSynthMusic();
        return;
      }
      if (musicVolume <= 0.001) return;
      const musicScale = musicVolume / 0.45;
      withReadyMusicCtx((ctx) => {
        const len = track.bass.length;
        const i = synthStep % len;
        synthStep++;

        const bFreq = track.bass[i];
        const aFreq = track.arp[i % track.arp.length];
        const lFreq = track.lead ? track.lead[i % track.lead.length] : 0;
        const dur = (track.stepMs / 1000) * 0.92;

        if (bFreq > 0) {
          rawTone(ctx, bFreq, bFreq, dur * 1.35, track.bassType, track.bassVol * musicScale, 0);
        }
        if (aFreq > 0) {
          rawTone(ctx, aFreq, aFreq, dur * 0.85, track.arpType, track.arpVol * musicScale, 0.01);
        }
        if (lFreq > 0) {
          rawTone(ctx, lFreq, lFreq, dur * 1.45, track.leadType || 'sine', (track.leadVol || 0.024) * musicScale, 0.015);
        }
        if (track.pulseHat && i % 2 === 1) {
          rawFilteredNoise(ctx, 0.035, 'highpass', 5500, 7500, 1.5, 0.014 * musicScale, 0);
        }
      });
    }

    playBeat();
    synthMusicTimer = setInterval(playBeat, track.stepMs);
  }

  /**
   * Primary Stage 3C Scene-Based Music Router.
   * Requests a logical audio scene (e.g. 'main_menu', 'classic_ai', 'frontier_settlement',
   * 'frontier_expedition', 'scientist_lavoisier').
   * - Preserves existing menu/battle/tutorial/scientist audio untouched.
   * - Crossfades smoothly between scenes without clipping or overlapping tracks.
   * - Handles UNASSIGNED_FALLBACK Frontier scenes cleanly (fades out previous track silently;
   *   never throws errors or silently assigns unrelated existing tracks).
   */
  function requestScene(sceneOrMode, options) {
    const opts = options || {};
    const prevScene = activeSceneId;
    const nextCanonical = resolveSceneId(sceneOrMode);

    currentMusicMode = sceneOrMode || null;
    activeSceneId = nextCanonical;

    if (!nextCanonical) {
      stopSynthMusic();
      stopAllHtmlAudio(Boolean(opts.immediate));
      setAudioPromptVisible(false);
      activePlaybackState = 'IDLE';
      return { sceneId: null, state: activePlaybackState };
    }

    if (!musicEnabled) {
      stopSynthMusic();
      stopAllHtmlAudio(true);
      setAudioPromptVisible(false);
      activePlaybackState = 'MUTED';
      return { sceneId: nextCanonical, state: activePlaybackState };
    }

    const cfg = getSceneConfig(nextCanonical);
    const targetEl = getMusicEl(nextCanonical);

    // Seamless continuation if the same scene (or shared preserved track element, e.g. main_menu <-> academy_menu) is already playing
    if (
      !opts.forceRestart &&
      ((prevScene === nextCanonical && ((activeAudioEl && !activeAudioEl.paused) || synthMusicTimer || activePlaybackState === 'SILENT_UNASSIGNED')) ||
        (targetEl && targetEl === activeAudioEl && !targetEl.paused))
    ) {
      if (targetEl && !targetEl.paused) {
        targetEl.volume = computeTargetElVolume(cfg);
      }
      return { sceneId: nextCanonical, state: activePlaybackState, continued: true };
    }

    stopSynthMusic();

    // Unassigned Frontier scenes (no custom file/URL yet and silentIfMissing=true): fade out cleanly without unrelated reuse
    if (cfg && cfg.silentIfMissing && !cfg.customUrl && !targetEl) {
      stopAllHtmlAudio(Boolean(opts.immediate));
      setAudioPromptVisible(false);
      activePlaybackState = 'SILENT_UNASSIGNED';
      return { sceneId: nextCanonical, state: activePlaybackState };
    }

    stopAllHtmlAudio(Boolean(opts.immediate), targetEl);

    if (!targetEl) {
      if (cfg && cfg.synthTrackId && SYNTH_TRACKS[cfg.synthTrackId]) {
        startSynthMusic(cfg.synthTrackId, nextCanonical);
        return { sceneId: nextCanonical, state: activePlaybackState };
      }
      activePlaybackState = 'SILENT_UNASSIGNED';
      return { sceneId: nextCanonical, state: activePlaybackState };
    }

    const sceneSnapshot = nextCanonical;
    const goalVol = computeTargetElVolume(cfg);
    targetEl.loop = cfg ? cfg.loop !== false : true;
    activeAudioEl = targetEl;

    try {
      const p = targetEl.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          if (activeSceneId === sceneSnapshot && musicEnabled) {
            setAudioPromptVisible(false);
            activePlaybackState = 'HTML_AUDIO';
            fadeInAudio(targetEl, goalVol, opts.immediate ? 0 : fadeDurationMs);
          } else {
            try {
              targetEl.pause();
            } catch (_) {}
          }
        }).catch((err) => {
          if (activeSceneId !== sceneSnapshot || !musicEnabled) return;
          activeAudioEl = null;
          if (err && err.name === 'NotAllowedError') {
            activePlaybackState = 'AUTOPLAY_BLOCKED';
            if (sceneSnapshot === 'main_menu' || sceneSnapshot === 'academy_menu') {
              setAudioPromptVisible(true);
            }
          } else if (cfg && cfg.synthTrackId && SYNTH_TRACKS[cfg.synthTrackId]) {
            // Missing custom drop-in file for a scene with a dedicated procedural synth soundtrack
            setAudioPromptVisible(false);
            startSynthMusic(cfg.synthTrackId, sceneSnapshot);
          } else {
            // Missing file on an unassigned/custom scene -> fail gracefully without error
            setAudioPromptVisible(false);
            activePlaybackState = 'SILENT_UNASSIGNED';
          }
        });
      } else {
        activePlaybackState = 'HTML_AUDIO';
        fadeInAudio(targetEl, goalVol, opts.immediate ? 0 : fadeDurationMs);
      }
    } catch (_) {
      activeAudioEl = null;
      if (cfg && cfg.synthTrackId && SYNTH_TRACKS[cfg.synthTrackId]) {
        startSynthMusic(cfg.synthTrackId, sceneSnapshot);
      } else {
        activePlaybackState = 'SILENT_UNASSIGNED';
      }
    }

    return { sceneId: nextCanonical, state: activePlaybackState };
  }

  /**
   * Backwards-compatible wrapper for legacy callers ('menu' | 'vs_ai' | 'pass_and_play' | 'tutorial' | 'scientist_*').
   */
  function setMusicMode(mode) {
    return requestScene(mode);
  }

  function startMenuMusic() {
    return requestScene('main_menu');
  }

  function stopMenuMusic() {
    if (activeSceneId === 'main_menu' || currentMusicMode === 'menu') {
      requestScene(null);
    }
  }

  function setMusicEnabled(enabled) {
    musicEnabled = Boolean(enabled);
    saveAudioSettings();
    if (!musicEnabled) {
      setAudioPromptVisible(false);
      stopSynthMusic();
      stopAllHtmlAudio(false);
      activePlaybackState = 'MUTED';
    } else if (activeSceneId || currentMusicMode) {
      const target = currentMusicMode || activeSceneId;
      requestScene(target, { forceRestart: true });
    }
  }

  function isMusicEnabled() {
    return musicEnabled;
  }

  function getMusicMode() {
    return currentMusicMode;
  }

  function getActiveSceneId() {
    return activeSceneId;
  }

  function getPlaybackState() {
    return {
      sceneId: activeSceneId,
      mode: currentMusicMode,
      state: activePlaybackState,
      musicEnabled,
      soundEnabled,
      musicVolume,
      sfxVolume,
      fadeDurationMs,
    };
  }

  function getMusicVolume() {
    return musicVolume;
  }

  function setMusicVolume(vol) {
    musicVolume = clamp(vol, 0, 1, DEFAULT_SETTINGS.musicVolume);
    saveAudioSettings();
    if (activeAudioEl && !activeAudioEl.paused && musicEnabled) {
      clearElementFade(activeAudioEl);
      activeAudioEl.volume = computeTargetElVolume(getSceneConfig(activeSceneId));
    }
    return musicVolume;
  }

  function getSfxVolume() {
    return sfxVolume;
  }

  function setSfxVolume(vol) {
    sfxVolume = clamp(vol, 0, 1, DEFAULT_SETTINGS.sfxVolume);
    saveAudioSettings();
    return sfxVolume;
  }

  function getFadeDuration() {
    return fadeDurationMs;
  }

  function setFadeDuration(ms) {
    fadeDurationMs = Math.round(clamp(ms, 0, 2000, DEFAULT_SETTINGS.fadeDurationMs));
    saveAudioSettings();
    return fadeDurationMs;
  }

  /**
   * Bind a user-selected local audio File directly to a mode/scene and immediately preview it.
   */
  function loadCustomTrackForMode(mode, file) {
    if (!mode || !file || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return false;
    const objUrl = URL.createObjectURL(file);
    const el = getMusicEl(mode);
    if (el) {
      el.src = objUrl;
      if (typeof el.load === 'function') el.load();
    } else if (V.AudioConfig && typeof V.AudioConfig.registerSceneTrack === 'function') {
      V.AudioConfig.registerSceneTrack(mode, { customUrl: objUrl, silentIfMissing: false });
    } else {
      return false;
    }
    musicEnabled = true;
    saveAudioSettings();
    requestScene(mode, { forceRestart: true });
    return true;
  }

  // Load persisted audio preferences immediately on startup
  loadAudioSettings();

  // Preload menu WAV immediately on script load so readyState is warm before first click
  if (typeof document !== 'undefined') {
    const bgmInit = getMusicEl('main_menu');
    if (bgmInit && typeof bgmInit.load === 'function') {
      bgmInit.load();
    }
  }

  function warmUpAudio(ctx) {
    try {
      getNoiseBuffer(ctx);
      const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
      const src = ctx.createBufferSource();
      src.buffer = silent;
      src.connect(ctx.destination);
      src.start(0);
    } catch (_) {
      // ignore
    }
  }

  function unlockAudio() {
    userGestureSeen = true;
    if (activeSceneId && musicEnabled) {
      const cfg = getSceneConfig(activeSceneId);
      const isPlayingHtml = activeAudioEl && !activeAudioEl.paused;
      const shouldRetry =
        activePlaybackState === 'AUTOPLAY_BLOCKED' ||
        (!isPlayingHtml && !synthMusicTimer && activePlaybackState !== 'SILENT_UNASSIGNED');
      if (shouldRetry && !(cfg && cfg.silentIfMissing && !cfg.customUrl && !getMusicEl(activeSceneId))) {
        requestScene(currentMusicMode || activeSceneId, { forceRestart: true });
      }
    }
    if (!soundEnabled && !musicEnabled) return;
    const AudioCtor = global.AudioContext || global.webkitAudioContext;
    if (!AudioCtor) return;
    if (!audioCtx) {
      audioCtx = new AudioCtor();
      warmUpAudio(audioCtx);
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => warmUpAudio(audioCtx)).catch(() => {});
    }
  }

  if (typeof global.addEventListener === 'function') {
    const onGesture = () => {
      unlockAudio();
    };
    global.addEventListener('pointerdown', onGesture, { capture: true, passive: true });
    global.addEventListener('keydown', onGesture, { capture: true, passive: true });
  }

  function withReadyCtx(fn) {
    if (!soundEnabled || sfxVolume <= 0.001) return;
    const AudioCtor = global.AudioContext || global.webkitAudioContext;
    if (!AudioCtor) return;

    if (!userGestureSeen && (!audioCtx || audioCtx.state === 'suspended')) {
      if (!audioCtx) {
        try {
          const probe = new AudioCtor();
          audioCtx = probe;
          if (audioCtx.state === 'running') {
            warmUpAudio(audioCtx);
            fn(audioCtx);
          }
        } catch (_) {}
      }
      return;
    }

    if (!audioCtx) {
      audioCtx = new AudioCtor();
      warmUpAudio(audioCtx);
    }

    if (audioCtx.state === 'running') {
      fn(audioCtx);
      return;
    }

    const requestedAt = Date.now();
    audioCtx.resume().then(() => {
      if (soundEnabled && sfxVolume > 0.001 && audioCtx.state === 'running' && Date.now() - requestedAt < 250) {
        warmUpAudio(audioCtx);
        fn(audioCtx);
      }
    }).catch(() => {});
  }

  function withReadyMusicCtx(fn) {
    if (!musicEnabled || musicVolume <= 0.001) return;
    const AudioCtor = global.AudioContext || global.webkitAudioContext;
    if (!AudioCtor) return;
    if (!audioCtx) {
      audioCtx = new AudioCtor();
      warmUpAudio(audioCtx);
    }
    if (audioCtx.state === 'running') {
      fn(audioCtx);
      return;
    }
    if (userGestureSeen) {
      audioCtx.resume().then(() => {
        if (musicEnabled && musicVolume > 0.001 && audioCtx.state === 'running') {
          warmUpAudio(audioCtx);
          fn(audioCtx);
        }
      }).catch(() => {});
    }
  }

  function getNoiseBuffer(ctx) {
    if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) {
      return noiseBuffer;
    }
    const len = ctx.sampleRate * 1.0;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBuffer = buf;
    return buf;
  }

  function rawTone(ctx, freqStart, freqEnd, duration, type, volume, delay) {
    const vol = Math.max(0.0001, volume || 0.12);
    const start = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freqStart, start);
    if (freqEnd !== null && freqEnd !== undefined && freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(vol, start + Math.min(0.015, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function rawFilteredNoise(ctx, duration, filterType, freqStart, freqEnd, q, volume, delay) {
    const vol = Math.max(0.0001, volume || 0.1);
    const start = ctx.currentTime + (delay || 0);
    const src = ctx.createBufferSource();
    src.buffer = getNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = filterType || 'bandpass';
    filter.frequency.setValueAtTime(freqStart, start);
    if (freqEnd && freqEnd !== freqStart) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), start + duration);
    }
    filter.Q.setValueAtTime(q || 1.2, start);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(vol, start + Math.min(0.02, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(start);
    src.stop(start + duration + 0.02);
  }

  // SFX helpers apply independent sfxVolume scaling
  function tone(ctx, freqStart, freqEnd, duration, type, volume, delay) {
    rawTone(ctx, freqStart, freqEnd, duration, type, (volume || 0.12) * sfxVolume, delay);
  }

  function filteredNoise(ctx, duration, filterType, freqStart, freqEnd, q, volume, delay) {
    rawFilteredNoise(ctx, duration, filterType, freqStart, freqEnd, q, (volume || 0.1) * sfxVolume, delay);
  }

  // ===== INDIVIDUAL SOUND EFFECTS =====

  function playCardSelect(selected) {
    withReadyCtx((ctx) => {
      if (selected) {
        tone(ctx, 520, 740, 0.065, 'triangle', 0.09, 0);
      } else {
        tone(ctx, 440, 310, 0.055, 'triangle', 0.07, 0);
      }
    });
  }

  function playButtonClick() {
    withReadyCtx((ctx) => {
      tone(ctx, 640, 820, 0.045, 'sine', 0.06, 0);
    });
  }

  function playError() {
    withReadyCtx((ctx) => {
      tone(ctx, 210, 145, 0.14, 'sawtooth', 0.08, 0);
    });
  }

  function playCardDraw(delaySec) {
    withReadyCtx((ctx) => {
      const d = delaySec || 0;
      filteredNoise(ctx, 0.1, 'bandpass', 1800, 3600, 1.8, 0.11, d);
      tone(ctx, 320, 560, 0.05, 'triangle', 0.045, d + 0.02);
    });
  }

  function playIntroClash() {
    withReadyCtx((ctx) => {
      filteredNoise(ctx, 0.22, 'bandpass', 360, 2100, 1.4, 0.12, 0);
      tone(ctx, 130, 65, 0.36, 'triangle', 0.16, 0.02);
      tone(ctx, 392, 392, 0.38, 'sine', 0.09, 0.04);
      tone(ctx, 587.3, 587.3, 0.38, 'triangle', 0.08, 0.07);
      tone(ctx, 784, 784, 0.45, 'sine', 0.07, 0.1);
    });
  }

  function playSynthesize(sp) {
    withReadyCtx((ctx) => {
      const notes = sp >= 16
        ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
        : [440, 554.37, 659.25, 880];
      notes.forEach((f, idx) => {
        tone(ctx, f, f * 1.01, 0.26, 'triangle', 0.11, idx * 0.06);
        tone(ctx, f * 2, f * 2, 0.18, 'sine', 0.04, idx * 0.06);
      });
    });
  }

  function playShield() {
    withReadyCtx((ctx) => {
      tone(ctx, 280, 620, 0.32, 'sine', 0.11, 0);
      tone(ctx, 420, 930, 0.32, 'triangle', 0.07, 0.03);
      tone(ctx, 840, 840, 0.26, 'sine', 0.05, 0.15);
    });
  }

  function playTakeover() {
    withReadyCtx((ctx) => {
      filteredNoise(ctx, 0.2, 'highpass', 2400, 6200, 1.2, 0.15, 0);
      tone(ctx, 980, 220, 0.16, 'sawtooth', 0.1, 0.01);
      tone(ctx, 300, 1120, 0.24, 'sawtooth', 0.09, 0.12);
      tone(ctx, 660, 880, 0.22, 'triangle', 0.1, 0.22);
    });
  }

  function playAcid() {
    withReadyCtx((ctx) => {
      filteredNoise(ctx, 0.5, 'bandpass', 3200, 1200, 2.2, 0.15, 0);
      tone(ctx, 310, 160, 0.14, 'sine', 0.06, 0.06);
      tone(ctx, 380, 200, 0.12, 'sine', 0.05, 0.18);
      tone(ctx, 270, 130, 0.14, 'sine', 0.05, 0.28);
    });
  }

  function playLaser() {
    withReadyCtx((ctx) => {
      tone(ctx, 1650, 190, 0.22, 'sawtooth', 0.12, 0);
      filteredNoise(ctx, 0.13, 'highpass', 3000, 1400, 1.5, 0.11, 0.03);
    });
  }

  function playCrystal() {
    withReadyCtx((ctx) => {
      [1318, 1046, 880, 784].forEach((f, idx) => {
        tone(ctx, f, f * 0.98, 0.22, 'sine', 0.09, idx * 0.05);
      });
    });
  }

  function playShatter() {
    withReadyCtx((ctx) => {
      filteredNoise(ctx, 0.3, 'highpass', 2200, 5000, 1.0, 0.17, 0);
      tone(ctx, 1200, 260, 0.2, 'triangle', 0.11, 0);
      tone(ctx, 190, 70, 0.26, 'sine', 0.14, 0.03);
    });
  }

  function playFreeze() {
    withReadyCtx((ctx) => {
      [1568, 1396, 1174, 987].forEach((f, i) => {
        tone(ctx, f, f * 0.94, 0.26, 'triangle', 0.075, i * 0.045);
      });
    });
  }

  function playUtility() {
    withReadyCtx((ctx) => {
      tone(ctx, 493.88, 659.25, 0.15, 'triangle', 0.09, 0);
      tone(ctx, 783.99, 987.77, 0.2, 'sine', 0.09, 0.08);
    });
  }

  function playAbility() {
    withReadyCtx((ctx) => {
      tone(ctx, 360, 720, 0.2, 'sine', 0.1, 0);
      tone(ctx, 540, 1080, 0.24, 'triangle', 0.07, 0.07);
    });
  }

  function playTurnChime() {
    withReadyCtx((ctx) => {
      tone(ctx, 523.25, 659.25, 0.14, 'sine', 0.07, 0);
    });
  }

  function playVictory() {
    withReadyCtx((ctx) => {
      const chord = [523.25, 659.25, 783.99, 1046.5];
      chord.forEach((f, idx) => {
        tone(ctx, f, f, 0.42, 'triangle', 0.12, idx * 0.1);
        tone(ctx, f / 2, f / 2, 0.45, 'sine', 0.08, idx * 0.1);
      });
    });
  }

  function playDefeat() {
    withReadyCtx((ctx) => {
      const notes = [392.0, 349.23, 311.13, 261.63];
      notes.forEach((f, idx) => {
        tone(ctx, f, f * 0.96, 0.44, 'sawtooth', 0.075, idx * 0.14);
        tone(ctx, f / 2, (f / 2) * 0.94, 0.48, 'triangle', 0.09, idx * 0.14);
      });
      filteredNoise(ctx, 0.55, 'lowpass', 900, 180, 1.4, 0.11, 0.32);
    });
  }

  function playSoundsForEvents(events) {
    if (!soundEnabled || sfxVolume <= 0.001 || !events || events.length === 0) return;

    let drawDelay = 0;
    for (const ev of events) {
      const meta = ev.meta;
      if (!meta || !meta.type) continue;

      switch (meta.type) {
        case 'CARDS_DRAWN': {
          const n = Math.min(meta.count || 1, 6);
          for (let i = 0; i < n; i++) {
            playCardDraw(drawDelay);
            drawDelay += 0.155;
          }
          break;
        }
        case 'SYNTHESIZE':
        case 'STABILIZE_COMPOUND':
          playSynthesize(meta.sp || 8);
          break;
        case 'UNSTABLE_PLAYED':
          playUtility();
          break;
        case 'UNSTABLE_DECAY':
          playShatter();
          break;
        case 'SHIELD':
        case 'BUFFER_SOLUTION':
          playShield();
          break;
        case 'EN_TAKEOVER':
        case 'ELECTROLYSIS':
          playTakeover();
          break;
        case 'ACID_RAIN':
          playAcid();
          break;
        case 'BOND_CLEAVAGE':
          playLaser();
          break;
        case 'PRECIPITATION':
          playCrystal();
          break;
        case 'IONIZATION_SURGE':
          playShatter();
          break;
        case 'REACTION_DELAY':
          playFreeze();
          break;
        case 'OXIDATION':
        case 'HALF_LIFE_DECAY':
          playLaser();
          break;
        case 'DIFFUSION':
        case 'THERMAL_ACTIVATION':
        case 'EQUILIBRIUM_SHIFT':
        case 'SYNTHESIS_ACCELERATOR':
          playUtility();
          break;
        case 'SALT_CURE':
        case 'HYDROCARBON_SYNERGY':
        case 'RAPID_OXIDATION':
        case 'CHLORAMINE_HAZARD':
        case 'UNBOND_H2':
        case 'RAPID_DECAY':
        case 'LUMINESCENCE':
        case 'LIQUID_EMBRITTLEMENT':
        case 'ALPHA_POISON':
        case 'SPONTANEOUS_IGNITION':
        case 'SCIENTIST_PASSIVE':
        case 'SCIENTIST_ACTIVE':
          playAbility();
          break;
        default:
          break;
      }
    }
  }

  function setSoundEnabled(enabled) {
    soundEnabled = Boolean(enabled);
    saveAudioSettings();
    if (soundEnabled) playButtonClick();
  }

  function isSoundEnabled() {
    return soundEnabled;
  }

  V.Sound = {
    AUDIO_SETTINGS_KEY,
    unlockAudio,
    setSoundEnabled,
    isSoundEnabled,
    requestScene,
    setMusicMode,
    getMusicMode,
    getActiveSceneId,
    getPlaybackState,
    getMusicVolume,
    setMusicVolume,
    getSfxVolume,
    setSfxVolume,
    getFadeDuration,
    setFadeDuration,
    getAudioSettings,
    loadAudioSettings,
    saveAudioSettings,
    loadCustomTrackForMode,
    startMenuMusic,
    stopMenuMusic,
    setMusicEnabled,
    isMusicEnabled,
    playCardSelect,
    playButtonClick,
    playError,
    playCardDraw,
    playIntroClash,
    playSynthesize,
    playShield,
    playTakeover,
    playAcid,
    playLaser,
    playCrystal,
    playShatter,
    playFreeze,
    playUtility,
    playAbility,
    playTurnChime,
    playVictory,
    playDefeat,
    playSoundsForEvents,
  };
})(typeof window !== 'undefined' ? window : globalThis);

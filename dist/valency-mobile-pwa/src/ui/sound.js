// VALENCY — Web Audio API Synthesized Sound Effects Engine
// Zero external audio files; works 100% offline over file:// and HTTP.
// Automatically unlocks AudioContext on first user gesture and supports SFX mute toggle.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  let audioCtx = null;
  let noiseBuffer = null;
  let soundEnabled = true;
  let musicEnabled = true;
  let currentMusicMode = null; // 'menu' | 'vs_ai' | 'pass_and_play' | 'tutorial' | null
  let activeAudioEl = null;
  let musicFadeTimer = null;
  let synthMusicTimer = null;
  let synthStep = 0;
  let userGestureSeen = false;

  const BGM_ELEMENT_IDS = {
    menu: 'bgm-menu',
    vs_ai: 'bgm-vs_ai',
    pass_and_play: 'bgm-pass_and_play',
    tutorial: 'bgm-tutorial',
    scientist_lavoisier: 'bgm-scientist-lavoisier',
    scientist_mendeleev: 'bgm-scientist-mendeleev',
    scientist_pauling: 'bgm-scientist-pauling',
    scientist_curie: 'bgm-scientist-curie',
    scientist_proctor: 'bgm-scientist-proctor',
  };

  function getMusicEl(mode) {
    if (typeof document === 'undefined') return null;
    const id = BGM_ELEMENT_IDS[mode || currentMusicMode || 'menu'];
    return id ? document.getElementById(id) : null;
  }

  function setAudioPromptVisible(visible) {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('menu-audio-prompt');
    if (el) el.classList.toggle('hidden', !visible);
  }

  function stopSynthMusic() {
    if (synthMusicTimer) {
      clearInterval(synthMusicTimer);
      synthMusicTimer = null;
    }
  }

  function stopAllHtmlAudio(immediate) {
    if (musicFadeTimer) {
      clearInterval(musicFadeTimer);
      musicFadeTimer = null;
    }
    if (typeof document === 'undefined') return;
    for (const id of Object.values(BGM_ELEMENT_IDS)) {
      const el = document.getElementById(id);
      if (!el || el.paused) continue;
      if (immediate) {
        el.pause();
        el.volume = 0.42;
      } else {
        fadeOutAndPause(el, 220);
      }
    }
    activeAudioEl = null;
  }

  function fadeOutAndPause(el, durationMs) {
    const startVol = el.volume;
    const steps = 8;
    const stepMs = Math.max(15, Math.round(durationMs / steps));
    let tick = 0;
    const t = setInterval(() => {
      tick++;
      el.volume = Math.max(0, startVol * (1 - tick / steps));
      if (tick >= steps) {
        clearInterval(t);
        if (el !== activeAudioEl) {
          el.pause();
          el.volume = 0.42;
        }
      }
    }, stepMs);
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

  function startSynthMusic(mode) {
    stopSynthMusic();
    if (!musicEnabled) return;
    const track = SYNTH_TRACKS[mode];
    if (!track) return;

    synthStep = 0;

    function playBeat() {
      if (!musicEnabled || currentMusicMode !== mode) {
        stopSynthMusic();
        return;
      }
      withReadyMusicCtx((ctx) => {
        const len = track.bass.length;
        const i = synthStep % len;
        synthStep++;

        const bFreq = track.bass[i];
        const aFreq = track.arp[i % track.arp.length];
        const lFreq = track.lead ? track.lead[i % track.lead.length] : 0;
        const dur = (track.stepMs / 1000) * 0.92;

        if (bFreq > 0) {
          tone(ctx, bFreq, bFreq, dur * 1.35, track.bassType, track.bassVol, 0);
        }
        if (aFreq > 0) {
          tone(ctx, aFreq, aFreq, dur * 0.85, track.arpType, track.arpVol, 0.01);
        }
        if (lFreq > 0) {
          tone(ctx, lFreq, lFreq, dur * 1.45, track.leadType || 'sine', track.leadVol || 0.024, 0.015);
        }
        if (track.pulseHat && i % 2 === 1) {
          filteredNoise(ctx, 0.035, 'highpass', 5500, 7500, 1.5, 0.014, 0);
        }
      });
    }

    playBeat();
    synthMusicTimer = setInterval(playBeat, track.stepMs);
  }

  /**
   * Play background music tailored to a game mode ('menu' | 'vs_ai' | 'pass_and_play' | 'tutorial').
   * Automatically uses custom audio file in assets/audio/ if present, otherwise plays the mode's
   * built-in procedural Web Audio soundtrack.
   */
  function setMusicMode(mode) {
    const prevMode = currentMusicMode;
    currentMusicMode = mode || null;

    if (!currentMusicMode) {
      stopSynthMusic();
      stopAllHtmlAudio(false);
      setAudioPromptVisible(false);
      return;
    }

    if (!musicEnabled) {
      stopSynthMusic();
      stopAllHtmlAudio(true);
      setAudioPromptVisible(false);
      return;
    }

    // If same mode is already playing cleanly, keep going seamlessly
    if (prevMode === currentMusicMode && ((activeAudioEl && !activeAudioEl.paused) || synthMusicTimer)) {
      return;
    }

    stopSynthMusic();
    stopAllHtmlAudio(false);

    const el = getMusicEl(currentMusicMode);
    if (!el) {
      startSynthMusic(currentMusicMode);
      return;
    }

    const modeSnapshot = currentMusicMode;
    el.volume = modeSnapshot === 'menu' ? 0.45 : 0.34;
    activeAudioEl = el;

    try {
      const p = el.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          if (currentMusicMode === modeSnapshot && musicEnabled) {
            setAudioPromptVisible(false);
          } else {
            el.pause();
          }
        }).catch((err) => {
          if (currentMusicMode !== modeSnapshot || !musicEnabled) return;
          activeAudioEl = null;
          // Distinguish Autoplay block (NotAllowedError) vs missing custom file (NotSupportedError / network)
          if (err && err.name === 'NotAllowedError') {
            if (modeSnapshot === 'menu') setAudioPromptVisible(true);
          } else {
            // No custom audio file dropped in for this mode yet -> play built-in procedural soundtrack!
            setAudioPromptVisible(false);
            startSynthMusic(modeSnapshot);
          }
        });
      }
    } catch (_) {
      activeAudioEl = null;
      startSynthMusic(modeSnapshot);
    }
  }

  function startMenuMusic() {
    setMusicMode('menu');
  }

  function stopMenuMusic() {
    if (currentMusicMode === 'menu') {
      setMusicMode(null);
    }
  }

  function setMusicEnabled(enabled) {
    musicEnabled = Boolean(enabled);
    if (!musicEnabled) {
      setAudioPromptVisible(false);
      stopSynthMusic();
      stopAllHtmlAudio(false);
    } else if (currentMusicMode) {
      const modeToResume = currentMusicMode;
      currentMusicMode = null;
      setMusicMode(modeToResume);
    }
  }

  function isMusicEnabled() {
    return musicEnabled;
  }

  function getMusicMode() {
    return currentMusicMode;
  }

  /**
   * Bind a user-selected local audio File directly to a mode or scientist <audio> element
   * and immediately preview it.
   */
  function loadCustomTrackForMode(mode, file) {
    if (!mode || !file || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return false;
    const el = getMusicEl(mode);
    if (!el) return false;
    const objUrl = URL.createObjectURL(file);
    el.src = objUrl;
    el.load();
    musicEnabled = true;
    currentMusicMode = null; // Force clean restart on the newly loaded custom file
    setMusicMode(mode);
    return true;
  }

  // Preload menu WAV immediately on script load so readyState is warm before first click
  if (typeof document !== 'undefined') {
    const bgmInit = getMusicEl('menu');
    if (bgmInit && typeof bgmInit.load === 'function') {
      bgmInit.load();
    }
  }

  function warmUpAudio(ctx) {
    // Prime Windows/browser audio pipeline with a 1-sample silent buffer + prebuilt noise buffer
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
    if (currentMusicMode && musicEnabled) {
      const el = getMusicEl(currentMusicMode);
      const isPlayingHtml = activeAudioEl && !activeAudioEl.paused;
      if (!isPlayingHtml && !synthMusicTimer) {
        const m = currentMusicMode;
        currentMusicMode = null;
        setMusicMode(m);
      } else if (el && el === activeAudioEl && el.paused) {
        const m = currentMusicMode;
        currentMusicMode = null;
        setMusicMode(m);
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

  // Capture-phase unlock on pointerdown/keydown so AudioContext is ALREADY warm before 'click' fires!
  if (typeof global.addEventListener === 'function') {
    const onGesture = () => {
      unlockAudio();
    };
    global.addEventListener('pointerdown', onGesture, { capture: true, passive: true });
    global.addEventListener('keydown', onGesture, { capture: true, passive: true });
  }

  /**
   * Run `fn(ctx)` only when AudioContext is genuinely ready (never queue stale sounds
   * into a frozen pre-gesture AudioContext that would burst late seconds afterward).
   */
  function withReadyCtx(fn) {
    if (!soundEnabled) return;
    const AudioCtor = global.AudioContext || global.webkitAudioContext;
    if (!AudioCtor) return;

    // On initial page load before any user interaction, browsers suspend Web Audio;
    // skip instead of queueing stale audio that would fire late on the first click.
    if (!userGestureSeen && (!audioCtx || audioCtx.state === 'suspended')) {
      // Still allow headless/test environments where AudioContext starts immediately 'running'
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

    // If still resuming right after the very first gesture, play immediately once resumed
    // (dropping if resume takes > 250ms so audio never arrives noticeably late).
    const requestedAt = Date.now();
    audioCtx.resume().then(() => {
      if (soundEnabled && audioCtx.state === 'running' && Date.now() - requestedAt < 250) {
        warmUpAudio(audioCtx);
        fn(audioCtx);
      }
    }).catch(() => {});
  }

  /**
   * Like withReadyCtx, but gated by musicEnabled (so SFX mute never silences procedural music!).
   */
  function withReadyMusicCtx(fn) {
    if (!musicEnabled) return;
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
        if (musicEnabled && audioCtx.state === 'running') {
          warmUpAudio(audioCtx);
          fn(audioCtx);
        }
      }).catch(() => {});
    }
  }

  function getCtx() {
    if (!soundEnabled) return null;
    if (audioCtx && audioCtx.state === 'running') return audioCtx;
    return null;
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

  function tone(ctx, freqStart, freqEnd, duration, type, volume, delay) {
    const start = ctx.currentTime + (delay || 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freqStart, start);
    if (freqEnd !== null && freqEnd !== undefined && freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(volume || 0.12, start + Math.min(0.015, duration * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  function filteredNoise(ctx, duration, filterType, freqStart, freqEnd, q, volume, delay) {
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
    gain.gain.linearRampToValueAtTime(volume || 0.1, start + Math.min(0.02, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(start);
    src.stop(start + duration + 0.02);
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
      // Crisp paper whoosh + soft flick
      filteredNoise(ctx, 0.1, 'bandpass', 1800, 3600, 1.8, 0.11, d);
      tone(ctx, 320, 560, 0.05, 'triangle', 0.045, d + 0.02);
    });
  }

  function playIntroClash() {
    withReadyCtx((ctx) => {
      // Immediate whoosh + resonant atomic VS chord (zero startup lag!)
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
      // Dramatic descending minor lab-shutdown / meltdown cadence
      const notes = [392.0, 349.23, 311.13, 261.63];
      notes.forEach((f, idx) => {
        tone(ctx, f, f * 0.96, 0.44, 'sawtooth', 0.075, idx * 0.14);
        tone(ctx, f / 2, (f / 2) * 0.94, 0.48, 'triangle', 0.09, idx * 0.14);
      });
      filteredNoise(ctx, 0.55, 'lowpass', 900, 180, 1.4, 0.11, 0.32);
    });
  }

  /**
   * Dispatch matching sound effects for a batch of engine events.
   */
  function playSoundsForEvents(events) {
    if (!soundEnabled || !events || events.length === 0) return;

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
          playAbility();
          break;
        default:
          break;
      }
    }
  }

  function setSoundEnabled(enabled) {
    soundEnabled = Boolean(enabled);
    if (soundEnabled) playButtonClick();
  }

  function isSoundEnabled() {
    return soundEnabled;
  }

  V.Sound = {
    unlockAudio,
    setSoundEnabled,
    isSoundEnabled,
    setMusicMode,
    getMusicMode,
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

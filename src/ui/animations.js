// VALENCY — Atomic Visuals & Game-Event FX Engine
// Provides:
//   1. Static event artwork mapping (assets/events/*.png)
//   2. Live SVG animated Bohr/valence-electron atoms on Element & Noble Gas cards
//   3. Live SVG bonded molecular clusters on Field Compound tiles
//   4. Non-blocking FX overlay animations driven by gameEngine's state.recentEvents

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const EVENT_ART_MAP = {
    ACID_RAIN: 'assets/events/acid_rain.svg',
    REACTION_DELAY: 'assets/events/reaction_delay.svg',
    BOND_CLEAVAGE: 'assets/events/bond_cleavage.svg',
    PRECIPITATION: 'assets/events/precipitation.svg',
    IONIZATION_SURGE: 'assets/events/ionization_surge.svg',
    ELECTROLYSIS: 'assets/events/electrolysis.svg',
    OXIDATION: 'assets/events/oxidation.svg',
    HALF_LIFE_DECAY: 'assets/events/half_life_decay.svg',
    CHAIN_REACTION: 'assets/events/chain_reaction.svg',
    CATALYST: 'assets/events/catalyst.svg',
    DIFFUSION: 'assets/events/diffusion.svg',
    DISTILLATION: 'assets/events/distillation.svg',
    EXOTHERMIC_SURGE: 'assets/events/exothermic_surge.svg',
    THERMAL_ACTIVATION: 'assets/events/thermal_activation.svg',
    RESONANCE_STABILIZER: 'assets/events/resonance_stabilizer.svg',
    BUFFER_SOLUTION: 'assets/events/buffer_solution.svg',
    EQUILIBRIUM_SHIFT: 'assets/events/equilibrium_shift.svg',
    SYNTHESIS_ACCELERATOR: 'assets/events/synthesis_accelerator.svg',
  };

  let animationsEnabled = true;
  let introTimeout = null;

  function setAnimationsEnabled(enabled) {
    animationsEnabled = Boolean(enabled);
    if (typeof document !== 'undefined' && document.body) {
      document.body.classList.toggle('fx-reduced', !animationsEnabled);
    }
    if (V.CharacterRig && typeof V.CharacterRig.syncAllRigsMode === 'function') {
      V.CharacterRig.syncAllRigsMode();
    }
    if (V.BattleFormation && typeof V.BattleFormation.syncReducedMotion === 'function') {
      V.BattleFormation.syncReducedMotion();
    }
  }

  function isAnimationsEnabled() {
    return animationsEnabled;
  }

  function getEventArtPath(effectId) {
    return EVENT_ART_MAP[effectId] || null;
  }

  // ===== CHARACTER PROFILES & PORTRAIT AVATARS =====
  const PROFILE_STYLES = {
    player: {
      title: 'Valence Challenger',
      specialty: 'Adaptive Synthesis • Rapid Combos',
      accent: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.45)',
      badge: 'CHEMIST P1',
    },
    lavoisier: {
      title: 'Conservation of Mass Simulation',
      specialty: 'Methodical, Resource-Efficient Synthesis',
      accent: '#38bdf8',
      glow: 'rgba(56, 189, 248, 0.48)',
      badge: 'CHAMBER 1 • LAVOISIER',
    },
    mendeleev: {
      title: 'Periodic Table Mastermind',
      specialty: 'Structured Periodic Synthesis & Shields',
      accent: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.48)',
      badge: 'AI GRANDMASTER',
    },
    pauling: {
      title: 'Chemical Bonding & EN Simulation',
      specialty: 'Displacement & Bond Vulnerability Tactics',
      accent: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.48)',
      badge: 'CHAMBER 3 • PAULING',
    },
    curie: {
      title: 'Radiochemistry Research Simulation',
      specialty: 'Persistence, Reclamation & Decay Pressure',
      accent: '#22c55e',
      glow: 'rgba(34, 197, 94, 0.48)',
      badge: 'CHAMBER 4 • CURIE',
    },
    proctor: {
      title: 'Academy Licensure Board Examiner',
      specialty: 'Comprehensive Adaptive Licensure Trial',
      accent: '#2dd4bf',
      glow: 'rgba(45, 212, 191, 0.48)',
      badge: 'FINAL EXAMINATION',
    },
    rival: {
      title: 'Rival Alchemist',
      specialty: 'Catalytic Tactics • Shield Defense',
      accent: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.45)',
      badge: 'CHEMIST P2',
    },
  };

  function getProfileKey(player, index, mode, storyMeta) {
    if (index === 0) return 'player';
    if (storyMeta && storyMeta.portraitRef && PROFILE_STYLES[storyMeta.portraitRef]) {
      return storyMeta.portraitRef;
    }
    return mode === 'vs_ai' || player.isAI ? 'mendeleev' : 'rival';
  }

  function getProfileMeta(player, index, mode, storyMeta) {
    const key = getProfileKey(player, index, mode, storyMeta);
    const base = PROFILE_STYLES[key] || PROFILE_STYLES.mendeleev;
    if (index === 1 && storyMeta) {
      return {
        key,
        ...base,
        title: storyMeta.title || base.title,
        specialty: storyMeta.specialty || base.specialty,
        badge: storyMeta.badge || base.badge,
      };
    }
    return { key, ...base };
  }

  function renderPortraitSVG(profileKey, sizeClass) {
    const cls = `chemist-avatar-svg ${sizeClass || ''}`;
    if (profileKey === 'lavoisier') {
      return `
        <svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <radialGradient id="avBgLav" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#0c4a6e"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="56" fill="url(#avBgLav)" stroke="#38bdf8" stroke-width="3"/>
          <!-- Precision balance scale arc behind -->
          <line x1="26" y1="34" x2="94" y2="34" stroke="#7dd3fc" stroke-width="1.6" opacity="0.65"/>
          <path d="M22 108 C24 83 40 77 60 77 C80 77 96 83 98 108 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="1.8"/>
          <path d="M47 77 L60 100 L73 77 Z" fill="#f8fafc"/>
          <!-- 18th-century powdered curl hair -->
          <path d="M31 54 C28 24 44 16 60 16 C76 16 92 24 89 54 C84 44 74 36 60 36 C46 36 36 44 31 54 Z" fill="#e2e8f0"/>
          <ellipse cx="60" cy="54" rx="18" ry="20" fill="#f8d8c0"/>
          <circle cx="52" cy="51" r="2.2" fill="#0f172a"/>
          <circle cx="68" cy="51" r="2.2" fill="#0f172a"/>
          <path d="M53 64 Q60 67 67 64" fill="none" stroke="#7c2d12" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="94" cy="34" r="3.8" fill="#38bdf8" stroke="#ffffff" stroke-width="1.2"/>
        </svg>
      `;
    }

    if (profileKey === 'pauling') {
      return `
        <svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <radialGradient id="avBgPau" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#451a03"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="56" fill="url(#avBgPau)" stroke="#f59e0b" stroke-width="3"/>
          <polygon points="60,12 100,36 100,84 60,108 20,84 20,36" fill="none" stroke="#fbbf24" stroke-width="1.2" stroke-dasharray="4 4" opacity="0.5"/>
          <path d="M22 108 C24 84 40 78 60 78 C80 78 96 84 98 108 Z" fill="#1e293b" stroke="#f59e0b" stroke-width="1.8"/>
          <polygon points="50,82 60,87 50,92" fill="#f59e0b"/>
          <polygon points="70,82 60,87 70,92" fill="#f59e0b"/>
          <path d="M35 48 C34 23 48 18 62 19 C78 20 86 28 85 48 C79 38 72 34 60 34 C48 34 41 38 35 48 Z" fill="#e2e8f0"/>
          <ellipse cx="60" cy="54" rx="18" ry="20" fill="#f7d5ba"/>
          <rect x="43" y="45" width="14" height="10" rx="3" fill="rgba(245,158,11,0.22)" stroke="#fde68a" stroke-width="2"/>
          <rect x="63" y="45" width="14" height="10" rx="3" fill="rgba(245,158,11,0.22)" stroke="#fde68a" stroke-width="2"/>
          <line x1="57" y1="50" x2="63" y2="50" stroke="#fde68a" stroke-width="1.8"/>
          <path d="M52 65 Q60 70 68 65" fill="none" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
    }

    if (profileKey === 'curie') {
      return `
        <svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <radialGradient id="avBgCur" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#064e3b"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="56" fill="url(#avBgCur)" stroke="#22c55e" stroke-width="3"/>
          <circle cx="60" cy="60" r="46" fill="none" stroke="#4ade80" stroke-width="1.4" stroke-dasharray="6 4" opacity="0.65"/>
          <path d="M22 108 C24 84 40 78 60 78 C80 78 96 84 98 108 Z" fill="#1e293b" stroke="#22c55e" stroke-width="1.8"/>
          <path d="M50 78 L60 92 L70 78 Z" fill="#d1fae5"/>
          <!-- Classic upswept hair bun -->
          <circle cx="60" cy="21" r="11" fill="#475569"/>
          <path d="M35 56 C33 28 45 22 60 22 C75 22 87 28 85 56 C80 42 72 36 60 36 C48 36 40 42 35 56 Z" fill="#475569"/>
          <ellipse cx="60" cy="54" rx="18" ry="20" fill="#fae0cc"/>
          <circle cx="52" cy="51" r="2.2" fill="#0f172a"/>
          <circle cx="68" cy="51" r="2.2" fill="#0f172a"/>
          <path d="M53 64 Q60 68 67 64" fill="none" stroke="#7c2d12" stroke-width="1.8" stroke-linecap="round"/>
          <!-- Glowing radium vial spark -->
          <circle cx="94" cy="40" r="4.2" fill="#4ade80" stroke="#dcfce7" stroke-width="1.2"/>
        </svg>
      `;
    }

    if (profileKey === 'proctor') {
      return `
        <svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <radialGradient id="avBgPro" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#134e4a"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="56" fill="url(#avBgPro)" stroke="#2dd4bf" stroke-width="3"/>
          <path d="M22 108 C24 84 40 78 60 78 C80 78 96 84 98 108 Z" fill="#0f172a" stroke="#2dd4bf" stroke-width="2"/>
          <ellipse cx="60" cy="54" rx="19" ry="21" fill="#e2e8f0"/>
          <rect x="40" y="44" width="40" height="14" rx="6" fill="rgba(45,212,191,0.42)" stroke="#99f6e4" stroke-width="2.2"/>
          <line x1="47" y1="51" x2="73" y2="51" stroke="#5eead4" stroke-width="2" stroke-linecap="round"/>
          <circle cx="60" cy="92" r="6" fill="#2dd4bf"/>
        </svg>
      `;
    }

    if (profileKey === 'mendeleev') {
      return `
        <svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <radialGradient id="avBgM" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#3b0764"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="56" fill="url(#avBgM)" stroke="#a855f7" stroke-width="3"/>
          <!-- Orbiting periodic halo -->
          <ellipse cx="60" cy="56" rx="46" ry="18" fill="none" stroke="#c084fc" stroke-width="1.6" stroke-dasharray="6 4" transform="rotate(-18 60 56)" opacity="0.7"/>
          <!-- Coat & collar -->
          <path d="M22 108 C24 84 40 78 60 78 C80 78 96 84 98 108 Z" fill="#1e1b4b" stroke="#818cf8" stroke-width="1.8"/>
          <path d="M46 78 L60 98 L74 78" fill="#e2e8f0"/>
          <!-- Iconic silver hair & grand beard -->
          <path d="M32 54 C30 26 44 18 60 18 C76 18 90 26 88 54 C92 66 86 80 76 86 C68 92 52 92 44 86 C34 80 28 66 32 54 Z" fill="#cbd5e1"/>
          <!-- Face -->
          <ellipse cx="60" cy="50" rx="19" ry="20" fill="#fde6d2"/>
          <!-- Sweeping silver mustache & full beard -->
          <path d="M40 58 C44 52 54 54 60 58 C66 54 76 52 80 58 C82 74 74 88 60 90 C46 88 38 74 40 58 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="1"/>
          <path d="M45 58 Q60 53 75 58" fill="none" stroke="#cbd5e1" stroke-width="3.5" stroke-linecap="round"/>
          <!-- Glowing violet spectacles -->
          <circle cx="51" cy="48" r="7.5" fill="rgba(168,85,247,0.28)" stroke="#e9d5ff" stroke-width="2.2"/>
          <circle cx="69" cy="48" r="7.5" fill="rgba(168,85,247,0.28)" stroke="#e9d5ff" stroke-width="2.2"/>
          <line x1="58.5" y1="48" x2="61.5" y2="48" stroke="#e9d5ff" stroke-width="2"/>
          <circle cx="51" cy="48" r="2.2" fill="#f5d0fe"/>
          <circle cx="69" cy="48" r="2.2" fill="#f5d0fe"/>
          <!-- Orbit electron -->
          <circle cx="96" cy="36" r="4" fill="#e879f9" stroke="#ffffff" stroke-width="1.2"/>
        </svg>
      `;
    }

    if (profileKey === 'rival') {
      return `
        <svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <radialGradient id="avBgR" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stop-color="#451a03"/>
              <stop offset="100%" stop-color="#0f172a"/>
            </radialGradient>
          </defs>
          <circle cx="60" cy="60" r="56" fill="url(#avBgR)" stroke="#f59e0b" stroke-width="3"/>
          <ellipse cx="60" cy="58" rx="46" ry="18" fill="none" stroke="#fbbf24" stroke-width="1.6" stroke-dasharray="5 4" transform="rotate(16 60 58)" opacity="0.7"/>
          <!-- Lab jacket -->
          <path d="M22 108 C25 84 40 78 60 78 C80 78 95 84 98 108 Z" fill="#f8fafc" stroke="#f59e0b" stroke-width="1.8"/>
          <path d="M50 78 L60 100 L70 78" fill="#0f766e"/>
          <!-- Hair & head -->
          <path d="M35 50 C34 25 46 18 62 19 C78 20 86 30 85 52 C80 42 74 36 60 36 C46 36 40 42 35 50 Z" fill="#1e293b"/>
          <ellipse cx="60" cy="54" rx="19" ry="21" fill="#f3cfa8"/>
          <!-- Amber safety visor goggles -->
          <rect x="40" y="43" width="40" height="13" rx="6" fill="rgba(245,158,11,0.42)" stroke="#fde68a" stroke-width="2.2"/>
          <line x1="46" y1="47" x2="56" y2="47" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" opacity="0.8"/>
          <path d="M53 65 Q60 69 67 65" fill="none" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/>
          <!-- Orbit electron -->
          <circle cx="24" cy="40" r="4" fill="#fbbf24" stroke="#ffffff" stroke-width="1.2"/>
        </svg>
      `;
    }

    // Default: Player 1 ("Valence Challenger")
    return `
      <svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <radialGradient id="avBgP" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stop-color="#0c4a6e"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="56" fill="url(#avBgP)" stroke="#38bdf8" stroke-width="3"/>
        <ellipse cx="60" cy="58" rx="46" ry="18" fill="none" stroke="#7dd3fc" stroke-width="1.6" stroke-dasharray="6 4" transform="rotate(-16 60 58)" opacity="0.72"/>
        <!-- White lab coat with cyan undershirt -->
        <path d="M22 108 C25 84 40 78 60 78 C80 78 95 84 98 108 Z" fill="#f8fafc" stroke="#38bdf8" stroke-width="1.8"/>
        <path d="M49 78 L60 100 L71 78" fill="#0284c7"/>
        <!-- Stylish hair + head -->
        <path d="M36 52 C34 26 48 18 62 20 C78 21 86 32 84 52 C78 40 68 35 58 36 C46 37 40 42 36 52 Z" fill="#334155"/>
        <ellipse cx="60" cy="54" rx="19" ry="21" fill="#f7d5ba"/>
        <!-- Sleek cyan lab goggles -->
        <rect x="41" y="43" width="17" height="12" rx="5" fill="rgba(56,189,248,0.35)" stroke="#bae6fd" stroke-width="2.2"/>
        <rect x="62" y="43" width="17" height="12" rx="5" fill="rgba(56,189,248,0.35)" stroke="#bae6fd" stroke-width="2.2"/>
        <line x1="58" y1="49" x2="62" y2="49" stroke="#bae6fd" stroke-width="2.2"/>
        <circle cx="49" cy="49" r="2.2" fill="#e0f2fe"/>
        <circle cx="70" cy="49" r="2.2" fill="#e0f2fe"/>
        <path d="M53 65 Q60 70 67 65" fill="none" stroke="#7c2d12" stroke-width="2" stroke-linecap="round"/>
        <!-- Glowing cyan flask emblem -->
        <circle cx="94" cy="42" r="4" fill="#38bdf8" stroke="#ffffff" stroke-width="1.2"/>
      </svg>
    `;
  }

  /**
   * Play the Pre-Match Chemist Profile VS Intro Overlay before the opening deal.
   */
  function playPreMatchIntro(players, mode, onComplete, storyMeta) {
    const done = typeof onComplete === 'function' ? onComplete : function () {};
    const root = document.getElementById('intro-root');
    if (!root || !animationsEnabled) {
      if (root) {
        root.classList.add('hidden');
        root.innerHTML = '';
      }
      done();
      return;
    }

    if (introTimeout) {
      clearTimeout(introTimeout);
      introTimeout = null;
    }

    const p1 = players[0];
    const p2 = players[1];
    const m1 = getProfileMeta(p1, 0, mode, storyMeta);
    const m2 = getProfileMeta(p2, 1, mode, storyMeta);

    const oppAnimatedId =
      (storyMeta && storyMeta.animatedPortraitId) ||
      (V.CharacterRegistry && storyMeta && V.CharacterRegistry.resolveCharacterId(storyMeta)) ||
      null;
    const useOppAnimated = Boolean(oppAnimatedId && V.CharacterRig);

    root.innerHTML = `
      <div class="intro-stage" id="intro-stage">
        <div class="intro-card intro-left" style="--prof-accent:${m1.accent};--prof-glow:${m1.glow}">
          <span class="intro-tag">${m1.badge}</span>
          <div class="intro-avatar-wrap">
            ${renderPortraitSVG(m1.key, 'intro-avatar')}
          </div>
          <h2 class="intro-name">${p1.name}</h2>
          <div class="intro-title">${m1.title}</div>
          <div class="intro-spec">${m1.specialty}</div>
        </div>

        <div class="intro-vs-core">
          <div class="intro-vs-ring intro-vs-ring-a"></div>
          <div class="intro-vs-ring intro-vs-ring-b"></div>
          <div class="intro-vs-badge">VS</div>
          <div class="intro-match-goal">FIRST TO ${V.WIN_SP || 25} SP</div>
        </div>

        <div class="intro-card intro-right" style="--prof-accent:${m2.accent};--prof-glow:${m2.glow}">
          <span class="intro-tag">${m2.badge}</span>
          <div class="intro-avatar-wrap ${useOppAnimated ? 'has-animated-portrait' : ''}" id="intro-opp-avatar-wrap">
            ${useOppAnimated
              ? '<div id="intro-animated-portrait"></div>'
              : renderPortraitSVG(m2.key, 'intro-avatar')}
          </div>
          <h2 class="intro-name">${p2.name}</h2>
          <div class="intro-title">${m2.title}</div>
          <div class="intro-spec">${m2.specialty}</div>
        </div>

        <div class="intro-footer">
          <div class="intro-progress-track"><div class="intro-progress-fill"></div></div>
          <button id="btn-skip-intro" class="intro-skip-btn">Start Match &amp; Deal Cards →</button>
        </div>
      </div>
    `;

    let introRig = null;
    if (useOppAnimated) {
      const mountEl = document.getElementById('intro-animated-portrait');
      if (mountEl) {
        introRig = V.CharacterRig.mount(mountEl, {
          characterId: oppAnimatedId,
          size: 'intro',
          expression: 'neutral',
          autoplayTransition: true,
        });
      }
    }

    root.classList.remove('hidden', 'intro-exit');
    if (V.Sound) V.Sound.playIntroClash();

    let finished = false;
    function finishIntro() {
      if (finished) return;
      finished = true;
      if (introRig) {
        introRig.destroy();
        introRig = null;
      }
      if (introTimeout) {
        clearTimeout(introTimeout);
        introTimeout = null;
      }
      root.classList.add('intro-exit');
      setTimeout(() => {
        root.classList.add('hidden');
        root.classList.remove('intro-exit');
        root.innerHTML = '';
        done();
      }, 280);
    }

    const skipBtn = document.getElementById('btn-skip-intro');
    if (skipBtn) skipBtn.addEventListener('click', (e) => { e.stopPropagation(); finishIntro(); });
    root.onclick = finishIntro;

    introTimeout = setTimeout(finishIntro, 3200);
  }

  /**
   * Animate flying cards from the Draw Pile to the target player's hand + arrival pop.
   */
  function animateCardDraws(drawEvents, viewingPlayerIndex) {
    if (!animationsEnabled || !drawEvents || drawEvents.length === 0) return;
    const layer = document.getElementById('fx-layer');
    if (!layer) return;

    requestAnimationFrame(() => {
      const pileEl = document.getElementById('draw-pile-box');
      const pileRect = pileEl
        ? pileEl.getBoundingClientRect()
        : { left: 80, top: window.innerHeight * 0.45, width: 82, height: 54 };

      const startX = pileRect.left + pileRect.width / 2 - 28;
      const startY = pileRect.top + pileRect.height / 2 - 40;

      if (pileEl) {
        pileEl.classList.remove('fx-pile-pulse');
        void pileEl.offsetWidth;
        pileEl.classList.add('fx-pile-pulse');
        setTimeout(() => pileEl.classList.remove('fx-pile-pulse'), 650);
      }

      let globalStep = 0;

      for (const ev of drawEvents) {
        const meta = ev.meta;
        if (!meta || meta.type !== 'CARDS_DRAWN') continue;
        const isBottom = meta.playerId === viewingPlayerIndex;
        const cardIds = meta.cardIds || [];
        const total = Math.min(cardIds.length, 7);

        // Floating "+N CARDS" chip near the Draw Pile
        if (meta.source !== 'initial_deal') {
          const chip = document.createElement('div');
          chip.className = 'fx-draw-chip';
          chip.style.left = `${pileRect.left + pileRect.width / 2}px`;
          chip.style.top = `${Math.max(18, pileRect.top - 10)}px`;
          chip.textContent = `+${meta.count} CARD${meta.count === 1 ? '' : 'S'}`;
          layer.appendChild(chip);
          setTimeout(() => chip.remove(), 1950);
        }

        const oppBacks = document.querySelector('#opponent-zone .opponent-backs');
        const handRow = document.getElementById('player-hand-row');

        for (let i = 0; i < total; i++) {
          const cid = cardIds[i];
          const delayMs = globalStep * 155;
          globalStep++;

          let targetX = window.innerWidth * 0.45;
          let targetY = isBottom ? window.innerHeight - 130 : 95;

          if (isBottom) {
            const cardEl = cid ? document.querySelector(`#player-hand-row [data-card-id="${cid}"]`) : null;
            if (cardEl) {
              const cr = cardEl.getBoundingClientRect();
              targetX = cr.left + cr.width / 2 - 28;
              targetY = cr.top + cr.height / 2 - 40;
              // Staggered flip/slide arrival on the real hand card!
              cardEl.classList.add('vcard-draw-in');
              cardEl.style.animationDelay = `${Math.min(delayMs + 220, 1100)}ms`;
              setTimeout(() => {
                cardEl.classList.remove('vcard-draw-in');
                cardEl.style.animationDelay = '';
              }, delayMs + 1250);
            } else if (handRow) {
              const hr = handRow.getBoundingClientRect();
              targetX = hr.left + Math.min(hr.width - 60, 60 + i * 70);
              targetY = hr.top + 40;
            }
          } else if (oppBacks) {
            const or = oppBacks.getBoundingClientRect();
            targetX = or.left + or.width / 2 - 24;
            targetY = or.top + or.height / 2 - 34;
          }

          const fly = document.createElement('div');
          fly.className = 'fx-flying-card';
          fly.innerHTML = '<span class="fx-flying-emblem">⚛</span>';
          fly.style.left = `${startX}px`;
          fly.style.top = `${startY}px`;
          fly.style.setProperty('--tx', `${(targetX - startX).toFixed(1)}px`);
          fly.style.setProperty('--ty', `${(targetY - startY).toFixed(1)}px`);
          fly.style.setProperty('--rot', `${(isBottom ? -8 + i * 3 : 8 - i * 3)}deg`);
          fly.style.animationDelay = `${delayMs}ms`;
          layer.appendChild(fly);
          setTimeout(() => fly.remove(), delayMs + 1050);
        }
      }
    });
  }

  const RADIOACTIVE_SYMBOLS = new Set(['Fr', 'Ra', 'Po', 'At', 'Rn']);

  /**
   * Render a live animated SVG Bohr / valence-electron atom for an Element or Noble Gas card.
   */
  function renderAtomSVG(card) {
    const gMeta = V.GROUP_META[card.colorGroup || card.group] || V.GROUP_META['4A'];
    const isNoble = card.kind === 'noble_gas';
    const isRadioactive = RADIOACTIVE_SYMBOLS.has(card.symbol);
    const valence = card.valence || 1;
    const hasInnerShell = card.atomicNumber > 2;

    // Speed: reactive high-EN or alkali metals hum faster; Noble Gases glide serenely
    let spinDuration = 7.5;
    if (isNoble) spinDuration = 16;
    else if (card.symbol === 'F') spinDuration = 3.2;
    else if (card.en >= 3.0 || card.group === '1A') spinDuration = 4.6;
    else if (card.en >= 2.1) spinDuration = 6.2;

    const rOuter = 27;
    const rInner = 19;
    const cx = 44;
    const cy = 34;

    // Place exact valence electrons around outer orbit
    const valenceElectrons = [];
    for (let i = 0; i < valence; i++) {
      const angle = (Math.PI * 2 * i) / valence - Math.PI / 2;
      const ex = (cx + Math.cos(angle) * rOuter).toFixed(2);
      const ey = (cy + Math.sin(angle) * rOuter).toFixed(2);
      const fill = isNoble ? '#4ade80' : (card.symbol === 'H' ? '#38bdf8' : gMeta.badgeBg);
      valenceElectrons.push(
        `<circle class="atom-electron" cx="${ex}" cy="${ey}" r="3.1" fill="${fill}" stroke="#0f172a" stroke-width="0.9" />`
      );
    }

    // Inner core hint dots for Period 2+ elements
    let innerRingHTML = '';
    if (hasInnerShell) {
      innerRingHTML = `
        <g class="atom-orbit-inner" style="transform-origin:${cx}px ${cy}px">
          <circle cx="${cx}" cy="${cy}" r="${rInner}" fill="none" stroke="rgba(148,163,184,0.38)" stroke-width="1" stroke-dasharray="2 2.5" />
          <circle cx="${cx + rInner}" cy="${cy}" r="1.8" fill="rgba(148,163,184,0.65)" />
          <circle cx="${cx - rInner}" cy="${cy}" r="1.8" fill="rgba(148,163,184,0.65)" />
        </g>
      `;
    }

    // Noble gas full-shell shield halo
    const nobleHalo = isNoble
      ? `<circle class="noble-halo-ring" cx="${cx}" cy="${cy}" r="${rOuter + 3.5}" fill="none" stroke="${card.heavyNobleGas ? '#34d399' : '#22c55e'}" stroke-width="1.6" stroke-dasharray="${card.heavyNobleGas ? '6 3' : 'none'}" opacity="0.75" />`
      : '';

    // Radioactive pulse ring
    const radHalo = isRadioactive
      ? `<circle class="radioactive-pulse" cx="${cx}" cy="${cy}" r="${rOuter + 2}" fill="none" stroke="#a3e635" stroke-width="1.5" opacity="0.65" />`
      : '';

    const coreFill = isNoble ? '#16a34a' : (card.symbol === 'H' ? '#0284c7' : gMeta.color);
    const orbitStroke = isNoble ? 'rgba(34,197,94,0.55)' : 'rgba(100,116,139,0.45)';

    return `
      <svg class="atom-svg ${isNoble ? 'atom-noble' : ''} ${isRadioactive ? 'atom-radioactive' : ''}" viewBox="0 0 88 68" aria-hidden="true">
        ${radHalo}
        ${nobleHalo}
        ${innerRingHTML}
        <g class="atom-orbit-outer" style="transform-origin:${cx}px ${cy}px; animation-duration:${spinDuration}s">
          <circle cx="${cx}" cy="${cy}" r="${rOuter}" fill="none" stroke="${orbitStroke}" stroke-width="1.25" />
          ${valenceElectrons.join('')}
        </g>
        <circle class="atom-nucleus" cx="${cx}" cy="${cy}" r="12.5" fill="${coreFill}" stroke="#ffffff" stroke-width="1.4" />
        <text x="${cx}" y="${cy + 4.5}" text-anchor="middle" fill="#ffffff" font-size="12" font-weight="900" font-family="Segoe UI, system-ui, sans-serif">${card.symbol}</text>
      </svg>
    `;
  }

  /**
   * Render a mini animated bonded molecule SVG on an active field compound tile.
   */
  function renderMoleculeClusterSVG(comp) {
    if (V.BattleFormation && typeof V.BattleFormation.renderFieldClusterSVG === 'function') {
      const chemSvg = V.BattleFormation.renderFieldClusterSVG(comp);
      if (chemSvg) return chemSvg;
    }
    const elems = comp.elements || [];
    if (elems.length === 0) return '';

    const w = 96;
    const h = 48;
    const cx = w / 2;
    const cy = h / 2;

    // Choose central atom (highest bonding capacity / non-H / first element)
    let centerIdx = 0;
    if (elems.length >= 3) {
      let bestScore = -1;
      for (let i = 0; i < elems.length; i++) {
        const s = elems[i].symbol === 'H' ? 0 : (elems[i].valence === 4 ? 10 : elems[i].valence === 5 ? 8 : elems[i].valence === 6 ? 7 : 5);
        if (s > bestScore) {
          bestScore = s;
          centerIdx = i;
        }
      }
    }

    const nodes = [];
    const bonds = [];

    if (elems.length === 2) {
      nodes.push({ el: elems[0], x: cx - 22, y: cy, r: 10.5 });
      nodes.push({ el: elems[1], x: cx + 22, y: cy, r: 10.5 });
      bonds.push([nodes[0], nodes[1]]);
    } else {
      const centerEl = elems[centerIdx];
      const centerNode = { el: centerEl, x: cx, y: cy, r: 11 };
      nodes.push(centerNode);
      const others = elems.filter((_, i) => i !== centerIdx);
      const radiusX = others.length >= 4 ? 32 : 28;
      const radiusY = others.length >= 3 ? 16 : 14;
      for (let i = 0; i < others.length; i++) {
        const angle = (Math.PI * 2 * i) / others.length - Math.PI / 6;
        const n = {
          el: others[i],
          x: cx + Math.cos(angle) * radiusX,
          y: cy + Math.sin(angle) * radiusY,
          r: 8.5,
        };
        nodes.push(n);
        bonds.push([centerNode, n]);
      }
    }

    const bondLines = bonds
      .map(([a, b], idx) => {
        const mx = ((a.x + b.x) / 2).toFixed(1);
        const my = ((a.y + b.y) / 2).toFixed(1);
        const isIonic = comp.bondType === 'ionic';
        return `
          <line class="mol-bond" x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"
            stroke="${isIonic ? '#fbbf24' : '#38bdf8'}" stroke-width="2.2"
            stroke-dasharray="${isIonic ? '3 2.5' : 'none'}" opacity="0.85" />
          <circle class="mol-bond-spark" cx="${mx}" cy="${my}" r="2.1" fill="#e0f2fe" style="animation-delay:${idx * 0.22}s" />
        `;
      })
      .join('');

    const atomCircles = nodes
      .map((n) => {
        const gm = V.GROUP_META[n.el.colorGroup || n.el.group] || V.GROUP_META['4A'];
        const fill = n.el.symbol === 'H' ? '#0284c7' : gm.color;
        return `
          <circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${n.r}" fill="${fill}" stroke="#f8fafc" stroke-width="1.2" />
          <text x="${n.x.toFixed(1)}" y="${(n.y + 3.2).toFixed(1)}" text-anchor="middle" fill="#ffffff" font-size="${n.r >= 10 ? 9.5 : 8}" font-weight="900" font-family="Segoe UI, system-ui, sans-serif">${n.el.symbol}</text>
        `;
      })
      .join('');

    const shieldDome = comp.shield
      ? `<ellipse class="mol-shield-dome" cx="${cx}" cy="${cy}" rx="44" ry="21" fill="rgba(34,197,94,0.12)" stroke="${comp.shield.heavyNobleGas ? '#34d399' : '#22c55e'}" stroke-width="1.8" stroke-dasharray="${comp.shield.heavyNobleGas ? '5 3' : 'none'}" />`
      : '';

    return `
      <svg class="mol-cluster-svg ${comp.inactive ? 'mol-inactive' : ''}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
        ${shieldDome}
        ${bondLines}
        ${atomCircles}
      </svg>
    `;
  }

  /**
   * Play transient FX animations on #fx-layer based on state.recentEvents.
   */
  function playGameEvents(events, viewingPlayerIndex) {
    if (!animationsEnabled || !events || events.length === 0) return;
    const layer = document.getElementById('fx-layer');
    if (!layer) return;

    const drawEvents = events.filter((ev) => ev.meta && ev.meta.type === 'CARDS_DRAWN');
    if (drawEvents.length > 0) {
      animateCardDraws(drawEvents, viewingPlayerIndex === undefined ? 0 : viewingPlayerIndex);
    }

    for (const ev of events) {
      const meta = ev.meta;
      if (!meta || !meta.type || meta.type === 'CARDS_DRAWN') continue;

      switch (meta.type) {
        case 'SYNTHESIZE': {
          const handled = V.BattleFormation && V.BattleFormation.presentFromEvent(meta, { viewingPlayerIndex });
          if (!handled) {
            spawnBanner(layer, `⚛ SYNTHESIZED ${meta.formula}`, `+${meta.sp} SP`, 'fx-synth');
          }
          pulseCompoundTile(meta.compoundId, 'fx-tile-synth', `+${meta.sp} SP`);
          break;
        }

        case 'SHIELD':
          spawnBanner(layer, `🛡 ${meta.shield} INERT SHIELD`, 'Protected!', 'fx-shield');
          pulseCompoundTile(meta.compoundId, 'fx-tile-shield', `🛡 ${meta.shield}`);
          break;

        case 'EN_TAKEOVER': {
          const handled = V.BattleFormation && V.BattleFormation.presentFromEvent(meta, { viewingPlayerIndex });
          if (!handled) {
            spawnBanner(
              layer,
              `⚡ EN TAKEOVER: ${meta.attackSymbol} → ${meta.newFormula}`,
              `Displaced ${meta.oldFormula}!`,
              'fx-takeover'
            );
          }
          spawnLightningBurst(layer);
          break;
        }

        case 'ACID_RAIN':
          spawnBanner(layer, `☣ ACID RAIN`, `${meta.formula} dissolved (-${meta.lostSP} SP)`, 'fx-acid');
          spawnParticles(layer, '#84cc16', 18, 'rain');
          break;

        case 'BOND_CLEAVAGE':
          spawnBanner(layer, `✂ BOND CLEAVAGE`, `${meta.formula} severed (-${meta.lostSP} SP)`, 'fx-red');
          spawnLaserSlash(layer);
          break;

        case 'PRECIPITATION':
          spawnBanner(layer, `💎 PRECIPITATION`, `${meta.formula} returned to hand (-${meta.lostSP} SP)`, 'fx-gold');
          spawnParticles(layer, '#facc15', 16, 'rain');
          break;

        case 'IONIZATION_SURGE':
          spawnBanner(layer, `⚡ IONIZATION SURGE`, `Noble Gas Shield shattered!`, 'fx-takeover');
          pulseCompoundTile(meta.compoundId, 'fx-tile-shatter', 'SHIELD BROKEN');
          break;

        case 'REACTION_DELAY':
          spawnBanner(layer, `❄ REACTION DELAY`, `Opponent's next turn frozen!`, 'fx-ice');
          break;

        case 'DIFFUSION':
          spawnBanner(layer, `🌀 DIFFUSION`, `Entropy Event — Hands Swapped!`, 'fx-gold');
          break;

        case 'SALT_CURE':
          spawnBanner(layer, `🧂 SALT CURE!`, `NaCl bonus: +1 SP & Draw 1`, 'fx-synth');
          break;

        case 'RAPID_DECAY':
          spawnBanner(layer, `☢ FRANCIUM RAPID DECAY!`, `Radiation burst — Discard 2!`, 'fx-acid');
          spawnParticles(layer, '#a3e635', 18, 'burst');
          break;

        case 'LUMINESCENCE':
          spawnBanner(layer, `☢ RADIUM LUMINESCENCE`, `Molecules radiate for 2 turns`, 'fx-shield');
          break;

        case 'LIQUID_EMBRITTLEMENT':
          spawnBanner(layer, `💧 LIQUID EMBRITTLEMENT!`, `Gallium shattered ${meta.formula}!`, 'fx-red');
          spawnParticles(layer, '#cbd5e1', 16, 'burst');
          break;

        case 'ALPHA_POISON':
          spawnBanner(layer, `☢ POLONIUM ALPHA POISON`, `Target compound SP halved!`, 'fx-takeover');
          pulseCompoundTile(meta.compoundId, 'fx-tile-shatter', 'HALF SP');
          break;

        case 'SPONTANEOUS_IGNITION':
          spawnBanner(layer, `🔥 SPONTANEOUS IGNITION!`, `Phosphorus + Oxygen heat flash!`, 'fx-gold');
          spawnParticles(layer, '#fb923c', 16, 'burst');
          break;

        case 'ELECTROLYSIS':
          spawnBanner(layer, `⚡ ELECTROLYSIS`, `Split ${meta.formula} & stole ${meta.stolenSymbol}!`, 'fx-takeover');
          spawnLightningBurst(layer);
          break;

        case 'OXIDATION':
          spawnBanner(layer, `🔥 OXIDATION`, `Stripped ${meta.count} Element card${meta.count === 1 ? '' : 's'} from hand!`, 'fx-red');
          spawnParticles(layer, '#fb923c', 14, 'burst');
          break;

        case 'HALF_LIFE_DECAY':
          spawnBanner(layer, `☢ HALF-LIFE DECAY`, `${meta.formula} SP permanently halved!`, 'fx-acid');
          pulseCompoundTile(meta.compoundId, 'fx-tile-shatter', 'HALF SP');
          break;

        case 'BUFFER_SOLUTION':
          spawnBanner(layer, `🧪 BUFFER SOLUTION`, `Entire field protected from Red Events!`, 'fx-shield');
          break;

        case 'EQUILIBRIUM_SHIFT':
          spawnBanner(layer, `⇌ EQUILIBRIUM SHIFT`, `Recycled ${meta.formula} & drew 3 cards!`, 'fx-gold');
          break;

        case 'SYNTHESIS_ACCELERATOR':
          spawnBanner(layer, `⚡ SYNTHESIS ACCELERATOR`, `Bonus 2nd Synthesis unlocked!`, 'fx-synth');
          spawnParticles(layer, '#facc15', 16, 'burst');
          break;

        case 'HYDROCARBON_SYNERGY':
          spawnBanner(layer, `🔥 HYDROCARBON SYNERGY!`, `Methane (CH₄): +2 Bonus SP & Draw 1!`, 'fx-gold');
          spawnParticles(layer, '#f97316', 16, 'burst');
          break;

        case 'RAPID_OXIDATION':
          spawnBanner(layer, `🧲 RAPID OXIDATION!`, `Oxygen rusted ${meta.metal} out of ${meta.formula}!`, 'fx-red');
          spawnParticles(layer, '#fb923c', 14, 'burst');
          break;

        case 'CHLORAMINE_HAZARD':
          spawnBanner(layer, `☣ CHLORAMINE HAZARD!`, `Random discard + -50% SP on next synthesis!`, 'fx-acid');
          spawnParticles(layer, '#a3e635', 16, 'burst');
          break;

        case 'UNSTABLE_PLAYED':
          spawnBanner(layer, `⚠ UNSTABLE ${meta.formula}`, `Must swap 1 element next turn or discard!`, 'fx-gold');
          pulseCompoundTile(meta.compoundId, 'fx-tile-shatter', 'UNSTABLE');
          break;

        case 'STABILIZE_COMPOUND': {
          const handled = V.BattleFormation && V.BattleFormation.presentFromEvent(meta, { viewingPlayerIndex });
          if (!handled) {
            spawnBanner(layer, `⚛ STABILIZED ${meta.formula}!`, `Locked in for +${meta.sp} SP!`, 'fx-synth');
          }
          pulseCompoundTile(meta.compoundId, 'fx-tile-synth', `+${meta.sp} SP`);
          break;
        }

        case 'UNSTABLE_DECAY':
          spawnBanner(layer, `💥 UNSTABLE COLLAPSE!`, `${meta.formula} was not stabilized — discarded!`, 'fx-red');
          spawnParticles(layer, '#f97316', 16, 'burst');
          break;

        default:
          break;
      }
    }
  }

  function spawnBanner(layer, title, subtitle, cls) {
    const existingCount = layer.querySelectorAll('.fx-banner').length;
    const el = document.createElement('div');
    el.className = `fx-banner ${cls || ''}`;
    el.style.top = `${72 + existingCount * 68}px`;
    el.innerHTML = `<div class="fx-banner-title">${title}</div>${subtitle ? `<div class="fx-banner-sub">${subtitle}</div>` : ''}`;
    layer.appendChild(el);
    setTimeout(() => el.remove(), 2850);
  }

  function pulseCompoundTile(compoundId, animClass, floatText) {
    if (!compoundId) return;
    requestAnimationFrame(() => {
      const tile = document.querySelector(`[data-compound-id="${compoundId}"]`);
      if (!tile) return;
      tile.classList.add(animClass);
      if (floatText) {
        const pop = document.createElement('div');
        pop.className = 'fx-float-pop';
        pop.textContent = floatText;
        tile.appendChild(pop);
        setTimeout(() => pop.remove(), 2100);
      }
      setTimeout(() => tile.classList.remove(animClass), 1700);
    });
  }

  function spawnParticles(layer, color, count, mode) {
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = mode === 'rain' ? 'fx-particle fx-rain' : 'fx-particle fx-burst';
      p.style.background = color;
      p.style.boxShadow = `0 0 8px ${color}`;
      if (mode === 'rain') {
        p.style.left = `${15 + Math.random() * 70}%`;
        p.style.top = `${10 + Math.random() * 25}%`;
        p.style.animationDelay = `${(Math.random() * 0.55).toFixed(2)}s`;
      } else {
        const ang = (Math.PI * 2 * i) / count;
        const dist = 60 + Math.random() * 90;
        p.style.left = '50%';
        p.style.top = '45%';
        p.style.setProperty('--dx', `${(Math.cos(ang) * dist).toFixed(0)}px`);
        p.style.setProperty('--dy', `${(Math.sin(ang) * dist).toFixed(0)}px`);
      }
      layer.appendChild(p);
      setTimeout(() => p.remove(), 1850);
    }
  }

  function spawnLightningBurst(layer) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'fx-lightning-svg');
    svg.setAttribute('viewBox', '0 0 400 220');
    svg.innerHTML = `
      <polyline points="20,190 110,130 95,155 215,85 198,110 375,30"
        fill="none" stroke="#c084fc" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" opacity="0.85" />
      <polyline points="20,190 110,130 95,155 215,85 198,110 375,30"
        fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
    `;
    layer.appendChild(svg);
    spawnParticles(layer, '#c084fc', 14, 'burst');
    setTimeout(() => svg.remove(), 1450);
  }

  function spawnLaserSlash(layer) {
    const slash = document.createElement('div');
    slash.className = 'fx-laser-slash';
    layer.appendChild(slash);
    spawnParticles(layer, '#f87171', 12, 'burst');
    setTimeout(() => slash.remove(), 1300);
  }

  V.EVENT_ART_MAP = EVENT_ART_MAP;
  V.getEventArtPath = getEventArtPath;
  V.getProfileMeta = getProfileMeta;
  V.renderPortraitSVG = renderPortraitSVG;
  V.playPreMatchIntro = playPreMatchIntro;
  V.animateCardDraws = animateCardDraws;
  V.renderAtomSVG = renderAtomSVG;
  V.renderMoleculeClusterSVG = renderMoleculeClusterSVG;
  V.playGameEvents = playGameEvents;
  V.setAnimationsEnabled = setAnimationsEnabled;
  V.isAnimationsEnabled = isAnimationsEnabled;
})(typeof window !== 'undefined' ? window : globalThis);

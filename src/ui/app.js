// VALENCY — Interactive Table UI Controller
// Connects the pure rules engine (gameEngine.js) and AI (ai.js) to the DOM.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  let state = null;
  let selectedCardIds = [];
  let statusMessage = '';
  let statusTone = 'normal'; // 'normal' | 'valid' | 'error'
  let aiTimer = null;
  let showcaseTimer = null;
  let awaitingPassCurtain = false;
  let activeTutorialIndex = null;
  let lessonDoneAnnounced = false;
  let activeStoryMission = null;
  let storyTelemetryTracker = null;
  let activeFrontierEncounterId = null;
  let activeOpponentRig = null;
  let activeOpponentExpression = 'neutral';
  let oppExpressionResetTimer = null;
  let battleReactionState = {
    battleStartTs: 0,
    lastReactionTs: 0,
    lastReactionExpr: 'neutral',
    lastGlitchTs: 0,
    prevPlayerSP: 0,
    prevOppSP: 0,
  };

  function resetBattleReactionState() {
    battleReactionState = {
      battleStartTs: Date.now(),
      lastReactionTs: 0,
      lastReactionExpr: 'neutral',
      lastGlitchTs: 0,
      prevPlayerSP: 0,
      prevOppSP: 0,
    };
  }

  function clearOpponentRig() {
    if (oppExpressionResetTimer) {
      clearTimeout(oppExpressionResetTimer);
      oppExpressionResetTimer = null;
    }
    if (activeOpponentRig) {
      const container = activeOpponentRig.container;
      activeOpponentRig.destroy();
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
      activeOpponentRig = null;
    }
    activeOpponentExpression = 'neutral';
    resetBattleReactionState();
  }

  let currentMode = 'vs_ai';
  let activeSidebarTab = 'hints'; // 'hints' | 'log'
  let sidebarCollapsed = false;

  // DOM References
  const elMenuScreen = document.getElementById('menu-screen');
  const elAppShell = document.getElementById('app');
  const elMainLayout = document.getElementById('main-layout');
  const elSidebar = document.getElementById('sidebar');
  const elTurnBanner = document.getElementById('turn-banner');
  const elTutorialBanner = document.getElementById('tutorial-banner');
  const elOpponentZone = document.getElementById('opponent-zone');
  const elCenterBench = document.getElementById('center-bench');
  const elPlayerZone = document.getElementById('player-zone');
  const elRecipeHints = document.getElementById('recipe-hints');
  const elRecipeCount = document.getElementById('recipe-count');
  const elReactionLog = document.getElementById('reaction-log');
  const elModalRoot = document.getElementById('modal-root');
  const elCurtainRoot = document.getElementById('curtain-root');
  const elShowcaseRoot = document.getElementById('showcase-root');

  function clearAITimer() {
    if (aiTimer) {
      clearTimeout(aiTimer);
      aiTimer = null;
    }
    if (showcaseTimer) {
      clearTimeout(showcaseTimer);
      showcaseTimer = null;
    }
    if (elShowcaseRoot) {
      elShowcaseRoot.classList.add('hidden');
      elShowcaseRoot.classList.remove('showcase-exit');
      elShowcaseRoot.innerHTML = '';
    }
  }

  function showMenuScreen() {
    clearAITimer();
    clearOpponentRig();
    activeTutorialIndex = null;
    lessonDoneAnnounced = false;
    activeStoryMission = null;
    storyTelemetryTracker = null;
    activeFrontierEncounterId = null;
    selectedCardIds = [];
    awaitingPassCurtain = false;
    closeModal();
    hideCurtain();
    const introRoot = document.getElementById('intro-root');
    if (introRoot) {
      introRoot.classList.add('hidden');
      introRoot.innerHTML = '';
    }
    if (elAppShell) elAppShell.classList.add('hidden');
    if (elMenuScreen) elMenuScreen.classList.remove('hidden');
    if (V.Visual && V.Visual.applyScene) V.Visual.applyScene('main_menu');
    if (V.Sound && V.Sound.requestScene) V.Sound.requestScene('main_menu');
    else if (V.Sound && V.Sound.setMusicMode) V.Sound.setMusicMode('menu');
    syncPreferenceButtons();
  }

  function showMatchScreen(musicMode, visualScene) {
    if (elMenuScreen) elMenuScreen.classList.add('hidden');
    if (elAppShell) elAppShell.classList.remove('hidden');
    const targetVisual = visualScene || (musicMode === 'tutorial' ? 'tutorial' : 'classic_battle');
    if (V.Visual && V.Visual.applyScene) V.Visual.applyScene(targetVisual);
    const targetAudio = musicMode || currentMode || 'classic_ai';
    if (V.Sound && V.Sound.requestScene) V.Sound.requestScene(targetAudio);
    else if (V.Sound && V.Sound.setMusicMode) V.Sound.setMusicMode(targetAudio);
    syncPreferenceButtons();
  }

  function startNewGame(mode) {
    clearAITimer();
    clearOpponentRig();
    currentMode = mode || currentMode || 'vs_ai';
    selectedCardIds = [];
    statusMessage = '';
    statusTone = 'normal';
    awaitingPassCurtain = false;
    activeTutorialIndex = null;
    lessonDoneAnnounced = false;
    activeStoryMission = null;
    storyTelemetryTracker = null;
    activeFrontierEncounterId = null;
    closeModal();
    hideCurtain();
    showMatchScreen(currentMode);

    state = V.createGame({
      mode: currentMode,
      p1Name: currentMode === 'pass_and_play' ? 'Player 1' : 'You',
      p2Name: currentMode === 'pass_and_play' ? 'Player 2' : 'Dr. Mendeleev (AI)',
    });

    // Render board first, holding the opening deal events until the Pre-Match VS Intro completes
    renderAll(true);

    if (V.playPreMatchIntro) {
      V.playPreMatchIntro(state.players, state.mode, () => {
        flushFX();
        maybeScheduleAI();
      });
    } else {
      flushFX();
      maybeScheduleAI();
    }
  }

  function startStoryEncounter(mission) {
    if (!mission || !V.Story) return;
    clearAITimer();
    clearOpponentRig();
    currentMode = 'vs_ai';
    selectedCardIds = [];
    statusMessage = '';
    statusTone = 'normal';
    awaitingPassCurtain = false;
    activeTutorialIndex = null;
    lessonDoneAnnounced = false;
    activeStoryMission = mission;
    storyTelemetryTracker = V.Story.createTelemetryTracker();
    activeFrontierEncounterId = null;
    const sci = mission.scientistId ? V.Story.getScientistProfile(mission.scientistId) : null;
    const oppCfg = V.Story.getOpponentConfig(mission.opponentConfigId);
    const storyMusicMode = (sci && sci.musicThemeRef) || 'scientist_proctor';
    closeModal();
    hideCurtain();
    showMatchScreen(storyMusicMode, 'academy_exam');

    const opponentName = sci ? sci.displayName : (mission.opponentDisplayName || 'Academy Proctor');
    const resolvedStoryAnimatedId = V.CharacterRegistry
      ? V.CharacterRegistry.resolveCharacterId({ storyMissionId: mission.missionId })
      : null;
    const storyOpponentMeta = {
      portraitRef: sci ? sci.portraitRef : (mission.opponentPortraitRef || 'proctor'),
      animatedPortraitId: resolvedStoryAnimatedId,
      storyMissionId: mission.missionId,
      title: oppCfg ? oppCfg.strategyProfile : 'Academy Simulation',
      specialty: sci ? sci.specialty : 'Comprehensive Academy Licensure',
      badge: oppCfg ? `${oppCfg.difficulty} Simulation` : 'Academy Exam',
    };

    // Reuse the single canonical rules engine (ZERO engine duplication, ZERO unfair advantages)
    state = V.createGame({
      mode: 'vs_ai',
      p1Name: 'You (Candidate)',
      p2Name: opponentName,
    });
    state.opponentConfigId = mission.opponentConfigId;
    state.storyMissionId = mission.missionId;
    state.storyOpponentMeta = storyOpponentMeta;

    renderAll(true);

    if (V.playPreMatchIntro) {
      V.playPreMatchIntro(state.players, state.mode, () => {
        flushFX();
        maybeScheduleAI();
      }, storyOpponentMeta);
    } else {
      flushFX();
      maybeScheduleAI();
    }
  }

  function startFrontierEncounter(encounterId) {
    if (!encounterId || !V.Frontier || !V.Frontier.EncounterManager) return;
    clearAITimer();
    clearOpponentRig();
    currentMode = 'vs_ai';
    selectedCardIds = [];
    statusMessage = '';
    statusTone = 'normal';
    awaitingPassCurtain = false;
    activeTutorialIndex = null;
    lessonDoneAnnounced = false;
    activeStoryMission = null;
    storyTelemetryTracker = null;
    activeFrontierEncounterId = encounterId;

    const profile = V.Frontier.PlayerProfile.loadProfile();
    const activeExp = V.Frontier.ExpeditionManager.loadActiveExpedition();
    const init = V.Frontier.EncounterManager.initializeEncounterBattle(profile, activeExp, encounterId);
    if (!init.ok) return;

    closeModal();
    hideCurtain();
    showMatchScreen(init.encounter.musicThemeRef || 'frontier_encounter_standard', 'frontier_encounter');

    state = init.battleState;
    renderAll(true);

    if (V.playPreMatchIntro) {
      V.playPreMatchIntro(state.players, state.mode, () => {
        flushFX();
        maybeScheduleAI();
      }, state.storyOpponentMeta);
    } else {
      flushFX();
      maybeScheduleAI();
    }
  }

  function getViewingPlayerIndex() {
    if (state.mode === 'pass_and_play') {
      return state.activePlayerIndex;
    }
    return 0; // Human always sits at bottom in vs_ai
  }

  function isHumanTurn() {
    if (state.phase === 'GAME_OVER') return false;
    const active = V.getActivePlayer(state);
    return !active.isAI && !awaitingPassCurtain;
  }

  function showOpponentCardShowcase(plan, onFinish) {
    if (!elShowcaseRoot || !plan || !plan.showcaseCards || plan.showcaseCards.length === 0) {
      onFinish();
      return;
    }
    if (V.Sound) V.Sound.playCardSelect(true);

    const compactClass = plan.showcaseCards.length >= 3 ? 'showcase-cards-multi' : '';
    const cardsHTML = plan.showcaseCards.map((c) => renderCardHTML(c, true)).join('');

    elShowcaseRoot.innerHTML = `
      <div class="showcase-panel">
        <div class="showcase-header">
          <span class="showcase-badge">OPPONENT PLAYS</span>
          <h3 class="showcase-headline">${escapeHtml(plan.headline || 'Opponent Action')}</h3>
          ${plan.subtitle ? `<div class="showcase-sub">${escapeHtml(plan.subtitle)}</div>` : ''}
        </div>
        <div class="showcase-cards ${compactClass}">${cardsHTML}</div>
        <div class="showcase-timer-track"><div class="showcase-timer-fill"></div></div>
      </div>
    `;
    elShowcaseRoot.classList.remove('hidden', 'showcase-exit');

    // Display the opponent's played card(s) for 2 full seconds BEFORE playing the animation & proceeding!
    showcaseTimer = setTimeout(() => {
      elShowcaseRoot.classList.add('showcase-exit');
      showcaseTimer = setTimeout(() => {
        elShowcaseRoot.classList.add('hidden');
        elShowcaseRoot.classList.remove('showcase-exit');
        elShowcaseRoot.innerHTML = '';
        showcaseTimer = null;
        onFinish();
      }, 220);
    }, 2000);
  }

  function maybeScheduleAI(initialDelayMs) {
    clearAITimer();
    if (!state || state.phase === 'GAME_OVER') return;
    const active = V.getActivePlayer(state);
    if (!active.isAI) return;

    const thinkDelay = initialDelayMs || 1200;

    aiTimer = setTimeout(() => {
      if (!state || state.phase === 'GAME_OVER' || !V.getActivePlayer(state).isAI) return;
      const prevPlayer = state.activePlayerIndex;
      const plan = V.planAIStep ? V.planAIStep(state) : null;

      function executePlannedMove() {
        const res = plan ? plan.execute() : V.runAIStep(state);
        selectedCardIds = [];

        const latestLog = state.log && state.log[0] ? state.log[0].message : '';
        if (latestLog && state.phase !== 'GAME_OVER') {
          setStatus(latestLog, res && res.action === 'end_turn' ? 'normal' : 'valid');
        }

        renderAll();

        if (state.phase === 'GAME_OVER') {
          return;
        }

        if (V.getActivePlayer(state).isAI) {
          const nextDelay = res && res.action === 'pass_synthesis' ? 1100 : 2100;
          maybeScheduleAI(nextDelay);
        } else if (prevPlayer !== state.activePlayerIndex) {
          if (V.Sound) V.Sound.playTurnChime();
          setStatus('Your turn! Select elements in your hand to synthesize a real compound, or Pass to Phase 3.', 'normal');
          renderCenterBench();
        }
      }

      if (plan && plan.showcaseCards && plan.showcaseCards.length > 0) {
        setStatus(plan.headline, 'valid');
        renderCenterBench();
        showOpponentCardShowcase(plan, executePlannedMove);
      } else {
        executePlannedMove();
      }
    }, thinkDelay);
  }

  function setStatus(msg, tone) {
    statusMessage = msg || '';
    statusTone = tone || 'normal';
  }

  // ===== RENDER PIPELINE =====
  const SEVERE_DISRUPTION_EVENTS = [
    'ACID_RAIN',
    'BOND_CLEAVAGE',
    'EN_TAKEOVER',
    'ELECTROLYSIS',
    'PRECIPITATION',
    'HALF_LIFE_DECAY',
    'RAPID_OXIDATION',
    'LIQUID_EMBRITTLEMENT',
    'CHLORAMINE_HAZARD',
  ];
  const TACTICAL_DISRUPTION_EVENTS = ['OXIDATION', 'IONIZATION_SURGE', 'REACTION_DELAY', 'TURN_SKIPPED'];

  /**
   * Pure Stage 3D.4 presentation-only reaction evaluator.
   * Translates canonical gameplay events + SP context into a restrained opponent expression
   * with priority ranking, global cooldowns, same-expression deduplication, and strict
   * Frontier-only reconstruction instability enforcement. Zero effect on game rules.
   */
  function evaluateBattlePortraitReaction(batch, ctx) {
    const c = ctx || {};
    const now = typeof c.now === 'number' ? c.now : Date.now();
    const aiFamily = c.aiFamily || 'FRONTIER';
    const characterId = c.characterId || '';
    const isMendeleev = characterId.indexOf('sci_men_') === 0;
    const manifestObj = c.manifest || (characterId && V.CharacterRig && V.CharacterRig.getCharacterManifest ? V.CharacterRig.getCharacterManifest(characterId) : null);
    const rxCfg = Object.assign(
      isMendeleev
        ? {
            playerHighSynthMinSP: 14,
            onPlayerHighSynth: aiFamily === 'INSTITUTE' ? 'thoughtful' : 'concerned',
            onPlayerMidSynth: 'thoughtful',
            onPlayerLowSynth: aiFamily === 'FRONTIER' ? 'disappointed' : 'thoughtful',
            onUnexpectedReaction: 'thoughtful',
            onOwnShield: 'amused',
            onOwnHighSynth: 'amused',
            onOwnStandardSynth: 'explaining',
          }
        : {
            playerHighSynthMinSP: 12,
            onPlayerHighSynth: 'concerned',
            onPlayerMidSynth: 'thoughtful',
            onPlayerLowSynth: 'amused',
            onUnexpectedReaction: null,
            onOwnShield: null,
            onOwnHighSynth: 'amused',
            onOwnStandardSynth: 'explaining',
          },
      (manifestObj && manifestObj.battleReactions) || {},
      c.battleReactions || {}
    );
    const rState = c.reactionState || {
      battleStartTs: 0,
      lastReactionTs: 0,
      lastReactionExpr: 'neutral',
      lastGlitchTs: 0,
      prevPlayerSP: 0,
      prevOppSP: 0,
    };
    const p0SP = typeof c.playerSP === 'number' ? c.playerSP : 0;
    const p1SP = typeof c.oppSP === 'number' ? c.oppSP : 0;
    const oppSPDrop = Math.max(0, (rState.prevOppSP || 0) - p1SP);
    const prevLead = (rState.prevPlayerSP || 0) - (rState.prevOppSP || 0);
    const curLead = p0SP - p1SP;

    const nextState = Object.assign({}, rState, {
      prevPlayerSP: p0SP,
      prevOppSP: p1SP,
    });

    if (!batch || batch.length === 0) {
      return { action: 'none', nextState };
    }

    let bestExpr = null;
    let bestPriority = 0; // 1 = synthesis, 2 = advantage loss, 3 = disruption, 4 = frontier instability
    let severeHitSP = 0;

    function consider(expr, priority) {
      if (expr && priority > bestPriority) {
        bestExpr = expr;
        bestPriority = priority;
      }
    }

    const UNEXPECTED_REACTION_EVENTS = [
      'HYDROCARBON_SYNERGY',
      'SALT_CURE',
      'LUMINESCENCE',
      'RESONANCE_STABILIZER',
      'EQUILIBRIUM_SHIFT',
    ];

    for (const ev of batch) {
      const m = ev && ev.meta;
      if (!m) continue;
      const targetsOpp = m.victimId === 1 || (m.victimId === undefined && m.playerId === 0);

      if (SEVERE_DISRUPTION_EVENTS.includes(m.type) && targetsOpp) {
        severeHitSP = Math.max(severeHitSP, Number(m.lostSP) || 0);
        consider(severeHitSP >= 8 ? 'disappointed' : 'irritated', 3);
      } else if (TACTICAL_DISRUPTION_EVENTS.includes(m.type) && targetsOpp) {
        consider('concerned', 3);
      } else if ((m.type === 'UNSTABLE_DECAY' || m.type === 'ASTATINE_DECAY') && m.playerId === 1) {
        consider('disappointed', 2);
      } else if (rxCfg.onUnexpectedReaction && UNEXPECTED_REACTION_EVENTS.includes(m.type) && m.playerId === 0) {
        consider(rxCfg.onUnexpectedReaction, 1);
      } else if (rxCfg.onOwnShield && m.type === 'SHIELD' && m.playerId === 1) {
        consider(rxCfg.onOwnShield, 1);
      } else if ((m.type === 'SYNTHESIZE' || m.type === 'STABILIZE_COMPOUND') && m.playerId === 0) {
        const sp = Number(m.sp) || 0;
        const hiMin = Number(rxCfg.playerHighSynthMinSP) || 12;
        if (sp >= hiMin) consider(rxCfg.onPlayerHighSynth, 1);
        else if (sp >= 7) consider(rxCfg.onPlayerMidSynth, 1);
        else consider(rxCfg.onPlayerLowSynth, 1);
      } else if ((m.type === 'SYNTHESIZE' || m.type === 'STABILIZE_COMPOUND') && m.playerId === 1) {
        const sp = Number(m.sp) || 0;
        consider(sp >= 10 ? rxCfg.onOwnHighSynth : rxCfg.onOwnStandardSynth, 1);
      }
    }

    // Strategic advantage loss or endgame deficit detection (lost >= 6 SP, lead lost, or player >= 16 SP ahead by >= 6)
    if (oppSPDrop >= 6 || (curLead >= 6 && prevLead < 6) || (p0SP >= 16 && curLead >= 6)) {
      consider('disappointed', 2);
    }

    // Rare Frontier-only reconstruction instability under heavy pressure (strictly 0 on Institute)
    const heavyFrontierPressure =
      aiFamily === 'FRONTIER' &&
      (now - (rState.lastGlitchTs || 0) >= 14000) &&
      ((oppSPDrop >= 8) || (p0SP >= 16 && curLead >= 6) || (p0SP >= 18 && bestPriority >= 1));

    if (heavyFrontierPressure) {
      nextState.lastReactionTs = now;
      nextState.lastReactionExpr = 'instability';
      nextState.lastGlitchTs = now;
      return {
        action: 'react',
        expression: 'instability',
        triggerGlitch: true,
        holdMs: 3000,
        priority: 4,
        nextState,
      };
    }

    if (!bestExpr) {
      return { action: 'none', nextState };
    }

    // Battle-start composed neutral grace window (ignore low-priority chatter during first 1.8s)
    if (bestPriority < 3 && rState.battleStartTs && now - rState.battleStartTs < 1800) {
      return { action: 'cooldown', reason: 'battle_start_grace', nextState };
    }

    // Global cooldown (1.1s for disruptions, 2.2s for synthesis/advantage shifts)
    const elapsed = now - (rState.lastReactionTs || 0);
    const minCooldown = bestPriority >= 3 ? 1100 : 2200;
    if (rState.lastReactionTs > 0 && elapsed < minCooldown) {
      return { action: 'cooldown', reason: 'global_cooldown', nextState };
    }

    // Same-expression deduplication (avoid spamming identical expression within 4.5s)
    if (bestExpr === rState.lastReactionExpr && rState.lastReactionTs > 0 && elapsed < 4500) {
      return { action: 'cooldown', reason: 'same_expression_dedup', nextState };
    }

    nextState.lastReactionTs = now;
    nextState.lastReactionExpr = bestExpr;
    return {
      action: 'react',
      expression: bestExpr,
      triggerGlitch: false,
      holdMs: bestPriority >= 3 ? 2900 : (bestPriority === 2 ? 2800 : 2400),
      priority: bestPriority,
      nextState,
    };
  }

  V.evaluateBattlePortraitReaction = evaluateBattlePortraitReaction;

  function resolveAnimatedOpponentForState() {
    if (!state || !V.CharacterRig) return null;
    if (V.CharacterRegistry && typeof V.CharacterRegistry.resolveForBattleState === 'function') {
      return V.CharacterRegistry.resolveForBattleState(state);
    }
    const fallbackId = state.storyOpponentMeta && state.storyOpponentMeta.animatedPortraitId;
    if (!fallbackId) return null;
    const manifest = V.CharacterRig.getCharacterManifest(fallbackId);
    return manifest ? { characterId: fallbackId, manifest } : null;
  }

  function reactOpponentPortraitToEvents(batch) {
    if (!activeOpponentRig || !batch || batch.length === 0) return;
    const p0SP = state && state.players && V.getPlayerSP ? V.getPlayerSP(state.players[0]) : 0;
    const p1SP = state && state.players && V.getPlayerSP ? V.getPlayerSP(state.players[1]) : 0;
    const aiFamily = (activeOpponentRig.manifest && activeOpponentRig.manifest.aiFamily) || 'FRONTIER';

    const decision = evaluateBattlePortraitReaction(batch, {
      now: Date.now(),
      aiFamily,
      characterId: activeOpponentRig.characterId || '',
      manifest: activeOpponentRig.manifest || null,
      playerSP: p0SP,
      oppSP: p1SP,
      reactionState: battleReactionState,
    });
    battleReactionState = decision.nextState;

    if (decision.action !== 'react') return;

    activeOpponentExpression = decision.expression;
    activeOpponentRig.setExpression(decision.expression);
    if (decision.triggerGlitch) {
      activeOpponentRig.triggerReconstructionGlitch();
    }

    if (oppExpressionResetTimer) clearTimeout(oppExpressionResetTimer);
    oppExpressionResetTimer = setTimeout(() => {
      activeOpponentExpression = 'neutral';
      if (activeOpponentRig && !activeOpponentRig.destroyed) {
        activeOpponentRig.setExpression('neutral');
      }
    }, decision.holdMs || 2600);
  }

  function flushFX() {
    if (state && state.recentEvents && state.recentEvents.length > 0) {
      const batch = state.recentEvents.splice(0, state.recentEvents.length);
      if (V.playGameEvents) V.playGameEvents(batch, getViewingPlayerIndex());
      if (V.Sound) V.Sound.playSoundsForEvents(batch);
      reactOpponentPortraitToEvents(batch);
    }
  }

  function renderAll(deferFX) {
    if (activeStoryMission && storyTelemetryTracker && V.Story && state) {
      V.Story.updateTelemetryFromState(storyTelemetryTracker, state, 0);
    }
    renderTopBanner();
    renderTutorialBanner();
    renderZones();
    renderCenterBench();
    renderRecipeHints();
    renderLog();
    renderPendingPromptModal();
    if (!deferFX) {
      flushFX();
    }
    if (state.phase === 'GAME_OVER') {
      openVictoryModal();
    }
  }

  function renderTopBanner() {
    const active = V.getActivePlayer(state);
    const isMobile = typeof document !== 'undefined' && document.body && document.body.classList.contains('valency-mobile');
    let phaseLabel = isMobile ? 'Synth' : 'Phase 2: Synthesis';
    let phaseClass = 'phase-synthesis';
    if (state.phase === 'DEFENSE') {
      phaseLabel = isMobile ? 'Def' : 'Phase 3: Defense & Events';
      phaseClass = 'phase-defense';
    } else if (state.phase === 'GAME_OVER') {
      phaseLabel = isMobile ? 'Done' : 'Match Complete';
      phaseClass = 'phase-gameover';
    }

    if (isMobile) {
      const shortWho = active.id === 0 && state.mode === 'vs_ai'
        ? 'You'
        : active.name.replace(/^Simulation:\s*/i, '').split(' ').slice(-1)[0];
      elTurnBanner.innerHTML = `
        <span class="mobile-turn-who">T${state.turnNumber}·${escapeHtml(shortWho)}</span>
        <span class="phase-badge ${phaseClass}">${phaseLabel}</span>
      `;
      return;
    }

    elTurnBanner.innerHTML = `
      <span>Turn ${state.turnNumber}</span>
      <span>•</span>
      <span>${escapeHtml(active.name)}'s Turn</span>
      <span class="phase-badge ${phaseClass}">${phaseLabel}</span>
    `;
  }

  /**
   * Determine interactive targeting hints for Phase 3 based on the currently selected card in hand.
   */
  function getPhase3TargetContext() {
    if (!isHumanTurn() || state.phase !== 'DEFENSE' || selectedCardIds.length !== 1) {
      return { mode: 'none', card: null, validTargets: new Map() };
    }
    const active = V.getActivePlayer(state);
    const opponent = V.getOpponent(state);
    const card = active.hand.find((c) => c.id === selectedCardIds[0]);
    if (!card) return { mode: 'none', card: null, validTargets: new Map() };

    const validTargets = new Map(); // compoundId -> { ownerIdx, payload }

    if (card.kind === 'noble_gas') {
      for (const comp of active.field) {
        if (!comp.inactive && !comp.shield) {
          validTargets.set(comp.id, { ownerIdx: active.id, kind: 'shield' });
        }
      }
      return { mode: 'shield', card, validTargets };
    }

    if (card.effectId === 'RESONANCE_STABILIZER') {
      for (const comp of active.field) {
        if (!comp.inactive && !comp.resonanceCard) {
          validTargets.set(comp.id, { ownerIdx: active.id, kind: 'resonance' });
        }
      }
      return { mode: 'resonance', card, validTargets };
    }

    if (card.effectId === 'EQUILIBRIUM_SHIFT') {
      for (const comp of active.field) {
        validTargets.set(comp.id, { ownerIdx: active.id, kind: 'equilibrium' });
      }
      return { mode: 'equilibrium', card, validTargets };
    }

    if (card.effectId === 'IONIZATION_SURGE') {
      if (!opponent.bufferProtected) {
        for (const comp of opponent.field) {
          if (!comp.inactive && comp.shield) {
            validTargets.set(comp.id, { ownerIdx: opponent.id, kind: 'hostile' });
          }
        }
      }
      return { mode: 'hostile', card, validTargets, blockedByBuffer: opponent.bufferProtected };
    }

    if (
      card.effectId === 'ACID_RAIN' ||
      card.effectId === 'BOND_CLEAVAGE' ||
      card.effectId === 'PRECIPITATION' ||
      card.effectId === 'ELECTROLYSIS' ||
      card.effectId === 'HALF_LIFE_DECAY'
    ) {
      if (!opponent.bufferProtected) {
        for (const comp of opponent.field) {
          if (!comp.inactive && !comp.shield && !(card.effectId === 'HALF_LIFE_DECAY' && comp.decayHalved)) {
            validTargets.set(comp.id, { ownerIdx: opponent.id, kind: 'hostile' });
          }
        }
      }
      return { mode: 'hostile', card, validTargets, blockedByBuffer: opponent.bufferProtected };
    }

    if (card.kind === 'element') {
      // Electronegativity Displacement across BOTH opponent's and own field!
      for (const p of state.players) {
        for (const comp of p.field) {
          const moves = V.findENTakeoversForCard(card, active.hand, comp);
          if (moves.length > 0) {
            validTargets.set(comp.id, { ownerIdx: p.id, kind: 'takeover', moves });
          }
        }
      }
      return { mode: 'takeover', card, validTargets };
    }

    if (
      card.effectId === 'DIFFUSION' ||
      card.effectId === 'DISTILLATION' ||
      card.effectId === 'THERMAL_ACTIVATION' ||
      card.effectId === 'REACTION_DELAY' ||
      card.effectId === 'BUFFER_SOLUTION' ||
      card.effectId === 'SYNTHESIS_ACCELERATOR' ||
      card.effectId === 'OXIDATION'
    ) {
      return { mode: 'instant_play', card, validTargets };
    }

    return { mode: 'none', card, validTargets };
  }

  function renderZones() {
    const viewIdx = getViewingPlayerIndex();
    const oppIdx = viewIdx === 0 ? 1 : 0;
    const bottomPlayer = state.players[viewIdx];
    const topPlayer = state.players[oppIdx];
    const targetCtx = getPhase3TargetContext();

    // Top (Opponent) Zone
    elOpponentZone.className = `player-zone opponent-zone ${state.activePlayerIndex === topPlayer.id ? 'active-turn' : ''}`;
    elOpponentZone.innerHTML = `
      ${renderZoneHeader(topPlayer, true)}
      ${renderFieldRow(topPlayer, targetCtx)}
    `;

    // Mount or persistently re-attach decoupled animated portrait into Opponent Header (ZERO flicker across turns!)
    const resolvedOpp = resolveAnimatedOpponentForState();
    const animSlot = document.getElementById('battle-opp-animated-portrait-slot');
    if (animSlot && resolvedOpp && V.CharacterRig) {
      if (activeOpponentRig && !activeOpponentRig.destroyed && activeOpponentRig.characterId === resolvedOpp.characterId && activeOpponentRig.container) {
        animSlot.replaceWith(activeOpponentRig.container);
      } else {
        clearOpponentRig();
        const mountEl = document.createElement('div');
        mountEl.id = 'battle-opp-animated-portrait';
        mountEl.title = resolvedOpp.manifest.constructTitle || resolvedOpp.manifest.displayName;
        animSlot.replaceWith(mountEl);
        activeOpponentRig = V.CharacterRig.mount(mountEl, {
          characterId: resolvedOpp.characterId,
          size: 'mini',
          expression: activeOpponentExpression || 'neutral',
        });
      }
    } else if (activeOpponentRig) {
      clearOpponentRig();
    }

    // Bottom (Viewing Player) Zone
    elPlayerZone.className = `player-zone bottom-zone ${state.activePlayerIndex === bottomPlayer.id ? 'active-turn' : ''}`;
    elPlayerZone.innerHTML = `
      ${renderZoneHeader(bottomPlayer, false)}
      ${renderFieldRow(bottomPlayer, targetCtx)}
      <div class="hand-header">
        <span><strong>${escapeHtml(bottomPlayer.name)}'s Hand</strong> (${bottomPlayer.hand.length} cards)</span>
        <span>${getHandInstructionText()}</span>
      </div>
      <div class="hand-row" id="player-hand-row">
        ${bottomPlayer.hand.map((card) => renderCardHTML(card)).join('')}
      </div>
    `;

    // Bind compound click targets
    document.querySelectorAll('[data-compound-id]').forEach((node) => {
      const compId = node.getAttribute('data-compound-id');
      if (targetCtx.validTargets.has(compId)) {
        node.addEventListener('click', () => handleCompoundTargetClick(compId, targetCtx));
      }
    });

    // Bind hand card clicks & inspect zoom buttons
    document.querySelectorAll('#player-hand-row [data-card-id]').forEach((node) => {
      const cardId = node.getAttribute('data-card-id');
      node.addEventListener('click', () => handleHandCardClick(cardId));
    });
    document.querySelectorAll('[data-inspect-card]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const cid = btn.getAttribute('data-inspect-card');
        const card = findCardAnywhere(cid);
        if (card) openCardInspectorModal(card);
      });
    });
    document.querySelectorAll('[data-unbond-h2]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isHumanTurn()) return;
        const compId = btn.getAttribute('data-unbond-h2');
        const res = V.unbondH2(state, compId);
        if (res.ok) {
          setStatus('Unbonded H₂ — both Hydrogen cards returned to your hand!', 'valid');
          renderAll();
        }
      });
    });
    document.querySelectorAll('[data-stabilize-id]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isHumanTurn()) return;
        const compId = btn.getAttribute('data-stabilize-id');
        handleStabilizeUnstableClick(compId);
      });
    });
  }

  function findCardAnywhere(cardId) {
    if (!state) return null;
    for (const p of state.players) {
      const inHand = p.hand.find((c) => c.id === cardId);
      if (inHand) return inHand;
    }
    const inDisc = state.discardPile.find((c) => c.id === cardId);
    if (inDisc) return inDisc;
    return null;
  }

  function getHandInstructionText() {
    if (!isHumanTurn()) return `Waiting for ${V.getActivePlayer(state).name}...`;
    if (state.phase === 'SYNTHESIS') {
      return 'Phase 2: Click 2+ Element cards (+ optional Catalyst / Chain Reaction / Exothermic Surge) to synthesize.';
    }
    if (state.phase === 'DEFENSE') {
      return 'Phase 3: Click 1 Noble Gas, Event/Instance card, or high-EN Element (for EN Takeover).';
    }
    return '';
  }

  function renderZoneHeader(player, isTop) {
    const sp = V.getPlayerSP(player);
    const pct = Math.min(100, Math.round((sp / state.winSP) * 100));
    const hasLead = V.hasLeadProtection(player);

    const chips = [];
    if (player.bufferProtected) {
      chips.push(`<span class="status-chip chip-radium">🧪 Buffer Protected</span>`);
    }
    if (player.luminescenceTurns > 0) {
      chips.push(`<span class="status-chip chip-radium">☢ Luminescence (${player.luminescenceTurns}t)</span>`);
    }
    if (hasLead) {
      chips.push(`<span class="status-chip chip-lead">🛡 Lead Radiation Shield</span>`);
    }
    if (player.skipNextTurn) {
      chips.push(`<span class="status-chip chip-delay">⏳ Next Turn Skipped</span>`);
    }
    if (player.pendingDecayDiscard > 0) {
      chips.push(`<span class="status-chip chip-delay">☢ Decay Discard Next Turn</span>`);
    }
    if (player.chloraminePenalty) {
      chips.push(`<span class="status-chip chip-delay">☣ Chloramine (-50% Next SP)</span>`);
    }

    const oppBacks = isTop
      ? `<div class="opponent-backs" title="${player.hand.length} cards in hand">
          ${Array.from({ length: Math.min(player.hand.length, 10) }).map(() => '<span class="card-back-mini"></span>').join('')}
          <span class="status-chip chip-handcount">${player.hand.length} cards</span>
        </div>`
      : '';

    const profile = V.getProfileMeta ? V.getProfileMeta(player, player.id, state.mode, state.storyOpponentMeta) : null;
    const resolvedOpp = isTop ? resolveAnimatedOpponentForState() : null;
    const avatarHTML = resolvedOpp
      ? '<span id="battle-opp-animated-portrait-slot" class="battle-opp-portrait-slot"></span>'
      : (profile && V.renderPortraitSVG ? V.renderPortraitSVG(profile.key, 'mini-avatar') : '');

    return `
      <div class="zone-header">
        <div class="player-identity">
          ${avatarHTML}
          <div>
            <span class="player-name">${escapeHtml(player.name)}</span>
            ${profile ? `<div class="player-subrole">${escapeHtml(profile.title)}</div>` : ''}
          </div>
          ${chips.join('')}
        </div>
        ${oppBacks}
        <div class="sp-meter">
          <div class="sp-bar-track"><div class="sp-bar-fill" style="width:${pct}%"></div></div>
          <span class="sp-label">${sp} / ${state.winSP} SP</span>
        </div>
      </div>
    `;
  }

  function renderFieldRow(player, targetCtx) {
    if (player.field.length === 0) {
      return `<div class="field-row"><div class="field-empty">No active compounds on ${escapeHtml(player.name)}'s field yet.</div></div>`;
    }

    const tiles = player.field.map((comp) => {
      const sp = V.getCompoundSP(comp);
      const targetInfo = targetCtx.validTargets.get(comp.id);
      const classes = ['compound-tile'];
      if (comp.shield) classes.push('shielded');
      if (comp.inactive) classes.push('inactive');
      if (comp.unstable) classes.push('unstable');
      if (comp.poisonedBy !== null || comp.decayHalved) classes.push('poisoned');
      if (targetInfo) {
        if (targetInfo.kind === 'shield' || targetInfo.kind === 'resonance' || targetInfo.kind === 'equilibrium') classes.push('targetable-shield');
        else if (targetInfo.kind === 'hostile') classes.push('targetable-hostile');
        else if (targetInfo.kind === 'takeover') classes.push('targetable-takeover');
      }

      const badges = [];
      if (comp.shield) {
        const heavyTag = comp.shield.heavyNobleGas ? 'Heavy' : 'F-Proof';
        badges.push(`<span class="comp-badge badge-shield">🛡 ${comp.shield.name} (${heavyTag})</span>`);
      }
      if (comp.resonanceCard) {
        badges.push(`<span class="comp-badge badge-resonance">✦ Resonance</span>`);
      }
      if (comp.exothermicAttached) {
        badges.push(`<span class="comp-badge badge-exo">🔥 +3 SP</span>`);
      }
      if (comp.decayHalved) {
        badges.push(`<span class="comp-badge badge-poison">☢ Half-Life (½ SP)</span>`);
      }
      if (comp.poisonedBy !== null) {
        badges.push(`<span class="comp-badge badge-poison">☢ Poisoned (½ SP)</span>`);
      }
      if (comp.astatineUnstable && !comp.shield) {
        badges.push(`<span class="comp-badge badge-inactive">⏳ Decays Next Turn</span>`);
      }
      if (comp.inactive) {
        badges.push(`<span class="comp-badge badge-inactive">INACTIVE • 0 SP</span>`);
      }
      if (comp.unstable) {
        const deadlineNow = comp.unstableCreatedTurn < state.turnNumber;
        badges.push(
          `<span class="comp-badge badge-unstable">${deadlineNow ? '🔥 SWAP THIS TURN OR DISCARD!' : '⚠ UNSTABLE • Swap Next Turn'}</span>`
        );
        if (isHumanTurn() && player.id === state.activePlayerIndex && V.findUnstableStabilizeSwaps) {
          const swaps = V.findUnstableStabilizeSwaps(comp, player.hand);
          if (swaps.length > 0) {
            badges.push(
              `<button class="comp-stabilize-btn" data-stabilize-id="${comp.id}" title="Swap 1 element from your hand to stabilize this compound!">⇄ Stabilize (${swaps[0].compound.formula})</button>`
            );
          }
        }
      }
      if (targetInfo && targetInfo.kind === 'takeover') {
        const bestMove = targetInfo.moves[0];
        badges.push(`<span class="comp-badge badge-takeover-hint">⚡ Steal → ${bestMove.compound.formula} (+${bestMove.baseSP} SP)</span>`);
      }

      const canUnbondH2 =
        isHumanTurn() &&
        player.id === state.activePlayerIndex &&
        comp.formula === 'H₂' &&
        !comp.inactive;
      if (canUnbondH2) {
        badges.push(`<button class="comp-unbond-btn" data-unbond-h2="${comp.id}" title="Return both H cards to your hand">↺ Unbond H₂</button>`);
      }

      const atoms = comp.elements
        .map((el) => `<span class="atom-pill" title="En ${el.en}, ${el.valence}e⁻">${el.symbol} <small style="opacity:.7">(${el.en})</small></span>`)
        .join('');

      const clusterVisual = V.renderMoleculeClusterSVG ? V.renderMoleculeClusterSVG(comp) : '';

      return `
        <div class="${classes.join(' ')}" data-compound-id="${comp.id}">
          <div class="compound-top">
            <span class="compound-formula">${escapeHtml(comp.formula)}</span>
            <span class="compound-sp">${comp.inactive ? '0 SP' : `+${sp} SP`}</span>
          </div>
          <div class="compound-name">${escapeHtml(comp.name)}</div>
          <div class="compound-visual">${clusterVisual}</div>
          <div class="compound-atoms">${atoms}</div>
          ${badges.length ? `<div class="compound-badges">${badges.join('')}</div>` : ''}
        </div>
      `;
    });

    return `<div class="field-row">${tiles.join('')}</div>`;
  }

  function renderOctetDots(valence, fillColor, isHydrogen) {
    if (isHydrogen) {
      return `<div class="octet-bar"><span class="octet-dot filled" style="background:#0f172a"></span></div>`;
    }
    const dots = [];
    for (let i = 0; i < 8; i++) {
      if (i < valence) {
        dots.push(`<span class="octet-dot filled" style="background:${fillColor}"></span>`);
      } else {
        dots.push(`<span class="octet-dot"></span>`);
      }
    }
    return `<div class="octet-bar" title="${valence} of 8 valence shell slots filled">${dots.join('')}</div>`;
  }

  function renderScrollQuote(quoteText) {
    if (!quoteText) return '';
    return `<div class="vcard-scroll"><em>“${escapeHtml(quoteText)}”</em></div>`;
  }

  function renderCardHTML(card, isInspector) {
    const isSelected = !isInspector && selectedCardIds.includes(card.id);
    const dimmed =
      !isInspector &&
      isHumanTurn() &&
      state &&
      state.phase === 'SYNTHESIS' &&
      (card.kind === 'noble_gas' || card.kind === 'event' || (card.kind === 'instance' && card.timing === 'phase3'));

    const cls = `vcard ${isInspector ? 'vcard-large' : ''} ${isSelected ? 'selected' : ''} ${dimmed ? 'dimmed' : ''}`;
    const zoomBtn = isInspector
      ? ''
      : `<button class="vcard-zoom-btn" data-inspect-card="${card.id}" title="Zoom / read full card">🔍</button>`;

    if (card.kind === 'element') {
      const gMeta = V.GROUP_META[card.colorGroup || card.group];
      const isHydrogen = card.symbol === 'H';
      const rightPanel = card.abilityName
        ? `<div class="vcard-ability-panel ${isHydrogen ? 'ability-hydrogen' : ''}" style="${isHydrogen ? '' : `background:${gMeta.badgeBg};color:${gMeta.badgeText}`}">
            <div class="vcard-ability-hdr">${escapeHtml(card.abilityName)}</div>
            <div class="vcard-ability-body">${escapeHtml(card.abilityText)}</div>
          </div>`
        : renderScrollQuote(card.quote);

      return `
        <div class="${cls} vcard-element" data-card-id="${card.id}" title="${escapeHtml(card.name)} (${card.symbol}) — En ${card.en}, ${gMeta.bondAction} ${gMeta.bondCount}">
          ${zoomBtn}
          <div class="vcard-head">
            <span class="vpill vpill-type">ELEMENT</span>
            <span class="vpill vpill-name" style="background:${gMeta.badgeBg};color:${gMeta.badgeText}">${escapeHtml(card.name)}</span>
            <span class="vpill vpill-group" style="background:${gMeta.badgeBg};color:${gMeta.badgeText}">${card.group}</span>
          </div>
          <div class="vcard-art vcard-art-atom">
            <span class="vcard-z">${card.atomicNumber}</span>
            ${V.renderAtomSVG ? V.renderAtomSVG(card) : `<span class="vcard-symbol">${card.symbol}</span>`}
          </div>
          ${isHydrogen && card.quote ? `<div class="vcard-scroll vcard-scroll-wide"><em>“${escapeHtml(card.quote)}”</em></div>` : ''}
          <div class="vcard-split">
            <div class="vcard-stats-col">
              <div class="vcard-config">${escapeHtml(card.config)}</div>
              <div class="vcard-en-row">
                <span class="en-badge">En</span>
                <span class="en-badge en-badge-val">${card.en.toFixed(1)}</span>
              </div>
              <div class="vcard-bond-row">
                <span class="bond-action">${escapeHtml(gMeta.bondAction)}</span>
                <span class="bond-count">${escapeHtml(gMeta.bondCount)}</span>
              </div>
              ${renderOctetDots(card.valence, gMeta.badgeBg, isHydrogen)}
            </div>
            <div class="vcard-right-col">${rightPanel}</div>
          </div>
        </div>
      `;
    }

    if (card.kind === 'noble_gas') {
      return `
        <div class="${cls} vcard-noble" data-card-id="${card.id}">
          ${zoomBtn}
          <div class="vcard-head">
            <span class="vpill vpill-green">NOBLE GAS</span>
            <span class="vpill vpill-name vpill-green">${escapeHtml(card.name)}</span>
          </div>
          <div class="vcard-art vcard-art-atom" style="background:#052e16;border:2.5px solid #22c55e">
            <span class="vcard-z" style="color:#86efac">${card.atomicNumber}</span>
            ${V.renderAtomSVG ? V.renderAtomSVG(card) : `<span class="vcard-symbol" style="color:#4ade80">${card.symbol}</span>`}
          </div>
          ${renderScrollQuote(card.quote)}
          <div class="vcard-textbox vcard-effect-box">${escapeHtml(card.abilityText)}</div>
        </div>
      `;
    }

    if (card.kind === 'instance') {
      const artPath = V.getEventArtPath ? V.getEventArtPath(card.effectId) : null;
      return `
        <div class="${cls} vcard-event-fmt" data-card-id="${card.id}">
          ${zoomBtn}
          <div class="vcard-head">
            <span class="vpill vpill-yellow">INSTANCE</span>
            <span class="vpill vpill-name vpill-yellow">${escapeHtml(card.name)}</span>
          </div>
          <div class="vcard-art vcard-art-event" style="border:2.5px solid #facc15">
            ${artPath ? `<img class="vcard-art-img" src="${artPath}" alt="${escapeHtml(card.name)}" />` : `<span class="vcard-art-icon">⚡</span>`}
          </div>
          <div class="vcard-ribbon-row">
            <span class="vcard-ribbon ribbon-yellow">${escapeHtml(card.phaseRibbon || 'PHASE 3')}</span>
            <span class="vcard-discard-tag">Discard on Use</span>
          </div>
          <div class="vcard-textbox vcard-effect-box">${escapeHtml(card.description)}</div>
          ${renderScrollQuote(card.quote)}
        </div>
      `;
    }

    // Red Event Card
    const redArtPath = V.getEventArtPath ? V.getEventArtPath(card.effectId) : null;
    return `
      <div class="${cls} vcard-event-fmt" data-card-id="${card.id}">
        ${zoomBtn}
        <div class="vcard-head">
          <span class="vpill vpill-red">EVENT</span>
          <span class="vpill vpill-name vpill-red">${escapeHtml(card.name)}</span>
        </div>
        <div class="vcard-art vcard-art-event" style="border:2.5px solid #ef4444">
          ${redArtPath ? `<img class="vcard-art-img" src="${redArtPath}" alt="${escapeHtml(card.name)}" />` : `<span class="vcard-art-icon">☣</span>`}
        </div>
        <div class="vcard-ribbon-row">
          <span class="vcard-ribbon ribbon-red">${escapeHtml(card.phaseRibbon || 'PHASE 3')}</span>
          <span class="vcard-discard-tag">Discard on Use</span>
        </div>
        <div class="vcard-textbox vcard-effect-box">${escapeHtml(card.description)}</div>
        ${renderScrollQuote(card.quote)}
      </div>
    `;
  }

  function openCardInspectorModal(card) {
    if (!card) return;
    openModal(
      `${card.name}${card.symbol ? ` (${card.symbol})` : ''} — Card Inspector`,
      `<div class="inspector-wrap">${renderCardHTML(card, true)}</div>`
    );
  }

  function renderCenterBench() {
    const active = V.getActivePlayer(state);
    const humanTurn = isHumanTurn();
    const targetCtx = getPhase3TargetContext();

    let liveMessage = statusMessage;
    let tone = statusTone;
    let actionButtonsHTML = '';

    if (!humanTurn) {
      liveMessage = state.phase === 'GAME_OVER'
        ? `Match finished! ${state.players[state.winnerIndex].name} won with ${V.getPlayerSP(state.players[state.winnerIndex])} SP.`
        : (statusMessage || `${active.name} is planning their next reaction...`);
      tone = statusMessage ? statusTone : 'normal';
    } else if (state.phase === 'SYNTHESIS') {
      const selectedCards = selectedCardIds.map((id) => active.hand.find((c) => c.id === id)).filter(Boolean);
      const elemCards = selectedCards.filter((c) => c.kind === 'element');
      const useCat = selectedCards.some((c) => c.effectId === 'CATALYST');
      const hasExo = selectedCards.some((c) => c.effectId === 'EXOTHERMIC_SURGE');
      const hasChain = selectedCards.some((c) => c.effectId === 'CHAIN_REACTION');

      let canSynth = false;
      let canUnstable = false;
      if (selectedCards.length > 0) {
        const invalid = selectedCards.find(
          (c) =>
            c.kind !== 'element' &&
            c.effectId !== 'CATALYST' &&
            c.effectId !== 'CHAIN_REACTION' &&
            c.effectId !== 'EXOTHERMIC_SURGE'
        );
        if (invalid) {
          liveMessage = `${invalid.name} is a Phase 3 card — click "Pass to Phase 3" or synthesize first.`;
          tone = 'error';
        } else {
          const check = V.validateSynthesis(elemCards, useCat);
          if (check.valid) {
            canSynth = true;
            let spPreview = active.chloraminePenalty ? Math.max(1, Math.floor(check.baseSP / 2)) : check.baseSP;
            if (hasExo) spPreview += 3;
            if (check.compound.formula === 'NaCl') spPreview += 1;
            if (check.compound.formula === 'CH₄') spPreview += 2;
            const extras = [
              check.catalyzed ? `Catalyst fills ${check.substitutedSymbol} (0 SP)` : null,
              check.compound.formula === 'CH₄' ? 'Hydrocarbon +2 SP & Draw 1' : null,
              check.compound.formula === 'NaCl' ? 'Salt Cure +1 SP & Draw 1' : null,
              hasExo ? '+3 SP Exothermic' : null,
              hasChain ? `Chain Reaction: draw ${elemCards.length}` : null,
            ].filter(Boolean);
            liveMessage = `✓ Valid Compound: ${check.compound.name} (${check.compound.formula}) → +${spPreview} SP${extras.length ? ` [${extras.join(' • ')}]` : ''}`;
            tone = 'valid';
          } else {
            const unstableCheck =
              !useCat && !hasExo && !hasChain && V.validateUnstableSynthesis
                ? V.validateUnstableSynthesis(elemCards)
                : { valid: false };
            if (unstableCheck.valid) {
              canUnstable = true;
              const ex = unstableCheck.exampleTargets[0];
              liveMessage = `⚠ Unstable (${unstableCheck.formula}) — 0 SP until stabilized! Swap 1 element next turn (e.g. ${ex.replaceSymbol} → ${ex.withSymbol} for ${ex.compound.formula}) or it is discarded.`;
              tone = 'normal';
            } else {
              liveMessage = `Selected: ${elemCards.map((c) => c.symbol).join(' + ') || 'none'} — ${check.reason}`;
              tone = 'normal';
            }
          }
        }
      } else if (!liveMessage) {
        liveMessage = 'Phase 2 (Synthesis): Select Element cards to form a real compound (or stage an Unstable compound), or Pass to Phase 3.';
      }

      actionButtonsHTML = `
        <button id="btn-synthesize" class="btn-action btn-synth" ${canSynth ? '' : 'disabled'}>Synthesize Compound</button>
        ${canUnstable ? '<button id="btn-synth-unstable" class="btn-action btn-unstable">⚠ Play Unstable</button>' : ''}
        ${selectedCardIds.length ? '<button id="btn-clear-sel" class="btn-action btn-pass">Clear</button>' : ''}
        <button id="btn-pass-synth" class="btn-action btn-pass">Pass to Phase 3 →</button>
      `;
    } else if (state.phase === 'DEFENSE') {
      if (targetCtx.mode === 'shield') {
        liveMessage = targetCtx.validTargets.size > 0
          ? `Click one of your highlighted compounds to attach ${targetCtx.card.name} Shield!`
          : `No unshielded active compounds on your field for ${targetCtx.card.name}.`;
        tone = targetCtx.validTargets.size > 0 ? 'valid' : 'error';
      } else if (targetCtx.mode === 'resonance') {
        liveMessage = targetCtx.validTargets.size > 0
          ? `Click one of your highlighted compounds to attach Resonance Stabilizer.`
          : `No eligible compounds on your field for Resonance Stabilizer.`;
        tone = targetCtx.validTargets.size > 0 ? 'valid' : 'error';
      } else if (targetCtx.mode === 'equilibrium') {
        liveMessage = targetCtx.validTargets.size > 0
          ? `Click any of your highlighted compounds to return it to your hand and draw 3 cards!`
          : `You have no compounds on your field to recycle with Equilibrium Shift.`;
        tone = targetCtx.validTargets.size > 0 ? 'valid' : 'error';
      } else if (targetCtx.mode === 'hostile') {
        liveMessage = targetCtx.blockedByBuffer
          ? `Opponent's field is protected by a Buffer Solution until their next turn!`
          : targetCtx.validTargets.size > 0
            ? `Click a highlighted opponent compound to strike with ${targetCtx.card.name}!`
            : `No valid target on opponent's field for ${targetCtx.card.name}.`;
        tone = targetCtx.validTargets.size > 0 ? 'valid' : 'error';
      } else if (targetCtx.mode === 'takeover') {
        liveMessage = targetCtx.validTargets.size > 0
          ? `⚡ EN Takeover Ready! Click any purple-highlighted compound to steal an element with ${targetCtx.card.name} (En ${targetCtx.card.en})!`
          : `${targetCtx.card.name} (En ${targetCtx.card.en}) has no valid EN Takeover target on the field right now.`;
        tone = targetCtx.validTargets.size > 0 ? 'valid' : 'normal';
      } else if (targetCtx.mode === 'instant_play') {
        liveMessage = `Ready to play ${targetCtx.card.name}: ${targetCtx.card.description}`;
        tone = 'valid';
      } else if (!liveMessage) {
        liveMessage = 'Phase 3 (Defense & Events): Click a Noble Gas, Event/Instance card, or Element (EN Takeover) — or End Turn.';
      }

      const playInstantBtn =
        targetCtx.mode === 'instant_play'
          ? `<button id="btn-play-instant" class="btn-action ${targetCtx.card.kind === 'event' ? 'btn-play-red' : 'btn-play-card'}">Play ${escapeHtml(targetCtx.card.name)}</button>`
          : '';

      const eqSci = active.equippedScientist;
      const canUseSciActive = Boolean(
        eqSci &&
        eqSci.activeAbility &&
        eqSci.activeUsesRemaining > 0 &&
        state.discardPile.some((c) => c.kind === 'element' || c.kind === 'noble_gas')
      );
      const sciActiveBtn = eqSci && eqSci.activeAbility
        ? `<button id="btn-sci-active" class="btn-action btn-play-card" ${canUseSciActive ? '' : 'disabled'} title="${escapeHtml(eqSci.activeAbility.description)}">🧬 ${escapeHtml(eqSci.activeAbility.name)} (${eqSci.activeUsesRemaining})</button>`
        : '';

      actionButtonsHTML = `
        ${playInstantBtn}
        ${sciActiveBtn}
        ${selectedCardIds.length ? '<button id="btn-clear-sel" class="btn-action btn-pass">Deselect</button>' : ''}
        <button id="btn-end-turn" class="btn-action btn-end">End Turn ✓</button>
      `;
    }

    elCenterBench.innerHTML = `
      <div class="piles-group">
        <div class="pile-box" id="draw-pile-box" title="Remaining cards in Draw Pile (auto-reshuffles Discard when empty)">
          <div class="pile-count">${state.drawPile.length}</div>
          <div class="pile-label">Draw Pile</div>
        </div>
        <div class="pile-box clickable" id="btn-inspect-discard" title="Click to inspect Discard Pile">
          <div class="pile-count">${state.discardPile.length}</div>
          <div class="pile-label">Discard 👁</div>
        </div>
      </div>
      <div class="action-panel">
        <div class="action-status ${tone === 'valid' ? 'valid' : tone === 'error' ? 'error' : ''}">${escapeHtml(liveMessage)}</div>
        <div class="action-buttons">${actionButtonsHTML}</div>
      </div>
    `;

    const btnSynth = document.getElementById('btn-synthesize');
    if (btnSynth) btnSynth.addEventListener('click', handleSynthesizeClick);
    const btnUnstable = document.getElementById('btn-synth-unstable');
    if (btnUnstable) btnUnstable.addEventListener('click', handleUnstableSynthesizeClick);
    const btnPass = document.getElementById('btn-pass-synth');
    if (btnPass) btnPass.addEventListener('click', handlePassSynthesisClick);
    const btnEnd = document.getElementById('btn-end-turn');
    if (btnEnd) btnEnd.addEventListener('click', handleEndTurnClick);
    const btnClear = document.getElementById('btn-clear-sel');
    if (btnClear) btnClear.addEventListener('click', () => { selectedCardIds = []; setStatus('', 'normal'); renderAll(); });
    const btnPlayInstant = document.getElementById('btn-play-instant');
    if (btnPlayInstant) btnPlayInstant.addEventListener('click', () => handlePlayInstantClick(targetCtx.card));
    const btnSciActive = document.getElementById('btn-sci-active');
    if (btnSciActive) {
      btnSciActive.addEventListener('click', () => {
        const res = V.activateScientistAbility(state, {});
        if (!res.ok) {
          if (V.Sound) V.Sound.playError();
          setStatus(res.error, 'error');
        } else {
          if (V.Sound) V.Sound.playAbility();
          setStatus('Scientist Active Ability triggered!', 'valid');
        }
        renderAll();
      });
    }
    const btnDiscard = document.getElementById('btn-inspect-discard');
    if (btnDiscard) btnDiscard.addEventListener('click', openDiscardModal);
  }

  function renderRecipeHints() {
    const viewPlayer = state.players[getViewingPlayerIndex()];
    const recipes = V.findPlayableCompounds(viewPlayer.hand, { allowCatalyst: true });
    elRecipeCount.textContent = String(recipes.length);

    if (recipes.length === 0) {
      elRecipeHints.innerHTML = `<div style="font-size:12px;color:#94a3b8;padding:4px 0;">No full real compounds in hand yet. Pass to Phase 3 for Events/EN Takeover or draw 2 next turn!</div>`;
      return;
    }

    elRecipeHints.innerHTML = recipes.slice(0, 12).map((r, idx) => {
      const parts = r.cards.map((c) => c.symbol).join(' + ') + (r.useCatalyst ? ' + ⚡Catalyst' : '');
      return `
        <button class="recipe-chip" data-recipe-idx="${idx}" title="Click to auto-select these cards in Phase 2">
          <div>
            <strong>${escapeHtml(r.compound.formula)}</strong> — ${escapeHtml(r.compound.name)}
            <small>${escapeHtml(parts)}</small>
          </div>
          <span class="recipe-sp">+${r.baseSP} SP</span>
        </button>
      `;
    }).join('');

    elRecipeHints.querySelectorAll('[data-recipe-idx]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!isHumanTurn() || state.phase !== 'SYNTHESIS') return;
        const r = recipes[Number(btn.getAttribute('data-recipe-idx'))];
        selectedCardIds = r.cards.map((c) => c.id);
        if (r.useCatalyst && r.catalystCard) selectedCardIds.push(r.catalystCard.id);
        setStatus('', 'normal');
        renderAll();
      });
    });
  }

  function renderLog() {
    elReactionLog.innerHTML = state.log
      .map((entry) => `<div class="log-item log-${entry.category}"><strong>T${entry.turn}:</strong> ${escapeHtml(entry.message)}</div>`)
      .join('');
  }

  // ===== INTERACTION HANDLERS =====
  function handleHandCardClick(cardId) {
    if (!isHumanTurn() || state.pendingPrompt) return;
    setStatus('', 'normal');
    let nowSelected = false;

    if (state.phase === 'SYNTHESIS') {
      const idx = selectedCardIds.indexOf(cardId);
      if (idx >= 0) {
        selectedCardIds.splice(idx, 1);
        nowSelected = false;
      } else {
        selectedCardIds.push(cardId);
        nowSelected = true;
      }
    } else if (state.phase === 'DEFENSE') {
      // Single-card selection in Phase 3 for clean targeting
      if (selectedCardIds.length === 1 && selectedCardIds[0] === cardId) {
        selectedCardIds = [];
        nowSelected = false;
      } else {
        selectedCardIds = [cardId];
        nowSelected = true;
      }
    }
    if (V.Sound) V.Sound.playCardSelect(nowSelected);
    renderAll();
  }

  function handleSynthesizeClick() {
    const res = V.synthesizeCompound(state, selectedCardIds);
    if (!res.ok) {
      if (V.Sound) V.Sound.playError();
      setStatus(res.error, 'error');
      renderCenterBench();
      return;
    }
    selectedCardIds = [];
    setStatus(`Synthesized ${res.compound.name} (${res.compound.formula})! Now in Phase 3: Defense & Events.`, 'valid');
    renderAll();
  }

  function handleUnstableSynthesizeClick() {
    const res = V.synthesizeUnstableCompound(state, selectedCardIds);
    if (!res.ok) {
      if (V.Sound) V.Sound.playError();
      setStatus(res.error, 'error');
      renderCenterBench();
      return;
    }
    selectedCardIds = [];
    setStatus(`Staged Unstable ${res.compound.formula}! Swap 1 element by the end of your next turn to stabilize it.`, 'valid');
    renderAll();
  }

  function handleStabilizeUnstableClick(compId) {
    const active = V.getActivePlayer(state);
    const comp = active.field.find((c) => c.id === compId && c.unstable);
    if (!comp) return;
    const swaps = V.findUnstableStabilizeSwaps(comp, active.hand);
    if (swaps.length === 0) {
      if (V.Sound) V.Sound.playError();
      setStatus('No element in your hand can stabilize this compound with a 1-card swap yet.', 'error');
      renderCenterBench();
      return;
    }
    if (swaps.length === 1) {
      const res = V.stabilizeUnstableCompound(state, swaps[0]);
      if (res.ok) {
        selectedCardIds = [];
        setStatus(`Stabilized into ${res.compound.name} (${res.compound.formula})!`, 'valid');
        renderAll();
      }
      return;
    }
    // Picker modal when multiple stabilization swaps exist
    const items = swaps.map((sw, idx) => `
      <button class="option-btn" data-sw-idx="${idx}">
        <div>
          <strong>Stabilize into ${escapeHtml(sw.compound.formula)} (${escapeHtml(sw.compound.name)})</strong>
          <div style="font-size:12px;color:#94a3b8;margin-top:3px;">
            Swap out <strong>${sw.removeCard.symbol}</strong> (returns to hand) ↔ play <strong>${sw.addCard.symbol}</strong> from hand.
          </div>
        </div>
        <span class="recipe-sp">+${sw.baseSP} SP</span>
      </button>
    `).join('');
    openModal(`Stabilize ${comp.formula} — Choose Element Swap`, `<div class="option-list">${items}</div>`, (root) => {
      root.querySelectorAll('[data-sw-idx]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const sw = swaps[Number(btn.getAttribute('data-sw-idx'))];
          closeModal();
          const res = V.stabilizeUnstableCompound(state, sw);
          if (res.ok) {
            selectedCardIds = [];
            setStatus(`Stabilized into ${res.compound.name} (${res.compound.formula})!`, 'valid');
            renderAll();
          }
        });
      });
    });
  }

  function handlePassSynthesisClick() {
    const res = V.passSynthesis(state);
    if (!res.ok) {
      if (V.Sound) V.Sound.playError();
      setStatus(res.error, 'error');
      renderCenterBench();
      return;
    }
    if (V.Sound) V.Sound.playButtonClick();
    selectedCardIds = [];
    setStatus('Phase 3: Deploy Noble Gas shields, play Event/Instance cards, or perform an EN Takeover.', 'normal');
    renderAll();
  }

  function handlePlayInstantClick(card) {
    if (!card) return;
    const res = V.playEventOrInstance(state, card.id, {});
    if (!res.ok) {
      if (V.Sound) V.Sound.playError();
      setStatus(res.error, 'error');
      renderCenterBench();
      return;
    }
    selectedCardIds = [];
    setStatus(`Played ${card.name}!`, 'valid');
    renderAll();
  }

  function handleCompoundTargetClick(compId, targetCtx) {
    const targetInfo = targetCtx.validTargets.get(compId);
    if (!targetInfo || !targetCtx.card) return;

    if (targetInfo.kind === 'shield') {
      const res = V.playNobleGasShield(state, targetCtx.card.id, compId);
      if (!res.ok) { setStatus(res.error, 'error'); renderCenterBench(); return; }
      selectedCardIds = [];
      setStatus(`Shield deployed!`, 'valid');
      renderAll();
      return;
    }

    if (targetInfo.kind === 'resonance' || targetInfo.kind === 'hostile' || targetInfo.kind === 'equilibrium') {
      const res = V.playEventOrInstance(state, targetCtx.card.id, { targetCompoundId: compId });
      if (!res.ok) { setStatus(res.error, 'error'); renderCenterBench(); return; }
      selectedCardIds = [];
      setStatus(`Resolved ${targetCtx.card.name}!`, 'valid');
      renderAll();
      return;
    }

    if (targetInfo.kind === 'takeover') {
      const moves = targetInfo.moves;
      if (moves.length === 1) {
        const res = V.executeENTakeover(state, targetInfo.ownerIdx, moves[0]);
        if (!res.ok) { setStatus(res.error, 'error'); renderCenterBench(); return; }
        selectedCardIds = [];
        setStatus(`EN Takeover succeeded! Formed ${res.compound.formula}!`, 'valid');
        renderAll();
      } else {
        openENTakeoverPicker(targetInfo.ownerIdx, moves);
      }
    }
  }

  function handleEndTurnClick() {
    if (state.mode === 'tutorial') {
      if (V.Sound) V.Sound.playButtonClick();
      setStatus('Follow the Tutorial objective above — or click "Next Lesson" / "Reset" in the Lab Academy banner!', 'normal');
      renderCenterBench();
      return;
    }
    const prevPlayer = state.activePlayerIndex;
    const res = V.endTurn(state);
    if (!res.ok) {
      setStatus(res.error, 'error');
      renderCenterBench();
      return;
    }
    selectedCardIds = [];
    setStatus('', 'normal');

    if (state.mode === 'pass_and_play' && state.activePlayerIndex !== prevPlayer && state.phase !== 'GAME_OVER') {
      awaitingPassCurtain = true;
      showPassCurtain(V.getActivePlayer(state).name);
    }
    renderAll();
    maybeScheduleAI();
  }

  // ===== MODALS (With Stage 3C Pre-Modal Visual & Audio Scene Restoration) =====
  let preModalVisualScene = null;
  let preModalAudioScene = null;
  let activeModalCleanup = null;

  function openModal(title, bodyHTML, onBind, options) {
    const opts = options || {};
    const wasHidden = elModalRoot.classList.contains('hidden');
    if (activeModalCleanup) {
      try { activeModalCleanup(); } catch (_) {}
      activeModalCleanup = null;
    }
    if (wasHidden) {
      preModalVisualScene = V.Visual && V.Visual.getActiveVisualState
        ? V.Visual.getActiveVisualState().sceneId
        : null;
      preModalAudioScene = V.Sound && V.Sound.getActiveSceneId
        ? V.Sound.getActiveSceneId()
        : null;
    }
    if (opts.visualScene && V.Visual && V.Visual.applyScene) {
      V.Visual.applyScene(opts.visualScene);
    }
    if (opts.audioScene && V.Sound && V.Sound.requestScene) {
      V.Sound.requestScene(opts.audioScene);
    }
    if (typeof opts.onClose === 'function') {
      activeModalCleanup = opts.onClose;
    }

    elModalRoot.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h2>${escapeHtml(title)}</h2>
          <button id="modal-close-btn" class="ctrl-btn">Close ✕</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
      </div>
    `;
    elModalRoot.classList.remove('hidden');
    const closeBtn = document.getElementById('modal-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (onBind) {
      const cleanup = onBind(elModalRoot);
      if (typeof cleanup === 'function') activeModalCleanup = cleanup;
    }
  }

  function closeModal() {
    if (state && state.pendingPrompt) return; // Don't dismiss required game prompts
    if (activeModalCleanup) {
      try { activeModalCleanup(); } catch (_) {}
      activeModalCleanup = null;
    }
    elModalRoot.classList.add('hidden');
    elModalRoot.innerHTML = '';
    const restoreVisual = preModalVisualScene || ((!elAppShell || elAppShell.classList.contains('hidden')) ? 'main_menu' : null);
    const restoreAudio = preModalAudioScene || ((!elAppShell || elAppShell.classList.contains('hidden')) ? 'main_menu' : null);
    preModalVisualScene = null;
    preModalAudioScene = null;
    if (restoreVisual && V.Visual && V.Visual.applyScene) V.Visual.applyScene(restoreVisual);
    if (restoreAudio && V.Sound && V.Sound.requestScene) V.Sound.requestScene(restoreAudio);
  }

  function openENTakeoverPicker(ownerIdx, moves) {
    const owner = state.players[ownerIdx];
    const items = moves.map((mv, idx) => {
      const handStr = [mv.attackCard, ...mv.extraHandCards].map((c) => c.symbol).join(' + ');
      const stealStr = mv.stolenCards.map((c) => c.symbol).join(' + ');
      const returnStr = mv.leftoverCards.map((c) => c.symbol).join(', ');
      return `
        <button class="option-btn" data-mv-idx="${idx}">
          <div>
            <strong>Form ${escapeHtml(mv.compound.formula)} (${escapeHtml(mv.compound.name)})</strong>
            <div style="font-size:12px;color:#94a3b8;margin-top:3px;">
              Play <strong>${escapeHtml(handStr)}</strong> (En ${mv.attackCard.en} &gt; ${mv.replacedCard.symbol} En ${mv.replacedCard.en}) + steal <strong>${escapeHtml(stealStr)}</strong>.
              Returns <strong>${escapeHtml(returnStr)}</strong> to ${escapeHtml(owner.name)}'s hand.
              ${mv.piercesHeavyShield ? '<span style="color:#facc15"> ★ Pierces Heavy Noble Gas Shield!</span>' : ''}
            </div>
          </div>
          <span class="recipe-sp">+${mv.baseSP} SP</span>
        </button>
      `;
    }).join('');

    openModal('Choose Electronegativity Takeover', `<div class="option-list">${items}</div>`, (root) => {
      root.querySelectorAll('[data-mv-idx]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const mv = moves[Number(btn.getAttribute('data-mv-idx'))];
          closeModal();
          const res = V.executeENTakeover(state, ownerIdx, mv);
          if (res.ok) {
            selectedCardIds = [];
            setStatus(`EN Takeover succeeded! Formed ${res.compound.formula}!`, 'valid');
          } else {
            setStatus(res.error, 'error');
          }
          renderAll();
        });
      });
    });
  }

  function renderPendingPromptModal() {
    if (!state.pendingPrompt) return;
    const prompt = state.pendingPrompt;
    const player = state.players[prompt.playerId];
    let cards = [];
    if (prompt.type === 'DISCARD_CHOICE') {
      cards = player.hand;
    } else if (prompt.type === 'DISTILLATION_PICK') {
      cards = state.discardPile.filter((c) => c.kind === 'element' || c.kind === 'noble_gas');
    }

    const html = `
      <p style="font-size:13px;color:#cbd5e1;">Click a card below to resolve <strong>${escapeHtml(prompt.title)}</strong>:</p>
      <div class="hand-row">
        ${cards.map((c) => renderCardHTML(c)).join('')}
      </div>
    `;

    elModalRoot.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h2>${escapeHtml(prompt.title)}</h2>
        </div>
        <div class="modal-body">${html}</div>
      </div>
    `;
    elModalRoot.classList.remove('hidden');

    elModalRoot.querySelectorAll('[data-card-id]').forEach((node) => {
      node.addEventListener('click', () => {
        const cardId = node.getAttribute('data-card-id');
        V.resolvePrompt(state, { cardId });
        if (!state.pendingPrompt) {
          elModalRoot.classList.add('hidden');
          elModalRoot.innerHTML = '';
        }
        renderAll();
      });
    });
  }

  function openDiscardModal() {
    const body = state.discardPile.length === 0
      ? '<p style="color:#94a3b8;font-size:13px;">The Discard Pile is currently empty.</p>'
      : `<div class="hand-row">${[...state.discardPile].reverse().map((c) => renderCardHTML(c)).join('')}</div>`;
    openModal(`Discard Pile (${state.discardPile.length} cards — newest first)`, body);
  }

  function openPeriodicTableModal() {
    const groups = ['1A', '2A', '3A', '4A', '5A', '6A', '7A', '8A'];
    const periods = [
      ['H', null, null, null, null, null, null, 'He'],
      ['Li', 'Be', 'B', 'C', 'N', 'O', 'F', 'Ne'],
      ['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'],
      ['K', 'Ca', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'],
      ['Rb', 'Sr', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe'],
      ['Cs', 'Ba', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn'],
      ['Fr', 'Ra', null, null, null, null, null, null],
    ];

    const headers = groups.map((g) => {
      const m = V.GROUP_META[g];
      return `<div class="ptable-head" style="background:${m.badgeBg};color:${m.badgeText}">${g} (${m.valence}e⁻)</div>`;
    }).join('');

    const cells = periods.flat().map((sym) => {
      if (!sym) return `<div class="ptable-empty"></div>`;
      const el = V.ELEMENT_BY_SYMBOL[sym];
      const enStr = el.kind === 'noble_gas' ? 'Inert' : `En ${el.en.toFixed(1)}`;
      return `
        <div class="ptable-cell" title="${escapeHtml(el.name)} • ${escapeHtml(el.config)}">
          <span>#${el.atomicNumber}</span>
          <strong>${el.symbol}</strong>
          <span>${escapeHtml(el.name)}</span>
          <span class="pt-en">${enStr}</span>
        </div>
      `;
    }).join('');

    openModal(
      'VALENCY Shared Periodic Table (Groups 1A–8A)',
      `<p style="font-size:12px;color:#94a3b8;">Main-group elements in the 100-card Unit 1 deck with Valence Electrons &amp; Pauling Electronegativity (En).</p>
       <div class="ptable-grid">${headers}${cells}</div>`
    );
  }

  function openRulesModal() {
    const body = `
      <div class="rules-grid">
        <div class="rules-card">
          <h4>Goal &amp; Scoring (25 SP)</h4>
          <ul>
            <li>First player to reach <strong>25 Stability Points (SP)</strong> on their active field wins!</li>
            <li>Each compound scores the <strong>sum of valence electrons</strong> of its atoms (e.g., H₂O = 8 SP, CO₂ = 16 SP).</li>
            <li>If a compound is broken, cleaved, displaced, or precipitated, you <strong>lose its SP entirely</strong>.</li>
          </ul>
        </div>
        <div class="rules-card">
          <h4>Phase 2: Synthesis</h4>
          <ul>
            <li>Start of turn: <strong>Draw 2 cards</strong> (auto-reshuffles discard if empty).</li>
            <li>Synthesize at most <strong>1 real chemical compound</strong> (or diatomic molecule) per turn, optionally adding <em>Catalyst</em>, <em>Chain Reaction</em>, or <em>Exothermic Surge</em>.</li>
            <li>You may <strong>Pass</strong> Synthesis and still take Phase 3 actions!</li>
          </ul>
        </div>
        <div class="rules-card">
          <h4>Phase 3: Defense &amp; Events</h4>
          <ul>
            <li><strong>Noble Gas Shield:</strong> Attach He/Ne/Ar/Kr/Xe/Rn to protect a compound from EN Takeovers &amp; hostile Events.</li>
            <li><strong>Event &amp; Instance Cards:</strong> Play Acid Rain, Bond Cleavage, Precipitation, Ionization Surge, Diffusion, Distillation, Thermal Activation, or Resonance.</li>
            <li><strong>EN Takeover:</strong> Click an element in hand with higher En than an atom on the field to steal bonded atoms &amp; form a real compound! Leftover atoms return to the owner's hand.</li>
          </ul>
        </div>
        <div class="rules-card">
          <h4>Element Special Abilities</h4>
          <ul>
            <li><strong>Na (Salt Cure):</strong> NaCl grants +1 SP &amp; draw 1.</li>
            <li><strong>F (Apex Oxidizer):</strong> EN Takeover pierces Kr/Xe/Rn shields (He/Ne/Ar stay immune).</li>
            <li><strong>Ga (Liquid Embrittlement):</strong> Shatters an unshielded opponent Aluminum compound.</li>
            <li><strong>Fr / Ra / Po:</strong> Radioactive disruption — blocked by <strong>Pb (Lead)</strong> on your field!</li>
            <li><strong>P + O:</strong> Opponent discards 1. <strong>At:</strong> +2 SP, decays next turn unless shielded.</li>
          </ul>
        </div>
      </div>
    `;
    openModal('VALENCY Official Quick Rulebook (Unit 1)', body);
  }

  function openVictoryModal() {
    if (activeFrontierEncounterId && V.FrontierUI) {
      const encId = activeFrontierEncounterId;
      activeFrontierEncounterId = null;
      V.FrontierUI.handleFrontierEncounterComplete(state, encId);
      return;
    }

    if (activeStoryMission && V.StoryUI) {
      V.StoryUI.handleEncounterComplete(state, activeStoryMission, storyTelemetryTracker);
      return;
    }

    if (activeTutorialIndex !== null && V.Tutorial) {
      if (V.Sound) V.Sound.playVictory();
      const lesson = V.Tutorial.getLessonByIndex(activeTutorialIndex);
      if (lesson) V.Tutorial.markLessonCompleted(lesson.id);
      const body = `
        <div style="text-align:center;padding:14px 6px;">
          <div style="font-size:44px;margin-bottom:8px;">🎓</div>
          <h3 style="font-size:22px;margin-bottom:6px;">Lab Academy Complete!</h3>
          <p style="color:#94a3b8;font-size:14px;margin-bottom:18px;">
            You've mastered every VALENCY mechanic—from Valence Synthesis &amp; Catalysts to Noble Gas Shields, EN Takeovers, Event Cards, and Special Abilities!
          </p>
          <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
            <button id="btn-tut-real-match" class="btn-action btn-synth">Play Real Match vs. Dr. Mendeleev</button>
            <button id="btn-tut-all-lessons" class="btn-action btn-pass">Review Lessons</button>
          </div>
        </div>
      `;
      openModal('Tutorial Graduated!', body, (root) => {
        const b1 = root.querySelector('#btn-tut-real-match');
        if (b1) b1.addEventListener('click', () => startNewGame('vs_ai'));
        const b2 = root.querySelector('#btn-tut-all-lessons');
        if (b2) b2.addEventListener('click', () => { closeModal(); openTutorialMenuModal(); });
      });
      return;
    }

    const winner = state.players[state.winnerIndex];
    const loser = state.players[state.winnerIndex === 0 ? 1 : 0];
    const isFailState =
      (state.mode === 'vs_ai' && state.winnerIndex === 1) ||
      state.failReason === 'conceded';

    if (isFailState) {
      openFailStateModal(winner, loser);
      return;
    }

    if (V.Sound) V.Sound.playVictory();
    const body = `
      <div style="text-align:center;padding:14px 6px;">
        <div style="font-size:44px;margin-bottom:8px;">🏆</div>
        <h3 style="font-size:22px;margin-bottom:6px;">${escapeHtml(winner.name)} Wins VALENCY!</h3>
        <p style="color:#94a3b8;font-size:14px;margin-bottom:18px;">
          Final Stability Points: <strong style="color:#4ade80">${V.getPlayerSP(winner)} SP</strong> vs. ${escapeHtml(loser.name)} (${V.getPlayerSP(loser)} SP) in ${state.turnNumber} turns.
        </p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <button id="btn-play-again" class="btn-action btn-synth">↻ Play Again</button>
          <button id="btn-victory-menu" class="btn-action btn-pass">← Main Menu</button>
        </div>
      </div>
    `;
    openModal('Chemical Victory!', body, (root) => {
      const btn = root.querySelector('#btn-play-again');
      if (btn) btn.addEventListener('click', () => startNewGame(state.mode));
      const menuBtn = root.querySelector('#btn-victory-menu');
      if (menuBtn) menuBtn.addEventListener('click', showMenuScreen);
    });
  }

  function openFailStateModal(winner, loser) {
    if (V.Sound && V.Sound.playDefeat) V.Sound.playDefeat();
    const quips = [
      'Your lab bench just failed safety inspection. Better recalibrate those valence shells!',
      'Containment breach! Dr. Mendeleev left your compounds in a smoking pile of reagents.',
      'Not quite thermodynamically favorable—dust off your goggles and run the reaction again!',
    ];
    const quip = state.failReason === 'conceded'
      ? 'Experiment aborted before total lab meltdown. Ready to reset your bench and try again?'
      : quips[state.turnNumber % quips.length];

    const body = `
      <div class="fail-state-body">
        <div class="fail-badge-icon">☣</div>
        <div class="fail-kicker">REACTION FAILED • LAB MELTDOWN</div>
        <h3 class="fail-headline">${escapeHtml(winner.name)} Took Control of the Lab!</h3>
        <p class="fail-quip"><em>“${escapeHtml(quip)}”</em></p>

        <div class="fail-stats-grid">
          <div class="fail-stat-box">
            <span class="fail-stat-label">${escapeHtml(loser.name)}</span>
            <strong class="fail-stat-val fail-val-loss">${V.getPlayerSP(loser)} / ${state.winSP} SP</strong>
          </div>
          <div class="fail-stat-box">
            <span class="fail-stat-label">${escapeHtml(winner.name)}</span>
            <strong class="fail-stat-val fail-val-opp">${V.getPlayerSP(winner)} / ${state.winSP} SP</strong>
          </div>
          <div class="fail-stat-box">
            <span class="fail-stat-label">Turns Elapsed</span>
            <strong class="fail-stat-val">${state.turnNumber}</strong>
          </div>
        </div>

        <div class="fail-actions">
          <button id="btn-fail-restart" class="btn-action btn-play-red">↻ Restart Current Match</button>
          <button id="btn-fail-menu" class="btn-action btn-pass">← Back to Main Menu</button>
        </div>
      </div>
    `;

    elModalRoot.innerHTML = `
      <div class="modal-box modal-fail-state">
        <div class="modal-header fail-modal-header">
          <h2>☣ Fail State — Match Lost</h2>
        </div>
        <div class="modal-body">${body}</div>
      </div>
    `;
    elModalRoot.classList.remove('hidden');

    const restartBtn = elModalRoot.querySelector('#btn-fail-restart');
    if (restartBtn) restartBtn.addEventListener('click', () => startNewGame(currentMode));
    const menuBtn = elModalRoot.querySelector('#btn-fail-menu');
    if (menuBtn) menuBtn.addEventListener('click', showMenuScreen);
  }

  function showPassCurtain(nextPlayerName) {
    elCurtainRoot.innerHTML = `
      <div class="curtain-card">
        <h2>Pass Device to ${escapeHtml(nextPlayerName)}</h2>
        <p>Hands are hidden so nobody peeks! Click below when ${escapeHtml(nextPlayerName)} is ready.</p>
        <button id="btn-reveal-turn" class="btn-action btn-synth">Reveal ${escapeHtml(nextPlayerName)}'s Hand</button>
      </div>
    `;
    elCurtainRoot.classList.remove('hidden');
    document.getElementById('btn-reveal-turn').addEventListener('click', () => {
      awaitingPassCurtain = false;
      hideCurtain();
      renderAll();
    });
  }

  function hideCurtain() {
    elCurtainRoot.classList.add('hidden');
    elCurtainRoot.innerHTML = '';
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function openEventGalleryModal() {
    const redCount = V.EVENT_SPECS.reduce((s, c) => s + c.copies, 0);
    const yellowCount = V.INSTANCE_SPECS.reduce((s, c) => s + c.copies, 0);
    const redCards = V.EVENT_SPECS.map((s) => renderCardHTML({ id: `gal_${s.effectId}`, ...s }, true)).join('');
    const yellowCards = V.INSTANCE_SPECS.map((s) => renderCardHTML({ id: `gal_${s.effectId}`, ...s }, true)).join('');
    const body = `
      <p style="font-size:12.5px;color:#94a3b8;">All ${V.EVENT_SPECS.length + V.INSTANCE_SPECS.length} unique Event Card illustrations (${redCount + yellowCount} total Event cards in the 120-card deck — 42% Events), complete with snarky scroll quotes!</p>
      <h3 style="font-size:13px;color:#fca5a5;text-transform:uppercase;letter-spacing:.05em;">Red Hostile Event Cards (Inhibitors — ${V.EVENT_SPECS.length} types, ${redCount} in deck)</h3>
      <div class="hand-row gallery-row">${redCards}</div>
      <h3 style="font-size:13px;color:#fde047;text-transform:uppercase;letter-spacing:.05em;margin-top:8px;">Yellow Instance Event Cards (Catalysts — ${V.INSTANCE_SPECS.length} types, ${yellowCount} in deck)</h3>
      <div class="hand-row gallery-row">${yellowCards}</div>
    `;
    openModal(`VALENCY Event Card Art Gallery (${V.EVENT_SPECS.length + V.INSTANCE_SPECS.length} Unique Cards)`, body);
  }

  // ===== INTERACTIVE TUTORIAL CONTROLLER =====
  function startTutorialLesson(idx) {
    if (!V.Tutorial) return;
    const lesson = V.Tutorial.getLessonByIndex(idx);
    if (!lesson) return;

    clearAITimer();
    selectedCardIds = [];
    statusMessage = '';
    statusTone = 'normal';
    awaitingPassCurtain = false;
    activeTutorialIndex = idx;
    lessonDoneAnnounced = false;
    activeStoryMission = null;
    storyTelemetryTracker = null;
    activeFrontierEncounterId = null;

    const introRoot = document.getElementById('intro-root');
    if (introRoot) {
      introRoot.classList.add('hidden');
      introRoot.innerHTML = '';
    }
    closeModal();
    hideCurtain();
    showMatchScreen('tutorial');

    state = lesson.setup();
    if (V.Sound) V.Sound.playTurnChime();
    renderAll();
  }

  function renderTutorialBanner() {
    if (!elTutorialBanner) return;
    if (activeTutorialIndex === null || !V.Tutorial) {
      elTutorialBanner.classList.add('hidden');
      elTutorialBanner.innerHTML = '';
      return;
    }

    const lesson = V.Tutorial.getLessonByIndex(activeTutorialIndex);
    if (!lesson) return;

    const total = V.Tutorial.getLessonCount();
    const obj = lesson.getObjective(state);

    if (obj.done && !lessonDoneAnnounced) {
      lessonDoneAnnounced = true;
      V.Tutorial.markLessonCompleted(lesson.id);
      if (V.Sound && state.phase !== 'GAME_OVER') V.Sound.playTurnChime();
    }

    const hasNext = activeTutorialIndex + 1 < total;
    const nextBtnLabel = hasNext ? `Next: Lesson ${activeTutorialIndex + 2} →` : 'Finish & Play Real Match 🏆';

    elTutorialBanner.classList.remove('hidden');
    elTutorialBanner.innerHTML = `
      <div class="tut-top">
        <div class="tut-heading">
          <span class="tut-pill">🎓 Lesson ${lesson.number} / ${total}</span>
          <span class="tut-tag">${escapeHtml(lesson.tag)}</span>
          <h3 class="tut-title">${escapeHtml(lesson.title)}</h3>
        </div>
        <div class="tut-controls">
          <button id="btn-tut-menu" class="ctrl-btn">All Lessons</button>
          <button id="btn-tut-reset" class="ctrl-btn">Reset</button>
          <button id="btn-tut-next" class="btn-action ${obj.done ? 'btn-synth tut-next-pulse' : 'btn-pass'}">${nextBtnLabel}</button>
          <button id="btn-tut-exit" class="ctrl-btn">Exit</button>
        </div>
      </div>
      <p class="tut-explain">${escapeHtml(lesson.explanation)}</p>
      <div class="tut-objective ${obj.done ? 'done' : ''}">
        <span class="tut-obj-icon">${obj.done ? '✓' : '▶'}</span>
        <span>${escapeHtml(obj.instruction)}</span>
      </div>
    `;

    document.getElementById('btn-tut-menu').addEventListener('click', openTutorialMenuModal);
    document.getElementById('btn-tut-reset').addEventListener('click', () => startTutorialLesson(activeTutorialIndex));
    document.getElementById('btn-tut-exit').addEventListener('click', showMenuScreen);
    document.getElementById('btn-tut-next').addEventListener('click', () => {
      if (hasNext) startTutorialLesson(activeTutorialIndex + 1);
      else startNewGame('vs_ai');
    });
  }

  function openTutorialMenuModal() {
    if (!V.Tutorial) return;
    const total = V.Tutorial.getLessonCount();
    const doneCount = V.Tutorial.getCompletedCount();

    const rows = V.Tutorial.LESSONS.map((lesson, idx) => {
      const done = V.Tutorial.isLessonCompleted(lesson.id);
      return `
        <div class="tut-lesson-row ${done ? 'completed' : ''}">
          <div class="tut-lesson-info">
            <div class="tut-lesson-top">
              <span class="tut-pill">Lesson ${lesson.number}</span>
              <span class="tut-tag">${escapeHtml(lesson.tag)}</span>
              ${done ? '<span class="tut-done-badge">✓ Completed</span>' : ''}
            </div>
            <strong>${escapeHtml(lesson.title)}</strong>
            <div class="tut-lesson-summary">${escapeHtml(lesson.summary)}</div>
          </div>
          <button class="btn-action ${done ? 'btn-pass' : 'btn-synth'}" data-start-lesson="${idx}">
            ${done ? 'Replay' : 'Practice ▶'}
          </button>
        </div>
      `;
    }).join('');

    const body = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#0f172a;border:1px solid rgba(56,189,248,0.3);border-radius:12px;padding:12px 14px;">
        <div>
          <strong style="font-size:14px;">Interactive Hands-On Chemistry Lab (${doneCount} / ${total} Completed)</strong>
          <div style="font-size:12px;color:#94a3b8;margin-top:2px;">Practice each individual mechanic directly on the live table with guided cards, animations, and sound effects.</div>
        </div>
        <button id="btn-start-full-tut" class="btn-action btn-synth">Start Full Tutorial (Lesson 1)</button>
      </div>
      <div class="tut-menu-list">${rows}</div>
    `;

    openModal('🎓 VALENCY Lab Academy — Interactive Tutorial', body, (root) => {
      const fullBtn = root.querySelector('#btn-start-full-tut');
      if (fullBtn) fullBtn.addEventListener('click', () => startTutorialLesson(0));
      root.querySelectorAll('[data-start-lesson]').forEach((btn) => {
        btn.addEventListener('click', () => {
          startTutorialLesson(Number(btn.getAttribute('data-start-lesson')));
        });
      });
    });
  }

  // ===== SIDEBAR TABS, PREFERENCES & MENU WIRING =====
  function setSidebarTab(tab) {
    activeSidebarTab = tab;
    const tHints = document.getElementById('tab-hints');
    const tLog = document.getElementById('tab-log');
    const pHints = document.getElementById('pane-hints');
    const pLog = document.getElementById('pane-log');
    if (tHints) tHints.classList.toggle('active', tab === 'hints');
    if (tLog) tLog.classList.toggle('active', tab === 'log');
    if (pHints) pHints.classList.toggle('hidden', tab !== 'hints');
    if (pLog) pLog.classList.toggle('hidden', tab !== 'log');
  }

  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    if (elMainLayout) elMainLayout.classList.toggle('sidebar-collapsed', sidebarCollapsed);
    if (elSidebar) elSidebar.classList.toggle('hidden', sidebarCollapsed);
    const btn = document.getElementById('btn-sidebar-toggle');
    if (btn) btn.textContent = sidebarCollapsed ? 'Panel ◂' : 'Panel ▸';
    if (V.Sound) V.Sound.playButtonClick();
  }

  function syncPreferenceButtons() {
    const fxOn = V.isAnimationsEnabled ? V.isAnimationsEnabled() : true;
    const sfxOn = V.Sound ? V.Sound.isSoundEnabled() : true;
    const musicOn = V.Sound && V.Sound.isMusicEnabled ? V.Sound.isMusicEnabled() : true;
    const btnFx = document.getElementById('btn-fx-toggle');
    const btnSfx = document.getElementById('btn-sfx-toggle');
    const btnMusic = document.getElementById('btn-music-toggle');
    const menuFx = document.getElementById('menu-btn-fx');
    const menuSfx = document.getElementById('menu-btn-sfx');
    const menuMusic = document.getElementById('menu-btn-music');
    if (btnFx) btnFx.textContent = fxOn ? '✨' : '○';
    if (btnFx) btnFx.title = fxOn ? 'Visual FX: On (click to disable)' : 'Visual FX: Off (click to enable)';
    if (btnSfx) btnSfx.textContent = sfxOn ? '🔊' : '🔇';
    if (btnSfx) btnSfx.title = sfxOn ? 'Sound Effects: On (click to mute)' : 'Sound Effects: Muted (click to unmute)';
    if (btnMusic) btnMusic.textContent = musicOn ? '🎵' : '🔇';
    if (btnMusic) btnMusic.title = musicOn ? 'Background Music: On (click to mute)' : 'Background Music: Off (click to unmute)';
    if (menuFx) menuFx.textContent = fxOn ? '✨ FX: On' : '○ FX: Off';
    if (menuSfx) menuSfx.textContent = sfxOn ? '🔊 SFX: On' : '🔇 SFX: Off';
    if (menuMusic) menuMusic.textContent = musicOn ? '🎵 Music: On' : '🔇 Music: Off';
  }

  function handleToggleMusic() {
    const next = !(V.Sound && V.Sound.isMusicEnabled ? V.Sound.isMusicEnabled() : true);
    if (V.Sound && V.Sound.setMusicEnabled) V.Sound.setMusicEnabled(next);
    syncPreferenceButtons();
    if (V.Sound) V.Sound.playButtonClick();
  }

  function handleToggleFX() {
    const next = !(V.isAnimationsEnabled ? V.isAnimationsEnabled() : true);
    if (V.setAnimationsEnabled) V.setAnimationsEnabled(next);
    syncPreferenceButtons();
    if (V.Sound) V.Sound.playButtonClick();
  }

  function handleToggleSFX() {
    const next = !(V.Sound ? V.Sound.isSoundEnabled() : true);
    if (V.Sound) V.Sound.setSoundEnabled(next);
    syncPreferenceButtons();
  }

  function openAudioSettingsModal() {
    const mobileMore = document.getElementById('mobile-more-backdrop');
    if (mobileMore) mobileMore.classList.add('hidden');
    const settings = V.Sound && V.Sound.getAudioSettings
      ? V.Sound.getAudioSettings()
      : { musicEnabled: true, soundEnabled: true, musicVolume: 0.45, sfxVolume: 0.85, fadeDurationMs: 350 };
    const pb = V.Sound && V.Sound.getPlaybackState ? V.Sound.getPlaybackState() : { sceneId: 'main_menu', state: 'IDLE' };
    const sceneCfg = V.AudioConfig && pb.sceneId ? V.AudioConfig.getSceneConfig(pb.sceneId) : null;
    const themePill = V.Visual && V.Visual.renderThemePill ? V.Visual.renderThemePill() : '';

    const musicPct = Math.round((settings.musicVolume || 0) * 100);
    const sfxPct = Math.round((settings.sfxVolume || 0) * 100);
    const fadeMs = settings.fadeDurationMs || 350;

    const body = `
      <div class="v-audio-mixer">
        <div class="v-audio-row">
          <div>
            <strong>Active Audio Scene:</strong>
            <span style="color:#5eead4;font-weight:700;">${escapeHtml(sceneCfg ? sceneCfg.label : (pb.sceneId || 'None'))}</span>
            <div style="font-size:11.5px;color:#94a3b8;margin-top:2px;">
              Status: <code>${escapeHtml(sceneCfg ? sceneCfg.status : pb.state)}</code> • Playback: <code>${escapeHtml(pb.state)}</code>
            </div>
          </div>
          ${themePill}
        </div>

        <div class="v-audio-row">
          <label for="audio-music-slider">🎵 Music Volume</label>
          <input id="audio-music-slider" type="range" min="0" max="100" step="1" value="${musicPct}" />
          <span id="audio-music-val" class="v-audio-val">${musicPct}%</span>
          <button id="audio-btn-music-mute" class="ctrl-btn">${settings.musicEnabled ? 'Mute' : 'Unmute'}</button>
        </div>

        <div class="v-audio-row">
          <label for="audio-sfx-slider">🔊 SFX Volume</label>
          <input id="audio-sfx-slider" type="range" min="0" max="100" step="1" value="${sfxPct}" />
          <span id="audio-sfx-val" class="v-audio-val">${sfxPct}%</span>
          <button id="audio-btn-sfx-mute" class="ctrl-btn">${settings.soundEnabled ? 'Mute' : 'Unmute'}</button>
        </div>

        <div class="v-audio-row">
          <label for="audio-fade-select">🌊 Scene Crossfade</label>
          <select id="audio-fade-select" class="ctrl-btn" style="flex:1;max-width:220px;">
            <option value="0" ${fadeMs === 0 ? 'selected' : ''}>Instant (0 ms)</option>
            <option value="200" ${fadeMs === 200 ? 'selected' : ''}>Fast (200 ms)</option>
            <option value="350" ${fadeMs === 350 ? 'selected' : ''}>Smooth (350 ms)</option>
            <option value="600" ${fadeMs === 600 ? 'selected' : ''}>Cinematic (600 ms)</option>
          </select>
          <button id="audio-btn-test-sfx" class="ctrl-btn">🔔 Test SFX</button>
        </div>

        <div style="font-size:11.5px;color:#94a3b8;line-height:1.45;">
          Preferences save automatically to local storage. Existing menu, Classic AI, tutorial, and Scientist soundtracks are preserved; unassigned Frontier scenes remain silent until dedicated tracks are added to <code>assets/audio/</code> or registered in <code>audioConfig.js</code>.
        </div>
      </div>
    `;

    openModal('🎛 Audio Mixer & Scene Controls', body, (root) => {
      const mSlider = root.querySelector('#audio-music-slider');
      const mVal = root.querySelector('#audio-music-val');
      const mMute = root.querySelector('#audio-btn-music-mute');
      const sSlider = root.querySelector('#audio-sfx-slider');
      const sVal = root.querySelector('#audio-sfx-val');
      const sMute = root.querySelector('#audio-btn-sfx-mute');
      const fSelect = root.querySelector('#audio-fade-select');
      const testBtn = root.querySelector('#audio-btn-test-sfx');

      if (mSlider) {
        mSlider.addEventListener('input', () => {
          const pct = Number(mSlider.value);
          if (mVal) mVal.textContent = `${pct}%`;
          if (V.Sound && V.Sound.setMusicVolume) V.Sound.setMusicVolume(pct / 100);
        });
      }
      if (mMute) {
        mMute.addEventListener('click', () => {
          handleToggleMusic();
          const on = V.Sound && V.Sound.isMusicEnabled ? V.Sound.isMusicEnabled() : true;
          mMute.textContent = on ? 'Mute' : 'Unmute';
        });
      }
      if (sSlider) {
        sSlider.addEventListener('input', () => {
          const pct = Number(sSlider.value);
          if (sVal) sVal.textContent = `${pct}%`;
          if (V.Sound && V.Sound.setSfxVolume) V.Sound.setSfxVolume(pct / 100);
        });
      }
      if (sMute) {
        sMute.addEventListener('click', () => {
          handleToggleSFX();
          const on = V.Sound && V.Sound.isSoundEnabled ? V.Sound.isSoundEnabled() : true;
          sMute.textContent = on ? 'Mute' : 'Unmute';
        });
      }
      if (fSelect) {
        fSelect.addEventListener('change', () => {
          if (V.Sound && V.Sound.setFadeDuration) V.Sound.setFadeDuration(Number(fSelect.value));
        });
      }
      if (testBtn) {
        testBtn.addEventListener('click', () => {
          if (V.Sound) {
            V.Sound.unlockAudio();
            V.Sound.playSynthesize(16);
          }
        });
      }
    });
  }

  // Render live hero atom emblem on the Menu Screen
  const elMenuLogo = document.getElementById('menu-atom-logo');
  if (elMenuLogo && V.renderAtomSVG && V.ELEMENT_BY_SYMBOL && V.ELEMENT_BY_SYMBOL.C) {
    elMenuLogo.innerHTML = V.renderAtomSVG(V.ELEMENT_BY_SYMBOL.C);
  }

  // Menu Screen listeners
  const menuStory = document.getElementById('menu-btn-story');
  if (menuStory) menuStory.addEventListener('click', () => {
    if (V.Sound) { V.Sound.unlockAudio(); V.Sound.playButtonClick(); }
    if (V.StoryUI) V.StoryUI.openStoryHub('missions');
  });
  const menuFrontier = document.getElementById('menu-btn-frontier');
  if (menuFrontier) menuFrontier.addEventListener('click', () => {
    if (V.Sound) { V.Sound.unlockAudio(); V.Sound.playButtonClick(); }
    if (V.FrontierUI) V.FrontierUI.openFrontierHub('world', '');
  });
  const menuAi = document.getElementById('menu-btn-ai');
  if (menuAi) menuAi.addEventListener('click', () => { if (V.Sound) V.Sound.unlockAudio(); startNewGame('vs_ai'); });
  const menuPvp = document.getElementById('menu-btn-pvp');
  if (menuPvp) menuPvp.addEventListener('click', () => { if (V.Sound) V.Sound.unlockAudio(); startNewGame('pass_and_play'); });
  const menuTut = document.getElementById('menu-btn-tutorial');
  if (menuTut) menuTut.addEventListener('click', () => { if (V.Sound) V.Sound.playButtonClick(); openTutorialMenuModal(); });
  const menuPeriodic = document.getElementById('menu-btn-periodic');
  if (menuPeriodic) menuPeriodic.addEventListener('click', openPeriodicTableModal);
  const menuGallery = document.getElementById('menu-btn-gallery');
  if (menuGallery) menuGallery.addEventListener('click', openEventGalleryModal);
  const menuRules = document.getElementById('menu-btn-rules');
  if (menuRules) menuRules.addEventListener('click', openRulesModal);
  const menuCharStudio = document.getElementById('menu-btn-char-studio');
  if (menuCharStudio) menuCharStudio.addEventListener('click', () => {
    if (V.Sound) { V.Sound.unlockAudio(); V.Sound.playButtonClick(); }
    if (V.FrontierUI && V.FrontierUI.openPortraitPrototypeStudio) {
      V.FrontierUI.openPortraitPrototypeStudio({ origin: 'menu' });
    }
  });
  const menuMusic = document.getElementById('menu-btn-music');
  if (menuMusic) menuMusic.addEventListener('click', handleToggleMusic);
  const menuPickMusic = document.getElementById('menu-btn-pick-music');
  const menuMusicFile = document.getElementById('menu-music-file');
  if (menuPickMusic && menuMusicFile) {
    menuPickMusic.addEventListener('click', () => menuMusicFile.click());
    menuMusicFile.addEventListener('change', () => {
      const file = menuMusicFile.files && menuMusicFile.files[0];
      const bgm = document.getElementById('bgm-menu');
      if (!file || !bgm) return;
      const objUrl = URL.createObjectURL(file);
      bgm.src = objUrl;
      bgm.load();
      if (V.Sound) {
        V.Sound.setMusicEnabled(true);
        V.Sound.setMusicMode('menu');
      }
      syncPreferenceButtons();
    });
  }
  const menuSfx = document.getElementById('menu-btn-sfx');
  if (menuSfx) menuSfx.addEventListener('click', handleToggleSFX);
  const menuAudioSettings = document.getElementById('menu-btn-audio-settings');
  if (menuAudioSettings) menuAudioSettings.addEventListener('click', () => {
    if (V.Sound) V.Sound.playButtonClick();
    openAudioSettingsModal();
  });
  const menuFx = document.getElementById('menu-btn-fx');
  if (menuFx) menuFx.addEventListener('click', handleToggleFX);

  // In-Match Topbar & Sidebar listeners
  const btnBackMenu = document.getElementById('btn-back-menu');
  if (btnBackMenu) btnBackMenu.addEventListener('click', () => { if (V.Sound) V.Sound.playButtonClick(); showMenuScreen(); });
  const btnMusicToggle = document.getElementById('btn-music-toggle');
  if (btnMusicToggle) btnMusicToggle.addEventListener('click', handleToggleMusic);
  const btnFxToggle = document.getElementById('btn-fx-toggle');
  if (btnFxToggle) btnFxToggle.addEventListener('click', handleToggleFX);
  const btnSfxToggle = document.getElementById('btn-sfx-toggle');
  if (btnSfxToggle) btnSfxToggle.addEventListener('click', handleToggleSFX);
  const btnAudioSettings = document.getElementById('btn-audio-settings');
  if (btnAudioSettings) btnAudioSettings.addEventListener('click', () => {
    if (V.Sound) V.Sound.playButtonClick();
    openAudioSettingsModal();
  });
  const btnSidebarToggle = document.getElementById('btn-sidebar-toggle');
  if (btnSidebarToggle) btnSidebarToggle.addEventListener('click', toggleSidebar);
  const tabHints = document.getElementById('tab-hints');
  if (tabHints) tabHints.addEventListener('click', () => { if (V.Sound) V.Sound.playButtonClick(); setSidebarTab('hints'); });
  const tabLog = document.getElementById('tab-log');
  if (tabLog) tabLog.addEventListener('click', () => { if (V.Sound) V.Sound.playButtonClick(); setSidebarTab('log'); });

  document.getElementById('btn-periodic').addEventListener('click', openPeriodicTableModal);
  document.getElementById('btn-rules').addEventListener('click', openRulesModal);
  const btnConcede = document.getElementById('btn-concede');
  if (btnConcede) {
    btnConcede.addEventListener('click', () => {
      if (!state || state.phase === 'GAME_OVER') return;
      if (activeTutorialIndex !== null) {
        showMenuScreen();
        return;
      }
      clearAITimer();
      V.concedeMatch(state, getViewingPlayerIndex());
      renderAll();
    });
  }
  document.getElementById('btn-new-game').addEventListener('click', () => {
    if (activeTutorialIndex !== null) startTutorialLesson(activeTutorialIndex);
    else if (activeFrontierEncounterId) startFrontierEncounter(activeFrontierEncounterId);
    else if (activeStoryMission) startStoryEncounter(activeStoryMission);
    else startNewGame(currentMode);
  });
  elModalRoot.addEventListener('click', (e) => {
    if (e.target === elModalRoot) {
      if (state && state.phase === 'GAME_OVER') return;
      closeModal();
    }
  });

  // ===== HOVER-EXPAND TEXT BOX POPOVER (Zero-clipping, viewport-clamped) =====
  let activeExpandBox = null;
  let expandPopoverEl = null;

  function ensureExpandPopover() {
    if (!expandPopoverEl) {
      expandPopoverEl = document.createElement('div');
      expandPopoverEl.id = 'textbox-expand-popover';
      expandPopoverEl.className = 'textbox-expand-popover hidden';
      document.body.appendChild(expandPopoverEl);
    }
    return expandPopoverEl;
  }

  function showExpandedTextBox(targetEl) {
    if (!targetEl || targetEl.closest('.vcard-large')) return;
    activeExpandBox = targetEl;
    const pop = ensureExpandPopover();

    // Mirror exact visual class & inline colors (scroll parchment, group-colored ability, or effect box)
    const isScroll = targetEl.classList.contains('vcard-scroll');
    const isAbility = targetEl.classList.contains('vcard-ability-panel');
    const isHydrogenAbility = targetEl.classList.contains('ability-hydrogen');

    pop.className = 'textbox-expand-popover';
    pop.removeAttribute('style');

    if (isScroll) {
      pop.classList.add('expand-scroll');
    } else if (isAbility) {
      pop.classList.add('expand-ability');
      if (isHydrogenAbility) {
        pop.classList.add('ability-hydrogen');
      } else {
        if (targetEl.style.background) pop.style.background = targetEl.style.background;
        if (targetEl.style.color) pop.style.color = targetEl.style.color;
      }
    } else {
      pop.classList.add('expand-effect');
    }

    pop.innerHTML = targetEl.innerHTML;

    // Position cleanly anchored over the hovered box, expanding upward if near the bottom of screen
    const rect = targetEl.getBoundingClientRect();
    const popWidth = Math.max(228, Math.min(285, rect.width + 130));
    pop.style.width = `${popWidth}px`;
    pop.style.visibility = 'hidden';
    pop.classList.remove('hidden');

    const popRect = pop.getBoundingClientRect();
    const margin = 10;

    let left = rect.left + rect.width / 2 - popRect.width / 2;
    left = Math.max(margin, Math.min(window.innerWidth - popRect.width - margin, left));

    // Align bottom of expanded box with bottom of original box (expands upward naturally over hand cards!)
    let top = rect.bottom - popRect.height;
    if (top < margin) {
      top = Math.min(window.innerHeight - popRect.height - margin, rect.top);
    }
    top = Math.max(margin, top);

    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    pop.style.visibility = 'visible';
    pop.classList.add('visible');
  }

  function hideExpandedTextBox() {
    activeExpandBox = null;
    if (expandPopoverEl) {
      expandPopoverEl.classList.remove('visible');
      expandPopoverEl.classList.add('hidden');
    }
  }

  document.addEventListener('mouseover', (e) => {
    const box = e.target && e.target.closest
      ? e.target.closest('.vcard:not(.vcard-large) .vcard-scroll, .vcard:not(.vcard-large) .vcard-ability-panel, .vcard:not(.vcard-large) .vcard-effect-box')
      : null;
    if (box) {
      if (box !== activeExpandBox) showExpandedTextBox(box);
    } else if (activeExpandBox) {
      hideExpandedTextBox();
    }
  });

  document.addEventListener('pointerdown', hideExpandedTextBox, { passive: true });
  window.addEventListener('scroll', hideExpandedTextBox, { passive: true });

  // Expose clean UI bridge for modular Story Mode & Frontier controllers
  V.UI = {
    openModal,
    closeModal,
    startStoryEncounter,
    startFrontierEncounter,
    showMenuScreen,
  };

  // Boot cleanly on the Home Menu Screen
  setSidebarTab('hints');
  showMenuScreen();
})(typeof window !== 'undefined' ? window : globalThis);

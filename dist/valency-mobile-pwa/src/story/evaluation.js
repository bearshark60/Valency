// VALENCY — Academy Licensure Performance Evaluation System
// Completely separate from ordinary Stability Point (SP) scoring.
// Tracks Synthesis Competency, Stability Management, Defensive Competency,
// Tactical Competency, Overall Examination Performance, and Licensure Tier
// (Provisional, Standard, Honors).

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const LICENSURE_TIERS = Object.freeze({
    NONE: 'Not Yet Certified',
    PROVISIONAL: 'Provisional Licensure',
    STANDARD: 'Standard Licensure',
    HONORS: 'Honors Licensure',
  });

  function createTelemetryTracker() {
    return {
      compoundsSynthesized: 0,
      formulasSynthesized: new Set(),
      periodicGroupsUsed: new Set(),
      elementsUsed: new Set(),
      maxSingleCompoundSP: 0,
      unstableStaged: 0,
      unstableStabilized: 0,
      unstableCollapsed: 0,
      shieldsDeployed: 0,
      buffersUsed: 0,
      resonanceUsed: 0,
      enTakeovers: 0,
      redEventsPlayed: 0,
      yellowEventsPlayed: 0,
      specialAbilitiesTriggered: 0,
      spLostToOpponent: 0,
      _seenLogIds: new Set(),
    };
  }

  /**
   * Passively ingest new log entries and current board state into the evaluation tracker.
   * Never mutates game state or SP scoring!
   */
  function updateTelemetryFromState(tracker, state, playerIndex) {
    if (!tracker || !state) return tracker;
    const pIdx = playerIndex === undefined ? 0 : playerIndex;
    const player = state.players[pIdx];
    const opp = state.players[pIdx === 0 ? 1 : 0];
    if (!player) return tracker;

    // Scan active field compounds for group & element diversity
    for (const comp of player.field) {
      if (comp.unstable || comp.inactive) continue;
      tracker.formulasSynthesized.add(comp.formula);
      const sp = V.getCompoundSP ? V.getCompoundSP(comp) : comp.baseSP;
      if (sp > tracker.maxSingleCompoundSP) tracker.maxSingleCompoundSP = sp;
      for (const el of comp.elements) {
        tracker.elementsUsed.add(el.symbol);
        if (el.group) tracker.periodicGroupsUsed.add(el.group);
      }
    }

    // Scan newly added log entries (chronological by id)
    for (const entry of state.log || []) {
      if (tracker._seenLogIds.has(entry.id)) continue;
      tracker._seenLogIds.add(entry.id);
      const meta = entry.meta || {};
      const msg = entry.message || '';
      const isPlayerActor =
        meta.playerId === pIdx ||
        meta.attackerId === pIdx ||
        msg.startsWith(player.name) ||
        msg.includes(`${player.name}'s`) === false && msg.includes(player.name);

      if (meta.type === 'SYNTHESIZE' && meta.playerId === pIdx) {
        tracker.compoundsSynthesized += 1;
        if (meta.formula) tracker.formulasSynthesized.add(meta.formula);
        if ((meta.sp || 0) > tracker.maxSingleCompoundSP) tracker.maxSingleCompoundSP = meta.sp || 0;
      } else if (meta.type === 'STABILIZE_COMPOUND' && meta.playerId === pIdx) {
        tracker.unstableStabilized += 1;
        tracker.compoundsSynthesized += 1;
        if (meta.formula) tracker.formulasSynthesized.add(meta.formula);
        if ((meta.sp || 0) > tracker.maxSingleCompoundSP) tracker.maxSingleCompoundSP = meta.sp || 0;
      } else if (meta.type === 'UNSTABLE_PLAYED' && meta.playerId === pIdx) {
        tracker.unstableStaged += 1;
      } else if (meta.type === 'UNSTABLE_DECAY' && msg.includes(`${player.name}'s`)) {
        tracker.unstableCollapsed += 1;
      } else if (meta.type === 'SHIELD' && meta.playerId === pIdx) {
        tracker.shieldsDeployed += 1;
      } else if (meta.type === 'BUFFER_SOLUTION' && msg.includes(`${player.name}'s`)) {
        tracker.buffersUsed += 1;
        tracker.yellowEventsPlayed += 1;
      } else if (meta.type === 'EN_TAKEOVER') {
        if (meta.attackerId === pIdx) {
          tracker.enTakeovers += 1;
          if (meta.newFormula) tracker.formulasSynthesized.add(meta.newFormula);
        }
        if (meta.victimId === pIdx) {
          tracker.spLostToOpponent += 8;
        }
      } else if (
        (meta.type === 'ACID_RAIN' ||
          meta.type === 'BOND_CLEAVAGE' ||
          meta.type === 'PRECIPITATION' ||
          meta.type === 'ELECTROLYSIS' ||
          meta.type === 'HALF_LIFE_DECAY' ||
          meta.type === 'IONIZATION_SURGE' ||
          meta.type === 'REACTION_DELAY' ||
          meta.type === 'OXIDATION')
      ) {
        if (msg.includes(`${opp.name}'s`) || msg.startsWith(`${meta.type.replace(/_/g, ' ')}! ${player.name}`) || (entry.category === 'event' && !msg.includes(`${player.name}'s`) && isPlayerActor)) {
          tracker.redEventsPlayed += 1;
        } else if (msg.includes(`${player.name}'s`) && meta.lostSP) {
          tracker.spLostToOpponent += meta.lostSP;
        }
      } else if (
        meta.type === 'DIFFUSION' ||
        meta.type === 'THERMAL_ACTIVATION' ||
        meta.type === 'EQUILIBRIUM_SHIFT' ||
        meta.type === 'SYNTHESIS_ACCELERATOR' ||
        (entry.category === 'instance' && msg.includes(player.name))
      ) {
        if (msg.includes('RESONANCE STABILIZER!') && msg.includes(player.name)) {
          tracker.resonanceUsed += 1;
        }
        if (msg.includes(player.name)) {
          tracker.yellowEventsPlayed += 1;
        }
      } else if (
        meta.type === 'SALT_CURE' ||
        meta.type === 'HYDROCARBON_SYNERGY' ||
        meta.type === 'RAPID_OXIDATION' ||
        meta.type === 'CHLORAMINE_HAZARD' ||
        meta.type === 'LIQUID_EMBRITTLEMENT' ||
        meta.type === 'LUMINESCENCE'
      ) {
        if (meta.playerId === pIdx || msg.includes(player.name)) {
          tracker.specialAbilitiesTriggered += 1;
        }
      }
    }

    return tracker;
  }

  function clampScore(v) {
    return Math.max(0, Math.min(100, Math.round(v)));
  }

  /**
   * Evaluate completed examination into 4 competency scores + overall score + Licensure Tier.
   */
  function evaluateExamination(tracker, state, playerIndex) {
    const pIdx = playerIndex === undefined ? 0 : playerIndex;
    updateTelemetryFromState(tracker, state, pIdx);

    const player = state.players[pIdx];
    const won = state.phase === 'GAME_OVER' && state.winnerIndex === pIdx;
    const playerSP = V.getPlayerSP ? V.getPlayerSP(player) : 0;
    const activeCount = player.field.filter((c) => !c.inactive && !c.unstable).length;
    const shieldedCount = player.field.filter((c) => !c.inactive && c.shield).length;

    // 1. Synthesis Competency (0-100)
    const synthScore = clampScore(
      30 +
      Math.min(35, tracker.compoundsSynthesized * 12) +
      Math.min(20, tracker.formulasSynthesized.size * 7) +
      Math.min(15, tracker.periodicGroupsUsed.size * 4) +
      (tracker.maxSingleCompoundSP >= 12 ? 8 : 0)
    );

    // 2. Stability Management (0-100)
    const stabilityScore = clampScore(
      72 +
      tracker.unstableStabilized * 16 -
      tracker.unstableCollapsed * 24 -
      Math.min(24, Math.floor(tracker.spLostToOpponent * 0.8)) +
      (activeCount >= 2 ? 10 : 0) +
      (won ? 12 : 0)
    );

    // 3. Defensive Competency (0-100)
    const defensiveActions = tracker.shieldsDeployed + tracker.buffersUsed + tracker.resonanceUsed + shieldedCount;
    const defensiveScore = clampScore(
      46 +
      Math.min(36, defensiveActions * 16) +
      (tracker.spLostToOpponent === 0 ? 18 : Math.max(0, 12 - Math.floor(tracker.spLostToOpponent / 2)))
    );

    // 4. Tactical Competency (0-100)
    const tacticalScore = clampScore(
      42 +
      Math.min(28, tracker.enTakeovers * 22) +
      Math.min(22, (tracker.redEventsPlayed + tracker.yellowEventsPlayed) * 9) +
      Math.min(16, tracker.specialAbilitiesTriggered * 10) +
      (won && state.turnNumber <= 8 ? 8 : 0)
    );

    const overall = clampScore(
      synthScore * 0.30 +
      stabilityScore * 0.25 +
      defensiveScore * 0.22 +
      tacticalScore * 0.23
    );

    let licensureTier = LICENSURE_TIERS.NONE;
    if (won) {
      if (overall >= 82) licensureTier = LICENSURE_TIERS.HONORS;
      else if (overall >= 62) licensureTier = LICENSURE_TIERS.STANDARD;
      else licensureTier = LICENSURE_TIERS.PROVISIONAL;
    }

    return {
      won,
      playerSP,
      turns: state.turnNumber,
      competencies: {
        synthesis: synthScore,
        stability: stabilityScore,
        defensive: defensiveScore,
        tactical: tacticalScore,
      },
      overall,
      licensureTier,
      snapshot: {
        compoundsSynthesized: tracker.compoundsSynthesized,
        distinctFormulas: Array.from(tracker.formulasSynthesized),
        periodicGroupsUsed: Array.from(tracker.periodicGroupsUsed),
        elementsUsed: Array.from(tracker.elementsUsed),
        maxSingleCompoundSP: tracker.maxSingleCompoundSP,
        unstableStaged: tracker.unstableStaged,
        unstableStabilized: tracker.unstableStabilized,
        unstableCollapsed: tracker.unstableCollapsed,
        shieldsDeployed: tracker.shieldsDeployed,
        buffersUsed: tracker.buffersUsed,
        resonanceUsed: tracker.resonanceUsed,
        enTakeovers: tracker.enTakeovers,
        redEventsPlayed: tracker.redEventsPlayed,
        yellowEventsPlayed: tracker.yellowEventsPlayed,
        specialAbilitiesTriggered: tracker.specialAbilitiesTriggered,
      },
    };
  }

  /**
   * Compute cumulative Chapter 0 Academy Licensure Tier across completed examinations.
   */
  function computeOverallAcademyLicensure(examRecords) {
    const records = (examRecords || []).filter((r) => r && r.won);
    if (records.length === 0) return LICENSURE_TIERS.NONE;
    const avg = records.reduce((sum, r) => sum + (r.overall || 0), 0) / records.length;
    if (avg >= 82) return LICENSURE_TIERS.HONORS;
    if (avg >= 62) return LICENSURE_TIERS.STANDARD;
    return LICENSURE_TIERS.PROVISIONAL;
  }

  V.Story = V.Story || {};
  V.Story.LICENSURE_TIERS = LICENSURE_TIERS;
  V.Story.createTelemetryTracker = createTelemetryTracker;
  V.Story.updateTelemetryFromState = updateTelemetryFromState;
  V.Story.evaluateExamination = evaluateExamination;
  V.Story.computeOverallAcademyLicensure = computeOverallAcademyLicensure;
})(typeof window !== 'undefined' ? window : globalThis);

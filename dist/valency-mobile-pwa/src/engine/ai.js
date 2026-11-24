// VALENCY — Configurable Strategy-Driven Chemistry AI Planner
// Drives Classic Mode (defaulting to Mendeleev config) AND Story Mode historical scientist simulations.
// Strictly uses existing gameEngine.js legal action validation — zero extra cards, zero hidden stats.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const FALLBACK_CONFIG = {
    configId: 'opp_classic_default',
    difficulty: 'standard',
    strategyProfile: 'Classic Balanced Synthesis',
    cardSelectionPreferences: {
      affinitySymbols: ['C', 'Cl', 'O', 'F'],
      affinityWeight: 1.5,
      reclaimPriority: ['F', 'O', 'Cl', 'C', 'H'],
      discardProtect: ['F', 'O', 'Cl'],
    },
    synthesisPriorities: {
      spWeight: 1.2,
      efficiencyPerCardWeight: 1.0,
      preferNaturalOverCatalyst: 1.5,
      allowUnstableStaging: true,
      unstableMaxOnField: 1,
      exothermicMinSP: 8,
      chainReactionMinCards: 3,
      avoidSelfDiscardRisk: true,
    },
    defensivePriorities: {
      shieldBeforeAttack: true,
      bufferMinActiveCompounds: 1,
      resonanceEnabled: true,
      recycleInactiveWithEquilibrium: true,
    },
    eventCardPreferences: {
      redOrder: ['ELECTROLYSIS', 'ACID_RAIN', 'BOND_CLEAVAGE', 'PRECIPITATION', 'HALF_LIFE_DECAY'],
      yellowOrder: ['SYNTHESIS_ACCELERATOR', 'BUFFER_SOLUTION', 'RESONANCE_STABILIZER', 'THERMAL_ACTIVATION', 'DISTILLATION', 'EQUILIBRIUM_SHIFT'],
      useOxidationMinOppElements: 2,
      useReactionDelayMinOppSP: 10,
      useDiffusionIfHandSmaller: true,
    },
    enDisplacementEvaluation: {
      enabled: true,
      evaluateBeforeDefense: true,
      stripShieldBeforeTakeover: false,
      minNetSwing: 6,
      pierceShieldBonus: 4,
    },
    legalMoveValidation: true,
    decisionLogging: true,
  };

  function resolveConfig(state, explicitConfig) {
    if (explicitConfig) return explicitConfig;
    const configId = state && state.opponentConfigId;
    if (configId && V.Story && V.Story.getOpponentConfig) {
      return V.Story.getOpponentConfig(configId);
    }
    if (V.Story && V.Story.OPPONENT_CONFIGS && V.Story.OPPONENT_CONFIGS.opp_mendeleev) {
      return V.Story.OPPONENT_CONFIGS.opp_mendeleev;
    }
    return FALLBACK_CONFIG;
  }

  function recordDecision(state, cfg, action, reasoning) {
    if (!cfg.decisionLogging) return;
    if (!state.aiDecisionLog) state.aiDecisionLog = [];
    state.aiDecisionLog.push({
      turn: state.turnNumber,
      phase: state.phase,
      playerIndex: state.activePlayerIndex,
      opponentConfigId: cfg.configId,
      strategyProfile: cfg.strategyProfile,
      action,
      legalValidated: true,
      reasoning,
    });
    if (state.aiDecisionLog.length > 200) state.aiDecisionLog.shift();
  }

  function findBestTakeover(ai, human, state, cfg) {
    if (!cfg.enDisplacementEvaluation || !cfg.enDisplacementEvaluation.enabled) return null;
    const minSwing = cfg.enDisplacementEvaluation.minNetSwing || 0;
    const pierceBonus = cfg.enDisplacementEvaluation.pierceShieldBonus || 4;
    const affinitySet = new Set((cfg.cardSelectionPreferences && cfg.cardSelectionPreferences.affinitySymbols) || []);

    let best = null;
    let bestScore = -Infinity;
    const aiElements = ai.hand.filter((c) => c.kind === 'element');

    for (const atk of aiElements) {
      for (const targetComp of human.field) {
        if (targetComp.unstable || targetComp.inactive) continue;
        const moves = V.findENTakeoversForCard(atk, ai.hand, targetComp);
        for (const mv of moves) {
          const humanLoss = V.getCompoundSP(targetComp);
          const netSwing = mv.baseSP + humanLoss;
          const winsNow = V.getPlayerSP(ai) + mv.baseSP >= state.winSP;
          if (!winsNow && netSwing < minSwing) continue;

          const affinityBonus = affinitySet.has(atk.symbol) ? 2.5 : 0;
          const score =
            netSwing +
            (mv.piercesHeavyShield ? pierceBonus : 0) +
            affinityBonus -
            mv.extraHandCards.length * 2 +
            (winsNow ? 120 : 0);

          if (score > bestScore) {
            bestScore = score;
            best = { ownerIdx: human.id, move: mv, targetComp, score, netSwing };
          }
        }
      }
    }
    return best;
  }

  function makePlan(state, cfg, action, showcaseCards, headline, subtitle, reasoning, execFn) {
    return {
      action,
      opponentConfigId: cfg.configId,
      showcaseCards: showcaseCards || [],
      headline: headline || '',
      subtitle: subtitle || '',
      reasoning: reasoning || '',
      execute() {
        recordDecision(state, cfg, action, reasoning);
        return execFn();
      },
    };
  }

  function planShieldMove(state, ai, cfg) {
    const nobleGas = ai.hand.find((c) => c.kind === 'noble_gas');
    if (!nobleGas) return null;
    const unshielded = ai.field
      .filter((c) => !c.inactive && !c.unstable && !c.shield)
      .sort((a, b) => V.getCompoundSP(b) - V.getCompoundSP(a));
    if (unshielded.length === 0) return null;

    const target = unshielded[0];
    return makePlan(
      state,
      cfg,
      'shield',
      [nobleGas],
      `${ai.name} deploys ${nobleGas.name} Shield!`,
      `Protecting ${target.formula} (+${V.getCompoundSP(target)} SP)`,
      `Protected highest-SP active compound ${target.formula} (${V.getCompoundSP(target)} SP) using ${nobleGas.name}.`,
      () => {
        V.playNobleGasShield(state, nobleGas.id, target.id);
        return { done: false, action: 'shield' };
      }
    );
  }

  function planIonizationMove(state, ai, human, cfg) {
    const ionSurge = ai.hand.find((c) => c.effectId === 'IONIZATION_SURGE');
    if (!ionSurge || human.bufferProtected) return null;
    const shielded = human.field
      .filter((c) => !c.inactive && c.shield)
      .sort((a, b) => V.getCompoundSP(b) - V.getCompoundSP(a));
    if (shielded.length === 0) return null;

    const target = shielded[0];
    return makePlan(
      state,
      cfg,
      'ionization_surge',
      [ionSurge],
      `${ai.name} plays Ionization Surge!`,
      `Stripping ${target.shield.name} off your ${target.formula}`,
      `Stripped ${target.shield.name} shield from ${target.formula} to expose it to bonding/event pressure.`,
      () => {
        V.playEventOrInstance(state, ionSurge.id, { targetCompoundId: target.id });
        return { done: false, action: 'ionization_surge' };
      }
    );
  }

  function planYellowUtilityMove(state, ai, human, cfg, eff) {
    const card = ai.hand.find((c) => c.effectId === eff);
    if (!card) return null;

    if (eff === 'SYNTHESIS_ACCELERATOR') {
      if (V.findPlayableCompounds(ai.hand, { allowCatalyst: true }).length === 0) return null;
      return makePlan(
        state, cfg, 'synthesis_accelerator', [card],
        `${ai.name} plays Synthesis Accelerator!`,
        'Unlocking a bonus 2nd Synthesis this turn',
        'Had another legal real compound ready in hand — unlocked bonus Synthesis.',
        () => {
          V.playEventOrInstance(state, card.id, {});
          return { done: false, action: 'synthesis_accelerator' };
        }
      );
    }

    if (eff === 'BUFFER_SOLUTION') {
      const minActive = (cfg.defensivePriorities && cfg.defensivePriorities.bufferMinActiveCompounds) || 1;
      const unshieldedCount = ai.field.filter((c) => !c.inactive && !c.unstable && !c.shield).length;
      if (ai.bufferProtected || unshieldedCount < minActive) return null;
      return makePlan(
        state, cfg, 'buffer_solution', [card],
        `${ai.name} plays Buffer Solution!`,
        'Protecting their entire field from Red Events',
        `Activated Buffer Solution to protect ${unshieldedCount} unshielded active compound(s).`,
        () => {
          V.playEventOrInstance(state, card.id, {});
          return { done: false, action: 'buffer_solution' };
        }
      );
    }

    if (eff === 'RESONANCE_STABILIZER') {
      if (cfg.defensivePriorities && !cfg.defensivePriorities.resonanceEnabled) return null;
      const targets = ai.field
        .filter((c) => !c.inactive && !c.unstable && !c.shield && !c.resonanceCard)
        .sort((a, b) => V.getCompoundSP(b) - V.getCompoundSP(a));
      if (targets.length === 0) return null;
      const target = targets[0];
      return makePlan(
        state, cfg, 'resonance', [card],
        `${ai.name} plays Resonance Stabilizer!`,
        `Fortifying ${target.formula} against the next Red Event`,
        `Attached Resonance Stabilizer to ${target.formula} (${V.getCompoundSP(target)} SP).`,
        () => {
          V.playEventOrInstance(state, card.id, { targetCompoundId: target.id });
          return { done: false, action: 'resonance' };
        }
      );
    }

    if (eff === 'EQUILIBRIUM_SHIFT') {
      if (cfg.defensivePriorities && !cfg.defensivePriorities.recycleInactiveWithEquilibrium) return null;
      const badComp = ai.field.find((c) => c.inactive || c.decayHalved);
      if (!badComp) return null;
      return makePlan(
        state, cfg, 'equilibrium_shift', [card],
        `${ai.name} plays Equilibrium Shift!`,
        `Recycling ${badComp.formula} & drawing 3 cards`,
        `Recycled impaired compound ${badComp.formula} to hand and drew 3 cards.`,
        () => {
          V.playEventOrInstance(state, card.id, { targetCompoundId: badComp.id });
          return { done: false, action: 'equilibrium_shift' };
        }
      );
    }

    if (eff === 'DISTILLATION') {
      const discardElems = state.discardPile.filter((c) => c.kind === 'element' || c.kind === 'noble_gas');
      if (discardElems.length === 0) return null;
      const prioList = (cfg.cardSelectionPreferences && cfg.cardSelectionPreferences.reclaimPriority) || ['F', 'O', 'Cl', 'C', 'H'];
      discardElems.sort((a, b) => {
        const idxA = prioList.indexOf(a.symbol);
        const idxB = prioList.indexOf(b.symbol);
        const scoreA = (a.kind === 'noble_gas' ? 12 : a.en) + (idxA >= 0 ? (10 - idxA) * 2 : 0);
        const scoreB = (b.kind === 'noble_gas' ? 12 : b.en) + (idxB >= 0 ? (10 - idxB) * 2 : 0);
        return scoreB - scoreA;
      });
      const pick = discardElems[0];
      return makePlan(
        state, cfg, 'distillation', [card],
        `${ai.name} plays Distillation!`,
        `Reclaiming ${pick.name} (${pick.symbol}) from the Discard Pile`,
        `Reclaimed priority reagent ${pick.symbol} from Discard Pile via Distillation.`,
        () => {
          V.playEventOrInstance(state, card.id, { discardCardId: pick.id });
          return { done: false, action: 'distillation' };
        }
      );
    }

    if (eff === 'THERMAL_ACTIVATION') {
      if (ai.hand.length > 7) return null;
      return makePlan(
        state, cfg, 'thermal_activation', [card],
        `${ai.name} plays Thermal Activation!`,
        'Drawing 3 cards and discarding 1',
        'Accelerated hand selection via Thermal Activation (+3 draw, -1 discard).',
        () => {
          V.playEventOrInstance(state, card.id, {});
          return { done: false, action: 'thermal_activation' };
        }
      );
    }

    return null;
  }

  /**
   * Inspect `state` and plan the opponent's next single legal move WITHOUT mutating state yet.
   * Returns { action, opponentConfigId, showcaseCards, headline, subtitle, reasoning, execute() }
   */
  function planAIStep(state, explicitConfig) {
    const cfg = resolveConfig(state, explicitConfig);
    if (state.phase === 'GAME_OVER') {
      return makePlan(state, cfg, 'game_over', [], '', '', 'Game already over.', () => ({ done: true, action: 'game_over' }));
    }
    const ai = V.getActivePlayer(state);
    const human = V.getOpponent(state);
    if (!ai.isAI) {
      return makePlan(state, cfg, 'not_ai', [], '', '', 'Active player is human.', () => ({ done: true, action: 'not_ai' }));
    }

    // ===== PRIORITY 0: Stabilize any Unstable Compound on AI's field via legal 1-element swap =====
    const unstableOnField = ai.field.filter((c) => c.unstable && !c.inactive);
    for (const uComp of unstableOnField) {
      const swaps = V.findUnstableStabilizeSwaps(uComp, ai.hand);
      if (swaps.length > 0) {
        const bestSwap = swaps[0];
        return makePlan(
          state, cfg, 'stabilize_unstable', [bestSwap.addCard],
          `${ai.name} stabilizes ${uComp.formula}!`,
          `Swapping ${bestSwap.removeCard.symbol} ↔ ${bestSwap.addCard.symbol} → ${bestSwap.compound.formula} (+${bestSwap.baseSP} SP)`,
          `Stabilized ${uComp.formula} into legal ${bestSwap.compound.formula} (${bestSwap.baseSP} SP).`,
          () => {
            V.stabilizeUnstableCompound(state, bestSwap);
            return { done: state.phase === 'GAME_OVER', action: 'stabilize_unstable' };
          }
        );
      }
    }

    // ===== PHASE 2: SYNTHESIS =====
    if (state.phase === 'SYNTHESIS') {
      const options = V.findPlayableCompounds(ai.hand, { allowCatalyst: true });
      if (options.length > 0) {
        const aiSP = V.getPlayerSP(ai);
        options.sort((a, b) => rateSynthesisOption(b, ai, human, aiSP, cfg) - rateSynthesisOption(a, ai, human, aiSP, cfg));

        const best = options[0];
        const chosenCards = [...best.cards];
        if (best.useCatalyst && best.catalystCard) chosenCards.push(best.catalystCard);

        const spPrio = cfg.synthesisPriorities;
        const exo = ai.hand.find((c) => c.effectId === 'EXOTHERMIC_SURGE');
        if (exo && (aiSP + best.baseSP + 3 >= state.winSP || best.baseSP >= (spPrio.exothermicMinSP || 8))) {
          chosenCards.push(exo);
        }

        const chain = ai.hand.find((c) => c.effectId === 'CHAIN_REACTION');
        if (chain && (best.cards.length >= (spPrio.chainReactionMinCards || 3) || ai.hand.length <= 4)) {
          chosenCards.push(chain);
        }

        const selectedIds = chosenCards.map((c) => c.id);
        return makePlan(
          state, cfg, 'synthesize', chosenCards,
          `${ai.name} synthesizes ${best.compound.name} (${best.compound.formula})!`,
          `Bonding ${chosenCards.map((c) => c.symbol || c.name).join(' + ')}`,
          `Selected ${best.compound.formula} (${best.baseSP} base SP, ${best.cards.length} atoms) under ${cfg.strategyProfile}.`,
          () => {
            const res = V.synthesizeCompound(state, selectedIds);
            if (!res.ok) V.passSynthesis(state);
            return { done: state.phase === 'GAME_OVER', action: 'synthesize' };
          }
        );
      }

      // Optional strategic Unstable Compound staging (disabled for Lavoisier conservationist profile!)
      const maxUnstable = cfg.synthesisPriorities.unstableMaxOnField || 0;
      if (cfg.synthesisPriorities.allowUnstableStaging && unstableOnField.length < maxUnstable) {
        const elems = ai.hand.filter((c) => c.kind === 'element');
        const affSet = new Set((cfg.cardSelectionPreferences && cfg.cardSelectionPreferences.affinitySymbols) || []);
        // Sort so affinity/higher-EN elements are considered first for staging
        elems.sort((a, b) => ((affSet.has(b.symbol) ? 3 : 0) + b.en) - ((affSet.has(a.symbol) ? 3 : 0) + a.en));
        if (elems.length >= 2) {
          for (let i = 0; i < elems.length; i++) {
            for (let j = i + 1; j < elems.length; j++) {
              const pair = [elems[i], elems[j]];
              const check = V.validateUnstableSynthesis(pair);
              if (check.valid) {
                return makePlan(
                  state, cfg, 'synthesize_unstable', pair,
                  `${ai.name} stages Unstable ${check.formula}!`,
                  'Must swap 1 element next turn or it decomposes',
                  `No stable synthesis available; staged 1-swap-stabilizable Unstable ${check.formula}.`,
                  () => {
                    const res = V.synthesizeUnstableCompound(state, pair.map((c) => c.id));
                    if (!res.ok) V.passSynthesis(state);
                    return { done: false, action: 'synthesize_unstable' };
                  }
                );
              }
            }
          }
        }
      }

      return makePlan(
        state, cfg, 'pass_synthesis', [],
        `${ai.name} passes Synthesis`,
        'Entering Phase 3: Defense & Events',
        'No legal synthesis matched strategy threshold; advancing to Phase 3.',
        () => {
          V.passSynthesis(state);
          return { done: false, action: 'pass_synthesis' };
        }
      );
    }

    // ===== PHASE 3: DEFENSE & EVENTS =====
    if (state.phase === 'DEFENSE') {
      const enCfg = cfg.enDisplacementEvaluation || {};
      const defCfg = cfg.defensivePriorities || {};
      const evCfg = cfg.eventCardPreferences || {};

      // Pauling & aggressive tacticians: strip shields before EN Takeovers if helpful, then hunt EN Takeovers FIRST!
      if (enCfg.evaluateBeforeDefense) {
        if (enCfg.stripShieldBeforeTakeover) {
          const ionPlan = planIonizationMove(state, ai, human, cfg);
          if (ionPlan) return ionPlan;
        }
        const takeover = findBestTakeover(ai, human, state, cfg);
        if (takeover) {
          const mv = takeover.move;
          const usedCards = [mv.attackCard, ...(mv.extraHandCards || [])];
          return makePlan(
            state, cfg, 'en_takeover', usedCards,
            `${ai.name} launches an EN Takeover!`,
            `${mv.attackCard.name} (En ${mv.attackCard.en}) targets your ${takeover.targetComp.formula} → ${mv.compound.formula}`,
            `Executed high-priority EN displacement (${takeover.netSwing} SP swing) under ${cfg.strategyProfile}.`,
            () => {
              V.executeENTakeover(state, takeover.ownerIdx, mv);
              return { done: state.phase === 'GAME_OVER', action: 'en_takeover' };
            }
          );
        }
      }

      // Defensive-first scientists (Lavoisier, Curie, Mendeleev) protect their active bench first
      if (defCfg.shieldBeforeAttack) {
        const shieldPlan = planShieldMove(state, ai, cfg);
        if (shieldPlan) return shieldPlan;
      }

      // If EN displacement wasn't checked before defense (Lavoisier / Curie), check it now
      if (!enCfg.evaluateBeforeDefense) {
        const takeover = findBestTakeover(ai, human, state, cfg);
        if (takeover) {
          const mv = takeover.move;
          const usedCards = [mv.attackCard, ...(mv.extraHandCards || [])];
          return makePlan(
            state, cfg, 'en_takeover', usedCards,
            `${ai.name} launches an EN Takeover!`,
            `${mv.attackCard.name} (En ${mv.attackCard.en}) targets your ${takeover.targetComp.formula} → ${mv.compound.formula}`,
            `Executed post-defense EN displacement (${takeover.netSwing} SP swing).`,
            () => {
              V.executeENTakeover(state, takeover.ownerIdx, mv);
              return { done: state.phase === 'GAME_OVER', action: 'en_takeover' };
            }
          );
        }
      }

      // Scientist-ordered Yellow Utility & Research Cards (e.g., Curie prioritizes Distillation/Buffer; Lavoisier Buffer/Equilibrium)
      const yellowOrder = evCfg.yellowOrder || ['SYNTHESIS_ACCELERATOR', 'BUFFER_SOLUTION', 'DISTILLATION', 'RESONANCE_STABILIZER', 'THERMAL_ACTIVATION', 'EQUILIBRIUM_SHIFT'];
      for (const eff of yellowOrder.slice(0, 2)) {
        const yPlan = planYellowUtilityMove(state, ai, human, cfg, eff);
        if (yPlan) return yPlan;
      }

      // Ionization Surge if not already attempted
      const ionPlan = planIonizationMove(state, ai, human, cfg);
      if (ionPlan) return ionPlan;

      // Scientist-ordered Offensive Red Events
      const humanTargets = human.bufferProtected
        ? []
        : human.field
            .filter((c) => !c.inactive && !c.unstable && !c.shield)
            .sort((a, b) => V.getCompoundSP(b) - V.getCompoundSP(a));

      if (humanTargets.length > 0) {
        const redOrder = evCfg.redOrder || ['ELECTROLYSIS', 'ACID_RAIN', 'BOND_CLEAVAGE', 'PRECIPITATION', 'HALF_LIFE_DECAY'];
        for (const eff of redOrder) {
          const card = ai.hand.find((c) => c.effectId === eff);
          if (!card) continue;
          const target = eff === 'HALF_LIFE_DECAY'
            ? humanTargets.find((c) => !c.decayHalved && V.getCompoundSP(c) >= 6)
            : humanTargets[0];
          if (target) {
            return makePlan(
              state, cfg, eff, [card],
              `${ai.name} plays ${card.name}!`,
              `Targeting your ${target.formula} (+${V.getCompoundSP(target)} SP)`,
              `Selected preferred Red Event ${card.name} targeting ${target.formula}.`,
              () => {
                V.playEventOrInstance(state, card.id, { targetCompoundId: target.id });
                return { done: false, action: eff };
              }
            );
          }
        }
      }

      // Oxidation
      const minOppElems = evCfg.useOxidationMinOppElements || 2;
      const oxCard = ai.hand.find((c) => c.effectId === 'OXIDATION');
      if (oxCard && human.hand.filter((c) => c.kind === 'element').length >= minOppElems) {
        return makePlan(
          state, cfg, 'oxidation', [oxCard],
          `${ai.name} plays Oxidation!`,
          'Stripping up to 2 Element cards from your hand',
          'Opponent held sufficient element cards; applied Oxidation hand pressure.',
          () => {
            V.playEventOrInstance(state, oxCard.id, {});
            return { done: false, action: 'oxidation' };
          }
        );
      }

      // Reaction Delay
      const minOppSP = evCfg.useReactionDelayMinOppSP || 10;
      const delayCard = ai.hand.find((c) => c.effectId === 'REACTION_DELAY');
      if (delayCard && !human.skipNextTurn && (V.getPlayerSP(human) >= minOppSP || V.getPlayerSP(ai) >= 14)) {
        return makePlan(
          state, cfg, 'reaction_delay', [delayCard],
          `${ai.name} plays Reaction Delay!`,
          'Freezing your next turn',
          'Applied Reaction Delay to slow opponent momentum.',
          () => {
            V.playEventOrInstance(state, delayCard.id, {});
            return { done: false, action: 'reaction_delay' };
          }
        );
      }

      // Post-attack Noble Gas Shield (for offensive-first profiles like Pauling)
      if (!defCfg.shieldBeforeAttack) {
        const shieldPlan = planShieldMove(state, ai, cfg);
        if (shieldPlan) return shieldPlan;
      }

      // Remaining Yellow Utility cards in configured order
      for (const eff of yellowOrder.slice(2)) {
        const yPlan = planYellowUtilityMove(state, ai, human, cfg, eff);
        if (yPlan) return yPlan;
      }

      // Diffusion (hand swap)
      const diff = ai.hand.find((c) => c.effectId === 'DIFFUSION');
      if (diff && evCfg.useDiffusionIfHandSmaller !== false && !state.synthesizedThisTurn && human.hand.length >= ai.hand.length + 1) {
        return makePlan(
          state, cfg, 'diffusion', [diff],
          `${ai.name} plays Diffusion!`,
          'Swapping hands with you (Entropy Event)',
          'Hand count disadvantage with no synthesis; invoked Diffusion entropy swap.',
          () => {
            V.playEventOrInstance(state, diff.id, {});
            return { done: false, action: 'diffusion' };
          }
        );
      }

      // Done with Phase 3 -> End Turn
      return makePlan(
        state, cfg, 'end_turn', [],
        `${ai.name} ends their turn`,
        '',
        'Completed all legal strategic Phase 3 actions; ending turn.',
        () => {
          V.endTurn(state);
          return { done: true, action: 'end_turn' };
        }
      );
    }

    return makePlan(state, cfg, 'idle', [], '', '', 'No action required.', () => ({ done: true, action: 'idle' }));
  }

  function runAIStep(state, explicitConfig) {
    return planAIStep(state, explicitConfig).execute();
  }

  function rateSynthesisOption(opt, ai, human, aiSP, cfg) {
    const spPrio = cfg.synthesisPriorities || FALLBACK_CONFIG.synthesisPriorities;
    const cardPrefs = cfg.cardSelectionPreferences || FALLBACK_CONFIG.cardSelectionPreferences;
    const affinitySet = new Set(cardPrefs.affinitySymbols || []);

    const spPerCard = opt.baseSP / Math.max(1, opt.cards.length);
    let score =
      opt.baseSP * (spPrio.spWeight || 1.0) +
      spPerCard * (spPrio.efficiencyPerCardWeight || 1.0);

    const syms = new Set(opt.cards.map((c) => c.symbol));
    let affinityMatches = 0;
    for (const s of syms) {
      if (affinitySet.has(s)) affinityMatches++;
    }
    score += affinityMatches * (cardPrefs.affinityWeight || 1.0);

    // Immediate victory always top priority
    if (aiSP + opt.baseSP >= V.WIN_SP) score += 120;

    // Special ability synergy scoring
    if (opt.compound.formula === 'NaCl') score += 4;
    if (opt.compound.formula === 'CH₄') score += 5;
    if (opt.compound.formula === 'NH₂Cl') score += 4;
    if (syms.has('Ra')) score += 3;
    if (syms.has('Pb')) score += 2;
    if (syms.has('O') && human.field.some((c) => !c.inactive && !c.shield && c.elements.some((e) => e.metalType === 'metal' && (e.group === '1A' || e.group === '2A')))) {
      score += 6; // Rapid Oxidation value!
    }
    if (syms.has('Ga') && human.field.some((c) => !c.inactive && !c.shield && c.elements.some((e) => e.symbol === 'Al'))) {
      score += 12;
    }
    if (syms.has('Fr') && spPrio.avoidSelfDiscardRisk && ai.hand.length > 5 && aiSP + opt.baseSP < V.WIN_SP) {
      score -= 6;
    }
    if (opt.useCatalyst) {
      score -= (spPrio.preferNaturalOverCatalyst || 1.5);
    }
    return score;
  }

  V.planAIStep = planAIStep;
  V.runAIStep = runAIStep;
})(typeof window !== 'undefined' ? window : globalThis);

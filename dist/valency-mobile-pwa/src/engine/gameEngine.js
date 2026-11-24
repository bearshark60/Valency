// VALENCY — Core Rules Engine (Pure State Machine)
// Implements Phase 1 Setup, Phase 2 Synthesis, Phase 3 Defense & Events,
// Electronegativity Displacement, Noble Gas Shields, and all Element Special Abilities.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const WIN_SP = 25;

  function shuffle(arr, rng) {
    const rand = rng || Math.random;
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function createPlayer(id, name, isAI) {
    return {
      id,
      name,
      isAI: Boolean(isAI),
      hand: [],
      field: [], // array of compound objects
      skipNextTurn: false,
      luminescenceTurns: 0, // Radium buff duration
      pendingDecayDiscard: 0, // Francium next-turn discard penalty
      bufferProtected: false, // Buffer Solution: protects entire field from Red Events until next turn
      chloraminePenalty: false, // Chlorine Chloramine Hazard: -50% SP on next synthesis
    };
  }

  /**
   * Check whether a player has an active compound containing Lead (Pb) on their field.
   */
  function hasLeadProtection(player) {
    return player.field.some(
      (comp) => !comp.inactive && comp.elements.some((el) => el.symbol === 'Pb')
    );
  }

  /**
   * Compute live Stability Points for a single compound on the field.
   */
  function getCompoundSP(comp) {
    if (!comp || comp.inactive || comp.unstable) return 0;
    let total = comp.baseSP + (comp.bonusSP || 0);
    if (comp.exothermicAttached) total += 3;
    if (comp.decayHalved) {
      total = Math.floor(total / 2);
    }
    if (comp.poisonedBy !== null && comp.poisonedBy !== undefined) {
      total = Math.floor(total / 2);
    }
    return Math.max(0, total);
  }

  /**
   * Compute live Stability Points for a player (sum of active field compounds).
   * When a compound is destroyed, displaced, cleaved, or precipitated, its SP is lost completely.
   */
  function getPlayerSP(player) {
    return player.field.reduce((sum, comp) => sum + getCompoundSP(comp), 0);
  }

  function pushLog(state, message, category, meta) {
    const entry = {
      id: ++state._logSeq,
      turn: state.turnNumber,
      category: category || 'info',
      message,
      meta: meta || null,
    };
    state.log.unshift(entry);
    if (state.log.length > 80) state.log.pop();
    state.recentEvents.push(entry);
    return entry;
  }

  /**
   * Draw 1 card for a player, automatically reshuffling the Discard Pile if Draw Pile is empty.
   */
  function drawOneCard(state, player) {
    if (state.drawPile.length === 0) {
      if (state.discardPile.length === 0) {
        return null;
      }
      state.drawPile = shuffle(state.discardPile, state._rng);
      state.discardPile = [];
      pushLog(state, 'Draw pile emptied — reshuffled Discard Pile into a fresh Draw Pile!', 'system');
    }
    const card = state.drawPile.pop();
    if (card) player.hand.push(card);
    return card;
  }

  function drawCards(state, player, count, source) {
    const drawn = [];
    for (let i = 0; i < count; i++) {
      const c = drawOneCard(state, player);
      if (c) drawn.push(c);
    }
    if (drawn.length > 0 && state.recentEvents) {
      state.recentEvents.push({
        id: ++state._logSeq,
        turn: state.turnNumber,
        category: 'draw',
        message: '',
        meta: {
          type: 'CARDS_DRAWN',
          playerId: player.id,
          cardIds: drawn.map((c) => c.id),
          count: drawn.length,
          source: source || 'draw',
        },
      });
    }
    return drawn;
  }

  function removeCardFromHand(player, cardId) {
    const idx = player.hand.findIndex((c) => c.id === cardId);
    if (idx === -1) return null;
    return player.hand.splice(idx, 1)[0];
  }

  /**
   * Discard lowest-value cards automatically (for AI or forced multi-discards when no choice modal needed).
   */
  function autoDiscardFromHand(state, player, count, reason) {
    let discarded = [];
    for (let i = 0; i < count && player.hand.length > 0; i++) {
      // Heuristic: discard lowest-utility element first (keep high-EN / Noble Gases / Events)
      let worstIdx = 0;
      let worstScore = Infinity;
      for (let j = 0; j < player.hand.length; j++) {
        const c = player.hand[j];
        let val = 5;
        if (c.kind === 'noble_gas') val = 9;
        else if (c.kind === 'event' || c.kind === 'instance') val = 7;
        else if (c.symbol === 'F' || c.symbol === 'O' || c.symbol === 'Cl') val = 8;
        else if (c.symbol === 'H' || c.symbol === 'C' || c.symbol === 'N') val = 6;
        else val = c.valence + (c.specialId ? 2 : 0);
        if (val < worstScore) {
          worstScore = val;
          worstIdx = j;
        }
      }
      const [removed] = player.hand.splice(worstIdx, 1);
      state.discardPile.push(removed);
      discarded.push(removed);
    }
    if (discarded.length > 0) {
      pushLog(
        state,
        `${player.name} discarded ${discarded.map((c) => c.name).join(', ')} (${reason}).`,
        'ability'
      );
    }
    return discarded;
  }

  /**
   * Create a new game state (Phase 1 Setup -> Deal 5 -> Start Turn 1).
   */
  function createGame(options) {
    const opts = options || {};
    const mode = opts.mode || 'vs_ai'; // 'vs_ai' | 'pass_and_play'
    const p1Name = opts.p1Name || 'You';
    const p2Name = opts.p2Name || (mode === 'vs_ai' ? 'Dr. Mendeleev (AI)' : 'Player 2');
    const rng = opts.rng || Math.random;

    const fullDeck = shuffle(V.buildFullDeck(), rng);
    const players = [
      createPlayer(0, p1Name, false),
      createPlayer(1, p2Name, mode === 'vs_ai'),
    ];

    const state = {
      mode,
      winSP: WIN_SP,
      players,
      activePlayerIndex: 0,
      turnNumber: 1,
      phase: 'SYNTHESIS', // 'SYNTHESIS' | 'DEFENSE' | 'GAME_OVER'
      synthesizedThisTurn: false,
      drawPile: fullDeck,
      discardPile: [],
      pendingPrompt: null, // interactive modal prompt for human (e.g., discard pick, distillation pick, gallium/polonium target)
      winnerIndex: null,
      log: [],
      recentEvents: [],
      _compoundSeq: 0,
      _logSeq: 0,
      _rng: rng,
    };

    // Deal 5 cards to each player (Phase 1 Setup)
    for (const p of state.players) {
      drawCards(state, p, 5, 'initial_deal');
    }

    pushLog(state, `Phase 1 Setup complete: ${state.drawPile.length + 10}-card deck shuffled, 5 cards dealt to each chemist. First to ${WIN_SP} SP wins!`, 'system');

    // Start Turn 1 (Draw 2 cards), preserving initial_deal events for the opening deal animation
    beginTurn(state, true);
    return state;
  }

  function getActivePlayer(state) {
    return state.players[state.activePlayerIndex];
  }

  function getOpponent(state, playerIndex) {
    const idx = playerIndex === undefined ? state.activePlayerIndex : playerIndex;
    return state.players[idx === 0 ? 1 : 0];
  }

  function checkWinner(state) {
    for (let i = 0; i < state.players.length; i++) {
      if (getPlayerSP(state.players[i]) >= state.winSP) {
        state.winnerIndex = i;
        state.phase = 'GAME_OVER';
        state.pendingPrompt = null;
        pushLog(
          state,
          `${state.players[i].name} reached ${getPlayerSP(state.players[i])} SP and WON VALENCY!`,
          'win',
          { winnerIndex: i }
        );
        return true;
      }
    }
    return false;
  }

  /**
   * Begin the active player's turn: upkeep checks + Reaction Delay + Draw 2 -> Phase 2 Synthesis.
   */
  function beginTurn(state, preserveEvents) {
    if (state.phase === 'GAME_OVER') return;
    const active = getActivePlayer(state);
    const opponent = getOpponent(state);

    state.synthesizedThisTurn = false;
    if (!preserveEvents) {
      state.recentEvents = [];
    }

    // 0. Expire active player's Buffer Solution at the start of their turn
    if (active.bufferProtected) {
      active.bufferProtected = false;
      pushLog(state, `${active.name}'s Buffer Solution dissipated.`, 'system');
    }

    // 1. Expire Alpha Poison effects placed by this active player last turn
    for (const comp of opponent.field) {
      if (comp.poisonedBy === active.id) {
        comp.poisonedBy = null;
        pushLog(state, `Alpha Poison wore off on ${opponent.name}'s ${comp.formula}.`, 'system');
      }
    }

    // 2. Decrement Luminescence turns for active player
    if (active.luminescenceTurns > 0) {
      active.luminescenceTurns -= 1;
      if (active.luminescenceTurns === 0) {
        pushLog(state, `${active.name}'s Radium Luminescence faded.`, 'system');
      }
    }

    // 3. Check Reaction Delay (skipped turn)
    if (active.skipNextTurn) {
      active.skipNextTurn = false;
      pushLog(state, `${active.name}'s turn is SKIPPED due to Reaction Delay!`, 'event', {
        type: 'TURN_SKIPPED',
        playerId: active.id,
      });
      state.activePlayerIndex = active.id === 0 ? 1 : 0;
      state.turnNumber += 1;
      beginTurn(state);
      return;
    }

    // 4. Astatine (Fleeting Halogen) decay check at start of owner's turn
    for (let i = active.field.length - 1; i >= 0; i--) {
      const comp = active.field[i];
      if (!comp.inactive && comp.astatineUnstable && !comp.shield) {
        active.field.splice(i, 1);
        for (const el of comp.elements) state.discardPile.push(el);
        if (comp.exothermicCard) state.discardPile.push(comp.exothermicCard);
        if (comp.resonanceCard) state.discardPile.push(comp.resonanceCard);
        pushLog(
          state,
          `${active.name}'s unshielded ${comp.formula} decomposed! (Astatine: Fleeting Halogen)`,
          'ability',
          { type: 'ASTATINE_DECAY', formula: comp.formula }
        );
      }
    }

    // 5. Francium (Rapid Decay) next-turn discard check
    if (active.pendingDecayDiscard > 0) {
      const count = active.pendingDecayDiscard;
      active.pendingDecayDiscard = 0;
      if (hasLeadProtection(active)) {
        pushLog(state, `${active.name}'s Lead Radiation Shielding blocked Francium's follow-up decay!`, 'ability');
      } else {
        autoDiscardFromHand(state, active, count, 'Francium Rapid Decay');
      }
    }

    // 6. Mandatory Draw 2 cards
    const drawn = drawCards(state, active, 2);
    state.phase = 'SYNTHESIS';
    pushLog(
      state,
      `Turn ${state.turnNumber}: ${active.name} drew ${drawn.length} card${drawn.length === 1 ? '' : 's'} — Phase 2: Synthesis.`,
      'turn',
      { type: 'DRAW_STEP', playerId: active.id, count: drawn.length }
    );
  }

  /**
   * Apply element special abilities when a compound is synthesized (via Phase 2 OR EN Takeover).
   */
  function triggerSynthesisAbilities(state, player, opponent, comp) {
    const syms = new Set(comp.elements.map((e) => e.symbol));

    // 1. SODIUM — SALT CURE (NaCl)
    if (comp.formula === 'NaCl') {
      comp.bonusSP += 1;
      comp.abilityBadges.push('Salt Cure +1 SP');
      const drawn = drawCards(state, player, 1, 'salt_cure');
      pushLog(
        state,
        `SALT CURE! ${player.name}'s NaCl gains +1 SP and draws ${drawn.length} card!`,
        'ability',
        { type: 'SALT_CURE', playerId: player.id }
      );
    }

    // 2. CARBON — HYDROCARBON SYNERGY (Methane CH₄)
    if (comp.formula === 'CH₄') {
      comp.bonusSP += 2;
      comp.abilityBadges.push('Hydrocarbon +2 SP');
      const drawn = drawCards(state, player, 1, 'hydrocarbon');
      pushLog(
        state,
        `HYDROCARBON SYNERGY! ${player.name}'s Methane (CH₄) triggers Fuel Burst (+2 SP) and Energy Draw (+${drawn.length} card)!`,
        'ability',
        { type: 'HYDROCARBON_SYNERGY', playerId: player.id }
      );
    }

    // 3. OXYGEN — RAPID OXIDATION (strip 1 Group 1A/2A metal from opponent's unshielded compound)
    if (syms.has('O') && !opponent.bufferProtected) {
      const metalTarget = opponent.field.find(
        (c) =>
          !c.inactive &&
          !c.shield &&
          c.elements.some((el) => el.metalType === 'metal' && (el.group === '1A' || el.group === '2A'))
      );
      if (metalTarget) {
        if (metalTarget.resonanceCard) {
          state.discardPile.push(metalTarget.resonanceCard);
          metalTarget.resonanceCard = null;
          pushLog(
            state,
            `RESONANCE STABILIZER blocked Oxygen's Rapid Oxidation on ${opponent.name}'s ${metalTarget.formula}!`,
            'shield'
          );
        } else {
          const metalIdx = metalTarget.elements.findIndex(
            (el) => el.metalType === 'metal' && (el.group === '1A' || el.group === '2A')
          );
          if (metalIdx !== -1) {
            const lostSP = getCompoundSP(metalTarget);
            const [rustedMetal] = metalTarget.elements.splice(metalIdx, 1);
            state.discardPile.push(rustedMetal);
            metalTarget.inactive = true;
            if (metalTarget.exothermicCard) {
              state.discardPile.push(metalTarget.exothermicCard);
              metalTarget.exothermicCard = null;
              metalTarget.exothermicAttached = false;
            }
            pushLog(
              state,
              `RAPID OXIDATION! ${player.name}'s Oxygen rusted ${rustedMetal.name} (${rustedMetal.symbol}) out of ${opponent.name}'s ${metalTarget.formula} (-${lostSP} SP)!`,
              'ability',
              { type: 'RAPID_OXIDATION', formula: metalTarget.formula, metal: rustedMetal.symbol }
            );
          }
        }
      }
    }

    // 4. CHLORINE — CHLORAMINE HAZARD (NH₂Cl)
    if (comp.formula === 'NH₂Cl') {
      if (opponent.hand.length > 0) {
        const randIdx = Math.floor((state._rng || Math.random)() * opponent.hand.length);
        const [disc] = opponent.hand.splice(randIdx, 1);
        state.discardPile.push(disc);
      }
      opponent.chloraminePenalty = true;
      pushLog(
        state,
        `CHLORAMINE HAZARD! ${opponent.name} discarded 1 random card and suffers -50% SP on their next synthesis!`,
        'ability',
        { type: 'CHLORAMINE_HAZARD', victimId: opponent.id }
      );
    }

    // 5. RADIUM — LUMINESCENT DECAY
    if (syms.has('Ra')) {
      player.luminescenceTurns = 2;
      pushLog(
        state,
        `LUMINESCENT DECAY! ${player.name}'s molecules glow for 2 turns — opponents targeting them must discard 1 card.`,
        'ability',
        { type: 'LUMINESCENCE', playerId: player.id }
      );
    }

    // 6. FRANCIUM — RAPID DECAY
    if (syms.has('Fr')) {
      pushLog(state, `RAPID DECAY! Francium erupts — all unprotected players discard 2 cards now & 1 next turn!`, 'ability', {
        type: 'RAPID_DECAY',
      });
      for (const p of state.players) {
        if (hasLeadProtection(p)) {
          pushLog(state, `${p.name}'s Lead Radiation Shielding blocked Rapid Decay!`, 'ability');
        } else {
          autoDiscardFromHand(state, p, 2, 'Francium Rapid Decay');
          p.pendingDecayDiscard += 1;
        }
      }
    }

    // 7. GALLIUM — LIQUID EMBRITTLEMENT (shatter opponent's unshielded Aluminum compound)
    if (syms.has('Ga')) {
      const alTargets = opponent.field.filter(
        (c) => !c.inactive && !c.shield && c.elements.some((el) => el.symbol === 'Al')
      );
      if (alTargets.length > 0) {
        const victim = alTargets[0];
        const idx = opponent.field.indexOf(victim);
        opponent.field.splice(idx, 1);
        for (const el of victim.elements) {
          if (el.symbol === 'Al') opponent.hand.push(el);
          else state.discardPile.push(el);
        }
        if (victim.exothermicCard) state.discardPile.push(victim.exothermicCard);
        if (victim.resonanceCard) state.discardPile.push(victim.resonanceCard);
        pushLog(
          state,
          `LIQUID EMBRITTLEMENT! ${player.name}'s Gallium shattered ${opponent.name}'s ${victim.formula} — attached elements discarded, Aluminum returned to hand!`,
          'ability',
          { type: 'LIQUID_EMBRITTLEMENT', formula: victim.formula }
        );
      }
    }
  }

  /**
   * Check Radium Luminescence penalty when targeting an opponent's compound.
   */
  function applyLuminescencePenaltyIfNeeded(state, attacker, defender) {
    if (defender.luminescenceTurns > 0 && attacker.id !== defender.id) {
      if (hasLeadProtection(attacker)) {
        pushLog(state, `${attacker.name}'s Lead Radiation Shielding blocked Radium Luminescence sickness!`, 'ability');
      } else {
        autoDiscardFromHand(state, attacker, 1, 'Radium Luminescence sickness');
      }
    }
  }

  /**
   * Phase 2 Action: Synthesize a compound from hand cards (+ optional Catalyst, Chain Reaction, Exothermic Surge).
   */
  function synthesizeCompound(state, selectedCardIds) {
    if (state.phase !== 'SYNTHESIS' || state.pendingPrompt) {
      return { ok: false, error: 'You can only synthesize during Phase 2: Synthesis.' };
    }
    if (state.synthesizedThisTurn) {
      return { ok: false, error: 'You may only synthesize 1 compound per turn.' };
    }

    const active = getActivePlayer(state);
    const opponent = getOpponent(state);
    const selected = selectedCardIds
      .map((id) => active.hand.find((c) => c.id === id))
      .filter(Boolean);

    const elemCards = selected.filter((c) => c.kind === 'element');
    const catalystCards = selected.filter((c) => c.effectId === 'CATALYST');
    const chainCards = selected.filter((c) => c.effectId === 'CHAIN_REACTION');
    const exoCards = selected.filter((c) => c.effectId === 'EXOTHERMIC_SURGE');
    const invalidExtras = selected.filter(
      (c) =>
        c.kind !== 'element' &&
        c.effectId !== 'CATALYST' &&
        c.effectId !== 'CHAIN_REACTION' &&
        c.effectId !== 'EXOTHERMIC_SURGE'
    );

    if (invalidExtras.length > 0) {
      return {
        ok: false,
        error: `${invalidExtras[0].name} cannot be played during Synthesis — play it in Phase 3: Defense & Events.`,
      };
    }
    if (catalystCards.length > 1) {
      return { ok: false, error: 'Play at most 1 Catalyst per compound synthesis.' };
    }
    if (exoCards.length > 1) {
      return { ok: false, error: 'Play at most 1 Exothermic Surge per compound synthesis.' };
    }

    const validation = V.validateSynthesis(elemCards, catalystCards.length === 1);
    if (!validation.valid) {
      return { ok: false, error: validation.reason };
    }

    // Remove all used cards from hand
    for (const card of selected) {
      removeCardFromHand(active, card.id);
    }

    // Discard Catalyst & Chain Reaction after use
    for (const c of catalystCards) state.discardPile.push(c);
    for (const c of chainCards) state.discardPile.push(c);

    // Create compound object on field (apply Chloramine Penalty if active on player)
    let effectiveBaseSP = validation.baseSP;
    const abilityBadges = [];
    if (active.chloraminePenalty) {
      effectiveBaseSP = Math.max(1, Math.floor(effectiveBaseSP / 2));
      active.chloraminePenalty = false;
      abilityBadges.push('Chloramine -50%');
    }

    const comp = {
      id: `comp_${++state._compoundSeq}`,
      formula: validation.compound.formula,
      name: validation.compound.name,
      bondType: validation.compound.bondType,
      elements: elemCards,
      baseSP: effectiveBaseSP,
      bonusSP: 0,
      catalyzed: validation.catalyzed,
      substitutedSymbol: validation.substitutedSymbol,
      shield: null, // Noble Gas card
      exothermicAttached: exoCards.length === 1,
      exothermicCard: exoCards[0] || null,
      resonanceCard: null,
      inactive: false,
      decayHalved: false,
      poisonedBy: null,
      astatineUnstable: false,
      abilityBadges,
    };
    if (comp.catalyzed) comp.abilityBadges.push(`Catalyzed (${comp.substitutedSymbol})`);
    if (comp.exothermicAttached) comp.abilityBadges.push('Exothermic +3 SP');

    active.field.push(comp);
    state.synthesizedThisTurn = true;

    pushLog(
      state,
      `${active.name} synthesized ${comp.name} (${comp.formula}) for +${getCompoundSP(comp)} SP!`,
      'synthesis',
      { type: 'SYNTHESIZE', playerId: active.id, compoundId: comp.id, formula: comp.formula, sp: getCompoundSP(comp) }
    );

    // Chain Reaction draw trigger
    if (chainCards.length > 0) {
      const drawCount = elemCards.length * chainCards.length;
      const drawn = drawCards(state, active, drawCount);
      pushLog(state, `CHAIN REACTION! ${active.name} drew ${drawn.length} cards!`, 'instance');
    }

    // Element special abilities
    triggerSynthesisAbilities(state, active, opponent, comp);

    if (checkWinner(state)) {
      return { ok: true, compound: comp };
    }

    // Automatically advance to Phase 3: Defense & Events
    state.phase = 'DEFENSE';
    return { ok: true, compound: comp };
  }

  /**
   * Phase 2 Action (Unstable Synthesis): Play 2-4 bonding elements as an UNSTABLE compound (0 SP).
   * The owner MUST swap 1 element on their next turn to stabilize it into a real compound,
   * or it collapses to the Discard Pile at the end of their next turn!
   */
  function synthesizeUnstableCompound(state, selectedCardIds) {
    if (state.phase !== 'SYNTHESIS' || state.pendingPrompt) {
      return { ok: false, error: 'You can only play an Unstable Compound during Phase 2: Synthesis.' };
    }
    if (state.synthesizedThisTurn) {
      return { ok: false, error: 'You may only play 1 compound per turn.' };
    }
    const active = getActivePlayer(state);
    const selected = selectedCardIds
      .map((id) => active.hand.find((c) => c.id === id))
      .filter(Boolean);

    if (selected.some((c) => c.kind !== 'element')) {
      return { ok: false, error: 'Select only bonding Element cards to stage an Unstable Compound.' };
    }

    const check = V.validateUnstableSynthesis(selected);
    if (!check.valid) {
      return { ok: false, error: check.reason };
    }

    for (const card of selected) {
      removeCardFromHand(active, card.id);
    }

    const comp = {
      id: `comp_${++state._compoundSeq}`,
      formula: check.formula,
      name: 'Unstable Compound',
      bondType: 'unstable',
      elements: selected,
      baseSP: 0,
      bonusSP: 0,
      catalyzed: false,
      substitutedSymbol: null,
      shield: null,
      exothermicAttached: false,
      exothermicCard: null,
      resonanceCard: null,
      inactive: false,
      unstable: true,
      unstableCreatedTurn: state.turnNumber,
      decayHalved: false,
      poisonedBy: null,
      astatineUnstable: false,
      abilityBadges: ['⚠ Swap Next Turn'],
    };

    active.field.push(comp);
    state.synthesizedThisTurn = true;
    state.phase = 'DEFENSE';

    pushLog(
      state,
      `${active.name} staged an UNSTABLE compound (${comp.formula})! Must swap 1 element by the end of their next turn or it decomposes.`,
      'ability',
      { type: 'UNSTABLE_PLAYED', playerId: active.id, compoundId: comp.id, formula: comp.formula }
    );
    return { ok: true, compound: comp };
  }

  /**
   * Stabilize an Unstable Compound on your field by swapping 1 of its elements with 1 element from your hand
   * to form a valid real chemical compound! (Can be done during Phase 2 or Phase 3 on your turn.)
   */
  function stabilizeUnstableCompound(state, swapMove) {
    if (state.phase === 'GAME_OVER' || state.pendingPrompt) {
      return { ok: false, error: 'Cannot stabilize an unstable compound right now.' };
    }
    const active = getActivePlayer(state);
    const opponent = getOpponent(state);
    const comp = active.field.find((c) => c.id === swapMove.compoundId && c.unstable);
    if (!comp) {
      return { ok: false, error: 'Unstable compound not found on your field.' };
    }
    const handCard = active.hand.find((c) => c.id === swapMove.addCard.id);
    const fieldIdx = comp.elements.findIndex((c) => c.id === swapMove.removeCard.id);
    if (!handCard || fieldIdx === -1) {
      return { ok: false, error: 'Required cards for stabilization swap are not available.' };
    }

    const nextElements = comp.elements.map((el, idx) => (idx === fieldIdx ? handCard : el));
    const validation = V.validateSynthesis(nextElements, false);
    if (!validation.valid) {
      return { ok: false, error: validation.reason };
    }

    // Perform the element swap: handCard enters compound, replaced atom returns to owner's hand!
    removeCardFromHand(active, handCard.id);
    const replacedAtom = comp.elements[fieldIdx];
    active.hand.push(replacedAtom);

    let effectiveBaseSP = validation.baseSP;
    const badges = ['Stabilized'];
    if (active.chloraminePenalty) {
      effectiveBaseSP = Math.max(1, Math.floor(effectiveBaseSP / 2));
      active.chloraminePenalty = false;
      badges.push('Chloramine -50%');
    }

    comp.elements = nextElements;
    comp.formula = validation.compound.formula;
    comp.name = validation.compound.name;
    comp.bondType = validation.compound.bondType;
    comp.baseSP = effectiveBaseSP;
    comp.unstable = false;
    comp.unstableCreatedTurn = null;
    comp.abilityBadges = badges;

    pushLog(
      state,
      `STABILIZED! ${active.name} swapped ${replacedAtom.symbol} ↔ ${handCard.symbol} to lock in ${comp.name} (${comp.formula}) for +${getCompoundSP(comp)} SP!`,
      'synthesis',
      { type: 'STABILIZE_COMPOUND', playerId: active.id, compoundId: comp.id, formula: comp.formula, sp: getCompoundSP(comp) }
    );

    triggerSynthesisAbilities(state, active, opponent, comp);
    checkWinner(state);
    return { ok: true, compound: comp };
  }

  /**
   * Phase 2 Action: Pass synthesis and proceed to Phase 3: Defense & Events.
   */
  function passSynthesis(state) {
    if (state.phase !== 'SYNTHESIS' || state.pendingPrompt) {
      return { ok: false, error: 'Cannot pass synthesis right now.' };
    }
    const active = getActivePlayer(state);
    pushLog(state, `${active.name} passed Synthesis — entering Phase 3: Defense & Events.`, 'phase');
    state.phase = 'DEFENSE';
    return { ok: true };
  }

  /**
   * Phase 3 Action 1: Play a Noble Gas Shield over one of your active unshielded compounds.
   */
  function playNobleGasShield(state, nobleGasCardId, targetCompoundId) {
    if (state.phase !== 'DEFENSE' || state.pendingPrompt) {
      return { ok: false, error: 'Noble Gas shields can only be played in Phase 3: Defense & Events.' };
    }
    const active = getActivePlayer(state);
    const ngCard = active.hand.find((c) => c.id === nobleGasCardId);
    if (!ngCard || ngCard.kind !== 'noble_gas') {
      return { ok: false, error: 'Select a Noble Gas card from your hand.' };
    }
    const comp = active.field.find((c) => c.id === targetCompoundId);
    if (!comp || comp.inactive) {
      return { ok: false, error: 'Select one of your active compounds to shield.' };
    }
    if (comp.shield) {
      return { ok: false, error: `${comp.formula} is already shielded by ${comp.shield.name}.` };
    }

    removeCardFromHand(active, ngCard.id);
    comp.shield = ngCard;

    pushLog(
      state,
      `${active.name} deployed a ${ngCard.name} (${ngCard.symbol}) Shield over ${comp.formula}!`,
      'shield',
      { type: 'SHIELD', playerId: active.id, compoundId: comp.id, shield: ngCard.symbol }
    );
    return { ok: true };
  }

  /**
   * Phase 3 Action 2: Play a Phase-3 Yellow Instance or Red Event Card.
   */
  function playEventOrInstance(state, cardId, targetInfo) {
    if (state.phase !== 'DEFENSE' || state.pendingPrompt) {
      return { ok: false, error: 'Event and Phase 3 Instance cards can only be played during Phase 3.' };
    }
    const active = getActivePlayer(state);
    const opponent = getOpponent(state);
    const card = active.hand.find((c) => c.id === cardId);
    if (!card || (card.kind !== 'event' && card.kind !== 'instance')) {
      return { ok: false, error: 'Select an Event or Instance card from your hand.' };
    }
    if (card.timing === 'synthesis') {
      return { ok: false, error: `${card.name} is played alongside Synthesis in Phase 2.` };
    }

    const info = targetInfo || {};

    switch (card.effectId) {
      case 'DIFFUSION': {
        removeCardFromHand(active, card.id);
        state.discardPile.push(card);
        const temp = active.hand;
        active.hand = opponent.hand;
        opponent.hand = temp;
        pushLog(state, `DIFFUSION! ${active.name} and ${opponent.name} swapped their entire hands!`, 'instance', {
          type: 'DIFFUSION',
        });
        return { ok: true };
      }

      case 'THERMAL_ACTIVATION': {
        removeCardFromHand(active, card.id);
        state.discardPile.push(card);
        const drawn = drawCards(state, active, 3);
        pushLog(state, `THERMAL ACTIVATION! ${active.name} drew ${drawn.length} cards (must discard 1).`, 'instance', {
          type: 'THERMAL_ACTIVATION',
        });
        if (active.hand.length > 0) {
          if (active.isAI) {
            autoDiscardFromHand(state, active, 1, 'Thermal Activation');
          } else {
            state.pendingPrompt = {
              type: 'DISCARD_CHOICE',
              playerId: active.id,
              count: 1,
              title: 'Thermal Activation — Choose 1 card to discard',
            };
          }
        }
        return { ok: true };
      }

      case 'DISTILLATION': {
        const discardElements = state.discardPile.filter((c) => c.kind === 'element' || c.kind === 'noble_gas');
        if (discardElements.length === 0) {
          return { ok: false, error: 'There are no Element cards in the Discard Pile to reclaim.' };
        }
        if (info.discardCardId) {
          const idx = state.discardPile.findIndex((c) => c.id === info.discardCardId);
          if (idx === -1) return { ok: false, error: 'Selected card is not in the Discard Pile.' };
          removeCardFromHand(active, card.id);
          const [reclaimed] = state.discardPile.splice(idx, 1);
          active.hand.push(reclaimed);
          state.discardPile.push(card);
          pushLog(state, `DISTILLATION! ${active.name} reclaimed ${reclaimed.name} (${reclaimed.symbol}) from the Discard Pile!`, 'instance');
          return { ok: true };
        }
        // Trigger picker modal for human player
        removeCardFromHand(active, card.id);
        state.discardPile.push(card);
        state.pendingPrompt = {
          type: 'DISTILLATION_PICK',
          playerId: active.id,
          title: 'Distillation — Choose 1 Element from the Discard Pile',
        };
        return { ok: true };
      }

      case 'RESONANCE_STABILIZER': {
        const comp = active.field.find((c) => c.id === info.targetCompoundId);
        if (!comp || comp.inactive) {
          return { ok: false, error: 'Select one of your active compounds to stabilize.' };
        }
        if (comp.resonanceCard) {
          return { ok: false, error: `${comp.formula} already has a Resonance Stabilizer attached.` };
        }
        removeCardFromHand(active, card.id);
        comp.resonanceCard = card;
        pushLog(state, `RESONANCE STABILIZER! ${active.name} fortified ${comp.formula} against the next hostile Red Event.`, 'instance');
        return { ok: true };
      }

      case 'BUFFER_SOLUTION': {
        if (active.bufferProtected) {
          return { ok: false, error: 'Your field is already protected by a Buffer Solution until your next turn.' };
        }
        removeCardFromHand(active, card.id);
        state.discardPile.push(card);
        active.bufferProtected = true;
        pushLog(
          state,
          `BUFFER SOLUTION! ${active.name}'s entire field is immune to hostile Red Events until their next turn!`,
          'shield',
          { type: 'BUFFER_SOLUTION' }
        );
        return { ok: true };
      }

      case 'EQUILIBRIUM_SHIFT': {
        const compIdx = active.field.findIndex((c) => c.id === info.targetCompoundId);
        if (compIdx === -1) {
          return { ok: false, error: 'Select one of your compounds (active or inactive) to recycle.' };
        }
        const [comp] = active.field.splice(compIdx, 1);
        removeCardFromHand(active, card.id);
        state.discardPile.push(card);
        for (const el of comp.elements) active.hand.push(el);
        if (comp.shield) state.discardPile.push(comp.shield);
        if (comp.exothermicCard) state.discardPile.push(comp.exothermicCard);
        if (comp.resonanceCard) state.discardPile.push(comp.resonanceCard);
        const drawn = drawCards(state, active, 3);
        pushLog(
          state,
          `EQUILIBRIUM SHIFT! ${active.name} returned ${comp.formula} to hand and drew ${drawn.length} cards!`,
          'instance',
          { type: 'EQUILIBRIUM_SHIFT', formula: comp.formula }
        );
        return { ok: true };
      }

      case 'SYNTHESIS_ACCELERATOR': {
        removeCardFromHand(active, card.id);
        state.discardPile.push(card);
        state.synthesizedThisTurn = false;
        state.phase = 'SYNTHESIS';
        pushLog(
          state,
          `SYNTHESIS ACCELERATOR! ${active.name} re-opened Phase 2 for a bonus Synthesis this turn!`,
          'instance',
          { type: 'SYNTHESIS_ACCELERATOR' }
        );
        return { ok: true };
      }

      case 'REACTION_DELAY': {
        removeCardFromHand(active, card.id);
        state.discardPile.push(card);
        opponent.skipNextTurn = true;
        pushLog(state, `REACTION DELAY! ${opponent.name}'s next turn will be skipped!`, 'event', {
          type: 'REACTION_DELAY',
        });
        return { ok: true };
      }

      case 'OXIDATION': {
        const oppElements = opponent.hand.filter((c) => c.kind === 'element');
        if (oppElements.length === 0) {
          return { ok: false, error: `${opponent.name} has no Element cards in hand to oxidize.` };
        }
        removeCardFromHand(active, card.id);
        state.discardPile.push(card);
        // Strip up to 2 highest-EN Element cards from opponent's hand
        oppElements.sort((a, b) => b.en - a.en || b.valence - a.valence);
        const stripped = oppElements.slice(0, 2);
        for (const el of stripped) {
          removeCardFromHand(opponent, el.id);
          state.discardPile.push(el);
        }
        pushLog(
          state,
          `OXIDATION! Stripped ${stripped.map((c) => `${c.name} (${c.symbol})`).join(' & ')} from ${opponent.name}'s hand!`,
          'event',
          { type: 'OXIDATION', count: stripped.length }
        );
        return { ok: true };
      }

      case 'IONIZATION_SURGE': {
        if (opponent.bufferProtected) {
          return { ok: false, error: `${opponent.name}'s field is protected by a Buffer Solution until their next turn!` };
        }
        const comp = opponent.field.find((c) => c.id === info.targetCompoundId);
        if (!comp || !comp.shield) {
          return { ok: false, error: 'Target an opponent\'s compound that has a Noble Gas shield.' };
        }
        removeCardFromHand(active, card.id);
        state.discardPile.push(card);
        const brokenShield = comp.shield;
        comp.shield = null;
        state.discardPile.push(brokenShield);
        pushLog(
          state,
          `IONIZATION SURGE! ${active.name} stripped ${brokenShield.name} off ${opponent.name}'s ${comp.formula}!`,
          'event',
          { type: 'IONIZATION_SURGE', compoundId: comp.id }
        );
        applyLuminescencePenaltyIfNeeded(state, active, opponent);
        return { ok: true };
      }

      case 'ACID_RAIN':
      case 'PRECIPITATION':
      case 'BOND_CLEAVAGE':
      case 'ELECTROLYSIS':
      case 'HALF_LIFE_DECAY': {
        if (opponent.bufferProtected) {
          return { ok: false, error: `${opponent.name}'s field is protected by a Buffer Solution until their next turn!` };
        }
        const compIdx = opponent.field.findIndex((c) => c.id === info.targetCompoundId);
        if (compIdx === -1) {
          return { ok: false, error: 'Select an opponent\'s unshielded compound to target.' };
        }
        const comp = opponent.field[compIdx];
        if (comp.inactive) {
          return { ok: false, error: 'That compound is already inactive.' };
        }
        if (comp.shield) {
          return { ok: false, error: `${comp.formula} is protected by a ${comp.shield.name} Shield! Use Ionization Surge first.` };
        }
        if (card.effectId === 'HALF_LIFE_DECAY' && comp.decayHalved) {
          return { ok: false, error: `${comp.formula} has already suffered Half-Life Decay.` };
        }

        removeCardFromHand(active, card.id);
        state.discardPile.push(card);

        // Check Resonance Stabilizer first!
        if (comp.resonanceCard) {
          state.discardPile.push(comp.resonanceCard);
          comp.resonanceCard = null;
          pushLog(
            state,
            `RESONANCE STABILIZER absorbed ${active.name}'s ${card.name} on ${opponent.name}'s ${comp.formula}!`,
            'shield'
          );
          applyLuminescencePenaltyIfNeeded(state, active, opponent);
          return { ok: true };
        }

        const lostSP = getCompoundSP(comp);

        if (card.effectId === 'ACID_RAIN') {
          opponent.field.splice(compIdx, 1);
          for (const el of comp.elements) state.discardPile.push(el);
          if (comp.exothermicCard) state.discardPile.push(comp.exothermicCard);
          pushLog(
            state,
            `ACID RAIN! ${opponent.name}'s ${comp.formula} decomposed to the Discard Pile (-${lostSP} SP)!`,
            'event',
            { type: 'ACID_RAIN', formula: comp.formula, lostSP }
          );
        } else if (card.effectId === 'PRECIPITATION') {
          opponent.field.splice(compIdx, 1);
          for (const el of comp.elements) opponent.hand.push(el);
          if (comp.exothermicCard) state.discardPile.push(comp.exothermicCard);
          pushLog(
            state,
            `PRECIPITATION! ${opponent.name}'s ${comp.formula} disassembled back to their hand (-${lostSP} SP)!`,
            'event',
            { type: 'PRECIPITATION', formula: comp.formula, lostSP }
          );
        } else if (card.effectId === 'BOND_CLEAVAGE') {
          const removedEl = comp.elements.pop();
          if (removedEl) state.discardPile.push(removedEl);
          comp.inactive = true;
          if (comp.exothermicCard) {
            state.discardPile.push(comp.exothermicCard);
            comp.exothermicCard = null;
            comp.exothermicAttached = false;
          }
          pushLog(
            state,
            `BOND CLEAVAGE! Removed ${removedEl ? removedEl.symbol : '1 atom'} from ${opponent.name}'s ${comp.formula} — now INACTIVE (-${lostSP} SP)!`,
            'event',
            { type: 'BOND_CLEAVAGE', formula: comp.formula, lostSP }
          );
        } else if (card.effectId === 'ELECTROLYSIS') {
          opponent.field.splice(compIdx, 1);
          const sorted = [...comp.elements].sort((a, b) => b.en - a.en || b.valence - a.valence);
          const stolen = sorted[0];
          active.hand.push(stolen);
          for (let i = 1; i < sorted.length; i++) state.discardPile.push(sorted[i]);
          if (comp.exothermicCard) state.discardPile.push(comp.exothermicCard);
          pushLog(
            state,
            `ELECTROLYSIS! ${active.name} split ${opponent.name}'s ${comp.formula} (-${lostSP} SP), stealing ${stolen.name} (${stolen.symbol}) to hand!`,
            'event',
            { type: 'ELECTROLYSIS', formula: comp.formula, stolenSymbol: stolen.symbol, lostSP }
          );
        } else if (card.effectId === 'HALF_LIFE_DECAY') {
          comp.decayHalved = true;
          const newSP = getCompoundSP(comp);
          pushLog(
            state,
            `HALF-LIFE DECAY! ${opponent.name}'s ${comp.formula} dropped from ${lostSP} SP to ${newSP} SP!`,
            'event',
            { type: 'HALF_LIFE_DECAY', formula: comp.formula, compoundId: comp.id }
          );
        }

        applyLuminescencePenaltyIfNeeded(state, active, opponent);
        return { ok: true };
      }

      default:
        return { ok: false, error: `Unknown card effect: ${card.effectId}` };
    }
  }

  /**
   * Phase 3 Action 3: Electronegativity Displacement (EN Takeover).
   * Execute a validated takeover move returned by V.findENTakeoversForCard().
   */
  function executeENTakeover(state, targetOwnerIndex, move) {
    if (state.phase !== 'DEFENSE' || state.pendingPrompt) {
      return { ok: false, error: 'Electronegativity Takeovers happen during Phase 3: Defense & Events.' };
    }
    const active = getActivePlayer(state);
    const opponent = getOpponent(state);
    const owner = state.players[targetOwnerIndex];
    const compIdx = owner.field.findIndex((c) => c.id === move.targetCompoundId);
    if (compIdx === -1) {
      return { ok: false, error: 'Target compound is no longer on the field.' };
    }
    const targetComp = owner.field[compIdx];

    // Remove attacking hand card(s)
    const handCardsUsed = [move.attackCard, ...(move.extraHandCards || [])];
    for (const hc of handCardsUsed) {
      if (!active.hand.some((c) => c.id === hc.id)) {
        return { ok: false, error: 'Missing required attacking card in hand.' };
      }
    }
    for (const hc of handCardsUsed) {
      removeCardFromHand(active, hc.id);
    }

    const lostSP = getCompoundSP(targetComp);

    // Break the target compound off the owner's field
    owner.field.splice(compIdx, 1);

    // If Fluorine pierced a heavy Noble Gas shield (Kr/Xe/Rn), discard that shield!
    let shieldNote = '';
    if (targetComp.shield && move.piercesHeavyShield) {
      shieldNote = ` (pierced & shattered ${targetComp.shield.name} Shield!)`;
      state.discardPile.push(targetComp.shield);
    }
    if (targetComp.exothermicCard) state.discardPile.push(targetComp.exothermicCard);
    if (targetComp.resonanceCard) state.discardPile.push(targetComp.resonanceCard);

    // Return leftover/unused elements from the broken compound to the original owner's hand!
    const stolenIds = new Set(move.stolenCards.map((c) => c.id));
    const returned = [];
    for (const el of targetComp.elements) {
      if (!stolenIds.has(el.id)) {
        owner.hand.push(el);
        returned.push(el);
      }
    }

    // Assemble the new compound on the active player's field
    const newElements = [...handCardsUsed, ...move.stolenCards];
    const newComp = {
      id: `comp_${++state._compoundSeq}`,
      formula: move.compound.formula,
      name: move.compound.name,
      bondType: move.compound.bondType,
      elements: newElements,
      baseSP: move.baseSP,
      bonusSP: 0,
      catalyzed: false,
      substitutedSymbol: null,
      shield: null,
      exothermicAttached: false,
      exothermicCard: null,
      resonanceCard: null,
      inactive: false,
      poisonedBy: null,
      astatineUnstable: false,
      abilityBadges: ['EN Takeover'],
    };

    active.field.push(newComp);

    pushLog(
      state,
      `EN TAKEOVER! ${active.name}'s ${move.attackCard.symbol} (En ${move.attackCard.en}) replaced ${move.replacedCard.symbol} (En ${move.replacedCard.en}) in ${owner.name}'s ${targetComp.formula} (-${lostSP} SP)${shieldNote} → formed ${newComp.name} (${newComp.formula}, +${getCompoundSP(newComp)} SP)! Returned ${returned.map((r) => r.symbol).join(', ')} to ${owner.name}'s hand.`,
      'takeover',
      {
        type: 'EN_TAKEOVER',
        attackerId: active.id,
        victimId: owner.id,
        oldFormula: targetComp.formula,
        newFormula: newComp.formula,
        attackSymbol: move.attackCard.symbol,
        stolenSymbols: move.stolenCards.map((c) => c.symbol),
      }
    );

    // Trigger synthesis abilities on the newly formed compound
    triggerSynthesisAbilities(state, active, opponent, newComp);

    // Luminescence radiation check if attacking opponent's field
    if (owner.id !== active.id) {
      applyLuminescencePenaltyIfNeeded(state, active, owner);
    }

    checkWinner(state);
    return { ok: true, compound: newComp };
  }

  /**
   * Resolve a pending human interactive prompt (Thermal Activation discard or Distillation reclaim).
   */
  function resolvePrompt(state, payload) {
    const prompt = state.pendingPrompt;
    if (!prompt) return { ok: false, error: 'No pending prompt.' };
    const player = state.players[prompt.playerId];

    if (prompt.type === 'DISCARD_CHOICE') {
      const card = removeCardFromHand(player, payload.cardId);
      if (!card) return { ok: false, error: 'Card not found in hand.' };
      state.discardPile.push(card);
      pushLog(state, `${player.name} discarded ${card.name}.`, 'instance');
      prompt.count -= 1;
      if (prompt.count <= 0) state.pendingPrompt = null;
      return { ok: true };
    }

    if (prompt.type === 'DISTILLATION_PICK') {
      const idx = state.discardPile.findIndex((c) => c.id === payload.cardId);
      if (idx === -1) return { ok: false, error: 'Card not found in Discard Pile.' };
      const [reclaimed] = state.discardPile.splice(idx, 1);
      player.hand.push(reclaimed);
      pushLog(state, `DISTILLATION! ${player.name} reclaimed ${reclaimed.name} (${reclaimed.symbol}) from the Discard Pile!`, 'instance');
      state.pendingPrompt = null;
      return { ok: true };
    }

    return { ok: false, error: 'Unknown prompt type.' };
  }

  /**
   * Optional cleanup: discard an inactive (Bond Cleaved) compound from your own field to reclaim its remaining atoms?
   * Wait: Bond Cleavage says "remain on the field as an inactive compound". Let's keep them on the field clearly marked INACTIVE (0 SP).
   */

  /**
   * End Phase 3 and pass turn to the next player.
   * Any Unstable Compound played on a previous turn that was NOT stabilized by now decomposes to Discard!
   */
  function endTurn(state) {
    if (state.phase === 'GAME_OVER') return { ok: false, error: 'Game is already over.' };
    if (state.pendingPrompt) return { ok: false, error: 'Finish the current prompt first.' };
    const active = getActivePlayer(state);

    // Check Unstable Compound expiration at end of owner's turn
    for (let i = active.field.length - 1; i >= 0; i--) {
      const comp = active.field[i];
      if (comp.unstable && comp.unstableCreatedTurn < state.turnNumber) {
        active.field.splice(i, 1);
        for (const el of comp.elements) state.discardPile.push(el);
        if (comp.shield) state.discardPile.push(comp.shield);
        if (comp.exothermicCard) state.discardPile.push(comp.exothermicCard);
        if (comp.resonanceCard) state.discardPile.push(comp.resonanceCard);
        pushLog(
          state,
          `UNSTABLE COLLAPSE! ${active.name}'s ${comp.formula} was not stabilized in time and decomposed to the Discard Pile!`,
          'event',
          { type: 'UNSTABLE_DECAY', formula: comp.formula }
        );
      }
    }

    pushLog(state, `${active.name} ended their turn.`, 'phase');
    state.activePlayerIndex = active.id === 0 ? 1 : 0;
    state.turnNumber += 1;
    beginTurn(state, true); // keep UNSTABLE_DECAY event so UI animates it cleanly
    return { ok: true };
  }

  /**
   * Special Rule (Hydrogen H₂ Bond): Unbond an active H₂ compound on your field back into your hand
   * so you can use those Hydrogen cards to synthesize a stronger compound.
   */
  function unbondH2(state, compoundId) {
    if (state.phase === 'GAME_OVER' || state.pendingPrompt) {
      return { ok: false, error: 'Cannot unbond H₂ right now.' };
    }
    const active = getActivePlayer(state);
    const idx = active.field.findIndex((c) => c.id === compoundId && c.formula === 'H₂');
    if (idx === -1) {
      return { ok: false, error: 'H₂ compound not found on your field.' };
    }
    const [comp] = active.field.splice(idx, 1);
    for (const el of comp.elements) active.hand.push(el);
    if (comp.shield) state.discardPile.push(comp.shield);
    if (comp.exothermicCard) state.discardPile.push(comp.exothermicCard);
    if (comp.resonanceCard) state.discardPile.push(comp.resonanceCard);
    pushLog(state, `${active.name} unbonded H₂ back into their hand to craft a larger compound!`, 'ability', {
      type: 'UNBOND_H2',
    });
    return { ok: true };
  }

  /**
   * Concede / trigger Fail State cleanly for the human player.
   */
  function concedeMatch(state, losingPlayerIndex) {
    if (state.phase === 'GAME_OVER') return { ok: false, error: 'Match is already over.' };
    const loserIdx = losingPlayerIndex === undefined ? 0 : losingPlayerIndex;
    const winnerIdx = loserIdx === 0 ? 1 : 0;
    state.winnerIndex = winnerIdx;
    state.failReason = 'conceded';
    state.phase = 'GAME_OVER';
    state.pendingPrompt = null;
    pushLog(
      state,
      `${state.players[loserIdx].name} aborted the experiment — Lab Meltdown! ${state.players[winnerIdx].name} takes the match.`,
      'event',
      { type: 'FAIL_STATE', loserIndex: loserIdx }
    );
    return { ok: true };
  }

  V.WIN_SP = WIN_SP;
  V.createGame = createGame;
  V.getActivePlayer = getActivePlayer;
  V.getOpponent = getOpponent;
  V.getCompoundSP = getCompoundSP;
  V.getPlayerSP = getPlayerSP;
  V.hasLeadProtection = hasLeadProtection;
  V.synthesizeCompound = synthesizeCompound;
  V.synthesizeUnstableCompound = synthesizeUnstableCompound;
  V.stabilizeUnstableCompound = stabilizeUnstableCompound;
  V.passSynthesis = passSynthesis;
  V.playNobleGasShield = playNobleGasShield;
  V.playEventOrInstance = playEventOrInstance;
  V.executeENTakeover = executeENTakeover;
  V.unbondH2 = unbondH2;
  V.concedeMatch = concedeMatch;
  V.resolvePrompt = resolvePrompt;
  V.endTurn = endTurn;
})(typeof window !== 'undefined' ? window : globalThis);

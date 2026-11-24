// VALENCY — Interactive 7-Lesson Hands-On Tutorial ("Lab Academy")
// Teaches every core mechanic interactively on the live table with curated setups,
// real-time objective validation, animations, and sound effects.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  let seq = 1;

  function makeEl(symbol) {
    const spec = V.ELEMENT_BY_SYMBOL[symbol];
    return { id: `tut_el_${seq++}_${symbol}`, ...spec };
  }

  function makeEvent(effectId) {
    const spec = [...V.INSTANCE_SPECS, ...V.EVENT_SPECS].find((s) => s.effectId === effectId);
    return { id: `tut_ev_${seq++}_${effectId}`, ...spec };
  }

  function makeFieldCompound(formula, name, bondType, symbols, opts) {
    const o = opts || {};
    const elements = symbols.map((s) => makeEl(s));
    const baseSP = elements.reduce((sum, e) => sum + e.valence, 0);
    return {
      id: `tut_comp_${seq++}`,
      formula,
      name,
      bondType: bondType || 'covalent',
      elements,
      baseSP,
      bonusSP: o.bonusSP || 0,
      catalyzed: false,
      substitutedSymbol: null,
      shield: o.shieldSymbol ? makeEl(o.shieldSymbol) : null,
      exothermicAttached: Boolean(o.exothermic),
      exothermicCard: null,
      resonanceCard: null,
      inactive: Boolean(o.inactive),
      decayHalved: Boolean(o.decayHalved),
      poisonedBy: null,
      astatineUnstable: false,
      abilityBadges: o.badges || [],
    };
  }

  /**
   * Build a clean deterministic tutorial game state for a lesson.
   */
  function buildTutorialBaseState(config) {
    const state = {
      mode: 'tutorial',
      winSP: V.WIN_SP || 25,
      players: [
        {
          id: 0,
          name: 'You (Trainee)',
          isAI: false,
          hand: (config.p1Hand || []).slice(),
          field: (config.p1Field || []).slice(),
          skipNextTurn: false,
          luminescenceTurns: 0,
          pendingDecayDiscard: 0,
          bufferProtected: false,
        },
        {
          id: 1,
          name: 'Practice Lab Dummy',
          isAI: false,
          hand: (config.p2Hand || [makeEl('H'), makeEl('O'), makeEl('C')]).slice(),
          field: (config.p2Field || []).slice(),
          skipNextTurn: false,
          luminescenceTurns: 0,
          pendingDecayDiscard: 0,
          bufferProtected: false,
        },
      ],
      activePlayerIndex: 0,
      turnNumber: 1,
      phase: config.phase || 'SYNTHESIS',
      synthesizedThisTurn: Boolean(config.synthesizedThisTurn),
      drawPile: [makeEl('H'), makeEl('O'), makeEl('Cl'), makeEl('C'), makeEl('F'), makeEl('N')],
      discardPile: (config.discardPile || []).slice(),
      pendingPrompt: null,
      winnerIndex: null,
      log: [],
      recentEvents: [],
      _compoundSeq: 100,
      _logSeq: 0,
      _rng: Math.random,
    };
    state.log.push({
      id: 1,
      turn: 1,
      category: 'system',
      message: `Tutorial loaded: ${config.logNote || 'Follow the Lab Coach objective above!'}`,
    });
    return state;
  }

  const TUTORIAL_LESSONS = [
    {
      id: 'synthesis',
      number: 1,
      tag: 'Phase 2 Core',
      title: 'Compound Synthesis & Stability Points (SP)',
      summary: 'Combine valence-balanced elements into a real chemical compound to score Stability Points toward 25 SP.',
      explanation:
        'Each compound earns Stability Points (SP) equal to the sum of all valence electrons of its atoms. For Water (H₂O): 2× Hydrogen (1e⁻) + 1× Oxygen (6e⁻) = +8 SP. You may synthesize 1 real compound per turn in Phase 2.',
      setup() {
        return buildTutorialBaseState({
          phase: 'SYNTHESIS',
          p1Hand: [makeEl('H'), makeEl('H'), makeEl('O'), makeEl('C'), makeEl('Mg')],
          logNote: 'Lesson 1 — Select H, H, and O to synthesize Water (H₂O) for +8 SP.',
        });
      },
      getObjective(state) {
        const done = state.players[0].field.some((c) => c.formula === 'H₂O');
        return {
          done,
          instruction: done
            ? 'Water (H₂O) synthesized for +8 SP! Notice your turn automatically entered Phase 3: Defense & Events.'
            : 'Click both Hydrogen (H) cards and the Oxygen (O) card in your hand, then click "Synthesize Compound".',
        };
      },
    },
    {
      id: 'catalysts',
      number: 2,
      tag: 'Yellow Synthesis Boosters',
      title: 'Catalyst, Exothermic Surge & Chain Reaction',
      summary: 'Lower activation energy with Catalyst and amplify your synthesis with Yellow Instance boosters.',
      explanation:
        'Yellow Synthesis cards play alongside your elements in Phase 2! Catalyst fills 1 missing monovalent atom (so H + O + Catalyst completes Water H₂O!). Add Exothermic Surge for +3 bonus SP or Chain Reaction to draw extra cards.',
      setup() {
        return buildTutorialBaseState({
          phase: 'SYNTHESIS',
          p1Hand: [
            makeEl('H'),
            makeEl('O'),
            makeEvent('CATALYST'),
            makeEvent('EXOTHERMIC_SURGE'),
            makeEvent('CHAIN_REACTION'),
          ],
          logNote: 'Lesson 2 — Combine H + O + Catalyst (plus Exothermic Surge for +3 SP!) to synthesize H₂O.',
        });
      },
      getObjective(state) {
        const comp = state.players[0].field.find((c) => c.catalyzed);
        const done = Boolean(comp);
        return {
          done,
          instruction: done
            ? `Catalyzed ${comp.formula} built for +${V.getCompoundSP(comp)} SP! Catalyst lowered activation energy to finish the bond.`
            : 'Select H + O + Catalyst (tip: also include Exothermic Surge & Chain Reaction for bonus SP and card draw!), then click "Synthesize Compound".',
        };
      },
    },
    {
      id: 'shields',
      number: 3,
      tag: 'Phase 3 Defense',
      title: 'Noble Gas Shields (Light vs. Heavy)',
      summary: 'Attach an inert Group 8A Noble Gas to shield a valuable compound from EN Takeovers and Red Events.',
      explanation:
        'In Phase 3, click any Noble Gas card in your hand and attach it to one of your active compounds. Light Noble Gases (He, Ne, Ar) are 100% Fluorine-proof! Heavy Noble Gases (Kr, Xe, Rn) block everything except Fluorine and Ionization Surge.',
      setup() {
        return buildTutorialBaseState({
          phase: 'DEFENSE',
          synthesizedThisTurn: true,
          p1Field: [makeFieldCompound('CO₂', 'Carbon Dioxide', 'covalent', ['C', 'O', 'O'])],
          p1Hand: [makeEl('He'), makeEl('Xe')],
          logNote: 'Lesson 3 — Click Helium (He) in your hand, then click your CO₂ compound to deploy a Fluorine-proof shield.',
        });
      },
      getObjective(state) {
        const co2 = state.players[0].field[0];
        const done = Boolean(co2 && co2.shield);
        return {
          done,
          instruction: done
            ? `CO₂ (+16 SP) is now protected by a ${co2.shield.name} Inert Shield! Hostile Red Events and normal EN Takeovers bounce right off.`
            : 'Click Helium (He) in your hand — your CO₂ compound will glow green. Click CO₂ to attach the Noble Gas Shield!',
        };
      },
    },
    {
      id: 'en_takeover',
      number: 4,
      tag: 'Signature Mechanic',
      title: 'Electronegativity Displacement (EN Takeover)',
      summary: 'Use a higher-EN element from your hand to steal bonded atoms right off an opponent\'s field!',
      explanation:
        'During Phase 3, an element from your hand with HIGHER Electronegativity (En) can replace a lower-EN element in any unshielded compound—stealing attached atoms to build a new real compound! The opponent loses all SP from their broken compound, and unused atoms return to their hand.',
      setup() {
        return buildTutorialBaseState({
          phase: 'DEFENSE',
          synthesizedThisTurn: true,
          p1Hand: [makeEl('F')],
          p2Field: [makeFieldCompound('H₂O', 'Water', 'covalent', ['H', 'H', 'O'])],
          logNote: 'Lesson 4 — Fluorine (En 4.0) > Oxygen (En 3.5). Click F, then click opponent\'s purple-highlighted H₂O!',
        });
      },
      getObjective(state) {
        const done = state.players[0].field.some((c) => c.formula === 'HF') && state.players[1].field.length === 0;
        return {
          done,
          instruction: done
            ? 'EN Takeover complete! Fluorine (4.0) replaced Oxygen (3.5), stole 1 Hydrogen to form HF (+8 SP), wiped opponent\'s 8 SP, and returned leftover H + O to their hand!'
            : 'Click Fluorine (F, En 4.0) in your hand, then click opponent\'s purple-highlighted H₂O to steal 1 Hydrogen and form HF!',
        };
      },
    },
    {
      id: 'breaking_shields',
      number: 5,
      tag: 'Counterplay',
      title: 'Breaking Shields: Ionization Surge & Fluorine',
      summary: 'Learn both ways to break Noble Gas defense: Ionization Surge and Fluorine\'s Apex Oxidizer.',
      explanation:
        'Opponent has TWO shielded compounds: MgO shielded by Argon (light, Fluorine-proof) and HCl shielded by Xenon (heavy). Ionization Surge strips ANY shield, while Fluorine\'s Special Ability (Apex Oxidizer) pierces heavy Noble Gases (Kr, Xe, Rn) directly!',
      setup() {
        return buildTutorialBaseState({
          phase: 'DEFENSE',
          synthesizedThisTurn: true,
          p1Hand: [makeEvent('IONIZATION_SURGE'), makeEl('F')],
          p2Field: [
            makeFieldCompound('MgO', 'Magnesium Oxide', 'ionic', ['Mg', 'O'], { shieldSymbol: 'Ar' }),
            makeFieldCompound('HCl', 'Hydrogen Chloride', 'covalent', ['H', 'Cl'], { shieldSymbol: 'Xe' }),
          ],
          logNote: 'Lesson 5 — Strip Argon with Ionization Surge AND pierce Xenon on HCl with Fluorine!',
        });
      },
      getObjective(state) {
        const mgo = state.players[1].field.find((c) => c.formula === 'MgO');
        const argonStripped = Boolean(mgo && !mgo.shield);
        const hclPierced = !state.players[1].field.some((c) => c.formula === 'HCl') && state.players[0].field.length > 0;
        if (!argonStripped) {
          return {
            done: false,
            instruction: 'Step 1 of 2: Click Ionization Surge (Red Event), then click opponent\'s Argon-shielded MgO to strip the Argon shield.',
          };
        }
        if (!hclPierced) {
          return {
            done: false,
            instruction: 'Step 2 of 2: Now click Fluorine (F, En 4.0) — notice it pierces Xenon! Click opponent\'s Xenon-shielded HCl to shatter Xe and form ClF or HF!',
          };
        }
        const formed = state.players[0].field[0];
        return {
          done: true,
          instruction: `Mastered! Ionization Surge stripped Argon, and Fluorine pierced Xenon to form ${formed.formula} (+${V.getCompoundSP(formed)} SP)!`,
        };
      },
    },
    {
      id: 'events_and_buffer',
      number: 6,
      tag: 'Red & Yellow Events',
      title: 'Hostile Red Events & Buffer Solution Defense',
      summary: 'Split enemy compounds with Electrolysis and protect your entire field with Buffer Solution.',
      explanation:
        'With 50 Event cards in the 120-card deck, Phase 3 is packed with disruption! Electrolysis splits an opponent\'s unshielded compound and steals its highest-EN atom into your hand. Buffer Solution shields your ENTIRE field from Red Events until your next turn!',
      setup() {
        return buildTutorialBaseState({
          phase: 'DEFENSE',
          synthesizedThisTurn: true,
          p1Field: [makeFieldCompound('CH₄', 'Methane', 'covalent', ['C', 'H', 'H', 'H', 'H'])],
          p1Hand: [makeEvent('ELECTROLYSIS'), makeEvent('BUFFER_SOLUTION')],
          p2Field: [makeFieldCompound('CO₂', 'Carbon Dioxide', 'covalent', ['C', 'O', 'O'])],
          logNote: 'Lesson 6 — Play Electrolysis on opponent\'s CO₂ and activate Buffer Solution!',
        });
      },
      getObjective(state) {
        const stoleO = state.players[1].field.length === 0 && state.players[0].hand.some((c) => c.symbol === 'O');
        const buffered = state.players[0].bufferProtected;
        if (!stoleO) {
          return {
            done: false,
            instruction: 'Step 1 of 2: Click Electrolysis (Red Event), then click opponent\'s CO₂ to split it (-16 SP) and steal Oxygen into your hand!',
          };
        }
        if (!buffered) {
          return {
            done: false,
            instruction: 'Step 2 of 2: Click Buffer Solution (Yellow Instance) and click "Play Buffer Solution" to protect your whole field from Red Events!',
          };
        }
        return {
          done: true,
          instruction: 'Clean lab work! You stole Oxygen via Electrolysis and locked down your entire field with Buffer Solution.',
        };
      },
    },
    {
      id: 'abilities_and_win',
      number: 7,
      tag: 'Special Abilities & Victory',
      title: 'Element Special Abilities & Winning at 25 SP',
      summary: 'Trigger Gallium\'s Liquid Embrittlement & Sodium\'s Salt Cure to reach 25 SP and win!',
      explanation:
        'Signature elements pack real-chemistry Special Abilities! Gallium shatters an opponent\'s Aluminum compound on play, Synthesis Accelerator unlocks a 2nd synthesis in the same turn, and Sodium Chloride (NaCl) triggers Salt Cure (+1 SP & draw 1) for 9 SP total!',
      setup() {
        return buildTutorialBaseState({
          phase: 'SYNTHESIS',
          p1Field: [makeFieldCompound('CO₂', 'Carbon Dioxide', 'covalent', ['C', 'O', 'O'])], // 16 SP
          p1Hand: [
            makeEl('Ga'),
            makeEl('N'),
            makeEvent('SYNTHESIS_ACCELERATOR'),
            makeEl('Na'),
            makeEl('Cl'),
          ],
          p2Field: [makeFieldCompound('AlCl₃', 'Aluminum Chloride', 'ionic', ['Al', 'Cl', 'Cl', 'Cl'])], // 24 SP threat!
          logNote: 'Lesson 7 — Shatter opponent\'s AlCl₃ with Gallium (Ga + N), then use Synthesis Accelerator + NaCl (Salt Cure) to win!',
        });
      },
      getObjective(state) {
        const won = state.phase === 'GAME_OVER' && state.winnerIndex === 0;
        if (won) {
          return {
            done: true,
            instruction: 'Tutorial Complete! You triggered Special Abilities, chained a double synthesis, and hit 25+ SP to win VALENCY!',
          };
        }
        const alAlive = state.players[1].field.some((c) => c.formula === 'AlCl₃');
        if (alAlive && state.phase === 'SYNTHESIS') {
          return {
            done: false,
            instruction: 'Step 1 of 3: Select Gallium (Ga) + Nitrogen (N) and click "Synthesize Compound" to build GaN and shatter opponent\'s 24-SP AlCl₃ with Liquid Embrittlement!',
          };
        }
        if (state.phase === 'DEFENSE' && state.players[0].hand.some((c) => c.effectId === 'SYNTHESIS_ACCELERATOR')) {
          return {
            done: false,
            instruction: 'Step 2 of 3: Click Synthesis Accelerator (Yellow Instance) and click "Play Synthesis Accelerator" to re-open Phase 2 for a bonus synthesis!',
          };
        }
        return {
          done: false,
          instruction: 'Step 3 of 3: Select Sodium (Na) + Chlorine (Cl) and click "Synthesize Compound" to trigger Salt Cure (+9 SP) and win the match!',
        };
      },
    },
  ];

  const completedLessonIds = new Set();

  function getLessonCount() {
    return TUTORIAL_LESSONS.length;
  }

  function getLessonByIndex(idx) {
    return TUTORIAL_LESSONS[idx] || null;
  }

  function markLessonCompleted(lessonId) {
    completedLessonIds.add(lessonId);
  }

  function isLessonCompleted(lessonId) {
    return completedLessonIds.has(lessonId);
  }

  function getCompletedCount() {
    return completedLessonIds.size;
  }

  V.Tutorial = {
    LESSONS: TUTORIAL_LESSONS,
    getLessonCount,
    getLessonByIndex,
    markLessonCompleted,
    isLessonCompleted,
    getCompletedCount,
  };
})(typeof window !== 'undefined' ? window : globalThis);

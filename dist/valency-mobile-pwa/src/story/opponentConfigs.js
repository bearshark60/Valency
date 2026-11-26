// VALENCY — Historical Scientist Opponent AI Configurations
// Strictly separated from Scientist Master Profiles (scientists.js) and Future Cards.
// Every opponent plays on the exact same legal 120-card shared deck with ZERO extra cards
// or hidden statistical advantages—difficulty and flavor come purely from legal decision priorities.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const STANDARD_FAIR_DECK_CONFIG = Object.freeze({
    useStandardSharedDeck: true,
    deckSize: 120,
    extraStartingCards: 0,
    extraDrawPerTurn: 0,
    hiddenStatBonuses: false,
  });

  const OPPONENT_CONFIGS = {
    opp_lavoisier: {
      configId: 'opp_lavoisier',
      scientistId: 'lavoisier',
      difficulty: 'foundational',
      strategyProfile: 'Conservation & Resource-Efficient Synthesis',
      deckConfiguration: STANDARD_FAIR_DECK_CONFIG,
      cardSelectionPreferences: {
        affinitySymbols: ['O', 'H', 'C', 'S'],
        affinityWeight: 2.5,
        reclaimPriority: ['O', 'C', 'H', 'S', 'Cl', 'F'],
        discardProtect: ['O', 'C', 'H', 'BUFFER_SOLUTION', 'DISTILLATION'],
      },
      synthesisPriorities: {
        spWeight: 1.0,
        efficiencyPerCardWeight: 2.6, // Loves clean 2-3 card efficient transformations
        preferNaturalOverCatalyst: 2.5,
        allowUnstableStaging: false, // Refuses wasteful unstable stoichiometry
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
        redOrder: ['PRECIPITATION', 'ACID_RAIN', 'BOND_CLEAVAGE', 'HALF_LIFE_DECAY', 'ELECTROLYSIS'],
        yellowOrder: ['BUFFER_SOLUTION', 'EQUILIBRIUM_SHIFT', 'DISTILLATION', 'RESONANCE_STABILIZER', 'THERMAL_ACTIVATION', 'SYNTHESIS_ACCELERATOR'],
        useOxidationMinOppElements: 4,
        useReactionDelayMinOppSP: 14,
        useDiffusionIfHandSmaller: false,
      },
      enDisplacementEvaluation: {
        enabled: true,
        evaluateBeforeDefense: false,
        minNetSwing: 12, // Only executes highly efficient, conservative displacements
        pierceShieldBonus: 3,
      },
      legalMoveValidation: true,
      decisionLogging: true,
    },

    opp_mendeleev: {
      configId: 'opp_mendeleev',
      scientistId: 'mendeleev',
      difficulty: 'standard',
      strategyProfile: 'Structured Periodic Synthesis & Shielded Pillars',
      deckConfiguration: STANDARD_FAIR_DECK_CONFIG,
      cardSelectionPreferences: {
        affinitySymbols: ['Ga', 'Ge', 'Si', 'Al', 'B', 'C', 'Cl'],
        affinityWeight: 2.0,
        reclaimPriority: ['Cl', 'O', 'F', 'C', 'Ga', 'Al'],
        discardProtect: ['F', 'O', 'Cl', 'C', 'SYNTHESIS_ACCELERATOR'],
      },
      synthesisPriorities: {
        spWeight: 1.35, // Prioritizes big structured compounds (CO2, MgCl2, AlCl3, CH4)
        efficiencyPerCardWeight: 0.9,
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
        redOrder: ['ACID_RAIN', 'ELECTROLYSIS', 'BOND_CLEAVAGE', 'PRECIPITATION', 'HALF_LIFE_DECAY'],
        yellowOrder: ['SYNTHESIS_ACCELERATOR', 'BUFFER_SOLUTION', 'RESONANCE_STABILIZER', 'THERMAL_ACTIVATION', 'DISTILLATION', 'EQUILIBRIUM_SHIFT'],
        useOxidationMinOppElements: 3,
        useReactionDelayMinOppSP: 10,
        useDiffusionIfHandSmaller: true,
      },
      enDisplacementEvaluation: {
        enabled: true,
        evaluateBeforeDefense: true,
        minNetSwing: 8,
        pierceShieldBonus: 4,
      },
      legalMoveValidation: true,
      decisionLogging: true,
    },

    opp_pauling: {
      configId: 'opp_pauling',
      scientistId: 'pauling',
      difficulty: 'tactical',
      strategyProfile: 'Electronegativity Displacement & Bond Vulnerability Exploitation',
      deckConfiguration: STANDARD_FAIR_DECK_CONFIG,
      cardSelectionPreferences: {
        affinitySymbols: ['F', 'O', 'N', 'Cl', 'C', 'H'],
        affinityWeight: 3.0,
        reclaimPriority: ['F', 'O', 'Cl', 'N', 'H'],
        discardProtect: ['F', 'O', 'Cl', 'IONIZATION_SURGE', 'BOND_CLEAVAGE', 'RESONANCE_STABILIZER'],
      },
      synthesisPriorities: {
        spWeight: 1.15,
        efficiencyPerCardWeight: 1.2,
        preferNaturalOverCatalyst: 1.0,
        allowUnstableStaging: true,
        unstableMaxOnField: 1,
        exothermicMinSP: 7,
        chainReactionMinCards: 2,
        avoidSelfDiscardRisk: false,
      },
      defensivePriorities: {
        shieldBeforeAttack: false, // Hunts EN takeovers & shield breaks FIRST!
        bufferMinActiveCompounds: 2,
        resonanceEnabled: true,
        recycleInactiveWithEquilibrium: true,
      },
      eventCardPreferences: {
        redOrder: ['ELECTROLYSIS', 'BOND_CLEAVAGE', 'ACID_RAIN', 'PRECIPITATION', 'HALF_LIFE_DECAY'],
        yellowOrder: ['RESONANCE_STABILIZER', 'SYNTHESIS_ACCELERATOR', 'THERMAL_ACTIVATION', 'DISTILLATION', 'BUFFER_SOLUTION', 'EQUILIBRIUM_SHIFT'],
        useOxidationMinOppElements: 2,
        useReactionDelayMinOppSP: 8,
        useDiffusionIfHandSmaller: true,
      },
      enDisplacementEvaluation: {
        enabled: true,
        evaluateBeforeDefense: true,
        stripShieldBeforeTakeover: true, // Actively plays Ionization Surge to open EN Takeovers!
        minNetSwing: 4, // Aggressive displacement hunter
        pierceShieldBonus: 8,
      },
      legalMoveValidation: true,
      decisionLogging: true,
    },

    opp_curie: {
      configId: 'opp_curie',
      scientistId: 'curie',
      difficulty: 'advanced',
      strategyProfile: 'Experimental Reclamation, Persistence & Decay Pressure (Legal Cards Only)',
      deckConfiguration: STANDARD_FAIR_DECK_CONFIG,
      cardSelectionPreferences: {
        affinitySymbols: ['Ra', 'Po', 'Ba', 'Pb', 'Rn', 'O', 'Cl'],
        affinityWeight: 3.2, // Favors available legal heavy elements without inventing any new mechanics
        reclaimPriority: ['Ra', 'Pb', 'F', 'O', 'Cl', 'Ba', 'Po'],
        discardProtect: ['Ra', 'Pb', 'Rn', 'DISTILLATION', 'HALF_LIFE_DECAY', 'BUFFER_SOLUTION'],
      },
      synthesisPriorities: {
        spWeight: 1.1,
        efficiencyPerCardWeight: 1.1,
        preferNaturalOverCatalyst: 0.8,
        allowUnstableStaging: true, // Methodically runs experimental staging + stabilization
        unstableMaxOnField: 1,
        exothermicMinSP: 6,
        chainReactionMinCards: 2,
        avoidSelfDiscardRisk: false,
      },
      defensivePriorities: {
        shieldBeforeAttack: true,
        bufferMinActiveCompounds: 1,
        resonanceEnabled: true,
        recycleInactiveWithEquilibrium: true,
      },
      eventCardPreferences: {
        redOrder: ['HALF_LIFE_DECAY', 'ELECTROLYSIS', 'ACID_RAIN', 'BOND_CLEAVAGE', 'PRECIPITATION'],
        yellowOrder: ['DISTILLATION', 'THERMAL_ACTIVATION', 'BUFFER_SOLUTION', 'EQUILIBRIUM_SHIFT', 'SYNTHESIS_ACCELERATOR', 'RESONANCE_STABILIZER'],
        useOxidationMinOppElements: 2,
        useReactionDelayMinOppSP: 8,
        useDiffusionIfHandSmaller: true,
      },
      enDisplacementEvaluation: {
        enabled: true,
        evaluateBeforeDefense: false,
        stripShieldBeforeTakeover: true,
        minNetSwing: 6,
        pierceShieldBonus: 5,
      },
      legalMoveValidation: true,
      decisionLogging: true,
    },

    // Chapter 0 Final Examination Adaptive Proctor (uses standard legal mechanics only)
    opp_academy_proctor: {
      configId: 'opp_academy_proctor',
      scientistId: null,
      difficulty: 'advanced',
      strategyProfile: 'Comprehensive Academy Licensure Proctor',
      deckConfiguration: STANDARD_FAIR_DECK_CONFIG,
      cardSelectionPreferences: {
        affinitySymbols: ['F', 'O', 'C', 'Cl', 'N', 'Ra', 'Pb'],
        affinityWeight: 1.8,
        reclaimPriority: ['F', 'O', 'Cl', 'C', 'H'],
        discardProtect: ['F', 'O', 'Cl', 'IONIZATION_SURGE', 'BUFFER_SOLUTION'],
      },
      synthesisPriorities: {
        spWeight: 1.25,
        efficiencyPerCardWeight: 1.3,
        preferNaturalOverCatalyst: 1.2,
        allowUnstableStaging: true,
        unstableMaxOnField: 1,
        exothermicMinSP: 7,
        chainReactionMinCards: 2,
        avoidSelfDiscardRisk: true,
      },
      defensivePriorities: {
        shieldBeforeAttack: false,
        bufferMinActiveCompounds: 1,
        resonanceEnabled: true,
        recycleInactiveWithEquilibrium: true,
      },
      eventCardPreferences: {
        redOrder: ['ELECTROLYSIS', 'ACID_RAIN', 'HALF_LIFE_DECAY', 'BOND_CLEAVAGE', 'PRECIPITATION'],
        yellowOrder: ['SYNTHESIS_ACCELERATOR', 'DISTILLATION', 'BUFFER_SOLUTION', 'THERMAL_ACTIVATION', 'RESONANCE_STABILIZER', 'EQUILIBRIUM_SHIFT'],
        useOxidationMinOppElements: 2,
        useReactionDelayMinOppSP: 10,
        useDiffusionIfHandSmaller: true,
      },
      enDisplacementEvaluation: {
        enabled: true,
        evaluateBeforeDefense: true,
        stripShieldBeforeTakeover: true,
        minNetSwing: 6,
        pierceShieldBonus: 6,
      },
      legalMoveValidation: true,
      decisionLogging: true,
    },
  };

  function getOpponentConfig(configId) {
    return OPPONENT_CONFIGS[configId] || OPPONENT_CONFIGS.opp_mendeleev;
  }

  function listOpponentConfigs() {
    return Object.values(OPPONENT_CONFIGS);
  }

  function validateOpponentConfig(cfg) {
    const required = [
      'configId', 'difficulty', 'strategyProfile', 'deckConfiguration',
      'cardSelectionPreferences', 'synthesisPriorities', 'defensivePriorities',
      'eventCardPreferences', 'enDisplacementEvaluation', 'legalMoveValidation', 'decisionLogging',
    ];
    const errors = [];
    if (!cfg || typeof cfg !== 'object') return { valid: false, errors: ['Config must be an object.'] };
    for (const k of required) {
      if (cfg[k] === undefined) errors.push(`Missing field: ${k}`);
    }
    if (!cfg.deckConfiguration || cfg.deckConfiguration.extraStartingCards !== 0 || cfg.deckConfiguration.extraDrawPerTurn !== 0 || cfg.deckConfiguration.hiddenStatBonuses !== false) {
      errors.push('Opponents must NOT receive extra cards or hidden statistical advantages.');
    }
    if (cfg.legalMoveValidation !== true) {
      errors.push('legalMoveValidation must be true.');
    }
    return { valid: errors.length === 0, errors };
  }

  V.Story = V.Story || {};
  V.Story.STANDARD_FAIR_DECK_CONFIG = STANDARD_FAIR_DECK_CONFIG;
  V.Story.OPPONENT_CONFIGS = OPPONENT_CONFIGS;
  V.Story.getOpponentConfig = getOpponentConfig;
  V.Story.listOpponentConfigs = listOpponentConfigs;
  V.Story.validateOpponentConfig = validateOpponentConfig;
})(typeof window !== 'undefined' ? window : globalThis);

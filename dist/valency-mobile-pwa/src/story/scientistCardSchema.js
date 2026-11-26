// VALENCY — Future Collectible Scientist Card Schema (INACTIVE ARCHITECTURAL LAYER)
// Supports future deck-assignable Scientist Specialist Cards WITHOUT activating them
// in Classic Mode or Story Mode, and WITHOUT inventing numerical bonuses or modifying card balance.
// Strictly separate from ordinary Element cards, Noble Gases, and Event Cards.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const CARD_EXPANSION_FLAGS = Object.freeze({
    ACTIVATED_IN_CLASSIC_MODE: false,
    ACTIVATED_IN_STORY_MODE: false,
    SEPARATE_FROM_MAIN_DECK: true,
    SCHEMA_VERSION: '1.0.0-future-reserved',
  });

  const SCIENTIST_CARD_REQUIRED_FIELDS = Object.freeze([
    'cardId',
    'scientistId',
    'specialty',
    'elementalAffinity',
    'affinityStrength',
    'researchAbility',
    'deckCompatibility',
    'rarity',
    'unlockRequirements',
    'artwork',
    'cardDescription',
    'activeInGameplay',
  ]);

  /**
   * Future-compatible Scientist Card records (reserved metadata only; never dealt or played in Unit 1).
   */
  const FUTURE_SCIENTIST_CARDS = Object.freeze({
    scard_lavoisier: Object.freeze({
      cardId: 'scard_lavoisier',
      scientistId: 'lavoisier',
      specialty: 'Conservation of mass and chemical transformations',
      elementalAffinity: ['O', 'H', 'C', 'S'],
      affinityStrength: null, // Reserved for future expansion; do not invent numerical bonuses yet
      researchAbility: Object.freeze({
        abilityId: 'future_conservation_ledger',
        status: 'RESERVED_FUTURE_EXPANSION',
        summary: 'Future specialist slot hook related to mass conservation and reagent efficiency (inactive).',
      }),
      deckCompatibility: Object.freeze({
        slotType: 'SCIENTIST_SPECIALIST_SLOT',
        separateFromMainDeck: true,
        eligibleModes: ['FUTURE_SPECIALIST_EXPANSION'],
      }),
      rarity: 'ARCHIVE_FOUNDER',
      unlockRequirements: Object.freeze({
        stageOneSimulationDefeat: 'lavoisier',
        stageTwoResearchChallengeId: 'rc_lavoisier',
      }),
      artwork: Object.freeze({
        portraitRef: 'lavoisier',
        artAssetPath: 'assets/portraits/lavoisier.svg',
        frameVariant: 'specialist_archive_blue',
      }),
      cardDescription:
        'Reserved Future Scientist Card for Antoine Lavoisier. Stage Two completion records eligibility for activation in a future VALENCY expansion.',
      activeInGameplay: false,
    }),

    scard_mendeleev: Object.freeze({
      cardId: 'scard_mendeleev',
      scientistId: 'mendeleev',
      specialty: 'Periodic organization and elemental relationships',
      elementalAffinity: ['Ga', 'Ge', 'Si', 'Al', 'B'],
      affinityStrength: null,
      researchAbility: Object.freeze({
        abilityId: 'future_periodic_prediction',
        status: 'RESERVED_FUTURE_EXPANSION',
        summary: 'Future specialist slot hook related to periodic group synergy (inactive).',
      }),
      deckCompatibility: Object.freeze({
        slotType: 'SCIENTIST_SPECIALIST_SLOT',
        separateFromMainDeck: true,
        eligibleModes: ['FUTURE_SPECIALIST_EXPANSION'],
      }),
      rarity: 'ARCHIVE_FOUNDER',
      unlockRequirements: Object.freeze({
        stageOneSimulationDefeat: 'mendeleev',
        stageTwoResearchChallengeId: 'rc_mendeleev',
      }),
      artwork: Object.freeze({
        portraitRef: 'mendeleev',
        artAssetPath: 'assets/portraits/mendeleev.svg',
        frameVariant: 'specialist_archive_violet',
      }),
      cardDescription:
        'Reserved Future Scientist Card for Dmitri Mendeleev. Stage Two completion records eligibility for activation in a future VALENCY expansion.',
      activeInGameplay: false,
    }),

    scard_pauling: Object.freeze({
      cardId: 'scard_pauling',
      scientistId: 'pauling',
      specialty: 'Chemical bonding and electronegativity',
      elementalAffinity: ['F', 'O', 'N', 'C', 'H', 'Cl'],
      affinityStrength: null,
      researchAbility: Object.freeze({
        abilityId: 'future_bond_resonance',
        status: 'RESERVED_FUTURE_EXPANSION',
        summary: 'Future specialist slot hook related to bonding and electronegativity analysis (inactive).',
      }),
      deckCompatibility: Object.freeze({
        slotType: 'SCIENTIST_SPECIALIST_SLOT',
        separateFromMainDeck: true,
        eligibleModes: ['FUTURE_SPECIALIST_EXPANSION'],
      }),
      rarity: 'ARCHIVE_FOUNDER',
      unlockRequirements: Object.freeze({
        stageOneSimulationDefeat: 'pauling',
        stageTwoResearchChallengeId: 'rc_pauling',
      }),
      artwork: Object.freeze({
        portraitRef: 'pauling',
        artAssetPath: 'assets/portraits/pauling.svg',
        frameVariant: 'specialist_archive_amber',
      }),
      cardDescription:
        'Reserved Future Scientist Card for Linus Pauling. Stage Two completion records eligibility for activation in a future VALENCY expansion.',
      activeInGameplay: false,
    }),

    scard_curie: Object.freeze({
      cardId: 'scard_curie',
      scientistId: 'curie',
      specialty: 'Radioactivity and radioactive elements',
      elementalAffinity: ['Ra', 'Po', 'Rn', 'Ba', 'Pb'],
      affinityStrength: null,
      researchAbility: Object.freeze({
        abilityId: 'future_radiochemistry_isolation',
        status: 'RESERVED_FUTURE_EXPANSION',
        summary: 'Future specialist slot hook related to heavy-element research and isolation (inactive).',
      }),
      deckCompatibility: Object.freeze({
        slotType: 'SCIENTIST_SPECIALIST_SLOT',
        separateFromMainDeck: true,
        eligibleModes: ['FUTURE_SPECIALIST_EXPANSION'],
      }),
      rarity: 'ARCHIVE_FOUNDER',
      unlockRequirements: Object.freeze({
        stageOneSimulationDefeat: 'curie',
        stageTwoResearchChallengeId: 'rc_curie',
      }),
      artwork: Object.freeze({
        portraitRef: 'curie',
        artAssetPath: 'assets/portraits/curie.svg',
        frameVariant: 'specialist_archive_emerald',
      }),
      cardDescription:
        'Reserved Future Scientist Card for Marie Curie. Stage Two completion records eligibility for activation in a future VALENCY expansion.',
      activeInGameplay: false,
    }),
  });

  function getFutureScientistCard(cardId) {
    return FUTURE_SCIENTIST_CARDS[cardId] || null;
  }

  function listFutureScientistCards() {
    return Object.values(FUTURE_SCIENTIST_CARDS);
  }

  function validateScientistCardSchema(record) {
    if (!record || typeof record !== 'object') {
      return { valid: false, errors: ['Record must be an object.'] };
    }
    const errors = [];
    for (const f of SCIENTIST_CARD_REQUIRED_FIELDS) {
      if (!(f in record)) errors.push(`Missing required field: ${f}`);
    }
    if (record.activeInGameplay !== false) {
      errors.push('Scientist Cards must remain inactive (activeInGameplay === false) during this development stage.');
    }
    if (record.affinityStrength !== null) {
      errors.push('Do not assign numerical affinityStrength bonuses during this development stage.');
    }
    if (!record.deckCompatibility || record.deckCompatibility.separateFromMainDeck !== true) {
      errors.push('Scientist Cards must remain strictly separate from the main Element/Event deck.');
    }
    return { valid: errors.length === 0, errors };
  }

  V.Story = V.Story || {};
  V.Story.CARD_EXPANSION_FLAGS = CARD_EXPANSION_FLAGS;
  V.Story.SCIENTIST_CARD_REQUIRED_FIELDS = SCIENTIST_CARD_REQUIRED_FIELDS;
  V.Story.FUTURE_SCIENTIST_CARDS = FUTURE_SCIENTIST_CARDS;
  V.Story.getFutureScientistCard = getFutureScientistCard;
  V.Story.listFutureScientistCards = listFutureScientistCards;
  V.Story.validateScientistCardSchema = validateScientistCardSchema;
})(typeof window !== 'undefined' ? window : globalThis);

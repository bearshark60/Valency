// VALENCY: THE ELEMENTAL FRONTIER — Phase 4: Scientist Equipment & Progression Manager
// Scientist Cards are strategic equipment (1 primary slot), NEVER shuffled into the player's hand.
// Frontier constructs are independent fictionalized entities distinct from Academy teaching simulations.
// Proof-of-concept functional scientist: Antoine Lavoisier (Frontier Construct).

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

  const FRONTIER_SCIENTIST_DEFS = Object.freeze({
    lavoisier: Object.freeze({
      scientistId: 'lavoisier',
      constructName: 'Frontier Construct: Antoine Lavoisier',
      historicalName: 'Antoine Lavoisier',
      status: 'ACTIVE_PROOF_OF_CONCEPT',
      originRegionId: 'region_caloric_basin',
      originTerritoryLabel: 'Sector 01 — The Caloric Basin',
      scientificSpecialty: 'Conservation of mass and quantitative reagent accounting',
      elementalAffinities: ['O', 'H', 'C', 'S'],
      portraitRef: 'lavoisier',
      artworkRef: 'assets/portraits/lavoisier.svg',
      disclaimer:
        'Independent fictionalized Frontier construct inspired by Antoine Lavoisier’s documented scientific contributions—distinct from the Academy teaching simulation.',
      passiveAbility: Object.freeze({
        id: 'pass_lavoisier_conservation',
        name: 'Mass Conservation Ledger',
        maxTriggersPerMatch: 1,
        description:
          'Once per match, when you cleanly synthesize a real (non-catalyzed) Oxygen- or Hydrogen-bearing compound, draw 1 extra card.',
      }),
      activeAbility: Object.freeze({
        id: 'act_lavoisier_reclaim',
        name: 'Quantitative Reclamation',
        phase: 'DEFENSE',
        maxUsesPerMatch: 1,
        description:
          'Once per match during Phase 3 (Defense & Events), reclaim 1 Element card from the Discard Pile into your hand.',
      }),
      researchTree: Object.freeze([
        Object.freeze({
          researchId: 'res_lav_mass_balance',
          title: 'Caloric Basin Mass-Balance Ledger',
          costResearchData: 20,
          description:
            'Recovers Lavoisier’s Convergence calibration logs showing how spontaneous unbonding violates apparent mass conservation in Sector 01.',
          unlocksStoryFlag: 'lavoisierLedgerRecovered',
        }),
        Object.freeze({
          researchId: 'res_lav_nomenclature_index',
          title: 'Systematic Nomenclature Cross-Index',
          costResearchData: 35,
          description:
            'Unlocks historical cross-reference records linking Convergence anomaly signatures to early Oxide & Hydride instability trials.',
          unlocksStoryFlag: 'lavoisierNomenclatureIndexed',
        }),
      ]),
    }),

    mendeleev: Object.freeze({
      scientistId: 'mendeleev',
      constructName: 'Frontier Construct: Dmitri Mendeleev',
      historicalName: 'Dmitri Mendeleev',
      status: 'RESERVED_FUTURE_REGION',
      originRegionId: 'region_periodic_spire',
      originTerritoryLabel: 'Future Region — Periodic Spire',
      scientificSpecialty: 'Periodic organization and elemental relationships',
      elementalAffinities: ['Ga', 'Ge', 'Si', 'Al', 'B'],
      portraitRef: 'mendeleev',
      artworkRef: 'assets/portraits/mendeleev.svg',
      disclaimer: 'Independent fictionalized Frontier construct (reserved for a future Frontier region).',
      passiveAbility: null,
      activeAbility: null,
      researchTree: Object.freeze([]),
    }),

    pauling: Object.freeze({
      scientistId: 'pauling',
      constructName: 'Frontier Construct: Linus Pauling',
      historicalName: 'Linus Pauling',
      status: 'RESERVED_FUTURE_REGION',
      originRegionId: 'region_dipole_ridge',
      originTerritoryLabel: 'Future Region — Dipole Ridge',
      scientificSpecialty: 'Chemical bonding and electronegativity',
      elementalAffinities: ['F', 'O', 'N', 'C', 'H', 'Cl'],
      portraitRef: 'pauling',
      artworkRef: 'assets/portraits/pauling.svg',
      disclaimer: 'Independent fictionalized Frontier construct (reserved for a future Frontier region).',
      passiveAbility: null,
      activeAbility: null,
      researchTree: Object.freeze([]),
    }),

    curie: Object.freeze({
      scientistId: 'curie',
      constructName: 'Frontier Construct: Marie Curie',
      historicalName: 'Marie Curie',
      status: 'RESERVED_FUTURE_REGION',
      originRegionId: 'region_pitchblende_trench',
      originTerritoryLabel: 'Future Region — Pitchblende Trench',
      scientificSpecialty: 'Radioactivity, scientific investigation, and element isolation',
      elementalAffinities: ['Ra', 'Po', 'Rn', 'Ba', 'Pb'],
      portraitRef: 'curie',
      artworkRef: 'assets/portraits/curie.svg',
      disclaimer: 'Independent fictionalized Frontier construct (reserved for a future Frontier region).',
      passiveAbility: null,
      activeAbility: null,
      researchTree: Object.freeze([]),
    }),
  });

  function getScientistDef(scientistId) {
    return FRONTIER_SCIENTIST_DEFS[scientistId] || null;
  }

  function listScientistDefs() {
    return Object.values(FRONTIER_SCIENTIST_DEFS);
  }

  function ensureProfileScientists(profile) {
    profile.scientists = profile.scientists || {};
    for (const def of listScientistDefs()) {
      if (!profile.scientists[def.scientistId]) {
        profile.scientists[def.scientistId] = {
          scientistId: def.scientistId,
          unlocked: false,
          unlockedAt: null,
          scientificSpecialty: def.scientificSpecialty,
          elementalAffinities: [...def.elementalAffinities],
          passiveAbilityId: def.passiveAbility ? def.passiveAbility.id : null,
          activeAbilityId: def.activeAbility ? def.activeAbility.id : null,
          experience: 0,
          level: 1,
          researchUnlocks: [],
          recoveredRecords: [],
        };
      }
    }
    return profile.scientists;
  }

  function unlockScientistPermanently(profile, scientistId, recoveredRecord) {
    const def = getScientistDef(scientistId);
    if (!def) return { ok: false, error: `Unknown Frontier scientistId: ${scientistId}` };
    ensureProfileScientists(profile);
    const rec = profile.scientists[scientistId];
    const newlyUnlocked = !rec.unlocked;
    rec.unlocked = true;
    rec.unlockedAt = rec.unlockedAt || new Date().toISOString();
    if (recoveredRecord && !rec.recoveredRecords.includes(recoveredRecord)) {
      rec.recoveredRecords.push(recoveredRecord);
    }
    return { ok: true, newlyUnlocked, scientist: rec };
  }

  /**
   * Changing Scientists is allowed ONLY outside battle, outside active expeditions,
   * and at designated safe preparation locations (settlements / laboratories).
   */
  function canChangeEquipment(profile, activeExpedition) {
    if (activeExpedition && activeExpedition.expeditionStatus === 'ACTIVE') {
      return { allowed: false, reason: 'Cannot change equipped Scientist while an expedition is active.' };
    }
    if (F.WorldManager && F.WorldManager.isSafePreparationLocation) {
      if (!F.WorldManager.isSafePreparationLocation(profile.currentLocationId)) {
        return { allowed: false, reason: 'Return to a Settlement or Laboratory safe zone to change Scientists.' };
      }
    }
    return { allowed: true };
  }

  function equipScientist(profile, scientistId, activeExpedition) {
    const gate = canChangeEquipment(profile, activeExpedition);
    if (!gate.allowed) return { ok: false, error: gate.reason };

    if (scientistId === null) {
      profile.equippedScientistId = null;
      const deck = profile.decks && profile.decks[profile.activeDeckId];
      if (deck) deck.equippedScientistId = null;
      return { ok: true, equippedScientistId: null };
    }

    const def = getScientistDef(scientistId);
    if (!def) return { ok: false, error: `Unknown Scientist: ${scientistId}` };
    ensureProfileScientists(profile);
    const rec = profile.scientists[scientistId];
    if (!rec.unlocked) {
      return { ok: false, error: `${def.historicalName} has not been recovered and unlocked in the Frontier yet.` };
    }
    if (def.status !== 'ACTIVE_PROOF_OF_CONCEPT') {
      return { ok: false, error: `${def.historicalName}'s Frontier construct abilities are reserved for a future region.` };
    }

    profile.equippedScientistId = scientistId;
    const deck = profile.decks && profile.decks[profile.activeDeckId];
    if (deck) deck.equippedScientistId = scientistId;
    return { ok: true, equippedScientistId: scientistId };
  }

  function awardExperience(profile, scientistId, amount) {
    ensureProfileScientists(profile);
    const rec = profile.scientists[scientistId];
    if (!rec || !rec.unlocked) return { ok: false, error: 'Scientist must be unlocked to gain experience.' };
    const xpGain = Math.max(0, Math.floor(Number(amount) || 0));
    const prevLevel = rec.level || 1;
    rec.experience = (rec.experience || 0) + xpGain;
    rec.level = 1 + Math.floor(rec.experience / 100);
    return {
      ok: true,
      xpGain,
      experience: rec.experience,
      level: rec.level,
      leveledUp: rec.level > prevLevel,
    };
  }

  function unlockResearchNode(profile, scientistId, researchId) {
    const def = getScientistDef(scientistId);
    if (!def) return { ok: false, error: 'Unknown Scientist.' };
    ensureProfileScientists(profile);
    const rec = profile.scientists[scientistId];
    if (!rec.unlocked) return { ok: false, error: 'Unlock this Scientist before researching their logs.' };
    const node = (def.researchTree || []).find((n) => n.researchId === researchId);
    if (!node) return { ok: false, error: `Unknown research node: ${researchId}` };
    if (rec.researchUnlocks.includes(researchId)) {
      return { ok: false, error: 'Research node already unlocked.' };
    }
    const haveData = (profile.currencies && profile.currencies.researchData) || 0;
    if (haveData < node.costResearchData) {
      return { ok: false, error: `Requires ${node.costResearchData} Research Data (you have ${haveData}).` };
    }

    profile.currencies.researchData -= node.costResearchData;
    rec.researchUnlocks.push(researchId);
    if (node.unlocksStoryFlag) {
      profile.storyFlags = profile.storyFlags || {};
      profile.storyFlags[node.unlocksStoryFlag] = true;
    }
    return { ok: true, node, scientist: rec };
  }

  /**
   * Build battle-ready per-match Scientist runtime state for canonical gameEngine.js.
   * Returns null when no Scientist is equipped (preserving Classic/Tutorial/Academy behavior 100%).
   */
  function createBattleScientistPayload(profile) {
    if (!profile || !profile.equippedScientistId) return null;
    const def = getScientistDef(profile.equippedScientistId);
    const rec = profile.scientists && profile.scientists[profile.equippedScientistId];
    if (!def || !rec || !rec.unlocked) return null;

    return {
      scientistId: def.scientistId,
      name: def.historicalName,
      constructName: def.constructName,
      level: rec.level || 1,
      elementalAffinities: [...def.elementalAffinities],
      passiveAbility: def.passiveAbility ? { ...def.passiveAbility } : null,
      passiveTriggersRemaining: def.passiveAbility ? def.passiveAbility.maxTriggersPerMatch : 0,
      activeAbility: def.activeAbility ? { ...def.activeAbility } : null,
      activeUsesRemaining: def.activeAbility ? def.activeAbility.maxUsesPerMatch : 0,
    };
  }

  F.FRONTIER_SCIENTIST_DEFS = FRONTIER_SCIENTIST_DEFS;
  F.ScientistEquipment = {
    getScientistDef,
    listScientistDefs,
    ensureProfileScientists,
    unlockScientistPermanently,
    canChangeEquipment,
    equipScientist,
    awardExperience,
    unlockResearchNode,
    createBattleScientistPayload,
  };
})(typeof window !== 'undefined' ? window : globalThis);

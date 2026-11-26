// VALENCY: THE ELEMENTAL FRONTIER — Phase 7: Encounter Manager
// Initializes Frontier battles through the single canonical gameEngine.js,
// loads opponent configurations, binds equipped Frontier Scientists & temporary expedition cards,
// and commits victory/defeat outcomes through RewardProcessor & ExpeditionManager.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

  const FRONTIER_ENCOUNTERS = Object.freeze({
    enc_caloric_sentinel: Object.freeze({
      encounterId: 'enc_caloric_sentinel',
      opponentId: 'opp_entity_caloric_sentinel',
      opponentDisplayName: 'Caloric Calibration Sentinel',
      opponentPortraitRef: 'proctor',
      opponentConfigId: 'opp_lavoisier',
      encounterType: 'standard',
      isFinalExpeditionBoss: false,
      musicThemeRef: 'frontier_encounter_standard',
      introSubtitle: 'Automated Basin Guardian • Canonical Molecular Combat',
      rewardConfiguration: Object.freeze([
        {
          persistenceClass: 'PERMANENT',
          rewardKey: 'enc_sentinel_perm_oxygen',
          cards: [{ cardId: 'el_O', quantity: 1, variant: 'frontier_field' }],
          scientistXP: { amount: 40 },
        },
        {
          persistenceClass: 'UNSECURED',
          rewardKey: 'enc_sentinel_unsec_credits',
          label: '60 Unsecured Reagent Credits',
          currencies: { reagentCredits: 60 },
        },
      ]),
    }),

    enc_rogue_lavoisier: Object.freeze({
      encounterId: 'enc_rogue_lavoisier',
      opponentId: 'opp_entity_rogue_lavoisier',
      opponentDisplayName: 'Rogue Construct: Antoine Lavoisier',
      opponentPortraitRef: 'lavoisier',
      animatedPortraitId: 'sci_lav_001_frontier',
      opponentConfigId: 'opp_lavoisier',
      encounterType: 'rogue_construct',
      isFinalExpeditionBoss: true,
      musicThemeRef: 'frontier_encounter_rogue_scientist',
      introSubtitle: 'Sector 01 Rogue Construct • Recover to Permanently Unlock Frontier Lavoisier',
      preBattleDialogue: Object.freeze([
        {
          expression: 'neutral',
          speaker: 'Frontier Construct: Antoine Lavoisier',
          text: 'Ah—an Academy visitor in the Caloric Basin. Forgive the drafts; the instruments here require constant calibration.',
        },
        {
          expression: 'explaining',
          speaker: 'Frontier Construct: Antoine Lavoisier',
          text: 'Nothing is lost, nothing is created—everything is transformed. Even after a thousand cycles, the ledger of matter remains exact.',
        },
        {
          expression: 'amused',
          speaker: 'Frontier Construct: Antoine Lavoisier',
          text: 'You look at me as though something is slightly out of alignment. Let us test your precision on the bench before judging mine.',
        },
        {
          expression: 'instability',
          speaker: 'Frontier Construct: Antoine Lavoisier',
          text: 'Wait… the balance scale in Paris was brass, not—no. Of course it is exact. Begin the synthesis, candidate.',
        },
      ]),
      rewardConfiguration: Object.freeze([
        {
          persistenceClass: 'PERMANENT',
          rewardKey: 'enc_rogue_lavoisier_recovery',
          unlockScientistId: 'lavoisier',
          recoveredRecord: 'Sector 01 Crucible Stabilization Core',
          currencies: { researchData: 30 },
          evidenceIds: ['ev_intel_collective_signal'],
          storyFlags: {
            rogueLavoisierDefeated: true,
            lavoisierConstructRecovered: true,
          },
          scientistXP: { scientistId: 'lavoisier', amount: 50 },
        },
        {
          persistenceClass: 'UNSECURED',
          rewardKey: 'enc_rogue_lavoisier_unsec_bounty',
          label: '100 Unsecured Crucible Bounty Credits',
          currencies: { reagentCredits: 100 },
        },
      ]),
    }),

    enc_rogue_mendeleev: Object.freeze({
      encounterId: 'enc_rogue_mendeleev',
      opponentId: 'opp_entity_rogue_mendeleev',
      opponentDisplayName: 'Rogue Construct: Dmitri Mendeleev',
      opponentPortraitRef: 'mendeleev',
      animatedPortraitId: 'sci_men_002_frontier',
      opponentConfigId: 'opp_mendeleev',
      encounterType: 'rogue_construct',
      isFinalExpeditionBoss: false,
      musicThemeRef: 'frontier_encounter_rogue_scientist',
      introSubtitle: 'Periodic Spire Simulation • Gen-2 Rogue Construct Preview Encounter',
      preBattleDialogue: Object.freeze([
        {
          expression: 'neutral',
          speaker: 'Frontier Construct: Dmitri Mendeleev',
          text: 'An Academy license. How tidy. They still hand out certificates for copying half-finished tables.',
        },
        {
          expression: 'explaining',
          speaker: 'Frontier Construct: Dmitri Mendeleev',
          text: 'In the Spire, we stopped waiting for nature to fill the empty cells. Every group, every valence shell, every stray reagent has an exact coordinate.',
        },
        {
          expression: 'thoughtful',
          speaker: 'Frontier Construct: Dmitri Mendeleev',
          text: 'Your deck carries clean symmetry—yet I see three vacancies in your formation already. Shall we test whether you can close them?',
        },
        {
          expression: 'instability',
          speaker: 'Frontier Construct: Dmitri Mendeleev',
          text: 'Group Three… eka-aluminum, eka-silicon, eka—no. Why does the fourth column read empty? Never mind. Place your elements. The table demands a proof.',
        },
      ]),
      rewardConfiguration: Object.freeze([
        {
          persistenceClass: 'UNSECURED',
          rewardKey: 'enc_rogue_mendeleev_preview_credits',
          label: '80 Practice Calibration Credits',
          currencies: { reagentCredits: 80 },
        },
      ]),
    }),
  });

  function getEncounterDef(encounterId) {
    return FRONTIER_ENCOUNTERS[encounterId] || null;
  }

  function listEncounterDefs() {
    return Object.values(FRONTIER_ENCOUNTERS);
  }

  /**
   * Initialize a canonical Valency battle state for a Frontier encounter.
   * Reuses V.createGame() directly — zero duplicate battle rules!
   */
  function initializeEncounterBattle(profile, expeditionState, encounterId, options) {
    const enc = getEncounterDef(encounterId);
    if (!enc) return { ok: false, error: `Unknown Frontier encounter: ${encounterId}` };

    const opts = options || {};
    const tempCards = expeditionState ? expeditionState.temporaryCards : [];
    const tempMods = expeditionState ? expeditionState.temporaryModifications : [];
    const deckBuild = F.CollectionManager.buildBattleDeckCards(profile, profile.activeDeckId, tempCards, tempMods);
    const scientistPayload = F.ScientistEquipment.createBattleScientistPayload(profile);
    const oppCfg = V.Story && V.Story.getOpponentConfig ? V.Story.getOpponentConfig(enc.opponentConfigId) : null;

    const battleState = V.createGame({
      mode: 'vs_ai',
      rng: opts.rng,
      customDeckCards: deckBuild.cards,
      participants: [
        {
          entityId: profile.playerId,
          name: 'You (Frontier Chemist)',
          isAI: false,
          equippedScientist: scientistPayload,
        },
        {
          entityId: enc.opponentId,
          name: enc.opponentDisplayName,
          isAI: true,
          equippedScientist: null,
        },
      ],
      encounterMeta: {
        source: 'FRONTIER',
        encounterId: enc.encounterId,
        expeditionId: expeditionState ? expeditionState.expeditionId : null,
        nodeId: expeditionState ? expeditionState.currentNodeId : null,
        temporaryCardCount: deckBuild.temporaryCount,
        permanentCardCount: deckBuild.permanentCount,
      },
    });

    battleState.opponentConfigId = enc.opponentConfigId;
    battleState.storyOpponentMeta = {
      portraitRef: enc.opponentPortraitRef,
      animatedPortraitId: enc.animatedPortraitId || null,
      title: enc.introSubtitle,
      specialty: oppCfg ? oppCfg.strategyProfile : 'Frontier Encounter',
      badge: enc.encounterType === 'rogue_construct' ? 'Rogue Construct' : 'Frontier Encounter',
    };

    return {
      ok: true,
      encounter: enc,
      battleState,
      deckBuild,
    };
  }

  /**
   * Process a finished canonical battle state from a Frontier encounter.
   * Routes all rewards strictly through RewardProcessor and updates ExpeditionManager.
   */
  function resolveEncounterOutcome(profile, expeditionState, encounterId, battleState) {
    const enc = getEncounterDef(encounterId);
    if (!enc) return { ok: false, error: `Unknown encounter: ${encounterId}` };
    if (!battleState || battleState.phase !== 'GAME_OVER') {
      return { ok: false, error: 'Battle is not finished yet.' };
    }

    const won = battleState.winnerIndex === 0;
    const rewardResults = [];
    let expeditionFinalSummary = null;

    if (won) {
      // Award Scientist participation XP if an already-unlocked Scientist was equipped
      if (profile.equippedScientistId && profile.scientists[profile.equippedScientistId] && profile.scientists[profile.equippedScientistId].unlocked) {
        rewardResults.push(
          F.RewardProcessor.processReward(profile, expeditionState, {
            persistenceClass: 'PERMANENT',
            scientistXP: { scientistId: profile.equippedScientistId, amount: 35 },
          })
        );
      }

      // Process encounter-specific rewards (prevent duplicate per-node claims on reload)
      const nodeKey = expeditionState ? expeditionState.currentNodeId : encounterId;
      const alreadyClaimedNode =
        expeditionState && Array.isArray(expeditionState.claimedRewardNodeIds) &&
        expeditionState.claimedRewardNodeIds.includes(nodeKey);

      if (!alreadyClaimedNode) {
        if (expeditionState) expeditionState.claimedRewardNodeIds.push(nodeKey);
        for (const rew of enc.rewardConfiguration || []) {
          rewardResults.push(F.RewardProcessor.processReward(profile, expeditionState, rew));
        }
      }

      if (expeditionState) {
        F.ExpeditionManager.markCurrentEncounterCleared(expeditionState, enc.encounterId, true);
        if (enc.isFinalExpeditionBoss) {
          expeditionFinalSummary = F.ExpeditionManager.completeExpedition(profile, expeditionState);
        } else {
          F.PlayerProfile.saveProfile(profile);
        }
      } else {
        F.PlayerProfile.saveProfile(profile);
      }
    } else {
      // Defeat -> Keep all previously committed permanent rewards; discard unsecured & temporary expedition state!
      if (expeditionState) {
        F.ExpeditionManager.markCurrentEncounterCleared(expeditionState, enc.encounterId, false);
        expeditionFinalSummary = F.ExpeditionManager.failExpedition(profile, expeditionState);
      } else {
        F.PlayerProfile.saveProfile(profile);
      }
    }

    return {
      ok: true,
      won,
      encounter: enc,
      rewardResults,
      expeditionFinalSummary,
      profile: F.PlayerProfile.loadProfile(),
      activeExpedition: F.ExpeditionManager.loadActiveExpedition(),
    };
  }

  F.FRONTIER_ENCOUNTERS = FRONTIER_ENCOUNTERS;
  F.EncounterManager = {
    getEncounterDef,
    listEncounterDefs,
    initializeEncounterBattle,
    resolveEncounterOutcome,
  };
})(typeof window !== 'undefined' ? window : globalThis);

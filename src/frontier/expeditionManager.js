// VALENCY: THE ELEMENTAL FRONTIER — Phase 6: Expedition Lifecycle Manager
// Stores temporary expedition state strictly isolated from PlayerProfile (`valency_frontier_active_expedition_v1`).
// Implements handcrafted branching routes, temporary card offers, unsecured rewards, reload deduplication,
// and Keep-Permanent-Rewards failure/withdrawal semantics via RewardProcessor.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

  const EXPEDITION_STORAGE_KEY = 'valency_frontier_active_expedition_v1';
  let memoryExpedition = null;

  function getStorage() {
    try {
      if (typeof global.localStorage !== 'undefined' && global.localStorage) {
        return global.localStorage;
      }
    } catch (_) {}
    return null;
  }

  /**
   * Handcrafted Stage 3B Vertical-Slice Expedition Route: Sector 01 — The Conservation Crucible
   * Demonstrates branching paths, temporary card offers, permanent research discoveries,
   * standard encounter, optional extraction point, and final Rogue Lavoisier Construct encounter.
   */
  const EXPEDITION_ROUTES = Object.freeze({
    exp_caloric_crucible: Object.freeze({
      expeditionId: 'exp_caloric_crucible',
      regionId: 'region_caloric_basin',
      entranceLocationId: 'loc_lavoisier_rift',
      title: 'The Conservation Crucible',
      subtitle: 'Branching Sector 01 Expedition — Locate & Recover the Rogue Lavoisier Construct',
      startNodeId: 'node_entry',
      nodes: Object.freeze({
        node_entry: Object.freeze({
          nodeId: 'node_entry',
          title: 'Crucible Perimeter Airlock',
          type: 'start',
          description:
            'Caloric telemetry splits into two passages: a sealed Reagent Supply Cache (temporary expedition cards) or an Overheated Spectograph Bench (permanent Research Data & Convergence clue).',
          nextNodeIds: ['node_reagent_cache', 'node_research_site'],
        }),

        node_reagent_cache: Object.freeze({
          nodeId: 'node_reagent_cache',
          title: 'Emergency Reagent Cache',
          type: 'temporary_offer',
          description:
            'Salvage pressurized field reagents for this expedition only. Temporary cards boost your battle deck during the run and are removed when the expedition ends.',
          nextNodeIds: ['node_vanguard'],
          rewards: [
            {
              persistenceClass: 'TEMPORARY',
              sourceNodeId: 'node_reagent_cache',
              temporaryCards: [
                { cardId: 'el_O', quantity: 2 },
                { cardId: 'inst_EXOTHERMIC_SURGE', quantity: 1 },
              ],
              temporaryModifications: [
                { modId: 'mod_caloric_feedstock', label: 'Pressurized Oxygen Feedstock (Expedition Only)' },
              ],
              temporaryResources: { fieldSupplies: 2 },
            },
            {
              persistenceClass: 'UNSECURED',
              rewardKey: 'unsec_cache_credits',
              label: '35 Unsecured Reagent Credits',
              currencies: { reagentCredits: 35 },
            },
          ],
        }),

        node_research_site: Object.freeze({
          nodeId: 'node_research_site',
          title: 'Fractured Spectrograph Bench',
          type: 'research',
          description:
            'Analyze spontaneous unbonding logs left behind by the rogue construct. Scientific discoveries and Research Data committed here are PERMANENT—even if the expedition fails.',
          nextNodeIds: ['node_vanguard'],
          rewards: [
            {
              persistenceClass: 'PERMANENT',
              rewardKey: 'exp_crucible_spectrograph_perm',
              sourceLocationId: 'loc_lavoisier_rift',
              currencies: { researchData: 25 },
              evidenceIds: ['ev_sci_spontaneous_cleavage'],
            },
            {
              persistenceClass: 'UNSECURED',
              rewardKey: 'unsec_research_credits',
              label: '30 Unsecured Reagent Credits',
              currencies: { reagentCredits: 30 },
            },
          ],
        }),

        node_vanguard: Object.freeze({
          nodeId: 'node_vanguard',
          title: 'Thermal Calibration Sentinel',
          type: 'encounter',
          encounterId: 'enc_caloric_sentinel',
          description:
            'An automated Perimeter Calibration Sentinel guards the inner chamber. Defeat it using the canonical molecular battle system to earn a permanent Oxygen copy and reach the Extraction Point or Rogue Construct.',
          nextNodeIds: ['node_extraction', 'node_boss_lavoisier'],
        }),

        node_extraction: Object.freeze({
          nodeId: 'node_extraction',
          title: 'Perimeter Extraction Lift',
          type: 'extraction',
          description:
            'Safe lift back to Hearth Outpost. Extracting now secures all Unsecured Rewards permanently and cleanly closes the expedition.',
          nextNodeIds: [],
        }),

        node_boss_lavoisier: Object.freeze({
          nodeId: 'node_boss_lavoisier',
          title: 'Inner Crucible — Rogue Lavoisier Construct',
          type: 'final_encounter',
          encounterId: 'enc_rogue_lavoisier',
          description:
            'The Rogue Frontier Construct of Antoine Lavoisier is overriding every equilibrium chamber in Sector 01. Defeat him in molecular combat to recover and permanently unlock Frontier Lavoisier!',
          nextNodeIds: [],
        }),
      }),
    }),
  });

  function getExpeditionDef(expeditionId) {
    return EXPEDITION_ROUTES[expeditionId] || null;
  }

  function saveActiveExpedition(expState) {
    if (!expState) {
      clearActiveExpedition();
      return null;
    }
    const copy = JSON.parse(JSON.stringify(expState));
    memoryExpedition = JSON.parse(JSON.stringify(copy));
    const store = getStorage();
    if (store) {
      try {
        store.setItem(EXPEDITION_STORAGE_KEY, JSON.stringify(copy));
      } catch (_) {}
    }
    return copy;
  }

  function loadActiveExpedition() {
    const store = getStorage();
    if (store) {
      try {
        const raw = store.getItem(EXPEDITION_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.expeditionStatus === 'ACTIVE') {
            memoryExpedition = JSON.parse(JSON.stringify(parsed));
            return parsed;
          }
        }
      } catch (_) {}
    }
    return memoryExpedition && memoryExpedition.expeditionStatus === 'ACTIVE'
      ? JSON.parse(JSON.stringify(memoryExpedition))
      : null;
  }

  function clearActiveExpedition() {
    memoryExpedition = null;
    const store = getStorage();
    if (store) {
      try {
        store.removeItem(EXPEDITION_STORAGE_KEY);
      } catch (_) {}
    }
  }

  function startExpedition(profile, expeditionId) {
    const def = getExpeditionDef(expeditionId || 'exp_caloric_crucible');
    if (!def) return { ok: false, error: `Unknown expedition: ${expeditionId}` };
    const existing = loadActiveExpedition();
    if (existing && existing.expeditionStatus === 'ACTIVE') {
      return { ok: true, resumed: true, expedition: existing };
    }

    const expState = {
      expeditionId: def.expeditionId,
      regionId: def.regionId,
      route: Object.keys(def.nodes),
      currentNodeId: def.startNodeId,
      visitedNodeIds: [def.startNodeId],
      resolvedNodeIds: [def.startNodeId], // Start node requires no action to branch from
      claimedRewardNodeIds: [], // Prevents duplicate rewards across save/reload!
      temporaryCards: [],
      temporaryModifications: [],
      temporaryResources: { fieldSupplies: 1 },
      unsecuredRewards: [],
      committedPermanentLog: [],
      encounterHistory: [],
      expeditionStatus: 'ACTIVE',
      startedAt: new Date().toISOString(),
    };

    const saved = saveActiveExpedition(expState);
    return { ok: true, resumed: false, expedition: saved };
  }

  function getAvailableNextNodes(expState) {
    if (!expState || expState.expeditionStatus !== 'ACTIVE') return [];
    const def = getExpeditionDef(expState.expeditionId);
    if (!def) return [];
    const curNode = def.nodes[expState.currentNodeId];
    if (!curNode) return [];
    // Must resolve current node before advancing
    if (!expState.resolvedNodeIds.includes(expState.currentNodeId)) return [];
    return (curNode.nextNodeIds || []).map((id) => def.nodes[id]).filter(Boolean);
  }

  function moveToNode(profile, expState, targetNodeId) {
    if (!expState || expState.expeditionStatus !== 'ACTIVE') {
      return { ok: false, error: 'No active expedition.' };
    }
    const available = getAvailableNextNodes(expState);
    const target = available.find((n) => n.nodeId === targetNodeId);
    if (!target) {
      return { ok: false, error: `Node ${targetNodeId} is not reachable from ${expState.currentNodeId}.` };
    }

    expState.currentNodeId = target.nodeId;
    if (!expState.visitedNodeIds.includes(target.nodeId)) {
      expState.visitedNodeIds.push(target.nodeId);
    }

    let rewardOutcomes = [];
    // Auto-resolve non-combat offer/research nodes once (reload-safe via claimedRewardNodeIds)
    if (target.type === 'temporary_offer' || target.type === 'research') {
      if (!expState.claimedRewardNodeIds.includes(target.nodeId)) {
        expState.claimedRewardNodeIds.push(target.nodeId);
        for (const rew of target.rewards || []) {
          rewardOutcomes.push(F.RewardProcessor.processReward(profile, expState, rew));
        }
        F.PlayerProfile.saveProfile(profile);
      }
      if (!expState.resolvedNodeIds.includes(target.nodeId)) {
        expState.resolvedNodeIds.push(target.nodeId);
      }
    }

    const saved = saveActiveExpedition(expState);
    return { ok: true, node: target, expedition: saved, rewardOutcomes };
  }

  function markCurrentEncounterCleared(expState, encounterId, won) {
    if (!expState) return null;
    expState.encounterHistory.push({
      nodeId: expState.currentNodeId,
      encounterId,
      won: Boolean(won),
      timestamp: new Date().toISOString(),
    });
    if (won && !expState.resolvedNodeIds.includes(expState.currentNodeId)) {
      expState.resolvedNodeIds.push(expState.currentNodeId);
    }
    return saveActiveExpedition(expState);
  }

  function completeExpedition(profile, expState) {
    const summary = F.RewardProcessor.finalizeExpeditionRewards(profile, expState, 'COMPLETED');
    // Return player safely to Hearth Outpost after completing expedition
    profile.currentLocationId = 'loc_hearth_outpost';
    F.PlayerProfile.saveProfile(profile);
    clearActiveExpedition();
    return summary;
  }

  function extractFromExpedition(profile, expState) {
    const def = getExpeditionDef(expState.expeditionId);
    const curNode = def && def.nodes[expState.currentNodeId];
    if (!curNode || curNode.type !== 'extraction') {
      return { ok: false, error: 'You must be at an Extraction Point to extract with unsecured rewards.' };
    }
    const summary = F.RewardProcessor.finalizeExpeditionRewards(profile, expState, 'EXTRACTED');
    profile.currentLocationId = 'loc_hearth_outpost';
    F.PlayerProfile.saveProfile(profile);
    clearActiveExpedition();
    return summary;
  }

  function failExpedition(profile, expState) {
    const summary = F.RewardProcessor.finalizeExpeditionRewards(profile, expState, 'FAILED');
    profile.currentLocationId = 'loc_hearth_outpost';
    F.PlayerProfile.saveProfile(profile);
    clearActiveExpedition();
    return summary;
  }

  function withdrawFromExpedition(profile, expState) {
    const summary = F.RewardProcessor.finalizeExpeditionRewards(profile, expState, 'WITHDRAWN');
    profile.currentLocationId = 'loc_hearth_outpost';
    F.PlayerProfile.saveProfile(profile);
    clearActiveExpedition();
    return summary;
  }

  F.EXPEDITION_ROUTES = EXPEDITION_ROUTES;
  F.ExpeditionManager = {
    STORAGE_KEY: EXPEDITION_STORAGE_KEY,
    getExpeditionDef,
    loadActiveExpedition,
    saveActiveExpedition,
    clearActiveExpedition,
    startExpedition,
    getAvailableNextNodes,
    moveToNode,
    markCurrentEncounterCleared,
    completeExpedition,
    extractFromExpedition,
    failExpedition,
    withdrawFromExpedition,
  };
})(typeof window !== 'undefined' ? window : globalThis);

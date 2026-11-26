// VALENCY: THE ELEMENTAL FRONTIER — Phase 6: Centralized Reward Processor
// Enforces the strict data-level boundary between PERMANENT, TEMPORARY, and UNSECURED rewards.
// ExpeditionManager NEVER writes directly to PlayerProfile; all reward commits pass through here.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

  const PERSISTENCE_CLASSES = Object.freeze({
    PERMANENT: 'PERMANENT', // Immediately committed to PlayerProfile; survives expedition failure/withdrawal
    TEMPORARY: 'TEMPORARY', // Expedition-only cards/mods/supplies; ALWAYS cleared when expedition ends
    UNSECURED: 'UNSECURED', // Held inside ExpeditionState; committed ONLY on extraction or victory, lost on failure/withdrawal
  });

  /**
   * Commit a single PERMANENT reward bundle to PlayerProfile (idempotent when `rewardKey` is set).
   */
  function commitPermanentReward(profile, reward) {
    if (!profile || !reward) return { ok: false, error: 'Missing profile or reward.' };

    if (reward.rewardKey && F.PlayerProfile.hasPermanentRewardBeenClaimed(profile, reward.rewardKey)) {
      return { ok: true, alreadyClaimed: true, committed: [] };
    }

    const committed = [];

    // 1. Permanent Currencies
    if (reward.currencies && typeof reward.currencies === 'object') {
      profile.currencies = profile.currencies || { reagentCredits: 0, researchData: 0 };
      for (const [k, amt] of Object.entries(reward.currencies)) {
        const n = Math.max(0, Number(amt) || 0);
        if (n > 0) {
          profile.currencies[k] = (profile.currencies[k] || 0) + n;
          committed.push(`+${n} ${k}`);
        }
      }
    }

    // 2. Permanent Cards (into CollectionManager)
    if (Array.isArray(reward.cards) && F.CollectionManager) {
      for (const item of reward.cards) {
        const res = F.CollectionManager.addPermanentCard(profile, item.cardId, item.quantity || 1, item.variant || 'standard');
        if (res.ok) {
          committed.push(`Permanent Card: ${item.quantity || 1}x ${item.cardId}`);
        }
      }
    }

    // 3. Permanent Scientist Unlock
    if (reward.unlockScientistId && F.ScientistEquipment) {
      const sRes = F.ScientistEquipment.unlockScientistPermanently(
        profile,
        reward.unlockScientistId,
        reward.recoveredRecord || null
      );
      if (sRes.ok) {
        committed.push(
          sRes.newlyUnlocked
            ? `Unlocked Frontier Scientist: ${reward.unlockScientistId}`
            : `Updated Frontier Scientist Record: ${reward.unlockScientistId}`
        );
      }
    }

    // 4. Scientist Experience (if scientist unlocked)
    if (reward.scientistXP && reward.scientistXP.amount > 0 && F.ScientistEquipment) {
      const targetId = reward.scientistXP.scientistId || profile.equippedScientistId;
      if (targetId && profile.scientists && profile.scientists[targetId] && profile.scientists[targetId].unlocked) {
        const xpRes = F.ScientistEquipment.awardExperience(profile, targetId, reward.scientistXP.amount);
        if (xpRes.ok) {
          committed.push(`+${xpRes.xpGain} Scientist XP (${targetId} Lv.${xpRes.level})`);
        }
      }
    }

    // 5. Permanent Investigation Evidence
    if (Array.isArray(reward.evidenceIds) && F.InvestigationManager) {
      for (const evId of reward.evidenceIds) {
        const evRes = F.InvestigationManager.recordEvidence(profile, evId, reward.sourceLocationId || 'expedition');
        if (evRes.ok && evRes.newlyDiscovered) {
          committed.push(`Evidence: ${evId}`);
        }
      }
    }

    // 6. Permanent Story Flags / World Discoveries
    if (reward.storyFlags && typeof reward.storyFlags === 'object') {
      profile.storyFlags = profile.storyFlags || {};
      Object.assign(profile.storyFlags, reward.storyFlags);
    }
    if (Array.isArray(reward.discoverLocations) && F.WorldManager) {
      for (const locId of reward.discoverLocations) {
        if (F.WorldManager.discoverLocation(profile, locId)) {
          committed.push(`Discovered Location: ${locId}`);
        }
      }
    }

    if (reward.rewardKey) {
      F.PlayerProfile.markPermanentRewardClaimed(profile, reward.rewardKey);
    }

    return { ok: true, alreadyClaimed: false, committed };
  }

  /**
   * Route any reward bundle strictly according to its persistenceClass:
   * - PERMANENT -> immediately committed to PlayerProfile
   * - TEMPORARY -> added ONLY to ExpeditionState temporary fields
   * - UNSECURED -> staged inside ExpeditionState.unsecuredRewards (never touches PlayerProfile yet)
   */
  function processReward(profile, expeditionState, reward) {
    if (!reward || !reward.persistenceClass) {
      return { ok: false, error: 'Reward must declare an explicit persistenceClass (PERMANENT | TEMPORARY | UNSECURED).' };
    }

    const cls = reward.persistenceClass;

    if (cls === PERSISTENCE_CLASSES.PERMANENT) {
      const res = commitPermanentReward(profile, reward);
      if (expeditionState && res.ok && !res.alreadyClaimed) {
        expeditionState.committedPermanentLog = expeditionState.committedPermanentLog || [];
        expeditionState.committedPermanentLog.push({
          rewardKey: reward.rewardKey || null,
          summary: res.committed,
        });
      }
      return { ...res, persistenceClass: cls };
    }

    if (!expeditionState || expeditionState.expeditionStatus !== 'ACTIVE') {
      return { ok: false, error: `${cls} rewards require an active ExpeditionState.` };
    }

    if (cls === PERSISTENCE_CLASSES.TEMPORARY) {
      const added = [];
      if (Array.isArray(reward.temporaryCards)) {
        for (const tc of reward.temporaryCards) {
          expeditionState.temporaryCards.push({
            cardId: tc.cardId,
            quantity: tc.quantity || 1,
            sourceNodeId: reward.sourceNodeId || expeditionState.currentNodeId,
          });
          added.push(`Temporary Card: ${tc.quantity || 1}x ${tc.cardId}`);
        }
      }
      if (Array.isArray(reward.temporaryModifications)) {
        for (const mod of reward.temporaryModifications) {
          expeditionState.temporaryModifications.push({ ...mod });
          added.push(`Temp Mod: ${mod.label || mod.modId}`);
        }
      }
      if (reward.temporaryResources && typeof reward.temporaryResources === 'object') {
        for (const [k, amt] of Object.entries(reward.temporaryResources)) {
          expeditionState.temporaryResources[k] = (expeditionState.temporaryResources[k] || 0) + (Number(amt) || 0);
          added.push(`Temp Supply: +${amt} ${k}`);
        }
      }
      return { ok: true, persistenceClass: cls, added };
    }

    if (cls === PERSISTENCE_CLASSES.UNSECURED) {
      expeditionState.unsecuredRewards.push({
        rewardId: reward.rewardKey || `unsec_${expeditionState.unsecuredRewards.length + 1}`,
        label: reward.label || 'Unsecured Expedition Loot',
        currencies: reward.currencies ? { ...reward.currencies } : null,
        cards: Array.isArray(reward.cards) ? reward.cards.map((c) => ({ ...c })) : null,
      });
      return { ok: true, persistenceClass: cls, stagedCount: expeditionState.unsecuredRewards.length };
    }

    return { ok: false, error: `Unknown persistenceClass: ${cls}` };
  }

  /**
   * Finalize an expedition outcome according to the finalized failure model:
   * - COMPLETED / EXTRACTED: commits all unsecuredRewards permanently into PlayerProfile, then discards temporary state.
   * - FAILED / WITHDRAWN: keeps all already-committed PERMANENT rewards, discards all UNSECURED & TEMPORARY state.
   */
  function finalizeExpeditionRewards(profile, expeditionState, outcome) {
    const securedSummary = [];
    const lostUnsecuredSummary = [];
    const clearedTemporaryCount =
      (expeditionState.temporaryCards ? expeditionState.temporaryCards.length : 0) +
      (expeditionState.temporaryModifications ? expeditionState.temporaryModifications.length : 0);

    if (outcome === 'COMPLETED' || outcome === 'EXTRACTED') {
      for (const unsec of expeditionState.unsecuredRewards || []) {
        const res = commitPermanentReward(profile, {
          currencies: unsec.currencies,
          cards: unsec.cards,
        });
        if (res.ok) securedSummary.push(...res.committed);
      }
    } else {
      for (const unsec of expeditionState.unsecuredRewards || []) {
        lostUnsecuredSummary.push(unsec.label || unsec.rewardId);
      }
    }

    // Always strip temporary & unsecured state on expedition termination
    expeditionState.temporaryCards = [];
    expeditionState.temporaryModifications = [];
    expeditionState.temporaryResources = {};
    expeditionState.unsecuredRewards = [];
    expeditionState.expeditionStatus = outcome;

    F.PlayerProfile.saveProfile(profile);

    return {
      ok: true,
      outcome,
      securedSummary,
      lostUnsecuredSummary,
      clearedTemporaryCount,
      keptPermanentLog: expeditionState.committedPermanentLog || [],
    };
  }

  F.PERSISTENCE_CLASSES = PERSISTENCE_CLASSES;
  F.RewardProcessor = {
    commitPermanentReward,
    processReward,
    finalizeExpeditionRewards,
  };
})(typeof window !== 'undefined' ? window : globalThis);

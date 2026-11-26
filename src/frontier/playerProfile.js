// VALENCY: THE ELEMENTAL FRONTIER — Phase 2: Persistent Player Profile Manager & Save Migration
// Stores ONLY permanent player identity and campaign state, independent of active expeditions or UI.
// Backwards-compatible, idempotent migration from Academy Chapter 0 (`valency_story_progression_v1`).

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});
  const F = (V.Frontier = V.Frontier || {});

  const PROFILE_STORAGE_KEY = 'valency_frontier_profile_v1';
  const PROFILE_VERSION = 1;

  let memoryProfile = null;

  function getStorage() {
    try {
      if (typeof global.localStorage !== 'undefined' && global.localStorage) {
        return global.localStorage;
      }
    } catch (_) {
      // ignore sandbox/private storage errors
    }
    return null;
  }

  function generatePlayerId() {
    return `player_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
  }

  function createEmptyProfile(playerId) {
    const now = new Date().toISOString();
    return {
      playerId: playerId || generatePlayerId(),
      profileVersion: PROFILE_VERSION,
      createdAt: now,
      updatedAt: now,
      currencies: {
        reagentCredits: 100,
        researchData: 0,
      },
      permanentUnlocks: {
        frontierAccess: true, // Always inspectable; Academy completion sets academyGraduated flag
        collectionInitialized: false,
        academyMigratedAt: null,
        achievements: [],
      },
      collection: {}, // cardId -> { cardId, quantity, variants: { standard: n }, upgradeState: { tier: 0, notes: [] } }
      decks: {},      // deckId -> { deckId, name, cardCounts: { [cardId]: n }, equippedScientistId, deckConfiguration }
      activeDeckId: 'deck_frontier_starter',
      scientists: {}, // scientistId -> { scientistId, unlocked, unlockedAt, experience, level, researchUnlocks: [], recoveredRecords: [] }
      equippedScientistId: null,
      currentRegionId: 'region_caloric_basin',
      currentLocationId: 'loc_hearth_outpost',
      discoveredRegions: ['region_caloric_basin'],
      discoveredLocations: ['loc_hearth_outpost'],
      unlockedRoutes: ['route_hearth_to_vent'],
      storyFlags: {
        academyGraduated: false,
        academyLicensureTier: 'Not Yet Certified',
        molecularInstabilityKnown: false,
        caloricAnomalyInvestigated: false,
        rogueLavoisierDefeated: false,
        lavoisierConstructRecovered: false,
      },
      researchProgress: {
        completedMilestones: [],
        frontierChapter: 1,
      },
      investigation: {
        evidence: {}, // evidenceId -> { evidenceId, category, sourceLocationId, discoveredAt, discoveryStatus }
      },
      permanentRewardHistory: [], // Audit trail of committed permanent reward IDs (prevents duplicate grants)
    };
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Idempotently migrate existing Academy Chapter 0 progression into the Frontier PlayerProfile.
   * Never mutates or erases `valency_story_progression_v1` and never duplicates collection entries.
   */
  function migrateFromAcademy(profile) {
    const p = profile;
    if (V.Story && V.Story.loadProgression) {
      const academy = V.Story.loadProgression();
      if (academy) {
        if (academy.chapter0Completed || academy.chapter1Unlocked) {
          p.storyFlags.academyGraduated = true;
          p.storyFlags.molecularInstabilityKnown = true;
        }
        if (academy.chapter0LicensureTier) {
          p.storyFlags.academyLicensureTier = academy.chapter0LicensureTier;
        }
        if (academy.branchFlags && academy.branchFlags.molecularInstabilityMysteryDiscovered) {
          p.storyFlags.molecularInstabilityKnown = true;
        }
        if (!p.permanentUnlocks.academyMigratedAt) {
          p.permanentUnlocks.academyMigratedAt = new Date().toISOString();
        }
      }
    }

    // Initialize starter permanent card collection ONCE (strictly idempotent!)
    if (!p.permanentUnlocks.collectionInitialized && F.CollectionManager && F.CollectionManager.seedStarterCollection) {
      F.CollectionManager.seedStarterCollection(p);
      p.permanentUnlocks.collectionInitialized = true;
    }

    // Ensure Frontier scientist roster slots exist without prematurely unlocking them
    if (F.ScientistEquipment && F.ScientistEquipment.ensureProfileScientists) {
      F.ScientistEquipment.ensureProfileScientists(p);
    }

    return p;
  }

  function loadProfile() {
    let loaded = null;
    const store = getStorage();
    if (store) {
      try {
        const raw = store.getItem(PROFILE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.profileVersion === PROFILE_VERSION) {
            const base = createEmptyProfile(parsed.playerId);
            loaded = {
              ...base,
              ...parsed,
              currencies: { ...base.currencies, ...(parsed.currencies || {}) },
              permanentUnlocks: { ...base.permanentUnlocks, ...(parsed.permanentUnlocks || {}) },
              storyFlags: { ...base.storyFlags, ...(parsed.storyFlags || {}) },
              researchProgress: { ...base.researchProgress, ...(parsed.researchProgress || {}) },
              investigation: { ...base.investigation, ...(parsed.investigation || {}) },
            };
          }
        }
      } catch (_) {
        // fall through safely
      }
    }

    if (!loaded) {
      loaded = memoryProfile ? clone(memoryProfile) : createEmptyProfile();
    }

    const beforeInit = loaded.permanentUnlocks.collectionInitialized;
    const beforeGrad = loaded.storyFlags.academyGraduated;
    migrateFromAcademy(loaded);

    // Persist if newly created or newly migrated
    if (!beforeInit || beforeGrad !== loaded.storyFlags.academyGraduated || !memoryProfile) {
      return saveProfile(loaded);
    }
    memoryProfile = clone(loaded);
    return loaded;
  }

  function saveProfile(profile) {
    const copy = clone({
      ...profile,
      profileVersion: PROFILE_VERSION,
      updatedAt: new Date().toISOString(),
    });
    memoryProfile = clone(copy);
    const store = getStorage();
    if (store) {
      try {
        store.setItem(PROFILE_STORAGE_KEY, JSON.stringify(copy));
      } catch (_) {
        // ignore quota errors
      }
    }
    return copy;
  }

  function resetProfile() {
    const fresh = createEmptyProfile();
    migrateFromAcademy(fresh);
    return saveProfile(fresh);
  }

  function hasPermanentRewardBeenClaimed(profile, rewardKey) {
    if (!rewardKey) return false;
    return Array.isArray(profile.permanentRewardHistory) && profile.permanentRewardHistory.includes(rewardKey);
  }

  function markPermanentRewardClaimed(profile, rewardKey) {
    if (!rewardKey) return;
    if (!Array.isArray(profile.permanentRewardHistory)) profile.permanentRewardHistory = [];
    if (!profile.permanentRewardHistory.includes(rewardKey)) {
      profile.permanentRewardHistory.push(rewardKey);
    }
  }

  F.PlayerProfile = {
    STORAGE_KEY: PROFILE_STORAGE_KEY,
    PROFILE_VERSION,
    createEmptyProfile,
    loadProfile,
    saveProfile,
    resetProfile,
    migrateFromAcademy,
    hasPermanentRewardBeenClaimed,
    markPermanentRewardClaimed,
  };
})(typeof window !== 'undefined' ? window : globalThis);

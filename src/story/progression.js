// VALENCY — Persistent Two-Stage Scientist Progression & Story Mode Save Store
// Stage One (Defeat Simulation): unlocks Biography, Historical Discoveries, Exam Record, Archive Entry.
// Stage Two (Complete Research Challenge): records Acquisition Eligibility & Future Scientist Card Eligibility
// WITHOUT awarding nonexistent collectible cards in this release.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const STORAGE_KEY = 'valency_story_progression_v1';
  const SCHEMA_VERSION = 1;

  let memoryFallback = null;

  function createEmptyProgression() {
    return {
      schemaVersion: SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      completedMissions: {}, // missionId -> { completed, completedAt, attempts, bestOverall, bestLicensureTier, lastEvaluation }
      scientists: {},        // scientistId -> { stageOneUnlocked, stageOneUnlockedAt, bestExaminationRecord, stageTwoUnlocked, stageTwoUnlockedAt, acquisitionEligible, futureCardEligible, futureCardRef }
      chapter0Completed: false,
      chapter0LicensureTier: 'Not Yet Certified',
      chapter1Unlocked: false,
      branchFlags: {},       // Reserved for future branching campaigns
    };
  }

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

  function loadProgression() {
    const store = getStorage();
    if (store) {
      try {
        const raw = store.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.schemaVersion === SCHEMA_VERSION) {
            return { ...createEmptyProgression(), ...parsed };
          }
        }
      } catch (_) {
        // fall back cleanly
      }
    }
    if (!memoryFallback) memoryFallback = createEmptyProgression();
    return JSON.parse(JSON.stringify(memoryFallback));
  }

  function saveProgression(prog) {
    const copy = { ...prog, schemaVersion: SCHEMA_VERSION, updatedAt: new Date().toISOString() };
    memoryFallback = JSON.parse(JSON.stringify(copy));
    const store = getStorage();
    if (store) {
      try {
        store.setItem(STORAGE_KEY, JSON.stringify(copy));
      } catch (_) {
        // ignore quota errors
      }
    }
    return copy;
  }

  function resetProgression() {
    const fresh = createEmptyProgression();
    return saveProgression(fresh);
  }

  function ensureScientistRecord(prog, scientistId) {
    if (!prog.scientists[scientistId]) {
      const profile = V.Story && V.Story.getScientistProfile ? V.Story.getScientistProfile(scientistId) : null;
      prog.scientists[scientistId] = {
        scientistId,
        stageOneUnlocked: false,
        stageOneUnlockedAt: null,
        archiveEntryUnlocked: false,
        biographyUnlocked: false,
        discoveriesUnlocked: false,
        bestExaminationRecord: null,
        stageTwoUnlocked: false,
        stageTwoUnlockedAt: null,
        acquisitionEligible: false,
        futureCardEligible: false,
        futureCardRef: profile ? profile.futureCardRef : `scard_${scientistId}`,
        collectibleCardAwarded: false, // Strictly false until future Scientist Card expansion activates
      };
    }
    return prog.scientists[scientistId];
  }

  function recordNarrativeMissionComplete(missionId, branchFlags) {
    const prog = loadProgression();
    const prev = prog.completedMissions[missionId] || { attempts: 0 };
    prog.completedMissions[missionId] = {
      ...prev,
      completed: true,
      completedAt: prev.completedAt || new Date().toISOString(),
      attempts: (prev.attempts || 0) + 1,
    };
    if (branchFlags && typeof branchFlags === 'object') {
      Object.assign(prog.branchFlags, branchFlags);
    }
    return saveProgression(prog);
  }

  const TIER_RANK = Object.freeze({
    'Not Yet Certified': 0,
    'Provisional Licensure': 1,
    'Standard Licensure': 2,
    'Honors Licensure': 3,
  });

  function higherLicensureTier(a, b) {
    const ra = TIER_RANK[a] || 0;
    const rb = TIER_RANK[b] || 0;
    return rb > ra ? b : (a || 'Not Yet Certified');
  }

  /**
   * Record the outcome of a Story Mode AI examination encounter.
   * Updates Mission progress, Stage One (Simulation Defeat), Stage Two (Research Challenge),
   * and Chapter 0 Licensure / Chapter 1 Frontier unlock.
   * Cumulative licensure ALWAYS uses each mission's best winning evaluation and NEVER lowers an existing tier.
   */
  function recordExaminationOutcome(mission, evalResult, challengeResult) {
    const prog = loadProgression();
    const now = new Date().toISOString();

    const prevM = prog.completedMissions[mission.missionId] || { attempts: 0, bestOverall: 0 };
    const won = Boolean(evalResult && evalResult.won);
    const overall = evalResult ? evalResult.overall : 0;

    const prevBestWin = prevM.bestWinningEvaluation || (prevM.lastEvaluation && prevM.lastEvaluation.won ? prevM.lastEvaluation : null);
    let nextBestWin = prevBestWin;
    if (won && (!prevBestWin || overall >= (prevBestWin.overall || 0))) {
      nextBestWin = evalResult;
    }

    const nextBestOverall = won
      ? Math.max(prevM.bestOverall || 0, overall)
      : (prevM.bestOverall || 0);
    const nextBestTier = won
      ? higherLicensureTier(prevM.bestLicensureTier || 'Not Yet Certified', evalResult.licensureTier)
      : (prevM.bestLicensureTier || 'Not Yet Certified');

    prog.completedMissions[mission.missionId] = {
      completed: prevM.completed || won,
      completedAt: prevM.completedAt || (won ? now : null),
      attempts: (prevM.attempts || 0) + 1,
      bestOverall: nextBestOverall,
      bestLicensureTier: nextBestTier,
      bestWinningEvaluation: nextBestWin,
      lastEvaluation: evalResult,
    };

    const unlockedNow = {
      stageOneNewlyUnlocked: false,
      stageTwoNewlyUnlocked: false,
      chapter1NewlyUnlocked: false,
    };

    // Two-Stage Scientist Progression (if this mission features a historical scientist)
    if (mission.scientistId && won) {
      const sRec = ensureScientistRecord(prog, mission.scientistId);
      if (!sRec.stageOneUnlocked) {
        sRec.stageOneUnlocked = true;
        sRec.stageOneUnlockedAt = now;
        sRec.archiveEntryUnlocked = true;
        sRec.biographyUnlocked = true;
        sRec.discoveriesUnlocked = true;
        unlockedNow.stageOneNewlyUnlocked = true;
      }
      if (!sRec.bestExaminationRecord || overall >= (sRec.bestExaminationRecord.overall || 0)) {
        sRec.bestExaminationRecord = {
          overall,
          licensureTier: evalResult.licensureTier,
          competencies: evalResult.competencies,
          turns: evalResult.turns,
          recordedAt: now,
        };
      }

      // Stage Two: Research Challenge Completion -> Persistent Eligibility Record (NO nonexistent card!)
      if (challengeResult && challengeResult.completed && !sRec.stageTwoUnlocked) {
        sRec.stageTwoUnlocked = true;
        sRec.stageTwoUnlockedAt = now;
        sRec.acquisitionEligible = true;
        sRec.futureCardEligible = true;
        sRec.collectibleCardAwarded = false;
        unlockedNow.stageTwoNewlyUnlocked = true;
      }
    }

    // Recompute cumulative Academy Licensure Tier strictly from each mission's BEST winning evaluation,
    // and never allow a replay to downgrade an already-earned licensure tier.
    const bestWinRecords = Object.values(prog.completedMissions)
      .map((m) => m.bestWinningEvaluation || (m.lastEvaluation && m.lastEvaluation.won ? m.lastEvaluation : null))
      .filter((e) => e && e.won);
    if (V.Story && V.Story.computeOverallAcademyLicensure) {
      const computedTier = V.Story.computeOverallAcademyLicensure(bestWinRecords);
      prog.chapter0LicensureTier = higherLicensureTier(prog.chapter0LicensureTier, computedTier);
    }

    // Final Examination graduation -> Transition to Chapter 1: The Frontier!
    if (mission.unlocksChapter1 && won) {
      prog.chapter0Completed = true;
      if (!prog.chapter1Unlocked) {
        prog.chapter1Unlocked = true;
        prog.branchFlags.molecularInstabilityMysteryDiscovered = true;
        unlockedNow.chapter1NewlyUnlocked = true;
      }
    }

    const saved = saveProgression(prog);
    return { progression: saved, unlockedNow };
  }

  function getScientistProgress(prog, scientistId) {
    const p = prog || loadProgression();
    return p.scientists[scientistId] || {
      scientistId,
      stageOneUnlocked: false,
      stageTwoUnlocked: false,
      acquisitionEligible: false,
      futureCardEligible: false,
      collectibleCardAwarded: false,
      bestExaminationRecord: null,
    };
  }

  V.Story = V.Story || {};
  V.Story.STORAGE_KEY = STORAGE_KEY;
  V.Story.loadProgression = loadProgression;
  V.Story.saveProgression = saveProgression;
  V.Story.resetProgression = resetProgression;
  V.Story.recordNarrativeMissionComplete = recordNarrativeMissionComplete;
  V.Story.recordExaminationOutcome = recordExaminationOutcome;
  V.Story.getScientistProgress = getScientistProgress;
})(typeof window !== 'undefined' ? window : globalThis);

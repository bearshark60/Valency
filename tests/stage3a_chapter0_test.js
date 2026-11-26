// VALENCY Stage 3A — Complete 6-Mission Chapter 0: Academy Licensure Test Suite
// Validates prerequisites, opponent configs, research challenges (pass/fail),
// victory/defeat progression, archive unlocks, reload persistence, replay non-downgrade,
// non-perfect Final Examination completion, cumulative summary, and Stage 2.5 save compatibility.
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

const storageBacking = {};
const sandbox = {
  window: null,
  globalThis: null,
  console,
  Math,
  Date,
  Set,
  Map,
  Object,
  Array,
  JSON,
  Number,
  String,
  Boolean,
  localStorage: {
    getItem(k) { return Object.prototype.hasOwnProperty.call(storageBacking, k) ? storageBacking[k] : null; },
    setItem(k, v) { storageBacking[k] = String(v); },
    removeItem(k) { delete storageBacking[k]; },
  },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const SCRIPTS = [
  'src/data/cards.js',
  'src/data/compounds.js',
  'src/engine/gameEngine.js',
  'src/story/scientists.js',
  'src/story/scientistCardSchema.js',
  'src/story/opponentConfigs.js',
  'src/story/evaluation.js',
  'src/story/researchChallenges.js',
  'src/story/progression.js',
  'src/story/academyChapter.js',
  'src/engine/ai.js',
];

for (const rel of SCRIPTS) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(code, sandbox, { filename: rel });
}

const V = sandbox.Valency;
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS: ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${name}\n  -> ${err.stack || err.message}`);
  }
}

// ===== 1. CHAPTER 0 STRUCTURE, PREREQUISITES, PORTRAITS, & GUARDRAILS =====
test('Chapter 0 Structure: all 6 missions, briefings, focus tags, dialogues, portraits & inactive cards verified', () => {
  const ch0 = V.Story.getChapter0();
  assert.strictEqual(ch0.missions.length, 6);

  const expectedIds = [
    'ch0_m1_registration',
    'ch0_m2_lavoisier',
    'ch0_m3_mendeleev',
    'ch0_m4_pauling',
    'ch0_m5_curie',
    'ch0_m6_final_exam',
  ];
  assert.deepStrictEqual(Array.from(ch0.missions, (m) => m.missionId), expectedIds);

  for (const m of ch0.missions) {
    assert.ok(m.introduction && m.introduction.length > 30, `${m.missionId} missing introduction`);
    assert.ok(m.briefing && m.briefing.objective, `${m.missionId} missing briefing.objective`);
    assert.ok(Array.isArray(m.briefing.licensureFocus) && m.briefing.licensureFocus.length >= 2, `${m.missionId} missing licensureFocus`);
    if (m.opponentConfigId) {
      const cfg = V.Story.getOpponentConfig(m.opponentConfigId);
      const vCfg = V.Story.validateOpponentConfig(cfg);
      assert.strictEqual(vCfg.valid, true, `${m.opponentConfigId} invalid: ${vCfg.errors.join(', ')}`);
      assert.strictEqual(cfg.deckConfiguration.extraStartingCards, 0);
      assert.strictEqual(cfg.deckConfiguration.extraDrawPerTurn, 0);
      assert.strictEqual(cfg.deckConfiguration.hiddenStatBonuses, false);
    }
    if (m.scientistId) {
      const sci = V.Story.getScientistProfile(m.scientistId);
      assert.strictEqual(V.Story.validateScientistProfile(sci).valid, true);
      assert.ok(fs.existsSync(path.join(ROOT, sci.artworkRef)), `Missing portrait file: ${sci.artworkRef}`);
      assert.ok(sci.dialogue.briefing && sci.dialogue.onVictory && sci.dialogue.onDefeat && sci.dialogue.challengeComplete);
      const futCard = V.Story.getFutureScientistCard(sci.futureCardRef);
      assert.strictEqual(futCard.activeInGameplay, false);
      assert.strictEqual(futCard.affinityStrength, null);
    }
  }

  // Final Examination authored defeat/victory dialogue + Frontier Anomaly briefing
  const finalExam = V.Story.getMissionById('ch0_m6_final_exam');
  assert.ok(Array.isArray(finalExam.postVictoryDialogue) && finalExam.postVictoryDialogue.length >= 2);
  assert.ok(Array.isArray(finalExam.postDefeatDialogue) && finalExam.postDefeatDialogue.length >= 2);
  assert.ok(finalExam.frontierAnomalyBriefing && finalExam.frontierAnomalyBriefing.summary.includes('unstable'));
  assert.ok(fs.existsSync(path.join(ROOT, 'assets/portraits/proctor.svg')));
});

// ===== 2. RESEARCH CHALLENGE PASS & FAIL VALIDATION (MENDELEEV, PAULING, CURIE) =====
test('Research Challenges: Mendeleev, Pauling, and Curie evaluators handle pass, fail, and defeat accurately', () => {
  // Mendeleev (3+ groups AND 12+ SP compound)
  const rcM = V.Story.getResearchChallenge('rc_mendeleev');
  assert.strictEqual(rcM.evaluate({ won: false, snapshot: {} }).completed, false);
  assert.strictEqual(
    rcM.evaluate({ won: true, snapshot: { periodicGroupsUsed: ['1A', '7A'], maxSingleCompoundSP: 16 } }).completed,
    false
  );
  assert.strictEqual(
    rcM.evaluate({ won: true, snapshot: { periodicGroupsUsed: ['1A', '4A', '6A'], maxSingleCompoundSP: 10 } }).completed,
    false
  );
  assert.strictEqual(
    rcM.evaluate({ won: true, snapshot: { periodicGroupsUsed: ['1A', '4A', '6A'], maxSingleCompoundSP: 16 } }).completed,
    true
  );

  // Pauling (1+ EN Takeover OR Shield/Resonance + 1 Event card)
  const rcP = V.Story.getResearchChallenge('rc_pauling');
  assert.strictEqual(rcP.evaluate({ won: false, snapshot: {} }).completed, false);
  assert.strictEqual(
    rcP.evaluate({ won: true, snapshot: { enTakeovers: 0, shieldsDeployed: 1, resonanceUsed: 0, redEventsPlayed: 0, yellowEventsPlayed: 0 } }).completed,
    false
  );
  assert.strictEqual(
    rcP.evaluate({ won: true, snapshot: { enTakeovers: 1, shieldsDeployed: 0, resonanceUsed: 0, redEventsPlayed: 0, yellowEventsPlayed: 0 } }).completed,
    true
  );
  assert.strictEqual(
    rcP.evaluate({ won: true, snapshot: { enTakeovers: 0, shieldsDeployed: 0, resonanceUsed: 1, redEventsPlayed: 1, yellowEventsPlayed: 0 } }).completed,
    true
  );

  // Curie (0 unstable collapses AND 2+ tactical/defensive/stabilization actions; legal mechanics only)
  const rcC = V.Story.getResearchChallenge('rc_curie');
  assert.strictEqual(rcC.evaluate({ won: false, snapshot: {} }).completed, false);
  assert.strictEqual(
    rcC.evaluate({ won: true, snapshot: { unstableCollapsed: 1, shieldsDeployed: 2, yellowEventsPlayed: 2 } }).completed,
    false
  );
  assert.strictEqual(
    rcC.evaluate({ won: true, snapshot: { unstableCollapsed: 0, shieldsDeployed: 1, yellowEventsPlayed: 0, redEventsPlayed: 0 } }).completed,
    false
  );
  assert.strictEqual(
    rcC.evaluate({ won: true, snapshot: { unstableCollapsed: 0, buffersUsed: 1, unstableStabilized: 1 } }).completed,
    true
  );
});

// ===== 3. FULL 6-MISSION SEQUENTIAL PROGRESSION, DEFEAT GATING, RELOAD PERSISTENCE & NON-DOWNGRADE =====
test('Complete 6-Mission Campaign: defeat gating, sequential unlocks, reload persistence, non-perfect Final Exam graduation, and replay non-downgrade', () => {
  V.Story.resetProgression();
  const ch0 = V.Story.getChapter0();

  // Initially only Mission 1 unlocked
  let prog = V.Story.loadProgression();
  assert.strictEqual(V.Story.isMissionUnlocked(ch0.missions[0], prog), true);
  for (let i = 1; i < ch0.missions.length; i++) {
    assert.strictEqual(V.Story.isMissionUnlocked(ch0.missions[i], prog), false, `${ch0.missions[i].missionId} should start locked`);
  }

  // Mission 1: Registration Day
  V.Story.recordNarrativeMissionComplete('ch0_m1_registration', ch0.missions[0].unlocksBranchFlags);
  prog = V.Story.loadProgression(); // reload from localStorage
  assert.strictEqual(V.Story.isMissionUnlocked(ch0.missions[1], prog), true);
  assert.strictEqual(V.Story.isMissionUnlocked(ch0.missions[2], prog), false);

  const makeEval = (won, overall, tier, comps, snapshot) => ({
    won,
    overall,
    licensureTier: tier,
    competencies: comps,
    turns: 9,
    snapshot,
  });

  const examPlan = [
    {
      idx: 1,
      id: 'ch0_m2_lavoisier',
      sciId: 'lavoisier',
      winEval: makeEval(true, 86, V.Story.LICENSURE_TIERS.HONORS, { synthesis: 90, stability: 88, defensive: 82, tactical: 84 }, {
        unstableCollapsed: 0, distinctFormulas: ['H₂O', 'NaCl'], elementsUsed: ['H', 'O', 'Na', 'Cl'],
      }),
    },
    {
      idx: 2,
      id: 'ch0_m3_mendeleev',
      sciId: 'mendeleev',
      winEval: makeEval(true, 84, V.Story.LICENSURE_TIERS.HONORS, { synthesis: 92, stability: 84, defensive: 80, tactical: 78 }, {
        periodicGroupsUsed: ['1A', '4A', '6A', '7A'], maxSingleCompoundSP: 16,
      }),
    },
    {
      idx: 3,
      id: 'ch0_m4_pauling',
      sciId: 'pauling',
      winEval: makeEval(true, 76, V.Story.LICENSURE_TIERS.STANDARD, { synthesis: 78, stability: 76, defensive: 74, tactical: 76 }, {
        enTakeovers: 1, shieldsDeployed: 1, redEventsPlayed: 1,
      }),
    },
    {
      idx: 4,
      id: 'ch0_m5_curie',
      sciId: 'curie',
      winEval: makeEval(true, 83, V.Story.LICENSURE_TIERS.HONORS, { synthesis: 82, stability: 86, defensive: 84, tactical: 80 }, {
        unstableCollapsed: 0, buffersUsed: 1, yellowEventsPlayed: 2,
      }),
    },
  ];

  // Walk through Missions 2 -> 5 testing DEFEAT first, then VICTORY + reload persistence + REPLAY non-downgrade
  for (const step of examPlan) {
    const mission = V.Story.getMissionById(step.id);
    const nextMission = ch0.missions[step.idx + 1];
    const rc = V.Story.getResearchChallenge(mission.researchChallengeId);

    // A) Defeat MUST NOT unlock next mission or Stage 1 Archive!
    const lossEval = makeEval(false, 41, V.Story.LICENSURE_TIERS.NONE, { synthesis: 40, stability: 40, defensive: 42, tactical: 42 }, {});
    V.Story.recordExaminationOutcome(mission, lossEval, rc.evaluate(lossEval));
    prog = V.Story.loadProgression();
    assert.strictEqual(V.Story.isMissionUnlocked(nextMission, prog), false, `Defeat on ${step.id} must not unlock ${nextMission.missionId}`);
    assert.strictEqual(V.Story.getScientistProgress(prog, step.sciId).stageOneUnlocked, false);

    // B) Victory unlocks Stage 1 + Stage 2 (when challenge met) + next mission, and persists across reload!
    const rcWin = rc.evaluate(step.winEval);
    assert.strictEqual(rcWin.completed, true, `${step.id} challenge should pass`);
    const out = V.Story.recordExaminationOutcome(mission, step.winEval, rcWin);
    assert.strictEqual(out.unlockedNow.stageOneNewlyUnlocked, true);
    assert.strictEqual(out.unlockedNow.stageTwoNewlyUnlocked, true);

    prog = V.Story.loadProgression(); // reload from localStorage
    const sProg = V.Story.getScientistProgress(prog, step.sciId);
    assert.strictEqual(sProg.stageOneUnlocked, true);
    assert.strictEqual(sProg.stageTwoUnlocked, true);
    assert.strictEqual(sProg.collectibleCardAwarded, false);
    assert.strictEqual(sProg.bestExaminationRecord.overall, step.winEval.overall);
    assert.strictEqual(V.Story.isMissionUnlocked(nextMission, prog), true, `Victory on ${step.id} must unlock ${nextMission.missionId}`);

    // C) Replay with a WORSE win (Provisional 54%) AND a DEFEAT -> MUST NOT downgrade best score, tier, or unlocks!
    const worseWin = makeEval(true, 54, V.Story.LICENSURE_TIERS.PROVISIONAL, { synthesis: 54, stability: 54, defensive: 54, tactical: 54 }, {});
    V.Story.recordExaminationOutcome(mission, worseWin, rc.evaluate(worseWin));
    V.Story.recordExaminationOutcome(mission, lossEval, rc.evaluate(lossEval));
    prog = V.Story.loadProgression();
    assert.strictEqual(prog.completedMissions[step.id].bestOverall, step.winEval.overall, `${step.id} replay downgraded bestOverall`);
    assert.strictEqual(prog.completedMissions[step.id].bestLicensureTier, step.winEval.licensureTier, `${step.id} replay downgraded bestLicensureTier`);
    assert.strictEqual(V.Story.getScientistProgress(prog, step.sciId).stageOneUnlocked, true);
    assert.strictEqual(V.Story.getScientistProgress(prog, step.sciId).stageTwoUnlocked, true);
  }

  // Mission 6: Final Examination (Defeat must NOT unlock Chapter 1; non-perfect Provisional win MUST complete campaign!)
  const finalExam = V.Story.getMissionById('ch0_m6_final_exam');
  const finalLoss = makeEval(false, 48, V.Story.LICENSURE_TIERS.NONE, { synthesis: 48, stability: 48, defensive: 48, tactical: 48 }, {});
  V.Story.recordExaminationOutcome(finalExam, finalLoss, null);
  prog = V.Story.loadProgression();
  assert.strictEqual(prog.chapter0Completed, false, 'Final Exam defeat must not complete Chapter 0');
  assert.strictEqual(prog.chapter1Unlocked, false, 'Final Exam defeat must not unlock Chapter 1');

  // Win Final Exam with Provisional 58% (non-perfect score!)
  const finalProvWin = makeEval(true, 58, V.Story.LICENSURE_TIERS.PROVISIONAL, { synthesis: 60, stability: 56, defensive: 58, tactical: 58 }, {});
  const finalOut = V.Story.recordExaminationOutcome(finalExam, finalProvWin, null);
  assert.strictEqual(finalOut.unlockedNow.chapter1NewlyUnlocked, true);

  prog = V.Story.loadProgression(); // reload
  assert.strictEqual(prog.chapter0Completed, true);
  assert.strictEqual(prog.chapter1Unlocked, true);
  assert.strictEqual(prog.branchFlags.molecularInstabilityMysteryDiscovered, true);

  // Verify cumulative summary recognizes all 5 examinations and preserves cumulative Honors/Standard tier!
  const summary = V.Story.getChapter0CumulativeSummary(prog);
  assert.strictEqual(summary.examsCleared, 5);
  assert.strictEqual(summary.totalExams, 5);
  assert.strictEqual(summary.stageOneCount, 4);
  assert.strictEqual(summary.stageTwoCount, 4);
  assert.strictEqual(summary.cumulativeOverall, Math.round((86 + 84 + 76 + 83 + 58) / 5)); // 77%
  // Because prior Honors tier was already earned on Lavoisier/Mendeleev, non-downgrade rule keeps Honors!
  assert.strictEqual(summary.finalLicensureTier, V.Story.LICENSURE_TIERS.HONORS);

  // Replay Final Exam with a defeat -> Chapter 0 completion, Chapter 1 unlock, and Final Exam best score stay intact!
  V.Story.recordExaminationOutcome(finalExam, finalLoss, null);
  prog = V.Story.loadProgression();
  assert.strictEqual(prog.chapter0Completed, true);
  assert.strictEqual(prog.chapter1Unlocked, true);
  assert.strictEqual(prog.completedMissions.ch0_m6_final_exam.bestOverall, 58);
  assert.strictEqual(prog.completedMissions.ch0_m6_final_exam.bestLicensureTier, V.Story.LICENSURE_TIERS.PROVISIONAL);
});

// ===== 4. STAGE 2.5 LEGACY SAVE COMPATIBILITY =====
test('Save Compatibility: existing Stage 2.5 schemaVersion 1 saves load cleanly into Stage 3A cumulative summary', () => {
  const legacySave = {
    schemaVersion: 1,
    updatedAt: '2026-11-24T20:00:00.000Z',
    completedMissions: {
      ch0_m1_registration: { completed: true, attempts: 1 },
      ch0_m2_lavoisier: {
        completed: true,
        attempts: 1,
        bestOverall: 85,
        bestLicensureTier: 'Honors Licensure',
        lastEvaluation: {
          won: true,
          overall: 85,
          licensureTier: 'Honors Licensure',
          competencies: { synthesis: 100, stability: 83, defensive: 87, tactical: 64 },
        },
      },
    },
    scientists: {
      lavoisier: {
        scientistId: 'lavoisier',
        stageOneUnlocked: true,
        stageTwoUnlocked: true,
        acquisitionEligible: true,
        futureCardEligible: true,
        collectibleCardAwarded: false,
        bestExaminationRecord: {
          overall: 85,
          licensureTier: 'Honors Licensure',
          competencies: { synthesis: 100, stability: 83, defensive: 87, tactical: 64 },
        },
      },
    },
    chapter0Completed: false,
    chapter0LicensureTier: 'Honors Licensure',
    chapter1Unlocked: false,
    branchFlags: { academyRegistered: true },
  };
  storageBacking[V.Story.STORAGE_KEY] = JSON.stringify(legacySave);

  const loaded = V.Story.loadProgression();
  assert.strictEqual(loaded.chapter0LicensureTier, 'Honors Licensure');
  assert.strictEqual(V.Story.isMissionUnlocked(V.Story.getMissionById('ch0_m3_mendeleev'), loaded), true);
  assert.strictEqual(V.Story.isMissionUnlocked(V.Story.getMissionById('ch0_m4_pauling'), loaded), false);

  const summary = V.Story.getChapter0CumulativeSummary(loaded);
  assert.strictEqual(summary.examsCleared, 1);
  assert.strictEqual(summary.cumulativeOverall, 85);
  assert.strictEqual(summary.stageOneCount, 1);
  assert.strictEqual(summary.stageTwoCount, 1);
});

console.log(`\nSTAGE 3A CHAPTER 0 SUMMARY: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

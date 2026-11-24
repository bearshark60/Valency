// VALENCY Stage 2 — Real-Match Integration & 5-Opponent Behavioral Benchmark Suite
// Exercises REAL gameEngine.js states, structured log metadata, telemetry, licensure evaluation,
// research challenges, discardProtect, post-execution legalValidated logging, and non-downgrade saves.
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

function makeCard(spec, idSuffix) {
  return { ...spec, id: `test_${spec.symbol || spec.effectId}_${idSuffix}` };
}

// ===== TEST 1: STRUCTURED TELEMETRY ON REAL GAME ENGINE ACTIONS =====
test('Pass 1 Telemetry: DISTILLATION, RESONANCE_STABILIZER, HALF_LIFE_DECAY lostSP, and UNSTABLE_DECAY use structured meta (zero string parsing)', () => {
  // Deliberately give both players overlapping names to prove attribution does NOT depend on string matching!
  const st = V.createGame({ mode: 'vs_ai', p1Name: 'Chemist', p2Name: 'Chemist Alpha' });
  const p0 = st.players[0];
  const p1 = st.players[1];
  const trackerP0 = V.Story.createTelemetryTracker();
  const trackerP1 = V.Story.createTelemetryTracker();

  const H = V.ELEMENT_BY_SYMBOL.H;
  const O = V.ELEMENT_BY_SYMBOL.O;
  const C = V.ELEMENT_BY_SYMBOL.C;
  const Cl = V.ELEMENT_BY_SYMBOL.Cl;
  const Mg = V.ELEMENT_BY_SYMBOL.Mg;
  const distSpec = V.INSTANCE_SPECS.find((s) => s.effectId === 'DISTILLATION');
  const resSpec = V.INSTANCE_SPECS.find((s) => s.effectId === 'RESONANCE_STABILIZER');
  const hlSpec = V.EVENT_SPECS.find((s) => s.effectId === 'HALF_LIFE_DECAY');

  // Turn 1 (P0): Synthesize CO2 (12 SP), then attach RESONANCE_STABILIZER, then play DISTILLATION via prompt
  p0.hand = [
    makeCard(C, 1),
    makeCard(O, 1),
    makeCard(O, 2),
    makeCard(resSpec, 1),
    makeCard(distSpec, 1),
  ];
  st.discardPile.push(makeCard(H, 99));

  const rSynth = V.synthesizeCompound(st, [p0.hand[0].id, p0.hand[1].id, p0.hand[2].id]);
  assert.strictEqual(rSynth.ok, true);
  assert.strictEqual(rSynth.compound.formula, 'CO₂');
  const co2Id = rSynth.compound.id;
  const co2SPBefore = V.getCompoundSP(rSynth.compound);
  assert.strictEqual(co2SPBefore, 16);

  // Attach Resonance Stabilizer on CO2
  const resCard = p0.hand.find((c) => c.effectId === 'RESONANCE_STABILIZER');
  const rRes = V.playEventOrInstance(st, resCard.id, { targetCompoundId: co2Id });
  assert.strictEqual(rRes.ok, true);

  // Play Distillation -> resolve human prompt
  const distCard = p0.hand.find((c) => c.effectId === 'DISTILLATION');
  const rDist = V.playEventOrInstance(st, distCard.id, {});
  assert.strictEqual(rDist.ok, true);
  assert.strictEqual(st.pendingPrompt.type, 'DISTILLATION_PICK');
  const discTarget = st.discardPile.find((c) => c.symbol === 'H');
  const rPick = V.resolvePrompt(st, { cardId: discTarget.id });
  assert.strictEqual(rPick.ok, true);

  V.endTurn(st);

  // Turn 2 (P1): Pass synthesis, break Resonance with 1st Half-Life Decay, then land 2nd Half-Life Decay on CO2!
  V.passSynthesis(st);
  p1.hand.push(makeCard(hlSpec, 10), makeCard(hlSpec, 11));
  const hl1 = p1.hand.find((c) => c.id === 'test_HALF_LIFE_DECAY_10');
  const hl2 = p1.hand.find((c) => c.id === 'test_HALF_LIFE_DECAY_11');
  assert.strictEqual(V.playEventOrInstance(st, hl1.id, { targetCompoundId: co2Id }).ok, true); // absorbed by Resonance
  assert.strictEqual(V.playEventOrInstance(st, hl2.id, { targetCompoundId: co2Id }).ok, true); // halves CO2 from 16 -> 8 SP!
  assert.strictEqual(V.getCompoundSP(p0.field.find((c) => c.id === co2Id)), 8);

  V.endTurn(st);

  // Turn 3 (P0): Stage an Unstable Compound (Mg + Cl), pass next turn to trigger UNSTABLE_DECAY
  p0.hand.push(makeCard(Mg, 20), makeCard(Cl, 20));
  const mgC = p0.hand.find((c) => c.id === 'test_Mg_20');
  const clC = p0.hand.find((c) => c.id === 'test_Cl_20');
  assert.strictEqual(V.synthesizeUnstableCompound(st, [mgC.id, clC.id]).ok, true);
  V.endTurn(st); // P0 turn 3 end -> P1 turn 4
  V.passSynthesis(st);
  V.endTurn(st); // P1 turn 4 end -> P0 turn 5
  V.passSynthesis(st);
  V.endTurn(st); // P0 turn 5 end -> Unstable MgCl collapses!

  V.Story.updateTelemetryFromState(trackerP0, st, 0);
  V.Story.updateTelemetryFromState(trackerP1, st, 1);

  assert.strictEqual(trackerP0.compoundsSynthesized, 1);
  assert.strictEqual(trackerP0.resonanceUsed, 1, 'RESONANCE_STABILIZER must increment resonanceUsed');
  assert.strictEqual(trackerP0.yellowEventsPlayed, 2, 'RESONANCE_STABILIZER + DISTILLATION must both increment yellowEventsPlayed');
  assert.strictEqual(trackerP0.spLostToOpponent, 8, 'HALF_LIFE_DECAY must record lostSP=8 on victim P0');
  assert.strictEqual(trackerP0.unstableStaged, 1);
  assert.strictEqual(trackerP0.unstableCollapsed, 1, 'UNSTABLE_DECAY must attribute via meta.playerId');

  // Verify P1 was NOT misattributed P0's events despite overlapping player names ('Chemist' vs 'Chemist Alpha')
  assert.strictEqual(trackerP1.resonanceUsed, 0);
  assert.strictEqual(trackerP1.yellowEventsPlayed, 0);
  assert.strictEqual(trackerP1.redEventsPlayed, 1, 'P1 landed Half-Life Decay (non-absorbed) must count as redEvent');
  assert.strictEqual(trackerP1.unstableCollapsed, 0);
});

// ===== TEST 2: PASS 3 — AI discardProtect RESPECTED ON THERMAL ACTIVATION =====
test('Pass 3 AI Config: discardProtect preserves configured cards during AI Thermal Activation auto-discard', () => {
  const st = V.createGame({ mode: 'vs_ai', p1Name: 'Candidate', p2Name: 'Simulation: Linus Pauling' });
  st.opponentConfigId = 'opp_pauling'; // discardProtect includes 'F', 'O', 'Cl', 'IONIZATION_SURGE', 'BOND_CLEAVAGE', 'RESONANCE_STABILIZER'
  V.passSynthesis(st);
  V.endTurn(st); // Now P1 (AI) turn 2
  V.passSynthesis(st);

  const ai = st.players[1];
  const thermSpec = V.INSTANCE_SPECS.find((s) => s.effectId === 'THERMAL_ACTIVATION');
  const resSpec = V.INSTANCE_SPECS.find((s) => s.effectId === 'RESONANCE_STABILIZER');
  const diffSpec = V.INSTANCE_SPECS.find((s) => s.effectId === 'DIFFUSION');
  const acidSpec = V.EVENT_SPECS.find((s) => s.effectId === 'ACID_RAIN');
  const He = V.buildFullDeck().find((c) => c.symbol === 'He');

  // Put ONLY protected RESONANCE_STABILIZER (base val 7, +20 protected = 27) and unprotected ACID_RAIN (val 7) & DIFFUSION (val 7) & He (val 9)
  // Plus fill top of drawPile with protected F/O/Cl so Thermal Activation draws 3 protected cards and MUST discard unprotected DIFFUSION or ACID_RAIN!
  ai.hand = [
    makeCard(thermSpec, 1),
    makeCard(resSpec, 2),
    makeCard(diffSpec, 3),
    makeCard(He, 4),
  ];
  st.drawPile.push(makeCard(V.ELEMENT_BY_SYMBOL.F, 10));
  st.drawPile.push(makeCard(V.ELEMENT_BY_SYMBOL.O, 11));
  st.drawPile.push(makeCard(V.ELEMENT_BY_SYMBOL.Cl, 12));

  const res = V.playEventOrInstance(st, ai.hand[0].id, {});
  assert.strictEqual(res.ok, true);

  // The discarded card MUST be unprotected DIFFUSION (val 7), NOT protected RESONANCE_STABILIZER (val 27), F (28), O (28), Cl (28), or He (9)!
  assert.ok(ai.hand.some((c) => c.effectId === 'RESONANCE_STABILIZER'), 'Protected RESONANCE_STABILIZER must stay in hand');
  assert.ok(!ai.hand.some((c) => c.effectId === 'DIFFUSION'), 'Unprotected DIFFUSION should be discarded first');
});

// ===== TEST 3: PASS 1 — DEFENSIVE RESEARCH CHALLENGES & NON-DOWNGRADE PROGRESSION =====
test('Pass 1 Progression & Challenges: missing snapshot arrays never throw; replays never downgrade licensure tier', () => {
  for (const rc of V.Story.listResearchChallenges()) {
    const res = rc.evaluate({ won: true, snapshot: {} });
    assert.strictEqual(typeof res.completed, 'boolean');
    assert.ok(Array.isArray(res.criteria));
  }

  V.Story.resetProgression();
  const lavMission = V.Story.getMissionById('ch0_m2_lavoisier');

  // 1st attempt: Honors Licensure (90%)
  const evalHonors = {
    won: true,
    overall: 90,
    licensureTier: V.Story.LICENSURE_TIERS.HONORS,
    competencies: { synthesis: 92, stability: 90, defensive: 88, tactical: 90 },
    snapshot: { unstableCollapsed: 0, distinctFormulas: ['H₂O', 'NaCl'], elementsUsed: ['H', 'O', 'Na', 'Cl'] },
  };
  let out = V.Story.recordExaminationOutcome(lavMission, evalHonors, V.Story.getResearchChallenge('rc_lavoisier').evaluate(evalHonors));
  assert.strictEqual(out.progression.chapter0LicensureTier, V.Story.LICENSURE_TIERS.HONORS);
  assert.strictEqual(out.progression.completedMissions.ch0_m2_lavoisier.bestLicensureTier, V.Story.LICENSURE_TIERS.HONORS);

  // 2nd attempt: Replay and get Provisional Licensure (55%) -> MUST NOT downgrade!
  const evalProv = {
    won: true,
    overall: 55,
    licensureTier: V.Story.LICENSURE_TIERS.PROVISIONAL,
    competencies: { synthesis: 55, stability: 55, defensive: 55, tactical: 55 },
    snapshot: { unstableCollapsed: 2, distinctFormulas: ['H₂O'], elementsUsed: ['H', 'O'] },
  };
  out = V.Story.recordExaminationOutcome(lavMission, evalProv, V.Story.getResearchChallenge('rc_lavoisier').evaluate(evalProv));
  assert.strictEqual(out.progression.chapter0LicensureTier, V.Story.LICENSURE_TIERS.HONORS, 'Replay must not lower cumulative licensure tier');
  assert.strictEqual(out.progression.completedMissions.ch0_m2_lavoisier.bestLicensureTier, V.Story.LICENSURE_TIERS.HONORS);
  assert.strictEqual(out.progression.completedMissions.ch0_m2_lavoisier.bestOverall, 90);

  // 3rd attempt: Replay and LOSE -> MUST NOT downgrade!
  const evalLoss = {
    won: false,
    overall: 32,
    licensureTier: V.Story.LICENSURE_TIERS.NONE,
    competencies: { synthesis: 30, stability: 30, defensive: 35, tactical: 35 },
    snapshot: {},
  };
  out = V.Story.recordExaminationOutcome(lavMission, evalLoss, V.Story.getResearchChallenge('rc_lavoisier').evaluate(evalLoss));
  assert.strictEqual(out.progression.chapter0LicensureTier, V.Story.LICENSURE_TIERS.HONORS, 'Lost replay must not lower cumulative licensure tier');
  assert.strictEqual(out.progression.completedMissions.ch0_m2_lavoisier.completed, true);
});

// ===== TEST 4: PASS 2 & 3 — REAL-MATCH INTEGRATION ACROSS ALL 5 OPPONENTS (150 FULL GAMES) =====
test('Pass 2 & 3 Real-Match Integration: All 5 opponents (including Academy Proctor) execute 30 real games each with post-engine legalValidated=true, live telemetry, evaluation, challenges & unlocks', () => {
  const OPPONENT_MISSIONS = [
    { cfgId: 'opp_lavoisier', missionId: 'ch0_m2_lavoisier' },
    { cfgId: 'opp_mendeleev', missionId: 'ch0_m3_mendeleev' },
    { cfgId: 'opp_pauling', missionId: 'ch0_m4_pauling' },
    { cfgId: 'opp_curie', missionId: 'ch0_m5_curie' },
    { cfgId: 'opp_academy_proctor', missionId: 'ch0_m6_final_exam' },
  ];

  const GAMES_PER_OPPONENT = 30;
  const benchmark = {};

  V.Story.resetProgression();
  V.Story.recordNarrativeMissionComplete('ch0_m1_registration', { academyRegistered: true });

  for (const { cfgId, missionId } of OPPONENT_MISSIONS) {
    const mission = V.Story.getMissionById(missionId);
    const rc = mission.researchChallengeId ? V.Story.getResearchChallenge(mission.researchChallengeId) : null;

    let completed = 0;
    let oppWins = 0;
    let candidateWins = 0;
    let totalTurns = 0;
    let totalOppDecisions = 0;
    let failedEngineMoves = 0;
    let synthCount = 0;
    let unstableStaged = 0;
    let unstableStabilized = 0;
    let enTakeovers = 0;
    let shields = 0;
    let redEvents = 0;
    let yellowEvents = 0;
    let rcCompletedCount = 0;
    let totalCandidateTelemetrySP = 0;

    for (let g = 0; g < GAMES_PER_OPPONENT; g++) {
      const st = V.createGame({ mode: 'vs_ai', p1Name: 'You (Candidate)', p2Name: cfgId });
      st.players[0].isAI = true; // Auto-pilot candidate using real legal engine moves!
      st.players[1].isAI = true;
      st.opponentConfigId = cfgId;

      const tracker = V.Story.createTelemetryTracker();
      let steps = 0;

      while (st.phase !== 'GAME_OVER' && steps < 600) {
        steps += 1;
        const activeIdx = st.activePlayerIndex;
        const stepCfg = activeIdx === 1
          ? V.Story.getOpponentConfig(cfgId)
          : V.Story.getOpponentConfig('opp_mendeleev');
        const plan = V.planAIStep(st, stepCfg);
        const execRes = plan.execute();
        assert.strictEqual(execRes.engineOk, true, `Engine rejected AI move ${plan.action} for ${stepCfg.configId}`);
        V.Story.updateTelemetryFromState(tracker, st, 0);
      }

      assert.strictEqual(st.phase, 'GAME_OVER', `Game ${g} vs ${cfgId} did not terminate`);
      completed += 1;
      totalTurns += st.turnNumber;
      if (st.winnerIndex === 1) oppWins += 1;
      else candidateWins += 1;

      // Verify post-execution legalValidated === true on every logged opponent decision
      const oppLogs = (st.aiDecisionLog || []).filter((d) => d.playerIndex === 1);
      totalOppDecisions += oppLogs.length;
      for (const d of oppLogs) {
        if (d.legalValidated !== true) failedEngineMoves += 1;
        if (d.action === 'synthesize') synthCount += 1;
        if (d.action === 'synthesize_unstable') unstableStaged += 1;
        if (d.action === 'stabilize_unstable') unstableStabilized += 1;
        if (d.action === 'en_takeover') enTakeovers += 1;
        if (d.action === 'shield') shields += 1;
        if (['ACID_RAIN', 'BOND_CLEAVAGE', 'PRECIPITATION', 'ELECTROLYSIS', 'HALF_LIFE_DECAY', 'ionization_surge', 'oxidation', 'reaction_delay'].includes(d.action)) redEvents += 1;
        if (['synthesis_accelerator', 'buffer_solution', 'resonance', 'equilibrium_shift', 'distillation', 'thermal_activation', 'diffusion'].includes(d.action)) yellowEvents += 1;
      }

      // Run REAL evaluation + research challenge + progression save on the REAL finished match state!
      const evalRes = V.Story.evaluateExamination(tracker, st, 0);
      totalCandidateTelemetrySP += evalRes.playerSP;
      assert.strictEqual(evalRes.won, st.winnerIndex === 0);
      assert.ok(evalRes.overall >= 0 && evalRes.overall <= 100);
      if (evalRes.won) {
        assert.ok(evalRes.playerSP >= 25, 'Winning candidate must have >= 25 SP');
        assert.notStrictEqual(evalRes.licensureTier, V.Story.LICENSURE_TIERS.NONE);
      } else {
        assert.strictEqual(evalRes.licensureTier, V.Story.LICENSURE_TIERS.NONE);
      }

      const rcRes = rc ? rc.evaluate(evalRes) : null;
      if (rcRes && rcRes.completed) rcCompletedCount += 1;

      V.Story.recordExaminationOutcome(mission, evalRes, rcRes);
    }

    assert.strictEqual(failedEngineMoves, 0, `${cfgId} had ${failedEngineMoves} unvalidated moves`);
    assert.ok(candidateWins > 0, `Expected candidate to win at least 1 of ${GAMES_PER_OPPONENT} real games vs ${cfgId}`);

    benchmark[cfgId] = {
      games: completed,
      oppWinPct: Math.round((oppWins / completed) * 100),
      avgTurns: Number((totalTurns / completed).toFixed(2)),
      decisions: totalOppDecisions,
      synths: synthCount,
      unstableStaged,
      unstableStab: unstableStabilized,
      enTakeovers,
      shields,
      redEvents,
      yellowEvents,
      rcPassed: rc ? rcCompletedCount : 'N/A',
    };
  }

  console.log('\n5-Opponent Real-Match Behavioral & Integration Benchmark (150 full games):');
  console.table(benchmark);

  // Verify Lavoisier's strict zero-unstable discipline across real matches
  assert.strictEqual(benchmark.opp_lavoisier.unstableStaged, 0);
  // Verify Academy Proctor actually plays, synthesizes, uses tactics, and logs decisions
  assert.ok(benchmark.opp_academy_proctor.decisions > 100);
  assert.ok(benchmark.opp_academy_proctor.synths > 30);

  // Verify real matches unlocked Stage 1 for all 4 historical scientists AND unlocked Chapter 1 via Proctor!
  const prog = V.Story.loadProgression();
  for (const sciId of ['lavoisier', 'mendeleev', 'pauling', 'curie']) {
    const sp = V.Story.getScientistProgress(prog, sciId);
    assert.strictEqual(sp.stageOneUnlocked, true, `${sciId} Stage One should be unlocked by real match victories`);
    assert.strictEqual(sp.collectibleCardAwarded, false, `${sciId} must never award nonexistent collectible card`);
  }
  assert.strictEqual(prog.chapter1Unlocked, true, 'Real Final Examination victory must unlock Chapter 1: The Frontier');
  assert.notStrictEqual(prog.chapter0LicensureTier, V.Story.LICENSURE_TIERS.NONE);
});

console.log(`\nSTAGE 2 INTEGRATION SUMMARY: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

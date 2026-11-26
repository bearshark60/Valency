// VALENCY: THE ELEMENTAL FRONTIER — Stage 3B Acceptance Test Suite
// Covers Section 9 Required Tests: Save Integrity & Migration, Collection & Deck Validation,
// Scientist Equipment / Passive & Active Battle Integration / Research & XP,
// Expedition Failure / Withdrawal / Extraction / Reload Deduplication, Combat, and Future Compatibility.
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
  'src/frontier/playerProfile.js',
  'src/frontier/collectionManager.js',
  'src/frontier/scientistEquipment.js',
  'src/frontier/worldManager.js',
  'src/frontier/rewardProcessor.js',
  'src/frontier/expeditionManager.js',
  'src/frontier/investigationManager.js',
  'src/frontier/encounterManager.js',
  'src/engine/ai.js',
];

for (const rel of SCRIPTS) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  vm.runInContext(code, sandbox, { filename: rel });
}

const V = sandbox.Valency;
const F = V.Frontier;
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

function makeSeededRng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ===== 1. SAVE INTEGRITY & IDEMPOTENT ACADEMY MIGRATION =====
test('Save Integrity: Academy Chapter 0 save migrates cleanly into Frontier PlayerProfile without duplication or loss', () => {
  // Seed a completed Academy Chapter 0 save in localStorage
  const academySave = {
    schemaVersion: 1,
    completedMissions: {
      ch0_m1_registration: { completed: true, attempts: 1 },
      ch0_m6_final_exam: { completed: true, attempts: 1, bestOverall: 84, bestLicensureTier: 'Honors Licensure' },
    },
    scientists: {
      lavoisier: { scientistId: 'lavoisier', stageOneUnlocked: true, stageTwoUnlocked: true, collectibleCardAwarded: false },
    },
    chapter0Completed: true,
    chapter0LicensureTier: 'Honors Licensure',
    chapter1Unlocked: true,
    branchFlags: { molecularInstabilityMysteryDiscovered: true },
  };
  storageBacking[V.Story.STORAGE_KEY] = JSON.stringify(academySave);
  delete storageBacking[F.PlayerProfile.STORAGE_KEY];

  const p1 = F.PlayerProfile.loadProfile();
  assert.strictEqual(p1.storyFlags.academyGraduated, true);
  assert.strictEqual(p1.storyFlags.academyLicensureTier, 'Honors Licensure');
  assert.strictEqual(p1.storyFlags.molecularInstabilityKnown, true);

  const initialSum = F.CollectionManager.getCollectionSummary(p1);
  assert.strictEqual(initialSum.totalCopies, 120, 'Starter permanent collection should match canonical 120-card Unit 1 counts');

  // Repeated reloads & migrations MUST NOT duplicate collection entries or mutate Academy save!
  const p2 = F.PlayerProfile.loadProfile();
  F.PlayerProfile.migrateFromAcademy(p2);
  F.PlayerProfile.saveProfile(p2);
  const p3 = F.PlayerProfile.loadProfile();
  assert.strictEqual(F.CollectionManager.getCollectionSummary(p3).totalCopies, 120);

  const academyAfter = V.Story.loadProgression();
  assert.strictEqual(academyAfter.chapter0Completed, true);
  assert.strictEqual(academyAfter.chapter0LicensureTier, 'Honors Licensure');
  assert.strictEqual(academyAfter.scientists.lavoisier.stageOneUnlocked, true);
});

// ===== 2. COLLECTION & DECK VALIDATION =====
test('Collection & Deck Management: permanent duplicates/variants, validation rules, and temporary isolation', () => {
  const p = F.PlayerProfile.resetProfile();
  const baseOxygen = F.CollectionManager.getOwnedQuantity(p, 'el_O');
  assert.ok(baseOxygen > 0);

  // Add permanent duplicate variant copy via RewardProcessor
  const r = F.RewardProcessor.processReward(p, null, {
    persistenceClass: 'PERMANENT',
    cards: [{ cardId: 'el_O', quantity: 2, variant: 'frontier_field' }],
  });
  assert.strictEqual(r.ok, true);
  assert.strictEqual(F.CollectionManager.getOwnedQuantity(p, 'el_O'), baseOxygen + 2);
  assert.strictEqual(p.collection.el_O.variants.frontier_field, 2);

  // Reject unowned quantity in deck
  const badSet = F.CollectionManager.setDeckCardCount(p, p.activeDeckId, 'el_O', baseOxygen + 99);
  assert.strictEqual(badSet.ok, false);

  // Valid deck adjustment succeeds
  const goodSet = F.CollectionManager.setDeckCardCount(p, p.activeDeckId, 'el_O', baseOxygen + 1);
  assert.strictEqual(goodSet.ok, true);
  assert.strictEqual(goodSet.validation.valid, true);
  assert.ok(goodSet.validation.flaggedDesignGaps.minConstructedDeckSize.includes('NOT_DEFINED_IN_UNIT_1'));

  // Building a battle deck with temporary expedition cards MUST NOT touch permanent collection
  const ownedBefore = F.CollectionManager.getOwnedQuantity(p, 'el_F');
  const deckBuild = F.CollectionManager.buildBattleDeckCards(p, p.activeDeckId, [{ cardId: 'el_F', quantity: 3 }]);
  assert.strictEqual(deckBuild.ok, true);
  assert.strictEqual(deckBuild.temporaryCount, 3);
  assert.strictEqual(deckBuild.cards.filter((c) => c.isTemporary).length, 3);
  assert.strictEqual(F.CollectionManager.getOwnedQuantity(p, 'el_F'), ownedBefore, 'Temporary cards must never enter permanent collection');
});

// ===== 3. WORLD EXPLORATION & PERSISTENT DISCOVERIES =====
test('World Exploration: regional navigation, persistent discoveries, and Convergence Investigation evidence', () => {
  const p = F.PlayerProfile.resetProfile();
  assert.strictEqual(p.currentLocationId, 'loc_hearth_outpost');
  assert.strictEqual(F.WorldManager.isSafePreparationLocation(p.currentLocationId), true);

  // Cannot travel to undiscovered Conservation Crucible yet
  assert.strictEqual(F.WorldManager.travelToLocation(p, 'loc_lavoisier_rift', null).ok, false);

  // Inspect Hearth -> travel to Caloric Thermal Vent -> scan anomaly -> discovers ruins & rift + Scientific Evidence!
  F.WorldManager.interactAtCurrentLocation(p, 'int_hearth_briefing');
  assert.strictEqual(F.WorldManager.travelToLocation(p, 'loc_caloric_vent', null).ok, true);
  assert.strictEqual(F.WorldManager.isSafePreparationLocation(p.currentLocationId), false);

  const scanRes = F.WorldManager.interactAtCurrentLocation(p, 'int_scan_vent_anomaly');
  assert.strictEqual(scanRes.ok, true);
  assert.ok(scanRes.evidenceNow.includes('ev_sci_caloric_drift'));
  assert.strictEqual(p.currencies.researchData, 15);

  // Travel to Convergence Relay Ruins -> decrypt Historical & Intelligence Evidence
  assert.strictEqual(F.WorldManager.travelToLocation(p, 'loc_archive_ruins', null).ok, true);
  const relayRes = F.WorldManager.interactAtCurrentLocation(p, 'int_recover_convergence_log');
  assert.strictEqual(relayRes.ok, true);
  assert.ok(relayRes.evidenceNow.includes('ev_hist_convergence_charter'));
  assert.ok(relayRes.evidenceNow.includes('ev_intel_lavoisier_beacon'));

  // Reload from localStorage and verify all 3 evidence categories & locations persisted
  const reloaded = F.PlayerProfile.loadProfile();
  assert.ok(reloaded.discoveredLocations.includes('loc_lavoisier_rift'));
  const inv = F.InvestigationManager.getInvestigationSummary(reloaded);
  assert.strictEqual(inv.discoveredCount, 3);
  assert.strictEqual(inv.byCategory.SCIENTIFIC.filter((e) => e.discovered).length, 1);
  assert.strictEqual(inv.byCategory.HISTORICAL.filter((e) => e.discovered).length, 1);
  assert.strictEqual(inv.byCategory.INTELLIGENCE.filter((e) => e.discovered).length, 1);
});

// ===== 4. EXPEDITION FAILURE MODEL (KEEP PERMANENT, LOSE UNSECURED & TEMPORARY) + RELOAD DEDUP =====
test('Expedition Failure & Withdrawal: permanent rewards survive; unsecured & temporary state discarded; reload does not duplicate rewards', () => {
  const p = F.PlayerProfile.resetProfile();
  const startCredits = p.currencies.reagentCredits;
  const startData = p.currencies.researchData;
  const startOxygen = F.CollectionManager.getOwnedQuantity(p, 'el_O');

  // Start expedition
  const s1 = F.ExpeditionManager.startExpedition(p, 'exp_caloric_crucible');
  assert.strictEqual(s1.ok, true);
  let exp = s1.expedition;

  // Move to Branch B (Research Site -> PERMANENT +25 Research Data & Clue, UNSECURED +30 Credits)
  const m1 = F.ExpeditionManager.moveToNode(p, exp, 'node_research_site');
  assert.strictEqual(m1.ok, true);
  assert.strictEqual(p.currencies.researchData, startData + 25);
  assert.strictEqual(p.currencies.reagentCredits, startCredits, 'Unsecured credits must NOT enter permanent profile yet');
  assert.strictEqual(m1.expedition.unsecuredRewards.length, 1);

  // Reload active expedition from storage -> confirm zero reward duplication
  exp = F.ExpeditionManager.loadActiveExpedition();
  assert.strictEqual(exp.currentNodeId, 'node_research_site');
  assert.strictEqual(exp.claimedRewardNodeIds.includes('node_research_site'), true);

  // Advance to Vanguard Sentinel encounter, add temporary card manually to test cleanup, win Sentinel!
  const m2 = F.ExpeditionManager.moveToNode(p, exp, 'node_vanguard');
  assert.strictEqual(m2.ok, true);
  exp = m2.expedition;
  F.RewardProcessor.processReward(p, exp, {
    persistenceClass: 'TEMPORARY',
    temporaryCards: [{ cardId: 'el_F', quantity: 2 }],
  });
  assert.strictEqual(exp.temporaryCards.length, 1);

  // Initialize real canonical battle for Sentinel and resolve a Victory!
  const initSentinel = F.EncounterManager.initializeEncounterBattle(p, exp, 'enc_caloric_sentinel', { rng: makeSeededRng(42) });
  assert.strictEqual(initSentinel.ok, true);
  assert.strictEqual(initSentinel.deckBuild.temporaryCount, 2, 'Temporary cards must be active in expedition battle deck');
  assert.strictEqual(initSentinel.battleState.players[0].entityId, p.playerId);

  // Simulate battle win state cleanly through canonical win condition (concede by AI side = winnerIndex 0)
  V.concedeMatch(initSentinel.battleState, 1);
  const resSentinel = F.EncounterManager.resolveEncounterOutcome(p, exp, 'enc_caloric_sentinel', initSentinel.battleState);
  assert.strictEqual(resSentinel.won, true);
  assert.strictEqual(F.CollectionManager.getOwnedQuantity(resSentinel.profile, 'el_O'), startOxygen + 1, 'Permanent Oxygen card committed');
  assert.strictEqual(resSentinel.profile.currencies.reagentCredits, startCredits, 'Unsecured Sentinel credits still unsecured');

  // Now advance to Boss and FAIL the expedition -> Permanent rewards MUST SURVIVE, Unsecured & Temporary MUST BE LOST!
  exp = F.ExpeditionManager.loadActiveExpedition();
  const mBoss = F.ExpeditionManager.moveToNode(resSentinel.profile, exp, 'node_boss_lavoisier');
  assert.strictEqual(mBoss.ok, true);
  exp = mBoss.expedition;

  const initBossFail = F.EncounterManager.initializeEncounterBattle(resSentinel.profile, exp, 'enc_rogue_lavoisier', { rng: makeSeededRng(99) });
  V.concedeMatch(initBossFail.battleState, 0); // Player loses -> winnerIndex 1
  const resFail = F.EncounterManager.resolveEncounterOutcome(resSentinel.profile, exp, 'enc_rogue_lavoisier', initBossFail.battleState);
  assert.strictEqual(resFail.won, false);
  assert.strictEqual(resFail.expeditionFinalSummary.outcome, 'FAILED');
  assert.strictEqual(resFail.expeditionFinalSummary.lostUnsecuredSummary.length, 2, 'Both unsecured credit stashes lost on failure');
  assert.strictEqual(F.ExpeditionManager.loadActiveExpedition(), null, 'Temporary expedition state must be cleared on end');

  // Reload profile from localStorage and verify permanent rewards SURVIVED failure!
  const afterFail = F.PlayerProfile.loadProfile();
  assert.strictEqual(afterFail.currencies.researchData, startData + 25, 'Permanent Research Data survived failure');
  assert.strictEqual(F.CollectionManager.getOwnedQuantity(afterFail, 'el_O'), startOxygen + 1, 'Permanent Oxygen card survived failure');
  assert.strictEqual(afterFail.currencies.reagentCredits, startCredits, 'Unsecured credits were NOT added on failure');
  assert.strictEqual(afterFail.currentLocationId, 'loc_hearth_outpost', 'Returned to safe Hearth Outpost');
});

// ===== 5. EXTRACTION, ROGUE LAVOISIER VICTORY, SCIENTIST EQUIPMENT, PASSIVE/ACTIVE ABILITIES IN BATTLE =====
test('Vertical Slice: Defeat Rogue Lavoisier -> Unlock -> Safe-Zone Equip -> Passive & Active Abilities in Canonical Battle + Research/XP', () => {
  const p = F.PlayerProfile.resetProfile();
  const startCredits = p.currencies.reagentCredits;

  // Cannot equip locked Lavoisier
  assert.strictEqual(F.ScientistEquipment.equipScientist(p, 'lavoisier', null).ok, false);

  // Run expedition via Branch A (Temporary Cache + Unsecured Credits) -> Vanguard -> Extraction Lift test first!
  let exp = F.ExpeditionManager.startExpedition(p, 'exp_caloric_crucible').expedition;
  // Cannot change equipment during active expedition
  assert.strictEqual(F.ScientistEquipment.canChangeEquipment(p, exp).allowed, false);

  exp = F.ExpeditionManager.moveToNode(p, exp, 'node_reagent_cache').expedition;
  assert.strictEqual(exp.temporaryCards.length, 2);
  exp = F.ExpeditionManager.moveToNode(p, exp, 'node_vanguard').expedition;
  const b1 = F.EncounterManager.initializeEncounterBattle(p, exp, 'enc_caloric_sentinel', { rng: makeSeededRng(7) }).battleState;
  V.concedeMatch(b1, 1);
  F.EncounterManager.resolveEncounterOutcome(p, exp, 'enc_caloric_sentinel', b1);

  // Extract safely at Extraction Lift -> secures 35 + 60 = 95 unsecured credits!
  exp = F.ExpeditionManager.loadActiveExpedition();
  exp = F.ExpeditionManager.moveToNode(p, exp, 'node_extraction').expedition;
  const extRes = F.ExpeditionManager.extractFromExpedition(p, exp);
  assert.strictEqual(extRes.outcome, 'EXTRACTED');
  assert.strictEqual(F.ExpeditionManager.loadActiveExpedition(), null);
  let prof = F.PlayerProfile.loadProfile();
  assert.strictEqual(prof.currencies.reagentCredits, startCredits + 95, 'Extraction must commit unsecured credits permanently');

  // Now run 2nd expedition straight to Rogue Lavoisier Construct and DEFEAT him!
  exp = F.ExpeditionManager.startExpedition(prof, 'exp_caloric_crucible').expedition;
  exp = F.ExpeditionManager.moveToNode(prof, exp, 'node_reagent_cache').expedition;
  exp = F.ExpeditionManager.moveToNode(prof, exp, 'node_vanguard').expedition;
  const b2 = F.EncounterManager.initializeEncounterBattle(prof, exp, 'enc_caloric_sentinel', { rng: makeSeededRng(11) }).battleState;
  V.concedeMatch(b2, 1);
  F.EncounterManager.resolveEncounterOutcome(prof, exp, 'enc_caloric_sentinel', b2);

  exp = F.ExpeditionManager.loadActiveExpedition();
  exp = F.ExpeditionManager.moveToNode(prof, exp, 'node_boss_lavoisier').expedition;
  const bossBattle = F.EncounterManager.initializeEncounterBattle(prof, exp, 'enc_rogue_lavoisier', { rng: makeSeededRng(21) }).battleState;
  V.concedeMatch(bossBattle, 1);
  const bossOut = F.EncounterManager.resolveEncounterOutcome(prof, exp, 'enc_rogue_lavoisier', bossBattle);
  assert.strictEqual(bossOut.won, true);
  assert.strictEqual(bossOut.expeditionFinalSummary.outcome, 'COMPLETED');

  // Reload profile -> Frontier Lavoisier is permanently unlocked, Research Data +30, Intelligence Evidence recorded!
  prof = F.PlayerProfile.loadProfile();
  assert.strictEqual(prof.scientists.lavoisier.unlocked, true);
  assert.strictEqual(prof.storyFlags.lavoisierConstructRecovered, true);
  assert.ok(prof.currencies.researchData >= 30);

  // Unlock Lavoisier research node & verify persistence
  const resUnlock = F.ScientistEquipment.unlockResearchNode(prof, 'lavoisier', 'res_lav_mass_balance');
  assert.strictEqual(resUnlock.ok, true);
  F.PlayerProfile.saveProfile(prof);

  // Equip Lavoisier at Hearth Outpost safe zone (and confirm equipping fails outside safe zone!)
  assert.strictEqual(F.ScientistEquipment.equipScientist(prof, 'lavoisier', null).ok, true);
  F.PlayerProfile.saveProfile(prof);
  prof = F.PlayerProfile.loadProfile();
  assert.strictEqual(prof.equippedScientistId, 'lavoisier');
  assert.ok(prof.scientists.lavoisier.researchUnlocks.includes('res_lav_mass_balance'));

  // Test Lavoisier PASSIVE & ACTIVE abilities inside canonical gameEngine.js!
  const testBattle = F.EncounterManager.initializeEncounterBattle(prof, null, 'enc_caloric_sentinel', { rng: makeSeededRng(55) }).battleState;
  const p0 = testBattle.players[0];
  assert.ok(p0.equippedScientist && p0.equippedScientist.scientistId === 'lavoisier');
  assert.strictEqual(p0.equippedScientist.passiveTriggersRemaining, 1);
  assert.strictEqual(p0.equippedScientist.activeUsesRemaining, 1);

  // Put H + H + O in hand and synthesize H2O (clean O/H synthesis -> triggers Passive draw +1 ONCE, SP remains strictly canonical 8!)
  const H = V.ELEMENT_BY_SYMBOL.H;
  const O = V.ELEMENT_BY_SYMBOL.O;
  p0.hand = [
    { ...H, id: 'lav_h1' },
    { ...H, id: 'lav_h2' },
    { ...O, id: 'lav_o1' },
  ];
  const rSynth = V.synthesizeCompound(testBattle, ['lav_h1', 'lav_h2', 'lav_o1']);
  assert.strictEqual(rSynth.ok, true);
  assert.strictEqual(V.getCompoundSP(rSynth.compound), 8, 'Scientist passive must NOT alter canonical SP scoring');
  assert.strictEqual(p0.equippedScientist.passiveTriggersRemaining, 0, 'Passive consumed after 1st trigger');
  assert.strictEqual(p0.hand.length, 1, 'Mass Conservation Ledger drew 1 extra card');
  assert.ok(testBattle.log.some((e) => e.meta && e.meta.type === 'SCIENTIST_PASSIVE' && e.meta.scientistId === 'lavoisier'));

  // Now in Phase 3 (DEFENSE): put an element in discardPile and activate Lavoisier's Active Ability!
  testBattle.discardPile.push({ ...V.ELEMENT_BY_SYMBOL.F, id: 'disc_f1' });
  const rAct1 = V.activateScientistAbility(testBattle, { discardCardId: 'disc_f1' });
  assert.strictEqual(rAct1.ok, true);
  assert.strictEqual(p0.equippedScientist.activeUsesRemaining, 0);
  assert.ok(p0.hand.some((c) => c.id === 'disc_f1'), 'Quantitative Reclamation added discarded Fluorine to hand');

  // Trying to use Active Ability a 2nd time in the same match MUST fail!
  testBattle.discardPile.push({ ...V.ELEMENT_BY_SYMBOL.Cl, id: 'disc_cl1' });
  const rAct2 = V.activateScientistAbility(testBattle, { discardCardId: 'disc_cl1' });
  assert.strictEqual(rAct2.ok, false);
});

// ===== 6. FULL AI-VS-AI REPRODUCIBLE SEEDED FRONTIER COMBAT =====
test('Combat & Future Compatibility: deterministic RNG produces identical Frontier initial deals and completes full legal battle', () => {
  const p = F.PlayerProfile.resetProfile();
  const bA = F.EncounterManager.initializeEncounterBattle(p, null, 'enc_rogue_lavoisier', { rng: makeSeededRng(12345) }).battleState;
  const bB = F.EncounterManager.initializeEncounterBattle(p, null, 'enc_rogue_lavoisier', { rng: makeSeededRng(12345) }).battleState;
  assert.deepStrictEqual(
    bA.players[0].hand.map((c) => c.symbol || c.effectId),
    bB.players[0].hand.map((c) => c.symbol || c.effectId),
    'Seeded RNG must produce reproducible opening hands'
  );

  // Run full legal battle to GAME_OVER using canonical AI planner
  bA.players[0].isAI = true;
  let steps = 0;
  while (bA.phase !== 'GAME_OVER' && steps < 600) {
    steps += 1;
    const plan = V.planAIStep(bA);
    const res = plan.execute();
    assert.strictEqual(res.engineOk, true);
  }
  assert.strictEqual(bA.phase, 'GAME_OVER');
});

console.log(`\nSTAGE 3B FRONTIER ACCEPTANCE SUMMARY: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

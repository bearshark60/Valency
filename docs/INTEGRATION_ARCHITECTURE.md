# VALENCY — Historical Scientist System & Story Mode Integration Architecture

## 1. Architectural Overview & Separation of Concerns

The Historical Scientist Opponent System and **Chapter 0: Academy Licensure** are engineered as a modular, zero-build, data-driven layer (`src/story/*` + `src/ui/storyUI.js`) that plugs cleanly into VALENCY's single canonical rules engine (`src/engine/gameEngine.js`) without duplicating any synthesis, defense, electronegativity displacement, or event resolution logic.

```
src/
├── data/
│   ├── cards.js                 # Canonical 120-card Unit 1 deck (ZERO scientist cards mixed in)
│   └── compounds.js             # Canonical synthesis, unstable compound, and EN takeover validators
├── engine/
│   ├── gameEngine.js            # Single source of truth for all match rules & SP scoring
│   └── ai.js                    # Strategy-driven legal AI planner (Classic + Story Mode)
├── story/
│   ├── scientists.js            # Reusable Master Historical Scientist Profiles (identity only)
│   ├── scientistCardSchema.js   # Inactive Future Collectible Scientist Card schema (reserved)
│   ├── opponentConfigs.js       # Separate AI Opponent Configurations (fair play enforced)
│   ├── evaluation.js            # Academy Licensure Evaluation (strictly separate from SP)
│   ├── researchChallenges.js    # Stage Two Research Challenge definitions & evaluators
│   ├── progression.js           # Persistent Two-Stage Progression & Chapter 0/1 flags
│   └── academyChapter.js        # Data-driven Chapter 0: Academy Licensure 6-mission graph
└── ui/
    ├── animations.js            # Scientist SVG portraits + Story-aware VS pre-match intro
    ├── storyUI.js               # Story Hub, Research Archive, Briefings, Results modal UI
    └── app.js                   # Main UI shell & thin V.UI bridge (Classic + Tutorial intact)
```

### Core Architectural Guardrails

1. **Zero Engine Duplication:** Every Story Mode encounter invokes `V.createGame({ mode: 'vs_ai', ... })` and executes all moves through `V.synthesizeCompound`, `V.synthesizeUnstableCompound`, `V.stabilizeUnstableCompound`, `V.attachShield`, `V.performENTakeover`, and `V.playEventOrInstance`.
2. **Historical Identity ≠ Opponent AI Behavior ≠ Future Collectible Cards:**
   - `src/story/scientists.js` stores strictly biographical identity, discoveries, elemental affinities, portrait/art refs, fictionalized simulation disclaimers, dialogue, and foreign-key IDs (`opponentConfigRef`, `researchChallengeRef`, `futureCardRef`).
   - `src/story/opponentConfigs.js` stores strictly AI difficulty, strategy profiles, card selection weights, synthesis/defense/event priorities, and EN displacement evaluation thresholds.
   - `src/story/scientistCardSchema.js` stores strictly inactive future specialist card metadata.
3. **Fair Play by Construction:** Every opponent config references `STANDARD_FAIR_DECK_CONFIG` (`useStandardSharedDeck: true`, `deckSize: 120`, `extraStartingCards: 0`, `extraDrawPerTurn: 0`, `hiddenStatBonuses: false`). `validateOpponentConfig()` rejects any configuration attempting to grant extra cards, extra draws, hidden stats, or disable `legalMoveValidation`.
4. **No Invented Radioactive Mechanics for Marie Curie:** `opp_curie` operates strictly on the existing 120-card Unit 1 deck and legal game actions (favoring empirical Yellow Instance combos, careful unstable-compound research, and shield discipline).
5. **Classic Mode & Interactive Tutorial Preservation:** Classic `vs_ai` leaves `state.opponentConfigId` unset (defaulting transparently to `opp_mendeleev`), Classic `pass_and_play` and the 7-lesson Interactive Tutorial remain completely untouched.

---

## 2. Schema Specifications

### 2.1 Historical Scientist Master Profile (`src/story/scientists.js`)
Each entry in `V.Story.SCIENTIST_PROFILES` validates against `validateScientistProfile(profile)`:
- `scientistId`: Unique key (`lavoisier`, `mendeleev`, `pauling`, `curie`)
- `historicalName`, `displayName`, `lifespan`
- `portraitRef`, `artwork`: Decoupled portrait SVG key & future asset path references
- `biography`, `historicalDiscoveries[]`, `specialty`, `elementalAffinities[]`
- `simulationPersonality`: `{ archetype, traits[], disclaimer }` — explicitly frames each opponent as an inspired historical research simulation
- `dialogue`: `{ intro[], onVictory, onDefeat }` — data-driven lines consumed by `storyUI.js`
- Foreign-key references: `opponentConfigRef`, `researchChallengeRef`, `futureCardRef`

### 2.2 Configurable Opponent AI (`src/story/opponentConfigs.js` + `src/engine/ai.js`)
Each entry in `V.Story.OPPONENT_CONFIGS` (`opp_lavoisier`, `opp_mendeleev`, `opp_pauling`, `opp_curie`, `opp_academy_proctor`) defines:
- `configId`, `scientistId`, `difficulty`, `strategyProfile`
- `deckConfiguration`: Frozen `STANDARD_FAIR_DECK_CONFIG`
- `cardSelectionPreferences`: `{ affinitySymbols[], affinityWeight, reclaimPriority[], discardProtect[] }`
- `synthesisPriorities`: `{ spWeight, efficiencyPerCardWeight, preferNaturalOverCatalyst, allowUnstableStaging, unstableMaxOnField, exothermicMinSP, chainReactionMinCards, avoidSelfDiscardRisk }`
- `defensivePriorities`: `{ shieldBeforeAttack, bufferMinActiveCompounds, resonanceEnabled, recycleInactiveWithEquilibrium }`
- `eventCardPreferences`: `{ redOrder[], yellowOrder[], useOxidationMinOppElements, useReactionDelayMinOppSP, useDiffusionIfHandSmaller }`
- `enDisplacementEvaluation`: `{ enabled, evaluateBeforeDefense, stripShieldBeforeTakeover, minNetSwing, pierceShieldBonus }`
- `legalMoveValidation: true`, `decisionLogging: true`

Every AI step through `V.planAIStep(state, explicitConfig)` logs a structured entry to `state.aiDecisionLog`:
```json
{
  "turn": 4,
  "phase": "SYNTHESIS",
  "playerIndex": 1,
  "opponentConfigId": "opp_lavoisier",
  "strategyProfile": "Conservation & Resource-Efficient Synthesis",
  "action": "synthesize",
  "legalValidated": true,
  "reasoning": "..."
}
```

### 2.3 Future Collectible Scientist Card Schema (`src/story/scientistCardSchema.js`)
Strictly gated behind `CARD_EXPANSION_FLAGS`:
- `ACTIVATED_IN_CLASSIC_MODE: false`
- `ACTIVATED_IN_STORY_MODE: false`
- `SEPARATE_FROM_MAIN_DECK: true`

Every record in `FUTURE_SCIENTIST_CARDS` (`scard_lavoisier`, `scard_mendeleev`, `scard_pauling`, `scard_curie`) enforces:
- `activeInGameplay: false`
- `affinityStrength: null` (zero invented numerical bonuses)
- `deckCompatibility: { slotType: 'SCIENTIST_SPECIALIST_SLOT', separateFromMainDeck: true, eligibleModes: ['FUTURE_SPECIALIST_EXPANSION'] }`
- `unlockRequirements`: `{ stageOneSimulationDefeat, stageTwoResearchChallengeId }`

**Future Activation Path:** When a later expansion enables collectible Scientist Cards, the expansion will read persisted `stageTwoUnlocked` & `futureCardEligible` flags from `V.Story.loadProgression()`, hydrate deck specialist slots separately from `V.buildFullDeck()`, and define balanced abilities in a dedicated expansion module without migrating existing player saves.

---

## 3. Chapter 0: Academy Licensure & Branching-Ready Mission Graph

`src/story/academyChapter.js` models missions as a directed acyclic graph using `prerequisites[]`, `nextMissionIds[]`, and `branchFlags`:

1. `ch0_m1_registration` — **Registration Day** (narrative orientation → sets `branchFlags.academyRegistered`)
2. `ch0_m2_lavoisier` — **Lavoisier – The Conservation Principle** (`opp_lavoisier`, `rc_lavoisier`)
3. `ch0_m3_mendeleev` — **Mendeleev – The Periodic Challenge** (`opp_mendeleev`, `rc_mendeleev`)
4. `ch0_m4_pauling` — **Pauling – The Bonding Trial** (`opp_pauling`, `rc_pauling`)
5. `ch0_m5_curie` — **Curie – The Research Practicum** (`opp_curie`, `rc_curie`)
6. `ch0_m6_final_exam` — **Final Examination – The Licensure Trial** (`opp_academy_proctor` → introduces the Molecular Instability Mystery, sets `branchFlags.molecularInstabilityMysteryDiscovered`, and unlocks **Chapter 1: The Frontier**)

Each examination mission flows through:
`Introduction → Scientist Dialogue → Examination Briefing → Live AI Encounter (Standard Rules) → Licensure Evaluation → Results → Research Challenge Check → Two-Stage Research Archive Progression`.

---

## 4. Separate Academy Licensure Evaluation & Two-Stage Progression

- **Licensure Evaluation (`src/story/evaluation.js`):** Passively observes `state.log` (deduplicated by `entry.id`) and field snapshots via `createTelemetryTracker()` / `updateTelemetryFromState()`. Computes four independent 0–100 competency metrics (**Synthesis**, **Stability Management**, **Defensive**, **Tactical**) and a weighted overall percentage that awards:
  - **Honors Licensure** (`won && overall >= 82`)
  - **Standard Licensure** (`won && overall >= 62`)
  - **Provisional Licensure** (`won && overall < 62`)
  - **Not Yet Certified** (`!won`)
  Ordinary Stability Point (SP) win conditions (`25 SP`) remain completely untouched.
- **Two-Stage Persistence (`src/story/progression.js`, `localStorage` key `valency_story_progression_v1`):**
  - **Stage One** (defeat simulation): Unlocks `biographyUnlocked`, `discoveriesUnlocked`, `archiveEntryUnlocked`, and records `bestExaminationRecord`.
  - **Stage Two** (complete `rc_*` research challenge): Records `stageTwoUnlocked`, `acquisitionEligible: true`, `futureCardEligible: true`, while strictly keeping `collectibleCardAwarded: false` until the future expansion activates.

---

## 5. Recoverable Checkpoints

- `.checkpoints/v1_pre_story_baseline/` — Clean snapshot taken immediately prior to Historical Scientist & Story Mode implementation.
- `.checkpoints/v2_story_mode_academy_licensure/` — Verified snapshot taken after full Story Mode integration and automated testing.

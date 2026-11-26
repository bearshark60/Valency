# VALENCY: THE ELEMENTAL FRONTIER — Stage 3B Phase 1 Architecture Audit & Integration Plan

## 1. Existing Codebase Audit

### A. Canonical Card & Compound Data (`src/data/cards.js`, `src/data/compounds.js`)
- **Card Templates:** 43 unique templates across `ELEMENT_SPECS` (6 Noble Gases + 64 bonding element copies), `INSTANCE_SPECS` (10 Yellow Instances, 28 copies), and `EVENT_SPECS` (8 Red Events, 22 copies) = **120-card Unit 1 shared deck** via `V.buildFullDeck()`.
- **Missing Constructed-Deck Rules (Flagged for Future Design Approval):** Unit 1 defines a single shared 120-card deck with fixed per-card `copies`. Official constructed-format `minDeckSize`, `maxDeckSize`, and per-card copy caps are **not defined in existing rules**. Stage 3B will validate strictly against canonical card existence, owned quantity bounds, and playability floor (enough cards to deal & synthesize), explicitly flagging constructed limits in `V.Frontier.DECK_RULE_GAPS_FOR_DESIGN_APPROVAL` instead of inventing arbitrary caps.
- **Compound & Displacement Validators:** `validateSynthesis`, `validateUnstableSynthesis`, `findUnstableStabilizeSwaps`, `findPlayableCompounds`, and `findENTakeoversForCard` are pure functions operating on card objects and require zero duplication.

### B. Canonical Molecular Battle Engine (`src/engine/gameEngine.js`, `src/engine/ai.js`)
- **Pure State Machine:** `V.createGame(options)` already separates battle state from UI/DOM state and already accepts `options.rng` for reproducible/seeded testing.
- **Minimal Non-Breaking Extension Hooks Needed for Stage 3B:**
  1. Optional `options.customDeckCards` to allow Frontier encounters to inject the player's permanent deck + temporary expedition cards (Classic, Tutorial, and Academy continue calling `V.buildFullDeck()` unchanged).
  2. Optional `options.participants` (`entityId`, `equippedScientist`) to represent battle participants as distinct future-multiplayer-compatible entities.
  3. Optional `V.activateScientistAbility(state, payload)` + post-synthesis passive hook that runs **only** when `active.equippedScientist` is equipped (zero impact on Classic, Tutorial, or Academy matches).
- **AI Planner (`src/engine/ai.js`):** Already config-driven via `state.opponentConfigId` and `V.Story.getOpponentConfig()`; Frontier rogue construct opponents can plug into the exact same configurable AI planner with zero duplicate AI code.

### C. Academy Progression & Save Persistence (`src/story/progression.js`, `src/story/scientists.js`, `src/story/scientistCardSchema.js`)
- **Existing Save Key:** `localStorage['valency_story_progression_v1']` (`schemaVersion: 1`) stores `completedMissions`, `scientists` (Stage One/Two archive unlocks), `chapter0Completed`, `chapter0LicensureTier`, `chapter1Unlocked`, and `branchFlags`.
- **Master Scientist Profiles (`src/story/scientists.js`):** Store pure historical identity (`lavoisier`, `mendeleev`, `pauling`, `curie`, biographies, discoveries, affinities, disclaimers). Frontier constructs will reference these historical identities via `scientistId` while keeping Frontier rogue constructs and equipment state strictly distinct from Academy teaching simulations.
- **Future Scientist Card Schema (`src/story/scientistCardSchema.js`):** Remains untouched and inactive in Classic Mode and Academy Chapter 0.

---

## 2. Proposed Stage 3B Modular Architecture (`src/frontier/*`)

All Frontier foundation systems live under `src/frontier/` on `window.Valency.Frontier`, preserving strict separation between **Permanent Player Data** and **Temporary Expedition State**:

```
src/frontier/
├── playerProfile.js       # Phase 2: Persistent PlayerProfile store + idempotent Academy migration
├── collectionManager.js   # Phase 3: Canonical CardCollection (quantities/variants/upgrades) & Deck validation
├── scientistEquipment.js  # Phase 4: 1-slot Scientist Equipment, safe-zone rules, Lavoisier PoC passive/active, Research & XP
├── worldManager.js        # Phase 5: Persistent Regions, Locations, Routes, Safe Zones & Expedition Entrances
├── rewardProcessor.js     # Phase 6: Centralized Permanent vs. Temporary vs. Unsecured reward commit engine
├── expeditionManager.js   # Phase 6: Isolated temporary ExpeditionState, branching route, failure/withdrawal/extraction
├── investigationManager.js# Phase 7: Convergence Mystery evidence (Scientific / Historical / Intelligence)
└── encounterManager.js    # Phase 7: Battle initialization via gameEngine.js, outcome resolution, Frontier progression
src/ui/
└── frontierUI.js          # Phase 7: Frontier vertical slice UI (World Map, Safe-Zone Lab/Deck/Scientist, Expedition, Investigation)
```

### Critical Data Separation Guarantee
- `valency_frontier_profile_v1` stores **ONLY permanent data** (owned cards, currencies, unlocked scientists, equipped scientist, research/XP, discovered regions/locations, investigation evidence, story flags).
- `valency_frontier_active_expedition_v1` stores **ONLY temporary expedition state** (`route`, `currentNodeId`, `temporaryCards`, `temporaryModifications`, `temporaryResources`, `unsecuredRewards`, `claimedRewardNodeIds`).
- `ExpeditionManager` **never mutates `PlayerProfile` directly**; all rewards flow exclusively through `RewardProcessor.commitReward()` / `RewardProcessor.finalizeExpedition()`, guaranteeing that:
  - Permanent rewards survive expedition defeat or withdrawal.
  - Unsecured temporary rewards, temporary cards, and temporary modifications are discarded on failure/withdrawal and never leak into the permanent collection.
  - Reloading an active expedition tracks `claimedRewardNodeIds` so rewards can never be duplicated.

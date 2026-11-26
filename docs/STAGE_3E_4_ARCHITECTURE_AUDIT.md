# VALENCY — Stage 3E.4 Multi-Scientist Architecture Audit

**Stage:** 3E.4 — Multi-Scientist Architecture Validation, Production Scalability & Expansion Readiness  
**Date:** 2026-11-25  
**Scope:** End-to-end audit of Valency's multi-Scientist character architecture following the production completion of Lavoisier (`SCI-LAV-001`) and Mendeleev (`SCI-MEN-002`), targeting clean, data-driven onboarding of Scientist #3 (Pauling), Scientist #4 (Curie), and Scientist #5+.

---

## 1. Executive Audit Summary

Valency's core 2D painterly character rig engine (`src/presentation/characterRigEngine.js`) and 16-layer unflattened SVG contract (`assets/characters/*/master_layered.svg`) already proved solid across two visually and kinetically distinct Scientists (four production portraits: Frontier & Institute Lavoisier, Frontier & Institute Mendeleev).

However, auditing the surrounding orchestration layers exposed **eight scalability bottlenecks** that would have forced repetitive edits across multiple shared files (`frontierUI.js`, `app.js`, `characterRegistry.js`, `characterRigEngine.js`) for every new Scientist added in Stages 3E.5+. Stage 3E.4 resolves those structural weaknesses without altering Lavoisier/Mendeleev artwork, approved personalities, or gameplay rules.

---

## 2. Architectural Weaknesses Discovered & Resolved

| # | Area | Weakness Discovered Before Stage 3E.4 | Resolution Implemented in Stage 3E.4 |
|---|------|----------------------------------------|--------------------------------------|
| 1 | Studio Scientist Discovery (`src/ui/frontierUI.js`) | Hardcoded `STUDIO_SCIENTISTS` map (`lavoisier`, `mendeleev`) and hardcoded `def.scientistId === 'lavoisier' \|\| def.scientistId === 'mendeleev'` conditional for Frontier Hub preview buttons. | Replaced with dynamic `discoverStudioScientists()` reading `V.CharacterRegistry.listScientistPairs()` and dynamic `V.CharacterRegistry.hasAnimatedCharacterForScientist(def.scientistId)`. |
| 2 | Single-Variant Studio Mounting (`src/ui/frontierUI.js`) | Character Animation Studio mounted **both** Frontier and Institute rigs even when the user switched to `Institute`-only or `Frontier`-only view modes (hiding one with CSS while still loading its 13 PNGs and ticking its animation loop). | Studio now computes `mountFrontier` / `mountInstitute` from `viewMode` and only mounts visible rig(s) (`1` active rig in single-variant modes, `2` in Side-by-Side). |
| 3 | Single-Variant Null Safety (`src/ui/frontierUI.js`) | `selectExpression()` referenced `frontierManifest` directly and `#btn-poc-enc-preview` called `.addEventListener()` unconditionally, which would throw on Institute-only or non-Frontier Scientists. | Updated `selectExpression()` to read `primaryManifest`, made reaction testing null-safe per variant, and guarded `#btn-poc-enc-preview` when `sciDef.encounterId` is absent. |
| 4 | Battle Reaction Branching (`src/ui/app.js`) | `evaluateBattlePortraitReaction()` relied on character-ID string checks (`isMendeleev`) to choose Scientist-specific reaction expressions instead of reading manifest configuration. | Upgraded evaluator to read manifest-driven `battleReactions` (`ctx.battleReactions \|\| manifest.battleReactions`) while preserving exact backward-compatible defaults for Lavoisier and Mendeleev. |
| 5 | Centralized Registry & Duplicate Protection (`src/presentation/characterRegistry.js`) | Registry only held three flat alias dictionaries (`BY_ENCOUNTER_ID`, `BY_OPPONENT_ENTITY_ID`, `BY_STORY_MISSION_ID`) with no unified Scientist roster, no duplicate-alias collision detection, and no registry health validator. | Added `SCIENTIST_ROSTER`, `registerScientist(def, options)`, `listScientistPairs()` (including auto-discovery of standalone rigs), `hasAnimatedCharacterForScientist()`, `getAliasDiagnostics()`, collision-safe `registerOpponentMapping()`, and `validateRegistry()`. |
| 6 | Manifest Schema Validation & Diagnostics (`src/presentation/characterRigEngine.js`) | `registerCharacter()` accepted arbitrary objects without validating `aiFamily`, required pivots, motion enums, Institute glitch invariants, or duplicate IDs. | Added `VALID_MOTION_ENUMS`, `DEFAULT_MOTION_PROFILE`, `REQUIRED_PIVOT_KEYS`, `validateManifest(manifest)`, `getRegistrationDiagnostics()`, strict graceful failure (`null` return on invalid manifest), and optional `{ rejectDuplicate: true }` enforcement. |
| 7 | Concurrent SVG Fetch & Teardown Hygiene (`src/presentation/characterRigEngine.js`) | `loadSvgSource()` had no in-flight promise deduplication (`svgPending`) for uncached HTTP SVG fetches; `rig.destroy()` did not clear `this.parts`, `this.svgEl`, and `this.container` references. | Added `svgPending[url]` in-flight promise deduplication and cleared DOM references (`this.parts = {}`, `this.svgEl = null`, `this.container = null`) inside `rig.destroy()`. |
| 8 | SVG Sync Diagnostics (`scripts/sync-character-svg-registry.js`) | Sync script copied `master_layered.svg` files without checking for companion `rig_manifest.json` or verifying that every `href="assets/..."` PNG layer actually exists on disk. | Added non-destructive manifest & PNG `href` integrity warnings directly in the sync utility. |

---

## 3. What Worked Well & Was Deliberately Left Untouched

- **Core Rig Engine Kinetics (`src/presentation/characterRigEngine.js`):** The single shared `requestAnimationFrame` loop, per-instance `namespaceSvgMarkup()` `<defs>` isolation, expression lerp blending, breathing/posture/gaze/blink/glitch profile dispatch, and Reduced/Off accessibility modes already scaled cleanly across all four portraits and were preserved intact.
- **Lazy PNG Loading via Inline `<svg>` + `<image href="...">`:** Because `characterSvgRegistry.js` stores only lightweight SVG XML (`35.62 KB` total for 4 characters) and PNG `<image>` elements are only attached to the DOM when a character is actually mounted, **0 character PNGs** are fetched on Main Menu boot (verified live on both Desktop and Mobile).
- **Approved Production Artwork & Personalities:** Zero modifications were made to any Lavoisier or Mendeleev painterly PNG layers, `master_layered.svg` files, pivots, expressions, or motion profiles.
- **Canonical Gameplay & Static Fallback Path:** `src/engine/gameEngine.js`, `src/engine/ai.js`, `src/data/cards.js`, `src/data/compounds.js`, `src/story/*`, and Classic Mode's `.mini-avatar` static SVG fallback path remain 100% untouched.

---

## 4. Before / After Architecture Notes for Modified Shared Files

### 4.1 `src/presentation/characterRegistry.js`
- **Before:** Three static lookup maps (`BY_ENCOUNTER_ID`, `BY_OPPONENT_ENTITY_ID`, `BY_STORY_MISSION_ID`), single-key `registerOpponentMapping()`, and battle-state lookup. Adding a Scientist required manual edits across both `characterRegistry.js` and `frontierUI.js`.
- **After:** Single source of truth via `SCIENTIST_ROSTER` + declarative `registerScientist(def, options)` (which registers Frontier/Institute manifests, multi-alias arrays `encounterIds`/`opponentEntityIds`/`storyMissionIds`, and Studio roster metadata in one call), collision-safe `registerOpponentMapping()` with `getAliasDiagnostics()`, dynamic `listScientistPairs()` (auto-discovering standalone rigs too), `hasAnimatedCharacterForScientist()`, and `validateRegistry()`.

### 4.2 `src/presentation/characterRigEngine.js`
- **Before:** Permissive `registerCharacter()` with no schema validation or duplicate diagnostics, un-deduplicated HTTP `fetch()` in `loadSvgSource()`, and retained DOM part references on destroyed rig handles.
- **After:** Exports `REQUIRED_PIVOT_KEYS`, `VALID_MOTION_ENUMS`, `DEFAULT_MOTION_PROFILE`, `validateManifest()`, and `getRegistrationDiagnostics()`. Invalid manifests fail safely returning `null` without mutating the registry. `loadSvgSource()` deduplicates concurrent fetches via `svgPending`. `rig.destroy()` nulls `parts`, `svgEl`, and `container` and cancels `requestAnimationFrame` when active rigs reach `0`. `BUILTIN_CHARACTERS.sci_men_002_*` also mirror disk `battleReactions`.

### 4.3 `src/ui/app.js`
- **Before:** `evaluateBattlePortraitReaction()` branched on `characterId.includes('mendeleev')` to pick Mendeleev-specific reactions.
- **After:** Reads `manifest.battleReactions` (or `ctx.battleReactions`) merged over clean family defaults, and `reactOpponentPortraitToEvents()` passes `manifest: activeOpponentRig.manifest`. Future Scientists customize battle reactions purely inside `rig_manifest.json` with zero edits to `app.js`.

### 4.4 `src/ui/frontierUI.js`
- **Before:** Hardcoded `STUDIO_SCIENTISTS` dictionary, hardcoded Lavoisier/Mendeleev check for Hub preview button, always mounted both variants regardless of `viewMode`, and assumed `frontierManifest` & `#btn-poc-enc-preview` always existed.
- **After:** Dynamically discovers Scientists via `V.CharacterRegistry.listScientistPairs()`, checks preview eligibility via `V.CharacterRegistry.hasAnimatedCharacterForScientist()`, mounts only visible rigs in single-variant view modes, passes manifests to the live reaction tester, and safely handles single-variant or non-Frontier Scientists.

### 4.5 `assets/characters/sci_men_002_frontier/rig_manifest.json` & `sci_men_002_institute/rig_manifest.json`
- **Before:** Contained `pivots`, `personality`, `motionProfile`, and `expressions`, while battle reaction mappings lived in `app.js`.
- **After:** Additive `battleReactions` block matches `BUILTIN_CHARACTERS` and `app.js` 1:1 (zero edits to existing pivots, expressions, or motion profiles).

### 4.6 `sw.js` & `scripts/sync-character-svg-registry.js`
- **Before:** `sw.js` cached `valency-mobile-v9`; `sync-character-svg-registry.js` performed unchecked SVG copying.
- **After:** `sw.js` bumped to `valency-mobile-v10` (invalidating stale mobile PWA caches on upgrade, still intentionally excluding raw PNG layers from precache so mobile install stays lightweight and PNGs lazy-cache on first view); `sync-character-svg-registry.js` validates companion `rig_manifest.json` and every referenced PNG `href` on disk.

---

## 5. Asset Loading, Caching & Memory Lifecycle Audit

1. **Main Menu Lazy Loading:** Confirmed **0 character PNG requests** at Main Menu on both Desktop (`index.html`) and Mobile (`mobile.html`). Only `characterSvgRegistry.js` (`35.62 KB`) loads up front so animated portraits render instantaneously with zero SVG flash when mounted.
2. **On-Demand Mounting:** Opening Lavoisier Side-by-Side fetches `26` PNG layers (`13` Frontier + `13` Institute). Switching to Mendeleev Side-by-Side fetches `26` additional PNG layers (`52` cumulative across all 4 portraits). Switching back reuses browser HTTP cache without re-fetching new URLs. Single-variant view modes (`Institute` or `Frontier`) mount only `1` SVG rig (`13` PNGs).
3. **Teardown & Memory Hygiene:** Closing Studio or leaving a live battle calls `rig.destroy()` / `clearOpponentRig()`, which clears `speakStopTimer`, clears `this.parts`/`this.svgEl`/`this.container`, removes the rig from `activeRigs`, and invokes `cancelAnimationFrame` when `activeRigs.size === 0`. Detached containers are also self-pruned by `getActiveRigCount()`.
4. **Mobile PWA Service Worker (`sw.js`):** Precaches core JS/CSS/HTML/icons + the 4 lightweight `master_layered.svg` wrappers (`~33 KB` total), streams `/assets/audio/` directly without bloating iOS quota, and uses network-first with runtime cache fallback so character PNGs are cached lazily after first encounter and stay available offline.

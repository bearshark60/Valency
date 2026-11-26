# VALENCY — Stage 3E.4 Multi-Scientist Architecture Validation Report

**Date:** 2026-11-25  
**Status:** **PASSED & READY FOR REVIEW** (Paused cleanly prior to Scientist #3 / Stage 3E.5 as requested)

---

## 1. File Inventory

### 1.1 Files Inspected
- `docs/SCIENTIST_PRODUCTION_STANDARD.md`, `docs/STAGE_3E_2_PRODUCTION_REPORT.md`, `docs/STAGE_3E_3_MENDELEEV_ANIMATION_REPORT.md`
- `src/presentation/characterRigEngine.js`, `src/presentation/characterRegistry.js`, `src/presentation/characterSvgRegistry.js`, `src/presentation/visualTheme.js`
- `src/ui/frontierUI.js`, `src/ui/app.js`, `sw.js`
- `scripts/sync-character-svg-registry.js`, `scripts/build-mobile-bundle.js`
- `assets/characters/sci_lav_001_{frontier,institute}/rig_manifest.json`
- `assets/characters/sci_men_002_{frontier,institute}/rig_manifest.json`
- `tests/stage3d1_character_pipeline_test.js` through `tests/stage3e3_mendeleev_animation_test.js`

### 1.2 Files Modified / Created in Stage 3E.4
| File | Action | Summary |
|------|--------|---------|
| `src/presentation/characterRegistry.js` | Modified | Added `SCIENTIST_ROSTER`, `registerScientist()`, `listScientistPairs()` (with standalone rig auto-discovery), `hasAnimatedCharacterForScientist()`, collision-safe `registerOpponentMapping()`, `getAliasDiagnostics()`, and `validateRegistry()`. |
| `src/presentation/characterRigEngine.js` | Modified | Added `REQUIRED_PIVOT_KEYS`, `VALID_MOTION_ENUMS`, `DEFAULT_MOTION_PROFILE`, `validateManifest()`, `getRegistrationDiagnostics()`, graceful invalid-manifest rejection & duplicate-ID diagnostics, `svgPending` concurrent fetch deduplication, `destroy()` DOM reference cleanup, and `battleReactions` parity on `BUILTIN_CHARACTERS.sci_men_002_*`. |
| `src/ui/app.js` | Modified | Replaced hardcoded `isMendeleev` battle reaction branching with manifest-driven `battleReactions` config resolution while preserving exact Lavoisier & Mendeleev defaults. |
| `src/ui/frontierUI.js` | Modified | Replaced hardcoded `STUDIO_SCIENTISTS` and Lavoisier/Mendeleev Hub checks with dynamic `V.CharacterRegistry` discovery; mounted only visible rig(s) in single-variant Studio view modes; added null-safe handling for single-variant / non-Frontier Scientists. |
| `assets/characters/sci_men_002_frontier/rig_manifest.json` & `sci_men_002_institute/rig_manifest.json` | Modified (Additive) | Added `battleReactions` configuration block (zero edits to pivots, motion profiles, expressions, or artwork). |
| `scripts/sync-character-svg-registry.js` | Modified | Added manifest-presence and referenced-PNG `href` validation warnings during SVG sync. |
| `sw.js` | Modified | Bumped PWA cache version from `valency-mobile-v9` to `valency-mobile-v10`. |
| `tests/stage3e4_scalability_validation_test.js` | Created | Dedicated 7-suite Stage 3E.4 scalability, manifest/registry validation, mock 3rd-Scientist onboarding, fetch dedup, switching & teardown regression suite. |
| `docs/STAGE_3E_4_ARCHITECTURE_AUDIT.md` | Created | Complete architectural audit with before/after notes for every modified shared file. |
| `docs/STAGE_3E_4_PRODUCTION_PIPELINE_STANDARD.md` | Created | Standardized 15-step production & onboarding pipeline for Scientist #3, #4, #5+. |
| `docs/STAGE_3E_4_VALIDATION_REPORT.md` | Created | This validation & QA acceptance report. |

### 1.3 Files Deliberately Left Untouched
- **All Lavoisier & Mendeleev Painterly Artwork & SVGs:** `assets/characters/sci_lav_001_*/*`, `assets/characters/sci_men_002_*/*.svg`, `layers/*.png`, `production/*`
- **All Core Gameplay, AI & Data Modules:** `src/engine/gameEngine.js`, `src/engine/ai.js`, `src/data/cards.js`, `src/data/compounds.js`, `src/story/*`, `src/frontier/*`
- **HTML & CSS Shells:** `index.html`, `mobile.html`, `src/styles/*`
- **All Prior Test Suites:** Zero edits or assertion weakening to any existing test file in `tests/`.

---

## 2. Architecture Weaknesses Discovered & Improvements Implemented

Detailed before/after notes are documented in `docs/STAGE_3E_4_ARCHITECTURE_AUDIT.md`. Key outcomes:
1. **Zero-Shared-Code-Edit Scientist Onboarding:** Proven in automated test #5 by onboarding a simulated 3rd Scientist (`Linus Pauling`, `sci_pau_003_frontier` & `sci_pau_003_institute`) purely through `V.CharacterRegistry.registerScientist()` + `battleReactions` manifest config — automatically appearing in Studio discovery (`listScientistPairs()` grew from `2` to `3`), routing encounter/mission/entity aliases, and firing custom battle reactions without editing `frontierUI.js`, `app.js`, `characterRegistry.js`, or `characterRigEngine.js`.
2. **Strict Schema & Duplicate Protection:** Invalid manifests (`aiFamily`, missing pivots, invalid `motionProfile` enums, Institute glitch violations, out-of-range `jawSpeechScale`) fail safely returning `null` with structured diagnostics; duplicate IDs and duplicate aliases are detected and guarded.
3. **Resource & Teardown Efficiency:** Single-variant Studio modes now mount `1` rig instead of `2`; concurrent uncached SVG fetches deduplicate to `1` network call; `rig.destroy()` clears DOM references and stops `requestAnimationFrame` at `0` active rigs.

---

## 3. Automated Regression Test Results

All **10 / 10** automated test suites executed cleanly under Node.js (`v26.13.1`, Windows) with **0 failures** and **0 weakened assertions**:

| Test Suite | Result | Verified Scope |
|------------|--------|----------------|
| `tests/stage2_integration_test.js` | **PASS** | 150-game 5-opponent canonical match benchmark, telemetry & progression |
| `tests/stage3a_chapter0_test.js` | **PASS** | Academy Chapter 0 6-mission licensure, challenges & save migration |
| `tests/stage3b_frontier_test.js` | **PASS** | Frontier vertical slice, collection, expedition failure/withdrawal & Rogue Lavoisier unlock |
| `tests/stage3c_presentation_test.js` | **PASS** | Visual theme / audio scene modularity & modal restoration |
| `tests/stage3d1_character_pipeline_test.js` | **PASS** | Core character rig pipeline, layer contract & preferences |
| `tests/stage3d2_production_portrait_test.js` | **PASS** | Lavoisier painterly production assets & live battle integration |
| `tests/stage3d4_performance_test.js` | **PASS** | Lavoisier refined personality kinetics, speaking cadence & battle reactions |
| `tests/stage3e2_mendeleev_assets_test.js` | **PASS** | Mendeleev 13-layer painterly assets, framing, budget & rig compatibility |
| `tests/stage3e3_mendeleev_animation_test.js` | **PASS** | Mendeleev distinct kinetics, 8 expressions, beard-safe speech, reactions & Studio |
| `tests/stage3e4_scalability_validation_test.js` | **PASS (7/7)** | All 4 production manifests/SVGs/PNGs/eye-framing, `validateRegistry()`, invalid manifest & duplicate ID/alias guards, static fallback, mock 3rd-Scientist onboarding, concurrent fetch dedup, rapid multi-Scientist switching, DOM ref teardown & Reduced/Off freeze |

---

## 4. Real Measured Performance & Asset Metrics

**Test Environment:** Windows 11 local pilot server (`node server.js` on `http://localhost:8080`, Node.js `v26.13.1`), built-in Chromium webview browser (`1280×860` Desktop, `390×844` iPhone 14 Mobile, `320×568` iPhone SE Mobile). All values below are directly measured on disk or observed live during browser acceptance — no numbers are estimated.

### 4.1 Disk Asset Footprint (Measured Directly via PowerShell `Get-Item`)

| Character Package | PNG Layer Count | Total `layers/*.png` Size | `master_layered.svg` | `rig_manifest.json` | Budget Status (`<= 2.50 MB`) |
|-------------------|-----------------|---------------------------|----------------------|---------------------|------------------------------|
| `sci_lav_001_frontier` | `13` | `1,753,525 B` (**1.67 MB**) | `8,933 B` | `6,867 B` | **PASS** |
| `sci_lav_001_institute` | `13` | `2,389,634 B` (**2.28 MB**) | `6,322 B` | `6,495 B` | **PASS** |
| `sci_men_002_frontier` | `13` | `1,931,213 B` (**1.84 MB**) | `10,838 B` | `8,317 B` | **PASS** |
| `sci_men_002_institute` | `13` | `2,134,272 B` (**2.04 MB**) | `6,929 B` | `7,103 B` | **PASS** |
| `src/presentation/characterSvgRegistry.js` | — | — | `36,479 B` (**35.62 KB**) combined 4 SVGs | — | **PASS** |

### 4.2 Live Browser Network, Timing & Memory Telemetry

| Metric | Desktop (`1280×860`) | Mobile (`390×844` / `320×568`) | Verification Result |
|--------|----------------------|--------------------------------|---------------------|
| Character PNGs loaded on Main Menu | **`0`** (`38` total base requests) | **`0`** | **PASS** (Lazy PNG loading verified) |
| Character PNGs on Lavoisier Studio Open | **`26`** (`13` Frontier + `13` Institute) | **`26`** | **PASS** (0 failed PNG/SVG) |
| Cumulative Character PNGs after switching to Mendeleev | **`52`** (`26` Lavoisier + `26` Mendeleev) | **`50`** (cached/observed network buffer) | **PASS** (0 failed PNG/SVG) |
| Rapid Studio Switch Timing (click → 2 mounted SVGs, `32` layers) | Mendeleev: **`284 ms`**, Lavoisier: **`488 ms`**, Mendeleev: **`373 ms`** | Smooth switch verified | **PASS** |
| Active SVG Rigs by View Mode (`Institute` / `Frontier` / `Both`) | **`1`** / **`1`** / **`2`** | **`1`** / **`1`** / **`2`** | **PASS** (Single-variant saves 1 rig) |
| Live Battle Rig Mount (`Simulation: Dmitri Mendeleev`, `ch0_m3_mendeleev`) | **`1`** SVG rig (`16` layers, `13` `<image>`), `0` visible `.mini-avatar` | **`1`** SVG rig (`16` layers), `42×42px` frame at both `390×844` & `320×568`, `0` `.mini-avatar` | **PASS** |
| Classic Match Static Fallback (`Dr. Mendeleev (AI)`) | `.mini-avatar` rendered, **`0`** animated SVG rigs | `.mini-avatar` rendered, **`0`** animated SVG rigs | **PASS** |
| Teardown on Returning to Main Menu / Closing Studio | **`0`** active SVG rigs, **`0`** `[data-layer]` nodes | **`0`** active SVG rigs | **PASS** |
| Layout Width / Horizontal Overflow | `1280px` (`<= 1280px`) | `375.2px` (`<= 390px`) & `304.8px` (`<= 320px`) | **PASS** (Zero overflow) |
| Console Errors / Failed Character Asset Requests | **`0`** console errors / **`0`** failed PNG or SVG requests | **`0`** console errors / **`0`** failed PNG or SVG requests | **PASS** |

---

## 5. Live Browser Acceptance Evidence (Static Screenshots vs. Video Disclosure)

> **Evidence Format Disclosure:** The built-in Chromium webview browser tool captures **static PNG screenshots** and **live DOM / Playwright locator / network / timing telemetry**; it does **not** support `.mp4` or `.webm` video capture. Animated behavior (8 expressions, speaking cadence, battle reaction status updates, and Reduced/Off mode toggles) was verified live via interactive state checks in the running browser plus 60-second simulated frame stepping in automated tests (`stage3d4_performance_test.js` & `stage3e3_mendeleev_animation_test.js`). Additionally, because `webview_browser` restricts arbitrary `page.evaluate()` calls, runtime rig/resource counts were verified directly through DOM SVG/layer queries (`svg:has([data-layer])`), Playwright `page.networkRequests()`, and Worker `performance.now()` timings.

- **Desktop Host-Verified Evidence (`1280×860`, Studio Mendeleev Side-by-Side dynamically discovered from `CharacterRegistry`):**
  `C:/Users/joshb/.gemini/antigravity/brain/1104dbc4-ef03-4aaf-850f-c8abbd1dc5f5/browser_evidence/9dda7b3b-930f-4771-8736-1ff37b75a891/final_step_51.png`
- **Mobile Host-Verified Evidence (`390×844`, Live Battle Header `Simulation: Dmitri Mendeleev` in `42×42px` circular frame):**
  `C:/Users/joshb/.gemini/antigravity/brain/1104dbc4-ef03-4aaf-850f-c8abbd1dc5f5/browser_evidence/ccb99e4a-f42a-4270-974d-0c28ea09d658/final_step_39.png`

---

## 6. Remaining Limitations & Honest Observations

1. **Manifest Sync Still Dual-Stored (`rig_manifest.json` + `BUILTIN_CHARACTERS`):** To keep zero-CORS `file://` launches working without a bundler, production manifests currently exist both on disk (`assets/characters/<id>/rig_manifest.json`) and inside `BUILTIN_CHARACTERS` in `characterRigEngine.js` (guarded by automated `deepStrictEqual` parity tests). Adding an auto-generated `characterManifestRegistry.js` script (mirroring `sync-character-svg-registry.js`) in a future stage would eliminate that manual copy step entirely.
2. **Optional Audio Probe 404s:** The existing audio loader probes `.m4a` / `.mp3` / `.ogg` before falling back to `.wav` (and `mendeleev-theme.*` audio track is not yet authored), producing benign audio 404 fallback logs during battle entry. Character PNG and SVG requests had **0** errors.
3. **Studio Sticky Stage Overlap on Short Viewports:** Inside the Studio modal scroll area, sticky `.poc-stage-sticky` cards can partially cover buttons scrolled directly to the very top of the scroll container on shorter screens; scrolling slightly further reveals all buttons cleanly.
4. **Frontier Mendeleev World Access:** Sector 01 Frontier UI currently exposes Lavoisier (Periodic Spire / Mendeleev encounter is gated for future region rollout), so Frontier Mendeleev live battle routing is verified through automated registry/battle tests and Studio Encounter Intro preview, while live gameplay battle framing was verified interactively on Academy Mendeleev (`ch0_m3_mendeleev`).

---

## 7. Recommendations for Next Stage (Stage 3E.5)

1. **Proceed to Scientist #3 (Linus Pauling — `SCI-PAU-003`)** following the mandatory 15-step checklist in `docs/STAGE_3E_4_PRODUCTION_PIPELINE_STANDARD.md` (concept approval → 13-layer painterly extraction → `rig_manifest.json` with distinct bonding-focused kinetics & `battleReactions` → single `registerScientist()` entry).
2. **Optional Micro-Enhancement Before Scientist #4:** Introduce `scripts/sync-character-manifests.js` so `rig_manifest.json` on disk auto-generates `src/presentation/characterManifestRegistry.js` (just like `characterSvgRegistry.js`), bringing new-Scientist integration down to literally one command plus `registerScientist()`.
3. **Optional Polish:** Add `scroll-margin-top` to Studio control groups below `.poc-stage-sticky` so keyboard/auto-scroll never tucks controls underneath sticky portraits.

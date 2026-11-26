# VALENCY — Stage 3E.3 Report: Mendeleev Character Animation Integration & Personality

**Date:** 2026-11-24  
**Scope:** Integration of approved Stage 3E.2 **Institute Mendeleev (`sci_men_002_institute`)** and **Frontier Mendeleev (`sci_men_002_frontier`)** painterly rigs into Valency's existing `V.CharacterRig` engine, `V.CharacterRegistry`, contextual battle reaction evaluator, and multi-character Character Animation Studio, with distinct non-Lavoisier animation personalities.  
**Stage Gate Compliance:** Stopped cleanly after Stage 3E.3. Zero changes to approved Mendeleev artwork/layers, zero changes to Lavoisier artwork or animation behavior, zero changes to `gameEngine.js`, SP calculations, cards, AI logic, or Classic/Academy/Tutorial rules.

---

## 1. Pre-Integration Audit & Change Control (Phase 1)

- Audited `SCIENTIST_PRODUCTION_STANDARD.md`, `MENDELEEV_CHARACTER_DESIGN.md`, `MENDELEEV_EXPRESSION_MATRIX.md`, `MENDELEEV_ANIMATION_SPECIFICATION.md`, `MENDELEEV_PERSONALITY_AND_BEHAVIOR.md`, and `STAGE_3E_2_PRODUCTION_REPORT.md`.
- Verified all 13 RGBA PNG layers, lossless `896×1200` masters, `master_layered.svg`, `rig_manifest.json`, and updated Stage 3E.2 QA sheets for both `sci_men_002_frontier` (`1.84 MB`) and `sci_men_002_institute` (`2.04 MB`) — zero blocking defects.
- Archived pre-integration checkpoint at `.checkpoints/v3e2_mendeleev_assets_pre3e3/` (`83` files) before modifying any file.

---

## 2. Files Modified & Created

### Files Modified (Minimal, Additive, Backward-Compatible)
- `src/presentation/characterRigEngine.js` — Added `sci_men_002_frontier` and `sci_men_002_institute` to `BUILTIN_CHARACTERS` (100% synced with disk `rig_manifest.json` files) and added optional manifest-driven kinetic hooks (`breathProfile`, `postureStyle`, `gazePattern`, `blinkStyle`, `glitchStyle`, `idleMicroExpressions`, `jawSpeechScale`). When omitted (as on Lavoisier), every path executes Lavoisier's exact existing behavior unchanged.
- `src/presentation/characterRegistry.js` — Registered canonical mappings:
  - `ch0_m3_mendeleev` → `sci_men_002_institute`
  - `enc_rogue_mendeleev` / `opp_entity_rogue_mendeleev` → `sci_men_002_frontier`
  - Preserved all Lavoisier mappings (`ch0_m2_lavoisier`, `enc_rogue_lavoisier`, `opp_entity_rogue_lavoisier`) and preserved `null` static fallback for unregistered characters (`ch0_m4_pauling`, `ch0_m5_curie`, Classic `Dr. Mendeleev (AI)`, `enc_caloric_sentinel`).
- `src/presentation/visualTheme.js` — Declared `sci_men_002_frontier` and `sci_men_002_institute` in `ASSET_MANIFEST.characters`.
- `src/presentation/characterSvgRegistry.js` — Regenerated via `scripts/sync-character-svg-registry.js` (now indexes all 4 layered SVG masters; `layers/*.png` remain 100% lazy-loaded on mount).
- `src/frontier/encounterManager.js` — Added preview encounter `enc_rogue_mendeleev` (using canonical `opp_mendeleev` config and approved Stage 3E.1 dialogue lines, `isFinalExpeditionBoss: false`, zero changes to Sector 01 expedition progression).
- `src/ui/app.js` — Extended `evaluateBattlePortraitReaction` with Mendeleev-specific presentation-only reaction tuning (keyed by `characterId` prefix `sci_men_`), preserving Lavoisier's reaction table and all global cooldown / deduplication rules unchanged.
- `src/ui/frontierUI.js` & `src/styles/character-portrait.css` — Upgraded Character Animation Studio with Scientist switcher (`Lavoisier (SCI-LAV-001)` | `Mendeleev (SCI-MEN-002)`), Variant view toggles (`Side-by-Side` | `Institute` | `Frontier`), timed speaking cadence tester (`🗣 Test Cadence (3s)`), live Contextual Battle Reaction Tester (`⚔ Player Synth`, `🛡 Own Pillar`, `⚡ Disrupted`, `📉 Major Swing`), dynamic Encounter Intro construct badge (`SCI-MEN-002 • Gen-2 Drifting`), and Mendeleev portrait button in Frontier Hub → Scientists.
- `sw.js` & `scripts/build-mobile-bundle.js` — Added lightweight Mendeleev `master_layered.svg` files to SW core cache (`valency-mobile-v9`; PNG layers stay lazy-cached on demand) and excluded `qa/` review sheets from the lightweight Mobile PWA bundle.

### Files Created
- `tests/stage3e3_mendeleev_animation_test.js` — 5-part Stage 3E.3 Mendeleev integration, 60-second kinetic personality, beard-safe speaking, battle reaction, and Studio/accessibility test suite.
- `assets/characters/sci_men_002_frontier/qa/personality_comparison_sheet.png` — Side-by-side Institute vs. Frontier Mendeleev personality & expression comparison sheet.
- `docs/STAGE_3E_3_MENDELEEV_ANIMATION_REPORT.md` — This report.
- `.checkpoints/v3e2_mendeleev_assets_pre3e3/` & `.checkpoints/v3e3_mendeleev_animation_complete/` — Recoverable pre- and post-integration checkpoints.

---

## 3. Distinct Animation Personalities & Differences From Specification (Phases 3–6)

| Channel | Institute Mendeleev (`sci_men_002_institute`) | Frontier Mendeleev (`sci_men_002_frontier`) | Contrast vs. Lavoisier |
|---|---|---|---|
| **Breathing** | `diaphragmatic_poise` (`6.8s` steady, `20%` held architectural crest, `1.1px` rise) | `thoracic_contemplative` (`5.9s ± 900ms`, every 5th cycle `1.26×` contemplative sigh, every 4th cycle `820ms` calculation breath arrest) | Lavoisier uses smooth `5.3s`/`6.2s` rolling wave (`organic_wave`) |
| **Posture** | `anchored_vertical` (`7.5–12.0s` holds, `≤ 0.18°` tilt, vertical poise shifts) | `stepped_axial` (`5.0–9.5s` statuesque holds, crisp `280ms` discrete analytical plane shifts, `0%` wobble) | Lavoisier uses softer `460ms` lateral tilts + `24%` micro self-corrections |
| **Gaze** | `tabular_row` (methodical horizontal row sweeps `±2.2px`, `|y| ≤ 0.25px`, locked binocular) | `periodic_grid_dual_tempo` (L-shaped orthogonal hops on 2D lattice; right iris snaps `85ms` later in clean stepped convergence) | Lavoisier uses continuous center-biased wandering saccades |
| **Blinking** | `heavy_symmetrical` (`5.8–7.6s`, deliberate `168ms` symmetrical dean blink) | `fixation_shutter` (`6.5–11.5s` unblinking fixation + `195ms` reset blink; `18%` left-lid half-shutter before reset) | Lavoisier uses faster `3.4–7.2s` blinks + `28%` `54ms` right-lid lag |
| **Idle Micro-Expressions** | Disabled (`0`) | `row_verify_furrow`, `heavy_nod_ack`, `lattice_arrest` (`10.0–17.5s`) | Distinct from Lavoisier's `observant_squint` / `quiet_ponder` / `subtle_tension` |
| **Speaking Cadence** | Weighty declarative clauses (`2–4` syllables, `165–250ms`, `480–720ms` pauses, `jawSpeechScale: 3.2`) | Crisp analytical bursts (`2–5` syllables, `115–205ms`, `520–920ms` evaluative pauses, `jawSpeechScale: 3.5`) | Tighter beard-safe jaw travel (`≤ 5.6px` peak vs. Lavoisier's `4.8` scale) |
| **Battle Reactions** | Restrained: `+14 SP` → `thoughtful`, `SHIELD` → `amused`, hostile hit → `irritated`, major swing → `disappointed` (**0 instability**) | Sharper: unexpected reactions → `thoughtful`, small synth (`≤ 6 SP`) → `disappointed`, `+14 SP` → `concerned`, major swing → rare Gen-2 `instability` (`14s` cooldown) | Distinct from Lavoisier (`≤ 6 SP` → `amused`; no `SHIELD` / unexpected-reaction hooks) |

**Spec-to-Implementation Alignment Note:** Every motion channel specified in `MENDELEEV_ANIMATION_SPECIFICATION.md` §8 was implemented cleanly. One minor simplification vs. §6 prose: the encounter entrance sweep reuses the shared `fx_scanbar` downward calibration sweep (`1.05s`) rather than adding a second orthogonal entrance SVG pass, keeping the SVG DOM lightweight with zero extra layers.

---

## 4. Verification & QA Results (Phase 8)

### Automated Tests (`15 / 15` Suites Passed)
- **Syntax Validation:** `31 / 31` JS files pass `node --check`.
- **`stage3e3_mendeleev_animation_test.js`:** **5 / 5 PASSED** (registry/manifest/SVG parity, 60-second dual-variant kinetic simulation, 8 expressions & beard-safe speech bounds `≤ 5.6px`, Mendeleev battle reactions & cooldowns, Studio & Reduced/Off freeze).
- **Full Regressions:** `stage3e2` (`4/4`), `stage3d4` (`6/6`), `stage3d2` (`3/3`), `stage3d1` (`4/4`), `stage3c` (`5/5`), `stage3b` (`6/6`), `stage3a` (`4/4`), `stage2` (`4/4`), Story (`8/8`), PDF Cards (`7/7`), Unstable & Showcase (`4/4`), Tutorial (`7/7`), Desktop DOM (`36` IDs), Mobile PWA Build (`62` IDs).

### Live Browser Verification (0 Console Errors, 0 Failed PNG/SVG Requests)
1. **Desktop Studio (`1280×860`, `index.html`):**
   - Confirmed Lavoisier loads untouched first (`sci_lav_001_frontier` & `sci_lav_001_institute`), switched to **Mendeleev (`SCI-MEN-002`)**, verified all 13 PNG layers loaded cleanly for both variants (`0` failed PNG/SVG requests).
   - Verified live idle contrast over `t=0s..8s`: Frontier executed L-shaped periodic iris hop (`translate(-1.80 1.30)`) and stepped axial shift (`rotate(-0.95 496 660)`), while Institute held steady diaphragmatic poise (`rotate(0.00)`, `iris translate(0.00 0.00)`, zero seam drift).
   - Verified all 8 expressions individually, `🗣 Test Cadence (3s)` automatic return from `Speaking: On` → `Speaking: Off`, live Battle Reaction Tester (`player_synth_big` → `Frontier concerned | Institute thoughtful`, immediate repeat → `cooldown(global_cooldown)`, `hostile_hit` → `irritated`, `major_swing` → `Frontier instability | Institute disappointed`), Variant Views (`Institute` / `Frontier` / `Side-by-Side`), Layer Inspector toggle (`layer_hair_front`), Reduced & Off zero-delta static freeze over `500ms`, and Frontier Mendeleev Encounter Intro (`SCI-MEN-002 • Gen-2 Drifting`, auto-return `Speaking` → `Idle`, Line 2 `explaining`).
2. **Desktop Live Encounters (`1280×860`, `index.html`):**
   - **Classic Mode Static Fallback (`Dr. Mendeleev (AI)`):** Confirmed `#battle-opp-animated-portrait === 0` and `.mini-avatar === 1` (static fallback preserved).
   - **Frontier Mendeleev Live Battle (`enc_rogue_mendeleev`):** Mounted `sci_men_002_frontier` (`.mini-avatar === 0`), played 3 full turns with persistent portrait and live reaction (`neutral` → `disappointed`), verified clean `#battle-opp-animated-portrait === 0` teardown on return to Main Menu.
   - **Lavoisier Preservation (`ch0_m2_lavoisier`):** Verified `sci_lav_001_institute` still mounts unchanged with `.mini-avatar === 0`.
   - **Academy Institute Mendeleev Live Battle (`ch0_m3_mendeleev`):** Mounted `sci_men_002_institute` (`.mini-avatar === 0`), played 2 full turns with portrait persisting across renders and zero `instability` drift, crisp dead-center framing in opponent header.
3. **Mobile Performance & Viewports (`390×844` & `320×568`, `mobile.html`):**
   - Verified dual-rig Mendeleev Studio (`116×145px` side-by-side, `body = 375.2px ≤ 390px`, zero horizontal overflow), expressions, speaking cadence, battle reaction tester, and `Reduced`/`Off` 500ms static freeze + `Full Motion` live resume.
   - Verified live Frontier Mendeleev mobile battle across 2 full turns at `390×844` and resized to `320×568` (`body = 304.8px ≤ 320px`, `#battle-opp-animated-portrait = 42×42px`, `.mini-avatar === 0`, zero overlap or clipping with name/SP, `0` failed requests, `0` console errors).

### Performance Observations & Minor Non-Blocking Notes
- **Lazy PNG Loading Confirmed:** All 4 `master_layered.svg` descriptors (~7–11 KB each) live in `characterSvgRegistry.js`, while each character's 13 PNG layers (`1.84–2.04 MB`) are fetched strictly on demand when that specific character mounts (zero Mendeleev PNG bandwidth consumed on Main Menu or during Lavoisier encounters).
- **Single Shared RAF Loop:** Both side-by-side Mendeleev rigs share one `requestAnimationFrame` callback and immediately cancel RAF in `Reduced`, `Off`, hidden-tab, or zero-rig states.
- **Minor Studio Scroll Note (Desktop `1280×860`):** Because `.poc-stage-sticky` keeps both portraits pinned while scrolling controls, the lower controls (`#btn-poc-enc-preview` / Battle Reaction Tester) sit below the fold on `860px`-tall viewports until scrolled down `~180px` inside the modal body. Completely usable with normal scrolling; noted for future Stage 3E.4 polish if a more compact desktop Studio header is desired.
- **Visual Deliverables:**
  - Frontier 8-expression sheet: `assets/characters/sci_men_002_frontier/qa/expressions_preview_sheet.png`
  - Institute 8-expression sheet: `assets/characters/sci_men_002_institute/qa/expressions_preview_sheet.png`
  - Side-by-side personality comparison sheet: `assets/characters/sci_men_002_frontier/qa/personality_comparison_sheet.png`
  - Frontier before/after body QA sheet: `assets/characters/sci_men_002_frontier/qa/before_after_articulation_qa.png`

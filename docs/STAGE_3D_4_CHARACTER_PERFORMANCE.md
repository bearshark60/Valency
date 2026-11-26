# VALENCY — Stage 3D.4: Character Performance, Expression Refinement & Personality Animation

**Date:** 2026-11-24  
**Scope:** Performance refinement of existing production painterly rigs **Frontier Lavoisier (`sci_lav_001_frontier`)** and **Institute Lavoisier (`sci_lav_001_institute`)**.  
**Preservation Guarantee:** Zero changes to approved painterly artwork, 13 separated PNG layers, `master_layered.svg` assets, `characterRegistry.js`, `gameEngine.js`, SP math, cards, AI logic, or Classic/Academy/Tutorial gameplay.

---

## 1. Distinct Character Animation Personalities (Part A)

Both rigs share `src/presentation/characterRigEngine.js` while executing unmistakably distinct behavioral profiles defined in `assets/characters/sci_lav_001_frontier/rig_manifest.json` and `assets/characters/sci_lav_001_institute/rig_manifest.json` (mirrored in `V.CharacterRig.BUILTIN_CHARACTERS` for offline `file://` parity).

| Behavioral Dimension | Frontier Lavoisier (`sci_lav_001_frontier`) — *Human Reconstruction* | Institute Lavoisier (`sci_lav_001_institute`) — *Preserved Intelligence* |
|---|---|---|
| **Core Personality** | Composed, intelligent, observant, deliberate, occasionally unsettling | Precise, formal, controlled, highly composed, almost unnaturally perfect |
| **Breathing Rhythm** | Organic asymmetric curve (`5300ms ± 650ms` cycle-to-cycle variance, `2.1px` rise, `0.42%` ribcage scale) | Metronomic restrained cadence (`6200ms ± 0ms`, `0.95px` rise, `0.18%` ribcage scale) |
| **Head Posture** | Dwell-and-shift stillness holds (`3.6–7.2s`), small deliberate tilts (`±1.35°`), occasional subtle `24%` posture self-correction (`±0.22–0.38°`) | Long formal stillness holds (`6.5–11.0s`), minimal symmetrical adjustments (`±0.42°`), `0%` self-correction jitter |
| **Eye Tracking** | Independent saccades (`2.8–6.2s`, `±3.8px`), `44%` center-return bias, subtle right-eye convergence lag (`44ms`) | Formal locked binocular gaze (`4.8–8.2s`, `±2.1px`), `62%` center-return bias, `0ms` inter-eye lag |
| **Blinking** | Natural intervals (`3.4–7.2s`), `10%` soft double-blink chance, `28%` subtle right-eyelid lag (`54ms`) | Precise consistent intervals (`4.9–5.5s`), `0%` double-blink, `0%` asymmetry (`allowAsymmetricBlink: false`) |
| **Facial Transition Sync** | Subtle natural lag on mouth/jaw settle (`τ = 185ms` vs `132ms` upper face) | Crisp uniform synchronization (`τ = 105ms` across all parts) |
| **Idle Micro-Expressions** | Enabled (`8.5–15.5s` interval, `1.6–2.6s` dwell): `observant_squint`, `quiet_ponder`, `subtle_tension` | Disabled (`allowIdleMicroExpressions: false`) — serene archival poise |
| **Reconstruction Instability** | Rare & restrained (`14.5–23.5s` idle / high-pressure battle trigger, `460ms` pulse) | Strictly disabled (`allowReconstructionGlitch: false`, seam opacity locked at `0.00`) |

---

## 2. Refined Idle Performance (Part B)

Continuous sinusoidal bobbing (`Math.sin` head sway / continuous torso wave) was replaced in `src/presentation/characterRigEngine.js` with three natural performance primitives:
1. **Asymmetric Respiratory Curve (`evalBreathCurve`):** Smooth inhale (`0–38%`), soft upper-chest poise (`38–48%`), unhurried exhale (`48–90%`), and quiet resting stillness (`90–100%`) driving both subtle vertical lift and ribcage expansion around the torso pivot.
2. **Dwell-and-Shift Head Posture:** Calm motionless holds punctuated by deliberate small shifts (`postureEaseMs`: `460ms` Frontier / `360ms` Institute) so characters hold dignified presence without constant floating or rocking.
3. **Fleeting Frontier Micro-Expressions:** During `neutral` non-speaking idle, Frontier Lavoisier occasionally shows a quiet observant squint, brief pensive brow tension, or subtle jaw set before easing cleanly back to calm composure.

---

## 3. All 8 Facial Expressions Refined (Part C)

Every expression coordinates **eyebrows** (`browLeftY/Rot`, `browRightY/Rot`), **upper & lower eyelids** (including per-eye `lidUpperLeftOffset`/`lidUpperRightOffset`), **gaze bias**, **mouth** (`mouthScaleX/Y`, `mouthY`, `mouthRot`, `mouthOpen`), **jaw** (`jawY`), and **head posture** (`headTilt`, `headShiftX`, `headShiftY`) for clarity at both full Studio bust scale and `42–48px` circular battle mini-portraits.

| Expression ID | Frontier Label & Key Coordinated Pose | Institute Label & Key Coordinated Pose |
|---|---|---|
| `neutral` | **Neutral / Composed** — calm baseline, `0.08` resting temple seam | **Archival Composed** — symmetrical baseline, `0.00` seam |
| `thoughtful` | **Thoughtful** — asymmetric left furrow / right lift, narrowed lids, upper-left gaze (`-3.2, -1.6`), `-2.4°` head incline | **Analytical** — symmetrical furrow (`±2.6°`), measured gaze (`-1.8, -0.9`), `-1.1°` incline |
| `amused` | **Slightly Amused** — wry lifted right brow (`-4.4px`), warm lower-lid crinkle (`-3.0`), widened slightly tilted smile (`1.09×, -1.4°`), `+1.9°` tilt | **Courteous Approval** — symmetrical lifted brows (`-2.8px`), poised smile (`1.07×`), `+0.9°` tilt |
| `explaining` | **Explaining Principle** — elevated open brows (`-4.2/-3.8px`), alert lids (`-1.8`), open mouth + supportive jaw drop (`jawY: +3.4`), engaged forward poise | **Lecturing** — symmetrical lifted brows (`-3.4px`), metered mouth/jaw (`jawY: +2.8`), upright posture |
| `concerned` | **Concerned** — steeply angled inner brows (`-7.2°/+6.8°`), tightened mouth (`0.90×, +2.0px Y`), subtle pull-back (`-1.5°`), `0.16` seam tension | **Cautionary** — symmetrical furrow (`±5.2°`), firm mouth (`0.93×`), `-0.8°` incline |
| `disappointed` | **Disappointed** — drooped brows (`+3.6px`), heavy upper lids (`+6.4px`), downward gaze (`+2.8px`), downturned mouth (`+2.8px`), bowed head (`-2.8°`, `+3.2px Y`) | **Regretful** — symmetrical heavy lids (`+5.0px`), downward gaze (`+2.0px`), formal bow (`-1.6°`, `+2.0px Y`) |
| `irritated` | **Irritated** — sharp inward brow pull (`+4.4/+4.8px`, `+7.8°/-8.2°`), narrowed stare (`+4.8/-3.0`), pressed lips (`0.88×0.84`), set jaw (`-1.0`), `0.24` seam tension | **Stern Correction** — crisp symmetrical furrow (`±5.6°`), narrowed eyes (`+3.6/-2.2`), firm jaw (`-0.6`) |
| `instability` | **Reconstruction Instability** — asymmetric brow split, widened lagging right lid (`-1.8px`), right-iris spatial desync (`+3.8, -1.6`), `+2.3°` head cant, `0.82` seam & `0.72` lattice FX | **Stable Hologram (No Drift)** — **strictly 0 offsets & 0 seam/FX** (remains completely serene) |

---

## 4. Dialogue & Speaking Performance (Part D)

- **Honest Restrained Cadence (No Fake Lip-Sync Claim):** Because Valency dialogue is text-based without recorded voice audio, speaking uses a **phrase-structured natural cadence state machine** (`_stepSpeakingCadence`) rather than fake phoneme lip-sync or repetitive sine-wave oscillation.
- **Phrase Structure:** Alternates `3–6` syllables (`125–245ms` Frontier / `140–210ms` Institute, bell-enveloped mouth openings) separated by brief consonant gaps (`55–115ms`) and genuine **clause/breath pauses (`340–680ms`)** where the mouth closes smoothly to resting composure.
- **Coordinated Emphasis:** Stressed syllables apply subtle supportive jaw drop, slight vowel width modulation, soft brow lift (`-1.45px` Frontier / `-1.0px` Institute), and gentle conversational head micro-nods (`+1.55px` / `+0.85px`).
- **Auto-Return to Idle in Encounter Dialogue:** `openFrontierEncounterIntro` (`src/ui/frontierUI.js`) uses `rig.speakForDuration(ms)` scaled to line length (`1.9–4.2s`) and updates `#fenc-speak-badge` from `Speaking` → `Idle` once finished, smoothly easing mouth, jaw, brows, and head back to resting stillness.

---

## 5. Contextual Battle Reaction Mapping & Cooldowns (Part E)

Implemented in `evaluateBattlePortraitReaction` & `reactOpponentPortraitToEvents` (`src/ui/app.js`), strictly decoupled from `gameEngine.js` (zero effect on SP, cards, AI, turn order, or match outcomes):

| Priority | Trigger Context | Expression | Notes / Cooldown |
|---|---|---|---|
| **0 (Grace)** | First `1.8s` after battle mount | `neutral` | Holds dignified opening composure during initial deal |
| **4 (Rare)** | Frontier AI only: `oppSPDrop >= 8`, or `playerSP >= 16 && lead >= 6`, or `playerSP >= 18` | `instability` + glitch | `14s` minimum cooldown; **strictly blocked on Institute AI** |
| **3 (Disruption)** | Hostile events hitting opponent (`ACID_RAIN`, `BOND_CLEAVAGE`, `EN_TAKEOVER`, `ELECTROLYSIS`, `PRECIPITATION`, `HALF_LIFE_DECAY`, `RAPID_OXIDATION`, `LIQUID_EMBRITTLEMENT`, `CHLORAMINE_HAZARD`) | `irritated` (`disappointed` if `lostSP >= 8`) | `1.1s` min cooldown; `2.9s` hold before settling to `neutral` |
| **3 (Tactical)** | Shield strip / delay (`OXIDATION`, `IONIZATION_SURGE`, `REACTION_DELAY`, `TURN_SKIPPED`) | `concerned` | `1.1s` min cooldown; `2.9s` hold |
| **2 (Advantage Loss)** | Opponent unstable decay, `oppSPDrop >= 6`, player overtakes to `>= 6 SP` lead, or `playerSP >= 16 && lead >= 6` | `disappointed` | `2.2s` min cooldown; `2.8s` hold |
| **1 (Synthesis)** | Player synthesizes: `>= 12 SP` → `concerned`; `7–11 SP` → `thoughtful`; `<= 6 SP` → `amused`. Opponent synthesizes: `>= 10 SP` → `amused`; else `explaining`. | Contextual | `2.2s` global cooldown; `4.5s` same-expression deduplication; `2.4s` hold |

---

## 6. Performance, Accessibility & Live Acceptance Results (Parts F & G)

### Automated Verification
- **Syntax Check:** `31 / 31` JS source files pass `node --check`.
- **Stage 3D.4 Suite (`tests/stage3d4_performance_test.js`):** `6 / 6` passed (personality & JSON parity, 60-second 2000-step idle simulation, 8 distinct expression signatures, phrase-structured speaking pauses & idle settle, battle reaction cooldowns/deduplication/Frontier-only instability, Reduced/Off accessibility freeze).
- **Full Regression Suite:** Stage 3D.2 (`3/3`), Stage 3D.1 (`4/4`), Stage 3C (`5/5`), Stage 3B (`6/6`), Stage 3A (`4/4`), Stage 2 (`4/4`), Story System (`8/8`), PDF Cards (`7/7`), Unstable & Showcase (`4/4`), Tutorial (`7/7`), Desktop DOM (`36 IDs`).

### Live Browser Acceptance Testing
> **Video Recording Tooling Disclosure:** The built-in webview browser verification environment captures direct static screenshots and live DOM/SVG attribute telemetry over real wall-clock intervals, and cannot record `.mp4` or `.webm` video files. All behavioral checks below were verified directly in the live browser with timed multi-point sampling and host-verified screenshots.

1. **Desktop 60-Second Side-by-Side Idle (`1280×860`, `index.html` Studio):** Observed both Frontier and Institute Lavoisier live across `> 60s` (`t=0s` through `t=120.4s`). Confirmed Frontier organic breathing, dwell-and-shift head posture, wider gaze shifts (`-3.25..0.57px`), subtle L/R iris lag, and idle micro-expression crystal tension (`0.08 → 0.11`), while Institute remained serene, symmetrical (`±0.22px` locked gaze), and strictly `0` seam/drift. `0` console errors, `0` failed PNG/SVG requests.
2. **All 8 Expressions & Speaking Cadence (Desktop Studio):** All 8 expressions produced verified multi-part SVG transform deltas on both rigs; speaking toggled live syllable openings (`jaw +0.50..+1.72`) interspersed with genuine closed-mouth pauses (`jaw +0.01`, `scale(1.000 1.001)`) and settled cleanly when toggled off.
3. **Encounter Intro Dialogue Return-to-Idle:** Mounted Frontier Lavoisier in `#fenc-animated-stage`, verified `#fenc-speak-badge` started as `Speaking`, naturally returned to `Idle` after line duration (`4.5s` check), and transitioned to Line 2 (`explaining`, `Speaking`) on `Next Dialogue Line →`.
4. **Reduced & Off Modes (Desktop & Mobile):** Both modes verified exact zero-delta static freeze over `500–600ms` on both rigs (`reducedUnchanged: true`, `offUnchanged: true`), then restored cleanly to `Full Motion`.
5. **Complete Live Battles (Desktop `1280×860`):**
   - **Academy Institute Lavoisier (`ch0_m2_lavoisier`):** Mounted `sci_lav_001_institute` (`.mini-avatar === 0`), played 13 turns to **Examination Passed** (`35–8 SP`), observed `neutral` and `disappointed` reactions with **zero** `instability`, and verified `#battle-opp-animated-portrait === 0` teardown on return to Main Menu.
   - **Frontier Lavoisier (`enc_rogue_lavoisier`):** Mounted `sci_lav_001_frontier` (`.mini-avatar === 0`), played 12 turns to completion (`16–30 SP`), observed `neutral`, `disappointed`, and rare `instability` reactions (14s cooldown preventing spam), and verified clean `#battle-opp-animated-portrait === 0` teardown on return to Main Menu.
6. **Mobile Performance & Viewports (`390×844` & `320×568`, `mobile.html`):** Dual-rig Studio (`116×145px` side-by-side, `0px` horizontal overflow), expressions, speaking toggle, Reduced/Off static freeze, and live Frontier battle header (`42×42px` circular frame, `.mini-avatar === 0`, zero overlap/clipping at both `390×844` and `320×568`, `0` console errors, `0` failed PNG/SVG requests).

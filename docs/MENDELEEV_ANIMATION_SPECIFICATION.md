# VALENCY — Stage 3E.1: Dmitri Mendeleev Animation Specification

**Document Status:** Preproduction Animation Identity Specification (Stage 3E.1)  
**Applies To:** Institute Mendeleev (`sci_men_002_institute`) & Frontier Mendeleev (`sci_men_002_frontier`)  
**Core Mandate:** Establish an original, unmistakable kinetic vocabulary for Mendeleev that communicates his personality as a towering 19th-century Periodic Architect — **without** copying Lavoisier's breathing curve, dwell-and-shift tilts, wandering saccades, blink lag, or Gen-1 temple glitch.

---

## 1. Kinetic Identity Summary: Mendeleev vs. Lavoisier

| Motion Channel | Lavoisier (Existing Baseline — Do Not Copy) | Institute Mendeleev (`SCI-MEN-002-INST`) | Frontier Mendeleev (`SCI-MEN-002`) |
|---|---|---|---|
| **Breathing Rhythm** | Frontier: `5.3s ± 650ms` smooth organic wave. Institute: `6.2s` steady light rise. | **Deep Diaphragmatic Pause-Cadence:** Slow, authoritative `6.8s` cycle with a prolonged held crest (`20%` poise hold) and grounded `1.1px` shoulder mass. | **Heavy Thoracic Thought-Breath:** `5.9s` base with occasional deeper contemplative sighs (`1.28×` amplitude) and rare brief mid-calculation breath arrests (`~900ms` pause). |
| **Head Posture** | Frontier: frequent `3.6–7.2s` lateral tilts (`±1.35°`) + `24%` small posture self-corrections. | **Anchored Lecturer Bearing:** Virtually `0°` lateral tilt (`±0.18°` max); uses calm **vertical chin-level & forward-lean weight shifts** (`7.5–12.0s` holds). | **Column-Indexing Axial Shifts:** Long statuesque stillness (`5.0–9.5s`) broken by **crisp, stepped angular reorientations** (`postureEaseMs: 280ms`, zero nervous wobble — snaps cleanly into new plane like aligning a table). |
| **Eye Tracking** | Frontier: random center-biased wandering saccades + soft `44ms` right-eye lag. | **Tabular Horizontal Sweep:** Methodical horizontal left→center→right row scans (`-2.2 → 0 → +2.2px`, near-zero vertical wander) before locking onto the player. | **Dual-Tempo Periodic Grid Scan (Gen-2):** Crisp **L-shaped orthogonal hops** (horizontal row sweep → vertical column drop → intense lock). Left eye initiates horizontal step; right eye snaps into alignment **`85ms` later in a clean stepped convergence**. |
| **Blink Pattern** | Frontier: `3.4–7.2s`, `10%` soft double-blink, `28%` `54ms` right-lid lag. | **Deliberate Dean Gravitas Blinks:** Unhurried, wide intervals (`5.8–7.6s`), heavier `168ms` symmetrical closure, `0%` double-blink. | **Prolonged Unblinking Fixation + Heavy Reset:** Intense dry stares (`6.5–11.5s`), heavy `195ms` reset blink, and rare (`18%`) **staggered half-lid shutter** (left upper lid dips to `72%` pause briefly before both lids complete the reset). |
| **Idle Micro-Expressions** | Lavoisier's `observant_squint`, `quiet_ponder`, `subtle_tension`. | **Disabled** (`allowIdleMicroExpressions: false`) — serene archival monumentality. | **Mendeleev-Specific Set (`10.0–17.5s`):** `row_verify_furrow` (brief symmetric brow press + horizontal eye step), `heavy_nod_ack` (tiny authoritative vertical chin drop), `lattice_arrest` (momentary stare lock + slight neck-vein shimmer `+0.08`). |
| **Speaking Cadence** | Smooth salon 3–6 syllable phrases (`125–245ms`), light brow lift. | **Measured Declarative Lecture:** Slower weightier clauses (`2–4` syllables, `165–250ms`), emphatic downward vertical brow-ridge beats, longer `480–720ms` authoritative pauses. | **Staccato Analytical Bursts:** Crisp `2–5` syllable analytical strikes (`115–205ms`) separated by **long, charged evaluative silences (`520–920ms`)** while eyes keep scanning horizontally. |
| **Reconstruction FX** | Gen-1 whisper-faint temple seam (`0.08 → 0.82`) + single right-eye sinusoidal float + hex reticle. | **Strictly ZERO** seams, veins, ocular divergence, or telemetry glitches. | **Gen-2 Periodic Lattice Refraction (`12.0–19.0s`):** Translucent violet-cyan neck/collar & temple veins (`0.14 → 0.84`), orthogonal L/R ocular divergence (`380ms` stepped snap-back), bilateral luminance-contrast pulse, and `[ ? ] EKA-SYNC // GRP.IV` bracket telemetry. |

---

## 2. Detailed Idle Animation Behavior

### 2.1 Breathing Mechanics
- **Institute Mendeleev (`breathProfile: "diaphragmatic_poise"`):**
  - `0% → 32%`: Deep, measured chest expansion (`smoothstep`).
  - `32% → 52%`: **Held architectural poise** (chest remains broad and steady — communicating unshakeable institutional composure).
  - `52% → 88%`: Controlled, weighted exhale.
  - `88% → 100%`: Still resting base.
  - Amplitude: `breathingAmplitudePx: 1.1`, `chestScaleAmplitude: 0.0022`, `breathingPeriodMs: 6800`, `breathingVarianceMs: 0`.
- **Frontier Mendeleev (`breathProfile: "thoracic_contemplative"`):**
  - Base cycle `5900ms ± 900ms`, `breathingAmplitudePx: 2.3`, `chestScaleAmplitude: 0.0046`.
  - **Signature Cognitive Variance:** Every `4th–6th` breath cycle triggers either (a) a **deep contemplative sigh** (`1.28×` amplitude, slower exhale) or (b) a **brief cognitive breath arrest** (`~850ms` stillness freeze at crest when an idle `row_verify_furrow` or ocular grid scan activates).

### 2.2 Head Posture & Secondary Mass
- **No Continuous Floating/Bobbing:** Retains Valency's zero-sine-wave discipline.
- **Institute (`postureStyle: "anchored_vertical"`):** Holds stillness for `7.5–12.0s`; adjustments favor tiny vertical chin-elevation shifts (`±0.9px Y`, `±0.18°` max tilt) so his silhouette reads like a bronze/holographic university monument.
- **Frontier (`postureStyle: "stepped_axial"`):** Holds intense stillness for `5.0–9.5s`, then executes crisp, deliberate shifts (`postureEaseMs: 280ms`, `postureMaxTiltDeg: 0.95°`, `postureMaxShiftYPx: 1.9px`, `postureCorrectionChance: 0`). Rather than Lavoisier's uncertain micro-corrections, Mendeleev lands cleanly on an exact angle — conveying iron conviction.

---

## 3. Eye-Tracking & Blinking Choreography

### 3.1 Eye-Tracking Behavior
- **Institute Mendeleev (`gazePattern: "tabular_row"`):**
  - Every `4.5–7.5s`, eyes execute a deliberate horizontal row check (`x ∈ {-2.2, 0, +2.2}px`, `y ∈ {-0.3, +0.3}px`) with `65%` return-to-player lock and `0ms` inter-eye lag. Feels calm, methodical, and evaluative.
- **Frontier Mendeleev (`gazePattern: "periodic_grid_dual_tempo"`):**
  - Every `2.4–5.4s`, eyes select from a **2D discrete periodic lattice** (`x ∈ {-3.6, -1.8, 0, +1.8, +3.6}px`, `y ∈ {-1.6, 0, +1.4}px`) favoring **orthogonal transitions** (change X *or* change Y per hop, mimicking tracing a row and then dropping down a group column!).
  - **Gen-2 Dual-Tempo Convergence:** Left iris eases quickly (`τ = 68ms`), while right iris waits **`85ms`** before snapping sharply (`τ = 55ms`) to converge on the same coordinate. Subtle enough to pass as intensity at first glance, deeply uncanny when noticed.

### 3.2 Blink Patterns
- **Institute Mendeleev:** `5800–7600ms` interval, `168ms` symmetrical heavy-lid closure (`close 34% / hold 18% / open 48%`), `0%` double-blink, `0%` asymmetry.
- **Frontier Mendeleev:** `6500–11500ms` prolonged analytical stare intervals, `195ms` weighty reset blink. On `18%` of blinks, triggers a **half-lid shutter** (viewer-left upper lid lowers to `72%` for `140ms` as if squinting at a misaligned column, followed immediately by a full synchronized reset blink).

---

## 4. Speaking Cadence & Beard-Safe Articulation

Because Valency uses text-driven dialogue without recorded voice tracks, Mendeleev uses the engine's honest **phrase-structured cadence state machine** with character-specific rhythm and beard-safe bounds:

| Parameter | Institute Mendeleev | Frontier Mendeleev |
|---|---|---|
| `phraseSyllablesMin / Max` | `2 / 4` (weighty declarative bars) | `2 / 5` (crisp analytical bursts) |
| `syllableMinMs / MaxMs` | `165 / 250` | `115 / 205` |
| `gapMinMs / MaxMs` | `75 / 120` | `50 / 95` |
| `pauseMinMs / MaxMs` | `480 / 720` (authoritative lecture beat) | `520 / 920` (charged evaluative silence) |
| `ampMin / ampMax` | `0.20 / 0.42` | `0.22 / 0.48` |
| `jawScaleFactor` (beard-safe cap) | `3.2px` max syllable jaw travel | `3.6px` max syllable jaw travel |
| `browEmphasisPx` | `+1.1px` (downward gravitas press on stressed clauses!) | `-1.3px` / `+1.2px` alternating emphasis |
| `headEmphasisPx` | `+1.1px` slow authoritative nod | `+1.9px` crisp declarative down-beat |

- **Critical Beard-Rigging Constraint:** Standard Lavoisier speech multiplies `effectiveMouthOpen * 4.8` onto `layer_jaw_lower`. For Mendeleev, `jawSpeechScale` should be configurable per manifest (`3.2–3.6`) so his jaw & full beard articulate convincingly without detaching from the cheek planes or clipping the collar beneath.
- **Encounter Auto-Return:** Identical clean lifecycle via `rig.speakForDuration(ms)` — returns smoothly to grounded idle posture when a dialogue line finishes.

---

## 5. Battle Reaction Behavior (Decoupled Presentation Layer Only)

Mendeleev plugs into `evaluateBattlePortraitReaction` (`src/ui/app.js`) **without touching `gameEngine.js`, SP math, cards, or AI behavior**. To reflect Mendeleev's personality as a *Structured Periodic Architect*, his reaction mapping emphasizes **structural synthesis, shielding, and pillar loss**:

| Priority | Battle Context | Institute Mendeleev | Frontier Mendeleev | Cooldown / Hold |
|---|---|---|---|---|
| **0 (Opening Grace)** | First `1.8s` of battle | `neutral` (archival poise) | `neutral` (evaluating stare) | `1.8s` |
| **4 (Rare Gen-2 Trigger)** | Frontier ONLY: Opponent loses a shielded/high-SP pillar (`oppSPDrop >= 8`), OR player achieves `>= 16 SP` with `>= 6` lead, OR player hits `>= 18 SP` | **BLOCKED** (stays `concerned` / `disappointed`, zero drift) | `instability` + Gen-2 lattice pulse | `14.0s` cooldown |
| **3 (Hostile Pillar Strike)** | `ACID_RAIN`, `BOND_CLEAVAGE`, `ELECTROLYSIS`, `EN_TAKEOVER`, `PRECIPITATION`, `HALF_LIFE_DECAY` against Mendeleev | `irritated` (`disappointed` if `lostSP >= 8`) | `irritated` (fierce brow lock + `0.30` vein tension) | `1.1s` cooldown / `2.9s` hold |
| **3 (Shield / Delay Disruption)** | `IONIZATION_SURGE`, `OXIDATION`, `REACTION_DELAY`, `TURN_SKIPPED` | `concerned` (cautionary) | `concerned` (`0.24` vein tension) | `1.1s` cooldown / `2.9s` hold |
| **2 (Structural Advantage Lost)** | Unstable decay, `oppSPDrop >= 6`, or player pulls ahead by `>= 6 SP` | `disappointed` | `disappointed` (heavy downward bow + exhale) | `2.2s` cooldown / `2.8s` hold |
| **1 (Synthesis Recognition)** | Player builds high-SP compound (`>= 12 SP`) → `concerned`; medium (`7–11 SP`) → `thoughtful` (scanning periodic groups); small (`<= 6 SP`) → `disappointed` (Frontier) / `neutral` (Institute). Mendeleev builds `>= 10 SP` pillar → `amused`; else `explaining`. | Scholarly cadence | Analytical intensity | `2.2s` global / `4.5s` dedup / `2.4s` hold |

---

## 6. Frontier-Specific Gen-2 Reconstruction Effects (`sci_men_002_frontier` Only)

Designed explicitly around `VALENCY_VISUAL_DESIGN_BIBLE.md` §7 (**Generation 2 — Drifting**) and rendered using the existing 16-layer SVG contract (`layer_mech_crystal` + `layer_fx_reconstruction`):

1. **Resting Gen-2 Presence (`opacity: 0.14`):** Whisper-subtle translucent violet-cyan crystalline veins (`#a78bfa` / `#38bdf8`) along the shadowed left neck above the wing collar and left temple hairline — slightly more perceptible than Lavoisier's `0.08` Gen-1 line, confirming progression deeper into the Frontier.
2. **Periodic Lattice Pulse (`glitchIntervalMinMs: 12000`, `glitchIntervalMaxMs: 19000`, `glitchDurationMs: 420`):**
   - **Step A (`0–90ms`):** Veins flare smoothly (`0.14 → 0.84`); a crisp **3-cell periodic bracket overlay** (`[ ? ] EKA-SYNC // GRP.IV`) flickers cleanly near the upper-left temple/collar zone inside `layer_fx_reconstruction`.
   - **Step B (`90–330ms`):** **Orthogonal Ocular Divergence** — viewer-left iris steps horizontally (`-2.4px X`) while viewer-right iris snaps vertically (`+2.8px X, -2.6px Y`) as his two eyes momentarily read a row and a column independently; subtle bilateral shadow-side sheen pulses (`0.12` cool-violet glaze along viewer-left face contour).
   - **Step C (`330–420ms`):** Crisp, simultaneous snap back to binocular human lock; bracket fades to `0`; veins settle cleanly back to `0.14`.
3. **Encounter Entrance (`1.05s`):** Uses a vertical-column-then-horizontal-row calibration sweep (`fx_scanbar` + brief periodic grid fade) distinct from Lavoisier's single horizontal scan bar.

---

## 7. Reduced-Motion & Accessibility Behavior

Strictly honors `V.CharacterRig.setAnimationMode('reduced' | 'off')`, `V.isAnimationsEnabled()`, and `@media (prefers-reduced-motion: reduce)`:
- **Zero `requestAnimationFrame` Overhead:** The shared RAF loop immediately calls `cancelAnimationFrame` whenever mode is `reduced` or `off`, or when no rigs are mounted.
- **Static Keyframe Pose Snap:** Both Institute and Frontier Mendeleev snap cleanly to the current expression's static keyframe (`_applyPose(0, true)`), retaining full painterly legibility and emotional readability with zero continuous motion, zero blinking, zero ocular divergence, and zero CSS shimmer.
- **Frontier `instability` Safety:** In `reduced` / `off` modes, automatic timed instability pulses are completely suppressed; if `instability` is explicitly inspected in Studio, it displays a clean, non-flickering static pose.

---

## 8. Planned Backward-Compatible Engine Hooks (For Stage 3E.3 — Not Implemented Yet)

All Mendeleev-specific behaviors can be delivered cleanly inside `src/presentation/characterRigEngine.js` via **optional manifest fields** that default to Lavoisier's exact existing behavior when omitted (preserving 100% behavioral invariance on Lavoisier):
- `motionProfile.breathProfile`: `'organic_wave'` (default/Lavoisier) | `'diaphragmatic_poise'` | `'thoracic_contemplative'`
- `motionProfile.postureStyle`: `'dwell_shift'` (default/Lavoisier) | `'anchored_vertical'` | `'stepped_axial'`
- `motionProfile.gazePattern`: `'saccade_center'` (default/Lavoisier) | `'tabular_row'` | `'periodic_grid_dual_tempo'`
- `motionProfile.blinkStyle`: `'natural_asym'` (default/Lavoisier) | `'heavy_symmetrical'` | `'fixation_shutter'`
- `motionProfile.glitchStyle`: `'gen1_right_drift'` (default/Lavoisier) | `'gen2_orthogonal_lattice'`
- `motionProfile.idleMicroExpressions`: optional per-character array (defaults to existing Lavoisier array when undefined)
- `motionProfile.speakingCadence.jawSpeechScale`: optional scalar (defaults to `4.8` for Lavoisier; `3.2–3.6` for bearded Mendeleev)

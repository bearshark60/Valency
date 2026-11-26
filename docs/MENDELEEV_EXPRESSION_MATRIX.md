# VALENCY — Stage 3E.1: Dmitri Mendeleev Expression Matrix (8 Expressions)

**Document Status:** Preproduction Expression Specification (Stage 3E.1)  
**Applies To:** Institute Mendeleev (`sci_men_002_institute`) & Frontier Mendeleev (`sci_men_002_frontier`)  
**Engine Contract:** Uses Valency's canonical 8 expression IDs (`neutral`, `thoughtful`, `amused`, `explaining`, `concerned`, `disappointed`, `irritated`, `instability`) defined in `V.CharacterRig.DEFAULT_EXPRESSIONS`.  
**Acting Principle:** Mendeleev's sweeping mustache and full patriarchal beard partially frame his lower face. Therefore, **his heavy sculptural brows, eyelid aperture, eye-tracking geometry, and weighted head/chin posture carry 65%+ of emotional readability**, ensuring crisp clarity from `240×320` Encounter stages down to `42×42px` mobile circular battle headers.

---

## 1. Master 8-Expression Behavioral Specification

### 1. `neutral`
- **Labels:** Institute: *Archival Authority* | Frontier: *Calculating Stillness*
- **Emotional Intent:** Commanding intellectual presence at baseline — observant, weighty, unhurried. Institute radiates calm institutional equilibrium; Frontier carries a slightly more intense, evaluating stillness.
- **Eye Behavior:** Level, steady binocular focus centered on the player (`gazeBias: 0, 0`). Frontier sustains longer unbroken eye contact before executing periodic grid scans.
- **Eyebrow & Eyelid Behavior:** Heavy brows rest in a broad, straight architectural shelf; upper lids sit naturally slightly hooded (never wide-eyed/bleached sclera).
- **Mouth, Mustache & Jaw Behavior:** Mouth closed cleanly beneath the sweeping mustache (`mouthOpen: 0`, `jawY: 0`); beard hangs in calm natural gravity.
- **Head Posture:** Upright, broad-shouldered anchoring (`headTilt: 0°`). Institute centered symmetrically (`x=448`); Frontier holds his `~14°` three-quarter stance.
- **Distinctive Animation Detail:** Institute executes slow horizontal tabular eye checks across imaginary columns; Frontier holds `5–9.5s` statuesque stillness broken by crisp axial micro-reorientations and faint `0.14` resting neck/temple crystalline sheen.

---

### 2. `thoughtful`
- **Labels:** Institute: *Periodic Analysis* | Frontier: *Indexing the Table*
- **Emotional Intent:** Deep structural calculation — mentally mapping the player's compounds onto periodic groups and predicting upcoming vacancies.
- **Eye Behavior:** Eyes shift cleanly **horizontally laterally** (`gazeBiasX: -3.4px` Frontier / `-2.2px` Institute, minimal vertical drift `-0.4px`) as if reading across a periodic period row rather than gazing upward dreamily like Lavoisier.
- **Eyebrow & Eyelid Behavior:** Heavy inner brows compress **down and inward symmetrically** on Institute (`+2.2px Y, ±3.8°`), while Frontier shows a sharper sculptural ridge pinch (`+3.0/+1.4px Y, +5.4°/-3.2°`) with narrowed analytical lids (`lidUpper: +2.8px`, `lidLower: -1.8px`).
- **Mouth, Mustache & Jaw Behavior:** Lips tighten subtly (`mouthScaleX: 0.93`, `mouthY: -0.5px`), mustache edge draws marginally closer together; jaw stays firmly anchored (`jawY: -0.4px`).
- **Head Posture:** Subtle **forward-downward peer** (`headShiftY: +1.4px`, minimal tilt `-0.9°` Frontier / `0°` Institute) — leaning slightly closer to inspect the periodic pattern rather than tilting side-to-side like Lavoisier.
- **Distinctive Animation Detail:** During sustained `thoughtful` holds on Frontier, eyes perform crisp two-stop horizontal stepping (`-3.4 → -1.4 → -3.4px`) as though verifying adjacent group columns; seam opacity rises subtly (`0.14 → 0.18`).

---

### 3. `amused`
- **Labels:** Institute: *Scholarly Approval* | Frontier: *Exhilarated Recognition*
- **Emotional Intent:** Dignified intellectual satisfaction when witnessing genuine periodic mastery — never a sly aristocratic smirk like Lavoisier, but warm, formidable approval from a master architect seeing a proof click into place.
- **Eye Behavior:** Direct, bright engagement (`gazeBias: 0, -0.3px`) with pronounced **warm lower-lid crinkle** (`lidLower: -3.4px` Frontier / `-2.6px` Institute) — the unmistakable Duchenne eye-smile that reads clearly even over a full beard!
- **Eyebrow & Eyelid Behavior:** Outer brow tails lift generously (`browY: -3.8px` Frontier / `-3.0px` Institute, gentle outward arch `-2.8°/+2.8°`), opening the heavy brow shadow over the eyes.
- **Mouth, Mustache & Jaw Behavior:** Mouth widens cleanly (`mouthScaleX: 1.11`, `mouthY: -2.2px`, subtle `mouthOpen: 0.06`), lifting the center-to-outer curve of the mustache slightly while the jaw drops only `0.6px` so the beard stays seamlessly unified.
- **Head Posture:** Slight approving **chin lift & gentle single-axis poise** (`headShiftY: -1.6px`, `+0.8°` tilt Frontier / `0°` Institute).
- **Distinctive Animation Detail:** Frontier exhibits a brief softening of his gaze tempo (temporary synchronization of left/right eye tracking while genuinely impressed), contrasting his normally rigid dual-tempo scan.

---

### 4. `explaining`
- **Labels:** Institute: *Delivering Periodic Law* | Frontier: *Pronouncing Structure*
- **Emotional Intent:** Authoritative professorial instruction or proclamation — driving home a structural principle with gravitas.
- **Eye Behavior:** Direct, commanding gaze (`gazeBias: 0, -0.2px`), eyes open and alert (`lidUpper: -2.0px` Frontier / `-1.5px` Institute).
- **Eyebrow & Eyelid Behavior:** Both heavy brows elevate cleanly (`browY: -4.4px` Frontier / `-3.6px` Institute) to project authority and openness across a lecture hall.
- **Mouth, Mustache & Jaw Behavior:** Controlled open speech posture (`mouthOpen: 0.30` Frontier / `0.26` Institute, `mouthScaleY: 1.12`) with **beard-safe vertical jaw travel** (`jawY: +2.6px` max at expression rest, capped cleanly at `+5.4px` peak syllable stress so the lower beard never separates from cheek contours or exposes collar edges).
- **Head Posture:** Grounded upright elevation (`headShiftY: -1.8px`, `headTilt: +0.4°` Frontier / `0°` Institute) — speaking *down* with resonant authority rather than bobbing playfully.
- **Distinctive Animation Detail:** Punctuated by **emphatic vertical brow-ridge beats** and slow, single-stroke downward chin nods on stressed declarative clauses (`headEmphasisPx: +1.9px`), visually distinct from Lavoisier's lighter conversational nods.

---

### 5. `concerned`
- **Labels:** Institute: *Structural Caution* | Frontier: *Anomaly Detected*
- **Emotional Intent:** Serious analytical alarm when a compound pillar is threatened, a shield is stripped, or an unexpected reaction disrupts expected periodic order.
- **Eye Behavior:** Sharp, locked focus straight on the threat (`gazeBias: 0, +0.6px`) with zero idle wandering.
- **Eyebrow & Eyelid Behavior:** Thick inner brows pull steeply **upward and inward** (`browLeftRot: -8.0°`, `browRightRot: +7.6°` Frontier; `±5.8°` Institute; `browY: -2.8px`), creating dramatic classical forehead furrows above the nose bridge; eyelids tighten marginally (`lidUpper: +1.6px`, `lidLower: -1.8px`).
- **Mouth, Mustache & Jaw Behavior:** Mouth compresses slightly (`mouthScaleX: 0.90`, `mouthY: +1.8px`, `mouthOpen: 0`), pulling the mustache downward at the corners; jaw tightens subtly (`jawY: +0.6px`).
- **Head Posture:** Measured upright pull-back (`headShiftY: +1.2px`, `headShiftX: -0.8px` Frontier, `-1.1°` tilt) — recoiling slightly to re-assess the whole table.
- **Distinctive Animation Detail:** On Frontier, neck/temple crystalline veins brighten subtly to `seamOpacity: 0.24` as his internal periodic ledger flags an unpredicted variable; blink interval lengthens (tense fixation).

---

### 6. `disappointed`
- **Labels:** Institute: *Methodological Regret* | Frontier: *Disorder Rejected*
- **Emotional Intent:** Solemn, heavy professorial disapproval of sloppy stoichiometry, collapsed unstable compounds, or lost positional advantage.
- **Eye Behavior:** Weighted downward gaze (`gazeBiasY: +3.0px` Frontier / `+2.2px` Institute) looking down across the lab bench.
- **Eyebrow & Eyelid Behavior:** Heavy upper lids droop unmistakably (`lidUpper: +6.8px` Frontier / `+5.2px` Institute), while the massive brows sag low and slightly outward (`browY: +4.0px`, `browLeftRot: -4.8°`, `browRightRot: +4.8°`), casting a solemn shadow across the eyes.
- **Mouth, Mustache & Jaw Behavior:** Mouth settles downward (`mouthY: +2.6px`, `mouthScaleX: 0.91`, `mouthScaleY: 0.89`), mustache arches downward heavily; jaw rests low (`jawY: +1.0px`).
- **Head Posture:** Slow, weighty **forward-downward bow** (`headShiftY: +3.8px`, `headTilt: -1.4°` Frontier / `-0.8°` Institute) — heavy vertical gravitas rather than Lavoisier's angled side-tilt droop.
- **Distinctive Animation Detail:** Entering `disappointed` triggers a single unhurried heavy exhale beat on Frontier (shoulders drop `~1.8px`), amplifying the physical weight of his disapproval.

---

### 7. `irritated`
- **Labels:** Institute: *Stern Reprimand* | Frontier: *Formidable Displeasure*
- **Emotional Intent:** Controlled, granite-hard intellectual anger — provoked by hostile disruption (`ACID_RAIN`, `BOND_CLEAVAGE`, `ELECTROLYSIS`) or chaotic play that defies structure. Formidable and dignified, **never** shouting or cartoonish.
- **Eye Behavior:** Piercing, unblinking narrowed stare directly through the player (`gazeBias: 0, +0.4px`), lower lids pushed forcefully up (`lidLower: -3.6px` Frontier / `-2.6px` Institute), upper lids pressed low (`lidUpper: +5.2px` / `+3.8px`).
- **Eyebrow & Eyelid Behavior:** Mendeleev's signature heavy brows drive **sharply downward and inward into a fierce V-ridge** (`browY: +5.2px`, `browLeftRot: +8.8°`, `browRightRot: -9.2°` Frontier; `+3.8px, ±6.4°` Institute). Immediately unmistakable even at `42×42px`!
- **Mouth, Mustache & Jaw Behavior:** Lips pressed tight (`mouthScaleX: 0.86`, `mouthScaleY: 0.82`, `mouthY: +1.0px`), jaw clenched slightly upward (`jawY: -1.4px`) tightening the beard silhouette.
- **Head Posture:** Slight formidable **forward chin-drop** (`headShiftY: +1.8px`, `headTilt: +0.6°` Frontier / `0°` Institute) — peering fiercely from beneath the heavy brow shelf.
- **Distinctive Animation Detail:** On Frontier, neck/temple violet-cyan crystalline veins climb to `seamOpacity: 0.30` with crisp breathing arrest (shallow tense chest hold), visually radiating pressurized cognitive containment.

---

### 8. `instability`
- **Labels:** Institute: *Calibrated Archival Lock (No Drift)* | Frontier: *Gen-2 Lattice Desynchronization*
- **Emotional Intent:**
  - **Institute:** Strictly zero drift — demonstrates absolute Academy archival perfection (`all deltas = 0`, `seamOpacity = 0`, `fxOverlayOpacity = 0`).
  - **Frontier (Gen 2 — Drifting):** Reveals the uncanny truth beneath the towering 19th-century professor: a mind trying to hold a 1,000-cycle human reconstruction together while its underlying periodic-grid architecture bleeds through. Face remains eerily composed and dignified even as ocular alignment and crystalline veins briefly fracture.
- **Eye Behavior (Frontier Only):** **Orthogonal Dual-Axis Desynchronization** (distinct from Lavoisier's single right-eye float) — left iris locks slightly horizontal (`leftEyeDesyncX: -2.4px, Y: 0px`, scanning a row) while right iris snaps vertically off-axis (`rightEyeDesyncX: +2.8px, Y: -2.6px`, indexing a column), before snapping crisply back to binocular lock.
- **Eyebrow & Eyelid Behavior (Frontier Only):** Subtle asymmetric brow freeze (`browLeftY: +2.2px, +3.4°`; `browRightY: -2.6px, -2.0°`); left upper lid dips partially (`+2.4px`, half-shutter) while right upper lid widens sharply (`-2.4px`).
- **Mouth, Mustache & Jaw Behavior (Frontier Only):** Frozen composed lips with slight rigid micro-offset (`mouthScaleX: 0.96`, `mouthY: +0.6px`, `mouthOpen: 0.08`, `jawY: +0.6px`) — maintaining scholarly dignity even mid-fracture.
- **Head Posture (Frontier Only):** Crisp, slightly stiffened axial cant (`headTilt: -1.8°`, `headShiftX: -1.4px`, `headShiftY: -0.6px`).
- **Distinctive Animation Detail (Frontier Only):** `layer_mech_crystal` illuminates to `0.84` (revealing translucent violet-cyan crystalline veins along the neck/collar and left temple + subtle geometric glint along the deep beard shadow edge); `layer_fx_reconstruction` flashes (`0.74`) a crisp **periodic bracket telemetry grid** (`[ ? ] EKA-SYNC // GRP.IV`) and subtle bilateral shading-contrast pulse for `380–520ms` before snapping cleanly back to human composure.

---

## 2. Preproduction Parametric Target Preview (For Stage 3E.2 `rig_manifest.json`)

> *Note: These pixel deltas are preproduction targets scaled to the standard `896×1200` viewBox and will be fine-tuned against exact measured facial pivots after Stage 3E.2 master paintings are approved.*

### Frontier Mendeleev (`sci_men_002_frontier`) Target Deltas
| Expression | `browL (Y / Rot)` | `browR (Y / Rot)` | `lidUL / lidUR / lidLo` | `mouth (sX / sY / Y / Open)` | `jawY` | `head (Tilt / X / Y)` | `gaze (X / Y)` | `seamOp` |
|---|---|---|---|---|---|---|---|---|
| `neutral` | `0 / 0°` | `0 / 0°` | `0 / 0 / 0` | `1.00 / 1.00 / 0 / 0` | `0` | `0° / 0 / 0` | `0 / 0` | `0.14` |
| `thoughtful` | `+3.0 / +5.4°` | `+1.4 / -3.2°` | `+2.8 / +2.8 / -1.8` | `0.93 / 0.96 / -0.5 / 0` | `-0.4` | `-0.9° / -0.6 / +1.4` | `-3.4 / -0.4` | `0.18` |
| `amused` | `-3.8 / -2.8°` | `-3.8 / +2.8°` | `+0.4 / +0.4 / -3.4` | `1.11 / 1.05 / -2.2 / 0.06` | `+0.6` | `+0.8° / +0.4 / -1.6` | `0 / -0.3` | `0.12` |
| `explaining` | `-4.4 / -2.2°` | `-4.2 / +2.2°` | `-2.0 / -2.0 / 0` | `1.03 / 1.12 / +0.6 / 0.30` | `+2.6` | `+0.4° / +0.2 / -1.8` | `0 / -0.2` | `0.14` |
| `concerned` | `-2.8 / -8.0°` | `-2.6 / +7.6°` | `+1.6 / +1.6 / -1.8` | `0.90 / 0.94 / +1.8 / 0` | `+0.6` | `-1.1° / -0.8 / +1.2` | `0 / +0.6` | `0.24` |
| `disappointed` | `+4.0 / -4.8°` | `+4.0 / +4.8°` | `+6.8 / +6.8 / -0.2` | `0.91 / 0.89 / +2.6 / 0` | `+1.0` | `-1.4° / -0.4 / +3.8` | `-0.2 / +3.0` | `0.18` |
| `irritated` | `+5.2 / +8.8°` | `+5.4 / -9.2°` | `+5.2 / +5.2 / -3.6` | `0.86 / 0.82 / +1.0 / 0` | `-1.4` | `+0.6° / +0.4 / +1.8` | `0 / +0.4` | `0.30` |
| `instability` | `+2.2 / +3.4°` | `-2.6 / -2.0°` | `+2.4 / -2.4 / 0` | `0.96 / 0.94 / +0.6 / 0.08` | `+0.6` | `-1.8° / -1.4 / -0.6` | `L:-2.4,0 / R:+2.8,-2.6` | `0.84` |

### Institute Mendeleev (`sci_men_002_institute`) Target Deltas
- Strictly bilaterally symmetrical (`browLeftY === browRightY`, `browLeftRot === -browRightRot`, `lidUpperLeft === lidUpperRight`).
- Restrained `~72–80%` amplitude compared to Frontier; `headTilt` locked near `0°` (`-0.8°` max on `disappointed`); `seamOpacity === 0` across all 8 expressions; `instability` strictly locked to `0` on every channel.

---

## 3. Multi-Scale Readability Verification Plan (`240×320` → `42×42px`)
- **Primary Signal at `42×42px` Circular Battle Header:** Heavy brow slope/elevation + upper/lower eyelid aperture + vertical chin drop (`disappointed`) or fierce V-brow pinch (`irritated`) remain unmistakably legible even when the lower beard is cropped near the circular rim.
- **Beard-Safe Articulation Envelope:** Maximum jaw displacement is intentionally capped tighter than clean-shaven Lavoisier (`+2.6px` base / `+5.4px` peak speech vs. Lavoisier's `+3.4px` / `+7.3px`) so the full beard moves as a cohesive organic mass with zero chin-seam shear.

# VALENCY — Character Asset Production Standards & Repeatable Pipeline Guide (Stage 3D.1)

This guide defines the mandatory production workflow for all animated 2D Scientist portraits in Valency (beginning with `SCI-LAV-001` Antoine Lavoisier and reusable for Mendeleev, Pauling, Curie, and all future Frontier & Institute constructs).

---

## 1. Directory & Naming Convention
Every animated character lives in its own isolated asset folder so art can be upgraded, iterated, or swapped independently without touching gameplay or UI logic:

```text
assets/characters/<character_id>/
  master_layered.svg      # Mandatory UNFLATTENED 16-layer master artwork (800×1000 logical 4:5 bust)
  rig_manifest.json       # Layer IDs, pivot points, motion bounds, expression targets, AI family metadata
  reference_sheet.svg     # Front & 3/4 alignment reference, 8-expression thumbnails, color/material swatches
  exports/                # Optional future Rive (.riv) / Spine (.json+.atlas+.png) / PNG sprite slices
```

**Canonical Character IDs:**
- `sci_lav_001_frontier` — Frontier Construct: Antoine Lavoisier (Early Generation PoC)
- `sci_lav_001_institute` — Institute AI Hologram: Antoine Lavoisier (Clean Museum Contrast PoC)
- Future examples: `sci_men_002_frontier`, `sci_pau_003_frontier`, `sci_cur_004_frontier`

---

## 2. Mandatory 16-Layer Unflattened Structure
**CRITICAL RULE:** Never flatten the only copy of a character asset. Every `master_layered.svg` (and any future PSD/Krita/Clip Studio source exported to Rive/Spine) MUST preserve these exact semantic layer IDs in bottom-to-top paint order:

| Order | Layer Group ID | Purpose & Animation Binding | Hidden Under-Paint Requirement |
|---:|---|---|---|
| 1 | `layer_bg` | Restrained scientific backdrop, subtle molecular geometry, soft illumination | Extends edge-to-edge (`0,0` → `800,1000`) |
| 2 | `layer_hair_rear` | Back volume of hair / powdered queue behind neck & ears | Extends slightly inward behind head silhouette |
| 3 | `layer_clothing_rear` | Back collar / coat nape visible behind neck | Continuous behind neck base |
| 4 | `layer_neck` | Neck cylinder, sternocleidomastoid shading, collar shadow | Extends `25px` upward behind chin/jawline and `30px` downward behind cravat |
| 5 | `layer_clothing_front` | Coat lapels, ivory waistcoat, cravat, micro-molecular embroidery | Independent breathing transform pivot at `(400, 960)` |
| 6 | `layer_head_base` | Cranium, temples, cheekbones, ears, upper skin planes, subtle porcelain shading | Full skin fill painted **underneath** eyes, eyebrows, nose, mouth, and front hair! |
| 7 | `layer_jaw_lower` | Lower jaw / chin plane for subtle speech & irritation tension | Overlaps smoothly onto `layer_head_base` with soft alpha/gradient feathering |
| 8 | `layer_eye_left` | Viewer-left eye group (`eye_left_sclera`, `eye_left_iris`, `eye_left_lid_upper`, `eye_left_lid_lower`) | Sclera & iris sit behind eyelids; upper lid covers full sclera at `scaleY` close |
| 9 | `layer_eye_right` | Viewer-right eye group (`eye_right_sclera`, `eye_right_iris`, `eye_right_lid_upper`, `eye_right_lid_lower`) | Independent from left eye to allow subtle Frontier blink/tracking desync |
| 10 | `layer_brow_left` | Viewer-left eyebrow hair strokes & brow-ridge shadow | Skin painted continuously behind brow |
| 11 | `layer_brow_right` | Viewer-right eyebrow hair strokes & brow-ridge shadow | Independent height/tilt for `amused`, `thoughtful`, `irritated` |
| 12 | `layer_nose_detail` | Nose bridge highlight, tip shadow, nasolabial folds, cheek tension lines | Soft translucent shading layers over `layer_head_base` |
| 13 | `layer_mouth` | Mouth group (`mouth_cavity`, `mouth_upper_lip`, `mouth_lower_lip`, `mouth_corners`) | Full lower-face skin painted beneath mouth so open/closed speech never shows gaps |
| 14 | `layer_hair_front` | Powdered side curls, forehead hairline, stray strands | Translucent shadow cast onto forehead |
| 15 | `layer_mech_crystal` | Subtle micro-crystalline temple seam, geometric jaw hairline, collar molecular filigree | Resting opacity `<= 0.12` on Gen-1 Frontier; `0` on Institute holograms |
| 16 | `layer_fx_reconstruction` | Transient scanline sweep, brief hex reconstruction lattice, encounter lock-on glow | Driven strictly by runtime animation state; zero static clutter at idle |

---

## 3. Pivot & Transform Rigging Standards (`rig_manifest.json`)
Every character folder ships with a `rig_manifest.json` describing:
- `characterId`, `displayName`, `aiFamily` (`FRONTIER` | `INSTITUTE`), `generationStage` (`GEN_1_INTACT` .. `GEN_4_CONVERGENT` | `INSTITUTE_HOLOGRAM`)
- `viewBox`: `"0 0 800 1000"`
- `pivots`: exact `(x, y)` origins for `torso`, `head`, `jaw`, `eyeLeft`, `eyeRight`, `browLeft`, `browRight`, `mouth`
- `motionProfile`: breathing period/amplitude, head sway degrees, blink interval range, `allowAsymmetricBlink`, `allowReconstructionGlitch`, `glitchIntervalMs`
- `expressions`: parametric pose deltas for all 8 required expressions (`neutral`, `thoughtful`, `amused`, `explaining`, `concerned`, `disappointed`, `irritated`, `instability`)

Because `V.CharacterRig` reads `rig_manifest.json` (and embedded fallback registry for zero-CORS `file://` compatibility), **new characters can be added purely via asset files + manifest registration without writing custom animation code.**

---

## 4. Repeatable Checklist for Future Scientist Portraits
When onboarding the next Scientist (e.g., Mendeleev, Pauling, Curie):
1. Copy `assets/characters/sci_lav_001_frontier/rig_manifest.json` into `assets/characters/<new_id>/rig_manifest.json` and update `characterId`, `aiFamily`, `generationStage`, palette notes, and pivots.
2. Author the 16-layer unflattened `master_layered.svg` (or PSD → layered SVG / future Rive `.riv` export) ensuring hidden skin/collar under-paint exists beneath every movable facial part.
3. Produce `reference_sheet.svg` containing front-facing + 3/4 proportion guides, all 8 expression states, and color/material swatches.
4. Register the new character in `V.Visual.ASSET_MANIFEST.characters` and `V.CharacterRig.registerCharacter(...)`.
5. Bind `animatedPortraitId` on the target Frontier encounter or Story profile — zero changes to `gameEngine.js` or battle rules.
6. Verify in both Desktop (`1280×860`) and Mobile (`390×844` & `320×568`) with Animations ON and Animations OFF/Reduced Motion.

# VALENCY — Frontier Lavoisier (`SCI-LAV-001`) Concept Review, Layer Separation Plan & Future Animation Recommendation

**Status:** **PENDING VISUAL APPROVAL** — Concept artwork has been generated and preserved under `assets/characters/sci_lav_001_frontier/concepts/` and has **NOT** been committed as the final in-game portrait asset. Existing Academy/Classic portraits and the Stage 3D.1 functional SVG animation proof-of-concept remain untouched.

---

## 1. Concept Artwork Package (Preserved Uncommitted Source References)
All generated reference files use one consistent late-18th-century French gentleman facial identity (mature late-40s to early-50s, slight 3/4 orientation, composed intellectually confident expression, powdered silver-white hair, dark navy wool coat with subtle micro-molecular lapel embroidery, warm ivory silk waistcoat, white cravat, porcelain-warm skin, and whisper-faint hairline temple reconstruction seam):

1. **Primary Bust Portrait:** `assets/characters/sci_lav_001_frontier/concepts/lavoisier_bust_primary.jpg`
2. **Three-Quarter & Facial Close-Up Reference:** `assets/characters/sci_lav_001_frontier/concepts/lavoisier_closeup_3q_ref.jpg`
3. **Color, Material & Expression Reference Sheet:** `assets/characters/sci_lav_001_frontier/concepts/lavoisier_color_material_ref.jpg`

---

## 2. Approved Color & Material Specification

| Material / Region | Hex Reference | Visual Finish & Usage Rule |
|---|---|---|
| **Tailored 18th-c. Coat** | `#1c2a3f` (shadow `#0f1726`, fold `#2e425f`) | Fine matte wool; ultra-fine geometric molecular stitching along lapel edge only |
| **Restrained Cyan Rim Accent** | `#38bdf8` / `#5eead4` | Limited to one subtle lapel edge highlight, eye catchlight, and rare temple micro-seam |
| **Ivory Silk Waistcoat** | `#efe4cc` (shadow `#c8ba9d`) | Warm cream historical silk with subtle geometric embroidery & brushed silver buttons (`#cbd5e1`) |
| **Pleated Cravat & Collar** | `#f7f4ec` (shadow `#d0c9ba`) | Soft layered linen folds framing the jawline |
| **Porcelain-Warm Skin** | `#e8c6ad` (highlight `#f6e2d1`, shadow `#9d6d56`) | Almost fully human warmth with faint porcelain-smooth sheen across brow & cheekbones |
| **Powdered Gentleman's Hair** | `#dfe4ec` (highlight `#f8fafc`, shadow `#7c8b9e`) | Neatly arranged late-18th-century powdered curls & black velvet nape ribbon |
| **Subordinate Backdrop** | `#0b1320` → `#132136` | Dark twilight navy with whisper-faint analytical balance scale & molecular linework |

---

## 3. Animation-Ready Layer Separation Plan (For Post-Approval Production)
> **Important:** The concept images above are flattened painterly review illustrations and are **NOT** claimed as animation-ready layered files. Once approved by the director/user, the painterly master will be painted/separated in PSD/Krita/Clip Studio at `2048×2560` (4:5 master bust) with full continuous hidden under-paint behind every movable facial part:

| Layer Group | Separate Sub-Layers | Hidden Under-Paint & Rigging Requirements |
|---|---|---|
| **1. Background (`layer_bg`)** | Deep navy gradient, faint balance geometry, subtle atmospheric motes | Full edge-to-edge bleed (`2048×2560`) so camera/parallax sway never shows borders |
| **2. Rear Hair (`layer_hair_rear`)** | Back powdered volume, velvet nape ribbon | Extends `40px` behind ears and neck silhouette |
| **3. Clothing Rear (`layer_clothing_rear`)** | High standing navy coat collar nape | Extends smoothly behind neck base |
| **4. Neck (`layer_neck`)** | Neck skin cylinder + cast jaw shadow | Extends `80px` upward under chin/jawline and `90px` downward behind cravat |
| **5. Clothing Front (`layer_clothing_front`)** | Navy coat shoulders/lapels, ivory waistcoat, cravat pleats, micro-molecular trim | Soft shoulder-breathing mesh weight; collar overlaps neck cleanly |
| **6. Face Base (`layer_head_base`)** | Cranium, temples, cheekbones, ears, continuous forehead/orbital/mouth-area skin | **Must contain clean painted skin behind eyes, eyebrows, mouth, and front hair** so blinks, brow raises, and speech never reveal empty gaps |
| **7. Jaw (`layer_jaw_lower`)** | Chin and lower mandibular contour feathered seamlessly onto `layer_head_base` | Pivots gently downward (`2–6px`) during speech and tension expressions |
| **8. Eyes (`layer_eye_left`, `layer_eye_right`)** | Separate left/right sclera, slate-grey iris + cyan catchlight, pupil | Each iris moves independently (`±4–6px`) to support natural gaze AND rare Frontier desync |
| **9. Eyelids (`lid_upper`, `lid_lower` per eye)** | Separate left/right upper eyelid skin + lash line + crease; subtle lower lid crinkle | Independent upper lids allow natural blinks and rare ~58ms Frontier asymmetric blink lag |
| **10. Eyebrows (`layer_brow_left`, `layer_brow_right`)** | Feathered grey-brown brow hair strokes + soft brow shadow | Independent translate/rotate for all 8 restrained expressions |
| **11. Nose & Facial Detail (`layer_nose_detail`)** | Nose bridge highlight, nostrils, subtle nasolabial & cheek tension overlays | Moves subtly with head parallax (`1.15×` depth offset on 3/4 head turn) |
| **12. Mouth (`layer_mouth`)** | Interior mouth cavity (alpha-masked), upper lip, lower lip, corner shadow strokes | Supports calm closed rest, measured smirk, and restrained dialogue syllable cadence |
| **13. Front Hair (`layer_hair_front`)** | Crown sweep, left/right rolled side curls, forehead cast shadow | Subtle secondary lag (`0.15s` follow-through) on head movement |
| **14. Mechanical & Crystalline Details (`layer_mech_crystal`)** | Whisper-faint temple/jawline micro-seam, hidden hex-crystalline sub-surface pattern | Resting opacity `<= 10%`; pulses briefly to `~65%` ONLY during rare reconstruction instability |
| **15. Lighting & FX (`layer_fx_reconstruction`)** | Encounter calibration scan sweep, brief right-eye telemetry lattice, subtle cyan lapel gleam | Strictly additive/screen overlay; `0%` opacity during normal calm idle |

---

## 4. Future Animation Implementation Recommendation
1. **Immediate Runtime (Already Live in Character Animation Studio):** The unflattened 16-layer SVG proof-of-concept (`assets/characters/sci_lav_001_frontier/master_layered.svg` + `src/presentation/characterRigEngine.js`) validates every motion curve, expression state, encounter transition, reduced-motion mode, and desktop/mobile integration point without blocking on final raster rigging.
2. **Recommended Production Upgrade After Concept Approval:**
   - Once you approve the Lavoisier concept artwork above, paint/separate the 15–16 raster layers at `2048×2560` PSD/PNG and rig them in **Rive** (`.riv` using Canvas2D runtime for iOS Safari safety & compact PWA caching) or **Spine 2D** (`spine-canvas`).
   - Swap the finished animated asset into Valency purely through `assets/characters/sci_lav_001_frontier/rig_manifest.json` (`"renderer": "rive"`) via `V.CharacterRig` — requiring **zero changes** to battle logic, encounter scripts, or UI screens.

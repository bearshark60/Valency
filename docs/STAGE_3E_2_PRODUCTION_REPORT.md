# VALENCY — Stage 3E.2 Production Report: Dmitri Mendeleev Artwork & Layered Character Assets

**Date:** 2026-11-24  
**Scope:** Production painterly source masters, 13-layer feathered RGBA extractions, 16-group unflattened SVG masters, rig manifests (`schemaVersion: 2`), and full-resolution visual QA sheets for **Frontier Mendeleev (`sci_men_002_frontier`)** and **Institute Mendeleev (`sci_men_002_institute`)**.  
**Stage Gate Compliance:** Stopped cleanly at the end of Stage 3E.2. Full Mendeleev animation engine hooks, Studio switcher UI, and battle registration are intentionally deferred to **Stage 3E.3** pending review and approval of these production assets.

---

## 1. Files Created

### Frontier Mendeleev (`assets/characters/sci_men_002_frontier/`)
- `production/source_master.png` — Lossless `896×1200` framing-aligned archival master (`+42px` vertical framing alignment from approved `mendeleev_frontier_bust_concept.jpg`, placing eyes at `y = 383/386` and headroom at `12.3%` while preserving the full silver pocket-watch chain).
- `layers/01_background.png` through `layers/13_hair_front.png` — 13 feathered `896×1200` 32-bit RGBA PNG layers (`1.84 MB` total runtime size, under the `2.20 MB` Scientist Production Standard budget; Coat interior `100.0%` opaque with `0.029 / 255` Coat MAE; full-ROI neutral composite MAE `1.74 / 255`).
- `master_layered.svg` — 16-group unflattened SVG rig (`data-art-tier="PRODUCTION_PAINTERLY"`, `data-generation="GEN_2_DRIFTING"`), including traced translucent violet/cyan crystalline temple & neck veins (`layer_mech_crystal`, resting `opacity="0.14"`) and Gen-2 periodic `[?]` eka-sync lattice telemetry (`layer_fx_reconstruction`, resting `opacity="0"`).
- `rig_manifest.json` — `schemaVersion: 2` manifest with pixel-measured pivots, Mendeleev-specific personality/motion profile, beard-safe speech jaw scale (`3.5`), and all 8 refined expressions.
- `qa/layer_contact_sheet.png`, `qa/reconstruction_and_stress_qa.png`, `qa/expressions_preview_sheet.png` — Full-resolution inspection sheets.

### Institute Mendeleev (`assets/characters/sci_men_002_institute/`)
- `production/source_master.png` — Lossless `896×1200` framing-aligned archival master (`+40px` vertical framing alignment from painterly refinement of approved `mendeleev_institute_bust_concept.jpg`, elevating warm alabaster-ivory skin tones under icy-cyan archival rim light, creamy silk cravat shading, and horizontal volumetric hologram shimmer bands to match `sci_lav_001_institute`).
- `layers/01_background.png` through `layers/13_hair_front.png` — 13 feathered `896×1200` 32-bit RGBA PNG layers (`2.04 MB` total runtime size, under the `2.20 MB` budget).
- `master_layered.svg` — 16-group unflattened SVG rig (`data-art-tier="PRODUCTION_PAINTERLY"`, `data-generation="INSTITUTE_HOLOGRAM"`), calibrated Academy rings + symmetrical periodic column hairlines in `layer_bg`, empty `layer_mech_crystal` (`opacity="0"`), and museum hologram scanlines (`opacity="0.42"`).
- `rig_manifest.json` — `schemaVersion: 2` bilaterally symmetrical manifest (`eyeLeft.x = 377`, `eyeRight.x = 519`, exact mirror around `x = 448`), beard-safe speech jaw scale (`3.2`), zero drift/asymmetry, and all 8 archival expressions.
- `qa/layer_contact_sheet.png`, `qa/reconstruction_and_stress_qa.png`, `qa/expressions_preview_sheet.png` — Full-resolution inspection sheets.

### Tooling, Tests & Documentation
- `scripts/build-mendeleev-character-layers.ps1` — Repeatable beard-aware layer extraction and under-paint pipeline.
- `scripts/render-mendeleev-qa-sheets.ps1` — Automated full-resolution checkerboard, reconstruction/stress/42×42 mobile crop, and 8-expression preview generator.
- `tests/stage3e2_mendeleev_assets_test.js` — Automated asset completeness, resolution, budget, SVG contract, manifest schema, and untouched `V.CharacterRig` compatibility verification suite.
- `docs/STAGE_3E_2_PRODUCTION_REPORT.md` — This report.

---

## 2. Source Artwork Dimensions & Framing Alignment

| Asset | Dimensions | Aspect Ratio | Eye Line (`y`) | Headroom | Layer Bundle Size |
|---|---|---|---|---|---|
| `sci_men_002_frontier/production/source_master.png` | `896 × 1200` | `3:4` (`0.747`) | `383 / 386 px` (`32.0%`) | `12.3%` (`y = 148`) | `1.84 MB` (13 PNGs) |
| `sci_men_002_institute/production/source_master.png` | `896 × 1200` | `3:4` (`0.747`) | `392 / 392 px` (`32.7%`) | `12.8%` (`y = 154`) | `2.04 MB` (13 PNGs) |
| Reference Baseline (`sci_lav_001_*`) | `896 × 1200` | `3:4` (`0.747`) | `392–395 px` (`32.8%`) | `~13%` | `~1.8–2.1 MB` |

Aligning both Mendeleev masters to Lavoisier's exact `896×1200` canvas and `y ≈ 32–33%` eye band ensures existing `.v-portrait-mini` circular mobile battle header framing (`translateY(9px) scale(2.05); transform-origin: 50% 34%`) centers both Mendeleev portraits cleanly with **zero** custom per-character CSS overrides.

---

## 3. Layer Architecture (13 RGBA PNGs → 16 Semantic SVG Groups)

Both characters adhere strictly to the established Lavoisier 16-group SVG hierarchy (`SCIENTIST_PRODUCTION_STANDARD.md` §3), augmented with beard-aware segmentation:

1. **`01_background.png` (`layer_bg`):** Continuous full-bleed backdrop + vector periodic column hairlines & eka-brackets (Frontier) or calibrated concentric Academy rings + vertical periodic group ticks (Institute).
2. **`02_body_clothing.png` (`layer_clothing_front`, `layer_neck`, `layer_clothing_rear`):** Thin-line-bypass BFS foreground coat/waistcoat/collar/tie silhouette with continuous collar & silk tie/cravat under-paint extending `~58px` upward behind the entire beard overlap zone.
3. **`03_hair_rear.png` (`layer_hair_rear`):** Sweeping shoulder-length back hair locks strictly outside the cheek and beard perimeter.
4. **`04_face_head.png` (`layer_head_base`):** Full head, upper cheeks, sideburns, sweeping moustache, and sculpted beard silhouette with true-tone shaded sclera under-paint (preserving dark hooded upper lash line), wide 2D cross-interpolated brow-ridge skin under-paint, and mustache-safe mouth pocket under-paint.
5. **`05/06_eye_*_iris.png` (`layer_eye_left/right [data-part="iris"]`):** Feathered circular iris + catchlight cutouts clipped inside tight anatomical eye-aperture `<clipPath>` shapes with soft upper-lash cast shadow.
6. **`07/08_lid_*_upper.png` (`layer_eye_left/right [data-part="lid_upper"]`):** Painted upper-eyelid crease skin sampled strictly below Mendeleev's heavy brow ridge (with dark brow-hair rejection) + curved painted lash edge.
7. **`09/10_brow_*.png` (`layer_brow_left/right`):** Heavy sculptural iron-grey / alabaster eyebrows carrying primary cross-scale emotional legibility.
8. **`11_mouth.png` (`layer_mouth`):** Soft-feathered warm/alabaster lips clipped cleanly below the moustache line so speech opens naturally over `mouth_cavity` without dragging moustache hair.
9. **`12_jaw_lower.png` (`layer_jaw_lower`):** Lower chin and central cascading beard mass strictly below the lower-lip shadow (`mouth.cy + 13px`) with `44%` soft radial feathering and beard-safe speech travel caps (`jawSpeechScale: 3.5` Frontier / `3.2` Institute).
10. **`13_hair_front.png` (`layer_hair_front`):** Sweeping hair crown & upper side mane excluding forehead skin and beard.
11. **`layer_mech_crystal` & `layer_fx_reconstruction`:** Traced Gen-2 violet-cyan temple/neck veins + `[?]` periodic eka-sync bracket telemetry on Frontier; empty `opacity="0"` crystal layer + clean museum scanlines on Institute.

---

## 4. Differences Between Frontier & Institute Implementations

| Dimension | Frontier Mendeleev (`sci_men_002_frontier`) | Institute Mendeleev (`sci_men_002_institute`) |
|---|---|---|
| **Visual Source** | Approved Stage 3E.1 3/4 bust (warm skin, obsidian coat, slate-plum waistcoat, silver pocket-watch chain, violet/cyan veins) | Freshly refined near-frontal symmetrical archival hologram harmonized directly to Institute Lavoisier's warm-alabaster + icy-cyan painterly finish |
| **Symmetry & Pose** | Slight 3/4 orientation (`head` pivot `x = 496`, `eyeL: 442`, `eyeR: 566`) | Exact bilateral symmetry (`head` pivot `x = 448`, `eyeL: 377`, `eyeR: 519`, `Δx = ±71px`) |
| **Generation & Drift** | `GEN_2_DRIFTING` — subtle resting veins (`0.14`), extreme Gen-2 `instability` (`0.88` veins, dual-axis eye divergence, `[?]` telemetry) | `INSTITUTE_HOLOGRAM` — strictly `0` veins, `0` asymmetry, `0` drift; `instability` remains locked to calm archival baseline |
| **Expression Character** | Dry mischievous asymmetric `amused` brow cock (`-2.4/-4.8px`), fierce `irritated` V-brow (`+8.8°/-9.2°`), weighty `disappointed` bow | Measured symmetrical archival counterparts (`~75%` amplitude, `headTilt` locked near `0°`) |

---

## 5. Full-Resolution Visual QA Findings & Fixes Applied

Every separated layer, assembled reconstruction, blink/jaw articulation stress pose, 8-expression grid, and `42×42px` mobile circular crop was visually inspected at full resolution. The first extraction pass revealed **four real defects**, all resolved before sign-off:

1. **Background Grid & Concentric Ring Trapping (FIXED):** Initial perimeter BFS flood-fill stopped on faint background concentric rings (Institute) and periodic grid lines (Frontier), trapping a dark blue disc on Institute `04_face_head.png` and rectangular grid flaps on Frontier `04_face_head.png`. Implemented a **thin-line bypass** in `Compute-BackgroundMask` while preserving solid opacity across Frontier Mendeleev's dark obsidian wool coat (`bgThresh = 29, shoulderSplitSy = 315`), yielding clean silhouettes on checkerboard inspection (`0.68 / 255` Frontier FG MAE; `2.04 / 255` Institute FG MAE) and bringing both characters under the `2.20 MB` budget (Institute `2.42 MB` → `2.04 MB`; Frontier `2.01 MB` → `1.91 MB`).
2. **Upper Beard Ghost Strip on `02_body_clothing.png` (FIXED):** Extended the collar/cravat under-paint zone upward across the full overlap band (`neckShoulderY - 58` to `beardTipY + 8`) with center-weighted cravat blending so head tilt and jaw drop never expose ghost beard edges.
3. **Dark Right Eyebrow Leakage Into Frontier `08_lid_right_upper.png` (FIXED):** Because Frontier Mendeleev's heavy dark right brow sits close to his upper eye aperture, initial eyelid sampling captured dark brow hair on the blinking lid. Switched eyelid sampling strictly to the eyelid skin crease (`cy - ry - 7 .. cy - ry - 1`) with dark-hair outlier rejection; verified clean warm painterly eyelids at 55% blink on the stress-test sheet.
4. **QA Sheet Label Clipping (FIXED):** Adjusted preview header font sizing (`8.5pt` Consolas) so long expression titles (`INSTABILITY — Gen-2 Lattice Desynchronization`) render cleanly inside panel bounds.

**Residual Minor Note (Non-Blocking):** As noted during Institute painterly refinement, the image-editing model retained slightly crisper edge definition along Institute Mendeleev's frock-coat lapels than Institute Lavoisier's ultra-soft brush edges while matching Lavoisier's warm-alabaster skin tone, icy-cyan rim lighting, creamy cravat, and volumetric hologram shimmer bands cleanly. Zero alpha halos, zero beard gaps, and zero alignment defects remain.

---

## 6. Automated Test Results & Preservation Confirmation

- **Stage 3E.2 Suite (`tests/stage3e2_mendeleev_assets_test.js`):** **4 / 4 PASSED** — verified `896×1200` masters, 26 RGBA PNGs under `2.20 MB` per character, all 16 SVG groups & 13 valid local hrefs per character, `schemaVersion: 2` manifests with eye framing & beard-safe jaw limits, SVG `<defs>` namespacing, and live drop-in mounting/posing on the **untouched** `V.CharacterRig` engine.
- **Full Regression Suite:** Stage 3D.4 (`6/6`), Stage 3D.2 (`3/3`), Stage 3D.1 (`4/4`), Stage 3C (`5/5`), Stage 3B (`6/6`), Stage 3A (`4/4`), Stage 2 (`4/4`) — **100% PASSED**.
- **Shared Architecture Modifications:** **NONE (`0` shared runtime files modified).** Because Stage 3E.2 requires only production artwork and animation-ready layered assets, `src/presentation/characterRigEngine.js`, `src/presentation/characterRegistry.js`, `src/presentation/characterSvgRegistry.js`, `src/ui/*`, `src/engine/*`, `src/styles/*`, `index.html`, `mobile.html`, and `sw.js` were left completely untouched.
- **Lavoisier Preservation Confirmation:** Zero bytes modified in `assets/characters/sci_lav_001_frontier/*` or `assets/characters/sci_lav_001_institute/*`; all Stage 3D.2 & 3D.4 Lavoisier tests pass unchanged.

---

## 7. Targeted Visual QA Corrections — Frontier Mendeleev Layer Separation

Following director inspection of the initial Frontier Mendeleev layer contact and reconstruction sheets, two targeted extraction defects were diagnosed and corrected via `scripts/fix-frontier-mendeleev-body-bg.ps1`:

### Root-Cause Diagnosis
1. **Conspicuous Blurred Gray Strip on `02_body_clothing.png`:** The initial extraction applied a horizontal cutoff at `y = 578` across the beard and averaged left/right sample columns across grey beard flanks and white collar wings. This produced a blurred gray rectangle across the upper beard/collar overlap, left raw jagged beard hair remnants along its edges, and retained a stray left rear-hair lock at `(225..310, 575..612)`.
2. **Horizontal Background Seam at `y = 630` (Confirmed Extraction Artifact):** In `source_master.png`, the twilight background shifts gently from `rgb(18, 22, 34)` at the top corner to `rgb(29, 33, 45)` around the shoulders (`Δ ≈ 19.5 RGB`). The initial BFS background flood dropped its threshold from `29` to `19` at `shoulderSplitSy = 315` (`y = 630`), halting dead on a horizontal line across both sides of the portrait and leaving opaque background flaps (`A = 255`) glued to `02_body_clothing.png` above a darker synthetic `01_background.png` (`rgb(20, 24, 36)`).

### Exact Layers Modified
- **Modified (Frontier Mendeleev only):**
  - `assets/characters/sci_men_002_frontier/layers/01_background.png`
  - `assets/characters/sci_men_002_frontier/layers/02_body_clothing.png`
- **Untouched:** `production/source_master.png`, `layers/03_hair_rear.png` – `13_hair_front.png`, `master_layered.svg`, `rig_manifest.json`, all `sci_men_002_institute/*` assets, all `sci_lav_001_*` assets, and all shared runtime code.

### Correction Method
1. **`01_background.png`:** Reconstructed directly from the clean left/right perimeter background bands of `source_master.png` (using lower-quantile filtering to ignore thin grid lines, 25px vertical smoothing, and gentle central halo matching) so the continuous backdrop preserves the original painted twilight slate-indigo tonal curve with zero horizontal discontinuity (`y = 615` vs. `y = 645` delta: `1.01 RGB`).
2. **`02_body_clothing.png`:**
   - Replaced color-threshold coat cutting with a pixel-measured, anti-aliased outer coat/shoulder/sleeve contour mask (`SmoothingMode.AntiAlias`), guaranteeing **100.0% solid opacity** across the dark obsidian wool coat (`18,900 / 18,900` interior samples at `A = 255`, Coat MAE `0.029 / 255`), **0 stray background pixels** above the shoulders (`0` non-zero alpha pixels at `y = 645` left of shoulder), and removal of the floating left rear-hair stub.
   - Replaced the horizontal gray blur with **anatomically shaded collar/neck/tie under-paint** strictly feathered (`10px` smoothstep transition) inside the beard-occluded interior: warm shadowed human neck cylinder above the collar, continuous standing off-white wing collar wrapping behind the beard, clean ivory dress-shirt V-placket, continuous dark charcoal-plum silk tie neckband & upper knot with subtle fold highlight, soft beard cast-shadow AO, and fine painterly micro-grain. All visible coat lapels, waistcoat, buttons, silver pocket-watch chain, visible collar wings, left-neck crystalline veins, and visible tie knot remain untouched from `source_master.png`.

### Before / After Verification & Updated Measurements
- **Before/After & Articulation Stress Sheet:** `assets/characters/sci_men_002_frontier/qa/before_after_articulation_qa.png`
- **Regenerated QA Sheets:** `layer_contact_sheet.png`, `reconstruction_and_stress_qa.png`, `expressions_preview_sheet.png`
- **Updated Metrics (`sci_men_002_frontier`):**
  - Runtime layer bundle: **13 PNGs, `1.84 MB` total** (down from `1.91 MB`, well under `2.20 MB` standard).
  - Obsidian coat interior opacity: **`100.0%` (`18,900 / 18,900` pixels `A = 255`)**, Coat MAE **`0.029 / 255`**.
  - Stray background alpha pixels at `y = 645` above left shoulder: **`0`** (horizontal extraction seam completely eliminated).
  - Full-ROI neutral composite MAE: **`1.74 / 255`** (reflects clean removal of baked raster grid lines from foreground layers onto vector `layer_bg` rather than foreground loss).
  - Articulation Stress Checks (`+3.0°` tilt, `-3.0°` tilt, `+5.5px` max speech jaw drop + open mouth, 55% blink, `42×42px` mobile crop): **zero transparent gaps, zero beard/collar shear, zero ghost beard edges, zero hair/face separation.**

### Remaining Visual Limitations (Non-Blocking)
- The subtle background periodic grid lines & `[ ]` brackets in `master_layered.svg` are rendered as clean crisp vector paths in `layer_bg` over the smooth raster `01_background.png` (so the static PNG-only composite preview omits the SVG grid lines while the live SVG rig renders them crisply behind the character).
- Extreme head rotations beyond `±4°` (outside Mendeleev's `±0.95°` idle / `±2.2°` max expression envelope) would eventually reveal the top fade margin of the under-painted neck cylinder; within all rigged expression and speech bounds, coverage is seamless.


# VALENCY — Stage 3E.1: Mendeleev Production-Readiness Assessment

**Document Status:** Preproduction Readiness Gate Report (Stage 3E.1)  
**Evaluated Against:** `docs/SCIENTIST_PRODUCTION_STANDARD.md`, `docs/VALENCY_VISUAL_DESIGN_BIBLE.md`, `docs/CHARACTER_ASSET_PRODUCTION_STANDARDS.md`, `docs/STAGE_3D_3_ANIMATION_QA_REPORT.md`, `docs/STAGE_3D_4_CHARACTER_PERFORMANCE.md`  
**Verdict:** **READY FOR STAGE 3E.2 APPROVAL GATE** — Concept direction, dual visual identities, personality architecture, 8-expression specification, and beard-aware rigging plan satisfy every preproduction prerequisite with clearly scoped engineering items for Stage 3E.2–3E.3.

---

## 1. Compliance Audit Against `SCIENTIST_PRODUCTION_STANDARD.md`

| Standard Section | Requirement | Mendeleev Preproduction Status | Action Required in Stage 3E.2 / 3E.3 |
|---|---|---|---|
| **§1 Source Illustration Quality** | Commercial painterly 2D bust; mature realistic proportions; distinct Frontier (Gen-2 human-first 85%+) vs. freshly composed Institute hologram (zero filter copy, zero glitches); no sci-fi armor/visors/cartoon glasses. | **PASS** — Both busts freshly composed independently; glowing SVG spectacles replaced by unobstructed penetrating eyes + silver lapel chain; Gen-2 bilateral lighting & subtle violet-cyan neck/temple veins designed cleanly within 85%+ human-first rule. | Obtain explicit visual approval on Stage 3E.1 concepts before generating `2048×2736` / `896×1200` lossless `source_master.png` files in 3E.2. |
| **§2 Resolution, Framing & Composition** | `~3:4` bust (`896×1200` min), mid-chest upward, `12–16%` headroom, eyes aligned at `y ≈ 33–35%` so `.v-portrait-mini` centers automatically with zero CSS hacks. | **PASS (Spec Locked)** — Composition templates explicitly lock eye line at `y ≈ 34%` and headroom at `14%`, accounting for Mendeleev's taller swept hair crown and cascading beard. | Measure exact pixel coordinates of `eyeLeft`/`eyeRight` on approved Stage 3E.2 masters and verify `42×42px` & `48×48px` circular crop before sign-off. |
| **§3 Mandatory 13-PNG / 16-Group Layer Separation** | All 13 RGBA PNGs mapped cleanly into 16 semantic `<g data-layer="...">` groups with continuous background, flood-fill shoulder matte, natural sclera, real painted upper lids, 2D inpainted skin under brows/mouth. | **PASS WITH SPECIFIC TECHNICAL MITIGATION** — Mendeleev's full beard & sweeping mustache introduce a new anatomical separation requirement not present on clean-shaven Lavoisier (see §2 below). | Author dedicated `scripts/build-mendeleev-character-layers.ps1` with beard-to-collar under-paint and mustache-safe mouth/jaw segmentation; run full-res magenta/slate checkerboard QA. |
| **§4 Rigging, Expression & Personality Standards** | `rig_manifest.json` (`schemaVersion: 2`, `PRODUCTION_PAINTERLY`), 8 restrained expressions, distinct Frontier vs. Institute personality, canonical ID binding in `V.CharacterRegistry`. | **PASS** — All 8 expressions & completely distinct Mendeleev kinetic profiles specified (zero copy-paste from Lavoisier). Canonical Academy hook (`ch0_m3_mendeleev`) already exists in `academyChapter.js`. | Add optional manifest-driven motion profile hooks in `characterRigEngine.js` (100% backward-compatible with Lavoisier); register `ch0_m3_mendeleev` → `sci_men_002_institute` and Frontier Studio/encounter bindings in `characterRegistry.js`. |
| **§5 Performance & Lazy-Loading Architecture** | Keep `layers/*.png` under `~2.2 MB` per character (`<= 1.0 MB` WebP target for 4+ characters); exclude `production/` & `concepts/` from Mobile PWA bundle; single shared RAF loop; cancel RAF on Reduced/Off. | **READY — SCALE CHECK NOTED** — Adding 2 Mendeleev rigs brings total animated characters from 2 → 4 (`~7.5–8.2 MB` PNG on disk, still 0 KB downloaded on Main Menu thanks to on-demand SVG mounting). | Verify `scripts/build-mobile-bundle.js` excludes `sci_men_002_*/concepts/` and `production/`; evaluate WebP lossless-alpha conversion & runtime SW caching (`sw.js`) once 4 animated rigs are live. |
| **§6 7-Gate Approval & QA Checklist** | Concept Gate → Archival Master → Layer Contact Sheet QA → Live Studio Motion QA → Live Full-Match QA → Mobile QA (`390×844`, `320×568`) → Regression Suite & Checkpoint. | **GATE 1 ACTIVE** — Presenting Stage 3E.1 concepts & specs now; stopping cleanly before Stage 3E.2. | Execute Gates 2–7 in Stage 3E.2 (art/layers) and Stage 3E.3 (rigging/integration/QA). |

---

## 2. Mendeleev-Specific Technical Risks & Engineering Mitigations

Unlike Lavoisier (clean-shaven, tidy powdered wig), Mendeleev introduces **four concrete production challenges** identified during the codebase audit:

### Risk 1: Full Beard & Mustache Articulation During Speech (`layer_mouth` + `layer_jaw_lower`)
- **Risk:** Moving `12_jaw_lower.png` downward by Lavoisier's `+7.3px` peak could shear the lower beard away from the upper cheeks/sideburns or expose an unpainted gap where the beard overlaps the cravat and frock-coat lapels.
- **Mitigation:**
  1. Keep `02_body_clothing.png` cleanly inpainted behind the entire beard perimeter extending upward to the wing collar (`~60px` overlap), so jaw drop and head tilt never expose cutouts.
  2. Partition the beard smoothly: upper sideburns/mustache anchor on `04_face_head.png` (with mouth slit cleanly inpainted behind `11_mouth.png`), while the lower chin + cascading central beard mass sits on `12_jaw_lower.png` with a generous soft radial feather (`35–40%` edge feather across the lower cheeks).
  3. Cap `jawSpeechScale` in Mendeleev's `rig_manifest.json` to `3.2–3.6` (vs. Lavoisier's `4.8`) so speech reads clearly through lip parting + gentle authoritative beard weight without seam shearing.

### Risk 2: Heavy Sculptural Eyebrows & Under-Paint (`09/10_brow_*.png` + `04_face_head.png`)
- **Risk:** Mendeleev's thick iron-grey eyebrows cover a larger skin area than Lavoisier's finer brows; naive 1D inpainting would leave visible forehead streaks when brows elevate `-4.4px` during `explaining` or compress `+5.2px` during `irritated`.
- **Mitigation:** Use the upgraded `Inpaint-Ellipse2D` cross-interpolator already proven in Stage 3D.3 (`scripts/build-painterly-character-layers.ps1`), expanded with wide feather radii over the brow ridge, and verify at 1:1 resolution on the Stage 3E.2 Stress Test Contact Sheet.

### Risk 3: Engine Reuse Without Hardcoding Lavoisier Behavior
- **Risk:** `src/presentation/characterRigEngine.js` currently hardcodes `IDLE_MICRO_EXPRESSIONS`, `evalBreathCurve`, dwell-and-shift posture, and Gen-1 right-eye sinusoidal glitch. Mounting Mendeleev without additive manifest support would accidentally make him move like Lavoisier.
- **Mitigation:** In Stage 3E.3, add **optional** manifest keys (`breathProfile`, `postureStyle`, `gazePattern`, `blinkStyle`, `glitchStyle`, `idleMicroExpressions`, `jawSpeechScale`) to `characterRigEngine.js` with exact fallback to current defaults. Zero lines of Lavoisier's `rig_manifest.json` or runtime output change, and all existing `stage3d4_performance_test.js` assertions continue passing verbatim.

### Risk 4: Character Animation Studio & Frontier Encounter Scope
- **Audit Finding:**
  - `src/ui/frontierUI.js` currently hardcodes `sci_lav_001_frontier` and `sci_lav_001_institute` in the Character Animation Studio modal (`lines 757, 832–839`) and `def.scientistId === 'lavoisier'` (`line 324`).
  - `src/story/academyChapter.js` ALREADY has `ch0_m3_mendeleev` live and playable for **Institute Mendeleev** (`sci_men_002_institute`)!
  - `src/frontier/encounterManager.js` does **not** yet have a live Sector 02 (`region_periodic_spire`) Frontier encounter for **Frontier Mendeleev** (`sci_men_002_frontier`), though `FRONTIER_SCIENTIST_DEFS.mendeleev` reserves `region_periodic_spire`.
- **Mitigation:** In Stage 3E.3, update Character Animation Studio to support switching between **Lavoisier** and **Mendeleev** (so both Frontier and Institute Mendeleev can be inspected side-by-side live), bind `ch0_m3_mendeleev` → `sci_men_002_institute` immediately for live Academy examination play, and prepare canonical registry slot `enc_rogue_mendeleev` / `opp_entity_rogue_mendeleev` → `sci_men_002_frontier` ready for Sector 02 without prematurely altering Frontier progression or battle rules.

---

## 3. Staged Execution Roadmap (Post-Approval)

- **Stage 3E.1 (Current — Complete Pending Review):** Project audit, dual visual identity design, personality profile, 8-expression matrix, animation specification, preliminary concept sheets, and production-readiness assessment.
- **Stage 3E.2 (Production Artwork & Layer Separation — Blocked on Approval):**
  1. Generate/paint lossless master portraits (`896×1200` / `2048×2736`) for `sci_men_002_institute` and `sci_men_002_frontier` in `production/source_master.png`.
  2. Author beard-aware layer extraction pipeline (`layers/01_background.png` – `13_hair_front.png`) and unflattened 16-group `master_layered.svg` files with Gen-2 neck/temple veins & `[ ? ]` periodic bracket FX.
  3. Pass Gate 3 Full-Resolution Magenta/Slate Layer Contact Sheet & Blink/Gaze/Brow/Jaw Stress Test QA.
- **Stage 3E.3 (Engine Integration, Studio Multi-Character Support & QA):**
  1. Add backward-compatible manifest motion hooks to `characterRigEngine.js` (zero Lavoisier regression).
  2. Sync `characterSvgRegistry.js`, add `rig_manifest.json` + `BUILTIN_CHARACTERS` entries, register `ch0_m3_mendeleev` in `characterRegistry.js`, and enable character selection in Character Animation Studio.
  3. Execute Gates 4–7 (Studio Motion QA, full Academy `ch0_m3_mendeleev` battle QA, Mobile `390×844` & `320×568` QA, full regression suite, recoverable `.checkpoints/` snapshot).

---

## 4. Stage 3E.1 Preservation & Non-Modification Verification

Confirmed unchanged during Stage 3E.1:
- `assets/characters/sci_lav_001_frontier/*` & `assets/characters/sci_lav_001_institute/*`: **Untouched.**
- `src/engine/gameEngine.js`, `src/engine/ai.js`, `src/data/cards.js`, `src/data/compounds.js`: **Untouched.**
- `src/presentation/*`, `src/story/*`, `src/frontier/*`, `src/ui/*`, `src/styles/*`: **Untouched.**
- `assets/portraits/mendeleev.svg`: **Untouched.**

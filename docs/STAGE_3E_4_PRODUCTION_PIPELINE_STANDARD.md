# VALENCY — Stage 3E.4 Standardized Multi-Scientist Production Pipeline

**Status:** Mandatory Production Standard for Scientist #3 (Linus Pauling), Scientist #4 (Marie Curie), and Scientist #5+  
**Applies To:** All future Institute Hologram and Frontier Construct animated characters in *Valency: The Elemental Frontier*.

---

## 1. Naming Conventions & Directory Contract

Every Scientist produces **two** independent character packages under `assets/characters/`:

| Field | Standard Pattern | Example (Lavoisier) | Example (Mendeleev) | Example (Pauling) |
|-------|------------------|---------------------|---------------------|-------------------|
| Scientist Key | `<surname_lowercase>` | `lavoisier` | `mendeleev` | `pauling` |
| Scientist Code | `SCI-<3CHARS>-<3DIGITS>` | `SCI-LAV-001` | `SCI-MEN-002` | `SCI-PAU-003` |
| Frontier Character ID | `sci_<3chars>_<3digits>_frontier` | `sci_lav_001_frontier` | `sci_men_002_frontier` | `sci_pau_003_frontier` |
| Institute Character ID | `sci_<3chars>_<3digits>_institute` | `sci_lav_001_institute` | `sci_men_002_institute` | `sci_pau_003_institute` |
| Frontier Encounter ID | `enc_rogue_<surname>` | `enc_rogue_lavoisier` | `enc_rogue_mendeleev` | `enc_rogue_pauling` |
| Frontier Entity ID | `opp_entity_rogue_<surname>` | `opp_entity_rogue_lavoisier` | `opp_entity_rogue_mendeleev` | `opp_entity_rogue_pauling` |
| Academy Mission ID | `ch0_m<n>_<surname>` | `ch0_m2_lavoisier` | `ch0_m3_mendeleev` | `ch0_m4_pauling` |

### Required Folder Layout per Character Variant

```text
assets/characters/<characterId>/
├── master_layered.svg          # 16-group rig SVG referencing layers/*.png (viewBox="0 0 896 1200")
├── rig_manifest.json           # schemaVersion 2 manifest (pivots, motionProfile, expressions, battleReactions)
├── layers/                     # 13 unflattened RGBA PNG layers (896x1200, transparent outside layer bounds)
│   ├── 00_bg.png
│   ├── 01_hair_rear.png
│   ├── 02_body_clothing.png    # Must contain 100% opaque coat/clothing + full anatomical under-paint under jaw/beard
│   ├── 03_head_base.png        # Continuous skin under eyes, brows, nose, and mouth
│   ├── 04_jaw_lower.png        # Clean jaw/chin/beard separation with zero upper-collar ghosting
│   ├── 05_eye_left.png
│   ├── 06_eye_right.png
│   ├── 07_brow_left.png
│   ├── 08_brow_right.png
│   ├── 09_nose.png
│   ├── 10_mouth.png
│   ├── 11_hair_front.png
│   └── 12_fx_mech_crystal.png  # Frontier: crystalline seams/fractures; Institute: clean subtle hologram glow (zero glitch)
└── production/                 # Source art & visual QA sheets (excluded from runtime PWA bundle)
    ├── source_master.png       # Approved 896x1200 painterly master illustration
    ├── layer_contact_sheet.png # Contact sheet showing all 13 layers isolated on contrast backdrop
    └── qa_assembled_vs_source.png # Side-by-side assembled SVG vs source master diff sheet
```

---

## 2. Dimensions, Framing & Asset Budgets

| Constraint | Requirement | Rationale |
|------------|-------------|-----------|
| Master & Layer Canvas | **`896 × 1200 px`** (`viewBox="0 0 896 1200"`) | Exact aspect ratio shared by Studio cards, Encounter Intros, and Battle Header avatars. |
| Mobile Circular Eye Framing | **`eyeLeft.y` & `eyeRight.y` inside `[378, 420]`** (centered horizontally near `x = 448`) | Guarantees `42×42px` circular mobile battle header avatars frame both eyes cleanly without cropping foreheads or chins. |
| Per-Variant `layers/` PNG Budget | **Target `<= 2.2 MB`**, **Hard Cap `<= 2.5 MB`** (sum of all 13 PNGs) | Keeps mobile download & texture decode fast (current range: `1.67 MB – 2.28 MB`). |
| Coating & Under-Paint Opacity | **`100%` opaque coat/body**; continuous under-paint behind jaw, eyes, mouth, and beard | Prevents transparent gaps or horizontal seams during jaw speech, blinking, and head sway. |
| Institute vs. Frontier Parity | Institute: **`allowReconstructionGlitch: false`**, **`glitchStyle: "none"`**, **`restingSeamOpacity: 0`** | Preserves lore distinction between pristine Academy archival holograms and Gen-1/2/3+ Frontier reconstructions. |

---

## 3. Mandatory 16-Group SVG Rig Contract

Every `master_layered.svg` must contain all 16 `data-layer` attributes and core transform groups (`rig_torso`, `rig_head`, `rig_jaw`, `rig_eye_left`, `rig_eye_right`, `rig_brow_left`, `rig_brow_right`, `rig_mouth`, `rig_fx_reconstruction`):

1. `layer_bg`
2. `layer_hair_rear`
3. `layer_clothing_rear`
4. `layer_neck`
5. `layer_clothing_front`
6. `layer_head_base`
7. `layer_jaw_lower`
8. `layer_eye_left`
9. `layer_eye_right`
10. `layer_brow_left`
11. `layer_brow_right`
12. `layer_nose_detail`
13. `layer_mouth`
14. `layer_hair_front`
15. `layer_mech_crystal`
16. `layer_fx_reconstruction`

---

## 4. Manifest Schema Contract (`rig_manifest.json`)

Every manifest is validated at registration time by `V.CharacterRig.validateManifest(manifest)`:

- **Required Top-Level Keys:** `schemaVersion` (`2`), `characterId`, `displayName`, `constructTitle`, `aiFamily` (`"FRONTIER"` | `"INSTITUTE"`), `generationStage`, `renderer` (`"svg_rig"`), `sourceAsset`, `requiredLayers` (all 16 layer IDs), `pivots`, `expressions`.
- **Required Numeric Pivots (`REQUIRED_PIVOT_KEYS`):** `torso`, `head`, `jaw`, `eyeLeft`, `eyeRight`, `browLeft`, `browRight`, `mouth` — each `{ "x": number, "y": number }`.
- **Validated `motionProfile` Enums (`VALID_MOTION_ENUMS`):**
  - `breathProfile`: `"organic_wave"` | `"diaphragmatic_poise"` | `"thoracic_contemplative"`
  - `postureStyle`: `"dwell_shift"` | `"anchored_vertical"` | `"stepped_axial"`
  - `gazePattern`: `"saccade_center"` | `"tabular_row"` | `"periodic_grid_dual_tempo"`
  - `blinkStyle`: `"natural_asym"` | `"heavy_symmetrical"` | `"fixation_shutter"`
  - `glitchStyle`: `"none"` | `"gen1_right_drift"` | `"gen2_orthogonal_lattice"`
  - `speakingCadence.jawSpeechScale`: numeric `0..8` (use `<= 3.8` for heavily bearded characters to prevent beard detachment).
- **Mandatory vs. Optional Features:**

| Feature | Mandatory / Optional | Fallback When Omitted |
|---------|----------------------|-----------------------|
| 13 RGBA PNGs + 16-group SVG | **Mandatory** | Rig falls back to static `<img>` if SVG load fails. |
| 8 Named Expressions (`neutral`, `thoughtful`, `amused`, `explaining`, `concerned`, `disappointed`, `irritated`, `instability`) | `neutral` **Mandatory**; other 7 **Recommended/Standard** | Missing expressions log a validation warning and fall back to `neutral`. |
| `motionProfile` | **Recommended** | Falls back to `V.CharacterRig.DEFAULT_MOTION_PROFILE`. |
| `battleReactions` | **Optional** | Uses AI-family defaults in `evaluateBattlePortraitReaction()`. |
| Custom `microExpressions` / Frontier Glitch | **Optional (Frontier only)** | Disabled cleanly when omitted; strictly forbidden (`false`) on Institute. |
| Frontier Encounter Intro Preview (`encounterId`) | **Optional** | Studio hides `#btn-poc-enc-preview` gracefully when absent. |

---

## 5. Repeatable 15-Step Onboarding Pipeline (Scientist #3+)

1. **Design & Personality Specification:** Author `<SCIENTIST>_CHARACTER_DESIGN.md`, `<SCIENTIST>_EXPRESSION_MATRIX.md`, `<SCIENTIST>_ANIMATION_SPECIFICATION.md`, and `<SCIENTIST>_PERSONALITY_AND_BEHAVIOR.md` defining distinct non-Lavoisier / non-Mendeleev kinetics.
2. **Pre-Stage Checkpoint:** Snapshot the clean repo under `.checkpoints/v<prev>_pre_<scientist>/`.
3. **Master Painterly Portraits:** Produce and approve `896×1200` painterly source masters for both Frontier and Institute variants, verifying eye alignment inside `y ∈ [378, 420]`.
4. **13-Layer Painterly Extraction & Under-Paint:** Extract all 13 RGBA PNG layers into `assets/characters/<id>/layers/`, ensuring 100% opaque clothing and continuous anatomical under-paint behind jaw, eyes, mouth, and facial hair.
5. **Visual QA Contact & Seam Inspection:** Generate `production/layer_contact_sheet.png` and `production/qa_assembled_vs_source.png`; inspect at full resolution for halos, rectangular ghosting, alpha fringe, or jaw-open gaps.
6. **Build `master_layered.svg`:** Assemble the 16-group SVG referencing `assets/characters/<id>/layers/*.png` with exact `viewBox="0 0 896 1200"`.
7. **Author `rig_manifest.json`:** Populate `pivots`, `personality`, `motionProfile` (using `VALID_MOTION_ENUMS`), all 8 character-specific `expressions`, and manifest-driven `battleReactions`.
8. **Sync SVG Registry:** Run `node scripts/sync-character-svg-registry.js` and confirm **zero warnings** (all manifests and PNG `href`s verified).
9. **Register Character (Data-Driven — Zero UI Code Edits Needed):**
   - Add the two manifests to `BUILTIN_CHARACTERS` in `src/presentation/characterRigEngine.js` (or register dynamically via `V.CharacterRegistry.registerScientist({ key, code, fullName, frontierId, instituteId, frontierManifest, instituteManifest, encounterIds, opponentEntityIds, storyMissionIds })`).
   - Add visual asset entries in `src/presentation/visualTheme.js` and add the two new `master_layered.svg` paths to `CORE_ASSETS` in `sw.js` (bumping `CACHE_NAME`).
   - **Zero edits required** in `src/ui/frontierUI.js` (Studio auto-discovers via `listScientistPairs()` and Hub auto-detects via `hasAnimatedCharacterForScientist()`) or `src/ui/app.js` (`battleReactions` are read directly from the manifest!).
10. **Author Dedicated Automated Test Suite:** Add `tests/stage3e<N>_<scientist>_test.js` validating `validateManifest()`, `validateRegistry()`, 60s kinetic differentiation, 8 expressions, speaking cadence safety, and battle reactions.
11. **Run Full Regression Suite:** Execute ALL `tests/*.js` suites without weakening any prior test.
12. **Live Desktop Acceptance (`1280×860`):** Verify Main Menu lazy loading (`0` PNGs), dynamic Studio switching, single-variant view mounting (`1` rig), 8 expressions, cadence, battle reactions, Reduced/Off freeze, live battle mount, static fallback, and clean teardown (`0` rigs).
13. **Live Mobile Acceptance (`390×844` & `320×568`):** Verify `42×42px` circular framing, zero horizontal overflow, Studio controls, and teardown.
14. **Rebuild & Verify Mobile PWA:** Run `node scripts/build-mobile-bundle.js`, verify `dist/valency-mobile-pwa/` contains all new `assets/characters/<id>/layers/*.png` and `master_layered.svg` files, and regenerate `dist/valency-mobile-pwa.zip`.
15. **Post-Stage Checkpoint & Approval Report:** Save `.checkpoints/v<stage>_<scientist>_complete/` and publish the stage QA report before moving to the next Scientist.

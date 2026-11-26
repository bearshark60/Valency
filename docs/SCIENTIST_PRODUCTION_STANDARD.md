# VALENCY — Mandatory Scientist Production Standard (Stage 3D.3)

**Status:** Approved Repeatable Production Specification  
**Mandatory For:** Dmitri Mendeleev, Linus Pauling, Marie Curie, and all future Frontier & Institute Scientist characters  
**Baseline Reference Implementation:** `SCI-LAV-001` (Frontier Lavoisier) & `SCI-LAV-001-INST` (Institute Lavoisier)

---

## 1. Source Illustration Quality Standard
- **Commercial Painterly 2D Character Art:** Every Scientist must be illustrated as a high-detail painterly 2D bust portrait with realistic human anatomy, mature era-authentic proportions, volumetric light/shadow modeling, natural skin texture, and richly separated historical materials (wool, silk, linen, silver fasteners, hair curls/strands).
- **Strictly Prohibited:** Simplified geometric vector mascots, flat gradient-circle portraits, cartoonish/anime exaggeration, generic robots, glowing visors (except non-human Academy Proctor constructs), or conventional sci-fi cyborg armor.
- **Two Distinct AI Visual Families:**
  - **Frontier Construct:** Human-first memory reconstruction (*"a machine recreating a human from memory after 1,000 cycles"*). Warm historical attire carries 85%+ of visual weight; artificial imperfections scale by generation stage (Gen 1 Lavoisier: whisper-faint temple seam & slight eyelid variance; Gen 2–4: progressively more visible crystalline/geometric drift).
  - **Institute AI Hologram:** Freshly composed (NEVER a cyan-tinted filter of the Frontier painting!), near-frontal bilaterally symmetrical archival idealization in luminous alabaster/cyan holographic finish with calibrated concentric Academy rings and **zero** reconstruction errors or glitches.

---

## 2. Resolution, Framing & Composition
- **Master Resolution:** Minimum `896×1200` (recommended master `1024×1368` or `2048×2736`, ~`3:4` bust aspect ratio), preserved losslessly in `assets/characters/<id>/production/source_master.png`.
- **Framing:** Mid-chest upward so coat lapels, waistcoat/fasteners, cravat/collar, neck, head, and full hair silhouette read clearly at `240×320` (Encounter Stage), `176×235` (Studio), `124×166` (VS Intro), and `42–48px` circular crop (Battle Opponent Header).
- **Headroom:** `12–16%` negative space above the crown and along both sides so idle head sway and encounter scanlines never clip.
- **Facial Center:** Eyes aligned near `y ≈ 33–35%` of total frame height so circular opponent-header framing (`transform: translateY(9px) scale(2.05); transform-origin: 50% 34%`) centers every Scientist's face identically without custom per-character CSS hacks.

---

## 3. Mandatory Layer Separation & Under-Paint Requirements
Every production character MUST preserve **all 13 separated RGBA PNG layers** (`assets/characters/<id>/layers/*.png`) mapped cleanly inside the **16 semantic `<g data-layer="...">` groups** in `assets/characters/<id>/master_layered.svg`:

| Layer PNG / SVG Group | Separation & Under-Paint Rule (Enforced by QA) |
|---|---|
| `01_background.png` (`layer_bg`) | Continuous full-bleed backdrop painted seamlessly behind head & shoulders (zero silhouette cutout) |
| `02_body_clothing.png` (`layer_clothing_front`, `layer_neck`, `layer_clothing_rear`) | Flood-fill background-segmented foreground coat/cravat/collar with smooth 3px anti-aliased edge (ZERO dark rectangular shoulder halos). Must extend `~42px` upward behind the jawline so head tilt reveals continuous neck/collar |
| `03_hair_rear.png` (`layer_hair_rear`) | Strictly nape hair / ribbons **outside** the jaw & chin perimeter (never includes mouth/chin pixels) |
| `04_face_head.png` (`layer_head_base`) | Painterly head with: (a) **natural shaded sclera** sampled from true eye corners WITHOUT artificial brightening and preserving the painting's dark hooded upper lash line; (b) **2D cross-interpolated smooth skin under-paint** beneath brows & mouth (zero vertical streaks) |
| `05/06_eye_*_iris.png` (`layer_eye_left/right [data-part="iris"]`) | Feathered circular crop of the painting's real irises + catchlights, clipped inside tight anatomical eye-aperture `<clipPath>` with soft upper-lash cast-shadow gradient |
| `07/08_lid_*_upper.png` (`layer_eye_left/right [data-part="lid_upper"]`) | Sampled directly from the painting's real upper-eyelid skin pixels + delicate lash edge (NEVER a flat solid rectangle!) |
| `09/10_brow_*.png` (`layer_brow_left/right`) | Soft-feathered real painted eyebrow strokes |
| `11_mouth.png` (`layer_mouth`) | Soft-feathered real painted lips + alpha-masked interior `mouth_cavity` beneath for speech |
| `12_jaw_lower.png` (`layer_jaw_lower`) | Feathered chin/mandible plane strictly **below** the lower-lip shadow (prevents double-lip blur) |
| `13_hair_front.png` (`layer_hair_front`) | Hairline-clean powdered/styled hair crown & curls **excluding** warm forehead skin |
| `layer_mech_crystal` (SVG overlay) | Frontier ONLY: traces the painting's exact hairline crystalline/geometric seam (`opacity <= 0.10` at rest; rises to `~0.75` on rare instability). Empty (`opacity="0"`) on Institute holograms |
| `layer_fx_reconstruction` (SVG overlay) | Encounter scan sweep + subtle telemetry lattice (Frontier) OR clean subtle horizontal museum hologram scanlines (Institute) |

---

## 4. Rigging, Expression & Personality Standards
- **Exact Manifest (`rig_manifest.json`):** Declares `schemaVersion: 2`, `artTier: "PRODUCTION_PAINTERLY"`, `viewBox`, pixel-measured pivots (`torso`, `head`, `jaw`, `eyeLeft`, `eyeRight`, `browLeft`, `browRight`, `mouth`), `motionProfile`, and all **8 restrained expressions**:
  1. `neutral` (Composed baseline)
  2. `thoughtful` (Analytical subtle gaze & brow)
  3. `amused` (Measured, dignified approval)
  4. `explaining` (Engaged scholarly speech cadence)
  5. `concerned` (Subtle inner-brow tension)
  6. `disappointed` (Lowered lids, slight downward dip)
  7. `irritated` (Controlled intellectual displeasure — never cartoonish rage)
  8. `instability` (Frontier ONLY: rare subtle eye desync + hairline seam glint; Institute stays serenely stable!)
- **Personality Differentiation:**
  - Frontier constructs use subtle asymmetric blinking (`~58ms` occasional right-lid lag), slight expression settle delay on the mouth, and rare (`13.5–22s`) micro-instability pulses.
  - Institute holograms use exact synchronized blinking, tighter calm head sway, steady translucent hologram shimmer, and zero drift.
- **Battle Integration (`V.CharacterRegistry`):**
  - Register strictly by canonical `encounterId`, `opponentEntityId`, and/or `storyMissionId` — NEVER by display name.
  - Persistently re-attach the live DOM rig across battle re-renders (zero remount flicker), replace `.mini-avatar` completely (never show both), and destroy + remove DOM container cleanly on match exit (`#battle-opp-animated-portrait` count = `0`).

---

## 5. Performance & Future Lazy-Loading Architecture
- **Per-Character Runtime Budget:** Keep separated runtime `layers/*.png` under `~2.2 MB` per character (and `<= 1.0 MB` once converted to lossless/high-quality WebP for Stage 4+ multi-character expansion). Exclude `production/source_master.png` and `concepts/` from Mobile PWA runtime bundles (`scripts/build-mobile-bundle.js`).
- **Animation Loop Budget:** All mounted rigs share **one single `requestAnimationFrame` loop** in `V.CharacterRig`. The loop MUST immediately cancel (`cancelAnimationFrame`) when `animMode` is `reduced` or `off`, when `V.isAnimationsEnabled()` is `false`, or when zero rigs are mounted.
- **Lazy-Loading Strategy for Full Roster (4+ Scientists):**
  - Currently (2 characters: Frontier + Institute Lavoisier), `master_layered.svg` markup (~6 KB each) is indexed in `characterSvgRegistry.js`, while the browser **already lazy-loads** each character's `layers/*.png` on demand ONLY when that specific character's `<svg>` is mounted in the DOM (zero PNG bandwidth consumed on the Main Menu!).
  - When expanding to Mendeleev, Pauling, Curie, and Frontier regions (8+ animated portraits):
    1. Keep `sw.js` core precache limited to lightweight shell/UI scripts & `master_layered.svg` manifests; cache `assets/characters/*/layers/*` dynamically on first visit via network-first runtime caching (never precache all 8 characters' PNG layers on initial iPhone install!).
    2. Convert `layers/*.png` to **WebP (quality 90 with lossless alpha)** with PNG fallback (`~65–75%` smaller download per Scientist — dropping a 1.8 MB character down to `~450 KB`!).
    3. Pre-warm the next opponent's layer images during the Mission Briefing / Encounter Intro modal so entering battle renders frame 1 with `0ms` pop-in.

---

## 6. Mandatory Approval, Visual QA & Integration Gate (Checklist)
No new Scientist (Mendeleev, Pauling, Curie, or future roster) may be committed to production until ALL 7 gates pass:
1. **Concept Approval Gate:** Present full-size Frontier + freshly composed Institute busts, 3/4 + facial close-up, clothing/material swatches, and all 8 restrained expressions; receive explicit visual approval before replacing any existing portrait.
2. **Archival Preservation:** Save unmodified `production/source_master.png` alongside `concepts/`.
3. **Full-Resolution Layer QA Contact Sheet:** Render all 13 RGBA layers on high-contrast magenta/slate checkerboard AND a 1:1 `Source Master vs. Neutral Composite vs. Blink+Gaze+Brow+Tilt Stress Test` sheet; visually inspect for halos, wide-eyed sclera bleaching, flat eyelids, forehead/lip overlap, or background gaps. Fix all defects without simplifying artwork.
4. **Live Studio Motion QA:** Confirm idle breathing/sway/blinking without clicks, all 8 expressions, speaking cadence, Frontier instability vs. Institute stability, and verified zero-motion freeze in `Reduced` & `Off` modes.
5. **Live Full-Match Gameplay QA:** Run complete battles against both Frontier and Institute versions (intro → multiple turns → battle reactions → match completion → exit cleanup with `0` lingering DOM nodes and `0` `.mini-avatar` duplication), plus a non-animated fallback opponent check.
6. **Mobile Responsive & Performance QA:** Verify `390×844` and `320×568` (`0` overflow, `0` header overlap, `0` failed PNGs, `0` JS console errors) and verify updated Mobile PWA bundle + offline SW behavior.
7. **Regression Suite & Recoverable Checkpoint:** Run all automated tests (`stage3d2`, `stage3d1`, `stage3c`, `stage3b`, `stage3a`, `stage2`, Classic, Tutorial, DOM, Mobile) and archive a clean `.checkpoints/` snapshot.

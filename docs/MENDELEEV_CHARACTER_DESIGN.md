# VALENCY — Stage 3E.1: Dmitri Mendeleev Character Design & Visual Preproduction

**Document Status:** Preproduction Design Specification — Pending Visual & Director Approval (Stage 3E.1)  
**Character Designation:** `SCI-MEN-002` (Frontier Construct) & `SCI-MEN-002-INST` (Institute Archival Hologram)  
**Canonical Asset IDs (Planned for Stage 3E.2+):** `sci_men_002_frontier` & `sci_men_002_institute`  
**Standards Baseline:** `docs/SCIENTIST_PRODUCTION_STANDARD.md`, `docs/VALENCY_VISUAL_DESIGN_BIBLE.md`, `docs/CHARACTER_ASSET_PRODUCTION_STANDARDS.md`  
**Scope Guarantee:** Design and preproduction only. Zero production artwork layers, zero code modifications, and zero edits to existing Lavoisier assets or gameplay systems.

---

## 1. Project Audit Summary (Source-of-Truth Findings)

An inspection of the live `valency-card-game` repository confirms that the Lavoisier pipeline (`sci_lav_001_frontier`, `sci_lav_001_institute`) established a clean, decoupled 16-layer painterly SVG rig architecture, and that Mendeleev already has canonical story, AI, and Frontier lore hooks in place:

### Existing Mendeleev Hooks in the Codebase
| Source File | Verified Canonical Definition |
|---|---|
| `src/story/scientists.js` | `SCIENTIST_PROFILES.mendeleev`: *Dmitri Mendeleev* (`1834–1907`), accent `#a855f7`, specialty *"Periodic organization and elemental relationships"*, affinities `['Ga', 'Ge', 'Si', 'Al', 'B']`, archetype *"Structured Systems Architect"*, full Academy examination dialogue. |
| `src/story/academyChapter.js` | Mission `ch0_m3_mendeleev` (*Mendeleev – The Periodic Challenge*, Chamber 2 • Structured Periodic Organization), paired with `opp_mendeleev` and `rc_mendeleev`. |
| `src/story/opponentConfigs.js` | `opp_mendeleev` (`difficulty: 'standard'`): *"Structured Periodic Synthesis & Shielded Pillars"* — favors high-SP structured compounds (`CO₂`, `MgCl₂`, `AlCl₃`, `CH₄`), shields early, uses `ACID_RAIN`, `ELECTROLYSIS`, and `SYNTHESIS_ACCELERATOR`, `minNetSwing: 8`. |
| `src/frontier/scientistEquipment.js` | `FRONTIER_SCIENTIST_DEFS.mendeleev` (`status: 'RESERVED_FUTURE_REGION'`): `originRegionId: 'region_periodic_spire'`, `originTerritoryLabel: 'Future Region — Periodic Spire'`. |
| `src/frontier/investigationManager.js` | `ev_intel_collective_signal`: confirms the rogue Lavoisier construct maintained encrypted outbound handshakes with rogue constructs modeled on **Mendeleev**, Pauling, and Curie. |
| `assets/portraits/mendeleev.svg` | Legacy circular geometric vector placeholder (purple halo, silver hair/beard, glowing violet spectacles). Retained untouched as fallback until Stage 3E.2+ approval; glowing spectacles are **not** carried into production painterly art per the Visual Design Bible. |

### Reusable vs. Character-Specific Architecture Audit
| Component | Status | Notes for Mendeleev |
|---|---|---|
| `src/presentation/characterRigEngine.js` (RAF loop, SVG namespacing, DOM lifecycle, Reduced/Off freeze) | **Reusable (Minor Additive Extensions Recommended)** | Core loop & 16-layer binding work out of the box. Currently hardcodes `IDLE_MICRO_EXPRESSIONS`, Lavoisier's `evalBreathCurve`, dwell-and-shift posture, and single right-eye glitch drift; optional manifest-driven hooks should be added in Stage 3E.3 without altering Lavoisier's default path. |
| `src/presentation/characterRegistry.js` | **Reusable (Config Addition Only)** | Maps canonical IDs (`ch0_m3_mendeleev` → `sci_men_002_institute`; future Frontier `enc_rogue_mendeleev` / `opp_entity_rogue_mendeleev` → `sci_men_002_frontier`). |
| `src/presentation/visualTheme.js` & `scripts/sync-character-svg-registry.js` | **Reusable (Auto-Discovery / Config)** | `sync-character-svg-registry.js` automatically scans `assets/characters/*/master_layered.svg`. `ASSET_MANIFEST.characters` accepts new entries declaratively. |
| `src/styles/character-portrait.css` | **Reusable (Zero Per-Character Hacks)** | Provided Mendeleev's eyes sit at `y ≈ 33–35%` on the `896×1200` master canvas, `.v-portrait-mini` (`translateY(9px) scale(2.05); transform-origin: 50% 34%`) frames him dead-center automatically. |
| `src/ui/frontierUI.js` (Character Animation Studio) | **Character-Specific Refactor Needed in 3E.3** | Currently hardcodes `sci_lav_001_frontier` / `sci_lav_001_institute` in Studio modal; will need a character switcher driven by `V.CharacterRig.listCharacters()`. |
| `assets/characters/sci_men_002_*/` (`source_master.png`, 13 RGBA layers, `master_layered.svg`, `rig_manifest.json`) | **100% Character-Specific** | Freshly painted masters (Institute composed independently of Frontier), beard-aware layer masks, Mendeleev pivots, Gen-2 seam geometry, and Mendeleev motion/expression profiles. |

---

## 2. Dual Identity Architecture: Institute vs. Frontier Mendeleev

Per `SCIENTIST_PRODUCTION_STANDARD.md` §1 and `VALENCY_VISUAL_DESIGN_BIBLE.md` §7, Institute and Frontier Mendeleev are **two separately composed character identities**, never a cyan filter or recolor of one portrait.

| Visual & Narrative Axis | Institute Mendeleev (`SCI-MEN-002-INST`) | Frontier Mendeleev (`SCI-MEN-002`) |
|---|---|---|
| **Visual Family** | **Family A — Academy Institute AI Hologram** | **Family B — Frontier Construct (Generation 2: Drifting)** |
| **Role & Identity** | *The Archival Periodic Architect* — preserved university dean of Valency Academy Chamber 2 (`ch0_m3_mendeleev`). | *The Sovereign of the Missing Columns* — an autonomous construct from **The Periodic Spire** (`region_periodic_spire`) that has evolved beyond teaching into imposing gapless order on matter. |
| **Composition & Orientation** | Near-frontal, bilaterally symmetrical museum bust (`0°` turn, `x = 448` vertical centerline). | Distinct slight three-quarter bust (`~14°` turn facing subtly **viewer-right**, contrasting Frontier Lavoisier's viewer-left orientation). |
| **Grooming & Presence** | Orderly, symmetrically combed sweeping silver-white hair; full, neatly shaped patriarchal beard; crisp uncreased frock coat lapels. | Fuller, slightly wilder wind-swept iron-grey/silver hair; denser, layered, subtly bifurcated beard with heavier sculptural volume; slightly forward-set commanding shoulders. |
| **Lighting & Material Finish** | Clean translucent alabaster-cyan archival hologram (`#f4fbff` / `#dff6ff` / `#7dd3fc` / `#5eead4`), uniform balanced studio illumination, ultra-delicate museum scanlines. | Warm commercial painterly 2D realism (**85%+ warm human skin and 19th-century wool/silk**), accented by **Gen-2 bilateral lighting mismatch** (cool cyan-violet rim light on viewer-left vs. warm gaslamp-ivory bounce on viewer-right). |
| **Reconstruction Artifacts** | **Strictly ZERO** seams, veins, crystalline drift, or ocular desync. | **Generation 2 Drifting:** Delicate translucent pale violet-cyan crystalline hairline veins tracing subtly along the shadowed neck above the wing collar and branching faintly at the left temple beneath swept hair; faint geometric mineral sheen at the deep beard-to-collar shadow margin (`restingSeamOpacity: 0.14`). |
| **Background Motif** | Deep archival indigo (`#09192b`) with calibrated concentric Academy rings **intersected by crisp symmetrical periodic-table column hairlines and group ticks**. | Subordinate twilight slate-indigo (`#0a0e1b → #16182e`) with whisper-faint 19th-century drafted periodic grid coordinates and **empty bracketed eka-element cells** (`[ ? ]`). |

---

## 3. Visual Concept Breakdown

### 3.1 Silhouette & Posture (Contrast vs. Lavoisier)
- **Lavoisier (`SCI-LAV-001`):** Narrower 18th-century aristocratic profile, rounded rolled wig silhouette, tall delicate pleated cravat, clean-shaven slender chin.
- **Mendeleev (`SCI-MEN-002`):** **Monumental trapezoidal silhouette.** Broad, heavy 19th-century professorial shoulders framed by wide peaked frock-coat lapels; expansive lion-like mane of swept-back shoulder-length iron-grey hair framing a wide, domed intellectual forehead; commanding full beard anchoring the lower third of the head into the torso. At `42×42px` circular crop, his heavy brows, deep-set eyes, sweeping mustache, and silver-grey beard create an unmistakable silhouette that cannot be confused with Lavoisier, Pauling, or Curie.

### 3.2 Facial Structure & Anatomy
- **Age & Bearing:** Late 50s to early 60s — mature, authoritative, weathered by decades of laboratory work and lecturing (inspired by historical St. Petersburg photographs and Ilya Repin's iconic portraiture without becoming a slavish photographic trace).
- **Forehead & Brow Ridge:** Broad, high domed forehead with horizontal analytical crease lines and **heavy, sculptural iron-grey eyebrows** — Mendeleev's primary emotional instrument (crucial because his mustache and beard partially frame his mouth).
- **Eyes (Unobstructed Design Decision):** Deep-set, penetrating storm-blue / steel-grey eyes positioned strictly at **`y ≈ 34%`** (`y ≈ 408px` on an `896×1200` canvas) for seamless `.v-portrait-mini` framing.
  - **Why No Spectacles Over the Eyes:** While `assets/portraits/mendeleev.svg` included glowing purple glasses, production painterly rigs require clean eyelid/iris visibility at `42×42px` mobile scale and unobstructed ocular divergence for Gen-2 Frontier drift. Historically, Mendeleev was most famously depicted unspectacled. Instead, his optical/scientific heritage is preserved via a **fine brushed-silver pince-nez / pocket-watch chain** clipped to his waistcoat lapel.
- **Nose, Mustache & Full Beard:** Straight, strong bridge with defined nasolabial structure; thick sweeping mustache arching naturally over the upper lip (leaving clear lip-parting visibility for speech); dense, layered, slightly bifurcated patriarchal beard cascading across the cravat knot and upper waistcoat.

### 3.3 Clothing & Era-Authentic Scientific Accessories
- **Primary Garment:** Heavy matte **late-19th-century Russian university professor's double-breasted frock coat** in obsidian-charcoal / deep slate-indigo wool (`#181c28`). Broad structured lapels carry **ultra-fine periodic-lattice micro-stitching** (a crisp tabular grid thread pattern visible only at Studio/Encounter inspection scale — strictly subordinate to the wool fabric).
- **Waistcoat:** Structured dark **slate-plum / muted amethyst-charcoal waistcoat** (`#2b2238`) with brushed pewter buttons (`#94a3b8` / `#cbd5e1`). This honors Mendeleev's canonical `#a855f7` violet UI accent in a grounded, historical 1890s fabric tone rather than neon purple.
- **Collar & Neckwear:** Crisp, slightly starched **standing off-white Victorian wing collar** (`#ebe5d8`) framing the jawline/neck (and cleanly framing Frontier Mendeleev's Gen-2 translucent crystalline neck veins), paired with a **dark knotted charcoal-plum silk cravat/tie** (`#241d31`).
- **Scientific Accessories:** A **fine brushed-silver pince-nez / pocket-watch chain** anchored across the waistcoat buttonhole toward the breast pocket, plus an understated **geometric silver lapel clasp** etched with a tiny 3-cell valence notch — zero sci-fi armor, zero mechanical prosthetics, zero glowing tubes.

### 3.4 Lighting, Material Treatment & Gen-2 Degradation Placement
- **Institute Mendeleev Lighting:** Balanced cool-alabaster front-upper studio key (`#f4fbff`) with luminous prism-cyan edge halo (`#7dd3fc` / `#5eead4`). Every material translates into finely separated tonal densities (dense frosted slate-cyan coat, bright alabaster collar, crisp holographic hair strands).
- **Frontier Mendeleev Lighting (Gen-2 Bilateral Mismatch):**
  - *Viewer-Right Key/Fill:* Warm muted gaslamp-ivory bounce (`#f0dfc8`) modeling the broad forehead, nose bridge, and warm human skin texture (`#dfb99d`).
  - *Viewer-Left Rim & Shadow Plane:* Cooler spectral cyan-violet rim (`#38bdf8` blended toward `#a78bfa`) — subtly inconsistent in color temperature with the right cheek, creating the exact *"bilateral lighting/shading mismatch"* specified for Generation 2 constructs in `VALENCY_VISUAL_DESIGN_BIBLE.md` §7.
- **Gen-2 Crystalline Veins (`layer_mech_crystal`):** Positioned along the **shadowed viewer-left side of the neck immediately above the white wing collar** and branching lightly into the **left temple beneath the swept-back hair**. At calm rest (`opacity: 0.14`), they read almost like faint translucent silver-violet veins or cold light refraction; during rare Gen-2 instability pulses (`opacity: 0.84`), they clarify into geometric quartz-amethyst periodic lattice fractures.

### 3.5 Color Identity Specification
| Region / Role | Institute Mendeleev (`SCI-MEN-002-INST`) | Frontier Mendeleev (`SCI-MEN-002`) |
|---|---|---|
| **Primary Coat / Outer Silhouette** | Frosted Archival Slate `#28445c` (highlight `#7dd3fc`) | Obsidian-Charcoal Wool `#181c28` (fold `#293044`, shadow `#0d1018`) |
| **Secondary Waistcoat / Accent Heritage** | Luminous Ice-Blue `#bae6fd` | Muted Slate-Plum Wool `#2b2238` (highlight `#433556`, shadow `#1a1424`) |
| **Collar & Linen** | Alabaster Cyan `#f4fbff` | Weathered Off-White Linen `#ebe5d8` (shadow `#bfb6a5`) |
| **Skin Tone** | Translucent Alabaster `#dff6ff` (contour `#4e7691`) | Mature Human Warmth `#dfb99d` (highlight `#f2d8c4`, shadow `#8b624e`) |
| **Hair & Patriarchal Beard** | Silver-Alabaster `#e6f4fb` (shadow `#648ba6`) | Iron-Grey & Silver `#c8cfd8` (highlight `#eef2f6`, deep iron `#5a6270`) |
| **Signature Rim / Gen-2 Accent** | Calibrated Cyan `#7dd3fc` & Teal `#5eead4` | Restrained Amethyst `#a78bfa` & Spectral Cyan `#38bdf8` (≤15% surface area) |
| **Subordinate Backdrop** | Deep Archival Indigo `#09192b` | Twilight Slate-Indigo `#0a0e1b → #16182e` |

### 3.6 Character-Specific Visual Motifs
1. **The Empty Cell (`[ ? ]` / Eka-Gap):** Replaces Lavoisier's analytical balance scale. Appears softly drafted in Frontier Mendeleev's backdrop and briefly in his Gen-2 instability telemetry (`EKA-SYNC // COL.IV`).
2. **Periodic Column Hairlines:** Replaces Lavoisier's pure concentric astrolabe rings on Institute Mendeleev — concentric Academy rings intersected by 7–8 calibrated vertical group divisions.
3. **Tabular Micro-Stitching:** Replaces Lavoisier's double-helix/molecular lapel thread with crisp orthogonal 19th-century grid embroidery along the frock-coat lapel seam.
4. **Quartz-Amethyst Lattice Veins:** Distinct from Lavoisier's single cyan hexagonal cheek seam; Mendeleev's Gen-2 veins carry subtle faceted crystal-cleavage angles in pale violet-cyan along his neck and temple.

---

## 4. Preliminary Concept Sheet Package (Stage 3E.1 Review)

All Stage 3E.1 artwork is strictly preliminary concept art for director review (flattened review sheets — **not** production 13-layer PNGs):
1. **Institute Mendeleev Primary Bust Concept:** `assets/characters/sci_men_002_institute/concepts/mendeleev_institute_bust_concept.jpg`
2. **Frontier Mendeleev Primary Bust Concept:** `assets/characters/sci_men_002_frontier/concepts/mendeleev_frontier_bust_concept.jpg`
3. **Institute vs. Frontier Side-by-Side Comparison & Material/Palette Sheet:** `assets/characters/sci_men_002_frontier/concepts/mendeleev_institute_vs_frontier_comparison.jpg`
4. **Frontier Mendeleev 8-Expression Preproduction Exploration Sheet:** `assets/characters/sci_men_002_frontier/concepts/mendeleev_frontier_expressions_sheet.jpg`

> **Stage Gate:** No production `source_master.png`, no `layers/*.png` extraction, no `master_layered.svg`, and no code integration will begin until these concepts and accompanying specifications are explicitly approved for Stage 3E.2.

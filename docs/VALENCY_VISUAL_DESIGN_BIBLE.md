# VALENCY — Visual Design Bible (Stage 3D.1)

**Document Status:** Approved Production Baseline  
**Applies To:** Chapter 0 (Valency Academy), Chapter 1+ (The Elemental Frontier), Card Art, Interfaces, and Animated 2D Character Portraits  
**Core Presentation Principle:** *Cinematic science-fantasy environments paired with painterly illustrated 2D characters, futuristic scientific interfaces, and restrained, atmospheric 2D portrait animation.*

---

## 1. Overall Rendering Style
Valency adopts a **hybrid 2D science-fantasy presentation** — never a 3D character pipeline, never cartoonish caricature, and never generic sci-fi cyberpunk:
- **Painterly Illustrated Characters:** Soft volumetric shading, refined anatomical proportions, crisp line-weight hierarchy (fine dark slate/umber contour lines where planes turn; soft edge blending across skin and silk), subtle porcelain or metallic surface cues.
- **Cinematic Science-Fantasy Environments:** Atmospheric depth created through layered dark-navy twilight fields, restrained volumetric cyan illumination, faint molecular geometry diagrams, and crystalline mineral silhouettes. Backgrounds stay subordinate to readable gameplay elements.
- **Futuristic Scientific Interfaces:** Precision spectrograph grids, clean translucent obsidian-navy cards, calibrated monospace readouts, and theme-driven CSS design tokens (`src/styles/theme-tokens.css`) across four identities: `academy`, `frontier`, `laboratory`, and `collective`.

---

## 2. Character Illustration Standards
- **Realistic Historical Dignity:** Historical Scientist constructs must look like distinguished, recognizable adults of their real-world age and era (e.g., Lavoisier in his late 40s to early 50s), not idealized anime/fantasy heroes.
- **Era-Authentic Silhouettes with Hidden Scientific Detail:** Period clothing (18th-century coat/cravat for Lavoisier, 19th-century frock coat for Mendeleev, mid-20th-century tailoring for Pauling, late-19th-century laboratory attire for Curie) forms the primary visual read. Futuristic elements — micro-crystalline embroidery, geometric seams, restrained metallic clasps, faint cyan edge-light — must remain subordinate and discoverable upon closer inspection.
- **Strictly Forbidden Tropes:**
  - No generic robot faces, glowing visor slits (except non-human Academy Proctor constructs), or exposed sci-fi cyborg armor.
  - No neon full-body glow or cyberpunk HUD tattoos.
  - No exaggerated cartoon proportions or rubber-hose expressions.

---

## 3. Portrait Composition
- **Master Format:** `4:5` Bust Portrait (`800×1000` / `1024×1280` logical canvas, scalable vector/high-DPI layered source).
- **Framing:** Mid-chest upward so shoulders, lapel/collar, cravat, neck, head, and full hair silhouette read cleanly.
- **Head Placement & Turn:** Centered horizontally with `12–16%` negative space above the crown and along both sides so idle head sway, subtle shoulder breathing, and encounter scan effects never clip the viewport.
- **Pose Contrast:**
  - *Frontier Constructs:* Slight three-quarter orientation (`~12°–18°`) conveying observant presence and allowing subtle asymmetry to emerge naturally.
  - *Institute AI Holograms:* Controlled, near-frontal symmetrical bust presentation evoking an archival museum display.
- **Multi-Scale Readability:** Must remain immediately legible across all five UI slots:
  1. Encounter Introduction & Dialogue Stage (`220–300px` wide)
  2. Scientist Equipment / Character Studio (`160–240px`)
  3. Research Archive (`72–110px`)
  4. Battle VS Intro (`120–160px`)
  5. Compact Battle Header (`38–54px` crop centered on head & upper collar)

---

## 4. Lighting & Atmosphere
- **Key Light:** Cool-neutral scientific studio key light (`#e2f1ff` / `#f8fafc` tint) from upper-front-left (`~35°`), modeling cheekbones, nose bridge, and fabric folds cleanly.
- **Fill Light:** Soft warm-ivory bounce (`#f3e6d6` at low intensity) preserving natural human skin warmth in eighteenth/nineteenth-century subjects so characters do not merge into the dark cyan UI.
- **Rim / Backlight:** Restrained cyan-teal edge rim (`#38bdf8` / `#22d3ee`, narrow `1–3px` rim) separating dark coats and hair from deep-navy backgrounds.
- **Reconstruction / Hologram Accents:** Used sparingly on eye catchlights, micro-seams, and rare transient instability frames — never flooding the face.

---

## 5. Color Palettes

| Palette Domain | Primary Swatches | Usage Rules |
|---|---|---|
| **Valency UI & Environments** | Deep Navy `#0b1220`, Slate `#162032`, Epoxy `#10151b`, Cyan `#38bdf8`, Teal `#2dd4bf` | Table surfaces, modals, scientific grid overlays, subtle rim lighting |
| **Frontier Lavoisier (`SCI-LAV-001`)** | Deep Navy `#16243b`, Muted Blue `#2c4263`, Ivory `#f3ead8`, Warm White `#faf6ee`, Soft Silver `#cbd5e1`, Restrained Cyan `#38bdf8` | Warm historical materials carry 85%+ of surface area; cyan reserved for catchlights, micro-seams, and rare instability pulses |
| **Institute AI Hologram** | Alabaster Cyan `#dff6ff`, Prism Sky `#7dd3fc`, Luminous Teal `#5eead4`, Deep Archival Indigo `#09192b` | Clean translucent museum projection, symmetrical prism halo, zero chaotic color noise |
| **The Collective** | Amethyst `#a78bfa`, Indigo `#818cf8`, Cool Ice `#e0e7ff`, Obsidian `#0d0f1d` | Repeating hexagonal symmetry, anomaly readouts, Investigation Log |

---

## 6. Environmental Artwork Standards
- **Visual Hierarchy:** Foreground cards/controls (`100%` contrast) → Character portraits (`85–95%` contrast) → Environmental backdrops (`25–45%` contrast, softened depth, low-frequency detail behind text).
- **Thematic Distinction:**
  - *Academy Environments:* Polished brass-and-glass scientific halls, clean symmetry, archival warmth.
  - *Frontier Environments (e.g., Sector 01: The Caloric Basin):* Expansive twilight vistas, weathered basalt ridges, crystalline mineral formations emitting faint thermal/spectral luminescence, weathered relay monoliths.
  - *Laboratory / Safe Zones:* Calibrated spectrographs, warm workbench task lamps, stable glass vessels.

---

## 7. AI Visual Family & Generation Differences

Valency strictly separates **two artificial intelligence visual families**:

### Family A: Institute AIs (Valency Academy)
- **Visual Identity:** Clean, bilaterally symmetrical, polished museum-hologram reconstructions.
- **Lighting & Finish:** Controlled translucent cyan/alabaster projection, crisp volumetric scanlines, concentric archival rings, steady luminance.
- **Behavior:** Composed, consistent blink intervals, synchronized eye focus, zero anatomical drift. Represents preserved civilization and controlled knowledge.

### Family B: Frontier AIs (Elemental Frontier Constructs)
- **Central Principle:** *A machine attempting to recreate a human from memory after 1,000 cycles — and believing its reconstruction is accurate.*
- **Progressive Degradation Scale Across Future Roster:**
  - **Generation 1 — Early / Intact (Baseline: `SCI-LAV-001` Lavoisier):** Nearly indistinguishable from a real human at first glance. Subtle ~1–2px eye/eyelid asymmetry, faint porcelain skin smoothness, micro-crystalline seam near temple visible only during brief rare corrections, slightly delayed micro-expression settle.
  - **Generation 2 — Drifting (Mid-Frontier Constructs):** Noticeable bilateral lighting/shading mismatch, faint translucent crystalline veins near neck/collar, occasional dual-tempo eye tracking.
  - **Generation 3 — Fractured (Deep Frontier Constructs):** Missing peripheral surface details replaced by matte ceramic or faceted quartz planes, intermittent geometric wireframe flicker on shadowed planes, stiffened jaw articulation.
  - **Generation 4 — Convergent / Severely Degraded (Late Campaign / Collective Interface):** Pronounced structural substitution where human memory breaks into repeating geometric molecular lattices while facial speech remains eerily polite and calm.

---

## 8. Card Artwork Standards
- **Element & Noble Gas Cards:** Retain crisp canonical typography, group-colored headers, live SVG Bohr/valence-electron atoms, and high-legibility SP / Electronegativity badges.
- **Event & Instance Cards:** Retain the 18 verified vector/illustrated artworks in `assets/events/*.svg` with clear red (Hostile Inhibitor) vs. yellow (Catalyst/Utility) framing. Future painted upgrades must slot cleanly through `V.Visual.ASSET_MANIFEST.events` without altering card layout or readability on `320px` mobile viewports.

---

## 9. Animation Expectations
- **Atmospheric Restraint:** Characters never look frozen, yet never bounce or loop like hyperactive arcade sprites.
- **Mandatory Motion Layers:**
  1. Subtle breathing (`~4.5–5.5s` sine cycle affecting chest/shoulders/coat subtly, `1.5–2.5px` vertical amplitude).
  2. Gentle head sway & micro-nod (`~6–8s` non-repeating layered harmonic motion, `±1.2°` rotation max).
  3. Natural eye blinking (`3.2–6.5s` randomized interval) + subtle independent gaze shifts.
  4. Dialogue expression blending across 8 restrained personality states (`neutral`, `thoughtful`, `amused`, `explaining`, `concerned`, `disappointed`, `irritated`, `instability`).
  5. **Frontier Signature — Reconstruction Micro-Instability:** Rare (`~14–22s` randomized interval on Frontier constructs only, never on Institute holograms) subtle ~350–500ms desync: one eye drifts ~2px off-axis or blinks 60ms late, mouth settles fractionally after brows, and a faint cyan hexagonal seam glints briefly near the temple before snapping cleanly back to composed human alignment.
  6. **Encounter Transition:** Distinct atmospheric 1.1s entrance sequence when initiating a Frontier Construct battle or dialogue stage.
- **Performance & Accessibility:** Every animation layer respects `V.CharacterRig.setReducedMotion(...)`, `V.isAnimationsEnabled()`, and `prefers-reduced-motion: reduce`, collapsing cleanly to crisp static keyframe poses with zero RAF overhead when disabled.

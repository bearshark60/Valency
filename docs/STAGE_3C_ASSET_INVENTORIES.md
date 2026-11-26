# VALENCY — Stage 3C Graphical & Audio Asset Inventories and Roadmaps

---

## 1. Graphical Asset Inventory (Existing Files on Disk)

### A. Static Asset Files (`assets/`)
| Directory / File(s) | Format | Count | Associated Screens / Usage | Status |
| --- | :---: | :---: | --- | --- |
| `assets/events/*.svg` (`acid_rain`, `bond_cleavage`, `buffer_solution`, `catalyst`, `chain_reaction`, `diffusion`, `distillation`, `electrolysis`, `equilibrium_shift`, `exothermic_surge`, `half_life_decay`, `ionization_surge`, `oxidation`, `precipitation`, `reaction_delay`, `resonance_stabilizer`, `synthesis_accelerator`, `thermal_activation`) | `.svg` | 18 | Battle hand cards, 2-second Opponent Showcase, Card Inspector, Event Art Gallery (Desktop & Mobile) | **In Use (Canonical)** |
| `assets/portraits/lavoisier.svg`, `mendeleev.svg`, `pauling.svg`, `curie.svg`, `proctor.svg` | `.svg` | 5 | Academy Story Mode Briefings, Registration Day, Frontier Scientist Lab (`scientists.js`, `scientistEquipment.js`, `storyUI.js`, `frontierUI.js`) | **In Use (Vector Placeholder Portraits)** |
| `assets/icons/valency-icon-{180,192,512}.png` | `.png` | 3 | iPhone Home Screen (`apple-touch-icon`), Android/PWA `manifest.webmanifest`, favicon | **In Use (Production Icon)** |

### B. Procedural / Inline Visual Assets
| Asset | Source Module | Associated Screens | Notes |
| --- | --- | --- | --- |
| Animated Bohr Atom Diagrams | `src/ui/animations.js` (`renderAtomSVG`) | Home Menu logo, Element cards | Procedural SVG, scales cleanly |
| Molecular Cluster Visuals | `src/ui/animations.js` (`renderMoleculeClusterSVG`) | Field Compound Tiles | Procedural SVG |
| Inline Character Avatars (`player`, `rival`, `lavoisier`, `mendeleev`, `pauling`, `curie`, `proctor`) | `src/ui/animations.js` (`renderPortraitSVG`) | Match zone headers, Pre-Match VS Intro, Dialogue lines, Story Hub | Duplicates `assets/portraits/*.svg` vector art — unified via `V.Visual.renderPortrait()` in Stage 3C |
| Lab Glassware Silhouette & Epoxy Grid Background | `src/styles/main.css` | Menu & Match table | Themeable via Stage 3C CSS tokens (`theme-tokens.css`) |

### C. Graphical Asset Roadmap (Needed for Next Stages)
Priority order for future art production (all registered in `V.Visual.ASSET_MANIFEST` with explicit `ROADMAP_PLACEHOLDER` status and zero broken image paths):
1. **Frontier Hub Background** (`assets/scenes/frontier_hub_bg.*`) — Cinematic crystalline science-fantasy vista with subtle molecular geometry.
2. **Regional Map Artwork** (`assets/scenes/region_caloric_basin_map.*`) — Illustrated Sector 01 terrain map showing Hearth Outpost, Caloric Vent, Relay Ruins, and Conservation Crucible.
3. **Settlement Artwork** (`assets/scenes/loc_hearth_outpost.*`) — Fortified academic field settlement with glowing calibration benches.
4. **Laboratory / Relay Artwork** (`assets/scenes/loc_archive_ruins.*`) — Experimental equipment, spectrographs, and Convergence telemetry hardware.
5. **Expedition Environment Artwork** (`assets/scenes/exp_caloric_crucible.*`) — Atmospheric caldera laboratory interior with thermal vents & unstable crystal fractures.
6. **Illustrated Scientist Portraits** (`assets/portraits/*_illustrated.*`) — High-resolution painted portraits upgrading the 5 existing `.svg` vector portraits.
7. **Rogue Scientist Encounter Artwork** (`assets/encounters/rogue_lavoisier.*`) — Dramatic Frontier construct presentation distinct from the Academy simulation.
8. **Custom Element Card Artwork** (`assets/cards/elements/*`) — Distinctive illustrations complementing Bohr diagrams on flagship elements.
9. **Anomaly & Collective Visual Effects** (`assets/fx/collective_lattice.*`) — Repeating geometric molecular symmetry overlays communicating Collective order and control.

---

## 2. Audio Asset Inventory (Existing Files on Disk & Synthesized Fallbacks)

> **Preservation Guarantee:** All existing menu and game-mode music files are preserved untouched with identical screen assignments.

### A. Existing Audio Files (`assets/audio/`)
| File Name | Format | Size | Current Location | Current Scene / Screen Assignment | Playback Behavior | Type |
| --- | :---: | :---: | --- | --- | --- | :---: |
| `menu-theme.wav` | `.wav` | 4.54 MB | `assets/audio/` | **Main Menu** (`main_menu` / `#bgm-menu`) | Looping BGM; fades in on first gesture | Music |
| `ai-battle-theme.wav` | `.wav` | 31.75 MB | `assets/audio/` | **Classic Match vs. Dr. Mendeleev (AI)** (`classic_ai` / `#bgm-vs_ai`) | Looping BGM during Classic AI match | Music |
| `tutorial-theme.wav` | `.wav` | 31.30 MB | `assets/audio/` | **Interactive Tutorial** (`tutorial` / `#bgm-tutorial`) | Looping BGM across all 7 guided lessons | Music |
| `lightning.wav` | `.wav` | 0.91 MB | `assets/audio/` | **Unassigned** (currently not wired to an active event) | Unused file preserved on disk | Sound Effect |

### B. Built-In Synthesized Audio (`src/ui/sound.js`)
- **16 Web Audio SFX:** `playCardSelect`, `playButtonClick`, `playError`, `playCardDraw`, `playIntroClash`, `playSynthesize`, `playShield`, `playTakeover`, `playAcid`, `playLaser`, `playCrystal`, `playShatter`, `playFreeze`, `playUtility`, `playAbility`, `playTurnChime`, `playVictory`, `playDefeat`.
- **9 Web Audio Synth Music Fallbacks:** `menu`, `vs_ai`, `pass_and_play`, `tutorial`, `scientist_lavoisier`, `scientist_mendeleev`, `scientist_pauling`, `scientist_curie`, `scientist_proctor` (used automatically only when no custom file is dropped in).

### C. Remaining Music & Sound Assets Roadmap (Composable Drop-Ins)
Every category below is pre-registered in `src/presentation/audioConfig.js` with explicit `UNASSIGNED_FALLBACK` status (zero silent reassignment of unrelated tracks):
- **Academy:** `academy-menu-theme.*`, `academy-story-theme.*`, plus optional custom replacements for `lavoisier-theme.*`, `mendeleev-theme.*`, `pauling-theme.*`, `curie-theme.*`, `final-exam-theme.*`.
- **Frontier Exploration & Safe Zones:** `frontier-hub-theme.*`, `frontier-exploration-theme.*`, `frontier-settlement-theme.*`, `frontier-lab-theme.*`.
- **Frontier Expeditions & Encounters:** `frontier-expedition-theme.*`, `frontier-encounter-standard.*`, `frontier-encounter-elite.*`, `frontier-encounter-rogue.*`.
- **Frontier Narrative & Outcomes:** `frontier-victory-stinger.*`, `frontier-defeat-stinger.*`, `frontier-anomaly-discovery.*`, `collective-story-theme.*`.
- **Mobile Optimization Note:** Exporting `.m4a` (AAC) or `.mp3` versions alongside the two ~31 MB `.wav` files will dramatically reduce mobile cellular download size while keeping lossless WAVs intact for desktop.

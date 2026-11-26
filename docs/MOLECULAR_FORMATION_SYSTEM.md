# VALENCY — Molecular Formation Animation System

> **Core Canon:** *"The chemistry determines the animation."*
> Animations are generated strictly from chemical identity data—never using planetary Bohr electron orbits, and never depicting ionic crystalline solids as ordinary covalent stick molecules.

---

## 1. Strict 3-Layer Modular Architecture

| Layer | Module | Responsibility | Forbidden Coupling |
| :--- | :--- | :--- | :--- |
| **Layer 1: Chemical Identity Data** | `src/data/chemicalIdentity.js` (`Valency.ChemicalIdentity`) | Pure immutable registry of formulas, element counts, valence electrons, electronegativity, bond types/orders, VSEPR geometry, polarity, electron transfers, and ionic lattices. | No DOM, no timers, no animation code, no combat/SP rules. |
| **Layer 2: Formation Choreography Engine** | `src/presentation/formationChoreography.js` (`Valency.FormationChoreography`) | Pure data-driven SVG + `requestAnimationFrame` engine with shared reusable primitives (`atomEntrance`, `electronSharing`, `electronTransfer`, `bondIllumination`, `latticeAssembly`), speed presets, skip, and reduced-motion support. | No `gameEngine` state, no combat math, no per-compound hardcoded switch blocks. |
| **Layer 3: Battle Presentation Integration** | `src/presentation/battleFormationBridge.js` (`Valency.BattleFormation`) + `src/styles/molecular-formation.css` | Hooks cleanly into `animations.js` (`playGameEvents`, `renderMoleculeClusterSVG`, `setAnimationsEnabled`) and `app.js` (`showMenuScreen`, `#menu-btn-formation-lab`) without duplicating banners or altering card resolution. | Never mutates game state, SP totals, hands, or status effects. |

---

## 2. Initial 5 Canonical Compounds

| Compound | Formula | Bonding Model | Geometry & Angle | Choreography Primitives |
| :--- | :---: | :--- | :--- | :--- |
| **Water** | `H₂O` | 2 polar covalent single bonds (`ΔEN 1.4`) | Bent (`~104.5°`, `AX₂E₂`, 2 lone pairs on O) | `atomEntrance` → `electronSharing` (skewed toward O) → `bondIllumination` + net dipole |
| **Methane** | `CH₄` | 4 covalent single bonds (`ΔEN 0.4`) | Tetrahedral (`~109.5°`, `AX₄`, 3D wedge/dash) | `atomEntrance` → `electronSharing` (symmetric) → `bondIllumination` (nonpolar) |
| **Carbon Dioxide** | `CO₂` | 2 double bonds (`order: 2`, `ΔEN 1.0`) | Linear (`180°`, `AX₂`, dipoles cancel) | `atomEntrance` → `electronSharing` (2 σ/π pairs/side) → `bondIllumination` + canceling dipoles |
| **Sodium Chloride** | `NaCl` | Ionic electron transfer (`Na → Cl`, `ΔEN 2.1`) | Cubic Rock-Salt Lattice (`6:6 FCC`) | `atomEntrance` → `electronTransfer` (`Na⁺` contracts, `Cl⁻` expands) → `latticeAssembly` (zero covalent sticks) |
| **Ammonia** | `NH₃` | 3 polar covalent single bonds (`ΔEN 0.9`) | Trigonal Pyramidal (`~107°`, `AX₃E`, 1 apical lone pair) | `atomEntrance` → `electronSharing` (skewed toward N) → `bondIllumination` + 3D base plane + net dipole |

---

## 3. Playback Controls, Accessibility & Mobile Performance

- **Duration Target:** Every compound defaults to **1.5–3.0 s** (`2150–2650 ms` at `1×`), clamped safely to `[1500, 3000]` ms.
- **Configurable Speed:** `0.75×`, `1×`, `1.5×`, `2×` via `Valency.FormationChoreography.setSpeed(mult)` or the live overlay pill (persisted to `localStorage`).
- **Instant Skip:** Click **Skip ⏭**, press `Escape` / `Space`, or call `handle.skip()` to settle cleanly with zero leaked timers or `rAF` callbacks.
- **Reduced-Motion Mode:** Automatically honors `prefers-reduced-motion: reduce`, the in-game `✨ FX: Off` toggle (`body.fx-reduced`), or `Valency.FormationChoreography.setReducedMotion(true)`. Schedules **zero** `requestAnimationFrame` loops and displays the crisp equilibrium diagram directly.
- **Mobile 60 fps Guardrails:** Compact SVG scene graph (`< 85` SVG elements even for the 12-ion NaCl 3D lattice), unique per-instance `<defs>` prefixes, pure `transform`/`opacity` updates with `contain: layout style paint`, and iOS safe-area responsive layout in `src/styles/molecular-formation.css`.

---

## 4. How to Add a New Compound (Data-Only)

You do **not** need to edit Layer 2 (`formationChoreography.js`), Layer 3 (`battleFormationBridge.js`), `animations.js`, or `app.js` to add a new compound.

Register a data object via `Valency.ChemicalIdentity.registerCompound(...)` (or add an entry to `INITIAL_COMPOUNDS` in `src/data/chemicalIdentity.js`):

```js
Valency.ChemicalIdentity.registerCompound({
  id: 'hydrogen_fluoride',
  formula: 'HF',
  asciiFormula: 'HF',
  canonicalKey: 'F:1|H:1',
  name: 'Hydrogen Fluoride',
  bondingModel: 'polar_covalent', // 'covalent' | 'polar_covalent' | 'ionic'
  atomCounts: { H: 1, F: 1 },
  totalValenceElectrons: 8,
  elements: [
    { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, count: 1, valenceElectrons: 1, electronegativity: 2.1, role: 'terminal' },
    { symbol: 'F', name: 'Fluorine', atomicNumber: 9, count: 1, valenceElectrons: 7, electronegativity: 4.0, role: 'terminal' },
  ],
  atoms: [
    {
      atomId: 'H1', symbol: 'H', role: 'terminal',
      valenceElectrons: 1, electronegativity: 2.1, formalCharge: 0, partialCharge: 'δ⁺',
      position: { x: -0.68, y: 0, z: 0 }, lonePairs: 0, lonePairDirs: [],
    },
    {
      atomId: 'F1', symbol: 'F', role: 'terminal',
      valenceElectrons: 7, electronegativity: 4.0, formalCharge: 0, partialCharge: 'δ⁻',
      position: { x: 0.68, y: 0, z: 0 }, lonePairs: 3,
      lonePairDirs: [{ x: 0.85, y: 0 }, { x: 0.28, y: -0.82 }, { x: 0.28, y: 0.82 }],
    },
  ],
  bonds: [
    {
      bondId: 'H1-F1', from: 'H1', to: 'F1',
      type: 'polar_covalent', order: 1, sharedElectronPairs: 1,
      deltaEN: 1.9, dipoleToward: 'F1', bondLengthPm: 92, depthCue: 'in_plane',
    },
  ],
  electronTransfers: [],
  lattice: null,
  geometry: {
    name: 'linear',
    label: 'Linear (Diatomic)',
    vseprNotation: 'AX',
    hybridization: 'sp³',
    bondAngleDeg: 180,
    angleArc: null,
    basePlaneAtomIds: null,
  },
  polarity: {
    molecularPolarity: 'polar',
    bondPolarity: 'polar_covalent',
    bondDipolesCancel: false,
    dipoleVector: { x: 0.85, y: 0 },
    summary: 'Fluorine (EN 4.0) strongly polarizes the shared electron pair toward F (δ⁻).',
  },
  visualHints: {
    accentColor: '#a3e635',
    bondColor: '#a3e635',
    baseDurationMs: 1900,
  },
});
```

### Ionic Compound Checklist
When adding an ionic solid (e.g., `KCl`, `MgO`, `LiF`):
1. Set `bondingModel: 'ionic'` and `bonds: []` (**mandatory guardrail**—`validateChemicalIdentity` rejects covalent bonds on ionic records).
2. Populate `electronTransfers` with `{ from, to, electronCount, deltaEN, resultingCation: { radiusScale < 1 }, resultingAnion: { radiusScale > 1 } }`.
3. Optionally attach `lattice: { system, structureName, coordinationNumber, unitNodes, electrostaticLinks }` to automatically enable the `latticeAssembly` primitive.

Once registered, the compound automatically animates on **Synthesis**, **Stabilization**, and **EN Takeover** in battle, renders accurately on field compound tiles, and appears in the **⚛ Formation Lab** preview modal.

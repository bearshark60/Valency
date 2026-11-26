// VALENCY — Layer 1: Chemical Identity Data Registry
// Pure, data-driven scientific schema describing compounds for molecular formation.
// STRICT LAYER BOUNDARY:
//   - Contains ONLY chemical structure, bonding, electronegativity, geometry, polarity, and lattice data.
//   - Contains ZERO DOM manipulation, ZERO animation timers, and ZERO combat/SP rules.
//   - "The chemistry determines the animation": Layer 2 reads this schema directly to choreograph motion.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const SCHEMA_VERSION = 1;

  const SUBSCRIPT_TO_ASCII = {
    '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
    '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  };

  /**
   * Scientific CPK-aligned visual palette for element nuclei & valence electron clouds.
   * Pure descriptive metadata (color & relative covalent/ionic radii in picometers).
   */
  const ELEMENT_VISUAL_DATA = Object.freeze({
    H:  Object.freeze({ symbol: 'H',  name: 'Hydrogen', atomicNumber: 1,  valenceElectrons: 1, electronegativity: 2.1, covalentRadiusPm: 31,  coreColor: '#e0f2fe', rimColor: '#38bdf8', cloudColor: '#7dd3fc', textColor: '#0f172a' }),
    C:  Object.freeze({ symbol: 'C',  name: 'Carbon',   atomicNumber: 6,  valenceElectrons: 4, electronegativity: 2.5, covalentRadiusPm: 76,  coreColor: '#334155', rimColor: '#94a3b8', cloudColor: '#cbd5e1', textColor: '#f8fafc' }),
    N:  Object.freeze({ symbol: 'N',  name: 'Nitrogen', atomicNumber: 7,  valenceElectrons: 5, electronegativity: 3.0, covalentRadiusPm: 71,  coreColor: '#2563eb', rimColor: '#93c5fd', cloudColor: '#60a5fa', textColor: '#ffffff' }),
    O:  Object.freeze({ symbol: 'O',  name: 'Oxygen',   atomicNumber: 8,  valenceElectrons: 6, electronegativity: 3.5, covalentRadiusPm: 66,  coreColor: '#dc2626', rimColor: '#fca5a5', cloudColor: '#f87171', textColor: '#ffffff' }),
    F:  Object.freeze({ symbol: 'F',  name: 'Fluorine', atomicNumber: 9,  valenceElectrons: 7, electronegativity: 4.0, covalentRadiusPm: 57,  coreColor: '#84cc16', rimColor: '#d9f99d', cloudColor: '#a3e635', textColor: '#0f172a' }),
    Na: Object.freeze({ symbol: 'Na', name: 'Sodium',   atomicNumber: 11, valenceElectrons: 1, electronegativity: 0.9, covalentRadiusPm: 166, ionicRadiusPm: 102, coreColor: '#eab308', rimColor: '#fef08a', cloudColor: '#facc15', textColor: '#1e1b4b' }),
    Mg: Object.freeze({ symbol: 'Mg', name: 'Magnesium',atomicNumber: 12, valenceElectrons: 2, electronegativity: 1.2, covalentRadiusPm: 141, ionicRadiusPm: 72,  coreColor: '#f97316', rimColor: '#fed7aa', cloudColor: '#fb923c', textColor: '#ffffff' }),
    S:  Object.freeze({ symbol: 'S',  name: 'Sulfur',   atomicNumber: 16, valenceElectrons: 6, electronegativity: 2.5, covalentRadiusPm: 105, coreColor: '#ca8a04', rimColor: '#fef08a', cloudColor: '#fde047', textColor: '#0f172a' }),
    Cl: Object.freeze({ symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, valenceElectrons: 7, electronegativity: 3.0, covalentRadiusPm: 102, ionicRadiusPm: 181, coreColor: '#16a34a', rimColor: '#86efac', cloudColor: '#4ade80', textColor: '#ffffff' }),
    K:  Object.freeze({ symbol: 'K',  name: 'Potassium',atomicNumber: 19, valenceElectrons: 1, electronegativity: 0.8, covalentRadiusPm: 203, ionicRadiusPm: 138, coreColor: '#a855f7', rimColor: '#e9d5ff', cloudColor: '#c084fc', textColor: '#ffffff' }),
  });

  function normalizeFormula(formula) {
    if (!formula || typeof formula !== 'string') return '';
    return formula
      .trim()
      .replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (ch) => SUBSCRIPT_TO_ASCII[ch] || ch)
      .replace(/\s+/g, '');
  }

  function makeCanonicalKeyFromCounts(atomCounts) {
    return Object.keys(atomCounts || {})
      .filter((sym) => atomCounts[sym] > 0)
      .sort()
      .map((sym) => `${sym}:${atomCounts[sym]}`)
      .join('|');
  }

  function deepFreeze(obj) {
    if (!obj || typeof obj !== 'object' || Object.isFrozen(obj)) return obj;
    Object.freeze(obj);
    for (const key of Object.keys(obj)) {
      deepFreeze(obj[key]);
    }
    return obj;
  }

  /**
   * Build a 3D-projected 2-layer NaCl rock-salt (FCC 6:6) ionic crystal lattice dataset.
   * Alternating Na+ and Cl- nodes with orthogonal electrostatic links (never covalent sticks).
   */
  function buildRockSaltLatticeData() {
    const unitNodes = [];
    const electrostaticLinks = [];
    const cols = 3;
    const rows = 2;
    const layers = 2;
    const dx = 0.66;
    const dy = 0.64;
    const depthShiftX = 0.24;
    const depthShiftY = -0.22;

    const indexMap = {};
    for (let layer = 0; layer < layers; layer++) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          // Alternating parity across all 3 axes guarantees 6:6 NaCl coordination
          const isCation = (c + r + layer) % 2 === 0;
          const nodeId = `L_${layer}_${r}_${c}`;
          const baseX = (c - (cols - 1) / 2) * dx;
          const baseY = (r - (rows - 1) / 2) * dy;
          const isoOffset = layer === 0 ? -0.5 : 0.5;
          const x = Number((baseX + isoOffset * depthShiftX).toFixed(3));
          const y = Number((baseY + isoOffset * depthShiftY).toFixed(3));
          const z = layer === 0 ? -0.55 : 0.55;
          const node = {
            nodeId,
            symbol: isCation ? 'Na' : 'Cl',
            charge: isCation ? '+1' : '-1',
            role: isCation ? 'cation' : 'anion',
            radiusScale: isCation ? 0.72 : 1.18,
            col: c,
            row: r,
            layer,
            x,
            y,
            z,
            isPrimaryPair: layer === 1 && r === 0 && (c === 0 || c === 1),
          };
          unitNodes.push(node);
          indexMap[`${layer}:${r}:${c}`] = nodeId;
        }
      }
    }

    // Connect strictly nearest-neighbor opposite-charge ions along x, y, and z crystal axes
    for (let layer = 0; layer < layers; layer++) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const from = indexMap[`${layer}:${r}:${c}`];
          if (c + 1 < cols) {
            electrostaticLinks.push({ from, to: indexMap[`${layer}:${r}:${c + 1}`], axis: 'x' });
          }
          if (r + 1 < rows) {
            electrostaticLinks.push({ from, to: indexMap[`${layer}:${r + 1}:${c}`], axis: 'y' });
          }
          if (layer + 1 < layers) {
            electrostaticLinks.push({ from, to: indexMap[`${layer + 1}:${r}:${c}`], axis: 'z' });
          }
        }
      }
    }

    return {
      system: 'face_centered_cubic',
      structureName: 'Rock-Salt Crystal Lattice (FCC)',
      coordinationNumber: 6,
      repeatingFormulaUnit: 'Na⁺Cl⁻',
      unitNodes,
      electrostaticLinks,
    };
  }

  /**
   * Schema validator for Layer 1 Chemical Identity definitions.
   * Enforces scientific guardrails:
   *   - Ionic compounds must declare electronTransfers and MUST NOT declare covalent bonds.
   *   - Covalent / polar_covalent compounds must declare valid bonds referencing defined atoms.
   *   - Every compound must include formula, elements, atomCounts, valence electrons, electronegativity, geometry, polarity.
   */
  function validateChemicalIdentity(spec) {
    const errors = [];
    if (!spec || typeof spec !== 'object') {
      return { valid: false, errors: ['Specification must be an object.'] };
    }
    if (!spec.id || typeof spec.id !== 'string') errors.push('Missing string id.');
    if (!spec.formula || typeof spec.formula !== 'string') errors.push('Missing string formula.');
    if (!spec.name || typeof spec.name !== 'string') errors.push('Missing string name.');
    if (!['covalent', 'polar_covalent', 'ionic'].includes(spec.bondingModel)) {
      errors.push(`Invalid bondingModel "${spec.bondingModel}". Expected covalent | polar_covalent | ionic.`);
    }
    if (!Array.isArray(spec.elements) || spec.elements.length === 0) {
      errors.push('Missing non-empty elements array.');
    }
    if (!spec.atomCounts || typeof spec.atomCounts !== 'object' || Object.keys(spec.atomCounts).length === 0) {
      errors.push('Missing atomCounts map.');
    }
    if (typeof spec.totalValenceElectrons !== 'number' || spec.totalValenceElectrons <= 0) {
      errors.push('totalValenceElectrons must be a positive number.');
    }
    if (!Array.isArray(spec.atoms) || spec.atoms.length < 2) {
      errors.push('atoms array must define at least 2 atoms.');
    }

    const atomIds = new Set();
    if (Array.isArray(spec.atoms)) {
      for (const atom of spec.atoms) {
        if (!atom.atomId || !atom.symbol) errors.push('Each atom requires atomId and symbol.');
        if (typeof atom.valenceElectrons !== 'number') errors.push(`Atom ${atom.atomId} missing valenceElectrons.`);
        if (typeof atom.electronegativity !== 'number') errors.push(`Atom ${atom.atomId} missing electronegativity.`);
        if (!atom.position || typeof atom.position.x !== 'number' || typeof atom.position.y !== 'number') {
          errors.push(`Atom ${atom.atomId} missing numeric position {x, y}.`);
        }
        atomIds.add(atom.atomId);
      }
    }

    if (spec.bondingModel === 'ionic') {
      if (Array.isArray(spec.bonds) && spec.bonds.some((b) => b.type !== 'electrostatic')) {
        errors.push('Scientific guardrail: Ionic compounds MUST NOT define covalent bonds.');
      }
      if (!Array.isArray(spec.electronTransfers) || spec.electronTransfers.length === 0) {
        errors.push('Ionic compounds must define electronTransfers.');
      }
    } else {
      if (!Array.isArray(spec.bonds) || spec.bonds.length === 0) {
        errors.push('Covalent compounds must define at least one bond.');
      } else {
        for (const bond of spec.bonds) {
          if (!atomIds.has(bond.from) || !atomIds.has(bond.to)) {
            errors.push(`Bond ${bond.bondId || '?'} references unknown atomId.`);
          }
          if (![1, 2, 3].includes(bond.order)) {
            errors.push(`Bond ${bond.bondId || '?'} has invalid order ${bond.order}.`);
          }
        }
      }
    }

    if (!spec.geometry || !spec.geometry.name || typeof spec.geometry.bondAngleDeg !== 'number') {
      errors.push('geometry must specify name and numeric bondAngleDeg.');
    }
    if (!spec.polarity || !['polar', 'nonpolar', 'ionic'].includes(spec.polarity.molecularPolarity)) {
      errors.push('polarity.molecularPolarity must be polar | nonpolar | ionic.');
    }

    return { valid: errors.length === 0, errors };
  }

  // ===== INITIAL 5 CANONICAL COMPOUNDS =====
  const INITIAL_COMPOUNDS = [
    // 1. WATER (H2O) — 2 polar covalent single bonds, bent ~104.5°
    {
      schemaVersion: SCHEMA_VERSION,
      id: 'water',
      formula: 'H₂O',
      asciiFormula: 'H2O',
      canonicalKey: 'H:2|O:1',
      name: 'Water',
      bondingModel: 'polar_covalent',
      atomCounts: { H: 2, O: 1 },
      totalValenceElectrons: 8,
      elements: [
        { symbol: 'O', name: 'Oxygen',   atomicNumber: 8, count: 1, valenceElectrons: 6, electronegativity: 3.5, role: 'central' },
        { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, count: 2, valenceElectrons: 1, electronegativity: 2.1, role: 'terminal' },
      ],
      atoms: [
        {
          atomId: 'O1',
          symbol: 'O',
          role: 'central',
          valenceElectrons: 6,
          electronegativity: 3.5,
          formalCharge: 0,
          partialCharge: 'δ⁻',
          position: { x: 0, y: -0.22, z: 0 },
          lonePairs: 2,
          lonePairDirs: [
            { x: -0.56, y: -0.78 },
            { x: 0.56, y: -0.78 },
          ],
        },
        {
          atomId: 'H1',
          symbol: 'H',
          role: 'terminal',
          valenceElectrons: 1,
          electronegativity: 2.1,
          formalCharge: 0,
          partialCharge: 'δ⁺',
          // Exact 104.5° bond angle: half-angle = 52.25°, sin=0.7907, cos=0.6122, radius=0.86
          position: { x: -0.68, y: 0.3065, z: 0 },
          lonePairs: 0,
          lonePairDirs: [],
        },
        {
          atomId: 'H2',
          symbol: 'H',
          role: 'terminal',
          valenceElectrons: 1,
          electronegativity: 2.1,
          formalCharge: 0,
          partialCharge: 'δ⁺',
          position: { x: 0.68, y: 0.3065, z: 0 },
          lonePairs: 0,
          lonePairDirs: [],
        },
      ],
      bonds: [
        {
          bondId: 'O1-H1',
          from: 'O1',
          to: 'H1',
          type: 'polar_covalent',
          order: 1,
          sharedElectronPairs: 1,
          deltaEN: 1.4,
          dipoleToward: 'O1',
          bondLengthPm: 96,
          depthCue: 'in_plane',
        },
        {
          bondId: 'O1-H2',
          from: 'O1',
          to: 'H2',
          type: 'polar_covalent',
          order: 1,
          sharedElectronPairs: 1,
          deltaEN: 1.4,
          dipoleToward: 'O1',
          bondLengthPm: 96,
          depthCue: 'in_plane',
        },
      ],
      electronTransfers: [],
      lattice: null,
      geometry: {
        name: 'bent',
        label: 'Bent (~104.5°)',
        vseprNotation: 'AX₂E₂',
        hybridization: 'sp³',
        bondAngleDeg: 104.5,
        angleArc: { vertex: 'O1', armA: 'H1', armB: 'H2', label: '104.5°' },
        basePlaneAtomIds: null,
      },
      polarity: {
        molecularPolarity: 'polar',
        bondPolarity: 'polar_covalent',
        bondDipolesCancel: false,
        dipoleVector: { x: 0, y: -0.82 },
        summary: '2 polar O–H bonds + 2 lone pairs bend H₂O to 104.5°, yielding a strong net dipole.',
      },
      visualHints: {
        accentColor: '#38bdf8',
        bondColor: '#38bdf8',
        baseDurationMs: 2150,
      },
    },

    // 2. METHANE (CH4) — 4 covalent single bonds, tetrahedral ~109.5°
    {
      schemaVersion: SCHEMA_VERSION,
      id: 'methane',
      formula: 'CH₄',
      asciiFormula: 'CH4',
      canonicalKey: 'C:1|H:4',
      name: 'Methane',
      bondingModel: 'covalent',
      atomCounts: { C: 1, H: 4 },
      totalValenceElectrons: 8,
      elements: [
        { symbol: 'C', name: 'Carbon',   atomicNumber: 6, count: 1, valenceElectrons: 4, electronegativity: 2.5, role: 'central' },
        { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, count: 4, valenceElectrons: 1, electronegativity: 2.1, role: 'terminal' },
      ],
      atoms: [
        {
          atomId: 'C1',
          symbol: 'C',
          role: 'central',
          valenceElectrons: 4,
          electronegativity: 2.5,
          formalCharge: 0,
          partialCharge: '0',
          position: { x: 0, y: 0.04, z: 0 },
          lonePairs: 0,
          lonePairDirs: [],
        },
        {
          atomId: 'H1',
          symbol: 'H',
          role: 'terminal',
          valenceElectrons: 1,
          electronegativity: 2.1,
          formalCharge: 0,
          partialCharge: '0',
          position: { x: 0, y: -0.84, z: 0 },
          lonePairs: 0,
          lonePairDirs: [],
        },
        {
          atomId: 'H2',
          symbol: 'H',
          role: 'terminal',
          valenceElectrons: 1,
          electronegativity: 2.1,
          formalCharge: 0,
          partialCharge: '0',
          position: { x: -0.78, y: 0.44, z: 0.52 },
          lonePairs: 0,
          lonePairDirs: [],
        },
        {
          atomId: 'H3',
          symbol: 'H',
          role: 'terminal',
          valenceElectrons: 1,
          electronegativity: 2.1,
          formalCharge: 0,
          partialCharge: '0',
          position: { x: 0.78, y: 0.44, z: 0.52 },
          lonePairs: 0,
          lonePairDirs: [],
        },
        {
          atomId: 'H4',
          symbol: 'H',
          role: 'terminal',
          valenceElectrons: 1,
          electronegativity: 2.1,
          formalCharge: 0,
          partialCharge: '0',
          position: { x: 0.24, y: 0.66, z: -0.68 },
          lonePairs: 0,
          lonePairDirs: [],
        },
      ],
      bonds: [
        { bondId: 'C1-H1', from: 'C1', to: 'H1', type: 'covalent', order: 1, sharedElectronPairs: 1, deltaEN: 0.4, dipoleToward: null, bondLengthPm: 109, depthCue: 'in_plane' },
        { bondId: 'C1-H2', from: 'C1', to: 'H2', type: 'covalent', order: 1, sharedElectronPairs: 1, deltaEN: 0.4, dipoleToward: null, bondLengthPm: 109, depthCue: 'wedge' },
        { bondId: 'C1-H3', from: 'C1', to: 'H3', type: 'covalent', order: 1, sharedElectronPairs: 1, deltaEN: 0.4, dipoleToward: null, bondLengthPm: 109, depthCue: 'wedge' },
        { bondId: 'C1-H4', from: 'C1', to: 'H4', type: 'covalent', order: 1, sharedElectronPairs: 1, deltaEN: 0.4, dipoleToward: null, bondLengthPm: 109, depthCue: 'dash' },
      ],
      electronTransfers: [],
      lattice: null,
      geometry: {
        name: 'tetrahedral',
        label: 'Tetrahedral (~109.5°)',
        vseprNotation: 'AX₄',
        hybridization: 'sp³',
        bondAngleDeg: 109.5,
        angleArc: { vertex: 'C1', armA: 'H1', armB: 'H2', label: '109.5°' },
        basePlaneAtomIds: ['H2', 'H3', 'H4'],
      },
      polarity: {
        molecularPolarity: 'nonpolar',
        bondPolarity: 'nonpolar_covalent',
        bondDipolesCancel: true,
        dipoleVector: null,
        summary: '4 symmetric C–H single bonds share electrons evenly in 109.5° tetrahedral symmetry.',
      },
      visualHints: {
        accentColor: '#fb923c',
        bondColor: '#94a3b8',
        baseDurationMs: 2200,
      },
    },

    // 3. CARBON DIOXIDE (CO2) — 2 double bonds, linear 180°
    {
      schemaVersion: SCHEMA_VERSION,
      id: 'carbon_dioxide',
      formula: 'CO₂',
      asciiFormula: 'CO2',
      canonicalKey: 'C:1|O:2',
      name: 'Carbon Dioxide',
      bondingModel: 'polar_covalent',
      atomCounts: { C: 1, O: 2 },
      totalValenceElectrons: 16,
      elements: [
        { symbol: 'C', name: 'Carbon', atomicNumber: 6, count: 1, valenceElectrons: 4, electronegativity: 2.5, role: 'central' },
        { symbol: 'O', name: 'Oxygen', atomicNumber: 8, count: 2, valenceElectrons: 6, electronegativity: 3.5, role: 'terminal' },
      ],
      atoms: [
        {
          atomId: 'C1',
          symbol: 'C',
          role: 'central',
          valenceElectrons: 4,
          electronegativity: 2.5,
          formalCharge: 0,
          partialCharge: 'δ⁺',
          position: { x: 0, y: 0, z: 0 },
          lonePairs: 0,
          lonePairDirs: [],
        },
        {
          atomId: 'O1',
          symbol: 'O',
          role: 'terminal',
          valenceElectrons: 6,
          electronegativity: 3.5,
          formalCharge: 0,
          partialCharge: 'δ⁻',
          position: { x: -1.04, y: 0, z: 0 },
          lonePairs: 2,
          lonePairDirs: [
            { x: -0.76, y: -0.58 },
            { x: -0.76, y: 0.58 },
          ],
        },
        {
          atomId: 'O2',
          symbol: 'O',
          role: 'terminal',
          valenceElectrons: 6,
          electronegativity: 3.5,
          formalCharge: 0,
          partialCharge: 'δ⁻',
          position: { x: 1.04, y: 0, z: 0 },
          lonePairs: 2,
          lonePairDirs: [
            { x: 0.76, y: -0.58 },
            { x: 0.76, y: 0.58 },
          ],
        },
      ],
      bonds: [
        { bondId: 'C1=O1', from: 'C1', to: 'O1', type: 'polar_covalent', order: 2, sharedElectronPairs: 2, deltaEN: 1.0, dipoleToward: 'O1', bondLengthPm: 116, depthCue: 'in_plane' },
        { bondId: 'C1=O2', from: 'C1', to: 'O2', type: 'polar_covalent', order: 2, sharedElectronPairs: 2, deltaEN: 1.0, dipoleToward: 'O2', bondLengthPm: 116, depthCue: 'in_plane' },
      ],
      electronTransfers: [],
      lattice: null,
      geometry: {
        name: 'linear',
        label: 'Linear (180°)',
        vseprNotation: 'AX₂',
        hybridization: 'sp',
        bondAngleDeg: 180,
        angleArc: { vertex: 'C1', armA: 'O1', armB: 'O2', label: '180°' },
        basePlaneAtomIds: null,
      },
      polarity: {
        molecularPolarity: 'nonpolar',
        bondPolarity: 'polar_covalent',
        bondDipolesCancel: true,
        dipoleVector: null,
        summary: '2 C=O double bonds align at 180°; opposing bond dipoles cancel into a nonpolar molecule.',
      },
      visualHints: {
        accentColor: '#f87171',
        bondColor: '#60a5fa',
        baseDurationMs: 2250,
      },
    },

    // 4. SODIUM CHLORIDE (NaCl) — Ionic electron transfer Na -> Cl into Na+ / Cl- rock-salt lattice
    {
      schemaVersion: SCHEMA_VERSION,
      id: 'sodium_chloride',
      formula: 'NaCl',
      asciiFormula: 'NaCl',
      canonicalKey: 'Cl:1|Na:1',
      name: 'Sodium Chloride',
      bondingModel: 'ionic',
      atomCounts: { Na: 1, Cl: 1 },
      totalValenceElectrons: 8,
      elements: [
        { symbol: 'Na', name: 'Sodium',   atomicNumber: 11, count: 1, valenceElectrons: 1, electronegativity: 0.9, role: 'cation' },
        { symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, count: 1, valenceElectrons: 7, electronegativity: 3.0, role: 'anion' },
      ],
      atoms: [
        {
          atomId: 'Na1',
          symbol: 'Na',
          role: 'cation',
          valenceElectrons: 1,
          electronegativity: 0.9,
          formalCharge: 1,
          partialCharge: '+1',
          position: { x: -0.78, y: 0.04, z: 0 },
          lonePairs: 0,
          lonePairDirs: [],
        },
        {
          atomId: 'Cl1',
          symbol: 'Cl',
          role: 'anion',
          valenceElectrons: 7,
          electronegativity: 3.0,
          formalCharge: -1,
          partialCharge: '-1',
          position: { x: 0.78, y: 0.04, z: 0 },
          lonePairs: 0,
          lonePairDirs: [],
        },
      ],
      // Strictly EMPTY: NaCl is an ionic crystalline solid, NEVER a covalent stick molecule
      bonds: [],
      electronTransfers: [
        {
          transferId: 'na1_to_cl1',
          from: 'Na1',
          to: 'Cl1',
          electronCount: 1,
          deltaEN: 2.1,
          resultingCation: {
            atomId: 'Na1',
            symbol: 'Na',
            charge: '+1',
            electronConfig: '[Ne]',
            radiusScale: 0.72,
          },
          resultingAnion: {
            atomId: 'Cl1',
            symbol: 'Cl',
            charge: '-1',
            electronConfig: '[Ar]',
            radiusScale: 1.24,
          },
        },
      ],
      lattice: buildRockSaltLatticeData(),
      geometry: {
        name: 'ionic_cubic_lattice',
        label: 'Ionic Cubic Lattice (6:6 FCC)',
        vseprNotation: 'Ionic Crystal (Rock Salt)',
        hybridization: 'none (ionic)',
        bondAngleDeg: 90,
        angleArc: null,
        basePlaneAtomIds: null,
      },
      polarity: {
        molecularPolarity: 'ionic',
        bondPolarity: 'ionic',
        bondDipolesCancel: false,
        dipoleVector: null,
        summary: 'Na transfers 1 valence e⁻ completely to Cl (ΔEN 2.1), forming Na⁺ & Cl⁻ ions in a cubic crystal lattice.',
      },
      visualHints: {
        accentColor: '#facc15',
        bondColor: '#4ade80',
        baseDurationMs: 2650,
      },
    },

    // 5. AMMONIA (NH3) — 3 polar covalent single bonds, trigonal pyramidal (~107°)
    {
      schemaVersion: SCHEMA_VERSION,
      id: 'ammonia',
      formula: 'NH₃',
      asciiFormula: 'NH3',
      canonicalKey: 'H:3|N:1',
      name: 'Ammonia',
      bondingModel: 'polar_covalent',
      atomCounts: { N: 1, H: 3 },
      totalValenceElectrons: 8,
      elements: [
        { symbol: 'N', name: 'Nitrogen', atomicNumber: 7, count: 1, valenceElectrons: 5, electronegativity: 3.0, role: 'central' },
        { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, count: 3, valenceElectrons: 1, electronegativity: 2.1, role: 'terminal' },
      ],
      atoms: [
        {
          atomId: 'N1',
          symbol: 'N',
          role: 'central',
          valenceElectrons: 5,
          electronegativity: 3.0,
          formalCharge: 0,
          partialCharge: 'δ⁻',
          position: { x: 0, y: -0.24, z: 0.08 },
          lonePairs: 1,
          lonePairDirs: [{ x: 0, y: -0.94 }],
        },
        {
          atomId: 'H1',
          symbol: 'H',
          role: 'terminal',
          valenceElectrons: 1,
          electronegativity: 2.1,
          formalCharge: 0,
          partialCharge: 'δ⁺',
          position: { x: -0.78, y: 0.44, z: 0.52 },
          lonePairs: 0,
          lonePairDirs: [],
        },
        {
          atomId: 'H2',
          symbol: 'H',
          role: 'terminal',
          valenceElectrons: 1,
          electronegativity: 2.1,
          formalCharge: 0,
          partialCharge: 'δ⁺',
          position: { x: 0.78, y: 0.44, z: 0.52 },
          lonePairs: 0,
          lonePairDirs: [],
        },
        {
          atomId: 'H3',
          symbol: 'H',
          role: 'terminal',
          valenceElectrons: 1,
          electronegativity: 2.1,
          formalCharge: 0,
          partialCharge: 'δ⁺',
          position: { x: 0.04, y: 0.14, z: -0.68 },
          lonePairs: 0,
          lonePairDirs: [],
        },
      ],
      bonds: [
        { bondId: 'N1-H1', from: 'N1', to: 'H1', type: 'polar_covalent', order: 1, sharedElectronPairs: 1, deltaEN: 0.9, dipoleToward: 'N1', bondLengthPm: 101, depthCue: 'wedge' },
        { bondId: 'N1-H2', from: 'N1', to: 'H2', type: 'polar_covalent', order: 1, sharedElectronPairs: 1, deltaEN: 0.9, dipoleToward: 'N1', bondLengthPm: 101, depthCue: 'wedge' },
        { bondId: 'N1-H3', from: 'N1', to: 'H3', type: 'polar_covalent', order: 1, sharedElectronPairs: 1, deltaEN: 0.9, dipoleToward: 'N1', bondLengthPm: 101, depthCue: 'dash' },
      ],
      electronTransfers: [],
      lattice: null,
      geometry: {
        name: 'trigonal_pyramidal',
        label: 'Trigonal Pyramidal (~107°)',
        vseprNotation: 'AX₃E',
        hybridization: 'sp³',
        bondAngleDeg: 107,
        angleArc: { vertex: 'N1', armA: 'H1', armB: 'H2', label: '~107°' },
        basePlaneAtomIds: ['H1', 'H2', 'H3'],
      },
      polarity: {
        molecularPolarity: 'polar',
        bondPolarity: 'polar_covalent',
        bondDipolesCancel: false,
        dipoleVector: { x: 0, y: -0.82 },
        summary: '1 apical lone pair compresses 3 polar N–H bonds into a ~107° trigonal pyramid with a net upward dipole.',
      },
      visualHints: {
        accentColor: '#60a5fa',
        bondColor: '#60a5fa',
        baseDurationMs: 2250,
      },
    },
  ];

  // Internal indices for O(1) lookup by id, canonicalKey, Unicode formula, or ASCII formula
  const REGISTRY_BY_ID = new Map();
  const REGISTRY_BY_KEY = new Map();
  const REGISTRY_BY_ASCII = new Map();

  function registerCompound(rawSpec) {
    const check = validateChemicalIdentity(rawSpec);
    if (!check.valid) {
      throw new Error(`Invalid ChemicalIdentity (${rawSpec && rawSpec.id ? rawSpec.id : 'unknown'}): ${check.errors.join(' ')}`);
    }
    const asciiFormula = rawSpec.asciiFormula || normalizeFormula(rawSpec.formula);
    const canonicalKey = rawSpec.canonicalKey || makeCanonicalKeyFromCounts(rawSpec.atomCounts);
    const frozen = deepFreeze({
      schemaVersion: rawSpec.schemaVersion || SCHEMA_VERSION,
      ...rawSpec,
      asciiFormula,
      canonicalKey,
    });
    REGISTRY_BY_ID.set(frozen.id, frozen);
    REGISTRY_BY_KEY.set(frozen.canonicalKey, frozen);
    REGISTRY_BY_ASCII.set(asciiFormula.toUpperCase(), frozen);
    return frozen;
  }

  for (const spec of INITIAL_COMPOUNDS) {
    registerCompound(spec);
  }

  /**
   * Look up a registered Chemical Identity by:
   *  - id ('water', 'sodium_chloride')
   *  - Unicode formula ('H₂O', 'CH₄', 'CO₂', 'NaCl', 'NH₃')
   *  - ASCII formula ('H2O', 'CH4', 'CO2', 'NaCl', 'NH3')
   *  - canonicalKey ('H:2|O:1')
   *  - array of element symbols (['H', 'O', 'H'])
   *  - compound object ({ formula, elements })
   */
  function getCompoundIdentity(query) {
    if (!query) return null;
    if (Array.isArray(query)) {
      const counts = {};
      for (const sym of query) {
        if (typeof sym === 'string' && sym) counts[sym] = (counts[sym] || 0) + 1;
      }
      return REGISTRY_BY_KEY.get(makeCanonicalKeyFromCounts(counts)) || null;
    }
    if (typeof query === 'object') {
      if (query.id && REGISTRY_BY_ID.has(query.id)) return REGISTRY_BY_ID.get(query.id);
      if (query.canonicalKey && REGISTRY_BY_KEY.has(query.canonicalKey)) return REGISTRY_BY_KEY.get(query.canonicalKey);
      if (query.formula) {
        const byForm = getCompoundIdentity(query.formula);
        if (byForm) return byForm;
      }
      if (Array.isArray(query.elements)) {
        return getCompoundIdentity(query.elements.map((e) => (typeof e === 'string' ? e : e.symbol)));
      }
      return null;
    }
    if (typeof query === 'string') {
      const trimmed = query.trim();
      if (REGISTRY_BY_ID.has(trimmed)) return REGISTRY_BY_ID.get(trimmed);
      if (REGISTRY_BY_KEY.has(trimmed)) return REGISTRY_BY_KEY.get(trimmed);
      const asc = normalizeFormula(trimmed).toUpperCase();
      if (REGISTRY_BY_ASCII.has(asc)) return REGISTRY_BY_ASCII.get(asc);
    }
    return null;
  }

  function hasCompoundIdentity(query) {
    return getCompoundIdentity(query) !== null;
  }

  function listCompounds() {
    return Array.from(REGISTRY_BY_ID.values());
  }

  function getElementVisual(symbol) {
    if (ELEMENT_VISUAL_DATA[symbol]) return ELEMENT_VISUAL_DATA[symbol];
    const fallbackSpec = V.ELEMENT_BY_SYMBOL && V.ELEMENT_BY_SYMBOL[symbol];
    const gMeta = fallbackSpec && V.GROUP_META && V.GROUP_META[fallbackSpec.colorGroup || fallbackSpec.group];
    const core = (gMeta && gMeta.color) || '#64748b';
    return {
      symbol: symbol || '?',
      name: (fallbackSpec && fallbackSpec.name) || symbol || 'Unknown',
      atomicNumber: (fallbackSpec && fallbackSpec.atomicNumber) || 1,
      valenceElectrons: (fallbackSpec && fallbackSpec.valence) || 1,
      electronegativity: (fallbackSpec && fallbackSpec.en) || 2.0,
      covalentRadiusPm: 85,
      coreColor: core,
      rimColor: '#e2e8f0',
      cloudColor: core,
      textColor: '#ffffff',
    };
  }

  V.ChemicalIdentity = {
    SCHEMA_VERSION,
    ELEMENT_VISUAL_DATA,
    normalizeFormula,
    makeCanonicalKeyFromCounts,
    validateChemicalIdentity,
    registerCompound,
    getCompoundIdentity,
    hasCompoundIdentity,
    listCompounds,
    getElementVisual,
  };
})(typeof window !== 'undefined' ? window : globalThis);

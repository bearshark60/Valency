// VALENCY — Layer 2: Molecular Formation Choreography Engine
// Pure, reusable, data-driven SVG/CSS/rAF animation engine.
// STRICT LAYER BOUNDARY:
//   - Consumes ONLY Layer 1 ChemicalIdentity data + runtime playback options.
//   - Contains ZERO combat rules, ZERO gameEngine references, ZERO card/SP logic.
//   - Core Scientific Guardrails:
//       * NEVER renders planetary Bohr electron orbits.
//       * NEVER renders ionic compounds as covalent stick molecules.
//       * Selects primitives (atomEntrance, electronSharing vs. electronTransfer,
//         bondIllumination vs. latticeAssembly) purely from Layer 1 chemical data.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const MIN_DURATION_MS = 1500;
  const MAX_DURATION_MS = 3000;
  const DEFAULT_DURATION_MS = 2200;
  const REDUCED_HOLD_MS = 1250;

  const SPEED_PRESETS = Object.freeze([0.75, 1, 1.5, 2]);
  const STORAGE_KEY_SPEED = 'valency_mol_formation_speed';
  const STORAGE_KEY_REDUCED = 'valency_mol_formation_reduced';

  let instanceSeq = 0;
  let globalSpeed = 1;
  let globalReducedOverride = null; // null = follow system/FX toggle, boolean = explicit user override

  function loadPreferences() {
    try {
      if (typeof localStorage === 'undefined') return;
      const savedSpeed = parseFloat(localStorage.getItem(STORAGE_KEY_SPEED));
      if (Number.isFinite(savedSpeed) && savedSpeed >= 0.5 && savedSpeed <= 3) {
        globalSpeed = savedSpeed;
      }
      const savedRed = localStorage.getItem(STORAGE_KEY_REDUCED);
      if (savedRed === 'true') globalReducedOverride = true;
      else if (savedRed === 'false') globalReducedOverride = false;
    } catch (_) {}
  }

  function savePreferences() {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_KEY_SPEED, String(globalSpeed));
      if (globalReducedOverride === null) localStorage.removeItem(STORAGE_KEY_REDUCED);
      else localStorage.setItem(STORAGE_KEY_REDUCED, String(globalReducedOverride));
    } catch (_) {}
  }

  loadPreferences();

  function setSpeed(multiplier) {
    const val = Number(multiplier);
    if (!Number.isFinite(val) || val < 0.5 || val > 3) return globalSpeed;
    globalSpeed = val;
    savePreferences();
    return globalSpeed;
  }

  function getSpeed() {
    return globalSpeed;
  }

  function setReducedMotion(value) {
    if (value === null || value === undefined) globalReducedOverride = null;
    else globalReducedOverride = Boolean(value);
    savePreferences();
    return isReducedMotion();
  }

  function isReducedMotion(overrideOpt) {
    if (typeof overrideOpt === 'boolean') return overrideOpt;
    if (globalReducedOverride !== null) return globalReducedOverride;
    if (typeof document !== 'undefined' && document.body && document.body.classList.contains('fx-reduced')) {
      return true;
    }
    if (V.isAnimationsEnabled && V.isAnimationsEnabled() === false) {
      return true;
    }
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
      } catch (_) {}
    }
    return false;
  }

  // ===== MATH & EASING HELPERS =====
  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeOutCubic(t) {
    const u = clamp(t, 0, 1);
    return 1 - Math.pow(1 - u, 3);
  }

  function easeInOutCubic(t) {
    const u = clamp(t, 0, 1);
    return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
  }

  function subProgress(t, start, end) {
    if (end <= start) return t >= end ? 1 : 0;
    return clamp((t - start) / (end - start), 0, 1);
  }

  /**
   * Pure Chemistry-Driven Choreography Plan Builder (Layer 2 Core).
   * Deterministically chooses primitives and phase timings solely from Layer 1 identity data.
   */
  function buildChoreographyPlan(identity, options) {
    if (!identity || !identity.atoms) {
      throw new Error('FormationChoreography.buildChoreographyPlan requires a valid Layer 1 ChemicalIdentity.');
    }
    const opts = options || {};
    const speed = Number.isFinite(opts.speed) && opts.speed > 0 ? opts.speed : globalSpeed;
    const reduced = isReducedMotion(opts.reducedMotion);
    const isIonic = identity.bondingModel === 'ionic';
    const hasLattice = Boolean(isIonic && identity.lattice && Array.isArray(identity.lattice.unitNodes) && identity.lattice.unitNodes.length > 0);

    const rawBaseMs = (identity.visualHints && identity.visualHints.baseDurationMs) || DEFAULT_DURATION_MS;
    const baseDurationMs = clamp(rawBaseMs, MIN_DURATION_MS, MAX_DURATION_MS);
    const effectiveDurationMs = reduced
      ? Math.round(clamp(REDUCED_HOLD_MS / Math.max(0.75, speed), 650, 1600))
      : Math.round(clamp(baseDurationMs / speed, 750, 4000));

    // Select shared primitives purely from chemical bonding model
    const phases = isIonic
      ? [
          { primitive: 'atomEntrance',     start: 0.00, end: 0.24, label: 'Neutral Atom Approach' },
          { primitive: 'electronTransfer', start: 0.22, end: 0.58, label: 'Valence Electron Transfer (Ionization)' },
          ...(hasLattice
            ? [{ primitive: 'latticeAssembly', start: 0.56, end: 0.90, label: 'Ionic Crystal Lattice Assembly' }]
            : [{ primitive: 'bondIllumination', start: 0.56, end: 0.88, label: 'Electrostatic Pairing' }]),
          { primitive: 'equilibriumHold',  start: 0.88, end: 1.00, label: 'Crystalline Equilibrium' },
        ]
      : [
          { primitive: 'atomEntrance',     start: 0.00, end: 0.28, label: 'Valence Cloud Convergence' },
          { primitive: 'electronSharing',  start: 0.26, end: 0.62, label: identity.bondingModel === 'polar_covalent' ? 'Polarized Electron Sharing' : 'Covalent Electron Sharing' },
          { primitive: 'bondIllumination', start: 0.58, end: 0.86, label: 'Bond & VSEPR Geometry Lock' },
          { primitive: 'equilibriumHold',  start: 0.86, end: 1.00, label: 'Molecular Equilibrium' },
        ];

    return {
      compoundId: identity.id,
      formula: identity.formula,
      name: identity.name,
      bondingModel: identity.bondingModel,
      isIonic,
      hasLattice,
      usesPlanetaryOrbits: false, // Hard invariant
      usesCovalentSticksForIonic: false, // Hard invariant
      primitives: phases.map((p) => p.primitive),
      phases,
      baseDurationMs,
      speed,
      effectiveDurationMs,
      reducedMotion: reduced,
    };
  }

  /**
   * Pure deterministic timeline evaluator (for both runtime rAF updates and headless Node unit tests).
   */
  function evaluateTimelineState(plan, rawProgress) {
    const t = plan.reducedMotion ? 1 : clamp(rawProgress, 0, 1);
    const phaseWeights = {};
    let activePhase = plan.phases[plan.phases.length - 1];

    for (const p of plan.phases) {
      const w = subProgress(t, p.start, p.end);
      phaseWeights[p.primitive] = w;
      if (t >= p.start && t <= p.end) {
        activePhase = p;
      }
    }

    return {
      progress: t,
      activePrimitive: activePhase.primitive,
      activeLabel: activePhase.label,
      entrance: easeOutCubic(phaseWeights.atomEntrance || 0),
      sharing: easeInOutCubic(phaseWeights.electronSharing || 0),
      transfer: easeInOutCubic(phaseWeights.electronTransfer || 0),
      illumination: easeOutCubic(phaseWeights.bondIllumination || 0),
      lattice: easeInOutCubic(phaseWeights.latticeAssembly || 0),
      hold: phaseWeights.equilibriumHold || 0,
    };
  }

  // ===== COORDINATE PROJECTION (Normalized molecular space -> SVG viewBox) =====
  const VIEW_W = 360;
  const VIEW_H = 220;
  const CENTER_X = VIEW_W / 2;
  const CENTER_Y = VIEW_H / 2 + 4;
  const UNIT_SCALE = 76;

  function projectPoint(pos, scaleMult) {
    const s = UNIT_SCALE * (scaleMult || 1);
    const z = (pos && typeof pos.z === 'number') ? pos.z : 0;
    const depthScale = 1 + z * 0.14;
    return {
      x: CENTER_X + pos.x * s,
      y: CENTER_Y + pos.y * s,
      z,
      depthScale,
    };
  }

  function getAtomBaseRadius(symbol, z) {
    const vis = V.ChemicalIdentity ? V.ChemicalIdentity.getElementVisual(symbol) : { covalentRadiusPm: 70 };
    const base = symbol === 'H' ? 14.5 : clamp(16 + (vis.covalentRadiusPm || 70) * 0.055, 18.5, 25);
    const depthScale = 1 + (z || 0) * 0.12;
    return base * depthScale;
  }

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v !== undefined && v !== null) el.setAttribute(k, String(v));
      }
    }
    return el;
  }

  /**
   * Build the complete SVG scene graph + update handle for a Layer 1 ChemicalIdentity.
   * Uses quantum-inspired radial probability clouds (zero planetary rings) and strict
   * covalent vs. ionic visual grammars.
   */
  function createFormationScene(identity, plan, options) {
    const opts = options || {};
    const compact = Boolean(opts.compact);
    const uid = `mf${++instanceSeq}_`;

    const svg = svgEl('svg', {
      class: `mol-formation-svg ${plan.isIonic ? 'mol-mode-ionic' : 'mol-mode-covalent'}`,
      viewBox: `0 0 ${VIEW_W} ${VIEW_H}`,
      role: 'img',
      'aria-label': `${identity.name} (${identity.formula}) — ${identity.geometry.label}`,
    });

    // Unique <defs> per mounted instance (zero ID collisions)
    const defs = svgEl('defs');
    const seenSymbols = new Set(identity.atoms.map((a) => a.symbol));
    if (identity.lattice && identity.lattice.unitNodes) {
      for (const n of identity.lattice.unitNodes) seenSymbols.add(n.symbol);
    }

    for (const sym of seenSymbols) {
      const vis = V.ChemicalIdentity.getElementVisual(sym);
      // Soft quantum electron-density radial cloud gradient
      const cloudGrad = svgEl('radialGradient', { id: `${uid}cloud_${sym}`, cx: '50%', cy: '50%', r: '50%' });
      cloudGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': vis.cloudColor, 'stop-opacity': '0.52' }));
      cloudGrad.appendChild(svgEl('stop', { offset: '55%', 'stop-color': vis.cloudColor, 'stop-opacity': '0.18' }));
      cloudGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': vis.cloudColor, 'stop-opacity': '0' }));
      defs.appendChild(cloudGrad);

      // 3D-shaded nucleus/atom sphere gradient
      const sphereGrad = svgEl('radialGradient', { id: `${uid}core_${sym}`, cx: '35%', cy: '30%', r: '70%' });
      sphereGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': '0.88' }));
      sphereGrad.appendChild(svgEl('stop', { offset: '26%', 'stop-color': vis.rimColor, 'stop-opacity': '1' }));
      sphereGrad.appendChild(svgEl('stop', { offset: '78%', 'stop-color': vis.coreColor, 'stop-opacity': '1' }));
      sphereGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#0f172a', 'stop-opacity': '0.95' }));
      defs.appendChild(sphereGrad);
    }

    // Emit only the gradients actually needed by this compound's chemistry (minimizes SVG DOM footprint)
    const hasAnyLonePairs = identity.atoms.some((a) => a.lonePairDirs && a.lonePairDirs.length > 0);
    if (hasAnyLonePairs) {
      const lpGrad = svgEl('radialGradient', { id: `${uid}lonepair`, cx: '50%', cy: '50%', r: '50%' });
      lpGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#c084fc', 'stop-opacity': '0.68' }));
      lpGrad.appendChild(svgEl('stop', { offset: '65%', 'stop-color': '#a855f7', 'stop-opacity': '0.26' }));
      lpGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#a855f7', 'stop-opacity': '0' }));
      defs.appendChild(lpGrad);
    }

    if (!plan.isIonic) {
      const eGrad = svgEl('radialGradient', { id: `${uid}elec`, cx: '50%', cy: '50%', r: '50%' });
      eGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': '1' }));
      eGrad.appendChild(svgEl('stop', { offset: '45%', 'stop-color': '#38bdf8', 'stop-opacity': '0.92' }));
      eGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#38bdf8', 'stop-opacity': '0' }));
      defs.appendChild(eGrad);
    } else {
      const teGrad = svgEl('radialGradient', { id: `${uid}telec`, cx: '50%', cy: '50%', r: '50%' });
      teGrad.appendChild(svgEl('stop', { offset: '0%', 'stop-color': '#ffffff', 'stop-opacity': '1' }));
      teGrad.appendChild(svgEl('stop', { offset: '45%', 'stop-color': '#facc15', 'stop-opacity': '0.95' }));
      teGrad.appendChild(svgEl('stop', { offset: '100%', 'stop-color': '#38bdf8', 'stop-opacity': '0' }));
      defs.appendChild(teGrad);
    }

    svg.appendChild(defs);

    // Subtle scientific coordinate crosshair backdrop (very restrained)
    const bgGuide = svgEl('g', { class: 'mf-bg-guides', opacity: '0.22' });
    bgGuide.appendChild(svgEl('line', { x1: 24, y1: CENTER_Y, x2: VIEW_W - 24, y2: CENTER_Y, stroke: '#475569', 'stroke-width': '0.75', 'stroke-dasharray': '4 5' }));
    bgGuide.appendChild(svgEl('line', { x1: CENTER_X, y1: 18, x2: CENTER_X, y2: VIEW_H - 18, stroke: '#475569', 'stroke-width': '0.75', 'stroke-dasharray': '4 5' }));
    svg.appendChild(bgGuide);

    // Layer groups in clean painter's order
    const gLattice = svgEl('g', { class: 'mf-layer-lattice', opacity: '0' });
    const gPrimary = svgEl('g', { class: 'mf-layer-primary' });
    const gBasePlane = svgEl('g', { class: 'mf-layer-baseplane', opacity: '0' });
    const gLonePairs = svgEl('g', { class: 'mf-layer-lonepairs', opacity: '0' });
    const gBonds = svgEl('g', { class: 'mf-layer-bonds' });
    const gElectrons = svgEl('g', { class: 'mf-layer-electrons' });
    const gAtoms = svgEl('g', { class: 'mf-layer-atoms' });
    const gAnnotations = svgEl('g', { class: 'mf-layer-annotations', opacity: '0' });

    gPrimary.appendChild(gBasePlane);
    gPrimary.appendChild(gLonePairs);
    gPrimary.appendChild(gBonds);
    gPrimary.appendChild(gElectrons);
    gPrimary.appendChild(gAtoms);

    svg.appendChild(gLattice);
    svg.appendChild(gPrimary);
    svg.appendChild(gAnnotations);

    // Index atoms by atomId & compute start/target positions
    const atomMap = new Map();
    const sortedAtoms = [...identity.atoms].sort((a, b) => (a.position.z || 0) - (b.position.z || 0));

    for (let i = 0; i < sortedAtoms.length; i++) {
      const atom = sortedAtoms[i];
      const target = projectPoint(atom.position, compact ? 0.92 : 1.0);
      // Entrance origin: displaced outward along radial vector (central atom rises gently from slightly below/above)
      const dx = atom.position.x;
      const dy = atom.position.y;
      const mag = Math.hypot(dx, dy);
      const startX = mag > 0.05 ? target.x + (dx / mag) * 74 : target.x;
      const startY = mag > 0.05 ? target.y + (dy / mag) * 58 : target.y - 42;
      const baseR = getAtomBaseRadius(atom.symbol, atom.position.z);
      const vis = V.ChemicalIdentity.getElementVisual(atom.symbol);

      const group = svgEl('g', { class: 'mf-atom-node', 'data-atom-id': atom.atomId });

      // Quantum electron-density cloud (diffuse radial cloud — NO planetary orbit rings!)
      const cloud = svgEl('circle', {
        class: 'mf-electron-cloud',
        cx: 0,
        cy: 0,
        r: (baseR * 2.05).toFixed(1),
        fill: `url(#${uid}cloud_${atom.symbol})`,
        opacity: '0.78',
      });
      group.appendChild(cloud);

      // Subtle charge halo (activates for ionic Na+/Cl- or polar partial charges)
      const chargeRing = svgEl('circle', {
        class: 'mf-charge-ring',
        cx: 0,
        cy: 0,
        r: (baseR + 5).toFixed(1),
        fill: 'none',
        stroke: atom.role === 'cation' ? '#facc15' : atom.role === 'anion' ? '#4ade80' : '#38bdf8',
        'stroke-width': '1.6',
        'stroke-dasharray': atom.role === 'cation' || atom.role === 'anion' ? '4 3' : 'none',
        opacity: '0',
      });
      group.appendChild(chargeRing);

      // Nucleus / atomic sphere
      const core = svgEl('circle', {
        class: 'mf-atom-core',
        cx: 0,
        cy: 0,
        r: baseR.toFixed(1),
        fill: `url(#${uid}core_${atom.symbol})`,
        stroke: vis.rimColor,
        'stroke-width': '1.5',
      });
      group.appendChild(core);

      // Element symbol
      const label = svgEl('text', {
        class: 'mf-atom-symbol',
        x: 0,
        y: 4.5,
        'text-anchor': 'middle',
        fill: vis.textColor,
        'font-size': baseR < 16 ? '11.5' : '13.5',
        'font-weight': '900',
      });
      label.textContent = atom.symbol;
      group.appendChild(label);

      // Partial or formal charge superscript badge (δ⁻, δ⁺, +, -)
      const chargeText = svgEl('text', {
        class: 'mf-charge-badge',
        x: (baseR * 0.85).toFixed(1),
        y: (-baseR * 0.72).toFixed(1),
        'text-anchor': 'start',
        fill: atom.partialCharge === 'δ⁻' || atom.partialCharge === '-1' ? '#4ade80' : '#facc15',
        'font-size': '11.5',
        'font-weight': '900',
        opacity: '0',
      });
      chargeText.textContent = atom.partialCharge === '+1' ? '+' : atom.partialCharge === '-1' ? '−' : (atom.partialCharge && atom.partialCharge !== '0' ? atom.partialCharge : '');
      group.appendChild(chargeText);

      gAtoms.appendChild(group);
      atomMap.set(atom.atomId, {
        atom,
        vis,
        target,
        start: { x: startX, y: startY },
        baseR,
        group,
        cloud,
        chargeRing,
        core,
        chargeText,
      });
    }

    // Optional 3D base-plane guide for tetrahedral / trigonal pyramidal geometries
    if (identity.geometry && Array.isArray(identity.geometry.basePlaneAtomIds) && identity.geometry.basePlaneAtomIds.length >= 3) {
      const pts = identity.geometry.basePlaneAtomIds
        .map((id) => atomMap.get(id))
        .filter(Boolean)
        .map((n) => `${n.target.x.toFixed(1)},${n.target.y.toFixed(1)}`)
        .join(' ');
      if (pts) {
        gBasePlane.appendChild(svgEl('polygon', {
          points: pts,
          fill: 'rgba(96, 165, 250, 0.08)',
          stroke: 'rgba(148, 163, 184, 0.32)',
          'stroke-width': '1',
          'stroke-dasharray': '3 3',
        }));
      }
    }

    // VSEPR lone-pair probability lobes (for H2O, NH3, CO2 — quantum lobes, NOT orbits)
    for (const node of atomMap.values()) {
      const dirs = node.atom.lonePairDirs || [];
      for (const dir of dirs) {
        const angleRad = Math.atan2(dir.y, dir.x);
        const angleDeg = (angleRad * 180) / Math.PI;
        const lobeDist = node.baseR + 15;
        const lx = node.target.x + dir.x * lobeDist;
        const ly = node.target.y + dir.y * lobeDist;

        const lpG = svgEl('g', {
          transform: `translate(${lx.toFixed(1)},${ly.toFixed(1)}) rotate(${angleDeg.toFixed(1)})`,
        });
        lpG.appendChild(svgEl('ellipse', {
          cx: 0,
          cy: 0,
          rx: 15,
          ry: 9.5,
          fill: `url(#${uid}lonepair)`,
          stroke: 'rgba(192, 132, 252, 0.42)',
          'stroke-width': '0.9',
          'stroke-dasharray': '2.5 2.5',
        }));
        // Paired lone-pair electron dots inside the probability lobe
        lpG.appendChild(svgEl('circle', { cx: 3, cy: -3.2, r: 2.3, fill: '#f5d0fe' }));
        lpG.appendChild(svgEl('circle', { cx: 3, cy: 3.2, r: 2.3, fill: '#f5d0fe' }));
        gLonePairs.appendChild(lpG);
      }
    }

    // ===== COVALENT / POLAR COVALENT BOND CHANNELS & SHARED WAVEPACKETS =====
    const bondVisuals = [];
    const sharedElectronNodes = [];

    if (!plan.isIonic && Array.isArray(identity.bonds)) {
      const bondAccent = (identity.visualHints && identity.visualHints.bondColor) || '#38bdf8';

      for (const bond of identity.bonds) {
        const a = atomMap.get(bond.from);
        const b = atomMap.get(bond.to);
        if (!a || !b) continue;

        const dx = b.target.x - a.target.x;
        const dy = b.target.y - a.target.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const nx = -uy; // normal perpendicular
        const ny = ux;

        // Trim endpoints to sit right on the atomic sphere edges
        const x1 = a.target.x + ux * (a.baseR * 0.72);
        const y1 = a.target.y + uy * (a.baseR * 0.72);
        const x2 = b.target.x - ux * (b.baseR * 0.72);
        const y2 = b.target.y - uy * (b.baseR * 0.72);

        const bondG = svgEl('g', { class: 'mf-bond-group', 'data-bond-id': bond.bondId, opacity: '0' });

        // Polarized internuclear electron-density envelope (skewed toward higher-EN atom if polar!)
        const skew = bond.dipoleToward === bond.from ? 0.38 : bond.dipoleToward === bond.to ? 0.62 : 0.5;
        const envX = lerp(a.target.x, b.target.x, skew);
        const envY = lerp(a.target.y, b.target.y, skew);
        const bondAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
        bondG.appendChild(svgEl('ellipse', {
          cx: envX.toFixed(1),
          cy: envY.toFixed(1),
          rx: (len * 0.36).toFixed(1),
          ry: bond.order >= 2 ? 12.5 : 8.5,
          fill: bond.type === 'polar_covalent' ? 'rgba(56, 189, 248, 0.24)' : 'rgba(148, 163, 184, 0.18)',
          transform: `rotate(${bondAngleDeg.toFixed(1)} ${envX.toFixed(1)} ${envY.toFixed(1)})`,
        }));

        // Bond channels according to bond order (1 = single, 2 = double σ+π, 3 = triple)
        const offsets = bond.order === 2 ? [-4.2, 4.2] : bond.order === 3 ? [-6, 0, 6] : [0];
        const lineEls = [];

        for (const off of offsets) {
          if (bond.order === 1 && bond.depthCue === 'wedge') {
            // Crisp 3D front-projecting wedge bond
            const p1x = x1 + nx * 1.4;
            const p1y = y1 + ny * 1.4;
            const p2x = x1 - nx * 1.4;
            const p2y = y1 - ny * 1.4;
            const p3x = x2 - nx * 4.6;
            const p3y = y2 - ny * 4.6;
            const p4x = x2 + nx * 4.6;
            const p4y = y2 + ny * 4.6;
            const poly = svgEl('polygon', {
              points: `${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)} ${p3x.toFixed(1)},${p3y.toFixed(1)} ${p4x.toFixed(1)},${p4y.toFixed(1)}`,
              fill: bondAccent,
              opacity: '0.88',
            });
            bondG.appendChild(poly);
            lineEls.push(poly);
          } else {
            const line = svgEl('line', {
              x1: (x1 + nx * off).toFixed(1),
              y1: (y1 + ny * off).toFixed(1),
              x2: (x2 + nx * off).toFixed(1),
              y2: (y2 + ny * off).toFixed(1),
              stroke: bondAccent,
              'stroke-width': bond.depthCue === 'dash' ? '4.4' : (bond.order >= 2 ? '3.0' : '3.6'),
              'stroke-linecap': bond.depthCue === 'dash' ? 'butt' : 'round',
              'stroke-dasharray': bond.depthCue === 'dash' ? '2.5 3.5' : 'none',
              opacity: bond.depthCue === 'dash' ? '0.72' : '0.92',
            });
            bondG.appendChild(line);
            lineEls.push(line);
          }
        }

        gBonds.appendChild(bondG);
        bondVisuals.push({ bond, bondG, lineEls });

        // Create shared electron wavepacket pairs (1 pair per bond order)
        const pairOffsets = bond.order === 2 ? [-7.5, 7.5] : bond.order === 3 ? [-9.5, 0, 9.5] : [0];
        for (let pIdx = 0; pIdx < pairOffsets.length; pIdx++) {
          const pOff = pairOffsets[pIdx];
          // Electron from atom A & electron from atom B converge into the shared overlap zone
          const midX = lerp(a.target.x, b.target.x, skew) + nx * pOff;
          const midY = lerp(a.target.y, b.target.y, skew) + ny * pOff;

          const eA = svgEl('circle', { r: '4.4', fill: `url(#${uid}elec)`, opacity: '0' });
          const eB = svgEl('circle', { r: '4.4', fill: `url(#${uid}elec)`, opacity: '0' });
          gElectrons.appendChild(eA);
          gElectrons.appendChild(eB);

          sharedElectronNodes.push({
            el: eA,
            fromX: a.target.x + ux * a.baseR * 0.9,
            fromY: a.target.y + uy * a.baseR * 0.9,
            toX: midX - ux * 4.2,
            toY: midY - uy * 4.2,
            phaseShift: pIdx * 0.14,
          });
          sharedElectronNodes.push({
            el: eB,
            fromX: b.target.x - ux * b.baseR * 0.9,
            fromY: b.target.y - uy * b.baseR * 0.9,
            toX: midX + ux * 4.2,
            toY: midY + uy * 4.2,
            phaseShift: pIdx * 0.14 + 0.08,
          });
        }
      }
    }

    // ===== IONIC ELECTRON TRANSFER & CRYSTAL LATTICE PRIMITIVES =====
    const transferVisuals = [];
    const electrostaticPairLines = [];

    if (plan.isIonic && Array.isArray(identity.electronTransfers)) {
      for (const tr of identity.electronTransfers) {
        const donor = atomMap.get(tr.from);
        const acceptor = atomMap.get(tr.to);
        if (!donor || !acceptor) continue;

        // Curved transfer trajectory arc (for visual clarity of complete electron donation)
        const ctrlX = (donor.target.x + acceptor.target.x) / 2;
        const ctrlY = Math.min(donor.target.y, acceptor.target.y) - 52;
        const arcPath = svgEl('path', {
          d: `M ${donor.target.x.toFixed(1)} ${donor.target.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${acceptor.target.x.toFixed(1)} ${acceptor.target.y.toFixed(1)}`,
          fill: 'none',
          stroke: '#facc15',
          'stroke-width': '1.8',
          'stroke-dasharray': '4 4',
          opacity: '0',
        });
        gBonds.appendChild(arcPath);

        // Electrostatic attraction field lines (soft dotted curves — NEVER covalent sticks!)
        for (const curveY of [-16, 0, 16]) {
          const fLine = svgEl('path', {
            d: `M ${(donor.target.x + 18).toFixed(1)} ${donor.target.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${(donor.target.y + curveY).toFixed(1)} ${(acceptor.target.x - 24).toFixed(1)} ${acceptor.target.y.toFixed(1)}`,
            fill: 'none',
            stroke: '#38bdf8',
            'stroke-width': '1.25',
            'stroke-dasharray': '2.5 4',
            opacity: '0',
          });
          gBonds.appendChild(fLine);
          electrostaticPairLines.push(fLine);
        }

        // Detached valence electron wavepacket
        const packetG = svgEl('g', { class: 'mf-transfer-electron', opacity: '0' });
        packetG.appendChild(svgEl('circle', { r: '9.5', fill: `url(#${uid}telec)` }));
        packetG.appendChild(svgEl('circle', { r: '3.6', fill: '#ffffff' }));
        const eLabel = svgEl('text', { x: 0, y: -11, 'text-anchor': 'middle', fill: '#fde047', 'font-size': '10', 'font-weight': '900' });
        eLabel.textContent = 'e⁻';
        packetG.appendChild(eLabel);
        gElectrons.appendChild(packetG);

        transferVisuals.push({
          tr,
          donor,
          acceptor,
          ctrlX,
          ctrlY,
          arcPath,
          packetG,
        });
      }
    }

    // Build Ionic Crystal Lattice SVG nodes (3D-projected FCC rock-salt assembly)
    const latticeNodeEls = [];
    const latticeLinkEls = [];
    if (plan.hasLattice && identity.lattice) {
      const lMap = new Map();
      const sortedLattice = [...identity.lattice.unitNodes].sort((a, b) => a.z - b.z);

      // Subtle isometric crystal guide links (electrostatic axes, dashed)
      for (const link of identity.lattice.electrostaticLinks) {
        const na = identity.lattice.unitNodes.find((n) => n.nodeId === link.from);
        const nb = identity.lattice.unitNodes.find((n) => n.nodeId === link.to);
        if (!na || !nb) continue;
        const pa = projectPoint(na, 0.94);
        const pb = projectPoint(nb, 0.94);
        const line = svgEl('line', {
          x1: pa.x.toFixed(1),
          y1: pa.y.toFixed(1),
          x2: pb.x.toFixed(1),
          y2: pb.y.toFixed(1),
          stroke: link.axis === 'z' ? 'rgba(56, 189, 248, 0.36)' : 'rgba(148, 163, 184, 0.42)',
          'stroke-width': link.axis === 'z' ? '1.1' : '1.35',
          'stroke-dasharray': '3 3',
        });
        gLattice.appendChild(line);
        latticeLinkEls.push(line);
      }

      for (const node of sortedLattice) {
        const target = projectPoint(node, 0.94);
        const vis = V.ChemicalIdentity.getElementVisual(node.symbol);
        const isBack = node.z < 0;
        const r = (node.role === 'cation' ? 12.2 : 17.5) * (isBack ? 0.84 : 1.0);
        const startX = target.x + (target.x - CENTER_X) * 0.72;
        const startY = target.y + (target.y - CENTER_Y) * 0.72;

        const g = svgEl('g', {
          class: `mf-lattice-ion ${isBack ? 'mf-ion-back' : 'mf-ion-front'}`,
          opacity: isBack ? '0.68' : '0.98',
        });
        g.appendChild(svgEl('circle', {
          cx: 0,
          cy: 0,
          r: r.toFixed(1),
          fill: `url(#${uid}core_${node.symbol})`,
          stroke: node.role === 'cation' ? '#fde047' : '#86efac',
          'stroke-width': isBack ? '1.0' : '1.5',
        }));
        const txt = svgEl('text', {
          x: 0,
          y: 3.4,
          'text-anchor': 'middle',
          fill: vis.textColor,
          'font-size': node.role === 'cation' ? '8.5' : '9.5',
          'font-weight': '900',
        });
        txt.textContent = `${node.symbol}${node.charge === '+1' ? '⁺' : '⁻'}`;
        g.appendChild(txt);
        gLattice.appendChild(g);

        const item = { node, target, start: { x: startX, y: startY }, g, baseOpacity: isBack ? 0.68 : 0.98 };
        latticeNodeEls.push(item);
        lMap.set(node.nodeId, item);
      }
    }

    // ===== GEOMETRY ANGLE ARC & POLARITY / DIPOLE ANNOTATIONS =====
    if (identity.geometry && identity.geometry.angleArc) {
      const arcSpec = identity.geometry.angleArc;
      const v = atomMap.get(arcSpec.vertex);
      const a = atomMap.get(arcSpec.armA);
      const b = atomMap.get(arcSpec.armB);
      if (v && a && b) {
        const angA = Math.atan2(a.target.y - v.target.y, a.target.x - v.target.x);
        const angB = Math.atan2(b.target.y - v.target.y, b.target.x - v.target.x);
        const arcR = 30;

        if (identity.geometry.bondAngleDeg === 180) {
          // Clean 180° upper semicircle arc above central atom
          const d = `M ${(v.target.x - arcR).toFixed(1)} ${v.target.y.toFixed(1)} A ${arcR} ${arcR} 0 0 1 ${(v.target.x + arcR).toFixed(1)} ${v.target.y.toFixed(1)}`;
          gAnnotations.appendChild(svgEl('path', { d, fill: 'none', stroke: '#fbbf24', 'stroke-width': '1.6', 'stroke-dasharray': '3 2.5' }));
          const lbl = svgEl('text', { x: v.target.x.toFixed(1), y: (v.target.y - arcR - 6).toFixed(1), 'text-anchor': 'middle', fill: '#fde68a', 'font-size': '11', 'font-weight': '800' });
          lbl.textContent = arcSpec.label;
          gAnnotations.appendChild(lbl);
        } else {
          // Shortest angular sweep between armA and armB
          let diff = angB - angA;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const sweep = diff >= 0 ? 1 : 0;
          const ax = v.target.x + Math.cos(angA) * arcR;
          const ay = v.target.y + Math.sin(angA) * arcR;
          const bx = v.target.x + Math.cos(angB) * arcR;
          const by = v.target.y + Math.sin(angB) * arcR;
          const midAng = angA + diff / 2;
          const lx = v.target.x + Math.cos(midAng) * (arcR + 15);
          const ly = v.target.y + Math.sin(midAng) * (arcR + 15);

          gAnnotations.appendChild(svgEl('path', {
            d: `M ${ax.toFixed(1)} ${ay.toFixed(1)} A ${arcR} ${arcR} 0 0 ${sweep} ${bx.toFixed(1)} ${by.toFixed(1)}`,
            fill: 'none',
            stroke: '#fbbf24',
            'stroke-width': '1.6',
            'stroke-dasharray': '3 2.5',
          }));
          const lbl = svgEl('text', { x: lx.toFixed(1), y: (ly + 3.5).toFixed(1), 'text-anchor': 'middle', fill: '#fde68a', 'font-size': '10.5', 'font-weight': '800' });
          lbl.textContent = arcSpec.label;
          gAnnotations.appendChild(lbl);
        }
      }
    }

    // Polarity annotation: net dipole arrow OR canceling bond dipoles
    if (identity.polarity && identity.polarity.dipoleVector) {
      const dv = identity.polarity.dipoleVector;
      const startX = VIEW_W - 44;
      const startY = CENTER_Y + 26;
      const endX = startX + dv.x * 38;
      const endY = startY + dv.y * 46;
      gAnnotations.appendChild(svgEl('line', {
        x1: startX, y1: startY, x2: endX, y2: endY,
        stroke: '#38bdf8', 'stroke-width': '2.2', 'stroke-linecap': 'round',
      }));
      // Cross-tail (+ side of dipole arrow)
      gAnnotations.appendChild(svgEl('line', {
        x1: startX - 5, y1: startY - 7, x2: startX + 5, y2: startY - 7,
        stroke: '#38bdf8', 'stroke-width': '2',
      }));
      // Arrowhead
      gAnnotations.appendChild(svgEl('polygon', {
        points: `${endX},${endY - 5} ${endX - 4.5},${endY + 4} ${endX + 4.5},${endY + 4}`,
        fill: '#38bdf8',
      }));
      const dpLbl = svgEl('text', { x: startX, y: startY + 15, 'text-anchor': 'middle', fill: '#7dd3fc', 'font-size': '9.5', 'font-weight': '800' });
      dpLbl.textContent = 'NET DIPOLE';
      gAnnotations.appendChild(dpLbl);
    } else if (identity.polarity && identity.polarity.bondDipolesCancel && identity.geometry.name === 'linear') {
      // Opposing equal bond dipoles canceling for CO2
      const y = CENTER_Y + 42;
      gAnnotations.appendChild(svgEl('line', { x1: CENTER_X - 10, y1: y, x2: CENTER_X - 58, y2: y, stroke: '#f87171', 'stroke-width': '1.8' }));
      gAnnotations.appendChild(svgEl('polygon', { points: `${CENTER_X - 64},${y} ${CENTER_X - 56},${y - 3.5} ${CENTER_X - 56},${y + 3.5}`, fill: '#f87171' }));
      gAnnotations.appendChild(svgEl('line', { x1: CENTER_X + 10, y1: y, x2: CENTER_X + 58, y2: y, stroke: '#f87171', 'stroke-width': '1.8' }));
      gAnnotations.appendChild(svgEl('polygon', { points: `${CENTER_X + 64},${y} ${CENTER_X + 56},${y - 3.5} ${CENTER_X + 56},${y + 3.5}`, fill: '#f87171' }));
      const cLbl = svgEl('text', { x: CENTER_X, y: y + 15, 'text-anchor': 'middle', fill: '#fca5a5', 'font-size': '9.5', 'font-weight': '800' });
      cLbl.textContent = 'OPPOSING DIPOLES CANCEL (NONPOLAR)';
      gAnnotations.appendChild(cLbl);
    } else if (plan.isIonic && plan.hasLattice) {
      const lLbl = svgEl('text', { x: CENTER_X, y: VIEW_H - 12, 'text-anchor': 'middle', fill: '#fde68a', 'font-size': '10', 'font-weight': '800' });
      lLbl.textContent = '6:6 CUBIC ROCK-SALT IONIC LATTICE (Na⁺ / Cl⁻)';
      gAnnotations.appendChild(lLbl);
    }

    // ===== FRAME UPDATE FUNCTION (Pure transform/opacity — zero layout thrash) =====
    function applyTimelineState(ts) {
      // 1. Atom Entrance + Ionic Size/Charge Response
      const ent = ts.entrance;
      for (const node of atomMap.values()) {
        const curX = lerp(node.start.x, node.target.x, ent);
        const curY = lerp(node.start.y, node.target.y, ent);
        let scale = 0.72 + 0.28 * ent;

        if (plan.isIonic && ts.transfer > 0) {
          // Real ionic radius response: Na+ contracts, Cl- expands upon electron transfer
          const tr = identity.electronTransfers[0];
          if (tr) {
            if (node.atom.atomId === tr.resultingCation.atomId) {
              scale *= lerp(1, tr.resultingCation.radiusScale, ts.transfer);
            } else if (node.atom.atomId === tr.resultingAnion.atomId) {
              scale *= lerp(1, tr.resultingAnion.radiusScale, ts.transfer);
            }
          }
          // Electrostatic attraction draws Na+ and Cl- slightly closer together before lattice bloom
          const pull = ts.transfer * 14;
          const dirToCenter = node.target.x < CENTER_X ? 1 : -1;
          node.group.setAttribute('transform', `translate(${(curX + dirToCenter * pull).toFixed(2)},${curY.toFixed(2)}) scale(${scale.toFixed(3)})`);
        } else {
          node.group.setAttribute('transform', `translate(${curX.toFixed(2)},${curY.toFixed(2)}) scale(${scale.toFixed(3)})`);
        }

        node.group.setAttribute('opacity', clamp(ent * 1.45, 0, 1).toFixed(3));

        // Charge halo & partial/formal charge badges
        const chargeVis = plan.isIonic ? subProgress(ts.transfer, 0.55, 0.95) : ts.illumination;
        if (node.chargeText.textContent) {
          node.chargeText.setAttribute('opacity', chargeVis.toFixed(3));
        }
        if (plan.isIonic || node.atom.partialCharge === 'δ⁻') {
          node.chargeRing.setAttribute('opacity', (chargeVis * (plan.isIonic ? 0.85 : 0.42)).toFixed(3));
        }
      }

      // 2. Covalent Electron Sharing + Bond Illumination
      if (!plan.isIonic) {
        const sh = ts.sharing;
        const ill = ts.illumination;
        gLonePairs.setAttribute('opacity', (subProgress(sh, 0.25, 0.95) * 0.92).toFixed(3));
        gBasePlane.setAttribute('opacity', (ill * 0.95).toFixed(3));

        for (const en of sharedElectronNodes) {
          const lt = easeInOutCubic(subProgress(sh, en.phaseShift, 1.0));
          const ex = lerp(en.fromX, en.toX, lt);
          const ey = lerp(en.fromY, en.toY, lt);
          en.el.setAttribute('cx', ex.toFixed(2));
          en.el.setAttribute('cy', ey.toFixed(2));
          // Wavepackets glow brightly while localizing, then settle softly into the illuminated bond channel
          const eOpacity = sh <= 0 ? 0 : lerp(clamp(lt * 1.6, 0, 1), 0.72, ill);
          en.el.setAttribute('opacity', eOpacity.toFixed(3));
        }

        for (const bv of bondVisuals) {
          bv.bondG.setAttribute('opacity', ill.toFixed(3));
        }

        gAnnotations.setAttribute('opacity', subProgress(ill, 0.35, 1.0).toFixed(3));
      } else {
        // 3. Ionic Electron Transfer + Lattice Assembly
        const trP = ts.transfer;
        const latP = ts.lattice;

        for (const tv of transferVisuals) {
          // Quadratic Bezier trajectory from Na to Cl
          const u = clamp(trP, 0, 1);
          const inv = 1 - u;
          const px = inv * inv * tv.donor.target.x + 2 * inv * u * tv.ctrlX + u * u * tv.acceptor.target.x;
          const py = inv * inv * tv.donor.target.y + 2 * inv * u * tv.ctrlY + u * u * tv.acceptor.target.y;
          tv.packetG.setAttribute('transform', `translate(${px.toFixed(2)},${py.toFixed(2)})`);
          const pktOp = trP <= 0.02 || trP >= 0.98 ? 0 : Math.sin(u * Math.PI);
          tv.packetG.setAttribute('opacity', clamp(pktOp * 1.35, 0, 1).toFixed(3));
          tv.arcPath.setAttribute('opacity', (Math.sin(u * Math.PI) * 0.78).toFixed(3));
        }

        const pairFieldOp = subProgress(trP, 0.65, 1.0) * (1 - latP);
        for (const fLine of electrostaticPairLines) {
          fLine.setAttribute('opacity', (pairFieldOp * 0.85).toFixed(3));
        }

        // Smooth cross-fade from isolated Na+/Cl- ionization pair into full 3D-projected ionic crystal lattice!
        const primaryOp = plan.hasLattice ? clamp(1 - latP * 1.15, 0, 1) : 1;
        gPrimary.setAttribute('opacity', primaryOp.toFixed(3));

        if (plan.hasLattice) {
          gLattice.setAttribute('opacity', clamp(latP * 1.25, 0, 1).toFixed(3));
          for (const item of latticeNodeEls) {
            const lx = lerp(item.start.x, item.target.x, latP);
            const ly = lerp(item.start.y, item.target.y, latP);
            const ls = 0.68 + 0.32 * latP;
            item.g.setAttribute('transform', `translate(${lx.toFixed(2)},${ly.toFixed(2)}) scale(${ls.toFixed(3)})`);
          }
          gAnnotations.setAttribute('opacity', subProgress(latP, 0.52, 1.0).toFixed(3));
        } else {
          gAnnotations.setAttribute('opacity', subProgress(trP, 0.72, 1.0).toFixed(3));
        }
      }
    }

    return { svg, applyTimelineState, uid };
  }

  /**
   * Mount and run a Molecular Formation Animation inside `hostEl`.
   * Returns a handle `{ plan, skip(), destroy(), setSpeed(s), getProgress() }`.
   */
  function play(hostEl, identity, options) {
    if (!hostEl) throw new Error('FormationChoreography.play requires a host DOM element.');
    const opts = options || {};
    const plan = buildChoreographyPlan(identity, opts);
    const scene = createFormationScene(identity, plan, opts);
    const onComplete = typeof opts.onComplete === 'function' ? opts.onComplete : function () {};
    const onPhaseChange = typeof opts.onPhaseChange === 'function' ? opts.onPhaseChange : null;

    hostEl.innerHTML = '';
    hostEl.appendChild(scene.svg);

    let rafId = null;
    let holdTimer = null;
    let finished = false;
    let startTs = null;
    let progress = 0;
    let lastPrimitive = null;
    let currentSpeed = plan.speed;

    function cleanup() {
      if (rafId !== null && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (holdTimer !== null) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
    }

    function finish(meta) {
      if (finished) return;
      finished = true;
      cleanup();
      scene.applyTimelineState(evaluateTimelineState(plan, 1));
      onComplete({
        compoundId: identity.id,
        formula: identity.formula,
        skipped: Boolean(meta && meta.skipped),
        reducedMotion: plan.reducedMotion,
        durationMs: plan.effectiveDurationMs,
      });
    }

    // Reduced-motion mode: render scientifically complete final state immediately, zero rAF loop!
    if (plan.reducedMotion) {
      progress = 1;
      const finalState = evaluateTimelineState(plan, 1);
      scene.applyTimelineState(finalState);
      if (onPhaseChange) onPhaseChange(finalState);
      if (!opts.keepMountedIndefinitely) {
        holdTimer = setTimeout(() => finish({ skipped: false }), plan.effectiveDurationMs);
      }
    } else {
      const initialState = evaluateTimelineState(plan, 0);
      scene.applyTimelineState(initialState);
      if (onPhaseChange) onPhaseChange(initialState);

      const step = (ts) => {
        if (finished) return;
        if (startTs === null) startTs = ts;
        const elapsed = ts - startTs;
        const scaledDuration = clamp(plan.baseDurationMs / currentSpeed, 750, 4000);
        progress = clamp(elapsed / scaledDuration, 0, 1);

        const st = evaluateTimelineState(plan, progress);
        scene.applyTimelineState(st);
        if (onPhaseChange && st.activePrimitive !== lastPrimitive) {
          lastPrimitive = st.activePrimitive;
          onPhaseChange(st);
        }

        if (progress >= 1) {
          if (opts.keepMountedIndefinitely) {
            finished = true;
            cleanup();
            onComplete({ compoundId: identity.id, formula: identity.formula, skipped: false, reducedMotion: false, durationMs: scaledDuration });
          } else {
            finish({ skipped: false });
          }
          return;
        }
        rafId = requestAnimationFrame(step);
      };

      if (typeof requestAnimationFrame === 'function') {
        rafId = requestAnimationFrame(step);
      } else {
        finish({ skipped: false });
      }
    }

    return {
      plan,
      svg: scene.svg,
      getProgress() {
        return progress;
      },
      setSpeed(nextSpeed) {
        const s = Number(nextSpeed);
        if (Number.isFinite(s) && s >= 0.5 && s <= 3) {
          currentSpeed = s;
        }
      },
      skip() {
        finish({ skipped: true });
      },
      destroy() {
        finished = true;
        cleanup();
        if (scene.svg && scene.svg.parentNode === hostEl) {
          hostEl.removeChild(scene.svg);
        }
      },
    };
  }

  /**
   * Render a lightweight static equilibrium SVG thumbnail directly from Layer 1 data
   * (used by field compound tiles so H2O is bent, CO2 is linear double-bonded, NaCl is ionic lattice, etc.)
   */
  function renderEquilibriumMiniSVG(identity, options) {
    if (!identity) return '';
    const opts = options || {};
    const shield = opts.shield || null;
    const inactive = Boolean(opts.inactive);
    const w = 104;
    const h = 50;
    const cx = w / 2;
    const cy = h / 2;

    const shieldDome = shield
      ? `<ellipse class="mol-shield-dome" cx="${cx}" cy="${cy}" rx="47" ry="22" fill="rgba(34,197,94,0.12)" stroke="${shield.heavyNobleGas ? '#34d399' : '#22c55e'}" stroke-width="1.8" stroke-dasharray="${shield.heavyNobleGas ? '5 3' : 'none'}" />`
      : '';

    // Ionic compound mini-tile: render alternating Na+ / Cl- crystal lattice motif (NEVER a covalent stick!)
    if (identity.bondingModel === 'ionic' && identity.lattice && identity.lattice.unitNodes) {
      const miniNodes = [
        { x: cx - 20, y: cy - 9, sym: 'Na⁺', r: 7.2, fill: '#eab308', text: '#1e1b4b', stroke: '#fef08a' },
        { x: cx,      y: cy - 9, sym: 'Cl⁻', r: 9.2, fill: '#16a34a', text: '#ffffff', stroke: '#86efac' },
        { x: cx + 20, y: cy - 9, sym: 'Na⁺', r: 7.2, fill: '#eab308', text: '#1e1b4b', stroke: '#fef08a' },
        { x: cx - 20, y: cy + 10, sym: 'Cl⁻', r: 9.2, fill: '#16a34a', text: '#ffffff', stroke: '#86efac' },
        { x: cx,      y: cy + 10, sym: 'Na⁺', r: 7.2, fill: '#eab308', text: '#1e1b4b', stroke: '#fef08a' },
        { x: cx + 20, y: cy + 10, sym: 'Cl⁻', r: 9.2, fill: '#16a34a', text: '#ffffff', stroke: '#86efac' },
      ];
      const gridLines = `
        <line x1="${cx - 20}" y1="${cy - 9}" x2="${cx + 20}" y2="${cy - 9}" stroke="#38bdf8" stroke-width="1.1" stroke-dasharray="2.5 2.5" opacity="0.65" />
        <line x1="${cx - 20}" y1="${cy + 10}" x2="${cx + 20}" y2="${cy + 10}" stroke="#38bdf8" stroke-width="1.1" stroke-dasharray="2.5 2.5" opacity="0.65" />
        <line x1="${cx - 20}" y1="${cy - 9}" x2="${cx - 20}" y2="${cy + 10}" stroke="#38bdf8" stroke-width="1.1" stroke-dasharray="2.5 2.5" opacity="0.65" />
        <line x1="${cx}" y1="${cy - 9}" x2="${cx}" y2="${cy + 10}" stroke="#38bdf8" stroke-width="1.1" stroke-dasharray="2.5 2.5" opacity="0.65" />
        <line x1="${cx + 20}" y1="${cy - 9}" x2="${cx + 20}" y2="${cy + 10}" stroke="#38bdf8" stroke-width="1.1" stroke-dasharray="2.5 2.5" opacity="0.65" />
      `;
      const circles = miniNodes
        .map((n) => `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${n.fill}" stroke="${n.stroke}" stroke-width="1.1" /><text x="${n.x}" y="${n.y + 2.6}" text-anchor="middle" fill="${n.text}" font-size="6.2" font-weight="900" font-family="Segoe UI, system-ui, sans-serif">${n.sym}</text>`)
        .join('');
      return `<svg class="mol-cluster-svg mol-cluster-ionic ${inactive ? 'mol-inactive' : ''}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${shieldDome}${gridLines}${circles}</svg>`;
    }

    // Covalent / polar covalent mini-tile using true Layer 1 geometry & bond orders
    const scaleX = 28;
    const scaleY = 20;
    const byId = new Map();
    const sorted = [...identity.atoms].sort((a, b) => (a.position.z || 0) - (b.position.z || 0));
    for (const a of sorted) {
      byId.set(a.atomId, {
        atom: a,
        x: cx + a.position.x * scaleX,
        y: cy + a.position.y * scaleY,
        r: a.symbol === 'H' ? 7.2 : 9.8,
      });
    }

    const bondAccent = (identity.visualHints && identity.visualHints.bondColor) || '#38bdf8';
    const bondMarkup = (identity.bonds || [])
      .map((b) => {
        const a = byId.get(b.from);
        const c = byId.get(b.to);
        if (!a || !c) return '';
        const dx = c.x - a.x;
        const dy = c.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        const offs = b.order === 2 ? [-2.3, 2.3] : b.order === 3 ? [-3, 0, 3] : [0];
        const dash = b.depthCue === 'dash' ? 'stroke-dasharray="2 2"' : '';
        return offs
          .map((o) => `<line class="mol-bond" x1="${(a.x + nx * o).toFixed(1)}" y1="${(a.y + ny * o).toFixed(1)}" x2="${(c.x + nx * o).toFixed(1)}" y2="${(c.y + ny * o).toFixed(1)}" stroke="${bondAccent}" stroke-width="${b.order >= 2 ? 1.8 : 2.2}" ${dash} opacity="0.9" />`)
          .join('');
      })
      .join('');

    const atomMarkup = sorted
      .map((a) => {
        const p = byId.get(a.atomId);
        const vis = V.ChemicalIdentity.getElementVisual(a.symbol);
        return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r}" fill="${vis.coreColor}" stroke="${vis.rimColor}" stroke-width="1.2" /><text x="${p.x.toFixed(1)}" y="${(p.y + 3).toFixed(1)}" text-anchor="middle" fill="${vis.textColor}" font-size="${p.r >= 9 ? 8.5 : 7}" font-weight="900" font-family="Segoe UI, system-ui, sans-serif">${a.symbol}</text>`;
      })
      .join('');

    return `<svg class="mol-cluster-svg mol-cluster-covalent ${inactive ? 'mol-inactive' : ''}" viewBox="0 0 ${w} ${h}" aria-hidden="true">${shieldDome}${bondMarkup}${atomMarkup}</svg>`;
  }

  V.FormationChoreography = {
    MIN_DURATION_MS,
    MAX_DURATION_MS,
    DEFAULT_DURATION_MS,
    SPEED_PRESETS,
    buildChoreographyPlan,
    evaluateTimelineState,
    play,
    renderEquilibriumMiniSVG,
    setSpeed,
    getSpeed,
    setReducedMotion,
    isReducedMotion,
  };
})(typeof window !== 'undefined' ? window : globalThis);

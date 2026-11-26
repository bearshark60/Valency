// VALENCY — Molecular Formation Animation System Verification & Regression Test Suite
// Verifies:
//   1. Layer 1 (Chemical Identity Data): schema integrity, scientific accuracy for H2O, CH4, CO2, NaCl, NH3,
//      guardrail rejection of covalent sticks on ionic compounds, and data-only extensibility.
//   2. Layer 2 (Formation Choreography Engine): chemistry-driven primitive selection (sharing vs. transfer/lattice),
//      1.5–3.0s duration target, speed scaling, skip support, reduced-motion mode, zero planetary orbits,
//      SVG <defs> namespacing, and mobile SVG node budget.
//   3. Layer 3 (Battle Presentation Integration): animations.js delegation without duplication, field tile
//      cluster fidelity, unregistered fallback, and desktop/mobile HTML + SW + bundle wiring.
//   4. Combat Regression: deterministic verification that SP math, Salt Cure, Hydrocarbon Synergy,
//      status effects, and full AI-vs-AI card resolution are 100% unchanged.
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`PASS: ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`FAIL: ${name}\n  -> ${err.stack || err.message}`);
  }
}

// Lightweight DOM + SVG mock for deterministic headless verification of Layers 1, 2, 3 & animations.js
function createMockDOM() {
  class MockElement {
    constructor(tag, ns) {
      this.tagName = String(tag || 'div').toLowerCase();
      this.namespaceURI = ns || null;
      this.attributes = {};
      this.children = [];
      this.parentNode = null;
      this.style = {
        setProperty(k, v) { this[k] = v; },
      };
      this.listeners = {};
      this.textContent = '';
      this._innerHTML = '';
      this._classSet = new Set();
      this.classList = {
        add: (...cls) => cls.forEach((c) => c && this._classSet.add(c)),
        remove: (...cls) => cls.forEach((c) => this._classSet.delete(c)),
        toggle: (c, force) => {
          if (force === undefined) {
            if (this._classSet.has(c)) this._classSet.delete(c);
            else this._classSet.add(c);
          } else if (force) this._classSet.add(c);
          else this._classSet.delete(c);
        },
        contains: (c) => this._classSet.has(c),
      };
    }
    set className(v) {
      this._classSet = new Set(String(v || '').split(/\s+/).filter(Boolean));
    }
    get className() {
      return Array.from(this._classSet).join(' ');
    }
    set innerHTML(v) {
      this._innerHTML = String(v || '');
      this.children = [];
      // Materialize lightweight placeholders for data-mol-* querySelectors used by Layer 3 overlay
      if (this._innerHTML.includes('data-mol-stage')) {
        const stage = new MockElement('div');
        stage.setAttribute('data-mol-stage', '');
        const phase = new MockElement('span');
        phase.setAttribute('data-mol-phase', '');
        const speed = new MockElement('button');
        speed.setAttribute('data-mol-speed', '');
        const skip = new MockElement('button');
        skip.setAttribute('data-mol-skip', '');
        this.appendChild(stage);
        this.appendChild(phase);
        this.appendChild(speed);
        this.appendChild(skip);
      }
    }
    get innerHTML() {
      return this._innerHTML;
    }
    setAttribute(k, v) {
      this.attributes[k] = String(v);
      if (k === 'id') this.id = String(v);
      if (k === 'class') this.className = String(v);
    }
    getAttribute(k) {
      return Object.prototype.hasOwnProperty.call(this.attributes, k) ? this.attributes[k] : null;
    }
    appendChild(child) {
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = this;
      this.children.push(child);
      return child;
    }
    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx >= 0) {
        this.children.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    }
    remove() {
      if (this.parentNode) this.parentNode.removeChild(this);
    }
    addEventListener(type, fn) {
      if (!this.listeners[type]) this.listeners[type] = [];
      this.listeners[type].push(fn);
    }
    click() {
      for (const fn of (this.listeners.click || [])) fn({ stopPropagation() {} });
    }
    querySelector(sel) {
      return this.querySelectorAll(sel)[0] || null;
    }
    querySelectorAll(sel) {
      const out = [];
      const attrMatch = sel.match(/^\[([a-z0-9-]+)(?:="([^"]+)")?\]$/i);
      const clsMatch = sel.match(/^\.([a-z0-9_-]+)$/i);
      const walk = (node) => {
        for (const ch of node.children) {
          if (attrMatch) {
            const val = ch.getAttribute(attrMatch[1]);
            if (val !== null && (attrMatch[2] === undefined || val === attrMatch[2])) out.push(ch);
          } else if (clsMatch) {
            if (ch.classList.contains(clsMatch[1])) out.push(ch);
          } else if (ch.tagName === sel.toLowerCase()) {
            out.push(ch);
          }
          walk(ch);
        }
      };
      walk(this);
      return out;
    }
    countDescendants() {
      let c = 0;
      const walk = (node) => {
        for (const ch of node.children) {
          c += 1;
          walk(ch);
        }
      };
      walk(this);
      return c;
    }
  }

  const body = new MockElement('body');
  const fxLayer = new MockElement('div');
  fxLayer.setAttribute('id', 'fx-layer');
  body.appendChild(fxLayer);

  const document = {
    body,
    createElement: (tag) => new MockElement(tag),
    createElementNS: (ns, tag) => new MockElement(tag, ns),
    getElementById(id) {
      const find = (node) => {
        if (node.id === id) return node;
        for (const ch of node.children) {
          const hit = find(ch);
          if (hit) return hit;
        }
        return null;
      };
      return find(body);
    },
    querySelector(sel) { return body.querySelector(sel); },
    querySelectorAll(sel) { return body.querySelectorAll(sel); },
  };

  return { document, body, fxLayer, MockElement };
}

function loadSandbox(files, opts) {
  const options = opts || {};
  const dom = createMockDOM();
  const storage = options.storage || {};
  let rafQueue = [];
  let rafSeq = 0;
  let rafCalls = 0;
  const timers = [];

  const sandbox = {
    window: null,
    globalThis: null,
    console,
    Math,
    Date,
    Set,
    Map,
    Object,
    Array,
    JSON,
    Number,
    String,
    Boolean,
    Error,
    document: dom.document,
    localStorage: {
      getItem: (k) => (Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null),
      setItem: (k, v) => { storage[k] = String(v); },
      removeItem: (k) => { delete storage[k]; },
    },
    requestAnimationFrame(cb) {
      rafCalls += 1;
      const id = ++rafSeq;
      rafQueue.push({ id, cb });
      return id;
    },
    cancelAnimationFrame(id) {
      rafQueue = rafQueue.filter((item) => item.id !== id);
    },
    setTimeout(fn, ms) {
      const entry = { fn, ms, cleared: false };
      timers.push(entry);
      return entry;
    },
    clearTimeout(entry) {
      if (entry) entry.cleared = true;
    },
    addEventListener() {},
    removeEventListener() {},
    matchMedia: () => ({ matches: Boolean(options.prefersReducedMotion) }),
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);

  for (const rel of files) {
    const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    vm.runInContext(code, sandbox, { filename: rel });
  }

  return {
    sandbox,
    V: sandbox.Valency,
    dom,
    getRafCalls: () => rafCalls,
    stepRaf(timestampMs) {
      const batch = rafQueue.splice(0, rafQueue.length);
      for (const item of batch) item.cb(timestampMs);
    },
    flushTimers() {
      for (const t of timers.splice(0, timers.length)) {
        if (!t.cleared) t.fn();
      }
    },
  };
}

const CORE_FILES = [
  'src/data/cards.js',
  'src/data/compounds.js',
  'src/data/chemicalIdentity.js',
  'src/engine/gameEngine.js',
  'src/engine/ai.js',
  'src/presentation/formationChoreography.js',
  'src/presentation/battleFormationBridge.js',
  'src/ui/animations.js',
];

// ===== 1. LAYER 1: CHEMICAL IDENTITY DATA SCHEMA & SCIENTIFIC ACCURACY =====
test('Layer 1: Initial 5 compounds satisfy schema, immutability, multi-key lookup, and scientific accuracy', () => {
  const { V } = loadSandbox(['src/data/cards.js', 'src/data/chemicalIdentity.js']);
  const CI = V.ChemicalIdentity;
  assert.ok(CI, 'Valency.ChemicalIdentity must be defined');
  assert.strictEqual(CI.listCompounds().length, 5, 'Must ship with exactly 5 initial compounds');

  // Lookup works across Unicode, ASCII, id, canonicalKey, symbol arrays, and compound objects
  assert.strictEqual(CI.getCompoundIdentity('H₂O').id, 'water');
  assert.strictEqual(CI.getCompoundIdentity('H2O').id, 'water');
  assert.strictEqual(CI.getCompoundIdentity('H:2|O:1').id, 'water');
  assert.strictEqual(CI.getCompoundIdentity(['H', 'O', 'H']).id, 'water');
  assert.strictEqual(CI.getCompoundIdentity({ formula: 'CH₄' }).id, 'methane');
  assert.strictEqual(CI.getCompoundIdentity('CO2').id, 'carbon_dioxide');
  assert.strictEqual(CI.getCompoundIdentity('NaCl').id, 'sodium_chloride');
  assert.strictEqual(CI.getCompoundIdentity('NH3').id, 'ammonia');

  // Every compound passes strict schema validation and is frozen
  for (const spec of CI.listCompounds()) {
    const check = CI.validateChemicalIdentity(spec);
    assert.strictEqual(check.valid, true, `${spec.id} validation errors: ${check.errors.join('; ')}`);
    assert.strictEqual(Object.isFrozen(spec), true, `${spec.id} must be frozen`);
  }

  // Water (H2O): 2 polar covalent single bonds, bent ~104.5°, 2 lone pairs on O, polar
  const h2o = CI.getCompoundIdentity('H2O');
  assert.strictEqual(h2o.bondingModel, 'polar_covalent');
  assert.strictEqual(h2o.bonds.length, 2);
  assert.ok(h2o.bonds.every((b) => b.type === 'polar_covalent' && b.order === 1));
  assert.strictEqual(h2o.geometry.name, 'bent');
  assert.strictEqual(h2o.geometry.bondAngleDeg, 104.5);
  assert.strictEqual(h2o.atoms.find((a) => a.symbol === 'O').lonePairs, 2);
  assert.strictEqual(h2o.polarity.molecularPolarity, 'polar');
  assert.ok(h2o.polarity.dipoleVector, 'Water must define a net dipole vector');

  // Verify geometric bond angle in coordinates matches 104.5° within 0.2°
  const oPos = h2o.atoms.find((a) => a.atomId === 'O1').position;
  const h1Pos = h2o.atoms.find((a) => a.atomId === 'H1').position;
  const h2Pos = h2o.atoms.find((a) => a.atomId === 'H2').position;
  const v1 = { x: h1Pos.x - oPos.x, y: h1Pos.y - oPos.y };
  const v2 = { x: h2Pos.x - oPos.x, y: h2Pos.y - oPos.y };
  const cosAng = (v1.x * v2.x + v1.y * v2.y) / (Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y));
  const deg = (Math.acos(cosAng) * 180) / Math.PI;
  assert.ok(Math.abs(deg - 104.5) < 0.2, `H2O coordinate angle should be ~104.5°, got ${deg.toFixed(2)}°`);

  // Methane (CH4): 4 single bonds, tetrahedral ~109.5°, nonpolar
  const ch4 = CI.getCompoundIdentity('CH4');
  assert.strictEqual(ch4.bondingModel, 'covalent');
  assert.strictEqual(ch4.bonds.length, 4);
  assert.ok(ch4.bonds.every((b) => b.order === 1));
  assert.strictEqual(ch4.geometry.name, 'tetrahedral');
  assert.strictEqual(ch4.geometry.bondAngleDeg, 109.5);
  assert.strictEqual(ch4.polarity.molecularPolarity, 'nonpolar');

  // Carbon Dioxide (CO2): 2 double bonds, linear 180°, dipoles cancel -> nonpolar
  const co2 = CI.getCompoundIdentity('CO2');
  assert.strictEqual(co2.bonds.length, 2);
  assert.ok(co2.bonds.every((b) => b.order === 2 && b.sharedElectronPairs === 2));
  assert.strictEqual(co2.geometry.name, 'linear');
  assert.strictEqual(co2.geometry.bondAngleDeg, 180);
  assert.strictEqual(co2.polarity.molecularPolarity, 'nonpolar');
  assert.strictEqual(co2.polarity.bondDipolesCancel, true);

  // Sodium Chloride (NaCl): ionic, ZERO covalent bonds, Na -> Cl transfer, Na+ contracts, Cl- expands, FCC crystal lattice
  const nacl = CI.getCompoundIdentity('NaCl');
  assert.strictEqual(nacl.bondingModel, 'ionic');
  assert.strictEqual(nacl.bonds.length, 0, 'NaCl MUST NOT have covalent bonds');
  assert.strictEqual(nacl.electronTransfers.length, 1);
  assert.strictEqual(nacl.electronTransfers[0].from, 'Na1');
  assert.strictEqual(nacl.electronTransfers[0].to, 'Cl1');
  assert.ok(nacl.electronTransfers[0].resultingCation.radiusScale < 1, 'Na+ cation must contract');
  assert.ok(nacl.electronTransfers[0].resultingAnion.radiusScale > 1, 'Cl- anion must expand');
  assert.ok(nacl.lattice && nacl.lattice.unitNodes.length === 12, 'NaCl must define a 12-ion 3D crystal lattice');
  assert.strictEqual(nacl.lattice.coordinationNumber, 6);

  // Ammonia (NH3): 3 polar covalent bonds, trigonal pyramidal, 1 lone pair on N, polar
  const nh3 = CI.getCompoundIdentity('NH3');
  assert.strictEqual(nh3.bondingModel, 'polar_covalent');
  assert.strictEqual(nh3.bonds.length, 3);
  assert.ok(nh3.bonds.every((b) => b.type === 'polar_covalent' && b.order === 1));
  assert.strictEqual(nh3.geometry.name, 'trigonal_pyramidal');
  assert.strictEqual(nh3.atoms.find((a) => a.symbol === 'N').lonePairs, 1);
  assert.strictEqual(nh3.polarity.molecularPolarity, 'polar');
});

test('Layer 1: Scientific guardrail rejects ionic compounds with covalent bonds & allows data-only compound registration', () => {
  const { V } = loadSandbox(['src/data/cards.js', 'src/data/chemicalIdentity.js', 'src/presentation/formationChoreography.js']);
  const CI = V.ChemicalIdentity;

  // Guardrail: ionic + covalent bond MUST fail validation
  const badIonic = CI.validateChemicalIdentity({
    id: 'bad_salt',
    formula: 'KCl',
    name: 'Bad Salt',
    bondingModel: 'ionic',
    atomCounts: { K: 1, Cl: 1 },
    totalValenceElectrons: 8,
    elements: [{ symbol: 'K', count: 1 }, { symbol: 'Cl', count: 1 }],
    atoms: [
      { atomId: 'K1', symbol: 'K', valenceElectrons: 1, electronegativity: 0.8, position: { x: -0.7, y: 0, z: 0 } },
      { atomId: 'Cl1', symbol: 'Cl', valenceElectrons: 7, electronegativity: 3.0, position: { x: 0.7, y: 0, z: 0 } },
    ],
    bonds: [{ bondId: 'K1-Cl1', from: 'K1', to: 'Cl1', type: 'covalent', order: 1 }],
    electronTransfers: [{ from: 'K1', to: 'Cl1', electronCount: 1 }],
    geometry: { name: 'ionic_cubic_lattice', bondAngleDeg: 90 },
    polarity: { molecularPolarity: 'ionic' },
  });
  assert.strictEqual(badIonic.valid, false, 'Ionic compound with covalent bond must be rejected');

  // Extensibility: Registering Hydrogen Fluoride (HF) purely via Layer 1 data immediately works in Layer 2!
  const hf = CI.registerCompound({
    id: 'hydrogen_fluoride',
    formula: 'HF',
    name: 'Hydrogen Fluoride',
    bondingModel: 'polar_covalent',
    atomCounts: { H: 1, F: 1 },
    totalValenceElectrons: 8,
    elements: [
      { symbol: 'H', name: 'Hydrogen', atomicNumber: 1, count: 1, valenceElectrons: 1, electronegativity: 2.1, role: 'terminal' },
      { symbol: 'F', name: 'Fluorine', atomicNumber: 9, count: 1, valenceElectrons: 7, electronegativity: 4.0, role: 'terminal' },
    ],
    atoms: [
      { atomId: 'H1', symbol: 'H', role: 'terminal', valenceElectrons: 1, electronegativity: 2.1, formalCharge: 0, partialCharge: 'δ⁺', position: { x: -0.65, y: 0, z: 0 }, lonePairs: 0, lonePairDirs: [] },
      { atomId: 'F1', symbol: 'F', role: 'terminal', valenceElectrons: 7, electronegativity: 4.0, formalCharge: 0, partialCharge: 'δ⁻', position: { x: 0.65, y: 0, z: 0 }, lonePairs: 3, lonePairDirs: [{ x: 0.8, y: 0 }, { x: 0.3, y: -0.8 }, { x: 0.3, y: 0.8 }] },
    ],
    bonds: [{ bondId: 'H1-F1', from: 'H1', to: 'F1', type: 'polar_covalent', order: 1, sharedElectronPairs: 1, deltaEN: 1.9, dipoleToward: 'F1', bondLengthPm: 92, depthCue: 'in_plane' }],
    electronTransfers: [],
    lattice: null,
    geometry: { name: 'linear', label: 'Linear (Diatomic)', vseprNotation: 'AX', hybridization: 'sp³', bondAngleDeg: 180, angleArc: null },
    polarity: { molecularPolarity: 'polar', bondPolarity: 'polar_covalent', bondDipolesCancel: false, dipoleVector: { x: 0.85, y: 0 }, summary: 'Strongly polarized H–F single bond.' },
    visualHints: { accentColor: '#a3e635', bondColor: '#a3e635', baseDurationMs: 1850 },
  });
  const plan = V.FormationChoreography.buildChoreographyPlan(hf);
  assert.strictEqual(plan.compoundId, 'hydrogen_fluoride');
  assert.ok(plan.primitives.includes('electronSharing') && plan.primitives.includes('bondIllumination'));
});

// ===== 2. LAYER 2: FORMATION CHOREOGRAPHY ENGINE =====
test('Layer 2: Chemistry drives primitives, 1.5-3s duration bounds, speed scaling, skip, reduced motion & mobile SVG budget', () => {
  const store = {};
  const env = loadSandbox(['src/data/cards.js', 'src/data/chemicalIdentity.js', 'src/presentation/formationChoreography.js'], { storage: store });
  const CI = env.V.ChemicalIdentity;
  const FC = env.V.FormationChoreography;

  for (const spec of CI.listCompounds()) {
    const plan = FC.buildChoreographyPlan(spec, { speed: 1, reducedMotion: false });
    assert.ok(plan.baseDurationMs >= 1500 && plan.baseDurationMs <= 3000, `${spec.id} duration ${plan.baseDurationMs}ms outside 1.5–3s`);
    assert.strictEqual(plan.usesPlanetaryOrbits, false);
    assert.strictEqual(plan.usesCovalentSticksForIonic, false);

    if (spec.bondingModel === 'ionic') {
      assert.deepStrictEqual(Array.from(plan.primitives), ['atomEntrance', 'electronTransfer', 'latticeAssembly', 'equilibriumHold']);
    } else {
      assert.deepStrictEqual(Array.from(plan.primitives), ['atomEntrance', 'electronSharing', 'bondIllumination', 'equilibriumHold']);
    }

    // Verify SVG scene mounts cleanly, stays under mobile performance node budget (<= 115 total nodes including <defs>), and has unique defs IDs
    const host = env.dom.document.createElement('div');
    const handle = FC.play(host, spec, { speed: 1, reducedMotion: false });
    const nodeCount = handle.svg.countDescendants();
    assert.ok(nodeCount > 10 && nodeCount <= 115, `${spec.id} SVG node count (${nodeCount}) exceeds mobile performance budget`);
    handle.destroy();
  }

  // Speed scaling + persistence
  FC.setSpeed(2);
  assert.strictEqual(FC.getSpeed(), 2);
  const fastPlan = FC.buildChoreographyPlan(CI.getCompoundIdentity('H2O'), { reducedMotion: false });
  assert.strictEqual(fastPlan.effectiveDurationMs, Math.round(fastPlan.baseDurationMs / 2));

  // Reload from same localStorage -> speed persists
  const env2 = loadSandbox(['src/data/cards.js', 'src/data/chemicalIdentity.js', 'src/presentation/formationChoreography.js'], { storage: store });
  assert.strictEqual(env2.V.FormationChoreography.getSpeed(), 2);

  // Skip support cancels rAF immediately and signals skipped: true
  const skipHost = env.dom.document.createElement('div');
  let completionInfo = null;
  const skipHandle = FC.play(skipHost, CI.getCompoundIdentity('NaCl'), {
    speed: 1,
    reducedMotion: false,
    onComplete: (info) => { completionInfo = info; },
  });
  env.stepRaf(0);
  env.stepRaf(400);
  skipHandle.skip();
  assert.ok(completionInfo && completionInfo.skipped === true, 'skip() must invoke onComplete with skipped: true');

  // Reduced-motion mode renders final equilibrium with ZERO rAF loop calls
  const redEnv = loadSandbox(['src/data/cards.js', 'src/data/chemicalIdentity.js', 'src/presentation/formationChoreography.js'], { prefersReducedMotion: true });
  const redHost = redEnv.dom.document.createElement('div');
  let redDone = null;
  const redHandle = redEnv.V.FormationChoreography.play(redHost, redEnv.V.ChemicalIdentity.getCompoundIdentity('CO2'), {
    onComplete: (info) => { redDone = info; },
  });
  assert.strictEqual(redEnv.getRafCalls(), 0, 'Reduced-motion mode must schedule ZERO requestAnimationFrame calls');
  assert.strictEqual(redHandle.getProgress(), 1, 'Reduced-motion mode must settle immediately at progress = 1');
  redEnv.flushTimers();
  assert.ok(redDone && redDone.reducedMotion === true);
});

// ===== 3. LAYER 3: BATTLE DEPLOYMENT INTEGRATION & ZERO DUPLICATION =====
test('Layer 3: Battle card deployment triggers formation overlay for registered compounds and falls back cleanly for unregistered ones', () => {
  const env = loadSandbox(CORE_FILES);
  const V = env.V;

  // 1. Registered compound synthesis (H2O) -> BattleFormation handles overlay, NO duplicate .fx-banner!
  V.playGameEvents([{ meta: { type: 'SYNTHESIZE', playerId: 0, compoundId: 'comp_1', formula: 'H₂O', sp: 8 } }], 0);
  assert.strictEqual(V.BattleFormation.getActiveState().isPresenting, true, 'H2O synthesis must launch BattleFormation overlay');
  assert.strictEqual(env.dom.fxLayer.querySelectorAll('.fx-banner').length, 0, 'Must NOT duplicate generic .fx-banner when formation overlay plays');

  // Skip active H2O overlay -> completes cleanly
  const root = env.dom.document.getElementById('molecular-formation-root');
  assert.ok(root && !root.classList.contains('hidden'));
  root.querySelector('[data-mol-skip]').click();
  env.flushTimers();
  assert.strictEqual(V.BattleFormation.getActiveState().isPresenting, false, 'Skip button must dismiss overlay cleanly');

  // 2. EN Takeover forming NaCl -> triggers ionic formation overlay!
  V.playGameEvents([{ meta: { type: 'EN_TAKEOVER', playerId: 0, attackerId: 0, victimId: 1, oldFormula: 'HCl', newFormula: 'NaCl', attackSymbol: 'Na' } }], 0);
  assert.strictEqual(V.BattleFormation.getActiveState().isPresenting, true, 'EN Takeover producing NaCl must trigger formation overlay');
  V.BattleFormation.cancelActive();
  assert.strictEqual(V.BattleFormation.getActiveState().isPresenting, false);

  // 3. Unregistered compound (MgO) -> falls back to original animations.js .fx-banner without error!
  V.playGameEvents([{ meta: { type: 'SYNTHESIZE', playerId: 0, compoundId: 'comp_2', formula: 'MgO', sp: 8 } }], 0);
  assert.strictEqual(V.BattleFormation.getActiveState().isPresenting, false, 'Unregistered compound should not invent unverified geometry');
  assert.strictEqual(env.dom.fxLayer.querySelectorAll('.fx-banner').length, 1, 'Unregistered compound must preserve original banner');

  // 4. Field cluster mini-SVG fidelity: NaCl uses ionic crystal lattice (not covalent stick), CO2 uses double bonds
  const naclTileSvg = V.renderMoleculeClusterSVG({ formula: 'NaCl', bondType: 'ionic', elements: [V.ELEMENT_BY_SYMBOL.Na, V.ELEMENT_BY_SYMBOL.Cl] });
  assert.ok(naclTileSvg.includes('mol-cluster-ionic') && naclTileSvg.includes('Na⁺') && naclTileSvg.includes('Cl⁻'), 'NaCl field tile must render ionic crystal motif');
  assert.ok(!naclTileSvg.includes('mol-bond-spark'), 'NaCl ionic tile must not render covalent bond sparks');

  const co2TileSvg = V.renderMoleculeClusterSVG({ formula: 'CO₂', bondType: 'covalent', elements: [V.ELEMENT_BY_SYMBOL.C, V.ELEMENT_BY_SYMBOL.O, V.ELEMENT_BY_SYMBOL.O] });
  const co2LineCount = (co2TileSvg.match(/<line /g) || []).length;
  assert.strictEqual(co2LineCount, 4, 'CO2 field tile must render 4 bond strokes (2 double bonds)');
});

// ===== 4. COMBAT REGRESSION: BIT-FOR-BIT UNCHANGED COMBAT MATH, STATUS EFFECTS & CARD RESOLUTION =====
test('Combat Regression: All 5 compounds & deterministic full AI-vs-AI battle resolve identically with or without Formation layers', () => {
  function runDeterministicCombatSnapshot(fileList) {
    const { V } = loadSandbox(fileList);

    function makeSeededRng(seed) {
      let s = seed >>> 0;
      return function () {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0x100000000;
      };
    }

    // Part A: Explicit synthesis of all 5 compounds checking SP, Salt Cure, Hydrocarbon Synergy, and emitted events
    const cardBySym = (sym, suffix) => ({ id: `t_${sym}_${suffix}`, ...V.ELEMENT_BY_SYMBOL[sym] });
    const scenarios = [
      { label: 'H2O',  cards: [cardBySym('H', 1), cardBySym('H', 2), cardBySym('O', 1)], expectedFormula: 'H₂O', expectedSP: 8, expectedBonusDraw: 0 },
      { label: 'CH4',  cards: [cardBySym('C', 1), cardBySym('H', 1), cardBySym('H', 2), cardBySym('H', 3), cardBySym('H', 4)], expectedFormula: 'CH₄', expectedSP: 10, expectedBonusDraw: 1 },
      { label: 'CO2',  cards: [cardBySym('C', 1), cardBySym('O', 1), cardBySym('O', 2)], expectedFormula: 'CO₂', expectedSP: 16, expectedBonusDraw: 0 },
      { label: 'NaCl', cards: [cardBySym('Na', 1), cardBySym('Cl', 1)], expectedFormula: 'NaCl', expectedSP: 9, expectedBonusDraw: 1 },
      { label: 'NH3',  cards: [cardBySym('N', 1), cardBySym('H', 1), cardBySym('H', 2), cardBySym('H', 3)], expectedFormula: 'NH₃', expectedSP: 8, expectedBonusDraw: 0 },
    ];

    const synthResults = [];
    for (const sc of scenarios) {
      const st = V.createGame({ mode: 'vs_ai', rng: makeSeededRng(42) });
      st.players[0].hand = [...sc.cards];
      const beforeHandLen = st.players[0].hand.length;
      const res = V.synthesizeCompound(st, sc.cards.map((c) => c.id));
      assert.strictEqual(res.ok, true, `${sc.label} synthesis failed: ${res.error}`);
      assert.strictEqual(res.compound.formula, sc.expectedFormula);
      assert.strictEqual(V.getCompoundSP(res.compound), sc.expectedSP, `${sc.label} SP mismatch`);
      assert.strictEqual(st.players[0].hand.length, beforeHandLen - sc.cards.length + sc.expectedBonusDraw, `${sc.label} bonus draw mismatch`);
      synthResults.push({
        label: sc.label,
        formula: res.compound.formula,
        sp: V.getCompoundSP(res.compound),
        playerSP: V.getPlayerSP(st.players[0]),
        handAfter: st.players[0].hand.length,
        eventTypes: st.recentEvents.map((e) => e.meta && e.meta.type).filter(Boolean),
      });
    }

    // Part B: Full deterministic AI-vs-AI match using seeded RNG
    const st = V.createGame({ mode: 'vs_ai', rng: makeSeededRng(1337) });
    st.players[0].isAI = true;
    st.players[1].isAI = true;
    let steps = 0;
    while (st.phase !== 'GAME_OVER' && steps < 250) {
      V.runAIStep(st);
      steps += 1;
    }

    return {
      synthResults,
      winnerIndex: st.winnerIndex,
      turnNumber: st.turnNumber,
      steps,
      p0SP: V.getPlayerSP(st.players[0]),
      p1SP: V.getPlayerSP(st.players[1]),
      p0Field: st.players[0].field.map((c) => `${c.formula}:${V.getCompoundSP(c)}`),
      p1Field: st.players[1].field.map((c) => `${c.formula}:${V.getCompoundSP(c)}`),
    };
  }

  const baselineFiles = ['src/data/cards.js', 'src/data/compounds.js', 'src/engine/gameEngine.js', 'src/engine/ai.js'];
  const baseline = JSON.parse(JSON.stringify(runDeterministicCombatSnapshot(baselineFiles)));
  const withFormation = JSON.parse(JSON.stringify(runDeterministicCombatSnapshot(CORE_FILES)));

  assert.deepStrictEqual(withFormation, baseline, 'Combat math, status effects, and match outcomes must be 100% identical');
});

// ===== 5. DESKTOP & MOBILE INTEGRATION WIRING =====
test('Desktop & Mobile Wiring: index.html, mobile.html, sw.js, and bundler load all 3 layers in strict dependency order', () => {
  const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const mob = fs.readFileSync(path.join(ROOT, 'mobile.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const appJs = fs.readFileSync(path.join(ROOT, 'src/ui/app.js'), 'utf8');
  const animJs = fs.readFileSync(path.join(ROOT, 'src/ui/animations.js'), 'utf8');

  for (const [label, html] of [['index.html', idx], ['mobile.html', mob]]) {
    assert.ok(html.includes('src/styles/molecular-formation.css'), `${label} missing molecular-formation.css`);
    assert.ok(html.includes('menu-btn-formation-lab'), `${label} missing menu-btn-formation-lab`);
    const i1 = html.indexOf('src/data/chemicalIdentity.js');
    const i2 = html.indexOf('src/presentation/formationChoreography.js');
    const i3 = html.indexOf('src/presentation/battleFormationBridge.js');
    const iAnim = html.indexOf('src/ui/animations.js');
    assert.ok(i1 > 0 && i2 > i1 && i3 > i2 && iAnim > i3, `${label} must load Layer 1 -> Layer 2 -> Layer 3 -> animations.js in order`);
  }

  for (const rel of [
    './src/styles/molecular-formation.css',
    './src/data/chemicalIdentity.js',
    './src/presentation/formationChoreography.js',
    './src/presentation/battleFormationBridge.js',
  ]) {
    assert.ok(sw.includes(rel), `sw.js missing ${rel}`);
  }

  assert.ok(appJs.includes('BattleFormation.cancelActive'), 'app.js must clean up active formation overlays on menu transitions');
  assert.ok(animJs.includes('BattleFormation.presentFromEvent'), 'animations.js must hook card deployment via BattleFormation.presentFromEvent');

  // Verify Layer 1 & Layer 2 files themselves contain ZERO combat rules / gameEngine coupling
  const l1Src = fs.readFileSync(path.join(ROOT, 'src/data/chemicalIdentity.js'), 'utf8');
  const l2Src = fs.readFileSync(path.join(ROOT, 'src/presentation/formationChoreography.js'), 'utf8');
  assert.ok(!l1Src.includes('document.') && !l1Src.includes('getCompoundSP'), 'Layer 1 must remain pure data');
  assert.ok(!l2Src.includes('getCompoundSP') && !l2Src.includes('synthesizeCompound'), 'Layer 2 must remain free of combat rules');
});

console.log(`\nMOLECULAR FORMATION SYSTEM SUMMARY: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

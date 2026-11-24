// VALENCY — Real Chemical Compound Database & Validator
// Generates canonical lookup signatures for real chemical compounds + diatomics
// built from the 64 bonding elements in the Unit 1 deck.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const SUBSCRIPTS = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };

  function toSubscript(n) {
    if (n <= 1) return '';
    return String(n).split('').map((ch) => SUBSCRIPTS[ch] || ch).join('');
  }

  /**
   * Build a canonical sorted key for a map of { Symbol: count }
   * Example: { H: 2, O: 1 } -> "H:2|O:1"
   */
  function makeKey(counts) {
    return Object.keys(counts)
      .filter((k) => counts[k] > 0)
      .sort()
      .map((k) => `${k}:${counts[k]}`)
      .join('|');
  }

  function countSymbols(symbols) {
    const counts = {};
    for (const sym of symbols) {
      counts[sym] = (counts[sym] || 0) + 1;
    }
    return counts;
  }

  function formatFormula(order, counts) {
    return order.map((sym) => sym + toSubscript(counts[sym])).join('');
  }

  // Registry: key -> { formula, name, bondType, counts }
  const COMPOUND_MAP = new Map();

  function register(counts, formula, name, bondType) {
    const key = makeKey(counts);
    if (!COMPOUND_MAP.has(key)) {
      COMPOUND_MAP.set(key, { key, formula, name, bondType, counts: { ...counts } });
    }
  }

  // ===== 1. DIATOMIC & HOMONUCLEAR MOLECULES (Allowed per Unit 1 rules) =====
  const DIATOMICS = [
    ['H', 2, 'H₂', 'Hydrogen Gas'],
    ['N', 2, 'N₂', 'Nitrogen Gas'],
    ['O', 2, 'O₂', 'Oxygen Gas'],
    ['O', 3, 'O₃', 'Ozone'],
    ['F', 2, 'F₂', 'Fluorine Gas'],
    ['Cl', 2, 'Cl₂', 'Chlorine Gas'],
    ['Br', 2, 'Br₂', 'Liquid Bromine'],
    ['I', 2, 'I₂', 'Iodine'],
    ['At', 2, 'At₂', 'Astatine'],
  ];
  for (const [sym, cnt, formula, name] of DIATOMICS) {
    register({ [sym]: cnt }, formula, name, 'covalent');
  }

  // ===== 2. BINARY IONIC & MAIN-GROUP SALTS =====
  const ALKALI = [
    ['Li', 'Lithium'], ['Na', 'Sodium'], ['K', 'Potassium'],
    ['Rb', 'Rubidium'], ['Cs', 'Caesium'], ['Fr', 'Francium'],
  ];
  const ALKALINE = [
    ['Be', 'Beryllium'], ['Mg', 'Magnesium'], ['Ca', 'Calcium'],
    ['Sr', 'Strontium'], ['Ba', 'Barium'], ['Ra', 'Radium'],
  ];
  const GROUP3 = [
    ['B', 'Boron'], ['Al', 'Aluminum'], ['Ga', 'Gallium'],
    ['In', 'Indium'], ['Tl', 'Thallium'],
  ];
  const HALOGENS = [
    ['F', 'Fluoride'], ['Cl', 'Chloride'], ['Br', 'Bromide'],
    ['I', 'Iodide'], ['At', 'Astatide'],
  ];
  const CHALCOGENS = [
    ['O', 'Oxide'], ['S', 'Sulfide'], ['Se', 'Selenide'],
    ['Te', 'Telluride'], ['Po', 'Polonide'],
  ];
  const PNICTOGENS_IONIC = [
    ['N', 'Nitride'], ['P', 'Phosphide'], ['As', 'Arsenide'], ['Sb', 'Antimonide'],
  ];

  // 1A + 7A (MX), 1A + 6A (M2Y), 1A + 5A (M3Z), 1A + H (MH), 1A + OH (MOH)
  for (const [m, mName] of ALKALI) {
    for (const [x, xName] of HALOGENS) {
      const common = (m === 'Na' && x === 'Cl') ? 'Table Salt (Sodium Chloride)' : `${mName} ${xName}`;
      register({ [m]: 1, [x]: 1 }, `${m}${x}`, common, 'ionic');
    }
    for (const [y, yName] of CHALCOGENS) {
      register({ [m]: 2, [y]: 1 }, `${m}₂${y}`, `${mName} ${yName}`, 'ionic');
    }
    // Peroxides for Li, Na, K
    if (m === 'Li' || m === 'Na' || m === 'K') {
      register({ [m]: 2, O: 2 }, `${m}₂O₂`, `${mName} Peroxide`, 'ionic');
    }
    for (const [z, zName] of [['N', 'Nitride'], ['P', 'Phosphide']]) {
      register({ [m]: 3, [z]: 1 }, `${m}₃${z}`, `${mName} ${zName}`, 'ionic');
    }
    register({ [m]: 1, H: 1 }, `${m}H`, `${mName} Hydride`, 'ionic');
    register({ [m]: 1, O: 1, H: 1 }, `${m}OH`, `${mName} Hydroxide`, 'ionic');
  }

  // 2A + 7A (MX2), 2A + 6A (MY), 2A + 5A (M3Z2), 2A + H (MH2), 2A + (OH)2
  for (const [m, mName] of ALKALINE) {
    for (const [x, xName] of HALOGENS) {
      register({ [m]: 1, [x]: 2 }, `${m}${x}₂`, `${mName} ${xName}`, 'ionic');
    }
    for (const [y, yName] of CHALCOGENS) {
      register({ [m]: 1, [y]: 1 }, `${m}${y}`, `${mName} ${yName}`, 'ionic');
    }
    for (const [z, zName] of [['N', 'Nitride'], ['P', 'Phosphide']]) {
      register({ [m]: 3, [z]: 2 }, `${m}₃${z}₂`, `${mName} ${zName}`, 'ionic');
    }
    register({ [m]: 1, H: 2 }, `${m}H₂`, `${mName} Hydride`, 'ionic');
    register({ [m]: 1, O: 2, H: 2 }, `${m}(OH)₂`, `${mName} Hydroxide`, 'ionic');
  }

  // 3A + 7A (MX3), 3A + 6A (M2Y3), 3A + 5A (MZ), 3A + H (MH3)
  for (const [m, mName] of GROUP3) {
    const bType = m === 'B' ? 'covalent' : 'ionic';
    for (const [x, xName] of HALOGENS) {
      const prefix = m === 'B' ? 'Tri' : '';
      register({ [m]: 1, [x]: 3 }, `${m}${x}₃`, `${mName} ${prefix}${xName}`, bType);
    }
    for (const [y, yName] of CHALCOGENS) {
      register({ [m]: 2, [y]: 3 }, `${m}₂${y}₃`, `${mName} ${yName}`, bType);
    }
    for (const [z, zName] of PNICTOGENS_IONIC) {
      register({ [m]: 1, [z]: 1 }, `${m}${z}`, `${mName} ${zName}`, bType);
    }
    if (m === 'B' || m === 'Al' || m === 'Ga') {
      register({ [m]: 1, H: 3 }, `${m}H₃`, m === 'B' ? 'Borane' : `${mName} Hydride`, bType);
    }
  }
  // Thallium(I) compounds (real inert-pair effect!)
  for (const [x, xName] of HALOGENS) {
    register({ Tl: 1, [x]: 1 }, `Tl${x}`, `Thallium(I) ${xName}`, 'ionic');
  }
  register({ Tl: 2, O: 1 }, 'Tl₂O', 'Thallium(I) Oxide', 'ionic');
  register({ Tl: 2, S: 1 }, 'Tl₂S', 'Thallium(I) Sulfide', 'ionic');

  // Heavy 4A (Sn, Pb) and 5A (Bi) binary compounds
  for (const [m, mName] of [['Sn', 'Tin'], ['Pb', 'Lead']]) {
    for (const [x, xName] of HALOGENS) {
      register({ [m]: 1, [x]: 2 }, `${m}${x}₂`, `${mName}(II) ${xName}`, 'ionic');
      if (x !== 'At') {
        register({ [m]: 1, [x]: 4 }, `${m}${x}₄`, `${mName}(IV) ${xName}`, 'covalent');
      }
    }
    for (const [y, yName] of [['O', 'Oxide'], ['S', 'Sulfide'], ['Se', 'Selenide']]) {
      register({ [m]: 1, [y]: 1 }, `${m}${y}`, `${mName}(II) ${yName}`, 'ionic');
      register({ [m]: 1, [y]: 2 }, `${m}${y}₂`, `${mName}(IV) ${yName}`, 'ionic');
    }
    register({ [m]: 1, H: 4 }, `${m}H₄`, m === 'Sn' ? 'Stannane' : 'Plumbane', 'covalent');
  }
  for (const [x, xName] of HALOGENS) {
    register({ Bi: 1, [x]: 3 }, `Bi${x}₃`, `Bismuth(III) ${xName}`, 'ionic');
  }
  register({ Bi: 2, O: 3 }, 'Bi₂O₃', 'Bismuth(III) Oxide', 'ionic');
  register({ Bi: 2, S: 3 }, 'Bi₂S₃', 'Bismuth(III) Sulfide', 'ionic');
  register({ Bi: 1, H: 3 }, 'BiH₃', 'Bismuthine', 'covalent');

  // ===== 3. REAL COVALENT, ORGANIC, ACID & COMMON COMPOUNDS =====
  const COVALENT_LIST = [
    // Hydrogen halides
    [{ H: 1, F: 1 }, 'HF', 'Hydrogen Fluoride'],
    [{ H: 1, Cl: 1 }, 'HCl', 'Hydrogen Chloride'],
    [{ H: 1, Br: 1 }, 'HBr', 'Hydrogen Bromide'],
    [{ H: 1, I: 1 }, 'HI', 'Hydrogen Iodide'],
    [{ H: 1, At: 1 }, 'HAt', 'Hydrogen Astatide'],

    // Group 6A hydrides & water
    [{ H: 2, O: 1 }, 'H₂O', 'Water'],
    [{ H: 2, O: 2 }, 'H₂O₂', 'Hydrogen Peroxide'],
    [{ H: 2, S: 1 }, 'H₂S', 'Hydrogen Sulfide'],
    [{ H: 2, Se: 1 }, 'H₂Se', 'Hydrogen Selenide'],
    [{ H: 2, Te: 1 }, 'H₂Te', 'Hydrogen Telluride'],
    [{ H: 2, Po: 1 }, 'H₂Po', 'Polonium Hydride'],

    // Group 5A hydrides
    [{ N: 1, H: 3 }, 'NH₃', 'Ammonia'],
    [{ N: 2, H: 4 }, 'N₂H₄', 'Hydrazine'],
    [{ P: 1, H: 3 }, 'PH₃', 'Phosphine'],
    [{ As: 1, H: 3 }, 'AsH₃', 'Arsine'],
    [{ Sb: 1, H: 3 }, 'SbH₃', 'Stibine'],

    // Group 4A hydrides & hydrocarbons
    [{ C: 1, H: 4 }, 'CH₄', 'Methane'],
    [{ C: 2, H: 6 }, 'C₂H₆', 'Ethane'],
    [{ C: 2, H: 4 }, 'C₂H₄', 'Ethene (Ethylene)'],
    [{ C: 2, H: 2 }, 'C₂H₂', 'Acetylene'],
    [{ C: 3, H: 8 }, 'C₃H₈', 'Propane'],
    [{ C: 3, H: 6 }, 'C₃H₆', 'Propene'],
    [{ C: 3, H: 4 }, 'C₃H₄', 'Propyne'],
    [{ C: 4, H: 8 }, 'C₄H₈', 'Butene'],
    [{ C: 4, H: 6 }, 'C₄H₆', 'Butadiene'],
    [{ Si: 1, H: 4 }, 'SiH₄', 'Silane'],
    [{ Ge: 1, H: 4 }, 'GeH₄', 'Germane'],

    // Carbon oxides, sulfides, halides, organics
    [{ C: 1, O: 1 }, 'CO', 'Carbon Monoxide'],
    [{ C: 1, O: 2 }, 'CO₂', 'Carbon Dioxide'],
    [{ C: 1, S: 2 }, 'CS₂', 'Carbon Disulfide'],
    [{ C: 1, Se: 2 }, 'CSe₂', 'Carbon Diselenide'],
    [{ C: 1, O: 1, S: 1 }, 'COS', 'Carbonyl Sulfide'],
    [{ C: 1, F: 4 }, 'CF₄', 'Carbon Tetrafluoride'],
    [{ C: 1, Cl: 4 }, 'CCl₄', 'Carbon Tetrachloride'],
    [{ C: 1, Br: 4 }, 'CBr₄', 'Carbon Tetrabromide'],
    [{ C: 1, I: 4 }, 'CI₄', 'Carbon Tetraiodide'],
    [{ C: 1, H: 3, F: 1 }, 'CH₃F', 'Fluoromethane'],
    [{ C: 1, H: 2, F: 2 }, 'CH₂F₂', 'Difluoromethane'],
    [{ C: 1, H: 1, F: 3 }, 'CHF₃', 'Fluoroform'],
    [{ C: 1, H: 3, Cl: 1 }, 'CH₃Cl', 'Chloromethane'],
    [{ C: 1, H: 2, Cl: 2 }, 'CH₂Cl₂', 'Dichloromethane'],
    [{ C: 1, H: 1, Cl: 3 }, 'CHCl₃', 'Chloroform'],
    [{ C: 1, H: 3, Br: 1 }, 'CH₃Br', 'Bromomethane'],
    [{ C: 1, H: 2, Br: 2 }, 'CH₂Br₂', 'Dibromomethane'],
    [{ C: 1, H: 3, I: 1 }, 'CH₃I', 'Iodomethane'],
    [{ C: 1, F: 2, Cl: 2 }, 'CF₂Cl₂', 'Freon-12'],
    [{ C: 1, F: 1, Cl: 3 }, 'CFCl₃', 'Freon-11'],
    [{ C: 1, F: 3, Cl: 1 }, 'CF₃Cl', 'Chlorotrifluoromethane'],
    [{ C: 1, O: 1, Cl: 2 }, 'COCl₂', 'Phosgene'],
    [{ C: 1, O: 1, F: 2 }, 'COF₂', 'Carbonyl Fluoride'],
    [{ H: 1, C: 1, N: 1 }, 'HCN', 'Hydrogen Cyanide'],
    [{ C: 2, N: 2 }, 'C₂N₂', 'Cyanogen'],
    [{ C: 1, H: 2, O: 1 }, 'CH₂O', 'Formaldehyde'],
    [{ C: 1, H: 4, O: 1 }, 'CH₃OH', 'Methanol'],
    [{ C: 1, H: 2, O: 2 }, 'HCOOH', 'Formic Acid'],
    [{ C: 2, H: 6, O: 1 }, 'C₂H₅OH', 'Ethanol'],
    [{ C: 2, H: 4, O: 2 }, 'CH₃COOH', 'Acetic Acid'],
    [{ C: 1, H: 5, N: 1 }, 'CH₃NH₂', 'Methylamine'],
    [{ C: 1, H: 4, N: 2, O: 1 }, 'CO(NH₂)₂', 'Urea'],
    [{ Si: 1, C: 1 }, 'SiC', 'Silicon Carbide'],

    // Silicon & Germanium compounds
    [{ Si: 1, O: 2 }, 'SiO₂', 'Silicon Dioxide (Quartz)'],
    [{ Si: 1, S: 2 }, 'SiS₂', 'Silicon Disulfide'],
    [{ Si: 1, F: 4 }, 'SiF₄', 'Silicon Tetrafluoride'],
    [{ Si: 1, Cl: 4 }, 'SiCl₄', 'Silicon Tetrachloride'],
    [{ Si: 1, Br: 4 }, 'SiBr₄', 'Silicon Tetrabromide'],
    [{ Ge: 1, O: 2 }, 'GeO₂', 'Germanium Dioxide'],
    [{ Ge: 1, O: 1 }, 'GeO', 'Germanium Monoxide'],
    [{ Ge: 1, S: 2 }, 'GeS₂', 'Germanium Disulfide'],
    [{ Ge: 1, F: 4 }, 'GeF₄', 'Germanium Tetrafluoride'],
    [{ Ge: 1, Cl: 4 }, 'GeCl₄', 'Germanium Tetrachloride'],

    // Nitrogen, Phosphorus, Arsenic, Antimony covalent compounds
    [{ N: 1, H: 2, Cl: 1 }, 'NH₂Cl', 'Chloramine Gas'],
    [{ N: 2, O: 1 }, 'N₂O', 'Nitrous Oxide'],
    [{ N: 1, O: 1 }, 'NO', 'Nitric Oxide'],
    [{ N: 1, O: 2 }, 'NO₂', 'Nitrogen Dioxide'],
    [{ N: 2, O: 3 }, 'N₂O₃', 'Dinitrogen Trioxide'],
    [{ N: 2, O: 4 }, 'N₂O₄', 'Dinitrogen Tetroxide'],
    [{ N: 2, O: 5 }, 'N₂O₅', 'Dinitrogen Pentoxide'],
    [{ N: 1, F: 3 }, 'NF₃', 'Nitrogen Trifluoride'],
    [{ N: 1, Cl: 3 }, 'NCl₃', 'Nitrogen Trichloride'],
    [{ N: 1, O: 1, Cl: 1 }, 'NOCl', 'Nitrosyl Chloride'],
    [{ N: 1, O: 1, F: 1 }, 'NOF', 'Nitrosyl Fluoride'],
    [{ H: 1, N: 1, O: 2 }, 'HNO₂', 'Nitrous Acid'],
    [{ H: 1, N: 1, O: 3 }, 'HNO₃', 'Nitric Acid'],
    [{ P: 1, F: 3 }, 'PF₃', 'Phosphorus Trifluoride'],
    [{ P: 1, Cl: 3 }, 'PCl₃', 'Phosphorus Trichloride'],
    [{ P: 1, Br: 3 }, 'PBr₃', 'Phosphorus Tribromide'],
    [{ P: 2, O: 3 }, 'P₂O₃', 'Phosphorus Trioxide'],
    [{ P: 2, O: 5 }, 'P₂O₅', 'Phosphorus Pentoxide'],
    [{ P: 1, O: 1, Cl: 3 }, 'POCl₃', 'Phosphoryl Chloride'],
    [{ P: 1, O: 1, F: 3 }, 'POF₃', 'Phosphoryl Fluoride'],
    [{ H: 3, P: 1, O: 4 }, 'H₃PO₄', 'Phosphoric Acid'],
    [{ H: 3, P: 1, O: 3 }, 'H₃PO₃', 'Phosphorous Acid'],
    [{ As: 1, F: 3 }, 'AsF₃', 'Arsenic Trifluoride'],
    [{ As: 1, Cl: 3 }, 'AsCl₃', 'Arsenic Trichloride'],
    [{ As: 2, O: 3 }, 'As₂O₃', 'Arsenic Trioxide'],
    [{ Sb: 1, F: 3 }, 'SbF₃', 'Antimony Trifluoride'],
    [{ Sb: 1, Cl: 3 }, 'SbCl₃', 'Antimony Trichloride'],
    [{ Sb: 2, O: 3 }, 'Sb₂O₃', 'Antimony Trioxide'],

    // Sulfur, Selenium, Tellurium, Polonium covalent compounds
    [{ S: 1, O: 2 }, 'SO₂', 'Sulfur Dioxide'],
    [{ S: 1, O: 3 }, 'SO₃', 'Sulfur Trioxide'],
    [{ S: 1, F: 2 }, 'SF₂', 'Sulfur Difluoride'],
    [{ S: 1, F: 4 }, 'SF₄', 'Sulfur Tetrafluoride'],
    [{ S: 1, Cl: 2 }, 'SCl₂', 'Sulfur Dichloride'],
    [{ S: 2, Cl: 2 }, 'S₂Cl₂', 'Disulfur Dichloride'],
    [{ S: 1, O: 1, Cl: 2 }, 'SOCl₂', 'Thionyl Chloride'],
    [{ H: 2, S: 1, O: 4 }, 'H₂SO₄', 'Sulfuric Acid'],
    [{ H: 2, S: 1, O: 3 }, 'H₂SO₃', 'Sulfurous Acid'],
    [{ Se: 1, O: 2 }, 'SeO₂', 'Selenium Dioxide'],
    [{ Se: 1, F: 4 }, 'SeF₄', 'Selenium Tetrafluoride'],
    [{ Se: 1, Cl: 2 }, 'SeCl₂', 'Selenium Dichloride'],
    [{ Se: 1, Cl: 4 }, 'SeCl₄', 'Selenium Tetrachloride'],
    [{ Te: 1, O: 2 }, 'TeO₂', 'Tellurium Dioxide'],
    [{ Te: 1, F: 4 }, 'TeF₄', 'Tellurium Tetrafluoride'],
    [{ Te: 1, Cl: 4 }, 'TeCl₄', 'Tellurium Tetrachloride'],
    [{ Po: 1, O: 2 }, 'PoO₂', 'Polonium Dioxide'],
    [{ Po: 1, Cl: 2 }, 'PoCl₂', 'Polonium Dichloride'],
    [{ Po: 1, Cl: 4 }, 'PoCl₄', 'Polonium Tetrachloride'],
    [{ Po: 1, F: 4 }, 'PoF₄', 'Polonium Tetrafluoride'],

    // Oxygen halides & Interhalogens
    [{ O: 1, F: 2 }, 'OF₂', 'Oxygen Difluoride'],
    [{ O: 2, F: 2 }, 'O₂F₂', 'Dioxygen Difluoride'],
    [{ Cl: 2, O: 1 }, 'Cl₂O', 'Dichlorine Monoxide'],
    [{ Cl: 1, O: 2 }, 'ClO₂', 'Chlorine Dioxide'],
    [{ Br: 2, O: 1 }, 'Br₂O', 'Dibromine Monoxide'],
    [{ Cl: 1, F: 1 }, 'ClF', 'Chlorine Monofluoride'],
    [{ Cl: 1, F: 3 }, 'ClF₃', 'Chlorine Trifluoride'],
    [{ Br: 1, F: 1 }, 'BrF', 'Bromine Monofluoride'],
    [{ Br: 1, F: 3 }, 'BrF₃', 'Bromine Trifluoride'],
    [{ Br: 1, Cl: 1 }, 'BrCl', 'Bromine Monochloride'],
    [{ I: 1, F: 1 }, 'IF', 'Iodine Monofluoride'],
    [{ I: 1, F: 3 }, 'IF₃', 'Iodine Trifluoride'],
    [{ I: 1, Cl: 1 }, 'ICl', 'Iodine Monochloride'],
    [{ I: 1, Br: 1 }, 'IBr', 'Iodine Monobromide'],
    [{ At: 1, F: 1 }, 'AtF', 'Astatine Monofluoride'],
    [{ At: 1, Cl: 1 }, 'AtCl', 'Astatine Monochloride'],
    [{ At: 1, Br: 1 }, 'AtBr', 'Astatine Monobromide'],
    [{ At: 1, I: 1 }, 'AtI', 'Astatine Monoiodide'],

    // Common oxyacids, bleach, carbonates, nitrates, ammonium salts
    [{ H: 2, C: 1, O: 3 }, 'H₂CO₃', 'Carbonic Acid'],
    [{ H: 1, Cl: 1, O: 1 }, 'HClO', 'Hypochlorous Acid'],
    [{ H: 1, Cl: 1, O: 2 }, 'HClO₂', 'Chlorous Acid'],
    [{ H: 1, Cl: 1, O: 3 }, 'HClO₃', 'Chloric Acid'],
    [{ H: 1, Cl: 1, O: 4 }, 'HClO₄', 'Perchloric Acid'],
    [{ Na: 1, Cl: 1, O: 1 }, 'NaClO', 'Sodium Hypochlorite (Bleach)'],
    [{ Na: 1, H: 1, C: 1, O: 3 }, 'NaHCO₃', 'Baking Soda'],
    [{ Na: 2, C: 1, O: 3 }, 'Na₂CO₃', 'Sodium Carbonate'],
    [{ Ca: 1, C: 1, O: 3 }, 'CaCO₃', 'Calcium Carbonate (Chalk)'],
    [{ Mg: 1, C: 1, O: 3 }, 'MgCO₃', 'Magnesium Carbonate'],
    [{ Na: 1, N: 1, O: 3 }, 'NaNO₃', 'Sodium Nitrate'],
    [{ K: 1, N: 1, O: 3 }, 'KNO₃', 'Potassium Nitrate'],
    [{ Na: 1, C: 1, N: 1 }, 'NaCN', 'Sodium Cyanide'],
    [{ K: 1, C: 1, N: 1 }, 'KCN', 'Potassium Cyanide'],
    [{ N: 1, H: 4, Cl: 1 }, 'NH₄Cl', 'Ammonium Chloride'],
    [{ N: 1, H: 4, F: 1 }, 'NH₄F', 'Ammonium Fluoride'],
    [{ N: 1, H: 4, Br: 1 }, 'NH₄Br', 'Ammonium Bromide'],
  ];

  for (const [counts, formula, name] of COVALENT_LIST) {
    register(counts, formula, name, 'covalent');
  }

  /**
   * Look up exact real compound by array of element symbols.
   */
  function lookupCompound(symbols) {
    if (!symbols || symbols.length < 2) return null;
    const counts = countSymbols(symbols);
    return COMPOUND_MAP.get(makeKey(counts)) || null;
  }

  // Virtual monovalent substitutes allowed by a Catalyst card
  const CATALYST_SUBSTITUTES = ['H', 'F', 'Cl', 'Br', 'I', 'Na', 'Li', 'K'];

  /**
   * Validate a selection of element cards, optionally with a Catalyst card.
   * Returns { valid, compound, catalyzed, substitutedSymbol, baseSP, spBreakdown }
   */
  function validateSynthesis(elementCards, useCatalyst) {
    if (!elementCards || elementCards.length < 2) {
      return { valid: false, reason: 'Select at least 2 bonding Element cards.' };
    }
    if (elementCards.some((c) => c.kind !== 'element')) {
      return { valid: false, reason: 'Only bonding Element cards can form a compound (Noble Gases shield existing compounds).' };
    }

    const symbols = elementCards.map((c) => c.symbol);
    const exact = lookupCompound(symbols);

    if (exact && !useCatalyst) {
      // Special Rule: H₂ Bond scores 1 SP (and can be unbonded on a later turn)
      const baseSP = exact.formula === 'H₂'
        ? 1
        : elementCards.reduce((sum, c) => sum + c.valence, 0);
      return {
        valid: true,
        compound: exact,
        catalyzed: false,
        substitutedSymbol: null,
        baseSP,
      };
    }

    if (useCatalyst) {
      if (exact) {
        return {
          valid: false,
          reason: `${exact.name} (${exact.formula}) is already a complete compound—save your Catalyst!`,
        };
      }
      for (const sub of CATALYST_SUBSTITUTES) {
        const candidate = lookupCompound([...symbols, sub]);
        if (candidate) {
          // Official Catalyst rule: Catalyst does NOT count towards point total
          const baseSP = elementCards.reduce((sum, c) => sum + c.valence, 0);
          return {
            valid: true,
            compound: candidate,
            catalyzed: true,
            substitutedSymbol: sub,
            baseSP,
          };
        }
      }
      return {
        valid: false,
        reason: 'Even with a Catalyst bypassing 1 monovalent atom, those elements do not form a real Unit 1 compound.',
      };
    }

    return {
      valid: false,
      reason: 'Those elements do not form a valid, stable chemical compound.',
    };
  }

  /**
   * Find all valid real compounds formable from a player's hand of element cards.
   * Searches subsets of size 2..5 (fast because hands are small, typically 5-12 elements).
   */
  function findPlayableCompounds(handCards, options) {
    const opts = options || {};
    const allowCatalyst = Boolean(opts.allowCatalyst);
    const elemCards = handCards.filter((c) => c.kind === 'element');
    const catalystCard = handCards.find((c) => c.effectId === 'CATALYST');
    const results = [];
    const seen = new Set();

    // Group identical symbols so we don't duplicate combinations with multiple H's or O's
    const bySym = {};
    for (const c of elemCards) {
      if (!bySym[c.symbol]) bySym[c.symbol] = [];
      bySym[c.symbol].push(c);
    }
    const uniqueSyms = Object.keys(bySym).sort();

    function dfs(idx, chosenCards) {
      if (chosenCards.length >= 2) {
        const res = validateSynthesis(chosenCards, false);
        if (res.valid) {
          const sig = `${res.compound.key}|0`;
          if (!seen.has(sig)) {
            seen.add(sig);
            results.push({ cards: [...chosenCards], useCatalyst: false, catalystCard: null, ...res });
          }
        } else if (allowCatalyst && catalystCard && chosenCards.length <= 4) {
          const catRes = validateSynthesis(chosenCards, true);
          if (catRes.valid) {
            const sig = `${catRes.compound.key}|1|${chosenCards.map((c) => c.symbol).sort().join(',')}`;
            if (!seen.has(sig)) {
              seen.add(sig);
              results.push({ cards: [...chosenCards], useCatalyst: true, catalystCard, ...catRes });
            }
          }
        }
      }
      if (chosenCards.length >= 5) return;

      for (let i = idx; i < uniqueSyms.length; i++) {
        const sym = uniqueSyms[i];
        const available = bySym[sym];
        const maxTake = Math.min(available.length, 5 - chosenCards.length);
        for (let take = 1; take <= maxTake; take++) {
          for (let t = 0; t < take; t++) chosenCards.push(available[t]);
          dfs(i + 1, chosenCards);
          for (let t = 0; t < take; t++) chosenCards.pop();
        }
      }
    }

    dfs(0, []);
    results.sort((a, b) => b.baseSP - a.baseSP || a.cards.length - b.cards.length);
    return results;
  }

  /**
   * Find all legal Electronegativity Displacement (EN Takeover) moves
   * using a specific attacking element card from hand against a target compound on ANY field.
   *
   * Rule:
   * - Attacking element A (from hand) must have strictly higher EN than at least one
   *   element R in targetCompound that is NOT stolen (R is being replaced).
   * - At least 1 element from targetCompound must be stolen to bond with A (plus optionally
   *   extra element cards from attacker's hand, though single-card hand attack is prioritized).
   * - All unused/unbonded elements from the broken targetCompound return to its owner's hand.
   * - Shield check:
   *   - He/Ne/Ar shield -> completely immune.
   *   - Kr/Xe/Rn shield -> immune UNLESS attacking card is Fluorine (F, Apex Oxidizer),
   *     which pierces and discards the heavy Noble Gas shield!
   */
  function findENTakeoversForCard(attackCard, attackerHand, targetCompound) {
    if (!attackCard || attackCard.kind !== 'element') return [];
    if (!targetCompound || targetCompound.inactive) return [];

    // Check Noble Gas shield
    let piercesHeavyShield = false;
    if (targetCompound.shield) {
      if (attackCard.symbol === 'F' && targetCompound.shield.heavyNobleGas) {
        piercesHeavyShield = true;
      } else {
        return [];
      }
    }

    const fieldCards = targetCompound.elements;
    const moves = [];
    const seen = new Set();

    // We test all non-empty proper subsets of fieldCards to steal (must leave at least 1 replaced card!)
    const n = fieldCards.length;
    const extraHand = attackerHand.filter((c) => c.kind === 'element' && c.id !== attackCard.id);

    for (let mask = 1; mask < (1 << n) - 1; mask++) {
      const stolen = [];
      const leftover = [];
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) stolen.push(fieldCards[i]);
        else leftover.push(fieldCards[i]);
      }

      // At least one leftover (replaced) element must have strictly lower EN than attackCard
      const replacedCandidates = leftover.filter((c) => attackCard.en > c.en);
      if (replacedCandidates.length === 0) continue;

      // Option 1: Just attackCard + stolen (pure field takeover, no extra hand cards needed)
      const pure = validateSynthesis([attackCard, ...stolen], false);
      if (pure.valid) {
        const sig = `pure|${pure.compound.key}|${stolen.map((c) => c.symbol).sort().join(',')}`;
        if (!seen.has(sig)) {
          seen.add(sig);
          moves.push({
            attackCard,
            extraHandCards: [],
            stolenCards: stolen,
            leftoverCards: leftover,
            replacedCard: replacedCandidates[0],
            targetCompoundId: targetCompound.id,
            piercesHeavyShield,
            ...pure,
          });
        }
      }

      // Option 2: attackCard + 1 extra hand card + stolen (e.g., 2 F + Ca from CaO -> CaF2)
      for (const extra of extraHand) {
        const combo = validateSynthesis([attackCard, extra, ...stolen], false);
        if (combo.valid) {
          const sig = `extra|${combo.compound.key}|${extra.symbol}|${stolen.map((c) => c.symbol).sort().join(',')}`;
          if (!seen.has(sig)) {
            seen.add(sig);
            moves.push({
              attackCard,
              extraHandCards: [extra],
              stolenCards: stolen,
              leftoverCards: leftover,
              replacedCard: replacedCandidates[0],
              targetCompoundId: targetCompound.id,
              piercesHeavyShield,
              ...combo,
            });
          }
        }
      }
    }

    moves.sort((a, b) => a.extraHandCards.length - b.extraHandCards.length || b.baseSP - a.baseSP);
    return moves;
  }

  // All bonding element symbols for checking 1-swap stabilizability of Unstable Compounds
  function getBondingSymbols() {
    if (V.ELEMENT_SPECS) {
      return V.ELEMENT_SPECS.filter((e) => e.kind === 'element').map((e) => e.symbol);
    }
    return ['H', 'Li', 'Na', 'K', 'Mg', 'Ca', 'Al', 'C', 'Si', 'N', 'P', 'O', 'S', 'F', 'Cl', 'Br', 'I'];
  }

  function formatUnstableFormula(elementCards) {
    const counts = countSymbols(elementCards.map((c) => c.symbol));
    const order = Object.keys(counts).sort();
    return formatFormula(order, counts);
  }

  /**
   * Check whether a set of 2..4 bonding Element cards can be played as an "Unstable Compound":
   * - Not already a valid real compound
   * - Replacing 1 of its atoms with some real bonding element produces a valid real compound
   *   (guarantees the compound can actually be stabilized by a 1-element swap on the next turn!).
   */
  function validateUnstableSynthesis(elementCards) {
    if (!elementCards || elementCards.length < 2 || elementCards.length > 4) {
      return { valid: false, reason: 'Unstable compounds require 2 to 4 bonding Element cards.' };
    }
    if (elementCards.some((c) => c.kind !== 'element')) {
      return { valid: false, reason: 'Only bonding Element cards can form an Unstable Compound.' };
    }
    const symbols = elementCards.map((c) => c.symbol);
    if (lookupCompound(symbols)) {
      return { valid: false, reason: 'These elements already form a stable real compound!' };
    }

    const allSyms = getBondingSymbols();
    const exampleTargets = [];
    for (let i = 0; i < symbols.length; i++) {
      for (const candidateSym of allSyms) {
        if (candidateSym === symbols[i]) continue;
        const testSyms = [...symbols];
        testSyms[i] = candidateSym;
        const match = lookupCompound(testSyms);
        if (match) {
          exampleTargets.push({ replaceIndex: i, replaceSymbol: symbols[i], withSymbol: candidateSym, compound: match });
          if (exampleTargets.length >= 3) break;
        }
      }
      if (exampleTargets.length >= 3) break;
    }

    if (exampleTargets.length === 0) {
      return { valid: false, reason: 'Too unstable — cannot be stabilized with a single element swap next turn.' };
    }

    return {
      valid: true,
      formula: formatUnstableFormula(elementCards),
      exampleTargets,
    };
  }

  /**
   * Find all legal 1-element swaps between a player's hand and an Unstable Compound on their field
   * that turn the Unstable Compound into a valid REAL stable compound!
   */
  function findUnstableStabilizeSwaps(unstableCompound, handCards) {
    if (!unstableCompound || !unstableCompound.unstable || unstableCompound.inactive) return [];
    const handElems = handCards.filter((c) => c.kind === 'element');
    const fieldElems = unstableCompound.elements;
    const swaps = [];
    const seen = new Set();

    for (let i = 0; i < fieldElems.length; i++) {
      const removedEl = fieldElems[i];
      for (const handEl of handElems) {
        if (handEl.symbol === removedEl.symbol) continue;
        const nextElems = fieldElems.map((el, idx) => (idx === i ? handEl : el));
        const check = validateSynthesis(nextElems, false);
        if (check.valid) {
          const sig = `${removedEl.symbol}->${handEl.symbol}|${check.compound.key}`;
          if (!seen.has(sig)) {
            seen.add(sig);
            swaps.push({
              compoundId: unstableCompound.id,
              removeCard: removedEl,
              addCard: handEl,
              newElements: nextElems,
              ...check,
            });
          }
        }
      }
    }

    swaps.sort((a, b) => b.baseSP - a.baseSP);
    return swaps;
  }

  V.COMPOUND_MAP = COMPOUND_MAP;
  V.lookupCompound = lookupCompound;
  V.validateSynthesis = validateSynthesis;
  V.validateUnstableSynthesis = validateUnstableSynthesis;
  V.findUnstableStabilizeSwaps = findUnstableStabilizeSwaps;
  V.findPlayableCompounds = findPlayableCompounds;
  V.findENTakeoversForCard = findENTakeoversForCard;
  V.toSubscript = toSubscript;
})(typeof window !== 'undefined' ? window : globalThis);

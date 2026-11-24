// VALENCY — Complete 120-Card Unit 1 Deck Definition
// 70 Element Cards (64 bonding elements + 6 Noble Gases)
// 28 Yellow Instance (Catalyst) Event Cards
// 22 Red Inhibitor Event Cards
// Includes official snarky scroll quotes, DONATES/SHARES/NEEDS electron labels,
// 8-dot octet bars, and official Special Abilities.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const GROUP_META = {
    '1A': { label: '1A', valence: 1, color: '#06b6d4', badgeBg: '#00e5ff', badgeText: '#042f2e', bondAction: 'DONATES', bondCount: '1e⁻¹' },
    'H':  { label: '1A', valence: 1, color: '#64748b', badgeBg: '#ffffff', badgeText: '#0f172a', bondAction: 'DONATES or SHARES', bondCount: '1e⁻¹' },
    '2A': { label: '2A', valence: 2, color: '#f97316', badgeBg: '#ff9800', badgeText: '#431407', bondAction: 'DONATES', bondCount: '2e⁻¹' },
    '3A': { label: '3A', valence: 3, color: '#0d9488', badgeBg: '#0097a7', badgeText: '#f0fdfa', bondAction: 'DONATES', bondCount: '3e⁻¹' },
    '4A': { label: '4A', valence: 4, color: '#52525b', badgeBg: '#52525b', badgeText: '#f8fafc', bondAction: 'SHARES', bondCount: '4e⁻¹' },
    '5A': { label: '5A', valence: 5, color: '#d946ef', badgeBg: '#ef00ff', badgeText: '#ffffff', bondAction: 'SHARES / NEEDS', bondCount: '3e⁻¹' },
    '6A': { label: '6A', valence: 6, color: '#1d4ed8', badgeBg: '#0015ff', badgeText: '#ffffff', bondAction: 'SHARES / NEEDS', bondCount: '2e⁻¹' },
    '7A': { label: '7A', valence: 7, color: '#9333ea', badgeBg: '#9900ff', badgeText: '#ffffff', bondAction: 'SHARES / NEEDS', bondCount: '1e⁻¹' },
    '8A': { label: '8A', valence: 8, color: '#22c55e', badgeBg: '#00ff19', badgeText: '#052e16', bondAction: 'INERT', bondCount: '0e⁻¹' },
  };

  const ELEMENT_SPECS = [
    // ===== NOBLE GASES (6 cards) =====
    {
      symbol: 'He', name: 'Helium', atomicNumber: 2, group: '8A', valence: 2, en: 0,
      config: '1s²', kind: 'noble_gas', heavyNobleGas: false, copies: 1,
      quote: 'The cosmos inflated an entire universe, filled it with gas that refuses to react with a single other element, and used it to make human voices sound ridiculous. A towering triumph of universal design.',
      abilityName: 'INERT SHELL',
      abilityText: 'Protects one compound from EN takeover and hostile Event cards (Fluorine-proof).',
    },
    {
      symbol: 'Ne', name: 'Neon', atomicNumber: 10, group: '8A', valence: 8, en: 0,
      config: '[He] 2s²2p⁶', kind: 'noble_gas', heavyNobleGas: false, copies: 1,
      quote: 'Electrify it, and it glows red. Put it in a sign outside a 24-hour diner. That is its entire legacy.',
      abilityName: 'INERT SHELL',
      abilityText: 'Protects one compound from EN takeover and hostile Event cards (Fluorine-proof).',
    },
    {
      symbol: 'Ar', name: 'Argon', atomicNumber: 18, group: '8A', valence: 8, en: 0,
      config: '[Ne] 3s²3p⁶', kind: 'noble_gas', heavyNobleGas: false, copies: 1,
      quote: 'Named after the Greek word for "lazy." It does nothing, reacts with nothing, and asks for nothing. Honestly, it might be the only sensible element on this list.',
      abilityName: 'INERT SHELL',
      abilityText: 'Protects one compound from EN takeover and hostile Event cards (Fluorine-proof).',
    },
    {
      symbol: 'Kr', name: 'Krypton', atomicNumber: 36, group: '8A', valence: 8, en: 0,
      config: '[Ar] 3d¹⁰4s²4p⁶', kind: 'noble_gas', heavyNobleGas: true, copies: 1,
      quote: 'Despite its legendary name, it does not give alien orphans super strength; it merely makes fluorescent lights look a bit whiter.',
      abilityName: 'HEAVY INERT SHELL',
      abilityText: 'Protects one compound from EN takeover and hostile Events (pierced only by Fluorine or Ionization Surge).',
    },
    {
      symbol: 'Xe', name: 'Xenon', atomicNumber: 54, group: '8A', valence: 8, en: 0,
      config: '[Kr] 4d¹⁰5s²5p⁶', kind: 'noble_gas', heavyNobleGas: true, copies: 1,
      quote: 'A noble gas so heavy and dense that it can be used as a general anesthetic or to propel ion engines into deep space. Naturally, car owners use it to blind oncoming traffic.',
      abilityName: 'HEAVY INERT SHELL',
      abilityText: 'Protects one compound from EN takeover and hostile Events (pierced only by Fluorine or Ionization Surge).',
    },
    {
      symbol: 'Rn', name: 'Radon', atomicNumber: 86, group: '8A', valence: 8, en: 0,
      config: '[Xe] 4f¹⁴5d¹⁰6s²6p⁶', kind: 'noble_gas', heavyNobleGas: true, copies: 1,
      quote: 'An odorless, colorless noble gas that seeps out of the bedrock into your basement to give you lung cancer while you play ping-pong.',
      abilityName: 'HEAVY INERT SHELL',
      abilityText: 'Protects one compound from EN takeover and hostile Events (pierced only by Fluorine or Ionization Surge).',
    },

    // ===== GROUP 1A (14 cards) =====
    {
      symbol: 'H', name: 'Hydrogen', atomicNumber: 1, group: '1A', colorGroup: 'H', valence: 1, en: 2.1,
      config: '1s¹', kind: 'element', metalType: 'nonmetal', copies: 8,
      quote: 'Ah, Hydrogen. One proton, one electron. The absolute bare minimum effort required to legally qualify as matter. And yet, left unattended in large enough piles, it eventually insists on thinking about itself.',
      specialId: 'H2_BOND',
      abilityName: 'Special Rule: H₂ Bond',
      abilityText: 'Play 2 Hydrogen cards as H₂ (+1 SP). You may unbond H₂ on a later turn to return both H cards to your hand and craft bigger compounds.',
    },
    {
      symbol: 'Li', name: 'Lithium', atomicNumber: 3, group: '1A', valence: 1, en: 1.0,
      config: '[He] 2s¹', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'An element so desperate to be useful that it constantly catches fire in water, just so you won\'t forget it powers your precious glowing rectangle.',
    },
    {
      symbol: 'Na', name: 'Sodium', atomicNumber: 11, group: '1A', valence: 1, en: 0.9,
      config: '[Ne] 3s¹', kind: 'element', metalType: 'metal', copies: 1,
      specialId: 'SALT_CURE',
      abilityName: 'SALT CURE',
      abilityText: 'When synthesized into Sodium Chloride (NaCl) immediately gain +1 Stability Point and draw 1 card.',
    },
    {
      symbol: 'K', name: 'Potassium', atomicNumber: 19, group: '1A', valence: 1, en: 0.8,
      config: '[Ar] 4s¹', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'Highly explosive in water, yet vital to keeping your heart beating. You are precisely one banana away from maintaining structural integrity.',
    },
    {
      symbol: 'Rb', name: 'Rubidium', atomicNumber: 37, group: '1A', valence: 1, en: 0.8,
      config: '[Kr] 5s¹', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'So unstable it ignites spontaneously in air. It has no major industrial purpose, existing almost entirely to keep laboratory safety directors awake at night.',
    },
    {
      symbol: 'Cs', name: 'Cesium', atomicNumber: 55, group: '1A', valence: 1, en: 0.7,
      config: '[Xe] 6s¹', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'Melts at body temperature and explodes violently in cold water. The most accurate atomic clocks in the world are built around it, measuring the precise nanosecond you lose your patience.',
    },
    {
      symbol: 'Fr', name: 'Francium', atomicNumber: 87, group: '1A', valence: 1, en: 0.7,
      config: '[Rn] 7s¹', kind: 'element', metalType: 'metal', copies: 1,
      specialId: 'RAPID_DECAY',
      abilityName: 'RAPID DECAY',
      abilityText: 'When played ALL players must discard 2 cards this moment, and 1 card at the start of their turn the next round.',
    },

    // ===== GROUP 2A (6 cards) =====
    {
      symbol: 'Be', name: 'Beryllium', atomicNumber: 4, group: '2A', valence: 2, en: 1.6,
      config: '[He] 2s²', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'Rare, stiff, highly toxic, and wildly expensive. The structural equivalent of a high-end designer watch that poisons you if you look at it too closely.',
    },
    {
      symbol: 'Mg', name: 'Magnesium', atomicNumber: 12, group: '2A', valence: 2, en: 1.2,
      config: '[Ne] 3s²', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'Burns with a light bright enough to blind you, yet spends most of its day quietly holding chlorophyll together so trees can exist. A dramatic actor stuck in a desk job.',
    },
    {
      symbol: 'Ca', name: 'Calcium', atomicNumber: 20, group: '2A', valence: 2, en: 1.0,
      config: '[Ar] 4s²', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'It gives you bones to keep you upright and teeth to break your food. A grand framework, though it does seem overly eager to calcify your joints the moment you turn forty.',
    },
    {
      symbol: 'Sr', name: 'Strontium', atomicNumber: 38, group: '2A', valence: 2, en: 1.0,
      config: '[Kr] 5s²', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'Gives fireworks their brilliant red color and settles into human bones to cause cancer when radioactive. A flare for the dramatic, to say the least.',
    },
    {
      symbol: 'Ba', name: 'Barium', atomicNumber: 56, group: '2A', valence: 2, en: 0.9,
      config: '[Xe] 6s²', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'High density, absorbs X-rays, and is famously fed to patients in chalky milkshakes so doctors can take pictures of their digestive tracts. Bon appétit.',
    },
    {
      symbol: 'Ra', name: 'Radium', atomicNumber: 88, group: '2A', valence: 2, en: 0.9,
      config: '[Rn] 7s²', kind: 'element', metalType: 'metal', copies: 1,
      specialId: 'LUMINESCENT_DECAY',
      abilityName: 'LUMINESCENT DECAY',
      abilityText: 'When Radium synthesizes a molecule, all your molecules gain LUMINESCENCE for 2 turns: anyone targeting them must discard 1 card due to radiation sickness.',
    },

    // ===== GROUP 3A (5 cards) =====
    {
      symbol: 'B', name: 'Boron', atomicNumber: 5, group: '3A', valence: 3, en: 2.0,
      config: '[He] 2s²2p¹', kind: 'element', metalType: 'metalloid', copies: 1,
      quote: 'Neither a proper metal nor a proper non-metal. It sits indecisively on the staircase of chemistry, holding together fiberglass insulation and refusing to commit to a personality.',
    },
    {
      symbol: 'Al', name: 'Aluminum', atomicNumber: 13, group: '3A', valence: 3, en: 1.5,
      config: '[Ne] 3s²3p¹', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'Once prized more highly than gold by emperors; now used primarily to wrap cold leftover lasagna. How the mighty have fallen.',
    },
    {
      symbol: 'Ga', name: 'Gallium', atomicNumber: 31, group: '3A', valence: 3, en: 1.6,
      config: '[Ar] 3d¹⁰4s²4p¹', kind: 'element', metalType: 'metal', copies: 1,
      specialId: 'LIQUID_EMBRITTLEMENT',
      abilityName: 'LIQUID EMBRITTLEMENT',
      abilityText: 'When played, target an opponent\'s unshielded molecule containing Aluminum. Destroy all attached elements to the discard pile and return Aluminum to their hand.',
    },
    {
      symbol: 'In', name: 'Indium', atomicNumber: 49, group: '3A', valence: 3, en: 1.7,
      config: '[Kr] 4d¹⁰5s²5p¹', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'Squishy, squeaks when you bend it, and makes up the touchscreens you spend four hours a day smudging with thumb grease.',
    },
    {
      symbol: 'Tl', name: 'Thallium', atomicNumber: 81, group: '3A', valence: 3, en: 1.8,
      config: '[Xe] 4f¹⁴5d¹⁰6s²6p¹', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'The poisoner\'s poison. Odorless, tasteless, slow, and causes your hair to fall out. Highly popular in 19th-century murder mysteries.',
    },

    // ===== GROUP 4A (8 cards) =====
    {
      symbol: 'C', name: 'Carbon', atomicNumber: 6, group: '4A', valence: 4, en: 2.5,
      config: '[He] 2s²2p²', kind: 'element', metalType: 'nonmetal', copies: 4,
      specialId: 'HYDROCARBON_SYNERGY',
      abilityName: 'Hydrocarbon Synergy',
      abilityText: 'When you synthesize Methane (CH₄) with four Hydrogens: Fuel Burst grants +2 Bonus SP, and Energy Draw lets you immediately draw 1 extra card.',
    },
    {
      symbol: 'Si', name: 'Silicon', atomicNumber: 14, group: '4A', valence: 4, en: 1.8,
      config: '[Ne] 3s²3p²', kind: 'element', metalType: 'metalloid', copies: 1,
      quote: 'Sand that was taught how to think after being hit with electricity. And what did humanity do with this miracle? They made video games about button-pushing.',
    },
    {
      symbol: 'Ge', name: 'Germanium', atomicNumber: 32, group: '4A', valence: 4, en: 1.8,
      config: '[Ar] 3d¹⁰4s²4p²', kind: 'element', metalType: 'metalloid', copies: 1,
      quote: 'The bridge between vacuum tubes and modern computing, immediately cast aside the second Silicon learned how to scale up production. Unfortunate.',
    },
    {
      symbol: 'Sn', name: 'Tin', atomicNumber: 50, group: '4A', valence: 4, en: 1.8,
      config: '[Kr] 4d¹⁰5s²5p²', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'Tin has spent centuries being mixed into bronze and wrapped around canned beans. It is the metal world\'s ultimate supporting actor, completely incapable of holding the spotlight on its own without bending under pressure.',
    },
    {
      symbol: 'Pb', name: 'Lead', atomicNumber: 82, group: '4A', valence: 4, en: 1.9,
      config: '[Xe] 4f¹⁴5d¹⁰6s²6p²', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'Lead used to be everywhere—paint, pipes, gasoline, wine cups. It took humanity an embarrassingly long time to realize that the sweet-tasting metal was actively making everyone remarkably worse at thinking.',
      specialId: 'RADIATION_SHIELDING',
    },

    // ===== GROUP 5A (8 cards) =====
    {
      symbol: 'N', name: 'Nitrogen', atomicNumber: 7, group: '5A', valence: 5, en: 3.0,
      config: '[He] 2s²2p³', kind: 'element', metalType: 'nonmetal', copies: 3,
      quote: 'Nitrogen makes up nearly eighty percent of the air you are breathing right now, doing absolutely nothing except diluting the Oxygen so you don\'t spontaneously combust. A noble effort of passive existence.',
    },
    {
      symbol: 'P', name: 'Phosphorus', atomicNumber: 15, group: '5A', valence: 5, en: 2.1,
      config: '[Ne] 3s²3p³', kind: 'element', metalType: 'nonmetal', copies: 2,
      quote: 'Phosphorus comes in two main flavors: "spontaneously bursts into flames in air" and "literally glows in the dark inside urine." A truly refined choice of properties.',
    },
    {
      symbol: 'As', name: 'Arsenic', atomicNumber: 33, group: '5A', valence: 5, en: 2.0,
      config: '[Ar] 3d¹⁰4s²4p³', kind: 'element', metalType: 'metalloid', copies: 1,
      quote: 'Ah, Arsenic. The classic Victorian solution to bad inheritances, unwanted spouses, and wallpaper color schemes. It was elegant, subtle, and wildly toxic—much like the high-society dinner parties where it was served.',
    },
    {
      symbol: 'Sb', name: 'Antimony', atomicNumber: 51, group: '5A', valence: 5, en: 1.9,
      config: '[Kr] 4d¹⁰5s²5p³', kind: 'element', metalType: 'metalloid', copies: 1,
      quote: 'Antimony is used in flame retardants and batteries. If you ask ten people on the street what Antimony does, ten people will stare at you blankly, which is precisely how Antimony prefers it.',
    },
    {
      symbol: 'Bi', name: 'Bismuth', atomicNumber: 83, group: '5A', valence: 5, en: 1.9,
      config: '[Xe] 4f¹⁴5d¹⁰6s²6p³', kind: 'element', metalType: 'metal', copies: 1,
      quote: 'Bismuth grows into shimmering, rainbow-colored geometric crystals that look like alien megastructures, only to be crushed up and swallowed by humans who ate too many hot wings.',
    },

    // ===== GROUP 6A (11 cards) =====
    {
      symbol: 'O', name: 'Oxygen', atomicNumber: 8, group: '6A', valence: 6, en: 3.5,
      config: '[He] 2s²2p⁴', kind: 'element', metalType: 'nonmetal', copies: 6,
      specialId: 'RAPID_OXIDATION',
      abilityName: 'RAPID OXIDATION',
      abilityText: 'When played to synthesize a molecule, strip 1 Group 1A or 2A Metal from an opponent\'s unshielded compound into the discard pile due to severe oxidation/rusting.',
    },
    {
      symbol: 'S', name: 'Sulfur', atomicNumber: 16, group: '6A', valence: 6, en: 2.5,
      config: '[Ne] 3s²3p⁴', kind: 'element', metalType: 'nonmetal', copies: 2,
      quote: 'Sulfur smells like rotten eggs, resides near hellish volcanic vents, and turns into acid rain. It isn\'t trying to hide its villain origin story; humanity simply chooses to ignore the red flags.',
    },
    {
      symbol: 'Se', name: 'Selenium', atomicNumber: 34, group: '6A', valence: 6, en: 2.4,
      config: '[Ar] 3d¹⁰4s²4p⁴', kind: 'element', metalType: 'nonmetal', copies: 1,
      quote: 'Selenium is vital for human health in tiny amounts, but slightly too much will cause your hair to fall out and your breath to smell like garlic. Talk about a narrow margin for error.',
    },
    {
      symbol: 'Te', name: 'Tellurium', atomicNumber: 52, group: '6A', valence: 6, en: 2.1,
      config: '[Kr] 4d¹⁰5s²5p⁴', kind: 'element', metalType: 'metalloid', copies: 1,
      quote: 'Tellurium is one of the rarest elements on Earth\'s crust, mostly because the Earth took one sniff of its decay products—which cause a stench that lasts for weeks—and decided enough was enough.',
    },
    {
      symbol: 'Po', name: 'Polonium', atomicNumber: 84, group: '6A', valence: 6, en: 2.0,
      config: '[Xe] 4f¹⁴5d¹⁰6s²6p⁴', kind: 'element', metalType: 'metalloid', copies: 1,
      quote: 'Discovered by Marie Curie and named after her homeland, Polonium is so aggressively radioactive that it literally glows blue in the dark and heat-serves itself to death. Naturally, humans immediately recognized its true potential: assassin tea drops.',
    },

    // ===== GROUP 7A (12 cards) =====
    {
      symbol: 'F', name: 'Fluorine', atomicNumber: 9, group: '7A', valence: 7, en: 4.0,
      config: '[He] 2s²2p⁵', kind: 'element', metalType: 'nonmetal', copies: 4,
      quote: 'Fluorine is the absolute menace of the periodic table. It reacts violently with almost everything, rips electrons away from innocent atoms, and yet we put it in toothpaste to keep your teeth from falling out.',
      specialId: 'APEX_OXIDIZER',
    },
    {
      symbol: 'Cl', name: 'Chlorine', atomicNumber: 17, group: '7A', valence: 7, en: 3.0,
      config: '[Ne] 3s²3p⁵', kind: 'element', metalType: 'nonmetal', copies: 4,
      specialId: 'CHLORAMINE_HAZARD',
      abilityName: 'Chloramine Hazard',
      abilityText: 'If Chloramine Gas (NH₂Cl) is created with this element, target opponent discards 1 random card and suffers a -50% SP penalty on their next synthesis.',
    },
    {
      symbol: 'Br', name: 'Bromine', atomicNumber: 35, group: '7A', valence: 7, en: 2.8,
      config: '[Ar] 3d¹⁰4s²4p⁵', kind: 'element', metalType: 'nonmetal', copies: 2,
      quote: 'Bromine is one of only two liquid elements on the table, and it spends its existence sloshing around as a dark red, suffocating fumes-emitting mess. It looks, acts, and smells like a bad decision.',
    },
    {
      symbol: 'I', name: 'Iodine', atomicNumber: 53, group: '7A', valence: 7, en: 2.5,
      config: '[Kr] 4d¹⁰5s²5p⁵', kind: 'element', metalType: 'nonmetal', copies: 1,
      quote: 'Iodine is purple, shiny, stains everything it touches, and keeps your thyroid from exploding. It is dramatic, essential, and entirely unconcerned with making a clean exit from a lab coat.',
    },
    {
      symbol: 'At', name: 'Astatine', atomicNumber: 85, group: '7A', valence: 7, en: 2.1,
      config: '[Xe] 4f¹⁴5d¹⁰6s²6p⁵', kind: 'element', metalType: 'nonmetal', copies: 1,
      quote: 'Astatine is so profoundly unstable that at any given moment, there is less than a single gram of it in the entire Earth\'s crust. It vanishes faster than an employee leaving at 4:59 PM on a Friday, making it essentially the "ghost employee" of the periodic table—technically on the payroll, but never actually seen by anyone.',
    },
  ];

  const INSTANCE_SPECS = [
    {
      effectId: 'CHAIN_REACTION',
      name: 'Chain Reaction',
      kind: 'instance',
      timing: 'synthesis',
      phaseRibbon: 'SYNTHESIS',
      copies: 3,
      description: 'Play this card during compound synthesis. Draw a card for every element in your compound.',
      quote: 'It starts with one little bond, then another, and suddenly—boom—I\'m drawing half the deck while you sit there wondering where it all went wrong.',
    },
    {
      effectId: 'CATALYST',
      name: 'Catalyst',
      kind: 'instance',
      timing: 'synthesis',
      phaseRibbon: 'SYNTHESIS',
      copies: 4,
      description: 'Play alongside any new compound build from your hand to bypass 1 missing valence electron requirement (Lowers Activation Energy). Does not count towards point total.',
      quote: 'Oh, look at that—you were one electron short, so I stepped in, lowered the activation energy, and solved your problem for free. Don\'t worry, I won\'t take any credit for the points; I\'m just here to make you look competent.',
    },
    {
      effectId: 'DIFFUSION',
      name: 'Diffusion',
      kind: 'instance',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 3,
      description: 'Choose another player. You and that player swap your entire hands with each other (Entropy Event).',
      quote: 'You see, nature abhors a high concentration of good cards in just one hand. So I\'m going to take yours, give you mine, and call it "thermodynamic equilibrium." You\'re welcome.',
    },
    {
      effectId: 'DISTILLATION',
      name: 'Distillation',
      kind: 'instance',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 3,
      description: 'Search the Discard Pile and add any 1 Element Card back into your hand (Reclamation).',
      quote: 'One chemist\'s toxic discard pile is another chemist\'s carefully purified feedstock. Boil it, condense it, and pretend it was yours all along.',
    },
    {
      effectId: 'EXOTHERMIC_SURGE',
      name: 'Exothermic Surge',
      kind: 'instance',
      timing: 'synthesis',
      phaseRibbon: 'SYNTHESIS',
      copies: 3,
      description: 'Play during Synthesis. Attach to your new compound for +3 bonus SP while it remains on the field.',
      quote: 'Is the glassware supposed to be glowing orange and making that ominous humming noise? Probably fine. Enjoy the extra Stability Points.',
    },
    {
      effectId: 'THERMAL_ACTIVATION',
      name: 'Thermal Activation',
      kind: 'instance',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 3,
      description: 'Draw 3 cards from the deck, then discard 1 card from your hand (Accelerate Synthesis).',
      quote: 'When in doubt, crank the Bunsen burner to maximum and see what happens. Ninety percent of chemistry is just applying heat until something interesting occurs.',
    },
    {
      effectId: 'RESONANCE_STABILIZER',
      name: 'Resonance Stabilizer',
      kind: 'instance',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 2,
      description: 'Attach to one of your unshielded compounds. Cancels the next hostile Red Event Card targeting it (discard this instead).',
      quote: 'Can\'t break a bond if the electrons refuse to tell you which atom they\'re currently sitting on. Quantum plausible deniability at its finest.',
    },
    {
      effectId: 'BUFFER_SOLUTION',
      name: 'Buffer Solution',
      kind: 'instance',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 3,
      description: 'Protect your entire field from hostile Red Event Cards until the start of your next turn (pH Equilibrium).',
      quote: 'Acid rain? Electrolysis? Hostile drama? My pH didn\'t even budge a tenth of a decimal place. Try harder next turn.',
    },
    {
      effectId: 'EQUILIBRIUM_SHIFT',
      name: 'Equilibrium Shift',
      kind: 'instance',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 2,
      description: 'Return 1 of your compounds (active or inactive) back to your hand and immediately draw 3 cards.',
      quote: 'Le Chatelier said systems resist stress. I say I\'m taking my atoms back, drawing three fresh cards, and calling it "reversible thermodynamics."',
    },
    {
      effectId: 'SYNTHESIS_ACCELERATOR',
      name: 'Synthesis Accelerator',
      kind: 'instance',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 2,
      description: 'Re-open Phase 2: Synthesis to build a bonus 2nd chemical compound this turn!',
      quote: 'Who decided you only get one reaction per turn? Clearly someone who never double-dosed a fume hood five minutes before the lab bell rang.',
    },
  ];

  const EVENT_SPECS = [
    {
      effectId: 'ACID_RAIN',
      name: 'Acid Rain',
      kind: 'event',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 3,
      description: 'Target 1 opponent\'s unshielded compound. Discard all of its element cards directly into the discard pile (Decomposition Event).',
      quote: 'Look at that. A meticulously constructed compound, ruined by a slight change in pH. Did you really think your precious little chemical bond was waterproof? How charmingly naive.',
    },
    {
      effectId: 'REACTION_DELAY',
      name: 'Reaction Delay',
      kind: 'event',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 2,
      description: 'Target a player. That player\'s turn is skipped on their next rotation.',
      quote: 'Running a little endothermic today? Take a quiet seat near absolute zero while the rest of us keep reacting without you.',
    },
    {
      effectId: 'BOND_CLEAVAGE',
      name: 'Bond Cleavage',
      kind: 'event',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 3,
      description: 'Target 1 opponent\'s unshielded compound. Force them to remove 1 element to discard; the compound remains inactive (0 SP) on the field.',
      quote: 'I\'m just going to snip one tiny little atom right out of the middle here. Oh, look at that—now it\'s not a compound anymore, just an embarrassing, non-functional pile of scrap sitting on your field.',
    },
    {
      effectId: 'PRECIPITATION',
      name: 'Precipitation',
      kind: 'event',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 3,
      description: 'Target 1 opponent\'s unshielded compound. Force them to disassemble it and return all of its element cards to their hand.',
      quote: 'Down it comes! All that hard work you put into bonding those elements, instantly undone and forced right back into your hand. Go on, pick them up. We have all day.',
    },
    {
      effectId: 'IONIZATION_SURGE',
      name: 'Ionization Surge',
      kind: 'event',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 3,
      description: 'Target an opponent\'s protecting Noble Gas card. Force that Noble Gas into the discard pile.',
      quote: 'Ah, a Noble Gas shield! Completely unreactive, totally impenetrable, utterly... oh, wait, no, I just stripped its electrons off. Look at it go! So much for "noble."',
    },
    {
      effectId: 'ELECTROLYSIS',
      name: 'Electrolysis',
      kind: 'event',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 3,
      description: 'Target 1 opponent\'s unshielded compound. Steal its highest-EN Element into your hand and discard the remaining atoms!',
      quote: 'Nothing says "polite laboratory collaboration" like jamming two live electrodes into your opponent\'s molecule and walking off with their best atom.',
    },
    {
      effectId: 'OXIDATION',
      name: 'Oxidation',
      kind: 'event',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 3,
      description: 'Strip valence electrons from an opponent\'s hand: force them to discard up to 2 Element cards immediately.',
      quote: 'OIL RIG: Oxidation Is Losing—specifically, you losing the two best elements sitting in your hand right now.',
    },
    {
      effectId: 'HALF_LIFE_DECAY',
      name: 'Half-Life Decay',
      kind: 'event',
      timing: 'phase3',
      phaseRibbon: 'PHASE 3',
      copies: 2,
      description: 'Target 1 opponent\'s unshielded compound. Permanently halve its Stability Points (rounded down) while on the field.',
      quote: 'Congratulations! Your prized molecule just experienced its first half-life. Don\'t look so upset—you still get to keep the disappointing half.',
    },
  ];

  const ELEMENT_BY_SYMBOL = {};
  for (const el of ELEMENT_SPECS) {
    ELEMENT_BY_SYMBOL[el.symbol] = el;
  }

  function buildFullDeck() {
    const deck = [];
    let seq = 1;
    for (const spec of ELEMENT_SPECS) {
      for (let i = 0; i < spec.copies; i++) {
        deck.push({ id: `c${seq++}_${spec.symbol}`, ...spec });
      }
    }
    for (const spec of INSTANCE_SPECS) {
      for (let i = 0; i < spec.copies; i++) {
        deck.push({ id: `c${seq++}_${spec.effectId}`, ...spec });
      }
    }
    for (const spec of EVENT_SPECS) {
      for (let i = 0; i < spec.copies; i++) {
        deck.push({ id: `c${seq++}_${spec.effectId}`, ...spec });
      }
    }
    return deck;
  }

  V.GROUP_META = GROUP_META;
  V.ELEMENT_SPECS = ELEMENT_SPECS;
  V.INSTANCE_SPECS = INSTANCE_SPECS;
  V.EVENT_SPECS = EVENT_SPECS;
  V.ELEMENT_BY_SYMBOL = ELEMENT_BY_SYMBOL;
  V.buildFullDeck = buildFullDeck;
})(typeof window !== 'undefined' ? window : globalThis);

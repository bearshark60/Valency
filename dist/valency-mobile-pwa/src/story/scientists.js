// VALENCY — Historical Scientist Master Profiles
// Pure historical identity, biography, discoveries, dialogue, and references.
// Strictly separated from opponent AI configurations (opponentConfigs.js)
// and future collectible Scientist Cards (scientistCardSchema.js).

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const SIMULATION_DISCLAIMER =
    'Inspired historical research simulation for educational gameplay—not a claim about the actual personality or competitive behavior of the historical individual.';

  const SCIENTIST_PROFILES = {
    lavoisier: {
      scientistId: 'lavoisier',
      historicalName: 'Antoine Lavoisier',
      displayName: 'Simulation: Antoine Lavoisier',
      lifespan: '1743–1794',
      portraitRef: 'lavoisier',
      artworkRef: 'assets/portraits/lavoisier.svg',
      accentColor: '#38bdf8',
      specialty: 'Conservation of mass and chemical transformations',
      elementalAffinities: ['O', 'H', 'C', 'S'],
      biography:
        'French chemist widely regarded as the architect of modern chemistry. Working alongside Marie-Anne Paulze Lavoisier, he replaced phlogiston theory with quantitative experimentation, proving that mass is conserved across every chemical reaction.',
      historicalDiscoveries: [
        'Formulated the Law of Conservation of Mass in chemical reactions (1789).',
        'Identified and named Oxygen (1778) and Hydrogen (1783), demonstrating water is a compound rather than an element.',
        'Co-authored Méthode de nomenclature chimique (1787), establishing systematic chemical naming.',
        'Published Traité Élémentaire de Chimie (1789), presenting the first modern list of chemical elements.',
      ],
      simulationPersonality: {
        archetype: 'Methodical Conservationist',
        summary: 'Calm, quantitative, and disciplined. Values clean, waste-free chemical transformations and dislikes sloppy or unstable stoichiometry.',
        disclaimer: SIMULATION_DISCLAIMER,
      },
      dialogue: {
        intro: [
          'Welcome to the Academy Calibration Chamber. I am the Lavoisier Research Simulation.',
          'Nothing is lost, nothing is created—everything is transformed. Before the Academy grants you licensure, show me that you respect exact chemical accounting.',
        ],
        briefing:
          'Maintain clean stoichiometry. Every atom on your bench must serve a stable transformation—avoid wasteful collapses and conserve your reagents.',
        onVictory:
          'Impeccable balance. Every valence electron accounted for, zero wasted mass. Your Conservation Record has been logged in the Academy Archive.',
        onDefeat:
          'Your ledger failed to balance this round. Recalibrate your reagents and observe how clean, steady synthesis outpaces reckless plays.',
        challengeComplete:
          'Outstanding experimental discipline! You have fulfilled the Conservation Research Challenge and earned Stage Two Archive eligibility.',
      },
      opponentConfigRef: 'opp_lavoisier',
      researchChallengeRef: 'rc_lavoisier',
      futureCardRef: 'scard_lavoisier',
      musicThemeRef: 'scientist_lavoisier',
      audioDropInFilename: 'lavoisier-theme.wav',
    },

    mendeleev: {
      scientistId: 'mendeleev',
      historicalName: 'Dmitri Mendeleev',
      displayName: 'Simulation: Dmitri Mendeleev',
      lifespan: '1834–1907',
      portraitRef: 'mendeleev',
      artworkRef: 'assets/portraits/mendeleev.svg',
      accentColor: '#a855f7',
      specialty: 'Periodic organization and elemental relationships',
      elementalAffinities: ['Ga', 'Ge', 'Si', 'Al', 'B'],
      biography:
        'Russian chemist and educator who recognized that chemical properties recur periodically when elements are ordered by atomic weight and valence. Crucially, he left gaps in his 1869 table to predict the exact properties of undiscovered elements.',
      historicalDiscoveries: [
        'Published the Periodic Law and first widely predictive Periodic Table of Elements (1869).',
        'Accurately predicted the atomic weight, density, and bonding behavior of Gallium ("eka-aluminum") and Germanium ("eka-silicon").',
        'Authored Principles of Chemistry, organizing inorganic chemistry around group valence patterns.',
      ],
      simulationPersonality: {
        archetype: 'Structured Systems Architect',
        summary: 'Analytical, pattern-driven, and exacting. Evaluates every play through group valence families and long-range structural stability.',
        disclaimer: SIMULATION_DISCLAIMER,
      },
      dialogue: {
        intro: [
          'Step forward, candidate. The Mendeleev Periodic Simulation is online.',
          'Students memorize formulas; chemists recognize periodic law. Notice how every group column predicts its valence behavior before a single card hits the table.',
        ],
        briefing:
          'Expect structured high-value compounds and methodical noble-gas protection. Use periodic group relationships to stay ahead of the curve.',
        onVictory:
          'Remarkable synthesis across multiple periodic families! Even the gaps in your hand became opportunities. Your Periodic Examination is approved.',
        onDefeat:
          'Periodic law rewards foresight over improvisation. Study the valence columns and return when your synthesis plan has structure.',
        challengeComplete:
          'You demonstrated true mastery of periodic relationships! Stage Two Archive eligibility for the Mendeleev Simulation is now recorded.',
      },
      opponentConfigRef: 'opp_mendeleev',
      researchChallengeRef: 'rc_mendeleev',
      futureCardRef: 'scard_mendeleev',
      musicThemeRef: 'scientist_mendeleev',
      audioDropInFilename: 'mendeleev-theme.wav',
    },

    pauling: {
      scientistId: 'pauling',
      historicalName: 'Linus Pauling',
      displayName: 'Simulation: Linus Pauling',
      lifespan: '1901–1994',
      portraitRef: 'pauling',
      artworkRef: 'assets/portraits/pauling.svg',
      accentColor: '#f59e0b',
      specialty: 'Chemical bonding and electronegativity',
      elementalAffinities: ['F', 'O', 'N', 'C', 'H', 'Cl'],
      biography:
        'American chemist, biochemist, and two-time unshared Nobel laureate who unified quantum mechanics with structural chemistry. His quantitative electronegativity scale and resonance theory transformed how scientists predict bond polarity and displacement.',
      historicalDiscoveries: [
        'Developed the Pauling Electronegativity Scale (1932) used to predict ionic vs. covalent character and displacement reactions.',
        'Published The Nature of the Chemical Bond (1939), introducing orbital hybridization and resonance stabilization.',
        'Discovered the alpha-helix and beta-sheet secondary structures of proteins (1951).',
        'Awarded the Nobel Prize in Chemistry (1954) and the Nobel Peace Prize (1962).',
      ],
      simulationPersonality: {
        archetype: 'Tactical Bond Analyst',
        summary: 'Sharp, incisive, and opportunistic. Constantly scans the bench for electronegativity differentials and unshielded structural vulnerabilities.',
        disclaimer: SIMULATION_DISCLAIMER,
      },
      dialogue: {
        intro: [
          'Candidate, let us examine the nature of your chemical bonds. I am the Pauling Bonding Simulation.',
          'A molecule is only as secure as its weakest electronegativity margin. Leave an unshielded compound on this table and watch how quickly higher electronegativity claims it.',
        ],
        briefing:
          'Guard your highest-SP compounds with Noble Gases or Resonance, and look for Electronegativity Displacement openings of your own.',
        onVictory:
          'Well played! You anticipated bond vulnerabilities and defended your molecular geometry under pressure. Your Bonding Trial is complete.',
        onDefeat:
          'Electronegativity always collects its debt. Fortify vulnerable bonds before committing high-value atoms to an open field.',
        challengeComplete:
          'Superb tactical bonding execution! You have completed the Pauling Research Challenge and unlocked Stage Two Archive eligibility.',
      },
      opponentConfigRef: 'opp_pauling',
      researchChallengeRef: 'rc_pauling',
      futureCardRef: 'scard_pauling',
      musicThemeRef: 'scientist_pauling',
      audioDropInFilename: 'pauling-theme.wav',
    },

    curie: {
      scientistId: 'curie',
      historicalName: 'Marie Curie',
      displayName: 'Simulation: Marie Curie',
      lifespan: '1867–1934',
      portraitRef: 'curie',
      artworkRef: 'assets/portraits/curie.svg',
      accentColor: '#22c55e',
      specialty: 'Radioactivity and radioactive elements',
      elementalAffinities: ['Ra', 'Po', 'Rn', 'Ba', 'Pb'],
      biography:
        'Polish-French physicist and chemist who pioneered research on radioactivity, coined the term itself, and became the first person to win two Nobel Prizes across two distinct scientific disciplines (Physics and Chemistry).',
      historicalDiscoveries: [
        'Coined the term "radioactivity" and demonstrated it is an intrinsic atomic property rather than a chemical interaction (1898).',
        'Discovered and isolated the elements Polonium (1898) and Radium (1898) from tons of pitchblende ore.',
        'First woman to win a Nobel Prize (Physics, 1903) and first person to win two Nobel Prizes (Chemistry, 1911).',
        'Pioneered mobile radiography units ("Petites Curies") to assist field hospitals during World War I.',
      ],
      simulationPersonality: {
        archetype: 'Persistent Experimental Researcher',
        summary: 'Resolute, investigative, and unyielding under high-risk lab conditions. Methodically tests instability, reclamation, and decay counterplay using standard Academy reagents.',
        disclaimer: SIMULATION_DISCLAIMER,
      },
      dialogue: {
        intro: [
          'Nothing in the laboratory is to be feared—it is only to be understood. The Curie Research Simulation is now active.',
          'During this practicum, we examine persistence under disruption: reclamation from discard, decay resistance, and disciplined stabilization.',
        ],
        briefing:
          'Expect relentless research utility—reclaiming reagents via Distillation, testing decay resilience, and punishing unprotected boards using standard legal Academy cards.',
        onVictory:
          'Perseverance rewarded. You navigated disruption with clarity and empirical control. Your Research Practicum is officially certified.',
        onDefeat:
          'A failed trial is simply data for the next isolation. Refine your defensive preparations and step back to the bench.',
        challengeComplete:
          'Exemplary laboratory persistence! You have completed the Curie Research Challenge and earned Stage Two Archive eligibility.',
      },
      opponentConfigRef: 'opp_curie',
      researchChallengeRef: 'rc_curie',
      futureCardRef: 'scard_curie',
      musicThemeRef: 'scientist_curie',
      audioDropInFilename: 'curie-theme.wav',
    },
  };

  const REQUIRED_PROFILE_FIELDS = [
    'scientistId',
    'historicalName',
    'portraitRef',
    'artworkRef',
    'biography',
    'historicalDiscoveries',
    'specialty',
    'elementalAffinities',
    'simulationPersonality',
    'dialogue',
    'opponentConfigRef',
    'researchChallengeRef',
    'futureCardRef',
  ];

  function getScientistProfile(scientistId) {
    return SCIENTIST_PROFILES[scientistId] || null;
  }

  function listScientistProfiles() {
    return Object.values(SCIENTIST_PROFILES);
  }

  function validateScientistProfile(profile) {
    if (!profile || typeof profile !== 'object') return { valid: false, missing: REQUIRED_PROFILE_FIELDS };
    const missing = REQUIRED_PROFILE_FIELDS.filter((f) => profile[f] === undefined || profile[f] === null);
    return { valid: missing.length === 0, missing };
  }

  V.Story = V.Story || {};
  V.Story.SIMULATION_DISCLAIMER = SIMULATION_DISCLAIMER;
  V.Story.SCIENTIST_PROFILES = SCIENTIST_PROFILES;
  V.Story.getScientistProfile = getScientistProfile;
  V.Story.listScientistProfiles = listScientistProfiles;
  V.Story.validateScientistProfile = validateScientistProfile;
})(typeof window !== 'undefined' ? window : globalThis);

// VALENCY — Chapter 0: Academy Licensure (Data-Driven Story Mode Campaign)
// Supports sequential & future branching campaigns via prerequisites, nextMissionIds, and branchFlags.
// Connects Master Scientist Profiles, Opponent Configs, Research Challenges, and Licensure Evaluation
// without duplicating any core gameEngine logic.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  const CHAPTER_0_ACADEMY_LICENSURE = {
    chapterId: 'chapter_0_academy_licensure',
    chapterNumber: 0,
    title: 'Chapter 0: Academy Licensure',
    subtitle: 'Prove your mastery against four Historical Research Simulations to earn your Valency Academy License.',
    nextChapterPreview: {
      chapterId: 'chapter_1_the_frontier',
      title: 'Chapter 1: The Frontier',
      teaser:
        'Reports from outlying research stations describe spontaneous molecular instability—stable compounds unbonding without catalysts or high-EN displacement. Licensed chemists are being dispatched to investigate.',
    },
    missions: [
      {
        missionId: 'ch0_m1_registration',
        order: 1,
        type: 'narrative',
        title: 'Registration Day',
        subtitle: 'Academy Orientation & Simulation Chamber Briefing',
        prerequisites: [],
        nextMissionIds: ['ch0_m2_lavoisier'],
        scientistId: null,
        opponentConfigId: null,
        researchChallengeId: null,
        introduction:
          'Welcome to the Valency Chemical Academy. Before any researcher is cleared for field deployment, they must pass four Historical Research Simulations and a comprehensive Licensure Trial.',
        dialogue: [
          {
            speaker: 'Academy Registrar',
            portraitRef: 'proctor',
            text: 'Candidate, your lab bench has been initialized with a standard 120-card Academy reagent deck. Every simulation operates under identical legal rules—no hidden advantages, no extra cards.',
          },
          {
            speaker: 'Academy Registrar',
            portraitRef: 'proctor',
            text: 'Alongside ordinary Stability Point (SP) scoring, the Licensure Board evaluates four competencies: Synthesis, Stability Management, Defensive Control, and Tactical Execution.',
          },
          {
            speaker: 'Academy Registrar',
            portraitRef: 'proctor',
            text: 'Defeat each Historical Simulation to unlock its Stage One Research Archive entry. Complete its optional Research Challenge to earn Stage Two eligibility for future specialist systems. Report to Chamber 1: Antoine Lavoisier.',
          },
        ],
        briefing: {
          objective: 'Complete Academy registration and unlock the Lavoisier Conservation Examination.',
          licensureFocus: ['Synthesis Competency', 'Stability Management', 'Defensive Competency', 'Tactical Competency'],
        },
        unlocksBranchFlags: { academyRegistered: true },
      },

      {
        missionId: 'ch0_m2_lavoisier',
        order: 2,
        type: 'examination',
        title: 'Lavoisier – The Conservation Principle',
        subtitle: 'Chamber 1 • Foundational Quantitative Synthesis',
        prerequisites: ['ch0_m1_registration'],
        nextMissionIds: ['ch0_m3_mendeleev'],
        scientistId: 'lavoisier',
        opponentConfigId: 'opp_lavoisier',
        researchChallengeId: 'rc_lavoisier',
        introduction:
          'Chamber 1 calibrates clean stoichiometry and conservation of mass against the Antoine Lavoisier Research Simulation.',
        briefing: {
          objective: 'Defeat the Lavoisier Simulation by reaching 25 SP while maintaining clean, waste-free compound synthesis.',
          tacticalTip: 'Lavoisier favors efficient 2–3 card syntheses and protects his bench with Buffers & Distillation. Build steady real compounds and avoid letting Unstable compounds collapse.',
        },
      },

      {
        missionId: 'ch0_m3_mendeleev',
        order: 3,
        type: 'examination',
        title: 'Mendeleev – The Periodic Challenge',
        subtitle: 'Chamber 2 • Structured Periodic Organization',
        prerequisites: ['ch0_m2_lavoisier'],
        nextMissionIds: ['ch0_m4_pauling'],
        scientistId: 'mendeleev',
        opponentConfigId: 'opp_mendeleev',
        researchChallengeId: 'rc_mendeleev',
        introduction:
          'Chamber 2 evaluates your command of periodic group valence patterns against the Dmitri Mendeleev Research Simulation.',
        briefing: {
          objective: 'Defeat the Mendeleev Simulation by leveraging multi-group valence combinations and defending high-SP pillar compounds.',
          tacticalTip: 'Mendeleev builds high-SP structured compounds and shields them quickly. Keep Ionization Surge or Fluorine ready if he locks down a 16-SP pillar.',
        },
      },

      {
        missionId: 'ch0_m4_pauling',
        order: 4,
        type: 'examination',
        title: 'Pauling – The Bonding Trial',
        subtitle: 'Chamber 3 • Electronegativity & Bond Vulnerabilities',
        prerequisites: ['ch0_m3_mendeleev'],
        nextMissionIds: ['ch0_m5_curie'],
        scientistId: 'pauling',
        opponentConfigId: 'opp_pauling',
        researchChallengeId: 'rc_pauling',
        introduction:
          'Chamber 3 tests your structural defense and tactical displacement awareness against the Linus Pauling Research Simulation.',
        briefing: {
          objective: 'Defeat the Pauling Simulation while safeguarding vulnerable bonds and capitalizing on electronegativity differentials.',
          tacticalTip: 'Pauling aggressively hunts Electronegativity Takeovers and strips shields with Ionization Surge. Prioritize Light Noble Gases (He/Ne/Ar) on your top compounds!',
        },
      },

      {
        missionId: 'ch0_m5_curie',
        order: 5,
        type: 'examination',
        title: 'Curie – The Research Practicum',
        subtitle: 'Chamber 4 • Persistence, Reclamation & Decay Pressure',
        prerequisites: ['ch0_m4_pauling'],
        nextMissionIds: ['ch0_m6_final_exam'],
        scientistId: 'curie',
        opponentConfigId: 'opp_curie',
        researchChallengeId: 'rc_curie',
        introduction:
          'Chamber 4 measures laboratory persistence under continuous disruption against the Marie Curie Research Simulation (operating strictly on standard legal Academy reagents).',
        briefing: {
          objective: 'Defeat the Curie Simulation while maintaining stability through reclamation, decay pressure, and disciplined defense.',
          tacticalTip: 'Curie leverages Distillation, Half-Life Decay, and Buffer Solution persistently. Use Equilibrium Shift to rescue halved compounds and deploy Buffer Solution before big turns.',
        },
      },

      {
        missionId: 'ch0_m6_final_exam',
        order: 6,
        type: 'examination',
        title: 'Final Examination – The Licensure Trial',
        subtitle: 'Chamber 5 • Full Licensure Board & The Instability Anomaly',
        prerequisites: ['ch0_m5_curie'],
        nextMissionIds: ['ch1_m1_frontier_arrival'], // Reserved hook for Chapter 1: The Frontier
        scientistId: null,
        opponentConfigId: 'opp_academy_proctor',
        researchChallengeId: null,
        unlocksChapter1: true,
        opponentDisplayName: 'Academy Licensure Proctor',
        opponentPortraitRef: 'proctor',
        introduction:
          'All four historical simulations are complete. One final trial remains before the Academy confers your official License—yet emergency telemetry is already flashing from outside the walls.',
        dialogue: [
          {
            speaker: 'Academy Proctor',
            portraitRef: 'proctor',
            text: 'Candidate, welcome to the Licensure Trial. This adaptive simulation integrates conservation, periodic structure, electronegativity tactics, and persistence.',
          },
          {
            speaker: 'Academy Proctor',
            portraitRef: 'proctor',
            text: 'Before we begin, note an urgent anomaly flagged on the Frontier sensors: stable compounds in outlying laboratories are spontaneously shifting into unstable states without catalysts or external reagents.',
          },
          {
            speaker: 'Academy Proctor',
            portraitRef: 'proctor',
            text: 'Pass this Final Examination to earn your Provisional, Standard, or Honors Licensure—and receive clearance to investigate the Molecular Instability Mystery in Chapter 1: The Frontier.',
          },
        ],
        briefing: {
          objective: 'Defeat the Academy Licensure Proctor to earn your official Academy License and unlock Chapter 1: The Frontier.',
          tacticalTip: 'Demonstrate all four competencies—clean Synthesis, zero Unstable collapses, active Defense (Shield/Buffer), and sharp Phase 3 Tactics—for Honors Licensure!',
        },
        postVictoryDialogue: [
          {
            speaker: 'Academy Proctor',
            portraitRef: 'proctor',
            text: 'Examination concluded. Your competency scores have been ratified by the Academy Licensure Board.',
          },
          {
            speaker: 'Academy Proctor',
            portraitRef: 'proctor',
            text: 'Effective immediately, you are assigned to the Frontier Telemetry Desk. The Molecular Instability Mystery is spreading across outer laboratories—Chapter 1: The Frontier awaits.',
          },
        ],
      },
    ],
  };

  function getChapter0() {
    return CHAPTER_0_ACADEMY_LICENSURE;
  }

  function getMissionById(missionId) {
    return CHAPTER_0_ACADEMY_LICENSURE.missions.find((m) => m.missionId === missionId) || null;
  }

  function isMissionUnlocked(mission, prog) {
    if (!mission) return false;
    if (!mission.prerequisites || mission.prerequisites.length === 0) return true;
    const completed = (prog && prog.completedMissions) || {};
    return mission.prerequisites.every((reqId) => completed[reqId] && completed[reqId].completed);
  }

  V.Story = V.Story || {};
  V.Story.CHAPTER_0_ACADEMY_LICENSURE = CHAPTER_0_ACADEMY_LICENSURE;
  V.Story.getChapter0 = getChapter0;
  V.Story.getMissionById = getMissionById;
  V.Story.isMissionUnlocked = isMissionUnlocked;
})(typeof window !== 'undefined' ? window : globalThis);

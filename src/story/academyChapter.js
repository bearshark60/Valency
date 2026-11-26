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
            text: 'Our simulation chambers recreate landmark scientific methods as benchmark examiners—Lavoisier for conservation, Mendeleev for periodic structure, Pauling for electronegativity, and Curie for persistence. Each uses the exact same 120-card Academy deck and legal rules as you—no hidden advantages.',
          },
          {
            speaker: 'Academy Registrar',
            portraitRef: 'proctor',
            text: 'Alongside ordinary 25 SP victory scoring, the Licensure Board grades four competencies: Synthesis, Stability Management, Defensive Control, and Tactical Execution.',
          },
          {
            speaker: 'Academy Registrar',
            portraitRef: 'proctor',
            text: 'Defeat each simulation to unlock its Stage One Research Archive entry (biography, historical discoveries, and exam record). Complete its optional Research Challenge during the same match to record Stage Two eligibility for future specialist systems. Report to Chamber 1: Antoine Lavoisier.',
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
          licensureFocus: ['Synthesis Competency', 'Stability Management'],
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
          'Chamber 2 evaluates your command of periodic group valence patterns against the Dmitri Mendeleev Research Simulation. Rather than relying on isolated formulas, candidates must combine diverse periodic families into high-stability structures.',
        briefing: {
          objective: 'Defeat the Mendeleev Simulation by reaching 25 SP using thoughtful multi-group element selection and structured high-SP synthesis.',
          tacticalTip: 'Mendeleev builds high-SP structured pillars (CO₂, CH₄, AlCl₃, MgCl₂) and shields them quickly. Combine multiple periodic groups (1A, 2A, 4A, 6A, 7A) and keep Ionization Surge or Fluorine ready.',
          licensureFocus: ['Synthesis Competency', 'Stability Management', 'Defensive Competency'],
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
          'Chamber 3 tests chemical bonding awareness, electronegativity differentials, and tactical disruption against the Linus Pauling Research Simulation. Every unshielded bond on your bench is an opportunity for displacement.',
        briefing: {
          objective: 'Defeat the Pauling Simulation by reaching 25 SP while protecting high-value bonds and seizing Electronegativity Takeover or Phase 3 tactical openings.',
          tacticalTip: 'Pauling hunts Electronegativity Takeovers first and strips shields with Ionization Surge. Prioritize Light Noble Gases (He/Ne/Ar—Fluorine-proof!) on your top compounds and watch for your own high-EN takeovers.',
          licensureFocus: ['Tactical Competency', 'Defensive Competency'],
        },
      },

      {
        missionId: 'ch0_m5_curie',
        order: 5,
        type: 'examination',
        title: 'Curie – The Research Practicum',
        subtitle: 'Chamber 4 • Scientific Investigation, Persistence & Reclamation',
        prerequisites: ['ch0_m4_pauling'],
        nextMissionIds: ['ch0_m6_final_exam'],
        scientistId: 'curie',
        opponentConfigId: 'opp_curie',
        researchChallengeId: 'rc_curie',
        introduction:
          'Chamber 4 honors Marie Curie’s pioneering research in radioactivity and element isolation through an investigation-focused practicum. Operating strictly on standard legal Academy cards (no invented radioactive mechanics), the simulation tests empirical persistence, discard reclamation, and composure under disruption.',
        briefing: {
          objective: 'Defeat the Curie Simulation by reaching 25 SP while maintaining zero unstable collapses and executing disciplined Phase 3 tactical and defensive responses.',
          tacticalTip: 'Curie relentlessly leverages Distillation, Half-Life Decay, Buffer Solution, and experimental unstable staging—all using standard legal cards. Use Equilibrium Shift to rescue halved compounds and time Buffer Solution ahead of key turns.',
          licensureFocus: ['Stability Management', 'Defensive Competency', 'Tactical Competency'],
        },
      },

      {
        missionId: 'ch0_m6_final_exam',
        order: 6,
        type: 'examination',
        title: 'Final Examination – The Licensure Trial',
        subtitle: 'Chamber 5 • Comprehensive Competency Board & The Frontier Anomaly',
        prerequisites: ['ch0_m5_curie'],
        nextMissionIds: ['ch1_m1_frontier_arrival'], // Reserved hook for Chapter 1: The Frontier
        scientistId: null,
        opponentConfigId: 'opp_academy_proctor',
        researchChallengeId: null,
        unlocksChapter1: true,
        opponentDisplayName: 'Academy Licensure Proctor',
        opponentPortraitRef: 'proctor',
        introduction:
          'All four historical simulations are complete. The Final Examination integrates conservation, periodic structure, electronegativity tactics, and empirical persistence into one comprehensive trial—just as urgent telemetry arrives from outlying research stations.',
        dialogue: [
          {
            speaker: 'Academy Proctor',
            portraitRef: 'proctor',
            text: 'Candidate, welcome to the Licensure Trial. This comprehensive simulation draws upon every discipline tested in Chambers 1 through 4, operating on the same legal 120-card Academy deck.',
          },
          {
            speaker: 'Academy Proctor',
            portraitRef: 'proctor',
            text: 'Before we begin, the Board has declassified an urgent alert from Frontier monitoring stations: previously stable compounds are spontaneously destabilizing without catalysts, acid attack, or electronegativity displacement.',
          },
          {
            speaker: 'Academy Proctor',
            portraitRef: 'proctor',
            text: 'Win this examination to certify your Academy License—Provisional, Standard, or Honors based on your cumulative competency record—and earn clearance for Chapter 1: The Frontier. A perfect score is not required to graduate.',
          },
        ],
        briefing: {
          objective: 'Defeat the Academy Licensure Proctor (25 SP) to certify your cumulative Academy License (Provisional, Standard, or Honors) and unlock Chapter 1: The Frontier.',
          tacticalTip: 'Any victory certifies your Academy License! Combine steady synthesis, zero unstable collapses, active shielding/buffers, and Phase 3 tactics to maximize your cumulative Honors standing.',
          licensureFocus: ['Synthesis Competency', 'Stability Management', 'Defensive Competency', 'Tactical Competency'],
        },
        postVictoryDialogue: [
          {
            speaker: 'Academy Proctor',
            portraitRef: 'proctor',
            text: 'Examination concluded. The Academy Licensure Board has reviewed both today’s trial and your cumulative record across Lavoisier, Mendeleev, Pauling, and Curie.',
          },
          {
            speaker: 'Academy Proctor',
            portraitRef: 'proctor',
            text: 'Effective immediately, you are cleared for Frontier field deployment. New sensor logs confirm the unexplained Molecular Instability Anomaly is accelerating across outer laboratories—Chapter 1: The Frontier awaits.',
          },
        ],
        postDefeatDialogue: [
          {
            speaker: 'Academy Proctor',
            portraitRef: 'proctor',
            text: 'The Licensure Board requires a match victory to ratify your Academy License, though your prior Chamber certifications remain permanently preserved.',
          },
          {
            speaker: 'Academy Proctor',
            portraitRef: 'proctor',
            text: 'Review your four competency scores below, adjust your balance between Synthesis and Phase 3 Defense, and return to the Licensure Trial when ready.',
          },
        ],
        frontierAnomalyBriefing: {
          title: 'Declassified Dispatch — The Molecular Instability Anomaly',
          summary:
            'Outlying Frontier laboratories report fully bonded, octet-complete molecules spontaneously reverting into unstable states without catalysts or external electronegativity displacement. As a newly licensed Academy chemist, your next assignment in Chapter 1: The Frontier will investigate the cause.',
        },
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

// VALENCY — Historical Scientist Research Challenge Architecture
// Evaluates Stage Two research challenges using only legal existing game mechanics
// and examination telemetry. Never awards nonexistent collectible cards; instead records
// persistent Stage Two eligibility for future Scientist Card activation.

(function (global) {
  'use strict';
  const V = (global.Valency = global.Valency || {});

  function safeArray(val) {
    return Array.isArray(val) ? val : [];
  }

  function safeNum(val) {
    return typeof val === 'number' && !isNaN(val) ? val : 0;
  }

  const RESEARCH_CHALLENGES = {
    rc_lavoisier: {
      challengeId: 'rc_lavoisier',
      scientistId: 'lavoisier',
      title: 'The Mass-Balance Ledger',
      description:
        'Defeat the Lavoisier Simulation with zero collapsed unstable compounds while synthesizing at least 2 distinct real compounds (including at least one Oxygen- or Hydrogen-bearing molecule).',
      stageTwoRewardSummary:
        'Stage Two Scientist Acquisition Eligibility & Future Scientist Card Eligibility (Antoine Lavoisier — reserved for future expansion).',
      evaluate(evalResult) {
        if (!evalResult || !evalResult.won) {
          return { completed: false, reason: 'Defeat the Lavoisier Simulation first.', criteria: [] };
        }
        const snap = evalResult.snapshot || {};
        const distinctFormulas = safeArray(snap.distinctFormulas);
        const elementsUsed = safeArray(snap.elementsUsed);
        const zeroCollapses = safeNum(snap.unstableCollapsed) === 0;
        const enoughFormulas = distinctFormulas.length >= 2;
        const hasOH = elementsUsed.includes('O') || elementsUsed.includes('H');
        const completed = zeroCollapses && enoughFormulas && hasOH;
        return {
          completed,
          criteria: [
            { label: 'Defeat Lavoisier Simulation', met: evalResult.won },
            { label: '0 collapsed unstable compounds', met: zeroCollapses },
            { label: 'Synthesize 2+ distinct real compounds', met: enoughFormulas },
            { label: 'Include Oxygen (O) or Hydrogen (H) in a synthesis', met: hasOH },
          ],
        };
      },
    },

    rc_mendeleev: {
      challengeId: 'rc_mendeleev',
      scientistId: 'mendeleev',
      title: 'Periodic Law Synthesis',
      description:
        'Defeat the Mendeleev Simulation while synthesizing compounds spanning at least 3 distinct periodic groups (e.g., 1A, 4A, 6A, 7A) and forming at least one compound worth 12+ SP.',
      stageTwoRewardSummary:
        'Stage Two Scientist Acquisition Eligibility & Future Scientist Card Eligibility (Dmitri Mendeleev — reserved for future expansion).',
      evaluate(evalResult) {
        if (!evalResult || !evalResult.won) {
          return { completed: false, reason: 'Defeat the Mendeleev Simulation first.', criteria: [] };
        }
        const snap = evalResult.snapshot || {};
        const groups = safeArray(snap.periodicGroupsUsed);
        const threeGroups = groups.length >= 3;
        const highSP = safeNum(snap.maxSingleCompoundSP) >= 12;
        const completed = threeGroups && highSP;
        return {
          completed,
          criteria: [
            { label: 'Defeat Mendeleev Simulation', met: evalResult.won },
            { label: 'Use elements from 3+ distinct periodic groups', met: threeGroups },
            { label: 'Synthesize a compound worth 12+ SP', met: highSP },
          ],
        };
      },
    },

    rc_pauling: {
      challengeId: 'rc_pauling',
      scientistId: 'pauling',
      title: 'Bond Polarity & Displacement Trial',
      description:
        'Defeat the Pauling Simulation while executing at least 1 Electronegativity Takeover OR defending your field with at least 1 Noble Gas Shield / Resonance Stabilizer and playing at least 1 tactical Event card.',
      stageTwoRewardSummary:
        'Stage Two Scientist Acquisition Eligibility & Future Scientist Card Eligibility (Linus Pauling — reserved for future expansion).',
      evaluate(evalResult) {
        if (!evalResult || !evalResult.won) {
          return { completed: false, reason: 'Defeat the Pauling Simulation first.', criteria: [] };
        }
        const snap = evalResult.snapshot || {};
        const didTakeover = safeNum(snap.enTakeovers) >= 1;
        const didDefenseAndEvent =
          (safeNum(snap.shieldsDeployed) + safeNum(snap.resonanceUsed) >= 1) &&
          (safeNum(snap.redEventsPlayed) + safeNum(snap.yellowEventsPlayed) >= 1);
        const completed = didTakeover || didDefenseAndEvent;
        return {
          completed,
          criteria: [
            { label: 'Defeat Pauling Simulation', met: evalResult.won },
            { label: 'Execute 1+ EN Takeover OR combine Shield/Resonance + 1 Event card', met: completed },
          ],
        };
      },
    },

    rc_curie: {
      challengeId: 'rc_curie',
      scientistId: 'curie',
      title: 'Empirical Persistence Practicum',
      description:
        'Defeat the Curie Simulation with zero collapsed unstable compounds while completing at least 2 Phase-3 tactical/defensive actions (Event cards, Noble Gas shields, or stabilizing an Unstable compound).',
      stageTwoRewardSummary:
        'Stage Two Scientist Acquisition Eligibility & Future Scientist Card Eligibility (Marie Curie — reserved for future expansion).',
      evaluate(evalResult) {
        if (!evalResult || !evalResult.won) {
          return { completed: false, reason: 'Defeat the Curie Simulation first.', criteria: [] };
        }
        const snap = evalResult.snapshot || {};
        const zeroCollapses = safeNum(snap.unstableCollapsed) === 0;
        const tacticalCount =
          safeNum(snap.shieldsDeployed) +
          safeNum(snap.buffersUsed) +
          safeNum(snap.resonanceUsed) +
          safeNum(snap.redEventsPlayed) +
          safeNum(snap.yellowEventsPlayed) +
          safeNum(snap.enTakeovers) +
          safeNum(snap.unstableStabilized);
        const enoughActions = tacticalCount >= 2;
        const completed = zeroCollapses && enoughActions;
        return {
          completed,
          criteria: [
            { label: 'Defeat Curie Simulation', met: evalResult.won },
            { label: '0 collapsed unstable compounds', met: zeroCollapses },
            { label: 'Execute 2+ tactical, defensive, or stabilization actions', met: enoughActions },
          ],
        };
      },
    },
  };

  function getResearchChallenge(challengeId) {
    return RESEARCH_CHALLENGES[challengeId] || null;
  }

  function listResearchChallenges() {
    return Object.values(RESEARCH_CHALLENGES);
  }

  V.Story = V.Story || {};
  V.Story.RESEARCH_CHALLENGES = RESEARCH_CHALLENGES;
  V.Story.getResearchChallenge = getResearchChallenge;
  V.Story.listResearchChallenges = listResearchChallenges;
})(typeof window !== 'undefined' ? window : globalThis);
